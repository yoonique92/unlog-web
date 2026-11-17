import type { SajuResult } from "ssaju";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLegacyDayStrength } from "../legacySajuAnalysis";
import { getSaju } from "../saju";
import { isUnlogStrengthDProductionV1Enabled } from "./config";
import { analyzeWithFrozenCandidateD } from "./strengthCandidateD";
import {
  createDayStrengthFromCandidateD,
  resolveProductionDayStrength,
  type ProductionDayStrength,
} from "./strengthCandidateDAdapter";
import type { StrengthLevel } from "./types";
import { STRENGTH_VALIDATION_CASES } from "../../tests/validation/strengthValidationCases";

const FEATURE_FLAG = "NEXT_PUBLIC_UNLOG_STRENGTH_D_PRODUCTION_V1";

const expectedLegacyStrength: Record<
  StrengthLevel,
  ProductionDayStrength["strength"]
> = {
  very_weak: "weak",
  weak: "weak",
  balanced_weak: "neutral",
  balanced: "neutral",
  balanced_strong: "neutral",
  strong: "strong",
  very_strong: "strong",
};

function getValidationSaju(validationCase: (typeof STRENGTH_VALIDATION_CASES)[number]) {
  const [hour, minute] = validationCase.birth.time.split(":");
  return getSaju(
    validationCase.birth.date,
    hour,
    minute,
    validationCase.birth.calendar,
    validationCase.birth.gender,
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Candidate D production dayStrength adapter", () => {
  it("is opt-in and disabled for every value except the literal true", () => {
    expect(isUnlogStrengthDProductionV1Enabled(undefined)).toBe(false);
    expect(isUnlogStrengthDProductionV1Enabled("")).toBe(false);
    expect(isUnlogStrengthDProductionV1Enabled("false")).toBe(false);
    expect(isUnlogStrengthDProductionV1Enabled("TRUE")).toBe(false);
    expect(isUnlogStrengthDProductionV1Enabled("true")).toBe(true);
  });

  it("keeps the default/unset result identical to an explicit false flag", () => {
    vi.stubEnv(FEATURE_FLAG, "false");
    const explicitOff = getSaju(
      "1994-03-15",
      "14",
      "30",
      "solar",
      "male",
    );

    vi.stubEnv(FEATURE_FLAG, "");
    const defaultOff = getSaju(
      "1994-03-15",
      "14",
      "30",
      "solar",
      "male",
    );

    expect(defaultOff.advanced.dayStrength).toEqual(
      explicitOff.advanced.dayStrength,
    );
    expect(Object.keys(defaultOff).sort()).toEqual(
      Object.keys(explicitOff).sort(),
    );
    expect(Object.keys(defaultOff.advanced).sort()).toEqual(
      Object.keys(explicitOff.advanced).sort(),
    );
    expect(Object.keys(defaultOff.advanced.dayStrength).sort()).toEqual([
      "score",
      "strength",
    ]);
    expect(JSON.stringify(defaultOff)).toBe(JSON.stringify(explicitOff));
  });

  it("changes only advanced.dayStrength when the flag is enabled", () => {
    vi.stubEnv(FEATURE_FLAG, "false");
    const legacy = getSaju(
      "1994-03-15",
      "14",
      "30",
      "solar",
      "male",
    );

    vi.stubEnv(FEATURE_FLAG, "true");
    const candidateD = getSaju(
      "1994-03-15",
      "14",
      "30",
      "solar",
      "male",
    );

    const candidateDWithLegacyStrength = {
      ...candidateD,
      advanced: {
        ...candidateD.advanced,
        dayStrength: legacy.advanced.dayStrength,
      },
    };

    expect(Object.keys(candidateD).sort()).toEqual(
      Object.keys(legacy).sort(),
    );
    expect(Object.keys(candidateD.advanced).sort()).toEqual(
      Object.keys(legacy.advanced).sort(),
    );
    expect(JSON.stringify(candidateDWithLegacyStrength)).toBe(
      JSON.stringify(legacy),
    );
  });

  it.each(STRENGTH_VALIDATION_CASES)(
    "projects frozen D for $id without changing the existing API shape",
    (validationCase) => {
      vi.stubEnv(FEATURE_FLAG, "true");
      const result = getValidationSaju(validationCase);
      const candidateD = analyzeWithFrozenCandidateD(result.normalizedSaju);
      const dayStrength: SajuResult["advanced"]["dayStrength"] =
        result.advanced.dayStrength;

      expect(candidateD).toEqual({
        score: validationCase.candidateD.score,
        level: validationCase.candidateD.level,
      });
      expect(dayStrength).toEqual({
        score: validationCase.candidateD.score,
        strength: expectedLegacyStrength[validationCase.candidateD.level],
      });
      expect(Object.keys(dayStrength).sort()).toEqual(["score", "strength"]);
      expect(getLegacyDayStrength(result)).toBe(dayStrength.strength);
    },
  );

  it("does not evaluate Candidate D while the flag is disabled", () => {
    const offResult = getSaju(
      "1992-01-14",
      "13",
      "00",
      "solar",
      "female",
    );
    const legacyDayStrength = offResult.advanced.dayStrength;
    const analyzer = vi.fn(() => {
      throw new Error("must not run");
    });

    expect(
      resolveProductionDayStrength(
        offResult.normalizedSaju,
        legacyDayStrength,
        { enabled: false, analyzeCandidateD: analyzer },
      ),
    ).toBe(legacyDayStrength);
    expect(analyzer).not.toHaveBeenCalled();
  });

  it("falls back to the existing ssaju-compatible value if D throws", () => {
    const offResult = getSaju(
      "1992-01-14",
      "13",
      "00",
      "solar",
      "female",
    );
    const legacyDayStrength = offResult.advanced.dayStrength;

    expect(
      resolveProductionDayStrength(
        offResult.normalizedSaju,
        legacyDayStrength,
        {
          enabled: true,
          analyzeCandidateD: () => {
            throw new Error("simulated Candidate D failure");
          },
        },
      ),
    ).toBe(legacyDayStrength);
  });

  it("rejects an invalid D result so the production selector can fall back", () => {
    const offResult = getSaju(
      "1992-01-14",
      "13",
      "00",
      "solar",
      "female",
    );
    const invalidAnalyzer = () => ({
      score: Number.NaN,
      level: "balanced" as const,
    });

    expect(() =>
      createDayStrengthFromCandidateD(
        offResult.normalizedSaju,
        invalidAnalyzer,
      ),
    ).toThrow("Invalid Candidate D dayStrength result");
    expect(
      resolveProductionDayStrength(
        offResult.normalizedSaju,
        offResult.advanced.dayStrength,
        { enabled: true, analyzeCandidateD: invalidAnalyzer },
      ),
    ).toBe(offResult.advanced.dayStrength);
  });

  it.each([
    ["00:00", "甲辰", "甲子"],
    ["00:29", "甲辰", "甲子"],
    ["00:30", "甲辰", "甲子"],
    ["23:29", "甲辰", "乙亥"],
    ["23:30", "乙巳", "丙子"],
    ["23:59", "乙巳", "丙子"],
  ])(
    "does not alter KOREA_MINUS_30_V1 + ZI_START_NEXT_DAY_V1 at %s",
    (time, expectedDay, expectedHour) => {
      vi.stubEnv(FEATURE_FLAG, "true");
      const [hour, minute] = time.split(":");
      const result = getSaju(
        "2002-02-05",
        hour,
        minute,
        "solar",
        "male",
      );

      expect(result.pillars.day).toBe(expectedDay);
      expect(result.pillars.hour).toBe(expectedHour);
      expect(result.calculationPolicy).toMatchObject({
        timeAdjustment: "KOREA_MINUS_30_V1",
        dayBoundary: "ZI_START_NEXT_DAY_V1",
      });
    },
  );
});
