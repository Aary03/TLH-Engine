"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight,
  Info, FileText, Globe, Sparkles, Building2, TriangleAlert, Home, Plane,
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────────── */

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const INR_L = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return INR(n);
};
const PCT  = (n: number) => `${(n * 100).toFixed(1)}%`;
const PCT2 = (n: number) => `${(n * 100).toFixed(3).replace(/\.?0+$/, "")}%`;

/* ── Types ─────────────────────────────────────────────── */
type InvestorType = "resident" | "nri" | null;
type IncomeType   = "dividends" | "capital_gains" | "interest" | "other";

const INCOME_LABELS: Record<IncomeType, string> = {
  dividends:     "Dividends",
  capital_gains: "Capital Gains",
  interest:      "Interest / Bonds",
  other:         "Other income",
};

/* ── India slab rates ─────────────────────────────────── */
const INDIA_SLABS = [
  { label: "Up to ₹3L — 0%",   rate: 0.00 },
  { label: "₹3L–₹7L — 5%",    rate: 0.05 },
  { label: "₹7L–₹10L — 10%",  rate: 0.10 },
  { label: "₹10L–₹12L — 15%", rate: 0.15 },
  { label: "₹12L–₹15L — 20%", rate: 0.20 },
  { label: "Above ₹15L — 30%", rate: 0.30 },
];

/* ── Source countries (income origin for Resident Indians) */
interface SourceCountry { flag: string; name: string; wht: number; manual?: boolean }

const SOURCE_COUNTRIES: Record<string, SourceCountry> = {
  USA:         { flag: "🇺🇸", name: "USA",          wht: 0.25 },
  UK:          { flag: "🇬🇧", name: "UK",           wht: 0.20 },
  Singapore:   { flag: "🇸🇬", name: "Singapore",   wht: 0.00 },
  Germany:     { flag: "🇩🇪", name: "Germany",     wht: 0.26375 },
  Netherlands: { flag: "🇳🇱", name: "Netherlands", wht: 0.15 },
  Mauritius:   { flag: "🇲🇺", name: "Mauritius",   wht: 0.00 },
  Japan:       { flag: "🇯🇵", name: "Japan",       wht: 0.15 },
  Other:       { flag: "🌍",  name: "Other",        wht: 0, manual: true },
};

/* ── Small reusable bits ─────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>
      {children}
    </label>
  );
}

function InfoBox({
  icon: Icon, title, body, variant = "mint",
}: {
  icon: React.ElementType; title: string; body: React.ReactNode;
  variant?: "mint" | "gold" | "dark" | "red";
}) {
  const styles = {
    mint: { bg: "#F0FAF5", border: "#B4E3C8", title: "#05A049", icon: "#05A049" },
    gold: { bg: "#FFFBF0", border: "#E8C97A", title: "#B8913A", icon: "#B8913A" },
    dark: { bg: "#F1F5F9", border: "#CBD5E1", title: "#00111B", icon: "#00111B" },
    red:  { bg: "#FEF2F2", border: "#FECACA", title: "#DC2626", icon: "#DC2626" },
  }[variant];
  return (
    <div className="rounded-2xl p-5" style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5" style={{ color: styles.icon }} />
        <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: styles.title }}>{title}</p>
      </div>
      <div className="text-sm" style={{ color: "#374151" }}>{body}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   NRI EXPLAINER (Card B content)
══════════════════════════════════════════════════════ */

const NRI_ROWS = [
  {
    icon: "📈",
    title: "Capital Gains on GIFT City Cat III AIF",
    indiaTax: "0%",
    indiaTaxLabel: "Exempt — Section 10(23FBC)",
    description: "Non-resident investors in IFSC Category III AIFs are fully exempt from Indian tax on income and gains. India does not tax this at all. DTAA is not needed.",
    tag: "No DTAA needed — India charges nothing",
    tagColor: "#05A049",
    tagBg: "rgba(5,160,73,0.1)",
    isException: false,
  },
  {
    icon: "🇺🇸",
    title: "Gains on US Stocks via Valura GIFT City Account",
    indiaTax: "0%",
    indiaTaxLabel: "Not India-sourced",
    description: "When you buy Apple or an S&P 500 ETF via your Valura account, the underlying asset is a US security. For NRIs, India only taxes India-sourced income. Gains on US stocks are US-sourced — India does not tax them.",
    tag: "No DTAA needed — India not involved",
    tagColor: "#05A049",
    tagBg: "rgba(5,160,73,0.1)",
    isException: false,
  },
  {
    icon: "💰",
    title: "Interest on GIFT City Bonds / Deposits",
    indiaTax: "0%",
    indiaTaxLabel: "Exempt — Section 10(15)(ix)",
    description: "Interest paid to non-residents on IFSC securities is fully exempt in India. Your residence country will tax it, but India takes nothing. DTAA is not needed.",
    tag: "No DTAA needed — already 0% in India",
    tagColor: "#05A049",
    tagBg: "rgba(5,160,73,0.1)",
    isException: false,
  },
  {
    icon: "⚠️",
    title: "Indian Securities via GIFT City (Edge Case)",
    indiaTax: "12.5% LTCG",
    indiaTaxLabel: "India-sourced income — LTCG applies",
    description: "If you use your GIFT City account to invest in Indian stocks or Indian funds, that is India-sourced income. India taxes it at 12.5% LTCG (14.95% effective). Your residence country may also tax it. Here DTAA does apply — your residence country gives you FTC credit for the 12.5% Indian tax.",
    tag: "DTAA applies — FTC in your residence country",
    tagColor: "#B8913A",
    tagBg: "rgba(184,145,58,0.1)",
    isException: true,
  },
];

