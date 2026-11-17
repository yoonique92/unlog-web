import type { StrengthLevel } from "../../lib/myeongri/types";

export type ValidationMatchStatus = "exact_match" | "near_miss" | "miss";
export type StrengthBandDirection = "within" | "weaker" | "stronger";

const STRENGTH_LEVEL_ORDER: StrengthLevel[] = [
  "very_weak",
  "weak",
  "balanced_weak",
  "balanced",
  "balanced_strong",
  "strong",
  "very_strong",
];

const STRENGTH_LEVEL_MAX_SCORE: Record<StrengthLevel, number> = {
  very_weak: 20,
  weak: 34,
  balanced_weak: 44,
  balanced: 56,
  balanced_strong: 66,
  strong: 80,
  very_strong: 100,
};

export interface CandidateDValidationEvaluation {
  exactMatch: boolean;
  adjacentBand: boolean;
  bandDistance: number;
  bandDirection: StrengthBandDirection;
  boundaryPointDistance: number;
  status: ValidationMatchStatus;
}

/**
 * Validation의 정답 기준은 외부 판정 구간입니다.
 * A/D 점수는 현재 동결 공식의 회귀 관측값이며 명리 정답 점수가 아닙니다.
 */
export const STRENGTH_VALIDATION_POLICY = Object.freeze({
  referenceBasis: "external_allowed_levels" as const,
  engineScoreMeaning: "observed_engine_output_not_ground_truth" as const,
  candidateDParametersFrozen: true,
  currentFindings: [
    "no_water_day_master_overvaluation_pattern_observed",
    "no_repeated_branch_overaccumulation_pattern_observed",
    "validation_2_near_miss_focuses_on_double_shen_resource_and_duplicate_roots",
  ] as const,
  nextValidationPriorities: [
    "externally_clear_strong_or_balanced_strong",
    "multiple_roots_or_resources_with_external_balanced",
  ] as const,
});

export function evaluateCandidateDValidation(
  score: number,
  level: StrengthLevel,
  externalAllowedLevels: StrengthLevel[],
): CandidateDValidationEvaluation {
  const candidateIndex = STRENGTH_LEVEL_ORDER.indexOf(level);
  const allowedIndices = externalAllowedLevels.map((allowedLevel) =>
    STRENGTH_LEVEL_ORDER.indexOf(allowedLevel),
  );
  const minimumAllowedIndex = Math.min(...allowedIndices);
  const maximumAllowedIndex = Math.max(...allowedIndices);
  const exactMatch = externalAllowedLevels.includes(level);
  const bandDirection: StrengthBandDirection = exactMatch
    ? "within"
    : candidateIndex < minimumAllowedIndex
      ? "weaker"
      : "stronger";
  const bandDistance = exactMatch
    ? 0
    : candidateIndex < minimumAllowedIndex
      ? minimumAllowedIndex - candidateIndex
      : candidateIndex - maximumAllowedIndex;
  const strongestAllowedLevel = STRENGTH_LEVEL_ORDER[maximumAllowedIndex];
  const lowerBoundary =
    minimumAllowedIndex === 0
      ? 0
      : STRENGTH_LEVEL_MAX_SCORE[
          STRENGTH_LEVEL_ORDER[minimumAllowedIndex - 1]
        ] + 1;
  const upperBoundary = STRENGTH_LEVEL_MAX_SCORE[strongestAllowedLevel];
  const boundaryPointDistance = exactMatch
    ? 0
    : bandDirection === "weaker"
      ? lowerBoundary - score
      : score - upperBoundary;
  const adjacentBand = !exactMatch && bandDistance === 1;

  return {
    exactMatch,
    adjacentBand,
    bandDistance,
    bandDirection,
    boundaryPointDistance,
    status: exactMatch ? "exact_match" : adjacentBand ? "near_miss" : "miss",
  };
}

