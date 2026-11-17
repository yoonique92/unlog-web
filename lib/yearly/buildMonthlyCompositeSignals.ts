import type { CanonicalRelationName } from "../saju/canonicalRelationEvaluator";
import { buildYearlyMonthlySignals } from "./interpretationRules/monthly";
import {
  TEN_GOD_OVERALL_RULES,
  TWELVE_STAGE_OVERALL_RULES,
} from "./interpretationRules/overall";
import type {
  CanonicalTransitRelation,
  MonthlyCompositeFacts,
  MonthlyCompositeSignal,
  MonthlyCompositeSignalKind,
  MonthlyCompositeSignalSource,
  MonthlyCompositeSignals,
  YearlyActivityPhase,
} from "./types";

export const MONTHLY_COMPOSITE_RULES_VERSION = "monthly-composite-rules-v1" as const;

const CORE_PRIORITY = {
  stem: 600,
  branch: 590,
  stage: 110,
  twelveSal: 100,
} as const;

export const RELATION_SIGNAL_RULES: Record<
  CanonicalRelationName,
  { kind: MonthlyCompositeSignalKind; theme: string }
> = {
  천간합: { kind: "connection", theme: "stem_connection" },
  육합: { kind: "connection", theme: "branch_connection" },
  삼합: { kind: "connection", theme: "three_branch_integration" },
  방합: { kind: "connection", theme: "seasonal_branch_integration" },
  반합: { kind: "connection", theme: "partial_branch_connection" },
  천간충: { kind: "tension", theme: "stem_contrast" },
  충: { kind: "tension", theme: "branch_contrast" },
  형: { kind: "friction", theme: "repeated_pressure" },
  자형: { kind: "friction", theme: "repeated_self_pressure" },
  해: { kind: "friction", theme: "subtle_mismatch" },
  파: { kind: "adjustment", theme: "disruption_adjustment" },
};

const RELATION_SOURCE_PRIORITY: Record<
  Exclude<MonthlyCompositeSignalSource, "monthly_core">,
  number
> = {
  natal_monthly: 500,
  annual_monthly: 400,
  daeun_monthly: 300,
  annual_daeun_monthly: 200,
};

function sourcePrefix(source: MonthlyCompositeSignalSource) {
  return source.replaceAll("_", "-");
}

function relationSignal(
  displayMonth: MonthlyCompositeFacts["calendar"]["displayMonth"],
  source: Exclude<MonthlyCompositeSignalSource, "monthly_core">,
  relation: CanonicalTransitRelation,
): MonthlyCompositeSignal {
  const rule = RELATION_SIGNAL_RULES[relation.relationType];
  const natalMember = relation.members.find(({ layer }) => layer === "natal");
  const location = natalMember?.pillarPosition
    ? `natal_${natalMember.pillarPosition}_${natalMember.elementType}_`
    : "";

  return {
    id: `monthly-composite-${String(displayMonth).padStart(2, "0")}-${sourcePrefix(source)}-${relation.id}`,
    displayMonth,
    source,
    kind: rule.kind,
    theme: source === "annual_daeun_monthly"
      ? `multi_layer_${rule.theme}`
      : `${location}${rule.theme}`,
    priority: RELATION_SOURCE_PRIORITY[source],
    evidence: [{
      source: "canonical_relation",
      value: relation.relationType,
      valueId: relation.id,
      relationSource: relation.source,
      members: relation.members,
    }],
  };
}

function tenGodId(value: string) {
  return TEN_GOD_OVERALL_RULES[value as keyof typeof TEN_GOD_OVERALL_RULES]?.id;
}

function phase(value: string): YearlyActivityPhase | undefined {
  return TWELVE_STAGE_OVERALL_RULES[
    value as keyof typeof TWELVE_STAGE_OVERALL_RULES
  ]?.phase;
}

