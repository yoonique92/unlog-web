import { calculateSajuWithBoundaryPolicies } from "../saju/policyAdapter";
import type { LegacySsajuAnalysis, SajuCalculationInput } from "../saju/types";
import { buildReadingContext } from "../reading/buildContext";
import { aggregateFindings } from "./findings";
import { analyzeEokbu } from "./eokbu";
import { analyzeGeukguk } from "./geukguk";
import { analyzeJohu } from "./johu";
import { analyzeNatalPatterns } from "./natalPatterns";
import { analyzeStrength } from "./strength";
import { analyzeTimeline } from "./timeline";
import type { UnlogAnalysis, UnlogSajuAnalysisResult, YongsinAnalysis } from "./types";

export function analyzeUnlogSaju(input: SajuCalculationInput): UnlogSajuAnalysisResult {
  const targetYear = input.targetYear ?? new Date().getFullYear();
  const policyResult = calculateSajuWithBoundaryPolicies({ ...input, targetYear });
  const normalizedSaju = policyResult.normalized;
  const strength = analyzeStrength(normalizedSaju);
  const johu = analyzeJohu(normalizedSaju);
  const natalFindings = aggregateFindings(analyzeNatalPatterns(normalizedSaju));
  const timelineFindings = analyzeTimeline(normalizedSaju, targetYear);
  const geukguk = analyzeGeukguk(normalizedSaju, strength);
  const eokbu = analyzeEokbu(normalizedSaju, strength);
  const crossAgreement: YongsinAnalysis["crossAgreement"] = johu.preferredElements.flatMap((johuCandidate) => {
    const eokbuCandidate = eokbu.candidates.find((item) => item.element === johuCandidate.element && item.score >= 45);
    return eokbuCandidate ? [{ element: johuCandidate.element, sources: ["eokbu", "johu"] as Array<"eokbu" | "johu" | "geukguk">, confidence: Math.round(Math.min(johu.confidence, eokbuCandidate.confidence) * 100) / 100 }] : [];
  });
  const yongsin: YongsinAnalysis = {
    status: eokbu.candidates.length || johu.preferredElements.length ? "candidate_only" : "insufficient_evidence",
    eokbu, johu,
    geukguk: { status: geukguk.status === "candidate" ? "candidate" : "not_implemented", candidates: geukguk.candidates },
    crossAgreement,
  };
  const analysis: UnlogAnalysis = { strength, johu, geukguk, yongsin, natalFindings, timelineFindings };
  // 비교 진단용 legacy ssaju 값은 원시 source에 남겨 두고,
  // 공식 분석 경로는 위의 canonical normalizedSaju만 소비합니다.
  const legacyRaw = policyResult.sources.actualAdjusted.raw;
  const legacyAnalysis: LegacySsajuAnalysis = {
    ssajuDayStrength: legacyRaw.advanced.dayStrength,
    ssajuGeukguk: legacyRaw.advanced.geukguk,
    ssajuYongsin: legacyRaw.advanced.yongsin,
    ssajuInterpretation: legacyRaw.advanced.interpretation,
    ssajuSinsal: legacyRaw.advanced.sinsal,
  };
  return {
    normalizedSaju,
    gongmang: policyResult.gongmang,
    calculationPolicy: {
      ...policyResult.policies,
      ...policyResult.boundary,
    },
    legacyAnalysis,
    analysis,
    readingContext: buildReadingContext(normalizedSaju, analysis, targetYear),
  };
}
