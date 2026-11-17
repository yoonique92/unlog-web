import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "../buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "../buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "../buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "../buildYearlyInterpretationSignals";
import { buildYearlyLoveCopy } from "../buildYearlyLoveCopy";
import { buildYearlyMoneyCopy } from "../buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "../buildYearlyOverallCopy";
import type {
  YearlyCalculationProfile,
  YearlyInterpretationFacts,
} from "../types";
import {
  CONDITION_THEME_BY_ACTIVITY_PHASE,
  TEN_GOD_CONDITION_RULES,
  buildConditionSignals,
} from "./condition";
import { TWELVE_STAGE_OVERALL_RULES } from "./overall";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function makeFacts(profile = PROFILE) {
  return buildYearlyInterpretationFacts({
    snapshot: buildYearlyCalculationSnapshot({ profile, targetYear: 2032 }),
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

describe("condition interpretation rules", () => {
  it("locks the 2032 condition signal fixture", () => {
    expect(buildYearlyInterpretationSignals(makeFacts()).condition.map(({ id }) => id)).toEqual([
      "condition-annual-stem-jeongjae",
      "condition-annual-branch-pyeonjae",
      "condition-stage-jeol",
      "condition-daeun-stem-pyeongwan",
      "condition-daeun-branch-jeongin",
    ]);
  });

  it.each(Object.entries(TEN_GOD_CONDITION_RULES))(
    "covers condition ten-god %s",
    (tenGod, metadata) => {
      const signal = buildConditionSignals(
        withAnnual(makeFacts(), { stemTenGod: tenGod }),
      ).find(({ id }) => id === `condition-annual-stem-${metadata.id}`);

      expect(signal).toMatchObject({
        section: "condition",
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

  it("preserves annual and daeun stem/branch evidence sources", () => {
    const condition = buildConditionSignals(makeFacts());

    expect(condition.find(({ id }) => id.startsWith("condition-annual-stem-"))?.evidence[0].source)
      .toBe("annual_stem_ten_god");
    expect(condition.find(({ id }) => id.startsWith("condition-annual-branch-"))?.evidence[0].source)
      .toBe("annual_branch_ten_god");
    expect(condition.find(({ id }) => id.startsWith("condition-daeun-stem-"))?.evidence[0].source)
      .toBe("target_daeun_stem_ten_god");
    expect(condition.find(({ id }) => id.startsWith("condition-daeun-branch-"))?.evidence[0].source)
      .toBe("target_daeun_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "maps stage %s to a condition activity phase",
    (stage, metadata) => {
      const signal = buildConditionSignals(
        withAnnual(makeFacts(), { stage12: stage }),
      ).find(({ id }) => id === `condition-stage-${metadata.id}`);

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: CONDITION_THEME_BY_ACTIVITY_PHASE[metadata.phase],
        evidence: [{ source: "annual_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it("omits only daeun signals when targetDaeun is null", () => {
    const facts = makeFacts();
    expect(buildConditionSignals({ ...facts, daeun: { period: null } }).map(({ id }) => id))
      .toEqual([
        "condition-annual-stem-jeongjae",
        "condition-annual-branch-pyeonjae",
        "condition-stage-jeol",
      ]);
  });

  it("supports an unknown birth hour without inventing hour-based rules", () => {
    const facts = makeFacts({ ...PROFILE, birthTimeUnknown: true });
    const condition = buildConditionSignals(facts);

    expect(condition.length).toBeGreaterThan(0);
    expect(condition.every(({ evidence }) => evidence.length > 0)).toBe(true);
    expect(condition.some(({ id }) => id.startsWith("condition-stage-"))).toBe(true);
  });

  it("does not use natal sals, relations, monthly data, or annual 12-sal", () => {
    const facts = makeFacts();
    const baseline = buildConditionSignals(facts);
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

    expect(buildConditionSignals(unrelated)).toEqual(baseline);
  });

  it("is context-free and contains no prose, medical, accident, or score metadata", () => {
    const condition = buildConditionSignals(makeFacts());
    const keys = collectKeys(condition);
    const serialized = JSON.stringify(condition);

    expect(keys).not.toEqual(expect.arrayContaining([
      "love", "career", "gender", "married", "healthInformation",
      "headline", "body", "tip", "advice", "message", "copy",
      "healthScore", "energyScore", "riskScore", "conditionScore",
    ]));
    expect(serialized).not.toMatch(/disease|illness|injury|accident|surgery|pregnancy|miscarriage|death|hospitalization/);
    expect(serialized).not.toMatch(/질병|아프|사고|수술|임신|유산|사망|입원|건강이 좋|건강이 나쁘/);
  });

  it("is deterministic, deduplicated, and sorted by priority then ID", () => {
    const first = buildConditionSignals(makeFacts());
    const second = buildConditionSignals(makeFacts());
    const ids = first.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first).toEqual([...first].sort(
      (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
    ));
    expect(first.map(({ priority }) => priority)).toEqual([100, 95, 90, 75, 70]);
    expect(first.every(({ evidence }) => evidence.length > 0)).toBe(true);
  });

  it("keeps established overall, career, money, and love outputs unchanged", () => {
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
    expect(signals.money.map(({ id }) => id)).toEqual([
      "money-annual-stem-jeongjae",
      "money-annual-branch-pyeonjae",
      "money-stage-jeol",
      "money-daeun-stem-pyeongwan",
      "money-daeun-branch-jeongin",
    ]);
    expect(signals.love.map(({ id }) => id)).toEqual([
      "love-annual-stem-jeongjae",
      "love-annual-branch-pyeonjae",
      "love-stage-jeol",
      "love-daeun-stem-pyeongwan",
      "love-daeun-branch-jeongin",
    ]);
    expect(buildYearlyOverallCopy(signals.overall).headline)
      .toBe("익숙한 기반을 지키며 새로운 길을 시험하는 해");
    expect(buildYearlyCareerCopy({ signals: signals.career, career: "employed" }).headline)
      .toBe("맡은 일을 다지며 새로운 역할을 준비하는 해");
    expect(buildYearlyMoneyCopy(signals.money).headline)
      .toBe("지킬 돈과 기회에 쓸 돈을 구분하는 해");
    expect(buildYearlyLoveCopy({ signals: signals.love, love: "married" }).headline)
      .toBe("함께 사는 방식을 다시 맞춰보는 해");
  });
});
