import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import YearlyFortuneUnlock from "./YearlyFortuneUnlock";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

const year = 2027;
const firstRequestId = "00000000-0000-4000-8000-000000000099";
const secondRequestId = "00000000-0000-4000-8000-000000000100";
const interpretation = {
  yearGanzhi: "정미",
  dayStem: "갑",
  currentDaeunGanzhi: "병오",
  headline: "서버에서 생성한 신년운세",
  summary: "올해의 요약",
  career: "일과 커리어",
  money: "금전",
  relationship: "관계",
  caution: "주의점",
  action: "행동 가이드",
  keywords: ["정인", "정관"],
};

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function yearlyStateResponse(options?: {
  profileReady?: boolean;
  walletBalance?: number;
  unlocked?: boolean;
}) {
  if (options?.profileReady === false) {
    return response({ success: true, profileReady: false });
  }

  const unlocked = options?.unlocked ?? false;
  return response({
    success: true,
    profileReady: true,
    walletBalance: options?.walletBalance ?? 1,
    unlocked,
    unlockId: unlocked ? "unlock-existing" : null,
    interpretation: unlocked ? interpretation : null,
  });
}

function unlockResponse(options?: { isNew?: boolean; walletBalance?: number }) {
  return response({
    success: true,
    isNew: options?.isNew ?? true,
    walletBalance: options?.walletBalance ?? 0,
    unlockId: "unlock-new",
  });
}

describe("YearlyFortuneUnlock", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.replace.mockReset();
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(firstRequestId)
        .mockReturnValueOnce(secondRequestId),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps the unlock action unavailable while status is loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    render(<YearlyFortuneUnlock year={year} />);

    expect(screen.getByLabelText("신년운세 이용 상태 확인 중")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "운석 1개 사용해서 보기" })).toBeNull();
  });

  it("never exposes an unlock action or POST when the canonical profile is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(yearlyStateResponse({ profileReady: false }));
    vi.stubGlobal("fetch", fetchMock);

    render(<YearlyFortuneUnlock year={year} />);

    expect(await screen.findByRole("button", { name: "사주 정보 입력하기" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "운석 1개 사용해서 보기" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/saju/yearly?year=${year}`,
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("shows paid content only when the server returns an unlocked interpretation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        yearlyStateResponse({ walletBalance: 3, unlocked: true })
      )
    );

    render(<YearlyFortuneUnlock year={year} />);

    expect(await screen.findByText("서버에서 생성한 신년운세")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "운석 1개 사용해서 보기" })).toBeNull();
    expect(screen.queryByText(/보유 운석/)).toBeNull();
  });

  it("shows the unlock CTA for a ready profile that is still locked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(yearlyStateResponse()));

    render(<YearlyFortuneUnlock year={year} />);

    expect(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    ).toBeTruthy();
    expect(screen.queryByText(/보유 운석/)).toBeNull();
    expect(screen.queryByText("서버에서 생성한 신년운세")).toBeNull();
  });

  it("reports when the initial server status has settled", async () => {
    const onInitialStatusSettled = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(yearlyStateResponse()));

    render(
      <YearlyFortuneUnlock
        year={year}
        onInitialStatusSettled={onInitialStatusSettled}
      />
    );

    expect(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    ).toBeTruthy();
    expect(onInitialStatusSettled).toHaveBeenCalledTimes(1);
  });

  it("sends only requestId and content and blocks duplicate clicks", async () => {
    let resolveUnlock: ((value: Response) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(yearlyStateResponse())
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveUnlock = resolve;
          })
      )
      .mockResolvedValueOnce(yearlyStateResponse({ unlocked: true, walletBalance: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<YearlyFortuneUnlock year={year} />);
    const button = await screen.findByRole("button", {
      name: "운석 1개 사용해서 보기",
    });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, options] = fetchMock.mock.calls[1];
    expect(JSON.parse(String(options?.body))).toEqual({
      requestId: firstRequestId,
      content: { kind: "yearlyFortune", year },
    });
    expect(String(options?.body)).not.toContain("userId");

    resolveUnlock?.(unlockResponse());
    expect(await screen.findByText("서버에서 생성한 신년운세")).toBeTruthy();
  });

  it("treats isNew=false as success and then loads protected content", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(yearlyStateResponse({ walletBalance: 2 }))
      .mockResolvedValueOnce(unlockResponse({ isNew: false, walletBalance: 2 }))
      .mockResolvedValueOnce(
        yearlyStateResponse({ walletBalance: 2, unlocked: true })
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<YearlyFortuneUnlock year={year} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    );

    expect(await screen.findByText("서버에서 생성한 신년운세")).toBeTruthy();
    expect(screen.queryByText(/보유 운석/)).toBeNull();
  });

  it("shows an insufficient state from either GET balance or POST error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(yearlyStateResponse({ walletBalance: 0 }))
    );
    const first = render(<YearlyFortuneUnlock year={year} />);

    expect(await screen.findByText("운석이 부족해요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "충전하기" })).toBeTruthy();
    first.unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(yearlyStateResponse())
      .mockResolvedValueOnce(
        response(
          {
            success: false,
            code: "INSUFFICIENT_STONES",
            error: "운석이 부족해요.",
          },
          409
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<YearlyFortuneUnlock year={year} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    );

    expect(await screen.findByText("운석이 부족해요. 충전 후 다시 이용해 주세요.")).toBeTruthy();
    expect(screen.queryByText("서버에서 생성한 신년운세")).toBeNull();
  });

  it("does not treat a yearly state failure as a locked state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ success: false, error: "failed" }, 500))
    );

    render(<YearlyFortuneUnlock year={year} />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 불러오기" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "운석 1개 사용해서 보기" })).toBeNull();
  });

  it("reuses the same requestId when retrying an uncertain network failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(yearlyStateResponse())
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(unlockResponse({ isNew: false, walletBalance: 1 }))
      .mockResolvedValueOnce(
        yearlyStateResponse({ walletBalance: 1, unlocked: true })
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<YearlyFortuneUnlock year={year} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    );
    fireEvent.click(await screen.findByRole("button", { name: "다시 시도하기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    const firstBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    const retryBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(firstBody.requestId).toBe(firstRequestId);
    expect(retryBody.requestId).toBe(firstRequestId);
  });

  it("uses a new requestId after a deterministic idempotency conflict", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(yearlyStateResponse())
      .mockResolvedValueOnce(
        response(
          {
            success: false,
            code: "STONE_IDEMPOTENCY_CONFLICT",
            error: "요청 정보가 충돌했어요.",
          },
          409
        )
      )
      .mockResolvedValueOnce(unlockResponse())
      .mockResolvedValueOnce(yearlyStateResponse({ unlocked: true }));
    vi.stubGlobal("fetch", fetchMock);
    render(<YearlyFortuneUnlock year={year} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "운석 1개 사용해서 보기" })
    );
    fireEvent.click(await screen.findByRole("button", { name: "다시 시도하기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    const firstBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    const nextBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(firstBody.requestId).toBe(firstRequestId);
    expect(nextBody.requestId).toBe(secondRequestId);
  });

  it("uses the existing login-expiry redirect for a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ success: false }, 401))
    );

    render(<YearlyFortuneUnlock year={year} />);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/login"));
  });
});
