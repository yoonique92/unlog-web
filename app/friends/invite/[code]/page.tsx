"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { getSaju } from "../../../../lib/saju";
import {
  FRIEND_LIMIT_REACHED_CODE,
  FRIEND_LIMIT_REACHED_MESSAGE,
} from "../../../../lib/friends/limit";
import BirthDateInput, {
  isValidBirthDate,
} from "../../../../components/BirthDateInput";

type Gender = "male" | "female";
type DrawStep = "form" | "drawing" | "result";

type CharacterProfile = {
  coreType: string;
  relationshipStyle: string;
  strength: string;
};

/* ========================================
   천간 변환
======================================== */

function normalizeStem(stem: string) {
  const stemMap: Record<string, string> = {
    갑: "갑",
    을: "을",
    병: "병",
    정: "정",
    무: "무",
    기: "기",
    경: "경",
    신: "신",
    임: "임",
    계: "계",

    甲: "갑",
    乙: "을",
    丙: "병",
    丁: "정",
    戊: "무",
    己: "기",
    庚: "경",
    辛: "신",
    壬: "임",
    癸: "계",
  };

  return stemMap[stem] ?? stem;
}

/* ========================================
   지지 변환
======================================== */

function normalizeBranch(branch: string) {
  const branchMap: Record<string, string> = {
    자: "자",
    축: "축",
    인: "인",
    묘: "묘",
    진: "진",
    사: "사",
    오: "오",
    미: "미",
    신: "신",
    유: "유",
    술: "술",
    해: "해",

    子: "자",
    丑: "축",
    寅: "인",
    卯: "묘",
    辰: "진",
    巳: "사",
    午: "오",
    未: "미",
    申: "신",
    酉: "유",
    戌: "술",
    亥: "해",
  };

  return branchMap[branch] ?? branch;
}

/* ========================================
   일주 한글 변환
======================================== */

function getKoreanDayPillar(dayPillar: string) {
  if (!dayPillar || dayPillar.length < 2) {
    return dayPillar;
  }

  const stem = normalizeStem(dayPillar.charAt(0));
  const branch = normalizeBranch(dayPillar.charAt(1));

  return `${stem}${branch}`;
}

/* ========================================
   캐릭터 이름
======================================== */

function getCharacterName(dayPillar: string) {
  const stem = normalizeStem(dayPillar.charAt(0));
  const branch = normalizeBranch(dayPillar.charAt(1));

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
  };

  const color = stemColor[stem] ?? "";
  const animal = branchAnimal[branch] ?? "";

  return `${color} ${animal}`.trim();
}

/* ========================================
   일간 → 핵심 성향
======================================== */

function getCoreType(dayPillar: string) {
  const stem = normalizeStem(dayPillar.charAt(0));

  const coreTypeMap: Record<string, string> = {
    갑: "개척형",
    을: "적응형",
    병: "열정형",
    정: "섬세형",
    무: "안정형",
    기: "배려형",
    경: "결단형",
    신: "완벽형",
    임: "자유형",
    계: "감성형",
  };

  return coreTypeMap[stem] ?? "균형형";
}

/* ========================================
   60갑자 → 관계 스타일 / 강점
======================================== */

const dayPillarProfileMap: Record<
  string,
  {
    relationshipStyle: string;
    strength: string;
  }
