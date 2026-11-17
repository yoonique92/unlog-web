import { describe, expect, it } from "vitest";
import { analyzeUnlogSaju } from "./engine";
import { calculateSajuRaw } from "../saju/calculator";
import { normalizeSaju } from "../saju/normalize";
import { analyzeStrength, classifyHiddenStemStrengthRole, getStrengthLevel } from "./strength";
import { analyzeGeukguk } from "./geukguk";
import { isJianLuMonth } from "./geukgukRules";
import { analyzeJohu } from "./johu";
import { validateReadingResponse } from "../reading/validator";
import { compareLegacyAndUnlog } from "./comparison";
import { RULE_METADATA, VERIFIED_RULE_COUNT } from "./rules";
import { BALANCED, DEPLETION_HEAVY, SUPPORT_HEAVY, VERY_COLD, VERY_HOT } from "../../tests/fixtures/myeongriSynthetic";

const sampleInput = {
  birthDate: "1992-01-14", birthTime: "13:00", calendar: "solar" as const,
  gender: "female" as const, targetYear: 2026,
};

describe("운로그 명리 엔진 V1.5", () => {
  it("같은 입력에는 항상 같은 분석 결과를 만든다", () => {
    expect(analyzeUnlogSaju(sampleInput)).toEqual(analyzeUnlogSaju(sampleInput));
  });

  it("자정 전후 -30분 보정을 normalize 계층에서 바꾸지 않는다", () => {
    const input = { ...sampleInput, birthDate: "2000-01-02", birthTime: "00:10" };
    const calculated = calculateSajuRaw(input);
    const normalized = normalizeSaju(calculated, input);
    expect(calculated.unlogTime.adjusted).toMatchObject({ year: 2000, month: 1, day: 1, hour: 23, minute: 40 });
    expect(normalized.birth.solarDate).toBe(`${calculated.raw.solar.year}-${String(calculated.raw.solar.month).padStart(2, "0")}-${String(calculated.raw.solar.day).padStart(2, "0")}`);
  });

  it("지원이 강한 명식과 소모·제어가 강한 명식의 방향을 구분한다", () => {
    const supported = analyzeStrength(SUPPORT_HEAVY);
    const depleted = analyzeStrength(DEPLETION_HEAVY);
    const balanced = analyzeStrength(BALANCED);
    expect(supported.internalScore).toBeGreaterThan(balanced.internalScore);
    expect(balanced.internalScore).toBeGreaterThan(depleted.internalScore);
    expect(["strong", "very_strong", "balanced_strong"]).toContain(supported.level);
    expect(["weak", "very_weak", "balanced_weak"]).toContain(depleted.level);
  });

  it("신강 contribution 합계로 내부 점수를 재현할 수 있다", () => {
    const strength = analyzeStrength(BALANCED);
    const reconstructed = Math.max(0, Math.min(100, 50 + strength.contributions.reduce((sum, item) => sum + item.adjustedWeight, 0)));
    expect(strength.internalScore).toBe(Math.round(reconstructed));
    expect(strength.contributions.every((item) => RULE_METADATA[item.ruleId])).toBe(true);
  });

  it("지장간의 실제 통근과 비겁·인성 생조를 구분한다", () => {
    expect(classifyHiddenStemStrengthRole("己", "earth", { stem: "己", element: "earth" })).toBe("root");
    expect(classifyHiddenStemStrengthRole("己", "earth", { stem: "戊", element: "earth" })).toBe("peerSupport");
    expect(classifyHiddenStemStrengthRole("己", "earth", { stem: "丁", element: "fire" })).toBe("resourceSupport");
  });

  it("GOLDEN-001의 未·午 지장간 丁을 root contribution으로 가산하지 않는다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    const roots = result.analysis.strength.contributions.filter((item) => item.category === "root");
    expect(roots.some((item) => item.sourceKey === "year.hiddenStems.residual:丁")).toBe(false);
    expect(roots.some((item) => item.sourceKey === "hour.hiddenStems.main:丁")).toBe(false);
    expect(roots.some((item) => item.sourceKey === "year.hiddenStems.main:己")).toBe(true);
    expect(roots.some((item) => item.sourceKey === "hour.hiddenStems.middle:己")).toBe(true);
  });

  it("월지는 month command와 hidden root로만 평가하고 일반 branch contribution을 중복 생성하지 않는다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    const contributions = result.analysis.strength.contributions;

    expect(contributions.some((item) => item.category === "month_command" && item.source === "month.branch" && item.adjustedWeight === 18)).toBe(true);
    expect(contributions.some((item) => item.category !== "month_command" && item.source === "month.branch")).toBe(false);
    expect(contributions.some((item) => item.sourceKey === "month.hiddenStems.main:己" && item.adjustedWeight === 8)).toBe(true);
    expect(contributions.filter((item) => item.source.endsWith(".branch") && item.category !== "month_command").map((item) => [item.source, item.adjustedWeight])).toEqual([
      ["year.branch", 3], ["day.branch", 4], ["hour.branch", 3],
    ]);
  });

  it("월지 branch 중복 제거 후 GOLDEN-001의 Johu·Geukguk과 Eokbu 후보는 유지된다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    expect(result.analysis.johu).toMatchObject({
      climate: { cold: 82, hot: 13, dry: 32, wet: 73 },
      needs: { warming: 69, cooling: 0, drying: 41, moistening: 0 },
      preferredElements: [{ element: "fire", priority: 69 }], confidence: 0.62,
    });
    expect(result.analysis.geukguk.candidates.map(({ type, score, confidence, status }) => ({ type, score, confidence, status }))).toEqual([
      { type: "siksin", score: 57, confidence: 0.61, status: "possible" },
      { type: "pyeonjae", score: 27, confidence: 0.47, status: "uncertain" },
    ]);
    expect(result.analysis.yongsin.eokbu.candidates.map(({ element, role, score, confidence }) => ({ element, role, score, confidence }))).toEqual([
      { element: "wood", role: "control", score: 65, confidence: 0.64 },
      { element: "water", role: "drain", score: 65, confidence: 0.64 },
      { element: "metal", role: "drain", score: 38, confidence: 0.52 },
    ]);
  });

  it("건록지는 일간별 월지 prerequisite로 판정한다", () => {
    expect(isJianLuMonth("己", "午")).toBe(true);
    expect(isJianLuMonth("己", "丑")).toBe(false);
    expect(isJianLuMonth("甲", "寅")).toBe(true);
    expect(isJianLuMonth("辛", "酉")).toBe(true);
  });

  it("己日干은 午월에만 건록 후보 생성을 허용한다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    expect(result.analysis.geukguk.candidates.some((item) => item.type === "geonrok")).toBe(false);

    const positive = structuredClone(result.normalizedSaju);
    positive.pillars.month.branch = "午";
    positive.pillars.month.branchElement = "fire";
    positive.seasonal.monthBranch = "午";
    expect(analyzeGeukguk(positive, result.analysis.strength).candidates.some((item) => item.type === "geonrok")).toBe(true);
  });

  it("GOLDEN-001의 원국·지장간·십성 계산은 유지한다", () => {
    const normalized = analyzeUnlogSaju(sampleInput).normalizedSaju;
    expect(Object.values(normalized.pillars).map((pillar) => `${pillar.stem}${pillar.branch}`)).toEqual(["辛未", "辛丑", "己丑", "庚午"]);
    expect(normalized.hiddenStems.map((item) => `${item.pillar}:${item.role}:${item.stem}`)).toEqual([
      "year:main:己", "year:middle:乙", "year:residual:丁",
      "month:main:己", "month:middle:辛", "month:residual:癸",
      "day:main:己", "day:middle:辛", "day:residual:癸",
      "hour:main:丁", "hour:middle:己",
    ]);
    expect(normalized.tenGods.map((item) => `${item.pillar}:${item.target}:${item.name}`)).toEqual([
      "year:stem:식신", "year:branch:비견", "month:stem:식신", "month:branch:비견",
      "day:stem:(일간)", "day:branch:비견", "hour:stem:상관", "hour:branch:편인",
    ]);
  });

  it("경계 주변 한 점 변화가 여러 등급을 건너뛰지 않는다", () => {
    const order = ["very_weak", "weak", "balanced_weak", "balanced", "balanced_strong", "strong", "very_strong"];
    for (const boundary of [20, 34, 44, 56, 66, 80]) {
      expect(Math.abs(order.indexOf(getStrengthLevel(boundary)) - order.indexOf(getStrengthLevel(boundary + 1)))).toBeLessThanOrEqual(1);
    }
    expect(analyzeStrength(BALANCED).distanceFromBoundary).toBeGreaterThanOrEqual(0);
  });

  it("차가운 fixture는 warming, 뜨거운 fixture는 cooling 필요가 커진다", () => {
    const cold = analyzeJohu(VERY_COLD);
    const hot = analyzeJohu(VERY_HOT);
    expect(cold.needs.warming).toBeGreaterThan(cold.needs.cooling);
    expect(hot.needs.cooling).toBeGreaterThan(hot.needs.warming);
  });

  it("격국과 용신을 확정하지 않고 복수 후보와 위험을 유지한다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    expect(result.analysis.geukguk.status).not.toBe("confirmed");
    expect(result.analysis.geukguk.candidates.length).toBeGreaterThan(0);
    expect(result.analysis.yongsin.status).toBe("candidate_only");
    expect(result.analysis.yongsin.eokbu.candidates.every((item) => Array.isArray(item.risks))).toBe(true);
    expect("final" in result.analysis.yongsin).toBe(false);
  });

  it("모든 현재 규칙은 provisional이며 verified 규칙을 가장하지 않는다", () => {
    expect(Object.values(RULE_METADATA).every((rule) => rule.school === "unlog" && rule.status === "provisional")).toBe(true);
    expect(VERIFIED_RULE_COUNT).toBe(0);
  });

  it("legacy와 unlog 결과를 정답 판정 없이 동시에 비교한다", () => {
    const comparison = compareLegacyAndUnlog(sampleInput);
    expect(comparison.legacy.dayStrength).toBeDefined();
    expect(comparison.unlog.strength.contributions.length).toBeGreaterThan(0);
    expect(comparison.differences.length).toBeGreaterThan(0);
  });

  it("최종 Finding마다 근거와 rule ID가 있다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    for (const finding of [...result.analysis.natalFindings, ...result.analysis.timelineFindings]) {
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.evidence.every((item) => item.ruleId.length > 0)).toBe(true);
    }
  });

  it("ReadingContext에 없는 용신·격국·신살과 finding을 차단한다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    const validation = validateReadingResponse({ sections: [{ findingId: "made-up", title: "당신은 정관격입니다", body: "용신은 火이며 도화살이 반드시 작동합니다." }] }, result.readingContext);
    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["UNKNOWN_FINDING", "FINAL_GEUKGUK_CLAIM", "FINAL_YONGSIN_CLAIM", "UNPROVIDED_SINSAL", "OVERCERTAIN_LANGUAGE"]));
  });

  it("후보형 표현은 허용하고 사건·의학적 확정 표현은 차단한다", () => {
    const result = analyzeUnlogSaju(sampleInput);
    const findingId = result.analysis.natalFindings[0].id;
    expect(validateReadingResponse({ sections: [{ findingId, title: "격국 후보", body: "한 격국 성향이 후보로 나타납니다. 화 기운도 억부 후보로 살펴볼 수 있습니다." }] }, result.readingContext).valid).toBe(true);
    const invalid = validateReadingResponse({ sections: [{ findingId, title: "예언", body: "2027년에는 결혼합니다. 질병이 반드시 생깁니다." }] }, result.readingContext);
    expect(invalid.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["DETERMINISTIC_EVENT_PREDICTION", "MEDICAL_PREDICTION"]));
  });
});
