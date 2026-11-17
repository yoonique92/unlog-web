import type {
  YearlyActivityPhase,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

interface MoneyCopySelection {
  headline: string;
  core: string;
}

interface MoneyCombinationRule extends MoneyCopySelection {
  id: string;
  matches: (kinds: ReadonlySet<YearlyOverallSignalKind>, phase?: YearlyActivityPhase) => boolean;
}

export const MONEY_COMBINATION_RULES: readonly MoneyCombinationRule[] = [
  {
    id: "stability-resetting",
    matches: (kinds, phase) => kinds.has("stability") && phase === "resetting",
    headline: "지킬 돈과 기회에 쓸 돈을 구분하는 해",
    core: "올해는 생활비와 저축을 안정적으로 지키려는 마음과, 경험이나 새로운 기회에는 과감히 돈을 써보고 싶은 마음이 동시에 커질 수 있어요.",
  },
  {
    id: "stability-change",
    matches: (kinds) => kinds.has("stability") && kinds.has("change"),
    headline: "새로운 지출은 따져보고 생활비는 지키는 해",
    core: "기존 생활비와 저축은 지키되, 새 기회에 돈을 쓸 때는 예상 비용과 회수 기간을 함께 따져봐야 합니다.",
  },
  {
    id: "momentum-expanding",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "expanding",
    headline: "내가 만든 결과를 수입 기회로 연결해 보는 해",
    core: "해온 일이나 만든 결과를 실제 수입과 연결할 방법을 찾기 좋은 때지만, 제안별 조건과 필요한 비용은 따로 확인해야 해요.",
  },
  {
    id: "momentum-peaking",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "peaking",
    headline: "돈과 시간을 가장 중요한 곳에 모으는 해",
    core: "여러 곳에 조금씩 쓰기보다 효과가 분명한 한두 항목에 돈과 시간을 모을 때 만족도가 높아질 수 있습니다.",
  },
  {
    id: "change-caution",
    matches: (kinds) => kinds.has("change") && kinds.has("caution"),
    headline: "새로운 돈 쓸 일의 조건을 꼼꼼히 따지는 해",
    core: "매력적인 제안이 보여도 바로 결제하거나 투자하기보다, 총비용과 유지 부담을 먼저 계산해야 하는 시기예요.",
  },
  {
    id: "stability",
    matches: (kinds) => kinds.has("stability"),
    headline: "생활비와 저축 습관을 단단히 만드는 해",
    core: "큰 수익을 좇기보다 매달 반복할 수 있는 저축과 지출 습관을 만드는 일이 실제 여유로 이어질 수 있습니다.",
  },
  {
    id: "momentum",
    matches: (kinds) => kinds.has("momentum"),
    headline: "아이디어를 실제 수입 방식으로 시험해 보는 해",
    core: "아이디어나 결과물을 누가, 어떤 조건에서 필요로 하는지 확인하면 수입으로 연결할 방법이 구체적으로 보일 거예요.",
  },
  {
    id: "change",
    matches: (kinds) => kinds.has("change"),
    headline: "돈 쓰는 방식을 바꾸기 전에 조건을 비교하는 해",
    core: "새 상품이나 관리 방식을 선택할 때는 편리함만 보지 말고 수수료, 기간, 중도 변경 조건까지 비교하는 편이 좋습니다.",
  },
  {
    id: "caution",
    matches: (kinds) => kinds.has("caution"),
    headline: "새는 돈을 줄이고 필요한 지출부터 챙기는 해",
    core: "돈이 여러 곳으로 나가기 쉬울수록 고정비와 꼭 필요한 지출을 먼저 확보해야 부담을 줄일 수 있어요.",
  },
];

const MONEY_PHASE_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "처음부터 완벽한 예산을 짜기보다 일주일 동안 실제 지출을 적어보면 어디부터 손볼지 보입니다.",
  expanding: "새로운 선택지가 늘어날수록 예상 수익만 보지 말고, 시작 비용과 매달 나갈 돈까지 함께 확인해보세요.",
  peaking: "여러 목표에 돈을 나누기보다 올해 가장 중요한 목표 한두 가지에 예산을 먼저 배정하는 편이 좋습니다.",
  stabilizing: "자동이체나 주간 지출 확인처럼 반복하기 쉬운 관리 습관을 만들면 오래 유지할 수 있어요.",
  contracting: "자주 쓰지 않는 구독과 습관성 지출을 줄이면 꼭 필요한 곳에 쓸 여유가 생깁니다.",
  resetting: "그래서 평소 관리 방식은 유지하면서도 교육, 이동, 취미, 새로운 일처럼 의미 있다고 느끼는 항목에는 지출 범위를 넓힐 수 있습니다.",
};

