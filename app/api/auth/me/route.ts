import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSessionUser } from "../../../../lib/auth/session";
import { getProductionDataSource } from "../../../../lib/dataSource/config";
import { getAuthMeUserFromPostgres } from "../../../../lib/dataSource/postgresUserService";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  if (getProductionDataSource() === "postgres") {
    const result = await getAuthMeUserFromPostgres(user.id, user.provider);
    if (!result.found) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    return NextResponse.json(result.response);
  }

  let sajuProfile = null;
  let storedName = user.name;

  try {
    const usersPath = path.join(process.cwd(), "data", "users.json");
    const parsed = JSON.parse(await fs.readFile(usersPath, "utf8"));
    const storedUser = Array.isArray(parsed)
      ? parsed.find((item) => item?.id === user.id)
      : null;
    storedName = storedUser?.name ?? user.name;
    sajuProfile = storedUser?.sajuProfile ?? null;
  } catch (error) {
    console.error("회원 사주 정보 조회 실패:", error);
  }

  return NextResponse.json({
    success: true,
    user: { ...user, name: storedName, sajuProfile },
  });
}
