"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  Clock, TrendingUp, TrendingDown, Info, Calculator, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, ArrowRight, Timer,
} from "lucide-react";
import {
  calculateTaxRateBreakdown, getLTCGEffectiveRate, getSTCGEffectiveRate,
  getSlabRate, getSurchargeRate,
} from "@/lib/tax-calculations";
import type { TaxRegime } from "@/lib/tax-calculations";

/* ── Helpers ─────────────────────────────────────────── */

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const INR_L = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return INR(n);
};

const PCT = (n: number) => `${(n * 100).toFixed(2)}%`;

/* ── Rate Table Data ─────────────────────────────────── */

const RATE_TABLE_ROWS = [
  { label: "Up to ₹3L",    income: 200_000,     incomeN: 200_000 },
  { label: "₹3L – ₹7L",   income: 500_000,     incomeN: 500_000 },
  { label: "₹7L – ₹10L",  income: 850_000,     incomeN: 850_000 },
  { label: "₹10L – ₹12L", income: 1_100_000,   incomeN: 1_100_000 },
  { label: "₹12L – ₹15L", income: 1_350_000,   incomeN: 1_350_000 },
  { label: "₹15L – ₹50L", income: 3_000_000,   incomeN: 3_000_000 },
  { label: "₹50L – ₹1Cr", income: 7_500_000,   incomeN: 7_500_000 },
  { label: "₹1Cr – ₹2Cr", income: 15_000_000,  incomeN: 15_000_000 },
  { label: "₹2Cr – ₹5Cr", income: 35_000_000,  incomeN: 35_000_000 },
  { label: "Above ₹5Cr",  income: 60_000_000,  incomeN: 60_000_000 },
];

function buildRateRow(income: number, regime: TaxRegime) {
  const stcg = getSTCGEffectiveRate(income, regime);
  const ltcg = getLTCGEffectiveRate(income, regime);
  const spread = stcg - ltcg;
  const tlhValue = 100_000 * spread; // per ₹1L gain
  return { stcg, ltcg, spread, tlhValue };
}

