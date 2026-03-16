"use client";

import { useState, useMemo, useEffect } from "react";
import { getProfile } from "@/lib/user-profile";
import CalcDrawer from "@/components/chat/CalcDrawer";
import ProactiveBanner from "@/components/layout/ProactiveBanner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Users,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/* ── Helpers ──────────────────────────────────────────── */

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const INR_L = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return INR(n);
};

const PCT = (n: number) => `${n.toFixed(2)}%`;

/* ── Constants ────────────────────────────────────────── */

const THRESHOLD = 1_000_000; // ₹10 L per PAN

const TCS_RATES: Record<string, number> = {
  investment: 0.2,
  education_self: 0.05,
  medical: 0.05,
  education_80e: 0.0,
};

const PURPOSE_LABELS: Record<string, string> = {
  investment: "Investment (overseas)",
  education_self: "Education – self-funded (Sec 206C)",
  medical: "Medical treatment",
  education_80e: "Education – via Sec 80E loan (0% TCS)",
};

// Months from remittance month until ITR refund (Apr 1 + 180 days ≈ Sept 28) — unchanged
const MONTHS_LOCKED: Record<string, number> = {
  april: 18,
  may: 17,
  june: 16,
  july: 15,
  august: 14,
  september: 13,
  october: 12,
  november: 11,
  december: 10,
  january: 9,
  february: 8,
  march: 7,
};

// Advance tax: months until NEXT installment date from mid-month
const ADVANCE_TAX_MONTHS: Record<string, number> = {
  january: 1.5,
  february: 0.5,
  march: 0.5,
  april: 2.5,
  may: 1.5,
  june: 3.0,
  july: 2.0,
  august: 1.5,
  september: 2.5,
  october: 1.5,
  november: 1.0,
  december: 2.5,
};

// The exact next advance tax date label per remittance month
const ADVANCE_TAX_NEXT_DATE: Record<string, string> = {
  january: "March 15",
  february: "March 15",
  march: "March 15",
  april: "June 15",
  may: "June 15",
  june: "September 15",
  july: "September 15",
  august: "September 15",
  september: "December 15",
  october: "December 15",
  november: "December 15",
  december: "March 15",
};

/* ── Types ────────────────────────────────────────────── */
interface FamilyMember {
  id: string;
  name: string;
  remittedL: number; // lakhs already remitted this FY
}

