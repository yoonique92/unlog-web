type CareerItem = {
  title: string;
  summary: string;
  fit: string;
  caution: string;
};

type CareerInterpretation = {
  primary: CareerItem;
  secondary: CareerItem;
  idealEnvironment: string;
  difficultEnvironment: string;
  workKeywords: string[];
};

type CareerCardProps = {
  interpretation: CareerInterpretation;
};

export default function CareerCard({
  interpretation,
}: CareerCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        일과 커리어
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        나는 어떤 방식으로 일할 때 강할까?
      </h2>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400">
            가장 강하게 나타나는 일의 방식
          </p>

          <h3 className="mt-2 text-lg font-bold text-[#222222]">
            {interpretation.primary.title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#555555]">
            {interpretation.primary.summary}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F7F5EF] p-4">
              <p className="text-xs font-medium text-gray-400">
                잘 맞는 환경
              </p>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {interpretation.primary.fit}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F5EF] p-4">
              <p className="text-xs font-medium text-gray-400">
                주의할 점
              </p>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {interpretation.primary.caution}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400">
            함께 나타나는 두 번째 강점
          </p>

          <h3 className="mt-2 text-lg font-bold text-[#222222]">
            {interpretation.secondary.title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#555555]">
            {interpretation.secondary.summary}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F7F5EF] p-4">
              <p className="text-xs font-medium text-gray-400">
                잘 맞는 환경
              </p>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {interpretation.secondary.fit}
              </p>
            </div>

            <div className="rounded-2xl bg-[#F7F5EF] p-4">
              <p className="text-xs font-medium text-gray-400">
                주의할 점
              </p>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {interpretation.secondary.caution}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <p className="text-sm font-medium text-gray-400">
          나에게 맞는 일의 환경
        </p>

        <h3 className="mt-2 text-lg font-bold text-[#222222]">
          이런 환경에서 강점이 더 잘 살아나요
        </h3>

        <p className="mt-3 text-sm leading-7 text-[#555555]">
          {interpretation.idealEnvironment}
        </p>

        <div className="mt-5">
          <p className="text-xs font-medium text-gray-400">
            잘 맞을 가능성이 높은 업무 키워드
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {interpretation.workKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-[#F7F5EF] px-4 py-2 text-sm text-gray-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#F7F5EF] p-5">
          <p className="text-xs font-medium text-gray-400">
            조금 답답하게 느낄 수 있는 환경
          </p>

          <p className="mt-2 text-sm leading-7 text-gray-600">
            {interpretation.difficultEnvironment}
          </p>
        </div>
      </div>
    </section>
  );
}