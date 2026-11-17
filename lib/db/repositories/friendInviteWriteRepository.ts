import "server-only";

import { randomBytes } from "node:crypto";
import { getPostgresClient } from "../postgres";

const MAX_INVITE_CODE_ATTEMPTS = 5;

export type ActiveFriendInvite = {
  code: string;
  ownerUserId: string;
  createdAt: string;
  isActive: boolean;
  created: boolean;
};

export type FriendInviteWriteRepositoryErrorCode =
  | "USER_NOT_FOUND"
  | "INVITE_CODE_GENERATION_FAILED";

export class FriendInviteWriteRepositoryError extends Error {
  readonly code: FriendInviteWriteRepositoryErrorCode;

  constructor(code: FriendInviteWriteRepositoryErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "FriendInviteWriteRepositoryError";
    this.code = code;
  }
}

type UserLockRow = {
  id: string;
};

type FriendInviteRow = {
  code: string;
  owner_user_id: string;
  created_at: string | Date;
  is_active: boolean;
};

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapInvite(row: FriendInviteRow, created: boolean): ActiveFriendInvite {
  return {
    code: row.code,
    ownerUserId: row.owner_user_id,
    createdAt: toIsoTimestamp(row.created_at),
    isActive: row.is_active,
    created,
  };
}

function createInviteCode() {
  return randomBytes(4).toString("hex");
}

/**
 * Returns the owner's active invite or creates one atomically.
 * Locking the owner row serializes cooperating requests for the same owner;
 * the partial unique index remains the database-level final safeguard.
 */
export async function getOrCreateActiveInvite(
  ownerUserId: string
): Promise<ActiveFriendInvite> {
  const sql = getPostgresClient();

  return sql.begin(async (transaction) => {
    const owners = await transaction<UserLockRow[]>`
      SELECT id::text AS id
      FROM public.users
      WHERE id = ${ownerUserId}::uuid
      FOR UPDATE
    `;

    if (!owners[0]) {
      throw new FriendInviteWriteRepositoryError("USER_NOT_FOUND");
    }

    const existingInvites = await transaction<FriendInviteRow[]>`
      SELECT code, owner_user_id::text AS owner_user_id, created_at, is_active
      FROM public.friend_invites
      WHERE owner_user_id = ${ownerUserId}::uuid
        AND is_active = true
      LIMIT 1
    `;

    if (existingInvites[0]) {
      return mapInvite(existingInvites[0], false);
    }

    for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
      const code = createInviteCode();
      const insertedInvites = await transaction<FriendInviteRow[]>`
        INSERT INTO public.friend_invites (
          code,
          owner_user_id,
          is_active,
          created_at
        ) VALUES (
          ${code},
          ${ownerUserId}::uuid,
          true,
          pg_catalog.clock_timestamp()
        )
        ON CONFLICT DO NOTHING
        RETURNING code, owner_user_id::text AS owner_user_id, created_at, is_active
      `;

      if (insertedInvites[0]) {
        return mapInvite(insertedInvites[0], true);
      }

      // A non-cooperating writer may have won the partial-unique race while
      // this transaction was waiting. Return that row instead of generating
      // another active invite for the same owner.
      const concurrentlyCreatedInvites = await transaction<FriendInviteRow[]>`
        SELECT code, owner_user_id::text AS owner_user_id, created_at, is_active
        FROM public.friend_invites
        WHERE owner_user_id = ${ownerUserId}::uuid
          AND is_active = true
        LIMIT 1
      `;

      if (concurrentlyCreatedInvites[0]) {
        return mapInvite(concurrentlyCreatedInvites[0], false);
      }
    }

    throw new FriendInviteWriteRepositoryError("INVITE_CODE_GENERATION_FAILED");
  });
}
