import type {
  YearlyActivityPhase,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

interface CopySelection {
  headline: string;
  core: string;
}

interface CombinationRule extends CopySelection {
  id: string;
  matches: (kinds: ReadonlySet<YearlyOverallSignalKind>, phase?: YearlyActivityPhase) => boolean;
}

export const OVERALL_COMBINATION_RULES: readonly CombinationRule[] = [
  {
    id: "stability-resetting",
    matches: (kinds, phase) => kinds.has("stability") && phase === "resetting",
    headline: "익숙한 기반을 지키며 새로운 길을 시험하는 해",
    core: "올해는 이미 해오던 방식을 안정적으로 이어가려는 마음과, 눈앞에 들어오는 새로운 기회를 확인하고 싶은 마음이 동시에 커질 수 있어요.",
  },
  {
    id: "change-stability",
    matches: (kinds) => kinds.has("change") && kinds.has("stability"),
    headline: "지킬 것과 바꿀 것을 함께 고르는 해",
    core: "올해는 익숙한 기반을 지키면서도 달라진 상황에 맞춰 선택을 바꿔야 하는 일이 함께 생길 수 있습니다.",
  },
  {
    id: "momentum-expanding",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "expanding",
    headline: "새로운 선택지를 직접 확인해 보는 해",
    core: "올해는 관심 있던 분야나 미뤄왔던 일을 직접 시도하면서, 내게 맞는 선택지를 확인해보기 좋은 시기예요.",
  },
  {
    id: "momentum-peaking",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "peaking",
    headline: "잘해 온 일에서 분명한 결과를 만드는 해",
    core: "올해는 이미 경험을 쌓아온 일에 시간과 집중을 모을수록, 내가 잘하는 부분을 결과로 보여주기 좋습니다.",
  },
  {
    id: "change-caution",
    matches: (kinds) => kinds.has("change") && kinds.has("caution"),
    headline: "서두르지 않고 다음 방향을 확인하는 해",
    core: "변화를 주고 싶은 마음이 커져도 바로 결론을 내리기보다는, 실제 조건과 감당할 몫을 먼저 확인해야 하는 시기예요.",
  },
  {
    id: "stability",
    matches: (kinds) => kinds.has("stability"),
    headline: "지금 가진 것을 내 것으로 다지는 해",
    core: "새 일을 계속 더하기보다, 이미 시작한 일과 생활 기반을 꾸준히 이어갈 때 안정감을 만들 수 있습니다.",
  },
  {
    id: "momentum",
    matches: (kinds) => kinds.has("momentum"),
    headline: "생각해 온 일을 직접 시험해 보는 해",
    core: "머릿속에서 오래 고민하기보다 작은 시도를 시작해보면, 무엇이 내게 맞는지 더 빨리 확인할 수 있는 해예요.",
  },
  {
    id: "change",
    matches: (kinds) => kinds.has("change"),
    headline: "익숙한 방식에서 한 걸음 벗어나 보는 해",
    core: "늘 해오던 방식에 작은 변화를 주면서, 지금의 나에게 더 잘 맞는 선택을 찾아볼 수 있는 시기예요.",
  },
  {
    id: "caution",
    matches: (kinds) => kinds.has("caution"),
    headline: "할 일을 줄이고 중요한 것에 집중하는 해",
    core: "신경 쓸 일이 늘어날수록 모두 붙잡기보다, 지금 꼭 해야 하는 일부터 골라야 부담을 덜 수 있습니다.",
  },
];

const PHASE_COPY: Partial<Record<YearlyActivityPhase, string>> = {
  emerging: "처음부터 큰 결정을 내리기보다 작은 경험을 몇 번 쌓아보면, 다음 선택에 필요한 단서를 얻을 수 있습니다.",
  expanding: "한 가지 방법에만 머물지 말고 관심 있던 일을 부담이 적은 방식으로 먼저 시험해보는 편이 잘 맞아요.",
  peaking: "다만 여러 일을 동시에 벌이면 집중이 흩어질 수 있으니, 가장 중요한 한두 가지에 시간을 먼저 배분하는 편이 좋습니다.",
  stabilizing: "눈에 띄는 변화보다 매일 반복할 수 있는 습관을 만드는 일이 올해의 성과를 오래 남겨줄 거예요.",
  contracting: "새 일을 더하기 전에 계속 가져갈 일과 그만두어도 될 일을 나누면 한결 여유가 생깁니다.",
  resetting: "그래서 익숙한 일을 계속 맡으면서도 다른 제안이나 활동을 두고, 지금 변화를 줘도 될지 고민하는 장면이 생기기 쉽습니다.",
};

const PHASE_DETAIL_COPY: Partial<Record<YearlyActivityPhase, string>> = {
  emerging: "아직 확신이 서지 않는 일은 준비가 부족해서라기보다 직접 겪어본 정보가 적어서 망설여질 수 있어요. 익숙한 일상을 해치지 않는 범위에서 짧게 참여하거나 결과물을 만들어보면 생각만 할 때보다 장단점이 분명해집니다. 올해는 빠른 결론보다 경험에서 얻은 근거를 쌓아가는 과정이 중요해요.",
  expanding: "사람을 만나거나 활동 반경이 넓어지면서 예전에는 고려하지 않던 제안도 가까이 들어올 수 있습니다. 다만 새로움 자체에 끌려 일을 한꺼번에 늘리면 무엇이 잘 맞았는지 판단하기 어려워져요. 서로 다른 경험을 해보되 시간과 책임을 감당할 수 있는 범위는 분명히 두는 것이 좋습니다. 특히 시작할 때 기대했던 점과 실제로 해본 뒤 남은 만족감이 같은지를 비교하면, 단순한 호기심과 오래 가져갈 변화를 구분할 수 있고 주변의 반응보다 내가 다시 시간을 쓰고 싶은 경험이 무엇인지도 선명해집니다.",
  peaking: "이미 해온 일에서 실력을 보여주거나 책임 있는 자리를 맡는 장면이 늘어날 수 있습니다. 눈에 띄는 기회가 겹치면 모두 잘하고 싶은 마음 때문에 오히려 결과가 흐려질 수 있어요. 올해는 가장 오래 남길 성과가 무엇인지 정하고 거기에 집중할수록 강점이 선명하게 드러납니다.",
  stabilizing: "새로운 자극보다 이미 자리 잡은 일과 관계에서 신뢰를 쌓는 장면이 많아질 수 있습니다. 겉으로 큰 변화가 없어 보여도 반복해온 방식이 생활의 안정과 성과를 함께 만드는 때예요. 오래 유지할 수 있는 약속과 습관을 남기는 것이 올해를 알차게 쓰는 방법입니다.",
  contracting: "예전에는 당연히 맡았던 일이나 관계가 지금도 필요한지 돌아보게 되는 장면이 생길 수 있습니다. 책임을 줄이는 일이 뒤처지는 것처럼 느껴질 수 있지만, 올해는 덜 중요한 몫을 내려놓아야 핵심에 집중할 여지가 생겨요. 무엇을 더 할지보다 무엇을 계속 가져갈지를 분명히 하는 것이 중요합니다.",
  resetting: "겉으로는 이전과 비슷한 생활을 이어가더라도 마음속에서는 역할과 생활 방식을 바꾸고 싶다는 생각이 자주 올라올 수 있습니다. 기존 기반을 한꺼번에 내려놓으면 새 환경의 장단점을 확인하기 전에 부담부터 커질 수 있어요. 일정 기간 두 방식을 함께 경험해보면, 지금 생활을 유지하면서도 새 환경이 실제로 맞는지 확인할 수 있습니다. 지금 자리를 벗어나고 싶어서 바꾸려는 것인지, 더 오래 이어가고 싶은 일이 생긴 것인지 구분하면 무엇부터 얼마나 바꿀지도 정하기 수월해집니다.",
};

const TWELVE_SAL_THEME_COPY: Readonly<Record<string, string>> = {
  movement: "생활 반경이나 만나는 사람이 달라질 때는 익숙함만 고집하지 말고, 새 환경에서 실제로 편한 점과 불편한 점을 확인해보세요.",
  mobility: "외부 일정이 늘어난다면 목적 없는 약속을 줄이고, 꼭 필요한 이동부터 달력에 넣는 편이 좋습니다.",
  external_change: "예상하지 못한 제안에도 약간의 여지를 남겨두면, 계획을 전부 바꾸지 않고도 새로운 선택을 시험해볼 수 있습니다.",
  visibility: "한쪽을 곧바로 포기하기보다 현재 생활을 유지한 채 새 환경을 직접 경험해보는 쪽이 부담을 줄이는 데 더 현실적이에요.",
  exposure: "주변 평가에 맞추기보다 어떤 모습과 결과를 보여주고 싶은지 먼저 정해두면 부담을 덜 수 있습니다.",
  settlement: "새로운 자리를 계속 찾기보다 지금 편안하게 이어지는 관계와 환경을 돌보는 쪽이 더 잘 맞아요.",
  introspection: "혼자 생각할 시간은 필요하지만, 결론을 미루기 위한 고민이 되지 않도록 작은 행동으로 확인해보는 편이 좋습니다.",
};

const DEFAULT_SELECTION: CopySelection = {
  headline: "서두르지 않고 내 속도를 확인하는 해",
  core: "올해는 한 가지 답을 빨리 고르기보다, 실제 상황을 겪어보며 내게 맞는 속도를 확인하는 편이 좋습니다.",
};

export function selectOverallCombination(
  annualSignals: readonly YearlyInterpretationSignal[],
): CopySelection {
  const kinds = new Set(annualSignals.map(({ kind }) => kind));
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return OVERALL_COMBINATION_RULES.find((rule) => rule.matches(kinds, phase))
    ?? DEFAULT_SELECTION;
}

export function selectPhaseCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = annualSignals.find(({ activityPhase }) => activityPhase);
  return signal?.activityPhase
    ? {
        text: PHASE_COPY[signal.activityPhase],
        detail: PHASE_DETAIL_COPY[signal.activityPhase],
        signalId: signal.id,
      }
    : null;
}

