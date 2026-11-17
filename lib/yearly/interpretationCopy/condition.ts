import type {
  YearlyActivityPhase,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

interface ConditionCopySelection {
  headline: string;
  core: string;
}

interface ConditionCombinationRule extends ConditionCopySelection {
  id: string;
  matches: (kinds: ReadonlySet<YearlyOverallSignalKind>, phase?: YearlyActivityPhase) => boolean;
}

export const CONDITION_COMBINATION_RULES: readonly ConditionCombinationRule[] = [
  {
    id: "stability-resetting",
    matches: (kinds, phase) => kinds.has("stability") && phase === "resetting",
    headline: "몰입하는 시기와 쉬어갈 때를 구분하는 해",
    core: "올해는 평소 생활 리듬을 지키고 싶지만, 밖에서 들어오는 요구에도 빠르게 대응해야 하는 상황이 함께 생길 수 있어요.",
  },
  {
    id: "momentum-expanding",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "expanding",
    headline: "새로운 활동을 생활 안에 무리 없이 더하는 해",
    core: "외부 일정이나 관심사가 늘어나기 쉬우므로, 새 활동을 시작할 때 기존 생활에서 줄일 시간도 함께 정해야 해요.",
  },
  {
    id: "momentum-peaking",
    matches: (kinds, phase) => kinds.has("momentum") && phase === "peaking",
    headline: "가장 중요한 일에 시간과 집중을 모으는 해",
    core: "활동량이 많아질수록 모든 일에 같은 힘을 쓰기보다, 꼭 끝내야 할 일에 집중 시간을 먼저 배정하는 편이 좋습니다.",
  },
  {
    id: "stability-stabilizing",
    matches: (kinds, phase) => kinds.has("stability") && phase === "stabilizing",
    headline: "무리 없이 반복할 생활 습관을 만드는 해",
    core: "눈에 띄는 변화보다 일정한 수면과 식사, 집중 시간을 반복하는 일이 생활을 안정시키는 데 도움이 됩니다.",
  },
  {
    id: "change-contracting",
    matches: (kinds, phase) => kinds.has("change") && phase === "contracting",
    headline: "일정을 줄이고 꼭 필요한 일에 집중하는 해",
    core: "새로 들어오는 요구를 모두 받아들이기보다, 지금 해야 할 일과 미뤄도 될 약속을 나누어야 여유를 지킬 수 있어요.",
  },
  {
    id: "stability-change",
    matches: (kinds) => kinds.has("stability") && kinds.has("change"),
    headline: "평소 생활을 지키면서 새 일정에 적응하는 해",
    core: "기존 생활 습관을 전부 바꾸지 말고, 새 일정이 들어오는 날에만 시간 배치를 조절하는 방식이 잘 맞습니다.",
  },
  {
    id: "momentum",
    matches: (kinds) => kinds.has("momentum"),
    headline: "할 일을 미루지 않고 하나씩 끝내는 해",
    core: "해야 할 일을 작은 단위로 나누어 바로 시작하면, 일정이 밀리는 부담을 줄이고 꾸준함을 유지할 수 있어요.",
  },
  {
    id: "stability",
    matches: (kinds) => kinds.has("stability"),
    headline: "매일 지킬 수 있는 생활 습관을 만드는 해",
    core: "무리한 계획보다 매일 같은 시간에 반복할 수 있는 작은 습관을 만드는 편이 생활을 안정시키기 좋습니다.",
  },
  {
    id: "change",
    matches: (kinds) => kinds.has("change"),
    headline: "달라진 일정에 맞는 생활 방식을 찾는 해",
    core: "일정이 달라질 때마다 무리해서 예전 속도를 유지하기보다, 집중할 시간과 쉴 시간을 새로 배치해보세요.",
  },
  {
    id: "caution",
    matches: (kinds) => kinds.has("caution"),
    headline: "바쁜 날과 쉬는 날을 분명히 나누는 해",
    core: "신경 쓸 일이 겹칠수록 빈 시간까지 약속으로 채우지 말고, 회복을 위한 시간을 일정에 먼저 넣는 편이 좋습니다.",
  },
];

const CONDITION_PHASE_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "처음부터 생활 전체를 바꾸기보다, 기상 시간이나 짧은 산책처럼 하나만 정해 시작해보세요.",
  expanding: "새 활동을 더한다면 기존 일정 중 하나는 줄여야 피로가 다음 날까지 이어지는 것을 막을 수 있습니다.",
  peaking: "여러 일을 동시에 늘리기보다 중요한 한두 가지에 집중하고, 집중한 뒤에는 쉬는 시간을 확보하는 편이 좋아요.",
  stabilizing: "같은 시간에 자고 일어나거나 식사하는 것처럼 매일 반복할 수 있는 습관이 생활을 받쳐줄 거예요.",
  contracting: "자주 미루게 되는 약속이나 효과가 낮은 활동을 덜어내면, 꼭 필요한 일에 쓸 여유가 생깁니다.",
  resetting: "평소 일정은 그대로인데 맡은 일이나 약속이 늘면서, 집중해야 할 시간이 한쪽에 몰리고 쉬는 간격은 짧아지는 식으로 체감하기 쉽습니다.",
};

