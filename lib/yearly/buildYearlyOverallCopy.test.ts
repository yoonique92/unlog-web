import { describe, expect, it } from "vitest";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
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

function signal(
  id: string,
  kind: YearlyInterpretationSignal["kind"],
  priority: number,
  activityPhase?: YearlyInterpretationSignal["activityPhase"],
): YearlyInterpretationSignal {
  return {
    id,
    section: "overall",
    kind,
    theme: id,
    ...(activityPhase ? { activityPhase } : {}),
    priority,
    evidence: [{ source: "annual_stem_ten_god", value: id, valueId: id }],
  };
}

function fixture2032Signals() {
  const snapshot = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 });
  const facts = buildYearlyInterpretationFacts({ snapshot });
  return buildYearlyInterpretationSignals(facts).overall;
}

describe("buildYearlyOverallCopy", () => {
  it("locks the curated 2032 overall copy", () => {
    const copy = buildYearlyOverallCopy(fixture2032Signals());
    expect(copy).toMatchObject({
      version: "yearly-copy-v1",
      section: "overall",
      headline: "익숙한 기반을 지키며 새로운 길을 시험하는 해",
      tip: "새 제안이 눈에 들어오면 기존 생활을 바로 바꾸기보다, 실제로 병행할 수 있는 기간과 조건부터 확인해두는 편이 좋습니다.",
      sourceSignalIds: [
        "annual-stem-jeongjae",
        "annual-branch-pyeonjae",
        "annual-stage-jeol",
        "annual-twelve-sal-twelve_nyeon_sal",
        "daeun-stem-pyeongwan",
      ],
    });
    expect(copy.body).toContain("일정 기간 두 방식을 함께 경험해보면");
    expect(copy.body.split("\n\n")).toHaveLength(2);
  });

  it("is deterministic even when input signal order changes", () => {
    const signals = fixture2032Signals();
    expect(buildYearlyOverallCopy([...signals].reverse()))
      .toEqual(buildYearlyOverallCopy(signals));
  });

  it.each([
    {
      name: "stability with resetting",
      signals: [
        signal("annual-stem-stability", "stability", 100),
        signal("annual-branch-theme", "theme", 95),
        signal("annual-stage-resetting", "change", 90, "resetting"),
      ],
      headline: "익숙한 기반을 지키며 새로운 길을 시험하는 해",
    },
    {
      name: "change",
      signals: [
        signal("annual-stem-change", "change", 100),
        signal("annual-branch-theme", "theme", 95),
      ],
      headline: "익숙한 방식에서 한 걸음 벗어나 보는 해",
    },
    {
      name: "momentum with expanding",
      signals: [
        signal("annual-stem-momentum", "momentum", 100),
        signal("annual-branch-theme", "theme", 95),
        signal("annual-stage-expanding", "momentum", 90, "expanding"),
      ],
      headline: "새로운 선택지를 직접 확인해 보는 해",
    },
    {
      name: "momentum with peaking",
      signals: [
        signal("annual-stem-momentum", "momentum", 100),
        signal("annual-branch-theme", "theme", 95),
        signal("annual-stage-peaking", "momentum", 90, "peaking"),
      ],
      headline: "잘해 온 일에서 분명한 결과를 만드는 해",
    },
  ])("selects the $name combination", ({ signals, headline }) => {
    const copy = buildYearlyOverallCopy(signals);
    expect(copy.headline).toBe(headline);
    expect(copy.sourceSignalIds.length).toBeGreaterThanOrEqual(2);
  });

  it("turns caution into safe pacing guidance", () => {
    const copy = buildYearlyOverallCopy([
      signal("annual-stem-change", "change", 100),
      signal("annual-branch-caution", "caution", 95),
    ]);

    expect(copy.headline).toBe("서두르지 않고 다음 방향을 확인하는 해");
    expect(copy.tip).toBe("새 제안이 눈에 들어오면 기존 생활을 바로 바꾸기보다, 실제로 병행할 수 있는 기간과 조건부터 확인해두는 편이 좋습니다.");
    expect(copy.body).not.toMatch(/실패|사고|나쁜 일|흉/);
  });

  it("works without target-daeun signals", () => {
    const annualOnly = fixture2032Signals().filter(({ id }) => !id.startsWith("daeun-"));
    const copy = buildYearlyOverallCopy(annualOnly);

    expect(copy.headline).toBe("익숙한 기반을 지키며 새로운 길을 시험하는 해");
    expect(copy.sourceSignalIds.every((id) => !id.startsWith("daeun-"))).toBe(true);
  });

  it("uses a deterministic fallback for an unexpected empty combination", () => {
    expect(buildYearlyOverallCopy([])).toEqual({
      version: "yearly-copy-v1",
      section: "overall",
      headline: "서두르지 않고 내 속도를 확인하는 해",
      body: "올해는 한 가지 답을 빨리 고르기보다, 실제 상황을 겪어보며 내게 맞는 속도를 확인하는 편이 좋습니다.",
      tip: "한 번에 결론을 내리지 말고, 지금 가장 궁금한 선택 하나부터 직접 확인해보세요.",
      sourceSignalIds: [],
    });
  });

  it("keeps source IDs traceable, unique, and ordered", () => {
    const signals = fixture2032Signals();
    const ids = buildYearlyOverallCopy(signals).sourceSignalIds;

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => signals.some((item) => item.id === id))).toBe(true);
  });

  it("does not emit prohibited certainty, medical, accident, or context wording", () => {
    const copies = [
      buildYearlyOverallCopy(fixture2032Signals()),
      buildYearlyOverallCopy([]),
      buildYearlyOverallCopy([
        signal("annual-stem-change", "change", 100),
        signal("annual-branch-caution", "caution", 95),
        signal("annual-stage-contracting", "caution", 90, "contracting"),
      ]),
    ];
    const text = JSON.stringify(copies);

    expect(text).not.toMatch(/반드시|무조건|확실히|틀림없이|큰돈을 번다|이별한다|결혼한다|퇴사한다|사고가 난다|병에 걸린다/);
    expect(text).not.toMatch(/질병|수술|임신|유산|사망/);
    expect(text).not.toMatch(/married|dating|new_connection|employed|student/);
  });
});
