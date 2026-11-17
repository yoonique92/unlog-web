import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findFriendConnectionWithProfileById: vi.fn(),
  getYearlyFortuneForUser: vi.fn(),
  unlockStoneContent: vi.fn(),
}));

vi.mock("../../../../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../../../../lib/db/repositories/friendRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  findFriendConnectionWithProfileById:
    mocks.findFriendConnectionWithProfileById,
}));

vi.mock("../../../../lib/stones/stoneService", async (importOriginal) => ({
  ...(await importOriginal()),
  unlockStoneContent: mocks.unlockStoneContent,
}));

vi.mock("../../../../lib/stones/yearlyFortuneReadService", () => ({
  getYearlyFortuneForUser: mocks.getYearlyFortuneForUser,
}));

import { StoneServiceError } from "../../../../lib/stones/stoneService";
import { POST } from "./route";

const userId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const connectionId = "00000000-0000-4000-8000-000000000003";
const requestId = "00000000-0000-4000-8000-000000000004";
const unlockId = "00000000-0000-4000-8000-000000000005";

const sessionUser = {
  id: userId,
  name: "사용자",
  provider: "kakao" as const,
};

const connection = {
  id: connectionId,
  ownerUserId: userId,
  friendUserId: null,
  inviteCode: "a1b2c3d4",
  profileDedupeKey: 'v1:["친구","1990-01-01","male"]',
  createdAt: "2026-01-01T00:00:00.000Z",
  linkedAt: null,
  updatedAt: null,
  friendProfile: {
    name: "친구",
    birthDate: "1990-01-01",
    birthHour: "12",
    birthMinute: "0",
    birthTimeUnknown: false,
    calendarType: "solar",
    gender: "male",
    dayPillar: "갑자",
    characterName: "캐릭터",
    image: "/friend.png",
  },
};

function createRequest(body: unknown) {
  return new Request("http://localhost/api/stones/unlock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const yearlyBody = {
  requestId,
  content: { kind: "yearlyFortune", year: 2027 },
};

describe("POST /api/stones/unlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.findFriendConnectionWithProfileById.mockResolvedValue(connection);
    mocks.getYearlyFortuneForUser.mockResolvedValue({
      found: true,
      profileReady: true,
      walletBalance: 4,
      unlocked: false,
      unlockId: null,
      interpretation: null,
    });
    mocks.unlockStoneContent.mockResolvedValue({
      unlockId,
      ledgerEntryId: "00000000-0000-4000-8000-000000000006",
      walletBalance: 4,
      created: true,
    });
  });

  it("rejects an unauthenticated request", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const response = await POST(createRequest(yearlyBody));

    expect(response.status).toBe(401);
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it("rejects a body-supplied userId instead of trusting it", async () => {
    const response = await POST(
      createRequest({ ...yearlyBody, userId: otherUserId })
    );

    expect(response.status).toBe(400);
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it("unlocks yearly fortune with the canonical session user", async () => {
    const response = await POST(createRequest(yearlyBody));

    expect(mocks.unlockStoneContent).toHaveBeenCalledWith({
      userId,
      content: { kind: "yearlyFortune", year: 2027 },
      requestId,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      isNew: true,
      walletBalance: 4,
      unlockId,
    });
  });

  it("rejects yearly unlock before mutation when the canonical profile is missing", async () => {
    mocks.getYearlyFortuneForUser.mockResolvedValue({
      found: true,
      profileReady: false,
    });

    const response = await POST(createRequest(yearlyBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: "SAJU_PROFILE_REQUIRED",
    });
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it.each(["costStones", "entryType", "idempotencyKey", "requestFingerprint"])(
    "rejects client-controlled %s",
    async (field) => {
      const response = await POST(createRequest({ ...yearlyBody, [field]: 0 }));

      expect(response.status).toBe(400);
      expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
    }
  );

  it.each([
    { ownerUserId: userId, friendUserId: null },
    { ownerUserId: otherUserId, friendUserId: userId },
  ])("allows a connection participant to unlock compatibility", async (participants) => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue({
      ...connection,
      ...participants,
    });
    const body = {
      requestId,
      content: { kind: "friendCompatibility", connectionId },
    };

    const response = await POST(createRequest(body));

    expect(response.status).toBe(200);
    expect(mocks.findFriendConnectionWithProfileById).toHaveBeenCalledWith(
      connectionId
    );
    expect(mocks.unlockStoneContent).toHaveBeenCalledWith({
      userId,
      content: body.content,
      requestId,
    });
  });

  it("rejects a missing friend connection before charging", async () => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue(null);

    const response = await POST(
      createRequest({
        requestId,
        content: { kind: "friendCompatibility", connectionId },
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONNECTION_NOT_FOUND",
    });
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it("rejects another user's friend connection before charging", async () => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue({
      ...connection,
      ownerUserId: otherUserId,
      friendUserId: null,
    });

    const response = await POST(
      createRequest({
        requestId,
        content: { kind: "friendCompatibility", connectionId },
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it.each([
    { requestId, content: { kind: "unsupported" } },
    { requestId, content: { kind: "yearlyFortune", year: 99 } },
  ])("rejects invalid content with a stable code", async (body) => {
    const response = await POST(createRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CONTENT",
    });
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it("rejects an invalid requestId with a stable code", async () => {
    const response = await POST(
      createRequest({ requestId: "not-a-uuid", content: yearlyBody.content })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_IDEMPOTENCY",
    });
    expect(mocks.unlockStoneContent).not.toHaveBeenCalled();
  });

  it.each([
    ["INSUFFICIENT_STONES", 409],
    ["STONE_IDEMPOTENCY_CONFLICT", 409],
    ["INVALID_CONTENT", 400],
    ["INVALID_IDEMPOTENCY", 400],
  ] as const)("maps service error %s", async (code, status) => {
    mocks.unlockStoneContent.mockRejectedValue(new StoneServiceError(code));

    const response = await POST(createRequest(yearlyBody));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code,
    });
  });

  it("preserves the same requestId for a retry and exposes existing unlock state", async () => {
    mocks.unlockStoneContent
      .mockResolvedValueOnce({
        unlockId,
        ledgerEntryId: "00000000-0000-4000-8000-000000000006",
        walletBalance: 4,
        created: true,
      })
      .mockResolvedValueOnce({
        unlockId,
        ledgerEntryId: "00000000-0000-4000-8000-000000000006",
        walletBalance: 4,
        created: false,
      });

    const first = await POST(createRequest(yearlyBody));
    const retry = await POST(createRequest(yearlyBody));

    expect(mocks.unlockStoneContent).toHaveBeenNthCalledWith(1, {
      userId,
      content: yearlyBody.content,
      requestId,
    });
    expect(mocks.unlockStoneContent).toHaveBeenNthCalledWith(2, {
      userId,
      content: yearlyBody.content,
      requestId,
    });
    await expect(first.json()).resolves.toMatchObject({ isNew: true });
    await expect(retry.json()).resolves.toMatchObject({ isNew: false });
  });

  it("returns a generic 500 without exposing an unexpected service error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.unlockStoneContent.mockRejectedValue(
      new Error("sensitive database detail")
    );

    const response = await POST(createRequest(yearlyBody));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "콘텐츠를 해금하지 못했어요.",
    });
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
    consoleError.mockRestore();
  });
});
