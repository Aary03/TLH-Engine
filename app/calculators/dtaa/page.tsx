"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight,
  Info, FileText, Globe, Sparkles, Building2, TriangleAlert,
} from "lucide-react";

/* ── Helpers ─────────────────────────────────────────── */

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const INR_L = (n: number) => {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return INR(n);
};
const PCT = (n: number) => `${(n * 100).toFixed(1)}%`;
const PCT2 = (n: number) => `${(n * 100).toFixed(3).replace(/\.?0+$/, "")}%`;

/* ══════════════════════════════════════════════════════
   NRI COUNTRY DATA  (unchanged)
══════════════════════════════════════════════════════ */

interface CountryData {
  flag: string;
  name: string;
  dividendWHT: number;
  cgRate: number;
  interestWHT: number;
  typicalMarginalRate: number;
  cgNote?: string;
  hint: string;
}

// India appears FIRST so the picker grid renders it at top-left
const COUNTRIES: Record<string, CountryData> = {
  India:       { flag: "🇮🇳", name: "India (Resident Indian)", dividendWHT: 0, cgRate: 0.125, interestWHT: 0, typicalMarginalRate: 0, hint: "You are a Resident Indian. India taxes your worldwide income. Source countries deduct WHT before paying you — claim it back as Foreign Tax Credit via Form 67." },
  UAE:         { flag: "🇦🇪", name: "UAE",         dividendWHT: 0.10, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.00, hint: "UAE has no personal income tax. Indian DTAA WHT is the only tax." },
  UK:          { flag: "🇬🇧", name: "UK",          dividendWHT: 0.15, cgRate: 0.125, interestWHT: 0.15, typicalMarginalRate: 0.40, hint: "UK marginal rate: 45% for income above £125,140. Dividend rate: 39.35% for additional-rate taxpayers." },
  USA:         { flag: "🇺🇸", name: "USA",         dividendWHT: 0.25, cgRate: 0.125, interestWHT: 0.15, typicalMarginalRate: 0.37, hint: "US federal top rate: 37%. State taxes add 0–13%. Long-term CG rate: 20%+3.8% NIIT." },
  Singapore:   { flag: "🇸🇬", name: "Singapore",  dividendWHT: 0.15, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.22, hint: "Singapore top personal rate: 22%. No capital gains tax. Dividend income: 0% (one-tier system)." },
  Canada:      { flag: "🇨🇦", name: "Canada",     dividendWHT: 0.25, cgRate: 0.125, interestWHT: 0.15, typicalMarginalRate: 0.33, hint: "Canada federal top rate: 33%. Provinces add 12–25%. Capital gains: 50% inclusion at marginal rate." },
  Australia:   { flag: "🇦🇺", name: "Australia",  dividendWHT: 0.15, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.45, hint: "Australia top rate: 45% for income above AUD 180,001. CGT: 50% discount if held 12+ months." },
  Germany:     { flag: "🇩🇪", name: "Germany",    dividendWHT: 0.10, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.42, hint: "Germany: flat 25% Abgeltungsteuer (capital gains tax) + solidarity surcharge + church tax." },
  Netherlands: { flag: "🇳🇱", name: "Netherlands",dividendWHT: 0.10, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.37, hint: "Netherlands: Box 3 wealth tax at assumed 6.17% return taxed at 36%. Top income rate: 49.5%." },
  Mauritius:   { flag: "🇲🇺", name: "Mauritius",  dividendWHT: 0.05, cgRate: 0.00,  interestWHT: 0.00, typicalMarginalRate: 0.15, hint: "Mauritius-India treaty: 5% WHT on dividends. Capital gains EXEMPT in India under old protocol. No CG tax in Mauritius.", cgNote: "CG may be exempt under Mauritius protocol — verify with CA" },
  Japan:       { flag: "🇯🇵", name: "Japan",      dividendWHT: 0.10, cgRate: 0.125, interestWHT: 0.10, typicalMarginalRate: 0.45, hint: "Japan top rate: 55% (national 45% + local 10%). Listed securities gains: flat 20.315%." },
  Other:       { flag: "🌍", name: "Other",        dividendWHT: 0.30, cgRate: 0.125, interestWHT: 0.20, typicalMarginalRate: 0.30, hint: "Without a DTAA, India charges full domestic WHT (20% for dividends). Check treaties at incometaxindia.gov.in." },
};

type IncomeType = "dividends" | "capital_gains" | "interest" | "other";

