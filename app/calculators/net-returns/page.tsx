"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ComposedChart, AreaChart, Area, BarChart, Bar,
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import {
  ChevronDown, ChevronUp, Download, ArrowRight,
  CheckCircle2, Info, TriangleAlert, TrendingUp,
  Shield, BadgePercent, Coins, Sparkles,
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
══════════════════════════════════════════════════════ */

const NRA_EXEMPTION_USD = 60_000;
const DIV_WHT_A = 0.25;   // Direct US stocks — NRA rate
const DIV_WHT_B = 0.15;   // Ireland UCITS route
const LTCG_RATE = 0.1495; // 12.5% × 1.15 × 1.04

const ESTATE_BRACKETS = [
  { size: 10_000, rate: 0.18 }, { size: 10_000, rate: 0.20 },
  { size: 20_000, rate: 0.22 }, { size: 20_000, rate: 0.24 },
  { size: 20_000, rate: 0.26 }, { size: 20_000, rate: 0.28 },
  { size: 50_000, rate: 0.30 }, { size: 100_000, rate: 0.32 },
  { size: 250_000, rate: 0.34 }, { size: 250_000, rate: 0.37 },
  { size: 250_000, rate: 0.39 }, { size: Infinity, rate: 0.40 },
];

function calcEstateTaxUSD(usd: number) {
  const taxable = Math.max(0, usd - NRA_EXEMPTION_USD);
  let rem = taxable, total = 0;
  for (const b of ESTATE_BRACKETS) {
    if (rem <= 0) break;
    const inB = b.size === Infinity ? rem : Math.min(rem, b.size);
    total += inB * b.rate; rem -= inB;
  }
  return total;
}

const STCG_RATES: Record<string, number> = {
  "0-10l": 0.1092, "10-50l": 0.1755, "50l-1cr": 0.2145,
  "1-2cr": 0.2496, "2-5cr": 0.3432, "5cr+": 0.4274,
};

const fmtINR = (n: number, compact = true) => {
  if (!compact) return `₹${Math.round(n).toLocaleString("en-IN")}`;
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
const fmtUSD = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n).toLocaleString("en-US")}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

