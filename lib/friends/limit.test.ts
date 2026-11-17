import { describe, expect, it } from "vitest";

import {
  MAX_STORED_FRIENDS,
  getStoredFriendCountForUser,
  hasReachedStoredFriendLimit,
} from "./limit";

function createConnections(ownerCount: number) {
  return Array.from({ length: ownerCount }, () => ({
    ownerUserId: "owner-1",
    friendUserId: null,
  }));
}

describe("stored friend limit", () => {
  it("49명에서는 한 명을 더 저장할 수 있다", () => {
    const connections = createConnections(49);

    expect(getStoredFriendCountForUser(connections, "owner-1")).toBe(49);
    expect(hasReachedStoredFriendLimit(connections, "owner-1")).toBe(false);
  });

  it("50명부터 새 저장을 차단한다", () => {
    const connections = createConnections(MAX_STORED_FRIENDS);

    expect(getStoredFriendCountForUser(connections, "owner-1")).toBe(50);
    expect(hasReachedStoredFriendLimit(connections, "owner-1")).toBe(true);
  });

  it("다른 사용자의 관계와 화면용 mock/sample은 계산하지 않는다", () => {
    const connections = [
      ...createConnections(49),
      { ownerUserId: "owner-2", friendUserId: null },
    ];

    expect(getStoredFriendCountForUser(connections, "owner-1")).toBe(49);
    expect(hasReachedStoredFriendLimit(connections, "owner-1")).toBe(false);
  });

  it("가입으로 연결된 양쪽 사용자의 실제 관계를 계산한다", () => {
    const connections = [
      { ownerUserId: "owner-1", friendUserId: "member-1" },
    ];

    expect(getStoredFriendCountForUser(connections, "owner-1")).toBe(1);
    expect(getStoredFriendCountForUser(connections, "member-1")).toBe(1);
  });
});
