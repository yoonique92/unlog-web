import "server-only";

import type { SessionUser } from "../auth/session";
import { findOrCreateSocialUser } from "../db/repositories/socialUserWriteRepository";
import {
  UserWriteRepositoryError,
  type UpsertUserSajuProfileInput,
  upsertUserSajuProfile,
} from "../db/repositories/userWriteRepository";
import {
  findUserWithAuthAndSajuById,
  type AuthProvider,
} from "../db/repositories/userRepository";
import {
  mapUserSajuRepositoryError,
  toAuthMeSuccessResponse,
  toSessionUserFromSocialUser,
  toUserSajuSuccessContract,
  type PublicApiErrorContract,
} from "./apiContractAdapters";
import { throwPostgresServiceInternalError } from "./postgresServiceError";

export type AuthMePostgresResult =
  | {
      found: true;
      response: ReturnType<typeof toAuthMeSuccessResponse>;
    }
  | {
      found: false;
      reason: "USER_NOT_FOUND";
    };

export type SaveUserSajuPostgresResult =
  | {
      ok: true;
      sessionName: string;
      response: ReturnType<typeof toUserSajuSuccessContract>["body"];
    }
  | {
      ok: false;
      error: PublicApiErrorContract;
    };

export async function findOrCreateOAuthUserForSession(
  provider: AuthProvider,
  providerUserId: string
): Promise<SessionUser> {
  try {
    const user = await findOrCreateSocialUser({ provider, providerUserId });
    return toSessionUserFromSocialUser(user);
  } catch (error) {
    return throwPostgresServiceInternalError("oauth-user", error);
  }
}

export async function getAuthMeUserFromPostgres(
  sessionUserId: string,
  sessionProvider?: AuthProvider
): Promise<AuthMePostgresResult> {
  try {
    const user = await findUserWithAuthAndSajuById(sessionUserId);
    if (!user) return { found: false, reason: "USER_NOT_FOUND" };

    const identity = sessionProvider
      ? user.authIdentities.find(({ provider }) => provider === sessionProvider)
      : user.authIdentities.length === 1
        ? user.authIdentities[0]
        : null;

    if (!identity) {
      return throwPostgresServiceInternalError(
        "auth-me",
        new Error("The session provider does not resolve to one auth identity."),
        "Auth identity is missing or ambiguous for the session user."
      );
    }

    return {
      found: true,
      response: toAuthMeSuccessResponse(user, identity.provider),
    };
  } catch (error) {
    return throwPostgresServiceInternalError("auth-me", error);
  }
}

export async function saveUserSajuProfileToPostgres(
  input: UpsertUserSajuProfileInput
): Promise<SaveUserSajuPostgresResult> {
  try {
    const saved = await upsertUserSajuProfile(input);
    const contract = toUserSajuSuccessContract(saved);
    return {
      ok: true,
      sessionName: contract.sessionName,
      response: contract.body,
    };
  } catch (error) {
    if (error instanceof UserWriteRepositoryError) {
      const publicError = mapUserSajuRepositoryError(error.code);
      if (publicError) return { ok: false, error: publicError };
    }
    return throwPostgresServiceInternalError("save-saju", error);
  }
}
