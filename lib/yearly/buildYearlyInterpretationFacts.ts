import { getCanonicalTwelveSalId } from "../saju/salCalculator";
import type { PillarPosition } from "../saju/types";
import type {
  BuildYearlyInterpretationFactsInput,
  YearlyInterpretationFacts,
} from "./types";

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];

export function buildYearlyInterpretationFacts({
  snapshot,
}: BuildYearlyInterpretationFactsInput): YearlyInterpretationFacts {
  const natalYearBranch = snapshot.natal.pillars.year.branch;
  const salIdsByPosition = Object.fromEntries(
    POSITIONS.map((position) => [
      position,
      snapshot.natal.sals[position].sals
        // Gwimun is a relation-level fact. Its pillar entry is display projection only.
        .filter(({ id }) => id !== "gwimun_gwansal")
        .map(({ id }) => id),
    ]),
  ) as YearlyInterpretationFacts["natal"]["salIdsByPosition"];

  return {
    targetYear: snapshot.targetYear,
    natal: {
      dayMaster: snapshot.natal.dayMaster,
      salIdsByPosition,
      relationSals: snapshot.natal.relationSals,
    },
    daeun: {
      period: snapshot.timing.targetDaeun,
    },
    annual: {
      period: snapshot.timing.annual,
      twelveSalId: getCanonicalTwelveSalId(
        natalYearBranch,
        snapshot.timing.annual.branch,
      ),
    },
    monthly: snapshot.timing.monthly.map((period) => ({
      period,
      twelveSalId: getCanonicalTwelveSalId(natalYearBranch, period.branch),
    })),
  };
}
