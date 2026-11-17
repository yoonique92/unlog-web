import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth/session";
import { getYearlyFortuneForUser } from "../../../../lib/stones/yearlyFortuneReadService";

function errorResponse(status: number, error: string, code?: string) {
  return NextResponse.json(
    { success: false as const, error, ...(code ? { code } : {}) },
    { status }
  );
}

function parseYear(searchParams: URLSearchParams) {
  const keys = [...searchParams.keys()];
  const year = searchParams.get("year");
  if (keys.length !== 1 || keys[0] !== "year" || !year || !/^\d{4}$/.test(year)) {
    return null;
  }

  const numericYear = Number(year);
  return numericYear >= 1000 && numericYear <= 9999 ? numericYear : null;
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return errorResponse(401, "로그인이 필요합니다.");
  }

  const year = parseYear(new URL(request.url).searchParams);
  if (year === null) {
    return errorResponse(400, "조회 연도가 올바르지 않아요.", "INVALID_CONTENT");
  }

  try {
    const result = await getYearlyFortuneForUser(sessionUser.id, year);
    if (!result.found) {
      return errorResponse(401, "로그인이 필요합니다.");
    }
    if (!result.profileReady) {
      return NextResponse.json({ success: true, profileReady: false });
    }

    return NextResponse.json({
      success: true,
      profileReady: true,
      walletBalance: result.walletBalance,
      unlocked: result.unlocked,
      unlockId: result.unlockId,
      interpretation: result.interpretation,
    });
  } catch (error) {
    console.error("신년운세 조회 실패:", error);
    return errorResponse(500, "신년운세를 불러오지 못했어요.");
  }
}
