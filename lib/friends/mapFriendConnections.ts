import type { FourPillars } from "../friendRelationship";

export type FriendProfileSource = {
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  birthTimeUnknown?: boolean;
  calendarType?: string;
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
};

export type FriendConnectionSource = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  friendProfile: FriendProfileSource;
  createdAt: string;
};

export type FriendUserSource = {
  id: string;
  name: string;
};

export type FriendListItem = {
  id: string;
  userId: string | null;
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
  connectionId: string;
  isMember: boolean;
  pillars?: FourPillars;
};

type ResolvedFriendProfile = FriendProfileSource & {
  pillars?: FourPillars;
};

type MapFriendConnectionsOptions = {
  userId: string;
  connections: readonly FriendConnectionSource[];
  users: readonly FriendUserSource[];
  resolveFriendProfile: (profile: FriendProfileSource) => ResolvedFriendProfile;
};

const OWNER_PLACEHOLDER_IMAGE = "/image/friends/dragon_character_men.png";

export function mapFriendConnectionsForUser({
  userId,
  connections,
  users,
  resolveFriendProfile,
}: MapFriendConnectionsOptions): FriendListItem[] {
  const friends: FriendListItem[] = [];

  for (const connection of connections) {
    if (connection.ownerUserId === userId) {
      const friendProfile = resolveFriendProfile(connection.friendProfile);

      friends.push({
        id: connection.friendUserId ?? connection.id,
        userId: connection.friendUserId,
        name: friendProfile.name,
        birthDate: friendProfile.birthDate,
        birthHour: friendProfile.birthHour,
        birthMinute: friendProfile.birthMinute,
        gender: friendProfile.gender,
        dayPillar: friendProfile.dayPillar,
        characterName: friendProfile.characterName,
        image: friendProfile.image,
        connectionId: connection.id,
        isMember: Boolean(connection.friendUserId),
        pillars: friendProfile.pillars,
      });
      continue;
    }

    if (connection.friendUserId === userId) {
      const ownerUser = users.find((user) => user.id === connection.ownerUserId);

      friends.push({
        id: connection.ownerUserId,
        userId: connection.ownerUserId,
        name: ownerUser?.name ?? "로그 프렌즈",
        birthDate: "",
        birthHour: "",
        birthMinute: "",
        gender: "",
        dayPillar: "",
        characterName: "",
        image: OWNER_PLACEHOLDER_IMAGE,
        connectionId: connection.id,
        isMember: true,
      });
    }
  }

  return friends.filter((friend, index, array) => {
    const uniqueKey = friend.userId ?? friend.connectionId;
    return (
      array.findIndex(
        (item) => (item.userId ?? item.connectionId) === uniqueKey
      ) === index
    );
  });
}
