import { describe, expect, it } from "vitest";

import {
  FORTUNE_COPY_CONTENT_KINDS,
  UNLOG_FORTUNE_VOICE_POLICY,
} from "./voicePolicy";
import {
  findDuplicateFortuneSentences,
  validateFortuneVoice,
} from "./voiceValidation";

describe("fortune copy voice policy", () => {
  it("defines a tone profile for every supported content kind", () => {
    expect(Object.keys(UNLOG_FORTUNE_VOICE_POLICY.toneByContent).sort()).toEqual(
      [...FORTUNE_COPY_CONTENT_KINDS].sort()
    );
  });

  it("places the shared policy above every individual copy builder", () => {
    expect(UNLOG_FORTUNE_VOICE_POLICY.authority.statement).toContain(
      "최상위 기준"
    );
    expect(UNLOG_FORTUNE_VOICE_POLICY.authority.appliesTo).toEqual(
      expect.arrayContaining(["yearly copy", "monthly copy", "today fortune"])
    );
  });

  it("keeps monthly headlines distinct from body and yearly tone", () => {
    expect(
      UNLOG_FORTUNE_VOICE_POLICY.toneByContent.monthly_headline.distance
    ).toBe("hook");
    expect(UNLOG_FORTUNE_VOICE_POLICY.toneByContent.monthly_body.distance).toBe(
      "close"
    );
    expect(UNLOG_FORTUNE_VOICE_POLICY.toneByContent.yearly_section.distance).toBe(
      "calm"
    );
  });
});

describe("fortune voice validation guardrails", () => {
  it("detects three consecutive identical endings", () => {
    const issues = validateFortuneVoice(
      "일이 많아질 수 있어요. 약속도 늘어날 수 있어요. 쉴 시간이 줄어들 수 있어요.",
      { contentKind: "monthly_body" }
    );

    expect(issues.map((issue) => issue.code)).toContain("repeated_ending");
  });

  it("detects paragraphs made only of formal endings when requested", () => {
    const issues = validateFortuneVoice(
      "일정이 늘어납니다. 지출도 생깁니다. 순서를 정해야 합니다.",
      { contentKind: "yearly_section", checkParagraphTone: true }
    );

    expect(issues.map((issue) => issue.code)).toContain(
      "formal_only_paragraph"
    );
  });

  it("detects repeated abstract language only under strict opt-in", () => {
    const text = "흐름을 보고 흐름을 따라가며 흐름을 조절해요.";

    expect(
      validateFortuneVoice(text, {
        contentKind: "yearly_section",
        checkAbstractLanguage: true,
      }).map((issue) => issue.code)
    ).toContain("abstract_language_overuse");
    expect(
      validateFortuneVoice(text, { contentKind: "yearly_section" })
    ).toEqual([]);
  });

  it("detects strong directives and deterministic event claims", () => {
    const issues = validateFortuneVoice(
      "반드시 준비하세요. 올해 이직하게 됩니다.",
      { contentKind: "tip" }
    );

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["strong_directive", "deterministic_event"])
    );
  });

  it("flags conversational connective endings in body but not headlines", () => {
    expect(validateFortuneVoice("해야 할 일도 함께 늘어나고요.", {
      contentKind: "monthly_body",
    }).map((issue) => issue.code)).toContain("connective_goyo");
    expect(validateFortuneVoice("할 일은 늘어나고요?", {
      contentKind: "monthly_headline",
    }).map((issue) => issue.code)).not.toContain("connective_goyo");
  });

  it("checks monthly headline labels and directive tone", () => {
    const issues = validateFortuneVoice("이번 달 일정을 정리해보세요", {
      contentKind: "monthly_headline",
    });

    expect(issues.filter((issue) => issue.code === "monthly_headline_tone")).toHaveLength(2);
  });

  it("allows a concrete, non-deterministic interpretation", () => {
    const issues = validateFortuneVoice(
      "맡은 일이 늘어나면 기존 일정과 새 요청의 순서를 다시 살펴볼 필요가 있어요. 바로 결정하기보다 실제 조건부터 비교해두면 좋습니다.",
      { contentKind: "yearly_section", checkAbstractLanguage: true }
    );

    expect(issues).toEqual([]);
  });

  it("finds exact sentence template reuse across copy blocks", () => {
    expect(
      findDuplicateFortuneSentences([
        "일정을 먼저 살펴보면 좋아요. 새 일을 검토할 수 있습니다.",
        "돈을 나누어 두면 좋아요. 일정을 먼저 살펴보면 좋아요.",
      ])
    ).toEqual(["일정을 먼저 살펴보면 좋아요."]);
  });
});
