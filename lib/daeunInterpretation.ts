type DaeunItem = {
  startAge: number;
  endAge: number;
  ganzhi: string;
  stem: string;
  branch: string;
  startYear: number;
  stemTenGod: string;
  branchTenGod: string;
  stage12: string;
  sal: string[];
};

type DaeunInput = {
  current: DaeunItem | null;
  list: DaeunItem[];
};

const tenGodMeanings: Record<string, string> = {
  비견: "자기 기준, 독립성, 주도권",
  겁재: "경쟁, 변화, 관계 속 주도권",
  식신: "생산성, 표현, 결과물",
  상관: "창의성, 변화, 기존 틀을 깨는 힘",
  편재: "기회, 활동성, 넓은 관계",
  정재: "안정적인 성과, 현실적인 관리",
  편관: "긴장감, 도전, 강한 실행력",
  정관: "책임, 역할, 사회적 기준",
  편인: "직관, 전문성, 독특한 관점",
  정인: "학습, 보호, 이해와 축적",
};

export function getDaeunInterpretation({
  current,
  list,
}: DaeunInput) {
  if (!current) {
    return {
      currentTitle: "현재 대운 정보를 확인하기 어려워요.",
      currentSummary: "",
      currentKeywords: [],
      next: null,
    };
  }

  const stemMeaning =
    tenGodMeanings[current.stemTenGod] || current.stemTenGod;

  const branchMeaning =
    tenGodMeanings[current.branchTenGod] || current.branchTenGod;

  const currentTitle =
    `${current.ganzhi} 대운 — ${current.startAge}세부터 ${current.endAge}세까지`;

  const currentSummary =
    `이 시기에는 ${stemMeaning}과 관련된 일과 ${branchMeaning}이 함께 중요해질 수 있어요. ` +
    `직장이나 관계에서 비슷한 역할을 자주 맡거나 같은 종류의 선택 앞에 서게 된다면, 그 반복이 지금 배워야 할 부분을 보여줄 수 있습니다. ` +
    `명리에서는 이 배경을 ${current.stemTenGod}과 ${current.branchTenGod}이 함께 나타나는 대운으로 설명해요.`;

  const currentKeywords = [
    current.stemTenGod,
    current.branchTenGod,
    current.stage12,
    ...current.sal,
  ];

  const currentIndex = list.findIndex(
    (item) =>
      item.startAge === current.startAge &&
      item.ganzhi === current.ganzhi
  );

  const next =
    currentIndex >= 0 && currentIndex < list.length - 1
      ? list[currentIndex + 1]
      : null;

  return {
    currentTitle,
    currentSummary,
    currentKeywords,
    next,
  };
}
