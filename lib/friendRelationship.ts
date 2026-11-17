type FiveElement =
  | "목"
  | "화"
  | "토"
  | "금"
  | "수";

type YinYang =
  | "양"
  | "음";

export type FourPillars = {
  year: string;
  month: string;
  day: string;
  hour?: string;
};

type RelationshipInput = {
  myDayPillar: string;
  friendDayPillar: string;
  myPillars?: FourPillars;
  friendPillars?: FourPillars;

  todayStem?: string;
  todayBranch?: string;
};

const stemToKorean: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const branchToKorean: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

function normalizePillar(pillar: string) {
  const stem = pillar.charAt(0);
  const branch = pillar.charAt(1);
  return `${stemToKorean[stem] ?? stem}${branchToKorean[branch] ?? branch}`;
}

function normalizeFourPillars(pillars: FourPillars): FourPillars {
  return {
    year: normalizePillar(pillars.year),
    month: normalizePillar(pillars.month),
    day: normalizePillar(pillars.day),
    hour: pillars.hour ? normalizePillar(pillars.hour) : "",
  };
}

export type FriendRelationshipResult = {
  /*
    기본 인연
  */
  relationshipScore: number;
  relationshipLabel: string;
  relationshipEmoji: string;

  /*
    오늘 케미
  */
  todayChemistryScore: number;
  todayChemistryLabel: string;
  todayChemistryEmoji: string;

  /*
    기존 방향성 해석
  */
  friendToMe: string;
  friendToMeEmoji: string;

  meToFriend: string;
  meToFriendEmoji: string;

  /*
    로그 프렌즈 팝업용
    상대방이 나에게 어떤 존재인지
  */
  friendRoleTitle: string;
  friendRoleDescription: string;
};

/*
  =============================
  천간 정보
  =============================
*/

const stemInfo: Record<
  string,
  {
    element: FiveElement;
    yinYang: YinYang;
  }
> = {
  갑: {
    element: "목",
    yinYang: "양",
  },

  을: {
    element: "목",
    yinYang: "음",
  },

  병: {
    element: "화",
    yinYang: "양",
  },

  정: {
    element: "화",
    yinYang: "음",
  },

  무: {
    element: "토",
    yinYang: "양",
  },

  기: {
    element: "토",
    yinYang: "음",
  },

  경: {
    element: "금",
    yinYang: "양",
  },

  신: {
    element: "금",
    yinYang: "음",
  },

  임: {
    element: "수",
    yinYang: "양",
  },

  계: {
    element: "수",
    yinYang: "음",
  },
};

/*
  =============================
  지지 정보
  =============================
*/

const branchElement: Record<
  string,
  FiveElement
> = {
  자: "수",
  축: "토",
  인: "목",
  묘: "목",
  진: "토",
  사: "화",
  오: "화",
  미: "토",
  신: "금",
  유: "금",
  술: "토",
  해: "수",
};

/*
  =============================
  오행 관계
  =============================
*/

const generates: Record<
  FiveElement,
  FiveElement
> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const controls: Record<
  FiveElement,
  FiveElement
> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
};

/*
  =============================
  지지 합 / 충 / 해
  =============================
*/

const sixHarmonyPairs = [
  ["자", "축"],
  ["인", "해"],
  ["묘", "술"],
  ["진", "유"],
  ["사", "신"],
  ["오", "미"],
];

const clashPairs = [
  ["자", "오"],
  ["축", "미"],
  ["인", "신"],
  ["묘", "유"],
  ["진", "술"],
  ["사", "해"],
];

const harmPairs = [
  ["자", "미"],
  ["축", "오"],
  ["인", "사"],
  ["묘", "진"],
  ["신", "해"],
  ["유", "술"],
];

/*
  =============================
  공통 함수
  =============================
*/

function isPair(
  first: string,
  second: string,
  pairs: string[][]
) {
  return pairs.some(
    ([a, b]) =>
      (first === a &&
        second === b) ||
      (first === b &&
        second === a)
  );
}

function clampScore(
  score: number
) {
  return Math.min(
    Math.max(
      Math.round(score),
      55
    ),
    95
  );
}

/*
  =============================
  기본 인연 점수
  =============================
*/

