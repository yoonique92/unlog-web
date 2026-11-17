"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import MyProfileBirthDate from "../../components/compatibility/MyProfileBirthDate";
import type { UnlogUser } from "../../lib/user";

const relationshipCards = [
  {
    title: "두 사람의 인연\n한눈에 보기",
    category: "인연 요약",
    description: "두 사람의 인연을 한눈에 확인해보세요.",
    cardClass: "border-[#E2DAF8] bg-gradient-to-b from-[#FAF8FF] to-[#F1EBFF]",
    badgeClass: "bg-[#B9A5E8] text-white",
  },
  {
    title: "상대방이 원하는\n이상형은?",
    category: "연애 취향",
    description: "어떤 사람에게 끌릴까요?",
    cardClass: "border-[#F0DDE8] bg-gradient-to-b from-[#FFF9FC] to-[#FBEAF3]",
    badgeClass: "bg-[#F0AFC8] text-white",
  },
  {
    title: "상대방이 바라는\n결혼 상대는?",
    category: "결혼관",
    description: "어떤 배우자와 함께하고 싶을까요?",
    cardClass: "border-[#E2DAF8] bg-gradient-to-b from-[#FBF9FF] to-[#F1EAFF]",
    badgeClass: "bg-[#B7A3E7] text-white",
  },
  {
    title: "나는 상대방의\n이상형에 가까울까?",
    category: "호감 포인트",
    description: "상대 눈에 나는 어떤 사람일까요?",
    cardClass: "border-[#F0DDE8] bg-gradient-to-b from-[#FFF9FC] to-[#FBEAF3]",
    badgeClass: "bg-[#F0AFC8] text-white",
  },
];

