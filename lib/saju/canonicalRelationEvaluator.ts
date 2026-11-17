import type { Relation } from "./types";

export type CanonicalRelationName =
  | "천간합"
  | "천간충"
  | "육합"
  | "삼합"
  | "방합"
  | "반합"
  | "충"
  | "형"
  | "자형"
  | "해"
  | "파";

export interface CanonicalRelationEntry<Key extends string = string> {
  key: Key;
  symbol: string;
}

export interface CanonicalEvaluatedRelation<Key extends string = string> {
  kind: Relation["kind"];
  elementType: Relation["source"];
  name: CanonicalRelationName;
  memberKeys: Key[];
  symbols: string[];
}

export interface CanonicalEvaluatedRelations<Key extends string = string> {
  combinations: CanonicalEvaluatedRelation<Key>[];
  clashes: CanonicalEvaluatedRelation<Key>[];
  punishments: CanonicalEvaluatedRelation<Key>[];
  harms: CanonicalEvaluatedRelation<Key>[];
  breaks: CanonicalEvaluatedRelation<Key>[];
}

const STEM_COMBINATIONS = ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"];
const STEM_CLASHES = ["甲庚", "乙辛", "丙壬", "丁癸"];
const BRANCH_COMBINATIONS = ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"];
const BRANCH_CLASHES = ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"];
const BRANCH_PUNISHMENTS = ["子卯", "寅巳", "巳申", "申寅", "丑戌", "戌未", "未丑"];
const BRANCH_SELF_PUNISHMENTS = new Set(["辰", "午", "酉", "亥"]);
const BRANCH_HARMS = ["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"];
const BRANCH_BREAKS = ["子酉", "丑辰", "寅亥", "卯午", "巳申", "未戌"];
const BRANCH_TRINES = ["申子辰", "寅午戌", "巳酉丑", "亥卯未"];
const BRANCH_SEASONS = ["寅卯辰", "巳午未", "申酉戌", "亥子丑"];

function hasPair(pair: string, first: string, second: string) {
  return pair === `${first}${second}` || pair === `${second}${first}`;
}

function makeRelation<Key extends string>(
  kind: Relation["kind"],
  elementType: Relation["source"],
  entries: CanonicalRelationEntry<Key>[],
  name: CanonicalRelationName,
): CanonicalEvaluatedRelation<Key> {
  return {
    kind,
    elementType,
    name,
    memberKeys: entries.map(({ key }) => key),
    symbols: entries.map(({ symbol }) => symbol),
  };
}

function buildPairRelations<Key extends string>(
  entries: CanonicalRelationEntry<Key>[],
  pairs: string[],
  kind: Relation["kind"],
  elementType: Relation["source"],
  name: CanonicalRelationName,
) {
  const result: CanonicalEvaluatedRelation<Key>[] = [];
  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      if (!pairs.some((pair) => hasPair(pair, entries[first].symbol, entries[second].symbol))) continue;
      result.push(makeRelation(kind, elementType, [entries[first], entries[second]], name));
    }
  }
  return result;
}

function buildGroupRelations<Key extends string>(
  entries: CanonicalRelationEntry<Key>[],
  groups: string[],
  name: "삼합" | "방합",
) {
  return groups.flatMap((group) => {
    const matched = group.split("").flatMap((symbol) => {
      const entry = entries.find((candidate) => candidate.symbol === symbol);
      return entry ? [entry] : [];
    });
    return matched.length === group.length
      ? [makeRelation("combination", "branch", matched, name)]
      : [];
  });
}

/** Evaluates only the project's existing canonical relation tables. */
export function evaluateCanonicalRelations<Key extends string>(input: {
  stems: CanonicalRelationEntry<Key>[];
  branches: CanonicalRelationEntry<Key>[];
}): CanonicalEvaluatedRelations<Key> {
  const { stems, branches } = input;
  const stemCombinations = buildPairRelations(
    stems, STEM_COMBINATIONS, "combination", "stem", "천간합",
  );
  const branchCombinations = buildPairRelations(
    branches, BRANCH_COMBINATIONS, "combination", "branch", "육합",
  );
  const trines = buildGroupRelations(branches, BRANCH_TRINES, "삼합");
  const seasons = buildGroupRelations(branches, BRANCH_SEASONS, "방합");
  const halfTrines = BRANCH_TRINES.flatMap((group) => {
    const symbols = group.split("");
    const pairs = [
      `${symbols[0]}${symbols[1]}`,
      `${symbols[1]}${symbols[2]}`,
      `${symbols[0]}${symbols[2]}`,
    ];
    return buildPairRelations(
      branches, pairs, "combination", "branch", "반합",
    );
  });
  const selfPunishments: CanonicalEvaluatedRelation<Key>[] = [];
  for (let first = 0; first < branches.length; first += 1) {
    for (let second = first + 1; second < branches.length; second += 1) {
      if (
        branches[first].symbol !== branches[second].symbol ||
        !BRANCH_SELF_PUNISHMENTS.has(branches[first].symbol)
      ) continue;
      selfPunishments.push(makeRelation(
        "punishment", "branch", [branches[first], branches[second]], "자형",
      ));
    }
  }

  return {
    combinations: [
      ...stemCombinations,
      ...branchCombinations,
      ...trines,
      ...seasons,
      ...halfTrines,
    ],
    clashes: [
      ...buildPairRelations(stems, STEM_CLASHES, "clash", "stem", "천간충"),
      ...buildPairRelations(branches, BRANCH_CLASHES, "clash", "branch", "충"),
    ],
    punishments: [
      ...buildPairRelations(
        branches, BRANCH_PUNISHMENTS, "punishment", "branch", "형",
      ),
      ...selfPunishments,
    ],
    harms: buildPairRelations(branches, BRANCH_HARMS, "harm", "branch", "해"),
    breaks: buildPairRelations(branches, BRANCH_BREAKS, "break", "branch", "파"),
  };
}
