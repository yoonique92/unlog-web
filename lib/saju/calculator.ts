import { calculateSaju } from "ssaju";
import type { CalculatedSaju, SajuCalculationInput } from "./types";

function parseBirthTime(input: SajuCalculationInput) {
  if (input.birthTime) {
    const [hour = 12, minute = 0] = input.birthTime.split(":").map(Number);
    return { hour, minute };
  }
  return { hour: input.birthHour ?? 12, minute: input.birthMinute ?? 0 };
}

export function calculateSajuRaw(input: SajuCalculationInput): CalculatedSaju {
  const [year, month, day] = input.birthDate.split("-").map(Number);
  const original = parseBirthTime(input);
  let adjustedTotalMinutes = original.hour * 60 + original.minute - 30;
  let adjustedYear = year;
  let adjustedMonth = month;
  let adjustedDay = day;

  if (adjustedTotalMinutes < 0) {
    adjustedTotalMinutes += 24 * 60;
    const previousDate = new Date(Date.UTC(year, month - 1, day));
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    adjustedYear = previousDate.getUTCFullYear();
    adjustedMonth = previousDate.getUTCMonth() + 1;
    adjustedDay = previousDate.getUTCDate();
  }

  const adjustedHour = Math.floor(adjustedTotalMinutes / 60);
  const adjustedMinute = adjustedTotalMinutes % 60;
  const birthTimeUnknown = input.birthTimeUnknown ?? false;
  const raw = calculateSaju({
    year: adjustedYear,
    month: adjustedMonth,
    day: adjustedDay,
    hour: adjustedHour,
    minute: adjustedMinute,
    gender: input.gender === "female" ? "여" : "남",
    calendar: input.calendar ?? "solar",
    timezone: input.timezone ?? "Asia/Seoul",
    applyLocalMeanTime: false,
    ...(input.targetYear ? { now: new Date(`${input.targetYear}-07-01T12:00:00+09:00`) } : {}),
  });

  return {
    raw,
    birthTimeUnknown,
    unlogTime: {
      original,
      adjusted: {
        year: adjustedYear,
        month: adjustedMonth,
        day: adjustedDay,
        hour: adjustedHour,
        minute: adjustedMinute,
      },
      policy: birthTimeUnknown
        ? "UNKNOWN_TIME_EXCLUDES_HOUR_PILLAR"
        : "KOREA_MINUS_30_V1",
    },
  };
}