const CONDITION_PHASE_DETAIL_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "생활을 바꾸고 싶은 마음은 생기지만 아직 몸에 맞는 속도를 알기 어려워 계획만 자주 바뀔 수 있습니다. 짧게 실천했을 때 집중이 잘되는 시간과 쉽게 지치는 시간을 먼저 관찰하는 것이 유용해요. 작은 변화가 편안하게 반복되는지 확인해야 무리 없이 생활에 자리 잡습니다.",
  expanding: "외부 활동과 만남이 늘면서 평소 쉬던 시간까지 일정으로 채워지는 날이 생길 수 있습니다. 즐거운 일이라도 이동과 준비가 겹치면 집중력이 떨어지는 시점이 예상보다 빨리 찾아와요. 새 활동을 들인 만큼 회복 시간을 함께 확보해야 넓어진 생활 반경을 오래 유지할 수 있습니다. 특히 약속이 연달아 있는 주에는 하루의 빈 시간보다 이동과 준비에 쓰이는 숨은 시간을 함께 계산해야 실제로 감당할 수 있는 활동량을 알 수 있고, 다음 날 집중력까지 지키는 배치가 무엇인지 판단하기도 쉬워집니다.",
  peaking: "해야 할 일이 한꺼번에 몰리면 짧은 시간에 깊이 몰입하는 날과 기운이 떨어지는 날의 차이가 커질 수 있습니다. 바쁠수록 쉬는 시간을 미루기 쉽지만, 집중이 흐려진 상태로 버티면 중요한 일의 완성도까지 낮아져요. 강하게 몰입할 구간과 완전히 손을 놓을 구간을 나누는 방식이 올해의 속도에 맞습니다.",
  stabilizing: "생활이 크게 흔들리기보다 비슷한 일정이 반복되면서 작은 습관의 효과를 체감하기 쉬운 때입니다. 무리한 계획은 며칠 만에 부담이 되지만 식사나 수면 시간을 일정하게 두는 방식은 집중을 받쳐줄 수 있어요. 몸에 맞는 반복을 남기는 것이 활동량을 늘리는 것보다 중요합니다.",
  contracting: "예전과 같은 양의 일정을 소화해도 회복에 더 긴 시간이 필요하다고 느끼는 날이 생길 수 있습니다. 이를 의지 부족으로 여기고 활동을 밀어붙이면 정작 꼭 필요한 순간에 집중하기 어려워져요. 효과가 적은 약속과 일을 덜어내 남은 에너지를 중요한 곳에 쓰는 방식이 알맞습니다.",
  resetting: "겉으로는 일정이 비슷해 보여도 업무와 약속이 촘촘해져, 바짝 집중하는 시간과 쉬는 시간의 차이가 커질 수 있습니다. 몰입이 잘되는 날에는 여러 일을 끝낼 수 있지만 그 속도를 매일 유지하려 하면 쉬는 날에도 피로가 남기 쉬워요. 많이 해낸 날 뒤에는 일부러 속도를 낮춰야 다음 일정도 무리 없이 이어갈 수 있습니다. 집중이 흐려지는 시간대와 회복이 잘되는 방식을 알아두면 중요한 일을 놓치지 않으면서도 생활 전체가 무너지는 것을 막을 수 있어요.",
};

