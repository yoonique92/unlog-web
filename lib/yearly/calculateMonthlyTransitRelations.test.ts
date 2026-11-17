import { describe, expect, it } from "vitest";
import { buildMonthlyCompositeFacts } from "./buildMonthlyCompositeFacts";
import { calculateMonthlyTransitRelations } from "./calculateMonthlyTransitRelations";
import type {
  MonthlyCompositeFacts,
  YearlyCalculationProfile,
} from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function baseFacts(): Omit<MonthlyCompositeFacts, "interactions"> {
  const source = buildMonthlyCompositeFacts(PROFILE, 2032)[0];
  return {
    calendar: source.calendar,
    natal: source.natal,
    daeun: source.daeun,
    annual: source.annual,
    monthly: source.monthly,
  };
}

function withTransitBranches(annual: string, daeun: string, monthly: string) {
  const facts = baseFacts();
  return {
    ...facts,
    annual: {
      ...facts.annual,
      period: { ...facts.annual.period, stem: "甲", branch: annual },
    },
    daeun: {
      period: facts.daeun.period
        ? { ...facts.daeun.period, stem: "丙", branch: daeun }
        : null,
    },
    monthly: {
      ...facts.monthly,
      period: { ...facts.monthly.period, stem: "戊", branch: monthly },
    },
  };
}

describe("annualDaeunMonthly transit relations", () => {
  it("captures a three-layer canonical trine with complete provenance", () => {
    const relations = calculateMonthlyTransitRelations(
      withTransitBranches("申", "子", "辰"),
    ).annualDaeunMonthly;

    expect(relations).toEqual([expect.objectContaining({
      relationType: "삼합",
      kind: "combination",
      source: "annual_daeun_monthly",
      members: [
        expect.objectContaining({ layer: "annual", symbol: "申", elementType: "branch" }),
        expect.objectContaining({ layer: "daeun", symbol: "子", elementType: "branch" }),
        expect.objectContaining({ layer: "monthly", symbol: "辰", elementType: "branch" }),
      ],
    })]);
  });

  it("captures a three-layer canonical seasonal combination", () => {
    const relations = calculateMonthlyTransitRelations(
      withTransitBranches("寅", "卯", "辰"),
    ).annualDaeunMonthly;

    expect(relations).toEqual([expect.objectContaining({
      relationType: "방합",
      source: "annual_daeun_monthly",
      members: [
        expect.objectContaining({ layer: "annual", symbol: "寅" }),
        expect.objectContaining({ layer: "daeun", symbol: "卯" }),
        expect.objectContaining({ layer: "monthly", symbol: "辰" }),
      ],
    })]);
  });

  it("requires all three layers and excludes pairwise relations", () => {
    expect(calculateMonthlyTransitRelations(
      withTransitBranches("申", "子", "卯"),
    ).annualDaeunMonthly).toEqual([]);

    expect(calculateMonthlyTransitRelations(
      withTransitBranches("子", "丑", "午"),
    ).annualDaeunMonthly).toEqual([]);
  });

  it("returns an empty bucket when daeun is absent", () => {
    const facts = baseFacts();
    expect(calculateMonthlyTransitRelations({
      ...facts,
      daeun: { period: null },
    }).annualDaeunMonthly).toEqual([]);
  });

  it("keeps January's effective previous-year annual context", () => {
    const january = buildMonthlyCompositeFacts(PROFILE, 2032)[0];

    expect(january.monthly.period.ganzhi).toBe("辛丑");
    expect(january.annual.period.ganzhi).toBe("辛亥");
  });

  it("is deterministic and emits no duplicate IDs", () => {
    const facts = withTransitBranches("申", "子", "辰");
    const first = calculateMonthlyTransitRelations(facts).annualDaeunMonthly;
    const second = calculateMonthlyTransitRelations(facts).annualDaeunMonthly;
    const ids = first.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
