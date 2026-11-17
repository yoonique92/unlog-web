import type { YearlyInterpretation } from "../lib/yearlyInterpretation";

type YearlyCardProps = {
  year: number;
  interpretation: YearlyInterpretation;
};

export default function YearlyCard({
  year,
  interpretation,
}: YearlyCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        {year}년 운세
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        올해 나에게 어떤 흐름이 들어올까?
      </h2>

      <div className="mt-6 rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-medium text-gray-400">
          올해의 핵심 흐름
        </p>

        <h3 className="mt-2 text-xl font-bold text-[#222222]">
          {interpretation.headline}
        </h3>

        <p className="mt-3 text-sm leading-7 text-[#555555]">
          {interpretation.summary}
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium text-gray-400">
            올해의 키워드
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {interpretation.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-[#F7F5EF] px-4 py-2 text-sm text-gray-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#F7F5EF] p-5">
          <p className="text-xs font-medium text-gray-400">
            일과 커리어
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            {interpretation.career}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7F5EF] p-5">
          <p className="text-xs font-medium text-gray-400">
            금전
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            {interpretation.money}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7F5EF] p-5">
          <p className="text-xs font-medium text-gray-400">
            연애와 관계
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            {interpretation.relationship}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400">
            올해 주의할 점
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            {interpretation.caution}
          </p>
        </div>

        <div className="rounded-2xl bg-[#222222] p-5 text-white">
          <p className="text-xs font-medium text-gray-400">
            올해의 행동 가이드
          </p>

          <p className="mt-3 text-sm leading-7 text-gray-200">
            {interpretation.action}
          </p>
        </div>
      </div>
    </section>
  );
}
