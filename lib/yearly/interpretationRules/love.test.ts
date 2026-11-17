import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "../buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "../buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "../buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "../buildYearlyInterpretationSignals";
import { buildYearlyMoneyCopy } from "../buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "../buildYearlyOverallCopy";
import type {
  YearlyCalculationProfile,
  YearlyInterpretationFacts,
} from "../types";
import {
  LOVE_THEME_BY_ACTIVITY_PHASE,
  TEN_GOD_LOVE_RULES,
  buildLoveSignals,
} from "./love";
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

describe("love interpretation rules", () => {
  it("locks the 2032 love signal fixture", () => {
    expect(buildYearlyInterpretationSignals(makeFacts()).love.map(({ id }) => id)).toEqual([
      "love-annual-stem-jeongjae",
      "love-annual-branch-pyeonjae",
      "love-stage-jeol",
      "love-daeun-stem-pyeongwan",
      "love-daeun-branch-jeongin",
    ]);
  });

  it.each(Object.entries(TEN_GOD_LOVE_RULES))(
    "covers love ten-god %s",
    (tenGod, metadata) => {
      const signal = buildLoveSignals(
        withAnnual(makeFacts(), { stemTenGod: tenGod }),
      ).find(({ id }) => id === `love-annual-stem-${metadata.id}`);

      expect(signal).toMatchObject({
        section: "love",
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
    const love = buildLoveSignals(makeFacts());

    expect(love.find(({ id }) => id.startsWith("love-annual-stem-"))?.evidence[0].source)
      .toBe("annual_stem_ten_god");
    expect(love.find(({ id }) => id.startsWith("love-annual-branch-"))?.evidence[0].source)
      .toBe("annual_branch_ten_god");
    expect(love.find(({ id }) => id.startsWith("love-daeun-stem-"))?.evidence[0].source)
      .toBe("target_daeun_stem_ten_god");
    expect(love.find(({ id }) => id.startsWith("love-daeun-branch-"))?.evidence[0].source)
      .toBe("target_daeun_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "maps stage %s to a neutral relationship activity phase",
    (stage, metadata) => {
      const signal = buildLoveSignals(
        withAnnual(makeFacts(), { stage12: stage }),
      ).find(({ id }) => id === `love-stage-${metadata.id}`);

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: LOVE_THEME_BY_ACTIVITY_PHASE[metadata.phase],
        evidence: [{ source: "annual_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it("omits only daeun signals when targetDaeun is null", () => {
    const facts = makeFacts();
    expect(buildLoveSignals({ ...facts, daeun: { period: null } }).map(({ id }) => id)).toEqual([
      "love-annual-stem-jeongjae",
      "love-annual-branch-pyeonjae",
      "love-stage-jeol",
    ]);
  });

  it("does not use natal sals, relations, monthly data, or annual 12-sal", () => {
    const facts = makeFacts();
    const baseline = buildLoveSignals(facts);
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

    expect(buildLoveSignals(unrelated)).toEqual(baseline);
  });

  it("contains no situation context, prose, gender role, or outcome prediction fields", () => {
    const keys = collectKeys(buildLoveSignals(makeFacts()));
    const serialized = JSON.stringify(buildLoveSignals(makeFacts()));

    expect(keys).not.toEqual(expect.arrayContaining([
      "loveSituation", "single", "dating", "married", "gender",
      "headline", "body", "description", "message", "advice", "copy",
      "marriageScore", "breakupScore", "affairScore", "pregnancyScore",
    ]));
    expect(serialized).not.toMatch(/결혼|이별|외도|임신|남자|여자|배우자|연인/);
  });

  it("is deterministic, deduplicated, and sorted by priority then ID", () => {
    const first = buildLoveSignals(makeFacts());
    const second = buildLoveSignals(makeFacts());
    const ids = first.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first).toEqual([...first].sort(
      (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
    ));
    expect(first.every(({ evidence }) => evidence.length > 0)).toBe(true);
  });

  it("keeps the established overall, career, and money outputs unchanged", () => {
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
    expect(buildYearlyOverallCopy(signals.overall).headline)
      .toBe("익숙한 기반을 지키며 새로운 길을 시험하는 해");
    expect(buildYearlyCareerCopy({ signals: signals.career, career: "employed" }).headline)
      .toBe("맡은 일을 다지며 새로운 역할을 준비하는 해");
    expect(buildYearlyMoneyCopy(signals.money).headline)
      .toBe("지킬 돈과 기회에 쓸 돈을 구분하는 해");
  });
});
