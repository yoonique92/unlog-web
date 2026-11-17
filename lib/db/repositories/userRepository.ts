import "server-only";

import { getPostgresClient } from "../postgres";

export type AuthProvider = "kakao" | "naver" | "google";
export type CalendarType = "solar" | "lunar";
export type Gender = "male" | "female";

export type UserRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
};

export type UserSummaryRecord = {
  id: string;
  displayName: string;
};

export type AuthIdentityRecord = {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  createdAt: string;
};

export type SajuProfileRecord = {
  userId: string;
  name: string | null;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
  updatedAt: string | null;
};

export type UserWithAuthIdentity = UserRecord & {
  authIdentity: AuthIdentityRecord;
};

export type UserWithAuthAndSaju = UserRecord & {
  authIdentities: AuthIdentityRecord[];
  sajuProfile: SajuProfileRecord | null;
};

type UserRow = {
  id: string;
  display_name: string;
  created_at: string | Date;
  updated_at: string | Date | null;
};

type AuthIdentityRow = {
  id: string;
  user_id: string;
  provider: AuthProvider;
  provider_user_id: string;
  created_at: string | Date;
};

type SajuProfileRow = {
  user_id: string;
  profile_name: string | null;
  birth_date: string | Date;
  birth_hour: number;
  birth_minute: number;
  birth_time_unknown: boolean;
  calendar_type: CalendarType;
  gender: Gender;
  updated_at: string | Date | null;
};

type UserIdentityJoinRow = {
  user_id: string;
  display_name: string;
  user_created_at: string | Date;
  user_updated_at: string | Date | null;
  identity_id: string;
  identity_user_id: string;
  provider: AuthProvider;
  provider_user_id: string;
  identity_created_at: string | Date;
};

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIsoTimestamp(value: string | Date | null) {
  return value === null ? null : toIsoTimestamp(value);
}

function toDateString(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.display_name,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toNullableIsoTimestamp(row.updated_at),
  };
}

function mapAuthIdentity(row: AuthIdentityRow): AuthIdentityRecord {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

function mapSajuProfile(row: SajuProfileRow): SajuProfileRecord {
  return {
    userId: row.user_id,
    name: row.profile_name,
    birthDate: toDateString(row.birth_date),
    birthHour: row.birth_hour,
    birthMinute: row.birth_minute,
    birthTimeUnknown: row.birth_time_unknown,
    calendarType: row.calendar_type,
    gender: row.gender,
    updatedAt: toNullableIsoTimestamp(row.updated_at),
  };
}

export async function findUserById(userId: string) {
  const sql = getPostgresClient();
  const rows = await sql<UserRow[]>`
    SELECT id::text AS id, display_name, created_at, updated_at
    FROM public.users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUsersByIds(
  userIds: readonly string[]
): Promise<UserSummaryRecord[]> {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return [];

  const sql = getPostgresClient();
  const rows = await sql.unsafe<Pick<UserRow, "id" | "display_name">[]>(
    `
      SELECT id::text AS id, display_name
      FROM public.users
      WHERE id = ANY($1::uuid[])
    `,
    [uniqueUserIds]
  );
  const usersById = new Map(rows.map((row) => [row.id, row]));

  return uniqueUserIds.flatMap((id) => {
    const row = usersById.get(id);
    return row ? [{ id: row.id, displayName: row.display_name }] : [];
  });
}

export async function findUserByProviderIdentity(
  provider: AuthProvider,
  providerUserId: string
) {
  const sql = getPostgresClient();
  const rows = await sql<UserIdentityJoinRow[]>`
    SELECT
      u.id::text AS user_id,
      u.display_name,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at,
      ai.id::text AS identity_id,
      ai.user_id::text AS identity_user_id,
      ai.provider,
      ai.provider_user_id,
      ai.created_at AS identity_created_at
    FROM public.auth_identities ai
    JOIN public.users u ON u.id = ai.user_id
    WHERE ai.provider = ${provider}
      AND ai.provider_user_id = ${providerUserId}
    LIMIT 1
  `;

  if (!rows[0]) return null;
  return {
    ...mapUser({
      id: rows[0].user_id,
      display_name: rows[0].display_name,
      created_at: rows[0].user_created_at,
      updated_at: rows[0].user_updated_at,
    }),
    authIdentity: mapAuthIdentity({
      id: rows[0].identity_id,
      user_id: rows[0].identity_user_id,
      provider: rows[0].provider,
      provider_user_id: rows[0].provider_user_id,
      created_at: rows[0].identity_created_at,
    }),
  } satisfies UserWithAuthIdentity;
}

export async function findSajuProfileByUserId(userId: string) {
  const sql = getPostgresClient();
  const rows = await sql<SajuProfileRow[]>`
    SELECT
      user_id::text AS user_id,
      profile_name,
      birth_date,
      birth_hour,
      birth_minute,
      birth_time_unknown,
      calendar_type,
      gender,
      updated_at
    FROM public.saju_profiles
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] ? mapSajuProfile(rows[0]) : null;
}

export async function findUserWithAuthAndSajuById(userId: string) {
  const sql = getPostgresClient();
  const [user, identities, sajuProfile] = await Promise.all([
    findUserById(userId),
    sql<AuthIdentityRow[]>`
      SELECT
        id::text AS id,
        user_id::text AS user_id,
        provider,
        provider_user_id,
        created_at
      FROM public.auth_identities
      WHERE user_id = ${userId}
      ORDER BY created_at, id
    `,
    findSajuProfileByUserId(userId),
  ]);

  if (!user) return null;
  return {
    ...user,
    authIdentities: identities.map(mapAuthIdentity),
    sajuProfile,
  } satisfies UserWithAuthAndSaju;
}
