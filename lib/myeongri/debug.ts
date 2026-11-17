import { ELEMENT_LABELS } from "./elements";
import { GEUKGUK_LABELS } from "./geukgukRules";
import type { AnalysisComparison } from "./comparison";
import type { UnlogSajuAnalysisResult } from "./types";
import { getRuleMetadata } from "./rules";

export function formatMyeongriDebug(result: UnlogSajuAnalysisResult, comparison?: AnalysisComparison) {
  if (process.env.NODE_ENV === "production") return "UNLOG MYEONGRI DEBUG is disabled in production.";
  const { normalizedSaju, analysis } = result;
  const { strength, johu, geukguk, yongsin } = analysis;
  return [
    "UNLOG MYEONGRI DEBUG", "====================", "", "DAY MASTER",
    `${normalizedSaju.dayMaster.stem} / ${ELEMENT_LABELS[normalizedSaju.dayMaster.element]} / ${normalizedSaju.dayMaster.yinYang}`,
    "", "STRENGTH", "--------", `level: ${strength.level}`, `score: ${strength.internalScore}`,
    `boundary distance: ${strength.distanceFromBoundary}`, `confidence: ${strength.confidence}`, "", "Contributions:",
    ...strength.contributions.map((item) => {
      const rule = getRuleMetadata(item.ruleId);
      return `${item.ruleId} [${rule.school}/${rule.status}] ${item.source.padEnd(22)} ${item.adjustedWeight >= 0 ? "+" : ""}${item.adjustedWeight} ${item.reason}`;
    }),
    "", "JOHU", "----", `Cold: ${johu.climate.cold}`, `Hot: ${johu.climate.hot}`, `Dry: ${johu.climate.dry}`, `Wet: ${johu.climate.wet}`,
    "", "Needs:", `Warming: ${johu.needs.warming}`, `Cooling: ${johu.needs.cooling}`, `Drying: ${johu.needs.drying}`, `Moistening: ${johu.needs.moistening}`,
    "", "GEUKGUK CANDIDATES", "------------------", ...geukguk.candidates.map((item) => `${GEUKGUK_LABELS[item.type]} 후보 score=${item.score} confidence=${item.confidence} (${item.status})`),
    "", "EOKBU CANDIDATES", "----------------", ...yongsin.eokbu.candidates.map((item) => `${ELEMENT_LABELS[item.element]} score=${item.score} confidence=${item.confidence} risks=${item.risks.join(" | ") || "none"}`),
    "", "CROSS AGREEMENT", "---------------", ...yongsin.crossAgreement.flatMap((item) => [`${ELEMENT_LABELS[item.element]}:`, ...item.sources.map((source) => `- ${source}`)]),
    ...(comparison ? ["", "SHADOW DIFFERENCES", "------------------", ...comparison.differences.map((item) => `${item.field}: ${item.message}`)] : []),
  ].join("\n");
}
