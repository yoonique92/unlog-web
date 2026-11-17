"use client";

import { useState } from "react";
import {
  runSajuDiagnostic,
  type DiagnosticPillarKey,
  type DiagnosticVerdict,
  type SajuDiagnosticModeResult,
  type SajuDiagnosticReport,
} from "@/lib/myeongri/diagnostic";

const PILLAR_KEYS: DiagnosticPillarKey[] = [
  "year",
  "month",
  "day",
  "hour",
];

const PILLAR_LABELS: Record<DiagnosticPillarKey, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

const VERDICT_LABELS: Record<DiagnosticVerdict, string> = {
  match: "일치",
  mismatch: "불일치 (이후 중단)",
  not_checked: "미검증",
  expected_missing: "기대값 미입력",
};

function valueOrUnknown(value: string | null) {
  return value ?? "시간 미상";
}

function ContributionTable({
  rows,
}: {
  rows: SajuDiagnosticModeResult["strength"]["myeongri"]["contributions"];
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-slate-400">적용 항목 없음</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">분류</th>
            <th className="border p-2">출처</th>
            <th className="border p-2">원점수</th>
            <th className="border p-2">적용 점수</th>
            <th className="border p-2">상세</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.category}-${row.source}-${index}`}>
              <td className="border p-2 text-right">{row.rawWeight}</td>
              <td className="border p-2">{row.source}</td>
              <td className="border p-2">{row.category}</td>
              <td className="border p-2 text-right">{row.adjustedWeight}</td>
              <td className="border p-2">{row.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModeReport({ result }: { result: SajuDiagnosticModeResult }) {
  const groups = result.strength.myeongri.groups;

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold">{result.label}</h2>

      <section className="mt-4">
        <h3 className="font-bold">시간 처리</h3>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
          <dt>원래 입력</dt>
          <dd>{result.time.original.isoLike}</dd>
          <dt>적용 시각</dt>
          <dd>{result.time.effective.isoLike}</dd>
          <dt>ssaju 전달</dt>
          <dd>
            {result.time.ssajuInput.year}-
            {String(result.time.ssajuInput.month).padStart(2, "0")}-
            {String(result.time.ssajuInput.day).padStart(2, "0")} {String(result.time.ssajuInput.hour).padStart(2, "0")}:
            {String(result.time.ssajuInput.minute).padStart(2, "0")}
          </dd>
          <dt>ssaju KST</dt>
          <dd>{JSON.stringify(result.time.normalizedKst)}</dd>
          <dt>계산 기준</dt>
          <dd>{JSON.stringify(result.time.calculation)}</dd>
        </dl>
      </section>

      <section className="mt-5">
        <h3 className="font-bold">만세력 / 일간</h3>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {PILLAR_KEYS.map((key) => (
            <div key={key} className="rounded border p-2">
              <div className="text-xs text-slate-500">{PILLAR_LABELS[key]}</div>
              <div className="mt-1 text-lg font-bold">
                {valueOrUnknown(result.pillars[key])}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs">
          일간: {result.dayMaster.stem} / {result.dayMaster.element} / {result.dayMaster.yinYang}
        </p>
      </section>

      <section className="mt-5">
        <h3 className="font-bold">십성</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">기둥</th>
                <th className="border p-2">천간 십성</th>
                <th className="border p-2">지지 대표 십성</th>
              </tr>
            </thead>
            <tbody>
              {PILLAR_KEYS.map((key) => (
                <tr key={key}>
                  <td className="border p-2">{PILLAR_LABELS[key]}</td>
                  <td className="border p-2">
                    {valueOrUnknown(result.tenGods.stems[key])}
                  </td>
                  <td className="border p-2">
                    {valueOrUnknown(result.tenGods.branches[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold">지장간별 십성</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2">기둥</th>
                  <th className="border p-2">지지</th>
                  <th className="border p-2">지장간</th>
                  <th className="border p-2">십성</th>
                  <th className="border p-2">역할</th>
                </tr>
              </thead>
              <tbody>
                {result.tenGods.hiddenStems.map((item, index) => (
                  <tr key={`${item.pillar}-${item.stem}-${index}`}>
                    <td className="border p-2">{PILLAR_LABELS[item.pillar]}</td>
                    <td className="border p-2">{item.branch}</td>
                    <td className="border p-2">{item.stem}</td>
                    <td className="border p-2">{item.tenGod}</td>
                    <td className="border p-2">{item.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="mt-5">
        <h3 className="font-bold">신강도</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded border p-3 text-xs">
            <strong>운영 ssaju</strong>
            <p className="mt-1">
              {result.strength.legacy.score}점 / {result.strength.legacy.label} ({result.strength.legacy.code})
            </p>
          </div>
          <div className="rounded border p-3 text-xs">
            <strong>신규 myeongri</strong>
            <p className="mt-1">
              {result.strength.myeongri.score}점 / {result.strength.myeongri.levelLabel} ({result.strength.myeongri.level})
            </p>
          </div>
        </div>

        <details className="mt-3" open>
          <summary className="cursor-pointer text-xs font-bold">myeongri 적용 점수 전체</summary>
          <div className="mt-2 space-y-4">
            <div>
              <p className="mb-1 text-xs font-bold">월령 기여</p>
              <ContributionTable rows={groups.monthCommand} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold">통근 기여</p>
              <ContributionTable rows={groups.roots} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold">천간 생조/극설</p>
              <ContributionTable rows={groups.stems} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold">지지 생조/극설</p>
              <ContributionTable rows={groups.branches} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold">기타 점수</p>
              <ContributionTable rows={groups.others} />
            </div>
          </div>
        </details>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold">판정 factor 원문</summary>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-[11px] leading-5 text-emerald-300">
            {JSON.stringify(result.strength.myeongri.factors, null, 2)}
          </pre>
        </details>
      </section>
    </article>
  );
}

export default function MyeongriDevTool() {
  const [birthDate, setBirthDate] = useState("1992-01-14");
  const [birthTime, setBirthTime] = useState("13:00");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [leapMonth, setLeapMonth] = useState(false);
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [expected, setExpected] = useState<
    Partial<Record<DiagnosticPillarKey, string>>
  >({});
  const [report, setReport] = useState<SajuDiagnosticReport | null>(null);
  const [error, setError] = useState("");

  const run = () => {
    try {
      setReport(
        runSajuDiagnostic({
          birthDate,
          birthTime,
          gender,
          calendar,
          timezone,
          leapMonth,
          birthTimeUnknown,
          targetYear: new Date().getFullYear(),
          expectedPillars: expected,
        }),
      );
      setError("");
    } catch (caught) {
      setReport(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-slate-50 p-4 font-mono text-sm text-slate-900 sm:p-6">
      <h1 className="text-xl font-bold">운로그 만세력 개발 진단</h1>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        운영 계산 로직을 변경하지 않고 현재 -30분 경로와 무보정 ssaju 경로를 동시에 비교합니다.
      </p>

      <section className="mt-5 rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            달력
            <select
              className="mt-1 w-full rounded border p-2"
              value={calendar}
              onChange={(event) =>
                setCalendar(event.target.value as "solar" | "lunar")
              }
            >
              <option value="solar">양력</option>
              <option value="lunar">음력</option>
            </select>
          </label>
          <label>
            생년월일
            <input
              className="mt-1 w-full rounded border p-2"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>
          <label>
            출생시간
            <input
              className="mt-1 w-full rounded border p-2 disabled:bg-slate-100"
              type="time"
              value={birthTime}
              disabled={birthTimeUnknown}
              onChange={(event) => setBirthTime(event.target.value)}
            />
          </label>
          <label>
            timezone
            <input
              className="mt-1 w-full rounded border p-2"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>
          <label>
            성별
            <select
              className="mt-1 w-full rounded border p-2"
              value={gender}
              onChange={(event) =>
                setGender(event.target.value as "male" | "female")
              }
            >
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={birthTimeUnknown}
              onChange={(event) => setBirthTimeUnknown(event.target.checked)}
            />
            출생시간 미상
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={leapMonth}
              disabled={calendar !== "lunar"}
              onChange={(event) => setLeapMonth(event.target.checked)}
            />
            윤달 (현재 운영 미지원 여부도 표시)
          </label>
        </div>

        <div className="mt-5">
          <p className="font-bold">기대 만세력 (선택)</p>
          <p className="mt-1 text-xs text-slate-500">
            년주부터 순서대로 입력하세요. 앞 단계가 틀리면 뒤 단계는 자동으로 미검증 처리됩니다.
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {PILLAR_KEYS.map((key) => (
              <label key={key} className="text-xs">
                {PILLAR_LABELS[key]}
                <input
                  className="mt-1 w-full rounded border p-2"
                  placeholder="예: 壬申"
                  value={expected[key] ?? ""}
                  onChange={(event) =>
                    setExpected((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          className="mt-5 rounded bg-slate-900 px-5 py-2.5 font-bold text-white"
        >
          A/B 진단 실행
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {report && (
        <>
          <section className="mt-5 rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-bold">입력 원본</h2>
            <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
              <dt>양력/음력</dt>
              <dd>{report.input.calendar === "solar" ? "양력" : "음력"}</dd>
              <dt>생년월일</dt>
              <dd>{report.input.date}</dd>
              <dt>출생시간</dt>
              <dd>{report.input.birthTimeUnknown ? "미상" : report.input.time}</dd>
              <dt>timezone</dt>
              <dd>{report.input.timezone}</dd>
              <dt>윤달 요청</dt>
              <dd>{report.input.leapMonthRequested ? "예" : "아니오"}</dd>
              <dt>현재 운영 입력의 윤달 적용</dt>
              <dd>{report.input.leapMonthAppliedByCurrentInput ? "예" : "아니오"}</dd>
            </dl>
          </section>

          <section className="mt-5 rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="font-bold">기대값 비교</h2>
            <p className="mt-1 text-xs text-slate-500">{report.verificationRule}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">항목</th>
                    <th className="border p-2">기대값</th>
                    <th className="border p-2">-30분 현재 방식</th>
                    <th className="border p-2">보정 없음</th>
                    <th className="border p-2">판정</th>
                  </tr>
                </thead>
                <tbody>
                  {report.comparison.map((row) => (
                    <tr key={row.pillar}>
                      <td className="border p-2">{row.label}</td>
                      <td className="border p-2 text-center">{row.expected ?? "—"}</td>
                      <td className="border p-2 text-center">{valueOrUnknown(row.currentMinus30)}</td>
                      <td className="border p-2 text-center">{valueOrUnknown(row.unadjusted)}</td>
                      <td className="border p-2">
                        <div>-30분: {VERDICT_LABELS[row.currentVerdict]}</div>
                        <div>무보정: {VERDICT_LABELS[row.unadjustedVerdict]}</div>
                        {row.modesDiffer && <div className="mt-1 font-bold text-amber-700">두 방식 결과 다름</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
            <ModeReport result={report.currentMinus30} />
            <ModeReport result={report.unadjusted} />
          </div>
        </>
      )}
    </main>
  );
}
