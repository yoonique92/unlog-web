import { describe, expect, it } from "vitest";
import {
  LOVE_SITUATIONS,
  type LoveSituationKey,
} from "../yearlyReadingContext";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "./buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyLoveCopy } from "./buildYearlyLoveCopy";
import { buildYearlyMoneyCopy } from "./buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import { LOVE_CONTEXT_COPY_REGISTRY } from "./interpretationCopy/love";
import type { YearlyCalculationProfile } from "./types";

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

const RESETTING_LINE = "이럴 때는 누가 맞는지 가리기보다 각자 중요하게 여기는 부분과 맡을 몫을 구체적으로 말하는 쪽이 대화를 풀어가기 좋습니다.";
const SOURCE_SIGNAL_IDS = [
  "love-annual-stem-jeongjae",
  "love-annual-branch-pyeonjae",
  "love-stage-jeol",
  "love-daeun-stem-pyeongwan",
];

describe("buildYearlyLoveCopy", () => {
  it("covers every canonical love context with a complete copy", () => {
    const expectedKeys = LOVE_SITUATIONS.map(({ key }) => key);
    expect(Object.keys(LOVE_CONTEXT_COPY_REGISTRY)).toEqual(expectedKeys);

    for (const love of expectedKeys) {
      const copy = buildYearlyLoveCopy({ signals: fixture2032().love, love });
      expect(copy).toMatchObject({
        version: "yearly-copy-v1",
        section: "love",
        context: love,
        sourceSignalIds: SOURCE_SIGNAL_IDS,
      });
      expect(copy.headline.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
      expect(copy.tip.length).toBeGreaterThan(0);
    }
  });

  it.each([
    {
      love: "married",
      headline: "함께 사는 방식을 다시 맞춰보는 해",
      first: "올해는 함께 지켜온 생활의 안정감과, 관계 안에서 새로운 경험이나 대화를 늘리고 싶은 마음이 함께 커질 수 있습니다. 함께 보내는 시간, 돈을 쓰는 방식, 가족 일정, 각자의 역할처럼 말없이 맞춰오던 부분에서 서로 원하는 모습이 달라졌음을 느낄 수 있어요.",
      tip: "중요한 결정을 앞두고 있다면 결론부터 내리기보다, 함께 지킬 생활과 새로 바꾸고 싶은 부분을 각각 꺼내 놓고 비교하세요.",
    },
    {
      love: "dating",
      headline: "연락과 만남 방식을 다시 맞춰보는 해",
      first: "익숙해진 관계를 편안하게 이어가면서도, 서로 다르게 느끼는 연락 빈도와 애정 표현은 말로 맞춰보세요.",
      tip: "서운함이 쌓이기 전에 원하는 연락 방식이나 함께하고 싶은 일을 구체적으로 말해보세요.",
    },
    {
      love: "interested_person",
      headline: "관계를 서두르지 않고 연락과 반응을 살펴보는 해",
      first: "내 마음은 숨기지 않되 관계를 먼저 규정하려 하지 말고, 연락이 오가는 속도와 대화할 때의 편안함을 지켜보는 편이 좋습니다.",
      tip: "관계의 이름을 먼저 묻기보다, 대화가 서로 이어지는지 한 번 더 살펴보세요.",
    },
    {
      love: "new_connection",
      headline: "새로운 만남을 서두르지 않고 알아가는 해",
      first: "새로운 만남에는 열려 있되 첫인상만으로 결론 내리지 말고, 몇 번의 대화에서 말과 행동이 잘 맞는지 지켜보는 편이 좋습니다.",
      tip: "한 번의 인상보다 두세 번의 대화 뒤에도 편안한 사람인지 확인해보세요.",
    },
    {
      love: "prefer_single",
      headline: "혼자만의 시간과 사람 만나는 시간을 다시 맞추는 해",
      first: "혼자만의 시간을 충분히 지키면서도, 부담 없이 연락하고 만날 수 있는 사람들과는 편한 방식으로 교류해보세요.",
      tip: "약속 뒤에 지치지 않는지 살펴보고, 내게 편한 연락 횟수와 만남 간격을 존중해보세요.",
    },
    {
      love: "fresh_start",
      headline: "다음 관계에서 원하는 모습을 다시 생각해 보는 해",
      first: "지난 경험에서 계속 가져가고 싶은 점과 다음에는 다르게 해보고 싶은 점을 구분하면 새 만남에서도 내 뜻을 표현하기 쉬워집니다.",
      tip: "다음 관계에서 원하는 모습과 반복하고 싶지 않은 행동을 각각 세 가지씩 적어보세요.",
    },
    {
      love: "engaged",
      headline: "결혼 준비의 일정과 역할을 다시 맞추는 해",
      first: "결혼에 대한 마음뿐 아니라 일정, 비용, 집안일처럼 실제 생활에서 맡을 몫을 구체적으로 맞춰보세요.",
      tip: "이번 달에 결정할 일과 각자 맡을 준비를 한 장에 적어 함께 확인해보세요.",
    },
  ] as const)("locks the 2032 $love copy", ({ love, headline, first, tip }) => {
    const copy = buildYearlyLoveCopy({ signals: fixture2032().love, love });
    expect(copy).toMatchObject({
      version: "yearly-copy-v1",
      section: "love",
      headline,
      tip,
      context: love,
      sourceSignalIds: SOURCE_SIGNAL_IDS,
    });
    expect(copy.body.startsWith(`${first} ${RESETTING_LINE}`)).toBe(true);
    expect(copy.body.split("\n\n")).toHaveLength(2);
  });

  it("changes copy by context without changing or relabeling source signals", () => {
    const signals = fixture2032().love;
    const before = structuredClone(signals);
    const married = buildYearlyLoveCopy({ signals, love: "married" });
    const newConnection = buildYearlyLoveCopy({ signals, love: "new_connection" });

    expect(married).not.toEqual(newConnection);
    expect(married.sourceSignalIds).toEqual(newConnection.sourceSignalIds);
    expect(married.sourceSignalIds).not.toContain("married");
    expect(newConnection.sourceSignalIds).not.toContain("new_connection");
    expect(signals).toEqual(before);
  });

  it("is deterministic when signal order changes", () => {
    const signals = fixture2032().love;
    const input = { signals, love: "dating" as LoveSituationKey };

    expect(buildYearlyLoveCopy({ ...input, signals: [...signals].reverse() }))
      .toEqual(buildYearlyLoveCopy(input));
  });

  it("uses activity phase and handles missing daeun without inventing caution", () => {
    const annualOnly = fixture2032().love.filter(({ id }) => !id.startsWith("love-daeun-"));
    const copy = buildYearlyLoveCopy({ signals: annualOnly, love: "married" });

    expect(copy.body).toContain(RESETTING_LINE);
    expect(copy.body).not.toContain("감정이나 책임을 혼자 떠안지 말고");
    expect(copy.sourceSignalIds).toEqual(SOURCE_SIGNAL_IDS.slice(0, 3));
  });

  it("uses caution only as safe boundary and pace guidance", () => {
    const copy = buildYearlyLoveCopy({ signals: fixture2032().love, love: "dating" });

    expect(copy.body).toContain("각자 중요하게 여기는 부분과 맡을 몫을 구체적으로 말하는 쪽");
    expect(copy.body).not.toMatch(/싸움|이별|외도|배신|이혼/);
  });

  it("respects prefer_single and makes no deficit claim", () => {
    const copy = buildYearlyLoveCopy({ signals: fixture2032().love, love: "prefer_single" });

    expect(JSON.stringify(copy)).toContain("혼자만의 시간");
    expect(JSON.stringify(copy)).toContain("편한");
    expect(JSON.stringify(copy)).not.toMatch(/연애운이 없|외롭|혼자라서|만남이 필요/);
  });

  it("does not infer harm or trauma for fresh_start", () => {
    const copy = buildYearlyLoveCopy({ signals: fixture2032().love, love: "fresh_start" });

    expect(JSON.stringify(copy)).not.toMatch(/상처|배신|트라우마|버림|회복해야/);
  });

  it("never predicts another person's mind, relationship outcomes, or forces major decisions", () => {
    const outputs = LOVE_SITUATIONS.map(({ key }) =>
      buildYearlyLoveCopy({ signals: fixture2032().love, love: key })
    );
    const text = JSON.stringify(outputs);

    expect(text).not.toMatch(/반드시|무조건|확실히|틀림없이/);
    expect(text).not.toMatch(/새로운 사람이 생긴다|결혼한다|헤어진다|이혼한다|외도한다|바람난다|임신한다/);
    expect(text).not.toMatch(/상대가 나를 좋아한다|상대가 연락한다|마음을 숨기고 있/);
    expect(text).not.toMatch(/헤어지세요|결혼하세요|고백하세요|이혼하세요/);
  });

  it("keeps established signal and copy sections unchanged", () => {
    const signals = fixture2032();

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
  });
});
