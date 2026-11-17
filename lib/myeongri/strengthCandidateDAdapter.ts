import type { SajuResult } from "ssaju";
import type { NormalizedSaju } from "../saju/types";
import { isUnlogStrengthDProductionV1Enabled } from "./config";
import {
  analyzeWithFrozenCandidateD,
  type CandidateDStrengthResult,
} from "./strengthCandidateD";
import type { StrengthLevel } from "./types";

export type ProductionDayStrength =
  SajuResult["advanced"]["dayStrength"];

export type CandidateDAnalyzer = (
  normalizedSaju: NormalizedSaju,
) => CandidateDStrengthResult;

const LEGACY_STRENGTH_BY_D_LEVEL: Record<
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

function isCandidateDLevel(level: string): level is StrengthLevel {
  return Object.prototype.hasOwnProperty.call(
    LEGACY_STRENGTH_BY_D_LEVEL,
    level,
  );
}

/**
 * Converts frozen Candidate D into the existing ssaju dayStrength contract.
 * The seven-band result remains Candidate D's source of truth; only the
 * legacy three-band projection is exposed through the unchanged API shape.
 */
export function createDayStrengthFromCandidateD(
  normalizedSaju: NormalizedSaju,
  analyzeCandidateD: CandidateDAnalyzer = analyzeWithFrozenCandidateD,
): ProductionDayStrength {
  const result = analyzeCandidateD(normalizedSaju);

  if (
    !Number.isFinite(result.score) ||
    result.score < 0 ||
    result.score > 100 ||
    !isCandidateDLevel(result.level)
  ) {
    throw new Error("Invalid Candidate D dayStrength result");
  }

  return {
    score: result.score,
    strength: LEGACY_STRENGTH_BY_D_LEVEL[result.level],
  };
}

interface ResolveProductionDayStrengthOptions {
  enabled?: boolean;
  analyzeCandidateD?: CandidateDAnalyzer;
}

/**
 * Central, side-effect-free selector for the one field that is allowed to
 * switch. Candidate D failures are deliberately isolated from the rest of
 * the user's saju calculation and fall back to the already-computed legacy
 * ssaju-compatible value.
 */
export function resolveProductionDayStrength(
  normalizedSaju: NormalizedSaju,
  legacyDayStrength: ProductionDayStrength,
  options: ResolveProductionDayStrengthOptions = {},
): ProductionDayStrength {
  const enabled =
    options.enabled ?? isUnlogStrengthDProductionV1Enabled();

  if (!enabled) return legacyDayStrength;

  try {
    return createDayStrengthFromCandidateD(
      normalizedSaju,
      options.analyzeCandidateD,
    );
  } catch {
    return legacyDayStrength;
  }
}
