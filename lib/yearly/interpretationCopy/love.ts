import type { LoveSituationKey } from "../../yearlyReadingContext";
import type {
  YearlyActivityPhase,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

interface LoveContextCopyMetadata {
  perspective: readonly string[];
  headlines: {
    default: string;
    balanced: string;
    momentum: string;
    caution: string;
    resetting: string;
  };
  baseBody: string;
  balancedBody: string;
  detailBody: string;
  expandingDetailBody?: string;
  tip: string;
  expandingTip?: string;
}

export const LOVE_CONTEXT_COPY_REGISTRY = {
  new_connection: {
    perspective: ["openness", "getting_to_know", "pace"],
    headlines: {
      default: "새로운 사람을 만나며 편한 속도를 알아가는 해",
      balanced: "새로운 만남 속에서 잘 맞는 사람을 알아보는 해",
      momentum: "새로운 만남에 한 걸음 다가가 보는 해",
      caution: "첫인상보다 대화를 더 지켜보는 해",
      resetting: "새로운 만남을 서두르지 않고 알아가는 해",
    },
    baseBody: "새로운 사람을 만날 기회가 생기면 관계를 빨리 정의하기보다, 대화를 나눌 때 편안한지부터 확인해보세요.",
    balancedBody: "새로운 만남에는 열려 있되 첫인상만으로 결론 내리지 말고, 몇 번의 대화에서 말과 행동이 잘 맞는지 지켜보는 편이 좋습니다.",
    detailBody: "처음에는 대화가 잘 통해도 연락의 속도나 약속을 대하는 태도에서 서로 다른 점이 드러날 수 있습니다. 호감이 생겼다는 이유로 관계의 의미를 빨리 정하기보다 함께 있을 때 편안함이 꾸준한지 확인할 필요가 있어요. 만남 뒤에 내가 어떤 감정을 느끼는지 살피면 외로움과 실제 호감을 구분하는 데 도움이 됩니다.",
    tip: "한 번의 인상보다 두세 번의 대화 뒤에도 편안한 사람인지 확인해보세요.",
  },
  prefer_single: {
    perspective: ["own_pace", "boundaries", "comfortable_connection"],
    headlines: {
      default: "혼자 보내는 시간과 편한 관계를 지키는 해",
      balanced: "내 시간을 지키며 부담 없는 관계를 이어가는 해",
      momentum: "내 방식대로 사람들과 교류해 보는 해",
      caution: "내 시간을 빼앗는 관계와 거리를 두는 해",
      resetting: "혼자만의 시간과 사람 만나는 시간을 다시 맞추는 해",
    },
    baseBody: "연애를 해야 한다는 압박보다 혼자 보내는 시간과 사람을 만나는 시간 중 무엇이 편한지 스스로 선택해도 되는 해예요.",
    balancedBody: "혼자만의 시간을 충분히 지키면서도, 부담 없이 연락하고 만날 수 있는 사람들과는 편한 방식으로 교류해보세요.",
    detailBody: "사람들과 가까워지는 일이 즐거우면서도 내 시간이 줄어드는 순간에는 부담을 크게 느낄 수 있습니다. 모든 연락에 같은 속도로 답하기보다 관계마다 편안한 거리와 만남의 빈도가 다르다는 점을 인정해도 괜찮아요. 혼자 있을 때의 안정감을 해치지 않는 관계를 남기는 것이 올해의 중요한 판단 근거가 됩니다.",
    tip: "약속 뒤에 지치지 않는지 살펴보고, 내게 편한 연락 횟수와 만남 간격을 존중해보세요.",
  },
  interested_person: {
    perspective: ["distance", "expression", "observed_response"],
    headlines: {
      default: "상대의 반응을 보며 천천히 다가가는 해",
      balanced: "내 마음을 표현하며 서로의 거리를 확인하는 해",
      momentum: "가벼운 표현으로 한 걸음 다가가 보는 해",
      caution: "답을 재촉하지 않고 상대의 반응을 지켜보는 해",
      resetting: "관계를 서두르지 않고 연락과 반응을 살펴보는 해",
    },
    baseBody: "마음 가는 사람에게 답을 재촉하기보다 가벼운 연락과 대화를 건네며, 실제로 주고받는 반응을 확인해보세요.",
    balancedBody: "내 마음은 숨기지 않되 관계를 먼저 규정하려 하지 말고, 연락이 오가는 속도와 대화할 때의 편안함을 지켜보는 편이 좋습니다.",
    detailBody: "상대의 한 번의 반응에 의미를 크게 두면 연락이 잦은 날과 뜸한 날마다 마음이 흔들릴 수 있습니다. 내가 먼저 표현했을 때 상대도 대화를 이어가려는지, 약속을 구체화하는지를 시간 안에서 살펴야 해요. 호감을 전하되 답을 대신 해석하지 않는 태도가 관계의 실제 거리를 알아보는 데 도움이 됩니다.",
    tip: "관계의 이름을 먼저 묻기보다, 대화가 서로 이어지는지 한 번 더 살펴보세요.",
  },
  dating: {
    perspective: ["shared_rhythm", "expression", "trust"],
    headlines: {
      default: "서로 편한 연락과 만남 방식을 알아가는 해",
      balanced: "익숙한 관계에 새로운 대화를 더하는 해",
      momentum: "함께하는 경험과 표현을 늘려보는 해",
      caution: "서로의 속도 차이를 대화로 맞추는 해",
      resetting: "연락과 만남 방식을 다시 맞춰보는 해",
    },
    baseBody: "지금 관계에서 연락과 만남의 빈도가 서로에게 편한지, 애정 표현은 충분히 전달되는지 대화해보기 좋은 때예요.",
    balancedBody: "익숙해진 관계를 편안하게 이어가면서도, 서로 다르게 느끼는 연락 빈도와 애정 표현은 말로 맞춰보세요.",
    detailBody: "관계가 익숙해질수록 상대도 당연히 알고 있을 거라 생각한 기대가 서운함으로 남을 수 있습니다. 함께 보내는 시간과 각자 필요한 시간을 어떻게 배분할지 구체적으로 이야기할 필요가 있어요. 표현 방식의 차이를 애정의 크기로 단정하지 않으면 신뢰를 지키면서 관계에 새로움을 더할 수 있습니다.",
    tip: "서운함이 쌓이기 전에 원하는 연락 방식이나 함께하고 싶은 일을 구체적으로 말해보세요.",
  },
  engaged: {
    perspective: ["promise", "roles", "expectations", "planning"],
    headlines: {
      default: "결혼 준비의 일정과 역할을 구체화하는 해",
      balanced: "함께할 약속을 현실적인 계획으로 옮기는 해",
      momentum: "둘이 정한 계획을 하나씩 실행해 보는 해",
      caution: "준비 과정의 부담을 솔직하게 나누는 해",
      resetting: "결혼 준비의 일정과 역할을 다시 맞추는 해",
    },
    baseBody: "함께 준비할 일이 많아질수록 일정, 비용, 가족과 관련된 역할을 구체적으로 나누는 대화가 필요해요.",
    balancedBody: "결혼에 대한 마음뿐 아니라 일정, 비용, 집안일처럼 실제 생활에서 맡을 몫을 구체적으로 맞춰보세요.",
    detailBody: "준비할 항목이 많아지면 둘의 약속보다 가족 의견이나 비용 문제가 대화의 중심이 되기 쉽습니다. 결정해야 할 일마다 누가 담당하고 어느 범위까지 함께 의논할지를 정해야 부담이 한쪽으로 쏠리지 않아요. 준비 속도가 다르더라도 중요하게 여기는 이유를 먼저 들으면 현실적인 합의점을 찾기 쉬워집니다.",
    tip: "이번 달에 결정할 일과 각자 맡을 준비를 한 장에 적어 함께 확인해보세요.",
  },
  married: {
    perspective: ["daily_life", "roles", "conversation", "trust"],
    headlines: {
      default: "함께 사는 일상을 더 편안하게 만드는 해",
      balanced: "익숙한 일상에 필요한 대화를 더하는 해",
      momentum: "둘이 함께하는 시간과 표현을 늘려보는 해",
      caution: "집안의 역할과 부담을 다시 나누는 해",
      resetting: "함께 사는 방식을 다시 맞춰보는 해",
    },
    baseBody: "배우자와 함께 보내는 시간, 집안일, 각자의 휴식이 지금도 공평하게 느껴지는지 대화해보기 좋은 때예요.",
    balancedBody: "올해는 함께 지켜온 생활의 안정감과, 관계 안에서 새로운 경험이나 대화를 늘리고 싶은 마음이 함께 커질 수 있습니다. 함께 보내는 시간, 돈을 쓰는 방식, 가족 일정, 각자의 역할처럼 말없이 맞춰오던 부분에서 서로 원하는 모습이 달라졌음을 느낄 수 있어요.",
    detailBody: "평소에는 문제가 없던 방식도 중요한 결정이 생기면 누가 더 많이 책임지고 있는지에 대한 생각 차이로 이어질 수 있습니다. 배우자가 알아서 이해해주기를 기다리기보다 지키고 싶은 생활과 바꾸고 싶은 부분을 각각 말할 필요가 있어요. 서로의 몫을 구체적으로 확인하면 익숙함을 해치지 않으면서도 둘에게 맞는 생활 방식을 새로 만들 수 있습니다. 돈을 쓰는 방식이나 가족 일정처럼 한 번 정하면 오래 영향을 주는 문제는 결론만 합의하지 말고, 각자가 중요하게 여기는 이유까지 나눌 때 같은 갈등이 반복되는 것을 줄일 수 있어요.",
    expandingDetailBody: "평소와 다른 장소에서 시간을 보내거나 둘이 함께 배울 일을 찾으면 익숙한 관계에서도 새로운 모습을 발견할 수 있습니다. 중요한 것은 특별한 계획의 크기보다 두 사람이 모두 즐길 수 있고 일상으로 돌아온 뒤에도 좋은 대화가 남는지예요. 한쪽이 모든 일정을 준비하기보다 각자 해보고 싶은 일을 하나씩 제안하면 함께하는 경험이 의무처럼 느껴지는 것을 줄일 수 있습니다. 바깥 활동이 늘어나는 만큼 개인 시간도 필요해질 수 있으므로, 같이 보내는 시간과 각자 쉬는 시간을 경쟁시키지 않는 태도가 관계를 편안하게 만듭니다.",
    tip: "중요한 결정을 앞두고 있다면 결론부터 내리기보다, 함께 지킬 생활과 새로 바꾸고 싶은 부분을 각각 꺼내 놓고 비교하세요.",
    expandingTip: "둘이 해보고 싶었던 일 하나를 정하되, 준비와 비용을 한쪽이 모두 맡지 않도록 각자의 몫을 먼저 나누어보세요.",
  },
  fresh_start: {
    perspective: ["new_standards", "emotional_reorientation", "own_pace"],
    headlines: {
      default: "앞으로 원하는 관계 방식을 알아가는 해",
      balanced: "지나온 경험을 바탕으로 새 만남을 준비하는 해",
      momentum: "새로운 사람과 내 방식대로 만나보는 해",
      caution: "감정이 앞설 때 관계의 속도를 늦추는 해",
      resetting: "다음 관계에서 원하는 모습을 다시 생각해 보는 해",
    },
    baseBody: "다음 만남을 서두르기보다, 연락 방식과 거리처럼 앞으로의 관계에서 중요하게 생각하는 부분을 알아가도 좋아요.",
    balancedBody: "지난 경험에서 계속 가져가고 싶은 점과 다음에는 다르게 해보고 싶은 점을 구분하면 새 만남에서도 내 뜻을 표현하기 쉬워집니다.",
    detailBody: "새로운 사람이 나타났을 때 이전 관계와 비교하거나 비슷한 장면을 미리 걱정하는 마음이 생길 수 있습니다. 과거에 아쉬웠던 일을 상대에게 그대로 적용하기보다 지금 실제로 주고받는 말과 행동을 살펴야 해요. 내가 편안함을 느끼는 거리와 표현 방식을 알수록 새 관계를 서두르지 않고 알아갈 수 있습니다.",
    tip: "다음 관계에서 원하는 모습과 반복하고 싶지 않은 행동을 각각 세 가지씩 적어보세요.",
  },
} as const satisfies Record<LoveSituationKey, LoveContextCopyMetadata>;

const LOVE_PHASE_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "관계를 바로 정의하려 하지 말고, 부담 없는 연락이나 짧은 대화부터 시작하는 편이 좋습니다.",
  expanding: "평소와 다른 데이트나 대화 주제를 시도하면 서로를 새롭게 이해하는 계기가 될 수 있어요.",
  peaking: "여러 사람의 반응을 모두 신경 쓰기보다, 지금 소중한 관계에 시간과 표현을 집중하는 편이 낫습니다.",
  stabilizing: "약속을 지키고 꾸준히 안부를 묻는 작은 행동이 말보다 신뢰를 잘 보여줄 거예요.",
  contracting: "관계 때문에 지친다면 연락을 억지로 이어가기보다, 혼자 쉬고 생각할 시간을 충분히 가져도 좋습니다.",
  resetting: "이럴 때는 누가 맞는지 가리기보다 각자 중요하게 여기는 부분과 맡을 몫을 구체적으로 말하는 쪽이 대화를 풀어가기 좋습니다.",
};