/* ── Slider ── */
function Slider({ value, onChange, min, max, step = 1, label, format }: {
  value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number;
  label: string; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#6B7280" }}>{label}</label>
        <span className="text-sm font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none rounded-full cursor-pointer"
        style={{ accentColor: "#05A049" }} />
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>{children}</p>;
}

/* ══════════════════════════════════════════════════════
   CORE PROJECTION ENGINE
══════════════════════════════════════════════════════ */

interface ProjParams {
  initialINR: number; annualAddINR: number; years: number;
  returnRate: number; dividendYield: number;
  strategy: "ltcg" | "stcg" | "mixed";
  stcgRate: number; platformFeeRate: number;
  exchangeRate: number; estateProbability: number;
  familyMembers: number;
}

interface YearRow {
  year: number;
  corpusA: number; corpusB: number;
  taxYearA: number; taxYearB: number;
  cumTaxA: number; cumTaxB: number;
  irrA: number; irrB: number;
  advantage: number;
}

interface ProjResult {
  rows: YearRow[];
  tcsDragA: number; tcsDragB: number;
  cumDivTaxA: number; cumDivTaxB: number;
  exitTaxA: number; exitTaxB: number;
  estateTaxINR: number;
  finalA: number; finalB: number;
  breakEvenYear: number | null;
}

function runProjection(p: ProjParams): ProjResult {
  const { initialINR, annualAddINR, years, returnRate, dividendYield,
    strategy, stcgRate, platformFeeRate, exchangeRate, estateProbability, familyMembers } = p;

  // TCS
  const singleThreshold = 1_000_000; // 10L
  const familyThreshold = familyMembers * 1_000_000;
  const tcsDragA = initialINR > singleThreshold
    ? Math.min((initialINR - singleThreshold) * 0.20, initialINR * 0.20) : 0;
  const tcsDragB = initialINR > familyThreshold
    ? (initialINR - familyThreshold) * 0.20 : 0;

  const capitalGrowth = returnRate - dividendYield;

  let cA = initialINR - tcsDragA;  // Route A corpus
  let cB = initialINR - tcsDragB;  // Route B corpus
  let cumTaxA = tcsDragA;
  let cumTaxB = tcsDragB;
  let cumDivTaxA = 0, cumDivTaxB = 0;
  let cumPlatformFee = 0;
  let breakEvenYear: number | null = null;

  const rows: YearRow[] = [];

  for (let y = 1; y <= years; y++) {
    // Dividends
    const divA = cA * dividendYield;
    const divTaxA = divA * DIV_WHT_A;
    const divB = cB * dividendYield;
    const divTaxB = divB * DIV_WHT_B;
    cumDivTaxA += divTaxA;
    cumDivTaxB += divTaxB;

    // Capital growth
    const growA = cA * capitalGrowth;
    const growB = cB * capitalGrowth;

    // STCG annual tax (for active trading — on capital appreciation portion)
    let stcgTaxA = 0, stcgTaxB = 0;
    if (strategy === "stcg" || strategy === "mixed") {
      const frac = strategy === "mixed" ? 0.5 : 1;
      stcgTaxA = growA * stcgRate * frac;
      stcgTaxB = growB * stcgRate * frac;
    }

    // Platform fee (Route B)
    const pfee = cB * platformFeeRate;
    cumPlatformFee += pfee;

    // Update corpus
    cA = cA + growA + (divA - divTaxA) - stcgTaxA + annualAddINR;
    cB = cB + growB + (divB - divTaxB) - stcgTaxB - pfee + annualAddINR;

    // Cumulative tax
    const yearTaxA = divTaxA + stcgTaxA;
    const yearTaxB = divTaxB + stcgTaxB + pfee;
    cumTaxA += yearTaxA;
    cumTaxB += yearTaxB;

    // IRR (vs initial invested)
    const irrA = initialINR > 0 ? Math.pow(Math.max(cA, 0.01) / initialINR, 1 / y) - 1 : 0;
    const irrB = initialINR > 0 ? Math.pow(Math.max(cB, 0.01) / initialINR, 1 / y) - 1 : 0;

    // Break-even: year when Route B advantage exceeds cumulative platform fees
    if (!breakEvenYear && (cB - cA) > cumPlatformFee) {
      breakEvenYear = y;
    }

    rows.push({
      year: y, corpusA: cA, corpusB: cB,
      taxYearA: yearTaxA, taxYearB: yearTaxB,
      cumTaxA, cumTaxB,
      irrA, irrB,
      advantage: cB - cA,
    });
  }

  // Exit taxes
  const totalAddedA = annualAddINR * years;
  const totalAddedB = annualAddINR * years;
  const gainA = Math.max(0, cA - initialINR - totalAddedA);
  const gainB = Math.max(0, cB - initialINR - totalAddedB);

  let exitTaxA = 0, exitTaxB = 0;
  if (strategy === "ltcg") {
    exitTaxA = gainA * LTCG_RATE;
    exitTaxB = gainB * LTCG_RATE;
  } else if (strategy === "stcg") {
    // already paid annually, small residual
    exitTaxA = 0; exitTaxB = 0;
  } else {
    exitTaxA = gainA * 0.5 * LTCG_RATE;
    exitTaxB = gainB * 0.5 * LTCG_RATE;
  }

  // Estate tax (Route A only, probability weighted)
  const holdingsUSD_A = cA / exchangeRate;
  const rawEstateTax = calcEstateTaxUSD(holdingsUSD_A) * exchangeRate;
  const estateTaxINR = rawEstateTax * (estateProbability / 100);

  const finalA = cA - exitTaxA - estateTaxINR;
  const finalB = cB - exitTaxB;

  return {
    rows, tcsDragA, tcsDragB,
    cumDivTaxA, cumDivTaxB,
    exitTaxA, exitTaxB,
    estateTaxINR,
    finalA, finalB,
    breakEvenYear,
  };
}

/* ── Custom tooltips ── */
function IRRTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-lg text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
      <p className="font-bold mb-2" style={{ color: "#00111B" }}>Year {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6 items-center mb-1">
          <span style={{ color: p.color }}>■ {p.name}</span>
          <span className="font-extrabold" style={{ color: p.color }}>{fmtINR(p.value)}</span>
        </div>
      ))}
      {payload.length >= 2 && (
        <div className="mt-2 pt-2 border-t flex justify-between" style={{ borderColor: "#F3F4F6" }}>
          <span className="text-gray-400">Advantage</span>
          <span className="font-bold" style={{ color: "#05A049" }}>
            +{fmtINR(Math.max(0, (payload[1]?.value ?? 0) - (payload[0]?.value ?? 0)))}
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */

export default function NetReturnsPage() {
  /* ─── Inputs ─── */
  const [currency, setCurrency]         = useState<"INR" | "USD">("INR");
  const [initialAmt, setInitialAmt]     = useState(5_000_000);   // 50L
  const [annualAdd, setAnnualAdd]       = useState(0);
  const [years, setYears]               = useState(15);
  const [returnRate, setReturnRate]     = useState(0.12);
  const [divYield, setDivYield]         = useState(0.02);
  const [strategy, setStrategy]         = useState<"ltcg" | "stcg" | "mixed">("ltcg");
  const [investorType, setInvestorType] = useState<"resident" | "nri" | "foreign">("resident");
  const [incomeBracket, setIncomeBracket] = useState("10-50l");
  const [above5Cr, setAbove5Cr]         = useState(false);
  const [familyMembers, setFamilyMembers] = useState(2);
  const [platformFee, setPlatformFee]   = useState(0.005);
  const [exchangeRate, setExchangeRate] = useState(84.5);
  const [estatePct, setEstatePct]       = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllRows, setShowAllRows]   = useState(false);

  const initialINR = currency === "USD" ? initialAmt * exchangeRate : initialAmt;
  const stcgRate = above5Cr ? 0.4274 : STCG_RATES[incomeBracket] ?? 0.1755;

  /* ─── Projection ─── */
  const proj = useMemo(() => runProjection({
    initialINR, annualAddINR: annualAdd, years, returnRate, dividendYield: divYield,
    strategy, stcgRate, platformFeeRate: platformFee, exchangeRate,
    estateProbability: estatePct, familyMembers,
  }), [initialINR, annualAdd, years, returnRate, divYield, strategy, stcgRate, platformFee, exchangeRate, estatePct, familyMembers]);

  const finalRow = proj.rows[proj.rows.length - 1];
  const y10Row   = proj.rows[Math.min(9, proj.rows.length - 1)];

  /* ─── Waterfall data ─── */
  const grossReturn   = Math.max(0, (finalRow?.corpusA ?? 0) - initialINR);
  const waterfallData = [
    {
      name: "Route A (Direct)",
      netReturn: Math.max(0, proj.finalA - initialINR),
      cgTax: proj.exitTaxA,
      divWHT: proj.cumDivTaxA,
      tcsDrag: proj.tcsDragA,
      estateTax: proj.estateTaxINR,
      platformFee: 0,
    },
    {
      name: "Route B (Valura)",
      netReturn: Math.max(0, proj.finalB - initialINR),
      cgTax: proj.exitTaxB,
      divWHT: proj.cumDivTaxB,
      tcsDrag: proj.tcsDragB,
      estateTax: 0,
      platformFee: platformFee * initialINR * years, // approximate
    },
  ];

  const displayRows = showAllRows ? proj.rows : proj.rows.slice(0, 10);

  const tcsAdvantage = proj.tcsDragA - proj.tcsDragB;
  const divAdvantage = proj.cumDivTaxA - proj.cumDivTaxB;
  const estateAdvantage = proj.estateTaxINR;
  const totalAdvantage  = proj.finalB - proj.finalA;

  /* ─── Print ─── */
  const handlePrint = useCallback(() => { window.print(); }, []);

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }} id="net-returns-page">

      {/* HEADER */}
      <div className="border-b px-4 sm:px-6 md:px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Flagship Calculator
              </span>
              <span className="text-[10px] text-gray-400">Direct vs Valura GIFT City · After-tax projection</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              Net Returns: Direct vs Valura
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-2xl">
              The closing argument. TCS, dividend WHT, and estate tax compound silently over decades.
              This calculator shows exactly how much more wealth your family keeps via Valura.
            </p>
          </div>
          <button onClick={handlePrint}
            className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all print:hidden"
            style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>

        {/* PERSISTENT SUMMARY BAR */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#DC2626" }}>
              Route A — Direct · Final Value
            </p>
            <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#DC2626" }}>
              {fmtINR(proj.finalA)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>after all taxes · year {years}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#05A049" }}>
              Route B — Valura · Final Value
            </p>
            <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
              {fmtINR(proj.finalB)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>after all taxes · year {years}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#00111B" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(180,227,200,0.6)" }}>
              Route B Advantage
            </p>
            <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
              +{fmtINR(totalAdvantage)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {proj.finalA > 0 ? `${((totalAdvantage / proj.finalA) * 100).toFixed(1)}% more wealth at year ${years}` : "—"}
            </p>
          </div>
        </div>

        {/* 4 stat boxes */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BadgePercent, label: "TCS Saved",         value: fmtINR(Math.max(0, tcsAdvantage)), color: "#05A049", bg: "#EDFAF3", border: "#B4E3C8" },
            { icon: Shield,       label: "Estate Tax Protected", value: fmtINR(proj.estateTaxINR),       color: "#05A049", bg: "#EDFAF3", border: "#B4E3C8" },
            { icon: Coins,        label: "Dividend WHT Saved", value: fmtINR(Math.max(0, divAdvantage)), color: "#05A049", bg: "#EDFAF3", border: "#B4E3C8" },
            { icon: Sparkles,     label: `Extra Wealth Yr ${years}`, value: fmtINR(totalAdvantage),      color: "#B8913A", bg: "#FFFBF0", border: "#E8C97A" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <s.icon className="h-5 w-5 flex-shrink-0" style={{ color: s.color }} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</p>
                <p className="text-sm font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* ═══════════════════════
              LEFT — INPUTS
          ═══════════════════════ */}
          <div className="space-y-4 print:hidden">
            <div className="rounded-2xl p-5 space-y-5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <SLabel>Investment Details</SLabel>

              {/* Currency + initial */}
              <div>
                <div className="flex rounded-xl overflow-hidden mb-2" style={{ border: "1px solid #E5E7EB" }}>
                  {(["INR", "USD"] as const).map((c) => (
                    <button key={c} onClick={() => setCurrency(c)} className="flex-1 py-2 text-sm font-semibold transition-all"
                      style={{ background: currency === c ? "#00111B" : "#fff", color: currency === c ? "#fff" : "#6B7280" }}>
                      {c === "INR" ? "₹ INR" : "$ USD"}
                    </button>
                  ))}
                </div>
                <Slider value={initialAmt} onChange={setInitialAmt}
                  min={currency === "INR" ? 1_00_000 : 10_000}
                  max={currency === "INR" ? 10_00_00_000 : 1_000_000}
                  step={currency === "INR" ? 1_00_000 : 10_000}
                  label={`Initial investment (${currency})`}
                  format={(v) => currency === "INR" ? fmtINR(v) : fmtUSD(v)} />
                <p className="text-[10px] text-gray-400 mt-1">≈ {fmtINR(initialINR)}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 block mb-1">
                  Annual additional investment (₹)
                </label>
                <input type="number" value={annualAdd} step={100000}
                  onChange={(e) => setAnnualAdd(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2 text-sm font-bold focus:outline-none"
                  style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="0" />
              </div>

              <Slider value={years} onChange={setYears} min={1} max={30}
                label="Investment horizon" format={(v) => `${v} years`} />
              <Slider value={returnRate} onChange={setReturnRate} min={0.06} max={0.20} step={0.005}
                label="Expected annual return (pre-tax)" format={(v) => `${(v * 100).toFixed(1)}%`} />
              <Slider value={divYield} onChange={setDivYield} min={0} max={0.05} step={0.005}
                label="Annual dividend yield" format={(v) => `${(v * 100).toFixed(1)}%`} />

              {/* Holding strategy */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 block mb-2">
                  Holding strategy
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([["ltcg", "Long Term"], ["stcg", "Active"], ["mixed", "Mixed"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setStrategy(v)}
                      className="rounded-xl py-2 text-xs font-semibold transition-all"
                      style={{ background: strategy === v ? "#00111B" : "#F9FAFB", color: strategy === v ? "#fff" : "#374151", border: `1px solid ${strategy === v ? "#00111B" : "#E5E7EB"}` }}>
                      {l}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {strategy === "ltcg" ? "Hold 730+ days — LTCG 14.95% on exit" : strategy === "stcg" ? "Active trading — STCG at slab rate annually" : "50% LTCG at exit, 50% STCG annually"}
                </p>
              </div>
            </div>

            {/* Tax profile */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <SLabel>Tax Profile</SLabel>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 block mb-2">Investor type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([["resident", "Resident"], ["nri", "NRI"], ["foreign", "Foreign"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setInvestorType(v)}
                      className="rounded-xl py-2 text-xs font-semibold transition-all"
                      style={{ background: investorType === v ? "#00111B" : "#F9FAFB", color: investorType === v ? "#fff" : "#374151", border: `1px solid ${investorType === v ? "#00111B" : "#E5E7EB"}` }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 block mb-2">
                  Income bracket (for STCG slab)
                </label>
                <select value={incomeBracket} onChange={(e) => setIncomeBracket(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold focus:outline-none bg-white"
                  style={{ borderColor: "#E5E7EB", color: "#00111B" }}>
                  {[
                    ["0-10l", "Up to ₹10L"], ["10-50l", "₹10L–₹50L"], ["50l-1cr", "₹50L–₹1 Cr"],
                    ["1-2cr", "₹1 Cr–₹2 Cr"], ["2-5cr", "₹2 Cr–₹5 Cr"], ["5cr+", "Above ₹5 Cr"],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">STCG effective rate: {(stcgRate * 100).toFixed(2)}%</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 block mb-2">
                  Family members for LRS optimization
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFamilyMembers(Math.max(1, familyMembers - 1))}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: "#F3F4F6", color: "#374151" }}>−</button>
                  <span className="text-2xl font-extrabold w-8 text-center"
                    style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>{familyMembers}</span>
                  <button onClick={() => setFamilyMembers(Math.min(5, familyMembers + 1))}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: "#00111B", color: "#fff" }}>+</button>
                  <span className="text-xs text-gray-400">× ₹10L TCS-free = {fmtINR(familyMembers * 1_000_000)} free</span>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold"
                style={{ background: showAdvanced ? "#F0FAF5" : "#F9FAFB", color: "#00111B" }}>
                Advanced Settings
                {showAdvanced ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showAdvanced && (
                <div className="p-5 space-y-4 bg-white">
                  <Slider value={platformFee} onChange={setPlatformFee} min={0} max={0.02} step={0.001}
                    label="Valura platform fee (per year)" format={(v) => `${(v * 100).toFixed(2)}%`} />
                  <Slider value={exchangeRate} onChange={setExchangeRate} min={70} max={110} step={0.5}
                    label="INR/USD exchange rate" format={(v) => `₹${v.toFixed(1)}`} />
                  <Slider value={estatePct} onChange={setEstatePct} min={0} max={100}
                    label="Estate tax probability weighting" format={(v) => `${v}%`} />
                  <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                    <Info className="h-3.5 w-3.5 inline mr-1" />100% = conservative, assumes full estate tax applies. Reduce for partial hedging or life insurance coverage.
                  </div>
                </div>
              )}
            </div>

            {/* Capital gains equal note */}
            <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
              style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                <strong>Capital gains tax is identical in both routes.</strong> The Route B advantage comes entirely from TCS savings, lower dividend WHT (15% vs 25%), and zero estate tax risk.
              </p>
            </div>
          </div>

          {/* ═══════════════════════
              RIGHT — OUTPUTS
          ═══════════════════════ */}
          <div className="space-y-5">

            {/* ── IRR LINE CHART ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                      After-tax portfolio value diverges over time
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Red = Route A (Direct) · Green = Route B (Valura)</p>
                  </div>
                  <div className="flex gap-4 flex-shrink-0">
                    {[["#DC2626", "Direct"], ["#05A049", "Valura"]].map(([c, l]) => (
                      <div key={l} className="flex items-center gap-1.5 text-[11px]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                        <span className="text-gray-500">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={proj.rows} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#05A049" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#05A049" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="year" ticks={[1, 5, 10, 15, 20, 25, 30].filter(t => t <= years)}
                      tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmtINR(v)} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<IRRTooltip />} />
                    {y10Row && (
                      <ReferenceLine x={10} stroke="rgba(5,160,73,0.35)" strokeDasharray="4 4"
                        label={{ value: `+${fmtINR(y10Row.advantage)} at yr 10`, position: "top", fill: "#05A049", fontSize: 10, fontWeight: 600 }} />
                    )}
                    <Area type="monotone" dataKey="corpusB" name="Route B (Valura)"
                      stroke="#05A049" strokeWidth={2.5} fill="url(#gapGrad)" dot={false}
                      activeDot={{ r: 4, fill: "#05A049" }} />
                    <Line type="monotone" dataKey="corpusA" name="Route A (Direct)"
                      stroke="#DC2626" strokeWidth={2} dot={false} strokeDasharray="5 3"
                      activeDot={{ r: 4, fill: "#DC2626" }} />
                  </ComposedChart>
                </ResponsiveContainer>
                {finalRow && (
                  <div className="mt-3 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3"
                    style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                    <p className="text-xs text-center sm:text-left" style={{ color: "#374151" }}>
                      At year {years}: Route B ahead by{" "}
                      <strong style={{ color: "#05A049" }}>{fmtINR(finalRow.advantage)}</strong>
                      {" "}({finalRow.corpusA > 0 ? `${((finalRow.advantage / finalRow.corpusA) * 100).toFixed(1)}%` : "—"} more portfolio)
                    </p>
                    <div className="flex gap-3 flex-shrink-0 text-xs">
                      <span style={{ color: "#DC2626" }}>A: {fmtINR(finalRow.corpusA)}</span>
                      <span style={{ color: "#05A049" }}>B: {fmtINR(finalRow.corpusB)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── TAX WATERFALL ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  Where each rupee of return goes
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Cumulative tax drag over {years} years</p>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmtINR(v)} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v: number, name: string) => [fmtINR(v), name]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "11px" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    <Bar dataKey="netReturn"    name="Net Return"         stackId="a" fill="#05A049" />
                    <Bar dataKey="cgTax"        name="Capital Gains Tax"  stackId="a" fill="#F59E0B" />
                    <Bar dataKey="divWHT"       name="Dividend WHT"       stackId="a" fill="#F97316" />
                    <Bar dataKey="tcsDrag"      name="TCS Drag"           stackId="a" fill="#DC2626" />
                    <Bar dataKey="estateTax"    name="Estate Tax Risk"    stackId="a" fill="#7A2020" />
                    <Bar dataKey="platformFee"  name="Platform Fee (B)"   stackId="a" fill="#9CA3AF" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {waterfallData.map((d) => (
                    <div key={d.name} className="rounded-xl p-3"
                      style={{ background: d.name.includes("A") ? "#FEF2F2" : "#EDFAF3", border: `1px solid ${d.name.includes("A") ? "#FECACA" : "#B4E3C8"}` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: d.name.includes("A") ? "#DC2626" : "#05A049" }}>{d.name}</p>
                      <p className="text-sm font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
                        {fmtINR(d.netReturn)} net
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {fmtINR(d.tcsDrag + d.divWHT + d.cgTax + d.estateTax + d.platformFee)} in taxes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── YEAR-BY-YEAR TABLE ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#F3F4F6" }}>
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  Year-by-year comparison
                </p>
                <span className="text-[10px] text-gray-400">Pre-exit-tax portfolio value</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Year", "Route A Value", "Tax Paid (A)", "Route B Value", "Tax Paid (B)", "B Advantage"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row) => (
                      <tr key={row.year} className="border-t" style={{ borderColor: "#F9FAFB" }}>
                        <td className="px-4 py-2.5 font-bold" style={{ color: "#00111B" }}>Yr {row.year}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: "#DC2626" }}>{fmtINR(row.corpusA)}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-400">{fmtINR(row.cumTaxA)}</td>
                        <td className="px-4 py-2.5 font-mono font-bold" style={{ color: "#05A049" }}>{fmtINR(row.corpusB)}</td>
                        <td className="px-4 py-2.5 font-mono text-gray-400">{fmtINR(row.cumTaxB)}</td>
                        <td className="px-4 py-2.5 font-mono font-bold" style={{ color: row.advantage >= 0 ? "#05A049" : "#DC2626" }}>
                          {row.advantage >= 0 ? "+" : ""}{fmtINR(row.advantage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {proj.rows.length > 10 && (
                <div className="px-6 py-3 border-t text-center" style={{ borderColor: "#F3F4F6" }}>
                  <button onClick={() => setShowAllRows(!showAllRows)}
                    className="text-xs font-semibold flex items-center gap-1 mx-auto"
                    style={{ color: "#05A049" }}>
                    {showAllRows ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show all {proj.rows.length} years</>}
                  </button>
                </div>
              )}
            </div>

            {/* ── BREAK-EVEN CARD ── */}
            {proj.breakEvenYear && (
              <div className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: "#EDFAF3", border: "2px solid #05A049" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#05A049" }}>
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                    Break-even: Year {proj.breakEvenYear}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-600">
                    Route B&apos;s {(platformFee * 100).toFixed(2)}% platform fee is <strong>fully offset by tax savings by Year {proj.breakEvenYear}</strong>.
                    After year {proj.breakEvenYear}, every rupee of platform fee is net positive return for your family.
                  </p>
                </div>
              </div>
            )}

            {/* ── KEY DIFFERENCES SUMMARY ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  Where Route B wins — and where it doesn&apos;t
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {[
                  {
                    label: "TCS on remittance",
                    a: proj.tcsDragA > 0 ? `${fmtINR(proj.tcsDragA)} upfront drag` : "Below threshold",
                    b: proj.tcsDragB > 0 ? fmtINR(proj.tcsDragB) : "₹0 (family optimized)",
                    advantage: Math.max(0, proj.tcsDragA - proj.tcsDragB),
                    winner: "B",
                  },
                  {
                    label: "Dividend withholding tax",
                    a: `25% (${fmtINR(proj.cumDivTaxA)} cumulative)`,
                    b: `15% (${fmtINR(proj.cumDivTaxB)} cumulative)`,
                    advantage: Math.max(0, proj.cumDivTaxA - proj.cumDivTaxB),
                    winner: "B",
                  },
                  {
                    label: "Capital gains tax",
                    a: `${(LTCG_RATE * 100).toFixed(2)}% LTCG / ${(stcgRate * 100).toFixed(2)}% STCG`,
                    b: "Identical — same rules",
                    advantage: 0,
                    winner: "equal",
                  },
                  {
                    label: "US estate tax risk",
                    a: `${fmtINR(proj.estateTaxINR)} (probability weighted)`,
                    b: "₹0 — IFSC units not US-situs",
                    advantage: proj.estateTaxINR,
                    winner: "B",
                  },
                  {
                    label: "Platform fee",
                    a: "₹0",
                    b: `${(platformFee * 100).toFixed(2)}% per year`,
                    advantage: -platformFee * initialINR * years,
                    winner: "A",
                  },
                ].map((row) => (
                  <div key={row.label} className="px-5 py-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                    <span className="text-xs font-semibold" style={{ color: "#00111B" }}>{row.label}</span>
                    <span className="text-xs" style={{ color: "#DC2626" }}>{row.a}</span>
                    <span className="text-xs" style={{ color: row.winner === "equal" ? "#9CA3AF" : "#05A049" }}>{row.b}</span>
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5`}
                      style={{
                        background: row.winner === "B" ? "rgba(5,160,73,0.1)" : row.winner === "A" ? "rgba(220,38,38,0.1)" : "#F3F4F6",
                        color: row.winner === "B" ? "#05A049" : row.winner === "A" ? "#DC2626" : "#9CA3AF",
                      }}>
                      {row.winner === "B" ? "B wins" : row.winner === "A" ? "A wins" : "Equal"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FULL-WIDTH CTA ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049", boxShadow: "0 8px 32px rgba(5,160,73,0.18)" }}>
              <div className="px-4 sm:px-6 md:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: "#00111B" }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(180,227,200,0.6)" }}>
                    The closing argument
                  </p>
                  <p className="text-xl sm:text-2xl font-extrabold text-white mb-1.5" style={{ fontFamily: "var(--font-bricolage)" }}>
                    Start investing via Valura GIFT City
                  </p>
                  <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Zero TCS. Zero estate tax. IFSCA regulated. Keep{" "}
                    <strong style={{ color: "#05A049" }}>{fmtINR(totalAdvantage)}</strong> more for your family.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["Zero TCS via family optimization", "15% dividend WHT (not 25%)", "$0 US estate tax", "LTCG capped at 14.95%"].map((f) => (
                      <div key={f} className="flex items-center gap-1.5 text-xs" style={{ color: "#B4E3C8" }}>
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05A049" }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <a href="/signup"
                  className="flex-shrink-0 flex items-center gap-3 rounded-2xl px-7 py-4 text-base font-extrabold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ background: "#05A049", color: "#fff", boxShadow: "0 4px 16px rgba(5,160,73,0.35)" }}>
                  Open Account in 10 Minutes <ArrowRight className="h-5 w-5" />
                </a>
              </div>
              <div className="px-4 sm:px-8 py-3 flex flex-wrap gap-4" style={{ background: "rgba(5,160,73,0.06)", borderTop: "1px solid rgba(5,160,73,0.15)" }}>
                <span className="text-[10px]" style={{ color: "#6B7280" }}>IFSCA regulated · India-domiciled fund units · Section 10(23FBC) exempt for NRIs</span>
                <button onClick={handlePrint} className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold print:hidden"
                  style={{ color: "#05A049" }}>
                  <Download className="h-3.5 w-3.5" /> Export this comparison as PDF
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-center pb-4 leading-relaxed" style={{ color: "#9CA3AF" }}>
              Projections are illustrative only. Tax treatment per Finance Act 2025. Returns, tax rates, and regulations may change. Capital gains tax is identical in both routes — the Route B advantage comes from TCS, dividend WHT, and estate tax differences only. Consult your CA and financial advisor before investing.
            </p>
          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          #net-returns-page { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
