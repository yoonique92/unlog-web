type PillarDetail = {
  stem: string;
  branch: string;
  stemKo: string;
  branchKo: string;
};

type TenGod = {
  stem: string;
  branch: string;
};

type Pillar = {
  label: string;
  detail: PillarDetail;
  tenGod: TenGod;
};

type SajuChartProps = {
  pillars: Pillar[];
};

export default function SajuChart({
  pillars,
}: SajuChartProps) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="grid grid-cols-4 border-b border-gray-100">
        {pillars.map((pillar) => (
          <div
            key={pillar.label}
            className="py-4 text-center text-sm font-medium text-gray-500"
          >
            {pillar.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.label}
            className="border-r border-gray-100 px-2 py-7 text-center last:border-r-0"
          >
            <div className="text-4xl font-bold">
              {pillar.detail.stem}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {pillar.detail.stemKo}
            </div>

            <div className="mt-1 text-xs font-medium text-gray-400">
              {pillar.tenGod.stem}
            </div>

            <div className="my-5 h-px bg-gray-100" />

            <div className="text-4xl font-bold">
              {pillar.detail.branch}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {pillar.detail.branchKo}
            </div>

            <div className="mt-1 text-xs font-medium text-gray-400">
              {pillar.tenGod.branch}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}