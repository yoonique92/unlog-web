import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import nextEnv from "@next/env";
import postgres from "postgres";

type AuthProvider = "kakao" | "naver" | "google";
type CalendarType = "solar" | "lunar";
type Gender = "male" | "female";

type UserRow = {
  id: string;
  display_name: string;
  created_at: string | Date;
};

type AuthIdentityRow = {
  user_id: string;
  provider: AuthProvider;
  provider_user_id: string;
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
};

type FriendInviteRow = {
  code: string;
  owner_user_id: string;
  created_at: string | Date;
};

type FriendConnectionRow = {
  id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  invite_code: string;
  created_at: string | Date;
  profile_connection_id: string | null;
  name: string | null;
  birth_date: string | null;
  birth_hour: string | null;
  birth_minute: string | null;
  birth_time_unknown: boolean | null;
  calendar_type: CalendarType | null;
  gender: string | null;
  day_pillar: string | null;
  character_name: string | null;
  image: string | null;
};

type LegacySajuProfile = {
  name?: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
};

type LegacyUser = {
  id: string;
  name: string;
  provider: AuthProvider;
  providerUserId: string;
  createdAt: string;
  sajuProfile?: LegacySajuProfile;
};

type LegacyInvite = {
  code: string;
  ownerId: string;
  createdAt: string;
};

type LegacyFriendProfile = {
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
};

type LegacyFriendConnection = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  createdAt: string;
  friendProfile: LegacyFriendProfile;
};

type JsonObject = Record<string, unknown>;

const { loadEnvConfig } = nextEnv;
const outputDirectory = path.join(tmpdir(), "unlog-postgres-json-export");
const productionDataDirectory = path.resolve(process.cwd(), "data");

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateString(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value as JsonObject)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)])
  );
}

function stableStringify(value: unknown) {
  return JSON.stringify(stableValue(value));
}

function semanticArraysEqual<T>(
  left: readonly T[],
  right: readonly T[],
  getKey: (item: T) => string
) {
  const sortByKey = (items: readonly T[]) =>
    [...items].sort((first, second) => getKey(first).localeCompare(getKey(second)));
  return stableStringify(sortByKey(left)) === stableStringify(sortByKey(right));
}

function sameArrayOrder<T>(
  left: readonly T[],
  right: readonly T[],
  getKey: (item: T) => string
) {
  return (
    left.length === right.length &&
    left.every((item, index) => getKey(item) === getKey(right[index]))
  );
}

async function readJsonArray(fileName: string): Promise<JsonObject[]> {
  const parsed: unknown = JSON.parse(
    await readFile(path.join(productionDataDirectory, fileName), "utf8")
  );
  if (!Array.isArray(parsed)) throw new Error(`${fileName} is not a JSON array.`);
  return parsed as JsonObject[];
}

function normalizeCurrentUsers(rows: JsonObject[]): LegacyUser[] {
  return rows.map((row) => {
    const profile = row.sajuProfile as JsonObject | undefined;
    const normalizedProfile = profile
      ? {
          ...(typeof profile.name === "string" ? { name: profile.name } : {}),
          birthDate: String(profile.birthDate),
          birthHour: Number(profile.birthHour),
          birthMinute: Number(profile.birthMinute),
          birthTimeUnknown: Boolean(profile.birthTimeUnknown ?? false),
          calendarType: profile.calendarType as CalendarType,
          gender: profile.gender as Gender,
        }
      : undefined;

    return {
      id: String(row.id),
      name: String(row.name),
      provider: row.provider as AuthProvider,
      providerUserId: String(row.providerUserId),
      createdAt: toIsoTimestamp(String(row.createdAt)),
      ...(normalizedProfile ? { sajuProfile: normalizedProfile } : {}),
    };
  });
}

function normalizeCurrentInvites(
  rows: JsonObject[],
  validUserIds: ReadonlySet<string>
): LegacyInvite[] {
  return rows
    .filter(
      (row) =>
        typeof row.code === "string" &&
        typeof row.ownerId === "string" &&
        validUserIds.has(row.ownerId)
    )
    .map((row) => ({
      code: String(row.code),
      ownerId: String(row.ownerId),
      createdAt: toIsoTimestamp(String(row.createdAt)),
    }));
}

