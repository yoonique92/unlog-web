import { calculateSaju } from "ssaju";
import type { SajuInput, SajuResult } from "ssaju";
import { calculateSajuRaw } from "@/lib/saju/calculator";
import { normalizeSaju } from "@/lib/saju/normalize";
import type {
  CalculatedSaju,
  NormalizedSaju,
  SajuCalculationInput,
} from "@/lib/saju/types";
import { getTenGodForStem } from "@/lib/tenGodUtils";
import { analyzeStrength } from "./strength";
import type {
  StrengthContribution,
  StrengthAnalysis,
} from "./types";

export type DiagnosticPillarKey = "year" | "month" | "day" | "hour";
export type DiagnosticMode = "currentMinus30" | "unadjusted";

export interface SajuDiagnosticInput extends SajuCalculationInput {
  leapMonth?: boolean;
  expectedPillars?: Partial<Record<DiagnosticPillarKey, string>>;
}

export type DiagnosticVerdict =
  | "match"
  | "mismatch"
  | "not_checked"
  | "expected_missing";

interface DateTimeSnapshot {
  date: string;
  time: string;
  isoLike: string;
}

interface PillarSnapshot {
  year: string;
  month: string;
  day: string;
  hour: string | null;
}

interface TenGodSnapshot {
  stems: Record<DiagnosticPillarKey, string | null>;
  branches: Record<DiagnosticPillarKey, string | null>;
  hiddenStems: Array<{
    pillar: DiagnosticPillarKey;
    branch: string;
    stem: string;
    tenGod: string;
    role: NormalizedSaju["hiddenStems"][number]["role"];
  }>;
}

interface StrengthContributionGroups {
  monthCommand: StrengthContribution[];
  roots: StrengthContribution[];
  stems: StrengthContribution[];
  branches: StrengthContribution[];
  others: StrengthContribution[];
}

export interface SajuDiagnosticModeResult {
  mode: DiagnosticMode;
  label: string;
  time: {
    original: DateTimeSnapshot;
    effective: DateTimeSnapshot;
    ssajuInput: SajuResult["input"];
    normalizedKst: SajuResult["normalized"]["kst"];
    calculation: SajuResult["normalized"]["calculation"];
  };
  pillars: PillarSnapshot;
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
  };
  tenGods: TenGodSnapshot;
  strength: {
    legacy: {
      score: number;
      code: SajuResult["advanced"]["dayStrength"]["strength"];
      label: string;
    };
    myeongri: {
      score: number;
      level: StrengthAnalysis["level"];
      levelLabel: string;
      factors: StrengthAnalysis["factors"];
      contributions: StrengthContribution[];
      groups: StrengthContributionGroups;
    };
  };
}

export interface DiagnosticComparisonRow {
  pillar: DiagnosticPillarKey;
  label: string;
  expected: string | null;
  currentMinus30: string | null;
  unadjusted: string | null;
  currentVerdict: DiagnosticVerdict;
  unadjustedVerdict: DiagnosticVerdict;
  modesDiffer: boolean;
}

export interface SajuDiagnosticReport {
  input: {
    calendar: "solar" | "lunar";
    date: string;
    time: string;
    timezone: string;
    gender: "male" | "female";
    birthTimeUnknown: boolean;
    leapMonthRequested: boolean;
    leapMonthAppliedByCurrentInput: boolean;
  };
  currentMinus30: SajuDiagnosticModeResult;
  unadjusted: SajuDiagnosticModeResult;
  comparison: DiagnosticComparisonRow[];
  verificationRule: string;
}

const PILLAR_KEYS: DiagnosticPillarKey[] = [
  "year",
  "month",
  "day",
  "hour",
];

const PILLAR_LABELS: Record<DiagnosticPillarKey, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

const LEGACY_STRENGTH_LABELS: Record<
  SajuResult["advanced"]["dayStrength"]["strength"],
  string
> = {
  strong: "신강",
  neutral: "중화",
  weak: "신약",
};

const MYEONGRI_STRENGTH_LABELS: Record<StrengthAnalysis["level"], string> = {
  very_weak: "극신약",
  weak: "신약",
  balanced_weak: "중화신약",
  balanced: "중화",
  balanced_strong: "중화신강",
  strong: "신강",
  very_strong: "극신강",
};

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function parseTime(input: SajuCalculationInput) {
  const [hour = input.birthHour ?? 12, minute = input.birthMinute ?? 0] =
    input.birthTime?.split(":").map(Number) ?? [];
  return { hour, minute };
}

function formatDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function dateTimeSnapshot(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): DateTimeSnapshot {
  const date = formatDate(year, month, day);
  const time = formatTime(hour, minute);
  return { date, time, isoLike: `${date}T${time}` };
}

function buildUnadjustedCalculation(
  input: SajuDiagnosticInput,
): CalculatedSaju {
  const { year, month, day } = parseDate(input.birthDate);
  const parsedTime = parseTime(input);
  const birthTimeUnknown = input.birthTimeUnknown === true;
  const hour = parsedTime.hour;
  const minute = parsedTime.minute;
  const targetYear = input.targetYear ?? new Date().getFullYear();

  const ssajuInput: SajuInput = {
    year,
    month,
    day,
    hour,
    minute,
    gender: input.gender === "female" ? "\uC5EC" : "\uB0A8",
    calendar: input.calendar ?? "solar",
    // 운영 입력은 아직 윤달 플래그를 전달하지 않는다. A/B는 시간 보정만 비교한다.
    leap: false,
    timezone: input.timezone ?? "Asia/Seoul",
    applyLocalMeanTime: false,
    now: new Date(`${targetYear}-07-01T12:00:00+09:00`),
  };

  return {
    raw: calculateSaju(ssajuInput),
    birthTimeUnknown,
    unlogTime: {
      original: { hour, minute },
      adjusted: { year, month, day, hour, minute },
      policy: "NO_ADJUSTMENT_DIAGNOSTIC",
    },
  };
}

function getPillarSnapshot(normalized: NormalizedSaju): PillarSnapshot {
  return {
    year: `${normalized.pillars.year.stem}${normalized.pillars.year.branch}`,
    month: `${normalized.pillars.month.stem}${normalized.pillars.month.branch}`,
    day: `${normalized.pillars.day.stem}${normalized.pillars.day.branch}`,
    hour: normalized.pillars.hour
      ? `${normalized.pillars.hour.stem}${normalized.pillars.hour.branch}`
      : null,
  };
}

function getTenGodSnapshot(
  normalized: NormalizedSaju,
  raw: SajuResult,
): TenGodSnapshot {
  const stems = {} as Record<DiagnosticPillarKey, string | null>;
  const branches = {} as Record<DiagnosticPillarKey, string | null>;

  for (const key of PILLAR_KEYS) {
    const rawTenGod = raw.tenGods[key];
    const excludedHour = key === "hour" && normalized.birth.birthTimeUnknown;
    stems[key] = excludedHour ? null : rawTenGod.stem;
    branches[key] = excludedHour ? null : rawTenGod.branch;
  }

  const hiddenStems = normalized.hiddenStems.map((item) => ({
    pillar: item.pillar,
    branch: item.branch,
    stem: item.stem,
    tenGod: getTenGodForStem(normalized.dayMaster.stem, item.stem),
    role: item.role,
  }));

  return { stems, branches, hiddenStems };
}

function groupContributions(
  contributions: StrengthContribution[],
): StrengthContributionGroups {
  const monthCommand = contributions.filter(
    (item) => item.category === "month_command",
  );
  const roots = contributions.filter((item) => item.category === "root");
  const stems = contributions.filter(
    (item) => item.source.endsWith(".stem") && item.category !== "root",
  );
  const branches = contributions.filter(
    (item) => item.source.endsWith(".branch") && item.category !== "month_command",
  );
  const assigned = new Set([
    ...monthCommand,
    ...roots,
    ...stems,
    ...branches,
  ]);
  const others = contributions.filter((item) => !assigned.has(item));

  return { monthCommand, roots, stems, branches, others };
}

