import "server-only";

import { randomUUID } from "node:crypto";
import { getPostgresClient } from "../postgres";

export type FriendSnapshotInput = {
  name: string;
  birthDate: string;
  birthHour?: string;
  birthMinute?: string;
  birthTimeUnknown?: boolean;
  calendarType?: "solar" | "lunar";
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
};

export type CreateFriendConnectionInput = {
  ownerUserId: string;
  inviteCode: string;
  friendProfile: FriendSnapshotInput;
};

export type LinkFriendConnectionUserInput = {
  connectionId: string;
  friendUserId: string;
};

export type DeleteFriendConnectionInput = {
  connectionId: string;
  requesterUserId: string;
};

export type FriendConnectionMutationRecord = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  profileDedupeKey: string;
  createdAt: string;
  linkedAt: string | null;
  updatedAt: string | null;
};

export type LinkFriendConnectionUserResult = {
  connection: FriendConnectionMutationRecord;
  alreadyLinked: boolean;
};

export type DeleteFriendConnectionResult = {
  deletedConnectionId: string;
};

export type FriendWriteRepositoryErrorCode =
  | "FRIEND_LIMIT_REACHED"
  | "ALREADY_REGISTERED"
  | "INVITE_NOT_FOUND"
  | "INVITE_INACTIVE"
  | "INVALID_INVITE_OWNER"
  | "CONNECTION_NOT_FOUND"
  | "ALREADY_LINKED"
  | "SELF_CONNECTION"
  | "FORBIDDEN"
  | "USER_NOT_FOUND"
  | "INVALID_PROFILE"
  | "CONNECTION_ID_CONFLICT"
  | "FRIEND_MUTATION_REQUIRES_READ_COMMITTED"
  | "FRIEND_MUTATION_RESULT_MISSING";

export class FriendWriteRepositoryError extends Error {
  readonly code: FriendWriteRepositoryErrorCode;

  constructor(code: FriendWriteRepositoryErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "FriendWriteRepositoryError";
    this.code = code;
  }
}

type FriendConnectionMutationRow = {
  connection_id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  invite_code: string;
  profile_dedupe_key: string;
  created_at: string | Date;
  linked_at: string | Date | null;
  updated_at: string | Date | null;
};

type ExistingConnectionRow = {
  friend_user_id: string | null;
};

type DeletedConnectionRow = {
  deleted_connection_id: string;
};

type PostgresErrorLike = Error & {
  code?: string;
};

const FRIEND_MUTATION_DATABASE_ERROR_CODES = new Set<FriendWriteRepositoryErrorCode>([
  "FRIEND_LIMIT_REACHED",
  "ALREADY_REGISTERED",
  "INVITE_NOT_FOUND",
  "INVITE_INACTIVE",
  "INVALID_INVITE_OWNER",
  "CONNECTION_NOT_FOUND",
  "ALREADY_LINKED",
  "SELF_CONNECTION",
  "FORBIDDEN",
  "USER_NOT_FOUND",
  "INVALID_PROFILE",
  "CONNECTION_ID_CONFLICT",
  "FRIEND_MUTATION_REQUIRES_READ_COMMITTED",
]);

function getFriendMutationDatabaseErrorCode(
  error: unknown
): FriendWriteRepositoryErrorCode | null {
  if (!(error instanceof Error)) return null;
  const databaseError = error as PostgresErrorLike;
  if (databaseError.code !== "P0001") return null;
  if (
    !FRIEND_MUTATION_DATABASE_ERROR_CODES.has(
      error.message as FriendWriteRepositoryErrorCode
    )
  ) {
    return null;
  }
  return error.message as FriendWriteRepositoryErrorCode;
}

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIsoTimestamp(value: string | Date | null) {
  return value === null ? null : toIsoTimestamp(value);
}

function mapConnection(row: FriendConnectionMutationRow): FriendConnectionMutationRecord {
  return {
    id: row.connection_id,
    ownerUserId: row.owner_user_id,
    friendUserId: row.friend_user_id,
    inviteCode: row.invite_code,
    profileDedupeKey: row.profile_dedupe_key,
    createdAt: toIsoTimestamp(row.created_at),
    linkedAt: toNullableIsoTimestamp(row.linked_at),
    updatedAt: toNullableIsoTimestamp(row.updated_at),
  };
}

