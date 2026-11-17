"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import type { UnlogUser } from "../../lib/user";
import type { TodayFortune } from "../../lib/todayFortune";
import type { TodayCategoryScores } from "../../lib/todayFortuneCategoryScores";
import type { TodayFortuneDetailItem } from "../../lib/todayFortuneDetail";

import { getSaju } from "../../lib/saju";
import { getTodaySaju } from "../../lib/today";
import { getTodayFortune } from "../../lib/todayFortune";

import {
  getTenGodForStem,
  getTenGodForBranch,
} from "../../lib/tenGodUtils";

import { personalizeTodayFortune } from "../../lib/todayFortunePersonalizer";

import {
  calculateTodayCategoryScores,
} from "../../lib/todayFortuneCategoryScores";

import {
  calculateTodayFortuneScore,
} from "../../lib/todayFortuneScore";

import {
  getTodayFortuneDetails,
} from "../../lib/todayFortuneDetail";

import {
  getScoreAdjustedHeadline,
} from "../../lib/todayFortuneHeadline";
import { getHomeFortuneHeadline } from "../../lib/homeFortuneHeadline";

/*
  비회원 기본 운세
*/
const guestFortune: TodayFortune = {
  headline:
    "미뤄둔 일을 가볍게 시작해보기 좋은 날이에요.",

  tip:
    "계속 마음에 걸리던 일이 있다면 가장 작은 단계부터 시작해보세요.",

  fortunes: [
    {
      title: "❤️ 연애운",
      comment:
        "안부가 궁금한 사람에게 짧게 연락해보세요.",
    },

    {
      title: "💰 금전운",
      comment:
        "사고 싶은 것이 생기면 오늘 꼭 필요한지 먼저 확인해보세요.",
    },

    {
      title: "💼 직장운",
      comment:
        "오늘 끝내야 할 일부터 하나 골라 시작해보세요.",
    },

    {
      title: "📚 학업운",
      comment:
        "배울 내용을 조금만 나누어 첫 부분부터 읽어보세요.",
    },

    {
      title: "🍀 건강운",
      comment:
        "일정 사이에 잠깐이라도 쉬는 시간을 남겨두세요.",
    },
  ],
};

/*
  비회원 기본 분야별 점수
*/
const guestScores: TodayCategoryScores = {
  love: 75,
  money: 74,
  career: 76,
  study: 72,
  health: 70,
  people: 73,
};

/*
  비회원 기본 상세 운세
*/
const guestDetails: TodayFortuneDetailItem[] = [
  {
    title: "연애",
    icon: "💗",
    comment:
      "평소에는 그냥 넘기던 말도 오늘은 조금 다르게 들릴 수 있어요. 상대의 반응을 미리 단정하기보다 궁금한 부분을 직접 물으면 불필요한 오해를 줄이기 쉽습니다. 결론을 서두르지 말고 대화를 조금 더 이어가보세요.",
  },

  {
    title: "금전",
    icon: "💰",
    comment:
      "결제할 일이 겹치면 평소보다 돈이 빠르게 줄어든다고 느낄 수 있어요. 오늘 꼭 필요한 것과 며칠 미뤄도 되는 것을 나누면 선택이 한결 쉬워집니다. 자동 결제나 자주 쓰는 작은 금액부터 확인해보세요.",
  },

  {
    title: "직장",
    icon: "💼",
    comment:
      "해야 할 일이 한꺼번에 보이면 어디서부터 시작할지 망설일 수 있어요. 마감이 가까운 업무를 먼저 끝내면 뒤에 남은 일도 훨씬 수월하게 보입니다. 가장 중요한 업무 하나부터 처리해보세요.",
  },

  {
    title: "학업",
    icon: "📚",
    comment:
      "새로 배운 내용을 한꺼번에 외우려 하면 아는 부분까지 헷갈릴 수 있어요. 한 가지 개념을 내 말로 설명해보면 어디가 막혔는지 금방 드러납니다. 이해한 내용부터 짧게 써보거나 소리 내어 말해보세요.",
  },

  {
    title: "건강",
    icon: "🍀",
    comment:
      "하던 일을 끊지 않고 이어가다 보면 생각보다 빨리 지칠 수 있어요. 집중이 흐려지기 전에 잠깐 자리를 비우면 남은 일정도 덜 버겁게 느껴집니다. 다음 일을 시작하기 전에 짧게라도 쉬어가세요.",
  },

  {
    title: "대인",
    icon: "🤝",
    comment:
      "가볍게 시작한 대화에서 서로 비슷하게 생각하던 부분을 발견할 수 있어요. 내 이야기를 서둘러 꺼내기보다 상대의 말을 끝까지 들으면 대화가 더 편안하게 이어집니다. 안부나 근황처럼 부담 없는 이야기부터 시작해보세요.",
  },
];

