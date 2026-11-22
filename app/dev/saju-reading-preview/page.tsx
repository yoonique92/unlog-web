import { notFound } from "next/navigation";

import { getSessionUser } from "../../../lib/auth/session";
import { findSajuProfileByUserId } from "../../../lib/db/repositories/userRepository";
import { getSaju } from "../../../lib/saju";
import { buildSajuReading } from "../../../lib/sajuReading";
import type { SajuReadingSectionCopy } from "../../../lib/sajuReading";

const ELEMENTS = ["목", "화", "토", "금", "수"] as const;

function ReadingCard({
  eyebrow,
  copy,
}: {
  eyebrow: string;
  copy: SajuReadingSectionCopy;
}) {
  return (
    <article className="rounded-2xl border border-[#E7E1F2] bg-white p-5 shadow-[0_8px_24px_rgba(62,48,110,0.08)]">
      <p className="text-xs font-bold tracking-wide text-[#786EA0]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold leading-snug text-[#241C57]">
        {copy.headline}
      </h2>
      <div className="mt-3 space-y-3">
        {copy.paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[15px] leading-7 text-[#4D4860]"
          >
            {paragraph}
          </p>
        ))}
      </div>
      <details className="mt-4 text-xs text-[#706985]">
        <summary className="cursor-pointer select-none font-semibold">
          근거 보기
        </summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
          {copy.sourceFacts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

export default async function SajuReadingPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return (
      <main className="min-h-screen bg-[#F5F2FA] px-5 py-12">
        <div className="mx-auto max-w-[430px] rounded-2xl bg-white p-6 text-center text-sm leading-6 text-[#554D70] shadow-sm">
          로그인하면 현재 사용자의 만세력 해설을 확인할 수 있어요.
        </div>
      </main>
    );
  }

  const profile = await findSajuProfileByUserId(sessionUser.id);
  if (!profile) {
    return (
      <main className="min-h-screen bg-[#F5F2FA] px-5 py-12">
        <div className="mx-auto max-w-[430px] rounded-2xl bg-white p-6 text-center text-sm leading-6 text-[#554D70] shadow-sm">
          등록된 사주 프로필이 없어 preview를 만들 수 없어요.
        </div>
      </main>
    );
  }

  const saju = getSaju(
    profile.birthDate,
    String(profile.birthHour),
    String(profile.birthMinute),
    profile.calendarType,
    profile.gender,
    profile.birthTimeUnknown,
  );
  const reading = buildSajuReading(saju);

  return (
    <main className="min-h-screen bg-[#F5F2FA] px-5 py-8">
      <div className="mx-auto w-full max-w-[430px]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#786EA0]">
            Development preview
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#241C57]">
            만세력 해설 v1
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#686176]">
            {profile.name ?? sessionUser.name}님의 canonical 만세력 결과를 그대로 사용합니다.
          </p>
        </header>

        <section className="mt-6 space-y-4" aria-label="만세력 해설 검수">
          <ReadingCard eyebrow="내 사주의 중심" copy={reading.dayMaster} />

          <article className="rounded-2xl border border-[#E7E1F2] bg-white p-5 shadow-[0_8px_24px_rgba(62,48,110,0.08)]">
            <p className="text-xs font-bold tracking-wide text-[#786EA0]">
              오행으로 보는 나
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-[#241C57]">
              {reading.fiveElements.headline}
            </h2>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {ELEMENTS.map((element) => (
                <div
                  key={element}
                  className="rounded-xl bg-[#F7F4FF] px-2 py-3 text-center"
                >
                  <p className="text-xs font-bold text-[#6656C9]">{element}</p>
                  <p className="mt-1 text-lg font-extrabold text-[#2C245E]">
                    {reading.facts.fiveElements[element]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {reading.fiveElements.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[15px] leading-7 text-[#4D4860]"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <details className="mt-4 text-xs text-[#706985]">
              <summary className="cursor-pointer select-none font-semibold">
                근거 보기
              </summary>
              <ul className="mt-2 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
                {reading.fiveElements.sourceFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </details>
          </article>

          <article className="rounded-2xl border border-[#E7E1F2] bg-white p-5 shadow-[0_8px_24px_rgba(62,48,110,0.08)]">
            <p className="text-xs font-bold tracking-wide text-[#786EA0]">
              십성으로 보는 행동 방식
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-[#241C57]">
              자주 나타나는 십성을 생활 장면으로 풀어봤어요
            </h2>

            <div className="mt-4 divide-y divide-[#ECE8F3]">
              {reading.tenGods.map((copy) => (
                <section key={copy.name} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-[#5E4AA9]">
                      {copy.name}
                    </p>
                    <span className="rounded-full bg-[#F1EDFF] px-2.5 py-1 text-[11px] font-bold text-[#6C5BC5]">
                      {copy.count}회
                    </span>
                  </div>
                  <h3 className="mt-2 text-[17px] font-bold leading-6 text-[#2B245E]">
                    {copy.headline}
                  </h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#514B63]">
                    {copy.body}
                  </p>
                  <details className="mt-3 text-xs text-[#706985]">
                    <summary className="cursor-pointer select-none font-semibold">
                      근거 보기
                    </summary>
                    <ul className="mt-2 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
                      {copy.sourceFacts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  </details>
                </section>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