export interface StrengthValidationCase {
  id: string;
  dataset: "validation";
  birth: {
    date: string;
    time: string;
    calendar: "solar" | "lunar";
    gender: "male" | "female";
    timezone: string;
  };
  expectedAdjustedDateTime: string;
  expectedPillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  expectedDayMaster: string;
  expectedTenGods: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  expectedHiddenStems?: Array<{
    pillar: "year" | "month" | "day" | "hour";
    branch: string;
    stem: string;
    role: "main" | "middle" | "residual";
    tenGod: string;
  }>;
  externalDirection: string;
  externalAllowedLevels: StrengthLevel[];
  formulaA: { score: number; level: StrengthLevel };
  candidateD: {
    score: number;
    level: StrengthLevel;
    evaluation: CandidateDValidationEvaluation;
  };
  notes: string;
}

export interface StrengthComparisonRow {
  case: string;
  dataset: "validation";
  externalDirection: string;
  externalBand: string;
  formulaA: string;
  candidateD: string;
  exactMatch: boolean;
  adjacentBand: boolean;
  bandDistance: number;
  bandDirection: StrengthBandDirection;
  boundaryPointDistance: number;
  status: ValidationMatchStatus;
}

export interface PreliminaryStrengthValidationCandidate {
  id: string;
  dataset: "preliminary_validation_candidate";
  birth: StrengthValidationCase["birth"];
  expectedPillars: StrengthValidationCase["expectedPillars"];
  expectedDayMaster: string;
  externalDirection: string;
  externalAllowedLevels: StrengthLevel[];
  notes: string;
}

export interface ExtremeStrengthReferenceCase {
  id: string;
  dataset: "external_reference_only";
  birth: StrengthValidationCase["birth"];
  expectedPillars: StrengthValidationCase["expectedPillars"];
  expectedDayMaster: string;
  externalDirection: string;
  externalScoreReference: string;
  excludedFromOfficialValidation: true;
  notes: string;
}

/**
 * 후보 D 고정 이후 처음 보는 사례만 추가하는 누적 validation dataset입니다.
 * Calibration 사례와 섞거나 후보 D 튜닝에 사용하지 않습니다.
 */
