"use client";

import { Gem } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import YearlyCard from "../YearlyCard";
import type { YearlyInterpretation } from "../../lib/yearlyInterpretation";

type YearlyFortuneResponse =
  | {
      success: true;
      profileReady: false;
    }
  | {
      success: true;
      profileReady: true;
      walletBalance: number;
      unlocked: boolean;
      unlockId: string | null;
      interpretation: YearlyInterpretation | null;
    };

type StoneUnlockResponse = {
  success: true;
  isNew: boolean;
  walletBalance: number;
  unlockId: string;
};

type ErrorResponse = {
  success?: false;
  error?: string;
  code?: string;
};

type StatusPhase = "loading" | "ready" | "error";
type UnlockPhase = "idle" | "unlocking" | "insufficient" | "error";

export default function YearlyFortuneUnlock({
  year,
  onInitialStatusSettled,
}: {
  year: number;
  onInitialStatusSettled?: () => void;
}) {
  const router = useRouter();
  const [statusPhase, setStatusPhase] = useState<StatusPhase>("loading");
  const [unlockPhase, setUnlockPhase] = useState<UnlockPhase>("idle");
  const [walletBalance, setWalletBalance] = useState(0);
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [interpretation, setInterpretation] =
    useState<YearlyInterpretation | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusReloadKey, setStatusReloadKey] = useState(0);
  const requestIdRef = useRef<string | null>(null);
  const unlockingRef = useRef(false);
  const initialStatusReportedRef = useRef(false);

  const handleUnauthorized = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadYearlyFortune() {
      try {
        const response = await fetch(
          `/api/saju/yearly?year=${year}`,
          { cache: "no-store", signal: controller.signal }
        );
        const data = (await response.json()) as
          | YearlyFortuneResponse
          | ErrorResponse;

        if (response.status === 401) {
          handleUnauthorized();
          return false;
        }
        if (!response.ok || data.success !== true) {
          throw new Error(
            "신년운세 이용 상태를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
          );
        }

        if (!data.profileReady) {
          setProfileReady(false);
          setUnlocked(false);
          setUnlockId(null);
          setInterpretation(null);
          setUnlockPhase("idle");
          setStatusPhase("ready");
          return true;
        }
        if (data.unlocked && !data.interpretation) {
          throw new Error("신년운세 상세를 불러오지 못했어요. 다시 시도해 주세요.");
        }

        setProfileReady(true);
        setWalletBalance(data.walletBalance);
        setUnlocked(data.unlocked);
        setUnlockId(data.unlockId);
        setInterpretation(data.interpretation);
        setUnlockPhase("idle");
        setStatusPhase("ready");
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return false;
        }
        setStatusPhase("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "신년운세 이용 상태를 불러오지 못했어요."
        );
      }
    }

    void loadYearlyFortune();
    return () => controller.abort();
  }, [handleUnauthorized, statusReloadKey, year]);

  useEffect(() => {
    if (statusPhase === "loading" || initialStatusReportedRef.current) return;

    initialStatusReportedRef.current = true;
    onInitialStatusSettled?.();
  }, [onInitialStatusSettled, statusPhase]);

  const retryStatus = () => {
    setStatusPhase("loading");
    setErrorMessage("");
    setStatusReloadKey((current) => current + 1);
  };

  const unlock = async () => {
    if (
      unlockingRef.current ||
      statusPhase !== "ready" ||
      unlocked ||
      walletBalance < 1
    ) {
      return;
    }

    const requestId = requestIdRef.current ?? crypto.randomUUID();
    requestIdRef.current = requestId;
    unlockingRef.current = true;
    setUnlockPhase("unlocking");
    setErrorMessage("");

    try {
      const response = await fetch("/api/stones/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          content: { kind: "yearlyFortune", year },
        }),
      });
      const data = (await response.json()) as StoneUnlockResponse | ErrorResponse;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || data.success !== true) {
        if ("code" in data && data.code === "INSUFFICIENT_STONES") {
          requestIdRef.current = null;
          setUnlockPhase("insufficient");
          setErrorMessage("운석이 부족해요. 충전 후 다시 이용해 주세요.");
          return;
        }
        if ("code" in data && data.code === "SAJU_PROFILE_REQUIRED") {
          requestIdRef.current = null;
          setProfileReady(false);
          setUnlockPhase("idle");
          setStatusPhase("ready");
          return;
        }
        if (response.status >= 400 && response.status < 500) {
          requestIdRef.current = null;
        }
        throw new Error(
          ("error" in data && data.error) ||
            "신년운세를 열지 못했어요. 잠시 후 다시 시도해 주세요."
        );
      }

      setWalletBalance(data.walletBalance);
      setUnlockId(data.unlockId);
      setUnlockPhase("idle");
      requestIdRef.current = null;
      setStatusPhase("loading");
      setStatusReloadKey((current) => current + 1);
    } catch (error) {
      setUnlockPhase("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "신년운세를 열지 못했어요. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      unlockingRef.current = false;
    }
  };

  if (statusPhase === "loading") {
    return (
      <section
        aria-label="신년운세 이용 상태 확인 중"
        className="mt-6 rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
      >
        <p className="text-[13px] font-medium text-[#8C8598]">
          신년운세 이용 상태를 확인하고 있어요.
        </p>
      </section>
    );
  }

  if (statusPhase === "error") {
    return (
      <section
        role="alert"
        className="mt-6 rounded-[24px] bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
      >
        <p className="text-[13px] font-medium leading-6 text-[#6E6879]">
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={retryStatus}
          className="mt-4 h-11 rounded-[16px] bg-[#6656C9] px-5 text-[13px] font-bold text-white"
        >
          다시 불러오기
        </button>
      </section>
    );
  }

  if (profileReady === false) {
    return (
      <section className="mt-6 rounded-[24px] bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]">
        <p className="text-[13px] font-medium leading-6 text-[#6E6879]">
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

  if (unlocked && interpretation) {
    return (
      <div data-unlock-id={unlockId ?? undefined}>
        <YearlyCard year={year} interpretation={interpretation} />
      </div>
    );
  }

  const isInsufficient = walletBalance < 1 || unlockPhase === "insufficient";

  return (
    <section className="mt-6 rounded-[24px] bg-white px-5 py-7 text-center shadow-[0_8px_24px_rgba(78,62,137,0.07)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F0EDFF]">
        <Gem size={24} strokeWidth={1.8} className="text-[#6656C9]" />
      </div>
      <p className="mt-4 break-keep text-[12px] font-medium leading-5 text-[#8C8598]">
        운석 1개로 {year}년 신년운세 전체를 확인할 수 있어요.
      </p>

      {isInsufficient ? (
        <>
          <p className="mt-5 text-[13px] font-bold text-[#B45793]">
            {errorMessage || "운석이 부족해요."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/charge")}
            className="mt-3 h-12 w-full rounded-[18px] bg-[#EEEAF8] text-[14px] font-extrabold text-[#6656C9]"
          >
            충전하기
          </button>
        </>
      ) : (
        <>
          {unlockPhase === "error" && (
            <p role="alert" className="mt-5 text-[12px] font-bold leading-5 text-[#B45793]">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={() => void unlock()}
            disabled={unlockPhase === "unlocking"}
            className="mt-5 h-12 w-full rounded-[18px] bg-[#6656C9] text-[14px] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#AFA6D9]"
          >
            {unlockPhase === "unlocking"
              ? "신년운세 여는 중..."
              : unlockPhase === "error"
                ? "다시 시도하기"
                : "운석 1개 사용해서 보기"}
          </button>
        </>
      )}
    </section>
  );
}
