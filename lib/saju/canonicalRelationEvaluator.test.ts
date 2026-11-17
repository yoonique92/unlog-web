import { describe, expect, it } from "vitest";
import { evaluateCanonicalRelations } from "./canonicalRelationEvaluator";

describe("evaluateCanonicalRelations", () => {
  it("evaluates the existing canonical stem and branch relation tables", () => {
    const relations = evaluateCanonicalRelations({
      stems: [
        { key: "a", symbol: "甲" },
        { key: "b", symbol: "己" },
        { key: "c", symbol: "庚" },
      ],
      branches: [
        { key: "a", symbol: "申" },
        { key: "b", symbol: "子" },
        { key: "c", symbol: "辰" },
      ],
    });

    expect(relations.combinations).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "천간합", memberKeys: ["a", "b"] }),
      expect.objectContaining({ name: "삼합", memberKeys: ["a", "b", "c"] }),
      expect.objectContaining({ name: "반합", memberKeys: ["a", "b"] }),
    ]));
    expect(relations.clashes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "천간충", memberKeys: ["a", "c"] }),
    ]));
  });
});
