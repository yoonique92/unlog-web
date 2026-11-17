import type { GeukgukCandidateType } from "./types";

export const GEUKGUK_RULES = {
  layerWeights: { main: 55, middle: 40, residual: 28 },
  exposedBonus: 18,
  rootedBonus: 9,
  relationRiskPenalty: 10,
  probableThreshold: 65,
  possibleThreshold: 42,
  maxCandidates: 3,
} as const;

export const TEN_GOD_TO_GEUKGUK: Record<string, GeukgukCandidateType> = {
  정관: "jeonggwan", 편관: "pyeongwan", 칠살: "pyeongwan",
  정재: "jeongjae", 편재: "pyeonjae", 정인: "jeongin", 편인: "pyeonin",
  식신: "siksin", 상관: "sanggwan",
};

export const JIAN_LU_BRANCH_BY_DAY_STEM: Readonly<Record<string, string>> = {
  甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳",
  己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};

export function isJianLuMonth(dayStem: string, monthBranch: string) {
  return JIAN_LU_BRANCH_BY_DAY_STEM[dayStem] === monthBranch;
}

export const GEUKGUK_LABELS: Record<GeukgukCandidateType, string> = {
  jeonggwan: "정관", pyeongwan: "편관", jeongjae: "정재", pyeonjae: "편재",
  jeongin: "정인", pyeonin: "편인", siksin: "식신", sanggwan: "상관",
  geonrok: "건록", yangin: "양인", other: "기타",
};