function normalizeCurrentConnections(rows: JsonObject[]): LegacyFriendConnection[] {
  return rows.map((row) => {
    const profile = row.friendProfile as JsonObject;
    return {
      id: String(row.id),
      ownerUserId: String(row.ownerUserId),
      friendUserId: row.friendUserId === null ? null : String(row.friendUserId),
      inviteCode: String(row.inviteCode),
      createdAt: toIsoTimestamp(String(row.createdAt)),
      friendProfile: {
        name: String(profile.name),
        birthDate: String(profile.birthDate),
        birthHour:
          profile.birthHour === undefined || profile.birthHour === null || profile.birthHour === ""
            ? "0"
            : String(profile.birthHour),
        birthMinute:
          profile.birthMinute === undefined ||
          profile.birthMinute === null ||
          profile.birthMinute === ""
            ? "0"
            : String(profile.birthMinute),
        birthTimeUnknown: Boolean(profile.birthTimeUnknown ?? false),
        calendarType: (profile.calendarType ?? "solar") as CalendarType,
        gender: String(profile.gender),
        dayPillar: String(profile.dayPillar),
        characterName: String(profile.characterName),
        image: String(profile.image),
      },
    };
  });
}

function requireSnapshot(row: FriendConnectionRow) {
  const required = [
    row.profile_connection_id,
    row.name,
    row.birth_date,
    row.birth_hour,
    row.birth_minute,
    row.calendar_type,
    row.gender,
    row.day_pillar,
    row.character_name,
    row.image,
  ];
  if (required.some((value) => value === null) || row.birth_time_unknown === null) {
    throw new Error(`Connection ${row.id} has no complete snapshot profile.`);
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const resolvedOutput = path.resolve(outputDirectory);
  if (
    resolvedOutput === productionDataDirectory ||
    resolvedOutput.startsWith(`${productionDataDirectory}${path.sep}`)
  ) {
    throw new Error("Export output must not be inside the production data directory.");
  }

  loadEnvConfig(process.cwd(), false);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 3,
    connect_timeout: 15,
    idle_timeout: 5,
  });

  try {
    const [users, identities, profiles, invites, connections, stagingReview] =
      await Promise.all([
        sql<UserRow[]>`
          SELECT id::text AS id, display_name, created_at
          FROM public.users
          ORDER BY created_at, id
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
          SELECT code, owner_user_id::text AS owner_user_id, created_at
          FROM public.friend_invites
          WHERE is_active = true
          ORDER BY created_at, code
        `,
        sql<FriendConnectionRow[]>`
          SELECT
            fc.id::text AS id,
            fc.owner_user_id::text AS owner_user_id,
            fc.friend_user_id::text AS friend_user_id,
            fc.invite_code,
            fc.created_at,
            fp.connection_id::text AS profile_connection_id,
            fp.name,
            fp.birth_date,
            fp.birth_hour,
            fp.birth_minute,
            fp.birth_time_unknown,
            fp.calendar_type,
            fp.gender,
            fp.day_pillar,
            fp.character_name,
            fp.image
          FROM public.friend_connections AS fc
          LEFT JOIN public.friend_connection_profiles AS fp
            ON fp.connection_id = fc.id
          ORDER BY fc.created_at, fc.id
        `,
        sql<{ source_file: string; row_count: number }[]>`
          SELECT source_file, count(*)::int AS row_count
          FROM public.migration_raw_records
          WHERE migration_status = 'needs_review'
          GROUP BY source_file
          ORDER BY source_file
        `,
      ]);

    const identitiesByUser = new Map<string, AuthIdentityRow[]>();
    for (const identity of identities) {
      const grouped = identitiesByUser.get(identity.user_id) ?? [];
      grouped.push(identity);
      identitiesByUser.set(identity.user_id, grouped);
    }
    const profilesByUser = new Map(profiles.map((profile) => [profile.user_id, profile]));

    const exportedUsers: LegacyUser[] = users.map((user) => {
      const userIdentities = identitiesByUser.get(user.id) ?? [];
      if (userIdentities.length !== 1) {
        throw new Error(
          `User ${user.id} has ${userIdentities.length} auth identities; the legacy format requires exactly one.`
        );
      }
      const identity = userIdentities[0];
      const profile = profilesByUser.get(user.id);
      const sajuProfile: LegacySajuProfile | undefined = profile
        ? {
            ...(profile.profile_name === null ? {} : { name: profile.profile_name }),
            birthDate: toDateString(profile.birth_date),
            birthHour: profile.birth_hour,
            birthMinute: profile.birth_minute,
            birthTimeUnknown: profile.birth_time_unknown,
            calendarType: profile.calendar_type,
            gender: profile.gender,
          }
        : undefined;

      return {
        id: user.id,
        name: user.display_name,
        provider: identity.provider,
        providerUserId: identity.provider_user_id,
        createdAt: toIsoTimestamp(user.created_at),
        ...(sajuProfile ? { sajuProfile } : {}),
      };
    });

    const exportedInvites: LegacyInvite[] = invites.map((invite) => ({
      code: invite.code,
      ownerId: invite.owner_user_id,
      createdAt: toIsoTimestamp(invite.created_at),
    }));

    const exportedConnections: LegacyFriendConnection[] = connections.map((connection) => {
      requireSnapshot(connection);
      return {
        id: connection.id,
        ownerUserId: connection.owner_user_id,
        friendUserId: connection.friend_user_id,
        inviteCode: connection.invite_code,
        createdAt: toIsoTimestamp(connection.created_at),
        friendProfile: {
          name: connection.name as string,
          birthDate: connection.birth_date as string,
          birthHour: connection.birth_hour as string,
          birthMinute: connection.birth_minute as string,
          birthTimeUnknown: connection.birth_time_unknown as boolean,
          calendarType: connection.calendar_type as CalendarType,
          gender: connection.gender as string,
          dayPillar: connection.day_pillar as string,
          characterName: connection.character_name as string,
          image: connection.image as string,
        },
      };
    });

    await mkdir(resolvedOutput, { recursive: true });
    const outputFiles = {
      users: path.join(resolvedOutput, "users.json"),
      invites: path.join(resolvedOutput, "friend-invites.json"),
      connections: path.join(resolvedOutput, "friend-connections.json"),
    };
    await Promise.all([
      writeFile(outputFiles.users, `${JSON.stringify(exportedUsers, null, 2)}\n`, "utf8"),
      writeFile(outputFiles.invites, `${JSON.stringify(exportedInvites, null, 2)}\n`, "utf8"),
      writeFile(
        outputFiles.connections,
        `${JSON.stringify(exportedConnections, null, 2)}\n`,
        "utf8"
      ),
    ]);

    const [currentUsersRaw, currentInvitesRaw, currentConnectionsRaw] =
      await Promise.all([
        readJsonArray("users.json"),
        readJsonArray("friend-invites.json"),
        readJsonArray("friend-connections.json"),
      ]);
    const currentUsers = normalizeCurrentUsers(currentUsersRaw);
    const validUserIds = new Set(currentUsers.map((user) => user.id));
    const currentProductionInvites = normalizeCurrentInvites(
      currentInvitesRaw,
      validUserIds
    );
    const currentConnections = normalizeCurrentConnections(currentConnectionsRaw);
    const orphanInvites = currentInvitesRaw.filter(
      (invite) =>
        typeof invite.ownerId !== "string" || !validUserIds.has(invite.ownerId)
    );
    const legacyFriendObjects = orphanInvites.filter(
      (invite) => invite.friend !== undefined
    );

    const parity = {
      users: semanticArraysEqual(currentUsers, exportedUsers, (user) => user.id),
      productionInvites: semanticArraysEqual(
        currentProductionInvites,
        exportedInvites,
        (invite) => invite.code
      ),
      connections: semanticArraysEqual(
        currentConnections,
        exportedConnections,
        (connection) => connection.id
      ),
    };
    if (!Object.values(parity).every(Boolean)) {
      throw new Error("The canonical export does not match the current production JSON semantics.");
    }

    const generatedContents = await Promise.all(
      Object.values(outputFiles).map((file) => readFile(file, "utf8"))
    );
    const reviewCounts = Object.fromEntries(
      stagingReview.map((row) => [row.source_file, row.row_count])
    );

    console.log(
      JSON.stringify(
        {
          readOnlyDatabase: true,
          productionDataFilesModified: false,
          outputDirectory: resolvedOutput,
          counts: {
            users: exportedUsers.length,
            productionInvites: exportedInvites.length,
            connections: exportedConnections.length,
          },
          parity,
          currentArrayOrderMatched: {
            users: sameArrayOrder(currentUsers, exportedUsers, (user) => user.id),
            productionInvites: sameArrayOrder(
              currentProductionInvites,
              exportedInvites,
              (invite) => invite.code
            ),
            connections: sameArrayOrder(
              currentConnections,
              exportedConnections,
              (connection) => connection.id
            ),
          },
          ordering: "created_at_then_primary_key",
          originalSourceOrderGuaranteed: false,
          legacyOrphan: {
            canonicalExportIncludesNeedsReview: false,
            currentOrphanInvites: orphanInvites.length,
            currentLegacyFriendObjects: legacyFriendObjects.length,
            stagingNeedsReviewByFile: reviewCounts,
          },
          outputChecksumsComputed: generatedContents.map((contents) => sha256(contents)).length,
        },
        null,
        2
      )
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const safeError = error as { code?: string; name?: string };
  console.error(
    JSON.stringify({
      readOnlyDatabase: true,
      success: false,
      code: safeError.code ?? "EXPORT_VALIDATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
