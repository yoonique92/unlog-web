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

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
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

async function findOrCreateGoogleUser(profile: GoogleUserInfo) {
  const providerUserId = profile.sub;
  if (!providerUserId) throw new Error("Google 이용자 식별자가 없습니다.");

  const users = await readUsers();
  const existing = users.find(
    (user) =>
      user.provider === "google" && user.providerUserId === providerUserId
  );

  if (existing) return existing;

  const user: StoredUser = {
    id: randomUUID(),
    name: "",
    provider: "google",
    providerUserId,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");
  return user;
}

function loginError(request: NextRequest, code: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("googleError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const savedState = request.cookies.get("google-oauth-state")?.value;

  if (error) return loginError(request, error);
  if (!code || !state || !savedState || state !== savedState) {
    return loginError(request, "invalid_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return loginError(request, "missing_configuration");
  }

  try {
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: tokenBody,
      cache: "no-store",
    });
    const token = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !token.access_token) {
      console.error(
        "Google 토큰 발급 실패:",
        token.error,
        token.error_description
      );
      return loginError(request, "token_failed");
    }

    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      }
    );
    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!userInfoResponse.ok || !profile.sub) {
      return loginError(request, "profile_failed");
    }

    const sessionUser =
      getProductionDataSource() === "postgres"
        ? await findOrCreateOAuthUserForSession("google", profile.sub)
        : await findOrCreateGoogleUser(profile).then((user) => ({
            id: user.id,
            name: user.name,
            provider: "google" as const,
          }));
    await createSession(sessionUser);

    const completeUrl = new URL("/auth/complete", request.url);
    const connectionId = request.cookies.get("google-connection-id")?.value;
    if (connectionId) completeUrl.searchParams.set("connectionId", connectionId);

    const response = NextResponse.redirect(completeUrl);
    response.cookies.delete("google-oauth-state");
    response.cookies.delete("google-connection-id");
    return response;
  } catch (caughtError) {
    console.error("Google 로그인 처리 실패:", caughtError);
    return loginError(request, "unexpected_error");
  }
}