/* ── Sub-components ───────────────────────────────────── */

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info
        className="h-3.5 w-3.5 cursor-help inline"
        style={{ color: "#B4E3C8" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span
          className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 w-64 rounded-lg p-3 text-xs leading-relaxed shadow-xl"
          style={{ background: "#00111B", color: "#E5E7EB", border: "1px solid rgba(180,227,200,0.2)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>
      {children}
    </label>
  );
}

function ValuePill({
  label,
  value,
  variant = "neutral",
}: {
  label: string;
  value: string;
  variant?: "green" | "red" | "gold" | "neutral";
}) {
  const colors = {
    green:   { bg: "#EDFAF3", text: "#05A049", border: "#B4E3C8" },
    red:     { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    gold:    { bg: "#FFFBF0", text: "#B8913A", border: "#E8C97A" },
    neutral: { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  };
  const c = colors[variant];
  return (
    <div
      className="rounded-lg px-4 py-2.5"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <p className="text-[10px] font-medium mb-0.5" style={{ color: "#6B7280" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: c.text }}>{value}</p>
    </div>
  );
}

/* ── Main Calculator Component ────────────────────────── */

export default function LRSTCSCalculator() {
  /* inputs */
  const [investmentINR, setInvestmentINR] = useState(5_000_000); // ₹50 L default
  const [investmentInput, setInvestmentInput] = useState("50"); // lakhs text
  const [alreadyRemittedINR, setAlreadyRemittedINR] = useState(0);
  const [purpose, setPurpose] = useState<keyof typeof TCS_RATES>("investment");
  const [currentMonth, setCurrentMonth] = useState("january");
  const [payAdvanceTax, setPayAdvanceTax] = useState(false);
  const [assumedReturn, setAssumedReturn] = useState(12);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  // Pre-fill from saved profile (runs once on mount)
  useEffect(() => {
    const p = getProfile();
    if (p.familyMembers.length > 1) {
      const extras: FamilyMember[] = p.familyMembers.slice(1).map((m, i) => ({
        id: `member-${i + 2}`,
        name: m.name,
        remittedL: m.fyRemittedINR / 1e5,
      }));
      setMembers(extras);
      setFamilyOpen(true);
    }
  }, []);

  /* derived */
  const tcsRate = TCS_RATES[purpose];
  const monthsLockedITR = MONTHS_LOCKED[currentMonth] ?? 9;       // ITR path (always computed)
  const monthsLockedAT  = ADVANCE_TAX_MONTHS[currentMonth] ?? 2;  // Advance-tax path
  const monthsLocked    = payAdvanceTax ? monthsLockedAT : monthsLockedITR;
  const nextATDate      = ADVANCE_TAX_NEXT_DATE[currentMonth] ?? "March 15";

  // Primary member TCS
  const totalAfter = alreadyRemittedINR + investmentINR;
  const prevTaxable = Math.max(0, alreadyRemittedINR - THRESHOLD);
  const newTaxable = Math.max(0, totalAfter - THRESHOLD) - prevTaxable;
  const taxFreeAmt = investmentINR - newTaxable;
  const tcsAmount = newTaxable * tcsRate;
  const effectiveTCSRate = investmentINR > 0 ? (tcsAmount / investmentINR) * 100 : 0;
  const netToGiftCity = investmentINR - tcsAmount;

  // IRR drag — both paths always computed for comparison / nudge
  const irrDragITR = tcsAmount * (assumedReturn / 100) * (monthsLockedITR / 12);
  const irrDragAT  = tcsAmount * (assumedReturn / 100) * (monthsLockedAT  / 12);
  const irrDrag    = payAdvanceTax ? irrDragAT : irrDragITR;
  const atOppSaving = irrDragITR - irrDragAT; // money saved in opportunity cost by using AT offset

  // Family optimization
  const allMembers = useMemo(() => {
    const primary = { id: "you", name: "You", remittedINR: alreadyRemittedINR };
    const extras = members.map((m) => ({
      id: m.id,
      name: m.name || `Member ${m.id}`,
      remittedINR: m.remittedL * 100_000,
    }));
    return [primary, ...extras];
  }, [alreadyRemittedINR, members]);

  const familyOptimization = useMemo(() => {
    let remaining = investmentINR;
    const allocs = allMembers.map((m) => {
      const cap = Math.max(0, THRESHOLD - m.remittedINR);
      const routed = Math.min(remaining, cap);
      remaining -= routed;
      return { ...m, routed, threshold: THRESHOLD, remittedINR: m.remittedINR };
    });
    // Distribute overflow proportionally
    allocs.forEach((a, i) => {
      if (remaining > 0 && i === allocs.length - 1) {
        a.routed += remaining;
        remaining = 0;
      }
    });
    const totalTaxFree = allocs.reduce((s, a) => s + Math.min(a.routed, Math.max(0, THRESHOLD - a.remittedINR)), 0);
    const totalTaxable = Math.max(0, investmentINR - totalTaxFree);
    const totalTCS = totalTaxable * tcsRate;
    const saving = tcsAmount - totalTCS;
    return { allocs, totalTaxFree, totalTaxable, totalTCS, saving };
  }, [allMembers, investmentINR, tcsRate, tcsAmount]);

  const familyCapacity = allMembers.reduce((s, m) => s + Math.max(0, THRESHOLD - m.remittedINR), 0);

  const [aiOpen, setAiOpen] = useState(false);
  const calcInputs = {
    remittanceINR: investmentINR,
    alreadyRemittedINR,
    purpose: PURPOSE_LABELS[purpose],
    currentMonth,
    payAdvanceTax,
    familyMembersCount: allMembers.length,
  };
  const calcOutputs = {
    tcsAmountINR: Math.round(tcsAmount),
    taxFreeAmountINR: Math.round(taxFreeAmt),
    effectiveTCSRatePct: +effectiveTCSRate.toFixed(2),
    netToGiftCityINR: Math.round(netToGiftCity),
    monthsLocked,
    opportunityCostINR: Math.round(irrDrag),
    familySavingINR: Math.round(familyOptimization.saving),
    totalFamilyTCSFreeCapacityINR: Math.round(familyCapacity),
  };

  const chartData = familyOptimization.allocs.map((a) => {
    const taxFree = Math.min(a.routed, Math.max(0, THRESHOLD - a.remittedINR));
    const taxable = Math.max(0, a.routed - taxFree);
    const tcsCost = taxable * tcsRate;
    return { name: a.name, "TCS-Free": taxFree, "TCS-Liable": taxable, "TCS Cost": tcsCost };
  });

  /* member management */
  const addMember = () => {
    if (members.length >= 5) return;
    setMembers((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", remittedL: 0 },
    ]);
  };
  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));
  const updateMember = (id: string, field: keyof FamilyMember, value: string | number) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleSliderChange = (val: number) => {
    setInvestmentINR(val);
    setInvestmentInput(String(Math.round(val / 1e5)));
  };

  const handleTextInput = (v: string) => {
    setInvestmentInput(v);
    const n = parseFloat(v) * 1e5;
    if (!isNaN(n) && n >= 100_000 && n <= 50_000_000) setInvestmentINR(n);
  };

  return (
    <>
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>
      {/* ── Page Header ── */}
      <div
        className="border-b px-4 sm:px-6 md:px-8 py-6"
        style={{ background: "#fff", borderColor: "#E5E7EB" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}
              >
                Calculator
              </span>
              <span className="text-[10px] text-gray-400">Finance Act 2025 · Effective 1 Apr 2025</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
            >
              LRS & TCS Calculator
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Understand your TCS liability on overseas remittances and discover how family optimization reduces your upfront cash outflow.
            </p>
          </div>
          <div
            className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: "#05A049" }} />
            <div>
              {payAdvanceTax && tcsAmount > 0 ? (
                <>
                  <p className="text-xs font-semibold" style={{ color: "#05A049" }}>
                    Family optimization saves {INR_L(Math.max(0, familyOptimization.saving))}
                  </p>
                  <p className="text-[11px] mt-0.5 font-semibold" style={{ color: "#05A049" }}>
                    · Advance tax saves {INR_L(atOppSaving)} more
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold" style={{ color: "#05A049" }}>
                    Family optimization saves
                  </p>
                  <p
                    className="text-xl font-extrabold"
                    style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}
                  >
                    {INR_L(Math.max(0, familyOptimization.saving))}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProactiveBanner />

      <div className="flex flex-col lg:flex-row gap-0">
        {/* ═══════════════════════════════════════
            LEFT COLUMN — Inputs (sticky)
        ═══════════════════════════════════════ */}
        <div
          className="lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-6 border-r"
          style={{ borderColor: "#E5E7EB", background: "#fff" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "#05A049" }}
          >
            Your Remittance Details
          </p>

          {/* ─ Investment amount ─ */}
          <div className="mb-6">
            <SectionLabel>
              How much do you want to invest this FY?
            </SectionLabel>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-500">₹</span>
              <input
                type="number"
                value={investmentInput}
                onChange={(e) => handleTextInput(e.target.value)}
                className="w-28 rounded-lg border px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2"
                style={{ borderColor: "#E5E7EB", color: "#00111B", "--tw-ring-color": "#05A049" } as React.CSSProperties}
                placeholder="50"
              />
              <span className="text-sm text-gray-400">Lakhs</span>
            </div>
            <input
              type="range"
              min={100_000}
              max={50_000_000}
              step={100_000}
              value={investmentINR}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#05A049", background: `linear-gradient(to right, #05A049 ${(investmentINR - 100000) / (50000000 - 100000) * 100}%, #E5E7EB ${(investmentINR - 100000) / (50000000 - 100000) * 100}%)` }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">₹1L</span>
              <span className="text-[11px] font-bold" style={{ color: "#00111B" }}>{INR_L(investmentINR)}</span>
              <span className="text-[10px] text-gray-400">₹5 Cr</span>
            </div>
          </div>

          {/* ─ Already remitted ─ */}
          <div className="mb-6">
            <SectionLabel>Already remitted this FY (₹)</SectionLabel>
            <input
              type="number"
              value={alreadyRemittedINR / 1e5 || ""}
              onChange={(e) => setAlreadyRemittedINR(Number(e.target.value) * 1e5)}
              placeholder="0"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#E5E7EB", color: "#00111B" }}
            />
            <p className="text-[10px] text-gray-400 mt-1">Enter in Lakhs (₹1L = 1)</p>
            {alreadyRemittedINR > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(100, (alreadyRemittedINR / THRESHOLD) * 100)}%`,
                    background: alreadyRemittedINR >= THRESHOLD ? "#DC2626" : "#05A049",
                  }}
                />
                <span className="text-[10px]" style={{ color: alreadyRemittedINR >= THRESHOLD ? "#DC2626" : "#05A049" }}>
                  {Math.min(100, Math.round((alreadyRemittedINR / THRESHOLD) * 100))}% of ₹10L threshold used
                </span>
              </div>
            )}
          </div>

          {/* ─ Purpose ─ */}
          <div className="mb-6">
            <SectionLabel>Purpose of remittance</SectionLabel>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as keyof typeof TCS_RATES)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ borderColor: "#E5E7EB", color: "#00111B" }}
            >
              {Object.entries(PURPOSE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div
              className="mt-2 rounded-lg px-3 py-2 text-xs flex items-center gap-2"
              style={{
                background: tcsRate === 0 ? "#EDFAF3" : tcsRate < 0.1 ? "#FFFBF0" : "#FEF2F2",
                border: `1px solid ${tcsRate === 0 ? "#B4E3C8" : tcsRate < 0.1 ? "#E8C97A" : "#FECACA"}`,
              }}
            >
              {tcsRate === 0
                ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05A049" }} />
                : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tcsRate < 0.1 ? "#B8913A" : "#DC2626" }} />}
              <span style={{ color: tcsRate === 0 ? "#05A049" : tcsRate < 0.1 ? "#B8913A" : "#DC2626" }}>
                TCS rate: <strong>{PCT(tcsRate * 100)}</strong> on amount above ₹10L threshold
              </span>
            </div>
          </div>

          {/* ─ Timing & Tax Payment Method group ─ */}
          <div className="mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
            <div className="px-3 py-2 border-b" style={{ background: "#F9FAFB", borderColor: "#E5E7EB" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6B7280" }}>
                Timing & Tax Payment Method
              </p>
            </div>
            <div className="p-3 space-y-4">
              {/* Current month */}
              <div>
                <SectionLabel>Current month</SectionLabel>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none bg-white"
                  style={{ borderColor: "#E5E7EB", color: "#00111B" }}
                >
                  {Object.keys(MONTHS_LOCKED).map((m) => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Advance tax toggle */}
              <div>
                <SectionLabel>Do you pay advance tax?</SectionLabel>
                <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
                  {([false, true] as const).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setPayAdvanceTax(v)}
                      className="flex-1 py-2.5 text-sm font-semibold transition-all"
                      style={{
                        background: payAdvanceTax === v ? "#00111B" : "#fff",
                        color: payAdvanceTax === v ? "#fff" : "#6B7280",
                      }}
                    >
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "#9CA3AF" }}>
                  {payAdvanceTax
                    ? "TCS offsets your next advance tax installment — dramatically reducing lock-up"
                    : "TCS refund via ITR — processed ~180 days after March 31 FY end"}
                </p>
                {/* Feb/March pro tip */}
                {payAdvanceTax && (currentMonth === "february" || currentMonth === "march") && (
                  <div className="mt-2 rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-[11px] font-semibold" style={{ color: "#05A049" }}>
                      Pro tip: Remitting in {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} with advance tax means TCS is offset in weeks, not months. This is the optimal window.
                    </p>
                  </div>
                )}
              </div>

              {/* Active lock-up summary */}
              <div className="rounded-lg px-3 py-2 text-[10px]" style={{ background: payAdvanceTax ? "#EDFAF3" : "#FEF2F2", border: `1px solid ${payAdvanceTax ? "#B4E3C8" : "#FECACA"}` }}>
                <span style={{ color: payAdvanceTax ? "#05A049" : "#DC2626" }}>
                  {payAdvanceTax
                    ? `Next AT date: ${nextATDate} · Lock-up: ~${monthsLockedAT} months`
                    : `ITR refund cycle · Lock-up: ~${monthsLockedITR} months`}
                </span>
              </div>
            </div>
          </div>

          {/* ─ Family members accordion ─ */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
              style={{ background: familyOpen ? "#F0FAF5" : "#F9FAFB", color: "#00111B" }}
              onClick={() => setFamilyOpen(!familyOpen)}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: "#05A049" }} />
                <span>Add family members for TCS optimization</span>
              </div>
              {familyOpen ? <ChevronUp className="h-4 w-4" style={{ color: "#6B7280" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "#6B7280" }} />}
            </button>

            {familyOpen && (
              <div className="p-4" style={{ background: "#FAFAFA" }}>
                {/* Family capacity summary */}
                <div
                  className="rounded-lg px-3 py-2.5 mb-4"
                  style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}
                >
                  <p className="text-[10px] font-medium text-gray-500 mb-0.5">Combined TCS-free capacity</p>
                  <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                    {INR_L(familyCapacity)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {allMembers.length} member{allMembers.length > 1 ? "s" : ""} × ₹10L − already remitted
                  </p>
                </div>

                {/* Existing members */}
                {members.map((m, idx) => (
                  <div key={m.id} className="mb-3 p-3 rounded-lg" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Member {idx + 1}</span>
                      <button onClick={() => removeMember(m.id)} className="ml-auto p-1 rounded hover:bg-red-50 transition-colors">
                        <Minus className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={m.name}
                      onChange={(e) => updateMember(m.id, "name", e.target.value)}
                      className="w-full rounded-md border px-2.5 py-1.5 text-xs mb-2 focus:outline-none"
                      style={{ borderColor: "#E5E7EB", color: "#00111B" }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex-shrink-0">Already remitted:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={m.remittedL || ""}
                        onChange={(e) => updateMember(m.id, "remittedL", Number(e.target.value))}
                        className="flex-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none"
                        style={{ borderColor: "#E5E7EB", color: "#00111B" }}
                      />
                      <span className="text-xs text-gray-400 flex-shrink-0">L</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Remaining capacity: {INR_L(Math.max(0, THRESHOLD - m.remittedL * 1e5))}
                    </p>
                  </div>
                ))}

                <button
                  onClick={addMember}
                  disabled={members.length >= 5}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: "rgba(5,160,73,0.1)", color: "#05A049", border: "1px dashed #B4E3C8" }}
                >
                  <Plus className="h-4 w-4" />
                  Add family member ({members.length}/5)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT COLUMN — Output Cards
        ═══════════════════════════════════════ */}
        <div className="flex-1 p-6 space-y-5">

          {/* ── CARD 1: TCS Liability ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.06)" }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#F3F4F6" }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EDFAF3" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "#05A049" }} />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  TCS Liability
                  <InfoTooltip text="TCS is deducted upfront by your bank. You reclaim it via ITR — but the money is locked for months. That lock-up is the real hidden cost." />
                </h2>
                <p className="text-xs text-gray-400">Your remittance of {INR_L(investmentINR)} broken down</p>
              </div>
              {tcsRate === 0 && (
                <span className="ml-auto rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#EDFAF3", color: "#05A049" }}>
                  0% TCS — No cost!
                </span>
              )}
            </div>

            <div className="p-6">
              {/* Visual breakdown bar */}
              <div className="mb-5">
                <div className="flex rounded-full overflow-hidden h-4 mb-2">
                  {taxFreeAmt > 0 && (
                    <div
                      style={{ width: `${(taxFreeAmt / investmentINR) * 100}%`, background: "#05A049" }}
                      title={`TCS-Free: ${INR_L(taxFreeAmt)}`}
                    />
                  )}
                  {newTaxable > 0 && (
                    <div
                      style={{ width: `${(newTaxable / investmentINR) * 100}%`, background: "#DC2626" }}
                      title={`TCS-Liable: ${INR_L(newTaxable)}`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  {taxFreeAmt > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#05A049]" />
                      <span className="text-gray-500">TCS-Free: <strong style={{ color: "#05A049" }}>{INR_L(taxFreeAmt)}</strong></span>
                    </span>
                  )}
                  {newTaxable > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                      <span className="text-gray-500">TCS-Liable: <strong style={{ color: "#DC2626" }}>{INR_L(newTaxable)}</strong></span>
                    </span>
                  )}
                </div>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ValuePill label="TCS-Free amount" value={INR_L(taxFreeAmt)} variant="green" />
                <ValuePill label="TCS amount deducted" value={tcsAmount > 0 ? INR_L(tcsAmount) : "₹0 — Nil" } variant={tcsAmount > 0 ? "red" : "green"} />
                <ValuePill label="Effective TCS rate" value={tcsAmount > 0 ? PCT(effectiveTCSRate) : "0.00%"} variant={tcsAmount > 0 ? "red" : "green"} />
                <ValuePill label="Net reaches GIFT City" value={INR_L(netToGiftCity)} variant="neutral" />
              </div>

              {tcsAmount === 0 && (
                <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#05A049" }} />
                  <p className="text-sm" style={{ color: "#05A049" }}>
                    <strong>No TCS applicable.</strong>{" "}
                    {purpose === "education_80e"
                      ? "Education via Sec 80E loan attracts 0% TCS."
                      : `Your total remittance (${INR_L(totalAfter)}) is within the ₹10L threshold.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── CARD 2: Hidden IRR Cost ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: payAdvanceTax && tcsAmount > 0 ? "1px solid #B4E3C8" : "1px solid #FECACA",
              borderLeft: payAdvanceTax && tcsAmount > 0 ? "4px solid #05A049" : "4px solid #DC2626",
              background: "#fff",
              boxShadow: payAdvanceTax && tcsAmount > 0
                ? "0 2px 12px rgba(5,160,73,0.06)"
                : "0 2px 12px rgba(220,38,38,0.06)",
            }}
          >
            <div
              className="px-6 py-4 border-b flex items-center gap-3"
              style={{ borderColor: payAdvanceTax && tcsAmount > 0 ? "#EDFAF3" : "#FEF2F2" }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: payAdvanceTax && tcsAmount > 0 ? "#EDFAF3" : "#FEF2F2" }}
              >
                <TrendingDown
                  className="h-4 w-4"
                  style={{ color: payAdvanceTax && tcsAmount > 0 ? "#05A049" : "#DC2626" }}
                />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  Hidden IRR Cost
                </h2>
                <p className="text-xs text-gray-400">
                  {payAdvanceTax
                    ? `TCS offset at next advance tax installment (${nextATDate})`
                    : "The real cost of capital locked in TCS refund"}
                </p>
              </div>
            </div>

            <div className="p-6">
              {tcsAmount === 0 ? (
                <p className="text-sm text-gray-400">No TCS → no opportunity cost. Excellent position.</p>
              ) : (
                <>
                  {/* IRR drag slider */}
                  <div className="mb-5">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      Assumed annual portfolio return
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={6} max={30} step={0.5}
                        value={assumedReturn}
                        onChange={(e) => setAssumedReturn(Number(e.target.value))}
                        className="flex-1 h-2 appearance-none rounded-full"
                        style={{ accentColor: payAdvanceTax ? "#05A049" : "#DC2626" }}
                      />
                      <span
                        className="w-12 text-center text-sm font-bold"
                        style={{ color: payAdvanceTax ? "#05A049" : "#DC2626" }}
                      >
                        {assumedReturn}%
                      </span>
                    </div>
                  </div>

                  {/* Active formula */}
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{
                      background: payAdvanceTax ? "#EDFAF3" : "#FEF2F2",
                      border: `1px solid ${payAdvanceTax ? "#B4E3C8" : "#FECACA"}`,
                    }}
                  >
                    <p className="text-xs font-mono text-gray-500 mb-2">IRR Drag Formula:</p>
                    <p className="text-xs font-mono" style={{ color: "#374151" }}>
                      {INR_L(tcsAmount)} locked × {assumedReturn}% × ({monthsLocked} months ÷ 12)
                    </p>
                    <p
                      className="text-2xl font-extrabold mt-2"
                      style={{
                        fontFamily: "var(--font-bricolage)",
                        color: payAdvanceTax ? "#05A049" : "#DC2626",
                      }}
                    >
                      = {INR_L(irrDrag)} in lost returns
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <ValuePill label="TCS locked upfront" value={INR_L(tcsAmount)} variant="red" />
                    <ValuePill
                      label="Lock-up period"
                      value={`${monthsLocked} months`}
                      variant={payAdvanceTax ? "green" : "neutral"}
                    />
                    <ValuePill
                      label="Opportunity cost"
                      value={INR_L(irrDrag)}
                      variant={payAdvanceTax ? "green" : "red"}
                    />
                  </div>

                  {/* ── Before vs After comparison (advance tax = Yes) ── */}
                  {payAdvanceTax && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Without AT */}
                        <div className="rounded-xl p-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#DC2626" }}>
                            Without AT Offset
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Lock-up</span>
                              <span className="font-bold" style={{ color: "#DC2626" }}>{monthsLockedITR} months</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Opp. cost</span>
                              <span className="font-bold" style={{ color: "#DC2626" }}>{INR_L(irrDragITR)}</span>
                            </div>
                          </div>
                          <p className="text-[9px] mt-2" style={{ color: "#9CA3AF" }}>Via ITR refund cycle</p>
                        </div>

                        {/* With AT */}
                        <div className="rounded-xl p-3" style={{ background: "rgba(180,227,200,0.2)", border: "1px solid #B4E3C8" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#05A049" }}>
                            With AT Offset
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Lock-up</span>
                              <span className="font-bold" style={{ color: "#05A049" }}>{monthsLockedAT} months</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Opp. cost</span>
                              <span className="font-bold" style={{ color: "#05A049" }}>{INR_L(irrDragAT)}</span>
                            </div>
                          </div>
                          <p className="text-[9px] mt-2" style={{ color: "#05A049" }}>Via advance tax offset</p>
                        </div>
                      </div>

                      {/* Savings badge */}
                      {atOppSaving > 0 && (
                        <div
                          className="rounded-xl px-4 py-3 text-center"
                          style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}
                        >
                          <p className="text-sm font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                            You save {INR_L(atOppSaving)} in opportunity cost
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#6B7280" }}>
                            By offsetting TCS against your {nextATDate} advance tax installment
                          </p>
                        </div>
                      )}

                      {/* How to do this tip */}
                      <div
                        className="rounded-xl px-4 py-3"
                        style={{ background: "#F0FAF5", borderLeft: "3px solid #05A049", border: "1px solid #B4E3C8" }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base flex-shrink-0">💡</span>
                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: "#00111B" }}>How to do this</p>
                            <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                              When filing your advance tax on{" "}
                              <strong>{nextATDate}</strong>, reduce your payment by{" "}
                              <strong>{INR_L(tcsAmount)}</strong>. The TCS already deducted appears
                              in Form 26AS Part F and directly reduces your advance tax liability.
                              No separate application needed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Nudge for non-advance-tax users ── */}
                  {!payAdvanceTax && atOppSaving > 50 && (
                    <p className="text-[11px] mt-4" style={{ color: "#9CA3AF" }}>
                      💡 If you pay advance tax, this {INR_L(irrDragITR)} cost drops to ~{INR_L(irrDragAT)}.
                      {" "}Toggle &ldquo;Do you pay advance tax?&rdquo; above to see.
                    </p>
                  )}

                  <p className="text-[11px] text-gray-400 mt-3">
                    {payAdvanceTax
                      ? `* TCS offset at next advance tax installment on ${nextATDate}. Lock-up = ~${monthsLockedAT} months only.`
                      : "* Assumes ITR refund ~180 days after March 31 FY end. Actual timing depends on ITR processing speed."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── CARD 3: Family Optimization ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #B4E3C8", background: "#fff", boxShadow: "0 2px 12px rgba(5,160,73,0.06)" }}
          >
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#EDFAF3" }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EDFAF3" }}>
                <Users className="h-4 w-4" style={{ color: "#05A049" }} />
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  Family Optimization
                </h2>
                <p className="text-xs text-gray-400">Route remittances through family members to fill each ₹10L bucket</p>
              </div>
              {familyOptimization.saving > 0 && (
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-400">Total savings</p>
                  <p className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>
                    {INR_L(familyOptimization.saving)}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Allocation table */}
              <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid #E5E7EB" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Remitted</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Threshold left</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Route here</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyOptimization.allocs.map((a, i) => {
                      const cap = Math.max(0, THRESHOLD - a.remittedINR);
                      const isOver = a.routed > cap;
                      return (
                        <tr
                          key={a.id}
                          className="border-t"
                          style={{ borderColor: "#F3F4F6" }}
                        >
                          <td className="px-4 py-3 font-medium" style={{ color: "#00111B" }}>
                            {a.name}
                            {i === 0 && (
                              <span className="ml-2 text-[9px] rounded-full px-1.5 py-0.5 font-bold" style={{ background: "#EDFAF3", color: "#05A049" }}>YOU</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-500">{INR_L(a.remittedINR)}</td>
                          <td className="px-4 py-3 text-right text-xs font-semibold" style={{ color: cap > 0 ? "#05A049" : "#DC2626" }}>
                            {cap > 0 ? INR_L(cap) : "Exhausted"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className="font-bold text-sm"
                              style={{ color: isOver ? "#DC2626" : "#05A049" }}
                            >
                              {INR_L(a.routed)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#F0FAF5", borderTop: "2px solid #B4E3C8" }}>
                      <td className="px-4 py-3 font-bold text-xs text-gray-600" colSpan={3}>Total TCS (optimized)</td>
                      <td className="px-4 py-3 text-right font-extrabold text-sm" style={{ color: familyOptimization.totalTCS > 0 ? "#DC2626" : "#05A049" }}>
                        {familyOptimization.totalTCS > 0 ? `−${INR_L(familyOptimization.totalTCS)}` : "₹0 — Nil TCS!"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {allMembers.length === 1 && (
                <div
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                  <p className="text-xs" style={{ color: "#B8913A" }}>
                    Add spouse or adult family members above to unlock TCS savings. Each adult PAN gets its own ₹10L threshold under LRS.
                  </p>
                </div>
              )}

              {familyOptimization.saving > 100 && (
                <div
                  className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}
                >
                  <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: "#05A049" }} />
                  <p className="text-sm font-semibold" style={{ color: "#05A049" }}>
                    Routing through family saves you <strong>{INR_L(familyOptimization.saving)}</strong> in TCS upfront deduction.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── CARD 4: Chart ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.04)" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                Optimal Remittance Split
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Stacked view of TCS-free vs taxable amount per family member
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barSize={36}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${Math.round(v / 1e5)}L`}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [INR_L(value), name]}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#00111B",
                      boxShadow: "0 4px 16px rgba(0,17,27,0.1)",
                    }}
                    cursor={{ fill: "rgba(0,17,27,0.03)" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="TCS-Free" stackId="a" fill="#05A049" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="TCS-Liable" stackId="a" fill="#FCA5A5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="TCS Cost" stackId="a" fill="#DC2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── CTA Banner ── */}
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: "#00111B" }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(180,227,200,0.6)" }}>
                Real-time tracking
              </p>
              <p
                className="text-lg font-extrabold text-white"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                Valura automatically tracks your family's LRS in real time
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                Never overshoot your threshold again — live alerts, auto-optimization.
              </p>
            </div>
            <a
              href="/signup"
              className="flex-shrink-0 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#05A049", color: "#fff" }}
            >
              Open Account
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* ── Disclaimer ── */}
          <p className="text-[10px] text-center pb-1" style={{ color: "#9CA3AF" }}>
            Illustrative only. TCS rules per Finance Act 2025, effective 1 April 2025. Actual TCS deducted by your authorized dealer bank may vary. Consult your CA before acting on these calculations.
          </p>
          <p className="text-[10px] text-center pb-4" style={{ color: "#9CA3AF" }}>
            Advance tax offset assumes TCS amount is fully absorbable against advance tax liability. Consult your CA to confirm your specific advance tax position before relying on offset.
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
    </div>

    <CalcDrawer
      page="LRS & TCS"
      inputs={calcInputs}
      outputs={calcOutputs}
      chips={[
        "Is there a way to reduce this TCS further?",
        "When will I get this TCS back as a refund?",
        "Should I split this across family members?",
      ]}
      open={aiOpen}
      onClose={() => setAiOpen(false)}
    />
    </>
  );
}
