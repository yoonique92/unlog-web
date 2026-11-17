import type {
  CalendarMonth,
  MonthlyCompositeSignal,
  MonthlyCompositeSignals,
  MonthlyFortuneCopy,
} from "./types";

export const MONTHLY_COPY_VERSION = "monthly-copy-v1" as const;

const CORE_DESCRIPTION: Record<string, string> = {
  self_direction: "남들이 재촉하는 속도보다 내가 감당할 수 있는 속도를 지키고 싶어지기도 합니다",
  competing_priorities: "약속과 부탁, 내가 하려던 일이 겹치면 어느 것부터 손대야 할지 망설이게 됩니다",
  output: "머릿속에만 두었던 이야기나 결과물을 누군가에게 보여주고 싶은 마음이 커질 수 있어요",
  expression: "평소라면 삼켰을 말도 이번에는 제대로 전하고 싶다는 생각이 들 수 있어요",
  external_opportunity: "새로운 사람이나 장소가 눈에 들어오면서 평소와 다른 경험을 고르게 될 수도 있습니다",
  practical_management: "일정과 생활비, 집안일처럼 미룰 수 없는 문제가 평소보다 또렷하게 보일 수 있어요",
  pressure: "지켜야 할 약속과 책임이 겹치면 마음은 급한데 쓸 수 있는 시간은 부족하게 느껴집니다",
  structure: "해야 할 일의 순서가 잡혀 있을수록 하루를 훨씬 편하게 보낼 수 있습니다",
  exploration: "익숙한 일만 반복하기보다 새로운 취미나 방법을 직접 알아보고 싶어질 수 있어요",
  learning_support: "책이나 강의, 주변 사람의 조언에서 막혔던 문제를 풀 단서를 얻게 될 수도 있습니다",
};

const CORE_DESCRIPTION_BY_MONTH_THEME: Partial<Record<string, string>> = {
  "1:output": "말로만 설명하던 생각을 글이나 작업물처럼 눈에 보이는 형태로 만들고 싶은 마음이 커질 수 있어요",
  "1:self_direction": "사람들의 반응에 맞춰 서두르기보다, 내가 감당할 수 있는 속도로 이어가는 편이 더 잘 맞습니다",
  "2:practical_management": "미뤄둔 집안일이나 해야 할 일도 갑자기 신경 쓰이기 시작할 수 있어요",
  "2:structure": "하루에 꼭 지킬 순서만 정해두어도 마음이 한결 가벼워집니다",
  "3:pressure": "지켜야 할 약속과 책임이 겹치면 마음은 급한데 쓸 수 있는 시간은 부족하게 느껴질 수 있어요",
  "5:pressure": "지켜야 할 약속과 책임이 겹치면 마음은 급한데 쓸 수 있는 시간은 부족하게 느껴질 수 있어요",
  "6:learning_support": "책이나 강의에서 막혔던 문제를 풀 단서를 얻거나, 주변의 설명이 유난히 잘 이해될 수도 있습니다",
  "6:exploration": "알게 된 내용을 다른 취미나 일상에도 써보고 싶어져 관심 범위가 조금씩 넓어질 수 있어요",
  "9:self_direction": "남들이 재촉하더라도 내 눈에 걸리는 대목은 충분히 다듬은 뒤 마치고 싶어지기도 합니다",
  "9:output": "누군가에게 보여줄 날짜가 가까워질수록 평소에는 넘겼을 작은 부분까지 더 신경 쓰일 수 있어요",
  "11:output": "사람들과 나누고 싶었던 이야기나 결과물을 직접 보여주고 싶은 마음이 커질 수 있습니다",
  "11:practical_management": "일정과 생활비, 집안일처럼 미룰 수 없는 문제도 또렷하게 보이기 시작해요",
  "12:practical_management": "고정비와 이미 잡힌 약속을 떠올리면 마음에 드는 것을 바로 고르기는 어려울 수 있어요",
  "12:external_opportunity": "낯선 장소나 새로운 취미에는 평소보다 쉽게 눈길이 갈 수도 있습니다",
};