function contextSignal(
  facts: MonthlyCompositeFacts,
  layer: "annual" | "daeun",
): MonthlyCompositeSignal | null {
  const period = layer === "annual" ? facts.annual.period : facts.daeun.period;
  if (!period) return null;
  const relations = layer === "annual"
    ? facts.interactions.annualMonthly
    : facts.interactions.daeunMonthly;
  const relationKinds = new Set(relations.map(({ kind }) => kind));
  const backgroundIds = [tenGodId(period.stemTenGod), tenGodId(period.branchTenGod)];
  const monthlyIds = [
    tenGodId(facts.monthly.period.stemTenGod),
    tenGodId(facts.monthly.period.branchTenGod),
  ];
  const hasSharedTheme = backgroundIds.some(
    (id) => id !== undefined && monthlyIds.includes(id),
  );
  const backgroundPhase = phase(period.stage12);
  const monthlyPhase = phase(facts.monthly.period.stage12);

  let kind: MonthlyCompositeSignalKind = "change";
  let theme = layer === "annual" ? "annual_theme_redirected" : "temporary_transition";
  if (relationKinds.has("clash")) {
    kind = "tension";
    theme = layer === "annual" ? "annual_theme_contrasted" : "long_term_theme_contrasted";
  } else if (relationKinds.has("punishment") || relationKinds.has("harm")) {
    kind = "friction";
    theme = layer === "annual" ? "annual_pressure_intensified" : "pressure_overlap";
  } else if (relationKinds.has("combination") || hasSharedTheme) {
    kind = "connection";
    theme = layer === "annual" ? "annual_theme_reinforced" : "long_term_theme_reinforced";
  } else if (relationKinds.has("break")) {
    kind = "adjustment";
    theme = layer === "annual" ? "annual_theme_redirected" : "temporary_transition";
  } else if (backgroundPhase && backgroundPhase === monthlyPhase) {
    kind = "stability";
    theme = layer === "annual" ? "annual_pace_supported" : "stability_support";
  }

  const source = `${layer}_monthly` as const;
  return {
    id: `monthly-composite-${String(facts.calendar.displayMonth).padStart(2, "0")}-${sourcePrefix(source)}-context-${theme}`,
    displayMonth: facts.calendar.displayMonth,
    source,
    kind,
    theme,
    ...(monthlyPhase ? { activityPhase: monthlyPhase } : {}),
    priority: RELATION_SOURCE_PRIORITY[source] + 10,
    evidence: [
      {
        source: `${layer}_context`,
        value: `${period.stemTenGod}/${period.branchTenGod}/${period.stage12}`,
        valueId: `${backgroundIds.join("-")}/${backgroundPhase ?? "unknown"}`,
      },
      {
        source: "monthly_stage",
        value: facts.monthly.period.stage12,
        valueId: monthlyPhase ?? "unknown",
      },
    ],
  };
}

function monthlyCoreSignals(facts: MonthlyCompositeFacts): MonthlyCompositeSignal[] {
  const displayMonth = facts.calendar.displayMonth;
  const result = buildYearlyMonthlySignals([{
    period: { ...facts.monthly.period, month: displayMonth },
    twelveSalId: facts.monthly.twelveSalId,
  }]).months[0].signals;

  return result.map((signal) => {
    const priority = signal.id.includes("-stem-")
      ? CORE_PRIORITY.stem
      : signal.id.includes("-branch-")
        ? CORE_PRIORITY.branch
        : signal.id.includes("-stage-")
          ? CORE_PRIORITY.stage
          : CORE_PRIORITY.twelveSal;
    return {
      id: signal.id.replace("monthly-", "monthly-composite-"),
      displayMonth,
      source: "monthly_core" as const,
      kind: signal.kind,
      theme: signal.theme,
      ...(signal.activityPhase ? { activityPhase: signal.activityPhase } : {}),
      priority,
      evidence: signal.evidence,
    };
  });
}

export function buildMonthlyCompositeSignals(
  factsByMonth: MonthlyCompositeFacts[],
): MonthlyCompositeSignals {
  return {
    version: MONTHLY_COMPOSITE_RULES_VERSION,
    months: factsByMonth.map((facts) => {
      const candidates: Array<MonthlyCompositeSignal | null> = [
        ...monthlyCoreSignals(facts),
        ...facts.interactions.natalMonthly.map((relation) =>
          relationSignal(facts.calendar.displayMonth, "natal_monthly", relation)),
        contextSignal(facts, "annual"),
        ...facts.interactions.annualMonthly.map((relation) =>
          relationSignal(facts.calendar.displayMonth, "annual_monthly", relation)),
        contextSignal(facts, "daeun"),
        ...facts.interactions.daeunMonthly.map((relation) =>
          relationSignal(facts.calendar.displayMonth, "daeun_monthly", relation)),
        ...facts.interactions.annualDaeunMonthly.map((relation) =>
          relationSignal(facts.calendar.displayMonth, "annual_daeun_monthly", relation)),
      ];
      const deduped = new Map<string, MonthlyCompositeSignal>();
      for (const signal of candidates) {
        if (signal && !deduped.has(signal.id)) deduped.set(signal.id, signal);
      }
      return {
        displayMonth: facts.calendar.displayMonth,
        signals: [...deduped.values()].sort(
          (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
        ),
      };
    }),
  };
}
