"use client";

import { useEffect, useState } from "react";

import HomeHero from "./HomeHero";
import HomeCards from "./HomeCards";

import type { UnlogUser } from "../../lib/user";
import type { TodayFortune } from "../../lib/todayFortune";

import { getSaju } from "../../lib/saju";
import { getTodaySaju } from "../../lib/today";
import { getTodayFortune } from "../../lib/todayFortune";

import {
  getTenGodForStem,
  getTenGodForBranch,
} from "../../lib/tenGodUtils";
import { personalizeTodayFortune } from "../../lib/todayFortunePersonalizer";
import { getHomeFortuneHeadline } from "../../lib/homeFortuneHeadline";
import { getLegacyDayStrength } from "../../lib/legacySajuAnalysis";

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
      title: "✏️ 학업운",
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

export default function HomeContent() {
  const [userName, setUserName] =
    useState("비회원");

  const [todayFortune, setTodayFortune] =
    useState<TodayFortune>(
      guestFortune
    );

  useEffect(() => {
    async function loadLoggedInUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json();
        if (data?.user?.name) {
          setUserName(data.user.name);
        }

        if (data?.user?.sajuProfile) {
          localStorage.setItem(
            "unlog-user",
            JSON.stringify({
              name: data.user.name,
              ...data.user.sajuProfile,
            })
          );
        }
      } catch (error) {
        console.error("로그인 사용자 확인 실패:", error);
      }
    }

    void loadLoggedInUser();
  }, []);

  useEffect(() => {
    /*
      실제 오늘의 일진
    */
    const todaySaju =
      getTodaySaju();

    console.log(
      "오늘의 일진:",
      todaySaju
    );

    /*
      회원정보
    */
    const savedUser =
      localStorage.getItem(
        "unlog-user"
      );

    if (!savedUser) {
      return;
    }

    try {
      const user: UnlogUser =
        JSON.parse(savedUser);

      if (user.name) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- existing local profile hydration updates client-only home state
        setUserName(user.name);
      }

      if (
        user.birthDate &&
        user.birthHour !== undefined &&
        user.birthMinute !== undefined &&
        user.calendarType &&
        user.gender
      ) {
        /*
          회원 사주
        */
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

        /*
          회원 일간 기준
          오늘 천간 십성
        */
        const todayStemTenGod =
          getTenGodForStem(
            sajuResult.dayStem,
            todaySaju.stem
          );

        /*
          회원 일간 기준
          오늘 지지 십성
        */
        const todayBranchTenGod =
          getTenGodForBranch(
            sajuResult.dayStem,
            todaySaju.branch
          );

        console.log(
          "오늘 천간 십성:",
          todayStemTenGod
        );

        console.log(
          "오늘 지지 십성:",
          todayBranchTenGod
        );

        /*
          오늘의 개인 운세
        */
        const baseFortune =
  getTodayFortune({
    dayStem: sajuResult.dayStem,
    fiveElements: sajuResult.fiveElements,
    strength:
      getLegacyDayStrength(sajuResult),
    todayStem: todaySaju.stem,
    todayBranch: todaySaju.branch,
    todayStemTenGod,
    todayBranchTenGod,
  });

const fortune =
  personalizeTodayFortune({
    fortune: baseFortune,
    tenGods: sajuResult.tenGods,
    fiveElements: sajuResult.fiveElements,
    strength:
      getLegacyDayStrength(sajuResult),
  });

setTodayFortune(fortune);

        console.log(
          "회원 사주 계산 결과:",
          sajuResult
        );

        console.log(
          "오늘의 운세 결과:",
          fortune
        );
      }
    } catch (error) {
      console.error(
        "회원 정보를 읽는 중 오류:",
        error
      );

      setUserName(
        "비회원"
      );

      setTodayFortune(
        guestFortune
      );
    }
  }, []);

  return (
    <>
      <HomeHero
        userName={userName}
        headline={
          getHomeFortuneHeadline(
            todayFortune.headline
          )
        }
      />

      <HomeCards
        fortunes={
          todayFortune.fortunes
        }
      />
    </>
  );
}
