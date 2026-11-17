import type { SajuResult } from "ssaju";
import {
  calculateSajuWithBoundaryPolicies,
  getCanonicalPillarTexts,
} from "./saju/policyAdapter";
import { resolveProductionDayStrength } from "./myeongri/strengthCandidateDAdapter";
import { calculateCanonicalSals } from "./saju/salCalculator";
import type {
  FiveElement as NormalizedFiveElement,
  NormalizedSaju,
  PillarPosition,
} from "./saju/types";

type FiveElements = { 목: number; 화: number; 토: number; 금: number; 수: number };
type FiveElement = keyof FiveElements;

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];
const ELEMENT_KEY_TO_KO: Record<NormalizedFiveElement, FiveElement> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};
const RESOURCE_ELEMENT: Record<NormalizedFiveElement, NormalizedFiveElement> = {
  wood: "water",
  fire: "wood",
  earth: "fire",
  metal: "earth",
  water: "metal",
};
const CONTROLLING_ELEMENT: Record<NormalizedFiveElement, NormalizedFiveElement> = {
  wood: "metal",
  fire: "water",
  earth: "wood",
  metal: "fire",
  water: "earth",
};

function getTenGod(
  saju: NormalizedSaju,
  pillar: PillarPosition,
  target: "stem" | "branch",
) {
  return saju.tenGods.find(
    (item) => item.pillar === pillar && item.target === target,
  )?.name ?? "";
}

function getTwelveStage(
  saju: NormalizedSaju,
  pillar: PillarPosition,
  basis: "bong" | "geo",
) {
  return saju.twelveStages.find(
    (item) => item.pillar === pillar && item.basis === basis,
  )?.stage ?? "";
}

function toLegacyFiveElements(saju: NormalizedSaju): FiveElements {
  const result: FiveElements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const [element, count] of Object.entries(saju.elementDistribution)) {
    result[ELEMENT_KEY_TO_KO[element as NormalizedFiveElement]] = count;
  }
  return result;
}

/**
 * ssaju 0.2.0의 기존 dayStrength 산식을 그대로 사용하되, 입력 원국만
 * policy adapter가 만든 canonical 원국으로 교체합니다.
 */
function calculateLegacyDayStrength(
  saju: NormalizedSaju,
): SajuResult["advanced"]["dayStrength"] {
  const dayElement = saju.dayMaster.element;
  const monthElement = saju.pillars.month.branchElement;
  let score = 50;

  if (monthElement === dayElement) score += 20;
  score += 10 * saju.elementDistribution[dayElement];
  score += 8 * saju.elementDistribution[RESOURCE_ELEMENT[dayElement]];
  score -= 8 * saju.elementDistribution[CONTROLLING_ELEMENT[dayElement]];

  const monthStage = getTwelveStage(saju, "month", "bong");
  if (["건록", "제왕"].includes(monthStage)) score += 15;
  if (["사", "절", "묘"].includes(monthStage)) score -= 15;

  return {
    score,
    strength: score >= 70 ? "strong" : score <= 30 ? "weak" : "neutral",
  };
}

/**
 * 기존 UI/API 호환용 래퍼입니다.
 * 공식 원국과 그 종속 데이터는 policy adapter의 normalized 결과를 사용합니다.
 * advanced의 격국/용신은 기존 ssaju 진단값을 보존하며, 운영 신규 분석에서는
 * analyzeUnlogSaju를 사용합니다.
 */
export function getSaju(
  birthDate: string,
  hour: string,
  minute: string,
  calendar: "solar" | "lunar",
  gender: "female" | "male",
  birthTimeUnknown = false,
) {
  const policyResult = calculateSajuWithBoundaryPolicies({
    birthDate,
    birthHour: Number(hour),
    birthMinute: Number(minute),
    calendar,
    gender,
    birthTimeUnknown,
  });
  const normalizedSaju = policyResult.normalized;
  const actualRaw = policyResult.sources.actualAdjusted.raw;
  const dayHourRaw = policyResult.sources.dayHourReference.raw;
  const pillarTexts = getCanonicalPillarTexts(policyResult);
  const visiblePositions = birthTimeUnknown ? POSITIONS.slice(0, 3) : POSITIONS;
  const legacyDayStrength = calculateLegacyDayStrength(normalizedSaju);
  const bongStages = Object.fromEntries(POSITIONS.map((position) => [
    position,
    visiblePositions.includes(position)
      ? getTwelveStage(normalizedSaju, position, "bong")
      : "",
  ])) as SajuResult["stages12"]["bong"];
  const sals = calculateCanonicalSals({
    pillars: {
      year: normalizedSaju.pillars.year,
      month: normalizedSaju.pillars.month,
      day: normalizedSaju.pillars.day,
      hour: normalizedSaju.pillars.hour ?? { stem: "", branch: "" },
    },
    bongStages,
    birthTimeUnknown,
    relationSals: normalizedSaju.relationSals,
  });

  const tenGods = Object.fromEntries(POSITIONS.map((position) => [
    position,
    visiblePositions.includes(position)
      ? {
          stem: getTenGod(normalizedSaju, position, "stem"),
          branch: getTenGod(normalizedSaju, position, "branch"),
        }
      : { stem: "", branch: "" },
  ])) as SajuResult["tenGods"];

  const stages12 = {
    bong: bongStages,
    geo: Object.fromEntries(POSITIONS.map((position) => [
      position,
      visiblePositions.includes(position)
        ? getTwelveStage(normalizedSaju, position, "geo")
        : "",
    ])),
  } as SajuResult["stages12"];

  return {
    ...actualRaw,
    pillars: {
      year: pillarTexts.year,
      month: pillarTexts.month,
      day: pillarTexts.day,
      hour: birthTimeUnknown ? "" : (pillarTexts.hour ?? ""),
    },
    pillarDetails: {
      year: actualRaw.pillarDetails.year,
      month: actualRaw.pillarDetails.month,
      day: dayHourRaw.pillarDetails.day,
      hour: dayHourRaw.pillarDetails.hour,
    },
    dayStem: normalizedSaju.dayMaster.stem,
    dayBranch: normalizedSaju.pillars.day.branch,
    gongmang: policyResult.gongmang,
    fiveElements: toLegacyFiveElements(normalizedSaju),
    tenGods,
    stages12,
    sals,
    advanced: {
      ...actualRaw.advanced,
      dayStrength: resolveProductionDayStrength(
        normalizedSaju,
        legacyDayStrength,
      ),
    },
    normalizedSaju,
    relations: normalizedSaju.relations,
    relationSals: normalizedSaju.relationSals,
    hiddenStems: normalizedSaju.hiddenStems,
    calculationPolicy: {
      ...policyResult.policies,
      ...policyResult.boundary,
    },
    birthTimeUnknown,
    unlogTime: policyResult.unlogTime,
  };
}

export { analyzeUnlogSaju } from "./myeongri/engine";
export type { NormalizedSaju, SajuCalculationInput } from "./saju/types";
