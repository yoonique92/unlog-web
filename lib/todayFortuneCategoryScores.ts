import type { TenGodName } from "./tenGodUtils";

type FiveElements = {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
};

type CategoryScoreInput = {
  todayStemTenGod: TenGodName;
  todayBranchTenGod: TenGodName;

  fiveElements: FiveElements;
  strength: string;
};

export type TodayCategoryScores = {
  love: number;
  money: number;
  career: number;
  study: number;
  health: number;
  people: number;
};

function clamp(
  value: number,
  min = 55,
  max = 95
) {
  return Math.min(
    Math.max(Math.round(value), min),
    max
  );
}

function hasTenGod(
  stem: TenGodName,
  branch: TenGodName,
  targets: TenGodName[]
) {
  return (
    targets.includes(stem) ||
    targets.includes(branch)
  );
}

export function calculateTodayCategoryScores({
  todayStemTenGod,
  todayBranchTenGod,
  fiveElements,
  strength,
}: CategoryScoreInput): TodayCategoryScores {
  /*
    모든 분야의 시작점은 72점
  */
  let love = 72;
  let money = 72;
  let career = 72;
  let study = 72;
  let health = 72;
  let people = 72;

  /*
    =========================
    연애운
    =========================
  */

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["식신", "상관", "편재"]
    )
  ) {
    love += 8;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정재", "정관"]
    )
  ) {
    love += 5;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["겁재", "편관"]
    )
  ) {
    love -= 4;
  }

  /*
    =========================
    금전운
    =========================
  */

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정재"]
    )
  ) {
    money += 10;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["편재"]
    )
  ) {
    money += 7;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["겁재"]
    )
  ) {
    money -= 7;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["비견"]
    )
  ) {
    money -= 2;
  }

  /*
    =========================
    직장운
    =========================
  */

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정관", "편관"]
    )
  ) {
    career += 10;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["식신", "상관"]
    )
  ) {
    career += 5;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정재", "편재"]
    )
  ) {
    career += 3;
  }

  /*
    =========================
    학업운
    =========================
  */

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정인", "편인"]
    )
  ) {
    study += 11;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["식신"]
    )
  ) {
    study += 5;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정관"]
    )
  ) {
    study += 3;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["겁재"]
    )
  ) {
    study -= 3;
  }

  /*
    =========================
    건강운
    =========================
  */

  if (
    strength.includes("중화") ||
    strength.includes("균형")
  ) {
    health += 7;
  }

  if (
    strength.includes("중강") ||
    strength.includes("중약")
  ) {
    health += 3;
  }

  if (
    strength.includes("극강") ||
    strength.includes("극약")
  ) {
    health -= 7;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["식신", "정인"]
    )
  ) {
    health += 4;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["편관", "겁재"]
    )
  ) {
    health -= 4;
  }

  /*
    오행 쏠림도 건강에 가볍게 반영
  */

  const elementValues =
    Object.values(fiveElements);

  const maxElement =
    Math.max(...elementValues);

  const minElement =
    Math.min(...elementValues);

  if (
    maxElement - minElement <= 2
  ) {
    health += 3;
  }

  if (maxElement >= 5) {
    health -= 3;
  }

  /*
    =========================
    대인운
    =========================
  */

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["편재", "식신"]
    )
  ) {
    people += 9;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["정관", "정인"]
    )
  ) {
    people += 5;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["상관"]
    )
  ) {
    people += 1;
  }

  if (
    hasTenGod(
      todayStemTenGod,
      todayBranchTenGod,
      ["겁재"]
    )
  ) {
    people -= 5;
  }

  return {
    love: clamp(love),
    money: clamp(money),
    career: clamp(career),
    study: clamp(study),
    health: clamp(health),
    people: clamp(people),
  };
}