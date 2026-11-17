import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findOrCreateSocialUser: vi.fn(),
  findUserWithAuthAndSajuById: vi.fn(),
  upsertUserSajuProfile: vi.fn(),
}));

vi.mock("../db/repositories/socialUserWriteRepository", () => ({
  findOrCreateSocialUser: mocks.findOrCreateSocialUser,
}));

vi.mock("../db/repositories/userRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  findUserWithAuthAndSajuById: mocks.findUserWithAuthAndSajuById,
}));

vi.mock("../db/repositories/userWriteRepository", async (importOriginal) => ({
  ...(await importOriginal()),
  upsertUserSajuProfile: mocks.upsertUserSajuProfile,
}));

import { UserWriteRepositoryError } from "../db/repositories/userWriteRepository";
import {
  findOrCreateOAuthUserForSession,
  getAuthMeUserFromPostgres,
  saveUserSajuProfileToPostgres,
} from "./postgresUserService";

const userId = "00000000-0000-4000-8000-000000000001";
const createdAt = "2026-09-28T12:00:00.000Z";

describe("postgresUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([true, false])(
    "maps a created=%s OAuth result to the same session contract",
    async (created) => {
      mocks.findOrCreateSocialUser.mockResolvedValue({
        id: userId,
        displayName: "",
        provider: "kakao",
        providerUserId: "provider-user",
        createdAt,
        created,
      });

      await expect(
        findOrCreateOAuthUserForSession("kakao", "provider-user")
      ).resolves.toEqual({ id: userId, name: "", provider: "kakao" });
      expect(mocks.findOrCreateSocialUser).toHaveBeenCalledWith({
        provider: "kakao",
        providerUserId: "provider-user",
      });
    }
  );

  it("returns the existing auth/me contract for the session provider", async () => {
    mocks.findUserWithAuthAndSajuById.mockResolvedValue({
      id: userId,
      name: "운로그",
      createdAt,
      updatedAt: null,
      authIdentities: [
        {
          id: "identity-1",
          userId,
          provider: "naver",
          providerUserId: "provider-user",
          createdAt,
        },
      ],
      sajuProfile: null,
    });

    await expect(
      getAuthMeUserFromPostgres(userId, "naver")
    ).resolves.toEqual({
      found: true,
      response: {
        success: true,
        user: {
          id: userId,
          name: "운로그",
          provider: "naver",
          sajuProfile: null,
        },
      },
    });
  });

  it("returns an explicit not-found result without creating a user", async () => {
    mocks.findUserWithAuthAndSajuById.mockResolvedValue(null);

    await expect(getAuthMeUserFromPostgres(userId, "google")).resolves.toEqual({
      found: false,
      reason: "USER_NOT_FOUND",
    });
    expect(mocks.findOrCreateSocialUser).not.toHaveBeenCalled();
  });

  it("passes already validated saju values through and returns response/session contracts", async () => {
    const input = {
      userId,
      name: "사용자",
      birthDate: "1994-03-15",
      birthHour: 12,
      birthMinute: 0,
      birthTimeUnknown: true,
      calendarType: "solar" as const,
      gender: "male" as const,
    };
    mocks.upsertUserSajuProfile.mockResolvedValue({
      id: userId,
      displayName: input.name,
      sajuProfile: {
        ...input,
        name: input.name,
        updatedAt: createdAt,
      },
    });

    await expect(saveUserSajuProfileToPostgres(input)).resolves.toEqual({
      ok: true,
      sessionName: "사용자",
      response: {
        success: true,
        sajuProfile: {
          name: "사용자",
          birthDate: "1994-03-15",
          birthHour: 12,
          birthMinute: 0,
          birthTimeUnknown: true,
          calendarType: "solar",
          gender: "male",
        },
      },
    });
    expect(mocks.upsertUserSajuProfile).toHaveBeenCalledWith(input);
  });

  it("preserves the existing users/saju not-found contract", async () => {
    mocks.upsertUserSajuProfile.mockRejectedValue(
      new UserWriteRepositoryError("USER_NOT_FOUND")
    );

    const result = await saveUserSajuProfileToPostgres({
      userId,
      name: "사용자",
      birthDate: "1994-03-15",
      birthHour: 14,
      birthMinute: 30,
      birthTimeUnknown: false,
      calendarType: "solar",
      gender: "male",
    });

    expect(result).toMatchObject({
      ok: false,
      error: { status: 404, body: { success: false } },
    });
  });

  it("keeps unmapped repository failures internal", async () => {
    mocks.upsertUserSajuProfile.mockRejectedValue(
      new UserWriteRepositoryError("SAJU_PROFILE_CONSTRAINT_VIOLATION")
    );

    await expect(
      saveUserSajuProfileToPostgres({
        userId,
        name: "사용자",
        birthDate: "1994-03-15",
        birthHour: 14,
        birthMinute: 30,
        birthTimeUnknown: false,
        calendarType: "solar",
        gender: "male",
      })
    ).rejects.toMatchObject({
      name: "PostgresServiceInternalError",
      code: "POSTGRES_SERVICE_INTERNAL_ERROR",
      operation: "save-saju",
    });
  });
});
