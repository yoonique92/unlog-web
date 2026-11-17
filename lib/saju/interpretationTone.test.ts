import { describe, expect, it } from "vitest";

import {
  buildUnlogInterpretationInstructions,
  UNLOG_OVERCERTAIN_EXPRESSIONS,
  UNLOG_YEARLY_SECTION_ORDER,
} from "./interpretationTone";

describe("운로그 공통 해석 Tone & Voice", () => {
  it("신년운세 영역의 공통 순서를 제공한다", () => {
    expect(UNLOG_YEARLY_SECTION_ORDER).toEqual([
      "overall",
      "relationship",
      "money",
      "health",
      "career",
      "study",
    ]);
  });

  it("생활 장면부터 설명하고 과도한 확정 표현을 금지한다", () => {
    const instructions = buildUnlogInterpretationInstructions({
      area: "신년운세",
      period: "2027년",
    });

    expect(instructions).toContain("사용자가 느낄 수 있는 모습");
    expect(instructions).toContain("실제 생활에서 나타날 수 있는 장면");
    expect(instructions).toContain("미래 사건");
    expect(instructions).toContain("마지막 키워드 3개");
    expect(UNLOG_OVERCERTAIN_EXPRESSIONS).toContain("무조건");
  });

  it("건강운에는 의료 안전 규칙을 포함한다", () => {
    const instructions = buildUnlogInterpretationInstructions({
      area: "건강운",
    });

    expect(instructions).toContain("질병이나 특정 질환을 진단하거나 예측하지 않는다");
    expect(instructions).toContain("의료적인 확인");
  });
});
