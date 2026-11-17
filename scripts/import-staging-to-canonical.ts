import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import postgres from "postgres";

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type RecordType = "user" | "friend_invite" | "friend_connection";

type ImportRunRow = {
  id: string;
  source_manifest: JsonValue;
};

type RawRecordRow = {
  id: string;
  import_run_id: string;
  source_file: string;
  source_index: number;
  record_type: string;
  raw_payload: JsonValue;
  migration_status: string;
  canonical_table: string | null;
  canonical_id: string | null;
};

type UserCandidate = {
  rawRecordId: string;
  id: string;
  displayName: string;
  provider: "kakao" | "naver" | "google";
  providerUserId: string;
  createdAt: string;
  sajuProfile: SajuProfileCandidate | null;
  authIdentityId: string;
};

type SajuProfileCandidate = {
  profileName: string | null;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  gender: "male" | "female";
};

type InviteCandidate = {
  rawRecordId: string;
  code: string;
  ownerUserId: string;
  createdAt: string;
};

type ConnectionCandidate = {
  rawRecordId: string;
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  profileDedupeKey: string;
  createdAt: string;
  linkedAt: string | null;
  updatedAt: string | null;
  profile: FriendProfileCandidate;
};

type FriendProfileCandidate = {
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

type CanonicalReference = {
  canonicalTable: "users" | "friend_invites" | "friend_connections";
  canonicalId: string;
};

const { loadEnvConfig } = nextEnv;
const IMPORT_VERSION = "json_raw_import_v1";
const EXPECTED_RAW_TOTAL = 17;
const EXPECTED_MIGRATED_CANDIDATES = 7;
const EXPECTED_NEEDS_REVIEW = 10;
const EXPECTED_CANDIDATE_COUNTS: Record<RecordType, number> = {
  user: 3,
  friend_invite: 3,
  friend_connection: 1,
};
const EXPECTED_SOURCE_FILES = new Map([
  ["data/users.json", 3],
  ["data/friend-invites.json", 13],
  ["data/friend-connections.json", 1],
]);
const ALLOWED_PROVIDERS = new Set(["kakao", "naver", "google"]);
const ALLOWED_CALENDAR_TYPES = new Set(["solar", "lunar"]);
const ALLOWED_GENDERS = new Set(["male", "female"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CHECKSUM_PATTERN = /^sha256:[0-9a-f]{64}$/;

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(value: JsonValue, context: string): JsonObject {
  if (!isObject(value)) throw new Error(`${context}: expected an object`);
  return value;
}

function requireString(
  value: JsonValue | undefined,
  context: string,
  allowEmpty = false
) {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw new Error(`${context}: expected a string`);
  }
  return value;
}

function requireUuid(value: JsonValue | undefined, context: string) {
  const uuid = requireString(value, context);
  if (!UUID_PATTERN.test(uuid)) throw new Error(`${context}: invalid UUID`);
  return uuid;
}

function requireTimestamp(value: JsonValue | undefined, context: string) {
  const timestamp = requireString(value, context);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`${context}: invalid timestamp`);
  }
  return timestamp;
}

function requireDate(value: JsonValue | undefined, context: string) {
  const date = requireString(value, context);
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error(`${context}: invalid date`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${context}: invalid date`);
  }
  return date;
}

function requireInteger(
  value: JsonValue | undefined,
  minimum: number,
  maximum: number,
  context: string
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${context}: invalid integer`);
  }
  return value;
}

function optionalTimestamp(value: JsonValue | undefined, context: string) {
  if (value === undefined || value === null) return null;
  return requireTimestamp(value, context);
}

function stringWithZeroFallback(value: JsonValue | undefined, context: string) {
  if (value === undefined || value === null || value === "") return "0";
  return requireString(value, context, true);
}

function booleanWithFalseFallback(value: JsonValue | undefined, context: string) {
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") {
    throw new Error(`${context}: expected a boolean`);
  }
  return value;
}

