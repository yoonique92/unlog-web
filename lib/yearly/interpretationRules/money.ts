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

interface MoneyTenGodMetadata {
  id: TenGodId;
  theme: string;
  kind: YearlyOverallSignalKind;
}

export const TEN_GOD_MONEY_RULES = {
  비견: { id: "bigyeon", theme: "self_resource_control", kind: "theme" },
  겁재: { id: "geopjae", theme: "resource_sharing_pressure", kind: "caution" },
  식신: { id: "siksin", theme: "value_creation", kind: "momentum" },
  상관: { id: "sanggwan", theme: "value_expression_variability", kind: "change" },
  편재: { id: "pyeonjae", theme: "flexible_opportunity", kind: "change" },
  정재: { id: "jeongjae", theme: "resource_stewardship", kind: "stability" },
  편관: { id: "pyeongwan", theme: "obligation_pressure", kind: "caution" },
  정관: { id: "jeonggwan", theme: "resource_structure", kind: "stability" },
  편인: { id: "pyeonin", theme: "indirect_value_exploration", kind: "change" },
  정인: { id: "jeongin", theme: "resource_accumulation", kind: "stability" },
} as const satisfies Record<string, MoneyTenGodMetadata>;

export const MONEY_THEME_BY_ACTIVITY_PHASE = {
  emerging: "resource_setup",
  expanding: "resource_expansion",
  peaking: "resource_focus",
  stabilizing: "resource_management",
  contracting: "resource_adjustment",
  resetting: "resource_reorganization",
} as const satisfies Record<YearlyActivityPhase, string>;

function moneyTenGodSignal(
  idPrefix: "money-annual-stem" | "money-annual-branch" | "money-daeun-stem" | "money-daeun-branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyInterpretationSignal | null {
  const metadata = TEN_GOD_MONEY_RULES[value as keyof typeof TEN_GOD_MONEY_RULES];
  if (!metadata) return null;

  return {
    id: `${idPrefix}-${metadata.id}`,
    section: "money",
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

export function buildMoneySignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignal[] {
  const signals: Array<YearlyInterpretationSignal | null> = [
    moneyTenGodSignal(
      "money-annual-stem",
      "annual_stem_ten_god",
      facts.annual.period.stemTenGod,
      100,
    ),
    moneyTenGodSignal(
      "money-annual-branch",
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
      id: `money-stage-${stage.id}`,
      section: "money",
      kind: stage.kind,
      theme: MONEY_THEME_BY_ACTIVITY_PHASE[stage.phase],
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
      moneyTenGodSignal(
        "money-daeun-stem",
        "target_daeun_stem_ten_god",
        facts.daeun.period.stemTenGod,
        75,
      ),
      moneyTenGodSignal(
        "money-daeun-branch",
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
