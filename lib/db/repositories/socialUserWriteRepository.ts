import "server-only";

import { randomUUID } from "node:crypto";
import { getPostgresClient } from "../postgres";
import type { AuthProvider } from "./userRepository";

export type FindOrCreateSocialUserInput = {
  provider: AuthProvider;
  providerUserId: string;
};

export type SocialUserWriteResult = {
  id: string;
  displayName: string;
  provider: AuthProvider;
  providerUserId: string;
  createdAt: string;
  created: boolean;
};

export type SocialUserWriteRepositoryErrorCode =
  | "INVALID_PROVIDER"
  | "INVALID_PROVIDER_USER_ID"
  | "INVALID_USER_ID"
  | "USER_ID_CONFLICT"
  | "SOCIAL_IDENTITY_CONFLICT"
  | "SOCIAL_USER_REQUIRES_READ_COMMITTED"
  | "SOCIAL_USER_RESULT_MISSING";

export class SocialUserWriteRepositoryError extends Error {
  readonly code: SocialUserWriteRepositoryErrorCode;

  constructor(code: SocialUserWriteRepositoryErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "SocialUserWriteRepositoryError";
    this.code = code;
  }
}

type SocialUserRow = {
  user_id: string;
  display_name: string;
  provider: AuthProvider;
  provider_user_id: string;
  created_at: string | Date;
  created: boolean;
};

type PostgresErrorLike = Error & {
  code?: string;
};

const SOCIAL_USER_DATABASE_ERROR_CODES = new Set<SocialUserWriteRepositoryErrorCode>([
  "INVALID_PROVIDER",
  "INVALID_PROVIDER_USER_ID",
  "INVALID_USER_ID",
  "USER_ID_CONFLICT",
  "SOCIAL_IDENTITY_CONFLICT",
  "SOCIAL_USER_REQUIRES_READ_COMMITTED",
]);

function getSocialUserDatabaseErrorCode(
  error: unknown
): SocialUserWriteRepositoryErrorCode | null {
  if (!(error instanceof Error)) return null;
  const databaseError = error as PostgresErrorLike;
  if (databaseError.code !== "P0001") return null;
  if (!SOCIAL_USER_DATABASE_ERROR_CODES.has(error.message as SocialUserWriteRepositoryErrorCode)) {
    return null;
  }
  return error.message as SocialUserWriteRepositoryErrorCode;
}

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapSocialUser(row: SocialUserRow): SocialUserWriteResult {
  return {
    id: row.user_id,
    displayName: row.display_name,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    createdAt: toIsoTimestamp(row.created_at),
    created: row.created,
  };
}

/**
 * Resolves or creates a social user through the database's atomic function.
 * Provider-supplied names are intentionally not accepted by this boundary.
 */
export async function findOrCreateSocialUser(
  input: FindOrCreateSocialUserInput
): Promise<SocialUserWriteResult> {
  const sql = getPostgresClient();
  const candidateUserId = randomUUID();

  try {
    const rows = await sql<SocialUserRow[]>`
      SELECT
        user_id::text AS user_id,
        display_name,
        provider,
        provider_user_id,
        created_at,
        created
      FROM public.find_or_create_social_user(
        ${input.provider}::text,
        ${input.providerUserId}::text,
        ${candidateUserId}::uuid
      )
    `;

    if (!rows[0]) {
      throw new SocialUserWriteRepositoryError("SOCIAL_USER_RESULT_MISSING");
    }

    return mapSocialUser(rows[0]);
  } catch (error) {
    if (error instanceof SocialUserWriteRepositoryError) throw error;
    const code = getSocialUserDatabaseErrorCode(error);
    if (code) {
      throw new SocialUserWriteRepositoryError(code, { cause: error });
    }
    throw error;
  }
}