function parseSajuProfile(value: JsonValue | undefined, context: string) {
  if (value === undefined || value === null) return null;
  const profile = requireObject(value, context);
  const calendarType = requireString(profile.calendarType, `${context}.calendarType`);
  const gender = requireString(profile.gender, `${context}.gender`);

  if (!ALLOWED_CALENDAR_TYPES.has(calendarType)) {
    throw new Error(`${context}.calendarType: unsupported value`);
  }
  if (!ALLOWED_GENDERS.has(gender)) {
    throw new Error(`${context}.gender: unsupported value`);
  }

  return {
    profileName:
      profile.name === undefined || profile.name === null
        ? null
        : requireString(profile.name, `${context}.name`, true),
    birthDate: requireDate(profile.birthDate, `${context}.birthDate`),
    birthHour: requireInteger(profile.birthHour, 0, 23, `${context}.birthHour`),
    birthMinute: requireInteger(
      profile.birthMinute,
      0,
      59,
      `${context}.birthMinute`
    ),
    birthTimeUnknown: booleanWithFalseFallback(
      profile.birthTimeUnknown,
      `${context}.birthTimeUnknown`
    ),
    calendarType: calendarType as "solar" | "lunar",
    gender: gender as "male" | "female",
  } satisfies SajuProfileCandidate;
}

function parseUserCandidate(record: RawRecordRow): UserCandidate {
  const context = `raw record ${record.id}`;
  const user = requireObject(record.raw_payload, context);
  const provider = requireString(user.provider, `${context}.provider`);
  if (!ALLOWED_PROVIDERS.has(provider)) {
    throw new Error(`${context}.provider: unsupported value`);
  }

  return {
    rawRecordId: record.id,
    id: requireUuid(user.id, `${context}.id`),
    displayName: requireString(user.name, `${context}.name`, true),
    provider: provider as "kakao" | "naver" | "google",
    providerUserId: requireString(
      user.providerUserId,
      `${context}.providerUserId`
    ),
    createdAt: requireTimestamp(user.createdAt, `${context}.createdAt`),
    sajuProfile: parseSajuProfile(user.sajuProfile, `${context}.sajuProfile`),
    authIdentityId: randomUUID(),
  };
}

function parseInviteCandidate(record: RawRecordRow): InviteCandidate {
  const context = `raw record ${record.id}`;
  const invite = requireObject(record.raw_payload, context);

  if (invite.friend !== undefined) {
    throw new Error(`${context}: legacy friend object is not canonical data`);
  }

  return {
    rawRecordId: record.id,
    code: requireString(invite.code, `${context}.code`),
    ownerUserId: requireUuid(invite.ownerId, `${context}.ownerId`),
    createdAt: requireTimestamp(invite.createdAt, `${context}.createdAt`),
  };
}

function parseFriendProfile(value: JsonValue | undefined, context: string) {
  const profile = requireObject(value ?? null, context);
  const calendarType =
    profile.calendarType === undefined || profile.calendarType === null
      ? "solar"
      : requireString(profile.calendarType, `${context}.calendarType`);

  if (!ALLOWED_CALENDAR_TYPES.has(calendarType)) {
    throw new Error(`${context}.calendarType: unsupported value`);
  }

  return {
    name: requireString(profile.name, `${context}.name`),
    birthDate: requireString(profile.birthDate, `${context}.birthDate`),
    birthHour: stringWithZeroFallback(
      profile.birthHour,
      `${context}.birthHour`
    ),
    birthMinute: stringWithZeroFallback(
      profile.birthMinute,
      `${context}.birthMinute`
    ),
    birthTimeUnknown: booleanWithFalseFallback(
      profile.birthTimeUnknown,
      `${context}.birthTimeUnknown`
    ),
    calendarType,
    gender: requireString(profile.gender, `${context}.gender`),
    dayPillar: requireString(profile.dayPillar, `${context}.dayPillar`),
    characterName: requireString(
      profile.characterName,
      `${context}.characterName`
    ),
    image: requireString(profile.image, `${context}.image`),
  } satisfies FriendProfileCandidate;
}

