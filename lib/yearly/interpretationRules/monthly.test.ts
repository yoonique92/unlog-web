import { describe, expect, it } from "vitest";
import { SAL_DEFINITIONS, type TwelveSalId } from "../../saju/salCalculator";
import { buildYearlyCalculationSnapshot } from "../buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "../buildYearlyCareerCopy";
import { buildYearlyConditionCopy } from "../buildYearlyConditionCopy";
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
  TEN_GOD_MONTHLY_RULES,
  buildYearlyMonthlySignals,
} from "./monthly";
import {
  TWELVE_SAL_OVERALL_RULES,
  TWELVE_STAGE_OVERALL_RULES,
} from "./overall";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

const TWELVE_SAL_IDS = Object.values(SAL_DEFINITIONS)
  .filter(({ category }) => category === "twelve_sal")
  .map(({ id }) => id as TwelveSalId);

function makeFacts(profile = PROFILE) {
  return buildYearlyInterpretationFacts({
    snapshot: buildYearlyCalculationSnapshot({ profile, targetYear: 2032 }),
  });
}

function replaceFirstMonth(
  facts: YearlyInterpretationFacts,
  periodFields: Partial<YearlyInterpretationFacts["monthly"][number]["period"]>,
  twelveSalId = facts.monthly[0].twelveSalId,
) {
  return [
    {
      period: { ...facts.monthly[0].period, ...periodFields },
      twelveSalId,
    },
    ...facts.monthly.slice(1),
  ];
}

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}

