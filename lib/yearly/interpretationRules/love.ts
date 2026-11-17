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

interface LoveTenGodMetadata {
  id: TenGodId;
  theme: string;
  kind: YearlyOverallSignalKind;
}

/** Neutral relationship dynamics; these are not partner or outcome predictions. */
export const TEN_GOD_LOVE_RULES = {
  비견: { id: "bigyeon", theme: "mutual_independence", kind: "theme" },
  겁재: { id: "geopjae", theme: "relationship_boundaries", kind: "caution" },
  식신: { id: "siksin", theme: "warm_expression", kind: "momentum" },
  상관: { id: "sanggwan", theme: "direct_expression", kind: "change" },
  편재: { id: "pyeonjae", theme: "social_openness", kind: "change" },
  정재: { id: "jeongjae", theme: "steady_care", kind: "stability" },
  편관: { id: "pyeongwan", theme: "relationship_pressure", kind: "caution" },
  정관: { id: "jeonggwan", theme: "trust_and_structure", kind: "stability" },
  편인: { id: "pyeonin", theme: "emotional_interpretation", kind: "change" },
  정인: { id: "jeongin", theme: "emotional_support", kind: "theme" },
} as const satisfies Record<string, LoveTenGodMetadata>;

export const LOVE_THEME_BY_ACTIVITY_PHASE = {
  emerging: "relationship_opening",
  expanding: "relationship_development",
  peaking: "relationship_focus",
  stabilizing: "relationship_grounding",
  contracting: "relationship_distance",
  resetting: "relationship_redefinition",
} as const satisfies Record<YearlyActivityPhase, string>;

function loveTenGodSignal(
  idPrefix: "love-annual-stem" | "love-annual-branch" | "love-daeun-stem" | "love-daeun-branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyInterpretationSignal | null {
  const metadata = TEN_GOD_LOVE_RULES[value as keyof typeof TEN_GOD_LOVE_RULES];
  if (!metadata) return null;

  return {
    id: `${idPrefix}-${metadata.id}`,
    section: "love",
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

export function buildLoveSignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignal[] {
  const signals: Array<YearlyInterpretationSignal | null> = [
    loveTenGodSignal(
      "love-annual-stem",
      "annual_stem_ten_god",
      facts.annual.period.stemTenGod,
      100,
    ),
    loveTenGodSignal(
      "love-annual-branch",
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
      id: `love-stage-${stage.id}`,
      section: "love",
      kind: stage.kind,
      theme: LOVE_THEME_BY_ACTIVITY_PHASE[stage.phase],
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
      loveTenGodSignal(
        "love-daeun-stem",
        "target_daeun_stem_ten_god",
        facts.daeun.period.stemTenGod,
        75,
      ),
      loveTenGodSignal(
        "love-daeun-branch",
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
