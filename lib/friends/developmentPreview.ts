export const MAX_DEVELOPMENT_MOCK_FRIENDS = 30;

export function getDevelopmentSampleFriends<T>({
  isDevelopment,
  sampleFriends,
}: {
  isDevelopment: boolean;
  sampleFriends: readonly T[];
}): T[] {
  return isDevelopment ? [...sampleFriends] : [];
}

export function parseDevelopmentMockFriendCount(
  search: string,
  isDevelopment: boolean
) {
  if (!isDevelopment) return null;

  const rawCount = new URLSearchParams(search).get("mockFriends");

  if (!rawCount || !/^\d+$/.test(rawCount)) return null;

  const count = Number(rawCount);

  if (
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > MAX_DEVELOPMENT_MOCK_FRIENDS
  ) {
    return null;
  }

  return count;
}