const HEADLINE_BY_CORE_PAIR: Record<string, string> = {
  "output|self_direction": "숨겨둔 결과물, 이제 진짜 꺼내놓을까?",
  "practical_management|structure": "쓸 돈은 늘고 일정까지 왜 이렇게 빡빡해?",
  "external_opportunity|pressure": "반가운 연락은 오는데 다 만나긴 벅찰 때",
  "structure|competing_priorities": "계획 세워놨는데 왜 자꾸 다른 일이 끼어들지?",
  "pressure|learning_support": "쉬려고 했는데 또 새로운 게 눈에 들어와요",
  "learning_support|exploration": "익숙한 것보다 새로 배우는 게 재밌어질 때",
  "exploration|self_direction": "밖에선 신나는데 집에 오면 아무도 보기 싫을지도",
  "competing_priorities|expression": "참고 넘긴 말, 이번엔 그냥 못 넘길지도",
  "self_direction|output": "거의 다 끝냈는데 왜 작은 게 자꾸 거슬리지?",
  "expression|competing_priorities": "한마디 하고 싶은데 괜히 입이 안 떨어져요",
  "output|practical_management": "사람을 만날수록 혼자 쓸 시간이 더 아쉬워져요",
  "practical_management|external_opportunity": "갖고 싶은데 통장은 왜 자꾸 보게 되지?",
};

const HEADLINE_ACTION: Record<string, string> = {
  self_direction: "내 속도로 가고 싶은데 주변은 자꾸 빨라지고",
  competing_priorities: "하나를 고르면 다른 하나가 마음에 걸리고",
  output: "보여주고 싶은데 아직 덜 된 것 같고",
  expression: "말하고 싶은데 어디부터 꺼내야 할까",
  external_opportunity: "낯선 게 끌리는데 선뜻 고르기는 어렵고",
  practical_management: "챙길 건 많은데 하나씩 놓치기 시작하고",
  pressure: "쉬고 싶은데 지킬 약속은 아직 남아 있고",
  structure: "계획대로 가고 싶은데 변수가 생기고",
  exploration: "왜 요즘 자꾸 새로운 게 궁금하지?",
  learning_support: "배우고 싶은데 어디서부터 시작할까",
};

const MONTH_LEADS: Record<CalendarMonth, string> = {
  1: "그동안 혼자 다듬어온 결과가 어느 정도 모이면, 부족한 부분보다 먼저 공개할 수 있는 모습이 눈에 들어오기 시작해요",
  2: "돈 쓸 곳과 해야 할 일이 함께 늘어나면, 평소에는 괜찮던 일정도 유난히 빠듯하게 느껴질 수 있어요",
  3: "반가운 연락과 모임이 이어져도 모두 응하다 보면, 사람을 만나는 즐거움보다 피로가 먼저 쌓일 수 있습니다",
  4: "계획해둔 일 사이로 갑작스러운 약속이나 집안일이 들어오면, 하루의 순서를 몇 번이고 바꾸게 될 수 있어요",
  5: "쉬려고 자리를 잡은 순간에도 책이나 강의, 새로운 취미가 눈에 들어와 마음이 다시 바빠질 수 있습니다",
  6: "익숙한 방식으로도 충분히 해낼 수 있지만, 새로 배운 방법이 생각보다 재미있고 잘 맞게 느껴질 수 있어요",
  7: "밖에서는 사람과 경험을 즐기다가도 집에 돌아오면 말없이 혼자 있고 싶은 마음이 커질 수 있습니다",
  8: "그동안 참고 넘긴 말이 자꾸 떠오르면, 이번에는 모른 척하기보다 제대로 이야기하고 싶어질 수 있어요",
  9: "끝이 보이기 시작하면 오히려 평소에는 넘겼을 작은 부분이 자꾸 눈에 들어올 수 있어요",
  10: "하고 싶은 말은 분명한데 상대의 반응까지 생각하다 보면, 막상 입을 여는 순간이 늦어질 수 있습니다",
  11: "연락과 약속이 이어질수록 즐거운 마음과 별개로 혼자 쓸 시간이 부족하다는 생각이 들 수 있어요",
  12: "마음에 드는 물건이나 해보고 싶은 일이 생기면 지갑을 열기 전에 남은 생활비부터 확인하게 될 수 있습니다",
};

