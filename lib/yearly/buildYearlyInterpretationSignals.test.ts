import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import {
  TEN_GOD_OVERALL_RULES,
  TWELVE_SAL_OVERALL_RULES,
  TWELVE_STAGE_OVERALL_RULES,
} from "./interpretationRules/overall";
import type {
  YearlyCalculationProfile,
  YearlyInterpretationFacts,
} from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function makeFacts() {
  return buildYearlyInterpretationFacts({
    snapshot: buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 }),
  });
}

function withAnnual(
  facts: YearlyInterpretationFacts,
  fields: Partial<YearlyInterpretationFacts["annual"]["period"]>,
) {
  return {
    ...facts,
    annual: { ...facts.annual, period: { ...facts.annual.period, ...fields } },
  };
}

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

describe("buildYearlyInterpretationSignals", () => {
  it("builds the fixed 2032 overall signal fixture", () => {
    const result = buildYearlyInterpretationSignals(makeFacts());

    expect(result.version).toBe("yearly-rules-v1");
    expect(result.overall.map(({ id }) => id)).toEqual([
      "annual-stem-jeongjae",
      "annual-branch-pyeonjae",
      "annual-stage-jeol",
      "annual-twelve-sal-twelve_nyeon_sal",
      "daeun-stem-pyeongwan",
      "daeun-branch-jeongin",
    ]);
  });

  it.each(Object.entries(TEN_GOD_OVERALL_RULES))(
    "covers ten-god %s with stable metadata",
    (tenGod, metadata) => {
      const facts = withAnnual(makeFacts(), { stemTenGod: tenGod });
      const signal = buildYearlyInterpretationSignals(facts).overall.find(
        ({ id }) => id === `annual-stem-${metadata.id}`,
      );

      expect(signal).toMatchObject({
        kind: metadata.kind,
        theme: metadata.theme,
        evidence: [{
          source: "annual_stem_ten_god",
          value: tenGod,
          valueId: metadata.id,
        }],
      });
    },
  );

  it("preserves stem and branch sources for the same ten-god", () => {
    const facts = withAnnual(makeFacts(), {
      stemTenGod: "정관",
      branchTenGod: "정관",
    });
    const overall = buildYearlyInterpretationSignals(facts).overall;

    expect(overall.find(({ id }) => id === "annual-stem-jeonggwan")?.evidence[0].source)
      .toBe("annual_stem_ten_god");
    expect(overall.find(({ id }) => id === "annual-branch-jeonggwan")?.evidence[0].source)
      .toBe("annual_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "maps 12-stage %s to its explicit activity phase",
    (stage, metadata) => {
      const facts = withAnnual(makeFacts(), { stage12: stage });
      const signal = buildYearlyInterpretationSignals(facts).overall.find(
        ({ id }) => id === `annual-stage-${metadata.id}`,
      );

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: metadata.theme,
        evidence: [{ source: "annual_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it("omits an unknown 12-stage safely", () => {
    const facts = withAnnual(makeFacts(), { stage12: "unknown" });
    expect(buildYearlyInterpretationSignals(facts).overall)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.stringMatching(/^annual-stage-/) })]));
  });

  it.each(Object.entries(TWELVE_SAL_OVERALL_RULES))(
    "covers annual 12-sal %s",
    (twelveSalId, metadata) => {
      const facts: YearlyInterpretationFacts = {
        ...makeFacts(),
        annual: {
          ...makeFacts().annual,
          twelveSalId: twelveSalId as keyof typeof TWELVE_SAL_OVERALL_RULES,
        },
      };
      const signal = buildYearlyInterpretationSignals(facts).overall.find(
        ({ id }) => id === `annual-twelve-sal-${twelveSalId}`,
      );

      expect(signal).toMatchObject({ kind: metadata.kind, theme: metadata.theme });
    },
  );

  it("omits optional annual 12-sal and target daeun signals", () => {
    const facts = makeFacts();
    const withoutOptional: YearlyInterpretationFacts = {
      ...facts,
      annual: { ...facts.annual, twelveSalId: null },
      daeun: { period: null },
    };
    const ids = buildYearlyInterpretationSignals(withoutOptional).overall.map(({ id }) => id);

    expect(ids.some((id) => id.startsWith("annual-twelve-sal-"))).toBe(false);
    expect(ids.some((id) => id.startsWith("daeun-"))).toBe(false);
  });

  it("does not use natal sals, relations, monthly data, or user context", () => {
    const facts = makeFacts();
    const baseline = buildYearlyInterpretationSignals(facts);
    const unrelatedFacts: YearlyInterpretationFacts = {
      ...facts,
      natal: {
        ...facts.natal,
        salIdsByPosition: { year: [], month: [], day: [], hour: [] },
        relationSals: [],
      },
      monthly: [],
    };

    expect(buildYearlyInterpretationSignals(unrelatedFacts)).toEqual(baseline);
    expect(collectKeys(baseline)).not.toEqual(expect.arrayContaining([
      "love", "career", "married", "dating", "student", "employed",
      "title", "description", "message", "summary", "advice", "copy",
      "goodScore", "badScore", "luckScore", "fortuneScore", "positiveScore",
    ]));
  });

  it("is deeply deterministic, deduplicated, and sorted by priority then ID", () => {
    const facts = makeFacts();
    const first = buildYearlyInterpretationSignals(facts);
    const second = buildYearlyInterpretationSignals(facts);
    const ids = first.overall.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first.overall).toEqual([...first.overall].sort(
      (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
    ));
    expect(first.overall.every(({ evidence }) => evidence.length > 0)).toBe(true);
  });
});
