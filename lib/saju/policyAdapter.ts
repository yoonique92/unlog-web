import { calculateSaju, type SajuResult } from "ssaju";
import { getTenGodForBranch, getTenGodForStem } from "../tenGodUtils";
import { calculateSajuRaw } from "./calculator";
import { normalizeSaju } from "./normalize";
import { calculateCanonicalRelationSals } from "./relationSalCalculator";
import { evaluateCanonicalRelations } from "./canonicalRelationEvaluator";
import { BONG_START_BRANCH } from "./twelveStagePolicy";
import type {
  CalculatedSaju,
  FiveElement,
  NormalizedSaju,
  Pillar,
  PillarPosition,
  Relation,
  SajuCalculationInput,
  AdjustedBirthTime,
} from "./types";

export const KOREA_TIME_ADJUSTMENT_POLICY = "KOREA_MINUS_30_V1" as const;
export const ZI_DAY_BOUNDARY_POLICY = "ZI_START_NEXT_DAY_V1" as const;

export interface SajuPolicyAdapterResult {
  normalized: NormalizedSaju;
  gongmang: SajuResult["gongmang"];
  unlogTime: AdjustedBirthTime;
  policies: {
    timeAdjustment: typeof KOREA_TIME_ADJUSTMENT_POLICY;
    dayBoundary: typeof ZI_DAY_BOUNDARY_POLICY;
  };
  boundary: {
    applied: boolean;
    actualAdjustedDateTime: string;
    actualSolarDate: string;
    effectiveDayDate: string;
  };
  sources: {
    actualAdjusted: {
      raw: SajuResult;
      normalized: NormalizedSaju;
    };
    dayHourReference: {
      raw: SajuResult;
      normalized: NormalizedSaju;
    };
  };
}

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);
const GEO_STAGES: Record<string, readonly string[]> = {
  甲: ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"],
  乙: ["양", "태", "절", "묘", "사", "병", "쇠", "제왕", "건록", "관대", "목욕", "장생"],
  丙: ["태", "양", "장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절"],
  丁: ["절", "묘", "사", "병", "쇠", "제왕", "건록", "관대", "목욕", "장생", "양", "태"],
  戊: ["태", "양", "장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절"],
  己: ["절", "묘", "사", "병", "쇠", "제왕", "건록", "관대", "목욕", "장생", "양", "태"],
  庚: ["사", "병", "쇠", "제왕", "건록", "관대", "목욕", "장생", "양", "태", "절", "묘"],
  辛: ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"],
  壬: ["건록", "관대", "목욕", "장생", "양", "태", "절", "묘", "사", "병", "쇠", "제왕"],
  癸: ["관대", "목욕", "장생", "양", "태", "절", "묘", "사", "병", "쇠", "제왕", "건록"],
};


function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: { year: number; month: number; day: number }) {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function addUtcDays(date: { year: number; month: number; day: number }, amount: number) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day));
  next.setUTCDate(next.getUTCDate() + amount);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function pillarText(pillar: Pillar) {
  return `${pillar.stem}${pillar.branch}`;
}

function getBongStage(dayStem: string, branch: string) {
  const start = BONG_START_BRANCH[dayStem];
  const startIndex = BRANCHES.indexOf(start as (typeof BRANCHES)[number]);
  const branchIndex = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  if (startIndex < 0 || branchIndex < 0) return "";
  const distance = YANG_STEMS.has(dayStem)
    ? (branchIndex - startIndex + 12) % 12
    : (startIndex - branchIndex + 12) % 12;
  return STAGES[distance];
}

function getGeoStage(dayStem: string, branch: string) {
  const branchIndex = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  return branchIndex < 0 ? "" : (GEO_STAGES[dayStem]?.[branchIndex] ?? "");
}

function rebuildRelations(pillars: NormalizedSaju["pillars"]): NormalizedSaju["relations"] {
  const visible = POSITIONS.flatMap((position) => {
    const pillar = pillars[position];
    return pillar ? [{ position, pillar }] : [];
  });
  const evaluated = evaluateCanonicalRelations({
    stems: visible.map(({ position, pillar }) => ({ key: position, symbol: pillar.stem })),
    branches: visible.map(({ position, pillar }) => ({ key: position, symbol: pillar.branch })),
  });
  const toRelation = (relation: (typeof evaluated.combinations)[number]): Relation => ({
    kind: relation.kind,
    source: relation.elementType,
    pillars: relation.memberKeys,
    symbols: relation.symbols,
    description: `${relation.symbols.join("·")} ${relation.name}`,
  });

  return {
    combinations: evaluated.combinations.map(toRelation),
    clashes: evaluated.clashes.map(toRelation),
    punishments: evaluated.punishments.map(toRelation),
    harms: evaluated.harms.map(toRelation),
    breaks: evaluated.breaks.map(toRelation),
  };
}

function rebuildElementDistribution(pillars: NormalizedSaju["pillars"]) {
  const result: Record<FiveElement, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  for (const position of POSITIONS) {
    const pillar = pillars[position];
    if (!pillar) continue;
    result[pillar.stemElement] += 1;
    result[pillar.branchElement] += 1;
  }
  return result;
}

function remapCyclesForDayMaster(
  source: NormalizedSaju,
  dayStem: string,
): Pick<NormalizedSaju, "daeun" | "currentDaeun" | "seyun" | "wolun"> {
  const mapPeriod = <T extends { stem: string; branch: string }>(period: T) => ({
    ...period,
    stemTenGod: getTenGodForStem(dayStem, period.stem),
    branchTenGod: getTenGodForBranch(dayStem, period.branch),
    stage12: getBongStage(dayStem, period.branch),
  });
  return {
    daeun: source.daeun.map(mapPeriod),
    currentDaeun: source.currentDaeun ? mapPeriod(source.currentDaeun) : undefined,
    seyun: source.seyun.map(mapPeriod),
    wolun: source.wolun.map(mapPeriod),
  };
}

