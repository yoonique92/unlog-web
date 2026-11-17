import { describe, expect, it } from "vitest";
import {
  compareStrengthAAndD,
  STRENGTH_FORMULA_A_VERSION,
} from "../../lib/myeongri/strengthComparison";
import { FROZEN_CANDIDATE_D_VERSION } from "../../lib/myeongri/strengthCandidateD";
import type { StrengthLevel } from "../../lib/myeongri/types";
import { calculateSajuWithBoundaryPolicies } from "../../lib/saju/policyAdapter";
import { STRENGTH_VALIDATION_CASES } from "./strengthValidationCases";

const strengthLevelOrder: readonly StrengthLevel[] = [
  "very_weak",
  "weak",
  "balanced_weak",
  "balanced",
  "balanced_strong",
  "strong",
  "very_strong",
];

describe("formula A and frozen candidate D comparison", () => {
  it.each(STRENGTH_VALIDATION_CASES)(
    "$id compares both formulas from the same normalized saju",
    (validationCase) => {
      const { normalized } = calculateSajuWithBoundaryPolicies({
        birthDate: validationCase.birth.date,
        birthTime: validationCase.birth.time,
        calendar: validationCase.birth.calendar,
        gender: validationCase.birth.gender,
        timezone: validationCase.birth.timezone,
        targetYear: 2026,
      });
      const comparison = compareStrengthAAndD(normalized);
      const expectedBandDelta =
        strengthLevelOrder.indexOf(validationCase.candidateD.level) -
        strengthLevelOrder.indexOf(validationCase.formulaA.level);

      expect(comparison.formulaA).toEqual({
        score: validationCase.formulaA.score,
        band: validationCase.formulaA.level,
        version: STRENGTH_FORMULA_A_VERSION,
      });
      expect(comparison.candidateD).toEqual({
        score: validationCase.candidateD.score,
        band: validationCase.candidateD.level,
        version: FROZEN_CANDIDATE_D_VERSION,
      });
      expect(comparison.bandDelta).toBe(expectedBandDelta);
      expect(comparison.difference).toBe(
        expectedBandDelta === 0
          ? "same"
          : Math.abs(expectedBandDelta) === 1
            ? "adjacent"
            : "two_or_more",
      );
      expect(comparison.direction).toBe(
        expectedBandDelta < 0
          ? "d_weaker"
          : expectedBandDelta > 0
            ? "d_stronger"
            : "same",
      );
    },
  );
});
