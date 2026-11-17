import type { SajuProfileRecord } from "../db/repositories/userRepository";
import type { getSaju } from "../saju";
import type {
  CanonicalRelationSal,
  DaeunPeriod,
  NormalizedSaju,
  PillarPosition,
  SeyunPeriod,
  WolunPeriod,
} from "../saju/types";
import type { SalId, TwelveSalId } from "../saju/salCalculator";
import type { CanonicalRelationName } from "../saju/canonicalRelationEvaluator";
import type {
  CareerSituationKey,
  LoveSituationKey,
} from "../yearlyReadingContext";

export type YearlyCalculationProfile = Pick<
  SajuProfileRecord,
  | "birthDate"
  | "birthHour"
  | "birthMinute"
  | "birthTimeUnknown"
  | "calendarType"
  | "gender"
>;

export interface YearlyCalculationSnapshotInput {
  profile: YearlyCalculationProfile;
  targetYear: number;
}

export interface YearlyCalculationSnapshot {
  targetYear: number;
  natal: {
    pillars: NormalizedSaju["pillars"];
    dayMaster: NormalizedSaju["dayMaster"];
    tenGods: NormalizedSaju["tenGods"];
    stages12: NormalizedSaju["twelveStages"];
    sals: ReturnType<typeof getSaju>["sals"];
    relationSals: CanonicalRelationSal[];
  };
  timing: {
    targetDaeun: DaeunPeriod | null;
    annual: SeyunPeriod;
    monthly: WolunPeriod[];
  };
}

export type CalendarMonth =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

export type SeasonalMonthOrdinal = CalendarMonth;

/** Maps a user-facing calendar month to the canonical seasonal month period. */
export interface MonthlyCalendarSlot {
  displayYear: number;
  displayMonth: CalendarMonth;
  seasonalYear: number;
  /** Canonical seasonal ordinal: 1=寅 ... 11=子, 12=丑. */
  seasonalOrdinal: SeasonalMonthOrdinal;
  period: WolunPeriod;
}

/** Calculation facts required by a future composite monthly interpretation. */
export interface MonthlyCompositeFacts {
  calendar: MonthlyCalendarSlot;
  natal: {
    dayMaster: NormalizedSaju["dayMaster"];
    pillars: NormalizedSaju["pillars"];
  };
  daeun: {
    period: DaeunPeriod | null;
  };
  annual: {
    period: SeyunPeriod;
    twelveSalId: TwelveSalId | null;
  };
  monthly: {
    period: WolunPeriod;
    twelveSalId: TwelveSalId | null;
  };
  interactions: {
    natalMonthly: CanonicalTransitRelation[];
    annualMonthly: CanonicalTransitRelation[];
    daeunMonthly: CanonicalTransitRelation[];
    annualDaeunMonthly: CanonicalTransitRelation[];
  };
}

export type TransitRelationSource =
  | "natal_monthly"
  | "annual_monthly"
  | "daeun_monthly"
  | "annual_daeun_monthly";

export type TransitRelationLayer = "natal" | "annual" | "daeun" | "monthly";

export interface CanonicalTransitRelationMember {
  layer: TransitRelationLayer;
  pillarPosition?: PillarPosition;
  symbol: string;
  elementType: "stem" | "branch";
}

export interface CanonicalTransitRelation {
  id: string;
  relationType: CanonicalRelationName;
  kind: "combination" | "clash" | "punishment" | "harm" | "break";
  source: TransitRelationSource;
  members: CanonicalTransitRelationMember[];
}

export type MonthlyCompositeSignalSource =
  | "monthly_core"
  | "annual_monthly"
  | "daeun_monthly"
  | "natal_monthly"
  | "annual_daeun_monthly";

export type MonthlyCompositeSignalKind =
  | YearlyOverallSignalKind
  | "tension"
  | "connection"
  | "friction"
  | "adjustment";

export type MonthlyCompositeEvidence =
  | YearlyInterpretationEvidence
  | {
      source: "annual_context" | "daeun_context";
      value: string;
      valueId: string;
    }
  | {
      source: "canonical_relation";
      value: CanonicalRelationName;
      valueId: string;
      relationSource: TransitRelationSource;
      members: CanonicalTransitRelationMember[];
    };

