import "server-only";

export const STONE_UNLOCK_POLICY_VERSION = "stone-unlock-v1";
const STONE_UNLOCK_COST = 1;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StoneUnlockContent =
  | {
      kind: "yearlyFortune";
      year: number;
    }
  | {
      kind: "friendCompatibility";
      connectionId: string;
    };

export type ResolvedStoneContentPolicy = {
  contentType: "yearly_fortune" | "compatibility";
  contentKey: string;
  costStones: typeof STONE_UNLOCK_COST;
  metadata: {
    policyVersion: typeof STONE_UNLOCK_POLICY_VERSION;
    contentKind: StoneUnlockContent["kind"];
  };
};

export function resolveStoneContentPolicy(
  content: StoneUnlockContent
): ResolvedStoneContentPolicy | null {
  if (content.kind === "yearlyFortune") {
    if (!Number.isInteger(content.year) || content.year < 1000 || content.year > 9999) {
      return null;
    }

    return {
      contentType: "yearly_fortune",
      contentKey: String(content.year),
      costStones: STONE_UNLOCK_COST,
      metadata: {
        policyVersion: STONE_UNLOCK_POLICY_VERSION,
        contentKind: content.kind,
      },
    };
  }

  if (content.kind === "friendCompatibility") {
    if (!UUID_PATTERN.test(content.connectionId)) return null;

    return {
      contentType: "compatibility",
      contentKey: `connection:${content.connectionId.toLowerCase()}`,
      costStones: STONE_UNLOCK_COST,
      metadata: {
        policyVersion: STONE_UNLOCK_POLICY_VERSION,
        contentKind: content.kind,
      },
    };
  }

  return null;
}
