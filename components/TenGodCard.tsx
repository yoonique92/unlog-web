type TenGodItem = {
  name?: string;
  keyword?: string;
  count?: number;
  strength?: string;
  behavior?: string;
  caution?: string;
};

type TenGodCardProps = {
  interpretations: TenGodItem[];
};

export default function TenGodCard({
  interpretations,
}: TenGodCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        내가 가진 강점
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        나를 움직이는 핵심 성향
      </h2>

      <div className="mt-6 space-y-6">
        {interpretations.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl bg-[#F7F5EF] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  {item.name}
                </p>

                <h3 className="mt-1 text-lg font-bold text-[#222222]">
                  {item.keyword}
                </h3>
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                {item.count}회
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-7 text-gray-600">
              <p>
                <strong className="text-gray-800">
                  강점
                </strong>
                <br />
                {item.strength}
              </p>

              <p>
                <strong className="text-gray-800">
                  실제로는
                </strong>
                <br />
                {item.behavior}
              </p>

              <p>
                <strong className="text-gray-800">
                  주의할 점
                </strong>
                <br />
                {item.caution}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}