import type { FiveElement, Gender, HiddenStemRole, PillarPosition } from "../saju/types";
import type { GeukgukCandidateType, StrengthLevel } from "./types";

export interface GoldenSource {
  id?: string;
  type: "manse_calculator" | "book" | "expert" | "manual_review" | "other";
  name: string;
  reference?: string;
  result?: string;
  checkedAt?: string;
  notes?: string;
}

export interface GoldenReferenceResult {
  sourceId: string;
  yearPillar?: string;
  monthPillar?: string;
  dayPillar?: string;
  hourPillar?: string;
  hiddenStems?: GoldenHiddenStem[];
  tenGods?: GoldenTenGod[];
  daeunDirection?: "forward" | "backward";
  daeunStartAge?: number;
}

export interface GoldenHiddenStem {
  pillar: PillarPosition;
  stem: string;
  layer: HiddenStemRole;
}

export interface GoldenTenGod {
  pillar: PillarPosition;
  target: "stem" | "branch";
  name: string;
}

export interface GoldenStructuralRoot {
  branch: string;
  stem: string;
  depth: HiddenStemRole;
  pillar?: PillarPosition;
  sourceIds?: string[];
}

export interface GoldenExposedStem {
  hiddenStem: string;
  exposedStem: string;
  position: PillarPosition;
  sourceIds?: string[];
}

export interface GoldenRelation {
  kind: "combination" | "clash" | "punishment" | "break" | "harm";
  description: string;
  sourceIds?: string[];
}

export interface GoldenCase {
  id: string;
  birth: {
    date: string;
    time?: string;
    calendar: "solar" | "lunar";
    gender?: Gender;
    timezone?: string;
    locationNote?: string;
  };
  expected: {
    deterministic?: {
      yearPillar?: string;
      monthPillar?: string;
      dayPillar?: string;
      hourPillar?: string;
      hiddenStems?: GoldenHiddenStem[];
      tenGods?: GoldenTenGod[];
      daeunDirection?: "forward" | "backward";
      daeunStartAge?: number;
    };
    structural?: {
      deukryeong?: boolean | "uncertain";
      roots?: Array<GoldenHiddenStem | GoldenStructuralRoot>;
      exposedStems?: string[];
      exposures?: GoldenExposedStem[];
      relations?: string[];
      relationDetails?: GoldenRelation[];
      season?: "spring" | "summer" | "autumn" | "winter";
    };
    interpretive?: {
      strength?: { allowedLevels: StrengthLevel[]; consensus?: number; sourceIds?: string[] };
      geukguk?: { acceptedCandidates: GeukgukCandidateType[]; rejectedCandidates?: GeukgukCandidateType[]; sourceIds?: string[] };
      johu?: { preferredElements?: FiveElement[]; sourceIds?: string[] };
      eokbu?: { preferredElements?: FiveElement[]; sourceIds?: string[] };
    };
  };
  verification: {
    status: "unverified" | "cross_checked" | "expert_verified";
    sources: GoldenSource[];
    notes?: string;
  };
  referenceResults?: GoldenReferenceResult[];
  notes?: string;
}

export function validateGoldenCaseDefinition(goldenCase: GoldenCase) {
  const errors: string[] = [];
  if (!goldenCase.id.trim()) errors.push("Golden Case ID가 필요합니다.");
  if (goldenCase.verification.status === "expert_verified" && !goldenCase.verification.sources.some((source) => source.type === "expert")) {
    errors.push("expert_verified 사례에는 expert 출처가 하나 이상 필요합니다.");
  }
  if (goldenCase.verification.status === "cross_checked" && goldenCase.verification.sources.length < 2) {
    errors.push("cross_checked 사례에는 독립 출처가 최소 2개 필요합니다.");
  }
  if (goldenCase.verification.sources.some((source) => !source.name.trim())) errors.push("모든 Golden Source에는 이름이 필요합니다.");
  return { valid: errors.length === 0, errors };
}
