import type { SessionUser } from "../auth/session";
import type {
  ActiveFriendInvite,
} from "../db/repositories/friendInviteWriteRepository";
import type {
  FriendConnectionRecord,
} from "../db/repositories/friendRepository";
import type {
  FriendWriteRepositoryErrorCode,
  LinkFriendConnectionUserResult,
} from "../db/repositories/friendWriteRepository";
import type { SocialUserWriteResult } from "../db/repositories/socialUserWriteRepository";
import type {
  UpsertUserSajuProfileResult,
  UserWriteRepositoryErrorCode,
} from "../db/repositories/userWriteRepository";
import type {
  AuthProvider,
  SajuProfileRecord,
  UserWithAuthAndSaju,
} from "../db/repositories/userRepository";
import {
  mapFriendConnectionsForUser,
} from "../friends/mapFriendConnections";
import {
  FRIEND_LIMIT_REACHED_CODE,
  FRIEND_LIMIT_REACHED_MESSAGE,
} from "../friends/limit";

export type ApiSajuProfile = {
  name?: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  gender: "male" | "female";
};

type SajuProfileSource = Pick<
  SajuProfileRecord,
  | "name"
  | "birthDate"
  | "birthHour"
  | "birthMinute"
  | "birthTimeUnknown"
  | "calendarType"
  | "gender"
>;

export type PublicApiErrorContract = {
  status: number;
  body: {
    success: false;
    error: string;
    code?: string;
    connectionId?: string;
  };
};

function toApiSajuProfile(profile: SajuProfileSource): ApiSajuProfile {
  const shared = {
    birthDate: profile.birthDate,
    birthHour: profile.birthHour,
    birthMinute: profile.birthMinute,
    birthTimeUnknown: profile.birthTimeUnknown,
    calendarType: profile.calendarType,
    gender: profile.gender,
  };

  return profile.name === null ? shared : { name: profile.name, ...shared };
}

export function toSessionUserFromSocialUser(
  user: Pick<SocialUserWriteResult, "id" | "displayName" | "provider">
): SessionUser {
  return {
    id: user.id,
    name: user.displayName,
    provider: user.provider,
  };
}

export function toAuthMeSuccessResponse(
  user: Pick<UserWithAuthAndSaju, "id" | "name" | "sajuProfile">,
  provider: AuthProvider
) {
  return {
    success: true as const,
    user: {
      id: user.id,
      name: user.name,
      provider,
      sajuProfile: user.sajuProfile
        ? toApiSajuProfile(user.sajuProfile)
        : null,
    },
  };
}

export function toUserSajuSuccessContract(
  result: UpsertUserSajuProfileResult
) {
  return {
    sessionName: result.displayName,
    body: {
      success: true as const,
      sajuProfile: toApiSajuProfile(result.sajuProfile),
    },
  };
}

export function mapUserSajuRepositoryError(
  code: UserWriteRepositoryErrorCode
): PublicApiErrorContract | null {
  if (code === "USER_NOT_FOUND") {
    return {
      status: 404,
      body: {
        success: false,
        error: "사용자를 찾을 수 없습니다.",
      },
    };
  }

  return null;
}

export function toFriendInviteSuccessResponse(invite: ActiveFriendInvite) {
  return {
    success: true as const,
    code: invite.code,
    isNew: invite.created,
  };
}

export function toFriendRegisterSuccessResponse(connection: {
  id: string;
  ownerUserId: string;
}) {
  return {
    success: true as const,
    connectionId: connection.id,
    ownerUserId: connection.ownerUserId,
  };
}

export function toLegacyFriendConnection(
  connection: FriendConnectionRecord
) {
  return {
    id: connection.id,
    ownerUserId: connection.ownerUserId,
    friendUserId: connection.friendUserId,
    inviteCode: connection.inviteCode,
    friendProfile: connection.friendProfile,
    createdAt: connection.createdAt,
  };
}

