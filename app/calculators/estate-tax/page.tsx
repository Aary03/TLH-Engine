"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  AlertTriangle, CheckCircle2, ArrowRight, Shield,
  TrendingUp, Users, TriangleAlert, ArrowDown, Sparkles,
} from "lucide-react";
import CalcDrawer from "@/components/chat/CalcDrawer";

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */

const NRA_EXEMPTION = 60_000;
const PORTFOLIO_CAGR = 0.10;

const BRACKET_DEFS = [
  { size: 10_000,   rate: 0.18, label: "$0 – $10K" },
  { size: 10_000,   rate: 0.20, label: "$10K – $20K" },
  { size: 20_000,   rate: 0.22, label: "$20K – $40K" },
  { size: 20_000,   rate: 0.24, label: "$40K – $60K" },
  { size: 20_000,   rate: 0.26, label: "$60K – $80K" },
  { size: 20_000,   rate: 0.28, label: "$80K – $100K" },
  { size: 50_000,   rate: 0.30, label: "$100K – $150K" },
  { size: 100_000,  rate: 0.32, label: "$150K – $250K" },
  { size: 250_000,  rate: 0.34, label: "$250K – $500K" },
  { size: 250_000,  rate: 0.37, label: "$500K – $750K" },
  { size: 250_000,  rate: 0.39, label: "$750K – $1M" },
  { size: Infinity, rate: 0.40, label: "Above $1M" },
];

const PRESETS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000];

/* ── Formatters ── */
const fmtUSD = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
};
const fmtUSDFull = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtINR = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

/* ── Estate tax engine ── */
interface BracketRow { label: string; taxable: number; rate: number; tax: number }
interface CalcResult  { total: number; effectiveRate: number; brackets: BracketRow[] }

function calcEstateTax(holdingsUSD: number): CalcResult {
  const taxableAboveExemption = Math.max(0, holdingsUSD - NRA_EXEMPTION);
  if (taxableAboveExemption === 0) return { total: 0, effectiveRate: 0, brackets: [] };

  let remaining = taxableAboveExemption;
  let total = 0;
  const brackets: BracketRow[] = [];

  for (const b of BRACKET_DEFS) {
    if (remaining <= 0) break;
    const inBracket = b.size === Infinity ? remaining : Math.min(remaining, b.size);
    const tax = inBracket * b.rate;
    total += tax;
    brackets.push({ label: b.label, taxable: inBracket, rate: b.rate, tax });
    remaining -= inBracket;
  }

  return { total, effectiveRate: holdingsUSD > 0 ? total / holdingsUSD : 0, brackets };
}

