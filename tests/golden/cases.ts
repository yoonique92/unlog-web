import type { GoldenCase } from "../../lib/myeongri/goldenTypes";

export type { GoldenCase, GoldenSource } from "../../lib/myeongri/goldenTypes";

export const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "GOLDEN-001",
    birth: { date: "1992-01-14", time: "13:00", calendar: "solar", gender: "female", timezone: "Asia/Seoul", locationNote: "인천광역시" },
    expected: {
      interpretive: {
        strength: { allowedLevels: ["balanced_strong", "strong", "very_strong"], consensus: 0.8, sourceIds: ["SOURCE-1788710581198", "SOURCE-1788710665732", "SOURCE-1788710689972", "SOURCE-1788710706188"] },
        johu: { preferredElements: ["fire"], sourceIds: ["SOURCE-1788710581198", "SOURCE-1788710706188"] },
      },
      deterministic: { yearPillar: "辛未", monthPillar: "辛丑", dayPillar: "己丑", hourPillar: "庚午" },
    },
    verification: {
      status: "cross_checked",
      sources: [
        { id: "SOURCE-1788710581198", type: "manse_calculator", name: "포스텔러", checkedAt: "2026-09-07", reference: "사용자 제공 캡처", result: "원국 辛未 / 辛丑 / 己丑 / 庚午.\n인천 지역시 보정 후 약 12:26으로 표시.\n신강신약: 중화신강.\n억부용신: 木.\n조후용신: 火.", notes: "원국 및 지역시 보정, 신강신약, 억부용신, 조후용신이 화면에서 확인됨.\n중화신강은 운로그 StrengthLevel과 직접 1:1 대응시키지 않고\nbalanced_strong~strong 방향의 참고 근거로 사용." },
        { id: "SOURCE-1788710665732", type: "manse_calculator", name: "사주월드", checkedAt: "2026-09-07", reference: "사용자 제공 캡처", result: "원국 辛未 / 辛丑 / 己丑 / 庚午.\n신강신약 점수 70/100.\n신강 판정.\n격국: 비견격.", notes: "신강 판정의 독립 근거로 사용.\n격국은 외부 참고값으로만 보관하고 GOLDEN-001 expected 격국에는 아직 반영하지 않음." },
        { id: "SOURCE-1788710689972", type: "manse_calculator", name: "점신", checkedAt: "2026-09-07", reference: "사용자 제공 캡처", result: "원국 辛未 / 辛丑 / 己丑 / 庚午.\n신강신약 점수 70.\n신강 판정.", notes: "0~39 신약, 40~60 중화, 61 이상 신강 기준으로 70점 신강으로 표시됨.\nStrength의 강한 방향을 교차검증하는 근거로 사용." },
        { id: "SOURCE-1788710706188", type: "manse_calculator", name: "사주플러스", checkedAt: "2026-09-07", result: "원국 辛未 / 辛丑 / 己丑 / 庚午.\n신강 방향: 태강.\n격국: 식신격 + 비견격.\n조후용신: 火.", reference: "사용자 제공 캡처", notes: "'태강'은 운로그 very_strong과 직접 동일값으로 취급하지 않음.\n조후용신 火는 포스텔러 결과와 교차 확인됨." },
      ],
    },
    referenceResults: [
      { sourceId: "SOURCE-1788710581198", yearPillar: "辛未", monthPillar: "辛丑", dayPillar: "己丑", hourPillar: "庚午" },
      { sourceId: "SOURCE-1788710665732", yearPillar: "辛未", monthPillar: "辛丑", dayPillar: "己丑", hourPillar: "庚午" },
      { sourceId: "SOURCE-1788710689972", yearPillar: "辛未", monthPillar: "辛丑", dayPillar: "己丑", hourPillar: "庚午" },
      { sourceId: "SOURCE-1788710706188", yearPillar: "辛未", monthPillar: "辛丑", dayPillar: "己丑", hourPillar: "庚午" },
    ],
    notes: [
      "[신강 방향 검증 사례] 외부 참고 판정은 중화신강~신강이며, 일부 서비스의 관측 점수는 약 70이다.",
      "현재 신규 myeongri 관측 결과는 93 / very_strong이다. 방향은 일치하지만 강도를 과대평가할 가능성이 있다.",
      "93이라는 수치와 very_strong 단계는 정답 점수나 단일 회귀 기대값으로 고정하지 않는다. balanced_strong / strong / very_strong 범위의 강한 방향만 검증한다.",
      "[향후 검토 TODO] 외부에서 중화로 판단되는 사례까지 확보한 뒤 아래 항목을 함께 비교한다.",
      "1. 월령과 통근의 큰 양의 기여가 동시에 적용되어 강한 방향을 과도하게 중첩 평가하는지 검증한다.",
      "2. 같은 지지가 표면 오행 생조와 지장간 통근으로 이중 반영되어 과대평가되는지 검증한다.",
      "3. 뿌리가 여러 개일 때 통근 기여가 단순 누적되어 현재 관측치 +29처럼 지나치게 커지는지 검증한다.",
      "4. 통근으로 인정되지 않는 지장간의 식상·재성·관성 작용이 빠져 강한 사주를 더 강하게 계산하는지 검증한다.",
      "5. 丑월 같은 계절 상태를 단순 동일 오행 +18로 처리하는 것이 과한지 검증한다.",
      "이 TODO는 검토 기록이며 현재 가중치·임계값·통근 공식·지장간 공식·운영 연결의 변경을 의미하지 않는다.",
    ].join("\n"),
  },
  {
    id: "GOLDEN-002",
    birth: { date: "1994-03-15", time: "14:30", calendar: "solar", gender: "male", timezone: "Asia/Seoul", locationNote: "춘천시" },
    expected: {
      interpretive: {
        strength: { allowedLevels: ["very_weak", "weak", "balanced_weak"], consensus: 0.9, sourceIds: ["SOURCE-1788710581198", "SOURCE-1788710689972"] },
        johu: { preferredElements: [], sourceIds: [] },
        geukguk: { acceptedCandidates: ["jeongjae", "pyeonjae"], sourceIds: ["SOURCE-1788710689972", "SOURCE-1788711325140", "SOURCE-1788711338748", "SOURCE-1788711367658", "SOURCE-1788711413788"] },
      },
      deterministic: { yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
    },
    verification: {
      status: "cross_checked",
      sources: [
        { id: "SOURCE-1788710581198", type: "manse_calculator", name: "포스텔러", checkedAt: "2026-09-07", reference: "사용자 제공 캡처", result: "원국 甲戌 / 丁卯 / 庚子 / 癸未.\n춘천 지역시 보정 후 약 14:00으로 표시.\n신약 판정.\n억부용신: 土.", notes: "신강신약의 약한 방향을 확인하는 독립 근거.\n억부용신 土는 현재 단일 출처이므로 Golden expected에는 아직 반영하지 않음." },
        { id: "SOURCE-1788710689972", type: "manse_calculator", name: "점신", checkedAt: "2026-09-07", reference: "사용자 제공 캡처", result: "원국 甲戌 / 丁卯 / 庚子 / 癸未.\n신강신약 점수 20.\n신약 판정.\n격국 화면에서 정재격과 편재격이 각각 표시됨.", notes: "Strength의 약한 방향과 정재·편재 격국 후보의 교차검증 근거로 사용." },
        { id: "SOURCE-1788711325140", type: "manse_calculator", name: "더큼만세력", checkedAt: "2026-09-07", result: "격국: 편재격.", reference: "사용자 제공 캡처", notes: "편재격 accepted candidate의 독립 근거." },
        { id: "SOURCE-1788711338748", type: "manse_calculator", name: "파이브무브", checkedAt: "2026-09-07", result: "격국: 편재격.\n격국 구조상 천간 용신 편재, 지지 용신 정재.\n천간 상신 정관, 지지 상신 정인.", reference: "사용자 제공 캡처", notes: "여기서의 용신·상신은 격국 구조의 십성 역할로 분류.\n억부용신 또는 조후용신 expected에는 사용하지 않음." },
        { id: "SOURCE-1788711367658", type: "manse_calculator", name: "궁합닷컴", checkedAt: "2026-09-07", result: "격국: 정재격.\n부격: 상관격.\n조후용신: 丁.\n용신보좌: 甲, 丙, 庚.", notes: "정재격 accepted candidate의 독립 근거.\n조후용신 丁火는 단일 출처이므로 현재 Golden johu expected에는 반영하지 않음.", reference: "사용자 제공 캡처" },
        { id: "SOURCE-1788711413788", type: "manse_calculator", name: "사주풀이 도우미", checkedAt: "2026-09-07", result: "격국 후보로 편재격과 정재격이 정격으로 표시됨.", reference: "사용자 제공 캡처", notes: "편재·정재가 모두 주요 격국 후보라는 교차 근거로 사용." },
      ],
    },
    referenceResults: [
      { sourceId: "SOURCE-1788710581198", yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
      { sourceId: "SOURCE-1788710689972", hourPillar: "癸未", dayPillar: "庚子", monthPillar: "丁卯", yearPillar: "甲戌" },
      { sourceId: "SOURCE-1788711325140", yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
      { sourceId: "SOURCE-1788711338748", yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
      { sourceId: "SOURCE-1788711367658", yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
      { sourceId: "SOURCE-1788711413788", yearPillar: "甲戌", monthPillar: "丁卯", dayPillar: "庚子", hourPillar: "癸未" },
    ],
    notes: [
      "[신약 방향 검증 사례] 외부 참고 판정은 신약이며, 현재 신규 myeongri 관측 결과는 30 / weak이다.",
      "30이라는 수치는 정답 점수나 회귀 기대값으로 고정하지 않는다. very_weak / weak / balanced_weak 범위의 약한 방향만 검증한다.",
      "[향후 검토 TODO] 추가 신약·중화·신강 사례가 충분히 쌓인 뒤 아래 항목을 함께 비교한다.",
      "1. 현재 통근은 일간과 정확히 같은 천간만 인정하므로 庚 일간에서 戌 지장간 辛金은 통근 점수 0이다.",
      "2. 지장간의 인성·비겁·식상·재성·관성을 최종 신강도에 개별 세력으로 거의 반영하지 않는다.",
      "3. 지지 표면 오행과 지장간 실제 세력을 어느 수준까지 함께 반영할지 검증이 필요하다.",
      "4. 월령은 단순 오행 생극 관계 중심이므로 계절 왕쇠를 더 세밀하게 반영할 필요가 있는지 검증이 필요하다.",
      "이 TODO는 검토 기록이며 현재 가중치·임계값·통근 공식·지장간 반영 방식의 변경을 의미하지 않는다.",
    ].join("\n"),
  },
];
