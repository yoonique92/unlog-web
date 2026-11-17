import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  unlockContentWithStones: vi.fn(),
}));

vi.mock("../db/repositories/stoneWriteRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  unlockContentWithStones: mocks.unlockContentWithStones,
}));

import {
  StoneWriteRepositoryError,
  type UnlockContentWithStonesInput,
} from "../db/repositories/stoneWriteRepository";
import {
  StoneServiceError,
  type UnlockStoneContentInput,
  unlockStoneContent,
} from "./stoneService";

const userId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000002";
const repositoryResult = {
  unlockId: "00000000-0000-4000-8000-000000000003",
  ledgerEntryId: "00000000-0000-4000-8000-000000000004",
  walletBalance: 4,
  created: true,
};

const yearlyInput: UnlockStoneContentInput = {
  userId,
  content: { kind: "yearlyFortune", year: 2027 },
  requestId: "request-2027-annual-fortune",
};

function repositoryInputAt(index: number) {
  return mocks.unlockContentWithStones.mock.calls[index][0] as UnlockContentWithStonesInput;
}

describe("stoneService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unlockContentWithStones.mockResolvedValue(repositoryResult);
  });

  it("applies the server-owned yearly fortune policy and returns the repository result", async () => {
    const maliciousInput = {
      ...yearlyInput,
      costStones: 999,
    } as UnlockStoneContentInput & { costStones: number };

    await expect(unlockStoneContent(maliciousInput)).resolves.toEqual(
      repositoryResult
    );

    expect(repositoryInputAt(0)).toMatchObject({
      userId,
      contentType: "yearly_fortune",
      contentKey: "2027",
      costStones: 1,
      metadata: {
        policyVersion: "stone-unlock-v1",
        contentKind: "yearlyFortune",
      },
    });
  });

  it("uses a friend connection UUID as the compatibility content identity", async () => {
    await unlockStoneContent({
      userId,
      content: {
        kind: "friendCompatibility",
        connectionId: connectionId.toUpperCase(),
      },
      requestId: "request-friend-compatibility",
    });

    expect(repositoryInputAt(0)).toMatchObject({
      contentType: "compatibility",
      contentKey: `connection:${connectionId}`,
      costStones: 1,
      metadata: {
        policyVersion: "stone-unlock-v1",
        contentKind: "friendCompatibility",
      },
    });
  });

  it("creates the same idempotency key and fingerprint for an exact retry", async () => {
    await unlockStoneContent(yearlyInput);
    await unlockStoneContent(yearlyInput);

    expect(repositoryInputAt(1).idempotencyKey).toBe(
      repositoryInputAt(0).idempotencyKey
    );
    expect(repositoryInputAt(1).requestFingerprint).toBe(
      repositoryInputAt(0).requestFingerprint
    );
  });

  it("keeps the request key stable but changes the fingerprint when content changes", async () => {
    await unlockStoneContent(yearlyInput);
    await unlockStoneContent({
      ...yearlyInput,
      content: { kind: "yearlyFortune", year: 2028 },
    });

    expect(repositoryInputAt(1).idempotencyKey).toBe(
      repositoryInputAt(0).idempotencyKey
    );
    expect(repositoryInputAt(1).requestFingerprint).not.toBe(
      repositoryInputAt(0).requestFingerprint
    );
  });

  it.each([
    { kind: "yearlyFortune", year: 99 },
    { kind: "friendCompatibility", connectionId: "not-a-uuid" },
    { kind: "unsupportedContent" },
  ])("rejects an unsupported content identity: $kind", async (content) => {
    await expect(
      unlockStoneContent({
        userId,
        content: content as UnlockStoneContentInput["content"],
        requestId: "invalid-content-request",
      })
    ).rejects.toMatchObject({
      name: "StoneServiceError",
      code: "INVALID_CONTENT",
    });
    expect(mocks.unlockContentWithStones).not.toHaveBeenCalled();
  });

  it("rejects an empty request identifier before calling the repository", async () => {
    await expect(
      unlockStoneContent({ ...yearlyInput, requestId: "   " })
    ).rejects.toMatchObject({
      name: "StoneServiceError",
      code: "INVALID_IDEMPOTENCY",
    });
    expect(mocks.unlockContentWithStones).not.toHaveBeenCalled();
  });

  it.each([
    "INSUFFICIENT_STONES",
    "STONE_IDEMPOTENCY_CONFLICT",
    "INVALID_CONTENT",
  ] as const)("maps repository error %s to a service error", async (code) => {
    const repositoryError = new StoneWriteRepositoryError(code);
    mocks.unlockContentWithStones.mockRejectedValue(repositoryError);

    await expect(unlockStoneContent(yearlyInput)).rejects.toEqual(
      expect.objectContaining<Partial<StoneServiceError>>({
        name: "StoneServiceError",
        code,
        cause: repositoryError,
      })
    );
  });

  it("does not disguise an unexpected repository error", async () => {
    const unexpected = new Error("connection closed");
    mocks.unlockContentWithStones.mockRejectedValue(unexpected);

    await expect(unlockStoneContent(yearlyInput)).rejects.toBe(unexpected);
  });
});
