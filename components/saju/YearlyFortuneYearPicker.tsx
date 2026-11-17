"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const YEAR_RANGE_OFFSET = 30;
const YEAR_ITEM_HEIGHT = 52;
const BASE_RECOMMENDED_YEAR = 2027;
const BASE_SHIFT_YEAR = 2027;
const SHIFT_MONTH_INDEX = 10;

export function createYearRange(currentYear: number) {
  return Array.from(
    { length: YEAR_RANGE_OFFSET * 2 + 1 },
    (_, index) => currentYear - YEAR_RANGE_OFFSET + index
  );
}

type YearlyFortuneYearPickerProps = {
  currentYear: number;
  recommendedYear: number;
  selectedYear: number;
  onChange: (year: number) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  contentBeforeSubmit?: ReactNode;
};

export default function YearlyFortuneYearPicker({
  currentYear,
  recommendedYear,
  selectedYear,
  onChange,
  onSubmit,
  submitDisabled = false,
  contentBeforeSubmit,
}: YearlyFortuneYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const years = useMemo(() => createYearRange(currentYear), [currentYear]);
  const visibleYears = useMemo(
    () => createVisibleYearRange(recommendedYear),
    [recommendedYear]
  );
  const firstYear = years[0];

  const scrollToYear = (year: number, behavior: ScrollBehavior) => {
    const picker = pickerRef.current;
    if (!picker) return;

    const top = (year - firstYear) * YEAR_ITEM_HEIGHT;
    if (typeof picker.scrollTo === "function") {
      picker.scrollTo({ top, behavior });
    } else {
      picker.scrollTop = top;
    }
  };

  const closePicker = useCallback(() => {
    setDraftYear(selectedYear);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [selectedYear]);

  useEffect(() => {
    if (!isOpen) return;

    scrollToYear(selectedYear, "auto");
    pickerRef.current?.focus();
    // The picker is mounted only while the sheet is open. Align it once to the
    // currently confirmed value; user interactions handle subsequent scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstYear, isOpen, selectedYear]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closePicker, isOpen]);

  const selectYear = (year: number) => {
    setDraftYear(year);
    scrollToYear(year, "smooth");
  };

  const handleScroll = () => {
    const picker = pickerRef.current;
    if (!picker) return;

    const index = Math.max(
      0,
      Math.min(years.length - 1, Math.round(picker.scrollTop / YEAR_ITEM_HEIGHT))
    );
    const year = years[index];
    if (year !== draftYear) setDraftYear(year);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let nextYear = draftYear;
    if (event.key === "ArrowUp") nextYear = Math.max(years[0], draftYear - 1);
    else if (event.key === "ArrowDown") {
      nextYear = Math.min(years[years.length - 1], draftYear + 1);
    } else if (event.key === "Home") nextYear = years[0];
    else if (event.key === "End") nextYear = years[years.length - 1];
    else return;

    event.preventDefault();
    selectYear(nextYear);
  };

  return (
    <section
      className="px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-6"
      aria-labelledby="year-picker-title"
    >
      <div
        data-testid="year-picker-card"
        className="rounded-[18px] border border-white/80 bg-white/70 p-5 shadow-[0_8px_24px_rgba(76,119,163,0.10)] backdrop-blur-[3px]"
      >
        <div className="text-center">
          <h2
            id="year-picker-title"
            className="text-[19px] font-extrabold text-[#20185B]"
          >
            어느 해의 운세를 볼까요?
          </h2>
        </div>

        <div className="mt-[18px] grid w-full grid-cols-5 gap-1.5">
          {visibleYears.map((year) => {
            const isSelected = year === selectedYear;

            return (
              <button
                key={year}
                type="button"
                aria-label={`${year}년 선택`}
                aria-pressed={isSelected}
                onClick={() => onChange(year)}
                className={`flex h-[70px] min-w-0 flex-col items-center justify-center rounded-[15px] border text-center transition active:scale-[0.98] ${
                isSelected
                  ? "border-[#6656C9] bg-[#EEE9FF] font-bold text-[#4A3FAA] shadow-[0_6px_14px_rgba(79,62,173,0.12)]"
                  : "border-[#E3DDF1] bg-white text-[#4F4865]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-4 text-[13px] leading-4 ${
                  isSelected ? "text-[#6656C9]" : "invisible"
                  }`}
                >
                  ✦
                </span>
                <span className="mt-0.5 whitespace-nowrap text-[13px] font-bold tracking-[-0.04em]">
                  {year}년
                </span>
              </button>
            );
          })}
        </div>

        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            setDraftYear(selectedYear);
            setIsOpen(true);
          }}
          className="mx-auto mt-4 flex h-9 items-center justify-center rounded-full bg-[#F5F0FF] px-4 text-[13px] font-semibold text-[#665C82] transition active:scale-[0.99]"
        >
          다른 연도 보기
          <ChevronRight size={16} className="ml-1" aria-hidden="true" />
        </button>
      </div>

      {contentBeforeSubmit}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className="mx-auto mt-6 block h-[54px] w-2/3 rounded-full bg-[#6656C9] text-[15px] font-extrabold text-white shadow-[0_9px_22px_rgba(79,62,173,0.24)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#AFA6D9] disabled:opacity-65 disabled:shadow-none"
      >
        운세 살짝 살펴보기
      </button>

      {isOpen && (
        <div
          data-testid="year-picker-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#17113A]/30 p-5"
          onClick={(event) => {
            if (event.target === event.currentTarget) closePicker();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="year-picker-dialog-title"
            className="my-auto w-full max-w-[380px] rounded-[24px] bg-[#F8F7FC] px-5 pb-5 pt-5 shadow-[0_18px_50px_rgba(43,31,87,0.2)]"
          >
            <div
              aria-hidden="true"
              className="mx-auto h-1 w-10 rounded-full bg-[#D6D0E3]"
            />
            <div className="mt-2 flex h-11 items-center justify-center">
              <h2
                id="year-picker-dialog-title"
                className="text-[18px] font-extrabold text-[#20185B]"
              >
                연도 선택
              </h2>
            </div>

            <div
              data-testid="year-wheel-viewport"
              className="relative mx-auto mt-3 h-[156px] max-w-[280px] overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-[52px] z-10 h-[52px] border-y border-[#D8D0F4] bg-white/55"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-11 bg-gradient-to-b from-[#F8F7FC] to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-11 bg-gradient-to-t from-[#F8F7FC] to-transparent"
              />

              <div
                ref={pickerRef}
                role="listbox"
                aria-label="신년운세 연도 선택"
                aria-activedescendant={`year-option-${draftYear}`}
                tabIndex={0}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                className="h-full touch-pan-y snap-y snap-mandatory overscroll-contain overflow-y-auto py-[52px] text-center outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {years.map((year) => {
                  const distance = Math.abs(year - draftYear);
                  const isSelected = distance === 0;

                  return (
                    <button
                      id={`year-option-${year}`}
                      key={year}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectYear(year)}
                      className={`flex h-[52px] w-full snap-center items-center justify-center transition-[color,font-size,opacity] duration-150 ${
                        isSelected
                          ? "text-[28px] font-extrabold text-[#30286D] opacity-100"
                          : distance === 1
                            ? "text-[18px] font-bold text-[#756D88] opacity-65"
                            : "text-[15px] font-semibold text-[#958FA1] opacity-30"
                      }`}
                    >
                      {year}년
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(draftYear);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="mt-4 h-[52px] w-full rounded-[18px] bg-[#6656C9] text-[15px] font-extrabold text-white"
            >
              확인
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export function getRecommendedYear(date: Date) {
  const shiftedYear =
    date.getFullYear() + (date.getMonth() >= SHIFT_MONTH_INDEX ? 1 : 0);

  return Math.max(
    BASE_RECOMMENDED_YEAR,
    BASE_RECOMMENDED_YEAR + (shiftedYear - BASE_SHIFT_YEAR)
  );
}

export function createVisibleYearRange(recommendedYear: number) {
  return Array.from({ length: 5 }, (_, index) => recommendedYear - 2 + index);
}
