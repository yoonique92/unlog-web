import type { FiveElement, NormalizedSaju } from "../saju/types";
import { getElementEffect } from "./elements";
import type { EokbuAnalysis, EokbuCandidate, Evidence, StrengthAnalysis } from "./types";

const ELEMENTS: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];
const weakLevels = new Set(["very_weak", "weak", "balanced_weak"]);
const strongLevels = new Set(["balanced_strong", "strong", "very_strong"]);

export function analyzeEokbu(saju: NormalizedSaju, strength: StrengthAnalysis): EokbuAnalysis {
  const isWeak = weakLevels.has(strength.level);
  const isStrong = strongLevels.has(strength.level);
  const candidates: EokbuCandidate[] = ELEMENTS.map((element) => {
    const effect = getElementEffect(saju.dayMaster.element, element);
    const supportive = effect === "same" || effect === "resource";
    let score = !isWeak && !isStrong ? 45 : isWeak === supportive ? 58 : 30;
    const count = saju.elementDistribution[element];
    const supportingEvidence: Evidence[] = [{ id: `eokbu-direction-${element}`, ruleId: "EOKBU-001", type: supportive ? "support" : effect === "control" ? "control" : "drain", source: "strength+elementEffect", description: "신강 축과 해당 오행의 지원·소모·제어 방향을 후보의 시작점으로 사용했습니다.", technicalDescription: `${strength.level}/${effect}`, weight: score }];
    const risks: string[] = [];
    if (count === 0) {
      score += 7;
      supportingEvidence.push({ id: `eokbu-absent-${element}`, ruleId: "EOKBU-002", type: "natal", source: "elementDistribution", description: "원국에 드러나지 않은 오행이라 보완 후보로 검토합니다.", weight: 7 });
      risks.push("원국에 없는 오행은 실제 작용 기반이 약할 수 있어 단순 보충으로 확정할 수 없음");
    } else if (count >= 3) {
      score -= 20;
      risks.push("원국에 이미 같은 오행이 많아 추가될 경우 과잉 가능");
    }
    if (saju.pillars.month.branchElement === element) {
      score -= 7;
      risks.push("월령에서 이미 강한 계절 영향이 있어 추가 강화 시 균형을 해칠 가능성");
    }
    if (supportive && strength.factors.deukji.level === "strong") {
      score -= 8;
      risks.push("이미 통근이 강해 지원 오행을 더하는 것이 항상 유리하지 않을 수 있음");
    }
    score = Math.max(0, Math.min(100, score));
    const role: EokbuCandidate["role"] = supportive ? "support" : effect === "control" ? "control" : "drain";
    return { element, role, score, confidence: Math.round(Math.min(0.76, 0.35 + score * 0.0045) * 100) / 100, supportingEvidence, risks };
  }).sort((a, b) => b.score - a.score);
  const top = candidates[0];
  return {
    status: !top || top.score < 48 || (candidates[1] && top.score - candidates[1].score < 5) ? "uncertain" : "candidate",
    candidates: candidates.slice(0, 3),
    avoidCandidates: candidates.filter((item) => item.score <= 30).map((item) => ({ element: item.element, reason: item.risks[0] ?? "현재 강약 구조에서 우선도가 낮음" })),
    confidence: top?.confidence ?? 0,
  };
}
