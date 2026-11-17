"use client";

import { useState } from "react";

type BirthDateInputProps = {
  onChange: (birthDate: string) => void;
  className?: string;
};

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function isValidBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export default function BirthDateInput({
  onChange,
  className = "",
}: BirthDateInputProps) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const updateDate = (
    part: "year" | "month" | "day",
    rawValue: string
  ) => {
    const nextYear = part === "year" ? onlyDigits(rawValue, 4) : year;
    const nextMonth = part === "month" ? onlyDigits(rawValue, 2) : month;
    const nextDay = part === "day" ? onlyDigits(rawValue, 2) : day;

    if (part === "year") setYear(nextYear);
    if (part === "month") setMonth(nextMonth);
    if (part === "day") setDay(nextDay);

    onChange(
      nextYear.length === 4 && nextMonth && nextDay
        ? `${nextYear}-${nextMonth.padStart(2, "0")}-${nextDay.padStart(2, "0")}`
        : ""
    );
  };

  const inputClassName =
    "min-w-0 w-full rounded-[14px] border border-[#E5E0F2] bg-[#FAF9FD] px-3 py-[12px] text-center text-[15px] outline-none focus:border-[#8068E7]";

  return (
    <div className={`grid grid-cols-[1.4fr_1fr_1fr] gap-2 ${className}`}>
      <DatePartInput
        ariaLabel="출생 연도"
        placeholder="YYYY"
        maxLength={4}
        autoComplete="bday-year"
        value={year}
        inputClassName={inputClassName}
        onChange={(value) => updateDate("year", value)}
      />
      <DatePartInput
        ariaLabel="출생 월"
        placeholder="MM"
        maxLength={2}
        autoComplete="bday-month"
        value={month}
        inputClassName={inputClassName}
        onChange={(value) => updateDate("month", value)}
      />
      <DatePartInput
        ariaLabel="출생 일"
        placeholder="DD"
        maxLength={2}
        autoComplete="bday-day"
        value={day}
        inputClassName={inputClassName}
        onChange={(value) => updateDate("day", value)}
      />
    </div>
  );
}

type DatePartInputProps = {
  ariaLabel: string;
  placeholder: string;
  maxLength: number;
  autoComplete: string;
  value: string;
  inputClassName: string;
  onChange: (value: string) => void;
};

function DatePartInput(props: DatePartInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete={props.autoComplete}
      aria-label={props.ariaLabel}
      placeholder={props.placeholder}
      maxLength={props.maxLength}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      className={props.inputClassName}
    />
  );
}
