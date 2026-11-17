import { describe, expect, it } from "vitest";
import {
  CAREER_SITUATIONS,
  type CareerSituationKey,
} from "../yearlyReadingContext";
import { buildYearlyCalculationSnapshot } from "./buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "./buildYearlyCareerCopy";
import { buildYearlyInterpretationFacts } from "./buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "./buildYearlyInterpretationSignals";
import { buildYearlyOverallCopy } from "./buildYearlyOverallCopy";
import { CAREER_CONTEXT_COPY_REGISTRY } from "./interpretationCopy/career";
import type { YearlyCalculationProfile } from "./types";

const PROFILE: YearlyCalculationProfile = {
  birthDate: "1992-01-14",
  birthHour: 13,
  birthMinute: 0,
  birthTimeUnknown: false,
  calendarType: "solar",
  gender: "female",
};

function fixture2032() {
  const snapshot = buildYearlyCalculationSnapshot({ profile: PROFILE, targetYear: 2032 });
  const facts = buildYearlyInterpretationFacts({ snapshot });
  return buildYearlyInterpretationSignals(facts);
}

const EMPLOYED_RESETTING_LINE = "현재 성과를 지키면서 새 역할의 권한·일정·기대 결과를 확인한 뒤 맡을 범위를 넓히는 쪽이 잘 맞아요.";

