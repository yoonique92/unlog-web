import type { FiveElement, NormalizedSaju } from "../saju/types";
import { BRANCH_ELEMENT, STEM_ELEMENT } from "../saju/normalize";
import { getElementEffect } from "./elements";
import type { Evidence, TimelineFinding } from "./types";

function influenceScore(dayElement: FiveElement, elements: Array<FiveElement | undefined>) {
  return elements.reduce<number>((score, element) => {
    if (!element) return score;
    const effect = getElementEffect(dayElement, element);
    return score + (effect === "same" || effect === "resource" ? 1 : effect === "control" ? -1 : -0.6);
  }, 0);
}

export function analyzeTimeline(saju: NormalizedSaju, targetYear: number): TimelineFinding[] {
  const seyun = saju.seyun.find((period) => period.year === targetYear);
  if (!seyun) return [];
  const daeun = saju.daeun.find((period) => targetYear >= period.startYear && targetYear <= period.startYear + (period.endAge - period.startAge));
  const natalElements = Object.values(saju.pillars).flatMap((pillar) => [pillar.stemElement, pillar.branchElement]);
  const natalScore = influenceScore(saju.dayMaster.element, natalElements);
  const daeunScore = daeun ? influenceScore(saju.dayMaster.element, [STEM_ELEMENT[daeun.stem], BRANCH_ELEMENT[daeun.branch]]) : 0;
  const seyunScore = influenceScore(saju.dayMaster.element, [STEM_ELEMENT[seyun.stem], BRANCH_ELEMENT[seyun.branch]]);
  const evidence: Evidence[] = [
    { id: `timeline-seyun-${targetYear}`, ruleId: "TIME-001", type: "seyun", source: `seyun.${targetYear}`, description: `${targetYear}년 세운이 원국의 일간에 보태거나 소모하는 방향을 비교했습니다.`, technicalDescription: `${seyun.ganzhi}: ${seyun.stemTenGod}/${seyun.branchTenGod}`, weight: seyunScore },
  ];
  if (daeun) evidence.push({ id: `timeline-daeun-${daeun.startYear}`, ruleId: "TIME-002", type: "daeun", source: "daeun.currentAtTargetYear", description: "해당 연도의 대운과 세운이 같은 방향으로 겹치는지 함께 살폈습니다.", technicalDescription: `${daeun.ganzhi}: ${daeun.stemTenGod}/${daeun.branchTenGod}`, weight: daeunScore });

  const combined = daeunScore + seyunScore;
  const supportive = combined >= 0;
  return [{
    id: `timeline-energy-${targetYear}`, year: targetYear, category: supportive ? "energy" : "stress",
    title: supportive ? "기존 힘을 활용하기 쉬워지는 흐름" : "힘의 배분과 조절이 중요한 흐름",
    summary: supportive
      ? "현재 대운과 올해의 흐름이 원국의 자원을 보태는 쪽에 가까워, 익숙한 강점을 실제 행동으로 연결하기 좋을 수 있습니다."
      : "현재 대운과 올해의 흐름에서 소모·제어 요소가 함께 보여, 일을 넓히기보다 우선순위와 속도를 조절하는 편이 안정적일 수 있습니다.",
    score: Math.round(Math.min(90, 55 + Math.abs(combined) * 8)),
    confidence: daeun ? 0.73 : 0.62, evidence,
    period: { from: `${targetYear}-01-01`, to: `${targetYear}-12-31` },
    influence: { natal: natalScore, daeun: daeunScore, seyun: seyunScore },
  }];
}
