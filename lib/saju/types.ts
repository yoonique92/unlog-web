import type { SajuResult } from "ssaju";

export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";
export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";
export type PillarPosition = "year" | "month" | "day" | "hour";
export type HiddenStemRole = "main" | "middle" | "residual";

export interface SajuCalculationInput {
  birthDate: string;
  birthTime?: string;
  birthHour?: number;
  birthMinute?: number;
  birthTimeUnknown?: boolean;
  calendar?: CalendarType;
  gender: Gender;
  timezone?: string;
  targetYear?: number;
}

export interface AdjustedBirthTime {
  original: { hour: number; minute: number };
  adjusted: { year: number; month: number; day: number; hour: number; minute: number };
  policy:
    | "KOREA_MINUS_30_V1"
    | "UNKNOWN_TIME_EXCLUDES_HOUR_PILLAR"
    | "NO_ADJUSTMENT_DIAGNOSTIC";
}

export interface CalculatedSaju {
  raw: SajuResult;
  birthTimeUnknown: boolean;
  unlogTime: AdjustedBirthTime;
}

export interface Pillar {
  position: PillarPosition;
  stem: string;
  branch: string;
  stemKorean: string;
  branchKorean: string;
  stemElement: FiveElement;
  branchElement: FiveElement;
  stemYinYang: YinYang;
  branchYinYang: YinYang;
}

export interface HiddenStemInfo {
  pillar: PillarPosition;
  branch: string;
  stem: string;
  element: FiveElement;
  role: HiddenStemRole;
}

export interface TenGodInfo {
  pillar: PillarPosition;
  target: "stem" | "branch";
  name: string;
}

export interface TwelveStageInfo {
  pillar: PillarPosition;
  basis: "bong" | "geo";
  stage: string;
}

export interface Relation {
  kind: "combination" | "clash" | "punishment" | "harm" | "break";
  source: "stem" | "branch";
  pillars: PillarPosition[];
  symbols: string[];
  description: string;
}

export type RelationSalId = "gwimun_gwansal";

export interface CanonicalRelationSal {
  id: RelationSalId;
  name: string;
  category: "relation";
  /** Deterministic canonical position order, not a directional judgment. */
  from: PillarPosition;
  to: PillarPosition;
  /** Branches in the same order as from/to. */
  branches: [string, string];
}

export interface DaeunPeriod {
  startAge: number;
  endAge: number;
  startYear: number;
  stem: string;
  branch: string;
  ganzhi: string;
  stemTenGod: string;
  branchTenGod: string;
  stage12: string;
}

export interface SeyunPeriod {
  year: number;
  stem: string;
  branch: string;
  ganzhi: string;
  stemTenGod: string;
  branchTenGod: string;
  stage12: string;
}

export interface WolunPeriod {
  month: number;
  monthName: string;
  stem: string;
  branch: string;
  ganzhi: string;
  stemTenGod: string;
  branchTenGod: string;
  stage12: string;
}

export interface NormalizedSaju {
  birth: {
    solarDate: string;
    inputDate: string;
    calendar: CalendarType;
    gender: Gender;
    birthTime?: string;
    timezone: string;
    birthTimeUnknown: boolean;
  };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour?: Pillar;
  };
  dayMaster: { stem: string; element: FiveElement; yinYang: YinYang };
  hiddenStems: HiddenStemInfo[];
  tenGods: TenGodInfo[];
  twelveStages: TwelveStageInfo[];
  elementDistribution: Record<FiveElement, number>;
  relations: {
    combinations: Relation[];
    clashes: Relation[];
    punishments: Relation[];
    harms: Relation[];
    breaks: Relation[];
  };
  relationSals: CanonicalRelationSal[];
  daeun: DaeunPeriod[];
  currentDaeun?: DaeunPeriod;
  daeunMeta: { direction: "forward" | "backward"; startAge: number; startAgePrecise: number };
  seyun: SeyunPeriod[];
  wolun: WolunPeriod[];
  seasonal: {
    monthBranch: string;
    season: "spring" | "summer" | "autumn" | "winter";
  };
}

export interface LegacySsajuAnalysis {
  ssajuDayStrength: SajuResult["advanced"]["dayStrength"];
  ssajuGeukguk: SajuResult["advanced"]["geukguk"];
  ssajuYongsin: SajuResult["advanced"]["yongsin"];
  ssajuInterpretation: SajuResult["advanced"]["interpretation"];
  ssajuSinsal: SajuResult["advanced"]["sinsal"];
}
