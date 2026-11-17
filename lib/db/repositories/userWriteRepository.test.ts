import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import {
  upsertUserSajuProfile,
  type UpsertUserSajuProfileInput,
} from "./userWriteRepository";

const input: UpsertUserSajuProfileInput = {
  userId: "00000000-0000-4000-8000-000000000001",
  name: "테스트 사용자",
  birthDate: "1994-02-22",
  birthHour: 12,
  birthMinute: 0,
  birthTimeUnknown: true,
  calendarType: "solar",
  gender: "male",
};

type FakeTransactionOptions = {
  userExists?: boolean;
  profileError?: Error & { code?: string };
};

function createFakeClient({
  userExists = true,
  profileError,
}: FakeTransactionOptions = {}) {
  const queries: string[] = [];
  const transaction = (strings: TemplateStringsArray) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim();
    queries.push(query);

    if (query.includes("SELECT id::text AS id")) {
      return Promise.resolve(userExists ? [{ id: input.userId }] : []);
    }
    if (query.includes("UPDATE public.users")) {
      return Promise.resolve([{ id: input.userId, display_name: input.name }]);
    }
    if (query.includes("INSERT INTO public.saju_profiles")) {
      if (profileError) return Promise.reject(profileError);
      return Promise.resolve([
        {
          user_id: input.userId,
          profile_name: input.name,
          birth_date: input.birthDate,
          birth_hour: input.birthHour,
          birth_minute: input.birthMinute,
          birth_time_unknown: input.birthTimeUnknown,
          calendar_type: input.calendarType,
          gender: input.gender,
          updated_at: new Date("2026-09-28T12:00:00.000Z"),
        },
      ]);
    }
    throw new Error(`Unexpected query: ${query}`);
  };

  const begin = vi.fn(async (callback: (sql: typeof transaction) => unknown) =>
    callback(transaction)
  );
  mocks.getPostgresClient.mockReturnValue({ begin } as never);

  return { begin, queries };
}

describe("upsertUserSajuProfile", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("updates the display name and upserts the profile in one transaction", async () => {
    const { begin, queries } = createFakeClient();

    await expect(upsertUserSajuProfile(input)).resolves.toEqual({
      id: input.userId,
      displayName: input.name,
      sajuProfile: {
        userId: input.userId,
        name: input.name,
        birthDate: input.birthDate,
        birthHour: 12,
        birthMinute: 0,
        birthTimeUnknown: true,
        calendarType: "solar",
        gender: "male",
        updatedAt: "2026-09-28T12:00:00.000Z",
      },
    });

    expect(begin).toHaveBeenCalledTimes(1);
    expect(queries).toHaveLength(3);
    expect(queries[0]).toContain("FOR UPDATE");
    expect(queries[1]).toContain("UPDATE public.users");
    expect(queries[2]).toContain("ON CONFLICT (user_id) DO UPDATE");
  });

  it("throws USER_NOT_FOUND before attempting writes", async () => {
    const { queries } = createFakeClient({ userExists: false });

    await expect(upsertUserSajuProfile(input)).rejects.toMatchObject({
      name: "UserWriteRepositoryError",
      code: "USER_NOT_FOUND",
    });
    expect(queries).toHaveLength(1);
  });

  it("maps database constraint failures to a stable repository error", async () => {
    const databaseError = Object.assign(new Error("check violation"), {
      code: "23514",
    });
    createFakeClient({ profileError: databaseError });

    await expect(upsertUserSajuProfile(input)).rejects.toEqual(
      expect.objectContaining({
        name: "UserWriteRepositoryError",
        code: "SAJU_PROFILE_CONSTRAINT_VIOLATION",
        cause: databaseError,
      })
    );
  });
});
