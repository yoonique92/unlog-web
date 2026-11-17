import { afterEach, describe, expect, it, vi } from "vitest";
import { getSaju } from "../saju";
import { calculateSajuWithBoundaryPolicies } from "../saju/policyAdapter";
import type { YearlyCalculationProfile } from "./types";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

const UNKNOWN_HOUR_PROFILE: YearlyCalculationProfile = {
  ...PROFILE,
  birthTimeUnknown: true,
};

function canonicalTiming(profile: YearlyCalculationProfile, targetYear: number) {
  return calculateSajuWithBoundaryPolicies({
    birthDate: profile.birthDate,
    birthTime: `${String(profile.birthHour).padStart(2, "0")}:${String(
      profile.birthMinute,
    ).padStart(2, "0")}`,
    birthTimeUnknown: profile.birthTimeUnknown,
    calendar: profile.calendarType,
    gender: profile.gender,
    targetYear,
  }).normalized;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("buildYearlyCalculationSnapshot", () => {
  it("reuses production natal data and selects target-year timing", () => {
    const snapshot = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2027,
    });
    const production = getSaju("1992-01-14", "13", "0", "solar", "female");

    expect(snapshot.natal).toEqual({
      pillars: production.normalizedSaju.pillars,
      dayMaster: production.normalizedSaju.dayMaster,
      tenGods: production.normalizedSaju.tenGods,
      stages12: production.normalizedSaju.twelveStages,
      sals: production.sals,
      relationSals: production.relationSals,
    });
    expect(snapshot.timing.annual.year).toBe(2027);
    expect(snapshot.timing.monthly).toHaveLength(12);
  });

  it("builds 2032 timing even when the runtime-relative getSaju window excludes it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T00:00:00.000Z"));
    const runtimeRelative = getSaju("1992-01-14", "13", "0", "solar", "female");
    expect(runtimeRelative.normalizedSaju.seyun.some(({ year }) => year === 2032)).toBe(false);

    const snapshot = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2032,
    });
    const expected = canonicalTiming(PROFILE, 2032);

    expect(snapshot.timing.annual.year).toBe(2032);
    expect(snapshot.timing.annual).toEqual(
      expected.seyun.find(({ year }) => year === 2032),
    );
    expect(snapshot.timing.targetDaeun).toEqual(expected.currentDaeun);
    expect(snapshot.timing.monthly).toEqual(expected.wolun);
  });

  it.each([1996, 2056])("supports an explicit selector boundary fixture: %i", (targetYear) => {
    const snapshot = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear });
    expect(snapshot.timing.annual.year).toBe(targetYear);
    expect(snapshot.timing.monthly).toEqual(canonicalTiming(PROFILE, targetYear).wolun);
  });

  it("switches targetDaeun at the canonical transition year", () => {
    const periods = canonicalTiming(PROFILE, 2032).daeun;
    const transition = periods.find(
      (period, index) => index > 0 && period.startYear > 1993,
    );
    expect(transition).toBeDefined();

    const transitionYear = transition!.startYear;
    const before = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: transitionYear - 1,
    });
    const atTransition = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: transitionYear,
    });

    expect(before.timing.targetDaeun?.ganzhi).not.toBe(transition!.ganzhi);
    expect(atTransition.timing.targetDaeun).toEqual(transition);
  });

  it("is deterministic and independent of the runtime clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
    const first = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 });
    vi.setSystemTime(new Date("2040-12-31T23:59:59.000Z"));
    const second = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 });

    expect(second).toEqual(first);
  });

  it("supports the canonical unknown-hour policy", () => {
    const snapshot = buildYearlyCalculationSnapshot({
      profile: UNKNOWN_HOUR_PROFILE,
      targetYear: 2032,
    });

    expect(snapshot.natal.pillars.hour).toBeUndefined();
    expect(snapshot.natal.sals.hour.specialSals).toEqual([]);
    expect(snapshot.natal.sals.hour.twelveSal).toBe("");
    expect(snapshot.timing.annual.year).toBe(2032);
    expect(snapshot.timing.monthly).toHaveLength(12);
  });
});
