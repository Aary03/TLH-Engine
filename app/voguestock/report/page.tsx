"use client";

import Link from "next/link";
import { ArrowLeft, Download, Check, FileSpreadsheet, ShieldCheck, TrendingUp, Globe2 } from "lucide-react";
import {
  SHOW, SHOW_CLIENT, SHOW_FUND, computeShow, inrShort, FILING_CHECKLIST,
} from "@/lib/showcase-data";
import { generateShowcaseReport } from "@/lib/partner/showcaseReport";

const C = {
  red: "#E0822E", green: "#05A049", navy: "#00111B", muted: "#6b7280",
  border: "#E8EBE9", page: "#F4F6F5", greenBg: "#EDFAF3", redBg: "#FCEFE0",
};

const m = computeShow();

/* deterministic value-growth points (invest → proceeds, gentle S-curve) */
function growthPath(w: number, h: number) {
  const n = 9;
  const wig = [0, -0.4, 0.6, 0.2, -0.5, 0.8, 0.3, -0.2, 0];
  const vals = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const ease = t * t * (3 - 2 * t); // smoothstep
    const base = SHOW.investINR + (m.proceedsINR - SHOW.investINR) * ease;
    return base + wig[i] * 80000;
  });
  const min = SHOW.investINR * 0.985, max = m.proceedsINR * 1.01;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - ((v - min) / (max - min)) * h;
  let d = `M 0 ${y(vals[0]).toFixed(1)}`;
  for (let i = 1; i < n; i++) {
    const xc = (x(i - 1) + x(i)) / 2;
    d += ` C ${xc.toFixed(1)} ${y(vals[i - 1]).toFixed(1)}, ${xc.toFixed(1)} ${y(vals[i]).toFixed(1)}, ${x(i).toFixed(1)} ${y(vals[i]).toFixed(1)}`;
  }
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return { line: d, area, last: { x: w, y: y(vals[n - 1]) } };
}

