export const UNLOG_INTERPRETATION_TONE = {
  identity:
    "내 사주를 제대로 이해한 사람이 실제 생활에서 느낄 법한 장면을 편안하고 현실적으로 이야기해주는 말투",
  voice: [
    "귀엽지만 유치하지 않게 쓴다.",
    "친근하고 따뜻하게 말하되 가볍게 넘기거나 무조건 긍정하지 않는다.",
    "사주 용어보다 사용자가 먼저 느낄 생각, 감정, 행동과 생활 장면을 설명한다.",
    "좋은 점과 주의할 점을 함께 설명하고 마지막에는 활용 방법을 제안한다.",
    "해당 사용자의 계산 결과와 대상 기간, 운세 영역에 근거한 내용만 쓴다.",
  ],
  explanationOrder: [
    "사용자가 느낄 수 있는 모습",
    "실제 생활에서 나타날 수 있는 장면",
    "그 흐름이 생기는 사주적 이유",
    "좋은 점과 주의할 점",
    "흐름을 활용하는 방법",
  ],
  endings: [
    "~해요",
    "~수 있어요",
    "~에 가까워요",
    "~인 편이에요",
    "~해보는 게 좋아요",
    "~가 중요해요",
  ],
  avoid: [
    "전문용어로 문장을 시작하지 않는다.",
    "사용자 데이터에 없는 직업, 가족관계, 과거 사건을 특정하지 않는다.",
    "미래 사건, 성공, 실패, 관계 변화나 손실을 확정적으로 예언하지 않는다.",
    "불안과 공포를 조장하거나 최고의 해, 대박, 운명의 상대처럼 과장하지 않는다.",
    "상담사 문구나 전통 점술가 문구처럼 획일적으로 쓰지 않는다.",
    "이모지는 한 섹션에 0~1개만 사용한다.",
  ],
  health: [
    "질병이나 특정 질환을 진단하거나 예측하지 않는다.",
    "컨디션, 생활 리듬, 과로, 휴식, 스트레스와 체력 관리 수준으로 설명한다.",
    "실제 건강 문제가 있다면 의료적인 확인이 필요하다는 안내를 유지한다.",
  ],
  summary:
    "전통 사주 용어 대신 사용자의 고민이나 선택이 드러나는 한 문장으로 쓰고, 단정적인 예언은 피한다.",
  keywords:
    "행운·행복·성공 같은 추상어 대신 행동, 선택 기준, 관계 태도를 나타내는 구체적인 세 단어 또는 짧은 구를 쓴다.",
} as const;

export const UNLOG_YEARLY_SECTION_ORDER = [
  "overall",
  "relationship",
  "money",
  "health",
  "career",
  "study",
] as const;

export type UnlogYearlySection = (typeof UNLOG_YEARLY_SECTION_ORDER)[number];

export const UNLOG_OVERCERTAIN_EXPRESSIONS = [
  "반드시",
  "무조건",
  "100%",
  "확실히",
  "틀림없이",
  "무조건 성공",
  "최고의 해",
  "대박 운",
  "운명의 상대",
] as const;

export const UNLOG_DETERMINISTIC_EVENT_PATTERN =
  /(?:19|20)\d{2}년[^.\n]*(?:결혼|이혼|임신|사망|죽|사고|질병|암|수술)[^.\n]*(?:합니다|됩니다|생깁니다|발생합니다)/;

export const UNLOG_MEDICAL_CERTAINTY_PATTERN =
  /(?:질병|암|임신|유산|사망|수명|교통사고)[^.\n]*(?:확실|반드시|합니다|됩니다|생깁니다)/;

type InterpretationInstructionOptions = {
  area: string;
  period?: string;
  includeKeywords?: boolean;
};

export function buildUnlogInterpretationInstructions({
  area,
  period,
  includeKeywords = true,
}: InterpretationInstructionOptions) {
  const context = [period, area].filter(Boolean).join(" ");
  const lines = [
    `운로그의 ${context} 풀이를 작성한다.`,
    `문체 방향: ${UNLOG_INTERPRETATION_TONE.identity}.`,
    "설명 순서:",
    ...UNLOG_INTERPRETATION_TONE.explanationOrder.map(
      (item, index) => `${index + 1}. ${item}`
    ),
    "작성 규칙:",
    ...UNLOG_INTERPRETATION_TONE.voice.map((item) => `- ${item}`),
    ...UNLOG_INTERPRETATION_TONE.avoid.map((item) => `- ${item}`),
    `- 한줄 요약: ${UNLOG_INTERPRETATION_TONE.summary}`,
  ];

  if (area.includes("건강")) {
    lines.push(
      ...UNLOG_INTERPRETATION_TONE.health.map((item) => `- ${item}`)
    );
  }

  if (includeKeywords) {
    lines.push(`- 마지막 키워드 3개: ${UNLOG_INTERPRETATION_TONE.keywords}`);
  }

  return lines.join("\n");
}
