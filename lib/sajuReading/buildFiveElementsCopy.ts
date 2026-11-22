import {
  FIVE_ELEMENTS_KO,
  type FiveElementKo,
  type SajuReadingFacts,
  type SajuReadingSectionCopy,
} from "./types";

const ELEMENT_LIFE_COPY: Record<
  FiveElementKo,
  { noun: string; description: string; caution: string }
> = {
  목: {
    noun: "새 일을 시작하고 키워가는 힘",
    description: "새로운 일을 시작하거나 아직 완성되지 않은 것을 조금씩 키워가는 방식이 생활에서 자주 드러날 수 있어요.",
    caution: "속도를 내기 시작하면 다른 선택을 충분히 비교하기 전에 방향을 정할 수 있습니다.",
  },
  화: {
    noun: "표현하고 빠르게 움직이는 힘",
    description: "생각이나 감정을 밖으로 표현하고, 해야 할 일이 보이면 먼저 움직이는 방식이 생활에서 자주 드러날 수 있어요.",
    caution: "마음이 앞서는 순간에는 세부 조건을 확인하기 전에 말하거나 행동할 수 있습니다.",
  },
  토: {
    noun: "현실적으로 유지하고 쌓는 힘",
    description: "시간과 비용처럼 현실적인 조건을 먼저 살피고, 이미 시작한 일을 안정적으로 유지하는 방식이 자주 드러날 수 있어요.",
    caution: "익숙한 방식을 지키는 데 힘을 많이 쓰면 새로운 제안이 부담스럽게 느껴질 수 있습니다.",
  },
  금: {
    noun: "기준을 세우고 다듬는 힘",
    description: "무엇이 필요한지 기준을 세우고, 결과에서 부족한 부분을 찾아 정리하고 다듬는 방식이 자주 드러날 수 있어요.",
    caution: "완성도를 중요하게 볼수록 작은 실수나 차이가 크게 신경 쓰일 수 있습니다.",
  },
  수: {
    noun: "상황을 읽고 연결하는 힘",
    description: "사람과 정보 사이의 관계를 살피고, 상황이 바뀌면 다른 방법을 빠르게 떠올리는 방식이 자주 드러날 수 있어요.",
    caution: "여러 가능성을 함께 생각하다 보면 결정을 뒤로 미루거나 계획을 자주 바꿀 수 있습니다.",
  },
};

function listKo(items: readonly string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return items.length === 2 ? `${items[0]}과 ${items[1]}` : items.join("·");
}

export function buildFiveElementsCopy(
  facts: SajuReadingFacts,
): SajuReadingSectionCopy {
  const entries = FIVE_ELEMENTS_KO.map((element) => ({
    element,
    count: facts.fiveElements[element],
  }));
  const counts = entries.map((entry) => entry.count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const dominant = entries.filter((entry) => entry.count === max).map((entry) => entry.element);
  const weakest = entries.filter((entry) => entry.count === min).map((entry) => entry.element);
  const missing = entries.filter((entry) => entry.count === 0).map((entry) => entry.element);
  const balanced = max - min <= 1;

  if (balanced) {
    return {
      headline: "한 가지 방식보다 여러 성향을 고르게 꺼내 쓰는 편",
      paragraphs: [
        "겉으로 드러난 오행 분포가 크게 한쪽으로 치우치지 않아, 상황에 따라 서로 다른 방식을 꺼내 쓰기 쉬운 편이에요. 일을 시작할 때와 마무리할 때, 사람을 만날 때와 혼자 정리할 때처럼 장면이 달라지면 반응도 달라질 수 있습니다. 한 가지 성향으로 자신을 단정하기보다 어떤 상황에서 어떤 방식이 편한지 살펴보는 쪽이 더 잘 맞아요.",
        "오행의 숫자는 성격의 좋고 나쁨을 가르는 점수가 아닙니다. 같은 분포라도 일간과 십성, 계절 같은 다른 요소와 함께 볼 때 실제 모습이 달라질 수 있어요. 여기서는 다섯 가지 특징이 비교적 고르게 드러난다는 정도로 이해하면 충분합니다.",
      ],
      sourceFacts: entries.map((entry) => `${entry.element}=${entry.count}`),
    };
  }

  const dominantNouns = dominant.map((element) => ELEMENT_LIFE_COPY[element].noun);
  const dominantDescriptions = dominant.map((element) => ELEMENT_LIFE_COPY[element].description);
  const dominantCautions = dominant.map((element) => ELEMENT_LIFE_COPY[element].caution);
  const weakLabel = listKo(weakest);
  const missingSentence =
    missing.length > 0
      ? `${listKo(missing)}은 겉으로 드러난 원국에서 보이지 않지만, 그 성향이 전혀 없다는 뜻은 아닙니다. 익숙하지 않은 방식일수록 필요한 순간에 의식적으로 꺼내 쓰게 될 수 있어요.`
      : `${weakLabel}의 특징은 다른 오행보다 상대적으로 적게 드러납니다. 부족하다고 단정하기보다 평소 덜 익숙한 방식이 무엇인지 확인하는 정도로 보는 편이 좋아요.`;

  return {
    headline:
      dominant.length === 1
        ? `${dominantNouns[0]}이 상대적으로 선명해요`
        : `${listKo(dominantNouns)}이 함께 두드러져요`,
    paragraphs: [
      `${dominantDescriptions.join(" ")} 그래서 평소 선택을 할 때도 이런 방식이 먼저 손에 잡힐 수 있습니다. ${dominantCautions.join(" ")}`,
      `${missingSentence} 오행 분포는 하나의 관찰 기준일 뿐이고, 실제 행동은 일간과 십성 구성이 함께 작용하면서 달라질 수 있습니다. 숫자 하나만으로 성격이나 운의 좋고 나쁨을 판단하지 않는 것이 중요해요.`,
    ],
    sourceFacts: entries.map((entry) => `${entry.element}=${entry.count}`),
  };
}
