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

type KakaoTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type KakaoUserResponse = {
  id?: number;
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

async function findOrCreateKakaoUser(kakaoUser: KakaoUserResponse) {
  const providerUserId = String(kakaoUser.id);
  const users = await readUsers();
  const existing = users.find(
    (user) =>
      user.provider === "kakao" && user.providerUserId === providerUserId
  );

  if (existing) return existing;

  const user: StoredUser = {
    id: randomUUID(),
    name: "",
    provider: "kakao",
    providerUserId,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");
  return user;
}

function signupError(request: NextRequest, code: string) {
  const url = new URL("/signup", request.url);
  url.searchParams.set("kakaoError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get("kakao-oauth-state")?.value;

  if (error) return signupError(request, error);
  if (!code || !state || !savedState || state !== savedState) {
    return signupError(request, "invalid_state");
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return signupError(request, "missing_configuration");
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: tokenBody,
      cache: "no-store",
    });
    const token = (await tokenResponse.json()) as KakaoTokenResponse;

    if (!tokenResponse.ok || !token.access_token) {
      console.error("카카오 토큰 발급 실패:", token.error, token.error_description);
      return signupError(request, "token_failed");
    }

    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    const kakaoUser = (await userResponse.json()) as KakaoUserResponse;

    if (!userResponse.ok || kakaoUser.id === undefined) {
      return signupError(request, "profile_failed");
    }

    const sessionUser =
      getProductionDataSource() === "postgres"
        ? await findOrCreateOAuthUserForSession("kakao", String(kakaoUser.id))
        : await findOrCreateKakaoUser(kakaoUser).then((user) => ({
            id: user.id,
            name: user.name,
            provider: "kakao" as const,
          }));
    await createSession(sessionUser);

    const completeUrl = new URL("/auth/complete", request.url);
    const connectionId = request.cookies.get("kakao-connection-id")?.value;
    if (connectionId) completeUrl.searchParams.set("connectionId", connectionId);

    const response = NextResponse.redirect(completeUrl);
    response.cookies.delete("kakao-oauth-state");
    response.cookies.delete("kakao-connection-id");
    return response;
  } catch (caughtError) {
    console.error("카카오 로그인 처리 실패:", caughtError);
    return signupError(request, "unexpected_error");
  }
}
