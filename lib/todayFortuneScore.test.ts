import { describe, expect, it } from "vitest";

import { calculateTodayFortuneScore } from "./todayFortuneScore";

describe("calculateTodayFortuneScore", () => {
  it("calculates the weighted score", () => {
    expect(
      calculateTodayFortuneScore({
        scores: {
          love: 70,
          money: 75,
          career: 80,
          study: 85,
          health: 90,
          people: 65,
        },
      })
    ).toBe(78);
  });

  it("clamps low and high scores to the supported range", () => {
    const scores = (value: number) => ({
      love: value,
      money: value,
      career: value,
      study: value,
      health: value,
      people: value,
    });

    expect(calculateTodayFortuneScore({ scores: scores(10) })).toBe(55);
    expect(calculateTodayFortuneScore({ scores: scores(100) })).toBe(95);
  });
});
