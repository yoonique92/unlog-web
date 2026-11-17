import { getTenGodForStem } from "../tenGodUtils";
import type { NormalizedSaju } from "../saju/types";
import { GEUKGUK_RULES, isJianLuMonth, TEN_GOD_TO_GEUKGUK } from "./geukgukRules";
import type { Evidence, GeukgukAnalysis, GeukgukCandidate, MonthCommandAnalysis, StrengthAnalysis } from "./types";

export function analyzeMonthCommand(saju: NormalizedSaju): MonthCommandAnalysis {
  const monthHidden = saju.hiddenStems.filter((item) => item.pillar === "month");
  const visibleStems = Object.values(saju.pillars).map((pillar) => pillar.stem);
  const evidence: Evidence[] = [];
  const hiddenStems = monthHidden.map((hidden) => {
    const exposed = visibleStems.includes(hidden.stem);
    const rooted = saju.hiddenStems.some((item) => item.pillar !== "month" && item.stem === hidden.stem);
    const tenGod = getTenGodForStem(saju.dayMaster.stem, hidden.stem);
    evidence.push({ id: `geuk-month-${hidden.role}-${hidden.stem}`, ruleId: "GEUK-001", type: "month_command", source: `month.hiddenStems.${hidden.role}`, description: `월지 ${hidden.role === "main" ? "본기" : hidden.role === "middle" ? "중기" : "여기"}의 십성을 격국 후보 재료로 확인했습니다.`, technicalDescription: `${hidden.stem}/${tenGod}, exposed=${exposed}, rooted=${rooted}` });
    return { stem: hidden.stem, layer: hidden.role, tenGod, exposed, rooted };
  });
  return { monthBranch: saju.seasonal.monthBranch, hiddenStems, evidence };
}

export function analyzeGeukguk(saju: NormalizedSaju, strength: StrengthAnalysis): GeukgukAnalysis {
  const monthCommand = analyzeMonthCommand(saju);
  const monthRelationCount = [...saju.relations.combinations, ...saju.relations.clashes, ...saju.relations.punishments, ...saju.relations.harms, ...saju.relations.breaks]
    .filter((relation) => relation.pillars.includes("month")).length;
  const candidates: GeukgukCandidate[] = monthCommand.hiddenStems.flatMap((hidden) => {
    const isGeonrok = hidden.tenGod === "비견" && isJianLuMonth(saju.dayMaster.stem, monthCommand.monthBranch);
    // 겁재만으로 양인 후보를 만들지 않는다. 검증된 양인지 매핑이 추가되기 전까지 보류한다.
    if ((hidden.tenGod === "비견" && !isGeonrok) || hidden.tenGod === "겁재") return [];
    const candidateType = isGeonrok ? "geonrok" : TEN_GOD_TO_GEUKGUK[hidden.tenGod];
    if (!candidateType) return [];
    const supportingEvidence = monthCommand.evidence.filter((item) => item.source.endsWith(hidden.layer));
    if (isGeonrok) supportingEvidence.push({ id: `geuk-geonrok-prerequisite-${saju.dayMaster.stem}`, ruleId: "GEUK-006", type: "month_command", source: "dayMaster+month.branch", description: "일간의 건록지와 월지가 일치하여 건록 후보 성립 전제조건을 충족합니다.", technicalDescription: `${saju.dayMaster.stem}→${monthCommand.monthBranch}` });
    let score: number = GEUKGUK_RULES.layerWeights[hidden.layer];
    if (hidden.exposed) {
      score += GEUKGUK_RULES.exposedBonus;
      supportingEvidence.push({ id: `geuk-exposed-${hidden.stem}`, ruleId: "GEUK-002", type: "month_command", source: "pillars.stems", description: "월지 지장간이 천간에 투출되어 후보 근거가 보강됩니다.", technicalDescription: hidden.stem, weight: GEUKGUK_RULES.exposedBonus });
    }
    if (hidden.rooted) {
      score += GEUKGUK_RULES.rootedBonus;
      supportingEvidence.push({ id: `geuk-rooted-${hidden.stem}`, ruleId: "GEUK-003", type: "root", source: "hiddenStems", description: "같은 천간이 다른 지지에도 뿌리를 두어 후보 근거가 보강됩니다.", technicalDescription: hidden.stem, weight: GEUKGUK_RULES.rootedBonus });
    }
    const contradictingEvidence: Evidence[] = [];
    if (monthRelationCount > 0) {
      score -= GEUKGUK_RULES.relationRiskPenalty;
      contradictingEvidence.push({ id: `geuk-relation-risk-${hidden.stem}`, ruleId: "GEUK-004", type: "relation", source: "relations.month", description: "월지와 관련된 합·충·형·파·해가 있어 구조 변화 가능성을 전문가가 검토해야 합니다.", weight: -GEUKGUK_RULES.relationRiskPenalty });
    }
    score = Math.max(0, Math.min(100, score));
    const status: GeukgukCandidate["status"] = score >= GEUKGUK_RULES.probableThreshold ? "probable" : score >= GEUKGUK_RULES.possibleThreshold ? "possible" : "uncertain";
    return [{
      type: candidateType, score,
      confidence: Math.round(Math.min(0.78, 0.35 + score * 0.0045) * 100) / 100,
      supportingEvidence, contradictingEvidence,
      status,
    }];
  }).sort((a, b) => b.score - a.score).slice(0, GEUKGUK_RULES.maxCandidates);
  const specialPatternCandidates: GeukgukAnalysis["specialPatternCandidates"] = [];
  if (strength.level === "very_weak" || strength.level === "very_strong") {
    specialPatternCandidates.push({
      type: strength.level === "very_weak" ? "follow_weak_candidate" : "follow_strong_candidate",
      confidence: 0.3, status: "needs_review",
      evidence: [{ id: "geuk-special-review", ruleId: "GEUK-005", type: "natal", source: "strength.level", description: "극단 강약 신호만 확인되며 종격 여부는 확정하지 않습니다.", technicalDescription: strength.level }],
    });
  }
  const primary = candidates[0];
  return {
    status: candidates.length === 0 ? "not_enough_evidence" : primary.status === "uncertain" ? "uncertain" : "candidate",
    monthCommand, candidates, primaryCandidate: primary?.type, specialPatternCandidates,
    evidence: [...monthCommand.evidence, ...candidates.flatMap((item) => [...item.supportingEvidence, ...item.contradictingEvidence])],
    confidence: primary?.confidence ?? 0,
  };
}
