import type { NormalizedSaju } from "../saju/types";
import { analyzeStrength } from "./strength";
import {
  analyzeWithFrozenCandidateD,
  FROZEN_CANDIDATE_D_VERSION,
} from "./strengthCandidateD";
import type { StrengthLevel } from "./types";

export const STRENGTH_FORMULA_A_VERSION = "A_V1" as const;

const STRENGTH_LEVEL_ORDER: readonly StrengthLevel[] = [
  "very_weak",
  "weak",
  "balanced_weak",
  "balanced",
  "balanced_strong",
  "strong",
  "very_strong",
];

export type StrengthBandDifference =
  | "same"
  | "adjacent"
  | "two_or_more";

export type StrengthBandDirection =
  | "d_weaker"
  | "same"
  | "d_stronger";

export interface StrengthComparisonSnapshot<Version extends string> {
  score: number;
  band: StrengthLevel;
  version: Version;
}

export interface StrengthAAndDComparison {
  formulaA: StrengthComparisonSnapshot<typeof STRENGTH_FORMULA_A_VERSION>;
  candidateD: StrengthComparisonSnapshot<
    typeof FROZEN_CANDIDATE_D_VERSION
  >;
  /** Candidate D band index minus formula A band index. */
  bandDelta: number;
  difference: StrengthBandDifference;
  direction: StrengthBandDirection;
}

/** Pure, side-effect-free shadow comparison over one normalized saju. */
export function compareStrengthAAndD(
  normalizedSaju: NormalizedSaju,
): StrengthAAndDComparison {
  const formulaA = analyzeStrength(normalizedSaju);
  const candidateD = analyzeWithFrozenCandidateD(normalizedSaju);
  const bandDelta =
    STRENGTH_LEVEL_ORDER.indexOf(candidateD.level) -
    STRENGTH_LEVEL_ORDER.indexOf(formulaA.level);
  const absoluteBandDelta = Math.abs(bandDelta);

  return {
    formulaA: {
      score: formulaA.internalScore,
      band: formulaA.level,
      version: STRENGTH_FORMULA_A_VERSION,
    },
    candidateD: {
      score: candidateD.score,
      band: candidateD.level,
      version: FROZEN_CANDIDATE_D_VERSION,
    },
    bandDelta,
    difference:
      absoluteBandDelta === 0
        ? "same"
        : absoluteBandDelta === 1
          ? "adjacent"
          : "two_or_more",
    direction:
      bandDelta < 0
        ? "d_weaker"
        : bandDelta > 0
          ? "d_stronger"
          : "same",
  };
}
