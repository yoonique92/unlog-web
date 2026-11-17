import { getCanonicalTwelveSalId } from "../saju/salCalculator";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { calculateMonthlyTransitRelations } from "./calculateMonthlyTransitRelations";
import type {
  CalendarMonth,
  MonthlyCalendarSlot,
  MonthlyCompositeFacts,
  SeasonalMonthOrdinal,
  YearlyCalculationProfile,
  YearlyCalculationSnapshot,
} from "./types";

const CALENDAR_MONTHS: CalendarMonth[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

function requireSeasonalPeriod(
  snapshot: YearlyCalculationSnapshot,
  seasonalOrdinal: SeasonalMonthOrdinal,
) {
  const period = snapshot.timing.monthly.find(
    ({ month }) => month === seasonalOrdinal,
  );

  if (!period) {
    throw new RangeError(
      `Canonical timing data is missing seasonal month ${seasonalOrdinal} for ${snapshot.targetYear}`,
    );
  }

  return period;
}

function createMonthlyCalendarSlots(
  selectedYearSnapshot: YearlyCalculationSnapshot,
  previousYearSnapshot: YearlyCalculationSnapshot,
): MonthlyCalendarSlot[] {
  const displayYear = selectedYearSnapshot.targetYear;

  return CALENDAR_MONTHS.map((displayMonth) => {
    const isJanuary = displayMonth === 1;
    const seasonalYear = isJanuary ? displayYear - 1 : displayYear;
    const seasonalOrdinal = (isJanuary
      ? 12
      : displayMonth - 1) as SeasonalMonthOrdinal;
    const sourceSnapshot = isJanuary
      ? previousYearSnapshot
      : selectedYearSnapshot;

    return {
      displayYear,
      displayMonth,
      seasonalYear,
      seasonalOrdinal,
      period: requireSeasonalPeriod(sourceSnapshot, seasonalOrdinal),
    };
  });
}

function buildSnapshots(profile: YearlyCalculationProfile, targetYear: number) {
  return {
    selected: buildYearlyCalculationSnapshot({ profile, targetYear }),
    previous: buildYearlyCalculationSnapshot({
      profile,
      targetYear: targetYear - 1,
    }),
  };
}

/**
 * Adapts canonical seasonal months to user-facing calendar months.
 * January belongs to the preceding seasonal calculation year (month 12, 丑).
 */
export function buildMonthlyCalendarSlots(
  profile: YearlyCalculationProfile,
  targetYear: number,
): MonthlyCalendarSlot[] {
  const snapshots = buildSnapshots(profile, targetYear);
  return createMonthlyCalendarSlots(snapshots.selected, snapshots.previous);
}

/**
 * Collects existing canonical facts without deriving relations or signals.
 * January uses the preceding seasonal year's annual context. Canonical daeun
 * periods currently expose only year-level boundaries, so daeun remains the
 * selected target year's period for all display months.
 */
export function buildMonthlyCompositeFacts(
  profile: YearlyCalculationProfile,
  targetYear: number,
): MonthlyCompositeFacts[] {
  const snapshots = buildSnapshots(profile, targetYear);
  const calendarSlots = createMonthlyCalendarSlots(
    snapshots.selected,
    snapshots.previous,
  );
  const natalYearBranch = snapshots.selected.natal.pillars.year.branch;

  return calendarSlots.map((calendar) => {
    const annualPeriod =
      calendar.displayMonth === 1
        ? snapshots.previous.timing.annual
        : snapshots.selected.timing.annual;

    const baseFacts: Omit<MonthlyCompositeFacts, "interactions"> = {
      calendar,
      natal: {
        dayMaster: snapshots.selected.natal.dayMaster,
        pillars: snapshots.selected.natal.pillars,
      },
      daeun: {
        period: snapshots.selected.timing.targetDaeun,
      },
      annual: {
        period: annualPeriod,
        twelveSalId: getCanonicalTwelveSalId(
          natalYearBranch,
          annualPeriod.branch,
        ),
      },
      monthly: {
        period: calendar.period,
        twelveSalId: getCanonicalTwelveSalId(
          natalYearBranch,
          calendar.period.branch,
        ),
      },
    };
    return {
      ...baseFacts,
      interactions: calculateMonthlyTransitRelations(baseFacts),
    };
  });
}
