import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "./buildYearlyCareerCopy";
import { buildYearlyConditionCopy } from "./buildYearlyConditionCopy";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyLoveCopy } from "./buildYearlyLoveCopy";
import { buildYearlyMoneyCopy } from "./buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import type {
  YearlyActivityPhase,
  YearlyCalculationProfile,
  YearlyInterpretationSignal,
} from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function fixture2032() {
  const snapshot = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 });
  const facts = buildYearlyInterpretationFacts({ snapshot });
  return buildYearlyInterpretationSignals(facts);
}

function signal(
  id: string,
  kind: YearlyInterpretationSignal["kind"],
  priority: number,
  activityPhase?: YearlyActivityPhase,
): YearlyInterpretationSignal {
  return {
    id,
    section: "condition",
    kind,
    theme: id,
    ...(activityPhase ? { activityPhase } : {}),
    priority,
    evidence: [{ source: "annual_stem_ten_god", value: id, valueId: id }],
  };
}

const RESETTING_LINE = "평소 일정은 그대로인데 맡은 일이나 약속이 늘면서, 집중해야 할 시간이 한쪽에 몰리고 쉬는 간격은 짧아지는 식으로 체감하기 쉽습니다.";
const CAUTION_LINE = "매일 같은 속도를 유지하려 하기보다, 몰입이 필요한 날 뒤에는 회복할 시간을 확보하는 방식이 오래 버티기 수월해요.";

