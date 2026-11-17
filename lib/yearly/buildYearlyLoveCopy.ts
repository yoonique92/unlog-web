import type { LoveSituationKey } from "../yearlyReadingContext";
import { YEARLY_COPY_VERSION } from "./buildYearlyOverallCopy";
import {
  LOVE_CONTEXT_COPY_REGISTRY,
  selectLoveBody,
  selectLoveHeadline,
  selectLoveTip,
} from "./interpretationCopy/love";
import type {
  YearlyInterpretationSignals,
  YearlyLoveCopy,
} from "./types";

interface BuildYearlyLoveCopyInput {
  signals: YearlyInterpretationSignals["love"];
  love: LoveSituationKey;
}

export function buildYearlyLoveCopy({
  signals,
  love,
}: BuildYearlyLoveCopyInput): YearlyLoveCopy {
  const ordered = [...signals].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
  const annual = ordered.filter(({ id }) =>
    id.startsWith("love-annual-") || id.startsWith("love-stage-")
  );
  const daeun = ordered.filter(({ id }) => id.startsWith("love-daeun-"));
  const metadata = LOVE_CONTEXT_COPY_REGISTRY[love];
  const body = selectLoveBody(metadata, annual, daeun);
  const sourceSignalIds = [...new Set([
    ...annual.filter(({ id }) => id.startsWith("love-annual-")).slice(0, 2).map(({ id }) => id),
    body.phaseSignalId,
    body.cautionSignalId,
  ].filter((id): id is string => Boolean(id)))];

  return {
    version: YEARLY_COPY_VERSION,
    section: "love",
    headline: selectLoveHeadline(metadata, annual),
    body: body.text,
    tip: selectLoveTip(metadata, annual),
    context: love,
    sourceSignalIds,
  };
}