function calculateRelationshipScore(
  myStem: string,
  myBranch: string,
  friendStem: string,
  friendBranch: string
) {
  const myInfo =
    stemInfo[myStem];

  const friendInfo =
    stemInfo[friendStem];

  if (
    !myInfo ||
    !friendInfo
  ) {
    return 72;
  }

  let score = 72;

  const myElement =
    myInfo.element;

  const friendElement =
    friendInfo.element;

  /*
    같은 오행
  */
  if (
    myElement ===
    friendElement
  ) {
    score += 8;
  }

  /*
    상생
  */
  if (
    generates[myElement] ===
      friendElement ||
    generates[friendElement] ===
      myElement
  ) {
    score += 10;
  }

  /*
    상극
  */
  if (
    controls[myElement] ===
      friendElement ||
    controls[friendElement] ===
      myElement
  ) {
    score -= 5;
  }

  /*
    음양
  */
  if (
    myInfo.yinYang !==
    friendInfo.yinYang
  ) {
    score += 4;
  } else {
    score += 2;
  }

  /*
    육합
  */
  if (
    isPair(
      myBranch,
      friendBranch,
      sixHarmonyPairs
    )
  ) {
    score += 10;
  }

  /*
    충
  */
  if (
    isPair(
      myBranch,
      friendBranch,
      clashPairs
    )
  ) {
    score -= 8;
  }

  /*
    해
  */
  if (
    isPair(
      myBranch,
      friendBranch,
      harmPairs
    )
  ) {
    score -= 4;
  }

  /*
    같은 일지
  */
  if (
    myBranch ===
    friendBranch
  ) {
    score += 5;
  }

  /*
    일지 오행
  */
  const myBranchElement =
    branchElement[myBranch];

  const friendBranchElement =
    branchElement[
      friendBranch
    ];

  if (
    myBranchElement &&
    friendBranchElement
  ) {
    if (
      myBranchElement ===
      friendBranchElement
    ) {
      score += 3;
    }

    if (
      generates[
        myBranchElement
      ] === friendBranchElement ||
      generates[
        friendBranchElement
      ] === myBranchElement
    ) {
      score += 4;
    }
  }

  return clampScore(
    score
  );
}

const pillarWeights: Array<{ key: keyof FourPillars; weight: number }> = [
  { key: "year", weight: 0.15 },
  { key: "month", weight: 0.25 },
  { key: "day", weight: 0.4 },
  { key: "hour", weight: 0.2 },
];

function calculateFullRelationshipScore(
  myPillars: FourPillars,
  friendPillars: FourPillars
) {
  let score = 0;
  let totalWeight = 0;

  for (const { key, weight } of pillarWeights) {
    const myPillar = myPillars[key];
    const friendPillar = friendPillars[key];
    if (!myPillar || !friendPillar) continue;

    score +=
      calculateRelationshipScore(
        myPillar.charAt(0),
        myPillar.charAt(1),
        friendPillar.charAt(0),
        friendPillar.charAt(1)
      ) * weight;
    totalWeight += weight;
  }

  score = totalWeight > 0 ? score / totalWeight : 72;

  const myBranches = Object.values(myPillars)
    .filter((pillar): pillar is string => Boolean(pillar))
    .map((pillar) => pillar.charAt(1));
  const friendBranches = Object.values(friendPillars)
    .filter((pillar): pillar is string => Boolean(pillar))
    .map((pillar) => pillar.charAt(1));

  let crossAdjustment = 0;
  for (const myBranch of myBranches) {
    for (const friendBranch of friendBranches) {
      if (isPair(myBranch, friendBranch, sixHarmonyPairs)) {
        crossAdjustment += 1.25;
      }
      if (isPair(myBranch, friendBranch, clashPairs)) {
        crossAdjustment -= 1.25;
      }
      if (isPair(myBranch, friendBranch, harmPairs)) {
        crossAdjustment -= 0.75;
      }
    }
  }

  return clampScore(score + Math.max(-8, Math.min(8, crossAdjustment)));
}

/*
  =============================
  오늘 일진이 한 사람에게
  미치는 흐름
  =============================
*/

