import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFriendConnectionByOwnerAndDedupeKey: vi.fn(),
  findFriendConnectionsByUserId: vi.fn(),
  findFriendConnectionWithProfileById: vi.fn(),
  findInviteByCode: vi.fn(),
  getOrCreateActiveInvite: vi.fn(),
  createFriendConnection: vi.fn(),
  deleteFriendConnection: vi.fn(),
  linkFriendConnectionUser: vi.fn(),
  findUsersByIds: vi.fn(),
  getSaju: vi.fn(),
  getDayPillarCharacterName: vi.fn(),
}));

vi.mock("../db/repositories/friendRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  findFriendConnectionByOwnerAndDedupeKey:
    mocks.findFriendConnectionByOwnerAndDedupeKey,
  findFriendConnectionsByUserId: mocks.findFriendConnectionsByUserId,
  findFriendConnectionWithProfileById:
    mocks.findFriendConnectionWithProfileById,
  findInviteByCode: mocks.findInviteByCode,
}));

vi.mock("../db/repositories/friendInviteWriteRepository", () => ({
  getOrCreateActiveInvite: mocks.getOrCreateActiveInvite,
}));

vi.mock("../db/repositories/friendWriteRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  createFriendConnection: mocks.createFriendConnection,
  deleteFriendConnection: mocks.deleteFriendConnection,
  linkFriendConnectionUser: mocks.linkFriendConnectionUser,
}));

vi.mock("../db/repositories/userRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  findUsersByIds: mocks.findUsersByIds,
}));

vi.mock("../saju", () => ({ getSaju: mocks.getSaju }));
vi.mock("../dayPillarCharacter", () => ({
  getDayPillarCharacterName: mocks.getDayPillarCharacterName,
}));

import { FriendWriteRepositoryError } from "../db/repositories/friendWriteRepository";
import {
  connectFriendUserFromPostgres,
  deleteFriendFromPostgres,
  getFriendsFromPostgres,
  getOrCreateInviteFromPostgres,
  registerFriendFromPostgres,
} from "./postgresFriendService";

const ownerUserId = "00000000-0000-4000-8000-000000000001";
const friendUserId = "00000000-0000-4000-8000-000000000002";
const connectionId = "00000000-0000-4000-8000-000000000003";
const createdAt = "2026-09-28T12:00:00.000Z";
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
const connection = {
  id: connectionId,
  ownerUserId,
  friendUserId: null,
  inviteCode: "a1b2c3d4",
  profileDedupeKey: 'v1:["친구","1994-03-15","male"]',
  createdAt,
  linkedAt: null,
  updatedAt: null,
  friendProfile: friend,
};

