import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import YearlyFortuneYearPicker, {
  createYearRange,
  createVisibleYearRange,
  getRecommendedYear,
} from "./YearlyFortuneYearPicker";

function PickerHarness({
  currentYear = 2026,
  recommendedYear = 2027,
  onSubmit = () => undefined,
}: {
  currentYear?: number;
  recommendedYear?: number;
  onSubmit?: () => void;
}) {
  const [selectedYear, setSelectedYear] = useState(recommendedYear);

  return (
    <YearlyFortuneYearPicker
      currentYear={currentYear}
      recommendedYear={recommendedYear}
      selectedYear={selectedYear}
      onChange={setSelectedYear}
      onSubmit={onSubmit}
    />
  );
}

describe("YearlyFortuneYearPicker", () => {
  afterEach(cleanup);

  it("creates the current year -30 through +30 range", () => {
    const years = createYearRange(2026);

    expect(years).toHaveLength(61);
    expect(years[0]).toBe(1996);
    expect(years.at(-1)).toBe(2056);
  });

  it("shifts the recommended years every November from the 2027 baseline", () => {
    expect(getRecommendedYear(new Date(2026, 9, 10))).toBe(2027);
    expect(createVisibleYearRange(2027)).toEqual([
      2025, 2026, 2027, 2028, 2029,
    ]);
    expect(getRecommendedYear(new Date(2027, 9, 31))).toBe(2027);
    expect(createVisibleYearRange(2027)).toEqual([
      2025, 2026, 2027, 2028, 2029,
    ]);
    expect(getRecommendedYear(new Date(2027, 10, 1))).toBe(2028);
    expect(createVisibleYearRange(2028)).toEqual([
      2026, 2027, 2028, 2029, 2030,
    ]);
    expect(getRecommendedYear(new Date(2028, 10, 1))).toBe(2029);
    expect(createVisibleYearRange(2029)).toEqual([
      2027, 2028, 2029, 2030, 2031,
    ]);
  });

  it("supports quick cards and keeps the full year list in a sheet", () => {
    const onSubmit = vi.fn();
    render(<PickerHarness onSubmit={onSubmit} />);

    expect(screen.queryByRole("dialog")).toBeNull();
    const quickCards = [2025, 2026, 2027, 2028, 2029].map((year) =>
      screen.getByRole("button", { name: `${year}년 선택` })
    );
    expect(quickCards).toHaveLength(5);
    expect(quickCards[2].getAttribute("aria-pressed")).toBe("true");
    expect(quickCards[2].textContent).toContain("✦");
    expect(quickCards[2].className).toContain("bg-[#EEE9FF]");
    expect(quickCards[2].className).toContain("border-[#6656C9]");
    expect(quickCards[2].className).toContain("text-[#4A3FAA]");
    expect(quickCards[2].className).not.toContain("text-white");
    expect(quickCards[2].querySelector("span")?.className).toContain(
      "text-[#6656C9]"
    );
    expect(quickCards[0].getAttribute("aria-pressed")).toBe("false");
    expect(quickCards[0].className).toContain("bg-white");
    expect(quickCards[0].className).toContain("border-[#E3DDF1]");
    expect(screen.queryByText("올해")).toBeNull();
    const outerCard = screen.getByTestId("year-picker-card");
    expect(outerCard.className).toContain("bg-white/70");
    expect(outerCard.className).toContain("border-white/80");
    expect(outerCard.className).toContain("rounded-[18px]");
    expect(outerCard.className).toContain("backdrop-blur-[3px]");
    expect(outerCard.className).toContain(
      "shadow-[0_8px_24px_rgba(76,119,163,0.10)]"
    );
    expect(outerCard.className).toContain("p-5");
    expect(
      outerCard.contains(
        screen.getByRole("heading", { name: "어느 해의 운세를 볼까요?" })
      )
    ).toBe(true);
    expect(
      outerCard.contains(
        screen.getByRole("button", { name: "다른 연도 보기" })
      )
    ).toBe(true);
    const cta = screen.getByRole("button", { name: "운세 살짝 살펴보기" });
    expect(cta.className).toContain("w-2/3");
    expect(cta.className).toContain("h-[54px]");
    expect(screen.queryByText("궁금한 해를 골라보세요.")).toBeNull();
    expect(screen.queryByTestId("year-selection-arch")).toBeNull();
    expect(screen.queryByTestId("year-selection-curve")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "2029년 선택" }));
    expect(
      screen.getByRole("button", { name: "2029년 선택" }).getAttribute(
        "aria-pressed"
      )
    ).toBe("true");
    expect(
      [2025, 2026, 2027, 2028, 2029].map((year) =>
        screen.getByRole("button", { name: `${year}년 선택` }).textContent
      )
    ).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "다른 연도 보기" }));

    const dialog = screen.getByRole("dialog", { name: "연도 선택" });
    expect(dialog.className).toContain("max-w-[380px]");
    expect(dialog.className).toContain("rounded-[24px]");
    expect(dialog.className).toContain("pt-5");
    const wheelViewport = screen.getByTestId("year-wheel-viewport");
    expect(wheelViewport.className).toContain("h-[156px]");
    expect(wheelViewport.className).toContain("mt-3");
    expect(screen.getByTestId("year-picker-backdrop").className).toContain(
      "items-center"
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getAllByRole("option")).toHaveLength(61);
    expect(screen.queryByText("월 선택")).toBeNull();
    expect(
      screen.getByRole("option", { name: "2029년" }).getAttribute("aria-selected")
    ).toBe("true");

    fireEvent.click(screen.getByRole("option", { name: "2040년" }));

    expect(
      screen.getByRole("option", { name: "2040년" }).getAttribute("aria-selected")
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "2029년 선택" })
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(
      screen.queryAllByRole("button", { pressed: true })
    ).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "2040년 선택" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "운세 살짝 살펴보기" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "운세 살짝 살펴보기" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("supports wheel-style scrolling and keyboard selection", () => {
    render(<PickerHarness />);
    fireEvent.click(screen.getByRole("button", { name: "다른 연도 보기" }));
    const picker = screen.getByRole("listbox", { name: "신년운세 연도 선택" });

    picker.scrollTop = 31 * 52;
    fireEvent.scroll(picker);
    expect(
      screen.getByRole("option", { name: "2027년" }).getAttribute("aria-selected")
    ).toBe("true");

    fireEvent.keyDown(picker, { key: "ArrowDown" });
    expect(
      screen.getByRole("option", { name: "2028년" }).getAttribute("aria-selected")
    ).toBe("true");

    fireEvent.keyDown(picker, { key: "ArrowUp" });
    expect(
      screen.getByRole("option", { name: "2027년" }).getAttribute("aria-selected")
    ).toBe("true");

    fireEvent.keyDown(picker, { key: "Home" });
    expect(
      screen.getByRole("option", { name: "1996년" }).getAttribute("aria-selected")
    ).toBe("true");

    fireEvent.keyDown(picker, { key: "End" });
    expect(
      screen.getByRole("option", { name: "2056년" }).getAttribute("aria-selected")
    ).toBe("true");
  });

  it("discards an unconfirmed selection when the backdrop or Escape closes the sheet", () => {
    render(<PickerHarness />);

    fireEvent.click(screen.getByRole("button", { name: "다른 연도 보기" }));
    fireEvent.click(screen.getByRole("option", { name: "2027년" }));
    fireEvent.click(screen.getByTestId("year-picker-backdrop"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(
      screen.getByRole("button", { name: "2027년 선택" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "다른 연도 보기" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
