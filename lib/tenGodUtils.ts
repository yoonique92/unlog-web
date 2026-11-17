export type TenGodName =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

type Element =
  | "wood"
  | "fire"
  | "earth"
  | "metal"
  | "water";

type StemInfo = {
  element: Element;
  polarity: "yang" | "yin";
};

const stemInfo: Record<string, StemInfo> = {
  甲: { element: "wood", polarity: "yang" },
  乙: { element: "wood", polarity: "yin" },

  丙: { element: "fire", polarity: "yang" },
  丁: { element: "fire", polarity: "yin" },

  戊: { element: "earth", polarity: "yang" },
  己: { element: "earth", polarity: "yin" },

  庚: { element: "metal", polarity: "yang" },
  辛: { element: "metal", polarity: "yin" },

  壬: { element: "water", polarity: "yang" },
  癸: { element: "water", polarity: "yin" },
};

/*
  지지의 대표 기운(본기)을 천간으로 연결
*/
const branchMainStem: Record<string, string> = {
  子: "癸",
  丑: "己",
  寅: "甲",
  卯: "乙",
  辰: "戊",
  巳: "丙",
  午: "丁",
  未: "己",
  申: "庚",
  酉: "辛",
  戌: "戊",
  亥: "壬",
};

function generates(
  from: Element,
  to: Element
) {
  return (
    (from === "wood" && to === "fire") ||
    (from === "fire" && to === "earth") ||
    (from === "earth" && to === "metal") ||
    (from === "metal" && to === "water") ||
    (from === "water" && to === "wood")
  );
}

function controls(
  from: Element,
  to: Element
) {
  return (
    (from === "wood" && to === "earth") ||
    (from === "earth" && to === "water") ||
    (from === "water" && to === "fire") ||
    (from === "fire" && to === "metal") ||
    (from === "metal" && to === "wood")
  );
}

/*
  사용자 일간 기준으로
  다른 천간이 어떤 십성인지 계산
*/
export function getTenGodForStem(
  dayStem: string,
  targetStem: string
): TenGodName {
  const day = stemInfo[dayStem];
  const target = stemInfo[targetStem];

  if (!day || !target) {
    return "비견";
  }

  const samePolarity =
    day.polarity === target.polarity;

  // 같은 오행
  if (day.element === target.element) {
    return samePolarity
      ? "비견"
      : "겁재";
  }

  // 내가 생하는 오행 → 식상
  if (
    generates(
      day.element,
      target.element
    )
  ) {
    return samePolarity
      ? "식신"
      : "상관";
  }

  // 내가 극하는 오행 → 재성
  if (
    controls(
      day.element,
      target.element
    )
  ) {
    return samePolarity
      ? "편재"
      : "정재";
  }

  // 나를 극하는 오행 → 관성
  if (
    controls(
      target.element,
      day.element
    )
  ) {
    return samePolarity
      ? "편관"
      : "정관";
  }

  // 나를 생하는 오행 → 인성
  if (
    generates(
      target.element,
      day.element
    )
  ) {
    return samePolarity
      ? "편인"
      : "정인";
  }

  return "비견";
}

/*
  지지는 대표 기운(본기)을 사용해서
  십성을 계산
*/
export function getTenGodForBranch(
  dayStem: string,
  branch: string
): TenGodName {
  const mainStem =
    branchMainStem[branch];

  if (!mainStem) {
    return "비견";
  }

  return getTenGodForStem(
    dayStem,
    mainStem
  );
}