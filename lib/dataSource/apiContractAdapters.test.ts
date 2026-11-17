import { describe, expect, it, vi } from "vitest";
import {
  createFriendProfileDedupeKeyV1,
  mapConnectUserRepositoryError,
  mapFriendDeleteRepositoryError,
  mapFriendRegisterRepositoryError,
  toAuthMeSuccessResponse,
  toConnectUserSuccessResponse,
  toFriendInviteSuccessResponse,
  toFriendListSuccessResponse,
  toSessionUserFromSocialUser,
  toUserSajuSuccessContract,
} from "./apiContractAdapters";

const userId = "00000000-0000-4000-8000-000000000001";
const connectionId = "00000000-0000-4000-8000-000000000002";

describe("API contract adapters", () => {
  it("maps a social DB user to the existing session shape", () => {
    expect(
      toSessionUserFromSocialUser({
        id: userId,
        displayName: "",
        provider: "kakao",
      })
    ).toEqual({ id: userId, name: "", provider: "kakao" });
  });

  it("maps auth/me without exposing DB-only fields", () => {
    expect(
      toAuthMeSuccessResponse(
        {
          id: userId,
          name: "운로그",
          sajuProfile: {
            userId,
            name: null,
            birthDate: "1994-03-15",
            birthHour: 14,
            birthMinute: 30,
            birthTimeUnknown: false,
            calendarType: "solar",
            gender: "male",
            updatedAt: "2026-09-28T12:00:00.000Z",
          },
        },
        "naver"
      )
    ).toEqual({
      success: true,
      user: {
        id: userId,
        name: "운로그",
        provider: "naver",
        sajuProfile: {
          birthDate: "1994-03-15",
          birthHour: 14,
          birthMinute: 30,
          birthTimeUnknown: false,
          calendarType: "solar",
          gender: "male",
        },
      },
    });
  });

  it("maps a saved profile to the existing response and session name", () => {
    expect(
      toUserSajuSuccessContract({
        id: userId,
        displayName: "새 이름",
        sajuProfile: {
          userId,
          name: "새 이름",
          birthDate: "1994-03-15",
          birthHour: 12,
          birthMinute: 0,
          birthTimeUnknown: true,
          calendarType: "solar",
          gender: "male",
          updatedAt: "2026-09-28T12:00:00.000Z",
        },
      })
    ).toEqual({
      sessionName: "새 이름",
      body: {
        success: true,
        sajuProfile: {
          name: "새 이름",
          birthDate: "1994-03-15",
          birthHour: 12,
          birthMinute: 0,
          birthTimeUnknown: true,
          calendarType: "solar",
          gender: "male",
        },
      },
    });
  });

  it("renames invite created to the legacy isNew field", () => {
    expect(
      toFriendInviteSuccessResponse({
        code: "a1b2c3d4",
        ownerUserId: userId,
        createdAt: "2026-09-28T12:00:00.000Z",
        isActive: true,
        created: true,
      })
    ).toEqual({ success: true, code: "a1b2c3d4", isNew: true });
  });

  it.each(["INVITE_NOT_FOUND", "INVITE_INACTIVE"] as const)(
    "maps %s to the existing INVALID_INVITE contract",
    (code) => {
      expect(mapFriendRegisterRepositoryError(code)).toMatchObject({
        status: 404,
        body: { success: false, code: "INVALID_INVITE" },
      });
    }
  );

  it("requires and preserves the existing connectionId for duplicate registration", () => {
    expect(
      mapFriendRegisterRepositoryError("ALREADY_REGISTERED", connectionId)
    ).toEqual({
      status: 409,
      body: {
        success: false,
        error: "이미 등록된 친구입니다.",
        code: "ALREADY_REGISTERED",
        connectionId,
      },
    });
    expect(mapFriendRegisterRepositoryError("ALREADY_REGISTERED")).toBeNull();
  });

  it("builds the exact v1 dedupe key needed for the duplicate lookup", () => {
    expect(
      createFriendProfileDedupeKeyV1({
        name: " 친구 ",
        birthDate: "1994-03-15",
        gender: "male",
      })
    ).toBe('v1:[" 친구 ","1994-03-15","male"]');
  });

  it("maps link success and ALREADY_LINKED to existing connect-user names", () => {
    const connection = { id: connectionId };
    expect(
      toConnectUserSuccessResponse({ connection, alreadyLinked: true })
    ).toEqual({
      success: true,
      alreadyConnected: true,
      connection,
    });
    expect(mapConnectUserRepositoryError("ALREADY_LINKED")).toMatchObject({
      status: 409,
      body: { success: false, code: "ALREADY_CONNECTED" },
    });
  });

  it("preserves delete statuses without inventing public response codes", () => {
    expect(mapFriendDeleteRepositoryError("CONNECTION_NOT_FOUND")).toEqual({
      status: 404,
      body: {
        success: false,
        error: "친구 관계를 찾을 수 없습니다.",
      },
    });
    expect(mapFriendDeleteRepositoryError("FORBIDDEN")).toEqual({
      status: 403,
      body: {
        success: false,
        error: "이 친구 관계를 삭제할 권한이 없습니다.",
      },
    });
  });

  it("reuses the existing friend-list mapper", () => {
    const resolveFriendProfile = vi.fn((profile) => profile);
    const response = toFriendListSuccessResponse({
      userId,
      users: [],
      resolveFriendProfile,
      connections: [
        {
          id: connectionId,
          ownerUserId: userId,
          friendUserId: null,
          inviteCode: "a1b2c3d4",
          createdAt: "2026-09-28T12:00:00.000Z",
          friendProfile: {
            name: "친구",
            birthDate: "1994-03-15",
            birthHour: "14",
            birthMinute: "30",
            gender: "male",
            dayPillar: "庚子",
            characterName: "캐릭터",
            image: "/friend.png",
          },
        },
      ],
    });

    expect(resolveFriendProfile).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      success: true,
      friends: [{ connectionId, name: "친구" }],
    });
  });

  it("does not map DB-only errors to invented public contracts", () => {
    expect(mapFriendRegisterRepositoryError("INVALID_INVITE_OWNER")).toBeNull();
    expect(mapConnectUserRepositoryError("USER_NOT_FOUND")).toBeNull();
    expect(mapFriendDeleteRepositoryError("INVALID_PROFILE")).toBeNull();
  });
});
