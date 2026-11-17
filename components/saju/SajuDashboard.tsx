"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UnlogUser } from "../../lib/user";

type SajuDashboardProps = {
  user: UnlogUser;
  bannerImage?: string;
};

type MenuCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href?: string;
  image?: string;
  overlayImage?: string;
};

const insightCards: MenuCard[] = [
  { title: "신년운세", description: "", icon: UserRoundSearch, color: "bg-[#EEE9FF] text-[#7652E8]", href: "/saju/yearly", image: "/image/saju/new-year-card-main-v2.png" },
  { title: "대운 흐름", description: "", icon: ShieldCheck, color: "bg-[#EEE9FF] text-[#7652E8]", image: "/image/saju/daeun-card-background.png", overlayImage: "/image/saju/daeun-card-title.png" },
  { title: "월별 운세", description: "", icon: Search, color: "bg-[#EEE9FF] text-[#7652E8]", image: "/image/saju/monthly-card-background.png", overlayImage: "/image/saju/monthly-card-title-v3.png" },
];

const lifeStoryTopics = [
  "연상 vs 연하, 나와 더 잘 맞는 쪽은?",
  "내가 원하는 배우자는 어떤 사람일까?",
  "나에게 끌리는 사람은 어떤 타입일까?",
  "나만의 플러팅 스타일은?",
];

const fortuneTags = ["애정운", "재물운", "결혼운", "직장운"] as const;
type FortuneTag = (typeof fortuneTags)[number];

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="px-1">
      <h2 className="text-[18px] font-extrabold tracking-[-0.025em] text-[#26203D] sm:text-[16px]">
        {number && `${number}. `}{title}
      </h2>
      {description && (
        <p className="mt-1 text-[11px] font-medium text-[#8C8598]">
          {description}
        </p>
      )}
    </div>
  );
}

