import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSaju: vi.fn(),
}));

vi.mock("../../lib/saju", () => ({
  getSaju: mocks.getSaju,
}));

import SajuManse from "./SajuManse";

const user = {
  name: "이재윤",
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "female" as const,
};

const pillar = (
  stem: string,
  branch: string,
  stemKo: string,
  branchKo: string
) => ({
  stem,
  branch,
  stemKo,
  branchKo,
  element: { stem: "목", branch: "수" },
});

describe("SajuManse", () => {
  beforeEach(() => {
    mocks.getSaju.mockReset();
    mocks.getSaju.mockReturnValue({
      pillarDetails: {
        hour: pillar("甲", "子", "갑", "자"),
        day: pillar("乙", "丑", "을", "축"),
        month: pillar("丙", "寅", "병", "인"),
        year: pillar("丁", "卯", "정", "묘"),
      },
      tenGods: {
        hour: { stem: "편재", branch: "정인" },
        day: { stem: "(일간)", branch: "편관" },
        month: { stem: "상관", branch: "겁재" },
        year: { stem: "식신", branch: "비견" },
      },
      stages12: {
        bong: { hour: "건록", day: "묘", month: "묘", year: "관대" },
        geo: { hour: "제왕", day: "절", month: "절", year: "양" },
      },
      sals: {
        hour: {
          twelveSal: "역마살",
          specialSals: ["legacy 값은 표시하지 않음"],
          twelveSalId: "twelve_yeokma_sal",
          sals: [{
            id: "cheon_eul_gwiin",
            name: "천을귀인",
            category: "gwiin",
            displayOrder: 200,
          }, {
            id: "cheon_deok_gwiin",
            name: "천덕귀인",
            category: "gwiin",
            displayOrder: 210,
          }, {
            id: "mungok_gwiin",
            name: "문곡귀인",
            category: "gwiin",
            displayOrder: 240,
          }, {
            id: "munchang_gwiin",
            name: "문창귀인",
            category: "gwiin",
            displayOrder: 250,
          }, {
            id: "cheonju_gwiin",
            name: "천주귀인",
            category: "gwiin",
            displayOrder: 260,
          }, {
            id: "gwangwi_hakgwan",
            name: "관귀학관",
            category: "gwiin",
            displayOrder: 270,
          }, {
            id: "hakdang_gwiin",
            name: "학당귀인",
            category: "gwiin",
            displayOrder: 280,
          }, {
            id: "geonrok",
            name: "건록",
            category: "rok",
            displayOrder: 300,
          }, {
            id: "geumyeo",
            name: "금여",
            category: "rok",
            displayOrder: 320,
          }, {
            id: "hyeonchim_sal",
            name: "현침살",
            category: "special",
            displayOrder: 350,
          }, {
            id: "yangin_sal",
            name: "양인살",
            category: "special",
            displayOrder: 360,
          }, {
            id: "gwimun_gwansal",
            name: "귀문관살",
            category: "special",
            displayOrder: 380,
          }, {
            id: "nakjeong_gwansal",
            name: "낙정관살",
            category: "special",
            displayOrder: 390,
          }, {
            id: "yeokma_sal",
            name: "역마살",
            category: "movement",
            displayOrder: 410,
          }, {
            id: "cheonmun_seong",
            name: "천문성",
            category: "special",
            displayOrder: 430,
          }, {
            id: "hwangeun_daesa",
            name: "황은대사",
            category: "special",
            displayOrder: 440,
          }, {
            id: "cheonui_seong",
            name: "천의성",
            category: "special",
            displayOrder: 450,
          }, {
            id: "goran_sal",
            name: "고란살",
            category: "relationship",
            displayOrder: 460,
          }, {
            id: "gwasuk_sal",
            name: "과숙살",
            category: "relationship",
            displayOrder: 470,
          }],
        },
        day: {
          twelveSal: "화개살",
          specialSals: [],
          twelveSalId: "twelve_hwagae_sal",
          sals: [{ id: "hwagae_sal", name: "화개살", category: "special", displayOrder: 420 }],
        },
        month: {
          twelveSal: "장성살",
          specialSals: ["도화살"],
          twelveSalId: "twelve_jangseong_sal",
          sals: [{ id: "dohwa_sal", name: "도화살", category: "relationship", displayOrder: 400 }],
        },
        year: {
          twelveSal: "겁살",
          specialSals: ["legacy 값은 표시하지 않음"],
          twelveSalId: "twelve_geop_sal",
          sals: [],
        },
      },
    });
  });

  afterEach(cleanup);

  it("renders hour, day, month, and year pillars in order", () => {
    render(<SajuManse user={user} showProfileSummary={false} />);

    expect(mocks.getSaju).toHaveBeenCalledWith(
      "1992-01-14",
      "13",
      "0",
      "solar",
      "female",
      false
    );

    const section = screen.getByText("나의 만세력").closest("section");
    expect(section).not.toBeNull();
    expect(section?.className).toContain("bg-white");
    expect(section?.className).not.toContain("backdrop-blur");
    const text = section?.textContent ?? "";
    expect(text.indexOf("시주")).toBeLessThan(text.indexOf("일주"));
    expect(text.indexOf("일주")).toBeLessThan(text.indexOf("월주"));
    expect(text.indexOf("월주")).toBeLessThan(text.indexOf("년주"));

    for (const character of ["甲", "子", "乙", "丑", "丙", "寅", "丁", "卯"]) {
      expect(within(section as HTMLElement).getByText(character)).toBeTruthy();
    }
    expect(within(section as HTMLElement).queryByText("12운성")).toBeNull();
    expect(within(section as HTMLElement).queryByText("12신살")).toBeNull();
    expect(within(section as HTMLElement).queryByText("신살")).toBeNull();
    expect(within(section as HTMLElement).getAllByText("역마살")).toHaveLength(2);
    expect(within(section as HTMLElement).getByText("천을귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천덕귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("문곡귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("문창귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천주귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("관귀학관")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("학당귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("금여")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("현침살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("양인살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("귀문관살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("낙정관살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천문성")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("황은대사")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천의성")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("고란살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("과숙살")).toBeTruthy();
    expect(within(section as HTMLElement).getAllByText("건록")).toHaveLength(2);
    expect(within(section as HTMLElement).getAllByText("화개살")).toHaveLength(2);
    expect(within(section as HTMLElement).queryByText("제왕")).toBeNull();
    expect(screen.queryByText("이재윤")).toBeNull();
  });

  it("uses the compact translucent variant without changing pillar data or colors", () => {
    render(
      <SajuManse
        user={user}
        showProfileSummary={false}
        variant="yearly"
      />
    );

    const section = screen.getByText("✦ 나의 만세력").closest("section");
    expect(section).not.toBeNull();
    expect(section?.className).toContain("bg-white/90");
    expect(section?.className).not.toContain("border-white/");
    expect(section?.className).not.toContain("backdrop-blur");
    expect(screen.getByText("✦ 나의 만세력").className).toContain("text-[13px]");

    const text = section?.textContent ?? "";
    expect(text.indexOf("시주")).toBeLessThan(text.indexOf("일주"));
    expect(text.indexOf("일주")).toBeLessThan(text.indexOf("월주"));
    expect(text.indexOf("월주")).toBeLessThan(text.indexOf("년주"));
    expect(text).not.toContain("편재 · 정인");
    expect(text).not.toContain("일간 · 편관");
    const hourText = screen.getByText("시주").parentElement?.textContent ?? "";
    const dayText = screen.getByText("일주").parentElement?.textContent ?? "";
    const monthText = screen.getByText("월주").parentElement?.textContent ?? "";
    const yearText = screen.getByText("년주").parentElement?.textContent ?? "";

    expect(hourText).toContain("편재");
    expect(hourText).toContain("정인");
    expect(within(section as HTMLElement).getByText("귀문관살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("낙정관살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천문성")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("황은대사")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천의성")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("고란살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("과숙살")).toBeTruthy();
    expect(hourText.indexOf("편재")).toBeLessThan(hourText.indexOf("甲"));
    expect(hourText.indexOf("子")).toBeLessThan(hourText.indexOf("정인"));
    expect(dayText).toContain("일간");
    expect(dayText).toContain("편관");
    expect(monthText).toContain("상관");
    expect(monthText).toContain("겁재");
    expect(yearText).toContain("식신");
    expect(yearText).toContain("비견");
    expect(screen.getByText("편재").className).toContain("text-[10px]");
    expect(screen.getByText("정인").className).toContain("text-[10px]");

    const stem = within(section as HTMLElement).getByText("甲");
    expect(stem.parentElement?.style.backgroundColor).toBe(
      "rgb(214, 237, 220)"
    );
    expect(within(section as HTMLElement).getByText("갑")).toBeTruthy();
    expect(within(section as HTMLElement).queryByText("12운성")).toBeNull();
    expect(within(section as HTMLElement).queryByText("12신살")).toBeNull();
    expect(within(section as HTMLElement).queryByText("신살")).toBeNull();
    expect(within(section as HTMLElement).getAllByText("역마살")).toHaveLength(2);
    expect(within(section as HTMLElement).getByText("천을귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("문곡귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("문창귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("천주귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("관귀학관")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("학당귀인")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("금여")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("현침살")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("양인살")).toBeTruthy();
    expect(within(section as HTMLElement).queryByText("legacy 값은 표시하지 않음")).toBeNull();
    expect(within(section as HTMLElement).getAllByText("화개살")).toHaveLength(2);
    expect(within(section as HTMLElement).getByText("도화살")).toBeTruthy();
    expect(within(section as HTMLElement).getAllByText("겁살")).toHaveLength(1);
    for (const rowId of ["twelve-stages", "twelve-sals", "other-sals"]) {
      const row = screen.getByTestId(`manse-info-${rowId}`);
      expect(row.className).toContain("border-t");
      expect(row.className).toContain("pt-3");
      expect(row.firstElementChild?.className).toContain("grid-cols-4");
    }
    expect(within(section as HTMLElement).queryByText("제왕")).toBeNull();
    expect(screen.queryByText(/길신|흉신|주의|설명/)).toBeNull();
  });

  it("adds preview context and wider title spacing only to the yearly variant", () => {
    const { rerender } = render(
      <SajuManse
        user={user}
        variant="yearly"
        yearlyContext={{
          loveLabel: "연애 중이에요",
          careerLabel: "프리랜서·자영업 중이에요",
        }}
      />
    );

    const yearlyName = screen.getByRole("heading", { name: "이재윤" });
    expect(yearlyName.className).toContain("mt-3");
    expect(yearlyName.className).not.toContain("mt-1 ");
    expect(screen.getByText("이번 운세에서 선택한 상황")).toBeTruthy();
    expect(screen.getByText("연애 중이에요").tagName).toBe("DD");
    expect(screen.getByText("프리랜서·자영업 중이에요").tagName).toBe("DD");
    expect(screen.queryByText("dating")).toBeNull();
    expect(screen.queryByText("freelance_self_employed")).toBeNull();
    expect(screen.getAllByText("역마살")).toHaveLength(2);

    rerender(<SajuManse user={user} />);

    const defaultName = screen.getByRole("heading", { name: "이재윤" });
    expect(defaultName.className).toContain("mt-1");
    expect(defaultName.className).not.toContain("mt-3");
    expect(screen.queryByText("이번 운세에서 선택한 상황")).toBeNull();
    expect(screen.queryByText("12운성")).toBeNull();
    expect(screen.queryByText("12신살")).toBeNull();
    expect(screen.queryByText("신살")).toBeNull();
    expect(screen.getAllByText("역마살")).toHaveLength(2);
    expect(screen.queryByText("이번 운세에서 선택한 상황")).toBeNull();
  });

  it("does not invent an hour pillar when the birth time is unknown", () => {
    render(
      <SajuManse
        user={{ ...user, birthTimeUnknown: true }}
        showProfileSummary={false}
      />
    );

    const hourColumn = screen.getByText("시주").parentElement;
    expect(hourColumn).not.toBeNull();
    expect(hourColumn?.textContent).not.toContain("甲");
    expect(hourColumn?.textContent).not.toContain("子");
    expect(within(hourColumn as HTMLElement).getAllByText("-")).toHaveLength(2);

    for (const rowId of ["twelve-stages", "twelve-sals", "other-sals"]) {
      const row = screen.getByTestId(`manse-info-${rowId}`);
      const hourColumn = row.firstElementChild?.firstElementChild;
      expect(hourColumn).not.toBeNull();
      expect(within(hourColumn as HTMLElement).getByText("-")).toBeTruthy();
    }
  });
});
