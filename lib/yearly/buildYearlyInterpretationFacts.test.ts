import { afterEach, describe, expect, it, vi } from "vitest";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import type {
  YearlyCalculationProfile,
  YearlyCalculationSnapshot,
} from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function build(targetYear = 2032, profile = PROFILE) {
  const snapshot = buildYearlyCalculationSnapshot({ profile, targetYear });
  return { snapshot, facts: buildYearlyInterpretationFacts({ snapshot }) };
}

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("buildYearlyInterpretationFacts", () => {
  it("builds neutral facts directly from a calculation snapshot", () => {
    const { snapshot, facts } = build(2027);

    expect(facts.targetYear).toBe(2027);
    expect(facts.natal.dayMaster).toBe(snapshot.natal.dayMaster);
    expect(facts.annual.period).toBe(snapshot.timing.annual);
    expect(facts.daeun.period).toBe(snapshot.timing.targetDaeun);
    expect(facts.monthly.map(({ period }) => period)).toEqual(snapshot.timing.monthly);
  });

  it("preserves the target-year 2032 calculation source", () => {
    const { snapshot, facts } = build(2032);

    expect(facts.targetYear).toBe(2032);
    expect(facts.annual.period.year).toBe(2032);
    expect(facts.annual.period).toEqual(snapshot.timing.annual);
    expect(facts.daeun.period).toEqual(snapshot.timing.targetDaeun);
    expect(facts.monthly).toHaveLength(12);
  });

  it("exposes canonical annual ten-gods, 12-stage, and 12-sal data", () => {
    const { snapshot, facts } = build();

    expect(facts.annual.period.stemTenGod).toBe(snapshot.timing.annual.stemTenGod);
    expect(facts.annual.period.branchTenGod).toBe(snapshot.timing.annual.branchTenGod);
    expect(facts.annual.period.stage12).toBe(snapshot.timing.annual.stage12);
    expect(facts.annual.twelveSalId).toMatch(/^twelve_.+_sal$/);
  });

  it("keeps all monthly periods in canonical deterministic order", () => {
    const first = build().facts;
    const second = build().facts;

    expect(first.monthly).toHaveLength(12);
    expect(first.monthly.map(({ period }) => period.month)).toEqual(
      first.monthly.map(({ period }) => period.month).toSorted((a, b) => a - b),
    );
    expect(second).toEqual(first);
  });

  it("passes natal sals as stable IDs and keeps gwimun relation-level only", () => {
    const { snapshot, facts } = build();
    const projectedGwimunPositions = Object.entries(snapshot.natal.sals)
      .filter(([, sal]) => sal.sals.some(({ id }) => id === "gwimun_gwansal"))
      .map(([position]) => position);

    expect(projectedGwimunPositions.length).toBeGreaterThan(0);
    expect(facts.natal.relationSals).toBe(snapshot.natal.relationSals);
    expect(facts.natal.relationSals.some(({ id }) => id === "gwimun_gwansal")).toBe(true);
    expect(Object.values(facts.natal.salIdsByPosition).flat()).not.toContain(
      "gwimun_gwansal",
    );
    expect(Object.values(facts.natal.salIdsByPosition).flat()).toEqual(
      expect.arrayContaining(["hyeonchim_sal", "dohwa_sal"]),
    );
  });

  it("supports unknown-hour facts without inventing hour data", () => {
    const { facts } = build(2032, { ...PROFILE, birthTimeUnknown: true });

    expect(facts.natal.salIdsByPosition.hour).toEqual([]);
    expect(
      facts.natal.relationSals.some(
        ({ from, to }) => from === "hour" || to === "hour",
      ),
    ).toBe(false);
    expect(facts.annual.period.year).toBe(2032);
    expect(facts.monthly).toHaveLength(12);
  });

  it("preserves a null targetDaeun without a fallback", () => {
    const { snapshot } = build();
    const withoutDaeun: YearlyCalculationSnapshot = {
      ...snapshot,
      timing: { ...snapshot.timing, targetDaeun: null },
    };

    expect(
      buildYearlyInterpretationFacts({ snapshot: withoutDaeun }).daeun.period,
    ).toBeNull();
  });

  it("does not depend on runtime time or expose context/prose fields", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
    const first = build().facts;
    vi.setSystemTime(new Date("2040-12-31T23:59:59.000Z"));
    const second = build().facts;
    const keys = collectKeys(first);

    expect(second).toEqual(first);
    expect(keys).not.toEqual(
      expect.arrayContaining([
        "love",
        "career",
        "title",
        "description",
        "message",
        "copy",
        "advice",
        "summary",
        "score",
        "priority",
      ]),
    );
  });
});
