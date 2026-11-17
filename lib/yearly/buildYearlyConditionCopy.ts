import { YEARLY_COPY_VERSION } from "./buildYearlyOverallCopy";
import {
  selectConditionCautionCopy,
  selectConditionCombination,
  selectConditionPhaseCopy,
  selectConditionTip,
} from "./interpretationCopy/condition";
import type {
  YearlyConditionCopy,
  YearlyInterpretationSignals,
} from "./types";

export function buildYearlyConditionCopy(
  signals: YearlyInterpretationSignals["condition"],
): YearlyConditionCopy {
  const ordered = [...signals].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
  const annual = ordered.filter(({ id }) =>
    id.startsWith("condition-annual-") || id.startsWith("condition-stage-")
  );
  const daeun = ordered.filter(({ id }) => id.startsWith("condition-daeun-"));
  const combination = selectConditionCombination(annual);
  const phase = selectConditionPhaseCopy(annual);
  const caution = selectConditionCautionCopy(annual, daeun);
  const firstParagraph = [combination.core, phase?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const secondParagraph = [phase?.detail, caution?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const body = [firstParagraph, secondParagraph].filter(Boolean).join("\n\n");
  const sourceSignalIds = [...new Set([
    ...annual.filter(({ id }) => id.startsWith("condition-annual-"))
      .slice(0, 2)
      .map(({ id }) => id),
    phase?.signalId,
    caution?.signalId,
  ].filter((id): id is string => Boolean(id)))];

  return {
    version: YEARLY_COPY_VERSION,
    section: "condition",
    headline: combination.headline,
    body,
    tip: selectConditionTip(annual, Boolean(caution)),
    sourceSignalIds,
  };
}
