export const FORTUNE_COPY_CONTENT_KINDS = [
  "yearly_section",
  "monthly_body",
  "monthly_headline",
  "today_fortune",
  "tip",
  "relationship",
  "myeongri_explanation",
  "legacy_interpretation",
] as const;

export type FortuneCopyContentKind =
  (typeof FORTUNE_COPY_CONTENT_KINDS)[number];

export type FortuneCopyToneProfile = {
  readonly distance: "calm" | "close" | "hook" | "concise";
  readonly purpose: string;
  readonly guidance: readonly string[];
};

/**
 * Shared writing policy for user-facing fortune interpretations.
 *
 * This is an authoring contract for deterministic copy builders. It must not be
 * used as a runtime rewriting layer: calculations produce evidence, builders
 * choose copy, and this policy only constrains how that copy is written.
 */
export const UNLOG_FORTUNE_VOICE_POLICY = {
  identity:
    "차분하지만 딱딱하지 않고, 실제 생활 장면을 구체적으로 짚어주며, 과장하지 않고 현실적인 방향을 알려주는 사람",
  authority: {
    statement:
      "이 정책이 모든 운로그 해석 copy의 최상위 기준이며, 기존 yearly/monthly를 포함한 개별 builder는 이 정책을 따른다.",
    appliesTo: [
      "yearly copy",
      "monthly copy",
      "today fortune",
      "compatibility and relationship copy",
      "myeongri explanations",
      "future fortune interpretations",
    ],
  },
  principles: [
    "자연스러운 존댓말을 사용하되 보고서처럼 딱딱하거나 친구처럼 지나치게 가볍지 않게 쓴다.",
    "명리 용어보다 사용자가 실제로 겪을 생각, 행동, 대화와 생활 장면을 먼저 설명한다.",
    "사건을 확정하지 않고 사용자가 선택할 여지를 남긴다.",
    "불안이나 공포를 과장하지 않으며 좋은 점과 주의할 점을 함께 다룬다.",
    "조언은 명령보다 현실적인 제안에 가깝게 쓴다.",
    "앞 문장이 다음 문장의 이유나 배경이 되도록 상황, 체감, 맥락, 활용 순서로 연결한다.",
    "각 문장은 독립된 정보를 나열하지 않고, 가능하면 바로 앞 문장의 원인·결과·보충·대응 중 하나로 이어지게 쓴다.",
  ],
  explanationOrder: [
    "계산 근거에서 읽힌 사실이나 상황",
    "그 상황이 생활에서 체감될 수 있는 장면",
    "함께 작용하는 보완점이나 주의점",
    "현실적으로 활용할 수 있는 선택 또는 제안",
  ],
  toneByContent: {
    yearly_section: {
      distance: "calm",
      purpose: "한 해의 큰 그림과 생활에서 나타날 수 있는 변화를 차분하게 설명한다.",
      guidance: [
        "서로 함께 작용하는 성향을 먼저 보여준다.",
        "업무, 돈, 관계, 생활 리듬처럼 section에 맞는 구체적인 장면으로 연결한다.",
      ],
    },
    monthly_body: {
      distance: "close",
      purpose: "같은 화자가 한 달의 가까운 생활 장면을 조금 더 구체적으로 설명한다.",
      guidance: [
        "headline이 던진 장면을 첫 문장에서 바로 이어받는다.",
        "headline보다 한 단계 차분하게 설명하고 지나친 구어체를 피한다.",
      ],
    },
    monthly_headline: {
      distance: "hook",
      purpose: "운세를 요약하지 않고 그 달에 겪을 법한 한 장면을 한 컷처럼 보여준다.",
      guidance: [
        "body보다 한 단계 캐주얼할 수 있다.",
        "생활 명사와 작은 고민을 사용하되 사건을 확정하거나 공포를 조장하지 않는다.",
      ],
    },
    today_fortune: {
      distance: "close",
      purpose: "오늘 바로 체감할 수 있는 장면과 대응을 짧고 분명하게 설명한다.",
      guidance: [
        "점수나 십성 이름을 풀이 문장에 그대로 옮기지 않는다.",
        "오늘 할 수 있는 행동과 대화, 지출, 일정 같은 가까운 장면을 사용한다.",
        "Today Fortune은 가장 짧게 소비되는 해석이므로, headline은 설명보다 압축을 우선하고, body는 2~3개의 독립 문장을 나열하기보다 하나의 생활 장면과 대응이 자연스럽게 이어지도록 작성한다.",
        "Today 상세 본문은 문장 연결성을 위해 정보를 한 문장에 과도하게 합치지 않는다. 기본적으로 2~3개의 짧은 문장으로 구성하되, 각 문장은 앞 문장의 결과·보충·대응으로 자연스럽게 이어지게 쓴다.",
        "모든 category가 동일한 '~한 날이라 → 가능성이 있습니다 → 해보세요' 구조를 공유하지 않도록 한다.",
      ],
    },
    tip: {
      distance: "concise",
      purpose: "해석에서 나온 상황과 직접 연결되는 짧고 실용적인 제안을 건넨다.",
      guidance: [
        "반드시, 무조건 같은 명령형을 피한다.",
        "해당 해석 없이도 통하는 범용 자기계발 조언은 쓰지 않는다.",
      ],
    },
    relationship: {
      distance: "calm",
      purpose: "사람을 평가하지 않고 두 사람 사이에서 나타날 수 있는 패턴을 설명한다.",
      guidance: [
        "상대의 속마음이나 관계 사건을 단정하지 않는다.",
        "대화, 거리, 역할, 표현 방식처럼 관찰 가능한 장면을 사용한다.",
      ],
    },
    myeongri_explanation: {
      distance: "calm",
      purpose: "학술 용어의 의미를 먼저 생활 언어로 설명하고 필요할 때 용어를 보충한다.",
      guidance: [
        "전문용어만 나열하지 않는다.",
        "계산 결과와 해석을 구분하고 근거 없는 사건으로 확장하지 않는다.",
      ],
    },
    legacy_interpretation: {
      distance: "calm",
      purpose: "기존 해석 모듈도 같은 화자의 생활 언어로 읽히게 한다.",
      guidance: [
        "계산 결과와 명리 개념은 유지하고 표현만 생활 장면으로 번역한다.",
        "현재 연결되지 않은 모듈도 다시 사용될 때 문체가 튀지 않게 한다.",
      ],
    },
  } satisfies Record<FortuneCopyContentKind, FortuneCopyToneProfile>,
  preferredEndings: [
    "~할 수 있어요.",
    "~할 수 있습니다.",
    "~하는 편이 좋아요.",
    "~해두면 좋습니다.",
    "~필요가 있어요.",
    "~가 중요해질 수 있습니다.",
    "~면 훨씬 수월해져요.",
  ],
  abstractTerms: ["기운", "에너지", "흐름", "가능성", "방향", "변화", "균형"],
  strongDirectiveTerms: ["반드시", "무조건", "절대로", "무조건 피하세요"],
  deterministicEventPatterns: [
    /(?:이직|퇴사|결혼|이혼|연애|임신|합격|성공|실패)하게 됩니다/u,
    /(?:돈|재물)이 (?:들어옵니다|생깁니다)/u,
    /(?:갈등|사고|질병)이 생깁니다/u,
  ],
  cautions: [
    "추상어는 구체적인 생활 장면 없이 단독으로 반복하지 않는다.",
    "같은 종결을 세 문장 이상 기계적으로 반복하지 않는다.",
    "fortune body와 Tip에서는 ~고요, ~되고요, ~커지고요, ~싶어지고요 같은 대화형 연결 종결을 기본적으로 사용하지 않는다.",
    "runtime 문자열 치환으로 말투를 자동 변환하지 않는다.",
  ],
} as const;

