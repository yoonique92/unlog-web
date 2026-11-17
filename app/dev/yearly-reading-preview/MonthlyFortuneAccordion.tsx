"use client";

import { useState } from "react";

import type { MonthlyFortuneCopy } from "../../../lib/yearly/types";

interface MonthlyDebugSignal {
  id: string;
  source: string;
  kind: string;
  theme: string;
}

interface MonthlyDebug {
  displayMonth: number;
  signals: MonthlyDebugSignal[];
}

export function MonthlyFortuneAccordion({
  copies,
  debug,
}: {
  copies: MonthlyFortuneCopy[];
  debug: MonthlyDebug[];
}) {
  const [openMonth, setOpenMonth] = useState<number | null>(null);

  return (
    <section className="mt-8" aria-labelledby="monthly-fortune-heading" data-testid="monthly-fortune-accordion">
      <h2 id="monthly-fortune-heading" className="text-xl font-extrabold text-[#241C57]">월별 운세</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7E1F2] bg-white shadow-[0_6px_20px_rgba(62,48,110,0.05)]" data-testid="monthly-list-container">
        {copies.map((copy) => {
          const open = openMonth === copy.displayMonth;
          const panelId = `monthly-fortune-panel-${copy.displayMonth}`;
          const monthDebug = debug.find(({ displayMonth }) => displayMonth === copy.displayMonth);
          return (
            <article key={copy.displayMonth} className="border-b border-[#EEEAF5] last:border-b-0" data-testid="monthly-row">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenMonth(open ? null : copy.displayMonth)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-[#786EA0]">{copy.displayMonth}월 운세</span>
                  <span className="mt-0.5 block break-keep text-[15px] font-bold leading-6 text-[#30286D]">{copy.headline}</span>
                </span>
                <span aria-hidden="true" className={`shrink-0 text-[#887FA4] transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {open ? (
                <div id={panelId} className="border-t border-[#EEEAF5] px-5 pb-5 pt-4">
                  <div data-testid="monthly-copy-body" className="space-y-4 text-[15px] leading-7 text-[#4D4860]">
                    {copy.body.split(/\n\s*\n/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  <aside
                    data-testid="monthly-tip-box"
                    className="mt-5 rounded-xl border border-[#E7E1F2] bg-[#F8F6FC] px-4 py-3.5"
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.08em] text-[#6656C9]">
                      TIP
                    </p>
                    <p className="mt-1.5 break-keep text-[14px] leading-6 text-[#514A68]">{copy.tip}</p>
                  </aside>
                  <details className="mt-5 border-t border-[#EEEAF5] pt-4 text-xs text-[#706985]">
                    <summary className="cursor-pointer select-none font-semibold">근거 보기</summary>
                    <p className="mt-3 font-semibold">sourceSignalIds</p>
                    <ul className="mt-2 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
                      {copy.sourceSignalIds.map((id) => <li key={id}>{id}</li>)}
                    </ul>
                    {monthDebug ? (
                      <ul className="mt-3 space-y-1 rounded-lg bg-[#F8F7FA] p-3 font-mono">
                        {monthDebug.signals.map((signal) => (
                          <li key={signal.id}>{signal.source} · {signal.kind} · {signal.theme}</li>
                        ))}
                      </ul>
                    ) : null}
                  </details>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
