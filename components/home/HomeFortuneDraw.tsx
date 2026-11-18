"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { getSaju } from "../../lib/saju";
import type { UnlogUser } from "../../lib/user";
import styles from "./HomeFortuneDraw.module.css";

type DrawState = "idle" | "drawing" | "result";

function waitForImageLoad(image: HTMLImageElement) {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve()
      : Promise.reject(new Error(`Failed to load image: ${image.currentSrc || image.src}`));
  }

  return new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Failed to load image: ${image.currentSrc || image.src}`)),
      { once: true }
    );
  });
}

async function decodeImage(image: HTMLImageElement) {
  await waitForImageLoad(image);

  if (typeof image.decode !== "function") return;

  try {
    await image.decode();
  } catch {
    // Some browsers reject decode() even though the image is already usable.
    await waitForImageLoad(image);
  }
}
type SupportedDayPillar = "갑자" | "갑오" | "갑진" | "갑술" | "경자" | "경오" | "경신" | "경술" | "경진" | "경인" | "을미" | "을유" | "을축" | "을해" | "신미" | "신묘" | "신유" | "신축" | "신해" | "신사";

// 캐릭터 확인용 임시 설정. 실제 일주 자동 판별로 복구할 때 null로 변경한다.
const TEST_CHARACTER_DAY_PILLAR: SupportedDayPillar | null = "신축";

const characterByDayPillar: Record<SupportedDayPillar, Record<DrawState, string>> = {
  갑자: {
    idle: "/image/home/gapja-idle.png",
    drawing: "/image/home/gapja-drawing-v2.png",
    result: "/image/home/gapja-result-v2.png",
  },
  갑오: {
    idle: "/image/home/gapo-idle.png",
    drawing: "/image/home/gapo-drawing-v2.png",
    result: "/image/home/gapo-result-v2.png",
  },
  갑진: {
    idle: "/image/home/gapjin-idle-v2.png",
    drawing: "/image/home/gapjin-drawing-v2.png",
    result: "/image/home/gapjin-result-v2.png",
  },
  갑술: {
    idle: "/image/home/gapsul-idle.png",
    drawing: "/image/home/gapsul-drawing.png",
    result: "/image/home/gapsul-result.png",
  },
  경자: {
    idle: "/image/home/gyeongja-idle.png",
    drawing: "/image/home/gyeongja-drawing-v2.png",
    result: "/image/home/gyeongja-result.png",
  },
  경오: {
    idle: "/image/home/gyeongo-idle-v2.png",
    drawing: "/image/home/gyeongo-drawing.png",
    result: "/image/home/gyeongo-result.png",
  },
  경신: {
    idle: "/image/home/gyeongsin-idle-v3.png",
    drawing: "/image/home/gyeongsin-drawing-v2.png",
    result: "/image/home/gyeongsin-result-v2.png",
  },
  경술: {
    idle: "/image/home/gyeongsul-idle.png",
    drawing: "/image/home/gyeongsul-drawing.png",
    result: "/image/home/gyeongsul-result.png",
  },
  경진: {
    idle: "/image/home/gyeongjin-idle-v2.png",
    drawing: "/image/home/gyeongjin-drawing.png",
    result: "/image/home/gyeongjin-result-v2.png",
  },
  경인: {
    idle: "/image/home/gyeongin-idle.png",
    drawing: "/image/home/gyeongin-drawing.png",
    result: "/image/home/gyeongin-result.png",
  },
  을미: {
    idle: "/image/home/eulmi-idle.png",
    drawing: "/image/home/eulmi-drawing.png",
    result: "/image/home/eulmi-result.png",
  },
  을유: {
    idle: "/image/home/eulyu-idle.png",
    drawing: "/image/home/eulyu-drawing.png",
    result: "/image/home/eulyu-result.png",
  },
  을축: {
    idle: "/image/home/eulchuk-idle.png",
    drawing: "/image/home/eulchuk-drawing.png",
    result: "/image/home/eulchuk-result.png",
  },
  을해: {
    idle: "/image/home/eulhae-idle.png",
    drawing: "/image/home/eulhae-drawing.png",
    result: "/image/home/eulhae-result-v3.png",
  },
  신미: {
    idle: "/image/home/shinmi-idle-v2.png",
    drawing: "/image/home/shinmi-drawing-v2.png",
    result: "/image/home/shinmi-result.png",
  },
  신묘: {
    idle: "/image/home/sinmyo-idle.png",
    drawing: "/image/home/sinmyo-drawing.png",
    result: "/image/home/sinmyo-result.png",
  },
  신유: {
    idle: "/image/home/shinyu-idle.png",
    drawing: "/image/home/shinyu-drawing.png",
    result: "/image/home/shinyu-result.png",
  },
  신축: {
    idle: "/image/home/sinchuk-idle.png",
    drawing: "/image/home/sinchuk-drawing.png",
    result: "/image/home/sinchuk-result.png",
  },
  신해: {
    idle: "/image/home/sinhae-idle.png",
    drawing: "/image/home/sinhae-drawing.png",
    result: "/image/home/sinhae-result-v2.png",
  },
  신사: {
    idle: "/image/home/sinsa-idle.png",
    drawing: "/image/home/sinsa-drawing-v2.png",
    result: "/image/home/sinsa-result.png",
  },
};

function getSupportedDayPillar(profile: Partial<UnlogUser>): SupportedDayPillar | null {
  if (
    !profile.birthDate ||
    profile.birthHour === undefined ||
    profile.birthMinute === undefined ||
    !profile.calendarType ||
    !profile.gender
  ) {
    return null;
  }

  try {
    const saju = getSaju(
      profile.birthDate,
      String(profile.birthHour),
      String(profile.birthMinute),
      profile.calendarType,
      profile.gender,
      Boolean(profile.birthTimeUnknown)
    );

    const dayPillar = `${saju.dayStem}${saju.dayBranch}`;
    return dayPillar === "갑자" ||
      dayPillar === "갑오" ||
      dayPillar === "갑진" ||
      dayPillar === "갑술" ||
      dayPillar === "경자" ||
      dayPillar === "경오" ||
      dayPillar === "경신" ||
      dayPillar === "경술" ||
      dayPillar === "경진" ||
      dayPillar === "경인" ||
      dayPillar === "을미" ||
      dayPillar === "을유" ||
      dayPillar === "을축" ||
      dayPillar === "을해" ||
      dayPillar === "신미" ||
      dayPillar === "신묘" ||
      dayPillar === "신유" ||
      dayPillar === "신축" ||
      dayPillar === "신해" ||
      dayPillar === "신사"
      ? dayPillar
      : null;
  } catch {
    return null;
  }
}

const particles = [
  { left: "7%", top: "25%", delay: "0ms" },
  { left: "17%", top: "2%", delay: "420ms" },
  { right: "10%", top: "18%", delay: "760ms" },
  { right: "4%", top: "52%", delay: "1120ms" },
  { left: "2%", top: "61%", delay: "1480ms" },
  { right: "20%", top: "-2%", delay: "1840ms" },
];

const MOBILE_SCENE_REFERENCE = {
  width: 430,
  height: 812,
  subjectTop: 108.046875,
  subjectHeight: 664.984375,
  speechLeft: 91.453125,
  speechWidth: 247.109375,
  speechHeight: 46.46875,
  speechFontSize: 15,
  speechPaddingX: 20,
  speechRadius: 22,
  orbLeft: 211.296875,
  orbTop: 427.25,
  orbSize: 110,
} as const;

const MOBILE_CHARACTER_REFERENCE_SIZE_FACTOR =
  216 / (MOBILE_SCENE_REFERENCE.width * 0.5099);

export default function HomeFortuneDraw() {
  const router = useRouter();
  const [drawState, setDrawState] = useState<DrawState>("idle");
  const [visibleCharacterState, setVisibleCharacterState] = useState<DrawState>("idle");
  const [outgoingCharacterState, setOutgoingCharacterState] = useState<DrawState | null>(null);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(150);
  const [characterDayPillar, setCharacterDayPillar] = useState<SupportedDayPillar | null>(null);
  const visibleCharacterStateRef = useRef<DrawState>("idle");
  const crossfadeFrameRef = useRef<number | null>(null);
  const crossfadeTimerRef = useRef<number | null>(null);
  const crossfadeCycleRef = useRef(0);
  const transitionRequestRef = useRef(0);
  const isTransitionPreparingRef = useRef(false);
  const isMountedRef = useRef(true);
  const incomingCharacterImageRef = useRef<HTMLImageElement | null>(null);
  const decodedCharacterImagesRef = useRef(
    new Map<string, { image: HTMLImageElement; ready: Promise<void> }>()
  );
  const mobileSceneCanvasRef = useRef<HTMLDivElement | null>(null);
  const activeCharacterDayPillar = TEST_CHARACTER_DAY_PILLAR ?? characterDayPillar;

  const preloadAndDecodeCharacterImage = useCallback((src: string) => {
    const cached = decodedCharacterImagesRef.current.get(src);
    if (cached) return cached.ready;

    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.src = src;
    const ready = decodeImage(image).catch((error: unknown) => {
      const cachedEntry = decodedCharacterImagesRef.current.get(src);
      if (cachedEntry?.image === image) {
        decodedCharacterImagesRef.current.delete(src);
      }
      throw error;
    });
    decodedCharacterImagesRef.current.set(src, { image, ready });

    return ready;
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      await Promise.resolve();

      const savedUser = localStorage.getItem("unlog-user");
      if (savedUser && !isCancelled) {
        try {
          setCharacterDayPillar(getSupportedDayPillar(JSON.parse(savedUser) as UnlogUser));
        } catch {
          setCharacterDayPillar(null);
        }
      }

      if (process.env.NEXT_PUBLIC_UNLOG_PAGES === "true") return;

      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;

        const data = await response.json();
        if (!isCancelled && data?.user?.sajuProfile) {
          setCharacterDayPillar(getSupportedDayPillar(data.user.sajuProfile));
        }
      } catch {
        // 로그인 프로필을 불러오지 못하면 로컬 사주 정보를 유지한다.
      }
    }

    void loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!activeCharacterDayPillar) return;

    const characterImages = characterByDayPillar[activeCharacterDayPillar];
    void Promise.allSettled(
      [characterImages.drawing, characterImages.result].map((src) =>
        preloadAndDecodeCharacterImage(src)
      )
    );
  }, [activeCharacterDayPillar, preloadAndDecodeCharacterImage]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      transitionRequestRef.current += 1;
      crossfadeCycleRef.current += 1;
      if (crossfadeFrameRef.current !== null) {
        window.cancelAnimationFrame(crossfadeFrameRef.current);
      }
      if (crossfadeTimerRef.current !== null) {
        window.clearTimeout(crossfadeTimerRef.current);
      }
    };
  }, []);

  const finishCharacterCrossfade = useCallback((cycle: number) => {
    if (cycle !== crossfadeCycleRef.current) return;

    if (crossfadeTimerRef.current !== null) {
      window.clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }

    setOutgoingCharacterState(null);
    setIsCrossfading(false);
  }, []);

  const beginCharacterCrossfade = useCallback(
    async (nextState: DrawState, duration: number) => {
      if (!activeCharacterDayPillar) return false;

      const request = ++transitionRequestRef.current;
      const nextSrc = characterByDayPillar[activeCharacterDayPillar][nextState];

      try {
        await preloadAndDecodeCharacterImage(nextSrc);
      } catch {
        // Loading errors are handled by the rendered image. Do not block the UI forever.
      }

      if (!isMountedRef.current || request !== transitionRequestRef.current) {
        return false;
      }

      crossfadeCycleRef.current += 1;
      const previousState = visibleCharacterStateRef.current;

      setOutgoingCharacterState(previousState);
      visibleCharacterStateRef.current = nextState;
      setVisibleCharacterState(nextState);
      setCrossfadeDuration(duration);
      setIsCrossfading(false);

      return true;
    },
    [activeCharacterDayPillar, preloadAndDecodeCharacterImage]
  );

  useLayoutEffect(() => {
    if (!outgoingCharacterState) return;

    const incomingImage = incomingCharacterImageRef.current;
    if (!incomingImage) return;

    const cycle = crossfadeCycleRef.current;
    let isCancelled = false;

    if (crossfadeFrameRef.current !== null) {
      window.cancelAnimationFrame(crossfadeFrameRef.current);
      crossfadeFrameRef.current = null;
    }
    if (crossfadeTimerRef.current !== null) {
      window.clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = null;
    }

    void (async () => {
      try {
        await decodeImage(incomingImage);
      } catch {
        // The browser can still paint a loaded image even when decode() rejects.
      }

      if (isCancelled || cycle !== crossfadeCycleRef.current) return;

      // Commit opacity: 0 first, then start both opacity transitions together
      // on the following painted frame. This avoids skipping the start frame.
      crossfadeFrameRef.current = window.requestAnimationFrame(() => {
        crossfadeFrameRef.current = window.requestAnimationFrame(() => {
          if (isCancelled || cycle !== crossfadeCycleRef.current) return;

          setIsCrossfading(true);
          crossfadeFrameRef.current = null;

          // transitionend is the primary cleanup path. This only guards browsers
          // that suppress the event after interruption or visibility changes.
          crossfadeTimerRef.current = window.setTimeout(() => {
            finishCharacterCrossfade(cycle);
          }, crossfadeDuration + 500);
        });
      });
    })();

    return () => {
      isCancelled = true;
      if (crossfadeFrameRef.current !== null) {
        window.cancelAnimationFrame(crossfadeFrameRef.current);
        crossfadeFrameRef.current = null;
      }
      if (crossfadeTimerRef.current !== null) {
        window.clearTimeout(crossfadeTimerRef.current);
        crossfadeTimerRef.current = null;
      }
    };
  }, [crossfadeDuration, finishCharacterCrossfade, outgoingCharacterState]);

  useEffect(() => {
    if (drawState !== "drawing") return;

    let isCancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const didStart = await beginCharacterCrossfade("result", 360);
        if (!isCancelled && didStart) {
          setDrawState("result");
        }
      })();
    }, 2500);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [beginCharacterCrossfade, drawState]);

  async function handleButtonClick() {
    if (drawState === "drawing" || isTransitionPreparingRef.current) return;

    if (drawState === "result") {
      router.push("/today");
      return;
    }

    isTransitionPreparingRef.current = true;
    const didStart = await beginCharacterCrossfade("drawing", 320);
    isTransitionPreparingRef.current = false;

    if (didStart) {
      setDrawState("drawing");
    }
  }

  const isDrawing = drawState === "drawing";
  const hasResult = drawState === "result";
  const characterReferenceWidthRatio =
    activeCharacterDayPillar === "경신"
      ? 0.4633
      : activeCharacterDayPillar === "을축" || activeCharacterDayPillar === "신축"
        ? 0.5099
        : activeCharacterDayPillar === "신묘"
          ? 0.5198
          : 0.495;
  const characterReferenceTopRatio =
    activeCharacterDayPillar === "경신"
      ? 0.3498
      : activeCharacterDayPillar === "을축" || activeCharacterDayPillar === "신축"
        ? 0.3242
        : activeCharacterDayPillar === "신묘"
          ? 0.3208
          : activeCharacterDayPillar === "경인" || activeCharacterDayPillar === "신사"
            ? 0.3368
            : 0.3293;
  const speechReferenceTopRatio =
    activeCharacterDayPillar === "경신"
      ? 0.2528
      : activeCharacterDayPillar === "을축" || activeCharacterDayPillar === "신축"
        ? 0.2497
        : activeCharacterDayPillar === "신묘"
          ? 0.2493
          : activeCharacterDayPillar === "경인" || activeCharacterDayPillar === "신사"
            ? 0.2579
            : 0.2503;
  const characterReferenceLeftRatio =
    activeCharacterDayPillar === "경신"
      ? 0.2314
      : activeCharacterDayPillar === "을축" || activeCharacterDayPillar === "신축"
        ? 0.1825
        : activeCharacterDayPillar === "을해"
          ? 0.1667
          : activeCharacterDayPillar === "신해"
            ? 0.183
            : activeCharacterDayPillar === "신묘"
              ? 0.1892
              : activeCharacterDayPillar === "갑술" ||
                  activeCharacterDayPillar === "경술" ||
                  activeCharacterDayPillar === "경진" ||
                  activeCharacterDayPillar === "신사" ||
                  activeCharacterDayPillar === "갑진"
                ? 0.1853
                : activeCharacterDayPillar === "경인"
                  ? 0.2016
                  : activeCharacterDayPillar === "을유" || activeCharacterDayPillar === "신유"
                    ? 0.176
                    : activeCharacterDayPillar === "갑오" ||
                        activeCharacterDayPillar === "경오" ||
                        activeCharacterDayPillar === "을미" ||
                        activeCharacterDayPillar === "신미"
                      ? 0.1737
                      : 0.1923;

  const previousCharacterReferenceSize =
    MOBILE_SCENE_REFERENCE.width * characterReferenceWidthRatio;
  const characterReferenceSize =
    previousCharacterReferenceSize * MOBILE_CHARACTER_REFERENCE_SIZE_FACTOR;
  const characterReferenceSizeDelta = previousCharacterReferenceSize - characterReferenceSize;
  const characterReferenceLeft =
    MOBILE_SCENE_REFERENCE.width * characterReferenceLeftRatio + characterReferenceSizeDelta / 2;
  const characterReferenceTop =
    MOBILE_SCENE_REFERENCE.subjectTop +
    MOBILE_SCENE_REFERENCE.subjectHeight * characterReferenceTopRatio +
    characterReferenceSizeDelta;
  const speechReferenceTop =
    MOBILE_SCENE_REFERENCE.subjectTop +
    MOBILE_SCENE_REFERENCE.subjectHeight * speechReferenceTopRatio;

  useEffect(() => {
    const canvas = mobileSceneCanvasRef.current;
    if (!canvas) return;

    const updateSceneLayout = () => {
      if (!window.matchMedia("(max-width: 639px)").matches) return;

      const { width, height } = canvas.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      const sceneScale = Math.max(
        width / MOBILE_SCENE_REFERENCE.width,
        height / MOBILE_SCENE_REFERENCE.height
      );
      const sceneWidth = MOBILE_SCENE_REFERENCE.width * sceneScale;
      const sceneHeight = MOBILE_SCENE_REFERENCE.height * sceneScale;
      const sceneOffsetX = (width - sceneWidth) / 2;
      const sceneOffsetY = (height - sceneHeight) / 2;
      const setPx = (name: string, referenceValue: number) => {
        canvas.style.setProperty(name, `${(referenceValue * sceneScale).toFixed(4)}px`);
      };

      canvas.style.setProperty("--home-scene-width", `${sceneWidth.toFixed(4)}px`);
      canvas.style.setProperty("--home-scene-height", `${sceneHeight.toFixed(4)}px`);
      canvas.style.setProperty("--home-scene-left", `${sceneOffsetX.toFixed(4)}px`);
      canvas.style.setProperty("--home-scene-top", `${sceneOffsetY.toFixed(4)}px`);
      setPx("--home-character-left", characterReferenceLeft);
      setPx("--home-character-top", characterReferenceTop);
      setPx("--home-character-size", characterReferenceSize);
      setPx("--home-speech-left", MOBILE_SCENE_REFERENCE.speechLeft);
      setPx("--home-speech-top", speechReferenceTop);
      setPx("--home-speech-width", MOBILE_SCENE_REFERENCE.speechWidth);
      setPx("--home-speech-height", MOBILE_SCENE_REFERENCE.speechHeight);
      setPx("--home-speech-font-size", MOBILE_SCENE_REFERENCE.speechFontSize);
      setPx("--home-speech-padding-x", MOBILE_SCENE_REFERENCE.speechPaddingX);
      setPx("--home-speech-radius", MOBILE_SCENE_REFERENCE.speechRadius);
      setPx("--home-orb-left", MOBILE_SCENE_REFERENCE.orbLeft);
      setPx("--home-orb-top", MOBILE_SCENE_REFERENCE.orbTop);
      setPx("--home-orb-size", MOBILE_SCENE_REFERENCE.orbSize);

      canvas.dataset.sceneScale = sceneScale.toFixed(6);
      canvas.dataset.sceneOffsetX = sceneOffsetX.toFixed(4);
      canvas.dataset.sceneOffsetY = sceneOffsetY.toFixed(4);
    };

    updateSceneLayout();
    const resizeObserver = new ResizeObserver(updateSceneLayout);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [
    characterReferenceLeft,
    characterReferenceSize,
    characterReferenceTop,
    speechReferenceTop,
  ]);

  return (
    <section
      aria-live="polite"
      className={`${styles.mobileHomeScene} absolute inset-x-0 bottom-[170px] top-[72px] z-20 px-5`}
    >
      <div
        ref={mobileSceneCanvasRef}
        className={`${styles.mobileSceneCanvas} flex h-full flex-col items-center`}
      >
        {hasResult && (
          <div className={`${styles.mobileResultAnchor} fortune-result-enter relative top-[65px] w-full max-w-[300px] rounded-[26px] bg-[#FFF3D9]/88 px-6 py-5 text-center shadow-[0_8px_24px_rgba(114,75,38,0.12)] backdrop-blur-[5px] sm:top-[180px] sm:max-w-[330px]`}>
            <p className="text-[14px] font-extrabold tracking-[-0.02em] text-[#A66B3F]">
              오늘의 운세
            </p>
            <p className="mt-2 break-keep text-[16px] font-bold leading-[1.65] tracking-[-0.025em] text-[#573B2B]">
              내가 아는 것을 정리하고 설명할수록
              <br />
              이해가 깊어져요.
            </p>
          </div>
        )}

        <div className={`${styles.mobileSubjectScene} ${styles.mobileSceneArtwork} relative mt-auto h-[clamp(350px,55%,465px)] w-full max-w-[390px]`}>
          {!hasResult && (
            <div
              className={`${styles.mobileSpeechAnchor} absolute bottom-[163px] left-1/2 z-30 w-max max-w-[calc(100%-32px)] rounded-[22px] bg-[#FFF5DF] px-5 py-3 text-center text-[15px] font-bold leading-[1.5] tracking-[-0.025em] text-[#674532] shadow-[0_6px_18px_rgba(112,74,38,0.10)] sm:bottom-[258px] sm:-translate-x-1/2`}
            >
              {isDrawing
                ? "오늘의 운세를 점치는 중이에요..."
                : "오늘은 어떤 운이 기다리고 있을까?"}
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#FFF5DF]" />
            </div>
          )}

          {activeCharacterDayPillar && (
              <div
                className={`${styles.mobileCharacterAnchor} absolute z-10 sm:-translate-x-1/2 ${
                  activeCharacterDayPillar === "을축" ||
                  activeCharacterDayPillar === "신축"
                    ? "bottom-[-50px] sm:bottom-[45px]"
                    : activeCharacterDayPillar === "신묘" || activeCharacterDayPillar === "경인"
                    ? "bottom-[-52px] sm:bottom-[43px]"
                    : activeCharacterDayPillar === "신사"
                    ? "bottom-[-52px] sm:bottom-[43px]"
                    : "bottom-[-47px] sm:bottom-[48px]"
                } ${
                  activeCharacterDayPillar === "경신"
                    ? "w-[clamp(182px,46.33vw,206px)] sm:w-[clamp(164px,42.12vw,187px)]"
                    : activeCharacterDayPillar === "을축" ||
                      activeCharacterDayPillar === "신축"
                    ? "w-[clamp(200px,50.99vw,227px)] sm:w-[clamp(181px,46.35vw,206px)]"
                    : activeCharacterDayPillar === "신묘"
                    ? "w-[clamp(204px,51.98vw,231px)] sm:w-[clamp(185px,47.25vw,210px)]"
                    : "w-[clamp(194px,49.5vw,220px)] sm:w-[clamp(176px,45vw,200px)]"
                } ${
                  activeCharacterDayPillar === "경신"
                    ? "left-[calc(39%+27px)] sm:left-[calc(39%+32px)]"
                    : activeCharacterDayPillar === "을축"
                    ? "left-[calc(39%+16px)] sm:left-[calc(39%+21px)]"
                    : activeCharacterDayPillar === "신축"
                    ? "left-[calc(39%+16px)] sm:left-[calc(39%+21px)]"
                    : activeCharacterDayPillar === "을해"
                    ? "left-[calc(39%+6px)] sm:left-[calc(39%+11px)]"
                    : activeCharacterDayPillar === "신해"
                    ? "left-[calc(39%+13px)] sm:left-[calc(39%+18px)]"
                    : activeCharacterDayPillar === "신묘"
                    ? "left-[calc(39%+21px)] sm:left-[calc(39%+26px)]"
                    : activeCharacterDayPillar === "갑술" ||
                      activeCharacterDayPillar === "경술" ||
                      activeCharacterDayPillar === "경진"
                    ? "left-[calc(39%+14px)] sm:left-[calc(39%+19px)]"
                    : activeCharacterDayPillar === "신사"
                    ? "left-[calc(39%+14px)] sm:left-[calc(39%+19px)]"
                    : activeCharacterDayPillar === "갑진"
                    ? "left-[calc(39%+14px)] sm:left-[calc(39%+19px)]"
                    : activeCharacterDayPillar === "경인"
                    ? "left-[calc(39%+21px)] sm:left-[calc(39%+26px)]"
                    : activeCharacterDayPillar === "을유" ||
                      activeCharacterDayPillar === "신유"
                    ? "left-[calc(39%+10px)] sm:left-[calc(39%+15px)]"
                    : activeCharacterDayPillar === "갑오" ||
                      activeCharacterDayPillar === "경오" ||
                      activeCharacterDayPillar === "을미" ||
                      activeCharacterDayPillar === "신미"
                    ? "left-[calc(39%+9px)] sm:left-[calc(39%+14px)]"
                    : "left-[calc(39%+17px)] sm:left-[calc(39%+20px)]"
                }`}
                style={
                  {
                    "--character-crossfade-duration": `${crossfadeDuration}ms`,
                  } as CSSProperties
                }
              >
                {outgoingCharacterState && (
                  <Image
                    src={characterByDayPillar[activeCharacterDayPillar][outgoingCharacterState]}
                    alt=""
                    aria-hidden="true"
                    width={1280}
                    height={1280}
                    decoding="async"
                    priority
                    unoptimized
                    className={`${styles.characterLayer} ${styles.outgoingCharacter} ${
                      isCrossfading ? styles.outgoingCharacterActive : ""
                    } absolute inset-0 h-auto w-full object-contain drop-shadow-[0_8px_12px_rgba(92,57,30,0.10)]`}
                  />
                )}
                <Image
                  ref={incomingCharacterImageRef}
                  key={visibleCharacterState}
                  src={characterByDayPillar[activeCharacterDayPillar][visibleCharacterState]}
                  alt={
                    hasResult
                      ? `오늘의 운세 결과를 알려주는 ${activeCharacterDayPillar}일주 캐릭터`
                      : `유리구슬로 오늘의 운세를 보는 ${activeCharacterDayPillar}일주 캐릭터`
                  }
                  width={1280}
                  height={1280}
                  decoding="async"
                  priority
                  unoptimized
                  onTransitionEnd={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      event.propertyName === "opacity" &&
                      isCrossfading
                    ) {
                      finishCharacterCrossfade(crossfadeCycleRef.current);
                    }
                  }}
                  className={`${styles.characterLayer} ${
                    outgoingCharacterState ? styles.incomingCharacter : ""
                  } ${
                    outgoingCharacterState && isCrossfading ? styles.incomingCharacterActive : ""
                  } relative h-auto w-full object-contain drop-shadow-[0_8px_12px_rgba(92,57,30,0.10)]`}
                />
              </div>
          )}

          <div
            className={`${styles.mobileOrbAnchor} absolute bottom-[-45px] z-20 aspect-square w-[clamp(84px,22vw,97px)] sm:bottom-[50px] sm:w-[clamp(76px,20vw,88px)] sm:-translate-x-1/2 ${
              activeCharacterDayPillar === "경신"
                ? "left-[calc(57%+20px)] sm:left-[calc(57%+26px)]"
                : "left-[calc(57%+19px)] sm:left-[calc(57%+20px)]"
            }`}
          >
            {isDrawing &&
              particles.map((particle, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="fortune-particle absolute z-30 h-2.5 w-2.5 text-[#FFF1A7]"
                  style={{ ...particle, animationDelay: particle.delay }}
                >
                  ✦
                </span>
              ))}

            {activeCharacterDayPillar !== "경신" && (
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute left-[16%] top-[2.5%] z-10 aspect-square w-[68%] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 45% 40%, #F7D9FF 0%, #DDB0F7 52%, #AE8DE8 100%)",
                  }}
                />
                <Image
                  src="/image/home/fortune-crystal-ball.png"
                  alt="별과 달이 빛나는 유리구슬"
                  width={1280}
                  height={1280}
                  priority
                  className="relative z-20 h-auto w-full object-contain"
                />
                <span
                  aria-hidden="true"
                  className={`fortune-orb-sphere-glow absolute left-[16%] top-[2.5%] z-30 aspect-square w-[68%] rounded-full ${isDrawing ? "fortune-orb-sphere-drawing" : "fortune-orb-sphere-resting"
                    }`}
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isDrawing}
          onClick={handleButtonClick}
          className={`${styles.mobileCtaAnchor} fixed bottom-[calc(98px+env(safe-area-inset-bottom))] left-1/2 z-40 flex h-[61px] w-[calc(100%-120px)] max-w-[229px] items-center justify-center gap-0 overflow-hidden rounded-full bg-gradient-to-b from-[#FF9BC7] via-[#FF72AD] to-[#FB4E94] px-[14px] text-[18px] font-extrabold tracking-[-0.03em] text-white shadow-[0_9px_24px_rgba(232,67,133,0.38),inset_0_2px_3px_rgba(255,255,255,0.75),inset_0_-3px_5px_rgba(207,42,111,0.16)] transition enabled:active:scale-[0.98] disabled:cursor-wait disabled:saturate-[0.85] sm:h-[58px] sm:w-[calc(100%-64px)] sm:max-w-[240px] sm:-translate-x-1/2 sm:px-4 sm:text-[17px]`}
        >
          <span className="pointer-events-none absolute inset-x-3 top-1 h-[44%] rounded-full bg-gradient-to-b from-white/55 to-white/5 blur-[0.5px]" />
          {!hasResult && (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="relative z-10 h-5 w-5 shrink-0 text-[#FFE65B] drop-shadow-[0_2px_2px_rgba(201,129,28,0.25)] sm:h-6 sm:w-6"
              fill="currentColor"
            >
              <path d="M12 2.4l2.8 5.67 6.26.91-4.53 4.42 1.07 6.24L12 16.7l-5.6 2.94 1.07-6.24-4.53-4.42 6.26-.91L12 2.4Z" />
            </svg>
          )}
          <span className="relative z-10 whitespace-nowrap drop-shadow-[0_1px_1px_rgba(190,52,105,0.28)]">
            {hasResult ? "자세히 보기" : "오늘의 운세 뽑기"}
          </span>
        </button>
      </div>
    </section>
  );
}