export function selectTwelveSalCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = annualSignals.find(({ id, theme }) =>
    id.startsWith("annual-twelve-sal-") && theme in TWELVE_SAL_THEME_COPY
  );
  return signal
    ? { text: TWELVE_SAL_THEME_COPY[signal.theme], signalId: signal.id }
    : null;
}

export function selectOverallTip(
  annualSignals: readonly YearlyInterpretationSignal[],
  daeunSignals: readonly YearlyInterpretationSignal[],
) {
  const caution = [...annualSignals, ...daeunSignals].find(({ kind }) => kind === "caution");
  if (caution) {
    return {
      text: "새 제안이 눈에 들어오면 기존 생활을 바로 바꾸기보다, 실제로 병행할 수 있는 기간과 조건부터 확인해두는 편이 좋습니다.",
      signalId: caution.id,
    };
  }
  const momentum = annualSignals.find(({ kind }) => kind === "momentum");
  if (momentum) {
    return {
      text: "관심 있는 일을 작게 시험해보고, 해본 뒤의 만족도와 부담을 함께 기록해보세요.",
      signalId: momentum.id,
    };
  }
  return {
    text: "한 번에 결론을 내리지 말고, 지금 가장 궁금한 선택 하나부터 직접 확인해보세요.",
    signalId: annualSignals[0]?.id,
  };
}
