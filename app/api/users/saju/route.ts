import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { createSession, getSessionUser } from "../../../../lib/auth/session";
import { getProductionDataSource } from "../../../../lib/dataSource/config";
import { saveUserSajuProfileToPostgres } from "../../../../lib/dataSource/postgresUserService";
import { isNicknameWithinLimit } from "../../../../lib/nickname";

type SajuProfile = {
  name: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown?: boolean;
  calendarType: "solar" | "lunar";
  gender: "male" | "female";
};

type StoredUser = {
  id: string;
  [key: string]: unknown;
  sajuProfile?: SajuProfile;
};

const usersPath = path.join(process.cwd(), "data", "users.json");

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const profile: SajuProfile = {
      name: String(body?.name ?? "").trim(),
      birthDate: String(body?.birthDate ?? ""),
      birthHour: body?.birthTimeUnknown ? 12 : Number(body?.birthHour),
      birthMinute: body?.birthTimeUnknown ? 0 : Number(body?.birthMinute),
      birthTimeUnknown: Boolean(body?.birthTimeUnknown),
      calendarType: body?.calendarType,
      gender: body?.gender,
    };

    if (
      !profile.name ||
      !isNicknameWithinLimit(profile.name) ||
      !isValidDate(profile.birthDate) ||
      !Number.isInteger(profile.birthHour) ||
      profile.birthHour < 0 ||
      profile.birthHour > 23 ||
      !Number.isInteger(profile.birthMinute) ||
      profile.birthMinute < 0 ||
      profile.birthMinute > 59 ||
      !["solar", "lunar"].includes(profile.calendarType) ||
      !["male", "female"].includes(profile.gender)
    ) {
      return NextResponse.json(
        { success: false, error: "사주 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (getProductionDataSource() === "postgres") {
      const result = await saveUserSajuProfileToPostgres({
        userId: sessionUser.id,
        name: profile.name,
        birthDate: profile.birthDate,
        birthHour: profile.birthHour,
        birthMinute: profile.birthMinute,
        birthTimeUnknown: Boolean(profile.birthTimeUnknown),
        calendarType: profile.calendarType,
        gender: profile.gender,
      });

      if (!result.ok) {
        return NextResponse.json(result.error.body, {
          status: result.error.status,
        });
      }

      await createSession({
        id: sessionUser.id,
        name: result.sessionName,
        provider: sessionUser.provider,
      });
      return NextResponse.json(result.response);
    }

    const parsed = JSON.parse(await fs.readFile(usersPath, "utf8"));
    const users: StoredUser[] = Array.isArray(parsed) ? parsed : [];
    const user = users.find((item) => item.id === sessionUser.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    user.name = profile.name;
    user.sajuProfile = profile;
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");

    await createSession({
      id: sessionUser.id,
      name: profile.name,
      provider: sessionUser.provider,
    });

    return NextResponse.json({ success: true, sajuProfile: profile });
  } catch (error) {
    console.error("사주 정보 저장 실패:", error);
    return NextResponse.json(
      { success: false, error: "사주 정보를 저장하지 못했습니다." },
      { status: 500 }
    );
  }
}
