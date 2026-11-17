import type { NormalizedSaju } from "../saju/types";
import type { UnlogAnalysis } from "../myeongri/types";
import type { ReadingContext } from "./types";

export const UNLOG_READING_SYSTEM_PRINCIPLES = `
아래 데이터는 운로그 명리 엔진이 계산한 결과다.
사주팔자, 천간/지지, 십성, 신강/신약, 격국, 용신, 대운, 세운, 합충형파해를 새로 계산하거나 추측하지 마라.
제공된 Finding과 Evidence의 범위 안에서만 설명하고 근거에 없는 명리 사실을 만들지 마라.
여러 근거가 같은 결론을 지지하면 현대적인 생활 언어로 자연스럽게 연결하라.
미래 사건을 확정적으로 예언하지 말고 가능성, 경향, 시기적 흐름으로 표현하라.
"반드시", "무조건", "100%" 같은 표현을 사용하지 마라.
격국과 용신은 후보로만 표현한다. "당신은 ○○격입니다", "용신은 ○○입니다"처럼 확정하지 마라.
허용 예: "○○격 성향이 후보로 나타납니다", "화 기운이 조후와 억부 양쪽의 후보로 나타납니다."
질병, 임신, 사망, 사고, 결혼 또는 이혼 시점을 예언하거나 단정하지 마라.
응답은 sections 배열을 가진 JSON이며 각 section은 제공된 findingId, title, body만 포함한다.
`.trim();

export function buildReadingContext(normalized: NormalizedSaju, analysis: UnlogAnalysis, targetYear: number): ReadingContext {
  const seyun = normalized.seyun.find((item) => item.year === targetYear);
  const pillarText = (position: keyof NormalizedSaju["pillars"]) => {
    const pillar = normalized.pillars[position];
    return pillar ? `${pillar.stem}${pillar.branch}` : undefined;
  };
  return {
    profile: {
      dayMaster: normalized.dayMaster,
      season: normalized.seasonal.season,
      pillars: { year: pillarText("year")!, month: pillarText("month")!, day: pillarText("day")!, hour: pillarText("hour") },
      tenGods: [...new Set(normalized.tenGods.map((item) => item.name).filter((name) => name && name !== "(일간)"))],
      daeunGanzhi: normalized.currentDaeun?.ganzhi,
      targetSeyunGanzhi: seyun?.ganzhi,
    },
    strength: analysis.strength,
    johu: analysis.johu,
    geukguk: analysis.geukguk,
    yongsin: analysis.yongsin,
    topNatalFindings: analysis.natalFindings,
    timelineFindings: analysis.timelineFindings,
    constraints: { geukgukStatus: analysis.geukguk.status, yongsinStatus: analysis.yongsin.status, sinsalProvided: false, candidateLanguageOnly: true, medicalPredictionAllowed: false },
  };
}
