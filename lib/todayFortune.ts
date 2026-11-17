import type { TenGodName } from "./tenGodUtils";

import {
  tenGodFortuneMessages,
} from "./todayFortuneMessages";

import {
  getTenGodInteraction,
} from "./todayFortuneInteractions";

import {
  getGroupInteraction,
} from "./todayFortuneGroupInteractions";

type FiveElements = {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
};

type TodayFortuneInput = {
  dayStem: string;
  fiveElements: FiveElements;
  strength: string;

  todayStem: string;
  todayBranch: string;

  todayStemTenGod: TenGodName;
  todayBranchTenGod: TenGodName;
};

export type TodayFortune = {
  headline: string;
  tip: string;

  fortunes: {
    title: string;
    comment: string;
  }[];
};

type FortuneCategory =
  | "love"
  | "money"
  | "career"
  | "study"
  | "health";

function makeSeed(
  dayStem: string,
  todayStem: string,
  todayBranch: string
) {
  const text =
    `${dayStem}-${todayStem}-${todayBranch}`;

  return [...text].reduce(
    (sum, char) =>
      sum + char.charCodeAt(0),
    0
  );
}

function pick<T>(
  items: T[],
  seed: number
): T {
  return items[
    Math.abs(seed) % items.length
  ];
}

function chooseTenGodForCategory(
  stemTenGod: TenGodName,
  branchTenGod: TenGodName,
  category: FortuneCategory
): TenGodName {
  const priorities: Record<
    FortuneCategory,
    TenGodName[]
  > = {
    love: [
      "상관",
      "식신",
      "편재",
      "정재",
      "정관",
      "편관",
      "겁재",
      "비견",
      "정인",
      "편인",
    ],

    money: [
      "정재",
      "편재",
      "겁재",
      "비견",
      "식신",
      "상관",
      "정관",
      "편관",
      "정인",
      "편인",
    ],

    career: [
      "정관",
      "편관",
      "식신",
      "상관",
      "정재",
      "편재",
      "비견",
      "겁재",
      "정인",
      "편인",
    ],

    study: [
      "정인",
      "편인",
      "식신",
      "상관",
      "정관",
      "편관",
      "비견",
      "겁재",
      "정재",
      "편재",
    ],

    health: [
      "편관",
      "겁재",
      "상관",
      "편인",
      "정인",
      "정관",
      "식신",
      "비견",
      "정재",
      "편재",
    ],
  };

  for (
    const tenGod
    of priorities[category]
  ) {
    if (
      stemTenGod === tenGod ||
      branchTenGod === tenGod
    ) {
      return tenGod;
    }
  }

  return stemTenGod;
}

function getCategoryMessage(
  tenGod: TenGodName,
  category: FortuneCategory,
  seed: number
) {
  return pick(
    tenGodFortuneMessages[tenGod][category],
    seed
  );
}

