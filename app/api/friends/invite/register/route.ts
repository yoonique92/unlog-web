import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isNicknameWithinLimit } from "../../../../../lib/nickname";
import { getProductionDataSource } from "../../../../../lib/dataSource/config";
import { registerFriendFromPostgres } from "../../../../../lib/dataSource/postgresFriendService";
import { acquireFriendConnectionMutationLock } from "../../../../../lib/friends/connectionMutationLock";
import {
  FRIEND_LIMIT_REACHED_CODE,
  FRIEND_LIMIT_REACHED_MESSAGE,
  hasReachedStoredFriendLimit,
} from "../../../../../lib/friends/limit";

/* ========================================
   친구 정보
======================================== */

type FriendData = {
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  birthTimeUnknown?: boolean;
  calendarType?: "solar" | "lunar";
  gender: string;

  dayPillar: string;
  characterName: string;
  image: string;
};

/* ========================================
   초대 링크 데이터
======================================== */

type InviteRecord = {
  code: string;
  ownerId: string;
  createdAt: string;
};

/* ========================================
   친구 관계 데이터

   초대 링크 주인 ↔ 초대받은 사람

   가입 전:
   friendUserId = null

   가입 후:
   friendUserId = 실제 회원 userId
======================================== */

type FriendConnection = {
  id: string;

  ownerUserId: string;

  friendUserId: string | null;

  inviteCode: string;

  friendProfile: FriendData;

  createdAt: string;
};

/* ========================================
   데이터 경로
======================================== */

const dataDirectory = path.join(
  process.cwd(),
  "data"
);

const inviteDataPath = path.join(
  dataDirectory,
  "friend-invites.json"
);

const connectionDataPath = path.join(
  dataDirectory,
  "friend-connections.json"
);

/* ========================================
   데이터 폴더 보장
======================================== */

async function ensureDataDirectory() {
  await fs.mkdir(
    dataDirectory,
    {
      recursive: true,
    }
  );
}

/* ========================================
   초대 파일 보장
======================================== */

async function ensureInviteFile() {
  await ensureDataDirectory();

  try {
    await fs.access(
      inviteDataPath
    );
  } catch {
    await fs.writeFile(
      inviteDataPath,
      "[]",
      "utf-8"
    );
  }
}

/* ========================================
   친구 관계 파일 보장
======================================== */

async function ensureConnectionFile() {
  await ensureDataDirectory();

  try {
    await fs.access(
      connectionDataPath
    );
  } catch {
    await fs.writeFile(
      connectionDataPath,
      "[]",
      "utf-8"
    );
  }
}

/* ========================================
   초대 데이터 읽기
======================================== */

async function readInvites(): Promise<
  InviteRecord[]
> {
  await ensureInviteFile();

  try {
    const raw =
      await fs.readFile(
        inviteDataPath,
        "utf-8"
      );

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "초대 데이터 읽기 오류:",
      error
    );

    return [];
  }
}

/* ========================================
   친구 관계 데이터 읽기
======================================== */

async function readConnections(): Promise<
  FriendConnection[]
> {
  await ensureConnectionFile();

  try {
    const raw =
      await fs.readFile(
        connectionDataPath,
        "utf-8"
      );

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "친구 관계 데이터 읽기 오류:",
      error
    );

    return [];
  }
}

/* ========================================
   친구 관계 데이터 저장
======================================== */

async function writeConnections(
  connections: FriendConnection[]
) {
  await ensureConnectionFile();

  await fs.writeFile(
    connectionDataPath,
    JSON.stringify(
      connections,
      null,
      2
    ),
    "utf-8"
  );
}