export default function CompatibilityPage() {
  const [, setPartner] = useState<UnlogUser | null>(null);
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [canScrollRelationshipLeft, setCanScrollRelationshipLeft] = useState(false);
  const [activeRelationshipCard, setActiveRelationshipCard] = useState(0);
  const relationshipCarouselRef = useRef<HTMLDivElement>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    birthDate: "",
    birthHour: "12",
    birthMinute: "0",
    calendarType: "solar" as "solar" | "lunar",
    gender: "female" as "female" | "male",
  });

  function handlePartnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPartner({
      name: partnerForm.name.trim() || "상대",
      birthDate: partnerForm.birthDate,
      birthHour: Number(partnerForm.birthHour),
      birthMinute: Number(partnerForm.birthMinute),
      calendarType: partnerForm.calendarType,
      gender: partnerForm.gender,
    });
    setIsPartnerFormOpen(false);
  }

  function scrollRelationshipCards(direction: -1 | 1) {
    relationshipCarouselRef.current?.scrollBy({
      left: direction * 218,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-full bg-[#DCD8FF]">
      <div className="relative mx-auto min-h-full w-full overflow-hidden bg-white pb-6">

        <div className="px-5 pb-6">
          <section className="relative -mx-5 aspect-[43/32] overflow-visible bg-[#DCEEFF] px-5 py-5">
            <Image
              src="/image/compatibility/compatibility-story-banner-v11.png"
              alt="하트를 함께 들고 있는 두 양 캐릭터"
              fill
              priority
              unoptimized
              sizes="430px"
              className="object-cover"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[46%] bg-gradient-to-b from-transparent via-white/35 to-white"
            />

            <div className="absolute inset-y-0 left-7 z-10 flex max-w-[58%] -translate-y-[78px] items-center sm:-translate-y-[88px]">
              <div>
                <p className="text-[11px] font-bold tracking-[-0.02em] text-white/75">
                  서로의 마음을 들여다보는 시간
                </p>
                <h1 className="mt-1 break-keep text-[21px] font-extrabold leading-[1.4] tracking-[-0.04em] text-[#283F68]">
                  우리 둘은 어떤 인연으로
                  <br />
                  이어져 있을까요?
                </h1>
              </div>
            </div>
          </section>

          <div className="compatibility-card-enter relative z-20 -mt-[133px] rounded-[18px] border border-white/80 bg-white/70 px-5 pb-7 pt-6 shadow-[0_8px_24px_rgba(76,119,163,0.10)] backdrop-blur-[3px] sm:-mt-[147px]">
            <h2 className="flex items-center gap-1.5 text-[18px] font-extrabold tracking-[-0.03em] text-[#283F68] sm:text-[16px]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] shrink-0 text-[#F48BBD]"
                fill="currentColor"
              >
                <path d="M12 1C13.2 7.2 16.8 10.8 23 12C16.8 13.2 13.2 16.8 12 23C10.8 16.8 7.2 13.2 1 12C7.2 10.8 10.8 7.2 12 1Z" />
              </svg>
              <span>누구와의 인연을 알아볼까요?</span>
            </h2>
            <p className="relative -top-1 mt-1 pl-6 text-[13px] font-medium tracking-[-0.02em] text-[#B4B2BA] sm:top-0">
              궁합을 보고 싶은 사람을 추가해보세요
            </p>
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <div className="relative h-[158px] w-[clamp(100px,26vw,108px)] shrink-0 sm:h-[146px] sm:w-[100px]">
                <div className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-white bg-[#E9E2FF] shadow-[0_5px_18px_rgba(105,85,173,0.18)]">
                  <Image
                    src="/image/home/mouse_character_men.png"
                    alt="내 캐릭터 프로필"
                    fill
                    sizes="100px"
                    className="object-cover object-top"
                  />
                </div>
                <span className="absolute left-1/2 top-[98px] flex h-7 min-w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[#E7E0FA] bg-white px-2 text-[12px] font-bold text-[#7564BC] shadow-[0_4px_12px_rgba(105,85,173,0.10)] sm:top-[90px]">
                  나
                </span>
                <MyProfileBirthDate />
              </div>

              <div className="relative mb-8 h-12 w-[clamp(56px,20vw,88px)] shrink-0 overflow-hidden sm:h-10 sm:w-20">
                <Image
                  src="/image/compatibility/compatibility-heart-connector.png"
                  alt=""
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsPartnerFormOpen(true)}
                className="flex h-[162px] w-[clamp(92px,24vw,104px)] shrink-0 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#CFC5F4] bg-white/65 text-[#8C7BD0] transition active:scale-[0.98] sm:h-[154px] sm:w-24"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A99AE7] text-[18px] font-light leading-none text-white">
                  +
                </span>
                <span className="mt-2 text-center text-[12px] font-bold leading-[1.45]">
                  궁합 상대
                  <br />
                  추가하기
                </span>
              </button>
            </div>
            <button
              type="button"
              className="mx-auto mt-8 flex h-10 w-[calc(100%-24px)] items-center justify-center rounded-full bg-[#7354E8]/15 text-[15px] font-extrabold text-[#7354E8] shadow-[0_7px_18px_rgba(115,84,232,0.10)] transition active:scale-[0.98] sm:mt-7 sm:text-[14px]"
            >
              궁합 보러가기
            </button>

            <section className="mt-[42px] sm:mt-[38px]" aria-label="우리 사이 비밀노트">
              <div className="flex items-center justify-center gap-2">
                <div className="relative h-[24px] min-w-0 flex-1 overflow-hidden">
                  <Image
                    src="/image/compatibility/relationship-note-divider.png"
                    alt=""
                    width={1812}
                    height={724}
                    unoptimized
                    className="absolute -right-[7px] top-1/2 h-auto w-[180px] max-w-none -translate-y-[50.7%]"
                  />
                </div>
                <h2 className="shrink-0 whitespace-nowrap text-[15px] font-extrabold tracking-[-0.035em] text-[#363267] sm:text-[14px]">
                  우리 사이 비밀노트
                </h2>
                <div className="relative h-[24px] min-w-0 flex-1 scale-x-[-1] overflow-hidden">
                  <Image
                    src="/image/compatibility/relationship-note-divider.png"
                    alt=""
                    width={1812}
                    height={724}
                    unoptimized
                    className="absolute -right-[7px] top-1/2 h-auto w-[180px] max-w-none -translate-y-[50.7%]"
                  />
                </div>
              </div>

              <div className="relative -mx-5 mt-4">
                <div
                  ref={relationshipCarouselRef}
                  onScroll={(event) => {
                    const carousel = event.currentTarget;
                    setCanScrollRelationshipLeft(carousel.scrollLeft > 4);
                    const firstCard = carousel.querySelector<HTMLElement>("[data-relationship-card]");
                    if (firstCard) {
                      const isAtEnd =
                        carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
                      setActiveRelationshipCard(
                        isAtEnd
                          ? relationshipCards.length - 1
                          : Math.min(
                              relationshipCards.length - 1,
                              Math.round(carousel.scrollLeft / (firstCard.offsetWidth + 8))
                            )
                      );
                    }
                  }}
                  className="overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex snap-x snap-mandatory items-stretch gap-2">
                    {relationshipCards.map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        data-relationship-card
                        className={`relative flex h-[260px] w-[calc((100vw-80px)*0.6)] max-w-[210px] shrink-0 snap-start flex-col items-start overflow-hidden rounded-[20px] border px-5 py-5 text-left shadow-[0_6px_18px_rgba(103,81,181,0.07)] transition active:scale-[0.98] ${card.cardClass}`}
                      >
                        <span className={`inline-flex h-5 items-center rounded-[5px] px-1.5 text-[10px] font-bold ${card.badgeClass}`}>
                          {card.category}
                        </span>
                        <span className="mt-4 block whitespace-pre-line break-keep text-[18px] font-extrabold leading-[1.35] tracking-[-0.045em] text-[#25234E]">
                          {card.title}
                        </span>
                        <span className="mt-3 block break-keep text-[13px] font-medium leading-[1.5] tracking-[-0.025em] text-[#85818F]">
                          {card.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {canScrollRelationshipLeft && (
                  <button
                    type="button"
                    aria-label="이전 관계 카드 보기"
                    onClick={() => scrollRelationshipCards(-1)}
                    className="absolute left-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/50 text-[#8065D0]/80 shadow-[0_4px_12px_rgba(72,52,135,0.10)] backdrop-blur-sm transition active:scale-95 sm:flex"
                  >
                    <ChevronLeft size={17} strokeWidth={2.1} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="다음 관계 카드 보기"
                  onClick={() => scrollRelationshipCards(1)}
                  className="absolute right-1 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/50 text-[#8065D0]/80 shadow-[0_4px_12px_rgba(72,52,135,0.10)] backdrop-blur-sm transition active:scale-95 sm:flex"
                >
                  <ChevronRight size={17} strokeWidth={2.1} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2" aria-label="관계 카드 위치">
                {relationshipCards.map((card, index) => (
                  <span
                    key={card.title}
                    className={`h-2 rounded-full transition-all ${activeRelationshipCard === index ? "w-4 bg-[#7654DE]" : "w-2 bg-[#E5DFF1]"}`}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {isPartnerFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17113A]/35 px-4 pb-5 sm:items-center sm:pb-0">
            <form
              onSubmit={handlePartnerSubmit}
              className="w-full max-w-[390px] rounded-[24px] bg-white p-5 shadow-[0_18px_50px_rgba(41,31,78,0.20)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-extrabold text-[#283F68]">궁합 상대 추가하기</h2>
                <button
                  type="button"
                  onClick={() => setIsPartnerFormOpen(false)}
                  aria-label="닫기"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F1F7] text-[20px] text-[#8C8794]"
                >
                  ×
                </button>
              </div>

              <label className="mt-5 block text-[12px] font-bold text-[#716B7A]">
                이름
                <input
                  value={partnerForm.name}
                  onChange={(event) => setPartnerForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="상대 이름"
                  className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none focus:border-[#9B88E5]"
                />
              </label>

              <label className="mt-3 block text-[12px] font-bold text-[#716B7A]">
                생년월일
                <input
                  type="date"
                  required
                  value={partnerForm.birthDate}
                  onChange={(event) => setPartnerForm((current) => ({ ...current, birthDate: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none focus:border-[#9B88E5]"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[12px] font-bold text-[#716B7A]">
                  달력
                  <select
                    value={partnerForm.calendarType}
                    onChange={(event) => setPartnerForm((current) => ({ ...current, calendarType: event.target.value as "solar" | "lunar" }))}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none"
                  >
                    <option value="solar">양력</option>
                    <option value="lunar">음력</option>
                  </select>
                </label>
                <label className="text-[12px] font-bold text-[#716B7A]">
                  성별
                  <select
                    value={partnerForm.gender}
                    onChange={(event) => setPartnerForm((current) => ({ ...current, gender: event.target.value as "female" | "male" }))}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none"
                  >
                    <option value="female">여성</option>
                    <option value="male">남성</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[12px] font-bold text-[#716B7A]">
                  출생 시
                  <input
                    type="number"
                    min="0"
                    max="23"
                    required
                    value={partnerForm.birthHour}
                    onChange={(event) => setPartnerForm((current) => ({ ...current, birthHour: event.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none"
                  />
                </label>
                <label className="text-[12px] font-bold text-[#716B7A]">
                  출생 분
                  <input
                    type="number"
                    min="0"
                    max="59"
                    required
                    value={partnerForm.birthMinute}
                    onChange={(event) => setPartnerForm((current) => ({ ...current, birthMinute: event.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-[12px] border border-[#E5E1EC] bg-[#FAF9FC] px-3 text-[14px] outline-none"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#7354E8]/15 text-[15px] font-extrabold text-[#7354E8]"
              >
                상대 추가하기
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}
