import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionUser = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "사용자",
  provider: "kakao" as const,
};
const ownerUserId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000003";
const friend = {
  name: "친구",
  birthDate: "1994-03-15",
  birthHour: "14",
  birthMinute: "30",
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "male",
  dayPillar: "庚子",
  characterName: "캐릭터",
  image: "/friend.png",
};

const storage = vi.hoisted(() => ({
  invites: [] as object[],
  connections: [] as object[],
  users: [] as object[],
}));
const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  getFriendsFromPostgres: vi.fn(),
  deleteFriendFromPostgres: vi.fn(),
  getOrCreateInviteFromPostgres: vi.fn(),
  registerFriendFromPostgres: vi.fn(),
  connectFriendUserFromPostgres: vi.fn(),
  acquireFriendConnectionMutationLock: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("../lib/auth/session", () => ({
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../lib/dataSource/postgresFriendService", () => ({
  getFriendsFromPostgres: mocks.getFriendsFromPostgres,
  deleteFriendFromPostgres: mocks.deleteFriendFromPostgres,
  getOrCreateInviteFromPostgres: mocks.getOrCreateInviteFromPostgres,
  registerFriendFromPostgres: mocks.registerFriendFromPostgres,
  connectFriendUserFromPostgres: mocks.connectFriendUserFromPostgres,
}));

vi.mock("../lib/friends/connectionMutationLock", () => ({
  acquireFriendConnectionMutationLock: mocks.acquireFriendConnectionMutationLock,
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const promises = {
    ...actual.promises,
    mkdir: vi.fn(async () => undefined),
    access: vi.fn(async () => undefined),
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
  };
  return { ...actual, default: { ...actual, promises }, promises };
});

import { GET as getFriends, DELETE as deleteFriend } from "../app/api/friends/route";
import { POST as getInvite } from "../app/api/friends/invite/route";
import { POST as registerFriend } from "../app/api/friends/invite/register/route";
import { POST as connectFriend } from "../app/api/friends/connect-user/route";

function registerRequest() {
  return new Request("http://localhost/api/friends/invite/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "a1b2c3d4", friend }),
  });
}

function connectRequest() {
  return new Request("http://localhost/api/friends/connect-user", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ connectionId }),
  });
}

function deleteRequest() {
  return new Request(
    `http://localhost/api/friends?connectionId=${connectionId}`,
    { method: "DELETE" }
  );
}

function publicFailure(status: number, code?: string, connection?: string) {
  return {
    ok: false as const,
    error: {
      status,
      body: {
        success: false as const,
        error: "공개 오류",
        ...(code ? { code } : {}),
        ...(connection ? { connectionId: connection } : {}),
      },
    },
  };
}

