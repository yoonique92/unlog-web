import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

import YearlyFortunePreview from "./YearlyFortunePreview";

const fetchMock = vi.fn();

describe("YearlyFortunePreview", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.replace.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        profileReady: true,
        preview: {
          year: 2027,
          text: "배움과 정리가 중요한 해예요. 빠른 성과보다 내 기반을 다시 정리하고 전문성을 쌓는 흐름이 강해질 수 있어요.",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows only the free summary and a non-mutating locked section", async () => {
    render(
      <YearlyFortunePreview
        year={2027}
        love="dating"
        career="employed"
        user={{
          name: "이재윤",
          birthDate: "1992-01-14",
          birthHour: 13,
          birthMinute: 0,
          birthTimeUnknown: false,
          calendarType: "solar",
          gender: "female",
        }}
      />
    );

    expect(
      await screen.findByText(
        "배움과 정리가 중요한 해예요. 빠른 성과보다 내 기반을 다시 정리하고 전문성을 쌓는 흐름이 강해질 수 있어요."
      )
    ).toBeTruthy();
    expect(screen.getByText("✦ 2027년 미리보기")).toBeTruthy();
    expect(screen.queryByText(/한줄 요약/)).toBeNull();
    expect(screen.getByText("연애 중이에요").tagName).toBe("DD");
    expect(screen.getByText("직장 생활 중이에요").tagName).toBe("DD");
    expect(screen.queryByText("💖 연애 상황은 어떤가요?")).toBeNull();
    expect(screen.queryByText("✨ 일·진로 상황은 어떤가요?")).toBeNull();
    expect(screen.queryByText("dating")).toBeNull();
    expect(screen.queryByText("employed")).toBeNull();
    expect(screen.getByText("✦ 나의 만세력")).toBeTruthy();
    for (const label of [
      "전체 흐름",
      "연애운",
      "금전운",
      "건강운",
      "커리어운",
      "학업운",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    const unlock = screen.getByRole("button", {
      name: "운석 1개로 전체 운세 보기",
    });
    expect(unlock.hasAttribute("disabled")).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/saju/yearly/preview?year=2027&love=dating&career=employed",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes("/api/stones/unlock"))
    ).toBe(false);
    expect(screen.queryByText(/보유 운석/)).toBeNull();
  });

  it("redirects an unauthenticated response to login", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: "로그인이 필요합니다." }),
    });

    render(
      <YearlyFortunePreview
        year={2027}
        love="dating"
        career="employed"
        user={{
          name: "이재윤",
          birthDate: "1992-01-14",
          birthHour: 13,
          birthMinute: 0,
          birthTimeUnknown: false,
          calendarType: "solar",
          gender: "female",
        }}
      />
    );

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/login"));
  });
});
