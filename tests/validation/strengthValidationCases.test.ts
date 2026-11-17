import { describe, expect, it } from "vitest";
import { analyzeStrength } from "../../lib/myeongri/strength";
import { calculateSajuWithBoundaryPolicies } from "../../lib/saju/policyAdapter";
import { getTenGodForStem } from "../../lib/tenGodUtils";
import {
  analyzeWithFrozenCandidateD,
  FROZEN_CANDIDATE_D_BASE_RULES,
  FROZEN_CANDIDATE_D_RULES,
} from "../../lib/myeongri/strengthCandidateD";
import {
  EXTREME_STRENGTH_REFERENCE_CASES,
  evaluateCandidateDValidation,
  PRELIMINARY_STRENGTH_VALIDATION_CANDIDATES,
  STRENGTH_COMPARISON_TABLE,
  STRENGTH_VALIDATION_POLICY,
  STRENGTH_VALIDATION_CASES,
} from "./strengthValidationCases";

describe("frozen candidate D strength validation dataset", () => {
  it.each(STRENGTH_VALIDATION_CASES)(
    "$id keeps formula A and frozen candidate D results reproducible",
    (validationCase) => {
      const input = {
        birthDate: validationCase.birth.date,
        birthTime: validationCase.birth.time,
        calendar: validationCase.birth.calendar,
        gender: validationCase.birth.gender,
        timezone: validationCase.birth.timezone,
        targetYear: 2026,
      };
      const calculated = calculateSajuWithBoundaryPolicies(input);
      const normalized = calculated.normalized;
      const adjusted = calculated.unlogTime.adjusted;
      const adjustedDateTime = `${adjusted.year}-${String(adjusted.month).padStart(2, "0")}-${String(adjusted.day).padStart(2, "0")} ${String(adjusted.hour).padStart(2, "0")}:${String(adjusted.minute).padStart(2, "0")}`;
      const pillars = Object.fromEntries(
        Object.entries(normalized.pillars).map(([position, pillar]) => [
          position,
          `${pillar.stem}${pillar.branch}`,
        ]),
      );
      const tenGods = Object.fromEntries(
        (["year", "month", "day", "hour"] as const).map((position) => [
          position,
          {
            stem: normalized.tenGods.find(
              (item) => item.pillar === position && item.target === "stem",
            )?.name,
            branch: normalized.tenGods.find(
              (item) => item.pillar === position && item.target === "branch",
            )?.name,
          },
        ]),
      );

      expect(validationCase.dataset).toBe("validation");
      expect(calculated.unlogTime.policy).toBe("KOREA_MINUS_30_V1");
      expect(calculated.policies.dayBoundary).toBe("ZI_START_NEXT_DAY_V1");
      expect(adjustedDateTime).toBe(validationCase.expectedAdjustedDateTime);
      expect(pillars).toEqual(validationCase.expectedPillars);
      expect(normalized.dayMaster.stem).toBe(validationCase.expectedDayMaster);
      expect(tenGods).toEqual(validationCase.expectedTenGods);
      if (validationCase.expectedHiddenStems) {
        expect(
          normalized.hiddenStems.map((hidden) => ({
            pillar: hidden.pillar,
            branch: hidden.branch,
            stem: hidden.stem,
            role: hidden.role,
            tenGod: getTenGodForStem(
              normalized.dayMaster.stem,
              hidden.stem,
            ),
          })),
        ).toEqual(validationCase.expectedHiddenStems);
      }
      // 아래 점수 비교는 동결 공식의 회귀 재현성만 검증합니다.
      // 명리적 정답 여부는 externalAllowedLevels와 단계 방향으로 판정합니다.
      const formulaAResult = analyzeStrength(normalized);
      expect({
        score: formulaAResult.internalScore,
        level: formulaAResult.level,
      }).toEqual(validationCase.formulaA);
      expect(analyzeWithFrozenCandidateD(normalized)).toEqual({
        score: validationCase.candidateD.score,
        level: validationCase.candidateD.level,
      });
      expect(
        evaluateCandidateDValidation(
          validationCase.candidateD.score,
          validationCase.candidateD.level,
          validationCase.externalAllowedLevels,
        ),
      ).toEqual(validationCase.candidateD.evaluation);
    },
  );

  it("keeps candidate D parameters frozen", () => {
    expect(FROZEN_CANDIDATE_D_RULES).toEqual({
      monthCommandScale: 2 / 3,
      monthBranchRootScale: 0.5,
      firstRootScale: 1,
      additionalRootScale: 0.5,
      rootScoreCap: 16,
      nonRootHiddenStemScale: 0.2,
    });
    expect(Object.isFrozen(FROZEN_CANDIDATE_D_RULES)).toBe(true);
    expect(FROZEN_CANDIDATE_D_BASE_RULES).toEqual({
      baseScore: 50,
      monthCommand: {
        same: 18,
        resource: 14,
        drain: -10,
        wealth: -8,
        control: -14,
        neutral: 0,
      },
      visibleStemWeights: { year: 4, month: 6, day: 0, hour: 4 },
      branchWeights: { year: 3, month: 5, day: 4, hour: 3 },
      levels: [
        { max: 20, level: "very_weak" },
        { max: 34, level: "weak" },
        { max: 44, level: "balanced_weak" },
        { max: 56, level: "balanced" },
        { max: 66, level: "balanced_strong" },
        { max: 80, level: "strong" },
        { max: 100, level: "very_strong" },
      ],
    });
    expect(Object.isFrozen(FROZEN_CANDIDATE_D_BASE_RULES)).toBe(true);
    expect(Object.isFrozen(FROZEN_CANDIDATE_D_BASE_RULES.levels)).toBe(
      true,
    );
  });

  it("uses external bands as truth and engine scores as observations", () => {
    expect(STRENGTH_VALIDATION_POLICY).toEqual({
      referenceBasis: "external_allowed_levels",
      engineScoreMeaning: "observed_engine_output_not_ground_truth",
      candidateDParametersFrozen: true,
      currentFindings: [
        "no_water_day_master_overvaluation_pattern_observed",
        "no_repeated_branch_overaccumulation_pattern_observed",
        "validation_2_near_miss_focuses_on_double_shen_resource_and_duplicate_roots",
      ],
      nextValidationPriorities: [
        "externally_clear_strong_or_balanced_strong",
        "multiple_roots_or_resources_with_external_balanced",
      ],
    });
    expect(Object.isFrozen(STRENGTH_VALIDATION_POLICY)).toBe(true);
  });

  it("keeps the cumulative A/D comparison table", () => {
    expect(
      STRENGTH_COMPARISON_TABLE.map(
        ({ case: id, formulaA, candidateD, status }) => ({
          id,
          formulaA,
          candidateD,
          status,
        }),
      ),
    ).toEqual([
      { id: "STRENGTH-VALIDATION-001", formulaA: "58 / balanced_strong", candidateD: "53 / balanced", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-002", formulaA: "48 / balanced", candidateD: "46 / balanced", status: "near_miss" },
      { id: "STRENGTH-VALIDATION-003", formulaA: "35 / balanced_weak", candidateD: "31 / weak", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-004", formulaA: "36 / balanced_weak", candidateD: "39 / balanced_weak", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-005", formulaA: "86 / very_strong", candidateD: "73 / strong", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-006", formulaA: "32 / weak", candidateD: "29 / weak", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-007", formulaA: "79 / strong", candidateD: "74 / strong", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-008", formulaA: "30 / weak", candidateD: "33 / weak", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-009", formulaA: "64 / balanced_strong", candidateD: "57 / balanced_strong", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-010", formulaA: "72 / strong", candidateD: "68 / strong", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-011", formulaA: "88 / very_strong", candidateD: "88 / very_strong", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-012", formulaA: "24 / weak", candidateD: "18 / very_weak", status: "exact_match" },
    ]);
  });

  it("keeps the cumulative validation outcomes", () => {
    expect(STRENGTH_COMPARISON_TABLE.map(({ case: id, status }) => ({ id, status }))).toEqual([
      { id: "STRENGTH-VALIDATION-001", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-002", status: "near_miss" },
      { id: "STRENGTH-VALIDATION-003", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-004", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-005", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-006", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-007", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-008", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-009", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-010", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-011", status: "exact_match" },
      { id: "STRENGTH-VALIDATION-012", status: "exact_match" },
    ]);
  });

  it("keeps formula A and candidate D cumulative validation counts", () => {
    const formulaAOutcomes = STRENGTH_VALIDATION_CASES.map((validationCase) =>
      evaluateCandidateDValidation(
        validationCase.formulaA.score,
        validationCase.formulaA.level,
        validationCase.externalAllowedLevels,
      ),
    );
    const candidateDOutcomes = STRENGTH_VALIDATION_CASES.map(
      (validationCase) => validationCase.candidateD.evaluation,
    );

    expect({
      exact: formulaAOutcomes.filter(({ exactMatch }) => exactMatch).length,
      nearMiss: formulaAOutcomes.filter(({ adjacentBand }) => adjacentBand).length,
      miss: formulaAOutcomes.filter(({ status }) => status === "miss").length,
    }).toEqual({ exact: 8, nearMiss: 4, miss: 0 });
    expect({
      exact: candidateDOutcomes.filter(({ exactMatch }) => exactMatch).length,
      nearMiss: candidateDOutcomes.filter(({ adjacentBand }) => adjacentBand).length,
      miss: candidateDOutcomes.filter(({ status }) => status === "miss").length,
    }).toEqual({ exact: 11, nearMiss: 1, miss: 0 });
  });

  it("records the preliminary case without including it in validation totals", () => {
    expect(PRELIMINARY_STRENGTH_VALIDATION_CANDIDATES).toEqual([
      expect.objectContaining({
        id: "STRENGTH-PRELIMINARY-001",
        dataset: "preliminary_validation_candidate",
        expectedPillars: {
          year: "己卯",
          month: "甲戌",
          day: "乙巳",
          hour: "乙酉",
        },
        expectedDayMaster: "乙",
        externalAllowedLevels: ["weak", "balanced_weak"],
      }),
    ]);
    expect(STRENGTH_VALIDATION_CASES).toHaveLength(12);
    expect(STRENGTH_COMPARISON_TABLE).toHaveLength(12);
  });

  it("records extreme comparison references without including them in validation totals", () => {
    expect(EXTREME_STRENGTH_REFERENCE_CASES).toEqual([
      expect.objectContaining({
        id: "STRENGTH-EXTREME-REFERENCE-A",
        dataset: "external_reference_only",
        expectedPillars: {
          year: "辛酉",
          month: "庚子",
          day: "壬申",
          hour: "戊申",
        },
        expectedDayMaster: "壬",
        excludedFromOfficialValidation: true,
      }),
      expect.objectContaining({
        id: "STRENGTH-EXTREME-REFERENCE-B",
        dataset: "external_reference_only",
        expectedPillars: {
          year: "丙戌",
          month: "己亥",
          day: "癸卯",
          hour: "戊午",
        },
        expectedDayMaster: "癸",
        excludedFromOfficialValidation: true,
      }),
    ]);
    expect(STRENGTH_COMPARISON_TABLE).toHaveLength(12);
  });
});
