import { describe, expect, it } from "vitest";
import { getCanonicalTwelveSalId } from "../saju/salCalculator";
import { buildMonthlyCompositeFacts, buildMonthlyCalendarSlots } from "./buildMonthlyCompositeFacts";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { calculateMonthlyTransitRelations } from "./calculateMonthlyTransitRelations";
import type { YearlyCalculationProfile } from "./types";

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

const JANUARY_GROUP_PROFILE: YearlyCalculationProfile = {
  birthDate: "2002-02-05",
  birthHour: 0,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "male",
};

describe("buildMonthlyCalendarSlots", () => {
  it("maps calendar months 1-12 to 丑, 寅 ... 子 in display order", () => {
    const slots = buildMonthlyCalendarSlots(PROFILE, 2032);

    expect(slots).toHaveLength(12);
    expect(slots.map(({ displayMonth }) => displayMonth)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(slots.map(({ period }) => period.branch)).toEqual([
      "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子",
    ]);
    expect(slots.map(({ period }) => period.ganzhi)).toEqual([
      "辛丑", "壬寅", "癸卯", "甲辰", "乙巳", "丙午",
      "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子",
    ]);
  });

  it("sources January from the preceding year's canonical month 12", () => {
    const january = buildMonthlyCalendarSlots(PROFILE, 2032)[0];
    const previousDecemberSeason = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2031,
    }).timing.monthly.find(({ month }) => month === 12);

    expect(january).toMatchObject({
      displayYear: 2032,
      displayMonth: 1,
      seasonalYear: 2031,
      seasonalOrdinal: 12,
    });
    expect(january.period).toEqual(previousDecemberSeason);
  });

  it("maps February and December within the selected seasonal year", () => {
    const slots = buildMonthlyCalendarSlots(PROFILE, 2032);

    expect(slots[1]).toMatchObject({
      displayYear: 2032,
      displayMonth: 2,
      seasonalYear: 2032,
      seasonalOrdinal: 1,
    });
    expect(slots[11]).toMatchObject({
      displayYear: 2032,
      displayMonth: 12,
      seasonalYear: 2032,
      seasonalOrdinal: 11,
    });
  });

  it("is deterministic", () => {
    expect(buildMonthlyCalendarSlots(PROFILE, 2032)).toEqual(
      buildMonthlyCalendarSlots(PROFILE, 2032),
    );
  });
});

