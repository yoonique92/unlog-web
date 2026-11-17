import { evaluateCanonicalRelations } from "../saju/canonicalRelationEvaluator";
import type { PillarPosition } from "../saju/types";
import type {
  CanonicalTransitRelation,
  CanonicalTransitRelationMember,
  MonthlyCompositeFacts,
  TransitRelationLayer,
  TransitRelationSource,
} from "./types";

interface TransitMemberInput extends CanonicalTransitRelationMember {
  key: string;
}

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];

function member(
  layer: TransitRelationLayer,
  symbol: string,
  elementType: "stem" | "branch",
  pillarPosition?: PillarPosition,
): TransitMemberInput {
  const location = pillarPosition ? `${layer}.${pillarPosition}` : layer;
  return {
    key: `${location}.${elementType}`,
    layer,
    pillarPosition,
    symbol,
    elementType,
  };
}

function natalMembers(
  facts: Pick<MonthlyCompositeFacts, "natal">,
  elementType: "stem" | "branch",
) {
  return POSITIONS.flatMap((position) => {
    const pillar = facts.natal.pillars[position];
    return pillar
      ? [member("natal", pillar[elementType], elementType, position)]
      : [];
  });
}

function evaluateTransitSet(input: {
  source: TransitRelationSource;
  stems: TransitMemberInput[];
  branches: TransitMemberInput[];
  requiredLayers: TransitRelationLayer[];
  minimumMemberCount?: number;
}): CanonicalTransitRelation[] {
  const membersByKey = new Map(
    [...input.stems, ...input.branches].map((entry) => [entry.key, entry]),
  );
  const evaluated = evaluateCanonicalRelations({
    stems: input.stems.map(({ key, symbol }) => ({ key, symbol })),
    branches: input.branches.map(({ key, symbol }) => ({ key, symbol })),
  });
  const relations = [
    ...evaluated.combinations,
    ...evaluated.clashes,
    ...evaluated.punishments,
    ...evaluated.harms,
    ...evaluated.breaks,
  ].filter((relation) => {
    if (relation.memberKeys.length < (input.minimumMemberCount ?? 2)) return false;
    return input.requiredLayers.every((layer) =>
      relation.memberKeys.some((key) => membersByKey.get(key)?.layer === layer),
    );
  });
  const seen = new Set<string>();

  return relations.flatMap((relation) => {
    const id = [input.source, relation.name, ...relation.memberKeys].join(":");
    if (seen.has(id)) return [];
    seen.add(id);

    return [{
      id,
      relationType: relation.name,
      kind: relation.kind,
      source: input.source,
      members: relation.memberKeys.map((key) => {
        const entry = membersByKey.get(key);
        if (!entry) throw new Error(`Missing transit relation member: ${key}`);
        return {
          layer: entry.layer,
          ...(entry.pillarPosition
            ? { pillarPosition: entry.pillarPosition }
            : {}),
          symbol: entry.symbol,
          elementType: entry.elementType,
        };
      }),
    }];
  });
}

export function calculateMonthlyTransitRelations(
  facts: Omit<MonthlyCompositeFacts, "interactions">,
): MonthlyCompositeFacts["interactions"] {
  const natalStems = natalMembers(facts, "stem");
  const natalBranches = natalMembers(facts, "branch");
  const monthlyStem = member("monthly", facts.monthly.period.stem, "stem");
  const monthlyBranch = member("monthly", facts.monthly.period.branch, "branch");
  const annualStem = member("annual", facts.annual.period.stem, "stem");
  const annualBranch = member("annual", facts.annual.period.branch, "branch");

  const natalMonthly = evaluateTransitSet({
    source: "natal_monthly",
    stems: [...natalStems, monthlyStem],
    branches: [...natalBranches, monthlyBranch],
    requiredLayers: ["natal", "monthly"],
  });
  const annualMonthly = evaluateTransitSet({
    source: "annual_monthly",
    stems: [annualStem, monthlyStem],
    branches: [...natalBranches, annualBranch, monthlyBranch],
    requiredLayers: ["annual", "monthly"],
  });

  if (!facts.daeun.period) {
    return {
      natalMonthly,
      annualMonthly,
      daeunMonthly: [],
      annualDaeunMonthly: [],
    };
  }

  const daeunStem = member("daeun", facts.daeun.period.stem, "stem");
  const daeunBranch = member("daeun", facts.daeun.period.branch, "branch");
  const daeunMonthly = evaluateTransitSet({
    source: "daeun_monthly",
    stems: [daeunStem, monthlyStem],
    branches: [...natalBranches, daeunBranch, monthlyBranch],
    requiredLayers: ["daeun", "monthly"],
  });
  const annualDaeunMonthly = evaluateTransitSet({
    source: "annual_daeun_monthly",
    stems: [annualStem, daeunStem, monthlyStem],
    branches: [annualBranch, daeunBranch, monthlyBranch],
    requiredLayers: ["annual", "daeun", "monthly"],
    minimumMemberCount: 3,
  });

  return {
    natalMonthly,
    annualMonthly,
    daeunMonthly,
    annualDaeunMonthly,
  };
}
