import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { getSessionUser } from "../../../../lib/auth/session";
import { getProductionDataSource } from "../../../../lib/dataSource/config";
import { getOrCreateInviteFromPostgres } from "../../../../lib/dataSource/postgresFriendService";

type InviteRecord = {
  code: string;
  ownerId: string;
  createdAt: string;
};

const dataDirectory = path.join(
  process.cwd(),
  "data"
);

const dataPath = path.join(
  dataDirectory,
  "friend-invites.json"
);

/* ========================================
   데이터 파일 보장
======================================== */

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, {
    recursive: true,
  });

  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(
      dataPath,
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
  await ensureDataFile();

  try {
    const raw =
      await fs.readFile(
        dataPath,
        "utf-8"
      );

    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "초대 데이터 읽기 오류:",
      error
    );

    return [];
  }
}

/* ========================================
   초대 데이터 저장
======================================== */

async function writeInvites(
  invites: InviteRecord[]
) {
  await ensureDataFile();

  await fs.writeFile(
    dataPath,
    JSON.stringify(
      invites,
      null,
      2
    ),
    "utf-8"
  );
}

/* ========================================
   ownerId 기준 고정 초대 링크 생성 / 조회

   이미 있으면 기존 code 반환
   없으면 새 code 생성
======================================== */

export async function POST() {
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

    const ownerId = sessionUser.id;

    if (getProductionDataSource() === "postgres") {
      return NextResponse.json(await getOrCreateInviteFromPostgres(ownerId));
    }

    const invites =
      await readInvites();

    /* ========================================
       기존 초대 링크 확인
    ======================================== */

    const existingInvite =
      invites.find(
        (invite) =>
          invite.ownerId === ownerId
      );

    if (existingInvite) {
      console.log(
        "✅ 기존 고정 초대 코드 반환:",
        existingInvite
      );

      return NextResponse.json({
        success: true,
        code:
          existingInvite.code,
        isNew: false,
      });
    }

    /* ========================================
       초대 링크가 없을 때만 새로 생성
    ======================================== */

    let code = "";

    /*
      혹시 같은 코드가 생성되는 경우를 막기 위해
      기존 code와 겹치지 않을 때까지 생성
    */

    do {
      code =
        randomBytes(4)
          .toString("hex");
    } while (
      invites.some(
        (invite) =>
          invite.code === code
      )
    );

    const newInvite: InviteRecord =
      {
        code,

        ownerId,

        createdAt:
          new Date().toISOString(),
      };

    invites.push(
      newInvite
    );

    await writeInvites(
      invites
    );

    console.log(
      "✅ 새 고정 초대 코드 생성:",
      newInvite
    );

    return NextResponse.json({
      success: true,
      code,
      isNew: true,
    });
  } catch (error) {
    console.error(
      "❌ 초대 코드 생성 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "초대 코드 생성 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