export const STRENGTH_VALIDATION_CASES: StrengthValidationCase[] = [
  {
    id: "STRENGTH-VALIDATION-001",
    dataset: "validation",
    birth: {
      date: "1994-04-14",
      time: "11:30",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1994-04-14 11:00",
    expectedPillars: {
      year: "甲戌",
      month: "戊辰",
      day: "庚午",
      hour: "壬午",
    },
    expectedDayMaster: "庚",
    expectedTenGods: {
      year: { stem: "편재", branch: "편인" },
      month: { stem: "편인", branch: "편인" },
      day: { stem: "(일간)", branch: "정관" },
      hour: { stem: "식신", branch: "정관" },
    },
    externalDirection: "중화 중심, 일부 중화신강",
    externalAllowedLevels: ["balanced", "balanced_strong"],
    formulaA: { score: 58, level: "balanced_strong" },
    candidateD: {
      score: 53,
      level: "balanced",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "후보 D가 외부 참고 방향에 부합한 validation 성공 사례. 후보 D 파라미터 보정에는 사용하지 않는다.",
  },
  {
    id: "STRENGTH-VALIDATION-002",
    dataset: "validation",
    birth: {
      date: "1992-06-15",
      time: "16:15",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1992-06-15 15:45",
    expectedPillars: {
      year: "壬申",
      month: "丙午",
      day: "壬戌",
      hour: "戊申",
    },
    expectedDayMaster: "壬",
    expectedTenGods: {
      year: { stem: "비견", branch: "편인" },
      month: { stem: "편재", branch: "정재" },
      day: { stem: "(일간)", branch: "편관" },
      hour: { stem: "편관", branch: "편인" },
    },
    externalDirection: "신약~중화신약",
    externalAllowedLevels: ["weak", "balanced_weak"],
    formulaA: { score: 48, level: "balanced" },
    candidateD: {
      score: 46,
      level: "balanced",
      evaluation: {
        exactMatch: false,
        adjacentBand: true,
        bandDistance: 1,
        bandDirection: "stronger",
        boundaryPointDistance: 2,
        status: "near_miss",
      },
    },
    notes:
      "처음 보는 壬水 validation 사례. 후보 D는 외부 기대 상한보다 2점 높고 한 단계 강하게 평가된 near-miss이며, 결과를 이용해 파라미터를 재조정하지 않는다.",
  },
  {
    id: "STRENGTH-VALIDATION-003",
    dataset: "validation",
    birth: {
      date: "1993-03-03",
      time: "08:08",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1993-03-03 07:38",
    expectedPillars: {
      year: "癸酉",
      month: "甲寅",
      day: "癸未",
      hour: "丙辰",
    },
    expectedDayMaster: "癸",
    expectedTenGods: {
      year: { stem: "비견", branch: "편인" },
      month: { stem: "상관", branch: "상관" },
      day: { stem: "(일간)", branch: "편관" },
      hour: { stem: "정재", branch: "정관" },
    },
    externalDirection: "명확한 신약",
    externalAllowedLevels: ["weak"],
    formulaA: { score: 35, level: "balanced_weak" },
    candidateD: {
      score: 31,
      level: "weak",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "癸水 사례는 D 31 / weak로 외부 신약 방향과 정확히 일치한다. 따라서 후보 D가 水일간 전체를 일괄적으로 강하게 평가한다는 증거는 현재 없으며, Validation #2의 near-miss는 壬水 자체보다 두 申의 인성 생조와 중복 통근 구조를 우선 검토 대상으로 유지한다. 31점은 현재 동결 공식의 관측 결과일 뿐 명리 정답 점수가 아니다.",
  },
  {
    id: "STRENGTH-VALIDATION-004",
    dataset: "validation",
    birth: {
      date: "2007-11-29",
      time: "08:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "2007-11-29 07:30",
    expectedPillars: {
      year: "丁亥",
      month: "辛亥",
      day: "丁卯",
      hour: "甲辰",
    },
    expectedDayMaster: "丁",
    expectedTenGods: {
      year: { stem: "비견", branch: "정관" },
      month: { stem: "편재", branch: "정관" },
      day: { stem: "(일간)", branch: "편인" },
      hour: { stem: "정인", branch: "상관" },
    },
    expectedHiddenStems: [
      { pillar: "year", branch: "亥", stem: "壬", role: "main", tenGod: "정관" },
      { pillar: "year", branch: "亥", stem: "甲", role: "middle", tenGod: "정인" },
      { pillar: "month", branch: "亥", stem: "壬", role: "main", tenGod: "정관" },
      { pillar: "month", branch: "亥", stem: "甲", role: "middle", tenGod: "정인" },
      { pillar: "day", branch: "卯", stem: "乙", role: "main", tenGod: "편인" },
      { pillar: "hour", branch: "辰", stem: "戊", role: "main", tenGod: "상관" },
      { pillar: "hour", branch: "辰", stem: "癸", role: "middle", tenGod: "편관" },
      { pillar: "hour", branch: "辰", stem: "乙", role: "residual", tenGod: "편인" },
    ],
    externalDirection: "중화신약~중화 경계",
    externalAllowedLevels: ["balanced_weak", "balanced"],
    formulaA: { score: 36, level: "balanced_weak" },
    candidateD: {
      score: 39,
      level: "balanced_weak",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "후보 D가 외부 기대 구간 balanced_weak~balanced 안에 들어온 exact-match validation 사례다. 39점은 동결된 후보 D의 회귀 재현용 관측값이며 명리 정답 점수로 확정하지 않는다. 반복된 두 亥는 각각 지장간 관성·인성으로 반영되지만 丁火 직접 통근은 없다.",
  },
  {
    id: "STRENGTH-VALIDATION-005",
    dataset: "validation",
    birth: {
      date: "2002-02-05",
      time: "00:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "2002-02-04 23:30",
    expectedPillars: {
      year: "壬午",
      month: "壬寅",
      day: "甲辰",
      hour: "甲子",
    },
    expectedDayMaster: "甲",
    expectedTenGods: {
      year: { stem: "편인", branch: "상관" },
      month: { stem: "편인", branch: "비견" },
      day: { stem: "(일간)", branch: "편재" },
      hour: { stem: "비견", branch: "정인" },
    },
    expectedHiddenStems: [
      { pillar: "year", branch: "午", stem: "丁", role: "main", tenGod: "상관" },
      { pillar: "year", branch: "午", stem: "己", role: "middle", tenGod: "정재" },
      { pillar: "month", branch: "寅", stem: "甲", role: "main", tenGod: "비견" },
      { pillar: "month", branch: "寅", stem: "丙", role: "middle", tenGod: "식신" },
      { pillar: "month", branch: "寅", stem: "戊", role: "residual", tenGod: "편재" },
      { pillar: "day", branch: "辰", stem: "戊", role: "main", tenGod: "편재" },
      { pillar: "day", branch: "辰", stem: "癸", role: "middle", tenGod: "정인" },
      { pillar: "day", branch: "辰", stem: "乙", role: "residual", tenGod: "겁재" },
      { pillar: "hour", branch: "子", stem: "癸", role: "main", tenGod: "정인" },
    ],
    externalDirection: "중화신강~신강, 중심 기대 신강",
    externalAllowedLevels: ["balanced_strong", "strong"],
    formulaA: { score: 86, level: "very_strong" },
    candidateD: {
      score: 73,
      level: "strong",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "시간 경계 정책 적용 후 재개한 Validation #5다. 후보 D는 외부 기대 구간 balanced_strong~strong 안의 strong으로 방향이 일치한다. 73점은 동결 공식의 관측값이며 명리 정답 점수로 확정하지 않는다. 寅월 득령, 壬 인성 두 개, 子水 인성, 甲 비견이 생조하고 午火 식상과 辰土 재성이 설기·소모한다.",
  },
  {
    id: "STRENGTH-VALIDATION-006",
    dataset: "validation",
    birth: {
      date: "1983-09-25",
      time: "11:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1983-09-25 10:30",
    expectedPillars: {
      year: "癸亥",
      month: "辛酉",
      day: "丙辰",
      hour: "癸巳",
    },
    expectedDayMaster: "丙",
    expectedTenGods: {
      year: { stem: "정관", branch: "편관" },
      month: { stem: "정재", branch: "정재" },
      day: { stem: "(일간)", branch: "식신" },
      hour: { stem: "정관", branch: "비견" },
    },
    externalDirection: "태약~신약, 중심 기대 매우 약한 쪽",
    externalAllowedLevels: ["very_weak", "weak"],
    formulaA: { score: 32, level: "weak" },
    candidateD: {
      score: 29,
      level: "weak",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "외부 기대 허용 구간 very_weak~weak 안의 exact match다. 중심 기대는 매우 약한 쪽이지만 29점은 후보 D의 관측값일 뿐 명리 정답 점수가 아니다.",
  },
  {
    id: "STRENGTH-VALIDATION-007",
    dataset: "validation",
    birth: {
      date: "1994-06-09",
      time: "12:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1994-06-09 11:30",
    expectedPillars: {
      year: "甲戌",
      month: "庚午",
      day: "丙寅",
      hour: "甲午",
    },
    expectedDayMaster: "丙",
    expectedTenGods: {
      year: { stem: "편인", branch: "식신" },
      month: { stem: "편재", branch: "겁재" },
      day: { stem: "(일간)", branch: "편인" },
      hour: { stem: "편인", branch: "겁재" },
    },
    externalDirection: "신강",
    externalAllowedLevels: ["strong"],
    formulaA: { score: 79, level: "strong" },
    candidateD: {
      score: 74,
      level: "strong",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "午월 득령과 甲·寅 인성, 午 비겁이 강한 구조에서 diminishing return 이후에도 후보 D가 strong을 유지한 exact match 사례다.",
  },
  {
    id: "STRENGTH-VALIDATION-008",
    dataset: "validation",
    birth: {
      date: "1994-02-22",
      time: "19:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1994-02-22 18:30",
    expectedPillars: {
      year: "甲戌",
      month: "丙寅",
      day: "己卯",
      hour: "癸酉",
    },
    expectedDayMaster: "己",
    expectedTenGods: {
      year: { stem: "정관", branch: "겁재" },
      month: { stem: "정인", branch: "정관" },
      day: { stem: "(일간)", branch: "편관" },
      hour: { stem: "편재", branch: "식신" },
    },
    externalDirection: "신약",
    externalAllowedLevels: ["weak"],
    formulaA: { score: 30, level: "weak" },
    candidateD: {
      score: 33,
      level: "weak",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "寅·卯 목 관성의 극제와 癸 재성·酉 식상 소모가 丙 인성과 戌 비겁 도움보다 우세한 weak exact match 사례다.",
  },
  {
    id: "STRENGTH-VALIDATION-009",
    dataset: "validation",
    birth: {
      date: "2000-04-11",
      time: "11:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "2000-04-11 10:30",
    expectedPillars: {
      year: "庚辰",
      month: "庚辰",
      day: "己亥",
      hour: "己巳",
    },
    expectedDayMaster: "己",
    expectedTenGods: {
      year: { stem: "상관", branch: "겁재" },
      month: { stem: "상관", branch: "겁재" },
      day: { stem: "(일간)", branch: "정재" },
      hour: { stem: "비견", branch: "정인" },
    },
    externalDirection: "중화신강~신강 경계",
    externalAllowedLevels: ["balanced_strong", "strong"],
    formulaA: { score: 64, level: "balanced_strong" },
    candidateD: {
      score: 57,
      level: "balanced_strong",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "외부 범례와 문구가 경계에서 갈리는 사례다. 후보 D는 허용 구간의 balanced_strong으로 exact match이며 57점은 관측값이다.",
  },
  {
    id: "STRENGTH-VALIDATION-010",
    dataset: "validation",
    birth: {
      date: "1979-07-20",
      time: "13:55",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1979-07-20 13:25",
    expectedPillars: {
      year: "己未",
      month: "辛未",
      day: "戊子",
      hour: "己未",
    },
    expectedDayMaster: "戊",
    expectedTenGods: {
      year: { stem: "겁재", branch: "겁재" },
      month: { stem: "상관", branch: "겁재" },
      day: { stem: "(일간)", branch: "정재" },
      hour: { stem: "겁재", branch: "겁재" },
    },
    externalDirection: "신강",
    externalAllowedLevels: ["strong"],
    formulaA: { score: 72, level: "strong" },
    candidateD: {
      score: 68,
      level: "strong",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "세 未와 두 己의 반복 비겁 구조에서도 후보 D가 strong을 유지한 exact match 사례다. 반복 지지 자체가 과도 누적을 만든 증거는 없다.",
  },
  {
    id: "STRENGTH-VALIDATION-011",
    dataset: "validation",
    birth: {
      date: "1989-05-09",
      time: "11:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1989-05-09 10:30",
    expectedPillars: {
      year: "己巳",
      month: "己巳",
      day: "己巳",
      hour: "己巳",
    },
    expectedDayMaster: "己",
    expectedTenGods: {
      year: { stem: "비견", branch: "정인" },
      month: { stem: "비견", branch: "정인" },
      day: { stem: "(일간)", branch: "정인" },
      hour: { stem: "비견", branch: "정인" },
    },
    expectedHiddenStems: [
      { pillar: "year", branch: "巳", stem: "丙", role: "main", tenGod: "정인" },
      { pillar: "year", branch: "巳", stem: "庚", role: "middle", tenGod: "상관" },
      { pillar: "year", branch: "巳", stem: "戊", role: "residual", tenGod: "겁재" },
      { pillar: "month", branch: "巳", stem: "丙", role: "main", tenGod: "정인" },
      { pillar: "month", branch: "巳", stem: "庚", role: "middle", tenGod: "상관" },
      { pillar: "month", branch: "巳", stem: "戊", role: "residual", tenGod: "겁재" },
      { pillar: "day", branch: "巳", stem: "丙", role: "main", tenGod: "정인" },
      { pillar: "day", branch: "巳", stem: "庚", role: "middle", tenGod: "상관" },
      { pillar: "day", branch: "巳", stem: "戊", role: "residual", tenGod: "겁재" },
      { pillar: "hour", branch: "巳", stem: "丙", role: "main", tenGod: "정인" },
      { pillar: "hour", branch: "巳", stem: "庚", role: "middle", tenGod: "상관" },
      { pillar: "hour", branch: "巳", stem: "戊", role: "residual", tenGod: "겁재" },
    ],
    externalDirection: "극강·극왕의 매우 강한 방향",
    externalAllowedLevels: ["very_strong"],
    formulaA: { score: 88, level: "very_strong" },
    candidateD: {
      score: 88,
      level: "very_strong",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "네 기둥이 모두 己巳인 독립 극강 validation이다. 후보 D 점수는 관측값일 뿐 명리 정답 점수로 고정하지 않는다.",
  },
  {
    id: "STRENGTH-VALIDATION-012",
    dataset: "validation",
    birth: {
      date: "1980-07-22",
      time: "17:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedAdjustedDateTime: "1980-07-22 16:30",
    expectedPillars: {
      year: "庚申",
      month: "癸未",
      day: "丙申",
      hour: "丙申",
    },
    expectedDayMaster: "丙",
    expectedTenGods: {
      year: { stem: "편재", branch: "편재" },
      month: { stem: "정관", branch: "상관" },
      day: { stem: "(일간)", branch: "편재" },
      hour: { stem: "비견", branch: "편재" },
    },
    expectedHiddenStems: [
      { pillar: "year", branch: "申", stem: "庚", role: "main", tenGod: "편재" },
      { pillar: "year", branch: "申", stem: "壬", role: "middle", tenGod: "편관" },
      { pillar: "year", branch: "申", stem: "戊", role: "residual", tenGod: "식신" },
      { pillar: "month", branch: "未", stem: "己", role: "main", tenGod: "상관" },
      { pillar: "month", branch: "未", stem: "乙", role: "middle", tenGod: "정인" },
      { pillar: "month", branch: "未", stem: "丁", role: "residual", tenGod: "겁재" },
      { pillar: "day", branch: "申", stem: "庚", role: "main", tenGod: "편재" },
      { pillar: "day", branch: "申", stem: "壬", role: "middle", tenGod: "편관" },
      { pillar: "day", branch: "申", stem: "戊", role: "residual", tenGod: "식신" },
      { pillar: "hour", branch: "申", stem: "庚", role: "main", tenGod: "편재" },
      { pillar: "hour", branch: "申", stem: "壬", role: "middle", tenGod: "편관" },
      { pillar: "hour", branch: "申", stem: "戊", role: "residual", tenGod: "식신" },
    ],
    externalDirection: "태약·매우 약한 방향",
    externalAllowedLevels: ["very_weak"],
    formulaA: { score: 24, level: "weak" },
    candidateD: {
      score: 18,
      level: "very_weak",
      evaluation: {
        exactMatch: true,
        adjacentBand: false,
        bandDistance: 0,
        bandDirection: "within",
        boundaryPointDistance: 0,
        status: "exact_match",
      },
    },
    notes:
      "세 申의 재성·관성·식상과 未월 설기를 검증하는 독립 태약 validation이다. 후보 D 점수는 관측값일 뿐 명리 정답 점수로 고정하지 않는다.",
  },
];

/** 아직 정식 번호를 부여하거나 A/D 평가에 포함하지 않는 예비 validation 후보입니다. */
export const PRELIMINARY_STRENGTH_VALIDATION_CANDIDATES: PreliminaryStrengthValidationCandidate[] = [
  {
    id: "STRENGTH-PRELIMINARY-001",
    dataset: "preliminary_validation_candidate",
    birth: {
      date: "1999-10-20",
      time: "19:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedPillars: {
      year: "己卯",
      month: "甲戌",
      day: "乙巳",
      hour: "乙酉",
    },
    expectedDayMaster: "乙",
    externalDirection: "신약~중화신약",
    externalAllowedLevels: ["weak", "balanced_weak"],
    notes:
      "사용자가 예비 후보로 제공한 사례다. Validation #6~#10 및 누적 성능 집계에는 포함하지 않고, 공식 A와 후보 D도 아직 평가하지 않는다.",
  },
];

/** 공식 validation 집계와 후보 D 보정에서 제외하는 극단 대표 선정용 외부 참고 자료입니다. */
export const EXTREME_STRENGTH_REFERENCE_CASES: ExtremeStrengthReferenceCase[] = [
  {
    id: "STRENGTH-EXTREME-REFERENCE-A",
    dataset: "external_reference_only",
    birth: {
      date: "1981-12-20",
      time: "17:00",
      calendar: "solar",
      gender: "male",
      timezone: "Asia/Seoul",
    },
    expectedPillars: {
      year: "辛酉",
      month: "庚子",
      day: "壬申",
      hour: "戊申",
    },
    expectedDayMaster: "壬",
    externalDirection: "신강~태강",
    externalScoreReference: "점신 90",
    excludedFromOfficialValidation: true,
    notes:
      "강한 외부 참고 사례지만 Validation #11보다 극단성이 낮아 대표 validation과 공식 집계에서 제외한다.",
  },
  {
    id: "STRENGTH-EXTREME-REFERENCE-B",
    dataset: "external_reference_only",
    birth: {
      date: "2006-11-10",
      time: "13:00",
      calendar: "solar",
      gender: "female",
      timezone: "Asia/Seoul",
    },
    expectedPillars: {
      year: "丙戌",
      month: "己亥",
      day: "癸卯",
      hour: "戊午",
    },
    expectedDayMaster: "癸",
    externalDirection: "신약",
    externalScoreReference: "점신 30",
    excludedFromOfficialValidation: true,
    notes:
      "약한 외부 참고 사례지만 Validation #12보다 극단성이 낮아 대표 validation과 공식 집계에서 제외한다.",
  },
];

/** 사용자와 공유하는 누적 A/D 비교표의 단일 원천입니다. */
export const STRENGTH_COMPARISON_TABLE: StrengthComparisonRow[] =
  STRENGTH_VALIDATION_CASES.map((validationCase) => ({
    case: validationCase.id,
    dataset: validationCase.dataset,
    externalDirection: validationCase.externalDirection,
    externalBand: validationCase.externalAllowedLevels.join(" ~ "),
    formulaA: `${validationCase.formulaA.score} / ${validationCase.formulaA.level}`,
    candidateD: `${validationCase.candidateD.score} / ${validationCase.candidateD.level}`,
    exactMatch: validationCase.candidateD.evaluation.exactMatch,
    adjacentBand: validationCase.candidateD.evaluation.adjacentBand,
    bandDistance: validationCase.candidateD.evaluation.bandDistance,
    bandDirection: validationCase.candidateD.evaluation.bandDirection,
    boundaryPointDistance:
      validationCase.candidateD.evaluation.boundaryPointDistance,
    status: validationCase.candidateD.evaluation.status,
  }));
