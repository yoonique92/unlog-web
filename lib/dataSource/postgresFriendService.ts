import "server-only";

import { getDayPillarCharacterName } from "../dayPillarCharacter";
import {
  findFriendConnectionByOwnerAndDedupeKey,
  findFriendConnectionsByUserId,
  findFriendConnectionWithProfileById,
  findInviteByCode,
  type FriendConnectionRecord,
} from "../db/repositories/friendRepository";
import { getOrCreateActiveInvite } from "../db/repositories/friendInviteWriteRepository";
import {
  createFriendConnection,
  deleteFriendConnection,
  FriendWriteRepositoryError,
  linkFriendConnectionUser,
  type FriendSnapshotInput,
} from "../db/repositories/friendWriteRepository";
import { findUsersByIds } from "../db/repositories/userRepository";
import type { FriendProfileSource } from "../friends/mapFriendConnections";
import { getSaju } from "../saju";
import {
  createFriendProfileDedupeKeyV1,
  mapConnectUserRepositoryError,
  mapFriendDeleteRepositoryError,
  mapFriendRegisterRepositoryError,
  toConnectUserSuccessResponse,
  toFriendDeleteSuccessResponse,
  toFriendInviteSuccessResponse,
  toFriendListSuccessResponse,
  toFriendRegisterSuccessResponse,
  toLegacyFriendConnection,
  type PublicApiErrorContract,
} from "./apiContractAdapters";
import { throwPostgresServiceInternalError } from "./postgresServiceError";

type PublicFailure = {
  ok: false;
  error: PublicApiErrorContract;
};

export type RegisterFriendFromPostgresInput = {
  code: string;
  friend: FriendSnapshotInput;
};

export type RegisterFriendFromPostgresResult =
  | {
      ok: true;
      response: ReturnType<typeof toFriendRegisterSuccessResponse>;
      connection: ReturnType<typeof toLegacyFriendConnection>;
    }
  | PublicFailure;

export type ConnectFriendUserFromPostgresResult =
  | {
      ok: true;
      response: {
        success: true;
        alreadyConnected: boolean;
        connection: ReturnType<typeof toLegacyFriendConnection>;
      };
    }
  | PublicFailure;

export type DeleteFriendFromPostgresResult =
  | {
      ok: true;
      response: ReturnType<typeof toFriendDeleteSuccessResponse>;
    }
  | PublicFailure;

function resolveFriendProfile(profile: FriendProfileSource) {
  try {
    if (!profile.birthDate || !["male", "female"].includes(profile.gender)) {
      return profile;
    }

    const saju = getSaju(
      profile.birthDate,
      profile.birthHour || "12",
      profile.birthMinute || "0",
      (profile.calendarType ?? "solar") as "solar" | "lunar",
      profile.gender as "male" | "female",
      Boolean(profile.birthTimeUnknown)
    );
    const dayPillar = `${saju.dayStem}${saju.dayBranch}`;

    return {
      ...profile,
      dayPillar,
      characterName:
        getDayPillarCharacterName(dayPillar) ?? profile.characterName,
      pillars: saju.pillars,
    };
  } catch {
    return profile;
  }
}

function requireConnectionSnapshot(
  operation: "friend-register" | "friend-connect",
  connection: FriendConnectionRecord | null,
  connectionId: string
) {
  if (connection) return connection;
  return throwPostgresServiceInternalError(
    operation,
    new Error(`Connection ${connectionId} was not found after mutation.`),
    "Friend mutation succeeded but its connection snapshot could not be read."
  );
}

export async function getOrCreateInviteFromPostgres(ownerUserId: string) {
  try {
    const invite = await getOrCreateActiveInvite(ownerUserId);
    return toFriendInviteSuccessResponse(invite);
  } catch (error) {
    return throwPostgresServiceInternalError("friend-invite", error);
  }
}

