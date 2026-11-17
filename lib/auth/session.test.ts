import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SESSION_SECRET = "test-session-secret-at-least-32-characters";
const SESSION_COOKIE = "unlog-session";

const cookieState = vi.hoisted(() => ({
  value: undefined as string | undefined,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      if (name !== SESSION_COOKIE || cookieState.value === undefined) {
        return undefined;
      }

      return { name, value: cookieState.value };
    },
    set(name: string, value: string) {
      if (name === SESSION_COOKIE) cookieState.value = value;
    },
    delete(name: string) {
      if (name === SESSION_COOKIE) cookieState.value = undefined;
    },
  }),
}));

import { GET as getCurrentUser } from "../../app/api/auth/me/route";
import { createSession, getSessionUser } from "./session";

function createSignedSession(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", TEST_SESSION_SECRET)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

function setSignedPayload(payload: Record<string, unknown>) {
  cookieState.value = createSignedSession(payload);
}

describe("auth session", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SESSION_SECRET;
    cookieState.value = undefined;
  });

  it("accepts a correctly signed onboarding session with an empty name", async () => {
    await createSession({ id: "new-user", name: "", provider: "kakao" });

    await expect(getSessionUser()).resolves.toEqual({
      id: "new-user",
      name: "",
      provider: "kakao",
    });
  });

  it("continues to accept a correctly signed session with a saved name", async () => {
    await createSession({
      id: "existing-user",
      name: "홍길동",
      provider: "naver",
    });

    await expect(getSessionUser()).resolves.toEqual({
      id: "existing-user",
      name: "홍길동",
      provider: "naver",
    });
  });

  it("rejects a session whose name field is missing", async () => {
    setSignedPayload({
      id: "missing-name-user",
      provider: "google",
      expiresAt: Date.now() + 60_000,
    });

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("rejects a session whose name is not a string", async () => {
    setSignedPayload({
      id: "invalid-name-user",
      name: 123,
      provider: "google",
      expiresAt: Date.now() + 60_000,
    });

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    setSignedPayload({
      id: "expired-user",
      name: "홍길동",
      provider: "kakao",
      expiresAt: Date.now() - 1,
    });

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("rejects a session with an invalid signature", async () => {
    setSignedPayload({
      id: "tampered-user",
      name: "홍길동",
      provider: "kakao",
      expiresAt: Date.now() + 60_000,
    });
    const [body] = cookieState.value!.split(".");
    cookieState.value = `${body}.invalid-signature`;

    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("lets /api/auth/me recognize a signed onboarding session", async () => {
    await createSession({ id: "new-api-user", name: "", provider: "google" });

    const response = await getCurrentUser();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      user: {
        id: "new-api-user",
        name: "",
        provider: "google",
        sajuProfile: null,
      },
    });
  });
});
