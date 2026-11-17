import { YEARLY_COPY_VERSION } from "./buildYearlyOverallCopy";
import {
  selectMoneyCautionCopy,
  selectMoneyCombination,
  selectMoneyPhaseCopy,
  selectMoneyTip,
} from "./interpretationCopy/money";
import type {
  YearlyInterpretationSignals,
  YearlyMoneyCopy,
} from "./types";

export function buildYearlyMoneyCopy(
  signals: YearlyInterpretationSignals["money"],
): YearlyMoneyCopy {
  const ordered = [...signals].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
  const annual = ordered.filter(({ id }) =>
    id.startsWith("money-annual-") || id.startsWith("money-stage-")
  );
  const daeun = ordered.filter(({ id }) => id.startsWith("money-daeun-"));
  const combination = selectMoneyCombination(annual);
  const phase = selectMoneyPhaseCopy(annual);
  const caution = selectMoneyCautionCopy(annual, daeun);
  const firstParagraph = [combination.core, phase?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const secondParagraph = [phase?.detail, caution?.text]
    .filter((text): text is string => Boolean(text))
    .join(" ");
  const body = [firstParagraph, secondParagraph].filter(Boolean).join("\n\n");
  const sourceSignalIds = [...new Set([
    ...annual.filter(({ id }) => id.startsWith("money-annual-")).slice(0, 2).map(({ id }) => id),
    phase?.signalId,
    caution?.signalId,
  ].filter((id): id is string => Boolean(id)))];

  return {
    version: YEARLY_COPY_VERSION,
    section: "money",
    headline: combination.headline,
    body,
    tip: selectMoneyTip(annual, Boolean(caution)),
    sourceSignalIds,
  };
}
