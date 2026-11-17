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

interface CareerTenGodMetadata {
  id: TenGodId;
  theme: string;
  kind: YearlyOverallSignalKind;
}

export const TEN_GOD_CAREER_RULES = {
  비견: { id: "bigyeon", theme: "autonomy", kind: "theme" },
  겁재: { id: "geopjae", theme: "collaboration_boundary", kind: "change" },
  식신: { id: "siksin", theme: "production", kind: "momentum" },
  상관: { id: "sanggwan", theme: "experimentation", kind: "change" },
  편재: { id: "pyeonjae", theme: "external_opportunity", kind: "change" },
  정재: { id: "jeongjae", theme: "practical_result", kind: "stability" },
  편관: { id: "pyeongwan", theme: "challenge_pressure", kind: "caution" },
  정관: { id: "jeonggwan", theme: "role_structure", kind: "stability" },
  편인: { id: "pyeonin", theme: "alternative_learning", kind: "change" },
  정인: { id: "jeongin", theme: "learning_support", kind: "theme" },
} as const satisfies Record<string, CareerTenGodMetadata>;

export const CAREER_THEME_BY_ACTIVITY_PHASE = {
  emerging: "career_start",
  expanding: "career_growth",
  peaking: "career_focus",
  stabilizing: "career_consolidation",
  contracting: "career_adjustment",
  resetting: "career_reorientation",
} as const satisfies Record<YearlyActivityPhase, string>;

function careerTenGodSignal(
  idPrefix: "career-annual-stem" | "career-annual-branch" | "career-daeun-stem" | "career-daeun-branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyInterpretationSignal | null {
  const metadata = TEN_GOD_CAREER_RULES[value as keyof typeof TEN_GOD_CAREER_RULES];
  if (!metadata) return null;

  return {
    id: `${idPrefix}-${metadata.id}`,
    section: "career",
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

export function buildCareerSignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignal[] {
  const signals: Array<YearlyInterpretationSignal | null> = [
    careerTenGodSignal(
      "career-annual-stem",
      "annual_stem_ten_god",
      facts.annual.period.stemTenGod,
      100,
    ),
    careerTenGodSignal(
      "career-annual-branch",
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
      id: `career-stage-${stage.id}`,
      section: "career",
      kind: stage.kind,
      theme: CAREER_THEME_BY_ACTIVITY_PHASE[stage.phase],
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
      careerTenGodSignal(
        "career-daeun-stem",
        "target_daeun_stem_ten_god",
        facts.daeun.period.stemTenGod,
        75,
      ),
      careerTenGodSignal(
        "career-daeun-branch",
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
