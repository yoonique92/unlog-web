import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRecommendedYear } from "../../../components/saju/YearlyFortuneYearPicker";

const navigation = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("../../../components/saju/YearlyFortuneUnlock", () => ({
  default: ({
    year,
    onInitialStatusSettled,
  }: {
    year: number;
    onInitialStatusSettled?: () => void;
  }) => (
    <div data-testid="yearly-fortune-unlock">
      <span>yearly state {year}</span>
      <button type="button" onClick={onInitialStatusSettled}>
        finish yearly load
      </button>
    </div>
  ),
}));

vi.mock("../../../components/saju/YearlyFortunePreview", () => ({
  default: ({
    year,
    love,
    career,
  }: {
    year: number;
    love: string;
    career: string;
  }) => (
    <div data-testid="yearly-fortune-preview">
      preview {year} {love} {career}
    </div>
  ),
}));

import YearlyFortunePage from "./page";

const canonicalProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "female" as const,
};

const fetchMock = vi.fn();

function mockAuthMe(
  sajuProfile: typeof canonicalProfile | null = canonicalProfile
) {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        name: "이재윤",
        provider: "kakao",
        sajuProfile,
      },
    }),
  });
}

describe("YearlyFortunePage flow", () => {
  const recommendedYear = getRecommendedYear(new Date());
  const nextYear = recommendedYear + 1;

  beforeEach(() => {
    navigation.back.mockReset();
    navigation.push.mockReset();
    navigation.replace.mockReset();
    navigation.searchParams = new URLSearchParams();
    fetchMock.mockReset();
    mockAuthMe();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the signed-in canonical profile before the year picker", async () => {
    localStorage.setItem(
      "unlog-user",
      JSON.stringify({ name: "로컬 이름", birthDate: "2000-01-01" })
    );

    render(<YearlyFortunePage />);

    const main = screen.getByRole("main");
    const selectionSurface = main.firstElementChild as HTMLElement;
    expect(main.className).toContain("bg-white");
    expect(selectionSurface.style.backgroundImage).toContain(
      "/image/saju/신년운세_배경화면_01.png"
    );
    expect(selectionSurface.style.backgroundImage).not.toContain(
      "linear-gradient"
    );
    expect(selectionSurface.style.backgroundPosition).toBe("center top");
    expect(selectionSurface.style.backgroundRepeat).toBe("no-repeat");
    expect(selectionSurface.style.backgroundSize).toBe("100%");
    expect(selectionSurface.className).toContain("min-h-[100dvh]");
    expect(selectionSurface.className).toContain("bg-white");
    expect(selectionSurface.className).toContain(
      "yearly-selection-background"
    );

    const title = screen.getByRole("heading", { name: "신년운세", level: 1 });
    expect(title.className).toContain("left-1/2");
    expect(title.className).toContain("-translate-x-1/2");
    expect(title.closest("header")?.className).toContain("h-[56px]");
    const profileHeading = await screen.findByRole("heading", { name: "이재윤" });
    const profileCard = profileHeading.closest("section");
    expect(profileCard?.className).toContain("bg-white/70");
    expect(profileCard?.className).toContain("flex");
    expect(profileCard?.className).toContain("py-2.5");
    expect(profileCard?.className).toContain("border-white/80");
    expect(profileCard?.className).toContain("rounded-[18px]");
    expect(profileCard?.className).toContain("backdrop-blur-[3px]");
    expect(profileCard?.className).toContain(
      "shadow-[0_8px_24px_rgba(76,119,163,0.10)]"
    );
    expect(profileCard?.parentElement?.className).toContain("pt-5");
    const avatar = screen.getByTestId("yearly-profile-avatar");
    expect(avatar.className).toContain("h-12");
    expect(avatar.className).toContain("w-12");
    expect(avatar.className).toContain("rounded-full");
    expect(
      screen.getByText("1992.01.14 · 양력 · 13:00 · 여성")
    ).toBeTruthy();
    expect(screen.queryByText("로컬 이름")).toBeNull();

    expect(screen.queryByTestId("saju-manse")).toBeNull();
    expect(screen.queryByTestId("yearly-moonlight-decoration")).toBeNull();
    const personalizedYear = screen.getByText((_, element) =>
      Boolean(
        element?.tagName === "P" &&
          element.textContent === `이재윤님의 ${recommendedYear}년,`
      )
    );
    const personalizedHeadline = screen.getByText(
      "어떤 모습일지 함께 살펴볼게요."
    );
    expect(personalizedYear.className).toContain("text-[19px]");
    expect(personalizedYear.className).toContain("font-[750]");
    expect(personalizedYear.parentElement?.className).toContain("mt-[18px]");
    expect(personalizedYear.parentElement?.className).toContain("bg-white/70");
    expect(personalizedYear.parentElement?.className).toContain(
      "border-white/80"
    );
    expect(personalizedYear.parentElement?.className).toContain(
      "rounded-[18px]"
    );
    expect(personalizedYear.parentElement?.className).toContain(
      "backdrop-blur-[3px]"
    );
    expect(personalizedYear.parentElement?.className).toContain(
      "shadow-[0_8px_24px_rgba(76,119,163,0.10)]"
    );
    expect(personalizedYear.parentElement?.className).toContain("px-5");
    expect(personalizedYear.parentElement?.className).toContain("pb-5");
    expect(personalizedYear.parentElement?.className).toContain("pt-7");
    expect(personalizedHeadline.className).toContain("mt-1");
    expect(personalizedHeadline.className).toContain("font-[750]");
    const personalizedDescription = screen.getByText(
      "지금의 나와 가까운 상황을 두 가지만 알려주세요."
    );
    expect(personalizedDescription.className).toContain("mt-3");
    expect(personalizedDescription.className).toContain("text-[13px]");
    expect(
      profileCard!.compareDocumentPosition(
        screen.getByRole("heading", { name: "어느 해의 운세를 볼까요?" })
      ) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: `${recommendedYear}년 선택` })
        .compareDocumentPosition(personalizedYear) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      personalizedHeadline.compareDocumentPosition(
        screen.getByRole("button", { name: "운세 살짝 살펴보기" })
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByRole("option")).toBeNull();
    expect(
      screen.getByRole("button", { name: `${recommendedYear}년 선택` })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "운세 살짝 살펴보기" })
    ).toBeTruthy();
    expect(screen.queryByTestId("yearly-fortune-unlock")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("shows an unknown birth time without displaying the stored fallback time", async () => {
    mockAuthMe({
      ...canonicalProfile,
      birthHour: 12,
      birthMinute: 0,
      birthTimeUnknown: true,
    });

    render(<YearlyFortunePage />);

    expect(
      await screen.findByText(
        "1992.01.14 · 양력 · 출생시간 미상 · 여성"
      )
    ).toBeTruthy();
    expect(screen.queryByText(/12:00/)).toBeNull();
  });

  it("keeps love and career situations as independent temporary selections", async () => {
    const view = render(<YearlyFortunePage />);

    const cta = await screen.findByRole("button", {
      name: "운세 살짝 살펴보기",
    });
    expect(cta.hasAttribute("disabled")).toBe(true);
    const loveGroup = screen.getByRole("radiogroup", {
      name: "💖 연애 상황은 어떤가요?",
    });
    const careerGroup = screen.getByRole("radiogroup", {
      name: "✨ 일·진로 상황은 어떤가요?",
    });
    expect(
      screen.getByText(
        "현재가 아니어도, 운세를 보고 싶은 시기의 상황을 골라주세요."
      ).className
    ).toContain("mt-1");
    const personalizedCard = screen
      .getByText((_, element) =>
        Boolean(
          element?.tagName === "P" &&
            element.textContent === `이재윤님의 ${recommendedYear}년,`
        )
      )
      .closest("section");
    expect(personalizedCard?.contains(loveGroup)).toBe(true);
    expect(personalizedCard?.contains(careerGroup)).toBe(true);
    expect(loveGroup.closest("section")).not.toBe(personalizedCard);
    expect(careerGroup.closest("section")).not.toBe(personalizedCard);
    expect(within(loveGroup).getAllByRole("radio")).toHaveLength(7);
    expect(within(careerGroup).getAllByRole("radio")).toHaveLength(7);
    expect(
      screen.getByRole("heading", { name: "💖 연애 상황은 어떤가요?" })
        .className
    ).toContain("font-bold");
    expect(
      screen.getByRole("heading", { name: "💖 연애 상황은 어떤가요?" })
        .className
    ).toContain("text-[15px]");
    expect(
      screen.getByRole("heading", { name: "✨ 일·진로 상황은 어떤가요?" })
        .className
    ).toContain("font-bold");
    expect(
      screen.getByRole("heading", { name: "✨ 일·진로 상황은 어떤가요?" })
        .className
    ).toContain("text-[15px]");

    const dating = within(loveGroup).getByRole("radio", {
      name: "연애 중이에요",
    });
    const freshStart = within(loveGroup).getByRole("radio", {
      name: "이별 후 새출발 중이에요",
    });
    const employed = within(careerGroup).getByRole("radio", {
      name: "직장 생활 중이에요",
    });
    const retired = within(careerGroup).getByRole("radio", {
      name: "은퇴했어요",
    });
    expect(freshStart.className).not.toContain("col-span-2");
    expect(retired.className).not.toContain("col-span-2");
    expect(
      within(loveGroup)
        .getAllByRole("radio")
        .every((button) => button.className.includes("h-12"))
    ).toBe(true);
    expect(
      within(careerGroup)
        .getAllByRole("radio")
        .every((button) => button.className.includes("h-12"))
    ).toBe(true);

    fireEvent.click(dating);
    expect(cta.hasAttribute("disabled")).toBe(true);
    fireEvent.click(employed);
    expect(cta.hasAttribute("disabled")).toBe(false);
    expect(dating.getAttribute("aria-checked")).toBe("true");
    expect(employed.getAttribute("aria-checked")).toBe("true");
    expect(dating.className).toContain("bg-[#EEE9FF]");
    expect(dating.className).toContain("border-[#6656C9]");
    expect(dating.textContent).not.toContain("✦");

    fireEvent.click(freshStart);
    expect(dating.getAttribute("aria-checked")).toBe("false");
    expect(freshStart.getAttribute("aria-checked")).toBe("true");
    expect(employed.getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem("loveSituation")).toBeNull();
    expect(localStorage.getItem("careerSituation")).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();

    view.unmount();
    render(<YearlyFortunePage />);
    const refreshedLoveGroup = await screen.findByRole("radiogroup", {
      name: "💖 연애 상황은 어떤가요?",
    });
    expect(
      within(refreshedLoveGroup).queryAllByRole("radio", { checked: true })
    ).toHaveLength(0);
  });

  it("does not expose the year CTA when the canonical profile is missing", async () => {
    mockAuthMe(null);

    render(<YearlyFortunePage />);

    expect(
      await screen.findByText("신년운세를 보려면 먼저 사주 정보를 입력해 주세요.")
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "운세 살짝 살펴보기" })
    ).toBeNull();
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("passes validated year and situation keys into the preview flow", async () => {
    const view = render(<YearlyFortunePage />);

    await screen.findByRole("button", { name: "운세 살짝 살펴보기" });
    fireEvent.click(
      screen.getByRole("button", { name: "다른 연도 보기" })
    );
    expect(screen.getByRole("dialog", { name: "연도 선택" })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: `${nextYear}년` }));
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "확인" }));
    expect(
      screen.getByRole("button", { name: `${nextYear}년 선택` })
    ).toBeTruthy();
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.tagName === "P" &&
            element.textContent === `이재윤님의 ${nextYear}년,`
        )
      )
    ).toBeTruthy();
    fireEvent.click(
      within(
        screen.getByRole("radiogroup", {
          name: "💖 연애 상황은 어떤가요?",
        })
      ).getByRole("radio", { name: "연애 중이에요" })
    );
    fireEvent.click(
      within(
        screen.getByRole("radiogroup", {
          name: "✨ 일·진로 상황은 어떤가요?",
        })
      ).getByRole("radio", { name: "직장 생활 중이에요" })
    );
    fireEvent.click(screen.getByRole("button", { name: "운세 살짝 살펴보기" }));

    expect(navigation.push).toHaveBeenCalledWith(
      `/saju/yearly?year=${nextYear}&love=dating&career=employed`,
      { scroll: false }
    );

    navigation.searchParams = new URLSearchParams(
      `year=${nextYear}&love=dating&career=employed`
    );
    view.rerender(<YearlyFortunePage />);

    const resultSurface = screen.getByRole("main")
      .firstElementChild as HTMLElement;
    expect(resultSurface.style.backgroundImage).toBe("");
    expect(resultSurface.className).toContain("min-h-full");
    expect(resultSurface.className).not.toContain("min-h-[100dvh]");
    expect(screen.queryByTestId("yearly-moonlight-decoration")).toBeNull();
    expect(
      (await screen.findByTestId("yearly-fortune-preview")).textContent
    ).toContain(`preview ${nextYear} dating employed`);
    expect(
      screen.getByRole("heading", { name: `${nextYear}년 운세`, level: 1 })
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        name: `${nextYear}년 신년운세`,
      })
    ).toBeNull();
    expect(screen.queryByTestId("yearly-fortune-unlock")).toBeNull();

    navigation.searchParams = new URLSearchParams();
    view.rerender(<YearlyFortunePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "운세 살짝 살펴보기" })
      ).toBeTruthy();
    });
    expect(screen.queryByTestId("yearly-fortune-unlock")).toBeNull();
  });

  it("uses a valid URL year directly without accepting a browser user id", () => {
    navigation.searchParams = new URLSearchParams(`year=${nextYear}`);

    render(<YearlyFortunePage />);

    expect(
      screen.getByText(`${nextYear}년의 흐름을 살펴보고 있어요`)
    ).toBeTruthy();
    expect(screen.getByText(`yearly state ${nextYear}`)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid personalized query keys and returns to selection", async () => {
    navigation.searchParams = new URLSearchParams(
      `year=${nextYear}&love=invalid&career=employed`
    );

    render(<YearlyFortunePage />);

    expect(
      (
        await screen.findByRole("button", { name: "운세 살짝 살펴보기" })
      ).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.queryByTestId("yearly-fortune-preview")).toBeNull();
    expect(screen.queryByTestId("yearly-fortune-unlock")).toBeNull();
  });
});