const MONTH_CORE_BRIDGES: Record<CalendarMonth, [string, string]> = {
  1: ["이때", "다만"],
  2: ["그러다 생각지 못한 지출까지 생기면", "이럴 때"],
  3: ["사람을 만날 때는", "한편으로는"],
  4: ["일정을 다시 맞추려 하면", "그 와중에도"],
  5: ["마음이 바빠질수록", "그러면서도"],
  6: ["배운 것을 써보는 동안에는", "동시에"],
  7: ["새 경험을 즐기는 동안에도", "집으로 돌아오면"],
  8: ["대화를 시작하려 하면", "다만"],
  9: ["마지막 손질에 들어가면", "특히"],
  10: ["말을 고르는 사이에는", "그렇다고"],
  11: ["만남이 잦아질수록", "그 사이에도"],
  12: ["돈을 쓸 곳을 고를 때는", "한편"],
};

const RELATION_BRIDGE: Record<CalendarMonth, string> = {
  1: "처음에는",
  2: "생활이 자리를 잡으면",
  3: "연락이 잦아지면",
  4: "예정이 달라지는 순간에는",
  5: "관심사가 늘어날수록",
  6: "새 방법을 익히는 동안에는",
  7: "바깥 활동이 많아지면",
  8: "대화가 깊어질수록",
  9: "결과를 다듬는 과정에서는",
  10: "말할 기회가 생기면",
  11: "약속이 이어질수록",
  12: "지출할 곳을 고르다 보면",
};

const BACKGROUND_BRIDGE: Record<CalendarMonth, string> = {
  1: "시간이 지나면서",
  2: "그래서 하루를 돌아보면",
  3: "다만 사람 사이에서는",
  4: "그러다 보면",
  5: "특히 쉬는 시간에는",
  6: "배운 것을 써보려 할 때는",
  7: "반면 집으로 돌아오면",
  8: "가까운 관계에서는 오히려",
  9: "눈에 보이는 결과 앞에서는",
  10: "상대의 반응을 기다리는 동안에는",
  11: "여러 사람을 만나다 보면",
  12: "한 해를 마무리할 즈음에는",
};

const DAEUN_BRIDGE: Record<CalendarMonth, string> = {
  1: "조금 더 길게 보면",
  2: "앞으로도 이 생활을 이어가려면",
  3: "관계가 이어지는 모습을 보면",
  4: "오래 가져갈 선택에서는",
  5: "관심사를 오래 이어가려면",
  6: "배움을 생활에 붙이려면",
  7: "새 경험이 자리를 잡으려면",
  8: "관계를 오래 편하게 이어가려면",
  9: "내 방식을 꾸준히 지키려면",
  10: "대화가 끝난 뒤까지 생각하면",
  11: "약속이 계속 이어질 때는",
  12: "새해까지 가져갈 선택이라면",
};

const MONTH_CLOSINGS: Record<CalendarMonth, string> = {
  1: "처음부터 완벽을 바라기보다 지금 완성된 부분부터 선보이면, 무엇을 더 이어갈지도 훨씬 또렷해져요",
  2: "당장 나갈 돈과 뒤로 미뤄도 되는 일을 먼저 나눠두면, 바쁜 와중에도 중요한 일을 놓치지 않게 돼요",
  3: "모든 연락에 바로 답하려 하지 말고 내가 편하게 응할 수 있는 만남부터 고르면, 사람 사이에서도 여유를 지키기 쉬워요",
  4: "처음 세운 계획을 억지로 붙들기보다 달라진 일정까지 반영해 다시 짜면, 하루를 훨씬 수월하게 이어갈 수 있어요",
  5: "쉬는 시간까지 배움으로 채우기보다 지금 가장 궁금한 한 가지만 골라야, 지치지 않고 재미도 오래갑니다",
  6: "새 방법을 바로 정답으로 삼지 않고 익숙한 방식과 나란히 써보면, 내 생활에 남길 것이 분명해집니다",
  7: "외출이 이어지는 날 사이에 아무 약속도 없는 시간을 남겨두면, 즐거움과 피로를 함께 감당하기가 수월해요",
  8: "상대가 알아서 이해하길 기다리기보다 내가 기대한 부분부터 차분히 꺼내면, 대화가 불필요하게 어긋나는 일을 줄일 수 있어요",
  9: "내놓는 시점을 조금 늦추더라도 눈에 밟히는 곳을 한 번 더 다듬는 쪽이 마음에도 오래 남습니다",
  10: "답을 서두르지 말고 꼭 전하고 싶은 말부터 골라두면, 신중함이 답답한 침묵으로 남는 일을 줄일 수 있어요",
  11: "모든 만남에 같은 시간을 쓰기보다 오래 보고 싶은 사람과 약속부터 남겨두면, 내 시간도 함께 지키기 좋습니다",
  12: "마음에 드는 것일수록 실제로 얼마나 자주 쓸지 한 번 더 떠올리면, 즐거움도 챙기고 생활비 부담도 덜 수 있어요",
};

