import type { TwelveSalId } from "../../saju/salCalculator";
import {
  YEARLY_INTERPRETATION_RULES_VERSION,
} from "../buildYearlyInterpretationSignals";
import type {
  YearlyInterpretationEvidenceSource,
  YearlyInterpretationFacts,
  YearlyMonthlySignal,
  YearlyMonthlySignals,
  YearlyOverallSignalKind,
} from "../types";
import {
  TWELVE_SAL_OVERALL_RULES,
  TWELVE_STAGE_OVERALL_RULES,
  type TenGodId,
} from "./overall";

interface MonthlyTenGodMetadata {
  id: TenGodId;
  theme: string;
  kind: YearlyOverallSignalKind;
}

export const TEN_GOD_MONTHLY_RULES = {
  비견: { id: "bigyeon", theme: "self_direction", kind: "theme" },
  겁재: { id: "geopjae", theme: "competing_priorities", kind: "change" },
  식신: { id: "siksin", theme: "output", kind: "momentum" },
  상관: { id: "sanggwan", theme: "expression", kind: "change" },
  편재: { id: "pyeonjae", theme: "external_opportunity", kind: "change" },
  정재: { id: "jeongjae", theme: "practical_management", kind: "stability" },
  편관: { id: "pyeongwan", theme: "pressure", kind: "caution" },
  정관: { id: "jeonggwan", theme: "structure", kind: "stability" },
  편인: { id: "pyeonin", theme: "exploration", kind: "change" },
  정인: { id: "jeongin", theme: "learning_support", kind: "theme" },
} as const satisfies Record<string, MonthlyTenGodMetadata>;

function monthPrefix(month: number) {
  return `monthly-${String(month).padStart(2, "0")}`;
}

function monthlyTenGodSignal(
  month: number,
  position: "stem" | "branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyMonthlySignal | null {
  const metadata = TEN_GOD_MONTHLY_RULES[
    value as keyof typeof TEN_GOD_MONTHLY_RULES
  ];
  if (!metadata) return null;

  return {
    id: `${monthPrefix(month)}-${position}-${metadata.id}`,
    month,
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

function monthlyStageSignal(
  month: number,
  stageValue: string,
): YearlyMonthlySignal | null {
  const metadata = TWELVE_STAGE_OVERALL_RULES[
    stageValue as keyof typeof TWELVE_STAGE_OVERALL_RULES
  ];
  if (!metadata) return null;

  return {
    id: `${monthPrefix(month)}-stage-${metadata.id}`,
    month,
    kind: metadata.kind,
    theme: metadata.theme,
    activityPhase: metadata.phase,
    priority: 90,
    evidence: [{ source: "monthly_stage", value: stageValue, valueId: metadata.id }],
  };
}

function monthlyTwelveSalSignal(
  month: number,
  twelveSalId: TwelveSalId | null,
): YearlyMonthlySignal | null {
  if (!twelveSalId) return null;
  const metadata = TWELVE_SAL_OVERALL_RULES[twelveSalId];

  return {
    id: `${monthPrefix(month)}-twelve-sal-${twelveSalId}`,
    month,
    kind: metadata.kind,
    theme: metadata.theme,
    priority: 85,
    evidence: [{
      source: "monthly_twelve_sal",
      value: twelveSalId,
      valueId: twelveSalId,
    }],
  };
}

export function buildYearlyMonthlySignals(
  monthly: YearlyInterpretationFacts["monthly"],
): YearlyMonthlySignals {
  return {
    version: YEARLY_INTERPRETATION_RULES_VERSION,
    months: monthly.map(({ period, twelveSalId }) => {
      const candidates: Array<YearlyMonthlySignal | null> = [
        monthlyTenGodSignal(
          period.month,
          "stem",
          "monthly_stem_ten_god",
          period.stemTenGod,
          100,
        ),
        monthlyTenGodSignal(
          period.month,
          "branch",
          "monthly_branch_ten_god",
          period.branchTenGod,
          95,
        ),
        monthlyStageSignal(period.month, period.stage12),
        monthlyTwelveSalSignal(period.month, twelveSalId),
      ];
      const deduped = new Map<string, YearlyMonthlySignal>();
      for (const signal of candidates) {
        if (signal && !deduped.has(signal.id)) deduped.set(signal.id, signal);
      }

      return {
        month: period.month,
        signals: [...deduped.values()].sort(
          (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
        ),
      };
    }),
  };
}
