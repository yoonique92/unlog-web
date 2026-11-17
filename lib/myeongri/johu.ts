import type { FiveElement, NormalizedSaju } from "../saju/types";
import { VERIFIED_DETAILED_JOHU_RULES } from "./johuRules";
import type { Evidence, JohuAnalysis } from "./types";

const SEASON_CLIMATE = {
  spring: { cold: 35, hot: 30, dry: 30, wet: 55 },
  summer: { cold: 10, hot: 85, dry: 55, wet: 35 },
  autumn: { cold: 35, hot: 30, dry: 75, wet: 25 },
  winter: { cold: 85, hot: 10, dry: 25, wet: 75 },
} as const;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function analyzeJohu(saju: NormalizedSaju): JohuAnalysis {
  const base = SEASON_CLIMATE[saju.seasonal.season];
  const elements = saju.elementDistribution;
  const climate = {
    cold: clamp(base.cold + elements.water * 3 - elements.fire * 3),
    hot: clamp(base.hot + elements.fire * 3 - elements.water * 3),
    dry: clamp(base.dry + elements.metal * 2 + elements.fire - elements.water * 2),
    wet: clamp(base.wet + elements.water * 2 - elements.fire * 2),
  };
  const needs = {
    warming: clamp(climate.cold - climate.hot),
    cooling: clamp(climate.hot - climate.cold),
    drying: clamp(climate.wet - climate.dry),
    moistening: clamp(climate.dry - climate.wet),
  };
  const evidence: Evidence[] = [{
    id: "johu-season-climate", ruleId: "JOHU-001", type: "season", source: "seasonal.monthBranch",
    description: `${saju.seasonal.season} 계절의 기본적인 한·난·조·습과 원국에 이미 있는 화·수 기운을 함께 살폈습니다.`,
    technicalDescription: `월지 ${saju.seasonal.monthBranch}, cold=${climate.cold}, hot=${climate.hot}, dry=${climate.dry}, wet=${climate.wet}`,
  }];
  const preferredElements: JohuAnalysis["preferredElements"] = [];
  const addPreference = (element: FiveElement, reason: string, priority: number) => {
    if (!preferredElements.some((item) => item.element === element)) preferredElements.push({ element, reason, priority });
  };
  if (needs.warming >= 25) addPreference("fire", "차가운 계절 환경을 덥히는 방향", needs.warming);
  if (needs.cooling >= 25) addPreference("water", "뜨거운 계절 환경을 식히는 방향", needs.cooling);
  if (needs.moistening >= 25) addPreference("water", "건조한 계절 환경을 적시는 방향", needs.moistening);
  if (needs.drying >= 25) addPreference("fire", "습한 계절 환경을 말리는 방향", needs.drying);
  preferredElements.sort((a, b) => b.priority - a.priority);

  const detailedRule = VERIFIED_DETAILED_JOHU_RULES.find(
    (rule) => rule.dayStem === saju.dayMaster.stem && rule.monthBranch === saju.seasonal.monthBranch,
  );
  if (detailedRule) {
    evidence.push({ id: "johu-verified-detail", ruleId: "JOHU-002", type: "season", source: detailedRule.source, description: "검증된 일간·월지 세부 조후 규칙이 적용되었습니다." });
  }
  return { climate, needs, preferredElements, confidence: detailedRule ? 0.82 : 0.62, evidence };
}
