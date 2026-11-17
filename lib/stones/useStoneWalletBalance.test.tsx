import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useStoneWalletBalance } from "./useStoneWalletBalance";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function WalletProbe({ refreshKey }: { refreshKey?: string }) {
  const { walletBalance, status } = useStoneWalletBalance(refreshKey);
  return (
    <div>
      <span>{status}</span>
      <span>{walletBalance ?? "none"}</span>
    </div>
  );
}

describe("useStoneWalletBalance", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads the canonical balance without browser caching", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ success: true, walletBalance: 5 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<WalletProbe />);

    expect(await screen.findByText("ready")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/stones/wallet",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("refetches the latest canonical balance when the refresh key changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ success: true, walletBalance: 5 }))
      .mockResolvedValueOnce(response({ success: true, walletBalance: 4 }));
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<WalletProbe refreshKey="/saju" />);
    expect(await screen.findByText("5")).toBeTruthy();

    view.rerender(<WalletProbe refreshKey="/charge" />);

    await waitFor(() => expect(screen.getByText("4")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps an unauthenticated request distinct from balance zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ success: false }, 401))
    );

    render(<WalletProbe />);

    expect(await screen.findByText("unauthenticated")).toBeTruthy();
    expect(screen.getByText("none")).toBeTruthy();
  });
});
