import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../../lib/auth/session";
import { getYearlyFortunePreviewForUser } from "../../../../../lib/stones/yearlyFortunePreviewService";
import { parseYearlyReadingContext } from "../../../../../lib/yearlyReadingContext";

function errorResponse(status: number, error: string, code?: string) {
  return NextResponse.json(
    { success: false as const, error, ...(code ? { code } : {}) },
    { status }
  );
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return errorResponse(401, "로그인이 필요합니다.");

  const currentYear = new Date().getFullYear();
  const context = parseYearlyReadingContext(
    new URL(request.url).searchParams,
    currentYear - 30,
    currentYear + 30
  );
  if (!context) {
    return errorResponse(400, "조회 조건이 올바르지 않아요.", "INVALID_CONTENT");
  }

  try {
    const result = await getYearlyFortunePreviewForUser(
      sessionUser.id,
      context.year
    );
    if (!result.profileReady) {
      return NextResponse.json({ success: true, profileReady: false });
    }

    return NextResponse.json({
      success: true,
      profileReady: true,
      preview: result.preview,
    });
  } catch (error) {
    console.error("신년운세 미리보기 조회 실패:", error);
    return errorResponse(500, "신년운세 미리보기를 불러오지 못했어요.");
  }
}
