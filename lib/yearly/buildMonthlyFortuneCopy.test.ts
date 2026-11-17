import { describe, expect, it } from "vitest";
import { validateFortuneVoice } from "../fortuneCopy/voiceValidation";
import { buildMonthlyCompositeFacts } from "./buildMonthlyCompositeFacts";
import { buildMonthlyCompositeSignals } from "./buildMonthlyCompositeSignals";
import { buildMonthlyFortuneCopies } from "./buildMonthlyFortuneCopy";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import type { YearlyCalculationProfile } from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function signals(profile = PROFILE) {
  return buildMonthlyCompositeSignals(buildMonthlyCompositeFacts(profile, 2032));
}

describe("buildMonthlyFortuneCopies", () => {
  it("builds non-empty two-paragraph copy for all 12 display months", () => {
    const copies = buildMonthlyFortuneCopies(signals());

    expect(copies).toHaveLength(12);
    expect(copies.map(({ displayMonth }) => displayMonth)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    for (const copy of copies) {
      expect(copy.version).toBe("monthly-copy-v1");
      expect(copy).not.toHaveProperty("emoji");
      expect(copy.headline.trim()).not.toBe("");
      expect(copy.headline.length).toBeGreaterThanOrEqual(12);
      expect(copy.headline.length).toBeLessThanOrEqual(26);
      expect(copy.headline).not.toMatch(/\d+월|이번 달/);
      expect(copy.headline).not.toMatch(/하세요|해보세요|정하세요|살펴보세요/);
      expect(copy.body.split("\n\n")).toHaveLength(2);
      expect(copy.body.length).toBeGreaterThanOrEqual(350);
      expect(copy.body.length).toBeLessThanOrEqual(550);
      expect(copy.tip.trim()).not.toBe("");
    }
  });

  it("follows the shared UNLOG voice policy without changing headline tone", () => {
    for (const copy of buildMonthlyFortuneCopies(signals())) {
      expect(validateFortuneVoice(copy.headline, {
        contentKind: "monthly_headline",
      }), `${copy.displayMonth}월 headline`).toEqual([]);
      expect(validateFortuneVoice(copy.body, {
        contentKind: "monthly_body",
        checkParagraphTone: true,
        checkAbstractLanguage: true,
      }), `${copy.displayMonth}월 body`).toEqual([]);
      expect(validateFortuneVoice(copy.tip, {
        contentKind: "tip",
      }), `${copy.displayMonth}월 tip`).toEqual([]);
    }
  });


  it("is deterministic and references only existing unique signal IDs", () => {
    const composite = signals();
    const first = buildMonthlyFortuneCopies(composite);
    const second = buildMonthlyFortuneCopies(composite);

    expect(second).toEqual(first);
    for (const copy of first) {
      const available = new Set(
        composite.months.find(({ displayMonth }) => displayMonth === copy.displayMonth)!
          .signals.map(({ id }) => id),
      );
      expect(new Set(copy.sourceSignalIds).size).toBe(copy.sourceSignalIds.length);
      expect(copy.sourceSignalIds.every((id) => available.has(id))).toBe(true);
    }
  });

  it("keeps January's effective annual evidence", () => {
    const composite = signals();
    const januaryFacts = buildMonthlyCompositeFacts(PROFILE, 2032)[0];
    const januaryCopy = buildMonthlyFortuneCopies(composite)[0];
    const januarySignals = composite.months[0].signals;

    expect(januaryFacts.annual.period.ganzhi).toBe("辛亥");
    expect(januaryCopy.sourceSignalIds.some((id) =>
      januarySignals.some((signal) =>
        signal.id === id && signal.source === "annual_monthly"),
    )).toBe(true);
  });

  it("supports null daeun and unknown birth hour", () => {
    const noDaeunFacts = buildMonthlyCompositeFacts(PROFILE, 2032).map((month) => ({
      ...month,
      daeun: { period: null },
      interactions: {
        ...month.interactions,
        daeunMonthly: [],
        annualDaeunMonthly: [],
      },
    }));
    expect(buildMonthlyFortuneCopies(
      buildMonthlyCompositeSignals(noDaeunFacts),
    )).toHaveLength(12);

    expect(buildMonthlyFortuneCopies(signals({
      ...PROFILE,
      birthTimeUnknown: true,
    }))).toHaveLength(12);
  });

  it("avoids event certainty and prohibited prediction language", () => {
    const output = JSON.stringify(buildMonthlyFortuneCopies(signals()));
    expect(output).not.toMatch(
      /이직 확정|퇴사 확정|연애 시작|수입 급증|임신|결혼 확정|질병|사고|당첨|반드시 일어난|무조건 좋|무조건 나쁘/,
    );
  });

  it("keeps all headlines and tips unique and avoids repeated body sentences", () => {
    const copies = buildMonthlyFortuneCopies(signals());
    const headlines = copies.map(({ headline }) => headline);
    const tips = copies.map(({ tip }) => tip);
    const sentences = copies.flatMap(({ body }) =>
      body.replaceAll("\n", " ").split(/(?<=[.!?])\s+/).filter(Boolean),
    );

    expect(new Set(headlines).size).toBe(12);
    expect(new Set(tips).size).toBe(12);
    expect(new Set(sentences).size).toBe(sentences.length);
  });

  it("keeps the approved scene-based headlines unchanged", () => {
    expect(buildMonthlyFortuneCopies(signals()).map(({ headline }) => headline)).toEqual([
      "숨겨둔 결과물, 이제 진짜 꺼내놓을까?",
      "쓸 돈은 늘고 일정까지 왜 이렇게 빡빡해?",
      "반가운 연락은 오는데 다 만나긴 벅찰 때",
      "계획 세워놨는데 왜 자꾸 다른 일이 끼어들지?",
      "쉬려고 했는데 또 새로운 게 눈에 들어와요",
      "익숙한 것보다 새로 배우는 게 재밌어질 때",
      "밖에선 신나는데 집에 오면 아무도 보기 싫을지도",
      "참고 넘긴 말, 이번엔 그냥 못 넘길지도",
      "거의 다 끝냈는데 왜 작은 게 자꾸 거슬리지?",
      "한마디 하고 싶은데 괜히 입이 안 떨어져요",
      "사람을 만날수록 혼자 쓸 시간이 더 아쉬워져요",
      "갖고 싶은데 통장은 왜 자꾸 보게 되지?",
    ]);
  });

  it("keeps monthly language broad, conversational, and free of internal labels", () => {
    const copies = buildMonthlyFortuneCopies(signals());
    const workCentric = copies.filter(({ headline }) =>
      /업무|회사|역할|책임|프로젝트|마감|성과/.test(headline));

    expect(workCentric.length).toBeLessThan(6);
    for (const copy of copies) {
      expect(copy.body).not.toMatch(
        /이번 달의 요구|올해의 주제|장기적인 과제와 맞물려|서로 연결해 활용|방향을 조절|결과를 구체화|기운|에너지|흐름이 확장/,
      );
      for (const paragraph of copy.body.split("\n\n")) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
        expect(
          sentences.every((sentence) => /(?:습니다|합니다)\.$/.test(sentence)),
          `${copy.displayMonth}월: ${paragraph}`,
        ).toBe(false);
        const endings = sentences.map((sentence) =>
          sentence.match(/([가-힣]+(?:요|니다))[.!?]$/)?.[1] ?? "other");
        for (let index = 2; index < endings.length; index += 1) {
          expect(
            new Set(endings.slice(index - 2, index + 1)).size,
            `${paragraph}\nendings=${endings.join(",")}`,
          ).toBeGreaterThan(1);
        }
      }
    }
  });

  it("avoids the repeated assembly phrases removed in the final polish", () => {
    const output = buildMonthlyFortuneCopies(signals()).map(({ body }) => body).join("\n");

    expect(output).not.toMatch(
      /내가 편하게 느끼는 생활 방식에 지금 생긴 일이|오래 지켜온 생활 방식과 새로 잡힌 일정이|익숙한 사람이나 경험이 일을 풀어가는 데 도움이|지금 생긴 일이 의외로 잘 어울려/,
    );
  });

  it("keeps February focused on expenses and scheduling without vague promises", () => {
    const february = buildMonthlyFortuneCopies(signals())[1];

    expect(`${february.body} ${february.tip}`).not.toContain("약속");
    expect(february.body).toMatch(/지출|돈/);
    expect(february.body).toMatch(/일정|해야 할 일/);
  });

  it("does not use conversational connective endings in body or tips", () => {
    for (const copy of buildMonthlyFortuneCopies(signals())) {
      expect(`${copy.body} ${copy.tip}`).not.toMatch(/(?:고요|되고요|커지고요|싶어지고요)[.!?]/);
    }
  });

  it("does not alter established yearly signals or copy", () => {
    const facts = buildYearlyInterpretationFacts({
      snapshot: buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 }),
    });
    const before = buildYearlyInterpretationSignals(facts);
    const headline = buildYearlyOverallCopy(before.overall).headline;

    buildMonthlyFortuneCopies(signals());

    expect(buildYearlyInterpretationSignals(facts)).toEqual(before);
    expect(buildYearlyOverallCopy(before.overall).headline).toBe(headline);
  });
});
