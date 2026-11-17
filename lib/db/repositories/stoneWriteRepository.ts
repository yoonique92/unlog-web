import "server-only";

import { getPostgresClient } from "../postgres";

export type StoneMetadataValue =
  | null
  | string
  | number
  | boolean
  | readonly StoneMetadataValue[]
  | StoneMetadata;

export type StoneMetadata = {
  readonly [key: string]: StoneMetadataValue;
};

export type GrantStonesInput = {
  userId: string;
  amount: number;
  entryType: string;
  idempotencyKey: string;
  requestFingerprint: string;
  metadata?: StoneMetadata;
};

export type GrantStonesResult = {
  ledgerEntryId: string;
  walletBalance: number;
  created: boolean;
};

export type UnlockContentWithStonesInput = {
  userId: string;
  contentType: string;
  contentKey: string;
  costStones: number;
  idempotencyKey: string;
  requestFingerprint: string;
  metadata?: StoneMetadata;
};

export type UnlockContentWithStonesResult = {
  unlockId: string;
  ledgerEntryId: string;
  walletBalance: number;
  created: boolean;
};

export type StoneWriteRepositoryErrorCode =
  | "USER_NOT_FOUND"
  | "INVALID_STONE_AMOUNT"
  | "INVALID_STONE_ENTRY_TYPE"
  | "INVALID_CONTENT"
  | "INVALID_STONE_COST"
  | "INVALID_IDEMPOTENCY"
  | "STONE_IDEMPOTENCY_CONFLICT"
  | "INSUFFICIENT_STONES"
  | "STONE_MUTATION_REQUIRES_READ_COMMITTED"
  | "STONE_MUTATION_RESULT_MISSING";

export class StoneWriteRepositoryError extends Error {
  readonly code: StoneWriteRepositoryErrorCode;

  constructor(code: StoneWriteRepositoryErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "StoneWriteRepositoryError";
    this.code = code;
  }
}

type GrantStonesRow = {
  ledger_entry_id: string;
  wallet_balance: number;
  created: boolean;
};

type UnlockContentWithStonesRow = {
  unlock_id: string;
  ledger_entry_id: string;
  wallet_balance: number;
  created: boolean;
};

type PostgresErrorLike = Error & {
  code?: string;
};

const STONE_MUTATION_DATABASE_ERROR_CODES =
  new Set<StoneWriteRepositoryErrorCode>([
    "USER_NOT_FOUND",
    "INVALID_STONE_AMOUNT",
    "INVALID_STONE_ENTRY_TYPE",
    "INVALID_CONTENT",
    "INVALID_STONE_COST",
    "INVALID_IDEMPOTENCY",
    "STONE_IDEMPOTENCY_CONFLICT",
    "INSUFFICIENT_STONES",
    "STONE_MUTATION_REQUIRES_READ_COMMITTED",
  ]);

function getStoneMutationDatabaseErrorCode(
  error: unknown
): StoneWriteRepositoryErrorCode | null {
  if (!(error instanceof Error)) return null;
  const databaseError = error as PostgresErrorLike;
  if (databaseError.code !== "P0001") return null;
  if (
    !STONE_MUTATION_DATABASE_ERROR_CODES.has(
      error.message as StoneWriteRepositoryErrorCode
    )
  ) {
    return null;
  }
  return error.message as StoneWriteRepositoryErrorCode;
}

function mapExpectedDatabaseError(error: unknown): never {
  if (error instanceof StoneWriteRepositoryError) throw error;
  const code = getStoneMutationDatabaseErrorCode(error);
  if (code) throw new StoneWriteRepositoryError(code, { cause: error });
  throw error;
}

function mapGrantResult(row: GrantStonesRow): GrantStonesResult {
  return {
    ledgerEntryId: row.ledger_entry_id,
    walletBalance: row.wallet_balance,
    created: row.created,
  };
}

function mapUnlockResult(
  row: UnlockContentWithStonesRow
): UnlockContentWithStonesResult {
  return {
    unlockId: row.unlock_id,
    ledgerEntryId: row.ledger_entry_id,
    walletBalance: row.wallet_balance,
    created: row.created,
  };
}

/**
 * Grants positive stones only through PostgreSQL's atomic grant_stones
 * function. Pricing, authentication, and authorization belong above this
 * repository boundary.
 */
export async function grantStones(
  input: GrantStonesInput
): Promise<GrantStonesResult> {
  const sql = getPostgresClient();

  try {
    const rows = await sql<GrantStonesRow[]>`
      SELECT
        ledger_entry_id::text AS ledger_entry_id,
        wallet_balance,
        created
      FROM public.grant_stones(
        ${input.userId}::uuid,
        ${input.amount}::integer,
        ${input.entryType}::text,
        ${input.idempotencyKey}::text,
        ${input.requestFingerprint}::text,
        ${sql.json(input.metadata ?? {})}::jsonb
      )
    `;

    if (!rows[0]) {
      throw new StoneWriteRepositoryError("STONE_MUTATION_RESULT_MISSING");
    }

    return mapGrantResult(rows[0]);
  } catch (error) {
    return mapExpectedDatabaseError(error);
  }
}

/**
 * Deducts stones and creates an entitlement only through PostgreSQL's atomic
 * unlock_content_with_stones function. The caller supplies server-owned cost
 * and content identity values.
 */
export async function unlockContentWithStones(
  input: UnlockContentWithStonesInput
): Promise<UnlockContentWithStonesResult> {
  const sql = getPostgresClient();

  try {
    const rows = await sql<UnlockContentWithStonesRow[]>`
      SELECT
        unlock_id::text AS unlock_id,
        ledger_entry_id::text AS ledger_entry_id,
        wallet_balance,
        created
      FROM public.unlock_content_with_stones(
        ${input.userId}::uuid,
        ${input.contentType}::text,
        ${input.contentKey}::text,
        ${input.costStones}::integer,
        ${input.idempotencyKey}::text,
        ${input.requestFingerprint}::text,
        ${sql.json(input.metadata ?? {})}::jsonb
      )
    `;

    if (!rows[0]) {
      throw new StoneWriteRepositoryError("STONE_MUTATION_RESULT_MISSING");
    }

    return mapUnlockResult(rows[0]);
  } catch (error) {
    return mapExpectedDatabaseError(error);
  }
}