const MONTH_TIPS: Record<CalendarMonth, string> = {
  1: "새 계획을 더하기 전에, 지금 완성된 것 중 무엇부터 보여줄지 정해두면 시작하기가 한결 수월합니다.",
  2: "지출과 일정이 겹칠수록 꼭 해야 하는 일부터 순서를 정해두는 편이 좋습니다.",
  3: "반가운 연락이라도 바로 약속부터 잡기보다, 내가 편하게 쓸 수 있는 시간을 먼저 확인하세요.",
  4: "조건이 달라졌다면 처음 약속을 억지로 붙들지 말고, 바뀐 일정까지 함께 알려두면 서로 맞추기 수월해요.",
  5: "궁금한 것이 많아도 쉬는 시간을 빼앗지 않는 범위에서 시작해야 오래 즐길 수 있습니다.",
  6: "관심 있던 책이나 강의 하나를 익숙한 생활 안에서 먼저 써보면, 내게 맞는 방법인지 금방 알 수 있습니다.",
  7: "일정이 몰린 날 뒤에는 일부러 빈 시간을 남겨두어야, 중요한 약속도 무리 없이 지킬 수 있어요.",
  8: "가까운 사람과 나눌 말이 있다면 결론부터 재촉하지 말고, 서로 무엇을 기대했는지부터 확인하는 편이 좋습니다.",
  9: "결과를 내놓기 전 눈에 밟히는 부분을 한 번만 더 살피면, 끝내고도 아쉬움이 남는 일을 줄일 수 있어요.",
  10: "바로 답해야 한다는 마음을 내려놓고 꼭 전할 말을 한 문장으로 골라두면, 대화를 이어가기 한결 수월합니다.",
  11: "연락과 모임이 겹칠수록 오래 이어가고 싶은 약속부터 시간을 남겨두는 게 내 여유를 지키는 데 도움이 됩니다.",
  12: "새 물건이나 경험에 돈을 쓰기 전, 남은 생활비와 실제로 누릴 시간을 함께 살펴보는 편이 좋습니다.",
};

const ANNUAL_DESCRIPTION: Record<string, string> = {
  annual_theme_reinforced: "평소 관심을 두던 것과 눈앞의 선택이 같은 방향을 가리켜, 생각만 하던 일을 실제 생활에 옮기기 좋아요",
  annual_theme_contrasted: "계속 해오던 방식과 새로 생긴 일정이 서로 다른 쪽을 가리켜, 둘 사이의 순서를 다시 잡아야 할 수 있습니다",
  annual_pressure_intensified: "미뤄둔 약속이나 지출까지 한꺼번에 떠오르면 마음이 급해질 수 있으니, 지금 꼭 필요한 것부터 가리는 게 좋아요",
  annual_theme_redirected: "원래 생각했던 것과 다른 관심사가 눈에 들어올 수 있어, 전부 바꾸기보다 가볍게 경험해보는 쪽이 편합니다",
  annual_pace_supported: "평소 생활 방식과 눈앞의 일정이 잘 맞아, 익숙한 리듬을 유지하는 것만으로도 충분히 이어갈 수 있어요",
};

const ANNUAL_REINFORCED_BY_MONTH: Partial<Record<CalendarMonth, string>> = {
  1: "오래 마음에 두었던 일이 실제 모습을 갖추기 시작해, 생각만 하던 것을 작업으로 옮기기 좋아요",
  2: "돈과 시간을 써야 할 곳이 한꺼번에 또렷해져, 뒤로 미뤄둔 일까지 함께 챙기게 될 수 있어요",
  12: "미뤄두었던 물건이나 경험이 현실적인 선택지로 들어오면서, 어디에 돈을 쓸지도 평소보다 분명해질 수 있어요",
};

