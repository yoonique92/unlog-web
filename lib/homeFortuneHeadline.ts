/**
 * 홈에서는 상세 운세의 의미를 유지하되, 반복되는 서술부를 덜어
 * 한눈에 읽히는 문장으로 보여줍니다.
 */
export function getHomeFortuneHeadline(headline: string) {
  const shortenedHeadline = headline
    .replace(
      /기대 이상의 결과로 이어질 가능성이 높은 날이에요\.$/,
      "기대 이상의 결과가 보여요."
    )
    .replace(
      /좋은 성과를 기대해볼 수 있는 날이에요\.$/,
      "좋은 성과가 기대돼요."
    )
    .replace(
      /기대해볼 만한 결과로 이어지기 좋은 날이에요\.$/,
      "기대할 만한 결과가 보여요."
    )
    .replace(
      /(?:실질적인 |좋은 )?결과로 이어지기 좋은 날이에요\.$/,
      "좋은 결과가 기대돼요."
    )
    .replace(/ 필요한 날이에요\.$/, " 필요해요.")
    .replace(/ 중요한 날이에요\.$/, " 중요해요.")
    .replace(/ 살아나는 날이에요\.$/, " 살아나요.")
    .replace(/ 이어지는 날이에요\.$/, " 이어져요.")
    .replace(/ 나타나는 날이에요\.$/, " 나타나요.");

  const recommendationEndings: Array<[
    string,
    string,
  ]> = [
    ["해보기 좋은 날이에요.", "해보세요."],
    ["보기 좋은 날이에요.", "보세요."],
    ["하기 좋은 날이에요.", "하기 좋아요."],
    ["세우기 좋은 날이에요.", "세워보세요."],
    ["펼치기 좋은 날이에요.", "펼쳐보세요."],
    ["챙기기 좋은 날이에요.", "챙겨보세요."],
    ["배우기 좋은 날이에요.", "배워보세요."],
    ["보여주기 좋은 날이에요.", "보여주세요."],
    ["잡기 좋은 날이에요.", "잡아보세요."],
    ["풀어가기 좋은 날이에요.", "풀어가보세요."],
    ["지키기 좋은 날이에요.", "지켜보세요."],
    ["움직이기 좋은 날이에요.", "움직여보세요."],
    ["옮기기 좋은 날이에요.", "옮겨보세요."],
    ["만들기 좋은 날이에요.", "만들어보세요."],
    ["이어가기 좋은 날이에요.", "이어가보세요."],
    ["이어지기 좋은 날이에요.", "이어져요."],
  ];

  if (
    shortenedHeadline ===
    "배운 내용을 실제 성과로 연결하기 좋은 날이에요."
  ) {
    return "배운 내용을 실제 성과로 연결하기 좋아요.";
  }

  if (
    shortenedHeadline ===
    "적극적으로 움직일수록 기회를 발견하기 좋은 날이에요."
  ) {
    return "적극적으로 움직이면 새로운 기회가 보여요.";
  }

  for (const [ending, replacement] of recommendationEndings) {
    if (shortenedHeadline.endsWith(ending)) {
      return `${shortenedHeadline.slice(0, -ending.length)}${replacement}`;
    }
  }

  return shortenedHeadline;
}
