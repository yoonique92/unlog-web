import type {
  HiddenStemRole,
  NormalizedSaju,
  PillarPosition,
} from "../saju/types";
import { getElementEffect, type ElementEffect } from "./elements";
import type { StrengthLevel } from "./types";

/**
 * Candidate D is frozen after independent validation.
 * Any future rule change must use a new version instead of mutating V1.
 */
export const FROZEN_CANDIDATE_D_VERSION = "D_FROZEN_V1" as const;

export const FROZEN_CANDIDATE_D_RULES = Object.freeze({
  monthCommandScale: 2 / 3,
  monthBranchRootScale: 0.5,
  firstRootScale: 1,
  additionalRootScale: 0.5,
  rootScoreCap: 16,
  nonRootHiddenStemScale: 0.2,
});

/**
 * Candidate D owns a snapshot of every inherited A weight and threshold it
 * was validated with. A future formula-A config change must not silently
 * mutate the frozen D result.
 */
export const FROZEN_CANDIDATE_D_BASE_RULES = Object.freeze({
  baseScore: 50,
  monthCommand: Object.freeze({
    same: 18,
    resource: 14,
    drain: -10,
    wealth: -8,
    control: -14,
    neutral: 0,
  }) satisfies Readonly<Record<ElementEffect, number>>,
  visibleStemWeights: Object.freeze({
    year: 4,
    month: 6,
    day: 0,
    hour: 4,
  }) satisfies Readonly<Record<PillarPosition, number>>,
  branchWeights: Object.freeze({
    year: 3,
    month: 5,
    day: 4,
    hour: 3,
  }) satisfies Readonly<Record<PillarPosition, number>>,
  levels: Object.freeze([
    Object.freeze({ max: 20, level: "very_weak" as const }),
    Object.freeze({ max: 34, level: "weak" as const }),
    Object.freeze({ max: 44, level: "balanced_weak" as const }),
    Object.freeze({ max: 56, level: "balanced" as const }),
    Object.freeze({ max: 66, level: "balanced_strong" as const }),
    Object.freeze({ max: 80, level: "strong" as const }),
    Object.freeze({ max: 100, level: "very_strong" as const }),
  ]),
});

const hiddenStemWeights: Record<HiddenStemRole, number> = {
  main: 8,
  middle: 5,
  residual: 3,
};

function signedWeight(
  effect: ReturnType<typeof getElementEffect>,
  weight: number,
) {
  return effect === "same" || effect === "resource" ? weight : -weight;
}

function getFrozenCandidateDStrengthLevel(score: number): StrengthLevel {
  return (
    FROZEN_CANDIDATE_D_BASE_RULES.levels.find(
      (entry) => score <= entry.max,
    )?.level ?? "very_strong"
  );
}

export interface CandidateDStrengthResult {
  score: number;
  level: StrengthLevel;
}

export interface CandidateDContribution {
  source: string;
  kind:
    | "monthCommand"
    | "root"
    | "visibleStem"
    | "branchSurface"
    | "nonRootHiddenStem";
  effect: ReturnType<typeof getElementEffect>;
  rawWeight: number;
  adjustedWeight: number;
}

export interface CandidateDStrengthAnalysis
  extends CandidateDStrengthResult {
  contributions: CandidateDContribution[];
  totals: {
    base: number;
    monthCommand: number;
    roots: number;
    visibleAndSurface: number;
    nonRootHiddenStems: number;
    beforeClampAndRound: number;
  };
}

