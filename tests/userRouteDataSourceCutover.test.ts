import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  getSessionUser: vi.fn(),
  getAuthMeUserFromPostgres: vi.fn(),
  saveUserSajuProfileToPostgres: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("../lib/auth/session", () => ({
  createSession: mocks.createSession,
  getSessionUser: mocks.getSessionUser,
}));

vi.mock("../lib/dataSource/postgresUserService", () => ({
  getAuthMeUserFromPostgres: mocks.getAuthMeUserFromPostgres,
  saveUserSajuProfileToPostgres: mocks.saveUserSajuProfileToPostgres,
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const promises = {
    ...actual.promises,
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
  };
  return { ...actual, default: { ...actual, promises }, promises };
});

import { GET as getAuthMe } from "../app/api/auth/me/route";
import { POST as saveSaju } from "../app/api/users/saju/route";

const sessionUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "사용자",
  provider: "kakao" as const,
};
const profile = {
  name: "새 이름",
  birthDate: "1994-03-15",
  birthHour: 14,
  birthMinute: 30,
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "male" as const,
};

function createSajuRequest(body: object) {
  return new Request("http://localhost/api/users/saju", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("user route data-source cutover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UNLOG_POSTGRES_SOURCE_V1;
    mocks.getSessionUser.mockResolvedValue(sessionUser);
    mocks.readFile.mockResolvedValue(
      JSON.stringify([{ ...sessionUser, sajuProfile: profile }])
    );
    mocks.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("auth/me OFF keeps the JSON response contract", async () => {
    const response = await getAuthMe();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: { ...sessionUser, sajuProfile: profile },
    });
    expect(mocks.readFile).toHaveBeenCalled();
    expect(mocks.getAuthMeUserFromPostgres).not.toHaveBeenCalled();
  });

  it("auth/me ON returns the PostgreSQL contract without reading JSON", async () => {
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    const body = {
      success: true,
      user: { ...sessionUser, sajuProfile: profile },
    };
    mocks.getAuthMeUserFromPostgres.mockResolvedValue({
      found: true,
      response: body,
    });

    const response = await getAuthMe();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(body);
    expect(mocks.getAuthMeUserFromPostgres).toHaveBeenCalledWith(
      sessionUser.id,
      sessionUser.provider
    );
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("auth/me ON maps a missing DB user to the existing 401 contract", async () => {
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    mocks.getAuthMeUserFromPostgres.mockResolvedValue({
      found: false,
      reason: "USER_NOT_FOUND",
    });

    const response = await getAuthMe();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("users/saju rejects invalid input before either data source", async () => {
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");

    const response = await saveSaju(createSajuRequest({ ...profile, name: "" }));

    expect(response.status).toBe(400);
    expect(mocks.saveUserSajuProfileToPostgres).not.toHaveBeenCalled();
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("users/saju ON preserves unknown-time normalization and session renewal", async () => {
    vi.stubEnv("UNLOG_POSTGRES_SOURCE_V1", "true");
    const normalizedProfile = {
      ...profile,
      birthHour: 12,
      birthMinute: 0,
      birthTimeUnknown: true,
    };
    mocks.saveUserSajuProfileToPostgres.mockResolvedValue({
      ok: true,
      sessionName: profile.name,
      response: { success: true, sajuProfile: normalizedProfile },
    });

    const response = await saveSaju(
      createSajuRequest({
        ...profile,
        birthHour: 1,
        birthMinute: 2,
        birthTimeUnknown: true,
      })
    );

    expect(mocks.saveUserSajuProfileToPostgres).toHaveBeenCalledWith({
      userId: sessionUser.id,
      ...normalizedProfile,
    });
    expect(mocks.createSession).toHaveBeenCalledWith({
      id: sessionUser.id,
      name: profile.name,
      provider: sessionUser.provider,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sajuProfile: normalizedProfile,
    });
    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it("users/saju OFF preserves JSON persistence and session renewal", async () => {
    const response = await saveSaju(createSajuRequest(profile));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sajuProfile: profile,
    });
    expect(mocks.readFile).toHaveBeenCalled();
    expect(mocks.writeFile).toHaveBeenCalled();
    expect(mocks.saveUserSajuProfileToPostgres).not.toHaveBeenCalled();
    expect(mocks.createSession).toHaveBeenCalledWith({
      id: sessionUser.id,
      name: profile.name,
      provider: sessionUser.provider,
    });
  });
});
