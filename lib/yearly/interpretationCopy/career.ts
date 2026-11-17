import type { CareerSituationKey } from "../../yearlyReadingContext";
import type {
  YearlyActivityPhase,
  YearlyInterpretationSignal,
  YearlyOverallSignalKind,
} from "../types";

interface CareerContextCopyMetadata {
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
  resettingGuidance: string;
  detailBody: string;
  expandingDetailBody?: string;
  tip: string;
  expandingTip?: string;
}

export const CAREER_CONTEXT_COPY_REGISTRY = {
  student: {
    perspective: ["study", "experience", "path_exploration"],
    headlines: {
      default: "배운 것을 실제 경험에 연결해 보는 해",
      balanced: "공부와 진로 경험을 함께 챙기는 해",
      momentum: "관심 분야를 직접 경험해 보는 해",
      caution: "공부의 우선순위를 다시 세우는 해",
      resetting: "배운 것을 써보며 진로 선택지를 좁혀가는 해",
    },
    baseBody: "수업에서 배운 내용을 과제 밖에서도 써보면, 좋아하는 분야와 실제로 잘 맞는 일을 구분하기 쉬운 시기예요.",
    balancedBody: "올해는 익숙한 공부 방식을 지키려는 마음과 전공 밖의 경험을 확인하고 싶은 마음이 함께 커질 수 있어요. 시험 준비를 이어가면서도 공모전, 프로젝트, 진로 활동 중 무엇을 더 챙길지 고민하는 장면이 생기기 쉽습니다.",
    resettingGuidance: "공부 계획을 전부 바꾸기보다 현재 성과를 지키면서 관심 분야를 작은 결과물로 시험하는 방식이 잘 맞아요.",
    detailBody: "수업 성적과 시험 준비만으로 진로를 판단하면 실제로 그 일을 할 때의 흥미와 적성을 놓치기 쉽습니다. 관심 분야가 있다면 짧은 프로젝트나 현장 경험을 통해 배운 지식을 어떻게 쓰는지 확인할 필요가 있어요. 경험 뒤에 더 공부하고 싶은 부분이 남는지를 살피면 전공과 진로를 연결하는 방향이 구체적으로 보입니다.",
    tip: "새 활동을 시작할 때는 시험과 과제 일정을 유지할 수 있는 분량인지부터 따져보세요.",
  },
  job_seeking: {
    perspective: ["preparation", "application", "interview", "opportunity"],
    headlines: {
      default: "내 강점에 맞는 채용 기회를 찾는 해",
      balanced: "지원 전략과 원하는 역할을 함께 점검하는 해",
      momentum: "지원 범위를 넓혀 면접 기회를 만드는 해",
      caution: "지원 수보다 맞는 공고를 고르는 해",
      resetting: "지원 전략과 원하는 역할을 다시 맞추는 해",
    },
    baseBody: "지원서를 많이 내는 것보다 해온 경험을 직무 언어로 바꾸고, 어떤 역할에 강점이 맞는지 확인하는 일이 중요해요.",
    balancedBody: "올해는 준비해 온 방향을 유지하려는 마음과 지원 범위를 넓혀보고 싶은 마음이 동시에 생길 수 있습니다. 익숙한 직무에 지원을 이어가면서도 다른 역할이나 조건의 공고를 두고 고민하는 일이 잦아질 수 있어요.",
    resettingGuidance: "지원 수를 무작정 늘리기보다 기존 강점을 살릴 수 있는지, 면접에서 설명할 경험이 있는지를 비교하며 범위를 넓히는 쪽이 유리합니다.",
    detailBody: "공고의 이름은 비슷해도 실제 업무와 평가 방식은 회사마다 달라 준비가 분산될 수 있습니다. 면접 제안이 들어오면 합격 가능성만 볼 것이 아니라 내가 설명할 수 있는 경험과 입사 뒤 맡게 될 역할을 함께 따져야 해요. 지원 결과에서 반복해 나오는 질문을 준비 방향에 반영하면 막연히 범위를 넓히는 것보다 효율적입니다.",
    tip: "새 공고가 눈에 들어오면 직무명보다 실제 업무와 면접에서 요구하는 경험이 내 준비 방향과 맞는지 살펴보세요.",
  },
  employed: {
    perspective: ["role", "collaboration", "result", "responsibility"],
    headlines: {
      default: "맡은 일에서 다음 역할을 찾아보는 해",
      balanced: "현재 업무와 새로운 제안을 함께 챙기는 해",
      momentum: "협업을 통해 역할의 폭을 넓혀보는 해",
      caution: "업무 부담을 조절하며 중요한 일에 집중하는 해",
      resetting: "맡은 일을 다지며 새로운 역할을 준비하는 해",
    },
    baseBody: "회사에서는 지금 맡은 업무를 안정적으로 마무리하면서, 협업이나 새로운 제안을 통해 역할의 범위를 넓혀볼 만합니다.",
    balancedBody: "올해는 맡은 업무를 안정적으로 끝내려는 책임감과, 협업이나 새로운 제안을 통해 역할을 넓히고 싶은 마음이 함께 강해질 수 있습니다. 회사에서는 기존 책임을 그대로 안고 새 프로젝트나 역할 제안을 검토해야 하는 상황이 생기기 쉬워요.",
    resettingGuidance: "현재 성과를 지키면서 새 역할의 권한·일정·기대 결과를 확인한 뒤 맡을 범위를 넓히는 쪽이 잘 맞아요.",
    detailBody: "특히 잘해온 업무 때문에 기존 책임은 줄지 않은 채 새로운 몫만 더해질 수 있다는 점을 살펴야 합니다. 협업 제안이 들어오면 내가 결정할 수 있는 범위와 다른 사람에게 요청할 수 있는 지원이 무엇인지 확인할 필요가 있어요. 역할의 이름보다 실제 권한과 평가받을 결과가 분명한 일을 골라야 새로 맡은 경험이 경력으로 남습니다. 회의에 참여하는 일, 실무를 책임지는 일, 최종 결정을 맡는 일은 겉보기와 달리 부담이 크게 다르므로 내가 맡게 될 수준과 그 역할이 현재 경력에서 증명해줄 능력을 함께 확인해야 단순히 바빠지는 일과 앞으로의 기회를 넓혀주는 일을 구분할 수 있어요.",
    expandingDetailBody: "평소 맡지 않던 업무를 맡거나 다른 팀과 함께 일하는 과정에서 지금까지 드러나지 않았던 강점을 보여줄 기회가 생길 수 있습니다. 이때 익숙하지 않다는 이유만으로 물러서기보다 짧은 프로젝트나 한정된 역할부터 참여하면 부담을 조절하기 쉬워요. 여러 사람과 일하며 내가 잘 맡는 부분과 지원이 필요한 부분을 알아가는 경험이 이후 역할을 넓히는 근거가 됩니다. 다만 외부 활동이 많아질수록 기존 업무의 마감과 품질이 흐려질 수 있으니, 새 협업을 시작할 때는 어느 업무에 시간을 먼저 쓸지 팀과 합의하고 참여 뒤 어떤 성과를 내 역할로 남길지도 미리 정해야 합니다.",
    tip: "새 제안을 받으면 매력도만 보지 말고, 지금 업무와 함께 맡았을 때 책임 범위와 협업 조건이 분명한지 확인하세요.",
    expandingTip: "새 협업에 참여할 때는 처음부터 큰 책임을 맡기보다, 기간과 결과물이 분명한 역할부터 맡아 내 강점이 어디에서 드러나는지 확인하세요.",
  },
  career_transition: {
    perspective: ["transition", "preparation", "exploration", "movement"],
    headlines: {
      default: "쌓은 경험을 다음 직무와 연결해 보는 해",
      balanced: "현재 경력과 새로운 직무를 함께 비교하는 해",
      momentum: "관심 있던 직무를 직접 탐색해 보는 해",
      caution: "이직 결정보다 필요한 준비를 먼저 챙기는 해",
      resetting: "쌓은 경험을 바탕으로 다음 직무를 준비하는 해",
    },
    baseBody: "지금까지 쌓은 경험 중 다음 직무에서도 쓸 수 있는 능력과 새로 준비해야 할 부분을 나누면 선택지가 구체적으로 보입니다.",
    balancedBody: "올해는 지금까지 쌓은 경력을 지키려는 마음과 전혀 다른 역할을 경험하고 싶은 마음이 맞설 수 있어요. 현재 일을 이어가면서도 관심 직무의 채용 조건이나 필요한 역량을 자주 비교하게 될 수 있습니다.",
    resettingGuidance: "바로 자리를 옮기기보다 기존 경력에서 가져갈 강점을 확인하고, 부족한 경험을 실제 과제나 교육으로 채운 뒤 판단하는 순서가 어울립니다.",
    detailBody: "새 직무의 장점만 보면 현재 경력에서 이미 확보한 강점과 조건을 과소평가하기 쉽습니다. 채용 공고와 현직자의 업무 사례를 통해 옮긴 뒤 반복하게 될 일까지 살펴보는 과정이 필요해요. 기대와 실제 업무의 차이를 확인한 뒤 준비 항목을 좁혀야 전환 과정에서 생기는 공백을 줄일 수 있습니다.",
    tip: "관심 직무를 볼 때는 기대감보다 현재 경력으로 연결되는 업무와 새로 증명해야 할 역량을 구분해보세요.",
  },
  freelance_self_employed: {
    perspective: ["project", "client", "collaboration", "operation"],
    headlines: {
      default: "프로젝트가 오래 이어질 조건을 만드는 해",
      balanced: "현재 수익과 새 거래의 조건을 함께 따지는 해",
      momentum: "새 거래처와 프로젝트를 시험해 보는 해",
      caution: "일정과 단가를 따져 제안을 고르는 해",
      resetting: "프로젝트의 수익 구조와 운영 방식을 다시 짜는 해",
    },
    baseBody: "새 프로젝트를 늘리는 것만큼 일정, 단가, 협업 범위를 분명히 해 꾸준히 운영할 수 있는 조건을 만드는 일이 중요해요.",
    balancedBody: "올해는 기존 일감을 안정적으로 유지하려는 마음과 새 거래처나 프로젝트를 확보하려는 마음이 동시에 커질 수 있습니다. 이미 진행 중인 일의 품질을 지키면서도 조건이 다른 제안을 검토해야 하는 장면이 생기기 쉬워요.",
    resettingGuidance: "일감 수보다 실제 투입 시간과 수익 구조를 비교하고, 기존 거래를 해치지 않는 범위에서 새 프로젝트를 받는 방식이 알맞습니다.",
    detailBody: "새 거래가 늘어도 수정 요청과 소통 시간이 커지면 체감 수익은 오히려 낮아질 수 있습니다. 계약 전에는 결과물의 범위와 일정 변경 시 비용을 분명히 해 기존 거래처의 납기까지 흔들리지 않게 해야 해요. 반복 거래로 이어질 가능성과 실제 시간당 수익을 함께 따질수록 운영 구조가 안정됩니다.",
    tip: "새 일감은 단가만 보지 말고 수정 범위, 일정, 반복 거래 가능성까지 기존 프로젝트와 나란히 비교하세요.",
  },
  homemaker: {
    perspective: ["daily_operation", "new_activity", "learning", "role_change"],
    headlines: {
      default: "생활에 맞는 새로운 활동을 찾아보는 해",
      balanced: "일상을 지키며 배움과 활동을 더하는 해",
      momentum: "관심 있던 활동을 직접 시작해 보는 해",
      caution: "생활에 부담되지 않는 활동을 고르는 해",
      resetting: "내 시간을 확보해 새로운 활동을 준비하는 해",
    },
    baseBody: "집안일과 돌봄 일정을 해치지 않는 시간대를 찾으면, 관심 있던 배움이나 활동을 생활 안에 들이기 좋습니다.",
    balancedBody: "올해는 익숙한 생활을 안정적으로 운영하려는 마음과 새로운 배움이나 외부 활동을 시작하고 싶은 마음이 함께 생길 수 있어요. 가족 일정과 돌봄을 이어가면서 내 활동에 어느 정도 시간을 쓸지 고민하게 될 수 있습니다.",
    resettingGuidance: "생활 전체를 바꾸기보다 방해받지 않는 시간대를 확보해 작은 활동부터 이어가는 방식이 현실적이에요.",
    detailBody: "가족에게 필요한 시간을 먼저 채우다 보면 내 활동은 늘 남는 시간으로 밀릴 수 있습니다. 배우거나 일하고 싶은 분야가 있다면 지속적으로 쓸 수 있는 시간과 가족에게 요청할 협조를 구체적으로 정해야 해요. 생활에 무리가 없는 방식으로 몇 주간 이어본 경험이 앞으로 역할을 넓힐 수 있는 현실적인 근거가 됩니다.",
    tip: "새 활동을 고를 때는 흥미뿐 아니라 현재 가족 일정 안에서 꾸준히 확보할 수 있는 시간인지 확인해보세요.",
  },
  retired: {
    perspective: ["new_rhythm", "interest", "activity", "learning"],
    headlines: {
      default: "생활에 맞는 배움과 모임을 찾는 해",
      balanced: "익숙한 일상에 새로운 관심사를 더하는 해",
      momentum: "사람들과 함께할 활동을 시작해 보는 해",
      caution: "무리 없이 오래 할 활동을 고르는 해",
      resetting: "앞으로 즐길 배움과 활동을 새로 찾는 해",
    },
    baseBody: "지금의 생활 속도에 맞는 배움이나 모임을 찾으면, 부담 없이 사람들과 연결되는 시간을 만들 수 있어요.",
    balancedBody: "올해는 익숙한 일상의 편안함과 새로운 배움이나 사람들과의 활동에 대한 관심이 함께 커질 수 있어요. 생활 속도를 지키면서도 어떤 수업이나 모임이라면 오래 즐길 수 있을지 궁금해질 수 있습니다.",
    resettingGuidance: "일정을 크게 늘리기보다 한 가지 활동을 직접 경험한 뒤 생활에 잘 맞는지 판단하는 방식이 부담을 줄여줍니다.",
    detailBody: "관심이 생긴 활동이라도 이동 시간과 모임의 빈도가 현재 생활 속도와 맞지 않으면 오래 이어가기 어렵습니다. 사람들과 어울리는 즐거움뿐 아니라 참여한 뒤 충분히 쉴 여유가 남는지도 살펴야 해요. 부담 없이 반복할 수 있는 배움이나 모임을 고르면 새로운 관계와 일상의 안정감을 함께 챙길 수 있습니다.",
    tip: "새 모임이나 수업은 횟수보다 참여한 뒤에도 생활 리듬이 무너지지 않는지를 살펴보세요.",
  },
} as const satisfies Record<CareerSituationKey, CareerContextCopyMetadata>;

