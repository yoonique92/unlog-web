import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findStoneWalletBalanceForUser: vi.fn(),
}));

vi.mock("../../../../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../../../../lib/db/repositories/stoneReadRepository", () => ({
  findStoneWalletBalanceForUser: mocks.findStoneWalletBalanceForUser,
}));

import { GET } from "./route";

const userId = "00000000-0000-4000-8000-000000000001";

describe("GET /api/stones/wallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({
      id: userId,
      name: "사용자",
      provider: "kakao",
    });
    mocks.findStoneWalletBalanceForUser.mockResolvedValue(0);
  });

  it("returns zero when the authenticated user has no wallet", async () => {
    const response = await GET();

    expect(mocks.findStoneWalletBalanceForUser).toHaveBeenCalledWith(userId);
    await expect(response.json()).resolves.toEqual({
      success: true,
      walletBalance: 0,
    });
  });

  it("returns the authenticated user's canonical balance", async () => {
    mocks.findStoneWalletBalanceForUser.mockResolvedValue(5);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      success: true,
      walletBalance: 5,
    });
  });

  it("does not accept a browser-supplied user id", async () => {
    await GET();

    expect(mocks.findStoneWalletBalanceForUser).toHaveBeenCalledTimes(1);
    expect(mocks.findStoneWalletBalanceForUser).toHaveBeenCalledWith(userId);
  });

  it("preserves the unauthenticated state without reading a wallet", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.findStoneWalletBalanceForUser).not.toHaveBeenCalled();
  });

  it("treats a missing canonical user as unauthenticated", async () => {
    mocks.findStoneWalletBalanceForUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns a generic error without exposing database details", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.findStoneWalletBalanceForUser.mockRejectedValue(
      new Error("sensitive database detail")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "운석 잔액을 불러오지 못했어요.",
    });
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
    consoleError.mockRestore();
  });
});