const DAEUN_DESCRIPTION: Record<string, string> = {
  long_term_theme_reinforced: "새로 알게 된 방법이나 사람을 이후의 생활에서도 다시 찾게 될 수 있어요",
  long_term_theme_contrasted: "오래 유지해 온 생활 습관과 새 일정이 잘 맞지 않을 수 있어, 둘을 한꺼번에 챙기면 금방 지칠 수 있습니다",
  temporary_transition: "평소와 다른 사람이나 경험이 잠시 들어올 수 있으니, 호기심과 오래 가져갈 선택을 구분할 필요가 있습니다",
  pressure_overlap: "이미 지키고 있는 약속 위로 부탁이 더해지면 여유가 줄 수 있어, 혼자 감당할 범위를 넘지 않는 게 중요해요",
  stability_support: "익숙한 생활 리듬과 눈앞의 일정이 잘 맞아, 하던 방식을 유지하는 쪽이 오히려 편합니다",
};

const NATAL_RELATION_SCENE: Partial<Record<string, string>> = {
  "1:tension": "처음 결과를 건넬 때는 오래 알고 지낸 사람의 기대와 내가 담고 싶은 모습이 다를 수 있어, 어느 선까지 드러낼지 고민하게 될 수 있습니다",
  "2:connection": "혼자 맞추려던 일정도 주변 사람과 시간을 나누어 보면, 쌓아둔 일을 생각보다 수월하게 처리할 수 있어요",
  "3:connection": "연락이 잦아지면 예전부터 편하게 지내던 사람과 다시 가까워지거나, 주변의 도움으로 미뤄둔 일을 풀게 될 수 있어요",
  "4:tension": "예정이 달라지면 혼자 쓰려던 시간과 새로 생긴 일이 부딪힐 수 있어, 어느 쪽에 시간을 먼저 쓸지 정해야 할 수 있습니다",
  "5:connection": "새로 궁금해진 내용을 익숙한 취미나 일상에 가볍게 적용해보면, 혼자 알아볼 때 놓친 부분을 발견하기 쉬워요",
  "6:connection": "익숙한 사람에게 새로 배운 방법을 설명하거나 함께 써보면, 혼자 익힐 때 놓친 부분을 쉽게 발견할 수 있어요",
  "7:connection": "밖에서 알게 된 사람이나 방법이 혼자 보내는 시간을 더 편하게 만드는 데 도움이 될 수도 있어요",
  "9:connection": "마무리 전에 믿을 만한 사람에게 한 번 보여주면, 혼자 볼 때 지나친 빈틈과 잘된 부분을 함께 확인할 수 있어요",
  "10:connection": "혼자 생각을 거듭하기보다 믿을 만한 사람에게 먼저 말을 꺼내보면, 전하고 싶은 내용을 차분히 가려내기 쉬워요",
  "11:connection": "연락이 이어질수록 오래 알고 지낸 사람의 도움으로 미뤄둔 일을 풀거나, 준비해온 것을 보여줄 기회가 생길 수 있어요",
  "12:connection": "평소 내 소비 습관을 아는 사람과 이야기해보면, 순간의 호기심인지 오래 누릴 선택인지 구분하기 쉬워요",
};

