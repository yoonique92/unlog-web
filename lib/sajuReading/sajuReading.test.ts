import { describe, expect, it } from "vitest";

import { validateFortuneVoice } from "../fortuneCopy/voiceValidation";
import { buildDayMasterCopy } from "./buildDayMasterCopy";
import { buildFiveElementsCopy } from "./buildFiveElementsCopy";
import {
  buildSajuReadingFacts,
  selectDominantTenGods,
} from "./buildSajuReadingFacts";
import { buildTenGodCopies } from "./buildTenGodCopy";
import type {
  SajuReadingFacts,
  SajuReadingSource,
  TenGodOccurrence,
} from "./types";

const baseFacts: SajuReadingFacts = {
  dayMaster: {
    stem: "己",
    koreanName: "기토",
    element: "토",
    yinYang: "음",
  },
  fiveElements: {
    목: 1,
    화: 1,
    토: 3,
    금: 1,
    수: 1,
  },
  tenGods: {
    counts: {
      비견: 0,
      겁재: 0,
      식신: 1,
      상관: 0,
      편재: 0,
      정재: 0,
      편관: 0,
      정관: 2,
      편인: 0,
      정인: 1,
    },
    occurrences: [],
    dominant: [
      { name: "정관", count: 2, locations: ["월간", "월지"] },
      { name: "식신", count: 1, locations: ["년간"] },
      { name: "정인", count: 1, locations: ["일지"] },
    ],
  },
  birthTimeUnknown: false,
};

const source = (overrides: Partial<SajuReadingSource> = {}): SajuReadingSource => ({
  dayStem: "己",
  fiveElements: { 목: 1, 화: 1, 토: 3, 금: 1, 수: 1 },
  tenGods: {
    year: { stem: "식신", branch: "비견" },
    month: { stem: "정관", branch: "정관" },
    day: { stem: "(일간)", branch: "정인" },
    hour: { stem: "편재", branch: "상관" },
  },
  birthTimeUnknown: false,
  ...overrides,
});

describe("saju reading v1", () => {
  it("builds deterministic day-master copy", () => {
    const first = buildDayMasterCopy(baseFacts);
    const second = buildDayMasterCopy(baseFacts);

    expect(first).toEqual(second);
    expect(first.headline).toContain("기토");
    expect(first.paragraphs).toHaveLength(2);
  });

  it("supports all ten day masters with the shared voice guardrails", () => {
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

    for (const stem of stems) {
      const facts = buildSajuReadingFacts(source({ dayStem: stem }));
      const copy = buildDayMasterCopy(facts);
      const issues = validateFortuneVoice(copy.paragraphs.join("\n"), {
        contentKind: "myeongri_explanation",
        checkParagraphTone: true,
        checkAbstractLanguage: true,
      });

      expect(copy.headline.length).toBeGreaterThan(0);
      expect(issues).toEqual([]);
    }
  });

  it("explains a dominant five element without treating it as good or bad", () => {
    const copy = buildFiveElementsCopy(baseFacts);

    expect(copy.headline).toContain("현실적으로 유지하고 쌓는 힘");
    expect(copy.sourceFacts).toContain("토=3");
    expect(copy.paragraphs.join(" ")).not.toMatch(/좋은 사주|나쁜 사주|용신|기신/u);
  });

  it("uses a balanced copy when the visible counts are close", () => {
    const copy = buildFiveElementsCopy({
      ...baseFacts,
      fiveElements: { 목: 2, 화: 2, 토: 1, 금: 2, 수: 1 },
    });

    expect(copy.headline).toContain("고르게");
  });

  it("selects dominant ten gods by count with deterministic first-seen tie breaking", () => {
    const occurrences: TenGodOccurrence[] = [
      { name: "식신", position: "year", target: "stem" },
      { name: "정관", position: "month", target: "stem" },
      { name: "정관", position: "month", target: "branch" },
      { name: "정인", position: "day", target: "branch" },
      { name: "식신", position: "hour", target: "stem" },
    ];

    expect(selectDominantTenGods(occurrences).map((item) => item.name)).toEqual([
      "식신",
      "정관",
      "정인",
    ]);
  });

  it("does not invent hour ten gods when the birth time is unknown", () => {
    const facts = buildSajuReadingFacts(
      source({
        birthTimeUnknown: true,
        tenGods: {
          year: { stem: "식신", branch: "비견" },
          month: { stem: "정관", branch: "정관" },
          day: { stem: "(일간)", branch: "정인" },
          hour: { stem: "편재", branch: "상관" },
        },
      }),
    );

    expect(facts.tenGods.occurrences).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ position: "hour" }),
      ]),
    );
    expect(facts.tenGods.counts.편재).toBe(0);
    expect(facts.tenGods.counts.상관).toBe(0);
  });

  it("never invents ten gods that are not present in dominant facts", () => {
    const copies = buildTenGodCopies(baseFacts);

    expect(copies.map((copy) => copy.name)).toEqual(["정관", "식신", "정인"]);
    expect(copies).toHaveLength(3);
  });

  it("passes the shared UNLOG voice guardrails", () => {
    const texts = [
      ...buildDayMasterCopy(baseFacts).paragraphs,
      ...buildFiveElementsCopy(baseFacts).paragraphs,
      ...buildTenGodCopies(baseFacts).map((copy) => copy.body),
    ];

    for (const text of texts) {
      const issues = validateFortuneVoice(text, {
        contentKind: "myeongri_explanation",
        checkParagraphTone: true,
        checkAbstractLanguage: true,
      });
      expect(issues).toEqual([]);
      expect(text).not.toMatch(/(?:고요|되고요|커지고요|싶어지고요)[.!?]/u);
    }
  });
});
