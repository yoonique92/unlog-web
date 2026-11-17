import type { SajuResult } from "ssaju";
import type {
  CalculatedSaju,
  FiveElement,
  HiddenStemInfo,
  HiddenStemRole,
  NormalizedSaju,
  Pillar,
  PillarPosition,
  Relation,
  SajuCalculationInput,
  YinYang,
} from "./types";
import { calculateCanonicalRelationSals } from "./relationSalCalculator";

export const ELEMENT_KO_TO_KEY: Record<string, FiveElement> = {
  목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water",
};

export const STEM_ELEMENT: Record<string, FiveElement> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

export const BRANCH_ELEMENT: Record<string, FiveElement> = {
  寅: "wood", 卯: "wood", 巳: "fire", 午: "fire", 辰: "earth", 戌: "earth",
  丑: "earth", 未: "earth", 申: "metal", 酉: "metal", 亥: "water", 子: "water",
};

const positions: PillarPosition[] = ["year", "month", "day", "hour"];
const hiddenRoles: Array<[keyof SajuResult["pillarDetails"]["day"]["hiddenStems"], HiddenStemRole]> = [
  ["정기", "main"], ["중기", "middle"], ["여기", "residual"],
];

function element(value: string): FiveElement {
  const normalized = ELEMENT_KO_TO_KEY[value] ?? STEM_ELEMENT[value];
  if (!normalized) throw new Error(`지원하지 않는 오행 값: ${value}`);
  return normalized;
}

function yinYang(value: string): YinYang {
  return value === "양" ? "yang" : "yin";
}

function makePillar(raw: SajuResult, position: PillarPosition): Pillar {
  const detail = raw.pillarDetails[position];
  return {
    position,
    stem: detail.stem,
    branch: detail.branch,
    stemKorean: detail.stemKo,
    branchKorean: detail.branchKo,
    stemElement: element(detail.element.stem),
    branchElement: element(detail.element.branch),
    stemYinYang: yinYang(detail.yinYang.stem),
    branchYinYang: yinYang(detail.yinYang.branch),
  };
}

function normalizeBranchRelations(raw: SajuResult, key: "육합" | "삼합" | "방합" | "반합" | "충" | "형" | "파" | "해", kind: Relation["kind"]) {
  return Object.entries(raw.branchRelations[key]).map(([pillar, description]) => ({
    kind,
    source: "branch" as const,
    pillars: [pillar as PillarPosition],
    symbols: [],
    description: String(description),
  }));
}

