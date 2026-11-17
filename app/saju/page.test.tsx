// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SajuPage from "./page";

vi.mock("../../components/saju/SajuDashboard", () => ({
  default: ({ user }: { user: { name: string } }) => (
    <main data-testid="saju-dashboard">{user.name}</main>
  ),
}));

describe("SajuPage", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders the existing dashboard without an empty loading gate", () => {
    render(<SajuPage />);

    expect(screen.getByTestId("saju-dashboard")).toBeTruthy();
  });

  it("applies a saved browser profile after the initial dashboard render", async () => {
    localStorage.setItem(
      "unlog-user",
      JSON.stringify({
        name: "저장 사용자",
        birthDate: "1992-01-14",
        birthHour: 13,
        birthMinute: 0,
        calendarType: "solar",
        gender: "female",
      })
    );

    render(<SajuPage />);

    expect(screen.getByTestId("saju-dashboard")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("saju-dashboard").textContent).toBe("저장 사용자");
    });
  });
});
