"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import type { UnlogUser } from "../../lib/user";
import { getSaju } from "../../lib/saju";
import { getDayPillarCharacterName } from "../../lib/dayPillarCharacter";

type MyUser = {
  id: string;
  name: string;
  provider: "kakao" | "naver" | "google";
};

type SajuSummary = {
  dayPillarName: string;
  birthLabel: string;
  timeLabel: string;
};

const providerLabels: Record<MyUser["provider"], string> = {
  kakao: "카카오로 로그인 중",
  naver: "네이버로 로그인 중",
  google: "Google로 로그인 중",
};

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<MyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sajuSummary, setSajuSummary] = useState<SajuSummary | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data?.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user as MyUser);

        const savedSajuUser = localStorage.getItem("unlog-user");
        const accountSajuProfile = data.user.sajuProfile;

        if (accountSajuProfile || savedSajuUser) {
          try {
            const sajuUser = accountSajuProfile
              ? ({
                  name: data.user.name,
                  ...accountSajuProfile,
                } as UnlogUser)
              : (JSON.parse(savedSajuUser as string) as UnlogUser);

            if (
              sajuUser.birthDate &&
              sajuUser.birthHour !== undefined &&
              sajuUser.birthMinute !== undefined &&
              sajuUser.calendarType &&
              sajuUser.gender
            ) {
              const saju = getSaju(
                sajuUser.birthDate,
                String(sajuUser.birthHour),
                String(sajuUser.birthMinute),
                sajuUser.calendarType,
                sajuUser.gender,
                Boolean(sajuUser.birthTimeUnknown)
              );
              const dayPillarName = getDayPillarCharacterName(
                `${saju.dayStem}${saju.dayBranch}`
              );
              const [year, month, day] = sajuUser.birthDate
                .split("-")
                .map(Number);
              const hourBranch = saju.pillars.hour.slice(-1);
              const timeLabel = sajuUser.birthTimeUnknown
                ? "시간모름"
                : `${hourBranch}시`;

              if (dayPillarName && year && month && day) {
                setSajuSummary({
                  dayPillarName,
                  birthLabel: `${
                    sajuUser.calendarType === "solar" ? "양력" : "음력"
                  } | ${year}. ${month}. ${day}`,
                  timeLabel,
                });
              }
            }
          } catch (error) {
            console.error("마이페이지 사주 정보 확인 실패:", error);
          }
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("로그아웃 요청에 실패했습니다.");
      }

      localStorage.removeItem("unlog-user-id");
      localStorage.removeItem("unlog-account");
      localStorage.removeItem("unlog-user");
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.");
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-full bg-[#F5F2FF]">
      <div className="mx-auto min-h-full w-full bg-[#F8F7FC] pb-10">
        <header className="hidden">
          <Link
            href="/"
            aria-label="홈으로 돌아가기"
            className="absolute left-4 flex h-9 w-9 items-center justify-center text-[#6656C9]"
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </Link>
          <h1 className="text-[18px] font-extrabold tracking-[0.08em] text-[#241B63]">
            MY
          </h1>
        </header>

        <div className="px-5 pt-6">
          <section className="px-1 py-3">
            {loading ? (
              <div className="flex min-h-[112px] items-center justify-center text-[14px] font-medium text-[#918B99]">
                사용자 정보를 불러오고 있어요.
              </div>
            ) : user ? (
              <div className="flex min-h-[112px] items-center gap-4">
                <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-white">
                  <Image
                    src="/image/home/mouse_character_men.png"
                    alt="운로그 캐릭터"
                    width={120}
                    height={120}
                    priority
                    className="h-auto w-[72px] object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#7057D8]">
                    {sajuSummary?.dayPillarName ?? "일주 정보 없음"}
                  </p>
                  <p className="mt-1 truncate text-[21px] font-extrabold tracking-[-0.03em] text-[#241B63]">
                    {user.name}
                  </p>
                  {sajuSummary && (
                    <p className="mt-1 text-[12px] font-medium text-[#918B99]">
                      {sajuSummary.birthLabel} |{" "}
                      <span
                        style={{
                          fontFamily:
                            '"Malgun Gothic", "Microsoft YaHei", "Noto Sans CJK KR", sans-serif',
                        }}
                      >
                        {sajuSummary.timeLabel}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <section className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(77,60,138,0.06)]">
            <div className="border-b border-[#EEEAF4] px-5 py-4">
              <h2 className="text-[15px] font-extrabold text-[#393344]">계정</h2>
            </div>
            <div className="flex items-center justify-between px-5 py-5">
              <span className="text-[14px] font-medium text-[#393344]">로그인 계정</span>
              <span className="text-[13px] font-medium text-[#918B99]">
                {user ? providerLabels[user.provider] : "확인 중"}
              </span>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(77,60,138,0.06)]">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut || !user}
              className="flex w-full items-center justify-between px-5 py-5 text-left disabled:opacity-50"
            >
              <span className="text-[14px] font-bold text-[#393344]">
                {loggingOut ? "로그아웃 중" : "로그아웃"}
              </span>
              <LogOut size={19} strokeWidth={1.8} className="text-[#918B99]" />
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
