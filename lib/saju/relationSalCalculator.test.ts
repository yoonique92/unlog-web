import { describe, expect, it } from "vitest";
import {
  calculateCanonicalRelationSals,
  getRelationSalKey,
  RELATION_SAL_DEFINITIONS,
} from "./relationSalCalculator";

describe("calculateCanonicalRelationSals", () => {
  it.each([
    ["子", "酉"],
    ["丑", "午"],
    ["寅", "未"],
    ["卯", "申"],
    ["辰", "亥"],
    ["巳", "戌"],
  ] as const)("matches the gwimun pair in both directions: %s-%s", (first, second) => {
    const forward = calculateCanonicalRelationSals({
      year: { branch: first },
      month: { branch: second },
    });
    const reverse = calculateCanonicalRelationSals({
      year: { branch: second },
      month: { branch: first },
    });

    expect(forward).toEqual([{
      id: "gwimun_gwansal",
      name: "귀문관살",
      category: "relation",
      from: "year",
      to: "month",
      branches: [first, second],
    }]);
    expect(reverse[0]).toMatchObject({
      from: "year",
      to: "month",
      branches: [second, first],
    });
  });

  it.each([
    ["子", "未"],
    ["寅", "酉"],
  ] as const)("does not merge a wonjin-only pair into gwimun: %s-%s", (first, second) => {
    expect(calculateCanonicalRelationSals({
      year: { branch: first },
      month: { branch: second },
    })).toEqual([]);
  });

  it("keeps identical branch pairs at different pillar positions", () => {
    const result = calculateCanonicalRelationSals({
      year: { branch: "未" },
      month: { branch: "丑" },
      day: { branch: "丑" },
      hour: { branch: "午" },
    });

    expect(result).toEqual([
      expect.objectContaining({ from: "month", to: "hour", branches: ["丑", "午"] }),
      expect.objectContaining({ from: "day", to: "hour", branches: ["丑", "午"] }),
    ]);
    expect(result.map(getRelationSalKey)).toEqual([
      "gwimun_gwansal:month:hour",
      "gwimun_gwansal:day:hour",
    ]);
  });

  it("keeps repeated unordered pairs at distinct positions", () => {
    const result = calculateCanonicalRelationSals({
      month: { branch: "酉" },
      day: { branch: "子" },
      hour: { branch: "酉" },
    });

    expect(result.map(({ from, to, branches }) => ({ from, to, branches }))).toEqual([
      { from: "month", to: "day", branches: ["酉", "子"] },
      { from: "day", to: "hour", branches: ["子", "酉"] },
    ]);
  });

  it("does not create hour relations when the hour pillar is absent", () => {
    const result = calculateCanonicalRelationSals({
      year: { branch: "酉" },
      month: { branch: "子" },
      day: { branch: "丑" },
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: "year", to: "month" });
    expect(result.every(({ from, to }) => from !== "hour" && to !== "hour")).toBe(true);
  });

  it("publishes the canonical definition and pillar projection metadata", () => {
    expect(RELATION_SAL_DEFINITIONS.gwimun_gwansal).toEqual({
      id: "gwimun_gwansal",
      name: "귀문관살",
      category: "relation",
      pillarProjection: { category: "special", displayOrder: 380 },
    });
  });
});