function calculateDailyPersonScore(
  personStem: string,
  personBranch: string,
  todayStem: string,
  todayBranch: string
) {
  const personInfo =
    stemInfo[personStem];

  const todayInfo =
    stemInfo[todayStem];

  if (
    !personInfo ||
    !todayInfo
  ) {
    return 0;
  }

  let score = 0;

  const personElement =
    personInfo.element;

  const todayElement =
    todayInfo.element;

  if (
    personElement ===
    todayElement
  ) {
    score += 3;
  }

  if (
    generates[
      todayElement
    ] === personElement
  ) {
    score += 5;
  }

  if (
    generates[
      personElement
    ] === todayElement
  ) {
    score += 3;
  }

  if (
    controls[
      todayElement
    ] === personElement ||
    controls[
      personElement
    ] === todayElement
  ) {
    score -= 3;
  }

  if (
    isPair(
      personBranch,
      todayBranch,
      sixHarmonyPairs
    )
  ) {
    score += 5;
  }

  if (
    isPair(
      personBranch,
      todayBranch,
      clashPairs
    )
  ) {
    score -= 5;
  }

  if (
    isPair(
      personBranch,
      todayBranch,
      harmPairs
    )
  ) {
    score -= 3;
  }

  if (
    personBranch ===
    todayBranch
  ) {
    score += 2;
  }

  return score;
}

/*
  =============================
  오늘 케미 점수
  =============================
*/

function calculateTodayChemistryScore(
  relationshipScore: number,
  myStem: string,
  myBranch: string,
  friendStem: string,
  friendBranch: string,
  todayStem?: string,
  todayBranch?: string
) {
  if (
    !todayStem ||
    !todayBranch ||
    !stemInfo[todayStem] ||
    !branchElement[todayBranch]
  ) {
    return relationshipScore;
  }

  const myDailyScore =
    calculateDailyPersonScore(
      myStem,
      myBranch,
      todayStem,
      todayBranch
    );

  const friendDailyScore =
    calculateDailyPersonScore(
      friendStem,
      friendBranch,
      todayStem,
      todayBranch
    );

  const dailyAverage =
    (myDailyScore +
      friendDailyScore) /
    2;

  let todayScore =
    relationshipScore +
    dailyAverage;

  const difference =
    Math.abs(
      myDailyScore -
        friendDailyScore
    );

  if (difference >= 7) {
    todayScore -= 3;
  }

  return clampScore(
    todayScore
  );
}

function calculateFullTodayChemistryScore(
  relationshipScore: number,
  myPillars: FourPillars,
  friendPillars: FourPillars,
  todayStem?: string,
  todayBranch?: string
) {
  if (
    !todayStem ||
    !todayBranch ||
    !stemInfo[todayStem] ||
    !branchElement[todayBranch]
  ) {
    return relationshipScore;
  }

  const getPersonDailyScore = (pillars: FourPillars) =>
    (() => {
      let total = 0;
      let totalWeight = 0;

      for (const { key, weight } of pillarWeights) {
        const pillar = pillars[key];
        if (!pillar) continue;
        total +=
          calculateDailyPersonScore(
            pillar.charAt(0),
            pillar.charAt(1),
            todayStem,
            todayBranch
          ) * weight;
        totalWeight += weight;
      }

      return totalWeight > 0 ? total / totalWeight : 0;
    })();

  const myDailyScore = getPersonDailyScore(myPillars);
  const friendDailyScore = getPersonDailyScore(friendPillars);
  let todayScore = relationshipScore + (myDailyScore + friendDailyScore) / 2;

  if (Math.abs(myDailyScore - friendDailyScore) >= 7) {
    todayScore -= 3;
  }

  return clampScore(todayScore);
}

/*
  =============================
  점수 → 관계 라벨
  =============================
*/

function getRelationshipLabel(
  score: number
) {
  if (score >= 90) {
    return {
      label:
        "불꽃 단짝",
      emoji: "🔥",
    };
  }

  if (score >= 85) {
    return {
      label:
        "찰떡 호흡",
      emoji: "💫",
    };
  }

  if (score >= 80) {
    return {
      label:
        "든든한 인연",
      emoji: "💜",
    };
  }

  if (score >= 72) {
    return {
      label:
        "편안한 친구",
      emoji: "🌿",
    };
  }

  if (score >= 65) {
    return {
      label:
        "서로 다른 매력",
      emoji: "✨",
    };
  }

  return {
    label:
      "천천히 맞춰가는 사이",
    emoji: "🌱",
  };
}

