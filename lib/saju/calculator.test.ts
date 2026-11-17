import { describe, expect, it } from "vitest";
import { getTenGodForStem } from "../tenGodUtils";
import { calculateSajuRaw } from "./calculator";
import { normalizeSaju } from "./normalize";
import type { SajuCalculationInput } from "./types";

const KOREA_MINUS_30_REFERENCE_INPUT = {
  birthDate: "1992-01-14",
  birthTime: "13:00",
  calendar: "solar",
  gender: "female",
  timezone: "Asia/Seoul",
  targetYear: 2026,
} satisfies SajuCalculationInput;

const KOREA_MINUS_30_REFERENCE_INPUT_2 = {
  birthDate: "1994-03-15",
  birthTime: "14:30",
  calendar: "solar",
  gender: "male",
  timezone: "Asia/Seoul",
  targetYear: 2026,
} satisfies SajuCalculationInput;

function pillarText(
  pillar: ReturnType<typeof normalizeSaju>["pillars"]["year"],
) {
  return `${pillar.stem}${pillar.branch}`;
}

describe("KOREA_MINUS_30_V1", () => {
  it("1992-01-14 13:00 여성 기준 만세력 결과를 영구 회귀 기준으로 유지한다", () => {
    const calculated = calculateSajuRaw(KOREA_MINUS_30_REFERENCE_INPUT);
    const normalized = normalizeSaju(
      calculated,
      KOREA_MINUS_30_REFERENCE_INPUT,
    );

    expect(calculated.unlogTime).toEqual({
      original: { hour: 13, minute: 0 },
      adjusted: {
        year: 1992,
        month: 1,
        day: 14,
        hour: 12,
        minute: 30,
      },
      policy: "KOREA_MINUS_30_V1",
    });
    expect(calculated.raw.input.applyLocalMeanTime).toBe(false);
    expect({
      year: pillarText(normalized.pillars.year),
      month: pillarText(normalized.pillars.month),
      day: pillarText(normalized.pillars.day),
      hour: normalized.pillars.hour
        ? pillarText(normalized.pillars.hour)
        : null,
      dayMaster: normalized.dayMaster.stem,
    }).toEqual({
      year: "辛未",
      month: "辛丑",
      day: "己丑",
      hour: "庚午",
      dayMaster: "己",
    });
  });

  it.each([
    {
      input: "13:29",
      adjusted: { hour: 12, minute: 59 },
      hourPillar: "庚午",
    },
    {
      input: "13:30",
      adjusted: { hour: 13, minute: 0 },
      hourPillar: "辛未",
    },
    {
      input: "23:29",
      adjusted: { hour: 22, minute: 59 },
      hourPillar: "乙亥",
    },
    {
      input: "23:30",
      adjusted: { hour: 23, minute: 0 },
      hourPillar: "甲子",
    },
  ])(
    "사용자 입력 $input의 -30분 적용 시각과 시주 경계를 고정한다",
    ({ input, adjusted, hourPillar }) => {
      const calculationInput = {
        ...KOREA_MINUS_30_REFERENCE_INPUT,
        birthTime: input,
      };
      const calculated = calculateSajuRaw(calculationInput);
      const normalized = normalizeSaju(calculated, calculationInput);

      expect(calculated.unlogTime.policy).toBe("KOREA_MINUS_30_V1");
      expect(calculated.unlogTime.adjusted).toMatchObject(adjusted);
      expect(normalized.pillars.hour).toBeDefined();
      expect(pillarText(normalized.pillars.hour!)).toBe(hourPillar);
    },
  );

  it("1994-03-15 14:30 남성 사례 2의 원국과 십성을 영구 회귀 기준으로 유지한다", () => {
    const calculated = calculateSajuRaw(KOREA_MINUS_30_REFERENCE_INPUT_2);
    const normalized = normalizeSaju(
      calculated,
      KOREA_MINUS_30_REFERENCE_INPUT_2,
    );

    expect(calculated.unlogTime).toEqual({
      original: { hour: 14, minute: 30 },
      adjusted: {
        year: 1994,
        month: 3,
        day: 15,
        hour: 14,
        minute: 0,
      },
      policy: "KOREA_MINUS_30_V1",
    });
    expect(calculated.raw.input.applyLocalMeanTime).toBe(false);

    expect({
      year: pillarText(normalized.pillars.year),
      month: pillarText(normalized.pillars.month),
      day: pillarText(normalized.pillars.day),
      hour: normalized.pillars.hour
        ? pillarText(normalized.pillars.hour)
        : null,
      dayMaster: normalized.dayMaster.stem,
    }).toEqual({
      year: "甲戌",
      month: "丁卯",
      day: "庚子",
      hour: "癸未",
      dayMaster: "庚",
    });

    expect({
      yearStem: calculated.raw.tenGods.year.stem,
      yearBranch: calculated.raw.tenGods.year.branch,
      monthStem: calculated.raw.tenGods.month.stem,
      monthBranch: calculated.raw.tenGods.month.branch,
      dayBranch: calculated.raw.tenGods.day.branch,
      hourStem: calculated.raw.tenGods.hour.stem,
      hourBranch: calculated.raw.tenGods.hour.branch,
    }).toEqual({
      yearStem: "편재",
      yearBranch: "편인",
      monthStem: "정관",
      monthBranch: "정재",
      dayBranch: "상관",
      hourStem: "상관",
      hourBranch: "정인",
    });

    const hiddenStemTenGods = Object.fromEntries(
      normalized.hiddenStems.map(({ branch, stem }) => [
        `${branch}.${stem}`,
        getTenGodForStem(normalized.dayMaster.stem, stem),
      ]),
    );

    expect(hiddenStemTenGods).toMatchObject({
      "戌.辛": "겁재",
      "戌.丁": "정관",
      "戌.戊": "편인",
      "卯.乙": "정재",
      "子.癸": "상관",
      "未.丁": "정관",
      "未.乙": "정재",
      "未.己": "정인",
    });
    expect(normalized.hiddenStems).toHaveLength(8);
  });
});
