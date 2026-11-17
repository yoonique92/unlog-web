import { describe, expect, it } from "vitest";
import { analyzeUnlogSaju, getSaju } from "../saju";
import { analyzeStrength } from "../myeongri/strength";
import { getTenGodForStem } from "../tenGodUtils";
import { STRENGTH_VALIDATION_CASES } from "../../tests/validation/strengthValidationCases";
import { GOLDEN_CASES } from "../../tests/golden/cases";
import { calculateSajuWithBoundaryPolicies } from "./policyAdapter";
import type { PillarPosition } from "./types";

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];
const PREVIOUS_SPECIAL_SALS = new Set(["천을귀인", "도화살", "역마살", "화개살"]);
const NEW_GWIIN_IDS = new Set(["cheon_deok_gwiin", "wol_deok_gwiin", "taegeuk_gwiin"]);
const NEW_PHASE_TWO_IDS = new Set(["geonrok", "amrok", "biin_sal"]);

function calculateReferencePhaseTwoIds(
  pillars: Record<PillarPosition, string>,
  position: PillarPosition,
) {
  const geonrokTable: Record<string, string> = {
    甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳",
    己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
  };
  const amrokTable: Record<string, string> = {
    甲: "亥", 乙: "戌", 丙: "申", 丁: "未", 戊: "申",
    己: "未", 庚: "巳", 辛: "辰", 壬: "寅", 癸: "丑",
  };
  const biinTable: Record<string, string> = {
    甲: "酉", 乙: "戌", 丙: "子", 丁: "丑", 戊: "子",
    己: "丑", 庚: "卯", 辛: "辰", 壬: "午", 癸: "未",
  };
  const dayStem = pillars.day[0];
  const branch = pillars[position][1];

  return [
    geonrokTable[dayStem] === branch ? "geonrok" : null,
    amrokTable[dayStem] === branch ? "amrok" : null,
    biinTable[dayStem] === branch ? "biin_sal" : null,
  ].filter((id): id is string => id !== null);
}

function calculateReferenceGwiinIds(
  pillars: Record<PillarPosition, string>,
  position: PillarPosition,
) {
  const cheondeokTable: Record<string, ["stem" | "branch", string]> = {
    寅: ["stem", "丁"], 卯: ["branch", "申"], 辰: ["stem", "壬"],
    巳: ["stem", "辛"], 午: ["branch", "亥"], 未: ["stem", "甲"],
    申: ["stem", "癸"], 酉: ["branch", "寅"], 戌: ["stem", "丙"],
    亥: ["stem", "乙"], 子: ["branch", "巳"], 丑: ["stem", "庚"],
  };
  const woldeokTable: Record<string, string> = {
    寅: "丙", 午: "丙", 戌: "丙", 申: "壬", 子: "壬", 辰: "壬",
    亥: "甲", 卯: "甲", 未: "甲", 巳: "庚", 酉: "庚", 丑: "庚",
  };
  const taegeukTable: Record<string, readonly string[]> = {
    甲: ["子", "午"], 乙: ["子", "午"], 丙: ["卯", "酉"], 丁: ["卯", "酉"],
    戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
    庚: ["寅", "亥"], 辛: ["寅", "亥"], 壬: ["巳", "申"], 癸: ["巳", "申"],
  };
  const monthBranch = pillars.month[1];
  const dayStem = pillars.day[0];
  const [stem, branch] = pillars[position];
  const [target, value] = cheondeokTable[monthBranch];

  return [
    (target === "stem" ? stem : branch) === value ? "cheon_deok_gwiin" : null,
    stem === woldeokTable[monthBranch] ? "wol_deok_gwiin" : null,
    taegeukTable[dayStem].includes(branch) ? "taegeuk_gwiin" : null,
  ].filter((id): id is string => id !== null);
}

function getProductionSaju(
  birthDate: string,
  birthTime: string,
  calendar: "solar" | "lunar",
  gender: "male" | "female",
) {
  const [hour, minute] = birthTime.split(":");
  return getSaju(birthDate, hour, minute, calendar, gender);
}

