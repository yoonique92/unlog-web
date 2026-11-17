import { describe, expect, it } from "vitest";
import { analyzeUnlogSaju } from "./engine";
import type { GoldenCase } from "./goldenTypes";
import { validateGoldenCaseDefinition } from "./goldenTypes";
import { classifyStrengthMiss, runGoldenValidation } from "./validation";
import { serializeValidationSnapshot } from "./validationSnapshot";

const birth = { date: "1992-01-14", time: "13:00", calendar: "solar" as const, gender: "female" as const };
const engineResult = analyzeUnlogSaju({ birthDate: birth.date, birthTime: birth.time, calendar: birth.calendar, gender: birth.gender, targetYear: 2026 });

function caseWith(expected: GoldenCase["expected"], overrides: Partial<GoldenCase> = {}): GoldenCase {
  return {
    id: "SYNTHETIC-VALIDATION-001", birth, expected,
    verification: { status: "unverified", sources: [{ type: "manual_review", name: "validation runner fixture", notes: "엔진 정답이 아니라 비교 기능의 회귀 테스트" }] },
    ...overrides,
  };
}

describe("Golden validation system", () => {
  it("deterministic 기대값을 항목별로 비교한다", () => {
    const pillars = engineResult.normalizedSaju.pillars;
    const summary = runGoldenValidation([caseWith({ deterministic: {
      yearPillar: `${pillars.year.stem}${pillars.year.branch}`,
      monthPillar: `${pillars.month.stem}${pillars.month.branch}`,
      dayPillar: `${pillars.day.stem}${pillars.day.branch}`,
      hourPillar: pillars.hour ? `${pillars.hour.stem}${pillars.hour.branch}` : undefined,
      daeunDirection: engineResult.normalizedSaju.daeunMeta.direction,
    } })]);
    expect(summary.results[0].deterministic.passed).toBe(true);
    expect(summary.metrics.pillarsAccuracy.value).toBe(1);
  });

  it("허용된 신강 범위와 consensus를 보존한다", () => {
    const actual = engineResult.analysis.strength.level;
    const summary = runGoldenValidation([caseWith({ interpretive: { strength: { allowedLevels: [actual], consensus: 0.8 } } })]);
    expect(summary.results[0].strength.passed).toBe(true);
    expect(summary.results[0].strength.consensus).toBe(0.8);
  });

  it("복수 허용 범위는 Case당 하나의 band outcome만 만들고 표준 matrix에서는 제외한다", () => {
    const summary = runGoldenValidation([caseWith({ interpretive: { strength: { allowedLevels: ["balanced", "balanced_strong", "strong"] } } })]);
    expect(summary.strengthBandOutcomes).toHaveLength(1);
    expect(summary.strengthConfusionMatrixSampleCount).toBe(0);
    expect(Object.values(summary.strengthConfusionMatrix).flatMap(Object.values).reduce((sum, count) => sum + count, 0)).toBe(0);
  });

  it("actual이 band 내부이면 match/distance 0, 한 단계 밖이면 near/distance 1이다", () => {
    const actual = engineResult.analysis.strength.level;
    const inside = runGoldenValidation([caseWith({ interpretive: { strength: { allowedLevels: ["strong", actual] } } })]).strengthBandOutcomes[0];
    expect(inside).toMatchObject({ actual, matched: true, severity: "match", distance: 0 });

    const outside = runGoldenValidation([caseWith({ interpretive: { strength: { allowedLevels: ["balanced_strong", "strong"] } } })]).strengthBandOutcomes[0];
    expect(outside).toMatchObject({ actual: "very_strong", matched: false, severity: "near", distance: 1 });
  });

  it("singleton expected는 표준 confusion matrix에 한 번 기록한다", () => {
    const actual = engineResult.analysis.strength.level;
    const summary = runGoldenValidation([caseWith({ interpretive: { strength: { allowedLevels: [actual] } } })]);
    expect(summary.strengthConfusionMatrixSampleCount).toBe(1);
    expect(summary.strengthConfusionMatrix[actual][actual]).toBe(1);
    expect(Object.values(summary.strengthConfusionMatrix).flatMap(Object.values).reduce((sum, count) => sum + count, 0)).toBe(1);
  });

  it("Eokbu candidate와 avoid의 교집합만 observation으로 기록한다", () => {
    const overlapBirth = { date: "1994-03-15", time: "14:30", calendar: "solar" as const, gender: "male" as const, timezone: "Asia/Seoul" };
    const overlap = runGoldenValidation([caseWith({}, { birth: overlapBirth })]).results[0].observations;
    expect(overlap).toEqual([expect.objectContaining({ code: "EOKBU_CANDIDATE_AVOID_OVERLAP", element: "fire", candidateScore: 30, candidateRank: 3 })]);
    expect(runGoldenValidation([caseWith({})]).results[0].observations).toEqual([]);
  });

  it("인접 오차와 극단 오차를 구분한다", () => {
    expect(classifyStrengthMiss("balanced_weak", ["weak"])).toBe("near");
    expect(classifyStrengthMiss("strong", ["weak"])).toBe("severe");
    expect(classifyStrengthMiss("very_strong", ["very_weak"])).toBe("severe");
  });

  it("격국 top-3 후보 hit를 측정한다", () => {
    const accepted = engineResult.analysis.geukguk.candidates.at(-1)?.type;
    expect(accepted).toBeDefined();
    const summary = runGoldenValidation([caseWith({ interpretive: { geukguk: { acceptedCandidates: [accepted!] } } })]);
    expect(summary.results[0].geukguk.top3Hit).toBe(true);
  });

  it("조후와 억부 후보 hit 및 우선순위를 별도로 측정한다", () => {
    const johu = engineResult.analysis.johu.preferredElements[0]?.element;
    const eokbu = engineResult.analysis.yongsin.eokbu.candidates[0].element;
    const expected: GoldenCase["expected"] = { interpretive: { ...(johu ? { johu: { preferredElements: [johu] } } : {}), eokbu: { preferredElements: [eokbu] } } };
    const result = runGoldenValidation([caseWith(expected)]).results[0];
    if (johu) expect(result.johu.candidateHit).toBe(true);
    expect(result.eokbu.candidateHit).toBe(true);
    expect(result.eokbu.priorityHit).toBe(true);
  });

  it("expert 출처 없는 expert_verified 사례를 거부한다", () => {
    const invalid = caseWith({}, { verification: { status: "expert_verified", sources: [] } });
    expect(validateGoldenCaseDefinition(invalid).valid).toBe(false);
    const summary = runGoldenValidation([invalid]);
    expect(summary.results[0].warnings.join(" ")).toContain("expert 출처");
  });

  it("snapshot에 출생정보나 실제 사용자 식별정보를 포함하지 않는다", () => {
    const sensitive = caseWith({}, { id: "SAFE-FIXTURE-ID", verification: { status: "unverified", sources: [{ type: "manual_review", name: "user@example.com", reference: "kakao-id-123" }] } });
    const snapshot = serializeValidationSnapshot(runGoldenValidation([sensitive]), "2026-09-06T00:00:00.000Z");
    expect(snapshot).not.toContain(birth.date);
    expect(snapshot).not.toContain("user@example.com");
    expect(snapshot).not.toContain("kakao-id-123");
    expect(snapshot).toContain("SAFE-FIXTURE-ID");
  });

  it("검증 사례가 없으면 지표를 0%가 아닌 null로 유지한다", () => {
    const summary = runGoldenValidation();
    expect(summary.totalCases).toBe(0);
    expect(summary.metrics.strengthAgreement.value).toBeNull();
    expect(summary.metrics.geukgukTop3Recall.value).toBeNull();
  });
});
