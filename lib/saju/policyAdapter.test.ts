import { describe, expect, it } from "vitest";
import { analyzeStrength } from "../myeongri/strength";
import { getTenGodForBranch, getTenGodForStem } from "../tenGodUtils";
import { STRENGTH_VALIDATION_CASES } from "../../tests/validation/strengthValidationCases";
import {
  calculateSajuWithBoundaryPolicies,
  getCanonicalPillarTexts,
  KOREA_TIME_ADJUSTMENT_POLICY,
  ZI_DAY_BOUNDARY_POLICY,
} from "./policyAdapter";
import type { NormalizedSaju, PillarPosition, SajuCalculationInput } from "./types";

const BASE_INPUT = {
  birthDate: "2002-02-05",
  calendar: "solar",
  gender: "male",
  timezone: "Asia/Seoul",
  targetYear: 2026,
} satisfies Omit<SajuCalculationInput, "birthTime">;

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];

function pillarTexts(saju: NormalizedSaju) {
  return {
    year: `${saju.pillars.year.stem}${saju.pillars.year.branch}`,
    month: `${saju.pillars.month.stem}${saju.pillars.month.branch}`,
    day: `${saju.pillars.day.stem}${saju.pillars.day.branch}`,
    hour: saju.pillars.hour
      ? `${saju.pillars.hour.stem}${saju.pillars.hour.branch}`
      : null,
  };
}

function tenGodAt(
  saju: NormalizedSaju,
  pillar: PillarPosition,
  target: "stem" | "branch",
) {
  return saju.tenGods.find(
    (item) => item.pillar === pillar && item.target === target,
  )?.name;
}

