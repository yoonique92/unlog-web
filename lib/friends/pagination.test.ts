import { describe, expect, it } from "vitest";

import {
  getFriendListPageCount,
  getFriendsForPage,
  getGardenPageCount,
  getGardenPageIndex,
} from "./pagination";

const friends = Array.from(
  { length: 30 },
  (_, index) => `친구${String(index + 1).padStart(2, "0")}`
);

describe("friends pagination", () => {
  it.each([
    [8, 1, 1],
    [9, 2, 2],
    [16, 2, 2],
    [17, 3, 3],
    [24, 3, 3],
    [25, 4, 3],
    [30, 4, 3],
    [49, 7, 3],
    [50, 7, 3],
  ])(
    "%i명의 목록/정원 페이지 수를 계산한다",
    (friendCount, listPages, gardenPages) => {
      expect(getFriendListPageCount(friendCount)).toBe(listPages);
      expect(getGardenPageCount(friendCount)).toBe(gardenPages);
    }
  );

  it("30명을 목록에서 8명 단위로 나눈다", () => {
    expect(getFriendsForPage(friends, 0)).toEqual(friends.slice(0, 8));
    expect(getFriendsForPage(friends, 1)).toEqual(friends.slice(8, 16));
    expect(getFriendsForPage(friends, 2)).toEqual(friends.slice(16, 24));
    expect(getFriendsForPage(friends, 3)).toEqual(friends.slice(24, 30));
  });

  it("목록 4페이지 이상에서는 정원을 3페이지에 유지한다", () => {
    expect(getGardenPageIndex(0, 3)).toBe(0);
    expect(getGardenPageIndex(1, 3)).toBe(1);
    expect(getGardenPageIndex(2, 3)).toBe(2);
    expect(getGardenPageIndex(3, 3)).toBe(2);
    expect(getGardenPageIndex(8, 3)).toBe(2);
  });

  it("50명에서는 7페이지에 마지막 두 친구만 표시한다", () => {
    const fiftyFriends = Array.from(
      { length: 50 },
      (_, index) => `친구${index + 1}`
    );

    expect(getFriendsForPage(fiftyFriends, 6)).toEqual([
      "친구49",
      "친구50",
    ]);
    expect(getGardenPageCount(fiftyFriends.length)).toBe(3);
    expect(getGardenPageIndex(6, 3)).toBe(2);
  });
});
