/*
  오늘 총점에 따라
  메인 한 줄 운세의 긍정 강도를 조절합니다.

  80점 미만:
  기존 문구 그대로 사용

  80 ~ 84점:
  좋은 흐름이 분명한 날

  85 ~ 89점:
  꽤 강한 호조

  90점 이상:
  매우 좋은 흐름
*/

export function getScoreAdjustedHeadline(
  headline: string,
  score: number
) {
  /*
    80점 미만은
    기존 headline 그대로 사용
  */
  if (score < 80) {
    return headline;
  }

  /*
    기존 문장의 핵심 앞부분을 유지하면서
    결과 표현만 점수대별로 바꿉니다.
  */

  const resultPhrases = [
    "실질적인 결과로 이어지기 좋은 날이에요.",
    "좋은 결과로 이어지기 좋은 날이에요.",
    "기대해볼 만한 결과로 이어지기 좋은 날이에요.",
    "기대 이상의 결과로 이어지기 좋은 날이에요.",
    "좋은 성과를 기대해볼 수 있는 날이에요.",
    "성과로 이어지기 좋은 날이에요.",
  ];

  /*
    현재 headline에
    결과 관련 표현이 있는지 확인
  */
  const matchedPhrase =
    resultPhrases.find((phrase) =>
      headline.includes(phrase)
    );

  /*
    결과 관련 문구라면
    점수대별 표현으로 교체
  */
  if (matchedPhrase) {
    /*
      90점 이상
    */
    if (score >= 90) {
      return headline.replace(
        matchedPhrase,
        "기대 이상의 결과를 바라볼 만해요."
      );
    }

    /*
      85 ~ 89점
    */
    if (score >= 85) {
      return headline.replace(
        matchedPhrase,
        "기대해볼 만한 결과가 가까워요."
      );
    }

    /*
      80 ~ 84점
    */
    return headline.replace(
      matchedPhrase,
      "좋은 결과를 기대해볼 만해요."
    );
  }

  /*
    이미 '~하기 좋은 날이에요'로 완성된 문장은
    뒤의 '좋은 날이에요'만 다시 확장하면 표현이 중첩됩니다.
  */
  if (
    headline.endsWith(
      "기 좋은 날이에요."
    )
  ) {
    return headline;
  }

  /*
    결과형 문장이 아닌 경우에는
    다른 표현들도 점수대에 맞게
    너무 과하지 않게 보정
  */

  const flowReplacements: Array<{
    before: string;
    score80: string;
    score85: string;
    score90: string;
  }> = [
    {
      before:
        "흐름이 좋아지는 날이에요.",

      score80:
        "하던 일이 한결 수월하게",

      score85:
        "준비한 일을 실제 결과로",

      score90:
        "준비한 만큼 만족스러운 결과를",
    },

    {
      before:
        "안정적으로 이어지는 날이에요.",

      score80:
        "해오던 일을 차분히 마무리할 때",

      score85:
        "익숙한 방식으로 좋은 결과를",

      score90:
        "하던 일과 새로운 제안을 함께",
    },

    {
      before:
        "좋은 날이에요.",

      score80:
        "평소보다 일이 수월하게",

      score85:
        "미뤄둔 일을 시작할 때",

      score90:
        "준비한 일을 자신 있게 꺼낼 때",
    },
  ];

  for (
    const {
      before,
      score80,
      score85,
      score90,
    } of flowReplacements
  ) {
    if (
      headline.includes(before)
    ) {
      if (score >= 90) {
        return headline.replace(
          before,
          score90
        );
      }

      if (score >= 85) {
        return headline.replace(
          before,
          score85
        );
      }

      return headline.replace(
        before,
        score80
      );
    }
  }

  /*
    등록된 표현이 없는 문장은
    억지로 바꾸지 않고 그대로 유지
  */
  return headline;
}