function buildModeResult(
  mode: DiagnosticMode,
  label: string,
  calculated: CalculatedSaju,
  input: SajuDiagnosticInput,
): SajuDiagnosticModeResult {
  const normalized = normalizeSaju(calculated, input);
  const strength = analyzeStrength(normalized);
  const original = calculated.unlogTime.original;
  const effective = calculated.unlogTime.adjusted;
  const legacyStrength = calculated.raw.advanced.dayStrength;
  const originalDate = parseDate(input.birthDate);

  return {
    mode,
    label,
    time: {
      original: dateTimeSnapshot(
        originalDate.year,
        originalDate.month,
        originalDate.day,
        original.hour,
        original.minute,
      ),
      effective: dateTimeSnapshot(
        effective.year,
        effective.month,
        effective.day,
        effective.hour,
        effective.minute,
      ),
      ssajuInput: calculated.raw.input,
      normalizedKst: calculated.raw.normalized.kst,
      calculation: calculated.raw.normalized.calculation,
    },
    pillars: getPillarSnapshot(normalized),
    dayMaster: {
      stem: normalized.dayMaster.stem,
      element: normalized.dayMaster.element,
      yinYang: normalized.dayMaster.yinYang,
    },
    tenGods: getTenGodSnapshot(normalized, calculated.raw),
    strength: {
      legacy: {
        score: legacyStrength.score,
        code: legacyStrength.strength,
        label: LEGACY_STRENGTH_LABELS[legacyStrength.strength],
      },
      myeongri: {
        score: strength.internalScore,
        level: strength.level,
        levelLabel: MYEONGRI_STRENGTH_LABELS[strength.level],
        factors: strength.factors,
        contributions: strength.contributions,
        groups: groupContributions(strength.contributions),
      },
    },
  };
}

function compareExpected(
  expected: Partial<Record<DiagnosticPillarKey, string>> | undefined,
  result: PillarSnapshot,
): Record<DiagnosticPillarKey, DiagnosticVerdict> {
  const verdicts = {} as Record<DiagnosticPillarKey, DiagnosticVerdict>;
  const hasAnyExpected = PILLAR_KEYS.some((key) => expected?.[key]?.trim());
  let blocked = false;

  for (const key of PILLAR_KEYS) {
    const expectedValue = expected?.[key]?.trim();
    if (!hasAnyExpected) {
      verdicts[key] = "expected_missing";
      continue;
    }
    if (blocked || !expectedValue) {
      verdicts[key] = "not_checked";
      blocked = true;
      continue;
    }
    verdicts[key] = result[key] === expectedValue ? "match" : "mismatch";
    if (verdicts[key] === "mismatch") blocked = true;
  }

  return verdicts;
}

export function runSajuDiagnostic(
  input: SajuDiagnosticInput,
): SajuDiagnosticReport {
  if (process.env.NODE_ENV === "production") {
    throw new Error("사주 진단 기능은 개발 환경에서만 사용할 수 있습니다.");
  }

  const targetYear = input.targetYear ?? new Date().getFullYear();
  const diagnosticInput = { ...input, targetYear };
  const currentCalculated = calculateSajuRaw(diagnosticInput);
  const unadjustedCalculated = buildUnadjustedCalculation(diagnosticInput);
  const currentMinus30 = buildModeResult(
    "currentMinus30",
    "현재 운로그 (-30분)",
    currentCalculated,
    diagnosticInput,
  );
  const unadjusted = buildModeResult(
    "unadjusted",
    "보정 없음",
    unadjustedCalculated,
    diagnosticInput,
  );
  const currentVerdicts = compareExpected(
    input.expectedPillars,
    currentMinus30.pillars,
  );
  const unadjustedVerdicts = compareExpected(
    input.expectedPillars,
    unadjusted.pillars,
  );

  return {
    input: {
      calendar: input.calendar ?? "solar",
      date: input.birthDate,
      time:
        input.birthTime ??
        formatTime(input.birthHour ?? 12, input.birthMinute ?? 0),
      timezone: input.timezone ?? "Asia/Seoul",
      gender: input.gender,
      birthTimeUnknown: input.birthTimeUnknown === true,
      leapMonthRequested: input.leapMonth === true,
      // 현재 운영 SajuCalculationInput에는 윤달 필드가 없어 ssaju로 전달되지 않는다.
      leapMonthAppliedByCurrentInput: false,
    },
    currentMinus30,
    unadjusted,
    comparison: PILLAR_KEYS.map((pillar) => ({
      pillar,
      label: PILLAR_LABELS[pillar],
      expected: input.expectedPillars?.[pillar]?.trim() || null,
      currentMinus30: currentMinus30.pillars[pillar],
      unadjusted: unadjusted.pillars[pillar],
      currentVerdict: currentVerdicts[pillar],
      unadjustedVerdict: unadjustedVerdicts[pillar],
      modesDiffer:
        currentMinus30.pillars[pillar] !== unadjusted.pillars[pillar],
    })),
    verificationRule:
      "년주 → 월주 → 일주 → 시주 순서로 검증하며, 앞 단계가 불일치하거나 기대값이 없으면 뒤 단계는 검증하지 않습니다.",
  };
}
