import {
  selectOverallCombination,
  selectOverallTip,
  selectPhaseCopy,
  selectTwelveSalCopy,
} from "./interpretationCopy/overall";
import type {
  YearlyInterpretationSignals,
  YearlyOverallCopy,
} from "./types";

export const YEARLY_COPY_VERSION = "yearly-copy-v1" as const;

export function buildYearlyOverallCopy(
  signals: YearlyInterpretationSignals["overall"],
): YearlyOverallCopy {
  const ordered = [...signals].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
  const annual = ordered.filter(({ id }) => id.startsWith("annual-"));
  const daeun = ordered.filter(({ id }) => id.startsWith("daeun-"));
  const combination = selectOverallCombination(annual);
  const phase = selectPhaseCopy(annual);
  const twelveSal = selectTwelveSalCopy(annual);
  const tip = selectOverallTip(annual, daeun);
  const firstParagraph = [combination.core, phase?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const secondParagraph = [phase?.detail, twelveSal?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const body = [firstParagraph, secondParagraph].filter(Boolean).join("\n\n");
  const sourceSignalIds = [...new Set([
    ...annual
      .filter(({ id }) => !id.startsWith("annual-twelve-sal-") && !id.startsWith("annual-stage-"))
      .slice(0, 2)
      .map(({ id }) => id),
    phase?.signalId,
    twelveSal?.signalId,
    tip.signalId,
  ].filter((id): id is string => Boolean(id)))];

  return {
    version: YEARLY_COPY_VERSION,
    section: "overall",
    headline: combination.headline,
    body,
    tip: tip.text,
    sourceSignalIds,
  };
}
