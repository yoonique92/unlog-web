import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSajuProfileByUserId: vi.fn(),
  findStoneContentStateForUser: vi.fn(),
  getSaju: vi.fn(),
  getYearlyInterpretation: vi.fn(),
}));

vi.mock("../db/repositories/userRepository", () => ({
  findSajuProfileByUserId: mocks.findSajuProfileByUserId,
}));

vi.mock("../db/repositories/stoneReadRepository", () => ({
  findStoneContentStateForUser: mocks.findStoneContentStateForUser,
}));

vi.mock("../saju", () => ({ getSaju: mocks.getSaju }));

vi.mock("../yearlyInterpretation", () => ({
  getYearlyInterpretation: mocks.getYearlyInterpretation,
}));

import { getYearlyFortuneForUser } from "./yearlyFortuneReadService";

const userId = "00000000-0000-4000-8000-000000000001";
const year = 2027;
const profile = {
  userId,
  name: null,
  birthDate: "1990-01-02",
  birthHour: 10,
  birthMinute: 30,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "male",
  updatedAt: null,
};
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

describe("yearlyFortuneReadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSajuProfileByUserId.mockResolvedValue(profile);
    mocks.findStoneContentStateForUser.mockResolvedValue({
      walletBalance: 2,
      unlocked: false,
      unlockId: null,
    });
    mocks.getSaju.mockReturnValue({
      dayStem: "갑",
      normalizedSaju: {
        seyun: [
          {
            year,
            ganzhi: "정미",
            stemTenGod: "정인",
            branchTenGod: "정관",
          },
        ],
        currentDaeun: {
          ganzhi: "병오",
          stemTenGod: "식신",
          branchTenGod: "정재",
        },
      },
    });
    mocks.getYearlyInterpretation.mockReturnValue(interpretation);
  });

  it("returns profile-required without calculating paid content", async () => {
    mocks.findSajuProfileByUserId.mockResolvedValue(null);

    await expect(getYearlyFortuneForUser(userId, year)).resolves.toEqual({
      found: true,
      profileReady: false,
    });
    expect(mocks.getSaju).not.toHaveBeenCalled();
    expect(mocks.getYearlyInterpretation).not.toHaveBeenCalled();
  });

  it("returns only entitlement state while locked and never builds interpretation", async () => {
    const result = await getYearlyFortuneForUser(userId, year);

    expect(result).toEqual({
      found: true,
      profileReady: true,
      walletBalance: 2,
      unlocked: false,
      unlockId: null,
      interpretation: null,
    });
    expect(mocks.findStoneContentStateForUser).toHaveBeenCalledWith(userId, {
      contentType: "yearly_fortune",
      contentKey: String(year),
    });
    expect(mocks.getYearlyInterpretation).not.toHaveBeenCalled();
  });

  it("builds interpretation only after the canonical unlock is present", async () => {
    mocks.findStoneContentStateForUser.mockResolvedValue({
      walletBalance: 1,
      unlocked: true,
      unlockId: "unlock-id",
    });

    await expect(getYearlyFortuneForUser(userId, year)).resolves.toEqual({
      found: true,
      profileReady: true,
      walletBalance: 1,
      unlocked: true,
      unlockId: "unlock-id",
      interpretation,
    });
    expect(mocks.getYearlyInterpretation).toHaveBeenCalledTimes(1);
  });

  it("prevents unlocking when the requested year cannot be calculated", async () => {
    mocks.getSaju.mockReturnValue({
      dayStem: "갑",
      normalizedSaju: { seyun: [], currentDaeun: undefined },
    });

    await expect(getYearlyFortuneForUser(userId, year)).resolves.toEqual({
      found: true,
      profileReady: false,
    });
    expect(mocks.getYearlyInterpretation).not.toHaveBeenCalled();
  });

  it("distinguishes a missing canonical user", async () => {
    mocks.findStoneContentStateForUser.mockResolvedValue(null);

    await expect(getYearlyFortuneForUser(userId, year)).resolves.toEqual({
      found: false,
    });
    expect(mocks.getSaju).not.toHaveBeenCalled();
  });
});