> = {
  갑자: { relationshipStyle: "독립성", strength: "판단력" },
  을축: { relationshipStyle: "신뢰", strength: "끈기" },
  병인: { relationshipStyle: "의리", strength: "추진력" },
  정묘: { relationshipStyle: "다정함", strength: "공감력" },
  무진: { relationshipStyle: "포용", strength: "책임감" },
  기사: { relationshipStyle: "배려", strength: "관찰력" },
  경오: { relationshipStyle: "솔직함", strength: "실행력" },
  신미: { relationshipStyle: "신중함", strength: "집중력" },
  임신: { relationshipStyle: "친화력", strength: "순발력" },
  계유: { relationshipStyle: "진정성", strength: "관찰력" },

  갑술: { relationshipStyle: "의리", strength: "책임감" },
  을해: { relationshipStyle: "공감", strength: "적응력" },
  병자: { relationshipStyle: "표현력", strength: "창의력" },
  정축: { relationshipStyle: "신뢰", strength: "끈기" },
  무인: { relationshipStyle: "포용", strength: "추진력" },
  기묘: { relationshipStyle: "다정함", strength: "공감력" },
  경진: { relationshipStyle: "진정성", strength: "판단력" },
  신사: { relationshipStyle: "솔직함", strength: "집중력" },
  임오: { relationshipStyle: "표현력", strength: "실행력" },
  계미: { relationshipStyle: "배려", strength: "공감력" },

  갑신: { relationshipStyle: "독립성", strength: "순발력" },
  을유: { relationshipStyle: "신중함", strength: "관찰력" },
  병술: { relationshipStyle: "의리", strength: "책임감" },
  정해: { relationshipStyle: "공감", strength: "창의력" },
  무자: { relationshipStyle: "신뢰", strength: "판단력" },
  기축: { relationshipStyle: "배려", strength: "끈기" },
  경인: { relationshipStyle: "솔직함", strength: "추진력" },
  신묘: { relationshipStyle: "다정함", strength: "관찰력" },
  임진: { relationshipStyle: "포용", strength: "적응력" },
  계사: { relationshipStyle: "표현력", strength: "순발력" },

  갑오: { relationshipStyle: "솔직함", strength: "추진력" },
  을미: { relationshipStyle: "배려", strength: "적응력" },
  병신: { relationshipStyle: "친화력", strength: "순발력" },
  정유: { relationshipStyle: "진정성", strength: "집중력" },
  무술: { relationshipStyle: "신뢰", strength: "책임감" },
  기해: { relationshipStyle: "공감", strength: "포용력" },
  경자: { relationshipStyle: "독립성", strength: "판단력" },
  신축: { relationshipStyle: "신중함", strength: "끈기" },
  임인: { relationshipStyle: "의리", strength: "추진력" },
  계묘: { relationshipStyle: "공감", strength: "관찰력" },

  갑진: { relationshipStyle: "포용", strength: "책임감" },
  을사: { relationshipStyle: "친화력", strength: "적응력" },
  병오: { relationshipStyle: "솔직함", strength: "추진력" },
  정미: { relationshipStyle: "다정함", strength: "공감력" },
  무신: { relationshipStyle: "독립성", strength: "판단력" },
  기유: { relationshipStyle: "신중함", strength: "관찰력" },
  경술: { relationshipStyle: "의리", strength: "책임감" },
  신해: { relationshipStyle: "공감", strength: "창의력" },
  임자: { relationshipStyle: "자유로움", strength: "적응력" },
  계축: { relationshipStyle: "신뢰", strength: "끈기" },

  갑인: { relationshipStyle: "의리", strength: "추진력" },
  을묘: { relationshipStyle: "다정함", strength: "공감력" },
  병진: { relationshipStyle: "포용", strength: "실행력" },
  정사: { relationshipStyle: "표현력", strength: "집중력" },
  무오: { relationshipStyle: "솔직함", strength: "책임감" },
  기미: { relationshipStyle: "배려", strength: "포용력" },
  경신: { relationshipStyle: "독립성", strength: "판단력" },
  신유: { relationshipStyle: "진정성", strength: "집중력" },
  임술: { relationshipStyle: "의리", strength: "적응력" },
  계해: { relationshipStyle: "공감", strength: "창의력" },
};

function getCharacterProfile(
  dayPillar: string
): CharacterProfile {
  const koreanDayPillar =
    getKoreanDayPillar(dayPillar);

  const profile =
    dayPillarProfileMap[koreanDayPillar];

  return {
    coreType: getCoreType(dayPillar),
    relationshipStyle:
      profile?.relationshipStyle ?? "신뢰",
    strength:
      profile?.strength ?? "적응력",
  };
}

/* ========================================
   캐릭터 한줄 설명
======================================== */

