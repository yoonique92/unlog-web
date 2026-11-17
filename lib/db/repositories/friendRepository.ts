import "server-only";

import { getPostgresClient } from "../postgres";

export type FriendInviteRecord = {
  code: string;
  ownerUserId: string;
  isActive: boolean;
  createdAt: string;
};

export type FriendSnapshotRecord = {
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  birthTimeUnknown: boolean;
  calendarType: string;
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
};

export type FriendConnectionRecord = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  profileDedupeKey: string;
  createdAt: string;
  linkedAt: string | null;
  updatedAt: string | null;
  friendProfile: FriendSnapshotRecord;
};

type FriendInviteRow = {
  code: string;
  owner_user_id: string;
  is_active: boolean;
  created_at: string | Date;
};

type FriendConnectionWithProfileRow = {
  id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  invite_code: string;
  profile_dedupe_key: string;
  created_at: string | Date;
  linked_at: string | Date | null;
  updated_at: string | Date | null;
  profile_connection_id: string | null;
  name: string | null;
  birth_date: string | null;
  birth_hour: string | null;
  birth_minute: string | null;
  birth_time_unknown: boolean | null;
  calendar_type: string | null;
  gender: string | null;
  day_pillar: string | null;
  character_name: string | null;
  image: string | null;
};

export class FriendConnectionProfileMissingError extends Error {
  readonly code = "FRIEND_CONNECTION_PROFILE_MISSING";
  readonly connectionId: string;

  constructor(connectionId: string) {
    super(`Friend snapshot is missing for connection ${connectionId}.`);
    this.name = "FriendConnectionProfileMissingError";
    this.connectionId = connectionId;
  }
}

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIsoTimestamp(value: string | Date | null) {
  return value === null ? null : toIsoTimestamp(value);
}

function mapInvite(row: FriendInviteRow): FriendInviteRecord {
  return {
    code: row.code,
    ownerUserId: row.owner_user_id,
    isActive: row.is_active,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

function mapConnection(
  row: FriendConnectionWithProfileRow
): FriendConnectionRecord {
  if (
    row.profile_connection_id === null ||
    row.name === null ||
    row.birth_date === null ||
    row.birth_hour === null ||
    row.birth_minute === null ||
    row.birth_time_unknown === null ||
    row.calendar_type === null ||
    row.gender === null ||
    row.day_pillar === null ||
    row.character_name === null ||
    row.image === null
  ) {
    throw new FriendConnectionProfileMissingError(row.id);
  }

  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    friendUserId: row.friend_user_id,
    inviteCode: row.invite_code,
    profileDedupeKey: row.profile_dedupe_key,
    createdAt: toIsoTimestamp(row.created_at),
    linkedAt: toNullableIsoTimestamp(row.linked_at),
    updatedAt: toNullableIsoTimestamp(row.updated_at),
    friendProfile: {
      name: row.name,
      birthDate: row.birth_date,
      birthHour: row.birth_hour,
      birthMinute: row.birth_minute,
      birthTimeUnknown: row.birth_time_unknown,
      calendarType: row.calendar_type,
      gender: row.gender,
      dayPillar: row.day_pillar,
      characterName: row.character_name,
      image: row.image,
    },
  };
}

const CONNECTION_WITH_PROFILE_COLUMNS = `
  fc.id::text AS id,
  fc.owner_user_id::text AS owner_user_id,
  fc.friend_user_id::text AS friend_user_id,
  fc.invite_code,
  fc.profile_dedupe_key,
  fc.created_at,
  fc.linked_at,
  fc.updated_at,
  fcp.connection_id::text AS profile_connection_id,
  fcp.name,
  fcp.birth_date,
  fcp.birth_hour,
  fcp.birth_minute,
  fcp.birth_time_unknown,
  fcp.calendar_type,
  fcp.gender,
  fcp.day_pillar,
  fcp.character_name,
  fcp.image
`;

export async function findFriendConnectionsByUserId(userId: string) {
  const sql = getPostgresClient();
  const rows = await sql.unsafe<FriendConnectionWithProfileRow[]>(
    `
      SELECT ${CONNECTION_WITH_PROFILE_COLUMNS}
      FROM public.friend_connections fc
      LEFT JOIN public.friend_connection_profiles fcp
        ON fcp.connection_id = fc.id
      WHERE fc.owner_user_id = $1
         OR fc.friend_user_id = $1
      ORDER BY fc.created_at, fc.id
    `,
    [userId]
  );

  return rows.map(mapConnection);
}

export async function findFriendConnectionWithProfileById(
  connectionId: string
) {
  const sql = getPostgresClient();
  const rows = await sql.unsafe<FriendConnectionWithProfileRow[]>(
    `
      SELECT ${CONNECTION_WITH_PROFILE_COLUMNS}
      FROM public.friend_connections fc
      LEFT JOIN public.friend_connection_profiles fcp
        ON fcp.connection_id = fc.id
      WHERE fc.id = $1
      LIMIT 1
    `,
    [connectionId]
  );

  return rows[0] ? mapConnection(rows[0]) : null;
}

export async function findFriendConnectionByOwnerAndDedupeKey(
  ownerUserId: string,
  profileDedupeKey: string
) {
  const sql = getPostgresClient();
  const rows = await sql.unsafe<FriendConnectionWithProfileRow[]>(
    `
      SELECT ${CONNECTION_WITH_PROFILE_COLUMNS}
      FROM public.friend_connections fc
      LEFT JOIN public.friend_connection_profiles fcp
        ON fcp.connection_id = fc.id
      WHERE fc.owner_user_id = $1
        AND fc.profile_dedupe_key = $2
      LIMIT 1
    `,
    [ownerUserId, profileDedupeKey]
  );

  return rows[0] ? mapConnection(rows[0]) : null;
}

export async function findInviteByCode(code: string) {
  const sql = getPostgresClient();
  const rows = await sql<FriendInviteRow[]>`
    SELECT code, owner_user_id::text AS owner_user_id, is_active, created_at
    FROM public.friend_invites
    WHERE code = ${code}
    LIMIT 1
  `;

  return rows[0] ? mapInvite(rows[0]) : null;
}

export async function findActiveInviteByOwnerUserId(ownerUserId: string) {
  const sql = getPostgresClient();
  const rows = await sql<FriendInviteRow[]>`
    SELECT code, owner_user_id::text AS owner_user_id, is_active, created_at
    FROM public.friend_invites
    WHERE owner_user_id = ${ownerUserId}
      AND is_active = true
    LIMIT 1
  `;

  return rows[0] ? mapInvite(rows[0]) : null;
}

export async function countStoredFriendsForUser(userId: string) {
  const sql = getPostgresClient();
  const rows = await sql<{ friend_count: number }[]>`
    SELECT count(*)::integer AS friend_count
    FROM public.friend_connections
    WHERE owner_user_id = ${userId}
       OR friend_user_id = ${userId}
  `;

  return rows[0]?.friend_count ?? 0;
}
