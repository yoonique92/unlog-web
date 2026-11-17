import type { TodayCategoryScores } from "./todayFortuneCategoryScores";

type TodayFortuneScoreInput = {
  scores: TodayCategoryScores;
};

export function calculateTodayFortuneScore({
  scores,
}: TodayFortuneScoreInput) {
  /*
    단순 평균도 가능하지만,
    홈의 "오늘 전체 흐름"이라는 성격상

    직장 / 건강 / 대인에
    아주 약간의 가중치를 줍니다.
  */

  const weightedTotal =
    scores.love * 1 +
    scores.money * 1 +
    scores.career * 1.1 +
    scores.study * 0.9 +
    scores.health * 1.1 +
    scores.people * 1;

  const totalWeight =
    1 +
    1 +
    1.1 +
    0.9 +
    1.1 +
    1;

  const score =
    weightedTotal / totalWeight;

  /*
    최종 총점은 55 ~ 95
  */
  return Math.min(
    Math.max(
      Math.round(score),
      55
    ),
    95
  );
}