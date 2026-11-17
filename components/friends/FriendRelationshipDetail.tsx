"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ChevronLeft } from "lucide-react";

import type { UnlogUser } from "../../lib/user";
import type { FriendRelationshipResult } from "../../lib/friendRelationship";
import type { FourPillars } from "../../lib/friendRelationship";

import { getSaju } from "../../lib/saju";
import { getTodaySaju } from "../../lib/today";
import { getFriendRelationship } from "../../lib/friendRelationship";

type TodayChemistryCopy = {
  headline: string;
  body: string;
  advice: string;
};

function getDayPillarCharacterName(
  dayPillar: string
) {
  const stem =
    dayPillar.charAt(0);

  const branch =
    dayPillar.charAt(1);

  const stemColor: Record<
    string,
    string
  > = {
    갑: "푸른",
    을: "푸른",

    병: "붉은",
    정: "붉은",

    무: "황금",
    기: "황금",

    경: "하얀",
    신: "하얀",

    임: "검은",
    계: "검은",
  };

  const branchAnimal: Record<
    string,
    string
  > = {
    자: "쥐",
    축: "소",
    인: "호랑이",
    묘: "토끼",
    진: "용",
    사: "뱀",
    오: "말",
    미: "양",
    신: "원숭이",
    유: "닭",
    술: "개",
    해: "돼지",
  };

  const color =
    stemColor[stem] ?? "";

  const animal =
    branchAnimal[branch] ?? "";

  return `${color} ${animal}`.trim();
}

export function getTodayChemistryCopy(
  score: number
): TodayChemistryCopy {
  if (score >= 90) {
    return {
      headline:
        "같이 정한 일이 예상보다 쉽게 맞아가는 날이에요.",

      body:
        "말을 길게 설명하지 않아도 서로 무엇을 원하는지 빠르게 알아차리기 쉬운 날이에요.\n한 사람이 먼저 약속이나 계획을 꺼내면 다른 사람도 편하게 의견을 보탤 수 있어, 함께 결정해야 할 일이 예상보다 수월하게 풀릴 수 있습니다. 다만 대화가 잘 통한다고 해서 세부적인 생각까지 모두 같지는 않을 수 있으니, 시간이나 비용처럼 중요한 부분은 짧게라도 확인해두는 편이 좋습니다.",

      advice:
        "거창한 계획을 만들기보다 두 사람 모두 편하게 즐길 수 있는 일을 하나 골라 함께해보세요.",
    };
  }

  if (score >= 85) {
    return {
      headline:
        "서로 다른 방식이 오히려 도움이 되는 날이에요.",

      body:
        "한 사람이 먼저 움직이면 다른 사람이 놓친 부분을 채워주기 쉬운 날이에요.\n일을 시작하는 순서나 결정을 내리는 속도가 달라도 오늘은 그 차이가 서로에게 도움이 될 수 있습니다. 의견이 갈리는 순간에는 누가 맞는지를 따지기보다, 상대가 무엇을 먼저 챙기려는지 들어보면 접점을 찾기 쉬워요.",

      advice:
        "함께 결정할 일이 있다면 각자 가장 중요하게 보는 조건부터 말해보는 편이 좋습니다.",
    };
  }

  if (score >= 80) {
    return {
      headline:
        "익숙한 대화가 유난히 편안하게 느껴지는 날이에요.",

      body:
        "평소처럼 나누는 짧은 대화만으로도 서로가 편하게 느껴질 수 있는 날이에요.\n상대의 반응에 숨은 뜻을 찾기보다 들은 그대로 받아들이면 불필요한 오해를 줄일 수 있습니다. 다만 익숙하다는 이유로 표현을 아끼면 마음이 전달되지 않을 수 있으니, 고마웠던 일은 짧게라도 말해두는 편이 좋아요.",

      advice:
        "특별한 이벤트를 만들기보다 안부를 묻고 편하게 시간을 보내는 것만으로도 충분합니다.",
    };
  }

  if (score >= 72) {
    return {
      headline:
        "짧은 연락만으로도 서로의 자리를 확인하는 날이에요.",

      body:
        "오래 이야기하지 않아도 서로 부담 없이 안부를 주고받기 좋은 날이에요.\n각자 할 일을 지키면서 필요한 순간에 도움을 건네면 관계가 더 편안해질 수 있습니다. 익숙한 사이라도 상대가 내 마음을 모두 알 수는 없으니, 바라는 일이 있다면 추측을 기다리기보다 직접 말하는 편이 좋아요.",

      advice:
        "관계를 특별하게 만들려 애쓰기보다, 생각났을 때 짧게 안부를 건네는 정도가 잘 맞습니다.",
    };
  }

  if (score >= 65) {
    return {
      headline:
        "같은 일을 보고도 전혀 다른 이야기가 나올 수 있는 날이에요.",

      body:
        "같은 상황을 두고도 서로 먼저 보는 부분이 달라 대화가 뜻밖의 방향으로 이어질 수 있어요.\n평소에 나누지 않던 이야기를 꺼내거나 새로운 장소에 함께 가보면 상대의 몰랐던 면을 발견할 수 있습니다. 다만 내 방식이 익숙하다는 이유로 상대의 반응을 틀렸다고 받아들이면 대화가 금세 막힐 수 있으니, 왜 그렇게 생각했는지 먼저 물어보는 편이 좋습니다.",

      advice:
        "생각이 다를 때 바로 맞추려 하기보다, 서로 어떤 점을 다르게 봤는지부터 이야기해보세요.",
    };
  }

  return {
    headline:
      "말은 같은데 받아들이는 속도가 다를 수 있는 날이에요.",

    body:
      "내가 바로 답을 원하는 순간에도 상대는 생각을 정리할 시간이 필요할 수 있어요.\n표현하는 방식이 달라 처음에는 어색하게 느껴질 수 있지만, 무엇이 불편했는지 차분히 묻다 보면 상대가 중요하게 여기는 부분도 알 수 있습니다. 반응이 다르다는 이유만으로 마음까지 다르다고 결론 내리지는 않는 편이 좋아요.",

    advice:
      "바로 결론을 내리기보다 상대가 말을 끝낼 때까지 들어주면 어색함을 줄이기 쉽습니다.",
  };
}

