import type { GoldenValidationSummary } from "./validation";

export interface CalibrationProposal {
  ruleId: string;
  currentWeight: number;
  suggestedDirection: "increase" | "decrease" | "review";
  reason: string;
  affectedCases: string[];
}

// 자동 튜닝을 하지 않고 검토 대상을 제안하는 데만 사용한다.
export function buildCalibrationReviewQueue(summary: GoldenValidationSummary): CalibrationProposal[] {
  return summary.ruleFailureFrequency.map((item) => ({
    ruleId: item.ruleId, currentWeight: Number.NaN, suggestedDirection: "review",
    reason: `불일치 ${item.involvedInMismatches}건에 함께 등장했습니다. 인과관계나 가중치 오류를 의미하지는 않습니다.`,
    affectedCases: item.caseIds,
  }));
}
