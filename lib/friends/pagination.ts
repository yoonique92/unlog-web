export const FRIENDS_PER_PAGE = 8;
export const MAX_GARDEN_PAGES = 3;
export const MAX_GARDEN_FRIENDS =
  FRIENDS_PER_PAGE * MAX_GARDEN_PAGES;

export function getFriendListPageCount(friendCount: number) {
  return Math.max(
    1,
    Math.ceil(friendCount / FRIENDS_PER_PAGE)
  );
}

export function getGardenPageCount(friendCount: number) {
  return Math.max(
    1,
    Math.min(
      Math.ceil(friendCount / FRIENDS_PER_PAGE),
      MAX_GARDEN_PAGES
    )
  );
}

export function getGardenPageIndex(
  friendListPageIndex: number,
  gardenPageCount: number
) {
  return Math.min(
    Math.max(0, friendListPageIndex),
    gardenPageCount - 1
  );
}

export function getFriendsForPage<T>(
  friends: readonly T[],
  pageIndex: number
) {
  const pageStart =
    Math.max(0, pageIndex) * FRIENDS_PER_PAGE;

  return friends.slice(
    pageStart,
    pageStart + FRIENDS_PER_PAGE
  );
}
