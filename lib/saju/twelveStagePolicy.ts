/** Canonical 봉법 12운성에서 각 일간의 장생 시작 지지. */
export const BONG_START_BRANCH: Readonly<Record<string, string>> = {
  甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅",
  己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯",
};

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);

/** Canonical 봉법의 장생 시작지에서 세 단계 떨어진 건록지를 구한다. */
export function getGeonrokBranch(dayStem: string): string | undefined {
  const start = BONG_START_BRANCH[dayStem];
  const startIndex = BRANCHES.indexOf(start as (typeof BRANCHES)[number]);
  if (startIndex < 0) return undefined;

  const direction = YANG_STEMS.has(dayStem) ? 1 : -1;
  return BRANCHES[(startIndex + direction * 3 + BRANCHES.length) % BRANCHES.length];
}

/** 지지 순환에서 지정한 지지의 바로 앞뒤 지지를 반환한다. */
export function getAdjacentBranches(branch: string): readonly string[] {
  const index = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  if (index < 0) return [];

  return [
    BRANCHES[(index - 1 + BRANCHES.length) % BRANCHES.length],
    BRANCHES[(index + 1) % BRANCHES.length],
  ];
}