/* ── Custom chart tooltip ── */
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number;
}) {
  if (!active || !payload?.length) return null;
  const direct = payload.find((p) => p.name === "Direct")?.value ?? 0;
  return (
    <div className="rounded-xl p-3 shadow-lg text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
      <p className="font-bold mb-2" style={{ color: "#00111B" }}>Year {label}</p>
      <div className="flex justify-between gap-6 items-center">
        <span style={{ color: "#7A2020" }}>■ Direct estate tax</span>
        <span className="font-extrabold" style={{ color: "#7A2020" }}>{fmtUSD(direct)}</span>
      </div>
      <div className="flex justify-between gap-6 items-center mt-1">
        <span style={{ color: "#05A049" }}>■ Via Valura</span>
        <span className="font-extrabold" style={{ color: "#05A049" }}>$0</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */

export default function EstateTaxCalculator() {
  const [holdingsUSD, setHoldingsUSD] = useState(500_000);
  const [inputText, setInputText]     = useState("500000");
  const [exchangeRate, setExchangeRate] = useState(84.5);
  const [aiOpen, setAiOpen]            = useState(false);

  const calc     = useMemo(() => calcEstateTax(holdingsUSD), [holdingsUSD]);
  const afterTax = holdingsUSD - calc.total;

  /* chart: year 0–20, portfolio grows at CAGR */
  const chartData = useMemo(() =>
    Array.from({ length: 21 }, (_, year) => {
      const portfolio = holdingsUSD * Math.pow(1 + PORTFOLIO_CAGR, year);
      const tax = calcEstateTax(portfolio).total;
      return { year, direct: Math.round(tax), valura: 0 };
    }),
    [holdingsUSD],
  );

  const y10tax = chartData[10]?.direct ?? 0;
  const y20tax = chartData[20]?.direct ?? 0;

  const handlePreset = (v: number) => { setHoldingsUSD(v); setInputText(String(v)); };
  const handleInput  = (v: string) => {
    setInputText(v);
    const n = parseInt(v.replace(/,/g, ""), 10);
    if (!isNaN(n) && n >= 0) setHoldingsUSD(Math.min(n, 5_000_000));
  };

  const isBelowExemption = holdingsUSD <= NRA_EXEMPTION;

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <>
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ══════════ HERO HEADER ══════════ */}
      <div style={{ background: "#00111B" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(220,38,38,0.2)", color: "#F87171" }}>
              Calculator · US Estate Tax · NRA Rules
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              IRS Non-Resident Alien · 2025
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white mb-2"
            style={{ fontFamily: "var(--font-bricolage)" }}>
            US Estate Tax Calculator
          </h1>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.55)", maxWidth: "600px" }}>
            This might be the most important financial calculation you have never done.
          </p>

          {/* Problem explainer — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🇮🇳",
                label: "Indian investors buying US stocks directly",
                body: "You are classified as a Non-Resident Alien (NRA) by the IRS. US tax law treats you very differently from US citizens.",
                color: "#9CA3AF",
              },
              {
                icon: "⚠️",
                label: "On death: only $60,000 is exempt",
                body: "NRAs get a $60,000 exemption vs $12.92M for US citizens. Everything above that faces estate tax at rates up to 40%.",
                color: "#F87171",
              },
              {
                icon: "🏛️",
                label: "The IRS collects before your family inherits",
                body: "Your heirs must pay US estate tax within 9 months of your death. No payment = IRS can seize the assets.",
                color: "#F87171",
              },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="text-xs font-bold mb-1.5" style={{ color: c.color }}>{c.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ══════════ INPUTS ══════════ */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,17,27,0.06)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#6B7280" }}>
            Your US Stock &amp; ETF Holdings
          </p>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => handlePreset(p)}
                className="rounded-xl px-4 py-2 text-sm font-bold transition-all"
                style={{
                  background: holdingsUSD === p ? "#00111B" : "#F3F4F6",
                  color: holdingsUSD === p ? "#fff" : "#374151",
                  border: holdingsUSD === p ? "1px solid #00111B" : "1px solid #E5E7EB",
                }}>
                {fmtUSD(p)}
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range" min={0} max={5_000_000} step={10_000}
            value={holdingsUSD}
            onChange={(e) => { const v = Number(e.target.value); setHoldingsUSD(v); setInputText(String(v)); }}
            className="w-full h-2 appearance-none rounded-full cursor-pointer mb-3"
            style={{ accentColor: isBelowExemption ? "#05A049" : "#7A2020" }}
          />
          <div className="flex justify-between text-[10px] text-gray-400 mb-4">
            <span>$0</span><span>$1M</span><span>$2M</span><span>$3M</span><span>$4M</span><span>$5M</span>
          </div>

          {/* Text input + exchange rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1.5">Enter exact amount (USD)</label>
              <div className="flex items-center gap-2 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                <span className="px-3 py-2.5 text-sm font-bold" style={{ background: "#F9FAFB", color: "#6B7280" }}>$</span>
                <input
                  type="text" value={inputText}
                  onChange={(e) => handleInput(e.target.value)}
                  className="flex-1 px-2 py-2.5 text-sm font-bold focus:outline-none"
                  style={{ color: "#00111B" }}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1.5">Exchange rate (₹ per $)</label>
              <div className="flex items-center gap-2 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                <span className="px-3 py-2.5 text-sm font-bold" style={{ background: "#F9FAFB", color: "#6B7280" }}>₹/$</span>
                <input
                  type="number" step="0.5" value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="flex-1 px-2 py-2.5 text-sm font-bold focus:outline-none"
                  style={{ color: "#00111B" }}
                />
              </div>
            </div>
          </div>

          {/* Live summary bar */}
          <div className="mt-4 rounded-xl px-4 py-3 flex flex-wrap items-center gap-4"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Holdings</span>
              <span className="text-sm font-extrabold" style={{ color: "#00111B", fontFamily: "var(--font-bricolage)" }}>
                {fmtUSDFull(holdingsUSD)}
              </span>
              <span className="text-[10px] text-gray-400">= {fmtINR(holdingsUSD * exchangeRate)}</span>
            </div>
            <div className="h-4 w-px" style={{ background: "#E5E7EB" }} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">NRA exemption</span>
              <span className="text-sm font-bold" style={{ color: "#05A049" }}>{fmtUSDFull(NRA_EXEMPTION)}</span>
            </div>
            <div className="h-4 w-px" style={{ background: "#E5E7EB" }} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Taxable amount</span>
              <span className="text-sm font-bold" style={{ color: isBelowExemption ? "#05A049" : "#7A2020" }}>
                {isBelowExemption ? "$0 (below exemption)" : fmtUSDFull(holdingsUSD - NRA_EXEMPTION)}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════ SAVINGS CALLOUT ══════════ */}
        {!isBelowExemption && calc.total > 0 && (
          <div className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0d1f2d 0%, #00111B 100%)", border: "2px solid #05A049" }}>
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: "linear-gradient(90deg, #7A2020, #05A049)" }} />
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(180,227,200,0.6)" }}>
              By choosing Valura GIFT City over direct investing
            </p>
            <p className="text-4xl font-extrabold mb-1" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
              {fmtUSDFull(calc.total)} saved
            </p>
            <p className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              ≈ {fmtINR(calc.total * exchangeRate)} stays with your family
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              That is the difference between investing directly vs through Valura
            </p>
          </div>
        )}

        {isBelowExemption && (
          <div className="rounded-2xl p-5 flex items-start gap-3"
            style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#05A049" }}>Below the $60,000 NRA exemption — no US estate tax at this level.</p>
              <p className="text-xs text-gray-500 mt-1">Try $100K or above to see how estate tax compounds. Note: even at $61K your exposure begins.</p>
            </div>
          </div>
        )}

        {/* ══════════ TWO CARDS ══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* LEFT — Direct Investment (danger) */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #FECACA", borderLeft: "4px solid #7A2020", background: "#fff", boxShadow: "0 4px 24px rgba(122,32,32,0.1)" }}>
            <div className="px-6 py-5" style={{ background: "#FEF2F2" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" style={{ color: "#7A2020" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#7A2020" }}>
                  Direct US Stock Investment
                </p>
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: "#7A2020" }}>Your heirs would owe the IRS:</p>
              <p className="text-5xl font-extrabold leading-none mb-1"
                style={{ fontFamily: "var(--font-bricolage)", color: isBelowExemption ? "#05A049" : "#7A2020" }}>
                {isBelowExemption ? "$0" : fmtUSDFull(calc.total)}
              </p>
              {!isBelowExemption && (
                <p className="text-xs mt-1" style={{ color: "#7A2020" }}>
                  ≈ {fmtINR(calc.total * exchangeRate)}
                </p>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Effective rate", value: fmtPct(calc.effectiveRate), danger: !isBelowExemption },
                  { label: "Your family receives", value: fmtUSD(afterTax), danger: false },
                  { label: "IRS takes (₹ equiv.)", value: fmtINR(calc.total * exchangeRate), danger: !isBelowExemption },
                  { label: "% of wealth lost", value: isBelowExemption ? "0%" : `${((calc.total / holdingsUSD) * 100).toFixed(1)}%`, danger: !isBelowExemption },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: m.danger ? "#FEF2F2" : "#F9FAFB", border: `1px solid ${m.danger ? "#FECACA" : "#E5E7EB"}` }}>
                    <p className="text-[10px] text-gray-400 mb-0.5">{m.label}</p>
                    <p className="text-sm font-extrabold" style={{ color: m.danger ? "#7A2020" : "#374151", fontFamily: "var(--font-bricolage)" }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bracket breakdown */}
              {calc.brackets.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    IRS Bracket Breakdown (on {fmtUSDFull(holdingsUSD - NRA_EXEMPTION)} above exemption)
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #FECACA" }}>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr style={{ background: "#FEF2F2" }}>
                          {["Bracket", "Taxable", "Rate", "Tax"].map((h) => (
                            <th key={h} className="px-2.5 py-2 text-left font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {calc.brackets.map((b, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: "#FECACA" }}>
                            <td className="px-2.5 py-2 font-medium" style={{ color: "#374151" }}>{b.label}</td>
                            <td className="px-2.5 py-2 font-mono" style={{ color: "#374151" }}>{fmtUSD(b.taxable)}</td>
                            <td className="px-2.5 py-2 font-mono font-bold" style={{ color: "#7A2020" }}>{(b.rate * 100).toFixed(0)}%</td>
                            <td className="px-2.5 py-2 font-mono font-extrabold" style={{ color: "#7A2020" }}>{fmtUSD(b.tax)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: "#FEF2F2", borderTop: "2px solid #FECACA" }}>
                          <td className="px-2.5 py-2 font-bold" style={{ color: "#7A2020" }} colSpan={3}>Total IRS Estate Tax</td>
                          <td className="px-2.5 py-2 font-extrabold text-base" style={{ color: "#7A2020", fontFamily: "var(--font-bricolage)" }}>
                            {fmtUSD(calc.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: "#7A20200D", border: "1px solid #7A202030" }}>
                <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#7A2020" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "#7A2020" }}>
                  The IRS takes this before your family inherits a single rupee. Payment is due within 9 months of death.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Via Valura (safe) */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: "2px solid #05A049", background: "#fff", boxShadow: "0 4px 24px rgba(5,160,73,0.12)" }}>
            <div className="px-6 py-5" style={{ background: "rgba(180,227,200,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5" style={{ color: "#05A049" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                  Via Valura GIFT City IFSC
                </p>
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: "#05A049" }}>Your family&apos;s estate tax:</p>
              <p className="text-5xl font-extrabold leading-none mb-1"
                style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                $0
              </p>
              <p className="text-xs mt-1" style={{ color: "#05A049" }}>Always. Regardless of portfolio size.</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Effective rate", value: "0.0%" },
                  { label: "Your family receives", value: fmtUSDFull(holdingsUSD) },
                  { label: "IRS takes", value: "$0" },
                  { label: "% of wealth preserved", value: "100%" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(180,227,200,0.15)", border: "1px solid #B4E3C8" }}>
                    <p className="text-[10px] text-gray-400 mb-0.5">{m.label}</p>
                    <p className="text-sm font-extrabold" style={{ color: "#05A049", fontFamily: "var(--font-bricolage)" }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reason box */}
              <div className="rounded-xl px-4 py-4" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#05A049" }}>Why $0?</p>
                <p className="text-xs leading-relaxed text-gray-600">
                  <strong>IFSC fund units are classified as Indian assets, not US-situs assets, under IRS rules.</strong>{" "}
                  When you invest via Valura, you hold units of an IFSC-domiciled fund — not US stocks directly.
                  The IRS only taxes US-situs assets in an NRA&apos;s estate. Indian fund units are outside its jurisdiction.
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {[
                  "No US estate tax — ever",
                  "No US probate process",
                  "Full inheritance for your family",
                  "Same underlying US market exposure",
                  "Ireland UCITS ETF route — lower dividend WHT too",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs" style={{ color: "#374151" }}>
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#05A049" }} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="rounded-xl px-4 py-3 text-center"
                style={{ background: "#05A049", color: "#fff" }}>
                <p className="text-sm font-bold">No US estate tax. No probate. Full inheritance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ GROWTH CHART ══════════ */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" style={{ color: "#7A2020" }} />
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                    Estate tax risk compounds as your portfolio grows
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Assuming 10% annual portfolio growth. Direct route exposure (red) vs Valura (always $0, green).
                </p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-3 w-3 rounded-sm" style={{ background: "#7A2020" }} />
                  <span className="text-gray-500">Direct — growing exposure</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="h-3 w-3 rounded-sm" style={{ background: "#05A049" }} />
                  <span className="text-gray-500">Via Valura — always $0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7A2020" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7A2020" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="year"
                  ticks={[0, 5, 10, 15, 20]}
                  tickFormatter={(v) => `Yr ${v}`}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<ChartTooltip />} />
                {y10tax > 0 && (
                  <ReferenceLine
                    x={10}
                    stroke="rgba(122,32,32,0.35)"
                    strokeDasharray="4 4"
                    label={{ value: `${fmtUSD(y10tax)} at yr 10`, position: "top", fill: "#7A2020", fontSize: 10, fontWeight: 600 }}
                  />
                )}
                {y20tax > 0 && (
                  <ReferenceLine
                    x={20}
                    stroke="rgba(122,32,32,0.35)"
                    strokeDasharray="4 4"
                    label={{ value: `${fmtUSD(y20tax)} at yr 20`, position: "top", fill: "#7A2020", fontSize: 10, fontWeight: 600 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="direct"
                  name="Direct"
                  stroke="#7A2020"
                  strokeWidth={2.5}
                  fill="url(#redAreaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#7A2020" }}
                />
                <Line
                  type="monotone"
                  dataKey="valura"
                  name="Valura"
                  stroke="#05A049"
                  strokeWidth={2.5}
                  dot={false}
                  strokeDasharray="6 3"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Gap callout */}
            {y20tax > 0 && (
              <div className="mt-4 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <div className="text-xs text-center sm:text-left">
                  <p className="font-bold mb-0.5" style={{ color: "#7A2020" }}>
                    At year 20 (10% CAGR): your portfolio ≈ {fmtUSD(holdingsUSD * Math.pow(1.10, 20))}
                  </p>
                  <p style={{ color: "#6B7280" }}>
                    Direct route estate tax exposure: <strong style={{ color: "#7A2020" }}>{fmtUSD(y20tax)}</strong> vs Valura: <strong style={{ color: "#05A049" }}>$0</strong>
                  </p>
                </div>
                <div className="rounded-xl px-4 py-2 text-center" style={{ background: "#7A2020", flexShrink: 0 }}>
                  <p className="text-[10px] text-white/60">Year 20 gap</p>
                  <p className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                    {fmtUSD(y20tax)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ 3-STEP EXPLAINER ══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Direct path */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #FECACA" }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ background: "#FEF2F2" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#7A2020" }} />
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#7A2020" }}>Direct US Stock Investment</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { step: 1, text: "Buy US stocks or ETFs directly via a broker", icon: "📈" },
                { step: 2, text: "IRS classifies these as US-situs assets. You are a Non-Resident Alien with only $60,000 exemption.", icon: "🏛️" },
                { step: 3, text: "On death: up to 40% goes to the IRS before your family inherits a single dollar.", icon: "⚠️", danger: true },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: s.danger ? "#7A2020" : "#FEF2F2", color: s.danger ? "#fff" : "#7A2020", border: "1.5px solid #FECACA" }}>
                    {s.step}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">{s.icon}</span>
                    <p className="text-xs leading-relaxed" style={{ color: s.danger ? "#7A2020" : "#374151", fontWeight: s.danger ? 600 : 400 }}>
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valura path */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049" }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ background: "rgba(180,227,200,0.2)" }}>
              <Shield className="h-4 w-4" style={{ color: "#05A049" }} />
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#05A049" }}>Via Valura GIFT City IFSC</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { step: 1, text: "Invest via your Valura GIFT City IFSC account in Ireland UCITS or IFSC funds.", icon: "🏦" },
                { step: 2, text: "You hold IFSC fund units — classified as an Indian asset under IRS rules, not a US-situs asset.", icon: "🇮🇳" },
                { step: 3, text: "$0 US estate tax. Full inheritance for your family. Always.", icon: "✅", safe: true },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: s.safe ? "#05A049" : "rgba(180,227,200,0.3)", color: s.safe ? "#fff" : "#05A049", border: "1.5px solid #B4E3C8" }}>
                    {s.step}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5">{s.icon}</span>
                    <p className="text-xs leading-relaxed" style={{ color: s.safe ? "#05A049" : "#374151", fontWeight: s.safe ? 600 : 400 }}>
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ INDIA NOTE ══════════ */}
        <div className="rounded-2xl px-6 py-5 flex items-start gap-4"
          style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "#E8C97A" }}>
            <span className="text-base">🇮🇳</span>
          </div>
          <div>
            <p className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-manrope)", color: "#B8913A" }}>
              India has no estate or inheritance tax
            </p>
            <p className="text-xs leading-relaxed text-gray-600">
              The entire risk described above comes from the US side only. India abolished estate duty in 1985. The problem affects every Indian investor with <strong>direct US stock or ETF holdings above USD 60,000</strong> — regardless of whether those holdings are on Indian brokers or international platforms.
            </p>
          </div>
        </div>

        {/* ══════════ WHO IS AFFECTED ══════════ */}
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" style={{ color: "#6B7280" }} />
            <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
              Who is affected?
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Any Resident Indian", body: "Who holds US stocks or ETFs via Zerodha, INDMoney, Vested, or any other platform — directly in US-registered securities.", danger: true },
              { label: "Any NRI", body: "Who holds US equities in their own name — through a brokerage account, US 401k, or inherited US portfolio.", danger: true },
              { label: "Via GIFT City IFSC", body: "Who holds IFSC fund units (UCITS ETFs or Cat III AIFs). These are NOT US-situs assets. Zero exposure.", danger: false },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-4"
                style={{ background: c.danger ? "#FEF2F2" : "#EDFAF3", border: `1px solid ${c.danger ? "#FECACA" : "#B4E3C8"}` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  {c.danger
                    ? <TriangleAlert className="h-4 w-4" style={{ color: "#7A2020" }} />
                    : <CheckCircle2 className="h-4 w-4" style={{ color: "#05A049" }} />}
                  <p className="text-xs font-bold" style={{ color: c.danger ? "#7A2020" : "#05A049" }}>{c.label}</p>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ CTA — largest on any calculator ══════════ */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049", boxShadow: "0 8px 32px rgba(5,160,73,0.2)" }}>
          <div className="px-4 sm:px-6 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: "#00111B" }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(180,227,200,0.55)" }}>
                Protect your family&apos;s inheritance
              </p>
              <p className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-bricolage)" }}>
                {calc.total > 0
                  ? `Save ${fmtUSDFull(calc.total)} for your family`
                  : "Protect your family as your wealth grows"}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Open a Valura GIFT City account and eliminate your US estate tax exposure — permanently. Same market access. Zero IRS risk.
              </p>
            </div>
            <a
              href="/signup"
              className="flex-shrink-0 flex items-center gap-3 rounded-2xl px-5 sm:px-8 py-4 text-base font-extrabold transition-all hover:opacity-90"
              style={{ background: "#05A049", color: "#fff", boxShadow: "0 4px 16px rgba(5,160,73,0.35)" }}
            >
              Open a Valura GIFT City Account <ArrowRight className="h-5 w-5" />
            </a>
          </div>
          {/* Bottom strip */}
          <div className="px-4 sm:px-6 md:px-8 py-3 flex flex-wrap gap-4" style={{ background: "rgba(5,160,73,0.08)", borderTop: "1px solid rgba(5,160,73,0.2)" }}>
            {["No US estate tax", "Ireland UCITS ETF access", "Auto Schedule FA compliance", "Form 67 reminders"].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "#B4E3C8" }}>
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05A049" }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-center pb-4 leading-relaxed" style={{ color: "#9CA3AF" }}>
          US estate tax law as of 2025. Non-Resident Alien (NRA) exemption is USD 60,000 under IRC Section 2101. Rates per IRS estate tax rate schedule. IFSC fund unit classification is based on general IRS situs rules for intangible property — consult a cross-border estate planning attorney for your specific situation. This calculator is illustrative only and does not constitute legal or tax advice.
        </p>

        {/* ── Ask AI button ── */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-lg"
            style={{ background: "#05A049", fontFamily: "'Manrope', sans-serif" }}
          >
            <Sparkles className="h-4 w-4" />
            Ask AI about this result →
          </button>
        </div>
      </div>
    </div>

    <CalcDrawer
      page="US Estate Tax"
      inputs={{
        holdingsUSD,
        exchangeRateINRperUSD: exchangeRate,
        nraExemptionUSD: 60000,
      }}
      outputs={{
        directEstateTaxUSD: Math.round(calc.total),
        directEstateTaxINR: Math.round(calc.total * exchangeRate),
        effectiveRatePct: +(calc.effectiveRate * 100).toFixed(2),
        familyReceivesDirectUSD: Math.round(afterTax),
        viaValuraEstateTaxUSD: 0,
        savingUSD: Math.round(calc.total),
        savingINR: Math.round(calc.total * exchangeRate),
      }}
      chips={[
        "How do I restructure to avoid this?",
        "Does the Ireland UCITS route actually work?",
        "What happens if I do nothing?",
      ]}
      open={aiOpen}
      onClose={() => setAiOpen(false)}
    />
    </>
  );
}
