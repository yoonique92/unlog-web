const stemColor: Record<string, string> = {
  갑: "푸른",
  을: "푸른",
  병: "붉은",
  정: "붉은",
  무: "황금",
  기: "황금",
  경: "하얀",
  신: "하얀",
  임: "검은",
  계: "검은",
  甲: "푸른",
  乙: "푸른",
  丙: "붉은",
  丁: "붉은",
  戊: "황금",
  己: "황금",
  庚: "하얀",
  辛: "하얀",
  壬: "검은",
  癸: "검은",
};

const branchAnimal: Record<string, string> = {
  자: "쥐",
  축: "소",
  인: "호랑이",
  묘: "토끼",
  진: "용",
  사: "뱀",
  오: "말",
  미: "양",
  신: "원숭이",
  유: "닭",
  술: "개",
  해: "돼지",
  子: "쥐",
  丑: "소",
  寅: "호랑이",
  卯: "토끼",
  辰: "용",
  巳: "뱀",
  午: "말",
  未: "양",
  申: "원숭이",
  酉: "닭",
  戌: "개",
  亥: "돼지",
};

export function getDayPillarCharacterName(dayPillar: string) {
  const color = stemColor[dayPillar.charAt(0)];
  const animal = branchAnimal[dayPillar.charAt(1)];

  return color && animal ? `${color} ${animal}` : null;
}
