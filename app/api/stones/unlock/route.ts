import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth/session";
import { findFriendConnectionWithProfileById } from "../../../../lib/db/repositories/friendRepository";
import {
  StoneServiceError,
  type StoneUnlockContent,
  unlockStoneContent,
} from "../../../../lib/stones/stoneService";
import { getYearlyFortuneForUser } from "../../../../lib/stones/yearlyFortuneReadService";

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UnlockRequest = {
  requestId: string;
  content: StoneUnlockContent;
};

type UnlockRequestParseResult =
  | { ok: true; value: UnlockRequest }
  | {
      ok: false;
      code: "INVALID_REQUEST" | "INVALID_CONTENT" | "INVALID_IDEMPOTENCY";
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactlyKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[]
) {
  const actualKeys = Object.keys(value).sort();
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key, index) => key === actualKeys[index])
  );
}

function parseContent(value: unknown): StoneUnlockContent | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;

  if (value.kind === "yearlyFortune") {
    if (
      !hasExactlyKeys(value, ["kind", "year"]) ||
      !Number.isInteger(value.year) ||
      Number(value.year) < 1000 ||
      Number(value.year) > 9999
    ) {
      return null;
    }
    return { kind: value.kind, year: Number(value.year) };
  }

  if (value.kind === "friendCompatibility") {
    if (
      !hasExactlyKeys(value, ["connectionId", "kind"]) ||
      typeof value.connectionId !== "string" ||
      !UUID_PATTERN.test(value.connectionId)
    ) {
      return null;
    }
    return { kind: value.kind, connectionId: value.connectionId };
  }

  return null;
}

function parseUnlockRequest(value: unknown): UnlockRequestParseResult {
  if (!isRecord(value) || !hasExactlyKeys(value, ["content", "requestId"])) {
    return { ok: false, code: "INVALID_REQUEST" };
  }
  if (
    typeof value.requestId !== "string" ||
    !REQUEST_ID_PATTERN.test(value.requestId)
  ) {
    return { ok: false, code: "INVALID_IDEMPOTENCY" };
  }

  const content = parseContent(value.content);
  if (!content) return { ok: false, code: "INVALID_CONTENT" };
  return {
    ok: true,
    value: { requestId: value.requestId, content },
  };
}

function errorResponse(
  status: number,
  error: string,
  code?: string
) {
  return NextResponse.json(
    { success: false as const, error, ...(code ? { code } : {}) },
    { status }
  );
}

function mapStoneServiceError(error: StoneServiceError) {
  if (error.code === "INSUFFICIENT_STONES") {
    return errorResponse(409, "운석이 부족해요.", error.code);
  }
  if (error.code === "STONE_IDEMPOTENCY_CONFLICT") {
    return errorResponse(
      409,
      "동일한 요청 ID가 다른 요청에 사용됐어요.",
      error.code
    );
  }
  if (error.code === "INVALID_CONTENT" || error.code === "INVALID_IDEMPOTENCY") {
    return errorResponse(400, "요청 정보가 올바르지 않아요.", error.code);
  }
  if (error.code === "USER_NOT_FOUND") {
    return errorResponse(401, "로그인이 필요합니다.");
  }
  return null;
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return errorResponse(401, "로그인이 필요합니다.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "요청 형식이 올바르지 않아요.", "INVALID_REQUEST");
  }

  const parsed = parseUnlockRequest(body);
  if (!parsed.ok) {
    return errorResponse(400, "요청 형식이 올바르지 않아요.", parsed.code);
  }
  const input = parsed.value;

  try {
    if (input.content.kind === "yearlyFortune") {
      const yearlyState = await getYearlyFortuneForUser(
        sessionUser.id,
        input.content.year
      );
      if (!yearlyState.found) {
        return errorResponse(401, "로그인이 필요합니다.");
      }
      if (!yearlyState.profileReady) {
        return errorResponse(
          409,
          "신년운세를 보려면 먼저 사주 정보를 입력해 주세요.",
          "SAJU_PROFILE_REQUIRED"
        );
      }
    }

    if (input.content.kind === "friendCompatibility") {
      const connection = await findFriendConnectionWithProfileById(
        input.content.connectionId
      );
      if (!connection) {
        return errorResponse(
          404,
          "친구 관계를 찾을 수 없어요.",
          "CONNECTION_NOT_FOUND"
        );
      }
      if (
        connection.ownerUserId !== sessionUser.id &&
        connection.friendUserId !== sessionUser.id
      ) {
        return errorResponse(
          403,
          "이 친구 관계에 접근할 권한이 없어요.",
          "FORBIDDEN"
        );
      }
    }

    const result = await unlockStoneContent({
      userId: sessionUser.id,
      content: input.content,
      requestId: input.requestId,
    });

    return NextResponse.json({
      success: true,
      isNew: result.created,
      walletBalance: result.walletBalance,
      unlockId: result.unlockId,
    });
  } catch (error) {
    if (error instanceof StoneServiceError) {
      const response = mapStoneServiceError(error);
      if (response) return response;
    }

    console.error("운석 콘텐츠 해금 실패:", error);
    return errorResponse(500, "콘텐츠를 해금하지 못했어요.");
  }
}
