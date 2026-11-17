import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  getYearlyFortuneForUser: vi.fn(),
}));

vi.mock("../../../../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../../../../lib/stones/yearlyFortuneReadService", () => ({
  getYearlyFortuneForUser: mocks.getYearlyFortuneForUser,
}));

import { GET } from "./route";

const userId = "00000000-0000-4000-8000-000000000001";
const year = 2027;
const interpretation = {
  yearGanzhi: "정미",
  dayStem: "갑",
  currentDaeunGanzhi: "병오",
  headline: "서버 해석",
  summary: "요약",
  career: "직업",
  money: "금전",
  relationship: "관계",
  caution: "주의",
  action: "행동",
  keywords: ["정인"],
};

function request(query = `year=${year}`) {
  return new Request(`http://localhost/api/saju/yearly?${query}`);
}

describe("GET /api/saju/yearly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({
      id: userId,
      name: "사용자",
      provider: "kakao",
    });
    mocks.getYearlyFortuneForUser.mockResolvedValue({
      found: true,
      profileReady: true,
      walletBalance: 2,
      unlocked: false,
      unlockId: null,
      interpretation: null,
    });
  });

  it("uses only the authenticated session user", async () => {
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(mocks.getYearlyFortuneForUser).toHaveBeenCalledWith(userId, year);
    await expect(response.json()).resolves.toEqual({
      success: true,
      profileReady: true,
      walletBalance: 2,
      unlocked: false,
      unlockId: null,
      interpretation: null,
    });
  });

  it("does not return paid interpretation for a locked content", async () => {
    const body = await (await GET(request())).json();

    expect(body.interpretation).toBeNull();
    expect(JSON.stringify(body)).not.toContain("headline");
    expect(JSON.stringify(body)).not.toContain("birthDate");
  });

  it("returns interpretation after the service verifies the entitlement", async () => {
    mocks.getYearlyFortuneForUser.mockResolvedValue({
      found: true,
      profileReady: true,
      walletBalance: 1,
      unlocked: true,
      unlockId: "unlock-id",
      interpretation,
    });

    await expect((await GET(request())).json()).resolves.toMatchObject({
      success: true,
      unlocked: true,
      interpretation,
    });
  });

  it("returns only the profile-required state when no canonical profile exists", async () => {
    mocks.getYearlyFortuneForUser.mockResolvedValue({
      found: true,
      profileReady: false,
    });

    await expect((await GET(request())).json()).resolves.toEqual({
      success: true,
      profileReady: false,
    });
  });

  it("rejects unauthenticated and client-selected user requests", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);

    mocks.getSessionUser.mockResolvedValue({
      id: userId,
      name: "사용자",
      provider: "kakao",
    });
    const suppliedUser = await GET(request(`year=${year}&userId=someone-else`));
    expect(suppliedUser.status).toBe(400);
  });

  it("maps a missing canonical user to 401", async () => {
    mocks.getYearlyFortuneForUser.mockResolvedValue({ found: false });

    expect((await GET(request())).status).toBe(401);
  });
});
