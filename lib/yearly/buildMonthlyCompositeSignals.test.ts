import { describe, expect, it } from "vitest";
import { buildMonthlyCompositeFacts } from "./buildMonthlyCompositeFacts";
import { buildMonthlyCompositeSignals } from "./buildMonthlyCompositeSignals";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import type {
  CanonicalTransitRelation,
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

function facts(profile = PROFILE) {
  return buildMonthlyCompositeFacts(profile, 2032);
}

function relation(
  relationType: "삼합" | "방합",
  symbols: [string, string, string],
): CanonicalTransitRelation {
  return {
    id: `annual_daeun_monthly:${relationType}:annual.branch:daeun.branch:monthly.branch`,
    relationType,
    kind: "combination",
    source: "annual_daeun_monthly",
    members: [
      { layer: "annual", symbol: symbols[0], elementType: "branch" },
      { layer: "daeun", symbol: symbols[1], elementType: "branch" },
      { layer: "monthly", symbol: symbols[2], elementType: "branch" },
    ],
  };
}

function withMultiRelation(
  source: MonthlyCompositeFacts,
  transitRelation: CanonicalTransitRelation,
) {
  return {
    ...source,
    interactions: {
      ...source.interactions,
      annualDaeunMonthly: [transitRelation],
    },
  };
}

describe("buildMonthlyCompositeSignals", () => {
  it("builds deterministic composite signals for all 12 display months", () => {
    const first = buildMonthlyCompositeSignals(facts());
    const second = buildMonthlyCompositeSignals(facts());

    expect(first.version).toBe("monthly-composite-rules-v1");
    expect(first.months.map(({ displayMonth }) => displayMonth)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(first.months.every(({ signals }) => signals.length >= 6)).toBe(true);
    expect(second).toEqual(first);
  });

  it("preserves the four established monthly core facts", () => {
    for (const { signals } of buildMonthlyCompositeSignals(facts()).months) {
      const core = signals.filter(({ source }) => source === "monthly_core");
      expect(core).toHaveLength(4);
      expect(core.some(({ id }) => id.includes("-stem-"))).toBe(true);
      expect(core.some(({ id }) => id.includes("-branch-"))).toBe(true);
      expect(core.some(({ id }) => id.includes("-stage-"))).toBe(true);
      expect(core.some(({ id }) => id.includes("-twelve-sal-"))).toBe(true);
    }
  });

  it("converts natal, annual, and daeun relations with traceable evidence", () => {
    const result = buildMonthlyCompositeSignals(facts());
    const january = result.months[0].signals;
    const june = result.months[5].signals;

    expect(january.find(({ source }) => source === "natal_monthly"))
      .toMatchObject({
        kind: expect.stringMatching(/tension|friction/),
        evidence: [expect.objectContaining({
          source: "canonical_relation",
          members: expect.arrayContaining([
            expect.objectContaining({ layer: "natal", pillarPosition: "year" }),
            expect.objectContaining({ layer: "monthly" }),
          ]),
        })],
      });
    expect(june.some(({ source }) => source === "annual_monthly")).toBe(true);
    expect(january.some(({ source }) => source === "daeun_monthly")).toBe(true);
  });

  it.each([
    ["삼합", ["申", "子", "辰"], "multi_layer_three_branch_integration"],
    ["방합", ["寅", "卯", "辰"], "multi_layer_seasonal_branch_integration"],
  ] as const)("converts %s annual-daeun-monthly relations", (type, symbols, theme) => {
    const source = withMultiRelation(facts()[0], relation(type, [...symbols]));
    const signal = buildMonthlyCompositeSignals([source]).months[0].signals.find(
      ({ source: signalSource }) => signalSource === "annual_daeun_monthly",
    );

    expect(signal).toMatchObject({
      kind: "connection",
      theme,
      evidence: [expect.objectContaining({
        source: "canonical_relation",
        value: type,
        members: expect.arrayContaining([
          expect.objectContaining({ layer: "annual" }),
          expect.objectContaining({ layer: "daeun" }),
          expect.objectContaining({ layer: "monthly" }),
        ]),
      })],
    });
  });

  it("uses neutral relation kinds without positive or negative scores", () => {
    const serialized = JSON.stringify(buildMonthlyCompositeSignals(facts()));

    expect(serialized).not.toMatch(/positive|negative|good|bad/i);
    expect(serialized).not.toMatch(/luckScore|riskScore|monthScore/);
  });

  it("keeps January's effective previous-year annual context", () => {
    const januaryFacts = facts()[0];
    const annualContext = buildMonthlyCompositeSignals([januaryFacts]).months[0].signals.find(
      ({ id }) => id.includes("annual-monthly-context"),
    );

    expect(januaryFacts.annual.period.ganzhi).toBe("辛亥");
    expect(annualContext?.evidence[0]).toMatchObject({
      source: "annual_context",
      value: `${januaryFacts.annual.period.stemTenGod}/${januaryFacts.annual.period.branchTenGod}/${januaryFacts.annual.period.stage12}`,
    });
  });

  it("works with null daeun and excludes unknown-hour evidence", () => {
    const withoutDaeun = facts().map((month) => ({
      ...month,
      daeun: { period: null },
      interactions: {
        ...month.interactions,
        daeunMonthly: [],
        annualDaeunMonthly: [],
      },
    }));
    expect(buildMonthlyCompositeSignals(withoutDaeun).months.every(({ signals }) =>
      signals.every(({ source }) =>
        source !== "daeun_monthly" && source !== "annual_daeun_monthly"),
    )).toBe(true);

    const unknown = buildMonthlyCompositeSignals(facts({
      ...PROFILE,
      birthTimeUnknown: true,
    }));
    const relationMembers = unknown.months.flatMap(({ signals }) =>
      signals.flatMap(({ evidence }) => evidence.flatMap((item) =>
        item.source === "canonical_relation" ? item.members : [])),
    );
    expect(relationMembers.some(
      ({ layer, pillarPosition }) => layer === "natal" && pillarPosition === "hour",
    )).toBe(false);
  });

  it("keeps IDs unique and priorities sorted", () => {
    for (const { signals } of buildMonthlyCompositeSignals(facts()).months) {
      const ids = signals.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(signals.every((signal, index) =>
        index === 0 || signals[index - 1].priority >= signal.priority,
      )).toBe(true);
    }
  });

  it("does not alter established yearly signals or copy", () => {
    const yearlyFacts = buildYearlyInterpretationFacts({
      snapshot: buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 }),
    });
    const before = buildYearlyInterpretationSignals(yearlyFacts);
    const headline = buildYearlyOverallCopy(before.overall).headline;

    buildMonthlyCompositeSignals(facts());

    expect(buildYearlyInterpretationSignals(yearlyFacts)).toEqual(before);
    expect(buildYearlyOverallCopy(before.overall).headline).toBe(headline);
  });
});