describe("production saju calculation policies", () => {
  it.each([
    ...GOLDEN_CASES.map((testCase) => ({
      id: testCase.id,
      birthDate: testCase.birth.date,
      birthTime: testCase.birth.time,
      calendar: testCase.birth.calendar,
      gender: testCase.birth.gender,
    })),
    ...STRENGTH_VALIDATION_CASES.map((testCase) => ({
      id: testCase.id,
      birthDate: testCase.birth.date,
      birthTime: testCase.birth.time,
      calendar: testCase.birth.calendar,
      gender: testCase.birth.gender,
    })),
  ])("matches the independent new-gwiin reference for $id", (testCase) => {
    const result = getProductionSaju(
      testCase.birthDate,
      testCase.birthTime ?? "12:00",
      testCase.calendar,
      testCase.gender ?? "female",
    );

    for (const position of POSITIONS) {
      const actualIds = result.sals[position].sals
        .map((sal) => sal.id)
        .filter((id) => NEW_GWIIN_IDS.has(id));
      expect(actualIds).toEqual(calculateReferenceGwiinIds(result.pillars, position));
    }
  });

  it.each([
    ...GOLDEN_CASES.map((testCase) => ({
      id: testCase.id,
      birthDate: testCase.birth.date,
      birthTime: testCase.birth.time,
      calendar: testCase.birth.calendar,
      gender: testCase.birth.gender,
    })),
    ...STRENGTH_VALIDATION_CASES.map((testCase) => ({
      id: testCase.id,
      birthDate: testCase.birth.date,
      birthTime: testCase.birth.time,
      calendar: testCase.birth.calendar,
      gender: testCase.birth.gender,
    })),
  ])("matches the independent phase-two sal reference for $id", (testCase) => {
    const result = getProductionSaju(
      testCase.birthDate,
      testCase.birthTime ?? "12:00",
      testCase.calendar,
      testCase.gender ?? "female",
    );

    for (const position of POSITIONS) {
      const actualIds = result.sals[position].sals
        .map((sal) => sal.id)
        .filter((id) => NEW_PHASE_TWO_IDS.has(id));
      expect(actualIds).toEqual(calculateReferencePhaseTwoIds(result.pillars, position));
    }
  });

  it.each([
    {
      id: "GOLDEN-001",
      birthDate: "1992-01-14", birthTime: "13:00", gender: "female" as const,
      expected: {
        hour: { twelveSal: "육해살", specialSals: ["도화살"] },
        day: { twelveSal: "월살", specialSals: ["화개살"] },
        month: { twelveSal: "월살", specialSals: ["화개살"] },
        year: { twelveSal: "화개살", specialSals: [] },
      },
    },
    {
      id: "VALIDATION-005",
      birthDate: "2002-02-05", birthTime: "00:00", gender: "male" as const,
      expected: {
        hour: { twelveSal: "재살", specialSals: [] },
        day: { twelveSal: "월살", specialSals: ["화개살"] },
        month: { twelveSal: "지살", specialSals: ["역마살"] },
        year: { twelveSal: "장성살", specialSals: [] },
      },
    },
    {
      id: "VALIDATION-006",
      birthDate: "1983-09-25", birthTime: "11:00", gender: "male" as const,
      expected: {
        hour: { twelveSal: "역마살", specialSals: [] },
        day: { twelveSal: "반안살", specialSals: ["화개살"] },
        month: { twelveSal: "재살", specialSals: ["천을귀인", "도화살"] },
        year: { twelveSal: "지살", specialSals: ["천을귀인"] },
      },
    },
    {
      id: "VALIDATION-008",
      birthDate: "1994-02-22", birthTime: "19:00", gender: "male" as const,
      expected: {
        hour: { twelveSal: "육해살", specialSals: [] },
        day: { twelveSal: "년살", specialSals: [] },
        month: { twelveSal: "지살", specialSals: [] },
        year: { twelveSal: "화개살", specialSals: [] },
      },
    },
    {
      id: "VALIDATION-010",
      birthDate: "1979-07-20", birthTime: "13:55", gender: "male" as const,
      expected: {
        hour: { twelveSal: "화개살", specialSals: ["천을귀인"] },
        day: { twelveSal: "년살", specialSals: [] },
        month: { twelveSal: "화개살", specialSals: ["천을귀인"] },
        year: { twelveSal: "화개살", specialSals: ["천을귀인"] },
      },
    },
  ])("calculates canonical sals for $id", ({ birthDate, birthTime, gender, expected }) => {
    const result = getProductionSaju(birthDate, birthTime, "solar", gender);

    const legacySals = Object.fromEntries(
      Object.entries(result.sals).map(([position, sal]) => [position, {
        twelveSal: sal.twelveSal,
        specialSals: sal.specialSals.filter((name) => PREVIOUS_SPECIAL_SALS.has(name)),
      }]),
    );
    expect(legacySals).toEqual(expected);
  });

  it.each([
    { id: "CASE 1", birthDate: "1992-01-14", birthTime: "13:00", gender: "female" as const, expected: ["hour", "month", "year"] },
    { id: "CASE 2", birthDate: "1994-03-15", birthTime: "14:30", gender: "male" as const, expected: ["month", "year"] },
    { id: "CASE 3", birthDate: "2002-02-05", birthTime: "00:00", gender: "male" as const, expected: ["hour", "day", "year"] },
    { id: "CASE 4", birthDate: "1983-09-25", birthTime: "11:00", gender: "male" as const, expected: ["month"] },
    { id: "CASE 5", birthDate: "1994-02-22", birthTime: "19:00", gender: "male" as const, expected: ["day", "year"] },
    { id: "CASE 6", birthDate: "1979-07-20", birthTime: "13:55", gender: "male" as const, expected: ["month"] },
    { id: "CASE 7", birthDate: "1989-05-09", birthTime: "11:00", gender: "female" as const, expected: [] },
    { id: "CASE 8", birthDate: "1981-12-20", birthTime: "17:00", gender: "male" as const, expected: ["hour", "day", "year"] },
  ])("reproduces the externally verified hyeonchim positions for $id", ({
    birthDate,
    birthTime,
    gender,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "hyeonchim_sal"),
    );

    expect(actual).toEqual(expected);
  });

  it.each([
    {
      id: "MUNGOK-001",
      birthDate: "1994-02-22",
      birthTime: "19:00",
      gender: "male" as const,
      dayStem: "己",
      expected: ["day"],
    },
    {
      id: "MUNGOK-002",
      birthDate: "1981-12-20",
      birthTime: "17:00",
      gender: "male" as const,
      dayStem: "壬",
      expected: ["hour", "day"],
    },
  ])("reproduces the externally verified mungok positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "mungok_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    {
      id: "MUNCHANG-EXISTING",
      birthDate: "1994-02-22",
      birthTime: "19:00",
      gender: "male" as const,
      dayStem: "己",
      expectedHour: "癸酉",
      expected: ["hour"],
    },
    {
      id: "MUNCHANG-SIN-POSITIVE",
      birthDate: "1992-08-13",
      birthTime: "00:50",
      gender: "female" as const,
      dayStem: "辛",
      expectedHour: "戊子",
      expected: ["hour"],
    },
    {
      id: "MUNCHANG-SIN-NEGATIVE",
      birthDate: "1992-08-13",
      birthTime: "20:00",
      gender: "female" as const,
      dayStem: "辛",
      expectedHour: "戊戌",
      expected: [],
    },
  ])("reproduces the externally verified munchang policy for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expectedHour,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "munchang_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(result.pillars.hour).toBe(expectedHour);
    expect(actual).toEqual(expected);
  });

  it.each([
    {
      id: "GEUMYEO-001",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      dayStem: "庚",
      expected: ["year"],
    },
    {
      id: "GEUMYEO-002",
      birthDate: "2002-02-05",
      birthTime: "00:00",
      gender: "male" as const,
      dayStem: "甲",
      expected: ["day"],
    },
    {
      id: "GEUMYEO-003",
      birthDate: "1979-07-20",
      birthTime: "13:55",
      gender: "male" as const,
      dayStem: "戊",
      expected: ["hour", "month", "year"],
    },
    {
      id: "GEUMYEO-004",
      birthDate: "1992-02-19",
      birthTime: "10:30",
      gender: "female" as const,
      dayStem: "乙",
      expected: ["hour"],
    },
    {
      id: "GEUMYEO-005",
      birthDate: "1992-08-13",
      birthTime: "22:30",
      gender: "female" as const,
      dayStem: "辛",
      expected: ["hour"],
    },
  ])("reproduces the externally verified geumyeo positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "geumyeo"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "CHEONJU-001", birthDate: "1994-02-22", birthTime: "19:00", gender: "male" as const, dayStem: "己", expected: ["hour"] },
    { id: "CHEONJU-002", birthDate: "1983-09-25", birthTime: "11:00", gender: "male" as const, dayStem: "丙", expected: ["hour"] },
    { id: "CHEONJU-003", birthDate: "1983-10-05", birthTime: "10:30", gender: "male" as const, dayStem: "丙", expected: ["hour"] },
    { id: "CHEONJU-004", birthDate: "1992-05-11", birthTime: "12:30", gender: "female" as const, dayStem: "丁", expected: ["hour"] },
    { id: "CHEONJU-005", birthDate: "1992-02-19", birthTime: "12:30", gender: "female" as const, dayStem: "乙", expected: ["hour"] },
    { id: "CHEONJU-006", birthDate: "1992-08-13", birthTime: "00:50", gender: "female" as const, dayStem: "辛", expected: ["hour"] },
  ])("reproduces the externally verified cheonju positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "cheonju_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "GWANGWI-001", birthDate: "1981-12-20", birthTime: "17:00", gender: "male" as const, dayStem: "壬", expected: ["hour", "day"] },
    { id: "GWANGWI-002", birthDate: "1992-05-11", birthTime: "12:30", gender: "female" as const, dayStem: "丁", expected: ["year"] },
    { id: "GWANGWI-003", birthDate: "1992-02-19", birthTime: "10:30", gender: "female" as const, dayStem: "乙", expected: ["hour"] },
  ])("reproduces the externally verified gwangwi hakgwan positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "gwangwi_hakgwan"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "HAKDANG-001", birthDate: "1994-02-22", birthTime: "19:00", gender: "male" as const, dayStem: "己", expectedHour: "癸酉", expected: ["hour"] },
    { id: "HAKDANG-002", birthDate: "1981-12-20", birthTime: "17:00", gender: "male" as const, dayStem: "壬", expectedHour: "戊申", expected: ["hour", "day"] },
    { id: "HAKDANG-TARGET-001", birthDate: "1992-02-19", birthTime: "12:30", gender: "female" as const, dayStem: "乙", expectedHour: "壬午", expected: ["hour"] },
    { id: "HAKDANG-TARGET-002", birthDate: "1992-02-19", birthTime: "10:30", gender: "female" as const, dayStem: "乙", expectedHour: "辛巳", expected: [] },
  ])("reproduces the externally verified modern hakdang policy for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expectedHour,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "hakdang_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(result.pillars.hour).toBe(expectedHour);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "BOKSEONG-001", birthDate: "2002-02-05", birthTime: "00:00", gender: "male" as const, dayStem: "甲", expected: ["month"] },
    { id: "BOKSEONG-002", birthDate: "1992-02-19", birthTime: "06:30", gender: "female" as const, dayStem: "乙", expected: ["day"] },
    { id: "BOKSEONG-003", birthDate: "1992-01-14", birthTime: "13:00", gender: "female" as const, dayStem: "己", expected: ["year"] },
    { id: "BOKSEONG-004", birthDate: "2002-02-05", birthTime: "16:30", gender: "male" as const, dayStem: "甲", expected: ["month"] },
  ])("reproduces the externally verified bokseong positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "bokseong_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "CHEONBOK-001", birthDate: "1994-02-22", birthTime: "19:00", gender: "male" as const, dayStem: "己", expected: ["month"] },
    { id: "CHEONBOK-002", birthDate: "1992-02-19", birthTime: "16:30", gender: "female" as const, dayStem: "乙", expected: ["hour", "year"] },
    { id: "CHEONBOK-003", birthDate: "1992-05-11", birthTime: "12:30", gender: "female" as const, dayStem: "丁", expected: ["day"] },
    { id: "CHEONBOK-004", birthDate: "2002-02-05", birthTime: "00:00", gender: "male" as const, dayStem: "甲", expected: [] },
  ])("reproduces the externally verified cheonbok positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "cheonbok_gwiin"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    {
      id: "BAEKHO-001",
      birthDate: "2002-02-05",
      birthTime: "00:00",
      gender: "male" as const,
      expectedPillars: { year: "壬午", month: "壬寅", day: "甲辰", hour: "甲子" },
      expected: ["day"],
    },
    {
      id: "BAEKHO-002",
      birthDate: "1990-01-07",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "丁丑", day: "壬申", hour: "丙午" },
      expected: ["month"],
    },
    {
      id: "BAEKHO-003",
      birthDate: "1992-01-14",
      birthTime: "13:00",
      gender: "female" as const,
      expectedPillars: { year: "辛未", month: "辛丑", day: "己丑", hour: "庚午" },
      expected: [],
    },
    {
      id: "BAEKHO-004",
      birthDate: "1983-04-16",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "癸亥", month: "丙辰", day: "甲戌", hour: "庚午" },
      expected: [],
    },
  ])("reproduces the externally verified baekho policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "baekho_daesal"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
  });

  it.each([
    {
      id: "NAKJEONG-001",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      expectedPillars: { year: "甲戌", month: "丁卯", day: "庚子", hour: "癸未" },
      expected: ["day"],
    },
    {
      id: "NAKJEONG-002",
      birthDate: "1980-01-03",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "己未", month: "丙子", day: "乙亥", hour: "壬午" },
      expected: ["month"],
    },
    {
      id: "NAKJEONG-003",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: ["hour", "day", "month", "year"],
    },
    {
      id: "NAKJEONG-NEGATIVE",
      birthDate: "1992-01-14",
      birthTime: "13:00",
      gender: "female" as const,
      expectedPillars: { year: "辛未", month: "辛丑", day: "己丑", hour: "庚午" },
      expected: [],
    },
  ])("reproduces the externally verified nakjeong policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "nakjeong_gwansal"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("nakjeong_gwansal");
  });

  it.each([
    {
      id: "CHEONMUN-001",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      expectedPillars: { year: "甲戌", month: "丁卯", day: "庚子", hour: "癸未" },
      expected: ["year"],
    },
    {
      id: "CHEONMUN-002",
      birthDate: "1983-09-25",
      birthTime: "11:00",
      gender: "male" as const,
      expectedPillars: { year: "癸亥", month: "辛酉", day: "丙辰", hour: "癸巳" },
      expected: ["year"],
    },
    {
      id: "CHEONMUN-003",
      birthDate: "1980-01-03",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "己未", month: "丙子", day: "乙亥", hour: "壬午" },
      expected: ["day"],
    },
    {
      id: "CHEONMUN-004",
      birthDate: "1983-04-16",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "癸亥", month: "丙辰", day: "甲戌", hour: "庚午" },
      expected: ["day", "year"],
    },
    {
      id: "CHEONMUN-NEGATIVE",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: [],
    },
  ])("reproduces the externally verified cheonmun policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "cheonmun_seong"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("cheonmun_seong");
  });

  // 포스텔러는 source month를 제외한 year/day/hour 확장 정책을 보이지만,
  // canonical은 한국 명리 문헌의 좁은 day/hour-only 정책을 고정한다.
  it.each([
    {
      id: "HWANGEUN-001",
      birthDate: "1981-12-20",
      birthTime: "17:00",
      gender: "male" as const,
      expectedPillars: { year: "辛酉", month: "庚子", day: "壬申", hour: "戊申" },
      expected: ["hour", "day"],
    },
    {
      id: "HWANGEUN-002",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: ["hour", "day"],
    },
    {
      id: "HWANGEUN-003",
      birthDate: "1994-02-05",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "甲戌", month: "丙寅", day: "壬戌", hour: "丙午" },
      expected: ["day"],
    },
    {
      id: "HWANGEUN-NEGATIVE",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      expectedPillars: { year: "甲戌", month: "丁卯", day: "庚子", hour: "癸未" },
      expected: [],
    },
  ])("reproduces the canonical Korean-myeongri hwangeun policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "hwangeun_daesa"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("hwangeun_daesa");
  });

  it("uses the post-ipchun canonical month branch rather than the lunar month for hwangeun", () => {
    const result = getSaju("1994-02-05", "12", "30", "solar", "female", false);

    expect(result.pillars.month).toBe("丙寅");
    expect(result.sals.day.sals.some((sal) => sal.id === "hwangeun_daesa")).toBe(true);
    expect(result.sals.year.sals.some((sal) => sal.id === "hwangeun_daesa")).toBe(false);
  });

  // 만세력 천을귀인의 라벨 미노출은 음성으로 취급하지 않는다. 포스텔러에서
  // year/day/hour가 각각 독립 확인된 현대 출생 명리의 predecessor 정책을 고정한다.
  it.each([
    {
      id: "CHEONUI-001",
      birthDate: "1980-01-03",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "己未", month: "丙子", day: "乙亥", hour: "壬午" },
      expected: ["day"],
    },
    {
      id: "CHEONUI-002",
      birthDate: "1980-09-09",
      birthTime: "02:30",
      gender: "female" as const,
      expectedPillars: { year: "庚申", month: "乙酉", day: "乙酉", hour: "丁丑" },
      expected: ["year"],
    },
    {
      id: "CHEONUI-003",
      birthDate: "1980-02-06",
      birthTime: "02:30",
      gender: "female" as const,
      expectedPillars: { year: "庚申", month: "戊寅", day: "己酉", hour: "乙丑" },
      expected: ["hour"],
    },
    {
      id: "CHEONUI-NEGATIVE-001",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: [],
    },
    {
      id: "CHEONUI-NEGATIVE-002",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      expectedPillars: { year: "甲戌", month: "丁卯", day: "庚子", hour: "癸未" },
      expected: [],
    },
  ])("reproduces the externally verified cheonui policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "cheonui_seong"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("cheonui_seong");
  });

  // 고전의 넓은 L8(甲寅·乙巳·丙午·丁巳·戊午·戊申·辛亥·壬子) 및
  // 일주 전용 해석과 구분한다. Production canonical은 천을귀인 앱에서
  // pillar 단위로 검증된 현대 한국 L5를 네 기둥에 독립 적용한다.
  // 포스텔러의 라벨 미노출은 음성 결과로 취급하지 않는다.
  it.each([
    {
      id: "GORAN-001",
      birthDate: "1973-05-10",
      birthTime: "02:30",
      gender: "female" as const,
      expectedPillars: { year: "癸丑", month: "丁巳", day: "丙午", hour: "己丑" },
      expected: ["month"],
    },
    {
      id: "GORAN-002",
      birthDate: "1970-01-25",
      birthTime: "02:30",
      gender: "female" as const,
      expectedPillars: { year: "己酉", month: "丁丑", day: "乙巳", hour: "丁丑" },
      expected: ["day"],
    },
    {
      id: "GORAN-003",
      birthDate: "1971-02-05",
      birthTime: "02:30",
      gender: "female" as const,
      expectedPillars: { year: "辛亥", month: "庚寅", day: "辛酉", hour: "己丑" },
      expected: ["year"],
    },
    {
      id: "GORAN-004",
      birthDate: "1981-12-20",
      birthTime: "17:00",
      gender: "male" as const,
      expectedPillars: { year: "辛酉", month: "庚子", day: "壬申", hour: "戊申" },
      expected: ["hour"],
    },
    {
      id: "GORAN-NEGATIVE",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: [],
    },
  ])("reproduces the externally verified Korean L5 goran policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "goran_sal"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("goran_sal");
  });

  // 《三命通會》의 삼회/방합 계통을 따른다. Canonical yearBranch만 source로
  // 사용하고, source year를 제외한 month/day/hour에서 target branch를 찾는다.
  // 포스텔러의 남성 과숙 미노출과 천을귀인 앱 미노출은 음성으로 취급하지 않는다.
  it.each([
    {
      id: "GWASUK-001",
      birthDate: "1994-07-15",
      birthTime: "12:30",
      gender: "female" as const,
      expectedPillars: { year: "甲戌", month: "辛未", day: "壬寅", hour: "丙午" },
      expected: ["month"],
    },
    {
      id: "GWASUK-002",
      birthDate: "1994-03-15",
      birthTime: "14:30",
      gender: "male" as const,
      expectedPillars: { year: "甲戌", month: "丁卯", day: "庚子", hour: "癸未" },
      expected: ["hour"],
    },
    {
      id: "GWASUK-003",
      birthDate: "2002-02-05",
      birthTime: "00:00",
      gender: "male" as const,
      expectedPillars: { year: "壬午", month: "壬寅", day: "甲辰", hour: "甲子" },
      expected: ["day"],
    },
    {
      id: "GWASUK-NEGATIVE-001",
      birthDate: "1989-05-09",
      birthTime: "11:00",
      gender: "female" as const,
      expectedPillars: { year: "己巳", month: "己巳", day: "己巳", hour: "己巳" },
      expected: [],
    },
    {
      id: "GWASUK-NEGATIVE-002",
      birthDate: "1992-01-14",
      birthTime: "13:00",
      gender: "female" as const,
      expectedPillars: { year: "辛未", month: "辛丑", day: "己丑", hour: "庚午" },
      expected: [],
    },
  ])("reproduces the canonical year-branch gwasuk policy for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "gwasuk_sal"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(actual).toEqual(expected);
    expect(result.relationSals.map((relation) => relation.id))
      .not.toContain("gwasuk_sal");
  });

  it.each([
    {
      id: "GWIMUN-001",
      birthDate: "1981-12-20",
      birthTime: "17:00",
      gender: "male" as const,
      expectedPillars: { year: "辛酉", month: "庚子", day: "壬申", hour: "戊申" },
      expectedRelations: [{ from: "year", to: "month", branches: ["酉", "子"] }],
      expectedProjection: ["month", "year"],
    },
    {
      id: "GWIMUN-002",
      birthDate: "1983-09-25",
      birthTime: "11:00",
      gender: "male" as const,
      expectedPillars: { year: "癸亥", month: "辛酉", day: "丙辰", hour: "癸巳" },
      expectedRelations: [{ from: "year", to: "day", branches: ["亥", "辰"] }],
      expectedProjection: ["day", "year"],
    },
    {
      id: "GWIMUN-003",
      birthDate: "1992-01-14",
      birthTime: "13:00",
      gender: "female" as const,
      expectedPillars: { year: "辛未", month: "辛丑", day: "己丑", hour: "庚午" },
      expectedRelations: [
        { from: "month", to: "hour", branches: ["丑", "午"] },
        { from: "day", to: "hour", branches: ["丑", "午"] },
      ],
      expectedProjection: ["hour", "day", "month"],
    },
  ])("reproduces the externally verified gwimun relations for $id", ({
    birthDate,
    birthTime,
    gender,
    expectedPillars,
    expectedRelations,
    expectedProjection,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const projected = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "gwimun_gwansal"),
    );

    expect(result.pillars).toEqual(expectedPillars);
    expect(result.relationSals).toEqual(expectedRelations.map((relation) => ({
      id: "gwimun_gwansal",
      name: "귀문관살",
      category: "relation",
      ...relation,
    })));
    expect(result.normalizedSaju.relationSals).toEqual(result.relationSals);
    expect(projected).toEqual(expectedProjection);
    for (const position of projected) {
      expect(result.sals[position].sals.filter((sal) => sal.id === "gwimun_gwansal"))
        .toHaveLength(1);
    }
    expect(Object.keys(result.normalizedSaju.relations).sort()).toEqual(
      ["breaks", "clashes", "combinations", "harms", "punishments"].sort(),
    );
  });

  it("excludes unknown-hour gwimun relations while preserving visible-pillar relations", () => {
    const result = getSaju("1981-12-20", "17", "00", "solar", "male", true);

    expect(result.relationSals).toEqual([{
      id: "gwimun_gwansal",
      name: "귀문관살",
      category: "relation",
      from: "year",
      to: "month",
      branches: ["酉", "子"],
    }]);
    expect(result.sals.hour.sals).toEqual([]);
  });

  it.each([
    { id: "HYEOPROK-001", birthDate: "1992-01-14", birthTime: "13:00", gender: "female" as const, dayStem: "己", expected: ["year"] },
    { id: "HYEOPROK-002", birthDate: "1981-12-20", birthTime: "17:00", gender: "male" as const, dayStem: "壬", expected: ["month"] },
    { id: "HYEOPROK-003", birthDate: "1983-09-25", birthTime: "11:00", gender: "male" as const, dayStem: "丙", expected: ["day"] },
    { id: "1989 formula regression", birthDate: "1989-05-09", birthTime: "11:00", gender: "female" as const, dayStem: "己", expected: ["hour", "day", "month", "year"] },
  ])("reproduces the pillar-level hyeoprok policy for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "hyeoprok"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    { id: "YANGIN-001", birthDate: "1992-02-19", birthTime: "08:00", gender: "female" as const, dayStem: "乙", expected: ["hour"] },
    { id: "YANGIN-002", birthDate: "1992-05-11", birthTime: "14:00", gender: "female" as const, dayStem: "丁", expected: ["hour"] },
    { id: "YANGIN-003", birthDate: "1992-08-13", birthTime: "20:00", gender: "female" as const, dayStem: "辛", expected: ["hour"] },
    { id: "YANGIN-004", birthDate: "1992-11-13", birthTime: "02:00", gender: "female" as const, dayStem: "癸", expected: ["hour"] },
    { id: "existing 己 reference", birthDate: "1992-01-14", birthTime: "13:00", gender: "female" as const, dayStem: "己", expected: ["year"] },
    { id: "existing 壬 reference", birthDate: "1981-12-20", birthTime: "17:00", gender: "male" as const, dayStem: "壬", expected: ["month"] },
  ])("reproduces the externally verified yangin positions for $id", ({
    birthDate,
    birthTime,
    gender,
    dayStem,
    expected,
  }) => {
    const result = getSaju(
      birthDate,
      birthTime.slice(0, 2),
      birthTime.slice(3, 5),
      "solar",
      gender,
      false,
    );
    const actual = (["hour", "day", "month", "year"] as const).filter((position) =>
      result.sals[position].sals.some((sal) => sal.id === "yangin_sal"),
    );

    expect(result.pillars.day[0]).toBe(dayStem);
    expect(actual).toEqual(expected);
  });

  it.each([
    ["00:00", "甲辰", "甲子"],
    ["00:29", "甲辰", "甲子"],
    ["00:30", "甲辰", "甲子"],
    ["23:29", "甲辰", "乙亥"],
    ["23:30", "乙巳", "丙子"],
    ["23:59", "乙巳", "丙子"],
  ])(
    "getSaju applies the official boundary at 2002-02-05 %s",
    (birthTime, expectedDay, expectedHour) => {
      const result = getProductionSaju(
        "2002-02-05",
        birthTime,
        "solar",
        "male",
      );

      expect(result.pillars.day).toBe(expectedDay);
      expect(result.pillars.hour).toBe(expectedHour);
      expect(result.dayStem).toBe(expectedDay[0]);
      expect(result.dayBranch).toBe(expectedDay[1]);
      expect(result.calculationPolicy).toMatchObject({
        timeAdjustment: "KOREA_MINUS_30_V1",
        dayBoundary: "ZI_START_NEXT_DAY_V1",
      });
    },
  );

  it.each([
    {
      birthDate: "1992-01-14",
      birthTime: "13:00",
      calendar: "solar" as const,
      gender: "female" as const,
      expected: {
        year: "辛未",
        month: "辛丑",
        day: "己丑",
        hour: "庚午",
      },
    },
    {
      birthDate: "1994-03-15",
      birthTime: "14:30",
      calendar: "solar" as const,
      gender: "male" as const,
      expected: {
        year: "甲戌",
        month: "丁卯",
        day: "庚子",
        hour: "癸未",
      },
    },
  ])(
    "preserves the established production regression: $birthDate $birthTime",
    ({ birthDate, birthTime, calendar, gender, expected }) => {
      const result = getProductionSaju(
        birthDate,
        birthTime,
        calendar,
        gender,
      );

      expect(result.pillars).toEqual(expected);
    },
  );

  it.each(STRENGTH_VALIDATION_CASES)(
    "preserves $id through the production getSaju entry point",
    (validationCase) => {
      const result = getProductionSaju(
        validationCase.birth.date,
        validationCase.birth.time,
        validationCase.birth.calendar,
        validationCase.birth.gender,
      );

      expect(result.pillars).toEqual(validationCase.expectedPillars);
      expect(result.dayStem).toBe(validationCase.expectedDayMaster);
    },
  );

  it("uses the canonical day master for production dependent data", () => {
    const result = getProductionSaju(
      "2002-02-05",
      "23:30",
      "solar",
      "male",
    );
    const normalized = result.normalizedSaju;
    const policyResult = calculateSajuWithBoundaryPolicies({
      birthDate: "2002-02-05",
      birthTime: "23:30",
      calendar: "solar",
      gender: "male",
    });

    expect(result.pillars).toEqual({
      year: `${normalized.pillars.year.stem}${normalized.pillars.year.branch}`,
      month: `${normalized.pillars.month.stem}${normalized.pillars.month.branch}`,
      day: `${normalized.pillars.day.stem}${normalized.pillars.day.branch}`,
      hour: `${normalized.pillars.hour?.stem}${normalized.pillars.hour?.branch}`,
    });

    for (const position of POSITIONS) {
      const pillar = normalized.pillars[position];
      if (!pillar) continue;

      expect(result.tenGods[position].stem).toBe(
        position === "day"
          ? "(일간)"
          : getTenGodForStem(normalized.dayMaster.stem, pillar.stem),
      );
      expect(result.stages12.bong[position]).toBe(
        normalized.twelveStages.find(
          (item) => item.pillar === position && item.basis === "bong",
        )?.stage,
      );
      expect(result.stages12.geo[position]).toBe(
        normalized.twelveStages.find(
          (item) => item.pillar === position && item.basis === "geo",
        )?.stage,
      );
    }

    expect(result.gongmang).toEqual(policyResult.gongmang);
    expect(result.hiddenStems).toEqual(normalized.hiddenStems);
    expect(result.relations).toEqual(normalized.relations);
  });

  it("feeds the same canonical chart into the production myeongri analysis", () => {
    const input = {
      birthDate: "2002-02-05",
      birthTime: "23:30",
      calendar: "solar" as const,
      gender: "male" as const,
      timezone: "Asia/Seoul",
      targetYear: 2026,
    };
    const result = analyzeUnlogSaju(input);

    expect(result.normalizedSaju.pillars.day).toMatchObject({
      stem: "乙",
      branch: "巳",
    });
    expect(result.normalizedSaju.pillars.hour).toMatchObject({
      stem: "丙",
      branch: "子",
    });
    expect(result.calculationPolicy).toMatchObject({
      timeAdjustment: "KOREA_MINUS_30_V1",
      dayBoundary: "ZI_START_NEXT_DAY_V1",
      applied: true,
    });
    expect(result.analysis.strength).toEqual(
      analyzeStrength(result.normalizedSaju),
    );
  });
});
