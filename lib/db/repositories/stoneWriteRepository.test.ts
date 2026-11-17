import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import {
  grantStones,
  unlockContentWithStones,
  type GrantStonesInput,
  type StoneWriteRepositoryErrorCode,
  type UnlockContentWithStonesInput,
} from "./stoneWriteRepository";

const userId = "00000000-0000-4000-8000-000000000001";
const ledgerEntryId = "00000000-0000-4000-8000-000000000002";
const unlockId = "00000000-0000-4000-8000-000000000003";

const grantInput: GrantStonesInput = {
  userId,
  amount: 5,
  entryType: "admin_grant",
  idempotencyKey: "grant-request-1",
  requestFingerprint: "grant-fingerprint-1",
  metadata: { reason: "test", nested: { enabled: true } },
};

const unlockInput: UnlockContentWithStonesInput = {
  userId,
  contentType: "yearly_fortune",
  contentKey: "2027",
  costStones: 1,
  idempotencyKey: "unlock-request-1",
  requestFingerprint: "unlock-fingerprint-1",
  metadata: { source: "test" },
};

type FakeClientOptions = {
  rows?: unknown[];
  error?: Error & { code?: string };
};

function createFakeClient({ rows = [], error }: FakeClientOptions = {}) {
  const queries: Array<{ text: string; values: unknown[] }> = [];
  const json = vi.fn((value: unknown) => ({ jsonValue: value }));
  const execute = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({
      text: strings.join("?").replace(/\s+/g, " ").trim(),
      values,
    });
    return error ? Promise.reject(error) : Promise.resolve(rows);
  };
  const sql = Object.assign(execute, { json });
  mocks.getPostgresClient.mockReturnValue(sql as never);
  return { queries, json };
}

describe("stoneWriteRepository", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("calls grant_stones and maps its result to camelCase", async () => {
    const { queries, json } = createFakeClient({
      rows: [
        {
          ledger_entry_id: ledgerEntryId,
          wallet_balance: 5,
          created: true,
        },
      ],
    });

    await expect(grantStones(grantInput)).resolves.toEqual({
      ledgerEntryId,
      walletBalance: 5,
      created: true,
    });
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("public.grant_stones");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
    expect(queries[0].values.slice(0, 5)).toEqual([
      grantInput.userId,
      grantInput.amount,
      grantInput.entryType,
      grantInput.idempotencyKey,
      grantInput.requestFingerprint,
    ]);
    expect(json).toHaveBeenCalledWith(grantInput.metadata);
  });

  it("calls unlock_content_with_stones and maps its result to camelCase", async () => {
    const { queries, json } = createFakeClient({
      rows: [
        {
          unlock_id: unlockId,
          ledger_entry_id: ledgerEntryId,
          wallet_balance: 4,
          created: false,
        },
      ],
    });

    await expect(unlockContentWithStones(unlockInput)).resolves.toEqual({
      unlockId,
      ledgerEntryId,
      walletBalance: 4,
      created: false,
    });
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("public.unlock_content_with_stones");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
    expect(queries[0].values.slice(0, 6)).toEqual([
      unlockInput.userId,
      unlockInput.contentType,
      unlockInput.contentKey,
      unlockInput.costStones,
      unlockInput.idempotencyKey,
      unlockInput.requestFingerprint,
    ]);
    expect(json).toHaveBeenCalledWith(unlockInput.metadata);
  });

  it("passes an empty metadata object when metadata is omitted", async () => {
    const { json } = createFakeClient({
      rows: [
        {
          ledger_entry_id: ledgerEntryId,
          wallet_balance: 5,
          created: true,
        },
      ],
    });
    const inputWithoutMetadata: GrantStonesInput = {
      userId: grantInput.userId,
      amount: grantInput.amount,
      entryType: grantInput.entryType,
      idempotencyKey: grantInput.idempotencyKey,
      requestFingerprint: grantInput.requestFingerprint,
    };

    await grantStones(inputWithoutMetadata);

    expect(json).toHaveBeenCalledWith({});
  });

  it.each<StoneWriteRepositoryErrorCode>([
    "USER_NOT_FOUND",
    "INVALID_STONE_AMOUNT",
    "INVALID_STONE_ENTRY_TYPE",
    "INVALID_CONTENT",
    "INVALID_STONE_COST",
    "INVALID_IDEMPOTENCY",
    "STONE_IDEMPOTENCY_CONFLICT",
    "INSUFFICIENT_STONES",
    "STONE_MUTATION_REQUIRES_READ_COMMITTED",
  ])("maps the expected database error %s", async (code) => {
    const databaseError = Object.assign(new Error(code), { code: "P0001" });
    createFakeClient({ error: databaseError });

    await expect(grantStones(grantInput)).rejects.toEqual(
      expect.objectContaining({
        name: "StoneWriteRepositoryError",
        code,
        cause: databaseError,
      })
    );
  });

  it("does not relabel an unexpected database error", async () => {
    const databaseError = Object.assign(new Error("connection closed"), {
      code: "CONNECTION_CLOSED",
    });
    createFakeClient({ error: databaseError });

    await expect(unlockContentWithStones(unlockInput)).rejects.toBe(databaseError);
  });

  it("reports empty function results explicitly", async () => {
    createFakeClient();
    await expect(grantStones(grantInput)).rejects.toMatchObject({
      name: "StoneWriteRepositoryError",
      code: "STONE_MUTATION_RESULT_MISSING",
    });

    createFakeClient();
    await expect(unlockContentWithStones(unlockInput)).rejects.toMatchObject({
      name: "StoneWriteRepositoryError",
      code: "STONE_MUTATION_RESULT_MISSING",
    });
  });
});
