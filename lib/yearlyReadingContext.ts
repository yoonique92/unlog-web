export const LOVE_SITUATIONS = [
  { key: "new_connection", label: "새로운 만남을 원해요" },
  { key: "prefer_single", label: "지금은 혼자가 좋아요" },
  { key: "interested_person", label: "마음 가는 사람이 있어요" },
  { key: "dating", label: "연애 중이에요" },
  { key: "engaged", label: "결혼을 앞두고 있어요" },
  { key: "married", label: "결혼 생활 중이에요" },
  { key: "fresh_start", label: "이별 후 새출발 중이에요" },
] as const;

export const CAREER_SITUATIONS = [
  { key: "student", label: "학생이에요" },
  { key: "job_seeking", label: "취업 준비 중이에요" },
  { key: "employed", label: "직장 생활 중이에요" },
  { key: "career_transition", label: "이직·퇴사를 고민 중이에요" },
  { key: "freelance_self_employed", label: "프리랜서·자영업 중이에요" },
  { key: "homemaker", label: "주부예요" },
  { key: "retired", label: "은퇴했어요" },
] as const;

export type LoveSituationKey = (typeof LOVE_SITUATIONS)[number]["key"];
export type CareerSituationKey = (typeof CAREER_SITUATIONS)[number]["key"];

const LOVE_KEYS = new Set<string>(LOVE_SITUATIONS.map(({ key }) => key));
const CAREER_KEYS = new Set<string>(CAREER_SITUATIONS.map(({ key }) => key));

export function isLoveSituationKey(value: string | null): value is LoveSituationKey {
  return value !== null && LOVE_KEYS.has(value);
}

export function isCareerSituationKey(
  value: string | null
): value is CareerSituationKey {
  return value !== null && CAREER_KEYS.has(value);
}

export function parseYearlyReadingContext(
  searchParams: URLSearchParams,
  minimumYear: number,
  maximumYear: number
) {
  const keys = [...searchParams.keys()].sort();
  if (keys.join(",") !== "career,love,year") return null;

  const yearValue = searchParams.get("year");
  const love = searchParams.get("love");
  const career = searchParams.get("career");
  if (!yearValue || !/^\d{4}$/.test(yearValue)) return null;

  const year = Number(yearValue);
  if (
    !Number.isInteger(year) ||
    year < minimumYear ||
    year > maximumYear ||
    !isLoveSituationKey(love) ||
    !isCareerSituationKey(career)
  ) {
    return null;
  }

  return { year, love, career };
}
