import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../lib/auth/session";
import { findStoneWalletBalanceForUser } from "../../../../lib/db/repositories/stoneReadRepository";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ success: false as const, error }, { status });
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return errorResponse(401, "로그인이 필요합니다.");
  }

  try {
    const walletBalance = await findStoneWalletBalanceForUser(sessionUser.id);
    if (walletBalance === null) {
      return errorResponse(401, "로그인이 필요합니다.");
    }

    return NextResponse.json({ success: true, walletBalance });
  } catch (error) {
    console.error("운석 잔액 조회 실패:", error);
    return errorResponse(500, "운석 잔액을 불러오지 못했어요.");
  }
}
