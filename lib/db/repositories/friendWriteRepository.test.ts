import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPostgresClient: vi.fn(),
}));

vi.mock("../postgres", () => ({
  getPostgresClient: mocks.getPostgresClient,
}));

import {
  createFriendConnection,
  deleteFriendConnection,
  linkFriendConnectionUser,
  type CreateFriendConnectionInput,
  type FriendWriteRepositoryErrorCode,
} from "./friendWriteRepository";

const ownerUserId = "00000000-0000-4000-8000-000000000001";
const friendUserId = "00000000-0000-4000-8000-000000000002";
const connectionId = "00000000-0000-4000-8000-000000000003";
const createdAt = new Date("2026-09-28T12:00:00.000Z");
const linkedAt = new Date("2026-09-28T12:10:00.000Z");

const createInput: CreateFriendConnectionInput = {
  ownerUserId,
  inviteCode: "a1b2c3d4",
  friendProfile: {
    name: "테스트 친구",
    birthDate: "1994-03-15",
    birthHour: "14",
    birthMinute: "30",
    birthTimeUnknown: false,
    calendarType: "solar",
    gender: "male",
    dayPillar: "庚子",
    characterName: "테스트 캐릭터",
    image: "/image/friends/test.png",
  },
};

const baseConnectionRow = {
  connection_id: connectionId,
  owner_user_id: ownerUserId,
  friend_user_id: null,
  invite_code: createInput.inviteCode,
  profile_dedupe_key: 'v1:["테스트 친구","1994-03-15","male"]',
  created_at: createdAt,
  linked_at: null,
  updated_at: null,
};

type FakeClientOptions = {
  functionName: "create" | "link" | "delete";
  error?: Error & { code?: string };
  emptyResult?: boolean;
  previousFriendUserId?: string | null;
};

function createFakeClient({
  functionName,
  error,
  emptyResult = false,
  previousFriendUserId = null,
}: FakeClientOptions) {
  const queries: Array<{ text: string; values: unknown[] }> = [];

  const execute = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join("?").replace(/\s+/g, " ").trim();
    queries.push({ text, values });
    if (error && text.includes(`public.${functionName}_friend_connection`)) {
      return Promise.reject(error);
    }
    if (error && functionName === "link" && text.includes("public.link_friend_connection_user")) {
      return Promise.reject(error);
    }
    if (text.includes("FROM public.friend_connections")) {
      return Promise.resolve([{ friend_user_id: previousFriendUserId }]);
    }
    if (text.includes("public.create_friend_connection")) {
      return Promise.resolve(emptyResult ? [] : [baseConnectionRow]);
    }
    if (text.includes("public.link_friend_connection_user")) {
      return Promise.resolve(
        emptyResult
          ? []
          : [
              {
                ...baseConnectionRow,
                friend_user_id: friendUserId,
                linked_at: linkedAt,
                updated_at: linkedAt,
              },
            ]
      );
    }
    if (text.includes("public.delete_friend_connection")) {
      return Promise.resolve(emptyResult ? [] : [{ deleted_connection_id: connectionId }]);
    }
    throw new Error(`Unexpected query: ${text}`);
  };

  const root = Object.assign(execute, {
    begin: vi.fn(async (callback: (transaction: typeof execute) => unknown) =>
      callback(execute)
    ),
  });
  mocks.getPostgresClient.mockReturnValue(root as never);
  return { queries, begin: root.begin };
}

describe("friendWriteRepository", () => {
  beforeEach(() => {
    mocks.getPostgresClient.mockReset();
  });

  it("creates a connection only through create_friend_connection", async () => {
    const { queries } = createFakeClient({ functionName: "create" });

    await expect(createFriendConnection(createInput)).resolves.toEqual({
      id: connectionId,
      ownerUserId,
      friendUserId: null,
      inviteCode: createInput.inviteCode,
      profileDedupeKey: baseConnectionRow.profile_dedupe_key,
      createdAt: createdAt.toISOString(),
      linkedAt: null,
      updatedAt: null,
    });
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("public.create_friend_connection");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
    expect(queries[0].values[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("marks a newly linked connection as not already linked", async () => {
    const { begin, queries } = createFakeClient({ functionName: "link" });

    await expect(
      linkFriendConnectionUser({ connectionId, friendUserId })
    ).resolves.toMatchObject({
      alreadyLinked: false,
      connection: { id: connectionId, friendUserId },
    });
    expect(begin).toHaveBeenCalledTimes(1);
    expect(queries[0].text).toContain("FOR UPDATE");
    expect(queries[1].text).toContain("public.link_friend_connection_user");
    expect(queries[1].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it("identifies an idempotent re-link to the same user", async () => {
    createFakeClient({ functionName: "link", previousFriendUserId: friendUserId });

    await expect(
      linkFriendConnectionUser({ connectionId, friendUserId })
    ).resolves.toMatchObject({ alreadyLinked: true });
  });

  it("deletes only through delete_friend_connection", async () => {
    const { queries } = createFakeClient({ functionName: "delete" });

    await expect(
      deleteFriendConnection({ connectionId, requesterUserId: ownerUserId })
    ).resolves.toEqual({ deletedConnectionId: connectionId });
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toContain("public.delete_friend_connection");
    expect(queries[0].text).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it.each<FriendWriteRepositoryErrorCode>([
    "FRIEND_LIMIT_REACHED",
    "ALREADY_REGISTERED",
    "INVITE_NOT_FOUND",
    "INVITE_INACTIVE",
    "INVALID_INVITE_OWNER",
    "CONNECTION_NOT_FOUND",
    "ALREADY_LINKED",
    "SELF_CONNECTION",
    "FORBIDDEN",
    "USER_NOT_FOUND",
    "INVALID_PROFILE",
    "CONNECTION_ID_CONFLICT",
    "FRIEND_MUTATION_REQUIRES_READ_COMMITTED",
  ])("maps the expected database error %s", async (code) => {
    const databaseError = Object.assign(new Error(code), { code: "P0001" });
    createFakeClient({ functionName: "create", error: databaseError });

    await expect(createFriendConnection(createInput)).rejects.toEqual(
      expect.objectContaining({
        name: "FriendWriteRepositoryError",
        code,
        cause: databaseError,
      })
    );
  });

  it("does not relabel an unexpected database error", async () => {
    const databaseError = Object.assign(new Error("connection closed"), {
      code: "CONNECTION_CLOSED",
    });
    createFakeClient({ functionName: "delete", error: databaseError });

    await expect(
      deleteFriendConnection({ connectionId, requesterUserId: ownerUserId })
    ).rejects.toBe(databaseError);
  });
});