describe("KOREA_MINUS_30_V1 + ZI_START_NEXT_DAY_V1 policy adapter", () => {
  it.each([
    {
      input: "00:00",
      adjusted: "2002-02-04 23:30",
      effectiveDay: "2002-02-05",
      boundaryApplied: true,
      day: "甲辰",
      hour: "甲子",
    },
    {
      input: "00:29",
      adjusted: "2002-02-04 23:59",
      effectiveDay: "2002-02-05",
      boundaryApplied: true,
      day: "甲辰",
      hour: "甲子",
    },
    {
      input: "00:30",
      adjusted: "2002-02-05 00:00",
      effectiveDay: "2002-02-05",
      boundaryApplied: false,
      day: "甲辰",
      hour: "甲子",
    },
    {
      input: "23:29",
      adjusted: "2002-02-05 22:59",
      effectiveDay: "2002-02-05",
      boundaryApplied: false,
      day: "甲辰",
      hour: "乙亥",
    },
    {
      input: "23:30",
      adjusted: "2002-02-05 23:00",
      effectiveDay: "2002-02-06",
      boundaryApplied: true,
      day: "乙巳",
      hour: "丙子",
    },
    {
      input: "23:59",
      adjusted: "2002-02-05 23:29",
      effectiveDay: "2002-02-06",
      boundaryApplied: true,
      day: "乙巳",
      hour: "丙子",
    },
  ])(
    "2002-02-05 $input 경계에서 기대 일주와 시주를 재현한다",
    ({ input, adjusted, effectiveDay, boundaryApplied, day, hour }) => {
      const result = calculateSajuWithBoundaryPolicies({
        ...BASE_INPUT,
        birthTime: input,
      });

      expect(result.policies).toEqual({
        timeAdjustment: KOREA_TIME_ADJUSTMENT_POLICY,
        dayBoundary: ZI_DAY_BOUNDARY_POLICY,
      });
      expect(result.boundary).toMatchObject({
        applied: boundaryApplied,
        actualAdjustedDateTime: adjusted,
        effectiveDayDate: effectiveDay,
      });
      expect(getCanonicalPillarTexts(result)).toMatchObject({ day, hour });
    },
  );

  it.each([
    {
      input: {
        birthDate: "1992-01-14",
        birthTime: "13:00",
        calendar: "solar" as const,
        gender: "female" as const,
        timezone: "Asia/Seoul",
        targetYear: 2026,
      },
      expected: {
        year: "辛未",
        month: "辛丑",
        day: "己丑",
        hour: "庚午",
      },
    },
    {
      input: {
        birthDate: "1994-03-15",
        birthTime: "14:30",
        calendar: "solar" as const,
        gender: "male" as const,
        timezone: "Asia/Seoul",
        targetYear: 2026,
      },
      expected: {
        year: "甲戌",
        month: "丁卯",
        day: "庚子",
        hour: "癸未",
      },
    },
  ])("기존 영구 회귀 원국을 유지한다", ({ input, expected }) => {
    const result = calculateSajuWithBoundaryPolicies(input);

    expect(result.boundary.applied).toBe(false);
    expect(getCanonicalPillarTexts(result)).toEqual(expected);
  });

  it.each(STRENGTH_VALIDATION_CASES)(
    "$id의 누적 Validation 원국을 유지한다",
    (validationCase) => {
      const result = calculateSajuWithBoundaryPolicies({
        birthDate: validationCase.birth.date,
        birthTime: validationCase.birth.time,
        calendar: validationCase.birth.calendar,
        gender: validationCase.birth.gender,
        timezone: validationCase.birth.timezone,
        targetYear: 2026,
      });

      const adjustedHour = Number(
        validationCase.expectedAdjustedDateTime.slice(11, 13),
      );
      expect(result.boundary.applied).toBe(adjustedHour === 23);
      expect(getCanonicalPillarTexts(result)).toEqual(
        validationCase.expectedPillars,
      );
    },
  );

  it.each([
    { input: "13:29", adjusted: "1992-01-14 12:59", hour: "庚午" },
    { input: "13:30", adjusted: "1992-01-14 13:00", hour: "辛未" },
  ])(
    "기존 $input 입력의 시주 경계를 유지한다",
    ({ input, adjusted, hour }) => {
      const result = calculateSajuWithBoundaryPolicies({
        birthDate: "1992-01-14",
        birthTime: input,
        calendar: "solar",
        gender: "female",
        timezone: "Asia/Seoul",
        targetYear: 2026,
      });

      expect(result.boundary.actualAdjustedDateTime).toBe(adjusted);
      expect(result.boundary.applied).toBe(false);
      expect(getCanonicalPillarTexts(result).hour).toBe(hour);
    },
  );

  it("기존 00:10 시간 보정 메타데이터를 보존하면서 일주 기준일만 분리한다", () => {
    const result = calculateSajuWithBoundaryPolicies({
      birthDate: "2000-01-02",
      birthTime: "00:10",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
      targetYear: 2026,
    });

    expect(result.boundary).toEqual({
      applied: true,
      actualAdjustedDateTime: "2000-01-01 23:40",
      actualSolarDate: "2000-01-01",
      effectiveDayDate: "2000-01-02",
    });
    expect(result.sources.actualAdjusted.normalized.birth).toMatchObject({
      inputDate: "2000-01-02",
      birthTime: "00:10",
      timezone: "Asia/Seoul",
    });
  });

  it("절기 경계에서도 년주·월주는 실제 보정 시각, 일주·시주는 자초환일 기준을 사용한다", () => {
    const result = calculateSajuWithBoundaryPolicies({
      birthDate: "2024-02-04",
      birthTime: "00:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
      targetYear: 2026,
    });

    expect(result.boundary).toEqual({
      applied: true,
      actualAdjustedDateTime: "2024-02-03 23:30",
      actualSolarDate: "2024-02-03",
      effectiveDayDate: "2024-02-04",
    });
    expect(pillarTexts(result.sources.actualAdjusted.normalized)).toEqual({
      year: "癸卯",
      month: "乙丑",
      day: "丁酉",
      hour: "庚子",
    });
    expect(pillarTexts(result.sources.dayHourReference.normalized)).toEqual({
      year: "甲辰",
      month: "丙寅",
      day: "戊戌",
      hour: "壬子",
    });
    expect(getCanonicalPillarTexts(result)).toEqual({
      year: "癸卯",
      month: "乙丑",
      day: "戊戌",
      hour: "壬子",
    });
  });

  it("변경된 일간으로 십성·지장간·12운성·공망·관계·신강도 입력을 다시 구성한다", () => {
    const result = calculateSajuWithBoundaryPolicies({
      ...BASE_INPUT,
      birthTime: "23:30",
    });
    const saju = result.normalized;
    const dayStem = "乙";

    expect(saju.dayMaster.stem).toBe(dayStem);
    for (const position of POSITIONS) {
      const pillar = saju.pillars[position];
      expect(pillar).toBeDefined();
      expect(tenGodAt(saju, position, "stem")).toBe(
        position === "day" ? "(일간)" : getTenGodForStem(dayStem, pillar!.stem),
      );
      expect(tenGodAt(saju, position, "branch")).toBe(
        getTenGodForBranch(dayStem, pillar!.branch),
      );
    }
    expect(
      saju.hiddenStems.map((hidden) => ({
        pillar: hidden.pillar,
        branch: hidden.branch,
        stem: hidden.stem,
        tenGod: getTenGodForStem(dayStem, hidden.stem),
      })),
    ).toEqual(
      result.sources.dayHourReference.normalized.hiddenStems.map((hidden) => ({
        pillar: hidden.pillar,
        branch: hidden.branch,
        stem: hidden.stem,
        tenGod: getTenGodForStem(dayStem, hidden.stem),
      })),
    );
    expect(saju.twelveStages).toEqual(
      result.sources.dayHourReference.normalized.twelveStages,
    );
    expect(result.gongmang).toEqual(
      result.sources.dayHourReference.raw.gongmang,
    );
    for (const relation of Object.values(saju.relations).flat()) {
      relation.pillars.forEach((position, index) => {
        const pillar = saju.pillars[position]!;
        expect(relation.symbols[index]).toBe(
          relation.source === "stem" ? pillar.stem : pillar.branch,
        );
      });
    }
    expect(analyzeStrength(saju)).toEqual(
      analyzeStrength(result.sources.dayHourReference.normalized),
    );
  });

  it("절기 경계 혼합 원국의 관계와 신강도 입력에 이전 일주·시주가 남지 않는다", () => {
    const result = calculateSajuWithBoundaryPolicies({
      birthDate: "2024-02-04",
      birthTime: "00:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
      targetYear: 2026,
    });
    const saju = result.normalized;
    const allRelations = Object.values(saju.relations).flat();

    for (const relation of allRelations) {
      relation.pillars.forEach((position, index) => {
        const pillar = saju.pillars[position]!;
        const expectedSymbol =
          relation.source === "stem" ? pillar.stem : pillar.branch;
        expect(relation.symbols[index]).toBe(expectedSymbol);
      });
    }
    expect(
      saju.relations.combinations.map((relation) => relation.symbols.join("")),
    ).toEqual(expect.arrayContaining(["癸戊", "卯戌", "丑子"]));
    expect(
      analyzeStrength(saju).contributions.map(({ source }) => source),
    ).toEqual(
      expect.arrayContaining([
        "month.branch",
        "day.hiddenStems.main",
        "year.stem",
        "day.branch",
        "hour.stem",
        "hour.branch",
      ]),
    );
  });

  it("canonical pillar로 relation sal을 재계산하고 기존 구조 관계와 분리한다", () => {
    const result = calculateSajuWithBoundaryPolicies({
      birthDate: "1992-01-14",
      birthTime: "13:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
      targetYear: 2026,
    });

    expect(result.normalized.relationSals).toEqual([
      {
        id: "gwimun_gwansal",
        name: "귀문관살",
        category: "relation",
        from: "month",
        to: "hour",
        branches: ["丑", "午"],
      },
      {
        id: "gwimun_gwansal",
        name: "귀문관살",
        category: "relation",
        from: "day",
        to: "hour",
        branches: ["丑", "午"],
      },
    ]);
    expect(Object.keys(result.normalized.relations).sort()).toEqual(
      ["breaks", "clashes", "combinations", "harms", "punishments"].sort(),
    );
  });
});
