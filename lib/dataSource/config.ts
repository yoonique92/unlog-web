import "server-only";

export type ProductionDataSource = "json" | "postgres";

const POSTGRES_SOURCE_ENV = "UNLOG_POSTGRES_SOURCE_V1";

export function getProductionDataSource(): ProductionDataSource {
  return process.env[POSTGRES_SOURCE_ENV] === "true" ? "postgres" : "json";
}

export function isPostgresSourceEnabled(): boolean {
  return getProductionDataSource() === "postgres";
}
