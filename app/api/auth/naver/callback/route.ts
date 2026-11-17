import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "../../../../../lib/auth/session";
import { getProductionDataSource } from "../../../../../lib/dataSource/config";
import { findOrCreateOAuthUserForSession } from "../../../../../lib/dataSource/postgresUserService";

export const runtime = "nodejs";

type StoredUser = {
  id: string;
  name: string;
  email?: string;
  password?: string;
  provider?: "email" | "kakao" | "naver" | "google";
  providerUserId?: string;
  createdAt: string;
};

type NaverTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type NaverProfileResponse = {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
  };
};

const usersPath = path.join(process.cwd(), "data", "users.json");

async function readUsers(): Promise<StoredUser[]> {
  await fs.mkdir(path.dirname(usersPath), { recursive: true });

  try {
    const parsed = JSON.parse(await fs.readFile(usersPath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function findOrCreateNaverUser(profile: NaverProfileResponse) {
  const providerUserId = profile.response?.id;
  if (!providerUserId) throw new Error("네이버 이용자 식별자가 없습니다.");

  const users = await readUsers();
  const existing = users.find(
    (user) =>
      user.provider === "naver" && user.providerUserId === providerUserId
  );

  if (existing) return existing;

  const user: StoredUser = {
    id: randomUUID(),
    name: "",
    provider: "naver",
    providerUserId,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");
  return user;
}

function loginError(request: NextRequest, code: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("naverError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get("naver-oauth-state")?.value;

  if (error) return loginError(request, error);
  if (!code || !state || !savedState || state !== savedState) {
    return loginError(request, "invalid_state");
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const redirectUri = process.env.NAVER_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return loginError(request, "missing_configuration");
  }

  try {
    const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("state", state);

    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    const token = (await tokenResponse.json()) as NaverTokenResponse;

    if (!tokenResponse.ok || !token.access_token) {
      console.error("네이버 토큰 발급 실패:", token.error, token.error_description);
      return loginError(request, "token_failed");
    }

    const profileResponse = await fetch(
      "https://openapi.naver.com/v1/nid/me",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      }
    );
    const profile = (await profileResponse.json()) as NaverProfileResponse;

    if (!profileResponse.ok || profile.resultcode !== "00" || !profile.response?.id) {
      console.error("네이버 프로필 조회 실패:", profile.resultcode, profile.message);
      return loginError(request, "profile_failed");
    }

    const providerUserId = profile.response.id;
    const sessionUser =
      getProductionDataSource() === "postgres"
        ? await findOrCreateOAuthUserForSession("naver", providerUserId)
        : await findOrCreateNaverUser(profile).then((user) => ({
            id: user.id,
            name: user.name,
            provider: "naver" as const,
          }));
    await createSession(sessionUser);

    const completeUrl = new URL("/auth/complete", request.url);
    const connectionId = request.cookies.get("naver-connection-id")?.value;
    if (connectionId) completeUrl.searchParams.set("connectionId", connectionId);

    const response = NextResponse.redirect(completeUrl);
    response.cookies.delete("naver-oauth-state");
    response.cookies.delete("naver-connection-id");
    return response;
  } catch (caughtError) {
    console.error("네이버 로그인 처리 실패:", caughtError);
    return loginError(request, "unexpected_error");
  }
}
