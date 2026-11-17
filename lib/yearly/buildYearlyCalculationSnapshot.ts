import { getSaju } from "../saju";
import { calculateSajuWithBoundaryPolicies } from "../saju/policyAdapter";
import type { DaeunPeriod } from "../saju/types";
import type {
  YearlyCalculationProfile,
  YearlyCalculationSnapshot,
  YearlyCalculationSnapshotInput,
} from "./types";

function toBirthTime(profile: YearlyCalculationProfile) {
  return `${String(profile.birthHour).padStart(2, "0")}:${String(
    profile.birthMinute,
  ).padStart(2, "0")}`;
}

function containsYear(period: DaeunPeriod, year: number) {
  return (
    year >= period.startYear &&
    year <= period.startYear + (period.endAge - period.startAge)
  );
}

/**
 * Builds calculation-only data for a single yearly reading.
 *
 * Natal data deliberately comes from the existing production getSaju facade.
 * Timing data uses the same canonical policy adapter with an explicit target
 * year, so it does not inherit getSaju's runtime-relative cycle window.
 */
export function buildYearlyCalculationSnapshot({
  profile,
  targetYear,
}: YearlyCalculationSnapshotInput): YearlyCalculationSnapshot {
  if (!Number.isInteger(targetYear)) {
    throw new TypeError("targetYear must be an integer");
  }

  const natal = getSaju(
    profile.birthDate,
    String(profile.birthHour),
    String(profile.birthMinute),
    profile.calendarType,
    profile.gender,
    profile.birthTimeUnknown,
  );
  const target = calculateSajuWithBoundaryPolicies({
    birthDate: profile.birthDate,
    birthTime: toBirthTime(profile),
    birthTimeUnknown: profile.birthTimeUnknown,
    calendar: profile.calendarType,
    gender: profile.gender,
    targetYear,
  }).normalized;

  const annual = target.seyun.find((period) => period.year === targetYear);
  if (!annual) {
    throw new RangeError(`Canonical timing data is missing annual year ${targetYear}`);
  }

  const targetDaeun =
    target.daeun.find((period) => containsYear(period, targetYear)) ?? null;

  return {
    targetYear,
    natal: {
      pillars: natal.normalizedSaju.pillars,
      dayMaster: natal.normalizedSaju.dayMaster,
      tenGods: natal.normalizedSaju.tenGods,
      stages12: natal.normalizedSaju.twelveStages,
      sals: natal.sals,
      relationSals: natal.relationSals,
    },
    timing: {
      targetDaeun,
      annual,
      monthly: target.wolun,
    },
  };
}