const CAREER_PHASE_COPY: Record<YearlyActivityPhase, string> = {
  emerging: "처음부터 완성된 답을 내기보다 작은 과제나 단기 경험으로 적성을 확인하는 편이 좋습니다.",
  expanding: "평소 맡지 않던 업무를 해보거나 다른 팀과 함께 일하면 내가 잘할 수 있는 역할의 폭이 넓어질 거예요.",
  peaking: "성과를 내야 할 과제가 겹친다면 가장 중요한 한두 가지부터 끝내는 쪽이 유리합니다.",
  stabilizing: "누가 보아도 반복 가능한 업무 방식과 책임 범위를 만들어두면 신뢰를 쌓기 좋아요.",
  contracting: "효과가 낮은 일은 덜어내고, 지금 성과를 내야 하는 역할에 시간을 집중하는 편이 낫습니다.",
  resetting: "기존 방식을 그대로 밀어가기보다, 계속 맡을 일과 새로 도전할 일을 구체적으로 나눠보세요.",
};

export function selectCareerHeadline(
  metadata: CareerContextCopyMetadata,
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

export function selectCareerBody(
  metadata: CareerContextCopyMetadata,
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
    ? phaseSignal.activityPhase === "resetting"
      ? metadata.resettingGuidance
      : CAREER_PHASE_COPY[phaseSignal.activityPhase]
    : null;
  const caution = cautionSignal && phaseSignal?.activityPhase !== "resetting"
    ? "업무나 준비가 겹칠 때는 속도를 올리기보다, 함께 일하는 사람과 마감 순서와 기대 결과를 먼저 합의하는 게 낫습니다."
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

export function selectCareerTip(
  metadata: CareerContextCopyMetadata,
  annualSignals: readonly YearlyInterpretationSignal[],
) {
  const phase = annualSignals.find(({ activityPhase }) => activityPhase)?.activityPhase;
  return phase === "expanding" ? metadata.expandingTip ?? metadata.tip : metadata.tip;
}
