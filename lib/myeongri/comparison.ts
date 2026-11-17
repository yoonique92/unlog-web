import type { SajuCalculationInput } from "../saju/types";
import { analyzeUnlogSaju } from "./engine";
import { UNLOG_MYEONGRI_SHADOW_MODE_ENABLED } from "./config";
import type { GeukgukAnalysis, JohuAnalysis, StrengthAnalysis, YongsinAnalysis } from "./types";

export interface AnalysisDifference {
  field: "strength" | "geukguk" | "yongsin";
  legacyValue: unknown;
  unlogValue: unknown;
  message: string;
}

export interface AnalysisComparison {
  legacy: { dayStrength?: unknown; geukguk?: unknown; yongsin?: unknown };
  unlog: { strength: StrengthAnalysis; johu: JohuAnalysis; geukguk: GeukgukAnalysis; yongsin: YongsinAnalysis };
  differences: AnalysisDifference[];
}

export function compareLegacyAndUnlog(input: SajuCalculationInput): AnalysisComparison {
  const result = analyzeUnlogSaju(input);
  const legacy = { dayStrength: result.legacyAnalysis.ssajuDayStrength, geukguk: result.legacyAnalysis.ssajuGeukguk, yongsin: result.legacyAnalysis.ssajuYongsin };
  const differences: AnalysisDifference[] = [];
  if (result.legacyAnalysis.ssajuDayStrength.strength !== result.analysis.strength.level || result.legacyAnalysis.ssajuDayStrength.score !== result.analysis.strength.internalScore) differences.push({ field: "strength", legacyValue: legacy.dayStrength, unlogValue: { level: result.analysis.strength.level, score: result.analysis.strength.internalScore }, message: "강약 분류 또는 내부 점수가 다릅니다. 어느 쪽이 정답인지는 판정하지 않습니다." });
  differences.push({ field: "geukguk", legacyValue: legacy.geukguk, unlogValue: result.analysis.geukguk.candidates, message: "legacy 확정값과 운로그 후보군을 기록합니다. 직접적인 동일성 비교는 하지 않습니다." });
  differences.push({ field: "yongsin", legacyValue: legacy.yongsin, unlogValue: result.analysis.yongsin, message: "legacy 용신과 운로그의 독립 후보군을 기록합니다. 최종 용신을 선택하지 않습니다." });
  return { legacy, unlog: { strength: result.analysis.strength, johu: result.analysis.johu, geukguk: result.analysis.geukguk, yongsin: result.analysis.yongsin }, differences };
}

export function compareLegacyAndUnlogInDevelopment(input: SajuCalculationInput) {
  if (process.env.NODE_ENV === "production") throw new Error("명리 Shadow 비교는 개발환경에서만 사용할 수 있습니다.");
  if (!UNLOG_MYEONGRI_SHADOW_MODE_ENABLED) return null;
  return compareLegacyAndUnlog(input);
}
