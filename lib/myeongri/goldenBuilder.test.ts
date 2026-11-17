import { describe, expect, it } from "vitest";
import type { GoldenCase } from "./goldenTypes";
import { buildGoldenCasesTsSnippet, parseGoldenCaseJson, serializeGoldenCase } from "./goldenBuilder";
import { isMyeongriDevRouteEnabled } from "./devAccess";
import { runGoldenCaseValidation } from "./validation";

const validCase: GoldenCase = {
  id: "GOLDEN-BUILDER-001",
  birth: { date: "1992-01-14", time: "13:00", calendar: "solar", gender: "female", timezone: "Asia/Seoul" },
  expected: {
    interpretive: {
      strength: { allowedLevels: ["weak", "balanced_weak"], consensus: 0.8, sourceIds: ["SOURCE-A"] },
      johu: { preferredElements: ["fire", "wood"], sourceIds: ["SOURCE-A"] },
      eokbu: { preferredElements: ["wood", "water"], sourceIds: ["SOURCE-A"] },
    },
  },
  verification: { status: "unverified", sources: [{ id: "SOURCE-A", type: "manual_review", name: "Builder fixture" }] },
};

describe("Golden Case Builder utilities", () => {
  it("유효한 GoldenCase를 JSON과 cases.ts로 내보낸다", () => {
    expect(parseGoldenCaseJson(serializeGoldenCase(validCase)).cases).toEqual([validCase]);
    expect(buildGoldenCasesTsSnippet([validCase])).toContain("export const GOLDEN_CASES: GoldenCase[]");
  });

  it("허용하지 않은 schema와 개인정보 필드를 가진 import를 차단한다", () => {
    const unsafe = { ...validCase, birth: { ...validCase.birth, email: "person@example.com", userId: "user-1" } };
    expect(parseGoldenCaseJson(JSON.stringify(unsafe)).cases).toHaveLength(0);
    expect(parseGoldenCaseJson("{not-json}").errors).toHaveLength(1);
  });

  it("expert 출처 없는 expert_verified export를 차단한다", () => {
    const invalid: GoldenCase = { ...validCase, verification: { status: "expert_verified", sources: [{ type: "book", name: "자료" }] } };
    expect(() => serializeGoldenCase(invalid)).toThrow();
  });

  it("복수 신강 단계와 조후·억부의 독립 순서를 보존한다", () => {
    const restored = parseGoldenCaseJson(serializeGoldenCase(validCase)).cases[0];
    expect(restored.expected.interpretive?.strength?.allowedLevels).toEqual(["weak", "balanced_weak"]);
    expect(restored.expected.interpretive?.johu?.preferredElements).toEqual(["fire", "wood"]);
    expect(restored.expected.interpretive?.eokbu?.preferredElements).toEqual(["wood", "water"]);
  });

  it("production 개발 경로를 비활성화한다", () => {
    expect(isMyeongriDevRouteEnabled("production")).toBe(false);
    expect(isMyeongriDevRouteEnabled("development")).toBe(true);
  });

  it("기존 validation runner에서 Builder Case를 처리한다", () => {
    const result = runGoldenCaseValidation(validCase);
    expect(result.caseId).toBe(validCase.id);
    expect(result.strength.accepted).toEqual(["weak", "balanced_weak"]);
  });
});
