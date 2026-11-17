import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  findOrCreateOAuthUserForSession: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("../lib/auth/session", () => ({
  createSession: mocks.createSession,
}));

vi.mock("../lib/dataSource/postgresUserService", () => ({
  findOrCreateOAuthUserForSession: mocks.findOrCreateOAuthUserForSession,
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const promises = {
    ...actual.promises,
    mkdir: mocks.mkdir,
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
  };
  return { ...actual, default: { ...actual, promises }, promises };
});

import { GET as kakaoCallback } from "../app/api/auth/kakao/callback/route";
import { GET as naverCallback } from "../app/api/auth/naver/callback/route";
import { GET as googleCallback } from "../app/api/auth/google/callback/route";

type ProviderCase = {
  provider: "kakao" | "naver" | "google";
  callback: (request: NextRequest) => Promise<Response>;
  stateCookie: string;
  connectionCookie: string;
  providerUserId: string;
  tokenBody: object;
  profileBody: object;
};

const cases: ProviderCase[] = [
  {
    provider: "kakao",
    callback: kakaoCallback,
    stateCookie: "kakao-oauth-state",
    connectionCookie: "kakao-connection-id",
    providerUserId: "101",
    tokenBody: { access_token: "token" },
    profileBody: { id: 101 },
  },
  {
    provider: "naver",
    callback: naverCallback,
    stateCookie: "naver-oauth-state",
    connectionCookie: "naver-connection-id",
    providerUserId: "naver-user",
    tokenBody: { access_token: "token" },
    profileBody: { resultcode: "00", response: { id: "naver-user" } },
  },
  {
    provider: "google",
    callback: googleCallback,
    stateCookie: "google-oauth-state",
    connectionCookie: "google-connection-id",
    providerUserId: "google-user",
    tokenBody: { access_token: "token" },
    profileBody: { sub: "google-user" },
  },
];

function configureOAuthEnvironment() {
  vi.stubEnv("KAKAO_REST_API_KEY", "key");
  vi.stubEnv("KAKAO_CLIENT_SECRET", "secret");
  vi.stubEnv("KAKAO_REDIRECT_URI", "http://localhost/callback");
  vi.stubEnv("NAVER_CLIENT_ID", "key");
  vi.stubEnv("NAVER_CLIENT_SECRET", "secret");
  vi.stubEnv("NAVER_REDIRECT_URI", "http://localhost/callback");
  vi.stubEnv("GOOGLE_CLIENT_ID", "key");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  vi.stubEnv("GOOGLE_REDIRECT_URI", "http://localhost/callback");
}

function createRequest(testCase: ProviderCase) {
  return new NextRequest(
    `http://localhost/api/auth/${testCase.provider}/callback?code=code&state=state`,
    {
      headers: {
        cookie: `${testCase.stateCookie}=state; ${testCase.connectionCookie}=connection-1`,
      },
    }
  );
}

function mockOAuthFetch(testCase: ProviderCase) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify(testCase.tokenBody), { status: 200 })
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(testCase.profileBody), { status: 200 })
    );
  vi.stubGlobal("fetch", fetchMock);
}

describe("OAuth callback data-source cutover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureOAuthEnvironment();
    delete process.env.UNLOG_POSTGRES_SOURCE_V1;
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.readFile.mockResolvedValue("[]");
    mocks.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(cases)(
    "$provider OFF keeps JSON creation and the existing session payload",
    async (testCase) => {
      mockOAuthFetch(testCase);

      const response = await testCase.callback(createRequest(testCase));

      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
        "/auth/complete"
      );
      expect(mocks.readFile).toHaveBeenCalled();
      expect(mocks.writeFile).toHaveBeenCalled();
      expect(mocks.findOrCreateOAuthUserForSession).not.toHaveBeenCalled();
      expect(mocks.createSession).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "",
        provider: testCase.provider,
      });
    }
  );

  it.each(cases)(
    "$provider ON uses only the PostgreSQL service after provider verification",
    async (testCase) => {
      vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
      mockOAuthFetch(testCase);
      const sessionUser = {
        id: `db-${testCase.provider}`,
        name: "",
        provider: testCase.provider,
      };
      mocks.findOrCreateOAuthUserForSession.mockResolvedValue(sessionUser);

      const response = await testCase.callback(createRequest(testCase));

      expect(response.status).toBe(307);
      expect(mocks.findOrCreateOAuthUserForSession).toHaveBeenCalledWith(
        testCase.provider,
        testCase.providerUserId
      );
      expect(mocks.createSession).toHaveBeenCalledWith(sessionUser);
      expect(mocks.readFile).not.toHaveBeenCalled();
      expect(mocks.writeFile).not.toHaveBeenCalled();
    }
  );
});
