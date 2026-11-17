"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { UnlogUser } from "../../lib/user";
import type {
  CareerSituationKey,
  LoveSituationKey,
} from "../../lib/yearlyReadingContext";
import {
  CAREER_SITUATIONS,
  LOVE_SITUATIONS,
} from "../../lib/yearlyReadingContext";
import SajuManse from "./SajuManse";

type PreviewResponse =
  | { success: true; profileReady: false }
  | {
      success: true;
      profileReady: true;
      preview: { year: number; text: string };
    };

type PreviewPhase = "loading" | "ready" | "missing" | "error";

const LOCKED_SECTIONS = [
  "전체 흐름",
  "연애운",
  "금전운",
  "건강운",
  "커리어운",
  "학업운",
] as const;

export default function YearlyFortunePreview({
  year,
  love,
  career,
  user,
}: {
  year: number;
  love: LoveSituationKey;
  career: CareerSituationKey;
  user: UnlogUser;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<PreviewPhase>("loading");
  const [previewText, setPreviewText] = useState("");
  const loveLabel = LOVE_SITUATIONS.find((option) => option.key === love)!.label;
  const careerLabel = CAREER_SITUATIONS.find(
    (option) => option.key === career
  )!.label;

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      try {
        const params = new URLSearchParams({
          year: String(year),
          love,
          career,
        });
        const response = await fetch(`/api/saju/yearly/preview?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as PreviewResponse;

        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok || data.success !== true) throw new Error();
        if (!data.profileReady) {
          setPhase("missing");
          return;
        }

        setPreviewText(data.preview.text);
        setPhase("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPhase("error");
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [career, love, router, year]);

  if (phase === "loading") {
    return (
      <section role="status" className="rounded-[22px] bg-white/80 px-5 py-12 text-center">
        <p className="text-[13px] font-medium text-[#817A92]">
          {year}년의 한줄 운세를 살펴보고 있어요.
        </p>
      </section>
    );
  }

  if (phase === "missing") {
    return (
      <section className="rounded-[22px] bg-white/80 px-5 py-8 text-center">
        <p className="text-[13px] font-medium text-[#6E6879]">
          신년운세를 보려면 먼저 사주 정보를 저장해 주세요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/onboarding/saju")}
          className="mt-4 h-11 rounded-[16px] bg-[#6656C9] px-5 text-[13px] font-bold text-white"
        >
          사주 정보 입력하기
        </button>
      </section>
    );
  }

  if (phase === "error") {
    return (
      <section role="alert" className="rounded-[22px] bg-white/80 px-5 py-8 text-center">
        <p className="text-[13px] font-medium text-[#6E6879]">
          한줄 운세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      </section>
    );
  }

  return (
    <>
      <div>
        <SajuManse
          user={user}
          variant="yearly"
          yearlyContext={{ loveLabel, careerLabel }}
        />
      </div>

      <section className="mt-6 rounded-[22px] border border-white/80 bg-white/75 px-5 py-5 shadow-[0_8px_24px_rgba(76,119,163,0.08)] backdrop-blur-[3px]">
        <p className="text-[13px] font-bold text-[#6656C9]">
          ✦ {year}년 미리보기
        </p>
        <p className="mt-3 break-keep text-[15px] font-medium leading-[1.8] text-[#30286D]">
          {previewText}
        </p>
      </section>

      <section className="mt-5 rounded-[22px] border border-[#E8E2F3] bg-white/70 px-5 py-6 text-center shadow-[0_7px_20px_rgba(76,68,120,0.06)]">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F0EDFF] text-[#6656C9]">
          <LockKeyhole size={19} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-[17px] font-bold text-[#30286D]">
          더 자세히 살펴볼까요?
        </h3>
        <p className="mt-2 break-keep text-[13px] font-normal leading-5 text-[#817A92]">
          {year}년의 흐름을 더 자세히 확인할 수 있어요.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {LOCKED_SECTIONS.map((section) => (
            <span
              key={section}
              className="rounded-full border border-[#E3DDF1] bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-[#625B78]"
            >
              {section}
            </span>
          ))}
        </div>
        <button
          type="button"
          disabled
          className="mt-5 h-12 w-full cursor-not-allowed rounded-[18px] bg-[#EEE9FF] text-[14px] font-bold text-[#6656C9] opacity-70"
        >
          운석 1개로 전체 운세 보기
        </button>
      </section>
    </>
  );
}
