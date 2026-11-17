import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth/session";
import { findFriendConnectionWithProfileById } from "../../../../lib/db/repositories/friendRepository";
import { findStoneContentStateForUser } from "../../../../lib/db/repositories/stoneReadRepository";
import {
  resolveStoneContentPolicy,
  type StoneUnlockContent,
} from "../../../../lib/stones/stoneContentPolicy";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasExactlyQueryKeys(
  searchParams: URLSearchParams,
  expectedKeys: readonly string[]
) {
  const actualKeys = [...searchParams.keys()].sort();
  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key, index) => key === actualKeys[index])
  );
}

function parseContent(searchParams: URLSearchParams): StoneUnlockContent | null {
  const kind = searchParams.get("kind");
  if (kind === "yearlyFortune") {
    const year = searchParams.get("year");
    if (!hasExactlyQueryKeys(searchParams, ["kind", "year"]) || !year) {
      return null;
    }
    const numericYear = Number(year);
    return /^\d{4}$/.test(year) && Number.isInteger(numericYear)
      ? { kind, year: numericYear }
      : null;
  }

  if (kind === "friendCompatibility") {
    const connectionId = searchParams.get("connectionId");
    if (
      !hasExactlyQueryKeys(searchParams, ["connectionId", "kind"]) ||
      !connectionId ||
      !UUID_PATTERN.test(connectionId)
    ) {
      return null;
    }
    return { kind, connectionId };
  }

  return null;
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

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return errorResponse(401, "로그인이 필요합니다.");
  }

  const content = parseContent(new URL(request.url).searchParams);
  const policy = content ? resolveStoneContentPolicy(content) : null;
  if (!content || !policy) {
    return errorResponse(400, "콘텐츠 정보가 올바르지 않아요.", "INVALID_CONTENT");
  }

  try {
    if (content.kind === "friendCompatibility") {
      const connection = await findFriendConnectionWithProfileById(
        content.connectionId
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

    const state = await findStoneContentStateForUser(sessionUser.id, {
      contentType: policy.contentType,
      contentKey: policy.contentKey,
    });
    if (!state) {
      return errorResponse(401, "로그인이 필요합니다.");
    }

    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    console.error("운석 콘텐츠 상태 조회 실패:", error);
    return errorResponse(500, "콘텐츠 상태를 불러오지 못했어요.");
  }
}
