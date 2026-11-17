import type { FiveElement, HiddenStemRole, PillarPosition } from "../saju/types";
import type { StrengthLevel } from "./types";

export const UNLOG_MYEONGRI_ENGINE_V1_ENABLED =
  process.env.UNLOG_MYEONGRI_ENGINE_V1 !== "false";
export const UNLOG_MYEONGRI_SHADOW_MODE_ENABLED =
  process.env.UNLOG_MYEONGRI_SHADOW_MODE === "true";
export const UNLOG_MYEONGRI_USE_FOR_READING =
  process.env.UNLOG_MYEONGRI_USE_FOR_READING === "true";

/**
 * Candidate D is intentionally opt-in. `getSaju()` is also used by client
 * components, so the production switch must be a NEXT_PUBLIC value in order
 * to resolve to the same value in browser and server bundles.
 */
export const UNLOG_STRENGTH_D_PRODUCTION_V1_FLAG =
  "NEXT_PUBLIC_UNLOG_STRENGTH_D_PRODUCTION_V1" as const;

export function isUnlogStrengthDProductionV1Enabled(
  value = process.env.NEXT_PUBLIC_UNLOG_STRENGTH_D_PRODUCTION_V1,
) {
  return value === "true";
}

export const GENERATES: Record<FiveElement, FiveElement> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};

export const GENERATED_BY: Record<FiveElement, FiveElement> = {
  wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal",
};

export const CONTROLS: Record<FiveElement, FiveElement> = {
  wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire",
};

export const CONTROLLED_BY: Record<FiveElement, FiveElement> = {
  wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth",
};

export const STRENGTH_RULES = {
  baseScore: 50,
  monthCommand: { same: 18, resource: 14, drain: -10, wealth: -8, control: -14, neutral: 0 },
  rootWeights: { main: 8, middle: 5, residual: 3 } satisfies Record<HiddenStemRole, number>,
  visibleStemWeights: { year: 4, month: 6, day: 0, hour: 4 } satisfies Record<PillarPosition, number>,
  branchWeights: { year: 3, month: 5, day: 4, hour: 3 } satisfies Record<PillarPosition, number>,
  tenGodGroups: {
    support: ["비견", "겁재", "정인", "편인"],
    drain: ["식신", "상관", "정재", "편재"],
    control: ["정관", "편관", "칠살"],
  },
  levels: [
    { max: 20, level: "very_weak" }, { max: 34, level: "weak" },
    { max: 44, level: "balanced_weak" }, { max: 56, level: "balanced" },
    { max: 66, level: "balanced_strong" }, { max: 80, level: "strong" },
    { max: 100, level: "very_strong" },
  ] satisfies Array<{ max: number; level: StrengthLevel }>,
  boundaryConfidencePenalty: { near1: 0.18, near3: 0.1, near5: 0.05 },
} as const;

export const NATAL_RULES = {
  dominantTenGodMinimum: 3,
  relationFindingMinimum: 1,
  maxCandidateFindings: 12,
  maxFinalFindings: 7,
  minFinalFindings: 3,
} as const;
