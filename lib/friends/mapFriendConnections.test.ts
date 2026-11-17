import { describe, expect, it, vi } from "vitest";
import {
  mapFriendConnectionsForUser,
  type FriendConnectionSource,
  type FriendProfileSource,
} from "./mapFriendConnections";

const profile: FriendProfileSource = {
  name: "친구",
  birthDate: "2000-01-02",
  birthHour: "12",
  birthMinute: "30",
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
  dayPillar: "甲子",
  characterName: "캐릭터",
  image: "/friend.png",
};

const connection: FriendConnectionSource = {
  id: "connection-1",
  ownerUserId: "owner-1",
  friendUserId: "friend-1",
  inviteCode: "invite-1",
  friendProfile: profile,
  createdAt: "2025-01-01T00:00:00.000Z",
};

describe("mapFriendConnectionsForUser", () => {
  it("preserves the owner-side snapshot response", () => {
    const resolveFriendProfile = vi.fn((value: FriendProfileSource) => ({
      ...value,
      dayPillar: "乙丑",
    }));

    const result = mapFriendConnectionsForUser({
      userId: "owner-1",
      connections: [connection],
      users: [{ id: "owner-1", name: "초대자" }],
      resolveFriendProfile,
    });

    expect(resolveFriendProfile).toHaveBeenCalledWith(profile);
    expect(result).toEqual([
      {
        id: "friend-1",
        userId: "friend-1",
        name: "친구",
        birthDate: "2000-01-02",
        birthHour: "12",
        birthMinute: "30",
        gender: "female",
        dayPillar: "乙丑",
        characterName: "캐릭터",
        image: "/friend.png",
        connectionId: "connection-1",
        isMember: true,
        pillars: undefined,
      },
    ]);
  });

  it("preserves the friend-side owner placeholder response", () => {
    const resolveFriendProfile = vi.fn((value: FriendProfileSource) => value);

    const result = mapFriendConnectionsForUser({
      userId: "friend-1",
      connections: [connection],
      users: [{ id: "owner-1", name: "초대자" }],
      resolveFriendProfile,
    });

    expect(resolveFriendProfile).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: "owner-1",
        userId: "owner-1",
        name: "초대자",
        birthDate: "",
        birthHour: "",
        birthMinute: "",
        gender: "",
        dayPillar: "",
        characterName: "",
        image: "/image/friends/dragon_character_men.png",
        connectionId: "connection-1",
        isMember: true,
      },
    ]);
  });

  it("keeps a pending owner-side friend keyed by the connection", () => {
    const result = mapFriendConnectionsForUser({
      userId: "owner-1",
      connections: [{ ...connection, friendUserId: null }],
      users: [{ id: "owner-1", name: "초대자" }],
      resolveFriendProfile: (value) => value,
    });

    expect(result[0]).toMatchObject({
      id: "connection-1",
      userId: null,
      isMember: false,
    });
  });
});
