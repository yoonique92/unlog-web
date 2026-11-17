import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findFriendConnectionWithProfileById: vi.fn(),
  findStoneContentStateForUser: vi.fn(),
}));

vi.mock("../../../../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../../../../lib/db/repositories/friendRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  findFriendConnectionWithProfileById:
    mocks.findFriendConnectionWithProfileById,
}));

vi.mock("../../../../lib/db/repositories/stoneReadRepository", () => ({
  findStoneContentStateForUser: mocks.findStoneContentStateForUser,
}));

import { GET } from "./route";

const userId = "00000000-0000-4000-8000-000000000001";
const otherUserId = "00000000-0000-4000-8000-000000000002";
const connectionId = "00000000-0000-4000-8000-000000000003";
const unlockId = "00000000-0000-4000-8000-000000000004";

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

function createRequest(query: string) {
  return new Request(`http://localhost/api/stones/status?${query}`);
}

describe("GET /api/stones/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.findFriendConnectionWithProfileById.mockResolvedValue(connection);
    mocks.findStoneContentStateForUser.mockResolvedValue({
      walletBalance: 0,
      unlocked: false,
      unlockId: null,
    });
  });

  it("rejects an unauthenticated request", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const response = await GET(createRequest("kind=yearlyFortune&year=2027"));

    expect(response.status).toBe(401);
    expect(mocks.findStoneContentStateForUser).not.toHaveBeenCalled();
  });

  it("returns balance zero and locked without creating a wallet", async () => {
    const response = await GET(createRequest("kind=yearlyFortune&year=2027"));

    expect(mocks.findStoneContentStateForUser).toHaveBeenCalledWith(userId, {
      contentType: "yearly_fortune",
      contentKey: "2027",
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      walletBalance: 0,
      unlocked: false,
      unlockId: null,
    });
  });

  it("returns the stored balance and existing unlock", async () => {
    mocks.findStoneContentStateForUser.mockResolvedValue({
      walletBalance: 5,
      unlocked: true,
      unlockId,
    });

    const response = await GET(createRequest("kind=yearlyFortune&year=2027"));

    await expect(response.json()).resolves.toEqual({
      success: true,
      walletBalance: 5,
      unlocked: true,
      unlockId,
    });
  });

  it("rejects a query-supplied userId", async () => {
    const response = await GET(
      createRequest(`kind=yearlyFortune&year=2027&userId=${otherUserId}`)
    );

    expect(response.status).toBe(400);
    expect(mocks.findStoneContentStateForUser).not.toHaveBeenCalled();
  });

  it.each([
    { ownerUserId: userId, friendUserId: null },
    { ownerUserId: otherUserId, friendUserId: userId },
  ])("allows a friend connection participant", async (participants) => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue({
      ...connection,
      ...participants,
    });

    const response = await GET(
      createRequest(
        `kind=friendCompatibility&connectionId=${connectionId}`
      )
    );

    expect(response.status).toBe(200);
    expect(mocks.findStoneContentStateForUser).toHaveBeenCalledWith(userId, {
      contentType: "compatibility",
      contentKey: `connection:${connectionId}`,
    });
  });

  it("rejects a missing friend connection before reading stone state", async () => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue(null);

    const response = await GET(
      createRequest(
        `kind=friendCompatibility&connectionId=${connectionId}`
      )
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "CONNECTION_NOT_FOUND",
    });
    expect(mocks.findStoneContentStateForUser).not.toHaveBeenCalled();
  });

  it("rejects another user's friend connection", async () => {
    mocks.findFriendConnectionWithProfileById.mockResolvedValue({
      ...connection,
      ownerUserId: otherUserId,
      friendUserId: null,
    });

    const response = await GET(
      createRequest(
        `kind=friendCompatibility&connectionId=${connectionId}`
      )
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.findStoneContentStateForUser).not.toHaveBeenCalled();
  });

  it.each([
    "kind=unsupported",
    "kind=yearlyFortune&year=99",
    "kind=friendCompatibility&connectionId=not-a-uuid",
  ])("rejects invalid content query %s", async (query) => {
    const response = await GET(createRequest(query));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CONTENT",
    });
    expect(mocks.findStoneContentStateForUser).not.toHaveBeenCalled();
  });

  it("maps a missing canonical user to unauthenticated", async () => {
    mocks.findStoneContentStateForUser.mockResolvedValue(null);

    const response = await GET(createRequest("kind=yearlyFortune&year=2027"));

    expect(response.status).toBe(401);
  });

  it("returns a generic 500 without exposing read errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.findStoneContentStateForUser.mockRejectedValue(
      new Error("sensitive database detail")
    );

    const response = await GET(createRequest("kind=yearlyFortune&year=2027"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      error: "콘텐츠 상태를 불러오지 못했어요.",
    });
    expect(JSON.stringify(body)).not.toContain("sensitive database detail");
    consoleError.mockRestore();
  });
});
