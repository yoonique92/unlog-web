type MoneyInterpretation = {
  title: string;
  summary: string;
  strength: string;
  caution: string;
  management: string;
  keywords: string[];
};

type MoneyCardProps = {
  interpretation: MoneyInterpretation;
};

export default function MoneyCard({
  interpretation,
}: MoneyCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        금전과 자원
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        나는 어떤 방식으로 돈을 만들고 관리할까?
      </h2>

      <div className="mt-6 rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#222222]">
          {interpretation.title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-[#555555]">
          {interpretation.summary}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#F7F5EF] p-4">
            <p className="text-xs font-medium text-gray-400">
              금전에서의 강점
            </p>

            <p className="mt-2 text-sm leading-7 text-gray-600">
              {interpretation.strength}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7F5EF] p-4">
            <p className="text-xs font-medium text-gray-400">
              주의할 패턴
            </p>

            <p className="mt-2 text-sm leading-7 text-gray-600">
              {interpretation.caution}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-gray-400">
            금전 키워드
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

        <div className="mt-5 rounded-2xl bg-[#222222] p-5 text-white">
          <p className="text-xs font-medium text-gray-400">
            나에게 맞는 관리 방식
          </p>

          <p className="mt-2 text-sm leading-7 text-gray-200">
            {interpretation.management}
          </p>
        </div>
      </div>
    </section>
  );
}