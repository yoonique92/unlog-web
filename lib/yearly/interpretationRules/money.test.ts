import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "../buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "../buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "../buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "../buildYearlyInterpretationSignals";
import { buildYearlyOverallCopy } from "../buildYearlyOverallCopy";
import type {
  YearlyCalculationProfile,
  YearlyInterpretationFacts,
} from "../types";
import {
  MONEY_THEME_BY_ACTIVITY_PHASE,
  TEN_GOD_MONEY_RULES,
  buildMoneySignals,
} from "./money";
import { TWELVE_STAGE_OVERALL_RULES } from "./overall";

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

describe("money interpretation rules", () => {
  it("locks the 2032 money signal fixture", () => {
    expect(buildYearlyInterpretationSignals(makeFacts()).money.map(({ id }) => id)).toEqual([
      "money-annual-stem-jeongjae",
      "money-annual-branch-pyeonjae",
      "money-stage-jeol",
      "money-daeun-stem-pyeongwan",
      "money-daeun-branch-jeongin",
    ]);
  });

  it.each(Object.entries(TEN_GOD_MONEY_RULES))(
    "covers money ten-god %s",
    (tenGod, metadata) => {
      const signal = buildMoneySignals(
        withAnnual(makeFacts(), { stemTenGod: tenGod }),
      ).find(({ id }) => id === `money-annual-stem-${metadata.id}`);

      expect(signal).toMatchObject({
        section: "money",
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

  it("preserves annual and daeun stem/branch sources", () => {
    const money = buildMoneySignals(makeFacts());

    expect(money.find(({ id }) => id.startsWith("money-annual-stem-"))?.evidence[0].source)
      .toBe("annual_stem_ten_god");
    expect(money.find(({ id }) => id.startsWith("money-annual-branch-"))?.evidence[0].source)
      .toBe("annual_branch_ten_god");
    expect(money.find(({ id }) => id.startsWith("money-daeun-stem-"))?.evidence[0].source)
      .toBe("target_daeun_stem_ten_god");
    expect(money.find(({ id }) => id.startsWith("money-daeun-branch-"))?.evidence[0].source)
      .toBe("target_daeun_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "reuses activity phase for money stage %s",
    (stage, metadata) => {
      const signal = buildMoneySignals(
        withAnnual(makeFacts(), { stage12: stage }),
      ).find(({ id }) => id === `money-stage-${metadata.id}`);

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: MONEY_THEME_BY_ACTIVITY_PHASE[metadata.phase],
        evidence: [{ source: "annual_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it("omits only daeun signals when targetDaeun is null", () => {
    const facts = makeFacts();
    expect(buildMoneySignals({ ...facts, daeun: { period: null } }).map(({ id }) => id)).toEqual([
      "money-annual-stem-jeongjae",
      "money-annual-branch-pyeonjae",
      "money-stage-jeol",
    ]);
  });

  it("gives non-wealth ten-gods explicit resource meanings", () => {
    expect(TEN_GOD_MONEY_RULES.식신.theme).toBe("value_creation");
    expect(TEN_GOD_MONEY_RULES.정관.theme).toBe("resource_structure");
    expect(TEN_GOD_MONEY_RULES.정인.theme).toBe("resource_accumulation");
    expect(TEN_GOD_MONEY_RULES.비견.theme).toBe("self_resource_control");
  });

  it("is context-free and contains no prose, score, or high-risk action fields", () => {
    const keys = collectKeys(buildMoneySignals(makeFacts()));
    expect(keys).not.toEqual(expect.arrayContaining([
      "career", "love", "income", "assets", "occupation",
      "headline", "body", "description", "message", "advice", "copy",
      "moneyScore", "wealthScore", "incomeScore", "investmentScore",
      "stock", "crypto", "realEstate", "loan", "gambling",
    ]));
  });

  it("does not use natal sals, relations, monthly data, or annual 12-sal", () => {
    const facts = makeFacts();
    const baseline = buildMoneySignals(facts);
    const unrelated: YearlyInterpretationFacts = {
      ...facts,
      natal: {
        ...facts.natal,
        salIdsByPosition: { year: [], month: [], day: [], hour: [] },
        relationSals: [],
      },
      annual: { ...facts.annual, twelveSalId: null },
      monthly: [],
    };
    expect(buildMoneySignals(unrelated)).toEqual(baseline);
  });

  it("is deterministic, deduplicated, and sorted by priority then ID", () => {
    const first = buildMoneySignals(makeFacts());
    const second = buildMoneySignals(makeFacts());
    const ids = first.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first).toEqual([...first].sort(
      (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
    ));
    expect(first.every(({ evidence }) => evidence.length > 0)).toBe(true);
  });

  it("keeps established overall and career signals/copy unchanged", () => {
    const signals = buildYearlyInterpretationSignals(makeFacts());
    expect(signals.overall.map(({ id }) => id)).toEqual([
      "annual-stem-jeongjae",
      "annual-branch-pyeonjae",
      "annual-stage-jeol",
      "annual-twelve-sal-twelve_nyeon_sal",
      "daeun-stem-pyeongwan",
      "daeun-branch-jeongin",
    ]);
    expect(signals.career.map(({ id }) => id)).toEqual([
      "career-annual-stem-jeongjae",
      "career-annual-branch-pyeonjae",
      "career-stage-jeol",
      "career-daeun-stem-pyeongwan",
      "career-daeun-branch-jeongin",
    ]);
    expect(buildYearlyOverallCopy(signals.overall).headline)
      .toBe("익숙한 기반을 지키며 새로운 길을 시험하는 해");
    expect(buildYearlyCareerCopy({ signals: signals.career, career: "employed" }).headline)
      .toBe("맡은 일을 다지며 새로운 역할을 준비하는 해");
  });
});
