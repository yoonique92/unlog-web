import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "../buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "../buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "../buildYearlyInterpretationSignals";
import { buildYearlyOverallCopy } from "../buildYearlyOverallCopy";
import type {
  YearlyCalculationProfile,
  YearlyInterpretationFacts,
} from "../types";
import {
  CAREER_THEME_BY_ACTIVITY_PHASE,
  TEN_GOD_CAREER_RULES,
  buildCareerSignals,
} from "./career";
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

describe("career interpretation rules", () => {
  it("locks the 2032 career signal fixture", () => {
    expect(buildYearlyInterpretationSignals(makeFacts()).career.map(({ id }) => id)).toEqual([
      "career-annual-stem-jeongjae",
      "career-annual-branch-pyeonjae",
      "career-stage-jeol",
      "career-daeun-stem-pyeongwan",
      "career-daeun-branch-jeongin",
    ]);
  });

  it.each(Object.entries(TEN_GOD_CAREER_RULES))(
    "covers career ten-god %s",
    (tenGod, metadata) => {
      const signal = buildCareerSignals(
        withAnnual(makeFacts(), { stemTenGod: tenGod }),
      ).find(({ id }) => id === `career-annual-stem-${metadata.id}`);

      expect(signal).toMatchObject({
        section: "career",
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
    const career = buildCareerSignals(makeFacts());

    expect(career.find(({ id }) => id.startsWith("career-annual-stem-"))?.evidence[0].source)
      .toBe("annual_stem_ten_god");
    expect(career.find(({ id }) => id.startsWith("career-annual-branch-"))?.evidence[0].source)
      .toBe("annual_branch_ten_god");
    expect(career.find(({ id }) => id.startsWith("career-daeun-stem-"))?.evidence[0].source)
      .toBe("target_daeun_stem_ten_god");
    expect(career.find(({ id }) => id.startsWith("career-daeun-branch-"))?.evidence[0].source)
      .toBe("target_daeun_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "reuses the canonical interpretation phase for stage %s",
    (stage, metadata) => {
      const signal = buildCareerSignals(
        withAnnual(makeFacts(), { stage12: stage }),
      ).find(({ id }) => id === `career-stage-${metadata.id}`);

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: CAREER_THEME_BY_ACTIVITY_PHASE[metadata.phase],
        evidence: [{ source: "annual_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it("omits only daeun career signals when targetDaeun is null", () => {
    const facts = makeFacts();
    const ids = buildCareerSignals({ ...facts, daeun: { period: null } }).map(({ id }) => id);

    expect(ids).toEqual([
      "career-annual-stem-jeongjae",
      "career-annual-branch-pyeonjae",
      "career-stage-jeol",
    ]);
  });

  it("is context-free and contains no prose or outcome-score fields", () => {
    const career = buildCareerSignals(makeFacts());
    const keys = collectKeys(career);

    expect(keys).not.toEqual(expect.arrayContaining([
      "student", "job_seeking", "employed", "career_transition",
      "freelance_self_employed", "homemaker", "retired",
      "headline", "body", "description", "advice", "copy", "message",
      "careerScore", "promotionScore", "jobScore", "successScore",
    ]));
  });

  it("does not use natal sals, relations, monthly data, or annual 12-sal", () => {
    const facts = makeFacts();
    const baseline = buildCareerSignals(facts);
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

    expect(buildCareerSignals(unrelated)).toEqual(baseline);
  });

  it("is deterministic, deduplicated, and sorted by priority then ID", () => {
    const first = buildCareerSignals(makeFacts());
    const second = buildCareerSignals(makeFacts());
    const ids = first.map(({ id }) => id);

    expect(second).toEqual(first);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first).toEqual([...first].sort(
      (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
    ));
    expect(first.every(({ evidence }) => evidence.length > 0)).toBe(true);
  });

  it("keeps the established 2032 overall signals and copy unchanged", () => {
    const overall = buildYearlyInterpretationSignals(makeFacts()).overall;

    expect(overall.map(({ id }) => id)).toEqual([
      "annual-stem-jeongjae",
      "annual-branch-pyeonjae",
      "annual-stage-jeol",
      "annual-twelve-sal-twelve_nyeon_sal",
      "daeun-stem-pyeongwan",
      "daeun-branch-jeongin",
    ]);
    expect(buildYearlyOverallCopy(overall)).toMatchObject({
      headline: "익숙한 기반을 지키며 새로운 길을 시험하는 해",
      tip: "새 제안이 눈에 들어오면 기존 생활을 바로 바꾸기보다, 실제로 병행할 수 있는 기간과 조건부터 확인해두는 편이 좋습니다.",
    });
  });
});
