import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useStoneWalletBalance: vi.fn(),
}));

vi.mock("../../lib/stones/useStoneWalletBalance", () => ({
  useStoneWalletBalance: mocks.useStoneWalletBalance,
}));

import ChargePage from "./page";

describe("ChargePage wallet balance", () => {
  beforeEach(() => {
    mocks.useStoneWalletBalance.mockReturnValue({
      walletBalance: 5,
      status: "ready",
    });
  });

  afterEach(cleanup);

  it("shows the canonical wallet balance", () => {
    render(<ChargePage />);

    expect(screen.getByText("5개")).toBeTruthy();
    expect(screen.queryByText("3개")).toBeNull();
  });

  it("shows zero when the canonical user has no wallet", () => {
    mocks.useStoneWalletBalance.mockReturnValue({
      walletBalance: 0,
      status: "ready",
    });

    render(<ChargePage />);

    expect(screen.getByText("0개")).toBeTruthy();
  });
});