describe("postgresFriendService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findInviteByCode.mockResolvedValue({
      code: "a1b2c3d4",
      ownerUserId,
      isActive: true,
      createdAt,
    });
    mocks.createFriendConnection.mockResolvedValue({
      id: connectionId,
      ownerUserId,
      friendUserId: null,
      inviteCode: "a1b2c3d4",
      profileDedupeKey: connection.profileDedupeKey,
      createdAt,
      linkedAt: null,
      updatedAt: null,
    });
    mocks.findFriendConnectionWithProfileById.mockResolvedValue(connection);
  });

  it.each([true, false])(
    "maps invite created=%s to the existing isNew contract",
    async (created) => {
      mocks.getOrCreateActiveInvite.mockResolvedValue({
        code: "a1b2c3d4",
        ownerUserId,
        createdAt,
        isActive: true,
        created,
      });

      await expect(getOrCreateInviteFromPostgres(ownerUserId)).resolves.toEqual({
        success: true,
        code: "a1b2c3d4",
        isNew: created,
      });
    }
  );

  it("registers through the mutation repository and re-reads the snapshot", async () => {
    const result = await registerFriendFromPostgres({
      code: "a1b2c3d4",
      friend,
    });

    expect(result).toMatchObject({
      ok: true,
      response: { success: true, connectionId, ownerUserId },
      connection: { id: connectionId, friendProfile: friend },
    });
    expect(mocks.createFriendConnection).toHaveBeenCalledWith({
      ownerUserId,
      inviteCode: "a1b2c3d4",
      friendProfile: friend,
    });
    expect(mocks.findFriendConnectionWithProfileById).toHaveBeenCalledWith(
      connectionId
    );
  });

  it("looks up the existing connectionId for ALREADY_REGISTERED", async () => {
    mocks.createFriendConnection.mockRejectedValue(
      new FriendWriteRepositoryError("ALREADY_REGISTERED")
    );
    mocks.findFriendConnectionByOwnerAndDedupeKey.mockResolvedValue(connection);

    const result = await registerFriendFromPostgres({
      code: "a1b2c3d4",
      friend,
    });

    expect(mocks.findFriendConnectionByOwnerAndDedupeKey).toHaveBeenCalledWith(
      ownerUserId,
      connection.profileDedupeKey
    );
    expect(result).toMatchObject({
      ok: false,
      error: {
        status: 409,
        body: { code: "ALREADY_REGISTERED", connectionId },
      },
    });
  });

  it.each([
    null,
    {
      code: "a1b2c3d4",
      ownerUserId,
      isActive: false,
      createdAt,
    },
  ] as const)("maps an invalid invite to the existing public contract", async (invite) => {
    mocks.findInviteByCode.mockResolvedValue(invite);

    const result = await registerFriendFromPostgres({
      code: "a1b2c3d4",
      friend,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { status: 404, body: { code: "INVALID_INVITE" } },
    });
    expect(mocks.createFriendConnection).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "connects and preserves alreadyConnected=%s after snapshot re-read",
    async (alreadyLinked) => {
      const linkedConnection = { ...connection, friendUserId };
      mocks.linkFriendConnectionUser.mockResolvedValue({
        connection: linkedConnection,
        alreadyLinked,
      });
      mocks.findFriendConnectionWithProfileById.mockResolvedValue(linkedConnection);

      const result = await connectFriendUserFromPostgres(
        connectionId,
        friendUserId
      );

      expect(result).toMatchObject({
        ok: true,
        response: {
          success: true,
          alreadyConnected: alreadyLinked,
          connection: { id: connectionId, friendUserId, friendProfile: friend },
        },
      });
    }
  );

  it("maps ALREADY_LINKED to ALREADY_CONNECTED", async () => {
    mocks.linkFriendConnectionUser.mockRejectedValue(
      new FriendWriteRepositoryError("ALREADY_LINKED")
    );

    await expect(
      connectFriendUserFromPostgres(connectionId, friendUserId)
    ).resolves.toMatchObject({
      ok: false,
      error: { status: 409, body: { code: "ALREADY_CONNECTED" } },
    });
  });

  it("uses the existing owner-side mapper and avoids an owner-name query", async () => {
    mocks.findFriendConnectionsByUserId.mockResolvedValue([connection]);
    mocks.findUsersByIds.mockResolvedValue([]);
    mocks.getSaju.mockReturnValue({
      dayStem: "庚",
      dayBranch: "子",
      pillars: { year: {}, month: {}, day: {}, time: {} },
    });
    mocks.getDayPillarCharacterName.mockReturnValue("재계산 캐릭터");

    const response = await getFriendsFromPostgres(ownerUserId);

    expect(mocks.findUsersByIds).toHaveBeenCalledWith([]);
    expect(response).toMatchObject({
      success: true,
      friends: [
        {
          connectionId,
          userId: null,
          name: "친구",
          dayPillar: "庚子",
          characterName: "재계산 캐릭터",
          isMember: false,
        },
      ],
    });
  });

  it("batch-loads owner names and preserves the reverse-side placeholder", async () => {
    mocks.findFriendConnectionsByUserId.mockResolvedValue([
      { ...connection, friendUserId },
    ]);
    mocks.findUsersByIds.mockResolvedValue([
      { id: ownerUserId, displayName: "초대자" },
    ]);

    const response = await getFriendsFromPostgres(friendUserId);

    expect(mocks.findUsersByIds).toHaveBeenCalledTimes(1);
    expect(mocks.findUsersByIds).toHaveBeenCalledWith([ownerUserId]);
    expect(mocks.getSaju).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      success: true,
      friends: [
        {
          id: ownerUserId,
          userId: ownerUserId,
          name: "초대자",
          birthDate: "",
          image: "/image/friends/dragon_character_men.png",
          isMember: true,
        },
      ],
    });
  });

  it("deletes through the repository and preserves success/error contracts", async () => {
    mocks.deleteFriendConnection.mockResolvedValue({
      deletedConnectionId: connectionId,
    });
    await expect(
      deleteFriendFromPostgres(connectionId, ownerUserId)
    ).resolves.toEqual({ ok: true, response: { success: true } });

    mocks.deleteFriendConnection.mockRejectedValue(
      new FriendWriteRepositoryError("FORBIDDEN")
    );
    await expect(
      deleteFriendFromPostgres(connectionId, friendUserId)
    ).resolves.toMatchObject({ ok: false, error: { status: 403 } });

    mocks.deleteFriendConnection.mockRejectedValue(
      new FriendWriteRepositoryError("CONNECTION_NOT_FOUND")
    );
    await expect(
      deleteFriendFromPostgres(connectionId, friendUserId)
    ).resolves.toMatchObject({ ok: false, error: { status: 404 } });
  });

  it("does not disguise internal DB errors as public user errors", async () => {
    mocks.createFriendConnection.mockRejectedValue(
      new FriendWriteRepositoryError("INVALID_INVITE_OWNER")
    );

    await expect(
      registerFriendFromPostgres({ code: "a1b2c3d4", friend })
    ).rejects.toMatchObject({
      name: "PostgresServiceInternalError",
      code: "POSTGRES_SERVICE_INTERNAL_ERROR",
      operation: "friend-register",
    });
  });
});