function NRIExplainer({ onSwitchToResident }: { onSwitchToResident: () => void }) {
  return (
    <div className="space-y-6">
      {/* Section title */}
      <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
          Why DTAA mostly doesn&apos;t apply to NRIs investing via GIFT City
        </p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
          India has structured GIFT City IFSC to be a near-zero-tax environment for non-residents.
          Most income types are already 0% in India — so there is nothing to credit against your residence country tax.
          DTAA only matters in the one edge case below.
        </p>
      </div>

      {/* 4 rows */}
      <div className="space-y-3">
        {NRI_ROWS.map((row) => (
          <div
            key={row.title}
            className="rounded-2xl overflow-hidden"
            style={{
              border: row.isException ? "2px solid #E8C97A" : "1px solid #E5E7EB",
              background: "#fff",
            }}
          >
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 items-start">
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{row.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  {row.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">{row.description}</p>
              </div>
              {/* Tax + tag */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: row.isException ? "#B8913A" : "#05A049" }}>
                    {row.indiaTax}
                  </p>
                  <p className="text-[10px]" style={{ color: row.isException ? "#B8913A" : "#05A049" }}>{row.indiaTaxLabel}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
                  style={{ background: row.tagBg, color: row.tagColor }}
                >
                  {row.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary callout — dark */}
      <div className="rounded-2xl p-6" style={{ background: "#00111B" }}>
        <p className="text-sm font-bold mb-4" style={{ fontFamily: "var(--font-manrope)", color: "#B4E3C8" }}>
          The real advantage of GIFT City for NRIs is not DTAA
        </p>
        <div className="space-y-3">
          {[
            ["Ireland UCITS ETF route", "Dividend WHT drops from 25% (direct US stocks) to ~15% via UCITS fund structure — no DTAA needed, just better fund domicile."],
            ["US Estate Tax eliminated", "IFSC fund units are not US-situs assets. $0 estate tax vs up to 40% for direct US holdings above $60,000."],
            ["Zero Indian tax on gains", "Cat III AIF exemption (Section 10(23FBC)) means India never touches your investment returns — regardless of DTAA."],
          ].map(([title, body]) => (
            <div key={title} className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
              <div>
                <p className="text-xs font-bold text-white">{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <a
            href="/calculators/estate-tax"
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "#05A049", color: "#fff" }}
          >
            See the Estate Tax Calculator <ArrowRight className="h-4 w-4" />
          </a>
          <button
            onClick={onSwitchToResident}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            I hold Indian securities via GIFT City — calculate my DTAA
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   UNIFIED REFERENCE TABLE (shown for both paths)
══════════════════════════════════════════════════════ */

function ReferenceTable({ highlightResident }: { highlightResident: boolean }) {
  const TABLE_ROWS = [
    {
      income: "Capital Gains",
      resident: "12.5% LTCG after 730 days + FTC from source country",
      nriCat3: "0% — Sec 10(23FBC) exempt",
      nriIndian: "12.5% LTCG — FTC in residence country",
      residentColor: "#374151",
      nriCat3Color: "#05A049",
      nriIndianColor: "#B8913A",
    },
    {
      income: "Dividends (US stocks)",
      resident: "Slab rate + FTC via Form 67",
      nriCat3: "0% — not India-sourced",
      nriIndian: "N/A",
      residentColor: "#374151",
      nriCat3Color: "#05A049",
      nriIndianColor: "#9CA3AF",
    },
    {
      income: "Interest (GIFT City)",
      resident: "Slab rate — NOT exempt",
      nriCat3: "0% — Sec 10(15)(ix)",
      nriIndian: "0% — Sec 10(15)(ix)",
      residentColor: "#DC2626",
      nriCat3Color: "#05A049",
      nriIndianColor: "#05A049",
    },
    {
      income: "US Estate Tax",
      resident: "Up to 40% (direct) / $0 via IFSC",
      nriCat3: "$0 — IFSC units not US-situs",
      nriIndian: "$0 — IFSC units not US-situs",
      residentColor: "#B8913A",
      nriCat3Color: "#05A049",
      nriIndianColor: "#05A049",
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
          Tax Treatment by Investor Type — GIFT City Investments
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide">Income Type</th>
              <th
                className="px-4 py-3 text-center font-bold uppercase tracking-wide"
                style={{ color: "#05A049", background: highlightResident ? "rgba(5,160,73,0.06)" : undefined }}
              >
                🇮🇳 Resident Indian
                {highlightResident && (
                  <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: "#05A049", color: "#fff" }}>YOU</span>
                )}
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide">NRI — Cat III AIF</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide">NRI — Indian Securities</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-4 py-3 font-semibold" style={{ color: "#00111B" }}>{row.income}</td>
                <td
                  className="px-4 py-3 text-center"
                  style={{ color: row.residentColor, background: highlightResident ? "rgba(5,160,73,0.03)" : undefined }}
                >
                  {row.resident}
                </td>
                <td className="px-4 py-3 text-center" style={{ color: row.nriCat3Color }}>{row.nriCat3}</td>
                <td className="px-4 py-3 text-center" style={{ color: row.nriIndianColor }}>{row.nriIndian}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t" style={{ borderColor: "#F3F4F6" }}>
        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
          NRI exemptions under Sections 10(23FBC) and 10(15)(ix) apply to income from IFSC entities. Subject to conditions. Consult your CA.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PATH SELECTOR
══════════════════════════════════════════════════════ */

function PathSelector({
  selected,
  onSelect,
}: {
  selected: InvestorType;
  onSelect: (t: InvestorType) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-4">
      {/* Card A — Resident Indian (PRIMARY) */}
      <button
        onClick={() => onSelect("resident")}
        className="text-left rounded-2xl p-6 transition-all"
        style={{
          background: selected === "resident" ? "#00111B" : "#0d1f2d",
          border: selected === "resident" ? "2px solid #05A049" : "2px solid rgba(5,160,73,0.3)",
          boxShadow: selected === "resident" ? "0 8px 32px rgba(5,160,73,0.25)" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(180,227,200,0.2)", color: "#B4E3C8" }}
          >
            Most Relevant to You
          </span>
          {selected === "resident" && (
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              style={{ background: "#05A049", color: "#fff" }}
            >
              <CheckCircle2 className="h-3 w-3" /> Selected
            </span>
          )}
        </div>
        <div className="text-3xl mb-3">🇮🇳</div>
        <p
          className="text-xl font-extrabold text-white mb-1"
          style={{ fontFamily: "var(--font-bricolage)" }}
        >
          Resident Indian
        </p>
        <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
          You live in India and invest globally via GIFT City
        </p>
        <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
          India taxes your worldwide income. Foreign countries also deduct withholding tax before paying you.
          Foreign Tax Credit (FTC) via Form 67 prevents double taxation. This calculator shows exactly how much you save.
        </p>
        <div
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: "#05A049", color: "#fff" }}
        >
          Calculate my FTC savings <ArrowRight className="h-4 w-4" />
        </div>
      </button>

      {/* Card B — NRI (SECONDARY, dimmed) */}
      <button
        onClick={() => onSelect("nri")}
        className="text-left rounded-2xl p-5 transition-all"
        style={{
          background: selected === "nri" ? "#F0F4F0" : "#F7F5F0",
          border: selected === "nri" ? "2px solid #B8913A" : "1.5px solid #D4E8DC",
          opacity: selected === "resident" ? 0.7 : 1,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(184,145,58,0.12)", color: "#B8913A" }}
          >
            Limited Applicability
          </span>
          {selected === "nri" && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#B8913A", color: "#fff" }}
            >
              <CheckCircle2 className="h-3 w-3" /> Selected
            </span>
          )}
        </div>
        <div className="text-2xl mb-2">✈️</div>
        <p
          className="text-lg font-extrabold mb-1"
          style={{ fontFamily: "var(--font-bricolage)", color: "#374151" }}
        >
          NRI via GIFT City
        </p>
        <p className="text-xs mb-3 text-gray-400">You live abroad and invest through your Valura GIFT City account</p>
        <p className="text-xs leading-relaxed mb-4 text-gray-400">
          India taxes almost nothing for NRIs investing via GIFT City. DTAA is largely not relevant here. See why below.
        </p>
        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
          style={{ background: "#E5E7EB", color: "#6B7280" }}
        >
          Understand why <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */

export default function DTAACalculator() {
  /* ── Path state ── */
  const [investorType, setInvestorType] = useState<InvestorType>(null);

  /* ── Wizard state (Resident Indian) ── */
  const [step, setStep] = useState(1);

  /* Step 1 — source country + income */
  const [sourceCountryKey, setSourceCountryKey] = useState<keyof typeof SOURCE_COUNTRIES>("USA");
  const [incomeType, setIncomeType]             = useState<IncomeType>("dividends");
  const [incomeCurrency, setIncomeCurrency]     = useState<"INR" | "USD">("INR");
  const [incomeAmount, setIncomeAmount]         = useState(1_000_000);
  const [incomeAmountInput, setIncomeAmountInput] = useState("10");
  const [sourceWHTManual, setSourceWHTManual]   = useState(0);

  /* Step 2 — Indian tax profile */
  const [indianSlabRate, setIndianSlabRate]     = useState(0.30);
  const [indianTDSDeducted, setIndianTDSDeducted] = useState(0);

  /* ── Derived values ── */
  const incomeINR = incomeCurrency === "USD" ? incomeAmount * 84.5 : incomeAmount;
  const sourceCountry = SOURCE_COUNTRIES[sourceCountryKey];
  const effectiveSourceWHT = sourceCountry.manual ? sourceWHTManual / 100 : sourceCountry.wht;

  /* ── FTC calculations ── */
  const calcIndia = useMemo(() => {
    const sourceWHTAmount     = incomeINR * effectiveSourceWHT;
    const indianSlabTaxAmount = incomeINR * indianSlabRate;
    const withoutFTCTotal     = sourceWHTAmount + indianSlabTaxAmount;
    const withoutFTCRate      = incomeINR > 0 ? withoutFTCTotal / incomeINR : 0;
    const ftcAmount           = Math.min(sourceWHTAmount, indianSlabTaxAmount);
    const withFTCTotal        = Math.max(sourceWHTAmount, indianSlabTaxAmount);
    const withFTCRate         = incomeINR > 0 ? withFTCTotal / incomeINR : 0;
    const saving              = withoutFTCTotal - withFTCTotal;
    const savingPct           = incomeINR > 0 ? saving / incomeINR : 0;
    const sourceExceedsIndia  = sourceWHTAmount > indianSlabTaxAmount;
    return {
      sourceWHTAmount, indianSlabTaxAmount,
      withoutFTCTotal, withoutFTCRate,
      ftcAmount, withFTCTotal, withFTCRate,
      saving, savingPct, sourceExceedsIndia,
    };
  }, [incomeINR, effectiveSourceWHT, indianSlabRate]);

  const handleIncomeInput = (v: string) => {
    setIncomeAmountInput(v);
    const n = parseFloat(v) * 1e5;
    if (!isNaN(n) && n > 0) setIncomeAmount(incomeCurrency === "USD" ? parseFloat(v) * 100 : n);
  };

  /* ── On path selection, reset wizard ── */
  const handlePathSelect = (t: InvestorType) => {
    setInvestorType(t);
    setStep(1);
  };

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Header ── */}
      <div className="border-b px-4 sm:px-6 md:px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Calculator · FTC & DTAA
              </span>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                Primarily for Resident Indians
              </span>
              <span className="text-[10px] text-gray-400">FY 2025-26 · Form 67 · Section 90/91</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
            >
              {investorType === "resident"
                ? "Foreign Tax Credit Calculator"
                : "Foreign Tax Credit & DTAA Calculator"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              {investorType === "resident"
                ? "Resident Indians — avoid double taxation on foreign investment income via Form 67 FTC"
                : "Understand DTAA and FTC — and discover why GIFT City makes both largely irrelevant for NRIs"}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Resident Indian", "FTC", "Form 67"].map((t) => (
                <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "#F3F4F6", color: "#6B7280" }}>{t}</span>
              ))}
            </div>
          </div>
          {/* Savings badge — only for resident Indian once calculated */}
          {investorType === "resident" && calcIndia.saving > 100 && (
            <div className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3 flex-shrink-0" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
              <Sparkles className="h-5 w-5" style={{ color: "#05A049" }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: "#05A049" }}>FTC saves you</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{INR_L(calcIndia.saving)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── INVESTOR TYPE SELECTOR (always visible) ── */}
        <div>
          {investorType && (
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#9CA3AF" }}>
              Your investor type — click to change
            </p>
          )}
          <PathSelector selected={investorType} onSelect={handlePathSelect} />
        </div>

        {/* ═══════════════════════════════════════
            RESIDENT INDIAN FLOW
        ═══════════════════════════════════════ */}
        {investorType === "resident" && (
          <>
            {/* Wizard progress */}
            <div className="flex items-center gap-3">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all"
                    style={{ background: step === s ? "#00111B" : step > s ? "#05A049" : "#E5E7EB", color: step >= s ? "#fff" : "#6B7280" }}
                  >
                    {step > s ? "✓" : s}
                  </button>
                  <span className="text-sm font-medium" style={{ color: step === s ? "#00111B" : "#9CA3AF" }}>
                    {s === 1 ? "Income Details" : "Indian Tax Profile"}
                  </span>
                  {s < 2 && <div className="h-px w-12 mx-1" style={{ background: step > s ? "#05A049" : "#E5E7EB" }} />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">

              {/* ── WIZARD PANEL ── */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.05)" }}>

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="p-6 space-y-5">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                      Step 1 — Income Details
                    </p>

                    {/* Source country */}
                    <div>
                      <SectionLabel>Source country of income</SectionLabel>
                      <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                        Which country is the source of the income you received? (You are a Resident Indian — India taxes your worldwide income at slab rates)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(SOURCE_COUNTRIES).map(([k, sc]) => (
                          <button
                            key={k}
                            onClick={() => setSourceCountryKey(k as keyof typeof SOURCE_COUNTRIES)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left"
                            style={{
                              background: sourceCountryKey === k ? "#00111B" : "#F9FAFB",
                              color: sourceCountryKey === k ? "#fff" : "#374151",
                              border: sourceCountryKey === k ? "1px solid #00111B" : "1px solid #E5E7EB",
                            }}
                          >
                            <span className="text-lg leading-none">{sc.flag}</span>
                            <div>
                              <span className="text-xs font-semibold block">{k}</span>
                              <span className="text-[9px] opacity-60">{sc.manual ? "Enter WHT below" : `${PCT2(sc.wht)} WHT`}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {sourceCountry.manual && (
                        <div className="mt-3">
                          <label className="text-[11px] font-semibold text-gray-500 block mb-1">WHT rate in source country (%)</label>
                          <input
                            type="number" min={0} max={50} step={0.1} value={sourceWHTManual}
                            onChange={(e) => setSourceWHTManual(Number(e.target.value))}
                            className="w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none"
                            style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="15"
                          />
                        </div>
                      )}
                    </div>

                    {/* Income type */}
                    <div>
                      <SectionLabel>Type of income</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(INCOME_LABELS) as IncomeType[]).map((t) => (
                          <button key={t} onClick={() => setIncomeType(t)}
                            className="rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                            style={{
                              background: incomeType === t ? "#00111B" : "#F9FAFB",
                              color: incomeType === t ? "#fff" : "#374151",
                              border: incomeType === t ? "1px solid #00111B" : "1px solid #E5E7EB",
                            }}
                          >
                            {INCOME_LABELS[t]}
                          </button>
                        ))}
                      </div>

                      {/* Income type context notes (Resident Indian) */}
                      {incomeType === "dividends" && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8" }}>
                          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                          <p className="text-xs" style={{ color: "#374151" }}>
                            Source country deducts WHT before paying you. India then taxes the gross dividend at your slab rate. <strong>FTC = WHT already paid</strong> — claimed via Form 67.
                          </p>
                        </div>
                      )}
                      {incomeType === "capital_gains" && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8" }}>
                          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                          <p className="text-xs" style={{ color: "#374151" }}>
                            India taxes at <strong>12.5% LTCG</strong> (730+ days) or slab rate for STCG. Source countries generally do not tax Indian residents&apos; CG on their own securities under most treaties.
                          </p>
                        </div>
                      )}
                      {incomeType === "interest" && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                          <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                            <strong style={{ color: "#DC2626" }}>Important: GIFT City interest income is NOT exempt for Resident Indians.</strong>{" "}
                            Section 10(15)(ix) applies only to non-residents. As a Resident Indian, you pay slab rate on all GIFT City interest income. Consider growth-oriented funds over income-distributing funds to minimize taxable interest.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Income amount */}
                    <div>
                      <SectionLabel>Income amount</SectionLabel>
                      <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: "1px solid #E5E7EB" }}>
                        {(["INR", "USD"] as const).map((c) => (
                          <button key={c} onClick={() => setIncomeCurrency(c)} className="flex-1 py-2 text-sm font-semibold transition-all"
                            style={{ background: incomeCurrency === c ? "#00111B" : "#fff", color: incomeCurrency === c ? "#fff" : "#6B7280" }}>
                            {c === "INR" ? "₹ INR" : "$ USD"}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" value={incomeAmountInput}
                          onChange={(e) => handleIncomeInput(e.target.value)}
                          className="flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none"
                          style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="10"
                        />
                        <span className="text-sm text-gray-400">{incomeCurrency === "INR" ? "Lakhs" : "USD"}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        ≈ {INR_L(incomeINR)} {incomeCurrency === "USD" ? "@ ₹84.50/$" : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
                      style={{ background: "#05A049", color: "#fff" }}
                    >
                      Next — Indian Tax Profile <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2 — Indian Tax Profile */}
                {step === 2 && (
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                        <ChevronLeft className="h-3.5 w-3.5" /> Back
                      </button>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>Step 2 — Indian Tax Profile</p>
                    </div>

                    <div>
                      <SectionLabel>Your Indian income tax slab</SectionLabel>
                      <select
                        value={indianSlabRate}
                        onChange={(e) => setIndianSlabRate(Number(e.target.value))}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none bg-white"
                        style={{ borderColor: "#E5E7EB", color: "#00111B" }}
                      >
                        {INDIA_SLABS.map((s) => (
                          <option key={s.rate} value={s.rate}>{s.label}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-400 mt-1">
                        New Tax Regime FY 2025-26. For Old Regime, select the equivalent rate.
                      </p>
                    </div>

                    <div>
                      <SectionLabel>Indian TDS / WHT already deducted (₹)</SectionLabel>
                      <input
                        type="number" value={indianTDSDeducted}
                        onChange={(e) => setIndianTDSDeducted(Number(e.target.value))}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none"
                        style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="0"
                      />
                    </div>

                    {/* Summary pill */}
                    <div className="rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FDE68A" }}>
                      <p className="text-xs font-bold" style={{ color: "#92400E" }}>
                        🇮🇳 Resident Indian | {INCOME_LABELS[incomeType]} | {INR_L(incomeINR)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Source: {sourceCountry.flag} {sourceCountryKey} @ {PCT2(effectiveSourceWHT)} WHT ·
                        Indian slab: {PCT(indianSlabRate)} ·
                        You pay: {PCT(calcIndia.withFTCRate)} (higher of two)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── OUTPUT PANEL ── */}
              <div className="space-y-4">

                {/* Savings banner */}
                {calcIndia.saving > 100 && (
                  <div className="rounded-2xl px-6 py-4 flex items-center justify-between" style={{ background: "#00111B" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(180,227,200,0.6)" }}>
                        FTC benefit on {INR_L(incomeINR)} income
                      </p>
                      <div className="flex items-end gap-3">
                        <p className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                          {INR_L(calcIndia.saving)}
                        </p>
                        <p className="text-lg font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>saved</p>
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                        File Form 67 by March 31 of Assessment Year to claim this Foreign Tax Credit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Effective saving rate</p>
                      <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#B4E3C8" }}>
                        {PCT(calcIndia.savingPct)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Two scenario cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Without FTC */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #FECACA", background: "#fff" }}>
                    <div className="px-5 py-4" style={{ background: "#FEF2F2" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-5 w-5" style={{ color: "#DC2626" }} />
                        <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#DC2626" }}>Without Foreign Tax Credit</p>
                      </div>
                      <p className="text-[10px] text-gray-500">You pay tax in both countries separately</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{sourceCountry.flag} {sourceCountryKey} WHT ({PCT2(effectiveSourceWHT)})</span>
                        <span className="font-bold" style={{ color: "#DC2626" }}>{INR_L(calcIndia.sourceWHTAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">🇮🇳 Indian slab tax ({PCT(indianSlabRate)})</span>
                        <span className="font-bold" style={{ color: "#DC2626" }}>{INR_L(calcIndia.indianSlabTaxAmount)}</span>
                      </div>
                      <div className="border-t pt-3" style={{ borderColor: "#FECACA" }}>
                        <div className="flex justify-between">
                          <span className="text-sm font-bold" style={{ color: "#DC2626" }}>Total double taxation</span>
                          <span className="text-sm font-extrabold" style={{ color: "#DC2626" }}>{INR_L(calcIndia.withoutFTCTotal)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">Combined effective rate</span>
                          <span className="text-xs font-bold text-gray-600">{PCT(calcIndia.withoutFTCRate)}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 pt-1 border-t" style={{ borderColor: "#FEF2F2" }}>
                        Source country deducts WHT before you receive income. India then taxes the gross amount at your slab — without FTC, you pay both in full.
                      </p>
                    </div>
                  </div>

                  {/* With FTC */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049", background: "#fff" }}>
                    <div className="px-5 py-4" style={{ background: "#EDFAF3" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-5 w-5" style={{ color: "#05A049" }} />
                        <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#05A049" }}>With Foreign Tax Credit (Form 67)</p>
                      </div>
                      <p className="text-[10px] text-gray-500">India credits the WHT you already paid abroad</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{sourceCountry.flag} {sourceCountryKey} WHT deducted</span>
                        <span className="font-bold" style={{ color: "#00111B" }}>{INR_L(calcIndia.sourceWHTAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">🇮🇳 Indian slab tax on gross income</span>
                        <span className="font-bold" style={{ color: "#00111B" }}>{INR_L(calcIndia.indianSlabTaxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Less: FTC via Form 67</span>
                        <span className="font-bold" style={{ color: "#05A049" }}>−{INR_L(calcIndia.ftcAmount)}</span>
                      </div>
                      {calcIndia.sourceExceedsIndia && (
                        <div className="rounded-lg px-2 py-1.5 text-[10px]" style={{ background: "#FFFBF0", border: "1px solid #FDE68A", color: "#92400E" }}>
                          ⚠ Source WHT ({PCT2(effectiveSourceWHT)}) &gt; Indian slab ({PCT(indianSlabRate)}) — excess WHT of {INR_L(calcIndia.sourceWHTAmount - calcIndia.indianSlabTaxAmount)} is not refundable.
                        </div>
                      )}
                      <div className="border-t pt-3" style={{ borderColor: "#B4E3C8" }}>
                        <div className="flex justify-between">
                          <span className="text-sm font-bold" style={{ color: "#05A049" }}>Total tax actually paid</span>
                          <span className="text-sm font-extrabold" style={{ color: "#05A049" }}>{INR_L(calcIndia.withFTCTotal)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">Combined effective rate</span>
                          <span className="text-xs font-bold text-gray-600">{PCT(calcIndia.withFTCRate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FTC rule callout */}
                <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8" }}>
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                  <p className="text-xs" style={{ color: "#374151" }}>
                    <strong style={{ color: "#05A049" }}>Under FTC, you pay the higher of Indian slab rate or source country WHT — never both stacked.</strong>{" "}
                    Excess foreign WHT above your Indian liability is not refundable and cannot be carried forward.
                  </p>
                </div>

                {/* GIFT City callout for Resident Indians */}
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #B4E3C8", borderLeft: "4px solid #05A049", background: "rgba(180,227,200,0.08)" }}>
                  <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#B4E3C8" }}>
                    <Building2 className="h-5 w-5" style={{ color: "#05A049" }} />
                    <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                      Important: GIFT City changes this picture for Resident Indians
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
                    {[
                      {
                        label: "GIFT City bond / fund interest",
                        nri: { badge: "NRI", color: "#05A049", bg: "#EDFAF3", text: "0% — exempt under Sec 10(15)(ix)" },
                        resident: { badge: "Resident", color: "#DC2626", bg: "#FEF2F2", text: "Taxable at slab rate (up to 30%)" },
                        action: "Structure investments in growth-oriented IFSC funds rather than income-distributing bonds to minimise interest income taxable at slab rate.",
                        actionBg: "#FFF7ED", actionBorder: "#FDE68A", actionColor: "#92400E",
                      },
                      {
                        label: "Capital Gains on GIFT City funds",
                        resident: { badge: "Resident", color: "#05A049", bg: "#EDFAF3", text: "12.5% LTCG after 730 days — same as NRI. Surcharge capped at 15%." },
                        action: "Hold for 730+ days to lock in the 14.95% effective maximum rate (12.5% base × 1.15 surcharge × 1.04 cess).",
                        actionBg: "#EDFAF3", actionBorder: "#B4E3C8", actionColor: "#374151",
                      },
                      {
                        label: "Schedule FA disclosure (mandatory)",
                        resident: { badge: "Resident", color: "#374151", bg: "#F3F4F6", text: "GIFT City IFSC investments are treated as foreign assets under FEMA. Must be disclosed in Schedule FA of ITR-2/3 every year." },
                        warning: "Failure to disclose = penalty ₹10 lakh per year under the Black Money Act.",
                        action: "Valura auto-generates your Schedule FA data — download from the Compliance section before filing your ITR.",
                        actionBg: "#F0FAF5", actionBorder: "#B4E3C8", actionColor: "#374151",
                      },
                    ].map((row, i) => (
                      <div key={i} className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
                        <div>
                          <p className="text-xs font-bold mb-1.5" style={{ color: "#00111B" }}>{row.label}</p>
                          {"nri" in row && row.nri && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-bold rounded-full px-1.5" style={{ background: "#EDFAF3", color: "#05A049" }}>NRI</span>
                              <span className="text-[11px] font-semibold" style={{ color: "#05A049" }}>{row.nri.text}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-1.5">
                            <span className="text-[9px] font-bold rounded-full px-1.5 mt-0.5" style={{ background: row.resident.bg, color: row.resident.color }}>Resident</span>
                            <span className="text-[11px]" style={{ color: "#374151" }}>{row.resident.text}</span>
                          </div>
                          {"warning" in row && row.warning && (
                            <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                              <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                              <p className="text-[10px] font-bold" style={{ color: "#DC2626" }}>{row.warning}</p>
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl px-3 py-2 text-xs" style={{ background: row.actionBg, border: `1px solid ${row.actionBorder}`, color: row.actionColor }}>
                          <strong>Action:</strong> {row.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resident Indian: source country reference table */}
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
                  <div className="px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
                    <Globe className="h-4 w-4" style={{ color: "#6B7280" }} />
                    <p className="text-sm font-bold" style={{ color: "#00111B" }}>Foreign Dividend WHT Reference — Resident Indians</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          {["Country", "Source WHT", "Your Slab", "FTC Applied", "You Pay", "GIFT City Route"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide first:text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(SOURCE_COUNTRIES).filter(([k]) => k !== "Other").map(([k, sc]) => {
                          const isActive = k === sourceCountryKey;
                          const ftcRow   = Math.min(sc.wht, indianSlabRate);
                          const youPay   = Math.max(sc.wht, indianSlabRate);
                          return (
                            <tr key={k} className="border-t" style={{ borderColor: "#F3F4F6", background: isActive ? "#F0FAF5" : "transparent" }}>
                              <td className="px-3 py-2.5 font-medium" style={{ color: isActive ? "#05A049" : "#374151" }}>
                                {sc.flag} {k}
                                {isActive && <span className="ml-1 text-[9px] rounded-full px-1.5 font-bold" style={{ background: "#05A049", color: "#fff" }}>YOU</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold" style={{ color: sc.wht > indianSlabRate ? "#DC2626" : "#374151" }}>
                                {PCT2(sc.wht)}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono">{PCT(indianSlabRate)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-semibold" style={{ color: "#05A049" }}>
                                {ftcRow === 0 ? "—" : PCT2(ftcRow)}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono font-extrabold"
                                style={{ color: youPay > 0.25 ? "#DC2626" : youPay === indianSlabRate ? "#374151" : "#B8913A" }}>
                                {PCT2(youPay)}
                              </td>
                              <td className="px-3 py-2.5 text-[10px]" style={{ color: "#6B7280" }}>
                                Interest: slab rate. LTCG: 14.95% max.
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form 67 */}
                <InfoBox icon={FileText} title="Form 67 — Do not miss this deadline" variant="gold"
                  body={
                    <div className="space-y-2 text-sm">
                      <p><strong>File Form 67 by March 31 of the Assessment Year.</strong></p>
                      <p className="text-gray-500">Must match Schedule FSI in ITR-2 or ITR-3. Missing the deadline means <strong style={{ color: "#DC2626" }}>permanently losing the Foreign Tax Credit</strong> — you cannot file it late or carry it forward.</p>
                      <div className="mt-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "#fff", border: "1px solid #E8C97A" }}>
                        <p><strong>Checklist:</strong> TDS certificate from payer · Foreign tax receipt · Form 67 on e-filing portal · Match Schedule FSI and TR in ITR</p>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════
            NRI EXPLAINER FLOW
        ═══════════════════════════════════════ */}
        {investorType === "nri" && (
          <NRIExplainer onSwitchToResident={() => handlePathSelect("resident")} />
        )}

        {/* ═══════════════════════════════════════
            UNIFIED REFERENCE TABLE (both paths)
        ═══════════════════════════════════════ */}
        {investorType && (
          <ReferenceTable highlightResident={investorType === "resident"} />
        )}

        {/* ─ CTA ─ */}
        {investorType && (
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "#00111B" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(180,227,200,0.6)" }}>
                {investorType === "resident" ? "Resident Indian GIFT City account" : "NRI GIFT City account"}
              </p>
              <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                {investorType === "resident" ? "Open your Resident Indian Valura GIFT City account" : "Open your NRI Valura GIFT City account"}
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {investorType === "resident"
                  ? "Auto Schedule FA · Form 67 reminders · LTCG tracking · IFSC fund access"
                  : "Cat III AIF exemption · US Estate Tax protection · Ireland UCITS ETF route"}
              </p>
            </div>
            <a href="/signup" className="flex-shrink-0 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-90" style={{ background: "#05A049", color: "#fff" }}>
              Open Account <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Disclaimers */}
        {investorType && (
          <p className="text-[10px] text-center pb-3 leading-relaxed" style={{ color: "#9CA3AF" }}>
            For Resident Indians: FTC under Section 90/91 requires filing Form 67 by March 31 of the Assessment Year. Must match Schedule FSI and TR entries in ITR-2 or ITR-3. Excess WHT over Indian tax liability is not refundable. For NRIs: tax exemptions under Sections 10(23FBC) and 10(15)(ix) are subject to conditions including non-resident status and IFSC fund classification. Consult a qualified CA before filing.
          </p>
        )}
      </div>
    </div>
  );
}