/*
  =============================
  기존 방향성 해석
  =============================
*/

function getDirectionalMeaning(
  giverElement: FiveElement,
  receiverElement: FiveElement
) {
  if (
    giverElement ===
    receiverElement
  ) {
    const meanings: Record<
      FiveElement,
      {
        text: string;
        emoji: string;
      }
    > = {
      목: {
        text:
          "같은 방향을 바라보게 하는 사람",
        emoji: "🌳",
      },

      화: {
        text:
          "열정을 함께 키워주는 사람",
        emoji: "🔥",
      },

      토: {
        text:
          "안정감을 나눌 수 있는 사람",
        emoji: "🏡",
      },

      금: {
        text:
          "생각을 선명하게 해주는 사람",
        emoji: "✨",
      },

      수: {
        text:
          "마음을 깊게 이해해주는 사람",
        emoji: "💧",
      },
    };

    return meanings[
      giverElement
    ];
  }

  if (
    generates[
      giverElement
    ] === receiverElement
  ) {
    const meanings: Record<
      FiveElement,
      {
        text: string;
        emoji: string;
      }
    > = {
      목: {
        text:
          "성장을 밀어주는 사람",
        emoji: "🌱",
      },

      화: {
        text:
          "용기를 북돋아주는 사람",
        emoji: "🔥",
      },

      토: {
        text:
          "중심을 잡아주는 사람",
        emoji: "🌳",
      },

      금: {
        text:
          "생각을 정리해주는 사람",
        emoji: "💎",
      },

      수: {
        text:
          "새로운 가능성을 열어주는 사람",
        emoji: "💧",
      },
    };

    return meanings[
      giverElement
    ];
  }

  if (
    generates[
      receiverElement
    ] === giverElement
  ) {
    const meanings: Record<
      FiveElement,
      {
        text: string;
        emoji: string;
      }
    > = {
      목: {
        text:
          "새로운 방향을 보여주는 사람",
        emoji: "🌿",
      },

      화: {
        text:
          "마음을 움직이게 하는 사람",
        emoji: "🔥",
      },

      토: {
        text:
          "현실적인 감각을 더해주는 사람",
        emoji: "🏡",
      },

      금: {
        text:
          "결단력을 키워주는 사람",
        emoji: "⚡",
      },

      수: {
        text:
          "생각의 폭을 넓혀주는 사람",
        emoji: "💡",
      },
    };

    return meanings[
      giverElement
    ];
  }

  if (
    controls[
      giverElement
    ] === receiverElement
  ) {
    return {
      text:
        "새로운 자극을 주는 사람",
      emoji: "⚡",
    };
  }

  if (
    controls[
      receiverElement
    ] === giverElement
  ) {
    return {
      text:
        "나를 돌아보게 하는 사람",
      emoji: "🪞",
    };
  }

  return {
    text:
      "서로 다른 매력을 발견하게 하는 사람",
    emoji: "✨",
  };
}

/*
  =============================
  로그 프렌즈 팝업용 관계 역할

  친구가 "나에게"
  어떤 존재인지 보여줍니다.
  =============================
*/

