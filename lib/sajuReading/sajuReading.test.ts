import { describe, expect, it } from "vitest";

import { validateFortuneVoice } from "../fortuneCopy/voiceValidation";
import { buildDayMasterCopy } from "./buildDayMasterCopy";
import { buildFiveElementsCopy } from "./buildFiveElementsCopy";
import { selectDominantTenGods } from "./buildSajuReadingFacts";
import { buildTenGodCopies } from "./buildTenGodCopy";
import type { SajuReadingFacts, TenGodOccurrence } from "./types";

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

describe("saju reading v1", () => {
  it("builds deterministic day-master copy", () => {
    const first = buildDayMasterCopy(baseFacts);
    const second = buildDayMasterCopy(baseFacts);

    expect(first).toEqual(second);
    expect(first.headline).toContain("기토");
    expect(first.paragraphs).toHaveLength(2);
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
