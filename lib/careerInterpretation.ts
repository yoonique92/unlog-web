type CareerInput = {
  counts: Record<string, number>;
};

export function getCareerInterpretation({ counts }: CareerInput) {
  const bijeon =
    (counts["비견"] || 0) + (counts["겁재"] || 0);

  const siksang =
    (counts["식신"] || 0) + (counts["상관"] || 0);

  const jaeseong =
    (counts["편재"] || 0) + (counts["정재"] || 0);

  const gwanseong =
    (counts["편관"] || 0) + (counts["정관"] || 0);

  const inseong =
    (counts["편인"] || 0) + (counts["정인"] || 0);

  const groups = [
    {
      key: "bijeon",
      score: bijeon,
      title: "스스로 방향을 정할 때 힘이 나는 타입",
      summary:
        "자신의 판단과 기준을 가지고 움직일 수 있는 환경에서 역량이 잘 드러나는 편이에요.",
      fit:
        "주도권이 있는 업무, 독립적으로 판단할 수 있는 역할, 개인의 책임 범위가 분명한 일이 잘 맞을 수 있어요.",
      caution:
        "협업 과정에서 자신의 방식만 고집하지 않도록 다른 사람의 의견을 의식적으로 듣는 것이 중요해요.",
    },
    {
      key: "siksang",
      score: siksang,
      title: "아이디어를 실제 결과물로 만드는 타입",
      summary:
        "생각한 것을 표현하고 직접 만들어내는 과정에서 강점을 발휘하기 쉬운 편이에요.",
      fit:
        "콘텐츠, 기획, 디자인, 개발, 교육처럼 아이디어나 기술을 눈에 보이는 결과물로 만드는 일이 잘 맞을 수 있어요.",
      caution:
        "흥미가 떨어지면 집중력이 흔들릴 수 있어서 꾸준히 완성하는 습관을 만드는 것이 중요해요.",
    },
    {
      key: "jaeseong",
      score: jaeseong,
      title: "성과와 현실적인 결과를 만들어내는 타입",
      summary:
        "목표와 결과가 분명할수록 집중력이 살아나고 현실적인 성과를 만드는 데 강점을 보일 수 있어요.",
      fit:
        "사업, 영업, 운영, 재무, 프로젝트 관리처럼 결과와 성과를 직접 확인할 수 있는 일이 잘 맞을 수 있어요.",
      caution:
        "성과만 지나치게 의식하면 과정에서 오는 피로가 커질 수 있으니 장기적인 리듬을 함께 보는 것이 좋아요.",
    },
    {
      key: "gwanseong",
      score: gwanseong,
      title: "책임과 역할이 분명할 때 강해지는 타입",
      summary:
        "자신에게 맡겨진 역할과 책임이 명확할수록 안정적으로 실력을 발휘하기 쉬운 편이에요.",
      fit:
        "조직 관리, 행정, 공공 분야, 전문직처럼 책임과 기준이 명확한 환경에서 장점이 드러날 수 있어요.",
      caution:
        "책임감 때문에 필요 이상으로 부담을 떠안지 않도록 자신의 한계를 조절하는 것이 중요해요.",
    },
    {
      key: "inseong",
      score: inseong,
      title: "배우고 분석하며 전문성을 쌓는 타입",
      summary:
        "새로운 지식을 이해하고 깊이 파고들면서 자신의 전문성을 만드는 과정에 강점이 있을 수 있어요.",
      fit:
        "연구, 분석, 상담, 교육, 문서·정보 분야처럼 지식과 경험을 축적해 활용하는 일이 잘 맞을 수 있어요.",
      caution:
        "충분히 준비한 뒤 시작하려는 마음 때문에 실행이 늦어지지 않도록 작은 시도를 병행하는 것이 좋아요.",
    },
  ];

  const sorted = [...groups].sort(
    (a, b) => b.score - a.score
  );

  const primary = sorted[0];
  const secondary = sorted[1];
  const keywordMap: Record<string, string[]> = {
    bijeon: [
      "독립적인 역할",
      "리더십",
      "개인 프로젝트",
      "자율적인 업무",
    ],
    siksang: [
      "기획",
      "콘텐츠",
      "디자인",
      "개발",
      "교육",
      "창작",
    ],
    jaeseong: [
      "사업",
      "영업",
      "운영",
      "재무",
      "프로젝트 관리",
    ],
    gwanseong: [
      "조직 관리",
      "행정",
      "공공 분야",
      "전문직",
      "관리 역할",
    ],
    inseong: [
      "연구",
      "분석",
      "상담",
      "교육",
      "문서",
      "정보 분야",
    ],
  };

  const workKeywords = Array.from(
    new Set([
      ...(keywordMap[primary.key] || []),
      ...(keywordMap[secondary.key] || []),
    ])
  ).slice(0, 6);

  const idealEnvironment =
    `${primary.summary} 또한 ${secondary.summary}`;

  const difficultEnvironment =
    primary.key === "bijeon"
      ? "업무 방식이 지나치게 세세하게 정해져 있고, 스스로 판단할 여지가 거의 없는 환경에서는 답답함을 느낄 수 있어요."
      : primary.key === "siksang"
      ? "아이디어를 활용할 여지가 적고 반복적인 절차만 계속 수행해야 하는 환경에서는 흥미가 쉽게 떨어질 수 있어요."
      : primary.key === "jaeseong"
      ? "성과 기준이 불분명하거나 결과가 오래도록 보이지 않는 환경에서는 동기부여가 약해질 수 있어요."
      : primary.key === "gwanseong"
      ? "역할과 책임이 불분명하고 기준이 자주 바뀌는 환경에서는 피로감을 느끼기 쉬워요."
      : "배우거나 깊이 생각할 여유 없이 빠른 실행만 반복해야 하는 환경에서는 자신의 강점을 충분히 쓰기 어려울 수 있어요.";
    return {
    primary,
    secondary,
    workKeywords,
    idealEnvironment,
    difficultEnvironment,
  };
}