function getFriendRole(
  friendElement: FiveElement,
  myElement: FiveElement
) {
  /*
    친구가 나를 생함
    → 나에게 힘을 보태는 관계
  */
  if (
    generates[
      friendElement
    ] === myElement
  ) {
    const supportRoles: Record<
      FiveElement,
      {
        title: string;
        description: string;
      }
    > = {
      목: {
        title:
          "🩵내 편이 되어주는 인연",
        description:
          "함께 있으면 마음이 든든하고 힘을 얻는 사이예요.",
      },

      화: {
        title:
          "🩵내 편이 되어주는 인연",
        description:
          "함께 있으면 마음이 든든하고 힘을 얻는 사이예요.",
      },

      토: {
        title:
          "🩵내 편이 되어주는 인연",
        description:
          "함께 있으면 마음이 든든하고 힘을 얻는 사이예요.",
      },

      금: {
        title:
          "🩵내 편이 되어주는 인연",
        description:
          "함께 있으면 마음이 든든하고 힘을 얻는 사이예요.",
      },

      수: {
        title:
          "🩵내 편이 되어주는 인연",
        description:
          "함께 있으면 마음이 든든하고 힘을 얻는 사이예요.",
      },
    };

    return supportRoles[
      friendElement
    ];
  }

  /*
    내가 친구를 생함
    → 내가 많이 마음을 쓰지만,
      친구가 새로운 가능성을 자극
  */
  if (
    generates[
      myElement
    ] === friendElement
  ) {
    const inspireRoles: Record<
      FiveElement,
      {
        title: string;
        description: string;
      }
    > = {
      목: {
        title:
          "💫힘이 되어주고 싶은 인연",
        description:
          "필요할 때 먼저 힘을 보태주고 싶은 마음이 드는 사이예요.",
      },

      화: {
        title:
          "💫힘이 되어주고 싶은 인연",
        description:
          "필요할 때 먼저 힘을 보태주고 싶은 마음이 드는 사이예요.",
      },

      토: {
        title:
          "💫힘이 되어주고 싶은 인연",
        description:
          "필요할 때 먼저 힘을 보태주고 싶은 마음이 드는 사이예요.",
      },

      금: {
        title:
          "💫힘이 되어주고 싶은 인연",
        description:
          "필요할 때 먼저 힘을 보태주고 싶은 마음이 드는 사이예요.",
      },

      수: {
        title:
          "💫힘이 되어주고 싶은 인연",
        description:
          "필요할 때 먼저 힘을 보태주고 싶은 마음이 드는 사이예요.",
      },
    };

    return inspireRoles[
      friendElement
    ];
  }

  /*
    같은 오행
  */
  if (
    friendElement ===
    myElement
  ) {
    const sameRoles: Record<
      FiveElement,
      {
        title: string;
        description: string;
      }
    > = {
      목: {
        title:
          "💞마음이 잘 통하는 인연",
        description:
          "서로를 편하게 이해할 수 있는 사이예요.",
      },

      화: {
        title:
          "💞마음이 잘 통하는 인연",
        description:
          "서로를 편하게 이해할 수 있는 사이예요.",
      },

      토: {
        title:
          "💞마음이 잘 통하는 인연",
        description:
          "서로를 편하게 이해할 수 있는 사이예요.",
      },

      금: {
        title:
          "💞마음이 잘 통하는 인연",
        description:
          "서로를 편하게 이해할 수 있는 사이예요.",
      },

      수: {
        title:
          "💞마음이 잘 통하는 인연",
        description:
          "서로를 편하게 이해할 수 있는 사이예요.",
      },
    };

    return sameRoles[
      friendElement
    ];
  }

  /*
    친구가 나를 극함
    → 나를 긴장시키고 돌아보게 하는 관계
  */
  if (
    controls[
      friendElement
    ] === myElement
  ) {
    return {
      title:
        "🌿나를 성장하게 하는 인연",

      description:
        "함께할수록 한층 성장하는 사이예요.",
    };
  }

  /*
    내가 친구를 극함
    → 친구가 나에게 자극/변화를 줌
  */
  if (
    controls[
      myElement
    ] === friendElement
  ) {
    return {
      title:
        "🌼균형을 맞춰가는 인연",

      description:
        "서로 다른 점을 이해하며 조금씩 균형을 맞춰가는 사이예요.",
    };
  }

  return {
    title:
      "✨ 새로운 면을 보여주는 인연",

    description:
      "함께할수록 내가 몰랐던 생각과 감정을 발견하게 돼요",
  };
}

/*
  =============================
  최종 결과
  =============================
*/