describe("buildMonthlyCompositeFacts", () => {
  it("uses the preceding annual context for January and selected-year context afterward", () => {
    const facts = buildMonthlyCompositeFacts(PROFILE, 2032);
    const selected = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2032,
    });
    const previous = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2031,
    });

    expect(facts).toHaveLength(12);
    expect(facts[0].calendar.seasonalYear).toBe(2031);
    expect(facts[0].monthly.period.ganzhi).toBe("辛丑");
    expect(facts[0].annual.period).toEqual(previous.timing.annual);
    expect(facts[0].annual.period.ganzhi).toBe("辛亥");

    expect(facts[1].monthly.period.ganzhi).toBe("壬寅");
    expect(facts[1].annual.period).toEqual(selected.timing.annual);
    expect(facts[1].annual.period.ganzhi).toBe("壬子");

    expect(facts[11].monthly.period.ganzhi).toBe("壬子");
    expect(facts[11].annual.period.ganzhi).toBe("壬子");
    expect(
      facts.slice(1).every(({ annual }) => annual.period === facts[1].annual.period),
    ).toBe(true);
  });

  it("keeps the selected-year daeun because canonical periods have only year boundaries", () => {
    const facts = buildMonthlyCompositeFacts(PROFILE, 2032);
    const selected = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2032,
    });

    expect(facts.every(({ daeun }) => daeun.period === facts[0].daeun.period)).toBe(true);
    expect(facts[0].daeun.period).toEqual(selected.timing.targetDaeun);
  });

  it("preserves natal pillars and calculates canonical annual/monthly 12-sal IDs", () => {
    const facts = buildMonthlyCompositeFacts(PROFILE, 2032);
    const selected = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2032,
    });
    const previous = buildYearlyCalculationSnapshot({
      profile: PROFILE,
      targetYear: 2031,
    });
    const natalYearBranch = selected.natal.pillars.year.branch;

    expect(facts[0].natal).toEqual({
      dayMaster: selected.natal.dayMaster,
      pillars: selected.natal.pillars,
    });
    expect(facts[0].annual.twelveSalId).toBe(
      getCanonicalTwelveSalId(natalYearBranch, previous.timing.annual.branch),
    );
    for (const [index, fact] of facts.entries()) {
      const expectedAnnual = index === 0
        ? previous.timing.annual
        : selected.timing.annual;
      expect(fact.annual.twelveSalId).toBe(
        getCanonicalTwelveSalId(natalYearBranch, expectedAnnual.branch),
      );
      expect(fact.monthly.period).toBe(fact.calendar.period);
      expect(fact.monthly.twelveSalId).toBe(
        getCanonicalTwelveSalId(natalYearBranch, fact.monthly.period.branch),
      );
    }
  });

  it("is deterministic", () => {
    expect(buildMonthlyCompositeFacts(PROFILE, 2032)).toEqual(
      buildMonthlyCompositeFacts(PROFILE, 2032),
    );
  });

  it("creates traceable natal, annual, and daeun monthly relations", () => {
    const facts = buildMonthlyCompositeFacts(PROFILE, 2032);
    const january = facts[0];
    const june = facts[5];

    expect(january.interactions.natalMonthly).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relationType: "충",
        source: "natal_monthly",
        members: expect.arrayContaining([
          expect.objectContaining({
            layer: "natal",
            pillarPosition: "year",
            symbol: "未",
            elementType: "branch",
          }),
          expect.objectContaining({
            layer: "monthly",
            symbol: "丑",
            elementType: "branch",
          }),
        ]),
      }),
    ]));
    expect(june.interactions.annualMonthly).toEqual(expect.arrayContaining([
      expect.objectContaining({ relationType: "천간충", source: "annual_monthly" }),
      expect.objectContaining({ relationType: "충", source: "annual_monthly" }),
    ]));
    expect(january.interactions.daeunMonthly).toEqual(expect.arrayContaining([
      expect.objectContaining({ relationType: "반합", source: "daeun_monthly" }),
      expect.objectContaining({ relationType: "천간충", source: "daeun_monthly" }),
    ]));
  });

  it("uses the effective previous annual in January multi-member relations", () => {
    const january = buildMonthlyCompositeFacts(JANUARY_GROUP_PROFILE, 2032)[0];
    const relation = january.interactions.annualMonthly.find(
      ({ relationType }) => relationType === "방합",
    );

    expect(january.annual.period.ganzhi).toBe("辛亥");
    expect(january.monthly.period.ganzhi).toBe("辛丑");
    expect(relation?.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ layer: "annual", symbol: "亥" }),
      expect.objectContaining({ layer: "monthly", symbol: "丑" }),
      expect.objectContaining({ layer: "natal", symbol: "子" }),
    ]));
  });

  it("does not create unknown-hour transit members", () => {
    const facts = buildMonthlyCompositeFacts(UNKNOWN_HOUR_PROFILE, 2032);
    const members = facts.flatMap(({ interactions }) =>
      Object.values(interactions).flatMap((relations) =>
        relations.flatMap(({ members: relationMembers }) => relationMembers),
      ),
    );

    expect(members.some(
      ({ layer, pillarPosition }) => layer === "natal" && pillarPosition === "hour",
    )).toBe(false);
  });

  it("returns no daeun relations when target daeun is absent", () => {
    const source = buildMonthlyCompositeFacts(PROFILE, 2032)[0];
    const baseFacts = {
      calendar: source.calendar,
      natal: source.natal,
      daeun: source.daeun,
      annual: source.annual,
      monthly: source.monthly,
    };

    expect(calculateMonthlyTransitRelations({
      ...baseFacts,
      daeun: { period: null },
    })).toMatchObject({
      daeunMonthly: [],
      annualDaeunMonthly: [],
    });
  });

  it("does not emit duplicate relation IDs", () => {
    for (const { interactions } of buildMonthlyCompositeFacts(PROFILE, 2032)) {
      for (const relations of Object.values(interactions)) {
        const ids = relations.map(({ id }) => id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});
