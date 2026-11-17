type TenGodName =
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

type TenGodInfo = {
  keyword: string;
  strength: string;
  caution: string;
  behavior: string;
};

const tenGodDescriptions: Record<TenGodName, TenGodInfo> = {
  비견: {
    keyword: "독립심과 자기 기준",
    strength:
      "스스로 판단하고 자기 힘으로 해결하려는 성향이 강해요. 자신의 기준이 분명하고 쉽게 흔들리지 않는 것이 장점이에요.",
    caution:
      "비견이 강하게 나타나면 타인의 의견을 받아들이는 데 시간이 걸리거나, 혼자 해결하려는 성향이 강해질 수 있어요.",
    behavior:
      "내가 직접 해보는 것을 선호하고, 다른 사람에게 의존하기보다 스스로 경험하면서 배우는 편이에요.",
  },

  겁재: {
    keyword: "경쟁심과 돌파력",
    strength:
      "경쟁할 상대나 분명한 목표가 있으면 집중력이 높아지고, 필요한 순간에는 과감하게 움직일 수 있어요.",
    caution:
      "겁재가 강하면 승부욕이나 비교 의식이 커질 수 있고, 관계에서 주도권을 놓고 충돌할 수도 있어요.",
    behavior:
      "누군가와 함께할 때도 자신의 역할과 영향력을 분명하게 확보하려는 편이에요.",
  },

  식신: {
    keyword: "생산성과 표현력",
    strength:
      "자신이 가진 재능이나 경험을 실제 결과물로 만들어내는 힘이 좋아요. 꾸준함과 실무 능력으로 강점을 보여줄 수 있어요.",
    caution:
      "식신이 강하면 편안함을 중요하게 여기거나, 자신의 방식이 익숙해져 새로운 변화가 귀찮게 느껴질 수 있어요.",
    behavior:
      "배운 것을 직접 써먹고, 눈에 보이는 결과를 만드는 과정에서 만족감을 느끼는 편이에요.",
  },

  상관: {
    keyword: "독창성과 비판적 사고",
    strength:
      "틀에 얽매이지 않고 새로운 방식으로 문제를 해결하는 능력이 있어요. 표현력과 아이디어도 강점이 될 수 있어요.",
    caution:
      "상관이 강하면 말이 직설적으로 들리거나, 기존 규칙과 권위에 답답함을 느끼기 쉬워요.",
    behavior:
      "비효율적인 방식이나 납득되지 않는 규칙을 보면 그냥 넘어가기보다 직접 바꾸고 싶어하는 편이에요.",
  },

  편재: {
    keyword: "기회 감각과 활동성",
    strength:
      "사람들의 반응과 주변 상황을 빠르게 살펴 기회를 잡는 힘이 있어요. 넓은 관계와 다양한 경험에서 강점을 발휘해요.",
    caution:
      "편재가 강하면 관심사가 넓어져 집중력이 분산되거나, 소비와 투자에서 과감해질 수 있어요.",
    behavior:
      "새로운 사람을 만나거나 낯선 일을 직접 경험할 때 더 적극적으로 움직이는 편이에요.",
  },

  정재: {
    keyword: "안정적인 재정 감각",
    strength:
      "현실적인 계산과 계획을 중요하게 생각하고, 꾸준하게 자원을 관리하는 힘이 있어요.",
    caution:
      "정재가 강하면 안정성을 지나치게 중요하게 여겨 새로운 기회를 조심스럽게만 바라볼 수 있어요.",
    behavior:
      "확실한 계획과 예상 가능한 결과가 있을 때 마음이 편한 편이에요.",
  },

  편관: {
    keyword: "긴장감과 실행력",
    strength:
      "압박이 있는 상황에서도 책임감을 가지고 빠르게 움직이는 힘이 있어요.",
    caution:
      "편관이 강하면 스스로를 몰아붙이거나 긴장과 스트레스를 오래 안고 갈 수 있어요.",
    behavior:
      "목표가 분명하거나 긴장감이 있는 환경에서 오히려 집중력이 올라가는 편이에요.",
  },

  정관: {
    keyword: "책임감과 사회적 기준",
    strength:
      "규칙과 약속을 중요하게 여기고, 맡은 역할을 안정적으로 수행하는 힘이 있어요.",
    caution:
      "정관이 강하면 다른 사람의 평가나 사회적 기준을 지나치게 의식할 수 있어요.",
    behavior:
      "역할과 책임이 분명한 환경에서 자신의 능력을 안정적으로 보여주는 편이에요.",
  },

  편인: {
    keyword: "직관과 독특한 시선",
    strength:
      "남들과 다른 방식으로 생각하고, 깊이 파고드는 능력이 있어요. 창의적이거나 전문적인 분야와도 잘 맞을 수 있어요.",
    caution:
      "편인이 강하면 생각이 많아지고 혼자만의 세계에 오래 머무를 수 있어요.",
    behavior:
      "겉으로 보이는 정보보다 그 안의 원리나 의미를 이해하려는 편이에요.",
  },

  정인: {
    keyword: "학습과 이해력",
    strength:
      "배우고 이해하는 능력이 좋고, 충분히 준비한 뒤 안정적으로 움직이는 힘이 있어요.",
    caution:
      "정인이 강하면 준비가 완벽해질 때까지 행동을 미루거나 생각이 많아질 수 있어요.",
    behavior:
      "새로운 일을 시작하기 전에 먼저 공부하고 구조를 이해해야 마음이 놓이는 편이에요.",
  },
};

type TenGodPosition = {
  stem: string;
  branch: string;
};

type TenGods = {
  year: TenGodPosition;
  month: TenGodPosition;
  day: TenGodPosition;
  hour: TenGodPosition;
};

export function getTenGodInterpretation(tenGods: TenGods) {
  const counts: Record<string, number> = {};

  const values = [
    tenGods.year.stem,
    tenGods.year.branch,
    tenGods.month.stem,
    tenGods.month.branch,
    tenGods.day.branch,
    tenGods.hour.stem,
    tenGods.hour.branch,
  ];

  values.forEach((tenGod) => {
    if (!tenGod || tenGod === "(일간)") {
      return;
    }

    counts[tenGod] = (counts[tenGod] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  );

  const dominant = sorted.slice(0, 3);

  const interpretations = dominant
    .map(([name, count]) => {
      const info =
        tenGodDescriptions[name as TenGodName];

      if (!info) {
        return null;
      }

      return {
        name,
        count,
        ...info,
      };
    })
    .filter(Boolean);

  return {
    counts,
    dominant: interpretations,
  };
}