function mapExpectedDatabaseError(error: unknown): never {
  if (error instanceof FriendWriteRepositoryError) throw error;
  const code = getFriendMutationDatabaseErrorCode(error);
  if (code) throw new FriendWriteRepositoryError(code, { cause: error });
  throw error;
}

/**
 * Creates the connection and snapshot through PostgreSQL's atomic mutation
 * function. A future API adapter maps INVITE_NOT_FOUND/INVITE_INACTIVE to the
 * current public INVALID_INVITE response without changing this DB-level code.
 */
export async function createFriendConnection(
  input: CreateFriendConnectionInput
): Promise<FriendConnectionMutationRecord> {
  const sql = getPostgresClient();
  const connectionId = randomUUID();
  const profile = input.friendProfile;

  try {
    const rows = await sql<FriendConnectionMutationRow[]>`
      SELECT
        connection_id::text AS connection_id,
        owner_user_id::text AS owner_user_id,
        friend_user_id::text AS friend_user_id,
        invite_code,
        profile_dedupe_key,
        created_at,
        linked_at,
        updated_at
      FROM public.create_friend_connection(
        ${connectionId}::uuid,
        ${input.ownerUserId}::uuid,
        ${input.inviteCode}::text,
        ${profile.name}::text,
        ${profile.birthDate}::text,
        ${profile.gender}::text,
        ${profile.dayPillar}::text,
        ${profile.characterName}::text,
        ${profile.image}::text,
        ${profile.birthHour ?? null}::text,
        ${profile.birthMinute ?? null}::text,
        ${profile.birthTimeUnknown ?? null}::boolean,
        ${profile.calendarType ?? null}::text,
        NULL::timestamptz
      )
    `;

    if (!rows[0]) throw new FriendWriteRepositoryError("FRIEND_MUTATION_RESULT_MISSING");
    return mapConnection(rows[0]);
  } catch (error) {
    return mapExpectedDatabaseError(error);
  }
}

/**
 * Uses a read-only pre-lock solely to distinguish an idempotent re-link from a
 * newly linked connection. The installed PostgreSQL function performs the only
 * mutation. A future API adapter maps ALREADY_LINKED to ALREADY_CONNECTED.
 */
export async function linkFriendConnectionUser(
  input: LinkFriendConnectionUserInput
): Promise<LinkFriendConnectionUserResult> {
  const sql = getPostgresClient();

  try {
    return await sql.begin(async (transaction) => {
      const existingConnections = await transaction<ExistingConnectionRow[]>`
        SELECT friend_user_id::text AS friend_user_id
        FROM public.friend_connections
        WHERE id = ${input.connectionId}::uuid
        FOR UPDATE
      `;

      const rows = await transaction<FriendConnectionMutationRow[]>`
        SELECT
          connection_id::text AS connection_id,
          owner_user_id::text AS owner_user_id,
          friend_user_id::text AS friend_user_id,
          invite_code,
          profile_dedupe_key,
          created_at,
          linked_at,
          updated_at
        FROM public.link_friend_connection_user(
          ${input.connectionId}::uuid,
          ${input.friendUserId}::uuid,
          NULL::timestamptz
        )
      `;

      if (!rows[0]) {
        throw new FriendWriteRepositoryError("FRIEND_MUTATION_RESULT_MISSING");
      }

      return {
        connection: mapConnection(rows[0]),
        alreadyLinked: existingConnections[0]?.friend_user_id === input.friendUserId,
      };
    });
  } catch (error) {
    return mapExpectedDatabaseError(error);
  }
}

export async function deleteFriendConnection(
  input: DeleteFriendConnectionInput
): Promise<DeleteFriendConnectionResult> {
  const sql = getPostgresClient();

  try {
    const rows = await sql<DeletedConnectionRow[]>`
      SELECT deleted_connection_id::text AS deleted_connection_id
      FROM public.delete_friend_connection(
        ${input.connectionId}::uuid,
        ${input.requesterUserId}::uuid
      )
    `;

    if (!rows[0]) throw new FriendWriteRepositoryError("FRIEND_MUTATION_RESULT_MISSING");
    return { deletedConnectionId: rows[0].deleted_connection_id };
  } catch (error) {
    return mapExpectedDatabaseError(error);
  }
}
