import "server-only";

export type PostgresServiceOperation =
  | "oauth-user"
  | "auth-me"
  | "save-saju"
  | "friend-invite"
  | "friend-register"
  | "friend-connect"
  | "friend-list"
  | "friend-delete";

export class PostgresServiceInternalError extends Error {
  readonly code = "POSTGRES_SERVICE_INTERNAL_ERROR";
  readonly operation: PostgresServiceOperation;

  constructor(
    operation: PostgresServiceOperation,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "PostgresServiceInternalError";
    this.operation = operation;
  }
}

export function throwPostgresServiceInternalError(
  operation: PostgresServiceOperation,
  cause: unknown,
  message = `PostgreSQL ${operation} service failed.`
): never {
  if (cause instanceof PostgresServiceInternalError) throw cause;
  throw new PostgresServiceInternalError(operation, message, { cause });
}
