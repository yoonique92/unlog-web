import type {
  YearlyActivityPhase,
  YearlyInterpretationEvidenceSource,
  YearlyInterpretationFacts,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";
import {
  TWELVE_STAGE_OVERALL_RULES,
  type TenGodId,
} from "./overall";

interface ConditionTenGodMetadata {
  id: TenGodId;
  theme: string;
  kind: YearlyOverallSignalKind;
}

/** Daily pace metadata only; none of these rules represent medical conditions. */
export const TEN_GOD_CONDITION_RULES = {
  비견: { id: "bigyeon", theme: "self_pacing", kind: "theme" },
  겁재: { id: "geopjae", theme: "competing_demands", kind: "caution" },
  식신: { id: "siksin", theme: "steady_output", kind: "momentum" },
  상관: { id: "sanggwan", theme: "expressive_activity", kind: "change" },
  편재: { id: "pyeonjae", theme: "changing_demands", kind: "change" },
  정재: { id: "jeongjae", theme: "routine_management", kind: "stability" },
  편관: { id: "pyeongwan", theme: "pressure_load", kind: "caution" },
  정관: { id: "jeonggwan", theme: "structured_routine", kind: "stability" },
  편인: { id: "pyeonin", theme: "mental_switching", kind: "change" },
  정인: { id: "jeongin", theme: "recovery_support", kind: "stability" },
} as const satisfies Record<string, ConditionTenGodMetadata>;

export const CONDITION_THEME_BY_ACTIVITY_PHASE = {
  emerging: "pace_start",
  expanding: "pace_expansion",
  peaking: "pace_focus",
  stabilizing: "pace_consistency",
  contracting: "pace_reduction",
  resetting: "pace_reset",
} as const satisfies Record<YearlyActivityPhase, string>;

function conditionTenGodSignal(
  idPrefix:
    | "condition-annual-stem"
    | "condition-annual-branch"
    | "condition-daeun-stem"
    | "condition-daeun-branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyInterpretationSignal | null {
  const metadata = TEN_GOD_CONDITION_RULES[
    value as keyof typeof TEN_GOD_CONDITION_RULES
  ];
  if (!metadata) return null;

  return {
    id: `${idPrefix}-${metadata.id}`,
    section: "condition",
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

export function buildConditionSignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignal[] {
  const signals: Array<YearlyInterpretationSignal | null> = [
    conditionTenGodSignal(
      "condition-annual-stem",
      "annual_stem_ten_god",
      facts.annual.period.stemTenGod,
      100,
    ),
    conditionTenGodSignal(
      "condition-annual-branch",
      "annual_branch_ten_god",
      facts.annual.period.branchTenGod,
      95,
    ),
  ];
  const stage = TWELVE_STAGE_OVERALL_RULES[
    facts.annual.period.stage12 as keyof typeof TWELVE_STAGE_OVERALL_RULES
  ];
  if (stage) {
    signals.push({
      id: `condition-stage-${stage.id}`,
      section: "condition",
      kind: stage.kind,
      theme: CONDITION_THEME_BY_ACTIVITY_PHASE[stage.phase],
      activityPhase: stage.phase,
      priority: 90,
      evidence: [{
        source: "annual_stage",
        value: facts.annual.period.stage12,
        valueId: stage.id,
      }],
    });
  }
  if (facts.daeun.period) {
    signals.push(
      conditionTenGodSignal(
        "condition-daeun-stem",
        "target_daeun_stem_ten_god",
        facts.daeun.period.stemTenGod,
        75,
      ),
      conditionTenGodSignal(
        "condition-daeun-branch",
        "target_daeun_branch_ten_god",
        facts.daeun.period.branchTenGod,
        70,
      ),
    );
  }

  const deduped = new Map<string, YearlyInterpretationSignal>();
  for (const signal of signals) {
    if (signal && !deduped.has(signal.id)) deduped.set(signal.id, signal);
  }
  return [...deduped.values()].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  );
}