function parseConnectionCandidate(record: RawRecordRow): ConnectionCandidate {
  const context = `raw record ${record.id}`;
  const connection = requireObject(record.raw_payload, context);
  const friendUserId =
    connection.friendUserId === null
      ? null
      : requireUuid(connection.friendUserId, `${context}.friendUserId`);
  const profile = parseFriendProfile(
    connection.friendProfile,
    `${context}.friendProfile`
  );

  return {
    rawRecordId: record.id,
    id: requireUuid(connection.id, `${context}.id`),
    ownerUserId: requireUuid(
      connection.ownerUserId,
      `${context}.ownerUserId`
    ),
    friendUserId,
    inviteCode: requireString(connection.inviteCode, `${context}.inviteCode`),
    profileDedupeKey:
      "v1:" +
      JSON.stringify([profile.name, profile.birthDate, profile.gender]),
    createdAt: requireTimestamp(connection.createdAt, `${context}.createdAt`),
    linkedAt:
      friendUserId === null
        ? null
        : optionalTimestamp(connection.linkedAt, `${context}.linkedAt`),
    updatedAt: optionalTimestamp(connection.updatedAt, `${context}.updatedAt`),
    profile,
  };
}

function isReviewedManifest(value: JsonValue) {
  if (!isObject(value)) return false;
  if (value.version !== IMPORT_VERSION) return false;
  if (
    typeof value.importFingerprint !== "string" ||
    !CHECKSUM_PATTERN.test(value.importFingerprint)
  ) {
    return false;
  }
  if (!Array.isArray(value.files) || value.files.length !== 3) return false;

  const seenFiles = new Set<string>();
  for (const entry of value.files) {
    if (!isObject(entry)) return false;
    if (typeof entry.fileName !== "string") return false;
    if (typeof entry.rowCount !== "number") return false;
    if (
      typeof entry.checksum !== "string" ||
      !CHECKSUM_PATTERN.test(entry.checksum)
    ) {
      return false;
    }
    if (EXPECTED_SOURCE_FILES.get(entry.fileName) !== entry.rowCount) {
      return false;
    }
    seenFiles.add(entry.fileName);
  }

  return seenFiles.size === EXPECTED_SOURCE_FILES.size;
}

function assertCandidateShape(records: RawRecordRow[]) {
  if (records.length !== EXPECTED_MIGRATED_CANDIDATES) {
    throw new Error("Expected exactly 7 migrated_candidate raw records.");
  }

  const counts: Record<RecordType, number> = {
    user: 0,
    friend_invite: 0,
    friend_connection: 0,
  };

  for (const record of records) {
    if (
      record.record_type !== "user" &&
      record.record_type !== "friend_invite" &&
      record.record_type !== "friend_connection"
    ) {
      throw new Error(`Unexpected record_type: ${record.record_type}`);
    }
    if (record.canonical_table !== null || record.canonical_id !== null) {
      throw new Error("Candidate already has a canonical reference.");
    }
    counts[record.record_type] += 1;
  }

  for (const [recordType, expected] of Object.entries(
    EXPECTED_CANDIDATE_COUNTS
  )) {
    if (counts[recordType as RecordType] !== expected) {
      throw new Error(`Unexpected ${recordType} candidate count.`);
    }
  }
}