function getCharacterDescription(
  dayPillar: string
) {
  const stem =
    normalizeStem(dayPillar.charAt(0));

  const branch =
    normalizeBranch(dayPillar.charAt(1));

  const stemTrait: Record<string, string> = {
    갑: "새로운 길을 먼저 발견하고",
    을: "주변의 흐름을 섬세하게 살피고",
    병: "좋아하는 일에는 누구보다 뜨겁고",
    정: "마음속 온기를 조용히 오래 간직하고",
    무: "쉽게 흔들리지 않고 자기 자리를 지키며",
    기: "사람과 상황을 세심하게 돌보고",
    경: "자기만의 기준을 또렷하게 세우고",
    신: "작은 차이도 빠르게 알아차리고",
    임: "넓은 시야로 새로운 가능성을 찾아가고",
    계: "말하지 않은 마음까지 섬세하게 느끼고",
  };

  const branchTrait: Record<string, string> = {
    자: "필요한 순간에는 누구보다 영리하게 움직여요",
    축: "소중한 것은 천천히 오래 지켜가요",
    인: "소중한 사람은 끝까지 챙겨요",
    묘: "부드러운 방식으로 사람의 마음을 편하게 해줘요",
    진: "큰 목표가 생기면 끝까지 밀고 나가요",
    사: "상황을 빠르게 읽고 가장 좋은 순간을 놓치지 않아요",
    오: "마음이 움직이면 망설이지 않고 먼저 달려가요",
    미: "곁에 있는 사람을 자연스럽게 따뜻하게 감싸줘요",
    신: "새로운 상황에서도 재치 있게 답을 찾아가요",
    유: "좋고 싫은 것이 분명하고 자신만의 매력을 지켜요",
    술: "한번 마음을 준 사람에게는 오래 의리를 지켜요",
    해: "마음을 연 사람에게는 깊고 다정하게 다가가요",
  };

  const first =
    stemTrait[stem] ??
    "자신만의 방식으로 세상을 바라보고";

  const second =
    branchTrait[branch] ??
    "소중한 사람과 오래 인연을 이어가요";

  return `${first}, ${second}`;
}

/* ========================================
   캐릭터 이미지
======================================== */

function getCharacterImage(
  dayPillar: string,
  gender: Gender
) {
  const branch =
    normalizeBranch(dayPillar.charAt(1));

  if (branch === "자") {
    return "/image/friends/mouse_character_men.png";
  }

  if (branch === "인") {
    return "/image/friends/tiger_character_women.png";
  }

  if (branch === "진") {
    return "/image/friends/dragon_character_men.png";
  }

  if (branch === "해") {
    return "/image/friends/pig_character_men.png";
  }

  /*
    아직 이미지가 없는 동물은 임시 이미지
  */

  return gender === "female"
    ? "/image/friends/tiger_character_women.png"
    : "/image/friends/dragon_character_men.png";
}

/* ========================================
   PAGE
======================================== */

