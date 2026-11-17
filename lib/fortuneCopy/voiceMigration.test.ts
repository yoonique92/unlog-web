import { describe, expect, it, vi } from "vitest";

import { getTodayChemistryCopy } from "../../components/friends/FriendRelationshipDetail";
import { getCareerInterpretation } from "../careerInterpretation";
import { getCombinationInterpretation } from "../combinationInterpretation";
import { getDaeunInterpretation } from "../daeunInterpretation";
import { getPersonalityInterpretation } from "../interpretation";
import { getMoneyInterpretation } from "../moneyInterpretation";
import { getRelationshipInterpretation } from "../relationshipInterpretation";
import { getTodayFortune } from "../todayFortune";
import { getTodayFortuneDetails } from "../todayFortuneDetail";
import type { TenGodName } from "../tenGodUtils";
import { getYearlyInterpretation } from "../yearlyInterpretation";
import { validateFortuneVoice } from "./voiceValidation";

const TEN_GODS: TenGodName[] = [
  "비견", "겁재", "식신", "상관", "편재",
  "정재", "편관", "정관", "편인", "정인",
];

const forbiddenIssueCodes = new Set([
  "connective_goyo",
  "deterministic_event",
  "strong_directive",
]);

function expectVoiceGuardrail(text: string, contentKind: Parameters<typeof validateFortuneVoice>[1]["contentKind"]) {
  const issues = validateFortuneVoice(text, {
    contentKind,
    checkParagraphTone: true,
    checkAbstractLanguage: true,
  }).filter((issue) => forbiddenIssueCodes.has(issue.code));

  expect(issues, text).toEqual([]);
}

describe("UNLOG voice migration guardrails", () => {
  it("keeps deterministic today fortune selections inside the shared voice policy", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    TEN_GODS.forEach((tenGod, index) => {
      const result = getTodayFortune({
        dayStem: "甲",
        fiveElements: { 목: 2, 화: 1, 토: 1, 금: 1, 수: 1 },
        strength: "balanced",
        todayStem: "乙",
        todayBranch: String.fromCharCode(23376 + index),
        todayStemTenGod: tenGod,
        todayBranchTenGod: TEN_GODS[(index + 3) % TEN_GODS.length],
      });

      [result.headline, result.tip, ...result.fortunes.map((item) => item.comment)]
        .forEach((text) => expectVoiceGuardrail(text, "today_fortune"));
    });
  });

  it("keeps every generated Today headline compact and the detail copy connected", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    TEN_GODS.forEach((stemTenGod, stemIndex) => {
      TEN_GODS.forEach((branchTenGod, branchIndex) => {
        const input = {
          dayStem: "甲",
          fiveElements: { 목: 2, 화: 1, 토: 1, 금: 1, 수: 1 },
          strength: "balanced",
          todayStem: "乙",
          todayBranch: `${stemIndex}-${branchIndex}`,
          todayStemTenGod: stemTenGod,
          todayBranchTenGod: branchTenGod,
        } as const;
        const first = getTodayFortune(input);
        const second = getTodayFortune(input);

        expect(second).toEqual(first);
        expect(first.headline.length, first.headline).toBeLessThanOrEqual(32);
        expect(first.headline).not.toMatch(/하기 좋은 날이에요|하는 것이 중요한 날이에요/u);
        first.fortunes.forEach(({ comment }) => {
          expectVoiceGuardrail(comment, "today_fortune");
          expect(comment).not.toMatch(/날입니다\.\s[^.]*있습니다\./u);
        });

        [60, 72, 85].forEach((score) => {
          const details = getTodayFortuneDetails({
            todayStemTenGod: stemTenGod,
            todayBranchTenGod: branchTenGod,
            strength: "balanced",
            scores: {
              love: score,
              money: score,
              career: score,
              study: score,
              health: score,
              people: score,
            },
          });
          expect(details).toHaveLength(6);
          details.forEach(({ comment }) => {
            const sentences = comment.split(/(?<=[.!?])\s+/u);
            expectVoiceGuardrail(comment, "today_fortune");
            expect(sentences.length, comment).toBeGreaterThanOrEqual(2);
            expect(sentences.length, comment).toBeLessThanOrEqual(3);
            expect(Math.max(...sentences.map((sentence) => sentence.length)), comment)
              .toBeLessThanOrEqual(85);
            expect(comment).not.toContain("날이라");
            expect(comment).not.toMatch(/날입니다\.\s[^.]*있습니다\./u);
          });
        });
      });
    });
  });

  it("keeps every production yearly branch inside the shared voice policy", () => {
    const cases = [
      ["정인", "정관", "편인", "정관"],
      ["식신", "정재", "상관", "편재"],
      ["비견", "정관", "겁재", "편관"],
      ["정인", "비견", "편인", "겁재"],
      ["식신", "비견", "상관", "겁재"],
      ["정재", "비견", "편재", "겁재"],
    ];

    cases.forEach(([yearStemTenGod, yearBranchTenGod, currentDaeunStemTenGod, currentDaeunBranchTenGod]) => {
      const result = getYearlyInterpretation({
        dayStem: "甲",
        yearGanzhi: "壬子",
        yearStemTenGod,
        yearBranchTenGod,
        currentDaeunGanzhi: "辛亥",
        currentDaeunStemTenGod,
        currentDaeunBranchTenGod,
      });

      [result.headline, result.summary, result.career, result.money,
        result.relationship, result.caution, result.action]
        .forEach((text) => expectVoiceGuardrail(text, "yearly_section"));
    });
  });

  it("keeps relationship copy concrete without judging either person", () => {
    [64, 72, 80, 85, 90, 95].forEach((score) => {
      const copy = getTodayChemistryCopy(score);
      [copy.headline, copy.body, copy.advice]
        .forEach((text) => expectVoiceGuardrail(text, "relationship"));
    });
  });

  it("guards representative legacy interpretation output", () => {
    const counts = { 비견: 2, 식신: 2, 정재: 1, 정관: 1, 정인: 1 };
    const personality = getPersonalityInterpretation(
      "甲",
      { 목: 3, 화: 1, 토: 1, 금: 0, 수: 1 },
      "strong"
    );
    const career = getCareerInterpretation({ counts });
    const money = getMoneyInterpretation({ counts });
    const relationship = getRelationshipInterpretation({ counts });
    const combinations = getCombinationInterpretation(counts);
    const daeun = getDaeunInterpretation({
      current: {
        startAge: 30, endAge: 39, ganzhi: "辛亥", stem: "辛", branch: "亥",
        startYear: 2029, stemTenGod: "정관", branchTenGod: "정인",
        stage12: "장생", sal: [],
      },
      list: [],
    });

    const texts = [
      ...personality.paragraphs,
      career.primary.summary, career.primary.fit, career.primary.caution,
      career.secondary.summary, career.secondary.fit, career.secondary.caution,
      career.idealEnvironment, career.difficultEnvironment,
      money.summary, money.strength, money.caution, money.management,
      relationship.summary, relationship.strength, relationship.caution, relationship.advice,
      ...combinations.flatMap((item) => [item.summary, item.strength, item.caution]),
      daeun.currentSummary,
    ].filter((text): text is string => Boolean(text));

    texts.forEach((text) => expectVoiceGuardrail(text, "legacy_interpretation"));
  });
});
