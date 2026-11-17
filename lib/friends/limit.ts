export const MAX_STORED_FRIENDS = 50;
export const FRIEND_LIMIT_REACHED_CODE =
  "FRIEND_LIMIT_REACHED";
export const FRIEND_LIMIT_REACHED_MESSAGE =
  "친구는 최대 50명까지 추가할 수 있어요.";

export type StoredFriendConnection = {
  ownerUserId: string;
  friendUserId: string | null;
};

export function getStoredFriendCountForUser(
  connections: readonly StoredFriendConnection[],
  userId: string
) {
  return connections.reduce(
    (count, connection) =>
      connection.ownerUserId === userId ||
      connection.friendUserId === userId
        ? count + 1
        : count,
    0
  );
}

export function hasReachedStoredFriendLimit(
  connections: readonly StoredFriendConnection[],
  userId: string
) {
  return (
    getStoredFriendCountForUser(connections, userId) >=
    MAX_STORED_FRIENDS
  );
}