async function main() {
  loadEnvConfig(process.cwd(), false);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });

  try {
    const result = await sql.begin(async (transaction) => {
      await transaction`
        SELECT pg_advisory_xact_lock(
          hashtextextended('unlog_staging_to_canonical_v1', 0)
        )
      `;

      await transaction.unsafe(`
        LOCK TABLE
          public.users,
          public.auth_identities,
          public.saju_profiles,
          public.friend_invites,
          public.friend_connections,
          public.friend_connection_profiles
        IN SHARE ROW EXCLUSIVE MODE
      `);

      const canonicalCounts = await transaction.unsafe(`
        SELECT 'users' AS table_name, count(*)::bigint AS row_count FROM public.users
        UNION ALL SELECT 'auth_identities', count(*)::bigint FROM public.auth_identities
        UNION ALL SELECT 'saju_profiles', count(*)::bigint FROM public.saju_profiles
        UNION ALL SELECT 'friend_invites', count(*)::bigint FROM public.friend_invites
        UNION ALL SELECT 'friend_connections', count(*)::bigint FROM public.friend_connections
        UNION ALL SELECT 'friend_connection_profiles', count(*)::bigint FROM public.friend_connection_profiles
      `);

      if (canonicalCounts.some((row) => Number(row.row_count) !== 0)) {
        throw new Error("Canonical tables are not empty; migration stopped.");
      }

      const completedRuns = await transaction<ImportRunRow[]>`
        SELECT id, source_manifest
        FROM public.migration_import_runs
        WHERE status = 'completed'
        ORDER BY completed_at DESC NULLS LAST, started_at DESC
        FOR UPDATE
      `;
      const reviewedRuns = completedRuns.filter((run) =>
        isReviewedManifest(run.source_manifest)
      );

      if (reviewedRuns.length !== 1) {
        throw new Error("Expected exactly one reviewed completed import run.");
      }
      const importRunId = reviewedRuns[0].id;

      const statusCounts = await transaction<
        { migration_status: string; row_count: string }[]
      >`
        SELECT migration_status, count(*)::bigint AS row_count
        FROM public.migration_raw_records
        WHERE import_run_id = ${importRunId}
        GROUP BY migration_status
      `;
      const statusCountMap = new Map(
        statusCounts.map((row) => [row.migration_status, Number(row.row_count)])
      );
      const rawTotal = [...statusCountMap.values()].reduce(
        (total, count) => total + count,
        0
      );

      if (
        rawTotal !== EXPECTED_RAW_TOTAL ||
        statusCountMap.get("migrated_candidate") !==
          EXPECTED_MIGRATED_CANDIDATES ||
        statusCountMap.get("needs_review") !== EXPECTED_NEEDS_REVIEW
      ) {
        throw new Error("Staging status counts do not match the reviewed dry-run.");
      }

      const candidateRecords = await transaction<RawRecordRow[]>`
        SELECT
          id,
          import_run_id,
          source_file,
          source_index,
          record_type,
          raw_payload,
          migration_status,
          canonical_table,
          canonical_id
        FROM public.migration_raw_records
        WHERE import_run_id = ${importRunId}
          AND migration_status = 'migrated_candidate'
        ORDER BY source_file, source_index
        FOR UPDATE
      `;
      assertCandidateShape(candidateRecords);

      const users = candidateRecords
        .filter((record) => record.record_type === "user")
        .map(parseUserCandidate);
      const invites = candidateRecords
        .filter((record) => record.record_type === "friend_invite")
        .map(parseInviteCandidate);
      const connections = candidateRecords
        .filter((record) => record.record_type === "friend_connection")
        .map(parseConnectionCandidate);

      const userIds = new Set(users.map((user) => user.id));
      const inviteOwners = new Set(invites.map((invite) => invite.ownerUserId));
      const inviteCodes = new Set(invites.map((invite) => invite.code));

      if (userIds.size !== 3 || inviteOwners.size !== 3 || inviteCodes.size !== 3) {
        throw new Error("Canonical user or invite uniqueness check failed.");
      }

      for (const invite of invites) {
        if (!userIds.has(invite.ownerUserId)) {
          throw new Error("Invite owner is not a canonical user candidate.");
        }
      }
      for (const connection of connections) {
        if (!userIds.has(connection.ownerUserId)) {
          throw new Error("Connection owner is not a canonical user candidate.");
        }
        if (
          connection.friendUserId !== null &&
          !userIds.has(connection.friendUserId)
        ) {
          throw new Error("Connection friend is not a canonical user candidate.");
        }
        if (!inviteCodes.has(connection.inviteCode)) {
          throw new Error("Connection invite is not a canonical invite candidate.");
        }
      }

      for (const user of users) {
        await transaction`
          INSERT INTO public.users (
            id,
            display_name,
            created_at,
            updated_at
          ) VALUES (
            ${user.id},
            ${user.displayName},
            ${user.createdAt},
            NULL
          )
        `;
      }

      for (const user of users) {
        await transaction`
          INSERT INTO public.auth_identities (
            id,
            user_id,
            provider,
            provider_user_id,
            created_at
          ) VALUES (
            ${user.authIdentityId},
            ${user.id},
            ${user.provider},
            ${user.providerUserId},
            ${user.createdAt}
          )
        `;
      }

      for (const user of users) {
        if (!user.sajuProfile) continue;
        const profile = user.sajuProfile;
        await transaction`
          INSERT INTO public.saju_profiles (
            user_id,
            profile_name,
            birth_date,
            birth_hour,
            birth_minute,
            birth_time_unknown,
            calendar_type,
            gender,
            updated_at
          ) VALUES (
            ${user.id},
            ${profile.profileName},
            ${profile.birthDate},
            ${profile.birthHour},
            ${profile.birthMinute},
            ${profile.birthTimeUnknown},
            ${profile.calendarType},
            ${profile.gender},
            NULL
          )
        `;
      }

      for (const invite of invites) {
        await transaction`
          INSERT INTO public.friend_invites (
            code,
            owner_user_id,
            is_active,
            created_at
          ) VALUES (
            ${invite.code},
            ${invite.ownerUserId},
            true,
            ${invite.createdAt}
          )
        `;
      }

      for (const connection of connections) {
        await transaction`
          INSERT INTO public.friend_connections (
            id,
            owner_user_id,
            friend_user_id,
            invite_code,
            profile_dedupe_key,
            created_at,
            linked_at,
            updated_at
          ) VALUES (
            ${connection.id},
            ${connection.ownerUserId},
            ${connection.friendUserId},
            ${connection.inviteCode},
            ${connection.profileDedupeKey},
            ${connection.createdAt},
            ${connection.linkedAt},
            ${connection.updatedAt}
          )
        `;

        const profile = connection.profile;
        await transaction`
          INSERT INTO public.friend_connection_profiles (
            connection_id,
            name,
            birth_date,
            birth_hour,
            birth_minute,
            birth_time_unknown,
            calendar_type,
            gender,
            day_pillar,
            character_name,
            image
          ) VALUES (
            ${connection.id},
            ${profile.name},
            ${profile.birthDate},
            ${profile.birthHour},
            ${profile.birthMinute},
            ${profile.birthTimeUnknown},
            ${profile.calendarType},
            ${profile.gender},
            ${profile.dayPillar},
            ${profile.characterName},
            ${profile.image}
          )
        `;
      }

      const canonicalReferences = new Map<string, CanonicalReference>();
      for (const user of users) {
        canonicalReferences.set(user.rawRecordId, {
          canonicalTable: "users",
          canonicalId: user.id,
        });
      }
      for (const invite of invites) {
        canonicalReferences.set(invite.rawRecordId, {
          canonicalTable: "friend_invites",
          canonicalId: invite.code,
        });
      }
      for (const connection of connections) {
        canonicalReferences.set(connection.rawRecordId, {
          canonicalTable: "friend_connections",
          canonicalId: connection.id,
        });
      }

      if (canonicalReferences.size !== EXPECTED_MIGRATED_CANDIDATES) {
        throw new Error("Canonical reference count does not match candidates.");
      }

      for (const record of candidateRecords) {
        const reference = canonicalReferences.get(record.id);
        if (!reference) throw new Error("Missing canonical reference.");

        const updateResult = await transaction`
          UPDATE public.migration_raw_records
          SET migration_status = 'migrated',
              canonical_table = ${reference.canonicalTable},
              canonical_id = ${reference.canonicalId}
          WHERE id = ${record.id}
            AND import_run_id = ${importRunId}
            AND migration_status = 'migrated_candidate'
        `;

        if (updateResult.count !== 1) {
          throw new Error("Staging status update did not affect exactly one row.");
        }
      }

      return {
        migratedRawRecords: candidateRecords.length,
        canonicalRows: {
          users: users.length,
          authIdentities: users.length,
          sajuProfiles: users.filter((user) => user.sajuProfile !== null).length,
          friendInvites: invites.length,
          friendConnections: connections.length,
          friendConnectionProfiles: connections.length,
        },
      };
    });

    console.log(JSON.stringify({ success: true, ...result }));
  } catch (error: unknown) {
    const databaseError = error as { code?: string; name?: string };
    console.error(
      JSON.stringify({
        success: false,
        code: databaseError.code ?? "CANONICAL_IMPORT_FAILED",
        type: databaseError.name ?? "Error",
      })
    );
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const safeError = error as { code?: string; name?: string };
  console.error(
    JSON.stringify({
      success: false,
      code: safeError.code ?? "PRE_IMPORT_VALIDATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