const FALLBACK_SELECTION: ConditionCopySelection = {
  headline: "무리하지 않고 생활 속도를 확인하는 해",
  core: "한꺼번에 생활 전체를 바꾸기보다, 일주일 일정을 돌아보며 오래 유지할 수 있는 속도를 찾아보세요.",
};

export function selectConditionCombination(
  annualSignals: readonly YearlyInterpretationSignal[],
): ConditionCopySelection {
  const kinds = new Set(annualSignals.map(({ kind }) => kind));
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return CONDITION_COMBINATION_RULES.find((rule) => rule.matches(kinds, phase))
    ?? FALLBACK_SELECTION;
}

export function selectConditionPhaseCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = annualSignals.find(({ activityPhase }) => activityPhase);
  return signal?.activityPhase
    ? {
        text: CONDITION_PHASE_COPY[signal.activityPhase],
        detail: CONDITION_PHASE_DETAIL_COPY[signal.activityPhase],
        signalId: signal.id,
      }
    : null;
}

export function selectConditionCautionCopy(
  annualSignals: readonly YearlyInterpretationSignal[],
  daeunSignals: readonly YearlyInterpretationSignal[],
) {
  const signal = [...annualSignals, ...daeunSignals].find(({ kind }) => kind === "caution");
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return signal
    ? {
        text: phase === "expanding"
          ? "새 활동을 계속 늘리기보다 참여한 뒤 생활에 활력이 남는 일정과 회복에 더 긴 시간이 필요한 일정을 구분해야, 넓어진 생활 반경을 무리 없이 유지할 수 있어요."
          : "매일 같은 속도를 유지하려 하기보다, 몰입이 필요한 날 뒤에는 회복할 시간을 확보하는 방식이 오래 버티기 수월해요.",
        signalId: signal.id,
      }
    : null;
}

export function selectConditionTip(
  annualSignals: readonly YearlyInterpretationSignal[],
  hasCaution: boolean,
) {
  if (hasCaution) {
    const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
    return phase === "expanding"
      ? "새 활동을 시작한 주에는 다른 약속을 하나 줄여보고, 참여한 다음 날에도 평소 집중력을 유지할 수 있는지 확인하세요."
      : "일이 겹치는 주에는 새 약속을 더 넣기보다, 집중해야 할 날 다음에 아무 일정 없는 시간을 남겨두면 좋습니다.";
  }
  if (annualSignals.some(({ activityPhase }) => activityPhase === "contracting")) {
    return "자주 미루는 일정 하나를 줄이고, 꼭 끝낼 일에 쓸 시간을 먼저 확보해보세요.";
  }
  if (annualSignals.some(({ kind }) => kind === "momentum")) {
    return "하루에 가장 중요한 일 두 가지만 먼저 적고, 끝낸 뒤 다음 일을 시작해보세요.";
  }
  if (annualSignals.some(({ kind }) => kind === "stability")) {
    return "매일 같은 시간에 반복할 수 있는 수면이나 식사 습관 하나를 정해보세요.";
  }
  return "이번 주 일정에서 꼭 해야 할 일과 다음 주로 넘겨도 될 일을 나누어보세요.";
}