function SajuMenuSection({
  number,
  title,
  description,
  cards,
  compact = false,
  featuredFirst = false,
  onNavigate,
}: {
  number: string;
  title: string;
  description: string;
  cards: MenuCard[];
  compact?: boolean;
  featuredFirst?: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <section className="mt-7">
      <SectionHeading number={number} title={title} description={description} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {cards.map((menu, index) => {
          const Icon = menu.icon;
          return (
            <button
              key={menu.title}
              type="button"
              aria-label={menu.title}
              onClick={menu.href ? () => onNavigate?.(menu.href!) : undefined}
              className={`saju-jelly-card relative cursor-pointer overflow-hidden rounded-[20px] border border-[#ECECF0] bg-[#F7F7F9] p-3 text-left shadow-[0_6px_18px_rgba(78,62,137,0.045)] ${compact ? `h-[127px] ${featuredFirst && index === 0 ? "col-span-2" : ""} ${!menu.image ? menu.color : ""}` : "aspect-square"}`}
            >
              {menu.image ? (
                <Image
                  src={menu.image}
                  alt=""
                  fill
                  unoptimized={Boolean(menu.overlayImage)}
                  loading={menu.overlayImage ? "eager" : "lazy"}
                  sizes={compact && featuredFirst && index === 0 ? "(max-width: 430px) calc(100vw - 40px), 390px" : "(max-width: 430px) 50vw, 191px"}
                  quality={100}
                  className={compact && featuredFirst && index === 0 ? "object-fill" : "object-cover"}
                />
              ) : !compact ? (
                <span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${menu.color}`}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
              ) : null}
              {menu.overlayImage && (
                <span className="absolute inset-0 z-[1] flex items-center justify-center">
                  <Image
                    src={menu.overlayImage}
                    alt=""
                    width={1254}
                    height={1254}
                    unoptimized
                    loading="eager"
                    sizes="150px"
                    quality={100}
                    className="h-auto w-[70%] object-contain"
                  />
                </span>
              )}
              {!(compact && (featuredFirst && index === 0 || menu.overlayImage)) && (
                <span className={`z-10 block font-extrabold tracking-[-0.025em] text-[#302A48] ${compact && !menu.image ? "absolute inset-0 flex items-center justify-center text-center text-[20px] leading-none" : compact || menu.image ? "absolute inset-x-0 top-5 text-center text-[25px] leading-none" : "relative mt-3 text-[13px]"}`}>
                  {menu.title}
                </span>
              )}
              {menu.description && (
                <span className="relative z-10 mt-1 block break-keep text-[10px] font-medium leading-[1.45] text-[#8C8598]">
                  {menu.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LifeStorySection() {
  const [selectedTag, setSelectedTag] = useState<FortuneTag>("애정운");
  const visibleTopics = selectedTag === "애정운" ? lifeStoryTopics : [];

  return (
    <section className="mt-[50px] sm:mt-7">
      <SectionHeading
        number=""
        title="주제별 운세🪐"
        description=""
      />
      <div className="mt-3 flex flex-wrap gap-2 px-1">
        {fortuneTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            aria-pressed={selectedTag === tag}
            className={`inline-flex h-9 items-center rounded-full px-3 text-[14px] font-bold tracking-[-0.02em] transition sm:h-8 sm:text-[12px] ${selectedTag === tag ? "bg-[#7354E8]/15 text-[#7354E8]" : "bg-[#F2F2F5] text-[#8E8996]"}`}
          >
            {tag}
          </button>
        ))}
      </div>
      {visibleTopics.length > 0 && (
        <div className="mt-3 border-t border-[#EEEAF2]">
          {visibleTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className="flex min-h-[58px] w-full items-center border-b border-[#EEEAF2] bg-white px-1 py-[15px] text-left transition active:bg-[#FAF9FD]"
            >
              <span className="min-w-0 flex-1 break-keep text-[16px] font-bold leading-[1.45] tracking-[-0.025em] text-[#302A48] sm:text-[14px]">
                {topic}
              </span>
              <ChevronRight size={17} className="ml-3 shrink-0 text-[#AAA3B5]" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function SajuDashboard({
  user,
  bannerImage,
}: SajuDashboardProps) {
  const router = useRouter();

  return (
    <main className="min-h-full bg-[#DCD8FF]">
      <div className="relative mx-auto min-h-full w-full overflow-hidden bg-white pb-6">

        <div className="px-5 pb-6">
          <section className="relative -mx-5 aspect-[11/6] overflow-hidden bg-gradient-to-br from-[#E7E4FF] via-[#EEE8FF] to-[#F7E8F5] px-5 py-5 shadow-[0_12px_30px_rgba(89,70,169,0.10)]">
            {bannerImage ? (
              <>
                <Image
                  src={bannerImage}
                  alt="내 사주 이야기 배너"
                  fill
                  priority
                  unoptimized
                  sizes="430px"
                  className="object-cover"
                />
              </>
            ) : (
              <>
                <div className="absolute -right-7 -top-10 h-36 w-36 rounded-full bg-white/25" />
                <div className="absolute bottom-[-50px] left-[38%] h-32 w-32 rounded-full bg-white/30 blur-xl" />
              </>
            )}

            <div className="absolute inset-y-0 left-7 z-10 flex max-w-[58%] items-center">
              <div>
                <p className="text-[11px] font-bold tracking-[-0.02em] text-white/75">
                  태어난 날에 담긴 나의 이야기
                </p>
                <h1 className="mt-1 break-keep text-[21px] font-extrabold leading-[1.4] tracking-[-0.04em] text-[#28215B]">
                  내 사주에는 어떤
                  <br />
                  이야기가 담겨 있을까요?
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/saju/detail");
                  }}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-white/25 bg-[#8977D2]/80 px-4 text-[12px] font-bold text-white shadow-sm"
                >
                  내 사주 한눈에 보기
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {!bannerImage && <div className="absolute bottom-1 right-1 flex h-[145px] w-[145px] items-center justify-center">
              <div className="absolute h-[112px] w-[112px] rounded-full border border-white/70 bg-white/25" />
              <div className="absolute h-[78px] w-[78px] rounded-full border border-white/80" />
              <div className="relative flex h-[108px] w-[108px] items-center justify-center rounded-full bg-white/20 backdrop-blur-[1px]">
                <Image
                  src="/image/home/mouse_character_men.png"
                  alt={`${user.name}님의 사주 캐릭터`}
                  width={120}
                  height={120}
                  priority
                  className="h-[104px] w-[104px] object-contain"
                />
              </div>
              <Sparkles className="absolute right-2 top-2 text-white" size={20} />
            </div>}
          </section>

          <SajuMenuSection
            number=""
            title="나에게 펼쳐질 이야기💫"
            description=""
            cards={insightCards}
            compact
            featuredFirst
            onNavigate={(href) => router.push(href)}
          />

          <LifeStorySection />
        </div>

      </div>
    </main>
  );
}
