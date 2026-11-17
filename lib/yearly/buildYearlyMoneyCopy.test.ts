import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "./buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyMoneyCopy } from "./buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import type {
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
  activityPhase?: YearlyInterpretationSignal["activityPhase"],
): YearlyInterpretationSignal {
  return {
    id,
    section: "money",
    kind,
    theme: id,
    ...(activityPhase ? { activityPhase } : {}),
    priority,
    evidence: [{ source: "annual_stem_ten_god", value: id, valueId: id }],
  };
}

describe("buildYearlyMoneyCopy", () => {
  it("locks the curated 2032 money copy", () => {
    const copy = buildYearlyMoneyCopy(fixture2032().money);
    expect(copy).toMatchObject({
      version: "yearly-copy-v1",
      section: "money",
      headline: "지킬 돈과 기회에 쓸 돈을 구분하는 해",
      tip: "관심 가는 지출이 생기면 금액만 보지 말고, 고정비를 제외한 뒤에도 몇 달간 감당할 수 있는지 살펴보는 편이 좋습니다.",
      sourceSignalIds: [
        "money-annual-stem-jeongjae",
        "money-annual-branch-pyeonjae",
        "money-stage-jeol",
        "money-daeun-stem-pyeongwan",
      ],
    });
    expect(copy.body).toContain("첫 결제보다 전체 유지 비용");
    expect(copy.body.split("\n\n")).toHaveLength(2);
  });

  it.each([
    {
      name: "stability",
      signals: [signal("money-annual-stem-stability", "stability", 100)],
      headline: "생활비와 저축 습관을 단단히 만드는 해",
    },
    {
      name: "change",
      signals: [signal("money-annual-stem-change", "change", 100)],
      headline: "돈 쓰는 방식을 바꾸기 전에 조건을 비교하는 해",
    },
    {
      name: "momentum",
      signals: [signal("money-annual-stem-momentum", "momentum", 100)],
      headline: "아이디어를 실제 수입 방식으로 시험해 보는 해",
    },
    {
      name: "caution",
      signals: [signal("money-annual-stem-caution", "caution", 100)],
      headline: "새는 돈을 줄이고 필요한 지출부터 챙기는 해",
    },
    {
      name: "stability plus change",
      signals: [
        signal("money-annual-stem-stability", "stability", 100),
        signal("money-annual-branch-change", "change", 95),
      ],
      headline: "새로운 지출은 따져보고 생활비는 지키는 해",
    },
    {
      name: "resetting",
      signals: [
        signal("money-annual-stem-stability", "stability", 100),
        signal("money-stage-resetting", "change", 90, "resetting"),
      ],
      headline: "지킬 돈과 기회에 쓸 돈을 구분하는 해",
    },
    {
      name: "expanding",
      signals: [
        signal("money-annual-stem-momentum", "momentum", 100),
        signal("money-stage-expanding", "momentum", 90, "expanding"),
      ],
      headline: "내가 만든 결과를 수입 기회로 연결해 보는 해",
    },
    {
      name: "peaking",
      signals: [
        signal("money-annual-stem-momentum", "momentum", 100),
        signal("money-stage-peaking", "momentum", 90, "peaking"),
      ],
      headline: "돈과 시간을 가장 중요한 곳에 모으는 해",
    },
  ])("handles the $name combination", ({ signals, headline }) => {
    const copy = buildYearlyMoneyCopy(signals);
    expect(copy.headline).toBe(headline);
    expect(copy.body.length).toBeGreaterThan(0);
    expect(copy.tip.length).toBeGreaterThan(0);
  });

  it("handles missing target-daeun signals without adding a background caution", () => {
    const annualOnly = fixture2032().money.filter(({ id }) => !id.startsWith("money-daeun-"));
    const copy = buildYearlyMoneyCopy(annualOnly);

    expect(copy.body).not.toContain("기회를 확인하려고 쓰는 돈");
    expect(copy.sourceSignalIds).toEqual([
      "money-annual-stem-jeongjae",
      "money-annual-branch-pyeonjae",
      "money-stage-jeol",
    ]);
  });

  it("uses a deterministic empty-signal fallback", () => {
    expect(buildYearlyMoneyCopy([])).toEqual({
      version: "yearly-copy-v1",
      section: "money",
      headline: "내 돈이 어디에 쓰이는지 확인하는 해",
      body: "올해는 수입의 많고 적음을 예측하기보다, 돈과 시간을 어디에 쓰고 있는지 실제 기록으로 확인하는 일이 중요합니다.",
      tip: "일주일만 카드와 계좌 사용 내역을 적어 반복되는 지출부터 확인해보세요.",
      sourceSignalIds: [],
    });
  });

  it("is deterministic when input signal order changes and preserves source IDs", () => {
    const signals = fixture2032().money;
    const first = buildYearlyMoneyCopy(signals);
    const second = buildYearlyMoneyCopy([...signals].reverse());

    expect(second).toEqual(first);
    expect(new Set(first.sourceSignalIds).size).toBe(first.sourceSignalIds.length);
    expect(first.sourceSignalIds.every((id) => signals.some((item) => item.id === id))).toBe(true);
  });

  it("uses caution only as safe resource-management guidance", () => {
    const copy = buildYearlyMoneyCopy([
      signal("money-annual-stem-change", "change", 100),
      signal("money-daeun-stem-caution", "caution", 75),
    ]);
    expect(copy.body).toContain("생활비와 고정비를 해치지 않으면서도");
    expect(copy.body).not.toMatch(/손실|파산|빚|재산 감소|돈을 잃는다/);
  });

  it("contains no context, investment advice, amount prediction, or certainty claims", () => {
    const copies = [
      buildYearlyMoneyCopy(fixture2032().money),
      buildYearlyMoneyCopy([]),
      buildYearlyMoneyCopy([signal("money-annual-stem-caution", "caution", 100)]),
    ];
    const text = JSON.stringify(copies);

    expect(text).not.toMatch(/연봉|자산|직업|결혼|love|career/);
    expect(text).not.toMatch(/주식|코인|집 사세요|대출|매수|매도|투자하세요|사업 확장하세요/);
    expect(text).not.toMatch(/큰돈|목돈이 들어온다|수입이 몇 배 오른다|돈을 많이 번다|재산이 늘어난다|재산이 줄어든다/);
    expect(text).not.toMatch(/반드시|무조건|확실히|틀림없이|돈을 번다|돈을 잃는다|부자가 된다|재물이 들어온다|대박 난다|파산한다/);
  });

  it("keeps established overall, career, and money signals/copy unchanged", () => {
    const signals = fixture2032();
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
  });
});
