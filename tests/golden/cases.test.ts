import { describe, expect, it } from "vitest";
import { runGoldenCaseValidation } from "../../lib/myeongri/validation";
import { GOLDEN_CASES } from "./cases";

describe("myeongri golden cases", () => {
  it("GOLDEN-001은 점수가 아닌 신강 방향만 회귀 검증한다", () => {
    const goldenCase = GOLDEN_CASES.find((item) => item.id === "GOLDEN-001");

    expect(goldenCase).toBeDefined();

    const strengthExpectation = goldenCase!.expected.interpretive?.strength;
    expect(strengthExpectation?.allowedLevels).toEqual([
      "balanced_strong",
      "strong",
      "very_strong",
    ]);
    expect(strengthExpectation).not.toHaveProperty("score");

    const validation = runGoldenCaseValidation(goldenCase!);
    expect(validation.deterministic).toMatchObject({
      evaluated: true,
      passed: true,
      pillarChecks: 4,
      pillarPassedChecks: 4,
    });
    expect(validation.strength).toMatchObject({
      evaluated: true,
      passed: true,
      severity: "match",
    });
    expect(strengthExpectation?.allowedLevels).toContain(
      validation.strength.actual,
    );
  });

  it("GOLDEN-002는 점수가 아닌 신약 방향만 회귀 검증한다", () => {
    const goldenCase = GOLDEN_CASES.find((item) => item.id === "GOLDEN-002");

    expect(goldenCase).toBeDefined();

    const strengthExpectation = goldenCase!.expected.interpretive?.strength;
    expect(strengthExpectation?.allowedLevels).toEqual([
      "very_weak",
      "weak",
      "balanced_weak",
    ]);
    expect(strengthExpectation).not.toHaveProperty("score");

    const validation = runGoldenCaseValidation(goldenCase!);
    expect(validation.deterministic).toMatchObject({
      evaluated: true,
      passed: true,
      pillarChecks: 4,
      pillarPassedChecks: 4,
    });
    expect(validation.strength).toMatchObject({
      evaluated: true,
      passed: true,
      severity: "match",
    });
    expect(strengthExpectation?.allowedLevels).toContain(
      validation.strength.actual,
    );
  });
});
