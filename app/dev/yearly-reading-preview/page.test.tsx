import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findSajuProfileByUserId: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("../../../lib/auth/session", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("../../../lib/db/repositories/userRepository", () => ({
  findSajuProfileByUserId: mocks.findSajuProfileByUserId,
}));

import YearlyReadingPreviewPage from "./page";
import { buildYearlyReadingDevPreview } from "./preview";

const profile = {
  userId: "user-1",
  name: "이재윤",
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "female" as const,
  updatedAt: null,
};

const calculationProfile = {
  birthDate: profile.birthDate,
  birthHour: profile.birthHour,
  birthMinute: profile.birthMinute,
  birthTimeUnknown: profile.birthTimeUnknown,
  calendarType: profile.calendarType,
  gender: profile.gender,
};

async function renderPage(query: Record<string, string> = {}) {
  render(await YearlyReadingPreviewPage({ searchParams: Promise.resolve(query) }));
}

describe("development yearly reading preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    mocks.getSessionUser.mockResolvedValue({
      id: "user-1",
      name: "로그인 이름",
      provider: "kakao",
    });
    mocks.findSajuProfileByUserId.mockResolvedValue(profile);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders all five canonical copy sections from the signed-in profile", async () => {
    await renderPage({ year: "2032", love: "married", career: "employed" });

    expect(mocks.findSajuProfileByUserId).toHaveBeenCalledWith("user-1");
    expect(screen.getByText("이재윤님의 현재 canonical profile을 사용합니다.")).toBeTruthy();
    expect(screen.getByText("올해의 전체 흐름")).toBeTruthy();
    expect(screen.getByText("커리어·학업")).toBeTruthy();
    expect(screen.getByText("돈의 흐름")).toBeTruthy();
    expect(screen.getByText("연애·관계")).toBeTruthy();
    expect(screen.getByText("컨디션·리듬")).toBeTruthy();
    expect(screen.getByText("선택: 2032년 · love=married · career=employed")).toBeTruthy();
  });

  it("shows exact builder copy and keeps debug information folded", async () => {
    const expected = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2032,
      love: "married",
      career: "employed",
    });

    await renderPage({ year: "2032", love: "married", career: "employed" });

    for (const copy of Object.values(expected.copies)) {
      expect(screen.getByText(copy.headline)).toBeTruthy();
      expect(screen.getByText((_, element) => element?.textContent === copy.body)).toBeTruthy();
      expect(screen.getByText(copy.tip)).toBeTruthy();
    }
    expect(screen.getAllByText("sourceSignalIds 보기")).toHaveLength(5);
    expect(screen.getByText("Monthly signal debug (12개 절기 월)")).toBeTruthy();
    expect(screen.getByText(/^寅월: \d+ signals$/)).toBeTruthy();
    expect(screen.getByText(/^丑월: \d+ signals$/)).toBeTruthy();
  });

  it("shows twelve collapsed monthly accordions and opens exact production copy", async () => {
    const expected = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2032,
      love: "married",
      career: "employed",
    });

    await renderPage({ year: "2032", love: "married", career: "employed" });

    expect(screen.getByRole("heading", { name: "월별 운세" })).toBeTruthy();
    expect(screen.getAllByTestId("monthly-list-container")).toHaveLength(1);
    const monthRows = screen.getAllByTestId("monthly-row");
    expect(monthRows).toHaveLength(12);
    expect(monthRows.every((row) => row.className.includes("border-b"))).toBe(true);
    expect(monthRows.every((row) => !row.className.includes("rounded"))).toBe(true);
    expect(monthRows.every((row) => !row.className.includes("shadow"))).toBe(true);
    const monthButtons = Array.from({ length: 12 }, (_, index) =>
      screen.getByRole("button", { name: new RegExp(`^${index + 1}월 운세`) }));
    expect(monthButtons).toHaveLength(12);
    expect(monthButtons.every((button) => button.getAttribute("aria-expanded") === "false")).toBe(true);
    expect(screen.queryByText("근거 보기")).toBeNull();

    const january = expected.monthlyCopies[0];
    fireEvent.click(monthButtons[0]);
    expect(monthButtons[0].getAttribute("aria-expanded")).toBe("true");
    for (const paragraph of january.body.split(/\n\s*\n/)) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
    expect(screen.getByText(january.tip)).toBeTruthy();
    const body = screen.getByTestId("monthly-copy-body");
    const tipBox = screen.getByTestId("monthly-tip-box");
    const evidence = screen.getByText("근거 보기").parentElement!;
    expect(within(tipBox).getByText("TIP")).toBeTruthy();
    expect(within(tipBox).queryByText("💡")).toBeNull();
    expect(within(body).queryByText(january.tip)).toBeNull();
    expect(tipBox.compareDocumentPosition(evidence) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(evidence.hasAttribute("open")).toBe(false);
  });

  it("switches the single open monthly copy without query state", async () => {
    const expected = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2032,
      love: "married",
      career: "employed",
    }).monthlyCopies[5];

    await renderPage({ year: "2032", love: "married", career: "employed" });

    const january = screen.getByRole("button", { name: /^1월 운세/ });
    const june = screen.getByRole("button", { name: /^6월 운세/ });
    fireEvent.click(january);
    fireEvent.click(june);
    expect(january.getAttribute("aria-expanded")).toBe("false");
    expect(june.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(expected.tip)).toBeTruthy();
    fireEvent.click(june);
    expect(june.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses targetYear while limiting context changes to career and love copy", () => {
    const first = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2031,
      love: "new_connection",
      career: "student",
    });
    const nextYear = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2032,
      love: "new_connection",
      career: "student",
    });
    const changedContext = buildYearlyReadingDevPreview({
      profile: calculationProfile,
      targetYear: 2032,
      love: "married",
      career: "employed",
    });

    expect(first.targetYear).toBe(2031);
    expect(nextYear.targetYear).toBe(2032);
    expect(first.copies).not.toEqual(nextYear.copies);
    expect(first.monthlyCopies).not.toEqual(nextYear.monthlyCopies);
    expect(changedContext.copies.overall).toEqual(nextYear.copies.overall);
    expect(changedContext.copies.money).toEqual(nextYear.copies.money);
    expect(changedContext.copies.condition).toEqual(nextYear.copies.condition);
    expect(changedContext.copies.career).not.toEqual(nextYear.copies.career);
    expect(changedContext.copies.love).not.toEqual(nextYear.copies.love);
  });

  it("shows a short guide instead of loading a profile when signed out", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await renderPage();

    expect(screen.getByText("로그인하면 현재 사용자의 신년운세 문구를 확인할 수 있어요.")).toBeTruthy();
    expect(mocks.findSajuProfileByUserId).not.toHaveBeenCalled();
  });

  it("returns notFound outside development before session or profile access", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(YearlyReadingPreviewPage({ searchParams: Promise.resolve({}) }))
      .rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.getSessionUser).not.toHaveBeenCalled();
    expect(mocks.findSajuProfileByUserId).not.toHaveBeenCalled();
  });
});
