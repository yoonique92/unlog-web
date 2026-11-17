import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  getYearlyFortunePreviewForUser: vi.fn(),
}));

vi.mock("../../../../../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../../../../../lib/stones/yearlyFortunePreviewService", () => ({
  getYearlyFortunePreviewForUser: mocks.getYearlyFortunePreviewForUser,
}));

import { GET } from "./route";

const userId = "00000000-0000-4000-8000-000000000001";
const year = new Date().getFullYear();

function request(query = `year=${year}&love=dating&career=employed`) {
  return new Request(`http://localhost/api/saju/yearly/preview?${query}`);
}

describe("GET /api/saju/yearly/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ id: userId });
    mocks.getYearlyFortunePreviewForUser.mockResolvedValue({
      profileReady: true,
      preview: { year, text: "실제 흐름을 바탕으로 만든 두 문장 teaser예요." },
    });
  });

  it("returns only the minimal preview response", async () => {
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getYearlyFortunePreviewForUser).toHaveBeenCalledWith(
      userId,
      year
    );
    expect(body).toEqual({
      success: true,
      profileReady: true,
      preview: { year, text: "실제 흐름을 바탕으로 만든 두 문장 teaser예요." },
    });
    expect(JSON.stringify(body)).not.toMatch(
      /interpretation|relationship|money|career|action|caution|keywords|wallet/i
    );
  });

  it.each([
    `year=${year}&love=invalid&career=employed`,
    `year=${year}&love=dating&career=invalid`,
    `year=${year}&love=dating`,
  ])("rejects invalid reading context: %s", async (query) => {
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    expect(mocks.getYearlyFortunePreviewForUser).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    expect((await GET(request())).status).toBe(401);
    expect(mocks.getYearlyFortunePreviewForUser).not.toHaveBeenCalled();
  });
});