export function normalizeSaju(calculated: CalculatedSaju, input: SajuCalculationInput): NormalizedSaju {
  const { raw, birthTimeUnknown } = calculated;
  const visiblePositions = birthTimeUnknown ? positions.slice(0, 3) : positions;
  const pillars = {
    year: makePillar(raw, "year"), month: makePillar(raw, "month"), day: makePillar(raw, "day"),
    ...(birthTimeUnknown ? {} : { hour: makePillar(raw, "hour") }),
  };
  const hiddenStems: HiddenStemInfo[] = visiblePositions.flatMap((position) =>
    hiddenRoles.flatMap(([sourceRole, role]) => {
      const stem = raw.pillarDetails[position].hiddenStems[sourceRole];
      return stem ? [{ pillar: position, branch: raw.pillarDetails[position].branch, stem, element: element(stem), role }] : [];
    }),
  );
  const stemCombinations: Relation[] = raw.stemRelations.map((relation) => ({
    kind: relation.type === "합" ? "combination" : "clash",
    source: "stem",
    pillars: [...relation.pillars],
    symbols: [...relation.stems],
    description: relation.desc,
  }));
  const combinations = [
    ...stemCombinations.filter((relation) => relation.kind === "combination"),
    ...normalizeBranchRelations(raw, "육합", "combination"),
    ...normalizeBranchRelations(raw, "삼합", "combination"),
    ...normalizeBranchRelations(raw, "방합", "combination"),
    ...normalizeBranchRelations(raw, "반합", "combination"),
  ];
  const formatDate = (date: { year: number; month: number; day: number }) =>
    `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

  return {
    birth: {
      solarDate: formatDate(raw.solar), inputDate: input.birthDate,
      calendar: input.calendar ?? "solar", gender: input.gender,
      birthTime: birthTimeUnknown ? undefined : `${String(calculated.unlogTime.original.hour).padStart(2, "0")}:${String(calculated.unlogTime.original.minute).padStart(2, "0")}`,
      timezone: input.timezone ?? "Asia/Seoul", birthTimeUnknown,
    },
    pillars,
    dayMaster: { stem: raw.dayStem, element: element(raw.pillarDetails.day.element.stem), yinYang: yinYang(raw.pillarDetails.day.yinYang.stem) },
    hiddenStems,
    tenGods: visiblePositions.flatMap((pillar) => ([
      { pillar, target: "stem" as const, name: raw.tenGods[pillar].stem },
      { pillar, target: "branch" as const, name: raw.tenGods[pillar].branch },
    ])),
    twelveStages: visiblePositions.flatMap((pillar) => ([
      { pillar, basis: "bong" as const, stage: raw.stages12.bong[pillar] },
      { pillar, basis: "geo" as const, stage: raw.stages12.geo[pillar] },
    ])),
    elementDistribution: {
      wood: raw.fiveElements.목 ?? 0, fire: raw.fiveElements.화 ?? 0,
      earth: raw.fiveElements.토 ?? 0, metal: raw.fiveElements.금 ?? 0,
      water: raw.fiveElements.수 ?? 0,
    },
    relations: {
      combinations,
      clashes: [...stemCombinations.filter((relation) => relation.kind === "clash"), ...normalizeBranchRelations(raw, "충", "clash")],
      punishments: normalizeBranchRelations(raw, "형", "punishment"),
      harms: normalizeBranchRelations(raw, "해", "harm"),
      breaks: normalizeBranchRelations(raw, "파", "break"),
    },
    relationSals: calculateCanonicalRelationSals(pillars),
    daeun: raw.daeun.list.map((item) => ({
      startAge: item.startAge, endAge: item.endAge, startYear: item.startYear,
      stem: item.stem, branch: item.branch, ganzhi: item.ganzhi,
      stemTenGod: item.stemTenGod, branchTenGod: item.branchTenGod, stage12: item.stage12,
    })),
    currentDaeun: raw.daeun.current ? {
      startAge: raw.daeun.current.startAge, endAge: raw.daeun.current.endAge,
      startYear: raw.daeun.current.startYear, stem: raw.daeun.current.stem,
      branch: raw.daeun.current.branch, ganzhi: raw.daeun.current.ganzhi,
      stemTenGod: raw.daeun.current.stemTenGod, branchTenGod: raw.daeun.current.branchTenGod,
      stage12: raw.daeun.current.stage12,
    } : undefined,
    daeunMeta: { direction: raw.daeun.basis.direction, startAge: raw.daeun.startAge, startAgePrecise: raw.daeun.startAgePrecise },
    seyun: raw.seyun.map((item) => ({
      year: item.year, stem: item.stem, branch: item.branch, ganzhi: item.ganzhi,
      stemTenGod: item.tenGodStem, branchTenGod: item.tenGodBranch, stage12: item.stage12,
    })),
    wolun: raw.wolun.map((item) => ({
      month: item.month, monthName: item.monthName, stem: item.stem, branch: item.branch,
      ganzhi: item.ganzhi, stemTenGod: item.stemTenGod, branchTenGod: item.branchTenGod, stage12: item.stage12,
    })),
    seasonal: {
      monthBranch: raw.pillarDetails.month.branch,
      season: (["寅", "卯", "辰"].includes(raw.pillarDetails.month.branch) ? "spring"
        : ["巳", "午", "未"].includes(raw.pillarDetails.month.branch) ? "summer"
          : ["申", "酉", "戌"].includes(raw.pillarDetails.month.branch) ? "autumn" : "winter"),
    },
  };
}
