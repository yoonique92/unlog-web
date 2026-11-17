"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type TouchEvent,
} from "react";
import { useRouter } from "next/navigation";

import type { UnlogUser } from "../../lib/user";
import type { FriendRelationshipResult } from "../../lib/friendRelationship";
import type { FourPillars } from "../../lib/friendRelationship";

import { getSaju } from "../../lib/saju";
import { getTodaySaju } from "../../lib/today";
import { getFriendRelationship } from "../../lib/friendRelationship";
import {
  getDevelopmentSampleFriends,
  parseDevelopmentMockFriendCount,
} from "../../lib/friends/developmentPreview";
import {
  MAX_GARDEN_FRIENDS,
  getFriendListPageCount,
  getFriendsForPage,
  getGardenPageCount,
  getGardenPageIndex,
} from "../../lib/friends/pagination";
import {
  FRIEND_LIMIT_REACHED_MESSAGE,
  MAX_STORED_FRIENDS,
} from "../../lib/friends/limit";

type KakaoShareSdk = {
  isInitialized: () => boolean;
  init: (javascriptKey: string) => void;
  Share: {
    sendDefault: (options: {
      objectType: "text";
      text: string;
      link: { mobileWebUrl: string; webUrl: string };
      buttons: Array<{
        title: string;
        link: { mobileWebUrl: string; webUrl: string };
      }>;
    }) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoShareSdk;
  }
}

let kakaoSdkPromise: Promise<KakaoShareSdk> | null = null;

function loadKakaoSdk() {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise<KakaoShareSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
    script.integrity =
      "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.Kakao) resolve(window.Kakao);
      else reject(new Error("카카오 SDK를 불러오지 못했습니다."));
    };
    script.onerror = () => reject(new Error("카카오 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}

/* ========================================
   타입
======================================== */

type FriendCharacter = {
  id: string;
  connectionId?: string;
  name: string;
  dayPillar: string;
  pillars?: FourPillars;
  image: string;
  width: number;
};

type ApiFriend = {
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

type SelectedFriend = {
  friend: FriendCharacter;
  relationship: FriendRelationshipResult;
};

type FriendSlot = {
  left: string;
  top: string;
};

/* ========================================
   정원 설정
======================================== */

const gardenBackgrounds = [
  "/image/friends/friends_bgr_park.png",
  "/image/friends/friends_bgr_park_page2.png",
  "/image/friends/friends_bgr_park_page3.png",
] as const;

const FRIENDS_LIMIT_NOTICE_STORAGE_KEY =
  "unlog_friends_24_limit_notice_dismissed";
const FRIENDS_LIMIT_NOTICE_CHANGE_EVENT =
  "unlog:friends-limit-notice-change";

let friendsLimitNoticeDismissedInMemory = false;

function subscribeToFriendsLimitNotice(
  onStoreChange: () => void
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === FRIENDS_LIMIT_NOTICE_STORAGE_KEY
    ) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    FRIENDS_LIMIT_NOTICE_CHANGE_EVENT,
    onStoreChange
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      FRIENDS_LIMIT_NOTICE_CHANGE_EVENT,
      onStoreChange
    );
  };
}

