import type { FiveElement, HiddenStemInfo, NormalizedSaju } from "../saju/types";
import { STRENGTH_RULES } from "./config";
import { getElementEffect, type ElementEffect } from "./elements";
import type { Evidence, StrengthAnalysis, StrengthContribution, StrengthFactor } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const factorLevel = (score: number): StrengthFactor["level"] => score >= 65 ? "strong" : score >= 35 ? "medium" : "weak";
const contributionCategory = (effect: ElementEffect): StrengthContribution["category"] =>
  effect === "same" ? "peer" : effect === "resource" ? "resource" : effect === "drain" ? "output" : effect === "control" ? "officer" : "wealth";
const signedWeight = (effect: ElementEffect, weight: number) =>
  effect === "same" || effect === "resource" ? weight : -weight;

export function getStrengthLevel(score: number) {
  return STRENGTH_RULES.levels.find((entry) => score <= entry.max)?.level ?? "very_strong";
}

export function getDistanceFromStrengthBoundary(score: number) {
  const boundaries = STRENGTH_RULES.levels.slice(0, -1).map((entry) => entry.max);
  return Math.min(...boundaries.map((boundary) => Math.abs(score - boundary)));
}

export type HiddenStemStrengthRole = "root" | "peerSupport" | "resourceSupport" | "drain" | "control";

export function classifyHiddenStemStrengthRole(
  dayStem: string,
  dayElement: FiveElement,
  hidden: Pick<HiddenStemInfo, "stem" | "element">,
): HiddenStemStrengthRole {
  if (hidden.stem === dayStem) return "root";
  const effect = getElementEffect(dayElement, hidden.element);
  if (effect === "same") return "peerSupport";
  if (effect === "resource") return "resourceSupport";
  if (effect === "control") return "control";
  return "drain";
}

