import { describe, expect, it } from "vitest";
import { validateFortuneVoice } from "../fortuneCopy/voiceValidation";
import { CAREER_SITUATIONS, LOVE_SITUATIONS } from "../yearlyReadingContext";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "./buildYearlyCareerCopy";
import { buildYearlyConditionCopy } from "./buildYearlyConditionCopy";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyLoveCopy } from "./buildYearlyLoveCopy";
import { buildYearlyMoneyCopy } from "./buildYearlyMoneyCopy";
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

function fixture(targetYear = 2032) {
  const snapshot = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear });
  const facts = buildYearlyInterpretationFacts({ snapshot });
  const signals = buildYearlyInterpretationSignals(facts);
  return {
    signals,
    copies: [
      buildYearlyOverallCopy(signals.overall),
      buildYearlyCareerCopy({ signals: signals.career, career: "employed" }),
      buildYearlyMoneyCopy(signals.money),
      buildYearlyLoveCopy({ signals: signals.love, love: "married" }),
      buildYearlyConditionCopy(signals.condition),
    ],
  };
}

const fixture2032 = () => fixture(2032);

describe("yearly deterministic copy quality", () => {
  it("keeps every section complete, traceable, and deterministic", () => {
    const first = fixture2032();
    const second = fixture2032();

    expect(second).toEqual(first);
    for (const copy of first.copies) {
      expect(copy.headline.trim()).not.toBe("");
      expect(copy.body.trim()).not.toBe("");
      expect(copy.tip.trim()).not.toBe("");
      expect(copy.sourceSignalIds.length).toBeGreaterThan(0);
      expect(new Set(copy.sourceSignalIds).size).toBe(copy.sourceSignalIds.length);
      expect(copy.sourceSignalIds.every((id) =>
        first.signals[copy.section].some((signal) => signal.id === id)
      )).toBe(true);
    }
  });

  it("follows the shared UNLOG voice policy guardrails", () => {
    for (const copy of fixture2032().copies) {
      expect(validateFortuneVoice(copy.body, {
        contentKind: "yearly_section",
        checkParagraphTone: true,
        checkAbstractLanguage: true,
      }), copy.section).toEqual([]);
      expect(validateFortuneVoice(copy.tip, { contentKind: "tip" }), copy.section)
        .toEqual([]);
    }
  });

  it("uses distinct section language without the former unnatural wording", () => {
    const { copies } = fixture2032();
    const headlines = copies.map(({ headline }) => headline);
    const text = copies.map(({ headline, body, tip }) => `${headline} ${body} ${tip}`).join(" ");

    expect(new Set(headlines).size).toBe(5);
    expect(headlines.filter((headline) => /흐름|가능성|기준을 .*하는 해/.test(headline)))
      .toHaveLength(0);
    expect(text).not.toMatch(/크기가 작은 경험|역할과 협업을 경험|바깥으로 펼치|움직임을 넓히|힘이 실리/);
  });

  it("does not repeat the same polite ending in consecutive body sentences", () => {
    const { copies } = fixture2032();

    const repeatedSections: string[] = [];
    for (const { section, body } of copies) {
      const endings = body
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.match(/([가-힣]+(?:요|니다))\.$/)?.[1] ?? null);
      if (endings.some((ending, index) =>
        index > 1
        && ending !== null
        && ending === endings[index - 1]
        && ending === endings[index - 2]
      )) {
        repeatedSections.push(section);
      }
    }
    expect(repeatedSections).toEqual([]);
  });

  it("keeps paid copy substantial, structured, and free of coaching-style repetition", () => {
    const fixtures = [fixture(2027), fixture(2032)];
    const fullText = fixtures.flatMap(({ copies }) => copies)
      .map(({ headline, body, tip }) => `${headline} ${body} ${tip}`)
      .join(" ");

    for (const { copies } of fixtures) {
      for (const { section, body, tip } of copies) {
        const bodySentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
        const tipSentences = tip.split(/(?<=[.!?])\s+/).filter(Boolean);
        expect(body.split("\n\n")).toHaveLength(2);
        expect(bodySentences.length).toBeGreaterThanOrEqual(5);
        expect(bodySentences.length).toBeLessThanOrEqual(7);
        expect(body.length, section).toBeGreaterThanOrEqual(430);
        expect(body.length).toBeLessThanOrEqual(700);
        expect(tipSentences).toHaveLength(1);
      }
    }

    const copies2027 = fixtures[0].copies;
    const copies2032 = fixtures[1].copies;
    for (let index = 0; index < copies2027.length; index += 1) {
      expect(copies2027[index].headline).not.toBe(copies2032[index].headline);
      expect(copies2027[index].body).not.toBe(copies2032[index].body);
      const sentences2027 = new Set(copies2027[index].body.split(/(?<=[.!?])\s+/));
      const sentences2032 = new Set(copies2032[index].body.split(/(?<=[.!?])\s+/));
      expect([...sentences2027].filter((sentence) => sentences2032.has(sentence))).toEqual([]);
      expect(copies2027[index].tip).not.toBe(copies2032[index].tip);
    }

    for (const repeatedWord of ["정리", "점검", "기준"]) {
      expect(fullText.split(repeatedWord).length - 1).toBeLessThanOrEqual(1);
    }
    expect(fullText).not.toContain("하는 편이 좋습니다");
    expect(fullText.split("해보세요").length - 1).toBeLessThanOrEqual(2);
  });

  it("changes career and love copy for every canonical context", () => {
    const { signals } = fixture2032();
    const careerCopies = CAREER_SITUATIONS.map(({ key }) =>
      buildYearlyCareerCopy({ signals: signals.career, career: key })
    );
    const loveCopies = LOVE_SITUATIONS.map(({ key }) =>
      buildYearlyLoveCopy({ signals: signals.love, love: key })
    );

    expect(new Set(careerCopies.map(({ headline, body }) => `${headline}\n${body}`)).size)
      .toBe(CAREER_SITUATIONS.length);
    expect(new Set(loveCopies.map(({ headline, body }) => `${headline}\n${body}`)).size)
      .toBe(LOVE_SITUATIONS.length);
  });
});