/* ========================================
   친구 등록
======================================== */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      code,
      friend,
    }: {
      code: string;
      friend: FriendData;
    } = body;

    /* ========================================
       필수값 확인
    ======================================== */

    if (
      !code ||
      !friend
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "필수 정보가 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !friend.name ||
      !friend.birthDate ||
      !friend.gender ||
      !friend.dayPillar ||
      !friend.characterName ||
      !friend.image
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "친구 정보가 올바르지 않습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isNicknameWithinLimit(friend.name)) {
      return NextResponse.json(
        {
          success: false,
          error: "닉네임은 최대 6자까지 입력할 수 있습니다.",
          code: "NICKNAME_TOO_LONG",
        },
        { status: 400 }
      );
    }

    if (getProductionDataSource() === "postgres") {
      const result = await registerFriendFromPostgres({ code, friend });
      if (!result.ok) {
        return NextResponse.json(result.error.body, {
          status: result.error.status,
        });
      }
      return NextResponse.json(result.response);
    }

    /* ========================================
       초대 코드 확인
    ======================================== */

    const invites =
      await readInvites();

    const invite =
      invites.find(
        (item) =>
          item.code === code
      );

    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          error:
            "유효하지 않은 초대입니다.",
          code:
            "INVALID_INVITE",
        },
        {
          status: 404,
        }
      );
    }

    /* ========================================
       기존 친구 관계 읽기
    ======================================== */

    const releaseConnectionMutation =
      await acquireFriendConnectionMutationLock();

    try {
      const connections =
        await readConnections();

    /* ========================================
       중복 등록 확인

       현재 MVP 기준:
       동일 owner + 생년월일 + 이름 + 성별

       같은 사람이 같은 유저의 초대 링크로
       반복 등록되는 것을 방지
    ======================================== */

    const duplicateConnection =
      connections.find(
        (connection) =>
          connection.ownerUserId ===
            invite.ownerId &&
          connection.friendProfile.name ===
            friend.name &&
          connection.friendProfile.birthDate ===
            friend.birthDate &&
          connection.friendProfile.gender ===
            friend.gender
      );

    if (duplicateConnection) {
      return NextResponse.json(
        {
          success: false,

          error:
            "이미 등록된 친구입니다.",

          code:
            "ALREADY_REGISTERED",

          connectionId:
            duplicateConnection.id,
        },
        {
          status: 409,
        }
      );
    }

    /* ========================================
       새 친구 관계 생성
    ======================================== */

    if (
      hasReachedStoredFriendLimit(
        connections,
        invite.ownerId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: FRIEND_LIMIT_REACHED_MESSAGE,
          code: FRIEND_LIMIT_REACHED_CODE,
        },
        { status: 429 }
      );
    }

    const newConnection:
      FriendConnection =
      {
        id:
          randomUUID(),

        ownerUserId:
          invite.ownerId,

        /*
          아직 회원가입 전이므로 null

          이후 가입 완료 시
          실제 userId를 연결
        */

        friendUserId:
          null,

        inviteCode:
          invite.code,

        friendProfile: {
          name:
            friend.name,

          birthDate:
            friend.birthDate,

          birthHour:
            friend.birthHour,

          birthMinute:
            friend.birthMinute,

          birthTimeUnknown:
            Boolean(friend.birthTimeUnknown),

          calendarType:
            friend.calendarType ?? "solar",

          gender:
            friend.gender,

          dayPillar:
            friend.dayPillar,

          characterName:
            friend.characterName,

          image:
            friend.image,
        },

        createdAt:
          new Date().toISOString(),
      };

    connections.push(
      newConnection
    );

    await writeConnections(
      connections
    );

    console.log(
      "✅ 로그 프렌즈 관계 등록:",
      newConnection
    );

    /* ========================================
       결과 반환

       connectionId가 중요함

       이후 회원가입 화면으로 넘겨서
       가입한 userId와 연결할 예정
    ======================================== */

    return NextResponse.json({
      success: true,

      connectionId:
        newConnection.id,

      ownerUserId:
        newConnection.ownerUserId,
    });
    } finally {
      releaseConnectionMutation();
    }
  } catch (error) {
    console.error(
      "❌ 친구 등록 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "친구 정보를 저장하지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