export function analyzeStrength(saju: NormalizedSaju): StrengthAnalysis {
  const dayElement = saju.dayMaster.element;
  const contributions: StrengthContribution[] = [];
  const monthEffect = getElementEffect(dayElement, saju.pillars.month.branchElement);
  const monthDelta = STRENGTH_RULES.monthCommand[monthEffect];
  contributions.push({ ruleId: "STR-001", category: "month_command", source: "month.branch", rawWeight: monthDelta, adjustedWeight: monthDelta, reason: `월지 ${saju.pillars.month.branch}의 ${monthEffect} 작용` });
  const monthEvidence: Evidence = { id: "strength-month-command", ruleId: "STR-001", type: "month_command", source: "month.branch", description: `월지의 계절 기운이 일간에 ${monthDelta >= 0 ? "힘을 보태는" : "힘을 소모하거나 제어하는"} 방향입니다.`, technicalDescription: `${saju.pillars.month.branch}(${saju.pillars.month.branchElement}) → ${dayElement}: ${monthEffect}`, weight: monthDelta };

  const rootEvidence = saju.hiddenStems.flatMap((hidden) => {
    if (classifyHiddenStemStrengthRole(saju.dayMaster.stem, dayElement, hidden) !== "root") return [];
    const weight = STRENGTH_RULES.rootWeights[hidden.role];
    const ruleId = hidden.role === "main" ? "STR-002" : hidden.role === "middle" ? "STR-003" : "STR-004";
    const source = `${hidden.pillar}.hiddenStems.${hidden.role}`;
    contributions.push({ ruleId, category: "root", source, sourceKey: `${source}:${hidden.stem}`, rawWeight: weight, adjustedWeight: weight, reason: `${hidden.branch} 지장간 ${hidden.stem}의 ${hidden.role} 통근` });
    return [{ id: `strength-root-${hidden.pillar}-${hidden.role}`, ruleId, type: "root" as const, source: `${hidden.pillar}.hiddenStems.${hidden.role}`, description: `${hidden.pillar} 지지의 ${hidden.role === "main" ? "본기" : hidden.role === "middle" ? "중기" : "여기"}에서 일간을 돕는 뿌리가 확인됩니다.`, technicalDescription: `${hidden.branch} 지장간 ${hidden.stem}(${hidden.element})`, weight }];
  });
  const rootWeight = rootEvidence.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  const rootScore = clamp(rootWeight * 5);

  let support = 0;
  let drain = 0;
  let control = 0;
  for (const pillar of Object.values(saju.pillars)) {
    const targets = [
      ...(pillar.position === "day" ? [] : [{ target: "stem" as const, effect: getElementEffect(dayElement, pillar.stemElement), weight: STRENGTH_RULES.visibleStemWeights[pillar.position] }]),
      ...(pillar.position === "month" ? [] : [{ target: "branch" as const, effect: getElementEffect(dayElement, pillar.branchElement), weight: STRENGTH_RULES.branchWeights[pillar.position] }]),
    ];
    for (const target of targets) {
      const adjustedWeight = signedWeight(target.effect, target.weight);
      const category = contributionCategory(target.effect);
      contributions.push({ ruleId: target.effect === "same" || target.effect === "resource" ? "STR-005" : target.effect === "control" ? "STR-007" : "STR-006", category, source: `${pillar.position}.${target.target}`, rawWeight: target.weight, adjustedWeight, reason: `${pillar.position} ${target.target}의 ${target.effect} 작용` });
      if (adjustedWeight >= 0) support += adjustedWeight;
      else if (target.effect === "control") control += Math.abs(adjustedWeight);
      else drain += Math.abs(adjustedWeight);
    }
  }
  const forceEvidence: Evidence[] = [];
  if (support > 0) forceEvidence.push({ id: "strength-support", ruleId: "STR-005", type: "support", source: "pillars", description: "원국에서 일간을 돕는 비겁·인성 계열의 위치별 세력을 반영했습니다.", weight: support });
  if (drain > 0) forceEvidence.push({ id: "strength-drain", ruleId: "STR-006", type: "drain", source: "pillars", description: "원국에서 일간의 힘을 쓰게 하는 식상·재성 계열의 위치별 세력을 반영했습니다.", weight: -drain });
  if (control > 0) forceEvidence.push({ id: "strength-control", ruleId: "STR-007", type: "control", source: "pillars", description: "원국에서 일간을 제어하는 관성 계열의 위치별 세력을 반영했습니다.", weight: -control });

  const deukseScore = clamp(50 + (support - drain - control) * 2);
  const internalScore = Math.round(clamp(STRENGTH_RULES.baseScore + contributions.reduce((sum, item) => sum + item.adjustedWeight, 0)));
  const distanceFromBoundary = getDistanceFromStrengthBoundary(internalScore);
  const boundaryPenalty = distanceFromBoundary <= 1 ? STRENGTH_RULES.boundaryConfidencePenalty.near1 : distanceFromBoundary <= 3 ? STRENGTH_RULES.boundaryConfidencePenalty.near3 : distanceFromBoundary <= 5 ? STRENGTH_RULES.boundaryConfidencePenalty.near5 : 0;
  const axesNearBoundary = [50 + monthDelta * 2, rootScore, deukseScore].filter((score) => score >= 40 && score <= 60).length;
  const evidence = [monthEvidence, ...rootEvidence, ...forceEvidence];
  const confidence = clamp(0.6 + Math.min(evidence.length, 8) * 0.035 - axesNearBoundary * 0.035 - boundaryPenalty, 0.4, 0.88);

  return {
    level: getStrengthLevel(internalScore), internalScore, distanceFromBoundary,
    confidence: Math.round(confidence * 100) / 100, contributions,
    factors: {
      deukryeong: { level: factorLevel(clamp(50 + monthDelta * 2)), score: clamp(50 + monthDelta * 2), evidence: [monthEvidence] },
      deukji: { level: factorLevel(rootScore), score: rootScore, evidence: rootEvidence },
      deukse: { level: factorLevel(deukseScore), score: deukseScore, evidence: forceEvidence },
      support, drain, control,
    },
    evidence,
  };
}
