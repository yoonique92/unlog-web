type StrengthInfo = {
  title: string;
  description: string;
};

type CurrentDaeun = {
  ganzhi: string;
  startAge: number;
  endAge: number;
} | null;

type CurrentYear = {
  ganzhi: string;
  tenGodStem: string;
  tenGodBranch: string;
} | undefined;

type SummaryCardsProps = {
  strengthInfo: StrengthInfo;
  currentDaeun: CurrentDaeun;
  currentYear: CurrentYear;
};

export default function SummaryCards({
  strengthInfo,
  currentDaeun,
  currentYear,
}: SummaryCardsProps) {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-3">
      {/* 나의 에너지 */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">
          나의 에너지
        </p>

        <p className="mt-2 text-xl font-bold">
          {strengthInfo.title}
        </p>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {strengthInfo.description}
        </p>
      </div>

      {/* 현재 대운 */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">
          현재 대운
        </p>

        <p className="mt-2 text-2xl font-bold">
          {currentDaeun?.ganzhi || "-"}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {currentDaeun
            ? `${currentDaeun.startAge}세 ~ ${currentDaeun.endAge}세`
            : ""}
        </p>
      </div>

      {/* 2026년 흐름 */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">
          2026년 흐름
        </p>

        <p className="mt-2 text-2xl font-bold">
          {currentYear?.ganzhi || "-"}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {currentYear
            ? `${currentYear.tenGodStem} · ${currentYear.tenGodBranch}`
            : ""}
        </p>
      </div>
    </section>
  );
}