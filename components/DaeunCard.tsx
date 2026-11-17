type DaeunItem = {
  startAge: number;
  endAge: number;
  ganzhi: string;
  stemTenGod: string;
  branchTenGod: string;
};

type DaeunInterpretation = {
  currentTitle: string;
  currentSummary: string;
  currentKeywords: string[];
  next: DaeunItem | null;
};

type DaeunCardProps = {
  interpretation: DaeunInterpretation;
};

export default function DaeunCard({
  interpretation,
}: DaeunCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        대운의 흐름
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        지금 나는 어떤 10년을 지나고 있을까?
      </h2>

      <div className="mt-6 rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-medium text-gray-400">
          현재 대운
        </p>

        <h3 className="mt-2 text-lg font-bold text-[#222222]">
          {interpretation.currentTitle}
        </h3>

        <p className="mt-3 text-sm leading-7 text-[#555555]">
          {interpretation.currentSummary}
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium text-gray-400">
            이 시기의 키워드
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {interpretation.currentKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-[#F7F5EF] px-4 py-2 text-sm text-gray-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {interpretation.next && (
          <div className="mt-6 rounded-2xl bg-[#222222] p-5 text-white">
            <p className="text-xs font-medium text-gray-400">
              다음 대운
            </p>

            <p className="mt-2 text-xl font-bold">
              {interpretation.next.ganzhi}
            </p>

            <p className="mt-2 text-sm leading-7 text-gray-200">
              {interpretation.next.startAge}세부터{" "}
              {interpretation.next.endAge}세까지 이어지는 흐름이에요.{" "}
              {interpretation.next.stemTenGod}과{" "}
              {interpretation.next.branchTenGod}의 주제가 점차 강해질 수 있어요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}