const BACKGROUND_RELATION_SCENE: Partial<Record<string, string>> = {
  "1:daeun:connection": "이번에 받은 반응은 한 번으로 끝나지 않고, 앞으로 무엇을 더 다듬을지 알려주는 참고가 될 수 있어요",
  "2:daeun:friction": "기존 일정에 새로 해야 할 일까지 겹치면 사소한 불편이 반복될 수 있으니, 서로 가능한 시간을 미리 맞춰둘 필요가 있습니다",
  "3:annual:friction": "만날 사람이 늘어나면 이미 잡힌 일정과 새 약속이 부딪힐 수 있으니, 누구에게 어느 시간을 쓸지 미리 말해둘 필요가 있습니다",
  "3:daeun:long_term_theme_reinforced": "그 과정에서 알게 된 사람이나 관심사는 한 번의 만남으로 끝나지 않고, 이후에도 다시 찾게 될 수 있어요",
  "4:annual:connection": "갑작스러운 일정 속에서도 전에 익힌 방법이나 주변의 도움을 활용하면, 계획을 전부 포기하지 않고 이어갈 수 있어요",
  "4:daeun:temporary_transition": "평소와 다른 제안까지 더해질 수 있지만, 잠깐의 호기심인지 오래 가져갈 일인지는 따로 살펴야 합니다",
  "5:daeun:long_term_theme_reinforced": "직접 써본 방법 가운데 생활을 편하게 만든 것은 한때의 관심으로 끝나지 않고 오래 남을 수 있어요",
  "6:annual:tension": "관심 가는 것과 당장 익혀야 하는 방법이 다를 수 있어, 흥미만 좇기보다 지금 필요한 내용도 함께 살펴야 합니다",
  "9:annual:adjustment": "처음 생각한 마감과 실제 손볼 분량이 달라질 수 있어, 내놓을 날짜보다 남은 작업부터 다시 세어보는 게 좋아요",
  "9:daeun:connection": "이번에 꼼꼼하게 다듬어 둔 방식은 비슷한 일을 다시 맡았을 때 시간을 줄여주는 요령으로 남을 수 있어요",
  "6:daeun:long_term_theme_reinforced": "이번에 알게 된 내용을 일상에서 자주 써보면 한 번의 호기심으로 끝나지 않고, 오래 쓰는 습관이 될 수도 있습니다",
  "7:annual:connection": "새로 만난 사람이나 경험에서 얻은 즐거움이 평소 생활에도 이어지면, 다음 외출을 고르는 기준이 분명해질 수 있어요",
  "7:daeun:temporary_transition": "다만 새로운 일정이 모두 오래 남는 것은 아니므로, 즐거웠던 일과 계속 시간을 쓰고 싶은 일을 구분할 필요가 있습니다",
  "8:annual:connection": "대화를 꺼내고 나면 예전에 함께 해결했던 방식이 떠올라, 이번에도 어디서부터 맞춰야 할지 찾기 쉬워요",
  "8:daeun:connection": "서로 기대한 부분을 말로 확인하면 한 번의 대화로 끝나지 않고, 이후 비슷한 상황에서도 덜 어긋날 수 있습니다",
  "10:daeun:connection": "생각을 말로 옮기는 과정에서 상대의 도움을 받으면, 혼자 고민할 때보다 표현할 순서가 분명해질 수 있어요",
  "11:annual:connection": "사람들과 준비해온 이야기를 나누다 보면 새로운 약속이 생길 수 있지만, 이미 잡힌 일정과 함께 챙길 수 있는지도 살펴야 합니다",
  "11:daeun:tension": "모임이 계속 이어지면 원래 하려던 일과 새 약속 사이에서 망설일 수 있으니, 오래 보고 싶은 관계부터 시간을 남겨둘 필요가 있어요",
  "12:daeun:temporary_transition": "새해까지 비용이 이어지는 선택이라면 한 번의 결제만 보지 말고, 이후에 들어갈 시간과 유지비도 함께 따져봐야 합니다",
};

function chooseSignals(signals: MonthlyCompositeSignal[]) {
  const bySource = (source: MonthlyCompositeSignal["source"]) =>
    signals.filter((signal) => signal.source === source);
  const core = bySource("monthly_core");
  const coreTenGods = core.filter(({ id }) => id.includes("-stem-") || id.includes("-branch-"));
  const preferRelation = (source: "annual_monthly" | "daeun_monthly") => {
    const candidates = bySource(source);
    return candidates.find(({ evidence }) =>
      evidence.some((item) => item.source === "canonical_relation")) ?? candidates[0];
  };

  return [
    ...coreTenGods.slice(0, 2),
    bySource("natal_monthly")[0],
    preferRelation("annual_monthly"),
    preferRelation("daeun_monthly"),
    bySource("annual_daeun_monthly")[0],
  ].filter((signal): signal is MonthlyCompositeSignal => Boolean(signal));
}

