import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "이메일 회원가입은 현재 제공하지 않습니다.",
      code: "EMAIL_SIGNUP_DISABLED",
    },
    { status: 410 }
  );
}