/* ── Sub-components ──────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>
      {children}
    </label>
  );
}

function StepRow({ step, desc, value, highlight }: { step: number; desc: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-start justify-between py-2.5 px-3 rounded-lg text-sm ${highlight ? "font-bold" : ""}`}
      style={{ background: highlight ? "#F0FAF5" : "transparent", borderBottom: "1px solid #F3F4F6" }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: "#00111B", color: "#fff" }}
        >
          {step}
        </span>
        <span style={{ color: "#374151" }}>{desc}</span>
      </div>
      <span className={`font-mono text-sm flex-shrink-0 ml-4 ${highlight ? "text-[#05A049] font-extrabold" : "text-gray-700"}`}>
        {value}
      </span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export default function CapitalGainsCalculator() {
  /* ── Inputs ── */
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [exchangeRate, setExchangeRate] = useState(84.5);
  const [buyPrice, setBuyPrice] = useState(1000);
  const [sellPrice, setSellPrice] = useState(1500);
  const [units, setUnits] = useState(100);
  const [holdYears, setHoldYears] = useState(1);
  const [holdMonths, setHoldMonths] = useState(6);
  const [income, setIncome] = useState(5_000_000);
  const [regime, setRegime] = useState<TaxRegime>("new");
  const [hasLosses, setHasLosses] = useState(false);
  const [stclCarry, setStclCarry] = useState(0);
  const [ltclCarry, setLtclCarry] = useState(0);
  const [showMath, setShowMath] = useState(false);

  /* ── Derived calculations ── */
  const holdingDays = useMemo(() => holdYears * 365 + holdMonths * 30, [holdYears, holdMonths]);
  const sliderDays = holdingDays;

  const fxRate = currency === "USD" ? exchangeRate : 1;
  const buyPriceINR = buyPrice * fxRate;
  const sellPriceINR = sellPrice * fxRate;
  const purchaseValue = buyPriceINR * units;
  const saleValue = sellPriceINR * units;
  const rawGain = saleValue - purchaseValue;

  const isLTCG = holdingDays > 730;
  const isLoss = rawGain < 0;

  // Carry-forward offset
  const lossOffset = isLTCG
    ? Math.min(Math.abs(rawGain > 0 ? rawGain : 0), ltclCarry) // LTCG only offset by LTCL
    : Math.min(Math.abs(rawGain > 0 ? rawGain : 0), stclCarry + ltclCarry); // STCG offset by both
  const taxableGain = Math.max(0, rawGain - (hasLosses ? lossOffset : 0));

  const breakdown = calculateTaxRateBreakdown(holdingDays, income, regime);
  const taxAmount = taxableGain * breakdown.effectiveRate;
  const netProceeds = saleValue - taxAmount;

  // "Waiting Game" — if STCG, compute LTCG tax at 731 days
  const daysToLTCG = Math.max(0, 731 - holdingDays);
  const ltcgBreakdown = calculateTaxRateBreakdown(731, income, regime);
  const taxIfWait = taxableGain * ltcgBreakdown.effectiveRate;
  const taxSaving = taxAmount - taxIfWait;

  /* ── Surcharge for display ── */
  const rawSurcharge = getSurchargeRate(income, regime);
  const effectiveSurcharge = isLTCG ? Math.min(rawSurcharge, 0.15) : rawSurcharge;

  /* ── Holding period slider handler ── */
  const handleSliderDays = (days: number) => {
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    setHoldYears(y);
    setHoldMonths(Math.min(m, 11));
  };

  /* ── Active row for rate table ── */
  function getActiveRowIdx(inc: number): number {
    if (inc <= 300_000) return 0;
    if (inc <= 700_000) return 1;
    if (inc <= 1_000_000) return 2;
    if (inc <= 1_200_000) return 3;
    if (inc <= 1_500_000) return 4;
    if (inc <= 5_000_000) return 5;
    if (inc <= 10_000_000) return 6;
    if (inc <= 20_000_000) return 7;
    if (inc <= 50_000_000) return 8;
    return 9;
  }
  const activeRowIdx = getActiveRowIdx(income);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Page Header ── */}
      <div className="border-b px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Calculator
              </span>
              <span className="text-[10px] text-gray-400">Finance Act 2025 · FY 2025-26</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              Capital Gains Calculator
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Exact STCG / LTCG tax with surcharge, cess, loss carry-forward, and the 730-day threshold strategy.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: isLTCG ? "#EDFAF3" : "#FEF2F2", border: `1px solid ${isLTCG ? "#B4E3C8" : "#FECACA"}` }}>
            {isLTCG ? <CheckCircle2 className="h-5 w-5" style={{ color: "#05A049" }} /> : <AlertCircle className="h-5 w-5" style={{ color: "#DC2626" }} />}
            <div>
              <p className="text-xs font-semibold" style={{ color: isLTCG ? "#05A049" : "#DC2626" }}>
                {isLTCG ? "Long-Term Gain" : "Short-Term Gain"}
              </p>
              <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: isLTCG ? "#05A049" : "#DC2626" }}>
                {PCT(breakdown.effectiveRate)}
              </p>
              <p className="text-[10px] text-gray-400">effective rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">

        {/* ═══════════════════════════════════
            LEFT — Inputs
        ═══════════════════════════════════ */}
        <div className="lg:w-[400px] lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-6 border-r space-y-6" style={{ borderColor: "#E5E7EB", background: "#fff" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#05A049" }}>Investment Details</p>

            {/* Currency toggle */}
            <div className="mb-5">
              <SectionLabel>Currency</SectionLabel>
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                {(["INR", "USD"] as const).map((c) => (
                  <button key={c} onClick={() => setCurrency(c)} className="flex-1 py-2 text-sm font-semibold transition-all"
                    style={{ background: currency === c ? "#00111B" : "#fff", color: currency === c ? "#fff" : "#6B7280" }}>
                    {c === "INR" ? "₹ INR" : "$ USD"}
                  </button>
                ))}
              </div>
              {currency === "USD" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Exchange rate (₹ per $1)</span>
                  <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-24 rounded-lg border px-2 py-1.5 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB" }} />
                </div>
              )}
            </div>

            {/* Buy / Sell prices */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <SectionLabel>Purchase Price ({currency})</SectionLabel>
                <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
              </div>
              <div>
                <SectionLabel>Sale Price ({currency})</SectionLabel>
                <input type="number" value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
              </div>
            </div>

            {/* Units */}
            <div className="mb-5">
              <SectionLabel>Number of units / shares</SectionLabel>
              <input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
            </div>

            {/* Holding period */}
            <div className="mb-2">
              <SectionLabel>Holding Period</SectionLabel>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Years</label>
                  <input type="number" min={0} max={30} value={holdYears}
                    onChange={(e) => setHoldYears(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Months</label>
                  <input type="number" min={0} max={11} value={holdMonths}
                    onChange={(e) => setHoldMonths(Math.min(11, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
                </div>
              </div>
              <input type="range" min={0} max={3650} step={30} value={sliderDays}
                onChange={(e) => handleSliderDays(Number(e.target.value))}
                className="w-full h-2 appearance-none rounded-full cursor-pointer"
                style={{ accentColor: isLTCG ? "#05A049" : "#DC2626" }} />
              <div className="flex justify-between mt-1.5 items-center">
                <span className="text-[10px] text-gray-400">0 days</span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: isLTCG ? "#EDFAF3" : "#FFFBF0", color: isLTCG ? "#05A049" : "#B8913A" }}
                >
                  {isLTCG ? `✓ LONG TERM (${holdingDays} days)` : `⚡ SHORT TERM (${holdingDays} days)`}
                </span>
                <span className="text-[10px] text-gray-400">10 yrs</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#05A049" }}>Tax Profile</p>

            {/* Income slider */}
            <div className="mb-5">
              <SectionLabel>Annual income (excl. this gain)</SectionLabel>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" value={income}
                  onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none" style={{ borderColor: "#E5E7EB", color: "#00111B" }} />
                <span className="text-xs text-gray-400">₹</span>
              </div>
              <input type="range" min={0} max={60_000_000} step={100_000} value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full h-2 appearance-none rounded-full cursor-pointer" style={{ accentColor: "#05A049" }} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">₹0</span>
                <span className="text-[11px] font-semibold" style={{ color: "#00111B" }}>{INR_L(income)}</span>
                <span className="text-[10px] text-gray-400">₹5 Cr+</span>
              </div>
            </div>

            {/* Tax regime */}
            <div className="mb-5">
              <SectionLabel>Tax regime (FY 2025-26)</SectionLabel>
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                {(["new", "old"] as TaxRegime[]).map((r) => (
                  <button key={r} onClick={() => setRegime(r)} className="flex-1 py-2.5 text-sm font-semibold transition-all"
                    style={{ background: regime === r ? "#00111B" : "#fff", color: regime === r ? "#fff" : "#6B7280" }}>
                    {r === "new" ? "New (Default)" : "Old Regime"}
                  </button>
                ))}
              </div>
            </div>

            {/* Carry-forward losses */}
            <div>
              <SectionLabel>Carry-forward capital losses</SectionLabel>
              <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: "1px solid #E5E7EB" }}>
                {([false, true] as const).map((v) => (
                  <button key={String(v)} onClick={() => setHasLosses(v)} className="flex-1 py-2.5 text-sm font-semibold transition-all"
                    style={{ background: hasLosses === v ? "#00111B" : "#fff", color: hasLosses === v ? "#fff" : "#6B7280" }}>
                    {v ? "Yes, I have losses" : "No losses"}
                  </button>
                ))}
              </div>
              {hasLosses && (
                <div className="grid grid-cols-2 gap-3 mt-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">STCL carry-forward (₹)</label>
                    <input type="number" value={stclCarry} onChange={(e) => setStclCarry(Number(e.target.value))}
                      className="w-full rounded-lg border px-2 py-1.5 text-xs font-bold focus:outline-none bg-white" style={{ borderColor: "#FECACA" }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">LTCL carry-forward (₹)</label>
                    <input type="number" value={ltclCarry} onChange={(e) => setLtclCarry(Number(e.target.value))}
                      className="w-full rounded-lg border px-2 py-1.5 text-xs font-bold focus:outline-none bg-white" style={{ borderColor: "#FECACA" }} />
                  </div>
                  <p className="col-span-2 text-[10px] text-gray-500">
                    STCL offsets STCG + LTCG. LTCL offsets LTCG only. Carry-forward valid for 8 AYs if ITR filed by Jul 31.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════
            RIGHT — Outputs
        ═══════════════════════════════════ */}
        <div className="flex-1 p-6 space-y-5">

          {/* ── CARD 1: Gain Summary ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.05)" }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: isLoss ? "#FEF2F2" : "#EDFAF3" }}>
                {isLoss ? <TrendingDown className="h-4 w-4" style={{ color: "#DC2626" }} /> : <TrendingUp className="h-4 w-4" style={{ color: "#05A049" }} />}
              </div>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>Your Gain / Loss</h2>
              <span className="ml-auto rounded-full px-3 py-1 text-xs font-bold" style={{
                background: isLTCG ? "#EDFAF3" : "#FFFBF0",
                color: isLTCG ? "#05A049" : "#B8913A"
              }}>
                {isLTCG ? "LONG TERM · 730+ days" : `SHORT TERM · ${holdingDays} days`}
              </span>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Purchase Value", value: INR_L(purchaseValue), variant: "neutral" },
                { label: "Sale Value", value: INR_L(saleValue), variant: "neutral" },
                { label: isLoss ? "Capital Loss" : "Capital Gain", value: INR_L(rawGain), variant: isLoss ? "red" : "green" },
                { label: "Taxable Gain", value: INR_L(taxableGain), variant: taxableGain > 0 ? "gold" : "green" },
              ].map(({ label, value, variant }) => {
                const c = {
                  green:   { bg: "#EDFAF3", text: "#05A049", border: "#B4E3C8" },
                  red:     { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
                  gold:    { bg: "#FFFBF0", text: "#B8913A", border: "#E8C97A" },
                  neutral: { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
                }[variant]!;
                return (
                  <div key={label} className="rounded-xl px-4 py-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: "#6B7280" }}>{label}</p>
                    <p className="text-base font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: c.text }}>{value}</p>
                  </div>
                );
              })}
            </div>
            {hasLosses && lossOffset > 0 && (
              <div className="mx-6 mb-4 rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "#05A049" }} />
                <p className="text-sm" style={{ color: "#05A049" }}>
                  Carry-forward losses of {INR_L(lossOffset)} offset against {isLTCG ? "LTCG" : "STCG"} → taxable gain reduced to {INR_L(taxableGain)}
                </p>
              </div>
            )}
          </div>

          {/* ── CARD 2: Tax Breakdown ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.05)" }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                <Calculator className="h-4 w-4" style={{ color: "#00111B" }} />
              </div>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>Tax Liability</h2>
              <button
                onClick={() => setShowMath(!showMath)}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ background: showMath ? "#00111B" : "#F9FAFB", color: showMath ? "#fff" : "#6B7280", border: "1px solid #E5E7EB" }}
              >
                {showMath ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Show Math
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { label: "Base Rate", value: PCT(breakdown.baseRate), sub: isLTCG ? "Section 112" : "Slab rate" },
                  { label: isLTCG ? "Surcharge (capped 15%)" : "Surcharge (uncapped)", value: PCT(effectiveSurcharge), sub: isLTCG ? "✓ LTCG benefit" : rawSurcharge > 0.15 ? "⚠ No cap!" : "—" },
                  { label: "Cess", value: "4.00%", sub: "Health & Education" },
                  { label: "Effective Rate", value: PCT(breakdown.effectiveRate), sub: isLTCG ? "Max 14.95%" : "Max 42.74%" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-xl px-4 py-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <p className="text-[10px] font-medium mb-0.5" style={{ color: "#6B7280" }}>{label}</p>
                    <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>{value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Tax Payable</p>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#DC2626" }}>
                    {INR_L(taxAmount)}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Net Proceeds (after tax)</p>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                    {INR_L(netProceeds)}
                  </p>
                </div>
              </div>

              {/* Show Math panel */}
              {showMath && (
                <div className="mt-5 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                  <div className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ background: "#00111B", color: "#B4E3C8" }}>
                    Step-by-step calculation
                  </div>
                  <div className="divide-y divide-gray-100">
                    <StepRow step={1} desc="Gain = (Sale − Purchase) × Units" value={`${INR_L(saleValue)} − ${INR_L(purchaseValue)} = ${INR_L(rawGain)}`} />
                    {currency === "USD" && (
                      <StepRow step={2} desc={`USD → INR conversion @ ₹${exchangeRate}/$ exchange rate`} value={`$${sellPrice} × ${exchangeRate} = ₹${(sellPrice * exchangeRate).toFixed(0)}/unit`} />
                    )}
                    <StepRow step={currency === "USD" ? 3 : 2} desc={`Holding ${holdingDays} days vs 730-day threshold`}
                      value={isLTCG ? "730+ → LTCG (12.5% flat)" : `< 730 → STCG (slab ${PCT(breakdown.baseRate)})`} />
                    {hasLosses && lossOffset > 0 && (
                      <StepRow step={currency === "USD" ? 4 : 3} desc="Less: carry-forward loss offset"
                        value={`${INR_L(rawGain)} − ${INR_L(lossOffset)} = ${INR_L(taxableGain)}`} />
                    )}
                    <StepRow step={4} desc={isLTCG ? "LTCG base rate (Section 112 – no indexation)" : `Marginal slab rate (${regime === "new" ? "New" : "Old"} regime)`}
                      value={PCT(breakdown.baseRate)} />
                    <StepRow step={5} desc={isLTCG ? "Surcharge — CAPPED at 15% for LTCG (key HNI advantage)" : `Surcharge — uncapped for STCG (marginal rate ${PCT(rawSurcharge)})`}
                      value={`+${PCT(effectiveSurcharge)}${isLTCG && rawSurcharge > 0.15 ? ` ← capped from ${PCT(rawSurcharge)}` : ""}`} />
                    <StepRow step={6} desc="Health & Education Cess (always 4%)"
                      value="+4.00%" />
                    <StepRow step={7} desc="Effective rate = base × (1 + surcharge) × (1 + cess)"
                      value={`${PCT(breakdown.baseRate)} × ${(1 + effectiveSurcharge).toFixed(4)} × 1.04 = ${PCT(breakdown.effectiveRate)}`} />
                    <StepRow step={8} desc={`Tax = Taxable Gain × Effective Rate`}
                      value={`${INR_L(taxableGain)} × ${PCT(breakdown.effectiveRate)} = ${INR_L(taxAmount)}`}
                      highlight />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── CARD 3: Waiting Game (only if STCG) ── */}
          {!isLTCG && daysToLTCG > 0 && rawGain > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049", background: "#fff", boxShadow: "0 4px 20px rgba(5,160,73,0.1)" }}>
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#F0FAF5" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EDFAF3" }}>
                  <Timer className="h-4 w-4" style={{ color: "#05A049" }} />
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                    The Waiting Game 🎯
                  </h2>
                  <p className="text-xs text-gray-500">You are <strong>{daysToLTCG} days</strong> away from LTCG threshold</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-500">You save by waiting</p>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                    {INR_L(taxSaving)}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    <p className="text-[10px] text-gray-500 mb-1">Tax if sell now</p>
                    <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#DC2626" }}>{INR_L(taxAmount)}</p>
                    <p className="text-[10px] mt-1" style={{ color: "#DC2626" }}>STCG @ {PCT(breakdown.effectiveRate)}</p>
                  </div>
                  <div className="flex items-center justify-center flex-col gap-1">
                    <ArrowRight className="h-5 w-5 text-gray-300" />
                    <span className="text-[11px] font-bold" style={{ color: "#05A049" }}>Wait {daysToLTCG}d</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                    <p className="text-[10px] text-gray-500 mb-1">Tax if wait for LTCG</p>
                    <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{INR_L(taxIfWait)}</p>
                    <p className="text-[10px] mt-1" style={{ color: "#05A049" }}>LTCG @ {PCT(ltcgBreakdown.effectiveRate)}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[{ name: "Sell now (STCG)", tax: taxAmount }, { name: "Wait for LTCG", tax: taxIfWait }]} barSize={60} margin={{ top: 4, bottom: 4 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => INR_L(v)} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [INR_L(v), "Tax"]} contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "12px" }} />
                    <Bar dataKey="tax" radius={[8, 8, 0, 0]}>
                      <Cell fill="#DC2626" />
                      <Cell fill="#05A049" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Holding Period Timeline ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 8px rgba(0,17,27,0.04)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>Holding Period Timeline</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tax rate changes at the 730-day mark</p>
            </div>
            <div className="px-6 py-5">
              <div className="relative">
                {/* Background bar */}
                <div className="h-6 w-full rounded-full overflow-hidden flex" style={{ border: "1px solid #E5E7EB" }}>
                  {/* STCG zone */}
                  <div className="h-full" style={{ width: "20%", background: "#FEF2F2" }} />
                  <div className="h-full" style={{ width: "80%", background: "#EDFAF3" }} />
                </div>
                {/* 730-day marker */}
                <div className="absolute top-0 h-6 w-0.5" style={{ left: "20%", background: "#05A049" }} />
                <div className="absolute -top-5 text-[9px] font-bold" style={{ left: "20%", transform: "translateX(-50%)", color: "#05A049" }}>
                  730 days — LTCG (14.95% max)
                </div>
                {/* User's position dot */}
                <div
                  className="absolute top-1 h-4 w-4 rounded-full border-2 border-white shadow-lg"
                  style={{
                    left: `${Math.min(95, (holdingDays / 3650) * 100)}%`,
                    transform: "translateX(-50%)",
                    background: isLTCG ? "#05A049" : "#DC2626",
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Day 0</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-3 inline-block rounded-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }} /> STCG zone (max 42.74%)
                  <span className="h-2 w-3 inline-block rounded-sm ml-2" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }} /> LTCG zone (max 14.95%)
                </span>
                <span>10 years</span>
              </div>
            </div>
          </div>

          {/* ── Rate Table ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
            <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>Rate Reference Table</h2>
              <Info className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-400">— New Regime FY 2025-26. Highlighted row = your bracket.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Income Bracket", "STCG Effective", "LTCG Effective", "Spread", "TLH Value / ₹1L Gain"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATE_TABLE_ROWS.map((row, i) => {
                    const r = buildRateRow(row.incomeN, regime);
                    const isActive = i === activeRowIdx;
                    return (
                      <tr key={row.label} className="border-t transition-all" style={{
                        borderColor: "#F3F4F6",
                        background: isActive ? "#F0FAF5" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}>
                        <td className="px-5 py-3 font-medium" style={{ color: isActive ? "#05A049" : "#374151" }}>
                          {row.label}
                          {isActive && <span className="ml-2 text-[9px] rounded-full px-1.5 py-0.5 font-bold" style={{ background: "#05A049", color: "#fff" }}>YOU</span>}
                        </td>
                        <td className="px-5 py-3 font-mono font-semibold" style={{ color: "#DC2626" }}>{PCT(r.stcg)}</td>
                        <td className="px-5 py-3 font-mono font-semibold" style={{ color: "#05A049" }}>{PCT(r.ltcg)}</td>
                        <td className="px-5 py-3 font-mono font-bold" style={{ color: "#B8913A" }}>{PCT(r.spread)}</td>
                        <td className="px-5 py-3 font-bold" style={{ color: "#00111B" }}>{INR(r.tlhValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-center pb-4" style={{ color: "#9CA3AF" }}>
            Indicative only. Finance Act 2025. Surcharge for LTCG capped at 15% (Section 112). Old regime max surcharge 37%. Consult your CA.
          </p>
        </div>
      </div>
    </div>
  );
}