export function analyzeWithFrozenCandidateDAnalysis(
  saju: NormalizedSaju,
): CandidateDStrengthAnalysis {
  const dayStem = saju.dayMaster.stem;
  const dayElement = saju.dayMaster.element;
  const contributions: CandidateDContribution[] = [];
  const monthEffect = getElementEffect(
    dayElement,
    saju.pillars.month.branchElement,
  );
  const monthScore =
    FROZEN_CANDIDATE_D_BASE_RULES.monthCommand[monthEffect] *
    FROZEN_CANDIDATE_D_RULES.monthCommandScale;
  contributions.push({
    source: "month.branch",
    kind: "monthCommand",
    effect: monthEffect,
    rawWeight: FROZEN_CANDIDATE_D_BASE_RULES.monthCommand[monthEffect],
    adjustedWeight: monthScore,
  });

  const roots = saju.hiddenStems
    .filter((hidden) => hidden.stem === dayStem)
    .map((hidden) => ({
      source: `${hidden.pillar}.hiddenStems.${hidden.role}:${hidden.stem}`,
      rawWeight: hiddenStemWeights[hidden.role],
      monthAdjustedWeight:
        hiddenStemWeights[hidden.role] *
        (hidden.pillar === "month"
          ? FROZEN_CANDIDATE_D_RULES.monthBranchRootScale
          : 1),
    }))
    .sort(
      (left, right) =>
        right.monthAdjustedWeight - left.monthAdjustedWeight,
    );
  roots.forEach((root, index) => {
    contributions.push({
      source: root.source,
      kind: "root",
      effect: "same",
      rawWeight: root.rawWeight,
      adjustedWeight:
        root.monthAdjustedWeight *
        (index === 0
          ? FROZEN_CANDIDATE_D_RULES.firstRootScale
          : FROZEN_CANDIDATE_D_RULES.additionalRootScale),
    });
  });
  const rootScore = Math.min(
    FROZEN_CANDIDATE_D_RULES.rootScoreCap,
    roots.reduce(
      (sum, root, index) =>
        sum +
        root.monthAdjustedWeight *
          (index === 0
            ? FROZEN_CANDIDATE_D_RULES.firstRootScale
            : FROZEN_CANDIDATE_D_RULES.additionalRootScale),
      0,
    ),
  );

  let visibleAndSurfaceScore = 0;
  for (const pillar of Object.values(saju.pillars)) {
    if (pillar.position !== "day") {
      const effect = getElementEffect(dayElement, pillar.stemElement);
      const rawWeight =
        FROZEN_CANDIDATE_D_BASE_RULES.visibleStemWeights[pillar.position];
      const adjustedWeight = signedWeight(effect, rawWeight);
      visibleAndSurfaceScore += adjustedWeight;
      contributions.push({
        source: `${pillar.position}.stem:${pillar.stem}`,
        kind: "visibleStem",
        effect,
        rawWeight,
        adjustedWeight,
      });
    }
    if (pillar.position !== "month") {
      const effect = getElementEffect(dayElement, pillar.branchElement);
      const rawWeight =
        FROZEN_CANDIDATE_D_BASE_RULES.branchWeights[pillar.position];
      const adjustedWeight = signedWeight(effect, rawWeight);
      visibleAndSurfaceScore += adjustedWeight;
      contributions.push({
        source: `${pillar.position}.branch:${pillar.branch}`,
        kind: "branchSurface",
        effect,
        rawWeight,
        adjustedWeight,
      });
    }
  }

  let nonRootHiddenStemScore = 0;
  for (const hidden of saju.hiddenStems.filter(
    (item) => item.stem !== dayStem,
  )) {
    const effect = getElementEffect(dayElement, hidden.element);
    const rawWeight = hiddenStemWeights[hidden.role];
    const adjustedWeight = signedWeight(
      effect,
      rawWeight * FROZEN_CANDIDATE_D_RULES.nonRootHiddenStemScale,
    );
    nonRootHiddenStemScore += adjustedWeight;
    contributions.push({
      source: `${hidden.pillar}.hiddenStems.${hidden.role}:${hidden.stem}`,
      kind: "nonRootHiddenStem",
      effect,
      rawWeight,
      adjustedWeight,
    });
  }

  const beforeClampAndRound =
    FROZEN_CANDIDATE_D_BASE_RULES.baseScore +
    monthScore +
    rootScore +
    visibleAndSurfaceScore +
    nonRootHiddenStemScore;

  const score = Math.round(
    Math.min(100, Math.max(0, beforeClampAndRound)),
  );

  return {
    score,
    level: getFrozenCandidateDStrengthLevel(score),
    contributions,
    totals: {
      base: FROZEN_CANDIDATE_D_BASE_RULES.baseScore,
      monthCommand: monthScore,
      roots: rootScore,
      visibleAndSurface: visibleAndSurfaceScore,
      nonRootHiddenStems: nonRootHiddenStemScore,
      beforeClampAndRound,
    },
  };
}

export function analyzeWithFrozenCandidateD(
  saju: NormalizedSaju,
): CandidateDStrengthResult {
  const { score, level } = analyzeWithFrozenCandidateDAnalysis(saju);
  return { score, level };
}
