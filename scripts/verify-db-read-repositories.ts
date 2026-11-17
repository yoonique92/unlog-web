import { existsSync } from "node:fs";
import * as nodeModule from "node:module";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

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

type CountRow = { table_name: string; row_count: number };
type UserKey = {
  id: string;
  provider: "kakao" | "naver" | "google";
  provider_user_id: string;
};
type InviteKey = { code: string; owner_user_id: string };
type ConnectionKey = {
  id: string;
  owner_user_id: string;
  friend_user_id: string | null;
  profile_dedupe_key: string;
};

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
loadEnvConfig(process.cwd(), false);

async function main() {
  const postgresModule = await import(
    new URL("../lib/db/postgres.ts", import.meta.url).href
  );
  const userRepository = await import(
    new URL("../lib/db/repositories/userRepository.ts", import.meta.url).href
  );
  const friendRepository = await import(
    new URL("../lib/db/repositories/friendRepository.ts", import.meta.url).href
  );

  const sql = postgresModule.getPostgresClient();

  try {
    const counts = (await sql.unsafe(`
      SELECT 'users' AS table_name, count(*)::integer AS row_count FROM public.users
      UNION ALL SELECT 'auth_identities', count(*)::integer FROM public.auth_identities
      UNION ALL SELECT 'saju_profiles', count(*)::integer FROM public.saju_profiles
      UNION ALL SELECT 'friend_invites', count(*)::integer FROM public.friend_invites
      UNION ALL SELECT 'friend_connections', count(*)::integer FROM public.friend_connections
      UNION ALL SELECT 'friend_connection_profiles', count(*)::integer FROM public.friend_connection_profiles
      ORDER BY table_name
    `)) as CountRow[];
    const userKeys = (await sql`
      SELECT u.id::text AS id, ai.provider, ai.provider_user_id
      FROM public.users u
      JOIN public.auth_identities ai ON ai.user_id = u.id
      ORDER BY u.id, ai.provider
    `) as UserKey[];
    const inviteKeys = (await sql`
      SELECT code, owner_user_id::text AS owner_user_id
      FROM public.friend_invites
      ORDER BY code
    `) as InviteKey[];
    const connectionKeys = (await sql`
      SELECT
        id::text AS id,
        owner_user_id::text AS owner_user_id,
        friend_user_id::text AS friend_user_id,
        profile_dedupe_key
      FROM public.friend_connections
      ORDER BY id
    `) as ConnectionKey[];

    const userChecks = await Promise.all(
      userKeys.map(async (key) => {
        const [user, byIdentity, combined, profile] = await Promise.all([
          userRepository.findUserById(key.id),
          userRepository.findUserByProviderIdentity(
            key.provider,
            key.provider_user_id
          ),
          userRepository.findUserWithAuthAndSajuById(key.id),
          userRepository.findSajuProfileByUserId(key.id),
        ]);
        return {
          userFound: user?.id === key.id,
          identityFound: byIdentity?.id === key.id,
          combinedFound:
            combined?.id === key.id && combined.authIdentities.length > 0,
          profilePresenceConsistent:
            (combined?.sajuProfile === null) === (profile === null),
        };
      })
    );

    const inviteChecks = await Promise.all(
      inviteKeys.map(async (key) => {
        const [byCode, byOwner] = await Promise.all([
          friendRepository.findInviteByCode(key.code),
          friendRepository.findActiveInviteByOwnerUserId(key.owner_user_id),
        ]);
        return (
          byCode?.code === key.code &&
          byCode.isActive &&
          byOwner?.ownerUserId === key.owner_user_id &&
          byOwner.isActive
        );
      })
    );

    const connectionChecks = await Promise.all(
      connectionKeys.map(async (key) => {
        const [byId, byOwnerAndDedupe, ownerConnections, ownerCount] =
          await Promise.all([
          friendRepository.findFriendConnectionWithProfileById(key.id),
          friendRepository.findFriendConnectionByOwnerAndDedupeKey(
            key.owner_user_id,
            key.profile_dedupe_key
          ),
          friendRepository.findFriendConnectionsByUserId(key.owner_user_id),
          friendRepository.countStoredFriendsForUser(key.owner_user_id),
        ]);
        const missingDedupe =
          await friendRepository.findFriendConnectionByOwnerAndDedupeKey(
            key.owner_user_id,
            `missing:${key.id}`
          );
        const friendSide = key.friend_user_id
          ? await friendRepository.findFriendConnectionsByUserId(key.friend_user_id)
          : [];
        return (
          byId?.id === key.id &&
          byOwnerAndDedupe?.id === key.id &&
          missingDedupe === null &&
          ownerConnections.some((connection: { id: string }) => connection.id === key.id) &&
          ownerCount === ownerConnections.length &&
          (key.friend_user_id === null ||
            friendSide.some((connection: { id: string }) => connection.id === key.id))
        );
      })
    );

    const missingUserId = "00000000-0000-4000-8000-000000000000";
    const orderedUserIds = userKeys.slice(0, 2).map((user) => user.id).reverse();
    const batchUsers = await userRepository.findUsersByIds([
      ...orderedUserIds,
      orderedUserIds[0],
      missingUserId,
    ]);
    const batchUsersValid =
      batchUsers.length === orderedUserIds.length &&
      batchUsers.every(
        (user: { id: string }, index: number) => user.id === orderedUserIds[index]
      );

    const countMap = Object.fromEntries(
      counts.map((row) => [row.table_name, Number(row.row_count)])
    );
    const expectedCounts =
      countMap.users === 3 &&
      countMap.auth_identities === 3 &&
      countMap.saju_profiles === 1 &&
      countMap.friend_invites === 3 &&
      countMap.friend_connections === 1 &&
      countMap.friend_connection_profiles === 1;
    const repositoriesValid =
      userChecks.every((check) => Object.values(check).every(Boolean)) &&
      batchUsersValid &&
      inviteChecks.every(Boolean) &&
      connectionChecks.every(Boolean);

    console.log(
      JSON.stringify({
        readOnly: true,
        expectedCounts,
        repositoriesValid,
        counts: countMap,
        userLookupsValid: userChecks.every((check) =>
          Object.values(check).every(Boolean)
        ),
        batchUserLookupValid: batchUsersValid,
        inviteLookupsValid: inviteChecks.every(Boolean),
        friendLookupsValid: connectionChecks.every(Boolean),
      })
    );

    if (!expectedCounts || !repositoriesValid) process.exitCode = 1;
  } finally {
    await postgresModule.closePostgresClient();
  }
}

main().catch((error: unknown) => {
  const safeError = error as { code?: string; name?: string };
  console.error(
    JSON.stringify({
      readOnly: true,
      success: false,
      code: safeError.code ?? "READ_REPOSITORY_VERIFICATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
