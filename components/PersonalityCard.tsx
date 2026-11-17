type PersonalityInterpretation = {
  headline: string;
  paragraphs: string[];
};

type PersonalityCardProps = {
  interpretation: PersonalityInterpretation;
};

export default function PersonalityCard({
  interpretation,
}: PersonalityCardProps) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-medium text-gray-400">
        타고난 성향
      </p>

      <h2 className="mt-2 text-2xl font-bold leading-snug">
        {interpretation.headline}
      </h2>

      <div className="mt-6 space-y-5 text-[15px] leading-8 text-gray-600">
        {interpretation.paragraphs.map(
          (paragraph, index) => (
            <p key={index}>
              {paragraph}
            </p>
          )
        )}
      </div>
    </section>
  );
}