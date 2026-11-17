import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSessionUser } from "../../../../lib/auth/session";
import { getProductionDataSource } from "../../../../lib/dataSource/config";
import { connectFriendUserFromPostgres } from "../../../../lib/dataSource/postgresFriendService";
import { acquireFriendConnectionMutationLock } from "../../../../lib/friends/connectionMutationLock";
import {
  FRIEND_LIMIT_REACHED_CODE,
  FRIEND_LIMIT_REACHED_MESSAGE,
  hasReachedStoredFriendLimit,
} from "../../../../lib/friends/limit";

/* ========================================
   친구 프로필
======================================== */

type FriendProfile = {
  name: string;
  birthDate: string;
  birthHour: string;
  birthMinute: string;
  gender: string;
  dayPillar: string;
  characterName: string;
  image: string;
};

/* ========================================
   친구 관계 데이터
======================================== */

type FriendConnection = {
  id: string;

  ownerUserId: string;

  friendUserId: string | null;

  inviteCode: string;

  friendProfile: FriendProfile;

  createdAt: string;
};

/* ========================================
   데이터 경로
======================================== */

const dataDirectory = path.join(
  process.cwd(),
  "data"
);

const connectionDataPath = path.join(
  dataDirectory,
  "friend-connections.json"
);

/* ========================================
   파일 보장
======================================== */

async function ensureConnectionFile() {
  await fs.mkdir(
    dataDirectory,
    {
      recursive: true,
    }
  );

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
   관계 데이터 읽기
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
   관계 데이터 저장
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
   가입한 userId 연결

   connectionId와 로그인 세션을 확인해서
   friendUserId에 실제 가입 회원 ID 연결
======================================== */

export async function POST(
  request: Request
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const connectionId =
      body?.connectionId;

    const userId = sessionUser.id;

    /* ========================================
       필수값 확인
    ======================================== */

    if (
      !connectionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "connectionId가 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (getProductionDataSource() === "postgres") {
      const result = await connectFriendUserFromPostgres(connectionId, userId);
      if (!result.ok) {
        return NextResponse.json(result.error.body, {
          status: result.error.status,
        });
      }
      return NextResponse.json(result.response);
    }

    const releaseConnectionMutation =
      await acquireFriendConnectionMutationLock();

    try {
      const connections =
        await readConnections();

    /* ========================================
       connection 찾기
    ======================================== */

    const connectionIndex =
      connections.findIndex(
        (connection) =>
          connection.id ===
          connectionId
      );

    if (
      connectionIndex === -1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "친구 관계 정보를 찾을 수 없습니다.",
          code:
            "CONNECTION_NOT_FOUND",
        },
        {
          status: 404,
        }
      );
    }

    const connection =
      connections[
        connectionIndex
      ];

    if (connection.ownerUserId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: "본인의 초대 관계에는 본인을 친구로 연결할 수 없습니다.",
        },
        { status: 400 }
      );
    }

    /* ========================================
       이미 다른 userId가 연결되어 있는 경우
    ======================================== */

    if (
      connection.friendUserId &&
      connection.friendUserId !==
        userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "이미 다른 회원과 연결된 친구 관계입니다.",
          code:
            "ALREADY_CONNECTED",
        },
        {
          status: 409,
        }
      );
    }

    /* ========================================
       이미 같은 userId가 연결된 경우

       재요청이어도 성공 처리
    ======================================== */

    if (
      connection.friendUserId ===
      userId
    ) {
      return NextResponse.json({
        success: true,
        alreadyConnected: true,
        connection,
      });
    }

    /* ========================================
       실제 userId 연결
    ======================================== */

    if (
      hasReachedStoredFriendLimit(
        connections,
        userId
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

    connections[
      connectionIndex
    ] = {
      ...connection,

      friendUserId:
        userId,
    };

    await writeConnections(
      connections
    );

    const updatedConnection =
      connections[
        connectionIndex
      ];

    console.log(
      "✅ 친구 회원 연결 완료:",
      updatedConnection
    );

    return NextResponse.json({
      success: true,

      alreadyConnected:
        false,

      connection:
        updatedConnection,
    });
    } finally {
      releaseConnectionMutation();
    }
  } catch (error) {
    console.error(
      "❌ 친구 회원 연결 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "회원과 친구 관계를 연결하지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
