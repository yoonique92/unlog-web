import Image from "next/image";
import Link from "next/link";

type HomeHeroProps = {
  userName: string;
  headline: string;
};

export default function HomeHero({
  userName,
  headline,
}: HomeHeroProps) {
    const today = new Date();

const month = today.getMonth() + 1;
const day = today.getDate();

const weekday = today
  .toLocaleDateString("en-US", {
    weekday: "short",
  })
  .toUpperCase();

const todayLabel = `${month}/${day} ${weekday}`;
  return (
    <section className="relative z-10 px-5 pt-11">
      {/* 날짜 */}
      <p className="text-[14px] font-bold tracking-wide text-[#272080]">
  {todayLabel}
</p>

      <div className="relative mt-[12px] min-h-[430px]">
        <div className="relative z-10 max-w-[75%]">
          {/* 메인 문구 */}
          <h1 className="break-keep text-[24px] font-extrabold leading-[1.5] tracking-[-0.035em] text-[#18145B] sm:text-[22px]">
            <span className="text-[#7047FF]">{userName}</span>
            님, 오늘은
            <br />
            {headline}
          </h1>

          {/* 자세히 보기 */}
          <Link
            href="/today"
            className="mt-4 inline-block text-[13px] font-medium text-[#5130EA]"
          >
            자세히 보기 →
          </Link>
        </div>

        {/* 캐릭터 */}
        <div className="absolute bottom-30 right-[25px] z-10 w-[42%] max-w-[230px]">
          <Image
            src="/image/home/mouse_character_men.png"
            alt="운로그 캐릭터"
            width={500}
            height={500}
            priority
            className="h-auto w-full object-contain"
          />
        </div>

        {/* 왼쪽 배경 원 */}
        <div className="absolute bottom-[-60px] left-[-30px] h-36 w-36 rounded-full border border-white/50 bg-[#8376FF]/20 blur-[1px]" />
      </div>
    </section>
  );
}
