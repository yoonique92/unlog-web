import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as nodeModule from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import type {
  FriendConnectionSource,
  FriendProfileSource,
  FriendUserSource,
} from "../lib/friends/mapFriendConnections";

type AuthProvider = "kakao" | "naver" | "google";
type CalendarType = "solar" | "lunar";
type Gender = "male" | "female";

type JsonSajuProfile = {
  name?: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown?: boolean;
  calendarType: CalendarType;
  gender: Gender;
};

type JsonUser = {
  id: string;
  name: string;
  provider: AuthProvider;
  providerUserId: string;
  createdAt: string;
  sajuProfile?: JsonSajuProfile;
};

type JsonInvite = {
  code: string;
  ownerId: string;
  createdAt: string;
};

type JsonFriendProfile = FriendProfileSource;

type JsonConnection = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  friendProfile: JsonFriendProfile;
  createdAt: string;
};

type Difference = {
  area: "user" | "invite" | "friend" | "friend_count";
  issue: string;
  field?: string;
};

type ResolveContext = { parentURL?: string };
type ResolveResult = { url: string; shortCircuit?: boolean };
type NextResolve = (specifier: string, context: ResolveContext) => ResolveResult;
type RegisterHooks = (hooks: {
  resolve: (
    specifier: string,
    context: ResolveContext,
    nextResolve: NextResolve
  ) => ResolveResult;
}) => void;

const moduleApi = nodeModule as unknown as { registerHooks?: RegisterHooks };
if (!moduleApi.registerHooks) {
  throw new Error("This verification script requires Node.js registerHooks support.");
}

moduleApi.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        url: "data:text/javascript,export%20{}",
        shortCircuit: true,
      };
    }

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        specifier.startsWith(".") &&
        context.parentURL?.startsWith("file:") &&
        !specifier.endsWith(".ts")
      ) {
        const candidate = new URL(`${specifier}.ts`, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
      throw error;
    }
  },
});

const { loadEnvConfig } = nextEnv;

async function readJsonArray<T>(fileName: string): Promise<T[]> {
  const source = await readFile(path.join(process.cwd(), "data", fileName), "utf8");
  const parsed: unknown = JSON.parse(source);
  if (!Array.isArray(parsed)) throw new Error(`${fileName} is not an array.`);
  return parsed as T[];
}

function toIsoTimestamp(value: string) {
  return new Date(value).toISOString();
}

function normalizeJsonProfile(profile: JsonFriendProfile): FriendProfileSource {
  return {
    name: profile.name,
    birthDate: profile.birthDate,
    birthHour: profile.birthHour || "0",
    birthMinute: profile.birthMinute || "0",
    birthTimeUnknown: profile.birthTimeUnknown ?? false,
    calendarType: profile.calendarType ?? "solar",
    gender: profile.gender,
    dayPillar: profile.dayPillar,
    characterName: profile.characterName,
    image: profile.image,
  };
}

function normalizeJsonConnection(connection: JsonConnection): FriendConnectionSource {
  return {
    id: connection.id,
    ownerUserId: connection.ownerUserId,
    friendUserId: connection.friendUserId,
    inviteCode: connection.inviteCode,
    friendProfile: normalizeJsonProfile(connection.friendProfile),
    createdAt: toIsoTimestamp(connection.createdAt),
  };
}

function normalizeDbConnection(connection: {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  createdAt: string;
  friendProfile: FriendProfileSource;
}): FriendConnectionSource {
  return {
    id: connection.id,
    ownerUserId: connection.ownerUserId,
    friendUserId: connection.friendUserId,
    inviteCode: connection.inviteCode,
    friendProfile: connection.friendProfile,
    createdAt: connection.createdAt,
  };
}

function addDifference(
  differences: Difference[],
  area: Difference["area"],
  issue: string,
  field?: string
) {
  differences.push({ area, issue, field });
}

function compareValue(
  differences: Difference[],
  area: Difference["area"],
  field: string,
  expected: unknown,
  actual: unknown
) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    addDifference(differences, area, "value_mismatch", field);
  }
}

