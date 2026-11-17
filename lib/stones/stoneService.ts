import "server-only";

import { createHash } from "node:crypto";

import {
  StoneWriteRepositoryError,
  type StoneWriteRepositoryErrorCode,
  type UnlockContentWithStonesResult,
  unlockContentWithStones,
} from "../db/repositories/stoneWriteRepository";
import {
  resolveStoneContentPolicy,
  STONE_UNLOCK_POLICY_VERSION,
  type ResolvedStoneContentPolicy,
  type StoneUnlockContent,
} from "./stoneContentPolicy";

export type { StoneUnlockContent } from "./stoneContentPolicy";

export type UnlockStoneContentInput = {
  userId: string;
  content: StoneUnlockContent;
  /**
   * An opaque request identifier that must be reused by the caller when the
   * same logical request is retried. It is never used as the fingerprint.
   */
  requestId: string;
};

export type UnlockStoneContentResult = UnlockContentWithStonesResult;

export type StoneServiceErrorCode = StoneWriteRepositoryErrorCode;

export class StoneServiceError extends Error {
  readonly code: StoneServiceErrorCode;

  constructor(code: StoneServiceErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "StoneServiceError";
    this.code = code;
  }
}

function throwStoneServiceError(code: StoneServiceErrorCode): never {
  throw new StoneServiceError(code);
}

function createDigest(value: readonly unknown[]) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function createIdempotencyKey(requestId: string) {
  return `${STONE_UNLOCK_POLICY_VERSION}:request:${createDigest([
    "unlock_content",
    requestId,
  ])}`;
}

function createRequestFingerprint(
  userId: string,
  policy: ResolvedStoneContentPolicy
) {
  return `${STONE_UNLOCK_POLICY_VERSION}:fingerprint:${createDigest([
    "unlock_content",
    userId.toLowerCase(),
    policy.contentType,
    policy.contentKey,
    policy.costStones,
  ])}`;
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof StoneServiceError) throw error;
  if (error instanceof StoneWriteRepositoryError) {
    throw new StoneServiceError(error.code, { cause: error });
  }
  throw error;
}

/**
 * Applies the server-owned v1 unlock policy, then delegates the entire atomic
 * balance/ledger/entitlement mutation to PostgreSQL through the repository.
 */
export async function unlockStoneContent(
  input: UnlockStoneContentInput
): Promise<UnlockStoneContentResult> {
  if (typeof input.requestId !== "string" || input.requestId.trim().length === 0) {
    return throwStoneServiceError("INVALID_IDEMPOTENCY");
  }

  const policy = resolveStoneContentPolicy(input.content);
  if (!policy) return throwStoneServiceError("INVALID_CONTENT");

  try {
    return await unlockContentWithStones({
      userId: input.userId,
      contentType: policy.contentType,
      contentKey: policy.contentKey,
      costStones: policy.costStones,
      idempotencyKey: createIdempotencyKey(input.requestId),
      requestFingerprint: createRequestFingerprint(input.userId, policy),
      metadata: policy.metadata,
    });
  } catch (error) {
    return mapRepositoryError(error);
  }
}