describe("buildYearlyConditionCopy", () => {
  it("locks the curated 2032 condition copy", () => {
    const copy = buildYearlyConditionCopy(fixture2032().condition);
    expect(copy).toMatchObject({
      version: "yearly-copy-v1",
      section: "condition",
      headline: "몰입하는 시기와 쉬어갈 때를 구분하는 해",
      tip: "일이 겹치는 주에는 새 약속을 더 넣기보다, 집중해야 할 날 다음에 아무 일정 없는 시간을 남겨두면 좋습니다.",
      sourceSignalIds: [
        "condition-annual-stem-jeongjae",
        "condition-annual-branch-pyeonjae",
        "condition-stage-jeol",
        "condition-daeun-stem-pyeongwan",
      ],
    });
    expect(copy.body).toContain(RESETTING_LINE);
    expect(copy.body).toContain(CAUTION_LINE);
    expect(copy.body.split("\n\n")).toHaveLength(2);
  });

  it.each([
    {
      name: "stability",
      signals: [signal("condition-annual-stem-stability", "stability", 100)],
      headline: "매일 지킬 수 있는 생활 습관을 만드는 해",
    },
    {
      name: "change",
      signals: [signal("condition-annual-stem-change", "change", 100)],
      headline: "달라진 일정에 맞는 생활 방식을 찾는 해",
    },
    {
      name: "momentum",
      signals: [signal("condition-annual-stem-momentum", "momentum", 100)],
      headline: "할 일을 미루지 않고 하나씩 끝내는 해",
    },
    {
      name: "caution",
      signals: [signal("condition-annual-stem-caution", "caution", 100)],
      headline: "바쁜 날과 쉬는 날을 분명히 나누는 해",
    },
    {
      name: "resetting",
      signals: [
        signal("condition-annual-stem-stability", "stability", 100),
        signal("condition-stage-resetting", "change", 90, "resetting"),
      ],
      headline: "몰입하는 시기와 쉬어갈 때를 구분하는 해",
    },
    {
      name: "expanding",
      signals: [
        signal("condition-annual-stem-momentum", "momentum", 100),
        signal("condition-stage-expanding", "momentum", 90, "expanding"),
      ],
      headline: "새로운 활동을 생활 안에 무리 없이 더하는 해",
    },
    {
      name: "peaking",
      signals: [
        signal("condition-annual-stem-momentum", "momentum", 100),
        signal("condition-stage-peaking", "momentum", 90, "peaking"),
      ],
      headline: "가장 중요한 일에 시간과 집중을 모으는 해",
    },
    {
      name: "contracting",
      signals: [
        signal("condition-annual-stem-change", "change", 100),
        signal("condition-stage-contracting", "caution", 90, "contracting"),
      ],
      headline: "일정을 줄이고 꼭 필요한 일에 집중하는 해",
    },
    {
      name: "stabilizing",
      signals: [
        signal("condition-annual-stem-stability", "stability", 100),
        signal("condition-stage-stabilizing", "stability", 90, "stabilizing"),
      ],
      headline: "무리 없이 반복할 생활 습관을 만드는 해",
    },
  ])("handles the $name combination", ({ signals, headline }) => {
    const copy = buildYearlyConditionCopy(signals);
    expect(copy.headline).toBe(headline);
    expect(copy.body.length).toBeGreaterThan(0);
    expect(copy.tip.length).toBeGreaterThan(0);
  });

  it.each([
    ["emerging", "기상 시간이나 짧은 산책"],
    ["expanding", "기존 일정 중 하나는 줄여야"],
    ["peaking", "중요한 한두 가지"],
    ["stabilizing", "매일 반복할 수 있는 습관"],
    ["contracting", "효과가 낮은 활동"],
    ["resetting", "집중해야 할 시간이 한쪽에 몰리고"],
  ] as const)("uses the %s activity phase", (phase, expected) => {
    const copy = buildYearlyConditionCopy([
      signal(`condition-stage-${phase}`, "theme", 90, phase),
    ]);
    expect(copy.body).toContain(expected);
    expect(copy.sourceSignalIds).toEqual([`condition-stage-${phase}`]);
  });

  it("handles missing target-daeun signals without background caution", () => {
    const annualOnly = fixture2032().condition.filter(({ id }) => !id.startsWith("condition-daeun-"));
    const copy = buildYearlyConditionCopy(annualOnly);

    expect(copy.body).toContain(RESETTING_LINE);
    expect(copy.body).not.toContain(CAUTION_LINE);
    expect(copy.sourceSignalIds).toEqual([
      "condition-annual-stem-jeongjae",
      "condition-annual-branch-pyeonjae",
      "condition-stage-jeol",
    ]);
  });

  it("uses a complete deterministic empty-signal fallback", () => {
    expect(buildYearlyConditionCopy([])).toEqual({
      version: "yearly-copy-v1",
      section: "condition",
      headline: "무리하지 않고 생활 속도를 확인하는 해",
      body: "한꺼번에 생활 전체를 바꾸기보다, 일주일 일정을 돌아보며 오래 유지할 수 있는 속도를 찾아보세요.",
      tip: "이번 주 일정에서 꼭 해야 할 일과 다음 주로 넘겨도 될 일을 나누어보세요.",
      sourceSignalIds: [],
    });
  });

  it("is deterministic when input order changes and does not mutate signals", () => {
    const signals = fixture2032().condition;
    const before = structuredClone(signals);
    const first = buildYearlyConditionCopy(signals);
    const second = buildYearlyConditionCopy([...signals].reverse());

    expect(second).toEqual(first);
    expect(signals).toEqual(before);
    expect(new Set(first.sourceSignalIds).size).toBe(first.sourceSignalIds.length);
    expect(first.sourceSignalIds.every((id) => signals.some((item) => item.id === id))).toBe(true);
  });

  it("uses caution only as safe schedule and pace guidance", () => {
    const copy = buildYearlyConditionCopy([
      signal("condition-annual-stem-change", "change", 100),
      signal("condition-daeun-stem-caution", "caution", 75),
    ]);

    expect(copy.body).toContain("몰입이 필요한 날 뒤에는 회복할 시간을 확보하는 방식");
    expect(copy.body).not.toMatch(/질병|병에 걸|수술|입원|사고|부상|임신|유산|사망/);
  });

  it("has no context dependency, medical prediction, health score, or certainty claim", () => {
    const outputs = [
      buildYearlyConditionCopy(fixture2032().condition),
      buildYearlyConditionCopy([]),
      buildYearlyConditionCopy([signal("condition-annual-stem-caution", "caution", 100)]),
    ];
    const text = JSON.stringify(outputs);

    expect(text).not.toMatch(/love|career|married|student|employed|건강정보/);
    expect(text).not.toMatch(/질병|병에 걸|수술|입원|사고|부상|임신|유산|사망|정신질환/);
    expect(text).not.toMatch(/건강이 나빠|건강이 좋아|몸이 약해|체력이 좋|체력이 약/);
    expect(text).not.toMatch(/healthScore|energyScore|conditionScore|riskScore/);
    expect(text).not.toMatch(/반드시|무조건|확실히|틀림없이/);
  });

  it("keeps established signals and copies unchanged", () => {
    const signals = fixture2032();

    expect(signals.condition.map(({ id }) => id)).toEqual([
      "condition-annual-stem-jeongjae",
      "condition-annual-branch-pyeonjae",
      "condition-stage-jeol",
      "condition-daeun-stem-pyeongwan",
      "condition-daeun-branch-jeongin",
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
