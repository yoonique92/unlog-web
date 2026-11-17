import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import {
  findOrCreateSocialUser,
  type FindOrCreateSocialUserInput,
  type SocialUserWriteRepositoryErrorCode,
} from "./socialUserWriteRepository";

const input: FindOrCreateSocialUserInput = {
  provider: "kakao",
  providerUserId: "provider-user-test",
};

type FakeSqlOptions = {
  rows?: unknown[];
  error?: Error & { code?: string };
};

function createFakeClient({ rows = [], error }: FakeSqlOptions = {}) {
  const queries: Array<{ text: string; values: unknown[] }> = [];
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    queries.push({
      text: strings.join("?").replace(/\s+/g, " ").trim(),
      values,
    });
    return error ? Promise.reject(error) : Promise.resolve(rows);
  };
  mocks.getPostgresClient.mockReturnValue(sql as never);
  return { queries };
}

describe("findOrCreateSocialUser", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("maps a newly created database user to the app contract", async () => {
    const createdAt = new Date("2026-09-28T12:00:00.000Z");
    const { queries } = createFakeClient({
      rows: [
        {
          user_id: "00000000-0000-4000-8000-000000000001",
          display_name: "",
          provider: "kakao",
          provider_user_id: input.providerUserId,
          created_at: createdAt,
          created: true,
        },
      ],
    });

    await expect(findOrCreateSocialUser(input)).resolves.toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      displayName: "",
      provider: "kakao",
      providerUserId: input.providerUserId,
      createdAt: createdAt.toISOString(),
      created: true,
    });
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("public.find_or_create_social_user");
    expect(queries[0].text).not.toContain("INSERT INTO");
    expect(queries[0].values[0]).toBe("kakao");
    expect(queries[0].values[1]).toBe(input.providerUserId);
    expect(queries[0].values[2]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("preserves created=false for an existing identity", async () => {
    createFakeClient({
      rows: [
        {
          user_id: "00000000-0000-4000-8000-000000000001",
          display_name: "기존 사용자",
          provider: "google",
          provider_user_id: "existing-provider-user",
          created_at: "2025-01-01T00:00:00.000Z",
          created: false,
        },
      ],
    });

    await expect(
      findOrCreateSocialUser({
        provider: "google",
        providerUserId: "existing-provider-user",
      })
    ).resolves.toMatchObject({
      displayName: "기존 사용자",
      created: false,
    });
  });

  it.each<SocialUserWriteRepositoryErrorCode>([
    "INVALID_PROVIDER",
    "INVALID_PROVIDER_USER_ID",
    "INVALID_USER_ID",
    "USER_ID_CONFLICT",
    "SOCIAL_IDENTITY_CONFLICT",
    "SOCIAL_USER_REQUIRES_READ_COMMITTED",
  ])("maps the expected database error %s", async (code) => {
    const databaseError = Object.assign(new Error(code), { code: "P0001" });
    createFakeClient({ error: databaseError });

    await expect(findOrCreateSocialUser(input)).rejects.toEqual(
      expect.objectContaining({
        name: "SocialUserWriteRepositoryError",
        code,
        cause: databaseError,
      })
    );
  });

  it("does not relabel an unexpected database error", async () => {
    const databaseError = Object.assign(new Error("connection closed"), {
      code: "CONNECTION_CLOSED",
    });
    createFakeClient({ error: databaseError });

    await expect(findOrCreateSocialUser(input)).rejects.toBe(databaseError);
  });

  it("reports an empty function result explicitly", async () => {
    createFakeClient();

    await expect(findOrCreateSocialUser(input)).rejects.toMatchObject({
      name: "SocialUserWriteRepositoryError",
      code: "SOCIAL_USER_RESULT_MISSING",
    });
  });
});