export default function FriendInvitePage() {
  const params = useParams();
  const router = useRouter();

  const code =
    String(params.code ?? "");

  /* ========================================
     입력
  ======================================== */

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [birthMinute, setBirthMinute] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [calendarType, setCalendarType] =
    useState<"solar" | "lunar">("solar");
  const [gender, setGender] =
    useState<Gender | "">("");

  /* ========================================
     화면
  ======================================== */

  const [loading, setLoading] =
    useState(false);

  const [drawStep, setDrawStep] =
    useState<DrawStep>("form");

  /* ========================================
     결과
  ======================================== */

  const [dayPillar, setDayPillar] =
    useState("");

  const [
    characterName,
    setCharacterName,
  ] = useState("");

  const [
    characterImage,
    setCharacterImage,
  ] = useState("");

  const [
    characterDescription,
    setCharacterDescription,
  ] = useState("");

  /* ========================================
     ★ 새로 추가
     친구 관계 ID

     캐릭터 등록 성공 시 서버에서 받아두고
     회원가입 페이지까지 전달
  ======================================== */

  const [
    connectionId,
    setConnectionId,
  ] = useState("");

  /* ========================================
     태어난 시간 모름
  ======================================== */

  const toggleTimeUnknown = () => {
    setTimeUnknown((prev) => {
      const next = !prev;

      if (next) {
        setBirthHour("");
        setBirthMinute("");
      }

      return next;
    });
  };

  /* ========================================
     캐릭터 뽑기
  ======================================== */

  const drawCharacter = async () => {
    if (
      !name ||
      !isValidBirthDate(birthDate) ||
      !gender
    ) {
      alert(
        "이름, 생년월일, 성별을 입력해주세요."
      );

      return;
    }

    if (
      !timeUnknown &&
      (
        (birthHour &&
          !birthMinute) ||
        (!birthHour &&
          birthMinute)
      )
    ) {
      alert(
        "태어난 시간을 모두 입력하거나 '모름'을 선택해주세요."
      );

      return;
    }

    try {
      setLoading(true);

      const hour =
        timeUnknown
          ? "12"
          : birthHour || "12";

      const minute =
        timeUnknown
          ? "0"
          : birthMinute || "0";

      /* ========================================
         사주 계산
      ======================================== */

      const sajuResult =
        getSaju(
          birthDate,
          hour,
          minute,
          calendarType,
          gender,
          timeUnknown
        );

      const calculatedDayPillar =
        `${sajuResult.dayStem}${sajuResult.dayBranch}`;

      /* ========================================
         캐릭터 계산
      ======================================== */

      const newCharacterName =
        getCharacterName(
          calculatedDayPillar
        );

      const newCharacterImage =
        getCharacterImage(
          calculatedDayPillar,
          gender
        );

      const newDescription =
        getCharacterDescription(
          calculatedDayPillar
        );

      /* ========================================
         친구 관계 저장
      ======================================== */

      const response =
        await fetch(
          "/api/friends/invite/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                code,

                friend: {
                  name,
                  birthDate,

                  birthHour:
                    hour,

                  birthMinute:
                    minute,

                  birthTimeUnknown:
                    timeUnknown,

                  calendarType,

                  gender,

                  dayPillar:
                    calculatedDayPillar,

                  characterName:
                    newCharacterName,

                  image:
                    newCharacterImage,
                },
              }),
          }
        );

      /* ========================================
         서버 응답 받기
      ======================================== */

      const data =
        await response.json();

      if (
        response.status === 429 ||
        data?.code === FRIEND_LIMIT_REACHED_CODE
      ) {
        alert(FRIEND_LIMIT_REACHED_MESSAGE);
        return;
      }

      /* ========================================
         중복 등록
      ======================================== */

      if (
        response.status === 409 ||
        data?.code ===
          "ALREADY_REGISTERED"
      ) {
        alert(
          "이미 이 로그 프렌즈에 등록된 캐릭터예요."
        );

        return;
      }

      /* ========================================
         잘못된 초대 링크
      ======================================== */

      if (
        response.status === 404 ||
        data?.code ===
          "INVALID_INVITE"
      ) {
        alert(
          "유효하지 않은 초대 링크예요."
        );

        return;
      }

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            "친구 등록 실패"
        );
      }

      /* ========================================
         ★ connectionId 저장

         회원가입할 때 이 값을 넘김
      ======================================== */

      if (
        !data.connectionId
      ) {
        throw new Error(
          "친구 관계 ID가 없습니다."
        );
      }

      setConnectionId(
        data.connectionId
      );

      /* ========================================
         결과 저장
      ======================================== */

      setDayPillar(
        calculatedDayPillar
      );

      setCharacterName(
        newCharacterName
      );

      setCharacterImage(
        newCharacterImage
      );

      setCharacterDescription(
        newDescription
      );

      /* ========================================
         3초 캐릭터 뽑기
      ======================================== */

      setDrawStep(
        "drawing"
      );

      setTimeout(() => {
        setDrawStep(
          "result"
        );
      }, 3000);
    } catch (error) {
      console.error(
        "캐릭터 생성 오류:",
        error
      );

      alert(
        "캐릭터를 뽑지 못했어요."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     캐릭터 뽑는 중
  ======================================== */

  if (
    drawStep === "drawing"
  ) {
    return (
      <main
        className="
          flex
          min-h-full
          items-center
          justify-center
          bg-[#F5F2FF]
          px-5
        "
      >
        <div
          className="
            w-full
            max-w-[390px]
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-[190px]
              w-[190px]
              animate-pulse
              items-center
              justify-center
              rounded-full
              bg-white/80
              shadow-[0_0_50px_rgba(117,87,230,0.22)]
            "
          >
            <div
              className="
                flex
                h-[145px]
                w-[145px]
                items-center
                justify-center
                rounded-full
                bg-[#EEE8FF]
              "
            >
              <span
                className="
                  text-[62px]
                  font-extrabold
                  text-[#7A5FE5]
                "
              >
                ?
              </span>
            </div>
          </div>

          <div
            className="
              mt-7
              flex
              items-center
              justify-center
              gap-[6px]
            "
          >
            <span
              className="
                animate-pulse
                text-[22px]
                font-extrabold
                tracking-[-0.04em]
                text-[#241B63]
              "
            >
              내 캐릭터 뽑는 중
            </span>

            <span
              className="
                flex
                h-[20px]
                items-end
                gap-[4px]
                pb-[3px]
              "
            >
              <span
                className="
                  inline-block
                  h-[5px]
                  w-[5px]
                  animate-bounce
                  rounded-full
                  bg-[#7A5FE5]
                "
                style={{
                  animationDelay:
                    "0ms",

                  animationDuration:
                    "900ms",
                }}
              />

              <span
                className="
                  inline-block
                  h-[5px]
                  w-[5px]
                  animate-bounce
                  rounded-full
                  bg-[#7A5FE5]
                "
                style={{
                  animationDelay:
                    "150ms",

                  animationDuration:
                    "900ms",
                }}
              />

              <span
                className="
                  inline-block
                  h-[5px]
                  w-[5px]
                  animate-bounce
                  rounded-full
                  bg-[#7A5FE5]
                "
                style={{
                  animationDelay:
                    "300ms",

                  animationDuration:
                    "900ms",
                }}
              />
            </span>
          </div>

          <p
            className="
              mt-3
              text-[14px]
              font-medium
              leading-[1.7]
              text-[#918B99]
            "
          >
            태어난 날의 기운을 따라
            <br />
            나만의 로그 캐릭터를 찾고 있어요
          </p>
        </div>
      </main>
    );
  }

  /* ========================================
     결과 화면
  ======================================== */

  if (
    drawStep === "result"
  ) {
    const koreanDayPillar =
      getKoreanDayPillar(
        dayPillar
      );

    const profile =
      getCharacterProfile(
        dayPillar
      );

    return (
      <main
        className="
          flex
          min-h-full
          items-center
          justify-center
          bg-[#F5F2FF]
          px-5
          py-8
        "
      >
        <div
          className="
            w-full
            max-w-[390px]
            rounded-[30px]
            bg-white
            px-5
            pb-7
            pt-8
            text-center
            shadow-[0_12px_36px_rgba(77,60,138,0.10)]
          "
        >
          {/* 이름 */}

          <p
            className="
              text-[20px]
              font-extrabold
              tracking-[-0.035em]
              text-[#241B63]
            "
          >
            <span
              className="
                text-[#654AE7]
              "
            >
              {name}
            </span>
            님의 캐릭터
          </p>

          {/* 캐릭터 */}

          {characterImage && (
            <div
              className="
                mt-5
                flex
                justify-center
              "
            >
              <Image
                src={
                  characterImage
                }
                alt={
                  characterName
                }
                width={230}
                height={230}
                priority
                draggable={false}
                className="
                  h-[230px]
                  w-[230px]
                  select-none
                  object-contain
                  drop-shadow-[0_12px_20px_rgba(70,55,130,0.12)]
                "
              />
            </div>
          )}

          {/* ========================================
              태그 5개
          ======================================== */}

          <div
            className="
              mt-2
              flex
              w-full
              flex-nowrap
              items-center
              justify-center
              gap-[4px]
            "
          >
            {[
              `${koreanDayPillar}일주`,
              characterName,
              profile.coreType,
              profile.relationshipStyle,
              profile.strength,
            ].map(
              (
                tag,
                index
              ) => (
                <span
                  key={`${tag}-${index}`}
                  className="
                    shrink-0
                    whitespace-nowrap
                    rounded-full
                    border
                    border-[#E8E2F7]
                    bg-[#F8F6FF]
                    px-[6px]
                    py-[4px]
                    text-[11px]
                    font-bold
                    tracking-[-0.035em]
                    text-[#6E667B]
                  "
                >
                  {tag}
                </span>
              )
            )}
          </div>

          {/* ========================================
              캐릭터 설명
          ======================================== */}

          <p
            className="
              mx-auto
              mt-3
              max-w-[330px]
              break-keep
              text-[15px]
              font-semibold
              leading-[1.7]
              tracking-[-0.02em]
              text-[#494451]
            "
          >
            {characterDescription
              .split(",")
              .map(
                (
                  text,
                  index
                ) => (
                  <span
                    key={index}
                    className="block"
                  >
                    {
                      text.trim()
                    }

                    {index === 0 &&
                      ","}
                  </span>
                )
              )}
          </p>

          {/* ========================================
              가입 CTA
          ======================================== */}

          <div className="mt-15">
            {/* 핑크 말풍선 */}

            <div
              className="
                relative
                mx-auto
                mb-3
                w-fit
                animate-[bounce_2.2s_ease-in-out_infinite]
                rounded-full
                bg-[#FF5C9A]
                px-4
                py-[9px]
                shadow-[0_6px_16px_rgba(255,92,154,0.25)]
              "
            >
              <p
                className="
                  whitespace-nowrap
                  text-[12px]
                  font-bold
                  tracking-[-0.025em]
                  text-white
                "
              >
                내 캐릭터 저장하고 친구들 모아보기
              </p>

              <div
                className="
                  absolute
                  -bottom-[6px]
                  left-1/2
                  h-0
                  w-0
                  -translate-x-1/2
                  border-l-[7px]
                  border-r-[7px]
                  border-t-[7px]
                  border-l-transparent
                  border-r-transparent
                  border-t-[#FF5C9A]
                "
              />
            </div>

            {/* ========================================
                운로그 시작하기

                ★ connectionId를 회원가입 화면으로 전달
            ======================================== */}

            <button
              type="button"
              onClick={() => {
                if (
                  !connectionId
                ) {
                  alert(
                    "친구 연결 정보를 찾지 못했어요."
                  );

                  return;
                }

                const signupParams =
                  new URLSearchParams({
                    connectionId,
                  });

                router.push(
                  `/signup?${signupParams.toString()}`
                );
              }}
              className="
                mx-auto
                block
                w-[230px]
                rounded-full
                bg-[#654AE7]
                px-4
                py-[13px]
                text-[15px]
                font-extrabold
                text-white
                shadow-[0_6px_18px_rgba(101,74,231,0.18)]
                transition
                active:scale-[0.98]
              "
            >
              운로그 시작하기
            </button>
          </div>

          {/* ========================================
              다음에
          ======================================== */}

          <button
            type="button"
            onClick={() => {
              router.push(
                "/friends"
              );
            }}
            className="
              mt-2
              w-full
              py-2
              text-[13px]
              font-medium
              text-[#918B99]
            "
          >
            다음에 할게요
          </button>
        </div>
      </main>
    );
  }

  /* ========================================
     입력 화면
  ======================================== */

  return (
    <main
      className="
        min-h-full
        bg-[#F5F2FF]
        px-5
        py-10
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[390px]
        "
      >
        {/* 상단 */}

        <div className="text-center">
          <p
            className="
              text-[13px]
              font-bold
              text-[#8A7BBC]
            "
          >
            운로그
          </p>

          <h1
            className="
              mt-2
              text-[25px]
              font-extrabold
              tracking-[-0.04em]
              text-[#241B63]
            "
          >
            나의 로그 캐릭터는?
          </h1>

          <p
            className="
              mt-3
              break-keep
              text-[14px]
              font-medium
              leading-[1.7]
              text-[#706A77]
            "
          >
            태어난 날의 기운으로
            <br />
            나만의 캐릭터를 뽑아보세요
          </p>
        </div>

        {/* 입력 카드 */}

        <div
          className="
            mt-8
            rounded-[28px]
            bg-white
            px-5
            py-6
            shadow-[0_10px_30px_rgba(77,60,138,0.08)]
          "
        >
          {/* 이름 */}

          <label
            className="
              text-[13px]
              font-bold
              text-[#393344]
            "
          >
            이름
          </label>

          <input
            type="text"
            value={name}
            onChange={(
              event
            ) =>
              setName(
                Array.from(
                  event.target.value
                )
                  .slice(0, 6)
                  .join("")
              )
            }
            maxLength={6}
            placeholder="이름을 입력해주세요"
            className="
              mt-2
              w-full
              rounded-[14px]
              border
              border-[#E5E0F2]
              bg-[#FAF9FD]
              px-4
              py-[12px]
              text-[15px]
              outline-none
              focus:border-[#8068E7]
            "
          />

          {/* 생년월일 */}

          <label
            className="
              mt-5
              block
              text-[13px]
              font-bold
              text-[#393344]
            "
          >
            생년월일
          </label>

          <BirthDateInput
            className="mt-2"
            onChange={setBirthDate}
          />

          {/* 태어난 시간 */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-between
            "
          >
            <label
              className="
                text-[13px]
                font-bold
                text-[#393344]
              "
            >
              태어난 시간
            </label>

            <button
              type="button"
              onClick={
                toggleTimeUnknown
              }
              className={`
                rounded-full
                border
                px-[11px]
                py-[4px]
                text-[11px]
                font-bold
                transition

                ${
                  timeUnknown
                    ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
                    : "border-[#DED8EA] bg-white text-[#918B99]"
                }
              `}
            >
              모름
            </button>
          </div>

          {/* 시간 */}

          <div
            className="
              mt-2
              grid
              grid-cols-2
              gap-2
            "
          >
            <input
              type="number"
              min="0"
              max="23"
              disabled={
                timeUnknown
              }
              value={
                birthHour
              }
              onChange={(
                event
              ) =>
                setBirthHour(
                  event.target.value
                )
              }
              placeholder="시"
              className={`
                rounded-[14px]
                border
                px-4
                py-[12px]
                text-center
                text-[15px]
                outline-none
                transition

                ${
                  timeUnknown
                    ? "cursor-not-allowed border-[#ECE8F1] bg-[#F3F1F5] text-[#BBB6C0]"
                    : "border-[#E5E0F2] bg-[#FAF9FD] text-[#393344] focus:border-[#8068E7]"
                }
              `}
            />

            <input
              type="number"
              min="0"
              max="59"
              disabled={
                timeUnknown
              }
              value={
                birthMinute
              }
              onChange={(
                event
              ) =>
                setBirthMinute(
                  event.target.value
                )
              }
              placeholder="분"
              className={`
                rounded-[14px]
                border
                px-4
                py-[12px]
                text-center
                text-[15px]
                outline-none
                transition

                ${
                  timeUnknown
                    ? "cursor-not-allowed border-[#ECE8F1] bg-[#F3F1F5] text-[#BBB6C0]"
                    : "border-[#E5E0F2] bg-[#FAF9FD] text-[#393344] focus:border-[#8068E7]"
                }
              `}
            />
          </div>

          {timeUnknown && (
            <p
              className="
                mt-[6px]
                text-[11px]
                font-medium
                text-[#918B99]
              "
            >
              태어난 시간을 몰라도 캐릭터를 뽑을 수 있어요.
            </p>
          )}

          {/* 달력 기준 */}

          <p className="mt-5 text-[13px] font-bold text-[#393344]">
            달력 기준
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCalendarType("solar")}
              className={`rounded-[14px] border py-[11px] text-[14px] font-bold ${
                calendarType === "solar"
                  ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
                  : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
              }`}
            >
              양력
            </button>

            <button
              type="button"
              onClick={() => setCalendarType("lunar")}
              className={`rounded-[14px] border py-[11px] text-[14px] font-bold ${
                calendarType === "lunar"
                  ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
                  : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
              }`}
            >
              음력
            </button>
          </div>

          {/* 성별 */}

          <label
            className="
              mt-5
              block
              text-[13px]
              font-bold
              text-[#393344]
            "
          >
            성별
          </label>

          <div
            className="
              mt-2
              grid
              grid-cols-2
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                setGender(
                  "female"
                )
              }
              className={`
                rounded-[14px]
                border
                py-[11px]
                text-[14px]
                font-bold

                ${
                  gender === "female"
                    ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
                    : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
                }
              `}
            >
              여성
            </button>

            <button
              type="button"
              onClick={() =>
                setGender(
                  "male"
                )
              }
              className={`
                rounded-[14px]
                border
                py-[11px]
                text-[14px]
                font-bold

                ${
                  gender === "male"
                    ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
                    : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
                }
              `}
            >
              남성
            </button>
          </div>

          {/* 캐릭터 뽑기 */}

          <button
            type="button"
            disabled={loading}
            onClick={
              drawCharacter
            }
            className="
              mt-7
              w-full
              rounded-[16px]
              bg-[#654AE7]
              px-4
              py-[14px]
              text-[15px]
              font-extrabold
              text-white
              shadow-[0_6px_18px_rgba(101,74,231,0.20)]
              disabled:opacity-50
            "
          >
            {loading
              ? "내 캐릭터를 준비하고 있어요..."
              : "내 캐릭터 뽑아보기"}
          </button>
        </div>
      </div>
    </main>
  );
}