describe("friend route data-source cutover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UNLOG_POSTGRES_SOURCE_V1;
    storage.invites = [];
    storage.connections = [];
    storage.users = [];
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.acquireFriendConnectionMutationLock.mockResolvedValue(vi.fn());
    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith("friend-invites.json")) {
        return JSON.stringify(storage.invites);
      }
      if (filePath.endsWith("friend-connections.json")) {
        return JSON.stringify(storage.connections);
      }
      return JSON.stringify(storage.users);
    });
    mocks.writeFile.mockImplementation(async (filePath: string, value: string) => {
      if (filePath.endsWith("friend-invites.json")) {
        storage.invites = JSON.parse(value) as object[];
      } else if (filePath.endsWith("friend-connections.json")) {
        storage.connections = JSON.parse(value) as object[];
      }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("friends GET OFF keeps JSON and ON uses only the PostgreSQL service", async () => {
    const offResponse = await getFriends();
    await expect(offResponse.json()).resolves.toEqual({ success: true, friends: [] });
    expect(mocks.readFile).toHaveBeenCalled();
    expect(mocks.getFriendsFromPostgres).not.toHaveBeenCalled();

    vi.clearAllMocks();
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.getFriendsFromPostgres.mockResolvedValue({
      success: true,
      friends: [{ connectionId, name: "친구" }],
    });

    const onResponse = await getFriends();
    await expect(onResponse.json()).resolves.toMatchObject({
      success: true,
      friends: [{ connectionId }],
    });
    expect(mocks.getFriendsFromPostgres).toHaveBeenCalledWith(sessionUser.id);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("friends DELETE OFF keeps JSON deletion", async () => {
    storage.connections = [
      {
        id: connectionId,
        ownerUserId,
        friendUserId: sessionUser.id,
        inviteCode: "a1b2c3d4",
        friendProfile: friend,
        createdAt: "2026-09-28T12:00:00.000Z",
      },
    ];

    const response = await deleteFriend(deleteRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(storage.connections).toHaveLength(0);
    expect(mocks.deleteFriendFromPostgres).not.toHaveBeenCalled();
  });

  it.each([
    [{ ok: true, response: { success: true } }, 200],
    [publicFailure(404), 404],
    [publicFailure(403), 403],
  ] as const)(
    "friends DELETE ON returns its service contract",
    async (serviceResult, expectedStatus) => {
      vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
      mocks.deleteFriendFromPostgres.mockResolvedValue(serviceResult);

      const response = await deleteFriend(deleteRequest());

      expect(response.status).toBe(expectedStatus);
      expect(mocks.deleteFriendFromPostgres).toHaveBeenCalledWith(
        connectionId,
        sessionUser.id
      );
      expect(mocks.readFile).not.toHaveBeenCalled();
    }
  );

  it("friends DELETE ON keeps internal failures on the generic 500 path", async () => {
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.deleteFriendFromPostgres.mockRejectedValue(new Error("sensitive DB error"));

    const response = await deleteFriend(deleteRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ success: false });
    expect(JSON.stringify(body)).not.toContain("sensitive DB error");
  });

  it("invite OFF keeps JSON creation and ON returns isNew from the service", async () => {
    const offResponse = await getInvite();
    const offBody = await offResponse.json();
    expect(offBody).toMatchObject({ success: true, isNew: true });
    expect(storage.invites).toHaveLength(1);
    expect(mocks.getOrCreateInviteFromPostgres).not.toHaveBeenCalled();

    vi.clearAllMocks();
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.getOrCreateInviteFromPostgres.mockResolvedValue({
      success: true,
      code: "deadbeef",
      isNew: false,
    });

    const onResponse = await getInvite();
    await expect(onResponse.json()).resolves.toEqual({
      success: true,
      code: "deadbeef",
      isNew: false,
    });
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        ok: true,
        response: { success: true, connectionId, ownerUserId },
      },
      200,
      undefined,
    ],
    [publicFailure(404, "INVALID_INVITE"), 404, "INVALID_INVITE"],
    [
      publicFailure(409, "ALREADY_REGISTERED", connectionId),
      409,
      "ALREADY_REGISTERED",
    ],
    [publicFailure(429, "FRIEND_LIMIT_REACHED"), 429, "FRIEND_LIMIT_REACHED"],
  ] as const)(
    "register ON preserves success and public error contracts",
    async (serviceResult, expectedStatus, expectedCode) => {
      vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
      mocks.registerFriendFromPostgres.mockResolvedValue(serviceResult);

      const response = await registerFriend(registerRequest());
      const body = await response.json();

      expect(response.status).toBe(expectedStatus);
      if (expectedCode) expect(body.code).toBe(expectedCode);
      if (expectedCode === "ALREADY_REGISTERED") {
        expect(body.connectionId).toBe(connectionId);
      }
      expect(mocks.acquireFriendConnectionMutationLock).not.toHaveBeenCalled();
      expect(mocks.readFile).not.toHaveBeenCalled();
    }
  );

  it.each([
    [
      {
        ok: true,
        response: {
          success: true,
          alreadyConnected: false,
          connection: { id: connectionId },
        },
      },
      200,
      false,
      undefined,
    ],
    [
      {
        ok: true,
        response: {
          success: true,
          alreadyConnected: true,
          connection: { id: connectionId },
        },
      },
      200,
      true,
      undefined,
    ],
    [publicFailure(409, "ALREADY_CONNECTED"), 409, undefined, "ALREADY_CONNECTED"],
    [publicFailure(400), 400, undefined, undefined],
    [publicFailure(429, "FRIEND_LIMIT_REACHED"), 429, undefined, "FRIEND_LIMIT_REACHED"],
  ] as const)(
    "connect ON preserves success, idempotency, and public error contracts",
    async (serviceResult, expectedStatus, alreadyConnected, expectedCode) => {
      vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
      mocks.connectFriendUserFromPostgres.mockResolvedValue(serviceResult);

      const response = await connectFriend(connectRequest());
      const body = await response.json();

      expect(response.status).toBe(expectedStatus);
      if (alreadyConnected !== undefined) {
        expect(body.alreadyConnected).toBe(alreadyConnected);
      }
      if (expectedCode) expect(body.code).toBe(expectedCode);
      expect(mocks.acquireFriendConnectionMutationLock).not.toHaveBeenCalled();
      expect(mocks.readFile).not.toHaveBeenCalled();
    }
  );

  it("connect OFF retains the JSON lock and write path", async () => {
    storage.connections = [
      {
        id: connectionId,
        ownerUserId,
        friendUserId: null,
        inviteCode: "a1b2c3d4",
        friendProfile: friend,
        createdAt: "2026-09-28T12:00:00.000Z",
      },
    ];

    const response = await connectFriend(connectRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alreadyConnected).toBe(false);
    expect(mocks.acquireFriendConnectionMutationLock).toHaveBeenCalled();
    expect(mocks.writeFile).toHaveBeenCalled();
    expect(mocks.connectFriendUserFromPostgres).not.toHaveBeenCalled();
  });
});
