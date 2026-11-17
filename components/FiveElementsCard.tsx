type FiveElements = {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
};

type FiveElementsCardProps = {
  fiveElements: FiveElements;
};

export default function FiveElementsCard({
  fiveElements,
}: FiveElementsCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-400">
        오행 분포
      </p>

      <h2 className="mt-1 text-xl font-bold">
        나를 이루는 다섯 기운
      </h2>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {Object.entries(fiveElements).map(
          ([element, count]) => (
            <div
              key={element}
              className="rounded-2xl bg-[#F7F5EF] py-4 text-center"
            >
              <p className="text-sm text-gray-500">
                {element}
              </p>

              <p className="mt-1 text-2xl font-bold">
                {count}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}