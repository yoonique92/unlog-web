import TodayContent from "../../components/today/TodayContent";

export default function TodayPage() {
  return (
    <main className="min-h-full bg-[#DCD8FF]">
      <div className="relative mx-auto min-h-full w-full overflow-hidden bg-gradient-to-b from-[#D6D9FF] via-[#E6DBFF] to-[#D7CCFF]">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[10%] top-[12%] text-3xl text-white/70">
            ☆
          </div>

          <div className="absolute left-[12%] top-[20%] text-xl text-white/80">
            ✦
          </div>

          <div className="absolute right-[16%] top-[42%] text-xl text-white/70">
            ✧
          </div>
        </div>

        <TodayContent />
      </div>
    </main>
  );
}
