import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import { getOrCreateActiveInvite } from "./friendInviteWriteRepository";

const ownerUserId = "00000000-0000-4000-8000-000000000001";
const createdAt = new Date("2026-09-28T12:00:00.000Z");

type InviteRow = {
  code: string;
  owner_user_id: string;
  created_at: Date;
  is_active: boolean;
};

type FakeTransactionOptions = {
  ownerExists?: boolean;
  existingInvite?: InviteRow;
  insertOutcomes?: Array<"collision" | "success">;
  concurrentInviteAfterCollision?: InviteRow;
};

function createFakeClient({
  ownerExists = true,
  existingInvite,
  insertOutcomes = ["success"],
  concurrentInviteAfterCollision,
}: FakeTransactionOptions = {}) {
  const queries: Array<{ text: string; values: unknown[] }> = [];
  let insertAttempt = 0;
  let activeLookup = 0;

  const transaction = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join("?").replace(/\s+/g, " ").trim();
    queries.push({ text: query, values });

    if (query.includes("FROM public.users")) {
      return Promise.resolve(ownerExists ? [{ id: ownerUserId }] : []);
    }
    if (query.includes("FROM public.friend_invites")) {
      activeLookup += 1;
      if (activeLookup === 1) return Promise.resolve(existingInvite ? [existingInvite] : []);
      return Promise.resolve(
        concurrentInviteAfterCollision ? [concurrentInviteAfterCollision] : []
      );
    }
    if (query.includes("INSERT INTO public.friend_invites")) {
      const outcome = insertOutcomes[insertAttempt] ?? "collision";
      insertAttempt += 1;
      if (outcome === "collision") return Promise.resolve([]);
      return Promise.resolve([
        {
          code: values[0],
          owner_user_id: ownerUserId,
          created_at: createdAt,
          is_active: true,
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

describe("getOrCreateActiveInvite", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("returns the existing active invite without inserting", async () => {
    const existingInvite: InviteRow = {
      code: "a1b2c3d4",
      owner_user_id: ownerUserId,
      created_at: createdAt,
      is_active: true,
    };
    const { begin, queries } = createFakeClient({ existingInvite });

    await expect(getOrCreateActiveInvite(ownerUserId)).resolves.toEqual({
      code: "a1b2c3d4",
      ownerUserId,
      createdAt: createdAt.toISOString(),
      isActive: true,
      created: false,
    });
    expect(begin).toHaveBeenCalledTimes(1);
    expect(queries[0].text).toContain("FOR UPDATE");
    expect(queries[1].text).toContain("is_active = true");
    expect(queries.some(({ text }) => text.includes("INSERT INTO"))).toBe(false);
  });

  it("creates an eight-character lowercase hex invite when none is active", async () => {
    const { queries } = createFakeClient();

    const result = await getOrCreateActiveInvite(ownerUserId);

    expect(result).toMatchObject({ ownerUserId, isActive: true, created: true });
    expect(result.code).toMatch(/^[0-9a-f]{8}$/);
    expect(queries[2].text).toContain("ON CONFLICT DO NOTHING");
  });

  it("retries code collisions a finite number of times", async () => {
    const { queries } = createFakeClient({
      insertOutcomes: ["collision", "success"],
    });

    await expect(getOrCreateActiveInvite(ownerUserId)).resolves.toMatchObject({
      created: true,
    });
    expect(
      queries.filter(({ text }) => text.includes("INSERT INTO public.friend_invites"))
    ).toHaveLength(2);
  });

  it("returns a concurrently-created active invite after a conflict", async () => {
    const concurrentInvite: InviteRow = {
      code: "deadbeef",
      owner_user_id: ownerUserId,
      created_at: createdAt,
      is_active: true,
    };
    createFakeClient({
      insertOutcomes: ["collision"],
      concurrentInviteAfterCollision: concurrentInvite,
    });

    await expect(getOrCreateActiveInvite(ownerUserId)).resolves.toEqual({
      code: "deadbeef",
      ownerUserId,
      createdAt: createdAt.toISOString(),
      isActive: true,
      created: false,
    });
  });

  it("stops after five unresolved code collisions", async () => {
    const { queries } = createFakeClient({
      insertOutcomes: Array.from({ length: 5 }, () => "collision"),
    });

    await expect(getOrCreateActiveInvite(ownerUserId)).rejects.toMatchObject({
      name: "FriendInviteWriteRepositoryError",
      code: "INVITE_CODE_GENERATION_FAILED",
    });
    expect(
      queries.filter(({ text }) => text.includes("INSERT INTO public.friend_invites"))
    ).toHaveLength(5);
  });

  it("throws USER_NOT_FOUND before reading or writing invites", async () => {
    const { queries } = createFakeClient({ ownerExists: false });

    await expect(getOrCreateActiveInvite(ownerUserId)).rejects.toMatchObject({
      name: "FriendInviteWriteRepositoryError",
      code: "USER_NOT_FOUND",
    });
    expect(queries).toHaveLength(1);
  });
});
