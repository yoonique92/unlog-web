import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import { findFriendConnectionByOwnerAndDedupeKey } from "./friendRepository";
import { findUsersByIds } from "./userRepository";

const ownerUserId = "00000000-0000-4000-8000-000000000001";
const secondUserId = "00000000-0000-4000-8000-000000000002";
const missingUserId = "00000000-0000-4000-8000-000000000099";
const connectionId = "00000000-0000-4000-8000-000000000003";
const profileDedupeKey = 'v1:["친구","1994-03-15","male"]';

const connectionRow = {
  id: connectionId,
  owner_user_id: ownerUserId,
  friend_user_id: null,
  invite_code: "a1b2c3d4",
  profile_dedupe_key: profileDedupeKey,
  created_at: new Date("2026-09-28T12:00:00.000Z"),
  linked_at: null,
  updated_at: null,
  profile_connection_id: connectionId,
  name: "친구",
  birth_date: "1994-03-15",
  birth_hour: "14",
  birth_minute: "30",
  birth_time_unknown: false,
  calendar_type: "solar",
  gender: "male",
  day_pillar: "庚子",
  character_name: "테스트 캐릭터",
  image: "/image/friends/test.png",
};

describe("read repositories", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("finds a connection by its exact owner and profile dedupe key", async () => {
    const unsafe = vi.fn().mockResolvedValue([connectionRow]);
    mocks.getPostgresClient.mockReturnValue({ unsafe } as never);

    await expect(
      findFriendConnectionByOwnerAndDedupeKey(ownerUserId, profileDedupeKey)
    ).resolves.toMatchObject({
      id: connectionId,
      ownerUserId,
      profileDedupeKey,
      friendProfile: { name: "친구" },
    });
    expect(unsafe).toHaveBeenCalledWith(
      expect.stringContaining("fc.owner_user_id = $1"),
      [ownerUserId, profileDedupeKey]
    );
    expect(unsafe.mock.calls[0][0]).toContain("fc.profile_dedupe_key = $2");
  });

  it("returns null when the owner and dedupe key do not match a connection", async () => {
    const unsafe = vi.fn().mockResolvedValue([]);
    mocks.getPostgresClient.mockReturnValue({ unsafe } as never);

    await expect(
      findFriendConnectionByOwnerAndDedupeKey(ownerUserId, "missing")
    ).resolves.toBeNull();
  });

  it("fetches users once, removes duplicate inputs, preserves first-input order, and omits missing ids", async () => {
    const unsafe = vi.fn().mockResolvedValue([
      { id: ownerUserId, display_name: "첫 번째" },
      { id: secondUserId, display_name: "두 번째" },
    ]);
    mocks.getPostgresClient.mockReturnValue({ unsafe } as never);

    await expect(
      findUsersByIds([secondUserId, ownerUserId, secondUserId, missingUserId])
    ).resolves.toEqual([
      { id: secondUserId, displayName: "두 번째" },
      { id: ownerUserId, displayName: "첫 번째" },
    ]);
    expect(unsafe).toHaveBeenCalledTimes(1);
    expect(unsafe).toHaveBeenCalledWith(expect.stringContaining("ANY($1::uuid[])"), [
      [secondUserId, ownerUserId, missingUserId],
    ]);
  });

  it("does not issue a query for an empty user id list", async () => {
    const unsafe = vi.fn();
    mocks.getPostgresClient.mockReturnValue({ unsafe } as never);

    await expect(findUsersByIds([])).resolves.toEqual([]);
    expect(mocks.getPostgresClient).not.toHaveBeenCalled();
    expect(unsafe).not.toHaveBeenCalled();
  });
});
