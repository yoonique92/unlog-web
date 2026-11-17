type TenGodCounts = Record<string, number>;

type CombinationResult = {
  title: string;
  summary: string;
  strength: string;
  caution: string;
};

export function getCombinationInterpretation(
  counts: TenGodCounts
): CombinationResult[] {
  const results: CombinationResult[] = [];

  const bigyeon = counts["비견"] || 0;
  const geobjae = counts["겁재"] || 0;
  const siksin = counts["식신"] || 0;
  const sanggwan = counts["상관"] || 0;
  const pyeonjae = counts["편재"] || 0;
  const jeongjae = counts["정재"] || 0;
  const pyeongwan = counts["편관"] || 0;
  const jeonggwan = counts["정관"] || 0;
  const pyeonin = counts["편인"] || 0;
  const jeongin = counts["정인"] || 0;

  // 비견 + 식신
  if (bigyeon >= 2 && siksin >= 1) {
    results.push({
      title: "내 방식으로 결과를 만들어내는 힘",
      summary:
        "자기 기준이 분명하면서도 생각만 하기보다 실제 결과를 만들어내려는 성향이 강한 편이에요.",
      strength:
        "스스로 결정하고 직접 실행하는 힘이 좋아요. 남이 시켜서 하기보다 내가 납득한 방식으로 움직일 때 능률이 올라갈 수 있어요.",
      caution:
        "자기 방식에 대한 확신이 강해지면 다른 사람의 방식이 답답하게 느껴질 수 있어요. 협업에서는 기준을 설명하고 조율하는 과정이 중요해요.",
    });
  }

  // 비견 + 상관
  if (bigyeon >= 2 && sanggwan >= 1) {
    results.push({
      title: "고집이 아니라 독립적인 판단",
      summary:
        "남들이 당연하게 받아들이는 방식도 스스로 납득되지 않으면 그대로 따르기보다 다른 해법을 찾으려는 편이에요.",
      strength:
        "비효율이나 모순을 빠르게 발견하고, 자신의 관점으로 문제를 다시 설계하는 힘이 있어요.",
      caution:
        "말이나 판단이 빠르고 단호하게 나가면 주변에서는 강하게 느낄 수 있어요. 내용이 맞더라도 전달 방식에 따라 관계의 온도가 달라질 수 있어요.",
    });
  }

  // 식신 + 상관
  if (siksin >= 1 && sanggwan >= 1) {
    results.push({
      title: "재능을 결과물로 바꾸는 표현력",
      summary:
        "아이디어를 머릿속에만 두기보다 말, 글, 기술, 기획, 콘텐츠처럼 눈에 보이는 형태로 만들어낼 가능성이 커요.",
      strength:
        "창의성과 실무 감각을 함께 쓸 수 있어서 전문성을 쌓을수록 자신만의 방식이 더 선명해질 수 있어요.",
      caution:
        "완성도에 대한 기준이 높아지면 주변의 속도나 방식이 답답하게 느껴질 수 있어요. 완벽함보다 전달과 실행의 타이밍도 중요해요.",
    });
  }

  // 비견 + 관성
  if (bigyeon >= 2 && (jeonggwan >= 1 || pyeongwan >= 1)) {
    results.push({
      title: "자율성과 책임감이 함께 있는 타입",
      summary:
        "자기 기준이 강하지만 책임을 회피하기보다 맡은 역할을 제대로 해내려는 힘도 함께 나타날 수 있어요.",
      strength:
        "내가 주도권을 가지고 일할 때 책임감과 실행력이 동시에 살아날 수 있어요.",
      caution:
        "통제가 강한 환경에서는 답답함이 커질 수 있어요. 자유와 책임의 균형이 맞는 환경이 중요해요.",
    });
  }

  // 식상 + 재성
  if ((siksin + sanggwan) >= 2 && (jeongjae + pyeonjae) >= 1) {
    results.push({
      title: "실력을 수익으로 연결하는 감각",
      summary:
        "자신이 가진 기술이나 표현력을 실제 수익과 연결하려는 감각이 나타날 수 있어요.",
      strength:
        "전문성, 콘텐츠, 결과물, 서비스처럼 내가 만들어낸 것을 가치로 바꾸는 데 강점이 있을 수 있어요.",
      caution:
        "아이디어와 실행은 빠른데 수익 구조나 관리가 뒤따르지 않으면 성과가 흩어질 수 있어요.",
    });
  }

  // 인성 + 식상
  if ((jeongin + pyeonin) >= 1 && (siksin + sanggwan) >= 1) {
    results.push({
      title: "배우고 해석하고 표현하는 힘",
      summary:
        "정보를 받아들이는 것에서 끝나지 않고 자신의 방식으로 해석해 다시 표현하는 능력이 있을 수 있어요.",
      strength:
        "공부, 기획, 분석, 글쓰기, 콘텐츠, 전문지식처럼 지식을 가공해서 전달하는 분야와 잘 맞을 수 있어요.",
      caution:
        "생각과 표현이 많아지면 머릿속이 복잡해질 수 있어요. 배운 것을 실제 행동으로 연결하는 리듬이 중요해요.",
    });
  }

  // 재성 약함
  if (jeongjae + pyeonjae === 0) {
    results.push({
      title: "돈 자체보다 실력과 구조가 먼저",
      summary:
        "재성의 존재감이 약하면 돈을 직접 좇기보다 자신의 실력이나 결과물을 통해 수익 구조를 만드는 방식이 더 자연스러울 수 있어요.",
      strength:
        "당장의 수입을 늘리는 일보다 전문성과 기술을 쌓아 오래 쓸 기반을 만드는 데 강점을 둘 수 있어요.",
      caution:
        "수익 관리나 현실적인 숫자 감각은 의식적으로 챙기는 것이 좋아요. 잘하는 것과 돈이 되는 것은 별개의 문제일 수 있어요.",
    });
  }

  // 관성 약함
  if (jeonggwan + pyeongwan === 0) {
    results.push({
      title: "정해진 틀보다 자율성이 중요한 사람",
      summary:
        "관성의 존재감이 약하면 조직의 규칙이나 외부 기준보다 자신의 판단과 방식이 더 중요하게 느껴질 수 있어요.",
      strength:
        "자율성이 높은 환경이나 전문성을 기반으로 한 역할에서 강점을 발휘할 수 있어요.",
      caution:
        "규칙과 절차가 필요한 상황에서는 답답함을 느끼더라도 일정 부분 구조를 받아들이는 연습이 도움이 돼요.",
    });
  }

  return results;
}
