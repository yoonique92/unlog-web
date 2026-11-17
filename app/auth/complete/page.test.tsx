import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SocialLoginCompletePage from "./page";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}));

const baseProfile = {
  birthDate: "1990-01-02",
  birthHour: 10,
  birthMinute: 30,
  calendarType: "solar",
  gender: "male",
};

function mockAuthMeUser(options: {
  sajuProfile?: Record<string, unknown> | null;
  omitSajuProfile?: boolean;
}) {
  const user: Record<string, unknown> = {
    id: "user-id",
    name: "기존이름",
    provider: "kakao",
  };

  if (!options.omitSajuProfile) {
    user.sajuProfile = options.sajuProfile;
  }

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, user }),
    })
  );
}

describe("SocialLoginCompletePage", () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.replace.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ["JSON OFF", baseProfile],
    ["PostgreSQL ON", { ...baseProfile, birthTimeUnknown: false }],
  ])(
    "%s 응답에서 name 없는 sajuProfile 객체를 기존 사용자로 처리한다",
    async (_source, sajuProfile) => {
      mockAuthMeUser({ sajuProfile });

      render(<SocialLoginCompletePage />);

      await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/"));
      expect(navigation.replace).not.toHaveBeenCalledWith("/onboarding/saju");
      expect(JSON.parse(localStorage.getItem("unlog-user") ?? "null")).toMatchObject({
        name: "기존이름",
        birthDate: baseProfile.birthDate,
      });
    }
  );

  it("name이 있는 sajuProfile도 기존 사용자로 처리한다", async () => {
    mockAuthMeUser({ sajuProfile: { ...baseProfile, name: "프로필이름" } });

    render(<SocialLoginCompletePage />);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/"));
    expect(navigation.replace).not.toHaveBeenCalledWith("/onboarding/saju");
  });

  it("sajuProfile이 null이면 onboarding으로 이동한다", async () => {
    mockAuthMeUser({ sajuProfile: null });

    render(<SocialLoginCompletePage />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/onboarding/saju")
    );
    expect(localStorage.getItem("unlog-user")).toBeNull();
  });

  it("sajuProfile 필드가 없으면 onboarding으로 이동한다", async () => {
    mockAuthMeUser({ omitSajuProfile: true });

    render(<SocialLoginCompletePage />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/onboarding/saju")
    );
    expect(localStorage.getItem("unlog-user")).toBeNull();
  });
});
