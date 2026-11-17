import { readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import postgres from "postgres";

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type Difference = {
  area: string;
  sourceIndex?: number;
  field?: string;
  issue: string;
};

type UserRow = {
  id: string;
  display_name: string;
  created_at: string | Date;
};

type AuthIdentityRow = {
  user_id: string;
  provider: string;
  provider_user_id: string;
};

type SajuProfileRow = {
  user_id: string;
  profile_name: string | null;
  birth_date: string | Date;
  birth_hour: number;
  birth_minute: number;
  birth_time_unknown: boolean;
  calendar_type: string;
  gender: string;
};

type FriendInviteRow = {
  code: string;
  owner_user_id: string;
  created_at: string | Date;
  is_active: boolean;
};

type FriendConnectionRow = {
  id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  invite_code: string;
  profile_dedupe_key: string;
  created_at: string | Date;
  linked_at: string | Date | null;
  updated_at: string | Date | null;
};

type FriendProfileRow = {
  connection_id: string;
  name: string;
  birth_date: string;
  birth_hour: string;
  birth_minute: string;
  birth_time_unknown: boolean;
  calendar_type: string;
  gender: string;
  day_pillar: string;
  character_name: string;
  image: string;
};

const { loadEnvConfig } = nextEnv;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonArray(fileName: string): Promise<JsonValue[]> {
  const absolutePath = path.join(process.cwd(), "data", fileName);
  const parsed: unknown = JSON.parse(await readFile(absolutePath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${fileName}: root is not an array`);
  return parsed as JsonValue[];
}

function normalizeTimestamp(value: string | Date | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function normalizeDate(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function addDifference(
  differences: Difference[],
  area: string,
  issue: string,
  sourceIndex?: number,
  field?: string
) {
  differences.push({ area, sourceIndex, field, issue });
}

function compareField(
  differences: Difference[],
  area: string,
  sourceIndex: number,
  field: string,
  expected: unknown,
  actual: unknown
) {
  if (expected !== actual) {
    addDifference(differences, area, "value_mismatch", sourceIndex, field);
  }
}

function stringFallback(value: JsonValue | undefined, fallback: string) {
  return value === undefined || value === null || value === ""
    ? fallback
    : value;
}

function booleanFallback(value: JsonValue | undefined, fallback: boolean) {
  return value === undefined || value === null ? fallback : value;
}

async function main() {
  const [usersJson, invitesJson, connectionsJson] = await Promise.all([
    readJsonArray("users.json"),
    readJsonArray("friend-invites.json"),
    readJsonArray("friend-connections.json"),
  ]);

  loadEnvConfig(process.cwd(), false);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 5,
    connect_timeout: 15,
    idle_timeout: 5,
  });

  const differences: Difference[] = [];

  try {
    const [
      users,
      identities,
      sajuProfiles,
      invites,
      connections,
      friendProfiles,
      stagingStatuses,
      stagingReferenceCheck,
      integrityCheck,
    ] = await Promise.all([
      sql<UserRow[]>`
        SELECT id::text AS id, display_name, created_at
        FROM public.users
        ORDER BY id
      `,
      sql<AuthIdentityRow[]>`
        SELECT user_id::text AS user_id, provider, provider_user_id
        FROM public.auth_identities
        ORDER BY user_id, provider
      `,
      sql<SajuProfileRow[]>`
        SELECT
          user_id::text AS user_id,
          profile_name,
          birth_date,
          birth_hour,
          birth_minute,
          birth_time_unknown,
          calendar_type,
          gender
        FROM public.saju_profiles
        ORDER BY user_id
      `,
      sql<FriendInviteRow[]>`
        SELECT code, owner_user_id::text AS owner_user_id, created_at, is_active
        FROM public.friend_invites
        ORDER BY code
      `,
      sql<FriendConnectionRow[]>`
        SELECT
          id::text AS id,
          owner_user_id::text AS owner_user_id,
          friend_user_id::text AS friend_user_id,
          invite_code,
          profile_dedupe_key,
          created_at,
          linked_at,
          updated_at
        FROM public.friend_connections
        ORDER BY id
      `,
      sql<FriendProfileRow[]>`
        SELECT
          connection_id::text AS connection_id,
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
        FROM public.friend_connection_profiles
        ORDER BY connection_id
      `,
      sql<{ migration_status: string; row_count: string }[]>`
        SELECT migration_status, count(*)::bigint AS row_count
        FROM public.migration_raw_records
        GROUP BY migration_status
        ORDER BY migration_status
      `,
      sql<{
        total: string;
        needs_review_with_reference: string;
        migrated_without_reference: string;
      }[]>`
        SELECT
          count(*)::bigint AS total,
          count(*) FILTER (
            WHERE migration_status = 'needs_review'
              AND (canonical_table IS NOT NULL OR canonical_id IS NOT NULL)
          )::bigint AS needs_review_with_reference,
          count(*) FILTER (
            WHERE migration_status = 'migrated'
              AND (canonical_table IS NULL OR canonical_id IS NULL)
          )::bigint AS migrated_without_reference
        FROM public.migration_raw_records
      `,
      sql<{
        auth_orphans: string;
        saju_orphans: string;
        invite_owner_orphans: string;
        connection_owner_orphans: string;
        connection_friend_orphans: string;
        connection_invite_orphans: string;
        profile_orphans: string;
        connections_without_profile: string;
      }[]>`
        SELECT
          (SELECT count(*)::bigint
           FROM public.auth_identities ai
           LEFT JOIN public.users u ON u.id = ai.user_id
           WHERE u.id IS NULL) AS auth_orphans,
          (SELECT count(*)::bigint
           FROM public.saju_profiles sp
           LEFT JOIN public.users u ON u.id = sp.user_id
           WHERE u.id IS NULL) AS saju_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_invites fi
           LEFT JOIN public.users u ON u.id = fi.owner_user_id
           WHERE u.id IS NULL) AS invite_owner_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_connections fc
           LEFT JOIN public.users u ON u.id = fc.owner_user_id
           WHERE u.id IS NULL) AS connection_owner_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_connections fc
           LEFT JOIN public.users u ON u.id = fc.friend_user_id
           WHERE fc.friend_user_id IS NOT NULL AND u.id IS NULL) AS connection_friend_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_connections fc
           LEFT JOIN public.friend_invites fi ON fi.code = fc.invite_code
           WHERE fi.code IS NULL) AS connection_invite_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_connection_profiles fcp
           LEFT JOIN public.friend_connections fc ON fc.id = fcp.connection_id
           WHERE fc.id IS NULL) AS profile_orphans,
          (SELECT count(*)::bigint
           FROM public.friend_connections fc
           LEFT JOIN public.friend_connection_profiles fcp
             ON fcp.connection_id = fc.id
           WHERE fcp.connection_id IS NULL) AS connections_without_profile
      `,
    ]);

    const usersById = new Map(users.map((row) => [row.id, row]));
    const identitiesByUser = new Map(identities.map((row) => [row.user_id, row]));
    const profilesByUser = new Map(sajuProfiles.map((row) => [row.user_id, row]));
    const invitesByCode = new Map(invites.map((row) => [row.code, row]));
    const connectionsById = new Map(connections.map((row) => [row.id, row]));
    const friendProfilesByConnection = new Map(
      friendProfiles.map((row) => [row.connection_id, row])
    );

    const validUserIds = new Set<string>();
    usersJson.forEach((value, sourceIndex) => {
      if (!isObject(value) || typeof value.id !== "string") {
        addDifference(differences, "users", "invalid_json_user", sourceIndex);
        return;
      }
      validUserIds.add(value.id);
      const row = usersById.get(value.id);
      if (!row) {
        addDifference(differences, "users", "missing_canonical_row", sourceIndex);
        return;
      }

      compareField(
        differences,
        "users",
        sourceIndex,
        "display_name",
        value.name,
        row.display_name
      );
      compareField(
        differences,
        "users",
        sourceIndex,
        "created_at",
        normalizeTimestamp(value.createdAt as string),
        normalizeTimestamp(row.created_at)
      );

      const identity = identitiesByUser.get(value.id);
      if (!identity) {
        addDifference(
          differences,
          "auth_identities",
          "missing_canonical_row",
          sourceIndex
        );
      } else {
        compareField(
          differences,
          "auth_identities",
          sourceIndex,
          "provider",
          value.provider,
          identity.provider
        );
        compareField(
          differences,
          "auth_identities",
          sourceIndex,
          "provider_user_id",
          value.providerUserId,
          identity.provider_user_id
        );
        compareField(
          differences,
          "auth_identities",
          sourceIndex,
          "user_id",
          value.id,
          identity.user_id
        );
      }

      const jsonProfile = value.sajuProfile;
      const dbProfile = profilesByUser.get(value.id);
      if (jsonProfile === undefined || jsonProfile === null) {
        if (dbProfile) {
          addDifference(
            differences,
            "saju_profiles",
            "unexpected_canonical_row",
            sourceIndex
          );
        }
        return;
      }
      if (!isObject(jsonProfile)) {
        addDifference(
          differences,
          "saju_profiles",
          "invalid_json_profile",
          sourceIndex
        );
        return;
      }
      if (!dbProfile) {
        addDifference(
          differences,
          "saju_profiles",
          "missing_canonical_row",
          sourceIndex
        );
        return;
      }

      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "profile_name",
        jsonProfile.name ?? null,
        dbProfile.profile_name
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "birth_date",
        jsonProfile.birthDate,
        normalizeDate(dbProfile.birth_date)
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "birth_hour",
        jsonProfile.birthHour,
        dbProfile.birth_hour
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "birth_minute",
        jsonProfile.birthMinute,
        dbProfile.birth_minute
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "birth_time_unknown",
        booleanFallback(jsonProfile.birthTimeUnknown, false),
        dbProfile.birth_time_unknown
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "calendar_type",
        jsonProfile.calendarType,
        dbProfile.calendar_type
      );
      compareField(
        differences,
        "saju_profiles",
        sourceIndex,
        "gender",
        jsonProfile.gender,
        dbProfile.gender
      );
    });

    if (users.length !== usersJson.length) {
      addDifference(differences, "users", "row_count_mismatch");
    }
    if (identities.length !== usersJson.length) {
      addDifference(differences, "auth_identities", "row_count_mismatch");
    }
    const expectedSajuProfileCount = usersJson.filter(
      (value) => isObject(value) && value.sajuProfile !== undefined && value.sajuProfile !== null
    ).length;
    if (sajuProfiles.length !== expectedSajuProfileCount) {
      addDifference(differences, "saju_profiles", "row_count_mismatch");
    }

    const expectedInvites: { sourceIndex: number; value: JsonObject }[] = [];
    const orphanInviteCodes = new Set<string>();
    invitesJson.forEach((value, sourceIndex) => {
      if (!isObject(value)) {
        addDifference(differences, "friend_invites", "invalid_json_invite", sourceIndex);
        return;
      }
      const ownerIsValid =
        typeof value.ownerId === "string" &&
        UUID_PATTERN.test(value.ownerId) &&
        validUserIds.has(value.ownerId);
      if (ownerIsValid) expectedInvites.push({ sourceIndex, value });
      else if (typeof value.code === "string") orphanInviteCodes.add(value.code);
    });

    for (const { sourceIndex, value } of expectedInvites) {
      if (typeof value.code !== "string") {
        addDifference(
          differences,
          "friend_invites",
          "invalid_json_invite_code",
          sourceIndex
        );
        continue;
      }
      const row = invitesByCode.get(value.code);
      if (!row) {
        addDifference(
          differences,
          "friend_invites",
          "missing_canonical_row",
          sourceIndex
        );
        continue;
      }
      compareField(
        differences,
        "friend_invites",
        sourceIndex,
        "owner_user_id",
        value.ownerId,
        row.owner_user_id
      );
      compareField(
        differences,
        "friend_invites",
        sourceIndex,
        "created_at",
        normalizeTimestamp(value.createdAt as string),
        normalizeTimestamp(row.created_at)
      );
      compareField(
        differences,
        "friend_invites",
        sourceIndex,
        "is_active",
        true,
        row.is_active
      );
    }

    if (invites.length !== expectedInvites.length) {
      addDifference(differences, "friend_invites", "row_count_mismatch");
    }
    for (const code of orphanInviteCodes) {
      if (invitesByCode.has(code)) {
        addDifference(differences, "friend_invites", "orphan_invite_inserted");
      }
    }

    connectionsJson.forEach((value, sourceIndex) => {
      if (!isObject(value) || typeof value.id !== "string") {
        addDifference(
          differences,
          "friend_connections",
          "invalid_json_connection",
          sourceIndex
        );
        return;
      }
      const row = connectionsById.get(value.id);
      if (!row) {
        addDifference(
          differences,
          "friend_connections",
          "missing_canonical_row",
          sourceIndex
        );
        return;
      }

      for (const [field, expected, actual] of [
        ["owner_user_id", value.ownerUserId, row.owner_user_id],
        ["friend_user_id", value.friendUserId, row.friend_user_id],
        ["invite_code", value.inviteCode, row.invite_code],
        [
          "created_at",
          normalizeTimestamp(value.createdAt as string),
          normalizeTimestamp(row.created_at),
        ],
        ["linked_at", null, normalizeTimestamp(row.linked_at)],
        ["updated_at", null, normalizeTimestamp(row.updated_at)],
      ] as const) {
        compareField(
          differences,
          "friend_connections",
          sourceIndex,
          field,
          expected,
          actual
        );
      }

      if (!isObject(value.friendProfile)) {
        addDifference(
          differences,
          "friend_connection_profiles",
          "invalid_json_profile",
          sourceIndex
        );
        return;
      }
      const jsonProfile = value.friendProfile;
      const profile = friendProfilesByConnection.get(value.id);
      if (!profile) {
        addDifference(
          differences,
          "friend_connection_profiles",
          "missing_canonical_row",
          sourceIndex
        );
        return;
      }

      const expectedProfile = {
        name: jsonProfile.name,
        birth_date: jsonProfile.birthDate,
        birth_hour: stringFallback(jsonProfile.birthHour, "0"),
        birth_minute: stringFallback(jsonProfile.birthMinute, "0"),
        birth_time_unknown: booleanFallback(jsonProfile.birthTimeUnknown, false),
        calendar_type: stringFallback(jsonProfile.calendarType, "solar"),
        gender: jsonProfile.gender,
        day_pillar: jsonProfile.dayPillar,
        character_name: jsonProfile.characterName,
        image: jsonProfile.image,
      };

      for (const [field, expected] of Object.entries(expectedProfile)) {
        compareField(
          differences,
          "friend_connection_profiles",
          sourceIndex,
          field,
          expected,
          profile[field as keyof typeof expectedProfile]
        );
      }

      const expectedDedupeKey =
        "v1:" +
        JSON.stringify([
          jsonProfile.name,
          jsonProfile.birthDate,
          jsonProfile.gender,
        ]);
      compareField(
        differences,
        "profile_dedupe_key",
        sourceIndex,
        "profile_dedupe_key",
        expectedDedupeKey,
        row.profile_dedupe_key
      );
    });

    if (connections.length !== connectionsJson.length) {
      addDifference(differences, "friend_connections", "row_count_mismatch");
    }
    if (friendProfiles.length !== connectionsJson.length) {
      addDifference(
        differences,
        "friend_connection_profiles",
        "row_count_mismatch"
      );
    }

    const statusCounts = new Map(
      stagingStatuses.map((row) => [row.migration_status, Number(row.row_count)])
    );
    if (
      Number(stagingReferenceCheck[0].total) !== 17 ||
      statusCounts.get("migrated") !== 7 ||
      statusCounts.get("needs_review") !== 10 ||
      (statusCounts.get("migrated_candidate") ?? 0) !== 0
    ) {
      addDifference(differences, "migration_raw_records", "status_count_mismatch");
    }
    if (Number(stagingReferenceCheck[0].needs_review_with_reference) !== 0) {
      addDifference(
        differences,
        "migration_raw_records",
        "needs_review_has_canonical_reference"
      );
    }
    if (Number(stagingReferenceCheck[0].migrated_without_reference) !== 0) {
      addDifference(
        differences,
        "migration_raw_records",
        "migrated_missing_canonical_reference"
      );
    }

    const integrity = integrityCheck[0];
    for (const [field, count] of Object.entries(integrity)) {
      if (Number(count) !== 0) {
        addDifference(differences, "referential_integrity", field);
      }
    }

    const areaCounts = new Map<string, number>();
    for (const difference of differences) {
      areaCounts.set(
        difference.area,
        (areaCounts.get(difference.area) ?? 0) + 1
      );
    }

    const result = {
      readOnly: true,
      parityPassed: differences.length === 0,
      checks: {
        users: { json: usersJson.length, database: users.length },
        authIdentities: { expected: usersJson.length, database: identities.length },
        sajuProfiles: {
          expected: expectedSajuProfileCount,
          database: sajuProfiles.length,
        },
        friendInvites: {
          expected: expectedInvites.length,
          database: invites.length,
          orphanExcluded: [...orphanInviteCodes].every(
            (code) => !invitesByCode.has(code)
          ),
        },
        friendConnections: {
          json: connectionsJson.length,
          database: connections.length,
        },
        friendConnectionProfiles: {
          expected: connectionsJson.length,
          database: friendProfiles.length,
        },
        staging: {
          total: Number(stagingReferenceCheck[0].total),
          migrated: statusCounts.get("migrated") ?? 0,
          needsReview: statusCounts.get("needs_review") ?? 0,
        },
        referentialIntegrity: Object.fromEntries(
          Object.entries(integrity).map(([field, count]) => [field, Number(count)])
        ),
      },
      differenceCounts: Object.fromEntries(
        [...areaCounts].sort(([a], [b]) => a.localeCompare(b))
      ),
      differences,
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.parityPassed) process.exitCode = 1;
  } catch (error: unknown) {
    const databaseError = error as { code?: string; name?: string };
    console.error(
      JSON.stringify({
        readOnly: true,
        parityPassed: false,
        code: databaseError.code ?? "PARITY_CHECK_FAILED",
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
      readOnly: true,
      parityPassed: false,
      code: safeError.code ?? "PARITY_SETUP_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