export function createFriendProfileDedupeKeyV1(profile: {
  name: string;
  birthDate: string;
  gender: string;
}) {
  return `v1:${JSON.stringify([
    profile.name,
    profile.birthDate,
    profile.gender,
  ])}`;
}

export function mapFriendRegisterRepositoryError(
  code: FriendWriteRepositoryErrorCode,
  existingConnectionId?: string
): PublicApiErrorContract | null {
  if (code === "INVITE_NOT_FOUND" || code === "INVITE_INACTIVE") {
    return {
      status: 404,
      body: {
        success: false,
        error: "유효하지 않은 초대입니다.",
        code: "INVALID_INVITE",
      },
    };
  }

  if (code === "ALREADY_REGISTERED") {
    if (!existingConnectionId) return null;
    return {
      status: 409,
      body: {
        success: false,
        error: "이미 등록된 친구입니다.",
        code: "ALREADY_REGISTERED",
        connectionId: existingConnectionId,
      },
    };
  }

  if (code === "FRIEND_LIMIT_REACHED") {
    return {
      status: 429,
      body: {
        success: false,
        error: FRIEND_LIMIT_REACHED_MESSAGE,
        code: FRIEND_LIMIT_REACHED_CODE,
      },
    };
  }

  if (code === "INVALID_PROFILE") {
    return {
      status: 400,
      body: {
        success: false,
        error: "친구 정보가 올바르지 않습니다.",
      },
    };
  }

  return null;
}

export function toConnectUserSuccessResponse<TConnection>(
  result: Pick<
    LinkFriendConnectionUserResult,
    "alreadyLinked"
  > & { connection: TConnection }
) {
  return {
    success: true as const,
    alreadyConnected: result.alreadyLinked,
    connection: result.connection,
  };
}

export function mapConnectUserRepositoryError(
  code: FriendWriteRepositoryErrorCode
): PublicApiErrorContract | null {
  if (code === "CONNECTION_NOT_FOUND") {
    return {
      status: 404,
      body: {
        success: false,
        error: "친구 관계 정보를 찾을 수 없습니다.",
        code: "CONNECTION_NOT_FOUND",
      },
    };
  }

  if (code === "ALREADY_LINKED") {
    return {
      status: 409,
      body: {
        success: false,
        error: "이미 다른 회원과 연결된 친구 관계입니다.",
        code: "ALREADY_CONNECTED",
      },
    };
  }

  if (code === "SELF_CONNECTION") {
    return {
      status: 400,
      body: {
        success: false,
        error: "본인의 초대 관계에는 본인을 친구로 연결할 수 없습니다.",
      },
    };
  }

  if (code === "FRIEND_LIMIT_REACHED") {
    return {
      status: 429,
      body: {
        success: false,
        error: FRIEND_LIMIT_REACHED_MESSAGE,
        code: FRIEND_LIMIT_REACHED_CODE,
      },
    };
  }

  return null;
}

type FriendListMapperInput = Parameters<typeof mapFriendConnectionsForUser>[0];

export function toFriendListSuccessResponse(
  input: Omit<FriendListMapperInput, "users"> & {
    users: readonly { id: string; displayName: string }[];
  }
) {
  return {
    success: true as const,
    friends: mapFriendConnectionsForUser({
      ...input,
      users: input.users.map((user) => ({
        id: user.id,
        name: user.displayName,
      })),
    }),
  };
}

export function toFriendDeleteSuccessResponse() {
  return { success: true as const };
}

export function mapFriendDeleteRepositoryError(
  code: FriendWriteRepositoryErrorCode
): PublicApiErrorContract | null {
  if (code === "CONNECTION_NOT_FOUND") {
    return {
      status: 404,
      body: {
        success: false,
        error: "친구 관계를 찾을 수 없습니다.",
      },
    };
  }

  if (code === "FORBIDDEN") {
    return {
      status: 403,
      body: {
        success: false,
        error: "이 친구 관계를 삭제할 권한이 없습니다.",
      },
    };
  }

  return null;
}