export function getFriendRelationship({
  myDayPillar,
  friendDayPillar,
  myPillars,
  friendPillars,
  todayStem,
  todayBranch,
}: RelationshipInput): FriendRelationshipResult {
  const normalizedMyPillars = myPillars
    ? normalizeFourPillars(myPillars)
    : undefined;
  const normalizedFriendPillars = friendPillars
    ? normalizeFourPillars(friendPillars)
    : undefined;
  const bothTimesKnown = Boolean(
    normalizedMyPillars?.hour && normalizedFriendPillars?.hour
  );
  const comparableMyPillars = normalizedMyPillars
    ? { ...normalizedMyPillars, hour: bothTimesKnown ? normalizedMyPillars.hour : "" }
    : undefined;
  const comparableFriendPillars = normalizedFriendPillars
    ? {
        ...normalizedFriendPillars,
        hour: bothTimesKnown ? normalizedFriendPillars.hour : "",
      }
    : undefined;
  const normalizedMyDayPillar = normalizePillar(
    normalizedMyPillars?.day ?? myDayPillar
  );
  const normalizedFriendDayPillar = normalizePillar(
    normalizedFriendPillars?.day ?? friendDayPillar
  );
  const normalizedTodayStem = stemToKorean[todayStem ?? ""] ?? todayStem;
  const normalizedTodayBranch =
    branchToKorean[todayBranch ?? ""] ?? todayBranch;

  const myStem =
    normalizedMyDayPillar.charAt(0);

  const myBranch =
    normalizedMyDayPillar.charAt(1);

  const friendStem =
    normalizedFriendDayPillar.charAt(0);

  const friendBranch =
    normalizedFriendDayPillar.charAt(1);

  /*
    값이 잘못 들어온 경우
  */
  if (
    !stemInfo[myStem] ||
    !stemInfo[friendStem] ||
    !branchElement[myBranch] ||
    !branchElement[
      friendBranch
    ]
  ) {
    return {
      relationshipScore: 72,

      relationshipLabel:
        "편안한 친구",

      relationshipEmoji:
        "🌿",

      todayChemistryScore: 72,

      todayChemistryLabel:
        "편안한 친구",

      todayChemistryEmoji:
        "🌿",

      friendToMe:
        "새로운 시선을 보여주는 사람",

      friendToMeEmoji:
        "✨",

      meToFriend:
        "편안함을 나누는 사람",

      meToFriendEmoji:
        "🌿",

      friendRoleTitle:
        "🌿 마음을 쉬게 하는 인연",

      friendRoleDescription:
        "함께 있으면 긴장이 풀리고 마음이 편안해져요",
    };
  }

  /*
    기본 인연
  */
  const relationshipScore =
    comparableMyPillars && comparableFriendPillars
      ? calculateFullRelationshipScore(
          comparableMyPillars,
          comparableFriendPillars
        )
      : calculateRelationshipScore(
          myStem,
          myBranch,
          friendStem,
          friendBranch
        );

  /*
    오늘 케미
  */
  const todayChemistryScore =
    comparableMyPillars && comparableFriendPillars
      ? calculateFullTodayChemistryScore(
          relationshipScore,
          comparableMyPillars,
          comparableFriendPillars,
          normalizedTodayStem,
          normalizedTodayBranch
        )
      : calculateTodayChemistryScore(
          relationshipScore,
          myStem,
          myBranch,
          friendStem,
          friendBranch,
          normalizedTodayStem,
          normalizedTodayBranch
        );

  const relationshipLabel =
    getRelationshipLabel(
      relationshipScore
    );

  const todayLabel =
    getRelationshipLabel(
      todayChemistryScore
    );

  const myElement =
    stemInfo[
      myStem
    ].element;

  const friendElement =
    stemInfo[
      friendStem
    ].element;

  /*
    기존 방향성
  */
  const friendToMe =
    getDirectionalMeaning(
      friendElement,
      myElement
    );

  const meToFriend =
    getDirectionalMeaning(
      myElement,
      friendElement
    );

  /*
    팝업용 역할
  */
  const friendRole =
    getFriendRole(
      friendElement,
      myElement
    );

  return {
    relationshipScore,

    relationshipLabel:
      relationshipLabel.label,

    relationshipEmoji:
      relationshipLabel.emoji,

    todayChemistryScore,

    todayChemistryLabel:
      todayLabel.label,

    todayChemistryEmoji:
      todayLabel.emoji,

    friendToMe:
      friendToMe.text,

    friendToMeEmoji:
      friendToMe.emoji,

    meToFriend:
      meToFriend.text,

    meToFriendEmoji:
      meToFriend.emoji,

    friendRoleTitle:
      friendRole.title,

    friendRoleDescription:
      friendRole.description,
  };
}
