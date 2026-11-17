import type { TodayFortune } from "./todayFortune";

type TenGodPosition = {
  stem: string;
  branch: string;
};

type TenGods = {
  year: TenGodPosition;
  month: TenGodPosition;
  day: TenGodPosition;
  hour: TenGodPosition;
};

type FiveElements = {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
};

type PersonalizeInput = {
  fortune: TodayFortune;
  tenGods: TenGods;
  fiveElements: FiveElements;
  strength: string;
};

function countTenGods(tenGods: TenGods) {
  const counts: Record<string, number> = {};

  const values = [
    tenGods.year.stem,
    tenGods.year.branch,
    tenGods.month.stem,
    tenGods.month.branch,
    tenGods.day.branch,
    tenGods.hour.stem,
    tenGods.hour.branch,
  ];

  values.forEach((tenGod) => {
    if (!tenGod || tenGod === "(일간)") {
      return;
    }

    counts[tenGod] = (counts[tenGod] || 0) + 1;
  });

  return counts;
}

function getCount(
  counts: Record<string, number>,
  names: string[]
) {
  return names.reduce(
    (sum, name) => sum + (counts[name] || 0),
    0
  );
}

export function personalizeTodayFortune({
  fortune,
  tenGods,
  fiveElements,
  strength,
}: PersonalizeInput): TodayFortune {
  const counts = countTenGods(tenGods);

  const companionCount = getCount(
    counts,
    ["비견", "겁재"]
  );

  const expressionCount = getCount(
    counts,
    ["식신", "상관"]
  );

  const wealthCount = getCount(
    counts,
    ["편재", "정재"]
  );

  const officerCount = getCount(
    counts,
    ["편관", "정관"]
  );

  const resourceCount = getCount(
    counts,
    ["편인", "정인"]
  );

  const personalizedFortunes =
    fortune.fortunes.map((item) => {
      /*
        ❤️ 연애운
        표현성 + 관계 속 자기주도 성향을 참고
      */
      if (item.title.includes("연애운")) {
        if (expressionCount >= 2) {
          return {
            ...item,
            comment:
              "솔직하게 말하면 대화가 한결 편해져요.",
          };
        }

        if (companionCount >= 3) {
          return {
            ...item,
            comment:
              "내 마음만큼 상대의 속도도 살펴보세요.",
          };
        }

        return item;
      }

      /*
        💰 금전운
        재성 + 겁재 성향 참고
      */
      if (item.title.includes("금전운")) {
        if (wealthCount >= 2) {
          return {
            ...item,
            comment:
              "들어오고 나갈 돈을 계획 안에서 챙겨보세요.",
          };
        }

        if ((counts["겁재"] || 0) >= 2) {
          return {
            ...item,
            comment:
              "즉흥적인 지출은 한 번 더 생각해보세요.",
          };
        }

        return item;
      }

      /*
        💼 직장운
        관성 + 식상 참고
      */
      if (item.title.includes("직장운")) {
        if (officerCount >= 2) {
          return {
            ...item,
            comment:
              "맡은 일을 순서대로 챙기면 부담이 줄어요.",
          };
        }

        if (expressionCount >= 2) {
          return {
            ...item,
            comment:
              "아이디어를 말로만 두지 말고 결과로 보여주세요.",
          };
        }

        return item;
      }

      /*
        📚 학업운
        인성 + 식상 참고
      */
      if (item.title.includes("학업운")) {
        if (resourceCount >= 2) {
          return {
            ...item,
            comment:
              "배우고 정리하는 데 집중하기 좋은 날이에요.",
          };
        }

        if (expressionCount >= 2) {
          return {
            ...item,
            comment:
              "배운 내용을 직접 활용해보면 이해가 빨라져요.",
          };
        }

        return item;
      }

      /*
        🍀 건강운
        신강/신약 + 오행 쏠림 참고
      */
      if (item.title.includes("건강운")) {
        const strongestElement =
          Object.entries(fiveElements).sort(
            (a, b) => b[1] - a[1]
          )[0];

        if (strength.includes("약")) {
          return {
            ...item,
            comment:
              "한꺼번에 무리하지 말고 할 일을 나눠서 해보세요.",
          };
        }

        if (strength.includes("강")) {
          return {
            ...item,
            comment:
              "활동한 만큼 충분한 휴식도 챙겨주세요.",
          };
        }

        if (
          strongestElement &&
          strongestElement[1] >= 4
        ) {
          return {
            ...item,
            comment:
              "한 가지 일에 몰두했다면 쉬는 시간도 챙겨보세요.",
          };
        }

        return item;
      }

      return item;
    });

  console.log("V7 원국 개인화:", {
    counts,

    groups: {
      companion: companionCount,
      expression: expressionCount,
      wealth: wealthCount,
      officer: officerCount,
      resource: resourceCount,
    },
  });

  return {
    ...fortune,
    fortunes: personalizedFortunes,
  };
}
