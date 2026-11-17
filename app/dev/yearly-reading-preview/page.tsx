import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getSessionUser } from "../../../lib/auth/session";
import { findSajuProfileByUserId } from "../../../lib/db/repositories/userRepository";
import type { YearlyCareerCopy, YearlyConditionCopy, YearlyLoveCopy, YearlyMoneyCopy, YearlyOverallCopy } from "../../../lib/yearly/types";
import { CAREER_SITUATIONS, LOVE_SITUATIONS, isCareerSituationKey, isLoveSituationKey } from "../../../lib/yearlyReadingContext";
import { MonthlyFortuneAccordion } from "./MonthlyFortuneAccordion";
import { buildYearlyReadingDevPreview } from "./preview";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PreviewCopy = YearlyOverallCopy | YearlyCareerCopy | YearlyMoneyCopy | YearlyLoveCopy | YearlyConditionCopy;

const SECTION_LABELS = {
  overall: "올해의 전체 흐름",
  career: "커리어·학업",
  money: "돈의 흐름",
  love: "연애·관계",
  condition: "컨디션·리듬",
} as const;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseYear(value: string | undefined, minimum: number, maximum: number) {
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= minimum && year <= maximum ? year : null;
}

function CopyCard({ copy }: { copy: PreviewCopy }) {
  return (
    <article className="rounded-2xl border border-[#E7E1F2] bg-white p-5 shadow-[0_8px_24px_rgba(62,48,110,0.08)]">
      <p className="text-xs font-bold tracking-wide text-[#786EA0]">{SECTION_LABELS[copy.section]}</p>
      <h2 className="mt-2 text-xl font-bold leading-snug text-[#241C57]">{copy.headline}</h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#4D4860]">{copy.body}</p>
      <div className="mt-4 rounded-xl bg-[#F7F4FF] px-4 py-3">
        <p className="text-xs font-bold text-[#6656C9]">TIP</p>
        <p className="mt-1 text-sm leading-6 text-[#554D70]">{copy.tip}</p>
      </div>
      <details className="mt-4 text-xs text-[#706985]">
        <summary className="cursor-pointer select-none font-semibold">sourceSignalIds 보기</summary>
        <ul className="mt-2 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
          {copy.sourceSignalIds.map((id) => <li key={id}>{id}</li>)}
        </ul>
      </details>
    </article>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F5F2FA] px-5 py-12">
      <div className="mx-auto max-w-[430px] rounded-2xl bg-white p-6 text-center text-sm leading-6 text-[#554D70] shadow-sm">{children}</div>
    </main>
  );
}

export default async function YearlyReadingPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  const sessionUser = await getSessionUser();
  if (!sessionUser) return <EmptyState>로그인하면 현재 사용자의 신년운세 문구를 확인할 수 있어요.</EmptyState>;

  const profile = await findSajuProfileByUserId(sessionUser.id);
  if (!profile) return <EmptyState>등록된 사주 프로필이 없어 preview를 만들 수 없어요.</EmptyState>;

  const query = await searchParams;
  const currentYear = new Date().getFullYear();
  const minimumYear = currentYear - 30;
  const maximumYear = currentYear + 30;
  const year = parseYear(firstValue(query.year), minimumYear, maximumYear) ?? currentYear;
  const loveValue = firstValue(query.love) ?? null;
  const careerValue = firstValue(query.career) ?? null;
  const love = isLoveSituationKey(loveValue) ? loveValue : "new_connection";
  const career = isCareerSituationKey(careerValue) ? careerValue : "employed";
  const preview = buildYearlyReadingDevPreview({
    profile: {
      birthDate: profile.birthDate,
      birthHour: profile.birthHour,
      birthMinute: profile.birthMinute,
      birthTimeUnknown: profile.birthTimeUnknown,
      calendarType: profile.calendarType,
      gender: profile.gender,
    },
    targetYear: year,
    love,
    career,
  });

  return (
    <main className="min-h-screen bg-[#F5F2FA] px-5 py-8">
      <div className="mx-auto w-full max-w-[430px]">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#786EA0]">Development preview</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#241C57]">신년운세 canonical copy 검수</h1>
          <p className="mt-2 text-sm leading-6 text-[#686176]">{profile.name ?? sessionUser.name}님의 현재 canonical profile을 사용합니다.</p>
        </header>

        <form className="mt-6 space-y-4 rounded-2xl border border-[#E7E1F2] bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-[#40385F]">
            선택 연도
            <input name="year" type="number" min={minimumYear} max={maximumYear} defaultValue={year} className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD6EC] px-3 text-base outline-none focus:border-[#6656C9]" />
          </label>
          <label className="block text-sm font-semibold text-[#40385F]">
            love context
            <select name="love" defaultValue={love} className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD6EC] bg-white px-3 text-sm outline-none focus:border-[#6656C9]">
              {LOVE_SITUATIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#40385F]">
            career context
            <select name="career" defaultValue={career} className="mt-1.5 h-11 w-full rounded-xl border border-[#DDD6EC] bg-white px-3 text-sm outline-none focus:border-[#6656C9]">
              {CAREER_SITUATIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
          <button type="submit" className="h-11 w-full rounded-xl bg-[#6656C9] text-sm font-bold text-white">선택값으로 다시 보기</button>
        </form>

        <div className="mt-4 rounded-xl bg-[#EDE8FB] px-4 py-3 text-xs leading-5 text-[#554D70]">
          선택: {preview.targetYear}년 · love={love} · career={career}
        </div>

        <section className="mt-6 space-y-4" aria-label="신년운세 문구 검수 결과">
          <CopyCard copy={preview.copies.overall} />
          <CopyCard copy={preview.copies.career} />
          <CopyCard copy={preview.copies.money} />
          <CopyCard copy={preview.copies.love} />
          <CopyCard copy={preview.copies.condition} />
        </section>

        <MonthlyFortuneAccordion
          copies={preview.monthlyCopies}
          debug={preview.monthlyCopyDebug}
        />

        <details className="mt-6 rounded-xl border border-[#DDD6EC] bg-white p-4 text-xs text-[#665E78]">
          <summary className="cursor-pointer font-semibold">Monthly signal debug ({preview.monthlyDebug.length}개 절기 월)</summary>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono">
            {preview.monthlyDebug.map((month) => <li key={month.label}>{month.label}: {month.signalCount} signals</li>)}
          </ul>
        </details>
      </div>
    </main>
  );
}