function getFriendsLimitNoticeSnapshot() {
  if (typeof window === "undefined") return true;
  if (friendsLimitNoticeDismissedInMemory) return true;

  try {
    return (
      window.localStorage.getItem(
        FRIENDS_LIMIT_NOTICE_STORAGE_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
}

function getFriendsLimitNoticeServerSnapshot() {
  return true;
}

function dismissFriendsLimitNotice() {
  friendsLimitNoticeDismissedInMemory = true;

  try {
    window.localStorage.setItem(
      FRIENDS_LIMIT_NOTICE_STORAGE_KEY,
      "true"
    );
  } catch {
    // localStorage를 사용할 수 없어도 현재 방문에서는 즉시 숨긴다.
  }

  window.dispatchEvent(
    new Event(FRIENDS_LIMIT_NOTICE_CHANGE_EVENT)
  );
}

/* ========================================
   오행별 임시 친구
======================================== */

const fiveElementSampleFriends: FriendCharacter[] = [
  {
    id: "sample-wood",
    name: "푸름",
    dayPillar: "갑자",
    image: "/image/friends/mouse_character_men.png",
    width: 82,
  },
  {
    id: "sample-fire",
    name: "해나",
    dayPillar: "병인",
    image: "/image/friends/tiger_character_women.png",
    width: 82,
  },
  {
    id: "sample-earth",
    name: "토리",
    dayPillar: "무진",
    image: "/image/friends/dragon_character_men.png",
    width: 82,
  },
  {
    id: "sample-metal",
    name: "은결",
    dayPillar: "경자",
    image: "/image/friends/mouse_character_men.png",
    width: 82,
  },
  {
    id: "sample-water",
    name: "하람",
    dayPillar: "임해",
    image: "/image/friends/pig_character_men.png",
    width: 82,
  },
];

const isDevelopmentEnvironment =
  process.env.NODE_ENV === "development";

const developmentSampleFriends =
  getDevelopmentSampleFriends({
    isDevelopment: isDevelopmentEnvironment,
    sampleFriends: fiveElementSampleFriends,
  });

function createDevelopmentMockFriends(count: number): FriendCharacter[] {
  return Array.from({ length: count }, (_, index) => {
    const template =
      fiveElementSampleFriends[index % fiveElementSampleFriends.length];
    const friendNumber = String(index + 1).padStart(2, "0");

    return {
      ...template,
      id: `development-mock-friend-${friendNumber}`,
      connectionId: undefined,
      name: `친구${friendNumber}`,
      pillars: undefined,
    };
  });
}

/* ========================================
   일주 → 캐릭터 이름
======================================== */

function getDayPillarCharacterName(
  dayPillar: string
) {
  const stem = dayPillar.charAt(0);
  const branch = dayPillar.charAt(1);

  const stemColor: Record<string, string> = {
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

    甲: "푸른",
    乙: "푸른",
    丙: "붉은",
    丁: "붉은",
    戊: "황금",
    己: "황금",
    庚: "하얀",
    辛: "하얀",
    壬: "검은",
    癸: "검은",
  };

  const branchAnimal: Record<string, string> = {
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

    子: "쥐",
    丑: "소",
    寅: "호랑이",
    卯: "토끼",
    辰: "용",
    巳: "뱀",
    午: "말",
    未: "양",
    申: "원숭이",
    酉: "닭",
    戌: "개",
    亥: "돼지",
  };

  return `${stemColor[stem] ?? ""} ${
    branchAnimal[branch] ?? ""
  }`.trim();
}

/* ========================================
   정원 캐릭터 위치
======================================== */

const friendSlots: FriendSlot[] = [
  { left: "19%", top: "31%" },
  { left: "63%", top: "39%" },
  { left: "43%", top: "47%" },
  { left: "76%", top: "52%" },
  { left: "30%", top: "54%" },
  { left: "57%", top: "57%" },
  { left: "77%", top: "61%" },
  { left: "23%", top: "63%" },
];

const GARDEN_SWIPE_THRESHOLD_PX = 48;
const GARDEN_SWIPE_AXIS_DOMINANCE = 1.25;

/* ========================================
   PAGE
======================================== */

export default function FriendsWorld() {
  const router = useRouter();

  const [myDayPillar, setMyDayPillar] =
    useState("");
  const [myPillars, setMyPillars] =
    useState<FourPillars | null>(null);

  const [friends, setFriends] =
    useState<FriendCharacter[]>(
      developmentSampleFriends
    );
  const [actualFriendCount, setActualFriendCount] =
    useState(0);

  const [currentListPage, setCurrentListPage] =
    useState(0);

  const gardenTouchStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const isLimitNoticeDismissed =
    useSyncExternalStore(
      subscribeToFriendsLimitNotice,
      getFriendsLimitNoticeSnapshot,
      getFriendsLimitNoticeServerSnapshot
    );

  const [
    selectedFriend,
    setSelectedFriend,
  ] =
    useState<SelectedFriend | null>(
      null
    );

  const [
    deleteTargetFriend,
    setDeleteTargetFriend,
  ] =
    useState<FriendCharacter | null>(
      null
    );

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [inviteLink, setInviteLink] =
    useState("");

  const [
    creatingInvite,
    setCreatingInvite,
  ] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  /* ========================================
     사용자 일주 계산
  ======================================== */

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "unlog-user"
      );

    if (!savedUser) return;

    try {
      const user: UnlogUser =
        JSON.parse(savedUser);

      if (
        !user.birthDate ||
        user.birthHour === undefined ||
        user.birthMinute === undefined ||
        !user.calendarType ||
        !user.gender
      ) {
        return;
      }

      const sajuResult = getSaju(
        user.birthDate,
        String(user.birthHour),
        String(user.birthMinute),
        user.calendarType,
        user.gender,
        Boolean(user.birthTimeUnknown)
      );

      setMyDayPillar(
        `${sajuResult.dayStem}${sajuResult.dayBranch}`
      );
      setMyPillars(sajuResult.pillars);
    } catch (error) {
      console.error(
        "로그 프렌즈 사용자 사주 계산 오류:",
        error
      );
    }
  }, []);

  /* ========================================
     서버 친구 불러오기
  ======================================== */

  const loadInvitedFriends =
    async () => {
      const developmentMockCount =
        typeof window === "undefined"
          ? null
          : parseDevelopmentMockFriendCount(
              window.location.search,
              isDevelopmentEnvironment
            );

      if (developmentMockCount !== null) {
        queueMicrotask(() => {
          setActualFriendCount(0);
          setFriends(createDevelopmentMockFriends(developmentMockCount));
        });
        return;
      }

      try {
        const response =
          await fetch(
            "/api/friends",
            {
              cache: "no-store",
            }
          );

        // 비로그인 사용자는 서버에 저장된 친구가 없는 정상 상태다.
        // 401을 console.error로 기록하면 Next.js 개발 오류 오버레이가 뜬다.
        if (response.status === 401) {
          setActualFriendCount(0);
          setFriends(developmentSampleFriends);
          return;
        }

        if (!response.ok) {
          console.error(
            "친구 목록을 불러오지 못했어요."
          );

          return;
        }

        const data: {
          success: boolean;
          friends: ApiFriend[];
        } = await response.json();

        const serverFriends:
          FriendCharacter[] =
          data.friends
            .filter(
              (friend) =>
                friend.dayPillar &&
                friend.image
            )
            .map((friend) => ({
              id: friend.id,
              connectionId: friend.connectionId,
              name: friend.name,
              dayPillar:
                friend.dayPillar,
              pillars: friend.pillars,
              image: friend.image,
              width: 82,
            }));

        setActualFriendCount(data.friends.length);

        setFriends([
          ...developmentSampleFriends,
          ...serverFriends,
        ]);
      } catch (error) {
        console.error(
          "친구 목록 로딩 오류:",
          error
        );
      }
    };

  /* ========================================
     첫 진입 시 친구 불러오기
  ======================================== */

  useEffect(() => {
    loadInvitedFriends();
  }, []);

  /* ========================================
     다른 화면에서 돌아왔을 때
     친구 목록 다시 불러오기
  ======================================== */

  useEffect(() => {
    const handleFocus = () => {
      loadInvitedFriends();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  /* ========================================
     정원 페이지
  ======================================== */

  const gardenFriends =
    friends.slice(
      0,
      MAX_GARDEN_FRIENDS
    );

  const totalGardenPages =
    getGardenPageCount(friends.length);
  const totalFriendListPages =
    getFriendListPageCount(friends.length);
  const currentGardenPage =
    getGardenPageIndex(
      currentListPage,
      totalGardenPages
    );
  const currentGardenFriends =
    getFriendsForPage(
      gardenFriends,
      currentGardenPage
    );
  const currentListFriends =
    getFriendsForPage(
      friends,
      currentListPage
    );

  useEffect(() => {
    if (
      currentListPage >
      totalFriendListPages - 1
    ) {
      setCurrentListPage(
        totalFriendListPages - 1
      );
    }
  }, [
    currentListPage,
    totalFriendListPages,
  ]);

  const goToPreviousGardenPage = () => {
    setCurrentListPage(
      Math.max(0, currentGardenPage - 1)
    );
  };

  const goToNextGardenPage = () => {
    setCurrentListPage(
      Math.min(
        totalGardenPages - 1,
        currentGardenPage + 1
      )
    );
  };

  const handleGardenTouchStart = (
    event: TouchEvent<HTMLElement>
  ) => {
    if (event.touches.length !== 1) {
      gardenTouchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    gardenTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleGardenTouchEnd = (
    event: TouchEvent<HTMLElement>
  ) => {
    const start = gardenTouchStartRef.current;
    gardenTouchStartRef.current = null;

    if (!start || event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    const isHorizontalSwipe =
      horizontalDistance >= GARDEN_SWIPE_THRESHOLD_PX &&
      horizontalDistance >
        verticalDistance * GARDEN_SWIPE_AXIS_DOMINANCE;

    if (!isHorizontalSwipe) {
      return;
    }

    // A recognized swipe must not also trigger a character tap.
    event.preventDefault();

    if (deltaX < 0) {
      goToNextGardenPage();
      return;
    }

    goToPreviousGardenPage();
  };

  const handleGardenTouchCancel = () => {
    gardenTouchStartRef.current = null;
  };

  /* ========================================
     친구 관계 계산
  ======================================== */

  const getRelationshipForFriend = (
    friend: FriendCharacter
  ) => {
    const currentMyDayPillar =
      myDayPillar || "갑자";

    const todaySaju =
      getTodaySaju();

    return getFriendRelationship({
      myDayPillar:
        currentMyDayPillar,

      friendDayPillar:
        friend.dayPillar,

      myPillars: myPillars ?? undefined,

      friendPillars: friend.pillars,

      todayStem:
        todaySaju.stem,

      todayBranch:
        todaySaju.branch,
    });
  };

  /* ========================================
     친구 팝업
  ======================================== */

  const openFriendPopup = (
    friend: FriendCharacter
  ) => {
    const relationship =
      getRelationshipForFriend(
        friend
      );

    setSelectedFriend({
      friend,
      relationship,
    });
  };

  const closeFriendPopup = () => {
    setSelectedFriend(null);
  };

  /* ========================================
     친구 삭제
  ======================================== */

  const openDeletePopup = () => {
    if (!selectedFriend) return;

    setDeleteTargetFriend(
      selectedFriend.friend
    );
  };

  const closeDeletePopup = () => {
    setDeleteTargetFriend(null);
  };

  const deleteFriend = async () => {
    if (!deleteTargetFriend)
      return;

    if (deleteTargetFriend.connectionId) {
      const response = await fetch(
        `/api/friends?connectionId=${encodeURIComponent(
          deleteTargetFriend.connectionId
        )}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "친구를 삭제하지 못했어요.");
        return;
      }

      setActualFriendCount((currentCount) =>
        Math.max(0, currentCount - 1)
      );
    }

    setFriends(
      (prevFriends) =>
        prevFriends.filter(
          (friend) =>
            friend.id !==
            deleteTargetFriend.id
        )
    );

    setDeleteTargetFriend(null);
    setSelectedFriend(null);
  };

  /* ========================================
     친구 초대
  ======================================== */

  const createInvite =
    async () => {
      if (actualFriendCount >= MAX_STORED_FRIENDS) {
        alert(FRIEND_LIMIT_REACHED_MESSAGE);
        return;
      }

      try {
        setCreatingInvite(true);

        const response =
          await fetch(
            "/api/friends/invite",
            {
              method: "POST",

            }
          );

        if (!response.ok) {
          if (response.status === 401) {
            alert("로그인이 필요해요.");
            router.push("/login");
            return;
          }

          throw new Error(
            "초대 링크 생성 실패"
          );
        }

        const data =
          await response.json();

        const link =
          `${window.location.origin}/friends/invite/${data.code}`;

        setInviteLink(link);
        setInviteOpen(true);
      } catch (error) {
        console.error(
          "초대 링크 생성 오류:",
          error
        );

        alert(
          "초대 링크를 만들지 못했어요."
        );
      } finally {
        setCreatingInvite(false);
      }
    };

  const closeInvitePopup = () => {
    setInviteOpen(false);
    setCopied(false);
  };

  const copyInviteLink =
    async () => {
      try {
        await navigator.clipboard.writeText(
          inviteLink
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        alert(
          "링크를 복사하지 못했어요."
        );
      }
    };

  const shareInviteLink =
    async () => {
      const javascriptKey =
        process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

      if (!javascriptKey) {
        alert("카카오톡 공유 설정이 필요해요.");
        return;
      }

      try {
        const kakao = await loadKakaoSdk();

        if (!kakao.isInitialized()) {
          kakao.init(javascriptKey);
        }

        kakao.Share.sendDefault({
          objectType: "text",
          text: "운로그에서 나만의 캐릭터를 만들고 로그 프렌즈가 되어주세요!",
          link: {
            mobileWebUrl: inviteLink,
            webUrl: inviteLink,
          },
          buttons: [
            {
              title: "로그 프렌즈 참여하기",
              link: {
                mobileWebUrl: inviteLink,
                webUrl: inviteLink,
              },
            },
          ],
        });
      } catch (error) {
        console.error("카카오톡 공유 실패:", error);
        alert("카카오톡 공유창을 열지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    };

  /* ========================================
     궁합 상세
  ======================================== */

  const goToRelationshipDetail =
    () => {
      if (!selectedFriend)
        return;

      const params =
        new URLSearchParams({
          name:
            selectedFriend
              .friend.name,

          dayPillar:
            selectedFriend
              .friend
              .dayPillar,

          image:
            selectedFriend
              .friend.image,

          ...(selectedFriend.friend.pillars
            ? { pillars: JSON.stringify(selectedFriend.friend.pillars) }
            : {}),
        });

      router.push(
        `/friends/relationship?${params.toString()}`
      );
    };

  return (
    <main
      className="
        relative
        min-h-full
        bg-white
        pb-[100px]
      "
    >
      {/* ========================================
          정원
      ======================================== */}

      <section
        onTouchStart={handleGardenTouchStart}
        onTouchEnd={handleGardenTouchEnd}
        onTouchCancel={handleGardenTouchCancel}
        className="
          relative
          h-[730px]
          overflow-hidden
          touch-pan-y
        "
        style={{
          backgroundImage:
            `url('${gardenBackgrounds[currentGardenPage]}')`,

          backgroundSize:
            "cover",

          backgroundPosition:
            "top center",

          backgroundRepeat:
            "no-repeat",
        }}
      >
        {/* 상단 */}

        <div
          className="
            relative
            z-40
            px-5
            pt-7
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div>
              <h1
                className="
                  text-[21px]
                  font-extrabold
                  leading-[1.15]
                  tracking-[-0.03em]
                  text-white
                "
              >
                나의 로그 프렌즈✨
              </h1>

              <p
                className="
                  mt-1
                  text-[13px]
                  font-medium
                  leading-[1.25]
                  tracking-[-0.02em]
                  text-white/90
                "
              >
                나와 이어진 인연을 하나씩 기록해보세요
              </p>
            </div>

            <button
              type="button"
              onClick={createInvite}
              disabled={
                creatingInvite
              }
              className="
                mt-[3px]
                shrink-0
                rounded-full
                bg-white/95
                px-4
                py-[10px]
                text-[12px]
                font-bold
                text-[#5A3FE0]
                shadow-sm
                disabled:opacity-60
              "
            >
              {creatingInvite
                ? "링크 만드는 중..."
                : "+ 친구 추가"}
            </button>
          </div>
        </div>

        {/* 정원 캐릭터 */}

        <div
          className="
            absolute
            inset-0
            z-20
          "
        >
          {currentGardenFriends.map(
            (friend, index) => {
              const slot =
                friendSlots[
                  index
                ];

              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() =>
                    openFriendPopup(
                      friend
                    )
                  }
                  className="
                    absolute
                    z-30
                    flex
                    -translate-x-1/2
                    flex-col
                    items-center
                    border-0
                    bg-transparent
                    p-[10px]
                    touch-manipulation
                    select-none
                  "
                  style={{
                    left:
                      slot.left,

                    top:
                      slot.top,

                    WebkitTapHighlightColor:
                      "transparent",
                  }}
                >
                  <div
                    className="
                      mb-[8px]
                      rounded-full
                      border
                      border-white/30
                      bg-[#7861D9]/65
                      px-[13px]
                      py-[1px]
                      shadow-[0_2px_7px_rgba(54,38,120,0.18)]
                      backdrop-blur-[2px]
                    "
                  >
                    <span
                      className="
                        relative
                        -top-[1px]
                        whitespace-nowrap
                        text-[11px]
                        font-semibold
                        leading-[18px]
                        text-white
                      "
                    >
                      {friend.name}
                    </span>
                  </div>

                  <Image
                    src={
                      friend.image
                    }
                    alt={
                      friend.name
                    }
                    width={
                      friend.width
                    }
                    height={
                      friend.width
                    }
                    draggable={
                      false
                    }
                    className="
                      -mt-[10px]
                      h-auto
                      select-none
                      object-contain
                      drop-shadow-sm
                    "
                    style={{
                      width:
                        `${friend.width}px`,
                    }}
                  />
                </button>
              );
            }
          )}
        </div>

        {/* 좌우 화살표 */}

        {totalGardenPages > 1 && (
          <>
            <button
              type="button"
              onClick={
                goToPreviousGardenPage
              }
              disabled={
                currentGardenPage ===
                0
              }
              aria-label="이전 정원"
              className="
                absolute
                left-[10px]
                top-1/2
                z-40
                flex
                h-[44px]
                w-[32px]
                -translate-y-1/2
                items-center
                justify-center
                border-0
                bg-transparent
                p-0
                transition
                active:scale-90
                disabled:opacity-15
              "
            >
              <svg
                viewBox="0 0 24 32"
                aria-hidden="true"
                className="h-[32px] w-[22px] text-white/85 drop-shadow-[0_1px_1px_rgba(60,45,100,0.24)]"
              >
                <path
                  d="M15.5 7.5 7.5 16l8 8.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={
                goToNextGardenPage
              }
              disabled={
                currentGardenPage ===
                totalGardenPages - 1
              }
              aria-label="다음 정원"
              className="
                absolute
                right-[10px]
                top-1/2
                z-40
                flex
                h-[44px]
                w-[32px]
                -translate-y-1/2
                items-center
                justify-center
                border-0
                bg-transparent
                p-0
                transition
                active:scale-90
                disabled:opacity-15
              "
            >
              <svg
                viewBox="0 0 24 32"
                aria-hidden="true"
                className="h-[32px] w-[22px] text-white/85 drop-shadow-[0_1px_1px_rgba(60,45,100,0.24)]"
              >
                <path
                  d="m8.5 7.5 8 8.5-8 8.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </section>

      {/* ========================================
          친구 목록
      ======================================== */}

      <section
        className="
          relative
          z-30
          bg-white
          px-4
          pb-8
          pt-6
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-[8px]
            "
          >
            <h2
              className="
                text-[21px]
                font-extrabold
                tracking-[-0.03em]
                text-[#181525]
              "
            >
              친구 목록
            </h2>

            <span
              className="
                flex
                h-[24px]
                min-w-[24px]
                items-center
                justify-center
                rounded-[8px]
                bg-[#F0EBFF]
                px-[7px]
                text-[12px]
                font-extrabold
                text-[#7354E8]
              "
            >
              {friends.length}
            </span>
          </div>

          <p
            className="
              mt-[4px]
              text-[13px]
              font-medium
              tracking-[-0.02em]
              text-[#918B99]
              sm:text-[12px]
            "
          >
            모든 친구를 확인하고 인연을 관리하세요
          </p>
        </div>

        {/* 친구 리스트 */}

        {friends.length > MAX_GARDEN_FRIENDS &&
          !isLimitNoticeDismissed && (
          <div
            role="status"
            className="relative mt-4 rounded-[12px] bg-[#F6F3FF] py-3 pl-10 pr-10 text-center text-[12px] font-semibold leading-[1.55] tracking-[-0.02em] text-[#7354E8]"
          >
            <p>
              배경에는 최대 24명의 친구가 표시돼요.
              <br />
              추가된 친구는 아래 목록에서 모두 확인할 수 있어요.
            </p>

            <button
              type="button"
              onClick={dismissFriendsLimitNotice}
              aria-label="친구 수 제한 안내 닫기"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-[20px] font-medium leading-none text-[#7354E8] transition-colors hover:bg-white/70 active:bg-white"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-4">
          {currentListFriends.map(
            (friend) => {
              const relationship =
                getRelationshipForFriend(
                  friend
                );
              const normalizedRoleTitle =
                relationship.friendRoleTitle.trim();
              const roleTitleMatch = normalizedRoleTitle.match(
                /^(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)\s*(.*)$/u
              );
              const roleEmoji = roleTitleMatch?.[1] ?? "";
              const roleText = roleTitleMatch?.[2] ?? normalizedRoleTitle;

              return (
                <button
                  key={
                    friend.id
                  }
                  type="button"
                  onClick={() =>
                    openFriendPopup(
                      friend
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    border-b
                    border-[#EEEAF2]
                    bg-white
                    py-[13px]
                    text-left
                    transition
                    active:bg-[#FAF9FD]
                  "
                >
                  {/* 캐릭터 */}

                  <div
                    className="
                      flex
                      h-[58px]
                      w-[58px]
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-[12px]
                      bg-[#F6F3FF]
                    "
                  >
                    <Image
                      src={
                        friend.image
                      }
                      alt={
                        friend.name
                      }
                      width={58}
                      height={58}
                      draggable={
                        false
                      }
                      className="
                        h-[58px]
                        w-[58px]
                        object-contain
                      "
                    />
                  </div>

                  {/* 동물 이름 + 이름 */}

                  <div
                    className="
                      ml-[12px]
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        truncate
                        whitespace-nowrap
                        text-[12px]
                        font-medium
                        leading-[1.3]
                        tracking-[-0.02em]
                        text-[#7354E8]
                        sm:leading-none
                      "
                    >
                      {getDayPillarCharacterName(
                        friend.dayPillar
                      )}
                    </p>

                    <p
                      className="
                        mt-[2px]
                        truncate
                        whitespace-nowrap
                        text-[17px]
                        font-extrabold
                        leading-[1.3]
                        tracking-[-0.025em]
                        text-[#1D1925]
                        sm:mt-[4px]
                        sm:leading-none
                      "
                    >
                      {
                        friend.name
                      }
                    </p>
                  </div>

                  {/* 오른쪽 */}

                  <div
                    className="
                      ml-auto
                      flex
                      shrink-0
                      flex-col
                      items-end
                    "
                  >
                    <p
                      className="
                        whitespace-nowrap
                        text-[11px]
                        font-medium
                        leading-none
                        tracking-[-0.02em]
                        text-[#918B99]
                      "
                    >
                      오늘 궁합
                    </p>

                    <div
                      className="
                        mt-[5px]
                        flex
                        items-center
                        justify-end
                        gap-[15px]
                      "
                    >
                      <div
                        className="
                          relative
                          -top-[1px]
                          flex
                          shrink-0
                          items-center
                          justify-center
                          rounded-[7px]
                          border
                          border-[#E4E1E8]
                          bg-white
                          px-[8px]
                          py-[7px]
                          sm:py-[4px]
                        "
                      >
                        <span className="inline-flex translate-y-px items-center whitespace-nowrap font-medium leading-none tracking-[-0.03em] text-[#777181] sm:translate-y-0">
                          <span className="inline-flex items-center text-[9px] leading-none sm:text-[10px]">{roleEmoji}</span>
                          <span className="inline-flex items-center text-[11px] leading-none sm:text-[10px]">{"\u00A0"}{roleText}</span>
                        </span>
                      </div>

                      <p
                        className="
                          shrink-0
                          whitespace-nowrap
                          text-[22px]
                          font-extrabold
                          leading-none
                          tracking-[-0.03em]
                          text-[#EC5C94]
                        "
                      >
                        {
                          relationship
                            .todayChemistryScore
                        }

                        <span
                          className="
                            ml-[2px]
                            text-[11px]
                            font-bold
                          "
                        >
                          점
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              );
            }
          )}
        </div>

        {totalFriendListPages > 1 && (
          <nav
            aria-label="친구 목록 페이지"
            className="mt-5 max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="mx-auto flex w-max min-w-full items-center justify-center gap-0 px-0">
              {Array.from(
                { length: totalFriendListPages },
                (_, pageIndex) => {
                  const isCurrentPage =
                    currentListPage === pageIndex;

                  return (
                    <button
                      key={pageIndex}
                      type="button"
                      onClick={() =>
                        setCurrentListPage(pageIndex)
                      }
                      aria-label={`친구 목록 ${pageIndex + 1}페이지`}
                      aria-current={
                        isCurrentPage ? "page" : undefined
                      }
                      className={`flex h-10 w-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[13px] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#B6A8F2] ${
                        isCurrentPage
                          ? "font-extrabold text-[#7354E8]"
                          : "font-semibold text-[#C9C4D1] hover:text-[#A99BE9] active:text-[#8D76EB]"
                      }`}
                    >
                      {pageIndex + 1}
                    </button>
                  );
                }
              )}
            </div>
          </nav>
        )}
      </section>

      {/* ========================================
          초대 팝업
      ======================================== */}

      {inviteOpen && (
        <div
          className="
            fixed
            inset-0
            z-[10000]
            flex
            items-center
            justify-center
            px-5
          "
        >
          <div
            onClick={
              closeInvitePopup
            }
            className="
              absolute
              inset-0
              bg-[#17113A]/30
              backdrop-blur-[2px]
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[350px]
              rounded-[26px]
              bg-white/95
              px-5
              pb-5
              pt-6
              shadow-xl
            "
          >
            <button
              type="button"
              onClick={
                closeInvitePopup
              }
              className="
                absolute
                right-4
                top-3
                text-[20px]
                text-[#AAA5B8]
              "
            >
              ×
            </button>

            <div className="text-center">
              <p className="text-[22px]">
                ✨
              </p>

              <h2
                className="
                  mt-1
                  text-[20px]
                  font-extrabold
                  text-[#241B63]
                "
              >
                친구 초대하기
              </h2>

              <p
                className="
                  mt-3
                  text-[14px]
                  font-medium
                  leading-[1.7]
                  text-[#696371]
                "
              >
                친구가 생년월일을 입력하면
                <br />
                나의 로그 프렌즈에
                <br />
                캐릭터가 만들어져요.
              </p>
            </div>

            <div
              className="
                mt-5
                rounded-[14px]
                bg-[#F7F5FC]
                px-3
                py-3
              "
            >
              <p
                className="
                  overflow-hidden
                  text-ellipsis
                  whitespace-nowrap
                  text-[12px]
                  text-[#746E7D]
                "
              >
                {inviteLink}
              </p>
            </div>

            <button
              type="button"
              onClick={
                shareInviteLink
              }
              className="
                mt-3
                w-full
                rounded-[15px]
                bg-[#654AE7]
                py-[12px]
                text-[14px]
                font-extrabold
                text-white
              "
            >
              친구에게 공유하기
            </button>

            <button
              type="button"
              onClick={
                copyInviteLink
              }
              className="
                mt-2
                w-full
                rounded-[15px]
                bg-[#F2EEFF]
                py-[12px]
                text-[14px]
                font-extrabold
                text-[#6048C8]
              "
            >
              초대 링크 복사
            </button>

            {copied && (
              <p
                className="
                  mt-3
                  text-center
                  text-[12px]
                  font-semibold
                  text-[#7057D8]
                "
              >
                초대 링크가 복사되었어요! ✨
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          친구 궁합 팝업
      ======================================== */}

      {selectedFriend && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            px-5
          "
        >
          <div
            onClick={
              closeFriendPopup
            }
            className="
              absolute
              inset-0
              bg-[#17113A]/30
              backdrop-blur-[1px]
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[360px]
              rounded-[24px]
              bg-white/95
              px-5
              pb-4
              pt-5
              shadow-xl
            "
          >
            <button
              type="button"
              onClick={
                closeFriendPopup
              }
              className="
                absolute
                right-4
                top-3
                text-[20px]
                text-[#AAA5B8]
              "
            >
              ×
            </button>

            <div
              className="
                flex
                items-center
                justify-between
                pr-6
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-[11px]
                "
              >
                <div
                  className="
                    flex
                    h-[52px]
                    w-[52px]
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[17px]
                    bg-[#F1EDFF]
                  "
                >
                  <Image
                    src={
                      selectedFriend
                        .friend.image
                    }
                    alt={
                      selectedFriend
                        .friend.name
                    }
                    width={48}
                    height={48}
                    draggable={
                      false
                    }
                    className="
                      h-[48px]
                      w-[48px]
                      object-contain
                    "
                  />
                </div>

                <div
                  className="
                    flex
                    h-[52px]
                    flex-col
                    justify-center
                  "
                >
                  <p
                    className="
                      whitespace-nowrap
                      text-[11px]
                      font-bold
                      leading-none
                      text-[#7861D9]
                    "
                  >
                    {getDayPillarCharacterName(
                      selectedFriend
                        .friend
                        .dayPillar
                    )}
                  </p>

                  <p
                    className="
                      mt-[4px]
                      whitespace-nowrap
                      text-[21px]
                      font-extrabold
                      leading-none
                      text-[#18145B]
                    "
                  >
                    {
                      selectedFriend
                        .friend.name
                    }
                  </p>
                </div>
              </div>

              <div
                className="
                  mr-[10px]
                  flex
                  h-[52px]
                  shrink-0
                  flex-col
                  items-end
                  justify-center
                "
              >
                <p
                  className="
                    whitespace-nowrap
                    text-[11px]
                    font-bold
                    leading-none
                    text-[#EC5C94]
                  "
                >
                  오늘 궁합
                </p>

                <div
                  className="
                    mt-[4px]
                    flex
                    items-end
                  "
                >
                  <span
                    className="
                      text-[26px]
                      font-extrabold
                      leading-none
                      text-[#EC5C94]
                    "
                  >
                    {
                      selectedFriend
                        .relationship
                        .todayChemistryScore
                    }
                  </span>

                  <span
                    className="
                      mb-[1px]
                      ml-[2px]
                      text-[13px]
                      font-bold
                      text-[#EC5C94]
                    "
                  >
                    점
                  </span>
                </div>
              </div>
            </div>

            <div
              className="
                my-4
                h-px
                bg-[#EEEAF5]
              "
            />

            <div className="px-3">
              <p
                className="
                  break-keep
                  text-[15px]
                  font-extrabold
                  text-[#302B64]
                "
              >
                {
                  selectedFriend
                    .relationship
                    .friendRoleTitle
                }
              </p>

              <p
                className="
                  mt-[3px]
                  break-keep
                  text-[15px]
                  font-medium
                  leading-[1.65]
                  text-[#5F5A68]
                "
              >
                {
                  selectedFriend
                    .relationship
                    .friendRoleDescription
                }
              </p>
            </div>

            <div
              aria-hidden="true"
              className="mb-5 mt-3 h-px bg-[#EEEAF5]"
            />

            <button
              type="button"
              onClick={
                goToRelationshipDetail
              }
              className="
                flex
                mx-auto
                w-[86%]
                max-w-[280px]
                items-center
                justify-center
                rounded-[24px]
                bg-[#F1EDFF]
                px-3
                py-[11px]
                transition
                active:scale-[0.98]
                active:bg-[#E9E3FF]
              "
            >
              <span
                className="
                  text-[14px]
                  font-extrabold
                  tracking-[-0.02em]
                  text-[#51408F]
                "
              >
                오늘의 궁합 확인하기
              </span>
            </button>

            <button
              type="button"
              onClick={
                openDeletePopup
              }
              className="
                mt-[7px]
                w-full
                py-[7px]
                text-center
                text-[12px]
                font-medium
                text-[#AAA5B0]
              "
            >
              친구 삭제하기
            </button>
          </div>
        </div>
      )}

      {/* ========================================
          삭제 확인 팝업
      ======================================== */}

      {deleteTargetFriend && (
        <div
          className="
            fixed
            inset-0
            z-[11000]
            flex
            items-center
            justify-center
            px-5
          "
        >
          <div
            onClick={
              closeDeletePopup
            }
            className="
              absolute
              inset-0
              bg-[#17113A]/35
              backdrop-blur-[2px]
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[330px]
              rounded-[24px]
              bg-white
              px-5
              pb-5
              pt-6
              text-center
              shadow-[0_15px_40px_rgba(55,42,105,0.20)]
            "
          >
            <h3
              className="
                break-keep
                text-[18px]
                font-extrabold
                leading-[1.45]
                tracking-[-0.03em]
                text-[#241B63]
              "
            >
              {
                deleteTargetFriend.name
              }
              님을
              <br />
              로그 프렌즈 목록에서 삭제할까요?
            </h3>

            <p
              className="
                mt-3
                break-keep
                text-[13px]
                font-medium
                leading-[1.65]
                tracking-[-0.02em]
                text-[#827C89]
              "
            >
              삭제하면 친구 목록과 정원에서 사라져요.
            </p>

            <div
              className="
                mt-6
                grid
                grid-cols-2
                gap-[8px]
              "
            >
              <button
                type="button"
                onClick={
                  closeDeletePopup
                }
                className="
                  rounded-full
                  bg-[#F4F2F7]
                  py-[11px]
                  text-[13px]
                  font-bold
                  text-[#77717E]
                "
              >
                취소
              </button>

              <button
                type="button"
                onClick={
                  deleteFriend
                }
                className="
                  rounded-full
                  bg-[#EEE9FF]
                  py-[11px]
                  text-[13px]
                  font-extrabold
                  text-[#7354E8]
                "
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          하단 네비게이션
      ======================================== */}

    </main>
  );
}
