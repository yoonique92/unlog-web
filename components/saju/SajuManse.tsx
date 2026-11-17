import type { UnlogUser } from "../../lib/user";
import { getSaju } from "../../lib/saju";

const fiveElementBackgrounds: Record<string, string> = {
  목: "#D6EDDC",
  화: "#FAD8D8",
  토: "#F5E5B8",
  금: "#ECECEC",
  수: "#CCD0D6",
};

type SajuManseProps = {
  user: UnlogUser;
  showProfileSummary?: boolean;
  variant?: "default" | "yearly";
  yearlyContext?: {
    loveLabel: string;
    careerLabel: string;
  };
};

export default function SajuManse({
  user,
  showProfileSummary = true,
  variant = "default",
  yearlyContext,
}: SajuManseProps) {
  const isYearly = variant === "yearly";
  const saju = getSaju(
    user.birthDate,
    String(user.birthHour),
    String(user.birthMinute),
    user.calendarType,
    user.gender,
    Boolean(user.birthTimeUnknown)
  );
  const [birthYear, birthMonth, birthDay] = user.birthDate
    .split("-")
    .map(Number);
  const birthSummary = `${birthYear}. ${birthMonth}. ${birthDay} (${
    user.calendarType === "solar" ? "양력" : "음력"
  }) | ${
    user.birthTimeUnknown
      ? "시간 모름"
      : user.birthMinute === 0
        ? `${user.birthHour}시`
        : `${user.birthHour}시 ${user.birthMinute}분`
  } | ${user.gender === "female" ? "여성" : "남성"}`;
  const pillars = [
    {
      label: "시주",
      stem: user.birthTimeUnknown ? "-" : saju.pillarDetails.hour.stem,
      branch: user.birthTimeUnknown ? "-" : saju.pillarDetails.hour.branch,
      stemKo: user.birthTimeUnknown ? "" : saju.pillarDetails.hour.stemKo,
      branchKo: user.birthTimeUnknown ? "" : saju.pillarDetails.hour.branchKo,
      stemElement: user.birthTimeUnknown ? "" : saju.pillarDetails.hour.element.stem,
      branchElement: user.birthTimeUnknown ? "" : saju.pillarDetails.hour.element.branch,
      stemTenGod: saju.tenGods.hour.stem || "-",
      branchTenGod: saju.tenGods.hour.branch || "-",
    },
    {
      label: "일주",
      stem: saju.pillarDetails.day.stem,
      branch: saju.pillarDetails.day.branch,
      stemKo: saju.pillarDetails.day.stemKo,
      branchKo: saju.pillarDetails.day.branchKo,
      stemElement: saju.pillarDetails.day.element.stem,
      branchElement: saju.pillarDetails.day.element.branch,
      stemTenGod:
        !saju.tenGods.day.stem || saju.tenGods.day.stem === "(일간)"
          ? "일간"
          : saju.tenGods.day.stem,
      branchTenGod: saju.tenGods.day.branch || "-",
    },
    {
      label: "월주",
      stem: saju.pillarDetails.month.stem,
      branch: saju.pillarDetails.month.branch,
      stemKo: saju.pillarDetails.month.stemKo,
      branchKo: saju.pillarDetails.month.branchKo,
      stemElement: saju.pillarDetails.month.element.stem,
      branchElement: saju.pillarDetails.month.element.branch,
      stemTenGod: saju.tenGods.month.stem || "-",
      branchTenGod: saju.tenGods.month.branch || "-",
    },
    {
      label: "년주",
      stem: saju.pillarDetails.year.stem,
      branch: saju.pillarDetails.year.branch,
      stemKo: saju.pillarDetails.year.stemKo,
      branchKo: saju.pillarDetails.year.branchKo,
      stemElement: saju.pillarDetails.year.element.stem,
      branchElement: saju.pillarDetails.year.element.branch,
      stemTenGod: saju.tenGods.year.stem || "-",
      branchTenGod: saju.tenGods.year.branch || "-",
    },
  ];
  const positions = ["hour", "day", "month", "year"] as const;
  const twelveStages = positions.map((position) =>
    position === "hour" && user.birthTimeUnknown
      ? ["-"]
      : [saju.stages12.bong[position] || "-"]
  );
  const twelveSals = positions.map((position) =>
    position === "hour" && user.birthTimeUnknown
      ? ["-"]
      : [saju.sals[position].twelveSal || "-"]
  );
  const otherSals = positions.map((position) => {
    if (position === "hour" && user.birthTimeUnknown) return ["-"];

    const names = saju.sals[position].sals.map((sal) => sal.name);
    return names.length > 0 ? names : ["-"];
  });

  return (
    <section
      className={
        isYearly
          ? "rounded-[22px] border border-white bg-white/90 px-4 py-4 shadow-[0_8px_22px_rgba(59,44,120,0.08)]"
          : "rounded-[24px] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(78,62,137,0.07)]"
      }
    >
      <p
        className={
          isYearly
            ? "text-[13px] font-extrabold text-[#5E4AA9]"
            : "text-[12px] font-bold text-[#7057D8]"
        }
      >
        {isYearly ? "✦ 나의 만세력" : "나의 만세력"}
      </p>
      {showProfileSummary && (
        <>
          <h2
            className={`text-[19px] font-extrabold text-[#20185B] ${
              isYearly ? "mt-3" : "mt-1"
            }`}
          >
            {user.name}
          </h2>
          <p className="mt-[2px] whitespace-nowrap text-[11px] font-medium tracking-[-0.035em] text-[#817A92]">
            {birthSummary}
          </p>
        </>
      )}
      <div
        className={
          isYearly
            ? "mt-3 h-px bg-[#E9E5F2]"
            : "mt-4 h-px bg-[#E9E5F2]"
        }
      />
      <div
        className={
          isYearly ? "mt-2 grid grid-cols-4" : "mt-[10px] grid grid-cols-4"
        }
      >
        {pillars.map((pillar, index) => (
          <div
            key={pillar.label}
            className={[
              "min-w-0 text-center",
              isYearly ? "py-2" : "py-3",
              isYearly && index > 0 ? "border-l border-white/55" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <p className="text-[10px] font-semibold text-[#9A94A8]">
              {pillar.label}
            </p>
            {isYearly ? (
              <>
                <p className="mt-2 truncate text-[10px] font-bold text-[#514A70]">
                  {pillar.stemTenGod}
                </p>
                <PillarCharacter
                  character={pillar.stem}
                  korean={pillar.stemKo}
                  element={pillar.stemElement}
                  className="mt-1"
                  compact
                />
                <PillarCharacter
                  character={pillar.branch}
                  korean={pillar.branchKo}
                  element={pillar.branchElement}
                  className="mt-1.5"
                  compact
                />
                <p className="mt-2 truncate text-[10px] font-bold text-[#514A70]">
                  {pillar.branchTenGod}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[10px] font-bold text-[#20185B]">
                  {pillar.stemTenGod}
                </p>
                <PillarCharacter
                  character={pillar.stem}
                  korean={pillar.stemKo}
                  element={pillar.stemElement}
                />
                <PillarCharacter
                  character={pillar.branch}
                  korean={pillar.branchKo}
                  element={pillar.branchElement}
                  className="mt-2"
                />
                <p className="mt-1 text-[10px] font-bold text-[#20185B]">
                  {pillar.branchTenGod}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
      <ManseInfoRow rowId="twelve-stages" values={twelveStages} />
      <ManseInfoRow rowId="twelve-sals" values={twelveSals} />
      <ManseInfoRow rowId="other-sals" values={otherSals} />
      {isYearly && yearlyContext && (
        <div className="mt-4 border-t border-[#E9E5F2]/80 pt-4">
          <p className="text-[12px] font-bold text-[#5E4AA9]">
            이번 운세에서 선택한 상황
          </p>
          <dl className="mt-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[12px] font-bold text-[#30286D]">💖 연애</dt>
              <dd className="max-w-full rounded-full border border-[#6656C9] bg-[#EEE9FF] px-3 py-1.5 text-[12px] font-bold text-[#4A3FAA]">
                {yearlyContext.loveLabel}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-[12px] font-bold text-[#30286D]">
                ✨ 일·진로
              </dt>
              <dd className="max-w-full rounded-full border border-[#6656C9] bg-[#EEE9FF] px-3 py-1.5 text-[12px] font-bold text-[#4A3FAA]">
                {yearlyContext.careerLabel}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function ManseInfoRow({
  rowId,
  values,
}: {
  rowId: string;
  values: string[][];
}) {
  return (
    <div
      data-testid={`manse-info-${rowId}`}
      className="mt-2 border-t border-[#E9E5F2]/80 pt-3"
    >
      <div className="grid grid-cols-4">
        {values.map((items, index) => (
          <div
            key={`${rowId}-${index}`}
            className={`min-w-0 px-1 text-center ${
              index > 0 ? "border-l border-white/55" : ""
            }`}
          >
            {items.map((item) => (
              <p
                key={item}
                className="break-keep text-[10px] font-medium leading-4 text-[#625B78]"
              >
                {item}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PillarCharacter({
  character,
  korean,
  element,
  className = "mt-1",
  compact = false,
}: {
  character: string;
  korean: string;
  element: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        compact ? "mx-1 rounded-[10px] py-1.5" : "mx-2 rounded-[12px] py-2",
        className,
      ].join(" ")}
      style={{ backgroundColor: fiveElementBackgrounds[element] ?? "#F7F6FA" }}
    >
      <p
        className={
          compact
            ? "text-[24px] font-bold leading-none text-[#30286D]"
            : "text-[27px] font-bold leading-none text-[#30286D]"
        }
        style={{
          fontFamily:
            '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans CJK KR", "Noto Sans KR", sans-serif',
        }}
      >
        {character}
      </p>
      <p
        className={
          compact
            ? "mt-0.5 text-[9px] font-semibold text-[#797286]"
            : "mt-1 text-[10px] font-semibold text-[#797286]"
        }
      >
        {korean}
      </p>
    </div>
  );
}
