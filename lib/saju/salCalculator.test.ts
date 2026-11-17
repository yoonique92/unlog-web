import { describe, expect, it } from "vitest";
import {
  calculateCanonicalSals,
  getCheonbokGwiinBranch,
  SAL_DEFINITIONS,
} from "./salCalculator";
import { BONG_START_BRANCH, getAdjacentBranches, getGeonrokBranch } from "./twelveStagePolicy";

describe("calculateCanonicalSals", () => {
  const hasSal = (result: ReturnType<typeof calculateCanonicalSals>, position: "year" | "month" | "day" | "hour", id: string) =>
    result[position].sals.some((sal) => sal.id === id);

  it("has unique stable IDs and deterministic display order", () => {
    const definitions = Object.values(SAL_DEFINITIONS);
    const ids = definitions.map((definition) => definition.id);
    const displayOrders = definitions.map((definition) => definition.displayOrder);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(displayOrders).size).toBe(displayOrders.length);
    expect([...definitions].sort((left, right) => left.displayOrder - right.displayOrder))
      .toEqual(definitions);
  });

  it.each([
    { day: "寅", dohwa: "卯", yeokma: "申", hwagae: "戌" },
    { day: "辰", dohwa: "酉", yeokma: "寅", hwagae: "辰" },
    { day: "丑", dohwa: "午", yeokma: "亥", hwagae: "丑" },
    { day: "卯", dohwa: "子", yeokma: "巳", hwagae: "未" },
  ])("uses the day-branch three-harmony table for $day", ({ day, dohwa, yeokma, hwagae }) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: hwagae }, month: { stem: "丙", branch: yeokma },
        day: { stem: "甲", branch: day }, hour: { stem: "庚", branch: dohwa },
      },
    });

    expect(result.hour.specialSals).toContain("도화살");
    expect(result.month.specialSals).toContain("역마살");
    expect(result.year.specialSals).toContain("화개살");
  });

  it("uses the explicit year-branch twelve-sal table", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: "午" }, month: { stem: "壬", branch: "寅" },
        day: { stem: "甲", branch: "辰" }, hour: { stem: "甲", branch: "子" },
      },
    });

    expect(result).toMatchObject({
      hour: { twelveSal: "재살" },
      day: { twelveSal: "월살" },
      month: { twelveSal: "지살" },
      year: { twelveSal: "장성살" },
    });
    expect(result.day.twelveSalId).toBe("twelve_wol_sal");
  });

  it.each([
    ["甲", ["丑", "未"]], ["戊", ["丑", "未"]], ["庚", ["丑", "未"]],
    ["乙", ["子", "申"]], ["己", ["子", "申"]],
    ["丙", ["亥", "酉"]], ["丁", ["亥", "酉"]],
    ["壬", ["卯", "巳"]], ["癸", ["卯", "巳"]],
    ["辛", ["寅", "午"]],
  ] as const)("uses the day-stem cheoneul table for %s", (dayStem, [first, second]) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: first }, month: { stem: "乙", branch: second },
        day: { stem: dayStem, branch: "辰" }, hour: { stem: "丁", branch: "戌" },
      },
    });

    expect(result.year.specialSals).toContain("천을귀인");
    expect(result.month.specialSals).toContain("천을귀인");
  });

  it.each([
    ["甲", "寅", "子"], ["乙", "丑", "卯"], ["丙", "子", "丑"], ["丁", "酉", "戌"],
    ["戊", "申", "酉"], ["己", "未", "申"], ["庚", "午", "未"], ["辛", "巳", "午"],
    ["壬", "辰", "巳"], ["癸", "卯", "辰"],
  ] as const)("uses the single-target bokseong table for %s", (dayStem, target, nonTarget) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: target }, month: { stem: "乙", branch: nonTarget },
        day: { stem: dayStem, branch: "戌" }, hour: { stem: "丁", branch: target },
      },
    });

    expect(hasSal(result, "year", "bokseong_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "bokseong_gwiin")).toBe(true);
    expect(hasSal(result, "month", "bokseong_gwiin")).toBe(false);
  });

  it("does not merge the competing multi-target or year-stem bokseong policies", () => {
    const gapDay = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: "午" }, month: { stem: "壬", branch: "寅" },
        day: { stem: "甲", branch: "辰" }, hour: { stem: "甲", branch: "子" },
      },
    });
    const eulDay = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: "申" }, month: { stem: "壬", branch: "寅" },
        day: { stem: "乙", branch: "丑" }, hour: { stem: "己", branch: "卯" },
      },
    });

    expect(hasSal(gapDay, "month", "bokseong_gwiin")).toBe(true);
    expect(hasSal(gapDay, "hour", "bokseong_gwiin")).toBe(false);
    expect(hasSal(gapDay, "day", "bokseong_gwiin")).toBe(false);
    expect(hasSal(eulDay, "day", "bokseong_gwiin")).toBe(true);
    expect(hasSal(eulDay, "hour", "bokseong_gwiin")).toBe(false);
  });

  it.each([
    ["甲", "辛", "酉", "戌"], ["乙", "庚", "申", "酉"],
    ["丙", "癸", "子", "丑"], ["丁", "壬", "亥", "子"],
    ["戊", "乙", "卯", "辰"], ["己", "甲", "寅", "卯"],
    ["庚", "丁", "午", "未"], ["辛", "丙", "巳", "午"],
    ["壬", "己", "午", "未"], ["癸", "戊", "巳", "午"],
  ] as const)(
    "derives the cheonbok target from the jeonggwan geonrok for %s",
    (dayStem, jeonggwanStem, target, nonTarget) => {
      expect(getCheonbokGwiinBranch(dayStem)).toBe(target);
      expect(getCheonbokGwiinBranch(dayStem)).toBe(getGeonrokBranch(jeonggwanStem));

      const result = calculateCanonicalSals({
        pillars: {
          year: { stem: "甲", branch: target },
          month: { stem: "乙", branch: nonTarget },
          day: { stem: dayStem, branch: "戌" },
          hour: { stem: "丁", branch: target },
        },
      });

      expect(hasSal(result, "year", "cheonbok_gwiin")).toBe(true);
      expect(hasSal(result, "hour", "cheonbok_gwiin")).toBe(true);
      expect(hasSal(result, "month", "cheonbok_gwiin")).toBe(false);
      expect(result.year.specialSals).toContain("천복귀인");
      expect(result.year.twelveSal).not.toBe("천복귀인");
    },
  );

  it("uses only the canonical day stem for cheonbok gwiin", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: "申" },
        month: { stem: "乙", branch: "巳" },
        day: { stem: "丁", branch: "亥" },
        hour: { stem: "丙", branch: "午" },
      },
    });

    expect(hasSal(result, "day", "cheonbok_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "cheonbok_gwiin")).toBe(false);
  });

  it.each([
    ["甲", "寅", "丑", "卯", "辰"], ["乙", "卯", "寅", "辰", "巳"],
    ["丙", "巳", "辰", "午", "未"], ["丁", "午", "巳", "未", "申"],
    ["戊", "巳", "辰", "午", "未"], ["己", "午", "巳", "未", "申"],
    ["庚", "申", "未", "酉", "戌"], ["辛", "酉", "申", "戌", "亥"],
    ["壬", "亥", "戌", "子", "丑"], ["癸", "子", "亥", "丑", "寅"],
  ] as const)(
    "derives the two pillar-level hyeoprok targets from canonical geonrok for %s",
    (dayStem, geonrok, first, second, nonTarget) => {
      expect(getGeonrokBranch(dayStem)).toBe(geonrok);
      expect(getAdjacentBranches(geonrok)).toEqual([first, second]);

      const result = calculateCanonicalSals({
        pillars: {
          year: { stem: "甲", branch: first }, month: { stem: "乙", branch: nonTarget },
          day: { stem: dayStem, branch: "午" }, hour: { stem: "丁", branch: second },
        },
      });

      expect(hasSal(result, "year", "hyeoprok")).toBe(true);
      expect(hasSal(result, "hour", "hyeoprok")).toBe(true);
      expect(hasSal(result, "month", "hyeoprok")).toBe(false);
    },
  );

  it("marks one hyeoprok candidate independently even when geonrok is present", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "未" }, month: { stem: "辛", branch: "丑" },
        day: { stem: "己", branch: "丑" }, hour: { stem: "庚", branch: "午" },
      },
      bongStages: { hour: "건록" },
    });

    expect(hasSal(result, "year", "hyeoprok")).toBe(true);
    expect(hasSal(result, "hour", "geonrok")).toBe(true);
    expect(hasSal(result, "hour", "hyeoprok")).toBe(false);
  });

  it.each([
    ["寅", "stem", "丁"], ["卯", "branch", "申"], ["辰", "stem", "壬"],
    ["巳", "stem", "辛"], ["午", "branch", "亥"], ["未", "stem", "甲"],
    ["申", "stem", "癸"], ["酉", "branch", "寅"], ["戌", "stem", "丙"],
    ["亥", "stem", "乙"], ["子", "branch", "巳"], ["丑", "stem", "庚"],
  ] as const)("uses the complete cheondeok table for month branch %s", (monthBranch, target, value) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: target === "stem" ? value : "戊", branch: target === "branch" ? value : "戌" },
        month: { stem: "己", branch: monthBranch },
        day: { stem: "戊", branch: "辰" }, hour: { stem: "己", branch: "丑" },
      },
    });

    expect(hasSal(result, "year", "cheon_deok_gwiin")).toBe(true);
    expect(hasSal(result, "day", "cheon_deok_gwiin")).toBe(false);
  });

  it("finds cheondeok on multiple matching pillars", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "丁", branch: "子" }, month: { stem: "甲", branch: "寅" },
        day: { stem: "庚", branch: "辰" }, hour: { stem: "丁", branch: "午" },
      },
    });

    expect(hasSal(result, "year", "cheon_deok_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "cheon_deok_gwiin")).toBe(true);
  });

  it.each([
    ["寅", "丙"], ["午", "丙"], ["戌", "丙"],
    ["申", "壬"], ["子", "壬"], ["辰", "壬"],
    ["亥", "甲"], ["卯", "甲"], ["未", "甲"],
    ["巳", "庚"], ["酉", "庚"], ["丑", "庚"],
  ] as const)("uses the complete woldeok table for month branch %s", (monthBranch, targetStem) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: targetStem, branch: "子" }, month: { stem: "乙", branch: monthBranch },
        day: { stem: "丁", branch: "卯" }, hour: { stem: "辛", branch: "酉" },
      },
    });

    expect(hasSal(result, "year", "wol_deok_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "wol_deok_gwiin")).toBe(false);
  });

  it.each([
    ["甲", ["子", "午"]], ["乙", ["子", "午"]],
    ["丙", ["卯", "酉"]], ["丁", ["卯", "酉"]],
    ["戊", ["辰", "戌", "丑", "未"]], ["己", ["辰", "戌", "丑", "未"]],
    ["庚", ["寅", "亥"]], ["辛", ["寅", "亥"]],
    ["壬", ["巳", "申"]], ["癸", ["巳", "申"]],
  ] as const)("uses the complete taegeuk table for day stem %s", (dayStem, targetBranches) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranches[0] }, month: { stem: "乙", branch: "辰" },
        day: { stem: dayStem, branch: "丑" }, hour: { stem: "丁", branch: targetBranches[1] },
      },
    });

    expect(hasSal(result, "year", "taegeuk_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "taegeuk_gwiin")).toBe(true);
    expect(hasSal(result, "month", "taegeuk_gwiin"))
      .toBe((targetBranches as readonly string[]).includes("辰"));
  });

  it.each([
    ["甲", "亥"], ["乙", "子"], ["丙", "寅"], ["丁", "卯"], ["戊", "寅"],
    ["己", "卯"], ["庚", "巳"], ["辛", "午"], ["壬", "申"], ["癸", "酉"],
  ] as const)("uses the ten-stem mungok table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "丑" },
        day: { stem: dayStem, branch: "辰" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "mungok_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "mungok_gwiin")).toBe(true);
    expect(hasSal(result, "month", "mungok_gwiin")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "mungok_gwiin")).toHaveLength(1);
    expect(result.year.specialSals).toContain("문곡귀인");
    expect(result.year.twelveSal).not.toBe("문곡귀인");
  });

  it.each([
    ["甲", "巳"], ["乙", "午"], ["丙", "申"], ["丁", "酉"], ["戊", "申"],
    ["己", "酉"], ["庚", "亥"], ["辛", "子"], ["壬", "寅"], ["癸", "卯"],
  ] as const)("uses the ten-stem munchang table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "丑" },
        day: { stem: dayStem, branch: "辰" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "munchang_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "munchang_gwiin")).toBe(true);
    expect(hasSal(result, "month", "munchang_gwiin")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "munchang_gwiin")).toHaveLength(1);
    expect(result.year.specialSals).toContain("문창귀인");
    expect(result.year.twelveSal).not.toBe("문창귀인");
  });

  it.each([
    ["甲", "巳"], ["乙", "午"], ["丙", "巳"], ["丁", "午"], ["戊", "申"],
    ["己", "酉"], ["庚", "亥"], ["辛", "子"], ["壬", "寅"], ["癸", "卯"],
  ] as const)("uses the ten-stem cheonju table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "丑" },
        day: { stem: dayStem, branch: "辰" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "cheonju_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "cheonju_gwiin")).toBe(true);
    expect(hasSal(result, "month", "cheonju_gwiin")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "cheonju_gwiin")).toHaveLength(1);
    expect(result.year.specialSals).toContain("천주귀인");
    expect(result.year.twelveSal).not.toBe("천주귀인");
  });

  it.each([
    ["甲", "巳"], ["乙", "巳"], ["丙", "申"], ["丁", "申"], ["戊", "亥"],
    ["己", "亥"], ["庚", "寅"], ["辛", "寅"], ["壬", "申"], ["癸", "申"],
  ] as const)("uses the ten-stem gwangwi hakgwan table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "子" },
        day: { stem: dayStem, branch: "辰" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "gwangwi_hakgwan")).toBe(true);
    expect(hasSal(result, "hour", "gwangwi_hakgwan")).toBe(true);
    expect(hasSal(result, "month", "gwangwi_hakgwan")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "gwangwi_hakgwan")).toHaveLength(1);
    expect(result.year.specialSals).toContain("관귀학관");
    expect(result.year.twelveSal).not.toBe("관귀학관");
  });

  it.each([
    ["甲", "亥"], ["乙", "午"], ["丙", "寅"], ["丁", "酉"], ["戊", "寅"],
    ["己", "酉"], ["庚", "巳"], ["辛", "子"], ["壬", "申"], ["癸", "卯"],
  ] as const)("uses the canonical bong-stage start for hakdang gwiin for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "丑" },
        day: { stem: dayStem, branch: "辰" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(BONG_START_BRANCH[dayStem]).toBe(targetBranch);
    expect(hasSal(result, "year", "hakdang_gwiin")).toBe(true);
    expect(hasSal(result, "hour", "hakdang_gwiin")).toBe(true);
    expect(hasSal(result, "month", "hakdang_gwiin")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "hakdang_gwiin")).toHaveLength(1);
    expect(result.year.specialSals).toContain("학당귀인");
    expect(result.year.twelveSal).not.toBe("학당귀인");
  });

  it.each([
    ["甲", "亥"], ["乙", "戌"], ["丙", "申"], ["丁", "未"], ["戊", "申"],
    ["己", "未"], ["庚", "巳"], ["辛", "辰"], ["壬", "寅"], ["癸", "丑"],
  ] as const)("uses the complete amrok table for day stem %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch }, month: { stem: "乙", branch: "午" },
        day: { stem: dayStem, branch: "子" }, hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "amrok")).toBe(true);
    expect(hasSal(result, "hour", "amrok")).toBe(true);
    expect(hasSal(result, "month", "amrok")).toBe(false);
  });

  it.each([
    ["甲", "辰"], ["乙", "巳"], ["丙", "未"], ["丁", "申"], ["戊", "未"],
    ["己", "申"], ["庚", "戌"], ["辛", "亥"], ["壬", "丑"], ["癸", "寅"],
  ] as const)("uses the ten-stem geumyeo table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "卯" },
        day: { stem: dayStem, branch: "午" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "geumyeo")).toBe(true);
    expect(hasSal(result, "hour", "geumyeo")).toBe(true);
    expect(hasSal(result, "month", "geumyeo")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "geumyeo")).toHaveLength(1);
    expect(result.year.specialSals).toContain("금여");
    expect(result.year.twelveSal).not.toBe("금여");
  });

  it.each([
    ["甲", "酉"], ["乙", "戌"], ["丙", "子"], ["丁", "丑"], ["戊", "子"],
    ["己", "丑"], ["庚", "卯"], ["辛", "辰"], ["壬", "午"], ["癸", "未"],
  ] as const)("uses the complete biin table for day stem %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch }, month: { stem: "乙", branch: "寅" },
        day: { stem: dayStem, branch: "巳" }, hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "biin_sal")).toBe(true);
    expect(hasSal(result, "hour", "biin_sal")).toBe(true);
    expect(hasSal(result, "month", "biin_sal")).toBe(false);
  });

  it.each([
    { pillar: { stem: "甲", branch: "子" }, reason: "stem 甲" },
    { pillar: { stem: "辛", branch: "丑" }, reason: "stem 辛" },
    { pillar: { stem: "乙", branch: "卯" }, reason: "branch 卯" },
    { pillar: { stem: "丙", branch: "午" }, reason: "branch 午" },
    { pillar: { stem: "丁", branch: "申" }, reason: "branch 申" },
  ])("calculates hyeonchim for $reason", ({ pillar }) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: pillar,
        month: { stem: "乙", branch: "丑" },
        day: { stem: "己", branch: "巳" },
        hour: { stem: "丙", branch: "戌" },
      },
    });

    expect(hasSal(result, "year", "hyeonchim_sal")).toBe(true);
  });

  it("adds hyeonchim only once when both the stem and branch match", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "午" },
        month: { stem: "乙", branch: "丑" },
        day: { stem: "己", branch: "巳" },
        hour: { stem: "丙", branch: "戌" },
      },
    });

    expect(result.year.sals.filter((sal) => sal.id === "hyeonchim_sal")).toHaveLength(1);
    expect(result.month.sals.some((sal) => sal.id === "hyeonchim_sal")).toBe(false);
  });

  it.each([
    ["甲", "卯"], ["乙", "辰"], ["丙", "午"], ["丁", "未"], ["戊", "午"],
    ["己", "未"], ["庚", "酉"], ["辛", "戌"], ["壬", "子"], ["癸", "丑"],
  ] as const)("uses the ten-stem yangin table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "乙", branch: "巳" },
        day: { stem: dayStem, branch: "申" },
        hour: { stem: "丁", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "yangin_sal")).toBe(true);
    expect(hasSal(result, "hour", "yangin_sal")).toBe(true);
    expect(hasSal(result, "month", "yangin_sal")).toBe(false);
    expect(result.year.sals.filter((sal) => sal.id === "yangin_sal")).toHaveLength(1);
  });

  it.each([
    "甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑",
  ] as const)("uses exact full-pillar membership for baekho daesal: %s", (ganji) => {
    const [stem, branch] = [...ganji];
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem, branch },
        month: { stem: "丙", branch: "辰" },
        day: { stem: "甲", branch: "戌" },
        hour: { stem: "庚", branch: "午" },
      },
    });

    expect(hasSal(result, "year", "baekho_daesal")).toBe(true);
    expect(result.year.sals).toContainEqual(SAL_DEFINITIONS.baekho_daesal);
    expect(hasSal(result, "month", "baekho_daesal")).toBe(false);
    expect(hasSal(result, "day", "baekho_daesal")).toBe(false);
  });

  it.each([
    "己丑", "庚辰", "辛未", "戊戌", "丙辰",
  ] as const)("excludes non-canonical baekho candidate: %s", (ganji) => {
    const [stem, branch] = [...ganji];
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem, branch },
        month: { stem: "乙", branch: "亥" },
        day: { stem: "甲", branch: "戌" },
        hour: { stem: "庚", branch: "午" },
      },
    });

    expect(hasSal(result, "year", "baekho_daesal")).toBe(false);
  });

  it("does not turn a day-stem-to-branch match into baekho daesal", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "癸", branch: "亥" },
        month: { stem: "丙", branch: "辰" },
        day: { stem: "甲", branch: "戌" },
        hour: { stem: "庚", branch: "午" },
      },
    });

    expect(hasSal(result, "month", "baekho_daesal")).toBe(false);
    expect(Object.values(result).some((sal) =>
      sal.sals.some((item) => item.id === "baekho_daesal"),
    )).toBe(false);
  });

  it.each([
    ["甲", "巳"], ["乙", "子"], ["丙", "申"], ["丁", "戌"], ["戊", "卯"],
    ["己", "巳"], ["庚", "子"], ["辛", "申"], ["壬", "戌"], ["癸", "卯"],
  ] as const)("uses the ten-stem nakjeong table for %s", (dayStem, targetBranch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "丙", branch: "辰" },
        day: { stem: dayStem, branch: "丑" },
        hour: { stem: "壬", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "nakjeong_gwansal")).toBe(true);
    expect(hasSal(result, "hour", "nakjeong_gwansal")).toBe(true);
    expect(hasSal(result, "month", "nakjeong_gwansal")).toBe(false);
    expect(result.year.sals).toContainEqual(SAL_DEFINITIONS.nakjeong_gwansal);
  });

  it("checks all four branches independently without requiring a full-pillar match", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "己", branch: "巳" },
        month: { stem: "丙", branch: "子" },
        day: { stem: "乙", branch: "子" },
        hour: { stem: "壬", branch: "子" },
      },
    });

    expect(hasSal(result, "year", "nakjeong_gwansal")).toBe(false);
    for (const position of ["month", "day", "hour"] as const) {
      expect(result[position].sals.filter((sal) => sal.id === "nakjeong_gwansal"))
        .toHaveLength(1);
    }
  });

  it("keeps visible-pillar nakjeong results when the hour is unknown", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "己", branch: "巳" },
        month: { stem: "丙", branch: "巳" },
        day: { stem: "己", branch: "巳" },
        hour: { stem: "己", branch: "巳" },
      },
      birthTimeUnknown: true,
    });

    for (const position of ["year", "month", "day"] as const) {
      expect(hasSal(result, position, "nakjeong_gwansal")).toBe(true);
    }
    expect(result.hour.sals).toEqual([]);
  });

  it.each([
    ["子", false], ["丑", false], ["寅", false], ["卯", false],
    ["辰", false], ["巳", false], ["午", false], ["未", false],
    ["申", false], ["酉", false], ["戌", true], ["亥", true],
  ] as const)("uses canonical branch membership for cheonmun: %s", (branch, expected) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch },
        month: { stem: "丁", branch: "卯" },
        day: { stem: "庚", branch: "子" },
        hour: { stem: "癸", branch: "未" },
      },
    });

    expect(hasSal(result, "year", "cheonmun_seong")).toBe(expected);
  });

  it.each([
    ["甲", "戌"], ["丙", "戌"], ["癸", "亥"], ["乙", "亥"],
  ] as const)("does not require a specific pillar stem for cheonmun: %s%s", (stem, branch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem, branch },
        month: { stem: "丁", branch: "卯" },
        day: { stem: "庚", branch: "子" },
        hour: { stem: "癸", branch: "未" },
      },
    });

    expect(result.year.sals).toContainEqual(SAL_DEFINITIONS.cheonmun_seong);
  });

  it("adds cheonmun independently to multiple pillars", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "癸", branch: "亥" },
        month: { stem: "丙", branch: "辰" },
        day: { stem: "甲", branch: "戌" },
        hour: { stem: "庚", branch: "午" },
      },
    });

    expect(hasSal(result, "year", "cheonmun_seong")).toBe(true);
    expect(hasSal(result, "day", "cheonmun_seong")).toBe(true);
    expect(hasSal(result, "month", "cheonmun_seong")).toBe(false);
    expect(hasSal(result, "hour", "cheonmun_seong")).toBe(false);
  });

  it("keeps visible-pillar cheonmun results when the hour is unknown", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "癸", branch: "亥" },
        month: { stem: "丙", branch: "戌" },
        day: { stem: "甲", branch: "子" },
        hour: { stem: "乙", branch: "亥" },
      },
      birthTimeUnknown: true,
    });

    expect(hasSal(result, "year", "cheonmun_seong")).toBe(true);
    expect(hasSal(result, "month", "cheonmun_seong")).toBe(true);
    expect(result.hour.sals).toEqual([]);
  });

  it.each([
    ["寅", "戌"], ["卯", "丑"], ["辰", "寅"], ["巳", "巳"],
    ["午", "酉"], ["未", "卯"], ["申", "子"], ["酉", "午"],
    ["戌", "亥"], ["亥", "辰"], ["子", "申"], ["丑", "未"],
  ] as const)("uses the canonical month-branch table for hwangeun: %s -> %s", (
    monthBranch,
    targetBranch,
  ) => {
    const nonTargetBranch = targetBranch === "子" ? "丑" : "子";
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: nonTargetBranch },
        month: { stem: "丁", branch: monthBranch },
        day: { stem: "庚", branch: targetBranch },
        hour: { stem: "癸", branch: nonTargetBranch },
      },
    });

    expect(hasSal(result, "day", "hwangeun_daesa")).toBe(true);
    expect(hasSal(result, "hour", "hwangeun_daesa")).toBe(false);
  });

  it("restricts hwangeun to day and hour even when every pillar has the target branch", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "己", branch: "巳" },
        month: { stem: "己", branch: "巳" },
        day: { stem: "己", branch: "巳" },
        hour: { stem: "己", branch: "巳" },
      },
    });

    expect(hasSal(result, "year", "hwangeun_daesa")).toBe(false);
    expect(hasSal(result, "month", "hwangeun_daesa")).toBe(false);
    expect(hasSal(result, "day", "hwangeun_daesa")).toBe(true);
    expect(hasSal(result, "hour", "hwangeun_daesa")).toBe(true);
  });

  it("matches hwangeun by branch without requiring a target pillar stem", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "子" },
        month: { stem: "丙", branch: "寅" },
        day: { stem: "甲", branch: "戌" },
        hour: { stem: "壬", branch: "戌" },
      },
    });

    expect(hasSal(result, "day", "hwangeun_daesa")).toBe(true);
    expect(hasSal(result, "hour", "hwangeun_daesa")).toBe(true);
  });

  it("keeps the day hwangeun result and omits the unknown hour", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "子" },
        month: { stem: "丙", branch: "寅" },
        day: { stem: "壬", branch: "戌" },
        hour: { stem: "丙", branch: "戌" },
      },
      birthTimeUnknown: true,
    });

    expect(hasSal(result, "day", "hwangeun_daesa")).toBe(true);
    expect(result.hour.sals).toEqual([]);
  });

  it.each([
    ["子", "亥"], ["丑", "子"], ["寅", "丑"], ["卯", "寅"],
    ["辰", "卯"], ["巳", "辰"], ["午", "巳"], ["未", "午"],
    ["申", "未"], ["酉", "申"], ["戌", "酉"], ["亥", "戌"],
  ] as const)("uses the canonical month-branch predecessor table for cheonui: %s -> %s", (
    monthBranch,
    targetBranch,
  ) => {
    const nonTargetBranch = targetBranch === "子" ? "丑" : "子";
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: targetBranch },
        month: { stem: "丁", branch: monthBranch },
        day: { stem: "庚", branch: nonTargetBranch },
        hour: { stem: "癸", branch: targetBranch },
      },
    });

    expect(hasSal(result, "year", "cheonui_seong")).toBe(true);
    expect(hasSal(result, "month", "cheonui_seong")).toBe(false);
    expect(hasSal(result, "day", "cheonui_seong")).toBe(false);
    expect(hasSal(result, "hour", "cheonui_seong")).toBe(true);
  });

  it("adds cheonui independently to every allowed target pillar without using its stem", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "庚", branch: "申" },
        month: { stem: "乙", branch: "酉" },
        day: { stem: "甲", branch: "申" },
        hour: { stem: "壬", branch: "申" },
      },
    });

    expect(hasSal(result, "year", "cheonui_seong")).toBe(true);
    expect(hasSal(result, "month", "cheonui_seong")).toBe(false);
    expect(hasSal(result, "day", "cheonui_seong")).toBe(true);
    expect(hasSal(result, "hour", "cheonui_seong")).toBe(true);
  });

  it("keeps visible cheonui results and omits the unknown hour", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "庚", branch: "申" },
        month: { stem: "乙", branch: "酉" },
        day: { stem: "甲", branch: "申" },
        hour: { stem: "壬", branch: "申" },
      },
      birthTimeUnknown: true,
    });

    expect(hasSal(result, "year", "cheonui_seong")).toBe(true);
    expect(hasSal(result, "day", "cheonui_seong")).toBe(true);
    expect(result.hour.sals).toEqual([]);
  });

  it.each([
    ["甲", "寅"], ["乙", "巳"], ["丁", "巳"], ["戊", "申"], ["辛", "亥"],
  ] as const)("recognizes the canonical L5 full pillar for goran: %s%s", (stem, branch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem, branch },
        month: { stem: "癸", branch: "丑" },
        day: { stem: "庚", branch: "辰" },
        hour: { stem: "己", branch: "卯" },
      },
    });

    expect(hasSal(result, "year", "goran_sal")).toBe(true);
  });

  it.each([
    ["丙", "午"], ["戊", "午"], ["壬", "子"],
    ["甲", "申"], ["戊", "子"], ["癸", "亥"],
  ] as const)("rejects non-L5 and partial-match pillars for goran: %s%s", (stem, branch) => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem, branch },
        month: { stem: "癸", branch: "丑" },
        day: { stem: "庚", branch: "辰" },
        hour: { stem: "己", branch: "卯" },
      },
    });

    expect(hasSal(result, "year", "goran_sal")).toBe(false);
  });

  it("calculates goran independently for all four pillars", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "亥" },
        month: { stem: "丁", branch: "巳" },
        day: { stem: "乙", branch: "巳" },
        hour: { stem: "戊", branch: "申" },
      },
    });

    for (const position of ["year", "month", "day", "hour"] as const) {
      expect(hasSal(result, position, "goran_sal")).toBe(true);
    }
  });

  it("keeps known-pillar goran results and omits the unknown hour", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "亥" },
        month: { stem: "丁", branch: "巳" },
        day: { stem: "乙", branch: "巳" },
        hour: { stem: "戊", branch: "申" },
      },
      birthTimeUnknown: true,
    });

    expect(hasSal(result, "year", "goran_sal")).toBe(true);
    expect(hasSal(result, "month", "goran_sal")).toBe(true);
    expect(hasSal(result, "day", "goran_sal")).toBe(true);
    expect(result.hour.sals).toEqual([]);
  });

  it.each([
    ["子", "戌"], ["丑", "戌"], ["寅", "丑"], ["卯", "丑"],
    ["辰", "丑"], ["巳", "辰"], ["午", "辰"], ["未", "辰"],
    ["申", "未"], ["酉", "未"], ["戌", "未"], ["亥", "戌"],
  ] as const)("uses the canonical year-branch gwasuk mapping: %s -> %s", (
    yearBranch,
    targetBranch,
  ) => {
    const nonTargetBranch = "子";
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: yearBranch },
        month: { stem: "乙", branch: targetBranch },
        day: { stem: "丙", branch: nonTargetBranch },
        hour: { stem: "丁", branch: nonTargetBranch },
      },
    });

    expect(hasSal(result, "month", "gwasuk_sal")).toBe(true);
    expect(hasSal(result, "day", "gwasuk_sal")).toBe(false);
    expect(hasSal(result, "hour", "gwasuk_sal")).toBe(false);
    expect(hasSal(result, "year", "gwasuk_sal")).toBe(false);
  });

  it("matches gwasuk by branch regardless of the target pillar stem", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "戌" },
        month: { stem: "甲", branch: "未" },
        day: { stem: "丁", branch: "未" },
        hour: { stem: "癸", branch: "未" },
      },
    });

    for (const position of ["month", "day", "hour"] as const) {
      expect(hasSal(result, position, "gwasuk_sal")).toBe(true);
    }
    expect(hasSal(result, "year", "gwasuk_sal")).toBe(false);
  });

  it("uses only yearBranch as the gwasuk source and never projects onto source year", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "戌" },
        month: { stem: "丁", branch: "卯" },
        day: { stem: "庚", branch: "子" },
        hour: { stem: "癸", branch: "未" },
      },
    });

    expect(hasSal(result, "hour", "gwasuk_sal")).toBe(true);
    expect(hasSal(result, "year", "gwasuk_sal")).toBe(false);
    expect(hasSal(result, "month", "gwasuk_sal")).toBe(false);
    expect(hasSal(result, "day", "gwasuk_sal")).toBe(false);
  });

  it("keeps known-pillar gwasuk results and omits the unknown hour", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "壬", branch: "午" },
        month: { stem: "戊", branch: "辰" },
        day: { stem: "甲", branch: "辰" },
        hour: { stem: "庚", branch: "辰" },
      },
      birthTimeUnknown: true,
    });

    expect(hasSal(result, "month", "gwasuk_sal")).toBe(true);
    expect(hasSal(result, "day", "gwasuk_sal")).toBe(true);
    expect(result.hour.sals).toEqual([]);
  });

  it("projects relation-level gwimun gwansal onto every participating pillar once", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "未" },
        month: { stem: "辛", branch: "丑" },
        day: { stem: "己", branch: "丑" },
        hour: { stem: "庚", branch: "午" },
      },
      relationSals: [
        {
          id: "gwimun_gwansal",
          name: "귀문관살",
          category: "relation",
          from: "month",
          to: "hour",
          branches: ["丑", "午"],
        },
        {
          id: "gwimun_gwansal",
          name: "귀문관살",
          category: "relation",
          from: "day",
          to: "hour",
          branches: ["丑", "午"],
        },
      ],
    });

    expect(hasSal(result, "year", "gwimun_gwansal")).toBe(false);
    for (const position of ["month", "day", "hour"] as const) {
      expect(result[position].sals.filter((sal) => sal.id === "gwimun_gwansal"))
        .toEqual([SAL_DEFINITIONS.gwimun_gwansal]);
    }
    expect(SAL_DEFINITIONS.gwimun_gwansal).toMatchObject({
      category: "special",
      displayOrder: 380,
    });
  });

  it("does not project a relation sal onto an unknown hour pillar", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "未" },
        month: { stem: "辛", branch: "丑" },
        day: { stem: "己", branch: "丑" },
        hour: { stem: "庚", branch: "午" },
      },
      relationSals: [{
        id: "gwimun_gwansal",
        name: "귀문관살",
        category: "relation",
        from: "day",
        to: "hour",
        branches: ["丑", "午"],
      }],
      birthTimeUnknown: true,
    });

    expect(result.hour.sals).toEqual([]);
  });

  it("reuses the canonical bong-stage result for geonrok", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "甲", branch: "寅" }, month: { stem: "乙", branch: "卯" },
        day: { stem: "甲", branch: "辰" }, hour: { stem: "丁", branch: "寅" },
      },
      bongStages: { year: "건록", month: "제왕", day: "쇠", hour: "건록" },
    });

    expect(hasSal(result, "year", "geonrok")).toBe(true);
    expect(hasSal(result, "hour", "geonrok")).toBe(true);
    expect(hasSal(result, "month", "geonrok")).toBe(false);
    expect(result.year.sals.map((sal) => sal.displayOrder))
      .toEqual([...result.year.sals.map((sal) => sal.displayOrder)].sort((a, b) => a - b));
  });

  it("does not calculate the unknown hour pillar", () => {
    const result = calculateCanonicalSals({
      pillars: {
        year: { stem: "辛", branch: "未" }, month: { stem: "辛", branch: "丑" },
        day: { stem: "己", branch: "丑" }, hour: { stem: "丁", branch: "丑" },
      },
      birthTimeUnknown: true,
    });

    expect(result.hour).toEqual({
      twelveSal: "", specialSals: [], twelveSalId: null, sals: [],
    });
    expect(result.day.twelveSal).toBe("월살");
    expect(result.day.twelveSalId).toBe("twelve_wol_sal");
    expect(result.day.specialSals).toContain("화개살");
    expect(hasSal(result, "day", "hwagae_sal")).toBe(true);
  });

  it("deduplicates each pillar by stable ID and sorts by displayOrder", () => {
    const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

    for (const dayStem of stems) {
      for (const dayBranch of branches) {
        const result = calculateCanonicalSals({
          pillars: {
            year: { stem: "甲", branch: "子" }, month: { stem: "乙", branch: "申" },
            day: { stem: dayStem, branch: dayBranch }, hour: { stem: "丁", branch: "辰" },
          },
        });

        for (const sal of Object.values(result)) {
          const ids = sal.sals.map((item) => item.id);
          const orders = sal.sals.map((item) => item.displayOrder);
          expect(new Set(ids).size).toBe(ids.length);
          expect(orders).toEqual([...orders].sort((left, right) => left - right));
        }
      }
    }
  });
});
