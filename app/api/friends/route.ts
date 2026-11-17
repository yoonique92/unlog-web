import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSessionUser } from "../../../lib/auth/session";
import { getSaju } from "../../../lib/saju";
import { getDayPillarCharacterName } from "../../../lib/dayPillarCharacter";
import type { FourPillars } from "../../../lib/friendRelationship";
import { getProductionDataSource } from "../../../lib/dataSource/config";
import {
  deleteFriendFromPostgres,
  getFriendsFromPostgres,
} from "../../../lib/dataSource/postgresFriendService";

/* ========================================
   타입
======================================== */

type FriendProfile = {
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

type FriendConnection = {
  id: string;

  ownerUserId: string;
  friendUserId: string | null;

  inviteCode: string;

  friendProfile: FriendProfile;

  createdAt: string;
};

type UserRecord = {
  id: string;
  name: string;
  sajuProfile?: {
    birthDate: string;
    birthHour: number;
    birthMinute: number;
    calendarType: "solar" | "lunar";
    gender: "male" | "female";
  };
  createdAt: string;
};

/* ========================================
   응답용 친구 타입
======================================== */

type FriendResponse = {
  id: string;

  userId: string | null;

  name: string;

  birthDate: string;
  birthHour: string;
  birthMinute: string;

  gender: string;

  dayPillar: string;

  characterName: string;

  image: string;

  connectionId: string;

  isMember: boolean;
  pillars?: FourPillars;
};

/* ========================================
   데이터 경로
======================================== */

const dataDirectory = path.join(
  process.cwd(),
  "data"
);

const connectionsPath = path.join(
  dataDirectory,
  "friend-connections.json"
);

const usersPath = path.join(
  dataDirectory,
  "users.json"
);

/* ========================================
   파일 보장
======================================== */

async function ensureFile(
  filePath: string
) {
  await fs.mkdir(
    dataDirectory,
    {
      recursive: true,
    }
  );

  try {
    await fs.access(
      filePath
    );
  } catch {
    await fs.writeFile(
      filePath,
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
  await ensureFile(
    connectionsPath
  );

  try {
    const raw =
      await fs.readFile(
        connectionsPath,
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

async function writeConnections(connections: FriendConnection[]) {
  await ensureFile(connectionsPath);
  await fs.writeFile(
    connectionsPath,
    JSON.stringify(connections, null, 2),
    "utf-8"
  );
}

/* ========================================
   회원 데이터 읽기
======================================== */

async function readUsers(): Promise<
  UserRecord[]
> {
  await ensureFile(
    usersPath
  );

  try {
    const raw =
      await fs.readFile(
        usersPath,
        "utf-8"
      );

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "회원 데이터 읽기 오류:",
      error
    );

    return [];
  }
}

/* ========================================
   친구 목록 조회
======================================== */

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: "로그인이 필요합니다.",
        },
        {
          status: 401,
        }
      );
    }

    const userId = sessionUser.id;

    if (getProductionDataSource() === "postgres") {
      return NextResponse.json(await getFriendsFromPostgres(userId));
    }

    const connections =
      await readConnections();

    const users =
      await readUsers();

    const friends:
      FriendResponse[] = [];

    /* ========================================
       모든 관계 확인
    ======================================== */

    for (
      const connection
      of connections
    ) {
      /* ========================================
         1. 내가 초대한 사람인 경우

         ownerUserId === 나

         초대받은 친구를 보여줌

         friendUserId가 null이어도
         가입 전 캐릭터는 표시 가능
      ======================================== */

      if (
        connection.ownerUserId ===
        userId
      ) {
        const friendProfile = getCalculatedFriendProfile(
          connection.friendProfile
        );

        friends.push({
          id:
            connection.friendUserId ??
            connection.id,

          userId:
            connection.friendUserId,

          name:
            friendProfile.name,

          birthDate:
            friendProfile.birthDate,

          birthHour:
            friendProfile.birthHour,

          birthMinute:
            friendProfile.birthMinute,

          gender:
            friendProfile.gender,

          dayPillar:
            friendProfile.dayPillar,

          characterName:
            friendProfile.characterName,

          image:
            friendProfile.image,

          connectionId:
            connection.id,

          isMember:
            Boolean(
              connection.friendUserId
            ),

          pillars: friendProfile.pillars,
        });

        continue;
      }

      /* ========================================
         2. 내가 초대받아서 가입한 사람인 경우

         friendUserId === 나

         이 경우 친구는 초대 링크의 주인
      ======================================== */

      if (
        connection.friendUserId ===
        userId
      ) {
        const ownerUser =
          users.find(
            (user) =>
              user.id ===
              connection.ownerUserId
          );

        /*
          현재 users.json에는
          이름/이메일만 있고
          캐릭터 정보가 아직 없으므로

          초대 링크 주인의 캐릭터 데이터는
          현재 단계에서는 완전히 만들 수 없음.

          일단 owner 이름을 가져오고,
          캐릭터 정보는 다음 단계에서
          UserRecord 확장으로 해결 예정.
        */

        friends.push({
          id:
            connection.ownerUserId,

          userId:
            connection.ownerUserId,

          name:
            ownerUser?.name ??
            "로그 프렌즈",

          birthDate:
            "",

          birthHour:
            "",

          birthMinute:
            "",

          gender:
            "",

          dayPillar:
            "",

          characterName:
            "",

          image:
            "/image/friends/dragon_character_men.png",

          connectionId:
            connection.id,

          isMember:
            true,
        });
      }
    }

    /* ========================================
       중복 제거

       같은 userId가 여러 번 잡히는 것을 방지
    ======================================== */

    const uniqueFriends =
      friends.filter(
        (
          friend,
          index,
          array
        ) => {
          const uniqueKey =
            friend.userId ??
            friend.connectionId;

          return (
            array.findIndex(
              (item) =>
                (
                  item.userId ??
                  item.connectionId
                ) ===
                uniqueKey
            ) === index
          );
        }
      );

    return NextResponse.json({
      success: true,

      friends:
        uniqueFriends,
    });
  } catch (error) {
    console.error(
      "❌ 친구 목록 조회 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "친구 목록을 불러오지 못했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}

function getCalculatedFriendProfile(
  profile: FriendProfile
): FriendProfile & { pillars?: FourPillars } {
  try {
    if (
      !profile.birthDate ||
      !["male", "female"].includes(profile.gender)
    ) {
      return profile;
    }

    const saju = getSaju(
      profile.birthDate,
      profile.birthHour || "12",
      profile.birthMinute || "0",
      profile.calendarType ?? "solar",
      profile.gender as "male" | "female",
      Boolean(profile.birthTimeUnknown)
    );
    const dayPillar = `${saju.dayStem}${saju.dayBranch}`;

    return {
      ...profile,
      dayPillar,
      characterName:
        getDayPillarCharacterName(dayPillar) ?? profile.characterName,
      pillars: saju.pillars,
    };
  } catch (error) {
    console.error("친구 사주 재계산 오류:", error);
    return profile;
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const connectionId = new URL(request.url).searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: "친구 관계 ID가 없습니다." },
        { status: 400 }
      );
    }

    if (getProductionDataSource() === "postgres") {
      const result = await deleteFriendFromPostgres(
        connectionId,
        sessionUser.id
      );
      if (!result.ok) {
        return NextResponse.json(result.error.body, {
          status: result.error.status,
        });
      }
      return NextResponse.json(result.response);
    }

    const connections = await readConnections();
    const connection = connections.find((item) => item.id === connectionId);

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "친구 관계를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const canDelete =
      connection.ownerUserId === sessionUser.id ||
      connection.friendUserId === sessionUser.id;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "이 친구 관계를 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    await writeConnections(
      connections.filter((item) => item.id !== connectionId)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("친구 삭제 오류:", error);
    return NextResponse.json(
      { success: false, error: "친구를 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
