import type { FiveElement, NormalizedSaju, Pillar, PillarPosition } from "../../lib/saju/types";

// 실제 인물의 명리 판정을 주장하지 않고 규칙 방향의 회귀만 검사하는 합성 fixture다.
export function createSyntheticSaju(
  elements: FiveElement[],
  options: { season?: NormalizedSaju["seasonal"]["season"]; distribution?: Partial<NormalizedSaju["elementDistribution"]> } = {},
): NormalizedSaju {
  const positions: PillarPosition[] = ["year", "month", "day", "hour"];
  const makePillar = (position: PillarPosition, index: number): Pillar => ({
    position, stem: ["甲", "丙", "甲", "庚"][index], branch: ["寅", "午", "卯", "申"][index],
    stemKorean: "", branchKorean: "", stemElement: elements[index * 2], branchElement: elements[index * 2 + 1],
    stemYinYang: "yang", branchYinYang: "yang",
  });
  return {
    birth: { solarDate: "2000-01-01", inputDate: "2000-01-01", calendar: "solar", gender: "male", birthTime: "12:00", timezone: "Asia/Seoul", birthTimeUnknown: false },
    pillars: { year: makePillar("year", 0), month: makePillar("month", 1), day: makePillar("day", 2), hour: makePillar("hour", 3) },
    dayMaster: { stem: "甲", element: "wood", yinYang: "yang" },
    hiddenStems: positions.map((pillar, index) => ({ pillar, branch: ["寅", "午", "卯", "申"][index], stem: ["甲", "丙", "乙", "庚"][index], element: elements[index * 2 + 1], role: "main" })),
    tenGods: [], twelveStages: [],
    elementDistribution: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0, ...options.distribution },
    relations: { combinations: [], clashes: [], punishments: [], harms: [], breaks: [] },
    relationSals: [],
    daeun: [], daeunMeta: { direction: "forward", startAge: 1, startAgePrecise: 1 }, seyun: [], wolun: [], seasonal: { monthBranch: options.season === "winter" ? "子" : options.season === "autumn" ? "酉" : options.season === "spring" ? "卯" : "午", season: options.season ?? "summer" },
  };
}

export const SUPPORT_HEAVY = createSyntheticSaju(["water", "wood", "wood", "water", "wood", "wood", "water", "wood"]);
export const DEPLETION_HEAVY = createSyntheticSaju(["metal", "fire", "metal", "fire", "wood", "earth", "metal", "fire"]);
export const BALANCED = createSyntheticSaju(["water", "fire", "wood", "metal", "wood", "earth", "water", "fire"]);
export const VERY_COLD = createSyntheticSaju(["water", "water", "metal", "water", "wood", "water", "metal", "water"], { season: "winter", distribution: { water: 5, fire: 0 } });
export const VERY_HOT = createSyntheticSaju(["fire", "fire", "wood", "fire", "wood", "fire", "earth", "fire"], { season: "summer", distribution: { fire: 5, water: 0 } });