export default function FriendRelationshipDetail() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const friendName =
    searchParams.get("name") ??
    "친구";

  const friendDayPillar =
    searchParams.get(
      "dayPillar"
    ) ?? "";

  const friendImage =
    searchParams.get("image") ??
    "/image/friends/mouse_character_men.png";

  const friendPillarsParam = searchParams.get("pillars");
  const friendPillars = useMemo(() => {
    try {
      return friendPillarsParam
        ? (JSON.parse(friendPillarsParam) as FourPillars)
        : undefined;
    } catch {
      return undefined;
    }
  }, [friendPillarsParam]);

  const [
    relationship,
    setRelationship,
  ] =
    useState<FriendRelationshipResult | null>(
      null
    );

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "unlog-user"
      );

    let myDayPillar =
      "갑자";
    let myPillars: FourPillars | undefined;

    if (savedUser) {
      try {
        const user: UnlogUser =
          JSON.parse(savedUser);

        if (
          user.birthDate &&
          user.birthHour !== undefined &&
          user.birthMinute !== undefined &&
          user.calendarType &&
          user.gender
        ) {
          const sajuResult =
            getSaju(
              user.birthDate,
              String(
                user.birthHour
              ),
              String(
                user.birthMinute
              ),
              user.calendarType,
              user.gender,
              Boolean(user.birthTimeUnknown)
            );

          myDayPillar =
            `${sajuResult.dayStem}${sajuResult.dayBranch}`;
          myPillars = sajuResult.pillars;
        }
      } catch (error) {
        console.error(
          "사용자 사주 계산 오류:",
          error
        );
      }
    }

    if (!friendDayPillar) {
      return;
    }

    const todaySaju =
      getTodaySaju();

    const result =
      getFriendRelationship({
        myDayPillar,

        friendDayPillar,

        myPillars,

        friendPillars,

        todayStem:
          todaySaju.stem,

        todayBranch:
          todaySaju.branch,
      });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived relationship state is refreshed when route-backed friend data changes
    setRelationship(
      result
    );
  }, [friendDayPillar, friendPillars]);

  const detail =
    relationship
      ? getTodayChemistryCopy(
          relationship.todayChemistryScore
        )
      : null;

  const characterName =
    getDayPillarCharacterName(
      friendDayPillar
    );

  return (
    <main className="min-h-full bg-[#F5F2FF] pb-12">

      {/* 상단 헤더 */}
      <header
        className="
          sticky
          top-0
          z-30
          border-b
          border-[#ECE7FA]
          bg-white/95
          backdrop-blur-md
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[58px]
            max-w-[480px]
            items-center
            px-4
          "
        >
          <button
            type="button"
            onClick={() => {
              router.back();
            }}
            className="
              flex
              h-[36px]
              w-[36px]
              items-center
              justify-center
              rounded-full
              text-[#29243E]
            "
          >
            <ChevronLeft
              size={22}
            />
          </button>

          <h1
            className="
              ml-1
              text-[16px]
              font-extrabold
              tracking-[-0.02em]
              text-[#18145B]
            "
          >
            오늘의 궁합
          </h1>
        </div>
      </header>

      {/* 본문 */}
      <div
        className="
          mx-auto
          max-w-[480px]
          px-4
          py-5
        "
      >
        {!relationship ||
        !detail ? (
          <div
            className="
              rounded-[28px]
              bg-white
              px-5
              py-10
              text-center
              shadow-sm
            "
          >
            <p className="text-[14px] font-medium text-[#77727F]">
              오늘의 궁합을 살펴보고 있어요...
            </p>
          </div>
        ) : (
          <section
            className="
              rounded-[28px]
              border
              border-[#E4DCF7]
              bg-white
              px-5
              pb-6
              pt-6
              shadow-sm
            "
          >
            {/* 상단 요약 */}
            <div className="text-center">

              {/* 캐릭터 */}
              <div className="flex justify-center">
                <div
                  className="
                    flex
                    h-[86px]
                    w-[86px]
                    items-center
                    justify-center
                    rounded-[28px]
                    bg-[#F2EDFF]
                  "
                >
                  <Image
                    src={
                      friendImage
                    }
                    alt={`${friendName} 캐릭터`}
                    width={78}
                    height={78}
                    className="
                      h-[78px]
                      w-[78px]
                      object-contain
                    "
                  />
                </div>
              </div>

              {/* 일주 캐릭터명 */}
              <p
                className="
                  mt-4
                  text-[13px]
                  font-semibold
                  tracking-[-0.02em]
                  text-[#8A7BBC]
                "
              >
                {characterName}
              </p>

              {/* 제목 */}
              <h2
                className="
                  mt-[3px]
                  text-[21px]
                  font-extrabold
                  tracking-[-0.03em]
                  text-[#18145B]
                "
              >
                <span className="text-[#7047FF]">
                  {friendName}님
                </span>
                과 오늘의 궁합
              </h2>

              {/* 점수 */}
              <div
                className="
                  mt-4
                  flex
                  items-end
                  justify-center
                "
              >
                <span
                  className="
                    text-[44px]
                    font-extrabold
                    leading-none
                    tracking-[-0.05em]
                    text-[#7047FF]
                  "
                >
                  {
                    relationship.todayChemistryScore
                  }
                </span>

                <span
                  className="
                    mb-[4px]
                    ml-[3px]
                    text-[15px]
                    font-bold
                    text-[#242033]
                  "
                >
                  점
                </span>
              </div>

            </div>

            {/* 구분선 */}
            <div className="my-6 h-px bg-[#EEEAF5]" />

            {/* 오늘 총평 */}
            <div
              className="
                mb-6
                flex
                justify-center
              "
            >
              <p
                className="
                  max-w-[290px]
                  break-keep
                  text-center
                  text-[17px]
                  font-semibold
                  leading-[1.65]
                  tracking-[-0.025em]
                  text-[#302B3B]
                "
              >
                {detail.headline}
              </p>
            </div>

            {/* 오늘의 궁합 설명 */}
            <div>
              <h3
                className="
                  text-[15px]
                  font-extrabold
                  text-[#4E36D8]
                "
              >
                두 사람의 궁합 흐름
              </h3>

              <p
                className="
                  mt-2
                  break-keep
                  whitespace-pre-line
                  text-[15px]
                  font-normal
                  leading-[1.9]
                  text-[#3F3A46]
                "
              >
                {detail.body}
              </p>
            </div>

            {/* 구분선 */}
            <div className="my-6 h-px bg-[#EEEAF5]" />

            {/* 오늘의 관계 Tip */}
            <div
              className="
                rounded-[20px]
                bg-[#F3EFFF]
                px-4
                py-4
              "
            >
              <h3
                className="
                  text-[15px]
                  font-extrabold
                  text-[#4E36D8]
                "
              >
                오늘의 관계 Tip
              </h3>

              <p
                className="
                  mt-2
                  break-keep
                  text-[15px]
                  font-medium
                  leading-[1.85]
                  text-[#393344]
                "
              >
                {detail.advice}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
