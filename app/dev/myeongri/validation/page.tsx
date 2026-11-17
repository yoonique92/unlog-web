import { notFound } from "next/navigation";
import { GOLDEN_CASES } from "../../../../tests/golden/cases";
import { formatGoldenValidationReport, runGoldenValidation } from "../../../../lib/myeongri/validation";
import { serializeValidationSnapshot } from "../../../../lib/myeongri/validationSnapshot";

export default function MyeongriValidationPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const summary = runGoldenValidation(GOLDEN_CASES);
  const report = formatGoldenValidationReport(summary);
  const snapshot = serializeValidationSnapshot(summary);
  const failures = summary.results.filter((item) => !item.deterministic.passed || !item.structural.passed || (item.strength.evaluated && !item.strength.passed));
  const severe = summary.results.filter((item) => item.strength.severity === "severe");

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-white p-6 font-mono text-sm text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">운로그 Golden Validation</h1>
          <p className="mt-1 text-xs text-slate-500">검증 지표를 하나의 정확도 숫자로 합산하지 않습니다.</p>
        </div>
        <a className="rounded bg-slate-900 px-4 py-2 font-bold text-white" download="unlog-myeongri-validation.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(snapshot)}`}>Snapshot JSON</a>
      </div>
      <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded bg-slate-950 p-5 leading-6 text-emerald-300">{report}</pre>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4"><h2 className="font-bold">실패 사례 ({failures.length})</h2><pre className="mt-3 whitespace-pre-wrap text-xs">{failures.length ? JSON.stringify(failures, null, 2) : "NO VERIFIED CASES"}</pre></div>
        <div className="rounded border p-4"><h2 className="font-bold text-red-700">Severe miss ({severe.length})</h2><pre className="mt-3 whitespace-pre-wrap text-xs">{severe.length ? JSON.stringify(severe, null, 2) : "NO SEVERE MISSES"}</pre></div>
      </section>
    </main>
  );
}