export function getTodayFortune({
  dayStem,
  fiveElements,
  strength,

  todayStem,
  todayBranch,

  todayStemTenGod,
  todayBranchTenGod,
}: TodayFortuneInput): TodayFortune {
  const seed = makeSeed(
    dayStem,
    todayStem,
    todayBranch
  );

  /*
    1. 천간 + 지지 조합 해석
  */
  const interaction =
    getTenGodInteraction(
      todayStemTenGod,
      todayBranchTenGod,
      seed
    );
const groupInteraction =
  getGroupInteraction(
    todayStemTenGod,
    todayBranchTenGod,
    seed
  );
  /*
    2. 조합 해석이 없는 경우
       천간 십성의 기본 문장을 사용
  */
  const headline =
  interaction?.headline ??
  groupInteraction?.headline ??
  pick(
    tenGodFortuneMessages[
      todayStemTenGod
    ].headline,
    seed
  );

  const tip =
  interaction?.tip ??
  groupInteraction?.tip ??
  pick(
    tenGodFortuneMessages[
      todayStemTenGod
    ].headline,
    seed + 1
  );

  /*
    3. 분야별 기본 십성 선택
  */

  const loveTenGod =
    chooseTenGodForCategory(
      todayStemTenGod,
      todayBranchTenGod,
      "love"
    );

  const moneyTenGod =
    chooseTenGodForCategory(
      todayStemTenGod,
      todayBranchTenGod,
      "money"
    );

  const careerTenGod =
    chooseTenGodForCategory(
      todayStemTenGod,
      todayBranchTenGod,
      "career"
    );

  const studyTenGod =
    chooseTenGodForCategory(
      todayStemTenGod,
      todayBranchTenGod,
      "study"
    );

  const healthTenGod =
    chooseTenGodForCategory(
      todayStemTenGod,
      todayBranchTenGod,
      "health"
    );

  /*
    4. 분야별 기본 문장
  */

  let loveComment =
    getCategoryMessage(
      loveTenGod,
      "love",
      seed + 20
    );

  let moneyComment =
    getCategoryMessage(
      moneyTenGod,
      "money",
      seed + 30
    );

  let careerComment =
    getCategoryMessage(
      careerTenGod,
      "career",
      seed + 40
    );

  let studyComment =
    getCategoryMessage(
      studyTenGod,
      "study",
      seed + 50
    );

  let healthComment =
    getCategoryMessage(
      healthTenGod,
      "health",
      seed + 60
    );

  /*
    5. 십성 조합에서
       분야별 전용 문장이 있다면
       기본 문장을 덮어씀
  */

  if (interaction?.love) {
    loveComment =
      interaction.love;
  }

  if (interaction?.money) {
    moneyComment =
      interaction.money;
  }

  if (interaction?.career) {
    careerComment =
      interaction.career;
  }

  if (interaction?.study) {
    studyComment =
      interaction.study;
  }

  if (interaction?.health) {
    healthComment =
      interaction.health;
  }

  /*
    6. 신강 / 신약 건강 보정
  */

  if (strength.includes("약")) {
    healthComment = pick(
      [
        healthComment,
        "무리하기보다 컨디션을 지키는 게 중요해요.",
        "에너지를 한꺼번에 쓰지 말고 쉬어가세요.",
      ],
      seed + 70
    );
  }

  if (strength.includes("강")) {
    healthComment = pick(
      [
        healthComment,
        "활동량이 많아질수록 휴식도 함께 챙겨주세요.",
        "에너지를 적당히 나눠 쓰는 것이 좋아요.",
      ],
      seed + 71
    );
  }

  /*
    7. 오행 균형을 이용한
       가벼운 건강 보정
  */

  const sortedElements =
    Object.entries(
      fiveElements
    ).sort(
      (a, b) => b[1] - a[1]
    );

  const strongestElement =
    sortedElements[0]?.[0];

  if (
    strongestElement === "화" &&
    (fiveElements.화 ?? 0) >= 3
  ) {
    healthComment = pick(
      [
        healthComment,
        "오늘은 속도를 조금 낮추고 쉬어가세요.",
        "바쁘게 움직인 만큼 휴식도 챙겨주세요.",
      ],
      seed + 72
    );
  }

  /*
    개발 확인용
  */

  console.log(
    "오늘 운세 V5:",
    {
      stemTenGod:
        todayStemTenGod,

      branchTenGod:
        todayBranchTenGod,

      interaction:
  interaction
    ? "정확한 십성 조합 해석"
    : groupInteraction
    ? "5그룹 조합 해석"
    : "기본 십성 해석",
group: groupInteraction
  ? {
      stem:
        groupInteraction.stemGroup,

      branch:
        groupInteraction.branchGroup,
    }
  : null,
      selected: {
        love:
          loveTenGod,

        money:
          moneyTenGod,

        career:
          careerTenGod,

        study:
          studyTenGod,

        health:
          healthTenGod,
      },

      headline,
    }
  );

  return {
    headline,
    tip,

    fortunes: [
      {
        title: "❤️ 연애운",
        comment: loveComment,
      },

      {
        title: "💰 금전운",
        comment: moneyComment,
      },

      {
        title: "💼 직장운",
        comment: careerComment,
      },

      {
        title: "📚 학업운",
        comment: studyComment,
      },

      {
        title: "🍀 건강운",
        comment: healthComment,
      },
    ],
  };
}