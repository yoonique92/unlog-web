import type { FiveElement } from "../saju/types";

export interface DetailedJohuRule {
  dayStem: string;
  monthBranch: string;
  preferredElements: FiveElement[];
  source: string;
  verifiedAt: string;
}

// TODO(V1.5): 검증된 고전 원문과 전문가 검수를 거친 규칙만 추가한다.
// V1은 이 표를 비워 두고 계절의 한·난·조·습만 판정한다.
export const VERIFIED_DETAILED_JOHU_RULES: DetailedJohuRule[] = [];
