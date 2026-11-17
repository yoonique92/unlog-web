import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useStoneWalletBalance: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("../../lib/stones/useStoneWalletBalance", () => ({
  useStoneWalletBalance: mocks.useStoneWalletBalance,
}));

import MobileHeader from "./MobileHeader";

describe("MobileHeader wallet balance", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/");
    mocks.useStoneWalletBalance.mockReturnValue({
      walletBalance: 5,
      status: "ready",
    });
  });

  afterEach(cleanup);

  it("shows the authenticated user's canonical balance and links to charge", () => {
    render(<MobileHeader />);

    const chargeLink = screen.getByRole("link", {
      name: "로그 상점, 보유 운석 5개",
    });
    expect(chargeLink.getAttribute("href")).toBe("/charge");
    expect(screen.getByText("5")).toBeTruthy();
    expect(chargeLink.className).not.toContain("bg-[#F4F1FF]");
    expect(chargeLink.className).not.toContain("rounded-full");
    expect(mocks.useStoneWalletBalance).toHaveBeenCalledWith("/");
  });

  it("keeps the existing icon-only header for unauthenticated users", () => {
    mocks.useStoneWalletBalance.mockReturnValue({
      walletBalance: null,
      status: "unauthenticated",
    });

    render(<MobileHeader />);

    expect(screen.getByRole("link", { name: "로그 상점" })).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });
});
