import { describe, expect, it } from "vitest";

import { parseYearlyReadingContext } from "./yearlyReadingContext";

describe("parseYearlyReadingContext", () => {
  it("accepts a year with stable love and career keys", () => {
    expect(
      parseYearlyReadingContext(
        new URLSearchParams("year=2027&love=dating&career=employed"),
        1996,
        2056
      )
    ).toEqual({ year: 2027, love: "dating", career: "employed" });
  });

  it.each([
    "year=2027&love=unknown&career=employed",
    "year=2027&love=dating&career=unknown",
    "year=2027&love=dating",
    "year=2057&love=dating&career=employed",
    "year=2027&love=dating&career=employed&userId=other",
  ])("rejects invalid or expanded context: %s", (query) => {
    expect(
      parseYearlyReadingContext(new URLSearchParams(query), 1996, 2056)
    ).toBeNull();
  });
});