describe("monthly interpretation rules", () => {
  it("builds all canonical 2032 monthly signals", () => {
    const result = buildYearlyMonthlySignals(makeFacts().monthly);

    expect(result.version).toBe("yearly-rules-v1");
    expect(result.months).toHaveLength(12);
    expect(result.months.every(({ signals }) => signals.length === 4)).toBe(true);
  });

  it("preserves the canonical seasonal-month meaning and order", () => {
    const facts = makeFacts();

    expect(facts.monthly.map(({ period }) => period.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(facts.monthly.map(({ period }) => period.branch)).toEqual([
      "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
    ]);
    expect(facts.monthly.map(({ period }) => period.monthName)).toEqual([
      "인월(1월)", "묘월(2월)", "진월(3월)", "사월(4월)",
      "오월(5월)", "미월(6월)", "신월(7월)", "유월(8월)",
      "술월(9월)", "해월(10월)", "자월(11월)", "축월(12월)",
    ]);
  });

  it.each(Object.entries(TEN_GOD_MONTHLY_RULES))(
    "covers monthly ten-god %s",
    (tenGod, metadata) => {
      const monthly = replaceFirstMonth(makeFacts(), { stemTenGod: tenGod });
      const signal = buildYearlyMonthlySignals(monthly).months[0].signals.find(
        ({ id }) => id === `monthly-01-stem-${metadata.id}`,
      );

      expect(signal).toMatchObject({
        month: 1,
        kind: metadata.kind,
        theme: metadata.theme,
        evidence: [{
          source: "monthly_stem_ten_god",
          value: tenGod,
          valueId: metadata.id,
        }],
      });
    },
  );

  it("keeps monthly stem and branch evidence distinct", () => {
    const first = buildYearlyMonthlySignals(makeFacts().monthly).months[0].signals;

    expect(first.find(({ id }) => id.includes("-stem-"))?.evidence[0].source)
      .toBe("monthly_stem_ten_god");
    expect(first.find(({ id }) => id.includes("-branch-"))?.evidence[0].source)
      .toBe("monthly_branch_ten_god");
  });

  it.each(Object.entries(TWELVE_STAGE_OVERALL_RULES))(
    "reuses activity phase for monthly stage %s",
    (stage, metadata) => {
      const monthly = replaceFirstMonth(makeFacts(), { stage12: stage });
      const signal = buildYearlyMonthlySignals(monthly).months[0].signals.find(
        ({ id }) => id === `monthly-01-stage-${metadata.id}`,
      );

      expect(signal).toMatchObject({
        activityPhase: metadata.phase,
        theme: metadata.theme,
        evidence: [{ source: "monthly_stage", value: stage, valueId: metadata.id }],
      });
    },
  );

  it.each(TWELVE_SAL_IDS)(
    "covers monthly 12-sal %s",
    (twelveSalId) => {
      const monthly = replaceFirstMonth(makeFacts(), {}, twelveSalId);
      const signal = buildYearlyMonthlySignals(monthly).months[0].signals.find(
        ({ id }) => id === `monthly-01-twelve-sal-${twelveSalId}`,
      );

      expect(signal).toMatchObject({
        month: 1,
        kind: TWELVE_SAL_OVERALL_RULES[twelveSalId].kind,
        theme: TWELVE_SAL_OVERALL_RULES[twelveSalId].theme,
        evidence: [{
          source: "monthly_twelve_sal",
          value: twelveSalId,
          valueId: twelveSalId,
        }],
      });
    },
  );

  it("keeps monthly and annual 12-sal evidence contexts distinct", () => {
    const monthlySignal = buildYearlyMonthlySignals(makeFacts().monthly).months[0].signals.find(
      ({ id }) => id.includes("-twelve-sal-"),
    );

    expect(monthlySignal?.id).toMatch(/^monthly-01-twelve-sal-/);
    expect(monthlySignal?.evidence[0].source).toBe("monthly_twelve_sal");
    expect(monthlySignal?.evidence[0].source).not.toBe("annual_twelve_sal");
  });

  it("locks representative first, middle, and last 2032 months", () => {
    const months = buildYearlyMonthlySignals(makeFacts().monthly).months;

    expect(months[0]).toEqual({
      month: 1,
      signals: [
        expect.objectContaining({ id: "monthly-01-stem-jeongjae", month: 1, priority: 100 }),
        expect.objectContaining({ id: "monthly-01-branch-jeonggwan", month: 1, priority: 95 }),
        expect.objectContaining({ id: "monthly-01-stage-sa", month: 1, activityPhase: "resetting", priority: 90 }),
        expect.objectContaining({ id: "monthly-01-twelve-sal-twelve_mangsin_sal", month: 1, priority: 85 }),
      ],
    });
    expect(months[5]).toEqual({
      month: 6,
      signals: [
        expect.objectContaining({ id: "monthly-06-stem-pyeonin", month: 6, priority: 100 }),
        expect.objectContaining({ id: "monthly-06-branch-bigyeon", month: 6, priority: 95 }),
        expect.objectContaining({ id: "monthly-06-stage-gwandae", month: 6, activityPhase: "expanding", priority: 90 }),
        expect.objectContaining({ id: "monthly-06-twelve-sal-twelve_hwagae_sal", month: 6, priority: 85 }),
      ],
    });
    expect(months[11]).toEqual({
      month: 12,
      signals: [
        expect.objectContaining({ id: "monthly-12-stem-pyeonjae", month: 12, priority: 100 }),
        expect.objectContaining({ id: "monthly-12-branch-bigyeon", month: 12, priority: 95 }),
        expect.objectContaining({ id: "monthly-12-stage-myo", month: 12, activityPhase: "resetting", priority: 90 }),
        expect.objectContaining({ id: "monthly-12-twelve-sal-twelve_wol_sal", month: 12, priority: 85 }),
      ],
    });
  });

  it("preserves completeness, unique months, stable IDs, and canonical order", () => {
    const result = buildYearlyMonthlySignals(makeFacts().monthly);
    const months = result.months.map(({ month }) => month);
    const ids = result.months.flatMap(({ signals }) => signals.map(({ id }) => id));

    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(months).size).toBe(12);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.months.every(({ month, signals }) =>
      signals.every(({ id }) => id.startsWith(`monthly-${String(month).padStart(2, "0")}-`))
    )).toBe(true);
    expect(result.months.every(({ signals }) =>
      signals.every(({ evidence }) => evidence.length > 0)
    )).toBe(true);
  });

  it("is deeply deterministic and keeps priority ordering within each month", () => {
    const facts = makeFacts();
    const first = buildYearlyMonthlySignals(facts.monthly);
    const second = buildYearlyMonthlySignals(facts.monthly);

    expect(second).toEqual(first);
    expect(first.months.every(({ signals }) =>
      signals.every((signal, index) => index === 0 || signals[index - 1].priority >= signal.priority)
    )).toBe(true);
  });

  it("supports unknown birth hour without losing monthly signals", () => {
    const facts = makeFacts({ ...PROFILE, birthTimeUnknown: true });
    const result = buildYearlyMonthlySignals(facts.monthly);

    expect(result.months).toHaveLength(12);
    expect(result.months.every(({ signals }) => signals.length === 4)).toBe(true);
  });

  it("has no context, prose, score, or month-ranking fields", () => {
    const keys = collectKeys(buildYearlyMonthlySignals(makeFacts().monthly));

    expect(keys).not.toEqual(expect.arrayContaining([
      "love", "career", "married", "student", "employed",
      "headline", "body", "tip", "summary", "description", "advice", "copy",
      "monthScore", "luckScore", "careerScore", "moneyScore", "loveScore", "riskScore",
      "bestMonth", "worstMonth", "luckyMonth", "unluckyMonth",
    ]));
  });

  it("keeps established yearly sections and copies unchanged", () => {
    const signals = buildYearlyInterpretationSignals(makeFacts());

    expect(buildYearlyOverallCopy(signals.overall).headline)
      .toBe("익숙한 기반을 지키며 새로운 길을 시험하는 해");
    expect(buildYearlyCareerCopy({ signals: signals.career, career: "employed" }).headline)
      .toBe("맡은 일을 다지며 새로운 역할을 준비하는 해");
    expect(buildYearlyMoneyCopy(signals.money).headline)
      .toBe("지킬 돈과 기회에 쓸 돈을 구분하는 해");
    expect(buildYearlyLoveCopy({ signals: signals.love, love: "married" }).headline)
      .toBe("함께 사는 방식을 다시 맞춰보는 해");
    expect(buildYearlyConditionCopy(signals.condition).headline)
      .toBe("몰입하는 시기와 쉬어갈 때를 구분하는 해");
  });
});
