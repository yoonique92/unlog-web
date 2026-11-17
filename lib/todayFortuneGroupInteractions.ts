import type { TenGodName } from "./tenGodUtils";

export type TenGodGroup =
  | "companion"
  | "expression"
  | "wealth"
  | "officer"
  | "resource";

export type GroupInteraction = {
  headline: string[];
  tip: string[];
};

/*
  십성 10개를 5개의 큰 그룹으로 분류
*/
export function getTenGodGroup(
  tenGod: TenGodName
): TenGodGroup {
  if (
    tenGod === "비견" ||
    tenGod === "겁재"
  ) {
    return "companion";
  }

  if (
    tenGod === "식신" ||
    tenGod === "상관"
  ) {
    return "expression";
  }

  if (
    tenGod === "편재" ||
    tenGod === "정재"
  ) {
    return "wealth";
  }

  if (
    tenGod === "편관" ||
    tenGod === "정관"
  ) {
    return "officer";
  }

  return "resource";
}

const groupInteractions: Record<
  string,
  GroupInteraction
> = {
  /*
    비겁 + 비겁
  */
  "companion-companion": {
    headline: [
      "내 기준과 방향을 분명하게 세우기",
      "스스로 결정하고 바로 움직이기",
    ],

    tip: [
      "내 생각을 믿되 다른 사람의 의견도 한 번 들어보세요.",
      "혼자 해결하려 하기보다 필요한 부분은 나눠보세요.",
    ],
  },

  /*
    비겁 + 식상
  */
  "companion-expression": {
    headline: [
      "내 생각을 직접 행동으로 옮겨보기",
      "주도적으로 움직이면서 내 능력을 보여주기",
    ],

    tip: [
      "생각만 하기보다 작은 행동부터 시작해보세요.",
      "내 방식대로 움직이되 주변과의 조율도 챙겨보세요.",
    ],
  },

  /*
    식상 + 비겁
  */
  "expression-companion": {
    headline: [
      "하고 싶은 말과 내 방향을 분명하게",
      "아이디어를 내 방식대로 풀어가기",
    ],

    tip: [
      "표현에 집중하되 다른 사람의 반응도 살펴보세요.",
      "내 의견을 분명하게 전하되 너무 밀어붙이지는 마세요.",
    ],
  },

  /*
    비겁 + 재성
  */
  "companion-wealth": {
    headline: [
      "마음이 가도 시간과 비용부터",
      "마음은 가지만 지금 꼭 필요할까",
    ],

    tip: [
      "마음이 가는 선택일수록 실제로 쓸 시간과 비용이 있는지 먼저 확인해보세요.",
      "바로 결정하기보다 오늘 일정과 예산 안에서 감당할 수 있는지 살펴보세요.",
    ],
  },

  /*
    재성 + 비겁
  */
  "wealth-companion": {
    headline: [
      "현실적인 결과를 챙기면서 내 기준도 지키기",
      "실속을 챙기되 주변과 비교하지 않는 것이",
    ],

    tip: [
      "내게 정말 필요한 것이 무엇인지 기준을 분명히 해보세요.",
      "결과만 좇기보다 내가 원하는 방향도 함께 살펴보세요.",
    ],
  },

  /*
    비겁 + 관성
  */
  "companion-officer": {
    headline: [
      "내 방식과 지켜야 할 기준 사이의 균형이",
      "주도권은 잡고, 책임과 순서도 함께",
    ],

    tip: [
      "내 생각대로 움직이기 전에 필요한 규칙과 약속을 확인해보세요.",
      "주도권을 잡되 맡은 역할도 끝까지 챙겨보세요.",
    ],
  },

  /*
    관성 + 비겁
  */
  "officer-companion": {
    headline: [
      "내 몫은 지키고, 할 말은 분명하게",
      "책임은 다하고 내 페이스는 지키기",
    ],

    tip: [
      "주변의 기대만 따르지 말고 내 기준도 함께 살펴보세요.",
      "해야 할 일을 챙기되 스스로에게 지나친 부담을 주지는 마세요.",
    ],
  },

  /*
    비겁 + 인성
  */
  "companion-resource": {
    headline: [
      "내 기준을 세우기 전에 충분히 살펴보기",
      "판단하기 전에 충분히 배울 것",
    ],

    tip: [
      "바로 결정하기보다 필요한 정보를 먼저 확인해보세요.",
      "내 생각과 다른 의견에서도 배울 점을 찾아보세요.",
    ],
  },

  /*
    인성 + 비겁
  */
  "resource-companion": {
    headline: [
      "충분히 생각한 뒤 내 방식대로 움직이기",
      "배운 것을 내 기준으로 정리해보기",
    ],

    tip: [
      "정보를 모으는 데서 끝내지 말고 내 결론을 내려보세요.",
      "준비가 충분하다면 이제 직접 움직여보세요.",
    ],
  },

  /*
    식상 + 식상
  */
  "expression-expression": {
    headline: [
      "표현력과 실행력이 활발해지는",
      "아이디어는 머릿속 밖으로",
    ],

    tip: [
      "생각만 하지 말고 결과물로 만들어보세요.",
      "표현이 강해질수록 말의 강도는 조금 부드럽게 조절해보세요.",
    ],
  },

  /*
    식상 + 재성
  */
  "expression-wealth": {
    headline: [
      "아이디어와 행동이 현실적인 결과로 이어지기",
      "내 능력을 실제 성과로 연결해보기",
    ],

    tip: [
      "만들고 표현한 것을 실제 결과로 연결해보세요.",
      "좋은 아이디어가 있다면 실행 가능성까지 함께 살펴보세요.",
    ],
  },

  /*
    재성 + 식상
  */
  "wealth-expression": {
    headline: [
      "현실적인 목표를 행동으로 옮기기",
      "원하는 결과를 만들기 위해 직접 움직이기",
    ],

    tip: [
      "계획만 세우지 말고 작은 행동부터 시작해보세요.",
      "성과를 원한다면 내가 직접 할 수 있는 일부터 움직여보세요.",
    ],
  },

  /*
    식상 + 관성
  */
  "expression-officer": {
    headline: [
      "의견은 분명하게, 기준도 빠뜨리지 않게",
      "창의적인 생각과 현실적인 책임 사이의 균형이",
    ],

    tip: [
      "하고 싶은 말이 있어도 표현 방식을 한 번 더 생각해보세요.",
      "새로운 방식을 제안할 때 기존 기준도 함께 고려해보세요.",
    ],
  },

  /*
    관성 + 식상
  */
  "officer-expression": {
    headline: [
      "기본을 지키면서 내 능력을 보여주기",
      "책임을 다한 뒤 새로운 방식을 시도하기",
    ],

    tip: [
      "해야 할 일을 먼저 마친 뒤 아이디어를 펼쳐보세요.",
      "규칙 안에서도 더 좋은 방법을 찾아보세요.",
    ],
  },

  /*
    식상 + 인성
  */
  "expression-resource": {
    headline: [
      "표현과 배움이 함께 살아나는 날",
      "아는 것을 설명할수록 이해는 깊게",
    ],

    tip: [
      "배운 내용을 직접 설명하거나 활용해보세요.",
      "아이디어를 내기 전에 필요한 정보를 충분히 살펴보세요.",
    ],
  },

  /*
    인성 + 식상
  */
  "resource-expression": {
    headline: [
      "배운 것을 실제 행동과 결과로 연결하기",
      "이해한 내용을 직접 활용해보기",
    ],

    tip: [
      "공부하거나 준비한 것을 이제 직접 써먹어보세요.",
      "알고 있는 내용을 작은 결과물로 만들어보세요.",
    ],
  },

  /*
    재성 + 재성
  */
  "wealth-wealth": {
    headline: [
      "현실적인 성과와 실속에 집중하기",
      "시간과 돈의 흐름을 정리하기",
    ],

    tip: [
      "기회가 많아 보여도 실제로 필요한 것을 먼저 선택해보세요.",
      "지출과 일정의 우선순위를 정리해보세요.",
    ],
  },

  /*
    재성 + 관성
  */
  "wealth-officer": {
    headline: [
      "현실적인 성과와 책임을 함께 챙기기",
      "결과를 만들되 기준과 약속도 지켜야 하는",
    ],

    tip: [
      "성과만 서두르지 말고 필요한 절차도 함께 확인해보세요.",
      "실질적인 결과와 책임 사이의 균형을 맞춰보세요.",
    ],
  },

  /*
    관성 + 재성
  */
  "officer-wealth": {
    headline: [
      "기준은 지키고 성과도 챙기기",
      "책임 있게 움직여 결과까지",
    ],

    tip: [
      "맡은 일을 차근차근 처리하면서 실속도 함께 챙겨보세요.",
      "기준을 지키되 결과를 만드는 데도 집중해보세요.",
    ],
  },

  /*
    재성 + 인성
  */
  "wealth-resource": {
    headline: [
      "충분히 알아보고 현실적으로 선택",
      "정보와 실속을 함께 보고 판단",
    ],

    tip: [
      "돈이나 중요한 선택은 정보를 충분히 확인한 뒤 결정해보세요.",
      "바로 선택하기보다 한 번 더 공부하고 살펴보세요.",
    ],
  },

  /*
    인성 + 재성
  */
  "resource-wealth": {
    headline: [
      "배운 내용을 실제 성과로 연결하기",
      "충분히 알아본 뒤 실질적인 선택을 내리기",
    ],

    tip: [
      "정보를 모으는 데서 끝내지 말고 현실적인 결론을 내려보세요.",
      "알아본 내용을 실제 선택에 활용해보세요.",
    ],
  },

  /*
    관성 + 관성
  */
  "officer-officer": {
    headline: [
      "책임과 기준이 더욱 중요하게 느껴지는 날",
      "순서와 원칙을 지킬수록 흐름이 안정되는 날",
    ],

    tip: [
      "해야 할 일을 한꺼번에 해결하지 말고 순서대로 정리해보세요.",
      "스스로를 너무 몰아붙이지 않도록 적당히 쉬어가세요.",
    ],
  },

  /*
    관성 + 인성
  */
  "officer-resource": {
    headline: [
      "책임 있는 판단에는 충분한 준비",
      "할 일이 많아도 하나씩 보면 답이 보여요.",
    ],

    tip: [
      "바로 대응하기보다 상황을 정확히 이해하는 것이 먼저예요.",
      "부담이 있다면 필요한 도움이나 정보를 먼저 찾아보세요.",
    ],
  },

  /*
    인성 + 관성
  */
  "resource-officer": {
    headline: [
      "충분한 준비가 책임 있는 행동으로 이어지기",
      "생각을 가다듬고 차분하게 대응",
    ],

    tip: [
      "준비한 내용을 믿고 하나씩 처리해보세요.",
      "급하게 반응하기보다 상황을 먼저 이해해보세요.",
    ],
  },

  /*
    인성 + 인성
  */
  "resource-resource": {
    headline: [
      "배우고 정리하면서 내 생각을 깊게 만들기",
      "충분히 이해하고 쉬어가며 방향을 잡기",
    ],

    tip: [
      "새로운 정보를 받아들이고 차분히 정리해보세요.",
      "생각이 많아질 때는 잠시 쉬면서 머릿속을 정리해보세요.",
    ],
  },
};

function pick<T>(
  items: T[],
  seed: number
): T {
  return items[
    Math.abs(seed) % items.length
  ];
}

export function getGroupInteraction(
  stemTenGod: TenGodName,
  branchTenGod: TenGodName,
  seed: number
) {
  const stemGroup =
    getTenGodGroup(stemTenGod);

  const branchGroup =
    getTenGodGroup(branchTenGod);

  const key =
    `${stemGroup}-${branchGroup}`;

  const interaction =
    groupInteractions[key];

  if (!interaction) {
    return null;
  }

  return {
    stemGroup,
    branchGroup,

    headline: pick(
      interaction.headline,
      seed
    ),

    tip: pick(
      interaction.tip,
      seed + 1
    ),
  };
}