async function main() {
  const [users, invites, connections] = await Promise.all([
    readJsonArray<JsonUser>("users.json"),
    readJsonArray<JsonInvite>("friend-invites.json"),
    readJsonArray<JsonConnection>("friend-connections.json"),
  ]);

  loadEnvConfig(process.cwd(), false);

  const postgresModule = await import(
    new URL("../lib/db/postgres.ts", import.meta.url).href
  );
  const userRepository = await import(
    new URL("../lib/db/repositories/userRepository.ts", import.meta.url).href
  );
  const friendRepository = await import(
    new URL("../lib/db/repositories/friendRepository.ts", import.meta.url).href
  );
  const friendMapper = await import(
    new URL("../lib/friends/mapFriendConnections.ts", import.meta.url).href
  );
  const friendLimit = await import(
    new URL("../lib/friends/limit.ts", import.meta.url).href
  );
  const sajuModule = await import(new URL("../lib/saju.ts", import.meta.url).href);
  const characterModule = await import(
    new URL("../lib/dayPillarCharacter.ts", import.meta.url).href
  );

  const differences: Difference[] = [];
  const dbUsers: FriendUserSource[] = [];
  let userChecks = 0;
  let profileChecks = 0;
  let inviteChecks = 0;
  let orphanInviteChecks = 0;
  let friendChecks = 0;
  let friendCountChecks = 0;
  let ownerDirectionChecks = 0;
  let friendDirectionChecks = 0;

  const resolveFriendProfile = (profile: FriendProfileSource) => {
    try {
      if (!profile.birthDate || !["male", "female"].includes(profile.gender)) {
        return profile;
      }

      const saju = sajuModule.getSaju(
        profile.birthDate,
        profile.birthHour || "12",
        profile.birthMinute || "0",
        (profile.calendarType ?? "solar") as CalendarType,
        profile.gender as Gender,
        Boolean(profile.birthTimeUnknown)
      );
      const dayPillar = `${saju.dayStem}${saju.dayBranch}`;
      return {
        ...profile,
        dayPillar,
        characterName:
          characterModule.getDayPillarCharacterName(dayPillar) ??
          profile.characterName,
        pillars: saju.pillars,
      };
    } catch {
      return profile;
    }
  };

  try {
    for (const jsonUser of users) {
      const [byId, byIdentity, combined, profile] = await Promise.all([
        userRepository.findUserById(jsonUser.id),
        userRepository.findUserByProviderIdentity(
          jsonUser.provider,
          jsonUser.providerUserId
        ),
        userRepository.findUserWithAuthAndSajuById(jsonUser.id),
        userRepository.findSajuProfileByUserId(jsonUser.id),
      ]);

      userChecks += 1;
      compareValue(differences, "user", "id", jsonUser.id, byId?.id);
      compareValue(differences, "user", "display_name", jsonUser.name, byId?.name);
      compareValue(
        differences,
        "user",
        "created_at",
        toIsoTimestamp(jsonUser.createdAt),
        byId?.createdAt
      );
      compareValue(
        differences,
        "user",
        "identity_lookup_user",
        jsonUser.id,
        byIdentity?.id
      );
      compareValue(
        differences,
        "user",
        "identity_provider",
        jsonUser.provider,
        byIdentity?.authIdentity.provider
      );
      compareValue(
        differences,
        "user",
        "identity_provider_user_id",
        jsonUser.providerUserId,
        byIdentity?.authIdentity.providerUserId
      );
      compareValue(
        differences,
        "user",
        "combined_user",
        jsonUser.id,
        combined?.id
      );

      const combinedIdentity = combined?.authIdentities.find(
        (identity: { provider: AuthProvider; providerUserId: string }) =>
          identity.provider === jsonUser.provider &&
          identity.providerUserId === jsonUser.providerUserId
      );
      compareValue(
        differences,
        "user",
        "combined_identity",
        true,
        Boolean(combinedIdentity)
      );

      const expectedProfile = jsonUser.sajuProfile
        ? {
            userId: jsonUser.id,
            name: jsonUser.sajuProfile.name ?? null,
            birthDate: jsonUser.sajuProfile.birthDate,
            birthHour: jsonUser.sajuProfile.birthHour,
            birthMinute: jsonUser.sajuProfile.birthMinute,
            birthTimeUnknown: jsonUser.sajuProfile.birthTimeUnknown ?? false,
            calendarType: jsonUser.sajuProfile.calendarType,
            gender: jsonUser.sajuProfile.gender,
            updatedAt: null,
          }
        : null;
      compareValue(differences, "user", "saju_profile", expectedProfile, profile);
      compareValue(
        differences,
        "user",
        "combined_saju_profile",
        expectedProfile,
        combined?.sajuProfile ?? null
      );
      profileChecks += 1;

      if (byId) dbUsers.push({ id: byId.id, name: byId.name });
    }

    const validUserIds = new Set(users.map((user) => user.id));
    for (const jsonUser of users) {
      const expectedInvite = invites.find(
        (invite) => invite.ownerId === jsonUser.id
      );
      const byOwner = await friendRepository.findActiveInviteByOwnerUserId(
        jsonUser.id
      );

      compareValue(
        differences,
        "invite",
        "active_invite_presence",
        Boolean(expectedInvite),
        Boolean(byOwner)
      );

      if (expectedInvite) {
        const byCode = await friendRepository.findInviteByCode(expectedInvite.code);
        const expected = {
          code: expectedInvite.code,
          ownerUserId: expectedInvite.ownerId,
          isActive: true,
          createdAt: toIsoTimestamp(expectedInvite.createdAt),
        };
        compareValue(differences, "invite", "active_invite_by_owner", expected, byOwner);
        compareValue(differences, "invite", "invite_by_code", expected, byCode);
        inviteChecks += 1;
      }
    }

    for (const invite of invites.filter(
      (candidate) => !validUserIds.has(candidate.ownerId)
    )) {
      const orphanLookup = await friendRepository.findInviteByCode(invite.code);
      compareValue(differences, "invite", "orphan_invite_excluded", null, orphanLookup);
      orphanInviteChecks += 1;
    }

    const normalizedJsonConnections = connections.map(normalizeJsonConnection);
    for (const jsonUser of users) {
      const expectedConnections = normalizedJsonConnections.filter(
        (connection) =>
          connection.ownerUserId === jsonUser.id ||
          connection.friendUserId === jsonUser.id
      );
      const databaseConnections = (
        await friendRepository.findFriendConnectionsByUserId(jsonUser.id)
      ).map(normalizeDbConnection);

      compareValue(
        differences,
        "friend",
        "connection_order_and_snapshot",
        expectedConnections,
        databaseConnections
      );

      const jsonFriendList = friendMapper.mapFriendConnectionsForUser({
        userId: jsonUser.id,
        connections: expectedConnections,
        users,
        resolveFriendProfile,
      });
      const databaseFriendList = friendMapper.mapFriendConnectionsForUser({
        userId: jsonUser.id,
        connections: databaseConnections,
        users: dbUsers,
        resolveFriendProfile,
      });
      compareValue(
        differences,
        "friend",
        "application_friend_list",
        jsonFriendList,
        databaseFriendList
      );

      ownerDirectionChecks += expectedConnections.filter(
        (connection) => connection.ownerUserId === jsonUser.id
      ).length;
      friendDirectionChecks += expectedConnections.filter(
        (connection) => connection.friendUserId === jsonUser.id
      ).length;
      friendChecks += 1;

      const jsonCount = friendLimit.getStoredFriendCountForUser(
        connections,
        jsonUser.id
      );
      const databaseCount = await friendRepository.countStoredFriendsForUser(
        jsonUser.id
      );
      compareValue(
        differences,
        "friend_count",
        "stored_friend_count",
        jsonCount,
        databaseCount
      );
      friendCountChecks += 1;
    }

    const differenceCounts = differences.reduce<Record<string, number>>(
      (counts, difference) => {
        counts[difference.area] = (counts[difference.area] ?? 0) + 1;
        return counts;
      },
      {}
    );
    const result = {
      readOnly: true,
      shadowReadPassed: differences.length === 0,
      users: { checked: userChecks, profileChecks },
      invites: {
        activeChecked: inviteChecks,
        orphanExcludedChecked: orphanInviteChecks,
      },
      friends: {
        usersChecked: friendChecks,
        ownerDirectionRows: ownerDirectionChecks,
        friendDirectionRowsInCanonicalData: friendDirectionChecks,
        reverseDirectionCoveredByFixtureTest: true,
      },
      friendCounts: { usersChecked: friendCountChecks },
      differenceCounts,
      differences,
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.shadowReadPassed) process.exitCode = 1;
  } finally {
    await postgresModule.closePostgresClient();
  }
}

main().catch((error: unknown) => {
  const safeError = error as { code?: string; name?: string };
  console.error(
    JSON.stringify({
      readOnly: true,
      shadowReadPassed: false,
      code: safeError.code ?? "SHADOW_READ_VERIFICATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