const INCOME_LABELS: Record<IncomeType, string> = {
  dividends:     "Dividends",
  capital_gains: "Capital Gains",
  interest:      "Interest / Bonds",
  other:         "Other income",
};

const NON_DTAA_RATES: Record<IncomeType, number> = {
  dividends:     0.30,
  capital_gains: 0.125,
  interest:      0.20,
  other:         0.30,
};

/* ══════════════════════════════════════════════════════
   INDIA-SPECIFIC DATA
══════════════════════════════════════════════════════ */

const INDIA_SLABS = [
  { label: "Up to ₹3L — 0%",   rate: 0.00 },
  { label: "₹3L–₹7L — 5%",    rate: 0.05 },
  { label: "₹7L–₹10L — 10%",  rate: 0.10 },
  { label: "₹10L–₹12L — 15%", rate: 0.15 },
  { label: "₹12L–₹15L — 20%", rate: 0.20 },
  { label: "Above ₹15L — 30%", rate: 0.30 },
];

interface SourceCountry {
  flag: string;
  name: string;
  wht: number;       // dividend WHT imposed by that country on Indian residents
  manual?: boolean;  // user must enter WHT manually
}

const SOURCE_COUNTRIES: Record<string, SourceCountry> = {
  USA:         { flag: "🇺🇸", name: "USA",         wht: 0.25 },
  UK:          { flag: "🇬🇧", name: "UK",          wht: 0.20 },
  Singapore:   { flag: "🇸🇬", name: "Singapore",  wht: 0.00 },
  Germany:     { flag: "🇩🇪", name: "Germany",    wht: 0.26375 },
  Netherlands: { flag: "🇳🇱", name: "Netherlands",wht: 0.15 },
  Mauritius:   { flag: "🇲🇺", name: "Mauritius",  wht: 0.00 },
  Japan:       { flag: "🇯🇵", name: "Japan",      wht: 0.15 },
  Other:       { flag: "🌍", name: "Other",        wht: 0, manual: true },
};

/* ── Sub-components ──────────────────────────────────── */

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
   MAIN COMPONENT
══════════════════════════════════════════════════════ */

