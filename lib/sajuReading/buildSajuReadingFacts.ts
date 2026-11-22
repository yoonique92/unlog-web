import {
  FIVE_ELEMENTS_KO,
  TEN_GOD_NAMES,
  type DominantTenGodFact,
  type FiveElementKo,
  type SajuReadingFacts,
  type SajuReadingSource,
  type TenGodName,
  type TenGodOccurrence,
} from "./types";

const DAY_MASTER_META: Record<
  string,
  { koreanName: string; element: FiveElementKo; yinYang: "양" | "음" }
> = {
  甲: { koreanName: "갑목", element: "목", yinYang: "양" },
  乙: { koreanName: "을목", element: "목", yinYang: "음" },
  丙: { koreanName: "병화", element: "화", yinYang: "양" },
  丁: { koreanName: "정화", element: "화", yinYang: "음" },
  戊: { koreanName: "무토", element: "토", yinYang: "양" },
  己: { koreanName: "기토", element: "토", yinYang: "음" },
  庚: { koreanName: "경금", element: "금", yinYang: "양" },
  辛: { koreanName: "신금", element: "금", yinYang: "음" },
  壬: { koreanName: "임수", element: "수", yinYang: "양" },
  癸: { koreanName: "계수", element: "수", yinYang: "음" },
};

const LOCATION_LABELS: Record<string, string> = {
  "day:branch": "일지",
  "month:stem": "월간",
  "month:branch": "월지",
  "hour:stem": "시간",
  "hour:branch": "시지",
  "year:stem": "년간",
  "year:branch": "년지",
};

function isTenGodName(value: string): value is TenGodName {
  return (TEN_GOD_NAMES as readonly string[]).includes(value);
}

function emptyTenGodCounts(): Record<TenGodName, number> {
  return Object.fromEntries(
    TEN_GOD_NAMES.map((name) => [name, 0]),
  ) as Record<TenGodName, number>;
}

/**
 * v1에서는 새로운 중요도 점수를 만들지 않는다.
 * 먼저 실제 출현 횟수로 정렬하고, 동률일 때만 일지 → 월주 → 시주 → 년주
 * 순으로 먼저 관찰되는 십성을 앞에 둔다.
 */
export function selectDominantTenGods(
  occurrences: readonly TenGodOccurrence[],
): DominantTenGodFact[] {
  const counts = emptyTenGodCounts();
  const firstSeen = new Map<TenGodName, number>();
  const locations = new Map<TenGodName, string[]>();

  occurrences.forEach((occurrence, index) => {
    counts[occurrence.name] += 1;
    if (!firstSeen.has(occurrence.name)) firstSeen.set(occurrence.name, index);
    const key = `${occurrence.position}:${occurrence.target}`;
    const bucket = locations.get(occurrence.name) ?? [];
    bucket.push(LOCATION_LABELS[key] ?? key);
    locations.set(occurrence.name, bucket);
  });

  return TEN_GOD_NAMES
    .filter((name) => counts[name] > 0)
    .sort((a, b) => {
      const countDelta = counts[b] - counts[a];
      if (countDelta !== 0) return countDelta;
      return (firstSeen.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (firstSeen.get(b) ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 3)
    .map((name) => ({
      name,
      count: counts[name],
      locations: locations.get(name) ?? [],
    }));
}

export function buildSajuReadingFacts(
  saju: SajuReadingSource,
): SajuReadingFacts {
  const dayMaster = DAY_MASTER_META[saju.dayStem];
  if (!dayMaster) {
    throw new Error(`Unsupported day master stem: ${saju.dayStem}`);
  }

  const fiveElements = Object.fromEntries(
    FIVE_ELEMENTS_KO.map((element) => [element, saju.fiveElements[element] ?? 0]),
  ) as Record<FiveElementKo, number>;

  // 일간 자체는 십성 개수에서 제외한다. 일지는 포함하고, 시간이 없는 원국은
  // 시주의 십성을 새로 만들지 않는다.
  const slotValues = [
    { position: "day", target: "branch", value: saju.tenGods.day.branch },
    { position: "month", target: "stem", value: saju.tenGods.month.stem },
    { position: "month", target: "branch", value: saju.tenGods.month.branch },
    ...(saju.birthTimeUnknown
      ? []
      : [
          { position: "hour", target: "stem", value: saju.tenGods.hour.stem },
          { position: "hour", target: "branch", value: saju.tenGods.hour.branch },
        ]),
    { position: "year", target: "stem", value: saju.tenGods.year.stem },
    { position: "year", target: "branch", value: saju.tenGods.year.branch },
  ] as const;

  const occurrences: TenGodOccurrence[] = slotValues.flatMap((slot) =>
    isTenGodName(slot.value)
      ? [{
          name: slot.value,
          position: slot.position,
          target: slot.target,
        }]
      : [],
  );

  const counts = emptyTenGodCounts();
  occurrences.forEach((occurrence) => {
    counts[occurrence.name] += 1;
  });

  return {
    dayMaster: {
      stem: saju.dayStem,
      ...dayMaster,
    },
    fiveElements,
    tenGods: {
      counts,
      occurrences,
      dominant: selectDominantTenGods(occurrences),
    },
    birthTimeUnknown: saju.birthTimeUnknown,
  };
}