export function selectLoveHeadline(
  metadata: LoveContextCopyMetadata,
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const kinds = new Set<YearlyOverallSignalKind>(annualSignals.map(({ kind }) => kind));
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  if (phase === "resetting") return metadata.headlines.resetting;
  if (kinds.has("stability") && kinds.has("change")) return metadata.headlines.balanced;
  if (kinds.has("momentum")) return metadata.headlines.momentum;
  if (kinds.has("caution")) return metadata.headlines.caution;
  return metadata.headlines.default;
}

export function selectLoveBody(
  metadata: LoveContextCopyMetadata,
  annualSignals: readonly YearlyInterpretationSignal[],
  daeunSignals: readonly YearlyInterpretationSignal[],
) {
  const kinds = new Set(annualSignals.map(({ kind }) => kind));
  const phaseSignal = annualSignals.find(({ activityPhase }) => activityPhase);
  const cautionSignal = [...annualSignals, ...daeunSignals].find(({ kind }) => kind === "caution");
  const first = kinds.has("stability") && kinds.has("change")
    ? metadata.balancedBody
    : metadata.baseBody;
  const phase = phaseSignal?.activityPhase
    ? LOVE_PHASE_COPY[phaseSignal.activityPhase]
    : null;
  const caution = cautionSignal && phaseSignal?.activityPhase !== "resetting"
    ? "감정이나 책임을 혼자 떠안지 말고, 상대가 맡을 부분과 내가 원하는 부분을 구체적인 말로 나누는 편이 좋습니다."
    : null;

  const firstParagraph = [first, phase].filter((item): item is string => Boolean(item)).join(" ");
  const detailBody = phaseSignal?.activityPhase === "expanding"
    ? metadata.expandingDetailBody ?? metadata.detailBody
    : metadata.detailBody;
  const secondParagraph = [detailBody, caution]
    .filter((item): item is string => Boolean(item))
    .join(" ");

  return {
    text: [firstParagraph, secondParagraph].filter(Boolean).join("\n\n"),
    phaseSignalId: phase ? phaseSignal?.id : undefined,
    cautionSignalId: cautionSignal?.id,
  };
}

export function selectLoveTip(
  metadata: LoveContextCopyMetadata,
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return phase === "expanding" ? metadata.expandingTip ?? metadata.tip : metadata.tip;
}
