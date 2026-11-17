import "server-only";

import postgres, { type Sql } from "postgres";

type PostgresGlobal = typeof globalThis & {
  __unlogPostgresClient?: Sql;
};

const postgresGlobal = globalThis as PostgresGlobal;
let productionClient: Sql | undefined;

function createPostgresClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return postgres(databaseUrl, {
    prepare: false,
    max: 10,
    connect_timeout: 15,
    idle_timeout: 20,
  });
}

export function getPostgresClient() {
  if (process.env.NODE_ENV !== "production") {
    postgresGlobal.__unlogPostgresClient ??= createPostgresClient();
    return postgresGlobal.__unlogPostgresClient;
  }

  productionClient ??= createPostgresClient();
  return productionClient;
}

export async function closePostgresClient() {
  const client =
    process.env.NODE_ENV !== "production"
      ? postgresGlobal.__unlogPostgresClient
      : productionClient;

  if (!client) return;
  await client.end({ timeout: 5 });

  if (process.env.NODE_ENV !== "production") {
    delete postgresGlobal.__unlogPostgresClient;
  } else {
    productionClient = undefined;
  }
}
