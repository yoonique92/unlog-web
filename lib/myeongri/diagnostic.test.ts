import { describe, expect, it } from "vitest";
import { runSajuDiagnostic } from "./diagnostic";

const baseInput = {
  birthDate: "1992-01-14",
  birthTime: "13:00",
  gender: "female" as const,
  calendar: "solar" as const,
  timezone: "Asia/Seoul",
};

describe("runSajuDiagnostic", () => {
  it("현재 운영 -30분 경로와 무보정 경로의 실제 전달 시각을 함께 보여준다", () => {
    const report = runSajuDiagnostic(baseInput);

    expect(report.currentMinus30.time.effective.isoLike).toBe(
      "1992-01-14T12:30",
    );
    expect(report.unadjusted.time.effective.isoLike).toBe(
      "1992-01-14T13:00",
    );
    expect(report.currentMinus30.time.ssajuInput.hour).toBe(12);
    expect(report.currentMinus30.time.ssajuInput.minute).toBe(30);
    expect(report.unadjusted.time.ssajuInput.hour).toBe(13);
    expect(report.unadjusted.time.ssajuInput.minute).toBe(0);
  });

  it("자정 이전으로 넘어가는 -30분 날짜 롤백을 노출한다", () => {
    const report = runSajuDiagnostic({
      ...baseInput,
      birthDate: "2000-01-02",
      birthTime: "00:10",
    });

    expect(report.currentMinus30.time.effective.isoLike).toBe(
      "2000-01-01T23:40",
    );
    expect(report.unadjusted.time.effective.isoLike).toBe(
      "2000-01-02T00:10",
    );
  });

  it("십성과 두 신강도 엔진의 세부 데이터를 함께 제공한다", () => {
    const report = runSajuDiagnostic(baseInput);

    expect(report.currentMinus30.dayMaster.stem).toHaveLength(1);
    expect(report.currentMinus30.tenGods.stems.year).toBeTruthy();
    expect(report.currentMinus30.tenGods.hiddenStems.length).toBeGreaterThan(0);
    expect(Number.isFinite(report.currentMinus30.strength.legacy.score)).toBe(
      true,
    );
    expect(Number.isFinite(report.currentMinus30.strength.myeongri.score)).toBe(
      true,
    );
    expect(
      report.currentMinus30.strength.myeongri.contributions.length,
    ).toBeGreaterThan(0);
  });

  it("기대값 검증은 앞 단계 불일치 시 뒤 단계를 중단한다", () => {
    const first = runSajuDiagnostic(baseInput);
    const report = runSajuDiagnostic({
      ...baseInput,
      expectedPillars: {
        year: first.currentMinus30.pillars.year,
        month: "불일치",
        day: first.currentMinus30.pillars.day,
        hour: first.currentMinus30.pillars.hour ?? "",
      },
    });

    expect(report.comparison[0].currentVerdict).toBe("match");
    expect(report.comparison[1].currentVerdict).toBe("mismatch");
    expect(report.comparison[2].currentVerdict).toBe("not_checked");
    expect(report.comparison[3].currentVerdict).toBe("not_checked");
  });
});