function buildCanonicalNormalized(
  actual: NormalizedSaju,
  dayHourReference: NormalizedSaju,
): NormalizedSaju {
  const pillars: NormalizedSaju["pillars"] = {
    year: actual.pillars.year,
    month: actual.pillars.month,
    day: dayHourReference.pillars.day,
    ...(dayHourReference.pillars.hour ? { hour: dayHourReference.pillars.hour } : {}),
  };
  const dayMaster = dayHourReference.dayMaster;
  const visiblePositions = POSITIONS.filter((position) => pillars[position]);
  const hiddenStems = [
    ...actual.hiddenStems.filter(({ pillar }) => pillar === "year" || pillar === "month"),
    ...dayHourReference.hiddenStems.filter(({ pillar }) => pillar === "day" || pillar === "hour"),
  ];
  const cycles = remapCyclesForDayMaster(actual, dayMaster.stem);

  return {
    ...actual,
    birth: actual.birth,
    pillars,
    dayMaster,
    hiddenStems,
    tenGods: visiblePositions.flatMap((position) => {
      const pillar = pillars[position]!;
      return [
        {
          pillar: position,
          target: "stem" as const,
          name: position === "day" ? "(일간)" : getTenGodForStem(dayMaster.stem, pillar.stem),
        },
        {
          pillar: position,
          target: "branch" as const,
          name: getTenGodForBranch(dayMaster.stem, pillar.branch),
        },
      ];
    }),
    twelveStages: visiblePositions.flatMap((position) => {
      const branch = pillars[position]!.branch;
      return [
        { pillar: position, basis: "bong" as const, stage: getBongStage(dayMaster.stem, branch) },
        { pillar: position, basis: "geo" as const, stage: getGeoStage(dayMaster.stem, branch) },
      ];
    }),
    elementDistribution: rebuildElementDistribution(pillars),
    relations: rebuildRelations(pillars),
    relationSals: calculateCanonicalRelationSals(pillars),
    ...cycles,
    seasonal: actual.seasonal,
  };
}

function asCalculatedSource(raw: SajuResult, actual: CalculatedSaju): CalculatedSaju {
  return {
    raw,
    birthTimeUnknown: actual.birthTimeUnknown,
    unlogTime: actual.unlogTime,
  };
}

/**
 * Production wiring 전용 후보 adapter입니다.
 * 기존 calculateSajuRaw 또는 ssaju 내부는 변경하지 않고, 두 기준 시각의
 * 독립 계산 결과를 이용해 정규화된 원국을 구성합니다.
 */
export function calculateSajuWithBoundaryPolicies(
  input: SajuCalculationInput,
): SajuPolicyAdapterResult {
  const actualCalculated = calculateSajuRaw(input);
  const actualNormalized = normalizeSaju(actualCalculated, input);
  const adjusted = actualCalculated.unlogTime.adjusted;
  const boundaryApplied = !actualCalculated.birthTimeUnknown && adjusted.hour === 23;
  const actualSolarDate = actualCalculated.raw.solar;
  const effectiveDayDate = boundaryApplied ? addUtcDays(actualSolarDate, 1) : actualSolarDate;

  const dayHourRaw = boundaryApplied
    ? calculateSaju({
        year: effectiveDayDate.year,
        month: effectiveDayDate.month,
        day: effectiveDayDate.day,
        hour: adjusted.hour,
        minute: adjusted.minute,
        gender: actualCalculated.raw.input.gender,
        calendar: "solar",
        timezone: input.timezone ?? "Asia/Seoul",
        applyLocalMeanTime: false,
        ...(input.targetYear
          ? { now: new Date(`${input.targetYear}-07-01T12:00:00+09:00`) }
          : {}),
      })
    : actualCalculated.raw;
  const dayHourCalculated = asCalculatedSource(dayHourRaw, actualCalculated);
  const dayHourNormalized = boundaryApplied
    ? normalizeSaju(dayHourCalculated, input)
    : actualNormalized;
  const normalized = boundaryApplied
    ? buildCanonicalNormalized(actualNormalized, dayHourNormalized)
    : actualNormalized;

  return {
    normalized,
    gongmang: dayHourRaw.gongmang,
    unlogTime: actualCalculated.unlogTime,
    policies: {
      timeAdjustment: KOREA_TIME_ADJUSTMENT_POLICY,
      dayBoundary: ZI_DAY_BOUNDARY_POLICY,
    },
    boundary: {
      applied: boundaryApplied,
      actualAdjustedDateTime: `${adjusted.year}-${pad(adjusted.month)}-${pad(adjusted.day)} ${pad(adjusted.hour)}:${pad(adjusted.minute)}`,
      actualSolarDate: formatDate(actualSolarDate),
      effectiveDayDate: formatDate(effectiveDayDate),
    },
    sources: {
      actualAdjusted: {
        raw: actualCalculated.raw,
        normalized: actualNormalized,
      },
      dayHourReference: {
        raw: dayHourRaw,
        normalized: dayHourNormalized,
      },
    },
  };
}

export function getCanonicalPillarTexts(result: SajuPolicyAdapterResult) {
  return {
    year: pillarText(result.normalized.pillars.year),
    month: pillarText(result.normalized.pillars.month),
    day: pillarText(result.normalized.pillars.day),
    hour: result.normalized.pillars.hour
      ? pillarText(result.normalized.pillars.hour)
      : null,
  };
}
