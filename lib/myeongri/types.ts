import type { SajuResult } from "ssaju";
import type { FiveElement, LegacySsajuAnalysis, NormalizedSaju } from "../saju/types";

export type EvidenceType =
  | "month_command" | "root" | "support" | "drain" | "control"
  | "relation" | "season" | "daeun" | "seyun" | "natal";

export interface Evidence {
  id: string;
  ruleId: string;
  type: EvidenceType;
  source: string;
  description: string;
  technicalDescription?: string;
  weight?: number;
}

export interface RuleMetadata {
  id: string;
  school: "ziping" | "ditiansui" | "qiongtong" | "unlog" | "unverified";
  sourceTitle?: string;
  sourceSection?: string;
  status: "structural" | "provisional" | "verified";
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export type FindingCategory =
  | "personality" | "career" | "money" | "relationship" | "wellness"
  | "change" | "energy" | "stability" | "expression" | "independence" | "stress";

export interface Finding {
  id: string;
  category: FindingCategory;
  title: string;
  summary: string;
  score: number;
  confidence: number;
  evidence: Evidence[];
  period?: { from?: string; to?: string };
  tension?: {
    sideA: string;
    sideB: string;
    interpretation: string;
  };
}

export type StrengthLevel =
  | "very_weak" | "weak" | "balanced_weak" | "balanced"
  | "balanced_strong" | "strong" | "very_strong";

export interface StrengthFactor {
  level: "strong" | "medium" | "weak";
  score: number;
  evidence: Evidence[];
}

export interface StrengthContribution {
  ruleId: string;
  category: "month_command" | "root" | "peer" | "resource" | "output" | "wealth" | "officer" | "relation_adjustment";
  source: string;
  sourceKey?: string;
  rawWeight: number;
  adjustedWeight: number;
  reason: string;
}

export interface StrengthAnalysis {
  level: StrengthLevel;
  internalScore: number;
  distanceFromBoundary: number;
  confidence: number;
  contributions: StrengthContribution[];
  factors: {
    deukryeong: StrengthFactor;
    deukji: StrengthFactor;
    deukse: StrengthFactor;
    support: number;
    drain: number;
    control: number;
  };
  evidence: Evidence[];
}

export interface JohuAnalysis {
  climate: { cold: number; hot: number; dry: number; wet: number };
  needs: { warming: number; cooling: number; drying: number; moistening: number };
  preferredElements: Array<{ element: FiveElement; reason: string; priority: number }>;
  confidence: number;
  evidence: Evidence[];
}

export type GeukgukCandidateType = "jeonggwan" | "pyeongwan" | "jeongjae" | "pyeonjae" | "jeongin" | "pyeonin" | "siksin" | "sanggwan" | "geonrok" | "yangin" | "other";

export interface MonthCommandAnalysis {
  monthBranch: string;
  hiddenStems: Array<{
    stem: string;
    layer: "main" | "middle" | "residual";
    tenGod: string;
    exposed: boolean;
    rooted: boolean;
  }>;
  evidence: Evidence[];
}

export interface GeukgukCandidate {
  type: GeukgukCandidateType;
  score: number;
  confidence: number;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
  status: "possible" | "probable" | "uncertain";
}

export interface SpecialPatternCandidate {
  type: "follow_weak_candidate" | "follow_strong_candidate" | "transformation_candidate";
  confidence: number;
  status: "needs_review";
  evidence: Evidence[];
}

export interface GeukgukAnalysis {
  status: "candidate" | "uncertain" | "not_enough_evidence";
  monthCommand: MonthCommandAnalysis;
  candidates: GeukgukCandidate[];
  primaryCandidate?: GeukgukCandidateType;
  specialPatternCandidates: SpecialPatternCandidate[];
  evidence: Evidence[];
  confidence: number;
}

export interface EokbuCandidate {
  element: FiveElement;
  role: "support" | "drain" | "control" | "bridge";
  score: number;
  confidence: number;
  supportingEvidence: Evidence[];
  risks: string[];
}

export interface EokbuAnalysis {
  status: "candidate" | "uncertain";
  candidates: EokbuCandidate[];
  avoidCandidates?: Array<{ element: FiveElement; reason: string }>;
  confidence: number;
}

export interface YongsinAnalysis {
  status: "candidate_only" | "insufficient_evidence";
  eokbu: EokbuAnalysis;
  johu: JohuAnalysis;
  geukguk?: { status: "not_implemented" | "candidate"; candidates: GeukgukCandidate[] };
  crossAgreement: Array<{
    element: FiveElement;
    sources: Array<"eokbu" | "johu" | "geukguk">;
    confidence: number;
  }>;
}

export interface TimelineFinding extends Finding {
  year: number;
  influence: { natal: number; daeun: number; seyun: number };
}

export interface UnlogAnalysis {
  strength: StrengthAnalysis;
  johu: JohuAnalysis;
  geukguk: GeukgukAnalysis;
  yongsin: YongsinAnalysis;
  natalFindings: Finding[];
  timelineFindings: TimelineFinding[];
}

export interface UnlogSajuAnalysisResult {
  normalizedSaju: NormalizedSaju;
  gongmang: SajuResult["gongmang"];
  calculationPolicy: {
    timeAdjustment: "KOREA_MINUS_30_V1";
    dayBoundary: "ZI_START_NEXT_DAY_V1";
    applied: boolean;
    actualAdjustedDateTime: string;
    actualSolarDate: string;
    effectiveDayDate: string;
  };
  legacyAnalysis: LegacySsajuAnalysis;
  analysis: UnlogAnalysis;
  readingContext: import("../reading/types").ReadingContext;
}
