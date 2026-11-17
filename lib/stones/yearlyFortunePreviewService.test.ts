import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSajuProfileByUserId: vi.fn(),
  getSaju: vi.fn(),
  getYearlyInterpretation: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../db/repositories/userRepository", () => ({
  findSajuProfileByUserId: mocks.findSajuProfileByUserId,
}));
vi.mock("../saju", () => ({ getSaju: mocks.getSaju }));
vi.mock("../yearlyInterpretation", () => ({
  getYearlyInterpretation: mocks.getYearlyInterpretation,
}));

import { getYearlyFortunePreviewForUser } from "./yearlyFortunePreviewService";

describe("getYearlyFortunePreviewForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSajuProfileByUserId.mockResolvedValue({
      birthDate: "1992-01-14",
      birthHour: 13,
      birthMinute: 0,
      birthTimeUnknown: false,
      calendarType: "solar",
      gender: "female",
    });
    mocks.getSaju.mockReturnValue({
      dayStem: "갑",
      normalizedSaju: {
        seyun: [
          {
            year: 2027,
            ganzhi: "정미",
            stemTenGod: "상관",
            branchTenGod: "정재",
          },
        ],
        currentDaeun: null,
      },
    });
    mocks.getYearlyInterpretation.mockReturnValue({
      headline: "실력을 성과와 수익으로 연결하기 좋은 해",
      summary: "표현력과 실행력이 실제 성과로 이어질 가능성이 커지는 흐름이에요.",
      relationship: "유료 관계 상세",
      money: "유료 금전 상세",
      career: "유료 커리어 상세",
      action: "유료 행동 상세",
      caution: "유료 주의 상세",
      keywords: ["상관", "정재"],
    });
  });

  it("derives a two-sentence teaser without returning paid fields", async () => {
    const result = await getYearlyFortunePreviewForUser("user-id", 2027);

    expect(result).toEqual({
      profileReady: true,
      preview: {
        year: 2027,
        text: "실력을 성과와 수익으로 연결하기 좋은 해예요. 표현력과 실행력이 실제 성과로 이어질 가능성이 커지는 흐름이에요.",
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /유료 관계|유료 금전|유료 커리어|유료 행동|유료 주의|keywords/
    );
  });
});