const MONEY_PHASE_DETAIL_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "돈을 어디에 써야 만족이 오래가는지 아직 판단이 서지 않아 작은 결제가 여러 번 생길 수 있습니다. 새로운 항목은 처음부터 큰 금액을 넣기보다 실제 이용 빈도와 필요성을 확인할 수 있는 규모로 시작하는 것이 안전해요. 지출 뒤에 남는 가치가 무엇인지 확인해야 올해의 돈 쓰는 방향이 분명해집니다.",
  expanding: "배움, 이동, 장비, 사람을 만나는 비용처럼 활동 범위를 넓히는 지출이 평소보다 매력적으로 보일 수 있습니다. 이런 돈은 단순한 낭비와는 다르지만 기대만으로 규모를 키우면 기존 생활비와 함께 감당하기 어려워져요. 필요한 총액과 효과를 확인할 시점을 미리 정해두면 기회를 살리면서 부담을 통제할 수 있습니다. 같은 목적이라도 구매, 대여, 단기 이용처럼 비용 구조가 다른 방법을 비교하면 경험에 필요한 돈과 소유하고 싶은 마음에서 나가는 돈을 구별하기 쉬워집니다.",
  peaking: "성과를 내고 싶은 분야에 비용을 집중하고 싶어지는 만큼 여러 목표가 예산을 두고 경쟁할 수 있습니다. 눈앞의 효과가 큰 항목만 따라가면 장기적으로 유지해야 할 비용을 놓치기 쉬워요. 올해 가장 중요한 결과와 직접 연결되는 지출부터 배정해야 돈과 시간의 효율이 높아집니다.",
  stabilizing: "수입의 크기보다 매달 반복되는 지출과 저축 방식을 안정적으로 유지하는 일이 중요하게 느껴질 수 있습니다. 이미 잘 지키고 있는 항목은 그대로 두고 불편해서 자꾸 깨지는 방식만 손보는 것이 효과적이에요. 오래 지속할 수 있는 관리 구조를 만드는 것이 일시적인 절약보다 실질적인 여유를 남깁니다.",
  contracting: "이전에 필요해서 시작한 구독이나 고정 지출 가운데 지금은 쓰임이 줄어든 항목이 눈에 들어올 수 있습니다. 무조건 아끼기보다 생활 만족도를 거의 높이지 못하는 비용부터 덜어내야 답답함이 적어요. 그렇게 확보한 여유를 꼭 지켜야 할 책임성 지출에 배치하면 관리 부담도 함께 낮아집니다.",
  resetting: "평소에는 신중하게 관리하다가도 새로운 경험이 앞으로의 기회가 될 것 같으면 예상보다 큰 금액을 허용할 수 있습니다. 특히 교육, 이동, 취미처럼 한 번 시작하면 추가 비용이 이어지는 항목은 첫 결제보다 전체 유지 비용이 중요해요. 기존 저축과 고정비를 건드리지 않는 한도를 먼저 정하면 호기심을 억누르지 않으면서도 생활비와 저축을 지킬 수 있습니다. 결제하기 전에는 그 돈이 생활의 불편을 줄이는지, 새로운 경험을 확인하는지, 단순히 답답한 기분을 바꾸려는지를 나누어 보면 지출의 우선순위가 훨씬 선명해집니다.",
};

const FALLBACK_SELECTION: MoneyCopySelection = {
  headline: "내 돈이 어디에 쓰이는지 확인하는 해",
  core: "올해는 수입의 많고 적음을 예측하기보다, 돈과 시간을 어디에 쓰고 있는지 실제 기록으로 확인하는 일이 중요합니다.",
};

export function selectMoneyCombination(
  annualSignals: readonly YearlyInterpretationSignal[],
): MoneyCopySelection {
  const kinds = new Set(annualSignals.map(({ kind }) => kind));
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return MONEY_COMBINATION_RULES.find((rule) => rule.matches(kinds, phase))
    ?? FALLBACK_SELECTION;
}

export function selectMoneyPhaseCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = annualSignals.find(({ activityPhase }) => activityPhase);
  return signal?.activityPhase
    ? {
        text: MONEY_PHASE_COPY[signal.activityPhase],
        detail: MONEY_PHASE_DETAIL_COPY[signal.activityPhase],
        signalId: signal.id,
      }
    : null;
}

export function selectMoneyCautionCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
  daeunSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = [...annualSignals, ...daeunSignals].find(({ kind }) => kind === "caution");
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return signal
    ? {
        text: phase === "expanding"
          ? "활동 범위를 넓히는 비용은 한꺼번에 확정하기보다 작은 금액으로 효과를 확인해야, 기대에 못 미친 항목을 오래 유지하는 부담을 줄일 수 있어요."
          : "필요해서 쓰는 돈과 새로운 경험에 쓰는 돈을 구분하면, 생활비와 고정비를 해치지 않으면서도 해보고 싶던 일을 무리 없이 이어가기 쉬워요.",
        signalId: signal.id,
      }
    : null;
}

export function selectMoneyTip(
  annualSignals: readonly YearlyInterpretationSignal[],
  hasCaution: boolean,
) {
  if (hasCaution) {
    const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
    return phase === "expanding"
      ? "배움이나 장비에 돈을 쓰기 전에는 가장 작은 이용 단위로 먼저 써보고, 실제 사용 횟수와 얻은 결과를 확인하세요."
      : "관심 가는 지출이 생기면 금액만 보지 말고, 고정비를 제외한 뒤에도 몇 달간 감당할 수 있는지 살펴보는 편이 좋습니다.";
  }
  if (annualSignals.some(({ kind }) => kind === "change")) {
    return "새로운 선택에 돈을 쓰기 전에 총비용과 매달 유지할 금액을 먼저 계산해보세요.";
  }
  if (annualSignals.some(({ kind }) => kind === "momentum")) {
    return "내 결과물을 필요로 할 사람과 받을 수 있는 금액을 작게라도 시험해보세요.";
  }
  return "일주일만 카드와 계좌 사용 내역을 적어 반복되는 지출부터 확인해보세요.";
}
