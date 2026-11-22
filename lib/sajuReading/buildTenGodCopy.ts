import type {
  DominantTenGodFact,
  SajuReadingFacts,
  TenGodName,
  TenGodReadingCopy,
} from "./types";

type TenGodSeed = {
  headline: string;
  body: readonly [string, string];
};

const TEN_GOD_COPY: Record<TenGodName, TenGodSeed> = {
  비견: {
    headline: "내 기준을 지키며 직접 해보려는 힘",
    body: [
      "내가 직접 판단하고 해결할 수 있는 일에서는 다른 사람에게 맡기기보다 스스로 해보는 쪽이 편할 수 있어요.",
      "다만 혼자 처리하는 일이 계속 늘어나면 도움을 받을 타이밍을 놓칠 수 있으니, 함께할 일과 직접 할 일을 나눠두는 편이 좋습니다.",
    ],
  },
  겁재: {
    headline: "경쟁이 생기면 더 빠르게 움직이는 힘",
    body: [
      "비교할 대상이나 분명한 목표가 생기면 평소보다 집중해서 움직이고, 필요한 순간에는 먼저 자리를 잡으려는 모습이 나타날 수 있어요.",
      "다만 속도가 붙을수록 사람 사이의 몫이나 주도권이 예민해질 수 있어, 같이하는 일에서는 역할을 먼저 맞춰두는 편이 수월합니다.",
    ],
  },
  식신: {
    headline: "배운 것을 실제 결과로 만들어내는 힘",
    body: [
      "알고 있는 것을 직접 써보거나 눈에 보이는 결과물로 만들 때 만족을 느끼기 쉬워요.",
      "익숙한 방식으로 꾸준히 이어가는 것이 강점이지만, 편한 방법만 반복하지 않도록 가끔은 다른 방식도 시험해보는 편이 좋습니다.",
    ],
  },
  상관: {
    headline: "불편한 점을 발견하면 바꾸고 싶은 힘",
    body: [
      "비효율적이거나 납득되지 않는 부분을 그냥 넘기기보다 더 나은 방법을 찾고 내 생각을 표현하려는 모습이 나타날 수 있어요.",
      "아이디어가 빠른 만큼 말이 먼저 나가면 상대가 강하게 받아들일 수 있으니, 핵심을 정리한 뒤 표현하는 편이 훨씬 수월합니다.",
    ],
  },
  편재: {
    headline: "사람과 기회 사이를 빠르게 살피는 힘",
    body: [
      "새로운 사람이나 낯선 경험이 들어오면 주변 반응을 빠르게 읽고 먼저 움직이는 편일 수 있어요.",
      "관심사가 넓어지는 만큼 시간과 비용도 함께 퍼질 수 있으니, 오래 가져갈 것과 가볍게 경험할 것을 구분해두면 좋습니다.",
    ],
  },
  정재: {
    headline: "현실적인 조건을 맞추고 관리하는 힘",
    body: [
      "돈이나 시간처럼 한정된 자원을 쓸 때 계획을 세우고 예상 가능한 범위 안에서 움직이는 편이 편할 수 있어요.",
      "안정적인 선택이 강점이지만 새로운 기회를 지나치게 늦게 검토하지 않도록, 감당할 수 있는 범위부터 시험해보는 방식도 잘 맞습니다.",
    ],
  },
  편관: {
    headline: "압박이 생기면 집중해서 끝내려는 힘",
    body: [
      "해야 할 일이 분명하거나 긴장감이 있는 상황에서는 오히려 집중해서 빠르게 처리하려는 모습이 나타날 수 있어요.",
      "다만 그 속도를 오래 유지하면 스스로를 계속 몰아붙일 수 있으니, 끝낼 일과 내려놓을 일을 함께 정해두는 편이 좋습니다.",
    ],
  },
  정관: {
    headline: "역할과 약속이 분명할수록 안정적인 힘",
    body: [
      "맡은 역할이나 지켜야 할 약속이 분명하면 무엇부터 해야 할지 정리하고 책임 있게 마무리하려는 편일 수 있어요.",
      "다른 사람의 기준과 평가를 많이 의식하면 내 선택이 늦어질 수 있으니, 꼭 지킬 기준과 조정 가능한 부분을 나눠보는 것이 도움이 됩니다.",
    ],
  },
  편인: {
    headline: "남들이 지나친 부분을 깊게 파고드는 힘",
    body: [
      "겉으로 드러난 답보다 그 안의 원리나 숨은 이유가 궁금해져 한 주제를 오래 들여다보는 편일 수 있어요.",
      "생각이 깊어지는 만큼 혼자 정리하는 시간이 길어질 수 있으니, 어느 정도 이해했다면 직접 써보며 확인하는 편이 좋습니다.",
    ],
  },
  정인: {
    headline: "충분히 이해한 뒤 안정적으로 움직이는 힘",
    body: [
      "새로운 일을 시작하기 전에 먼저 구조를 이해하고 필요한 정보를 모아야 마음이 놓이는 편일 수 있어요.",
      "준비가 충분한 것이 강점이지만 시작 시점까지 늦어지지 않도록, 필요한 만큼 알게 되면 작은 행동부터 옮겨보는 편이 좋습니다.",
    ],
  },
};

function buildSourceFacts(fact: DominantTenGodFact) {
  return [
    `tenGod=${fact.name}`,
    `count=${fact.count}`,
    `locations=${fact.locations.join(",")}`,
  ];
}

export function buildTenGodCopies(
  facts: SajuReadingFacts,
): TenGodReadingCopy[] {
  return facts.tenGods.dominant.map((fact) => {
    const seed = TEN_GOD_COPY[fact.name];
    return {
      name: fact.name,
      count: fact.count,
      headline: seed.headline,
      body: `${seed.body[0]} ${seed.body[1]}`,
      sourceFacts: buildSourceFacts(fact),
    };
  });
}
