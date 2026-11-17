import type {
  CanonicalRelationSal,
  PillarPosition,
  RelationSalId,
} from "./types";

export interface RelationSalDefinition {
  id: RelationSalId;
  name: string;
  category: "relation";
  pillarProjection: {
    category: "special";
    displayOrder: number;
  };
}

export const RELATION_SAL_DEFINITIONS = {
  gwimun_gwansal: {
    id: "gwimun_gwansal",
    name: "귀문관살",
    category: "relation",
    pillarProjection: {
      category: "special",
      displayOrder: 380,
    },
  },
} as const satisfies Record<RelationSalId, RelationSalDefinition>;

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];
const GWIMUN_PAIRS = ["子酉", "丑午", "寅未", "卯申", "辰亥", "巳戌"] as const;

type RelationSalPillar = { branch: string };

function isUnorderedPair(first: string, second: string) {
  return GWIMUN_PAIRS.some((pair) =>
    pair === `${first}${second}` || pair === `${second}${first}`,
  );
}

export function getRelationSalKey(relation: Pick<CanonicalRelationSal, "id" | "from" | "to">) {
  return `${relation.id}:${relation.from}:${relation.to}`;
}

export function calculateCanonicalRelationSals(
  pillars: Partial<Record<PillarPosition, RelationSalPillar>>,
): CanonicalRelationSal[] {
  const visible = POSITIONS.flatMap((position) => {
    const pillar = pillars[position];
    return pillar ? [{ position, branch: pillar.branch }] : [];
  });
  const relations: CanonicalRelationSal[] = [];
  const keys = new Set<string>();

  for (let first = 0; first < visible.length; first += 1) {
    for (let second = first + 1; second < visible.length; second += 1) {
      const from = visible[first];
      const to = visible[second];
      if (!isUnorderedPair(from.branch, to.branch)) continue;

      const definition = RELATION_SAL_DEFINITIONS.gwimun_gwansal;
      const relation: CanonicalRelationSal = {
        id: definition.id,
        name: definition.name,
        category: definition.category,
        from: from.position,
        to: to.position,
        branches: [from.branch, to.branch],
      };
      const key = getRelationSalKey(relation);
      if (keys.has(key)) continue;
      keys.add(key);
      relations.push(relation);
    }
  }

  return relations;
}