export default function VoguestockReport() {
  const W = 380, H = 120;
  const g = growthPath(W, H);

  return (
    <div className="min-h-screen py-6 sm:py-10 px-3" style={{ background: C.page }}>
      {/* Floating actions (hidden in print) */}
      <div className="no-print fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        <Link href="/voguestock" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-white shadow-md" style={{ color: C.navy, border: `1px solid ${C.border}` }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold text-white shadow-md" style={{ background: `linear-gradient(135deg, ${C.red}, #C26A1E)` }}>
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
        <button onClick={() => generateShowcaseReport()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-white shadow-md" style={{ color: C.navy, border: `1px solid ${C.border}` }}>
          <FileSpreadsheet className="h-3.5 w-3.5" style={{ color: C.green }} /> Excel
        </button>
      </div>

      {/* The sheet */}
      <div className="print-sheet mx-auto max-w-[820px] bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: "0 24px 70px rgba(0,17,27,0.10)" }}>
        {/* accent bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${C.red}, ${C.green})` }} />

        <div className="p-7 sm:p-10">
          {/* header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.red }}>Voguestock</span>
              <span className="text-base text-gray-300">×</span>
              <span className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.green }}>Foreign Income & Tax Report</p>
              <p className="text-[11px]" style={{ color: C.muted }}>FY 2025-26 · as on 31 Mar 2026</p>
            </div>
          </div>

          {/* client strip */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 rounded-xl px-4 py-2.5" style={{ background: C.greenBg }}>
            {[["Client", SHOW_CLIENT.name], ["PAN", SHOW_CLIENT.pan], ["Status", SHOW_CLIENT.residency], ["TIN", SHOW_CLIENT.usId]].map(([k, v]) => (
              <p key={k} className="text-[11px]" style={{ color: C.muted }}>{k}: <b style={{ color: C.navy }}>{v}</b></p>
            ))}
          </div>

          {/* hero */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center print-avoid-break">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>Net in hand after tax</p>
              <p className="text-5xl font-extrabold leading-none mt-1" style={{ fontFamily: "var(--font-bricolage)", color: C.navy }}>{inrShort(m.netINR)}</p>
              <p className="mt-2 text-sm" style={{ color: C.muted }}>
                from <b style={{ color: C.navy }}>{inrShort(SHOW.investINR)}</b> invested ·{" "}
                <span className="font-bold" style={{ color: C.green }}>+{m.gainPct.toFixed(1)}%</span> over {m.holdMonths} months
              </p>
            </div>
            {/* growth chart */}
            <div className="rounded-xl p-3" style={{ background: "#FAFBFB", border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px]" style={{ color: C.muted }}>{inrShort(SHOW.investINR)}</span>
                <span className="text-[10px] font-bold" style={{ color: C.green }}>{inrShort(m.proceedsINR)}</span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={C.green} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={g.area} fill="url(#gf)" />
                <path d={g.line} fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx={g.last.x - 1.5} cy={g.last.y} r="3.5" fill={C.green} />
              </svg>
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[9px]" style={{ color: C.muted }}>Dec 2023</span>
                <span className="text-[9px]" style={{ color: C.muted }}>Feb 2026</span>
              </div>
            </div>
          </div>

          {/* investment + tax cards */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 print-avoid-break">
            <Panel title="The investment" icon={Globe2}>
              <Row k="Fund" v={SHOW_FUND.name} />
              <Row k="ISIN" v={SHOW_FUND.isin} />
              <Row k="Domicile" v={SHOW_FUND.domicile} />
              <Row k="Structure" v={`${SHOW_FUND.structure} · TER ${SHOW_FUND.ter}%`} />
              <Row k="Units" v={m.units.toLocaleString("en-IN")} />
              <Row k="Holding" v={`${m.holdMonths} months (Long-term)`} />
            </Panel>
            <Panel title="The tax — solved" icon={ShieldCheck}>
              <Row k="Capital gain" v={inrShort(m.gainINR)} accent={C.green} />
              <Row k="Tax type / rate" v={`LTCG · ${m.effRatePct.toFixed(2)}%`} />
              <Row k="Capital gains tax" v={inrShort(m.taxINR)} accent={C.red} />
              <Row k="Indian dividend tax" v="₹0" accent={C.green} />
              <Row k="US estate tax" v="$0" accent={C.green} />
              <Row k="Net after tax" v={inrShort(m.netINR)} accent={C.navy} bold />
            </Panel>
          </div>

          {/* why */}
          <div className="mt-6 rounded-2xl p-5 print-avoid-break" style={{ background: C.navy }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#7BE2A8" }}>Why this is tax-efficient</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {[
                `Accumulating fund — ${inrShort(m.divReinvestedINR)} of dividends reinvest inside, taxed at 0% in India.`,
                "Dividend withholding is 15% inside the fund (vs 25% on a direct US holding).",
                "No US estate tax — the unit is an Irish security, outside the $60k / 40% net.",
                "Just two filings needed: the capital gain (FSI) and the holding (Schedule FA).",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#7BE2A8" }} />
                  <span className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* filing checklist */}
          <div className="mt-6 print-avoid-break">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Filing checklist — every report, what's needed</p>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              {FILING_CHECKLIST.map((f, i) => {
                const need = f.status === "required";
                return (
                  <div key={f.doc} className="grid grid-cols-[1.3fr_0.8fr_2fr] items-center gap-2 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.border}` : "none", background: i % 2 ? "#FBFCFC" : "#fff" }}>
                    <span className="text-[12px] font-bold" style={{ color: C.navy }}>{f.doc}</span>
                    <span className="text-[10px] font-bold inline-flex items-center gap-1" style={{ color: need ? C.green : C.muted }}>
                      {need ? <Check className="h-3 w-3" /> : "—"} {need ? "Generated" : "Not needed"}
                    </span>
                    <span className="text-[11px]" style={{ color: C.muted }}>{f.note}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* footer */}
          <div className="mt-7 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-[10px] leading-relaxed" style={{ color: C.muted }}>
              Illustrative co-branded report · USD→INR at the SBI TT buying rate · Tax rules per Finance Act 2025 (FY 2025-26) · Confirm with your CA before filing.
            </p>
            <p className="text-[10px] font-semibold flex-shrink-0" style={{ color: C.navy }}>
              Prepared by <span style={{ color: C.red }}>Voguestock</span> × <span style={{ color: C.green }}>Valura</span>
            </p>
          </div>
        </div>
      </div>

      <p className="no-print text-center text-[11px] mt-4" style={{ color: C.muted }}>
        <TrendingUp className="inline h-3 w-3 mr-1" /> Tip: "Download PDF" → choose <b>Save as PDF</b> as the destination for a crisp, vector report.
      </p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Globe2; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-1.5 mb-2.5">
        <Icon className="h-3.5 w-3.5" style={{ color: C.green }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.navy }}>{title}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v, accent, bold }: { k: string; v: string; accent?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px]" style={{ color: C.muted }}>{k}</span>
      <span className="text-[12px] text-right" style={{ color: accent || C.navy, fontWeight: bold ? 800 : 600 }}>{v}</span>
    </div>
  );
}
