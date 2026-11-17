import type { TwelveSalId } from "../../saju/salCalculator";
import type {
  YearlyInterpretationEvidenceSource,
  YearlyActivityPhase,
  YearlyInterpretationFacts,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

export type TenGodId =
  | "bigyeon"
  | "geopjae"
  | "siksin"
  | "sanggwan"
  | "pyeonjae"
  | "jeongjae"
  | "pyeongwan"
  | "jeonggwan"
  | "pyeonin"
  | "jeongin";

interface SignalMetadata {
  theme: string;
  kind: YearlyOverallSignalKind;
}

interface TenGodMetadata extends SignalMetadata {
  id: TenGodId;
}

interface StageMetadata extends SignalMetadata {
  id: string;
  phase: YearlyActivityPhase;
}

export const TEN_GOD_OVERALL_RULES = {
  비견: { id: "bigyeon", theme: "self_direction", kind: "theme" },
  겁재: { id: "geopjae", theme: "competition", kind: "change" },
  식신: { id: "siksin", theme: "creation", kind: "momentum" },
  상관: { id: "sanggwan", theme: "expression", kind: "change" },
  편재: { id: "pyeonjae", theme: "opportunity", kind: "change" },
  정재: { id: "jeongjae", theme: "stewardship", kind: "stability" },
  편관: { id: "pyeongwan", theme: "pressure", kind: "caution" },
  정관: { id: "jeonggwan", theme: "structure", kind: "stability" },
  편인: { id: "pyeonin", theme: "exploration", kind: "change" },
  정인: { id: "jeongin", theme: "learning", kind: "theme" },
} as const satisfies Record<string, TenGodMetadata>;

export const TWELVE_STAGE_OVERALL_RULES = {
  장생: { id: "jangsaeng", phase: "emerging", theme: "initiation", kind: "momentum" },
  목욕: { id: "mogyok", phase: "emerging", theme: "adaptation", kind: "change" },
  관대: { id: "gwandae", phase: "expanding", theme: "development", kind: "momentum" },
  건록: { id: "geonrok", phase: "stabilizing", theme: "foundation", kind: "stability" },
  제왕: { id: "jewang", phase: "peaking", theme: "intensity", kind: "momentum" },
  쇠: { id: "soe", phase: "contracting", theme: "adjustment", kind: "caution" },
  병: { id: "byeong", phase: "contracting", theme: "maintenance", kind: "caution" },
  사: { id: "sa", phase: "resetting", theme: "completion", kind: "change" },
  묘: { id: "myo", phase: "resetting", theme: "consolidation", kind: "stability" },
  절: { id: "jeol", phase: "resetting", theme: "transition", kind: "change" },
  태: { id: "tae", phase: "emerging", theme: "potential", kind: "theme" },
  양: { id: "yang", phase: "expanding", theme: "preparation", kind: "momentum" },
} as const satisfies Record<string, StageMetadata>;

export const TWELVE_SAL_OVERALL_RULES = {
  twelve_geop_sal: { theme: "disruption", kind: "change" },
  twelve_jae_sal: { theme: "pressure", kind: "caution" },
  twelve_cheong_sal: { theme: "external_change", kind: "change" },
  twelve_ji_sal: { theme: "movement", kind: "change" },
  twelve_nyeon_sal: { theme: "visibility", kind: "theme" },
  twelve_wol_sal: { theme: "constraint", kind: "caution" },
  twelve_mangsin_sal: { theme: "exposure", kind: "caution" },
  twelve_jangseong_sal: { theme: "leadership", kind: "momentum" },
  twelve_banan_sal: { theme: "settlement", kind: "stability" },
  twelve_yeokma_sal: { theme: "mobility", kind: "change" },
  twelve_yukhae_sal: { theme: "friction", kind: "caution" },
  twelve_hwagae_sal: { theme: "introspection", kind: "theme" },
} as const satisfies Record<TwelveSalId, SignalMetadata>;

function tenGodSignal(
  sourcePrefix: "annual-stem" | "annual-branch" | "daeun-stem" | "daeun-branch",
  source: YearlyInterpretationEvidenceSource,
  value: string,
  priority: number,
): YearlyInterpretationSignal | null {
  const metadata = TEN_GOD_OVERALL_RULES[value as keyof typeof TEN_GOD_OVERALL_RULES];
  if (!metadata) return null;

  return {
    id: `${sourcePrefix}-${metadata.id}`,
    section: "overall",
    kind: metadata.kind,
    theme: metadata.theme,
    priority,
    evidence: [{ source, value, valueId: metadata.id }],
  };
}

export function buildOverallSignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignal[] {
  const signals: Array<YearlyInterpretationSignal | null> = [
    tenGodSignal(
      "annual-stem",
      "annual_stem_ten_god",
      facts.annual.period.stemTenGod,
      100,
    ),
    tenGodSignal(
      "annual-branch",
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
      id: `annual-stage-${stage.id}`,
      section: "overall",
      kind: stage.kind,
      theme: stage.theme,
      activityPhase: stage.phase,
      priority: 90,
      evidence: [{ source: "annual_stage", value: facts.annual.period.stage12, valueId: stage.id }],
    });
  }
  if (facts.annual.twelveSalId) {
    const sal = TWELVE_SAL_OVERALL_RULES[facts.annual.twelveSalId];
    signals.push({
      id: `annual-twelve-sal-${facts.annual.twelveSalId}`,
      section: "overall",
      kind: sal.kind,
      theme: sal.theme,
      priority: 85,
      evidence: [{ source: "annual_twelve_sal", value: facts.annual.twelveSalId, valueId: facts.annual.twelveSalId }],
    });
  }
  if (facts.daeun.period) {
    signals.push(
      tenGodSignal(
        "daeun-stem",
        "target_daeun_stem_ten_god",
        facts.daeun.period.stemTenGod,
        75,
      ),
      tenGodSignal(
        "daeun-branch",
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
