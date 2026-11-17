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

type UserKey = {
  id: string;
  provider: "kakao" | "naver" | "google";
};
type ConnectionKey = { id: string; owner_user_id: string };
type CountRow = { table_name: string; row_count: number };

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
  const userService = await import(
    new URL("../lib/dataSource/postgresUserService.ts", import.meta.url).href
  );
  const friendService = await import(
    new URL("../lib/dataSource/postgresFriendService.ts", import.meta.url).href
  );
  const sql = postgresModule.getPostgresClient();

  const readCounts = async () =>
    (await sql.unsafe(`
      SELECT 'users' AS table_name, count(*)::integer AS row_count FROM public.users
      UNION ALL SELECT 'auth_identities', count(*)::integer FROM public.auth_identities
      UNION ALL SELECT 'saju_profiles', count(*)::integer FROM public.saju_profiles
      UNION ALL SELECT 'friend_invites', count(*)::integer FROM public.friend_invites
      UNION ALL SELECT 'friend_connections', count(*)::integer FROM public.friend_connections
      UNION ALL SELECT 'friend_connection_profiles', count(*)::integer FROM public.friend_connection_profiles
      ORDER BY table_name
    `)) as CountRow[];

  try {
    const beforeCounts = await readCounts();
    const users = (await sql<UserKey[]>`
      SELECT u.id::text AS id, ai.provider
      FROM public.users u
      JOIN public.auth_identities ai ON ai.user_id = u.id
      ORDER BY u.id, ai.created_at
      LIMIT 1
    `) as UserKey[];
    const connections = (await sql<ConnectionKey[]>`
      SELECT id::text AS id, owner_user_id::text AS owner_user_id
      FROM public.friend_connections
      ORDER BY id
      LIMIT 1
    `) as ConnectionKey[];

    if (!users[0] || !connections[0]) {
      throw new Error("Canonical read-service fixtures are missing.");
    }

    const [authMe, friends] = await Promise.all([
      userService.getAuthMeUserFromPostgres(users[0].id, users[0].provider),
      friendService.getFriendsFromPostgres(connections[0].owner_user_id),
    ]);
    const afterCounts = await readCounts();
    const countsUnchanged =
      JSON.stringify(beforeCounts) === JSON.stringify(afterCounts);
    const authMeValid = authMe.found && authMe.response.user.id === users[0].id;
    const friendListValid = friends.friends.some(
      (friend: { connectionId: string }) =>
        friend.connectionId === connections[0].id
    );

    console.log(
      JSON.stringify({
        readOnly: true,
        authMeValid,
        friendListValid,
        countsUnchanged,
      })
    );

    if (!authMeValid || !friendListValid || !countsUnchanged) {
      process.exitCode = 1;
    }
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
      code: safeError.code ?? "POSTGRES_SERVICE_READ_VERIFICATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
