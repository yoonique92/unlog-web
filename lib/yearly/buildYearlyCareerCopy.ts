import type { CareerSituationKey } from "../yearlyReadingContext";
import { YEARLY_COPY_VERSION } from "./buildYearlyOverallCopy";
import {
  CAREER_CONTEXT_COPY_REGISTRY,
  selectCareerBody,
  selectCareerHeadline,
  selectCareerTip,
} from "./interpretationCopy/career";
import type {
  YearlyCareerCopy,
  YearlyInterpretationSignals,
} from "./types";

interface BuildYearlyCareerCopyInput {
  signals: YearlyInterpretationSignals["career"];
  career: CareerSituationKey;
}

export function buildYearlyCareerCopy({
  signals,
  career,
}: BuildYearlyCareerCopyInput): YearlyCareerCopy {
  const ordered = [...signals].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
  const annual = ordered.filter(({ id }) => id.startsWith("career-annual-") || id.startsWith("career-stage-"));
  const daeun = ordered.filter(({ id }) => id.startsWith("career-daeun-"));
  const metadata = CAREER_CONTEXT_COPY_REGISTRY[career];
  const body = selectCareerBody(metadata, annual, daeun);
  const sourceSignalIds = [...new Set([
    ...annual.filter(({ id }) => id.startsWith("career-annual-")).slice(0, 2).map(({ id }) => id),
    body.phaseSignalId,
    body.cautionSignalId,
  ].filter((id): id is string => Boolean(id)))];

  return {
    version: YEARLY_COPY_VERSION,
    section: "career",
    headline: selectCareerHeadline(metadata, annual),
    body: body.text,
    tip: selectCareerTip(metadata, annual),
    context: career,
    sourceSignalIds,
  };
}
