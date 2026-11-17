import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import {
  findStoneContentStateForUser,
  findStoneWalletBalanceForUser,
} from "./stoneReadRepository";

const userId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const unlockId = "00000000-0000-4000-8000-000000000003";
const content = {
  contentType: "yearly_fortune" as const,
  contentKey: "2027",
};

function createFakeClient(rows: unknown[]) {
  const queries: Array<{ text: string; values: unknown[] }> = [];
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({
      text: strings.join("?").replace(/\s+/g, " ").trim(),
      values,
    });
    return Promise.resolve(rows);
  };
  mocks.getPostgresClient.mockReturnValue(sql as never);
  return queries;
}

describe("stoneReadRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a missing wallet and unlock as balance zero and locked", async () => {
    createFakeClient([{ wallet_balance: 0, unlock_id: null }]);

    await expect(
      findStoneContentStateForUser(userId, content)
    ).resolves.toEqual({
      walletBalance: 0,
      unlocked: false,
      unlockId: null,
    });
  });

  it("reads a missing wallet as balance zero without creating one", async () => {
    const queries = createFakeClient([{ wallet_balance: 0 }]);

    await expect(findStoneWalletBalanceForUser(userId)).resolves.toBe(0);

    expect(queries[0].values).toEqual([userId]);
    expect(queries[0].text).toContain("COALESCE(usw.balance, 0)");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it("returns the canonical wallet balance for only the requested user", async () => {
    const queries = createFakeClient([{ wallet_balance: 5 }]);

    await expect(findStoneWalletBalanceForUser(otherUserId)).resolves.toBe(5);

    expect(queries[0].values).toEqual([otherUserId]);
    expect(queries[0].text).toContain("usw.user_id = u.id");
  });

  it("returns null for a wallet lookup when the canonical user is missing", async () => {
    createFakeClient([]);

    await expect(findStoneWalletBalanceForUser(userId)).resolves.toBeNull();
  });

  it("returns the stored wallet balance and existing unlock", async () => {
    createFakeClient([{ wallet_balance: 5, unlock_id: unlockId }]);

    await expect(
      findStoneContentStateForUser(userId, content)
    ).resolves.toEqual({
      walletBalance: 5,
      unlocked: true,
      unlockId,
    });
  });

  it("returns null when the canonical user does not exist", async () => {
    createFakeClient([]);

    await expect(
      findStoneContentStateForUser(userId, content)
    ).resolves.toBeNull();
  });

  it("scopes wallet and unlock joins to the requested canonical user", async () => {
    const queries = createFakeClient([
      { wallet_balance: 0, unlock_id: null },
    ]);

    await findStoneContentStateForUser(otherUserId, content);

    expect(queries).toHaveLength(1);
    expect(queries[0].values).toEqual([
      content.contentType,
      content.contentKey,
      otherUserId,
    ]);
    expect(queries[0].text).toContain("cu.user_id = u.id");
    expect(queries[0].text).toContain("usw.user_id = u.id");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });
});
