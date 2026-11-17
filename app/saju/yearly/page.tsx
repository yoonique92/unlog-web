"use client";

import { ChevronLeft, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import YearlyFortunePreview from "../../../components/saju/YearlyFortunePreview";
import YearlyFortuneUnlock from "../../../components/saju/YearlyFortuneUnlock";
import YearlyFortuneYearPicker, {
  createYearRange,
  getRecommendedYear,
} from "../../../components/saju/YearlyFortuneYearPicker";
import type { UnlogUser } from "../../../lib/user";
import {
  CAREER_SITUATIONS,
  LOVE_SITUATIONS,
  parseYearlyReadingContext,
  type CareerSituationKey,
  type LoveSituationKey,
} from "../../../lib/yearlyReadingContext";

type AuthMeResponse = {
  success: true;
  user: {
    id: string;
    name: string;
    provider: "kakao" | "naver" | "google";
    sajuProfile: {
      name?: string;
      birthDate: string;
      birthHour: number;
      birthMinute: number;
      birthTimeUnknown: boolean;
      calendarType: "solar" | "lunar";
      gender: "male" | "female";
    } | null;
  };
};

type ProfilePhase = "loading" | "ready" | "missing" | "error";

type SituationOption<Key extends string> = {
  readonly key: Key;
  readonly label: string;
};

type SituationSelectorProps<Key extends string> = {
  title: string;
  description?: string;
  options: readonly SituationOption<Key>[];
  selectedKey: Key | null;
  onSelect: (key: Key) => void;
};

function SituationSelector<Key extends string>({
  title,
  description,
  options,
  selectedKey,
  onSelect,
}: SituationSelectorProps<Key>) {
  return (
    <section aria-label={title}>
      <h3 className="text-left text-[15px] font-bold text-[#30286D]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 break-keep text-left text-[12px] font-normal leading-5 text-[#817A92]">
          {description}
        </p>
      )}
      <div
        role="radiogroup"
        aria-label={title}
        className="mt-3 grid grid-cols-2 gap-2.5"
      >
        {options.map((option) => {
          const isSelected = selectedKey === option.key;

          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.key)}
              className={`flex h-12 min-w-0 items-center justify-center rounded-[15px] border px-3 py-1 text-center text-[13px] leading-4 transition active:scale-[0.99] ${
                isSelected
                  ? "border-[#6656C9] bg-[#EEE9FF] font-bold text-[#4A3FAA]"
                  : "border-[#E3DDF1] bg-white font-semibold text-[#4F4865]"
              }`}
            >
              <span className="break-keep">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function parseYear(value: string | null, minimum: number, maximum: number) {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= minimum && year <= maximum
    ? year
    : null;
}

type YearlyFortuneFlowProps = {
  currentYear: number;
  recommendedYear: number;
  queryYear: number | null;
  previewContext: ReturnType<typeof parseYearlyReadingContext>;
};

function YearlyFortuneFlow({
  currentYear,
  recommendedYear,
  queryYear,
  previewContext,
}: YearlyFortuneFlowProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(
    queryYear ?? recommendedYear
  );
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const [settledYear, setSettledYear] = useState<number | null>(null);
  const [profilePhase, setProfilePhase] = useState<ProfilePhase>("loading");
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [canonicalUser, setCanonicalUser] = useState<UnlogUser | null>(null);
  const [loveSituation, setLoveSituation] = useState<LoveSituationKey | null>(null);
  const [careerSituation, setCareerSituation] =
    useState<CareerSituationKey | null>(null);
  const activeYear = pendingYear ?? queryYear;
  const isPreviewFlow = previewContext !== null;

  useEffect(() => {
    if (queryYear !== null && !isPreviewFlow) return;

    const controller = new AbortController();

    async function loadCanonicalProfile() {
      setProfilePhase("loading");

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const data = (await response.json()) as AuthMeResponse;
        if (!response.ok || data.success !== true || !data.user) {
          throw new Error("사주 정보를 불러오지 못했어요.");
        }

        const profile = data.user.sajuProfile;
        if (!profile) {
          setCanonicalUser(null);
          setProfilePhase("missing");
          return;
        }

        setCanonicalUser({
          name: data.user.name,
          birthDate: profile.birthDate,
          birthHour: profile.birthHour,
          birthMinute: profile.birthMinute,
          birthTimeUnknown: profile.birthTimeUnknown,
          calendarType: profile.calendarType,
          gender: profile.gender,
        });
        setProfilePhase("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCanonicalUser(null);
        setProfilePhase("error");
      }
    }

    void loadCanonicalProfile();
    return () => controller.abort();
  }, [isPreviewFlow, profileReloadKey, queryYear, router]);

  const viewSelectedYear = () => {
    if (!loveSituation || !careerSituation) return;

    setPendingYear(selectedYear);
    setSettledYear(null);
    const params = new URLSearchParams({
      year: String(selectedYear),
      love: loveSituation,
      career: careerSituation,
    });
    router.push(`/saju/yearly?${params}`, { scroll: false });
  };

  const isLoading = activeYear !== null && settledYear !== activeYear;

  return (
    <main
      className={`min-h-full ${
        activeYear === null ? "bg-white" : "bg-[#F5F2FF]"
      }`}
    >
      <div
        className={`mx-auto w-full pb-12 ${
          activeYear === null
            ? "yearly-selection-background min-h-[100dvh] bg-white"
            : "min-h-full bg-gradient-to-b from-[#E8E3FF] to-[#F8F7FC]"
        }`}
        style={
          activeYear === null
            ? {
                backgroundImage:
                  'url("/image/saju/신년운세_배경화면_01.png")',
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% auto",
              }
            : undefined
        }
      >
        <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[#E3DFF0] bg-white/95 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="사주보기로 돌아가기"
            className="absolute left-4 flex h-9 w-9 items-center justify-center text-[#30286D]"
          >
            <ChevronLeft size={23} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-extrabold text-[#20185B]">
            {previewContext ? `${previewContext.year}년 운세` : "신년운세"}
          </h1>
        </header>

        {activeYear === null ? (
          <>
            {profilePhase === "loading" && (
              <section
                role="status"
                className="mx-5 mt-5 rounded-[24px] bg-white px-5 py-12 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
              >
                <p className="text-[13px] font-medium text-[#8C8598]">
                  사주 정보를 불러오고 있어요
                </p>
              </section>
            )}

            {profilePhase === "error" && (
              <section
                role="alert"
                className="mx-5 mt-5 rounded-[24px] bg-white px-5 py-9 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
              >
                <p className="text-[13px] font-medium text-[#6E6879]">
                  사주 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setProfileReloadKey((current) => current + 1)}
                  className="mt-4 h-11 rounded-[16px] bg-[#6656C9] px-5 text-[13px] font-bold text-white"
                >
                  다시 불러오기
                </button>
              </section>
            )}

            {profilePhase === "missing" && (
              <section className="mx-5 mt-5 rounded-[24px] bg-white px-5 py-9 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]">
                <p className="text-[13px] font-medium text-[#6E6879]">
                  신년운세를 보려면 먼저 사주 정보를 입력해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/saju")}
                  className="mt-4 h-11 rounded-[16px] bg-[#6656C9] px-5 text-[13px] font-bold text-white"
                >
                  사주 정보 입력하기
                </button>
              </section>
            )}

            {profilePhase === "ready" && canonicalUser && (
              <>
                <div className="px-5 pt-5">
                  <section
                    aria-labelledby="yearly-profile-name"
                    className="flex items-center gap-3 rounded-[18px] border border-white/80 bg-white/70 px-4 py-2.5 shadow-[0_8px_24px_rgba(76,119,163,0.10)] backdrop-blur-[3px]"
                  >
                    <div
                      data-testid="yearly-profile-avatar"
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEE9FF] text-[#7562D3]"
                    >
                      <UserRound size={24} strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="yearly-profile-name"
                        className="text-[18px] font-extrabold text-[#20185B]"
                      >
                        {canonicalUser.name}
                      </h2>
                      <p className="mt-0.5 break-keep text-[12px] font-semibold leading-5 tracking-[-0.02em] text-[#625B78]">
                        {canonicalUser.birthDate.replaceAll("-", ".")} ·{" "}
                        {canonicalUser.calendarType === "solar" ? "양력" : "음력"} ·{" "}
                        {canonicalUser.birthTimeUnknown
                          ? "출생시간 미상"
                          : `${String(canonicalUser.birthHour).padStart(2, "0")}:${String(
                              canonicalUser.birthMinute
                            ).padStart(2, "0")}`} ·{" "}
                        {canonicalUser.gender === "female" ? "여성" : "남성"}
                      </p>
                    </div>
                  </section>
                </div>

                <YearlyFortuneYearPicker
                  currentYear={currentYear}
                  recommendedYear={recommendedYear}
                  selectedYear={selectedYear}
                  onChange={setSelectedYear}
                  onSubmit={viewSelectedYear}
                  submitDisabled={!loveSituation || !careerSituation}
                  contentBeforeSubmit={
                    <div>
                      <section className="mt-[18px] rounded-[18px] border border-white/80 bg-white/70 px-5 pb-5 pt-7 text-center shadow-[0_8px_24px_rgba(76,119,163,0.10)] backdrop-blur-[3px]">
                        <p className="break-keep text-[19px] font-[750] leading-7 text-[#30286D]">
                          {canonicalUser.name}님의{" "}
                          <span className="text-[#6656C9]">{selectedYear}년</span>,
                        </p>
                        <p className="mt-1 break-keep text-[19px] font-[750] leading-7 text-[#30286D]">
                          어떤 모습일지 함께 살펴볼게요.
                        </p>
                        <p className="mt-3 break-keep text-[13px] font-normal leading-5 text-[#817A92]">
                          지금의 나와 가까운 상황을 두 가지만 알려주세요.
                        </p>

                        <div className="mt-7">
                          <SituationSelector
                            title="💖 연애 상황은 어떤가요?"
                            options={LOVE_SITUATIONS}
                            selectedKey={loveSituation}
                            onSelect={setLoveSituation}
                          />
                        </div>

                        <div className="mt-8">
                          <SituationSelector
                            title="✨ 일·진로 상황은 어떤가요?"
                            description="현재가 아니어도, 운세를 보고 싶은 시기의 상황을 골라주세요."
                            options={CAREER_SITUATIONS}
                            selectedKey={careerSituation}
                            onSelect={setCareerSituation}
                          />
                        </div>
                      </section>
                    </div>
                  }
                />
              </>
            )}
          </>
        ) : (
          <div className="px-5 pt-5">
            {previewContext ? (
              profilePhase === "ready" && canonicalUser ? (
                <YearlyFortunePreview
                  year={previewContext.year}
                  love={previewContext.love}
                  career={previewContext.career}
                  user={canonicalUser}
                />
              ) : profilePhase === "missing" ? (
                <section className="rounded-[22px] bg-white/80 px-5 py-8 text-center">
                  <p className="text-[13px] font-medium text-[#6E6879]">
                    신년운세를 보려면 먼저 사주 정보를 저장해 주세요.
                  </p>
                </section>
              ) : profilePhase === "error" ? (
                <section role="alert" className="rounded-[22px] bg-white/80 px-5 py-8 text-center">
                  <p className="text-[13px] font-medium text-[#6E6879]">
                    사주 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
                  </p>
                </section>
              ) : (
                <section role="status" className="rounded-[22px] bg-white/80 px-5 py-12 text-center">
                  <p className="text-[13px] font-medium text-[#817A92]">
                    사주 정보를 불러오고 있어요
                  </p>
                </section>
              )
            ) : isLoading ? (
              <section
                role="status"
                aria-live="polite"
                className="mt-8 rounded-[24px] bg-white px-5 py-14 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
              >
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-[#DDD7F6] border-t-[#6656C9]" />
                <p className="mt-5 text-[16px] font-extrabold text-[#30286D]">
                  {activeYear}년의 흐름을 살펴보고 있어요
                </p>
                <p className="mt-2 text-[12px] font-medium text-[#8C8598]">
                  잠시만 기다려주세요
                </p>
              </section>
            ) : (
              <section className="rounded-[24px] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(78,62,137,0.07)]">
                <p className="text-[12px] font-bold text-[#7057D8]">
                  한 해의 흐름 미리보기
                </p>
                <h2 className="mt-2 break-keep text-[20px] font-extrabold leading-7 text-[#20185B]">
                  {activeYear}년, 나에게 다가오는 흐름을 살펴보세요
                </h2>
                <p className="mt-3 break-keep text-[13px] font-medium leading-6 text-[#817A92]">
                  일과 금전, 관계의 흐름과 한 해 기억하면 좋은 행동 가이드를 한 번에 확인할 수 있어요.
                </p>
              </section>
            )}

            {queryYear !== null && !previewContext && (
              <div hidden={isLoading}>
                <YearlyFortuneUnlock
                  year={queryYear}
                  onInitialStatusSettled={() => setSettledYear(queryYear)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function YearlyFortunePageContent() {
  const searchParams = useSearchParams();
  const today = new Date();
  const currentYear = today.getFullYear();
  const recommendedYear = getRecommendedYear(today);
  const years = useMemo(() => createYearRange(currentYear), [currentYear]);
  const parsedYear = parseYear(
    searchParams.get("year"),
    years[0],
    years[years.length - 1]
  );
  const hasReadingContext =
    searchParams.has("love") || searchParams.has("career");
  const previewContext = parseYearlyReadingContext(
    new URLSearchParams(searchParams.toString()),
    years[0],
    years[years.length - 1]
  );
  const queryYear = hasReadingContext ? previewContext?.year ?? null : parsedYear;
  const flowKey = previewContext
    ? `preview-${previewContext.year}-${previewContext.love}-${previewContext.career}`
    : queryYear === null
      ? "year-picker"
      : `year-${queryYear}`;

  return (
    <YearlyFortuneFlow
      key={flowKey}
      currentYear={currentYear}
      recommendedYear={recommendedYear}
      queryYear={queryYear}
      previewContext={previewContext}
    />
  );
}

function YearlyFortunePageFallback() {
  return <main className="min-h-full bg-[#F5F2FF]" />;
}

export default function YearlyFortunePage() {
  return (
    <Suspense fallback={<YearlyFortunePageFallback />}>
      <YearlyFortunePageContent />
    </Suspense>
  );
}