function relationSentence(signal: MonthlyCompositeSignal | undefined, month: CalendarMonth) {
  if (!signal) {
    if (month === 8) {
      return "대화를 시작한 뒤에는 상대가 바로 답을 내놓지 않더라도, 먼저 서로의 기대를 확인하는 것만으로도 다음 말을 이어가기 쉬워요";
    }
    return `${RELATION_BRIDGE[month]} 평소 생활 방식과 새 일정 사이에 큰 충돌이 적어, 앞에서 정한 순서를 차분히 유지하는 것만으로도 충분해요`;
  }
  const scene = NATAL_RELATION_SCENE[`${month}:${signal.kind}`];
  if (scene) return scene;

  const evidence = signal.evidence.find((item) => item.source === "canonical_relation");
  const position = evidence?.source === "canonical_relation"
    ? evidence.members.find(({ layer }) => layer === "natal")?.pillarPosition
    : undefined;
  const familiarPattern = position === "day"
    ? "평소 편하게 해오던 방식"
    : position === "month"
      ? "반복해 온 일상과 주변 사람들의 일정"
      : position === "year"
        ? "오래 이어온 관계나 익숙한 약속"
        : position === "hour"
          ? "혼자 보내려던 시간과 세부 일정"
          : "평소의 생활 리듬";
  if (signal.kind === "connection") {
    return `${RELATION_BRIDGE[month]} ${familiarPattern}에 지금 생긴 일이 무리 없이 이어져, 전에 해본 방식이나 주변의 도움으로 막힌 대목을 풀기 쉬워요`;
  }
  if (signal.kind === "tension") {
    return `${RELATION_BRIDGE[month]} ${familiarPattern}과 지금 생긴 일이 서로 다른 것을 요구해, 어느 쪽에 시간을 더 써야 할지 고민하게 될 수 있습니다`;
  }
  if (signal.kind === "adjustment") {
    return `${RELATION_BRIDGE[month]} ${familiarPattern}에 맞추려던 순서가 달라져, 중간에 약속이나 계획을 고쳐 잡게 될 수도 있습니다`;
  }
  return `${RELATION_BRIDGE[month]} ${familiarPattern}에서 비슷한 불편이 되풀이될 수 있으니, 혼자 넘겨짚기보다 말로 확인하는 편이 편해요`;
}

function backgroundSentence(
  signal: MonthlyCompositeSignal | undefined,
  layer: "annual" | "daeun",
  month: CalendarMonth,
) {
  const bridge = layer === "annual" ? BACKGROUND_BRIDGE[month] : DAEUN_BRIDGE[month];
  if (!signal) {
    return layer === "daeun"
      ? `${bridge} 먼 훗날까지 답을 내리기보다 지금 지켜야 할 일정과 관계부터 보는 쪽이 편해요`
      : `${bridge} 멀리 내다보기보다 이미 잡힌 약속과 지금 고를 수 있는 것부터 살펴보면 됩니다`;
  }
  const relationScene = BACKGROUND_RELATION_SCENE[`${month}:${layer}:${signal.kind}`]
    ?? BACKGROUND_RELATION_SCENE[`${month}:${layer}:${signal.theme}`];
  if (relationScene) return relationScene;

  const descriptions = layer === "annual" ? ANNUAL_DESCRIPTION : DAEUN_DESCRIPTION;
  const directRelation = signal.evidence.some((item) => item.source === "canonical_relation");
  if (
    layer === "annual"
    && !directRelation
    && signal.theme === "annual_theme_reinforced"
    && ANNUAL_REINFORCED_BY_MONTH[month]
  ) {
    return `${bridge} ${ANNUAL_REINFORCED_BY_MONTH[month]}`;
  }
  if (!directRelation && descriptions[signal.theme]) {
    return `${bridge} ${descriptions[signal.theme]}`;
  }
  const relationText = signal.kind === "connection"
    ? "잘 어울려 한곳에서 익힌 방법이나 얻은 도움을 다른 일에도 써볼 수 있어요"
    : signal.kind === "tension"
      ? "엇갈리면서 원래 하려던 것과 지금 필요한 것 사이에서 망설이게 될 수 있습니다"
      : signal.kind === "adjustment"
        ? "예상과 다른 순서로 이어질 수 있어, 큰 결론보다 당장 잡힌 약속부터 다시 맞추는 게 좋아요"
        : "겹치면서 사소한 불편이 되풀이될 수 있으니 서로 기대하는 바를 말로 확인할 필요가 있습니다";
  const subject = layer === "annual" ? "계속 마음에 두었던 일과 지금 고를 수 있는 일이" : "평소 지켜온 습관과 새로 생긴 약속이";
  return `${bridge} ${subject} ${relationText}`;
}