export default function TodayContent() {
  const router = useRouter();

  const [userName, setUserName] =
    useState("비회원");

  const [fortune, setFortune] =
    useState<TodayFortune>(
      guestFortune
    );

  const [score, setScore] =
    useState(80);

  const [
    categoryScores,
    setCategoryScores,
  ] =
    useState<TodayCategoryScores>(
      guestScores
    );

  const [
    detailItems,
    setDetailItems,
  ] =
    useState<
      TodayFortuneDetailItem[]
    >(guestDetails);

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "unlog-user"
      );

    if (!savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- existing local guest hydration initializes the client-only fortune view
      setUserName("비회원");
      setFortune(guestFortune);
      setScore(80);
      setCategoryScores(
        guestScores
      );
      setDetailItems(
        guestDetails
      );

      return;
    }

    try {
      const user: UnlogUser =
        JSON.parse(savedUser);

      /*
        회원 이름
      */
      if (user.name) {
        setUserName(user.name);
      }

      /*
        사주 정보가 모두 있을 때만
        개인 운세 계산
      */
      if (
        user.birthDate &&
        user.birthHour !== undefined &&
        user.birthMinute !== undefined &&
        user.calendarType &&
        user.gender
      ) {
        /*
          1. 회원 사주 계산
        */
        const sajuResult =
          getSaju(
            user.birthDate,
            String(user.birthHour),
            String(user.birthMinute),
            user.calendarType,
            user.gender,
            Boolean(user.birthTimeUnknown)
          );

        /*
          2. 오늘 일진
        */
        const todaySaju =
          getTodaySaju();

        /*
          3. 오늘 천간 십성
        */
        const todayStemTenGod =
          getTenGodForStem(
            sajuResult.dayStem,
            todaySaju.stem
          );

        /*
          4. 오늘 지지 십성
        */
        const todayBranchTenGod =
          getTenGodForBranch(
            sajuResult.dayStem,
            todaySaju.branch
          );

        /*
          5. 기본 오늘 운세
        */
        const baseFortune =
          getTodayFortune({
            dayStem:
              sajuResult.dayStem,

            fiveElements:
              sajuResult
                .fiveElements,

            strength:
              sajuResult
                .advanced
                .dayStrength
                .strength,

            todayStem:
              todaySaju.stem,

            todayBranch:
              todaySaju.branch,

            todayStemTenGod,

            todayBranchTenGod,
          });

        /*
          6. 회원 원국 개인화
        */
        const personalizedFortune =
          personalizeTodayFortune({
            fortune:
              baseFortune,

            tenGods:
              sajuResult.tenGods,

            fiveElements:
              sajuResult
                .fiveElements,

            strength:
              sajuResult
                .advanced
                .dayStrength
                .strength,
          });

        /*
          7. 분야별 점수 먼저 계산
        */
        const scores =
          calculateTodayCategoryScores({
            todayStemTenGod,

            todayBranchTenGod,

            fiveElements:
              sajuResult
                .fiveElements,

            strength:
              sajuResult
                .advanced
                .dayStrength
                .strength,
          });

        setCategoryScores(
          scores
        );

        /*
          8. 분야별 점수를 종합해서
             오늘 전체 점수 계산
        */
        const todayScore =
          calculateTodayFortuneScore({
            scores,
          });

        setScore(
          todayScore
        );

        /*
          9. 총점에 따라
             메인 한 줄 문구 보정

          80점 이상이면
          조금 더 긍정적인 톤으로 변경
        */
        const adjustedHeadline =
          getScoreAdjustedHeadline(
            personalizedFortune.headline,
            todayScore
          );

        /*
          최종 운세 저장
        */
        setFortune({
          ...personalizedFortune,

          headline:
            adjustedHeadline,
        });

        /*
          10. 분야별 점수를 반영한
              상세 운세 생성
        */
        const details =
          getTodayFortuneDetails({
            todayStemTenGod,

            todayBranchTenGod,

            strength:
              sajuResult
                .advanced
                .dayStrength
                .strength,

            scores,
          });

        setDetailItems(
          details
        );

        /*
          개발 확인용
        */
        console.log(
          "오늘 천간 십성:",
          todayStemTenGod
        );

        console.log(
          "오늘 지지 십성:",
          todayBranchTenGod
        );

        console.log(
          "오늘 분야별 점수:",
          scores
        );

        console.log(
          "오늘 전체 점수:",
          todayScore
        );

        console.log(
          "기존 headline:",
          personalizedFortune.headline
        );

        console.log(
          "최종 headline:",
          adjustedHeadline
        );

        console.log(
          "오늘 상세 운세:",
          details
        );
      }
    } catch (error) {
      console.error(
        "오늘의 운세 상세 페이지 오류:",
        error
      );

      setUserName(
        "비회원"
      );

      setFortune(
        guestFortune
      );

      setScore(80);

      setCategoryScores(
        guestScores
      );

      setDetailItems(
        guestDetails
      );
    }
  }, []);

  /*
    분야별 게이지 데이터
  */
  const scoreItems = [
    {
      label: "연애",
      icon: "💗",
      score:
        categoryScores.love,
      bar:
        "bg-[#F06FA6]",
    },

    {
      label: "금전",
      icon: "💰",
      score:
        categoryScores.money,
      bar:
        "bg-[#FFC647]",
    },

    {
      label: "직장",
      icon: "💼",
      score:
        categoryScores.career,
      bar:
        "bg-[#FF8A4C]",
    },

    {
      label: "학업",
      icon: "📚",
      score:
        categoryScores.study,
      bar:
        "bg-[#A98BFA]",
    },

    {
      label: "건강",
      icon: "🍀",
      score:
        categoryScores.health,
      bar:
        "bg-[#52CEA0]",
    },

    {
      label: "대인",
      icon: "🤝",
      score:
        categoryScores.people,
      bar:
        "bg-[#6EA8F7]",
    },
  ];

  return (
    <section className="relative z-10 space-y-4 px-5 pb-32 pt-[10px]">

      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }

          router.push("/");
        }}
        className="!mb-[4px] flex h-9 items-center gap-1 rounded-full px-1 pr-3 text-[14px] font-bold text-[#312B68] transition active:bg-white/30"
        aria-label="이전 화면으로 돌아가기"
      >
        <ChevronLeft size={21} strokeWidth={2} />
        뒤로
      </button>

      {/* =========================
          첫 번째 박스
          총운 + 점수
      ========================== */}
      <div className="rounded-[28px] border border-[#E7E4F3] bg-white px-6 py-6 shadow-sm">

        {/* 상단 제목 + 총점 */}
        <div className="flex items-center justify-between gap-4">

          {/* 왼쪽 제목 */}
          <div className="min-w-0 flex-1">

            <p className="text-[11px] font-medium leading-none tracking-[0.03em] text-[#A7A7B3]">
              Fortune of today
            </p>

            <h1 className="mt-[2px] break-keep text-[17px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#18145B]">

              <span className="text-[#7047FF]">
                {userName}
              </span>

              님의 오늘의 운세
            </h1>
          </div>

          {/* 오른쪽 총점 */}
          <div className="flex shrink-0 items-end">

            {/* 숫자 */}
            <span className="text-[36px] font-extrabold leading-none tracking-[-0.04em] text-[#7047FF]">
              {score}
            </span>

            {/* 점 */}
            <span className="mb-[3px] ml-[2px] text-[16px] font-extrabold text-[#18145B]">
              점
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="my-5 h-px bg-[#EEEAF8]" />

        {/* 오늘의 메인 한 줄 */}
        <p className="mx-auto w-full max-w-[260px] break-keep text-center text-[20px] font-extrabold leading-[1.5] tracking-[-0.025em] text-[#18145B]">
          {getHomeFortuneHeadline(
            fortune.headline
          )}
        </p>

        {/* 분야별 점수 */}
        <div className="mt-7 space-y-[15px]">

          {scoreItems.map(
            (item) => (
              <div
                key={item.label}
                className="flex items-center gap-[10px]"
              >

                {/* 아이콘 + 분야명 */}
                <div className="flex w-[64px] shrink-0 items-center gap-[6px]">

                  <span className="text-[15px]">
                    {item.icon}
                  </span>

                  <span className="text-[13px] font-medium text-[#5E5E68]">
                    {item.label}
                  </span>
                </div>

                {/* 게이지 바 */}
                <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#F1F1F4]">

                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{
                      width:
                        `${item.score}%`,
                    }}
                  />
                </div>

                {/* 분야별 점수 */}
                <span className="w-[28px] shrink-0 text-right text-[13px] font-bold text-[#30303A]">
                  {item.score}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* =========================
          두 번째 박스
          분야별 상세 운세
      ========================== */}
      <div className="rounded-[28px] border border-[#E7E4F3] bg-white px-6 py-6 shadow-sm">

        <p className="text-[14px] font-extrabold text-[#4E36D8]">
          오늘의 운세 리포트
        </p>

        <div className="mt-4">

          {detailItems.map(
            (item, index) => (
              <div
                key={item.title}
                className={
                  index === 0
                    ? "pb-6"
                    : "border-t border-[#EEEAF8] py-6"
                }
              >

                {/* 분야 제목 */}
                <div className="flex items-center gap-[7px]">

                  <span className="text-[16px]">
                    {item.icon}
                  </span>

                  <p className="text-[14px] font-bold text-[#4E36D8]">
                    {item.title}
                  </p>
                </div>

                {/* 상세 내용 */}
                <p className="mt-[10px] break-keep pl-[23px] text-[14px] font-normal leading-[1.85] text-[#1C1F22]">
                  {item.comment}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
