type CombinationItem = {
  title: string;
  summary: string;
  strength: string;
  caution: string;
};

type CombinationCardProps = {
  interpretations: CombinationItem[];
};

export default function CombinationCard({
  interpretations,
}: CombinationCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        나만의 성격 패턴
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        여러 기운이 함께 만들고 있는 모습
      </h2>

      <div className="mt-6 space-y-5">
        {interpretations.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="text-lg font-bold text-[#222222]">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              {item.summary}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F7F5EF] p-4">
                <p className="text-xs font-medium text-gray-400">
                  강점
                </p>

                <p className="mt-2 text-sm leading-7 text-gray-600">
                  {item.strength}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F5EF] p-4">
                <p className="text-xs font-medium text-gray-400">
                  주의할 패턴
                </p>

                <p className="mt-2 text-sm leading-7 text-gray-600">
                  {item.caution}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}