describe("buildYearlyCareerCopy", () => {
  it("covers every canonical career context", () => {
    const expectedKeys = CAREER_SITUATIONS.map(({ key }) => key);
    expect(Object.keys(CAREER_CONTEXT_COPY_REGISTRY)).toEqual(expectedKeys);

    for (const career of expectedKeys) {
      const copy = buildYearlyCareerCopy({ signals: fixture2032().career, career });
      expect(copy).toMatchObject({
        version: "yearly-copy-v1",
        section: "career",
        context: career,
      });
      expect(copy.headline.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
      expect(copy.tip.length).toBeGreaterThan(0);
    }
  });

  it.each([
    {
      career: "employed",
      headline: "맡은 일을 다지며 새로운 역할을 준비하는 해",
      body: `올해는 맡은 업무를 안정적으로 끝내려는 책임감과, 협업이나 새로운 제안을 통해 역할을 넓히고 싶은 마음이 함께 강해질 수 있습니다. 회사에서는 기존 책임을 그대로 안고 새 프로젝트나 역할 제안을 검토해야 하는 상황이 생기기 쉬워요. ${EMPLOYED_RESETTING_LINE}`,
      tip: "새 제안을 받으면 매력도만 보지 말고, 지금 업무와 함께 맡았을 때 책임 범위와 협업 조건이 분명한지 확인하세요.",
    },
    {
      career: "job_seeking",
      headline: "지원 전략과 원하는 역할을 다시 맞추는 해",
      body: "올해는 준비해 온 방향을 유지하려는 마음과 지원 범위를 넓혀보고 싶은 마음이 동시에 생길 수 있습니다. 익숙한 직무에 지원을 이어가면서도 다른 역할이나 조건의 공고를 두고 고민하는 일이 잦아질 수 있어요. 지원 수를 무작정 늘리기보다 기존 강점을 살릴 수 있는지, 면접에서 설명할 경험이 있는지를 비교하며 범위를 넓히는 쪽이 유리합니다.",
      tip: "새 공고가 눈에 들어오면 직무명보다 실제 업무와 면접에서 요구하는 경험이 내 준비 방향과 맞는지 살펴보세요.",
    },
    {
      career: "student",
      headline: "배운 것을 써보며 진로 선택지를 좁혀가는 해",
      body: "올해는 익숙한 공부 방식을 지키려는 마음과 전공 밖의 경험을 확인하고 싶은 마음이 함께 커질 수 있어요. 시험 준비를 이어가면서도 공모전, 프로젝트, 진로 활동 중 무엇을 더 챙길지 고민하는 장면이 생기기 쉽습니다. 공부 계획을 전부 바꾸기보다 현재 성과를 지키면서 관심 분야를 작은 결과물로 시험하는 방식이 잘 맞아요.",
      tip: "새 활동을 시작할 때는 시험과 과제 일정을 유지할 수 있는 분량인지부터 따져보세요.",
    },
    {
      career: "career_transition",
      headline: "쌓은 경험을 바탕으로 다음 직무를 준비하는 해",
      body: "올해는 지금까지 쌓은 경력을 지키려는 마음과 전혀 다른 역할을 경험하고 싶은 마음이 맞설 수 있어요. 현재 일을 이어가면서도 관심 직무의 채용 조건이나 필요한 역량을 자주 비교하게 될 수 있습니다. 바로 자리를 옮기기보다 기존 경력에서 가져갈 강점을 확인하고, 부족한 경험을 실제 과제나 교육으로 채운 뒤 판단하는 순서가 어울립니다.",
      tip: "관심 직무를 볼 때는 기대감보다 현재 경력으로 연결되는 업무와 새로 증명해야 할 역량을 구분해보세요.",
    },
    {
      career: "freelance_self_employed",
      headline: "프로젝트의 수익 구조와 운영 방식을 다시 짜는 해",
      body: "올해는 기존 일감을 안정적으로 유지하려는 마음과 새 거래처나 프로젝트를 확보하려는 마음이 동시에 커질 수 있습니다. 이미 진행 중인 일의 품질을 지키면서도 조건이 다른 제안을 검토해야 하는 장면이 생기기 쉬워요. 일감 수보다 실제 투입 시간과 수익 구조를 비교하고, 기존 거래를 해치지 않는 범위에서 새 프로젝트를 받는 방식이 알맞습니다.",
      tip: "새 일감은 단가만 보지 말고 수정 범위, 일정, 반복 거래 가능성까지 기존 프로젝트와 나란히 비교하세요.",
    },
  ] as const)("locks the 2032 $career copy", ({ career, headline, body, tip }) => {
    const copy = buildYearlyCareerCopy({ signals: fixture2032().career, career });

    expect(copy).toMatchObject({
      version: "yearly-copy-v1",
      section: "career",
      headline,
      tip,
      context: career,
      sourceSignalIds: [
        "career-annual-stem-jeongjae",
        "career-annual-branch-pyeonjae",
        "career-stage-jeol",
        "career-daeun-stem-pyeongwan",
      ],
    });
    expect(copy.body.startsWith(body)).toBe(true);
    expect(copy.body.split("\n\n")).toHaveLength(2);
  });

  it.each([
    ["homemaker", "내 시간을 확보해 새로운 활동을 준비하는 해"],
    ["retired", "앞으로 즐길 배움과 활동을 새로 찾는 해"],
  ] as const)("locks the remaining %s context", (career, headline) => {
    const copy = buildYearlyCareerCopy({ signals: fixture2032().career, career });
    expect(copy.headline).toBe(headline);
    expect(copy.context).toBe(career);
  });

  it("changes only copy when context changes and preserves source signals", () => {
    const signals = fixture2032().career;
    const before = structuredClone(signals);
    const employed = buildYearlyCareerCopy({ signals, career: "employed" });
    const seeking = buildYearlyCareerCopy({ signals, career: "job_seeking" });

    expect(employed).not.toEqual(seeking);
    expect(employed.sourceSignalIds).toEqual(seeking.sourceSignalIds);
    expect(signals).toEqual(before);
  });

  it("is deterministic when signal order changes", () => {
    const signals = fixture2032().career;
    const input = { signals, career: "student" as CareerSituationKey };
    expect(buildYearlyCareerCopy({ ...input, signals: [...signals].reverse() }))
      .toEqual(buildYearlyCareerCopy(input));
  });

  it("uses activity phase and handles missing daeun safely", () => {
    const annualOnly = fixture2032().career.filter(({ id }) => !id.startsWith("career-daeun-"));
    const copy = buildYearlyCareerCopy({ signals: annualOnly, career: "employed" });

    expect(copy.body).toContain(EMPLOYED_RESETTING_LINE);
    expect(copy.body).not.toContain("업무나 준비가 겹칠 때는");
    expect(copy.sourceSignalIds).toEqual([
      "career-annual-stem-jeongjae",
      "career-annual-branch-pyeonjae",
      "career-stage-jeol",
    ]);
  });

  it("uses caution as safe workload guidance", () => {
    const copy = buildYearlyCareerCopy({
      signals: fixture2032().career,
      career: "freelance_self_employed",
    });
    expect(copy.body).toContain("실제 투입 시간과 수익 구조를 비교하고");
    expect(copy.body).not.toMatch(/실패|해고|탈락|망한다/);
  });

  it("does not emit prohibited certainty or force major decisions", () => {
    const outputs = CAREER_SITUATIONS.map(({ key }) =>
      buildYearlyCareerCopy({ signals: fixture2032().career, career: key })
    );
    const text = JSON.stringify(outputs);

    expect(text).not.toMatch(/반드시|무조건|확실히|틀림없이|취업 성공|승진 확정|합격한다|퇴사한다|해고된다|사업이 대박 난다|사업이 망한다/);
    expect(text).not.toMatch(/퇴사하세요|이직하세요|창업하세요|휴학하세요/);
  });

  it("keeps established career signals and overall copy unchanged", () => {
    const signals = fixture2032();
    expect(signals.career.map(({ id }) => id)).toEqual([
      "career-annual-stem-jeongjae",
      "career-annual-branch-pyeonjae",
      "career-stage-jeol",
      "career-daeun-stem-pyeongwan",
      "career-daeun-branch-jeongin",
    ]);
    expect(buildYearlyOverallCopy(signals.overall)).toMatchObject({
      headline: "익숙한 기반을 지키며 새로운 길을 시험하는 해",
      tip: "새 제안이 눈에 들어오면 기존 생활을 바로 바꾸기보다, 실제로 병행할 수 있는 기간과 조건부터 확인해두는 편이 좋습니다.",
    });
    expect(buildYearlyOverallCopy(signals.overall).body.split("\n\n")).toHaveLength(2);
  });
});
