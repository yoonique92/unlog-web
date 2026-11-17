export type YearlyInput = {
  dayStem: string;
  yearGanzhi: string;
  yearStemTenGod: string;
  yearBranchTenGod: string;
  currentDaeunGanzhi: string;
  currentDaeunStemTenGod: string;
  currentDaeunBranchTenGod: string;
};

export type YearlyInterpretation = {
  yearGanzhi: string;
  dayStem: string;
  currentDaeunGanzhi: string;
  headline: string;
  summary: string;
  career: string;
  money: string;
  relationship: string;
  caution: string;
  action: string;
  keywords: string[];
};

export function getYearlyInterpretation({
  dayStem,
  yearGanzhi,
  yearStemTenGod,
  yearBranchTenGod,
  currentDaeunGanzhi,
  currentDaeunStemTenGod,
  currentDaeunBranchTenGod,
}: YearlyInput): YearlyInterpretation {
  const yearlyKeywords = [
    yearStemTenGod,
    yearBranchTenGod,
    currentDaeunStemTenGod,
    currentDaeunBranchTenGod,
  ];

  let headline = "";
  let summary = "";
  let career = "";
  let money = "";
  let relationship = "";
  let caution = "";
  let action = "";

  const hasInseong =
    yearlyKeywords.includes("정인") ||
    yearlyKeywords.includes("편인");

  const hasGwanseong =
    yearlyKeywords.includes("정관") ||
    yearlyKeywords.includes("편관");

  const hasBijeop =
    yearlyKeywords.includes("비견") ||
    yearlyKeywords.includes("겁재");

  const hasSiksang =
    yearlyKeywords.includes("식신") ||
    yearlyKeywords.includes("상관");

  const hasJaeseong =
    yearlyKeywords.includes("정재") ||
    yearlyKeywords.includes("편재");

  if (hasInseong && hasGwanseong) {
    headline = "배운 것을 내 역할로 만들어가는 해";

    summary =
      "새로 익힌 내용이나 그동안 쌓은 경험을 실제 업무와 책임으로 연결할 일이 많아질 수 있어요. 알고 있는 데서 그치지 않고 직접 써볼수록 내 자리가 분명해지는 해입니다.";

    career =
      "업무에서는 공부나 자격 준비처럼 실력을 보완하는 일과, 그 실력을 실제 프로젝트에서 보여주는 일이 함께 중요해져요. 준비가 충분해질 때까지 기다리기보다 맡은 일 안에서 먼저 써보는 편이 좋습니다.";

    money =
      "당장 큰 수익을 좇기보다 오래 써먹을 기술이나 경험에 돈을 쓰고 싶어질 수 있어요. 강의나 자격 준비에 비용을 쓴다면 실제 업무에서 활용할 계획까지 함께 세워두는 편이 좋습니다.";

    relationship =
      "사람을 많이 만나기보다 약속을 지키고 믿을 수 있는 관계에 마음이 갈 수 있어요. 가까운 사람과는 서로 기대하는 역할을 말로 확인해두면 서운함을 줄이기 쉽습니다.";

    caution =
      "배우고 준비할 것이 많아지면 정작 시작할 시점을 미룰 수 있어요. 완벽해질 때까지 기다리기보다 지금 할 수 있는 범위부터 직접 써볼 필요가 있습니다.";

    action =
      "공부한 내용 가운데 하나는 프로젝트나 포트폴리오처럼 다른 사람에게 보여줄 수 있는 형태로 남겨두면 좋습니다.";
  } else if (hasSiksang && hasJaeseong) {
    headline = "만든 결과가 실제 보상으로 이어지는 해";

    summary =
      "생각을 말이나 결과물로 꺼내놓을수록 사람들이 알아보기 쉬워지고, 그 반응이 새로운 일이나 보상으로 이어질 수 있어요.";

    career =
      "아이디어를 기획서나 콘텐츠처럼 눈에 보이는 결과로 만드는 일이 중요해져요. 성과를 확인할 수 있는 업무에서는 내가 잘하는 부분도 더 분명하게 드러날 수 있습니다.";

    money =
      "내가 만든 결과나 맡은 일이 금전적인 보상과 연결될 여지가 있어요. 들어오는 돈만큼 지출도 늘 수 있으니, 수입이 생겼을 때 남길 몫을 먼저 나누어두면 좋습니다.";

    relationship =
      "일이나 활동을 통해 새로운 사람과 대화할 일이 늘어날 수 있어요. 관계를 넓히는 데 집중하기보다 다시 만나고 싶은 사람에게 시간을 쓰는 편이 잘 맞습니다.";

    caution =
      "하고 싶은 일과 만날 사람이 한꺼번에 늘면 집중해야 할 일을 놓치기 쉬워요.";

    action =
      "제안이 여러 개 들어오면 모두 받아들이기보다, 시간과 비용을 들인 만큼 결과를 확인할 수 있는 일부터 고르는 편이 좋습니다.";
  } else if (hasBijeop && hasGwanseong) {
    headline = "내 방식과 맡은 책임 사이를 맞춰가는 해";

    summary =
      "내가 편한 방식으로 일하고 싶은 마음은 커지는데, 회사나 주변에서 맡기는 책임도 함께 늘 수 있어요. 어느 한쪽만 고집하기보다 꼭 지켜야 할 약속부터 구분하는 일이 중요합니다.";

    career =
      "직장에서는 맡은 범위가 넓어지거나 결정해야 할 일이 늘 수 있어요. 일하는 방식은 스스로 정하더라도 결과와 마감처럼 함께 지켜야 할 약속은 분명히 해두는 편이 좋습니다.";

    money =
      "내 판단대로 돈을 쓰고 싶은 순간이 늘 수 있어요. 금액이 큰 선택이라면 결제하기 전에 앞으로 나갈 돈과 실제 사용 횟수를 함께 확인해두면 좋습니다.";

    relationship =
      "가까운 사람과도 내가 당연하게 여긴 방식이 상대에게는 다르게 보일 수 있어요. 누가 맞는지 따지기 전에 각자 기대한 부분을 말로 풀어두면 대화가 한결 수월해집니다.";

    caution =
      "내 방식대로 끝내고 싶은 마음이 강해지면 부탁할 수 있는 일까지 혼자 떠안을 수 있어요.";

    action =
      "일이 몰릴 때는 내가 결정해야 하는 일과 다른 사람에게 맡겨도 되는 일을 먼저 나누어두는 편이 좋습니다.";
  } else if (hasInseong) {
    headline = "배운 것을 내 것으로 쌓아가는 해";

    summary =
      "빠른 결과를 내기보다 한 분야를 깊게 배우고, 이미 아는 내용을 다시 익힐 시간이 필요해질 수 있어요.";

    career =
      "새로운 공부나 훈련을 시작한다면 여러 분야를 오가기보다 실제 업무에 쓸 한 가지를 깊게 파는 편이 잘 맞습니다.";

    money =
      "당장 큰 수익을 기대하는 소비보다 오래 써먹을 기술이나 경험에 돈을 쓰는 쪽이 더 만족스럽게 느껴질 수 있어요.";

    relationship =
      "혼자 생각할 시간이 필요해지면서 가까운 사람에게도 말수가 줄 수 있어요. 오래 고민한 일일수록 결론만 전하기보다 고민한 과정부터 나누면 이해받기 쉬워집니다.";

    caution =
      "자료를 더 찾느라 시작할 시점을 계속 미루지 않도록 주의할 필요가 있어요.";

    action =
      "올해 배운 것 가운데 하나는 글이나 작업물처럼 다시 꺼내볼 수 있는 형태로 남겨두면 좋습니다.";
  } else if (hasSiksang) {
    headline = "생각을 꺼내놓을수록 일이 풀리는 해";

    summary =
      "머릿속에만 두었던 생각을 말이나 결과물로 보여줄수록 주변의 반응을 확인하기 쉬워요. 직접 해본 경험이 다음 일을 고르는 단서가 될 수 있습니다.";

    career =
      "기획이나 발표처럼 생각을 다른 사람에게 보여주는 일이 많아질 수 있어요. 설명에 그치지 않고 작은 결과라도 만들어두면 실력을 알아보는 사람도 생기기 쉽습니다.";

    money =
      "내가 만든 결과가 돈과 연결될 여지는 있지만, 시작할 때 들어가는 비용도 함께 늘 수 있어요. 먼저 적은 비용으로 반응을 확인하는 편이 안전합니다.";

    relationship =
      "평소에 삼키던 말을 꺼내면서 관계의 분위기가 달라질 수 있어요. 솔직함만 앞세우기보다 상대가 받아들일 시간을 함께 남겨두면 좋습니다.";

    caution =
      "떠오른 말을 바로 꺼내거나 일을 급하게 시작하면 작은 부분을 놓칠 수 있어요.";

    action =
      "처음부터 크게 벌이기보다 지금 끝낼 수 있는 작업부터 하나씩 내놓는 편이 좋습니다.";
  } else {
    headline = `${yearGanzhi}, 여러 변화를 서두르지 않고 살펴볼 해`;

    summary =
      "한 가지 일이 크게 바뀌기보다 업무와 돈, 관계에서 작은 변화가 나란히 이어질 수 있어요. 당장 결론을 내리기보다 반복해서 눈에 들어오는 장면을 살펴보는 편이 좋습니다.";

    career =
      "새 일을 서둘러 고르기보다 지금 맡은 업무에서 자꾸 막히는 부분과 잘 풀리는 부분을 먼저 확인해두면 좋습니다.";

    money =
      "큰 금액을 움직이기보다 매달 들어오고 나가는 돈을 일정하게 유지하는 일이 먼저예요.";

    relationship =
      "사람마다 원하는 거리와 대화 방식이 다르게 느껴질 수 있어요. 상대의 반응을 미리 단정하지 말고 필요한 부분을 직접 묻는 편이 좋습니다.";

    caution =
      "눈앞의 상황마다 결정을 바꾸면 시간과 돈을 함께 쓰고도 남는 것이 적을 수 있어요.";

    action =
      "올해 꼭 남기고 싶은 결과 한 가지를 정해두면, 여러 제안 앞에서도 무엇을 먼저 할지 판단하기 쉬워집니다.";
  }

  return {
    yearGanzhi,
    dayStem,
    currentDaeunGanzhi,
    headline,
    summary,
    career,
    money,
    relationship,
    caution,
    action,
    keywords: yearlyKeywords,
  };
}
