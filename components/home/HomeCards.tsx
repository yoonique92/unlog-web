type FortuneItem = {
  title: string;
  comment: string;
};

type HomeCardsProps = {
  fortunes: FortuneItem[];
};

export default function HomeCards({
  fortunes,
}: HomeCardsProps) {
  return (
    <section className="relative z-10 -mt-[100px] space-y-4 px-5 pb-32">
      {/* TODAY'S TIP */}
      <div className="overflow-hidden rounded-[28px] border border-[#E7E4F3] bg-white py-6 shadow-sm">
        {/* 제목 + 오늘의 한 줄 */}
        <div className="px-6">
          <p className="text-[15px] font-extrabold tracking-wide text-[#4E36D8] sm:text-[14px]">
            TODAY&apos;S TIP ✦
          </p>

        </div>

        {/* 운세 카드 가로 스와이프 */}
        <div className="mt-[8px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-[10px] pb-[4px] pl-5 pr-6">
            {fortunes.map((fortune) => (
              <div
                key={fortune.title}
                className="w-[150px] shrink-0 snap-start rounded-[20px] bg-[#F4F1FF] p-[18px]"
              >
                <p className="text-[14px] font-bold text-[#4E36D8] sm:text-[13px]">
                  {fortune.title}
                </p>

                <p className="mt-[4px] break-keep pl-[4px] text-[14px] font-normal leading-[1.5] text-[#1C1F22] sm:text-[13px]">
  {fortune.comment}
</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 로그 프렌즈 */}
      <div className="rounded-[28px] border border-[#E7E4F3] bg-white p-6 shadow-sm">
        <p className="text-[14px] font-extrabold text-[#4E36D8]">
          로그 프렌즈 ✦
        </p>

        <p className="mt-[8px] break-keep text-[16px] font-normal leading-[1.5] text-[#1C1F22]">
          친구를 초대하면 새로운 캐릭터가 찾아와요
        </p>

        <a
          href="/friends"
          className="mt-[8px] inline-block text-[13px] font-bold text-[#4E36D8]"
        >
          친구 캐릭터 확인하러 가기 →
        </a>
      </div>
    </section>
  );
}