export async function registerFriendFromPostgres(
  input: RegisterFriendFromPostgresInput
): Promise<RegisterFriendFromPostgresResult> {
  let ownerUserId: string | undefined;
  let profileDedupeKey: string | undefined;

  try {
    const invite = await findInviteByCode(input.code);
    if (!invite || !invite.isActive) {
      const code = invite ? "INVITE_INACTIVE" : "INVITE_NOT_FOUND";
      const publicError = mapFriendRegisterRepositoryError(code);
      if (!publicError) {
        return throwPostgresServiceInternalError(
          "friend-register",
          new Error(code)
        );
      }
      return { ok: false, error: publicError };
    }

    ownerUserId = invite.ownerUserId;
    profileDedupeKey = createFriendProfileDedupeKeyV1(input.friend);

    const created = await createFriendConnection({
      ownerUserId,
      inviteCode: input.code,
      friendProfile: input.friend,
    });
    const connection = requireConnectionSnapshot(
      "friend-register",
      await findFriendConnectionWithProfileById(created.id),
      created.id
    );

    return {
      ok: true,
      response: toFriendRegisterSuccessResponse(connection),
      connection: toLegacyFriendConnection(connection),
    };
  } catch (error) {
    if (error instanceof FriendWriteRepositoryError) {
      if (error.code === "ALREADY_REGISTERED" && ownerUserId && profileDedupeKey) {
        let existing: FriendConnectionRecord | null;
        try {
          existing = await findFriendConnectionByOwnerAndDedupeKey(
            ownerUserId,
            profileDedupeKey
          );
        } catch (lookupError) {
          return throwPostgresServiceInternalError(
            "friend-register",
            lookupError,
            "The duplicate connection lookup failed."
          );
        }
        if (!existing) {
          return throwPostgresServiceInternalError(
            "friend-register",
            error,
            "Duplicate registration was reported without an existing connection."
          );
        }
        const publicError = mapFriendRegisterRepositoryError(
          error.code,
          existing.id
        );
        if (publicError) return { ok: false, error: publicError };
      } else {
        const publicError = mapFriendRegisterRepositoryError(error.code);
        if (publicError) return { ok: false, error: publicError };
      }
    }
    return throwPostgresServiceInternalError("friend-register", error);
  }
}

export async function connectFriendUserFromPostgres(
  connectionId: string,
  userId: string
): Promise<ConnectFriendUserFromPostgresResult> {
  try {
    const linked = await linkFriendConnectionUser({
      connectionId,
      friendUserId: userId,
    });
    const connection = requireConnectionSnapshot(
      "friend-connect",
      await findFriendConnectionWithProfileById(linked.connection.id),
      linked.connection.id
    );

    return {
      ok: true,
      response: toConnectUserSuccessResponse({
        alreadyLinked: linked.alreadyLinked,
        connection: toLegacyFriendConnection(connection),
      }),
    };
  } catch (error) {
    if (error instanceof FriendWriteRepositoryError) {
      const publicError = mapConnectUserRepositoryError(error.code);
      if (publicError) return { ok: false, error: publicError };
    }
    return throwPostgresServiceInternalError("friend-connect", error);
  }
}

export async function getFriendsFromPostgres(userId: string) {
  try {
    const connections = await findFriendConnectionsByUserId(userId);
    const reverseOwnerIds = [
      ...new Set(
        connections
          .filter((connection) => connection.friendUserId === userId)
          .map((connection) => connection.ownerUserId)
      ),
    ];
    const users = await findUsersByIds(reverseOwnerIds);

    return toFriendListSuccessResponse({
      userId,
      connections,
      users,
      resolveFriendProfile,
    });
  } catch (error) {
    return throwPostgresServiceInternalError("friend-list", error);
  }
}

export async function deleteFriendFromPostgres(
  connectionId: string,
  requesterUserId: string
): Promise<DeleteFriendFromPostgresResult> {
  try {
    await deleteFriendConnection({ connectionId, requesterUserId });
    return { ok: true, response: toFriendDeleteSuccessResponse() };
  } catch (error) {
    if (error instanceof FriendWriteRepositoryError) {
      const publicError = mapFriendDeleteRepositoryError(error.code);
      if (publicError) return { ok: false, error: publicError };
    }
    return throwPostgresServiceInternalError("friend-delete", error);
  }
}