function multiLayerSentence(signal: MonthlyCompositeSignal | undefined) {
  if (!signal) return null;
  return "따로 생각했던 사람과 일정이 한자리에서 얽히면, 무엇을 먼저 챙겨야 할지도 오히려 분명해질 수 있어요";
}

function buildHeadline(selected: MonthlyCompositeSignal[]) {
  const core = selected.filter(({ source }) => source === "monthly_core");
  const pairKey = `${core[0]?.theme ?? ""}|${core[1]?.theme ?? ""}`;
  const paired = HEADLINE_BY_CORE_PAIR[pairKey];
  if (paired) return paired;

  const action = HEADLINE_ACTION[core[0]?.theme] ?? "마음은 앞서는데 어디서부터 시작해야 할까";
  const annual = selected.find(({ source }) => source === "annual_monthly");
  const daeun = selected.find(({ source }) => source === "daeun_monthly");
  if (annual?.kind === "tension" || annual?.kind === "adjustment") {
    return "계획대로 가고 싶은데 자꾸 다른 일이 끼어들고";
  }
  if (daeun?.kind === "tension" || daeun?.kind === "friction") {
    return "혼자 해내고 싶은데 부담은 자꾸 늘고";
  }
  if (annual?.kind === "connection" || daeun?.kind === "connection") {
    return "괜히 누군가와 같이 해보고 싶은 날들";
  }
  return action;
}

function withPeriod(sentence: string) {
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

export function buildMonthlyFortuneCopies(
  composite: MonthlyCompositeSignals,
): MonthlyFortuneCopy[] {
  return composite.months.map(({ displayMonth, signals }) => {
    const selected = chooseSignals(signals);
    const core = selected.filter(({ source }) => source === "monthly_core");
    const natal = selected.find(({ source }) => source === "natal_monthly");
    const annual = selected.find(({ source }) => source === "annual_monthly");
    const daeun = selected.find(({ source }) => source === "daeun_monthly");
    const multi = selected.find(({ source }) => source === "annual_daeun_monthly");
    const firstCore = CORE_DESCRIPTION_BY_MONTH_THEME[`${displayMonth}:${core[0]?.theme}`]
      ?? CORE_DESCRIPTION[core[0]?.theme]
      ?? "이번 달에 먼저 다뤄야 할 일의 성격이 비교적 분명하게 드러납니다";
    const secondCore = CORE_DESCRIPTION_BY_MONTH_THEME[`${displayMonth}:${core[1]?.theme}`]
      ?? CORE_DESCRIPTION[core[1]?.theme]
      ?? "동시에 주변 상황과 약속을 함께 고려해야 할 수 있습니다";
    const [firstCoreBridge, secondCoreBridge] = MONTH_CORE_BRIDGES[displayMonth];
    const firstParagraph = [
      MONTH_LEADS[displayMonth],
      `${firstCoreBridge} ${firstCore}`,
      `${secondCoreBridge} ${secondCore}`,
      backgroundSentence(annual, "annual", displayMonth),
    ].map(withPeriod).join(" ");
    const secondParagraphSentences = [
      relationSentence(natal, displayMonth),
      backgroundSentence(daeun, "daeun", displayMonth),
      multiLayerSentence(multi),
      MONTH_CLOSINGS[displayMonth],
    ].filter((sentence): sentence is string => Boolean(sentence));

    return {
      version: MONTHLY_COPY_VERSION,
      displayMonth,
      headline: buildHeadline(selected),
      body: `${firstParagraph}\n\n${secondParagraphSentences.map(withPeriod).join(" ")}`,
      tip: MONTH_TIPS[displayMonth],
      sourceSignalIds: [...new Set(selected.map(({ id }) => id))],
    };
  });
}