export interface MonthlyCompositeSignal {
  id: string;
  displayMonth: CalendarMonth;
  source: MonthlyCompositeSignalSource;
  kind: MonthlyCompositeSignalKind;
  theme: string;
  activityPhase?: YearlyActivityPhase;
  /** Deterministic presentation ordering only; never a fortune score. */
  priority: number;
  evidence: MonthlyCompositeEvidence[];
}

export interface MonthlyCompositeSignals {
  version: "monthly-composite-rules-v1";
  months: Array<{
    displayMonth: CalendarMonth;
    signals: MonthlyCompositeSignal[];
  }>;
}

export interface MonthlyFortuneCopy {
  version: "monthly-copy-v1";
  displayMonth: CalendarMonth;
  headline: string;
  body: string;
  tip: string;
  sourceSignalIds: string[];
}

export interface BuildYearlyInterpretationFactsInput {
  snapshot: YearlyCalculationSnapshot;
}

export interface YearlyInterpretationFacts {
  targetYear: number;
  natal: {
    dayMaster: NormalizedSaju["dayMaster"];
    /** Relation-level sals are excluded here and retained in relationSals. */
    salIdsByPosition: Record<PillarPosition, SalId[]>;
    relationSals: CanonicalRelationSal[];
  };
  daeun: {
    period: DaeunPeriod | null;
  };
  annual: {
    period: SeyunPeriod;
    twelveSalId: TwelveSalId | null;
  };
  monthly: Array<{
    period: WolunPeriod;
    twelveSalId: TwelveSalId | null;
  }>;
}

export type YearlyInterpretationEvidenceSource =
  | "annual_stem_ten_god"
  | "annual_branch_ten_god"
  | "annual_stage"
  | "annual_twelve_sal"
  | "target_daeun_stem_ten_god"
  | "target_daeun_branch_ten_god"
  | "monthly_stem_ten_god"
  | "monthly_branch_ten_god"
  | "monthly_stage"
  | "monthly_twelve_sal";

export interface YearlyInterpretationEvidence {
  source: YearlyInterpretationEvidenceSource;
  value: string;
  valueId: string;
}

export type YearlyOverallSignalKind =
  | "theme"
  | "momentum"
  | "change"
  | "stability"
  | "caution";

export type YearlyActivityPhase =
  | "emerging"
  | "expanding"
  | "peaking"
  | "stabilizing"
  | "contracting"
  | "resetting";

export interface YearlyInterpretationSignal {
  id: string;
  section: "overall" | "career" | "money" | "love" | "condition";
  kind: YearlyOverallSignalKind;
  theme: string;
  activityPhase?: YearlyActivityPhase;
  /** Deterministic presentation ordering metadata, not a fortune score. */
  priority: number;
  evidence: YearlyInterpretationEvidence[];
}

export interface YearlyInterpretationSignals {
  version: "yearly-rules-v1";
  overall: YearlyInterpretationSignal[];
  career: YearlyInterpretationSignal[];
  money: YearlyInterpretationSignal[];
  love: YearlyInterpretationSignal[];
  condition: YearlyInterpretationSignal[];
}

export interface YearlyMonthlySignal
  extends Omit<YearlyInterpretationSignal, "section"> {
  /** Canonical seasonal month ordinal: 1=寅 month ... 12=丑 month. */
  month: number;
}

export interface YearlyMonthlySignals {
  version: "yearly-rules-v1";
  months: Array<{
    month: number;
    signals: YearlyMonthlySignal[];
  }>;
}

export interface YearlyOverallCopy {
  version: "yearly-copy-v1";
  section: "overall";
  headline: string;
  body: string;
  tip: string;
  sourceSignalIds: string[];
}

export interface YearlyCareerCopy {
  version: "yearly-copy-v1";
  section: "career";
  headline: string;
  body: string;
  tip: string;
  context: CareerSituationKey;
  sourceSignalIds: string[];
}

export interface YearlyMoneyCopy {
  version: "yearly-copy-v1";
  section: "money";
  headline: string;
  body: string;
  tip: string;
  sourceSignalIds: string[];
}

export interface YearlyLoveCopy {
  version: "yearly-copy-v1";
  section: "love";
  headline: string;
  body: string;
  tip: string;
  context: LoveSituationKey;
  sourceSignalIds: string[];
}

export interface YearlyConditionCopy {
  version: "yearly-copy-v1";
  section: "condition";
  headline: string;
  body: string;
  tip: string;
  sourceSignalIds: string[];
}
