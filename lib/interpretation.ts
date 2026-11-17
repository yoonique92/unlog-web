const dayStemDescriptions: Record<string, string> = {
  甲: "큰 나무처럼 자신의 방향을 정하면 꾸준히 성장하려는 힘이 강해요.",
  乙: "덩굴이나 풀처럼 주변 환경을 살피며 유연하게 성장하는 힘이 있어요.",
  丙: "태양처럼 밝고 적극적이며, 생각이나 감정을 밖으로 분명하게 표현하는 편이에요.",
  丁: "촛불처럼 섬세하고 집중력이 강하며 자신만의 감각을 중요하게 여겨요.",
  戊: "큰 산처럼 안정감과 책임감을 중요하게 여기고 쉽게 흔들리지 않아요.",
  己: "잘 다듬어진 땅처럼 현실 감각이 좋고 자신의 것을 꾸준히 쌓아가는 힘이 있어요.",
  庚: "단단한 쇠처럼 결단력이 있고 문제를 직접 해결하려는 성향이 강해요.",
  辛: "보석처럼 섬세한 감각과 기준을 가지고 완성도와 디테일을 중요하게 생각해요.",
  壬: "큰 바다처럼 사고의 폭이 넓고 새로운 가능성을 탐색하려는 힘이 있어요.",
  癸: "비와 이슬처럼 섬세하게 상황을 읽고 사람과 환경에 맞춰 움직이는 편이에요.",
};

const elementDescriptions: Record<string, string> = {
  목: "새로운 일을 시작하고 꾸준히 키워가는 성향",
  화: "생각을 표현하고 일을 빠르게 시작하는 성향",
  토: "현실 감각과 안정성, 꾸준히 유지하고 쌓아가는 힘",
  금: "판단력과 분석력, 기준을 세우고 결과물을 다듬는 힘",
  수: "상황을 빠르게 읽고 사람과 정보를 연결하는 성향",
};

const elementCautions: Record<string, string> = {
  목: "한번 목표를 정하면 빠르게 밀고 가는 만큼, 다른 방법을 살펴보기 전에 결론을 내릴 수 있어요.",
  화: "마음이 앞서는 순간에는 충분히 생각하기 전에 말하거나 행동할 수 있어요.",
  토: "익숙한 생활을 지키려는 마음이 커지면 새로운 제안이 부담스럽게 느껴질 수 있어요.",
  금: "완성도를 중요하게 여길수록 자신이나 다른 사람의 작은 실수에도 엄격해질 수 있어요.",
  수: "여러 상황을 함께 생각하다 보면 결정을 미루거나 계획을 자주 바꿀 수 있어요.",
};

type FiveElements = {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
};

export function getPersonalityInterpretation(
  dayStem: string,
  fiveElements: FiveElements,
  strength: string
) {
  const dayStemText =
    dayStemDescriptions[dayStem] ||
    "자신만의 기질과 생활 방식을 가지고 있어요.";

  const elementEntries = Object.entries(fiveElements) as [
    keyof FiveElements,
    number
  ][];

  const dominantElement = elementEntries.reduce((strongest, current) =>
    current[1] > strongest[1] ? current : strongest
  );

  const weakestElements = elementEntries
    .filter(([, count]) => count === 0)
    .map(([element]) => element);

  const dominantElementName = dominantElement[0];

  const dominantText = `원국에서는 ${dominantElementName}의 특징이 가장 두드러져, ${elementDescriptions[dominantElementName]}이 생활 속에서 자주 드러날 수 있어요.`;

  const strengthText =
    strength === "strong"
      ? "스스로 결정을 내리고 일을 밀고 가는 힘이 비교적 분명해요. 혼자서 빠르게 해결할 수 있는 것이 장점이지만, 다른 사람의 의견을 듣는 시간을 남겨두면 판단이 한결 안정됩니다."
      : "주변 분위기와 상황의 영향을 세심하게 받아들이는 편이에요. 변화를 빨리 알아차리는 것이 장점인 만큼, 중요한 순간에는 내가 원하는 것이 무엇인지 먼저 확인해두면 좋아요.";

  const cautionText = elementCautions[dominantElementName];

  const weakText =
    weakestElements.length > 0
      ? `${weakestElements.join(
          "·"
        )}의 특징은 겉으로 드러난 원국에서 상대적으로 적어요. 이를 좋고 나쁨으로 나누기보다, 익숙하지 않은 방식은 필요한 순간에 의식적으로 연습해보는 편이 좋습니다.`
      : "다섯 가지 특징이 모두 나타나 있어, 상황에 따라 서로 다른 방식을 꺼내 쓸 여지가 있어요.";

  return {
    headline: `${dominantElementName}의 힘이 두드러지는 ${dayStem} 일간`,
    paragraphs: [
      dayStemText,
      dominantText,
      strengthText,
      cautionText,
      weakText,
    ],
  };
}

export function getStrengthLabel(strength: string) {
  if (strength === "strong") {
    return {
      title: "자기 판단이 분명한 편",
      description: "자기 기준과 추진력이 비교적 분명해요.",
    };
  }

  return {
    title: "주변 변화를 세심하게 읽는 편",
    description: "주변 환경의 영향을 비교적 세심하게 받아들이는 편이에요.",
  };
}