export default function DTAACalculator() {
  /* Wizard state */
  const [step, setStep] = useState(1);

  /* Step 1 inputs */
  const [countryKey, setCountryKey] = useState<keyof typeof COUNTRIES>("UAE");
  const [incomeType, setIncomeType] = useState<IncomeType>("dividends");
  const [incomeCurrency, setIncomeCurrency] = useState<"INR" | "USD">("INR");
  const [incomeAmount, setIncomeAmount] = useState(1_000_000);
  const [incomeAmountInput, setIncomeAmountInput] = useState("10");

  /* Step 2 — NRI inputs (unchanged) */
  const [foreignMarginalRate, setForeignMarginalRate] = useState<number>(COUNTRIES["UAE"].typicalMarginalRate);
  const [indianTDSDeducted, setIndianTDSDeducted] = useState(0);

  /* Step 2 — India (Resident Indian) inputs */
  const [indianSlabRate, setIndianSlabRate] = useState(0.30);
  const [sourceCountryKey, setSourceCountryKey] = useState<keyof typeof SOURCE_COUNTRIES>("USA");
  const [sourceWHTManual, setSourceWHTManual] = useState(0);

  const isIndiaResident = countryKey === "India";
  const country = COUNTRIES[countryKey];
  const incomeINR = incomeCurrency === "USD" ? incomeAmount * 84.5 : incomeAmount;

  /* ── Resident India effective WHT ── */
  const sourceCountry = SOURCE_COUNTRIES[sourceCountryKey];
  const effectiveSourceWHT = sourceCountry.manual ? sourceWHTManual / 100 : sourceCountry.wht;

  /* ══════════════════════════════════
     NRI CALCULATIONS  (unchanged)
  ══════════════════════════════════ */
  const calc = useMemo(() => {
    let dtaaRate = 0;
    let nonDtaaRate = NON_DTAA_RATES[incomeType];
    if (incomeType === "dividends")      dtaaRate = country.dividendWHT;
    else if (incomeType === "capital_gains") { dtaaRate = country.cgRate; nonDtaaRate = 0.125; }
    else if (incomeType === "interest")  dtaaRate = country.interestWHT;
    else                                 dtaaRate = 0.30;

    const isGiftCityInterest = incomeType === "interest";
    const withoutDtaaIndianTax  = incomeINR * nonDtaaRate;
    const withoutDtaaForeignTax = incomeINR * foreignMarginalRate;
    const withoutDtaaTotal      = withoutDtaaIndianTax + withoutDtaaForeignTax;
    const withoutDtaaRate       = incomeINR > 0 ? withoutDtaaTotal / incomeINR : 0;
    const withDtaaIndianTax     = incomeINR * (isGiftCityInterest ? 0 : dtaaRate);
    const grossForeignTax       = incomeINR * foreignMarginalRate;
    const ftc                   = Math.min(withDtaaIndianTax, grossForeignTax);
    const netForeignTax         = Math.max(0, grossForeignTax - ftc);
    const withDtaaTotal         = withDtaaIndianTax + netForeignTax;
    const withDtaaRate          = incomeINR > 0 ? withDtaaTotal / incomeINR : 0;
    const netPayable            = Math.max(0, withDtaaTotal - indianTDSDeducted);
    const saving                = withoutDtaaTotal - withDtaaTotal;
    const savingPct             = incomeINR > 0 ? saving / incomeINR : 0;

    return {
      dtaaRate, nonDtaaRate, isGiftCityInterest,
      withoutDtaaIndianTax, withoutDtaaForeignTax, withoutDtaaTotal, withoutDtaaRate,
      withDtaaIndianTax, grossForeignTax, ftc, netForeignTax, withDtaaTotal, withDtaaRate,
      netPayable, saving, savingPct,
    };
  }, [country, incomeType, incomeINR, foreignMarginalRate, indianTDSDeducted]);

  /* ══════════════════════════════════
     INDIA-SPECIFIC CALCULATIONS
  ══════════════════════════════════ */
  const calcIndia = useMemo(() => {
    const sourceWHTAmount   = incomeINR * effectiveSourceWHT;
    const indianSlabTaxAmount = incomeINR * indianSlabRate;
    // Without FTC: both stacked
    const withoutFTCTotal   = sourceWHTAmount + indianSlabTaxAmount;
    const withoutFTCRate    = incomeINR > 0 ? withoutFTCTotal / incomeINR : 0;
    // FTC = min(source WHT, Indian tax) — capped, excess not refundable
    const ftcAmount         = Math.min(sourceWHTAmount, indianSlabTaxAmount);
    const withFTCTotal      = Math.max(sourceWHTAmount, indianSlabTaxAmount); // pay the higher
    const withFTCRate       = incomeINR > 0 ? withFTCTotal / incomeINR : 0;
    const saving            = withoutFTCTotal - withFTCTotal;
    const savingPct         = incomeINR > 0 ? saving / incomeINR : 0;
    const sourceExceedsIndia = sourceWHTAmount > indianSlabTaxAmount;

    return {
      sourceWHTAmount, indianSlabTaxAmount,
      withoutFTCTotal, withoutFTCRate,
      ftcAmount, withFTCTotal, withFTCRate,
      saving, savingPct, sourceExceedsIndia,
    };
  }, [incomeINR, effectiveSourceWHT, indianSlabRate]);

  /* ── Event handlers ── */
  const handleCountryChange = (k: keyof typeof COUNTRIES) => {
    setCountryKey(k);
    if (k !== "India") {
      setForeignMarginalRate(COUNTRIES[k].typicalMarginalRate);
      setIndianTDSDeducted(Math.round(incomeINR * COUNTRIES[k].dividendWHT));
    }
  };

  const handleIncomeInput = (v: string) => {
    setIncomeAmountInput(v);
    const n = parseFloat(v) * 1e5;
    if (!isNaN(n) && n > 0) setIncomeAmount(incomeCurrency === "USD" ? parseFloat(v) * 100 : n);
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Header ── */}
      <div className="border-b px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Calculator
              </span>
              <span className="text-[10px] text-gray-400">DTAA rates · FY 2025-26 · Form 67</span>
              {isIndiaResident && (
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(255,153,0,0.1)", color: "#D97706" }}>
                  🇮🇳 Resident Indian flow
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              {isIndiaResident ? "Foreign Tax Credit (FTC) Calculator" : "DTAA Tax Credit Calculator"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              {isIndiaResident
                ? "As a Resident Indian, source countries deduct WHT before paying you. Claim it back as FTC via Form 67 and pay only the higher of the two rates."
                : "Quantify how treaty protection eliminates double taxation on Indian-source income for NRIs."}
            </p>
          </div>
          {/* Savings badge */}
          {isIndiaResident
            ? calcIndia.saving > 100 && (
              <div className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                <Sparkles className="h-5 w-5" style={{ color: "#05A049" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#05A049" }}>FTC saves you</p>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{INR_L(calcIndia.saving)}</p>
                </div>
              </div>
            )
            : calc.saving > 0 && (
              <div className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                <Sparkles className="h-5 w-5" style={{ color: "#05A049" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#05A049" }}>DTAA saves you</p>
                  <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{INR_L(calc.saving)}</p>
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Progress ── */}
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
                {s === 1 ? "Income Details" : isIndiaResident ? "Indian Tax Profile" : "Tax Rates"}
              </span>
              {s < 2 && <div className="h-px w-12 mx-1" style={{ background: step > s ? "#05A049" : "#E5E7EB" }} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">

          {/* ═══════════════════════════════
              WIZARD INPUTS
          ═══════════════════════════════ */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.05)" }}>

            {/* ─ STEP 1 (shared) ─ */}
            {step === 1 && (
              <div className="p-6 space-y-5">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                  Step 1 — Income Details
                </p>

                {/* Country picker */}
                <div>
                  <SectionLabel>Country of residence</SectionLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(COUNTRIES).map(([k, c]) => {
                      const isIndia = k === "India";
                      const isActive = countryKey === k;
                      return (
                        <button
                          key={k}
                          onClick={() => handleCountryChange(k as keyof typeof COUNTRIES)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left"
                          style={{
                            background: isActive
                              ? (isIndia ? "#00111B" : "#00111B")
                              : isIndia ? "#FFF7ED" : "#F9FAFB",
                            color: isActive ? "#fff" : isIndia ? "#92400E" : "#374151",
                            border: isActive
                              ? `1px solid #00111B`
                              : isIndia ? "1px solid #FDE68A" : "1px solid #E5E7EB",
                          }}
                        >
                          <span className="text-lg leading-none">{c.flag}</span>
                          <span className="text-xs font-semibold leading-tight">
                            {k === "India" ? "India" : k}
                            {k === "India" && <span className="block text-[9px] font-normal opacity-70">Resident Indian</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-xl px-3 py-2 text-[11px]" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                    <Info className="h-3 w-3 inline mr-1" />{country.hint}
                  </div>
                </div>

                {/* Income type */}
                <div>
                  <SectionLabel>Type of income</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(INCOME_LABELS) as IncomeType[]).map((t) => (
                      <button key={t} onClick={() => setIncomeType(t)}
                        className="rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                        style={{ background: incomeType === t ? "#00111B" : "#F9FAFB", color: incomeType === t ? "#fff" : "#374151", border: incomeType === t ? "1px solid #00111B" : "1px solid #E5E7EB" }}>
                        {INCOME_LABELS[t]}
                      </button>
                    ))}
                  </div>

                  {/* Income type context notes */}
                  {isIndiaResident ? (
                    <>
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
                            India taxes at <strong>12.5% LTCG</strong> (730+ days) or slab rate for STCG. Source countries generally do not tax Indian residents' CG on their own securities under most treaties.
                          </p>
                        </div>
                      )}
                      {incomeType === "interest" && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#FFFBF0", border: "1px solid #FDE68A" }}>
                          <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                          <p className="text-xs" style={{ color: "#92400E" }}>
                            <strong>GIFT City interest is NOT exempt for Resident Indians.</strong> Section 10(15)(ix) applies only to non-residents. You pay your full slab rate on all interest income from IFSC funds.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {incomeType === "interest" && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                          <p className="text-xs" style={{ color: "#05A049" }}>
                            <strong>Interest from GIFT City IFSC bonds is already 0% in India</strong> under Section 10(15)(ix). DTAA is not needed for this income type.
                          </p>
                        </div>
                      )}
                      {incomeType === "capital_gains" && country.cgNote && (
                        <div className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                          <p className="text-xs" style={{ color: "#B8913A" }}>{country.cgNote}</p>
                        </div>
                      )}
                    </>
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
                    <input type="number" value={incomeAmountInput} onChange={(e) => handleIncomeInput(e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none"
                      style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="10" />
                    <span className="text-sm text-gray-400">{incomeCurrency === "INR" ? "Lakhs" : "USD"}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ≈ {INR_L(incomeINR)} {incomeCurrency === "USD" ? "@ ₹84.50/$" : ""}
                  </p>
                </div>

                <button onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
                  style={{ background: "#05A049", color: "#fff" }}>
                  Next — {isIndiaResident ? "Indian Tax Profile" : "Tax Rates"} <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ─ STEP 2 — NRI (unchanged) ─ */}
            {step === 2 && !isIndiaResident && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>Step 2 — Tax Rates</p>
                </div>

                <div>
                  <SectionLabel>Your marginal rate in {country.name}</SectionLabel>
                  <input type="range" min={0} max={55} step={0.5} value={foreignMarginalRate * 100}
                    onChange={(e) => setForeignMarginalRate(Number(e.target.value) / 100)}
                    className="w-full h-2 appearance-none rounded-full cursor-pointer mb-2"
                    style={{ accentColor: "#DC2626" }} />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#DC2626" }}>{PCT(foreignMarginalRate)}</span>
                    <span className="text-[10px] text-gray-400">55%</span>
                  </div>
                  <div className="mt-2 rounded-xl px-3 py-2 text-[11px]" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                    💡 Typical {country.name} rate: <strong>{PCT(country.typicalMarginalRate)}</strong> — {country.hint.split(".")[0]}
                  </div>
                </div>

                <div>
                  <SectionLabel>Indian TDS / WHT already deducted (₹)</SectionLabel>
                  <input type="number" value={indianTDSDeducted} onChange={(e) => setIndianTDSDeducted(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none"
                    style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="0" />
                  <p className="text-[11px] text-gray-400 mt-1">
                    DTAA-capped WHT would be: {INR_L(incomeINR * (incomeType === "dividends" ? country.dividendWHT : incomeType === "interest" ? 0 : country.cgRate))}
                  </p>
                </div>

                <div className="rounded-xl p-4" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8" }}>
                  <p className="text-xs font-bold" style={{ color: "#05A049" }}>
                    {country.flag} {country.name} | {INCOME_LABELS[incomeType]} | {INR_L(incomeINR)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    DTAA rate: {PCT(calc.dtaaRate)} · Foreign marginal: {PCT(foreignMarginalRate)} · Without DTAA: {PCT(calc.nonDtaaRate)}
                  </p>
                </div>
              </div>
            )}

            {/* ─ STEP 2 — RESIDENT INDIAN ─ */}
            {step === 2 && isIndiaResident && (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>Step 2 — Indian Tax Profile</p>
                </div>

                {/* Indian slab rate */}
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
                    New Tax Regime FY 2025-26 slabs. For Old Regime, select the equivalent rate.
                  </p>
                </div>

                {/* Source country */}
                <div>
                  <SectionLabel>Which country is the source of this income?</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(SOURCE_COUNTRIES).map(([k, sc]) => (
                      <button key={k} onClick={() => setSourceCountryKey(k as keyof typeof SOURCE_COUNTRIES)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left"
                        style={{
                          background: sourceCountryKey === k ? "#00111B" : "#F9FAFB",
                          color: sourceCountryKey === k ? "#fff" : "#374151",
                          border: sourceCountryKey === k ? "1px solid #00111B" : "1px solid #E5E7EB",
                        }}>
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
                      <input type="number" min={0} max={50} step={0.1} value={sourceWHTManual}
                        onChange={(e) => setSourceWHTManual(Number(e.target.value))}
                        className="w-full rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none"
                        style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="15" />
                    </div>
                  )}
                </div>

                {/* Indian TDS already deducted */}
                <div>
                  <SectionLabel>Indian TDS / WHT already deducted (₹)</SectionLabel>
                  <input type="number" value={indianTDSDeducted} onChange={(e) => setIndianTDSDeducted(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm font-bold focus:outline-none"
                    style={{ borderColor: "#E5E7EB", color: "#00111B" }} placeholder="0" />
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

          {/* ═══════════════════════════════
              OUTPUT SECTION
          ═══════════════════════════════ */}
          <div className="space-y-4">

            {/* ════════════════════════════
                INDIA OUTPUT
            ════════════════════════════ */}
            {isIndiaResident ? (
              <>
                {/* India savings banner */}
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

                {/* India: two scenario cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Card LEFT — Without FTC */}
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

                  {/* Card RIGHT — With FTC */}
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

                {/* India-specific GIFT City callout */}
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #B4E3C8", borderLeft: "4px solid #05A049", background: "rgba(180,227,200,0.08)" }}>
                  <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#B4E3C8" }}>
                    <Building2 className="h-5 w-5" style={{ color: "#05A049" }} />
                    <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                      Important: GIFT City changes this picture for Resident Indians
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
                    {/* Row 1 — Interest */}
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
                      <div>
                        <p className="text-xs font-bold" style={{ color: "#00111B" }}>GIFT City bond / fund interest</p>
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold rounded-full px-1.5" style={{ background: "#EDFAF3", color: "#05A049" }}>NRI</span>
                            <span className="text-[11px] font-semibold" style={{ color: "#05A049" }}>0% — exempt under Sec 10(15)(ix)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold rounded-full px-1.5" style={{ background: "#FEF2F2", color: "#DC2626" }}>Resident</span>
                            <span className="text-[11px] font-semibold" style={{ color: "#DC2626" }}>Taxable at slab rate (up to 30%)</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#FFF7ED", border: "1px solid #FDE68A", color: "#92400E" }}>
                        <strong>Action:</strong> Structure investments in growth-oriented IFSC funds rather than income-distributing bonds to minimise interest income taxable at slab rate.
                      </div>
                    </div>
                    {/* Row 2 — LTCG */}
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
                      <div>
                        <p className="text-xs font-bold" style={{ color: "#00111B" }}>Capital Gains on GIFT City funds</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[9px] font-bold rounded-full px-1.5" style={{ background: "#EDFAF3", color: "#05A049" }}>Resident</span>
                          <span className="text-[11px] font-semibold" style={{ color: "#05A049" }}>12.5% LTCG after 730 days — same as NRI. Surcharge capped at 15%.</span>
                        </div>
                      </div>
                      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8", color: "#374151" }}>
                        <strong>Action:</strong> Hold for 730+ days to lock in the 14.95% effective maximum rate (12.5% base × 1.15 surcharge × 1.04 cess).
                      </div>
                    </div>
                    {/* Row 3 — Schedule FA */}
                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
                      <div>
                        <p className="text-xs font-bold" style={{ color: "#00111B" }}>Schedule FA disclosure (mandatory)</p>
                        <div className="mt-1.5 flex items-start gap-1.5">
                          <span className="text-[9px] font-bold rounded-full px-1.5 mt-0.5" style={{ background: "#FEF2F2", color: "#DC2626" }}>Resident</span>
                          <span className="text-[11px]" style={{ color: "#374151" }}>GIFT City IFSC investments are treated as foreign assets under FEMA. Must be disclosed in Schedule FA of ITR-2/3 every year.</span>
                        </div>
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                          <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                          <p className="text-[10px] font-bold" style={{ color: "#DC2626" }}>
                            Failure to disclose = penalty ₹10 lakh per year under the Black Money Act.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#F0FAF5", border: "1px solid #B4E3C8", color: "#374151" }}>
                        <strong>Action:</strong> Valura auto-generates your Schedule FA data — download from the Compliance section before filing your ITR.
                      </div>
                    </div>
                  </div>
                </div>

                {/* India reference table */}
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
                  <div className="px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
                    <Globe className="h-4 w-4" style={{ color: "#6B7280" }} />
                    <p className="text-sm font-bold" style={{ color: "#00111B" }}>Foreign Dividend WHT Reference — Resident Indians</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "#F9FAFB" }}>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">Source WHT</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">Your Slab</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">FTC Applied</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">You Pay</th>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">GIFT City Route</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(SOURCE_COUNTRIES).filter(([k]) => k !== "Other").map(([k, sc]) => {
                          const isActive = k === sourceCountryKey;
                          const ftcRow = Math.min(sc.wht, indianSlabRate);
                          const youPay = Math.max(sc.wht, indianSlabRate);
                          return (
                            <tr key={k} className="border-t" style={{ borderColor: "#F3F4F6", background: isActive ? "#F0FAF5" : "transparent" }}>
                              <td className="px-3 py-2.5 font-medium" style={{ color: isActive ? "#05A049" : "#374151" }}>
                                {sc.flag} {k}
                                {isActive && <span className="ml-1 text-[9px] rounded-full px-1.5 font-bold" style={{ background: "#05A049", color: "#fff" }}>YOU</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold" style={{ color: sc.wht > indianSlabRate ? "#DC2626" : "#374151" }}>
                                {PCT2(sc.wht)}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono" style={{ color: "#374151" }}>{PCT(indianSlabRate)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-semibold" style={{ color: "#05A049" }}>
                                {ftcRow === 0 ? "—" : PCT2(ftcRow)}
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono font-extrabold" style={{ color: youPay > 0.25 ? "#DC2626" : youPay === indianSlabRate ? "#374151" : "#B8913A" }}>
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
              </>
            ) : (

            /* ════════════════════════════
               NRI OUTPUT (unchanged)
            ════════════════════════════ */
            <>
              {calc.saving > 100 && (
                <div className="rounded-2xl px-6 py-4 flex items-center justify-between" style={{ background: "#00111B" }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(180,227,200,0.6)" }}>
                      Treaty benefit on {INR_L(incomeINR)} income
                    </p>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{INR_L(calc.saving)}</p>
                      <p className="text-lg font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>saved</p>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      File Form 67 by March 31 of Assessment Year to claim this benefit
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Effective saving rate</p>
                    <p className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#B4E3C8" }}>{PCT(calc.savingPct)}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #FECACA", background: "#fff" }}>
                  <div className="px-5 py-4" style={{ background: "#FEF2F2" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-5 w-5" style={{ color: "#DC2626" }} />
                      <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#DC2626" }}>Without Treaty Protection</p>
                    </div>
                    <p className="text-[10px] text-gray-500">Full double taxation — both countries tax independently</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Indian tax (full domestic WHT {PCT(calc.nonDtaaRate)})</span>
                      <span className="font-bold" style={{ color: "#DC2626" }}>{INR_L(calc.withoutDtaaIndianTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Foreign tax ({country.name} @ {PCT(foreignMarginalRate)})</span>
                      <span className="font-bold" style={{ color: "#DC2626" }}>{INR_L(calc.withoutDtaaForeignTax)}</span>
                    </div>
                    <div className="border-t pt-3" style={{ borderColor: "#FECACA" }}>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold" style={{ color: "#DC2626" }}>Total double taxation</span>
                        <span className="text-sm font-extrabold" style={{ color: "#DC2626" }}>{INR_L(calc.withoutDtaaTotal)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Combined effective rate</span>
                        <span className="text-xs font-bold text-gray-600">{PCT(calc.withoutDtaaRate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid #05A049", background: "#fff" }}>
                  <div className="px-5 py-4" style={{ background: "#EDFAF3" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-5 w-5" style={{ color: "#05A049" }} />
                      <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#05A049" }}>With DTAA Protection</p>
                    </div>
                    <p className="text-[10px] text-gray-500">Treaty caps Indian WHT + Foreign Tax Credit via Form 67</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {calc.isGiftCityInterest ? (
                      <div className="rounded-xl px-3 py-2" style={{ background: "#EDFAF3" }}>
                        <p className="text-sm font-bold" style={{ color: "#05A049" }}>0% in India — Section 10(15)(ix)</p>
                        <p className="text-xs text-gray-500 mt-1">GIFT City IFSC interest is fully exempt. Only foreign tax applies.</p>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Indian DTAA-capped WHT ({PCT(calc.dtaaRate)})</span>
                        <span className="font-bold" style={{ color: "#00111B" }}>{INR_L(calc.withDtaaIndianTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Gross foreign tax ({PCT(foreignMarginalRate)})</span>
                      <span className="font-bold" style={{ color: "#00111B" }}>{INR_L(calc.grossForeignTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Less: Foreign Tax Credit (Form 67)</span>
                      <span className="font-bold" style={{ color: "#05A049" }}>−{INR_L(calc.ftc)}</span>
                    </div>
                    <div className="border-t pt-3" style={{ borderColor: "#B4E3C8" }}>
                      <div className="flex justify-between">
                        <span className="text-sm font-bold" style={{ color: "#05A049" }}>Total tax actually paid</span>
                        <span className="text-sm font-extrabold" style={{ color: "#05A049" }}>{INR_L(calc.withDtaaTotal)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Combined effective rate</span>
                        <span className="text-xs font-bold text-gray-600">{PCT(calc.withDtaaRate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NRI: DTAA reference table */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
                <div className="px-6 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
                  <Globe className="h-4 w-4" style={{ color: "#6B7280" }} />
                  <p className="text-sm font-bold" style={{ color: "#00111B" }}>India DTAA Dividend WHT Reference</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">Dividend WHT</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">CG Rate (India)</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500 uppercase tracking-wide">GIFT City Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(COUNTRIES).filter(([k]) => k !== "Other" && k !== "India").map(([k, c]) => {
                        const isActive = k === countryKey;
                        return (
                          <tr key={k} className="border-t" style={{ borderColor: "#F3F4F6", background: isActive ? "#F0FAF5" : k === "Mauritius" ? "#FFFBF0" : "transparent" }}>
                            <td className="px-4 py-2.5 font-medium" style={{ color: isActive ? "#05A049" : "#374151" }}>
                              {c.flag} {c.name}
                              {isActive && <span className="ml-1 text-[9px] rounded-full px-1.5 font-bold" style={{ background: "#05A049", color: "#fff" }}>YOU</span>}
                              {k === "Mauritius" && <span className="ml-1 text-[9px] rounded-full px-1.5 font-bold" style={{ background: "#E8C97A", color: "#B8913A" }}>Lowest WHT</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold" style={{ color: c.dividendWHT <= 0.10 ? "#05A049" : "#DC2626" }}>{PCT(c.dividendWHT)}</td>
                            <td className="px-4 py-2.5 text-center font-mono" style={{ color: "#374151" }}>{c.cgRate === 0 ? "0% (treaty)" : "12.5% LTCG"}</td>
                            <td className="px-4 py-2.5 text-center font-semibold text-[11px]" style={{ color: "#05A049" }}>0% (Sec 10(15)(ix))</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NRI: GIFT City callout */}
              <InfoBox icon={Building2} title="Why GIFT City makes this even better" variant="mint"
                body={
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold" style={{ color: "#05A049" }}>0%</span>
                      <span><strong>Interest income:</strong> Already exempt in India under Section 10(15)(ix). DTAA not needed — you only pay foreign country tax.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold" style={{ color: "#05A049" }}>~15%</span>
                      <span><strong>Dividends via Ireland UCITS ETF route:</strong> ≈15% WHT vs 25% direct US stocks — treaty-optimized structure.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold" style={{ color: "#05A049" }}>12.5%</span>
                      <span><strong>Capital gains:</strong> Standard LTCG rate with zero US estate tax risk (critical for USD assets above $60,000).</span>
                    </li>
                  </ul>
                }
              />
            </>
            )}

            {/* Form 67 reminder (always shown) */}
            <InfoBox icon={FileText} title="Form 67 — Do not miss this deadline" variant="gold"
              body={
                <div className="space-y-2 text-sm">
                  <p><strong>File Form 67 by March 31 of the Assessment Year.</strong></p>
                  <p className="text-gray-500">Must match Schedule FSI in ITR-2 or ITR-3. Missing the deadline means <strong style={{ color: "#DC2626" }}>permanently losing the Foreign Tax Credit</strong> — you cannot file it late for a revised return.</p>
                  <div className="mt-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "#fff", border: "1px solid #E8C97A" }}>
                    <p><strong>Checklist:</strong> TDS certificate from Indian payer · Foreign tax receipt · Form 67 online on e-filing portal · Match with Schedule FSI in ITR</p>
                  </div>
                </div>
              }
            />

            {/* CTA */}
            <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "#00111B" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(180,227,200,0.6)" }}>
                  {isIndiaResident ? "Resident Indian GIFT City account" : "NRI GIFT City account"}
                </p>
                <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                  {isIndiaResident ? "Open your Resident Indian Valura GIFT City account" : "Open your NRI Valura GIFT City account"}
                </p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {isIndiaResident
                    ? "Auto Schedule FA · Form 67 reminders · LTCG tracking · IFSC fund access"
                    : "Automatic DTAA optimisation · Form 67 reminders · GIFT City IFSC funds"}
                </p>
              </div>
              <a href="/signup" className="flex-shrink-0 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-90" style={{ background: "#05A049", color: "#fff" }}>
                Open Account <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Disclaimers */}
            <p className="text-[10px] text-center pb-1" style={{ color: "#9CA3AF" }}>
              DTAA rates as of FY 2025-26. Individual treaty articles, beneficial ownership conditions, and Principal Purpose Test (PPT) may vary. Foreign Tax Credit subject to Section 90/91 limits. Consult your CA before filing.
            </p>
            {isIndiaResident && (
              <p className="text-[10px] text-center pb-3" style={{ color: "#9CA3AF" }}>
                For Resident Indians: Foreign Tax Credit under Section 90/91 is subject to conditions including filing Form 67 by March 31 of the Assessment Year, Schedule FA disclosure in ITR-2/ITR-3, and matching entries in Schedule FSI and TR. Excess FTC (WHT greater than Indian tax) is not refundable and cannot be carried forward. Consult your CA.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
