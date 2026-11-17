import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FRIEND_LIMIT_REACHED_CODE,
  FRIEND_LIMIT_REACHED_MESSAGE,
} from "../../../../../lib/friends/limit";

type StoredConnection = {
  id: string;
  ownerUserId: string;
  friendUserId: string | null;
  inviteCode: string;
  friendProfile: ReturnType<typeof createFriend>;
  createdAt: string;
};

const storage = vi.hoisted(() => ({
  invites: [
    {
      code: "invite-code",
      ownerId: "owner-1",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  connections: [] as StoredConnection[],
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const actualDefault = (
    actual as typeof actual & { default?: typeof actual }
  ).default ?? actual;
  const promises = {
    mkdir: vi.fn(async () => undefined),
    access: vi.fn(async () => undefined),
    readFile: vi.fn(async (filePath: string) =>
      JSON.stringify(
        filePath.endsWith("friend-invites.json")
          ? storage.invites
          : storage.connections
      )
    ),
    writeFile: vi.fn(
      async (filePath: string, value: string) => {
        if (filePath.endsWith("friend-connections.json")) {
          storage.connections = JSON.parse(value) as StoredConnection[];
        }
      }
    ),
  };

  return {
    ...actual,
    default: {
      ...actualDefault,
      promises,
    },
    promises,
  };
});

import { POST } from "./route";

function createFriend(index: number) {
  return {
    name: `친구${index}`,
    birthDate: "1990-01-01",
    birthHour: "12",
    birthMinute: "00",
    birthTimeUnknown: false,
    calendarType: "solar" as const,
    gender: "male",
    dayPillar: "甲子",
    characterName: "테스트 캐릭터",
    image: "/image/friends/test.png",
  };
}

function createConnection(index: number): StoredConnection {
  return {
    id: `connection-${index}`,
    ownerUserId: "owner-1",
    friendUserId: null,
    inviteCode: "invite-code",
    friendProfile: createFriend(index),
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function createRegisterRequest(index: number) {
  return new Request(
    "http://localhost/api/friends/invite/register",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "invite-code",
        friend: createFriend(index),
      }),
    }
  );
}

describe("friend invite registration limit", () => {
  beforeEach(() => {
    storage.connections = [];
  });

  it("allows the fiftieth stored friend", async () => {
    storage.connections = Array.from(
      { length: 49 },
      (_, index) => createConnection(index + 1)
    );

    const response = await POST(createRegisterRequest(50));

    expect(response.status).toBe(200);
    expect(storage.connections).toHaveLength(50);
  });

  it("rejects a direct API request for the fifty-first friend", async () => {
    storage.connections = Array.from(
      { length: 50 },
      (_, index) => createConnection(index + 1)
    );

    const response = await POST(createRegisterRequest(51));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toMatchObject({
      success: false,
      code: FRIEND_LIMIT_REACHED_CODE,
      error: FRIEND_LIMIT_REACHED_MESSAGE,
    });
    expect(storage.connections).toHaveLength(50);
  });

  it("keeps the existing duplicate response at the limit", async () => {
    storage.connections = Array.from(
      { length: 50 },
      (_, index) => createConnection(index + 1)
    );

    const response = await POST(createRegisterRequest(1));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("ALREADY_REGISTERED");
    expect(storage.connections).toHaveLength(50);
  });

  it("serializes simultaneous registrations so the count cannot exceed 50", async () => {
    storage.connections = Array.from(
      { length: 49 },
      (_, index) => createConnection(index + 1)
    );

    const responses = await Promise.all([
      POST(createRegisterRequest(50)),
      POST(createRegisterRequest(51)),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200,
      429,
    ]);
    expect(storage.connections).toHaveLength(50);
  });
});
