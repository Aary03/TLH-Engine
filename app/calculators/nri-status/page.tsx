"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
  ArrowRight, Calendar, Globe, FileText, TriangleAlert,
  Clock, TrendingUp, Info,
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */

const TODAY         = new Date(2026, 2, 11);           // Mar 11, 2026
const FY_START      = new Date(2025, 3, 1);            // Apr 1, 2025
const FY_DAYS_ELAPSED =
  Math.floor((TODAY.getTime() - FY_START.getTime()) / 86_400_000) + 1; // ~345

const PREV_FY_LABELS = ["FY 2024-25", "FY 2023-24", "FY 2022-23", "FY 2021-22"];

type ResidencyStatus = "NRI" | "RNOR" | "ROR";
type Reason = "employment" | "business" | "studying" | "visiting" | "na";

const REASON_LABELS: Record<Reason, string> = {
  employment: "Employment abroad",
  business:   "Business abroad",
  studying:   "Studying abroad",
  visiting:   "Just visiting India",
  na:         "Not applicable",
};

/* ── Section label ── */
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>
      {children}
    </label>
  );
}

/* ── Number stepper ── */
function Stepper({ value, onChange, min = 0, max = 10 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold transition-all"
        style={{ background: "#F3F4F6", color: "#374151" }}>−</button>
      <span className="text-2xl font-extrabold w-10 text-center"
        style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold transition-all"
        style={{ background: "#00111B", color: "#fff" }}>+</button>
    </div>
  );
}

/* ── Number input ── */
function NumInput({ value, onChange, label, max, suffix }: {
  value: number; onChange: (v: number) => void;
  label?: string; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <input
        type="number" min={0} max={max} value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => { const n = parseInt(e.target.value) || 0; onChange(max !== undefined ? Math.min(n, max) : n); }}
        className="flex-1 px-3 py-2.5 text-sm font-bold focus:outline-none bg-white"
        style={{ color: "#00111B" }}
      />
      {suffix && <span className="px-3 text-sm text-gray-400 bg-gray-50">{suffix}</span>}
    </div>
  );
}

/* ── Progress step indicator ── */
function ProgressBar({ step }: { step: number }) {
  const steps = ["Days in India", "History", "Your Profile"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const done = i < step - 1;
        const active = i === step - 1;
        return (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: done ? "#05A049" : active ? "#00111B" : "#E5E7EB",
                  color: done || active ? "#fff" : "#9CA3AF",
                }}>
                {done ? "✓" : i + 1}
              </div>
              <span className="text-xs font-semibold hidden sm:block"
                style={{ color: active ? "#00111B" : done ? "#05A049" : "#9CA3AF" }}>
                {s}
              </span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-px mx-2" style={{ background: done ? "#05A049" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RESIDENCY LOGIC
══════════════════════════════════════════════════════ */

interface ResidencyResult {
  status: ResidencyStatus;
  isResident: boolean;
  isRNOR: boolean;
  triggeredBy: string[];          // which conditions triggered the result
  rnorReason: string | null;      // which RNOR condition applied
  rnorDaysUsed: number;           // for 7-year progress bar
  secondaryThreshold: number;     // 60 or 182
  condition1Met: boolean;
  condition2Met: boolean;
  rnorCond1Met: boolean;
  rnorCond2Met: boolean;
}

function determineResidency(params: {
  currentFYDays: number;
  prevFYDays: number[];            // 4 years
  nriYearsLast10: number;
  totalDaysLast7: number;
  isCitizen: boolean;
  reason: Reason;
}): ResidencyResult {
  const { currentFYDays, prevFYDays, nriYearsLast10, totalDaysLast7, isCitizen, reason } = params;

  // Exception: Indian citizens leaving for employment/business → threshold is 182, not 60
  const isLeaving = isCitizen && (reason === "employment" || reason === "business");
  const secondaryThreshold = isLeaving ? 182 : 60;

  const totalPrev4 = prevFYDays.reduce((s, d) => s + d, 0);

  const condition1 = currentFYDays >= 182;
  const condition2 = currentFYDays >= secondaryThreshold && totalPrev4 >= 365;
  const isResident = condition1 || condition2;

  if (!isResident) {
    return {
      status: "NRI", isResident: false, isRNOR: false,
      triggeredBy: [], rnorReason: null, rnorDaysUsed: totalDaysLast7,
      secondaryThreshold, condition1Met: condition1, condition2Met: condition2,
      rnorCond1Met: false, rnorCond2Met: false,
    };
  }

  // RNOR conditions
  const rnorCond1 = nriYearsLast10 >= 9;
  const rnorCond2 = totalDaysLast7 <= 729;
  const isRNOR = rnorCond1 || rnorCond2;

  const triggeredBy = [];
  if (condition1) triggeredBy.push(`≥182 days in current FY (${currentFYDays} days)`);
  if (condition2) triggeredBy.push(`≥${secondaryThreshold} days current FY + ≥365 days across last 4 FYs (${totalPrev4} days)`);

  const rnorReason = isRNOR
    ? rnorCond1
      ? `NRI in ${nriYearsLast10} of last 10 financial years (need ≥9)`
      : `Total India days in last 7 FYs: ${totalDaysLast7} (threshold ≤729)`
    : null;

  return {
    status: isRNOR ? "RNOR" : "ROR",
    isResident: true, isRNOR,
    triggeredBy,
    rnorReason,
    rnorDaysUsed: totalDaysLast7,
    secondaryThreshold,
    condition1Met: condition1, condition2Met: condition2,
    rnorCond1Met: rnorCond1, rnorCond2Met: rnorCond2,
  };
}

/* ══════════════════════════════════════════════════════
   STATUS DISPLAY CONFIGS
══════════════════════════════════════════════════════ */

const STATUS_CONFIG = {
  NRI: {
    label: "Non-Resident Indian",
    abbr: "NRI",
    color: "#05A049",
    bg: "rgba(5,160,73,0.1)",
    border: "#B4E3C8",
    darkBg: "#EDFAF3",
    summary: [
      "Your foreign income is not taxable in India — only income sourced from India is taxed.",
      "LRS does not apply to you; there is no annual cap on investing abroad.",
    ],
    implications: [
      { label: "Foreign income taxable in India", value: "No", good: true },
      { label: "Indian income taxable", value: "Yes — TDS applies", good: false },
      { label: "LRS annual limit", value: "Not applicable", good: true },
      { label: "Schedule FA required", value: "Not required", good: true },
      { label: "TCS on overseas investments", value: "0% — LRS doesn't apply", good: true },
    ],
    itr: { form: "ITR-2", note: "Use ITR-2 if you have foreign income or assets. ITR-1 if you have only Indian income (verify Schedule FA carefully)." },
    ctaLabel: "Open your Valura NRI account — 0% TCS, no investment cap",
    ctaSub: "NRIs investing via Valura GIFT City face no LRS limits and zero TCS.",
  },
  RNOR: {
    label: "Resident — Not Ordinarily Resident",
    abbr: "RNOR",
    color: "#B8913A",
    bg: "rgba(184,145,58,0.1)",
    border: "#E8C97A",
    darkBg: "#FFFBF0",
    summary: [
      "You are technically resident but your foreign income is NOT taxable in India — this is the golden window.",
      "Front-load your global investments immediately before this window closes.",
    ],
    implications: [
      { label: "Foreign income taxable in India", value: "No — RNOR window", good: true },
      { label: "Indian income taxable", value: "Yes — fully taxable", good: false },
      { label: "Foreign business control income", value: "Taxable", good: false },
      { label: "Schedule FA required", value: "Check with CA", good: null },
      { label: "RNOR window", value: "Limited — act now", good: null },
    ],
    itr: { form: "ITR-2", note: "Use ITR-2. Declare Indian income. Foreign income earned outside India is not required to be declared during RNOR, but verify with CA." },
    ctaLabel: "Maximize your RNOR window — invest globally via Valura",
    ctaSub: "Before you become ROR, front-load global investments with zero Indian tax on foreign returns.",
  },
  ROR: {
    label: "Resident Ordinary",
    abbr: "ROR",
    color: "#2B4A8A",
    bg: "rgba(43,74,138,0.08)",
    border: "#BFCFE8",
    darkBg: "#EEF2FA",
    summary: [
      "You are a full Resident — your worldwide income is taxable in India.",
      "GIFT City investments are treated as foreign assets and must be disclosed in Schedule FA every year.",
    ],
    implications: [
      { label: "Foreign income taxable in India", value: "Yes — worldwide", good: false },
      { label: "Indian income taxable", value: "Yes — fully taxable", good: false },
      { label: "Schedule FA required", value: "Yes — mandatory annually", good: false },
      { label: "Foreign Tax Credit", value: "Form 67 by March 31", good: true },
      { label: "DTAA protection", value: "Available via Form 67", good: true },
    ],
    itr: { form: "ITR-2 or ITR-3", note: "Use ITR-2 (no business income) or ITR-3 (business income). Schedule FA is mandatory for all foreign assets including GIFT City holdings." },
    ctaLabel: "Open a Valura GIFT City account — Schedule FA auto-generated",
    ctaSub: "Valura auto-generates your Schedule FA data. GIFT City LTCG is capped at 14.95% effective rate.",
  },
} as const;

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */

export default function NRIStatusPage() {
  /* ── Wizard step ── */
  const [step, setStep] = useState(1);

  /* ── Step 1: Days in India ── */
  const [currentFYDays, setCurrentFYDays] = useState(120);
  const [prevFYDays, setPrevFYDays] = useState<number[]>([300, 280, 310, 270]);

  /* ── Step 2: History ── */
  const [nriYearsLast10, setNriYearsLast10] = useState(8);
  const [totalDaysLast7, setTotalDaysLast7]  = useState(580);

  /* ── Step 3: Profile ── */
  const [isCitizen, setIsCitizen] = useState(true);
  const [reason, setReason] = useState<Reason>("employment");

  /* ── Live calculation ── */
  const result = useMemo(() =>
    determineResidency({ currentFYDays, prevFYDays, nriYearsLast10, totalDaysLast7, isCitizen, reason }),
    [currentFYDays, prevFYDays, nriYearsLast10, totalDaysLast7, isCitizen, reason],
  );

  const cfg = STATUS_CONFIG[result.status];

  /* ── Days bar ── */
  const daysPct   = Math.min(100, (currentFYDays / 182) * 100);
  const barColor  = currentFYDays < 150 ? "#05A049" : currentFYDays < 181 ? "#B8913A" : "#DC2626";
  const daysLeft  = Math.max(0, 182 - currentFYDays);
  const rnorDaysPct = Math.min(100, (result.rnorDaysUsed / 729) * 100);

  /* ── RNOR approximate days remaining ── */
  const rnorDaysRemainingIn7yr = Math.max(0, 729 - result.rnorDaysUsed);

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Header ── */}
      <div className="border-b px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Calculator · NRI Status
              </span>
              <span className="text-[10px] text-gray-400">Section 6, Income Tax Act · FY 2025-26</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              NRI Status & Tax Residency Checker
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Determine whether you are NRI, RNOR, or ROR — and understand exactly what it means for your Indian and foreign income taxes.
            </p>
          </div>
          {/* Live badge — always visible */}
          <div className="hidden md:flex items-center gap-3 rounded-xl px-4 py-3 flex-shrink-0"
            style={{ background: cfg.darkBg, border: `1px solid ${cfg.border}` }}>
            <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>Live result</p>
              <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: cfg.color }}>
                {cfg.abbr}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">

          {/* ═══════════════════════════════
              LEFT — WIZARD
          ═══════════════════════════════ */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 2px 12px rgba(0,17,27,0.05)" }}>
              <div className="p-6">

                <ProgressBar step={step} />

                {/* ─── STEP 1 ─── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                      Step 1 — Days in India
                    </p>

                    {/* Current FY */}
                    <div>
                      <SLabel>Days in India this financial year (FY 2025-26)</SLabel>
                      <NumInput value={currentFYDays} onChange={setCurrentFYDays} max={FY_DAYS_ELAPSED} suffix="days" />
                      <div className="mt-2 rounded-xl px-3 py-2 text-xs flex items-center gap-2"
                        style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#6B7280" }} />
                        <span style={{ color: "#6B7280" }}>
                          FY 2025-26 is <strong>{FY_DAYS_ELAPSED} days</strong> old (Apr 1, 2025 → Mar 11, 2026).
                          You&apos;ve entered <strong>{currentFYDays}</strong> days in India.
                        </span>
                      </div>
                    </div>

                    {/* Previous 4 FYs */}
                    <div>
                      <SLabel>Days in India — previous 4 financial years</SLabel>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Used for the secondary residency test (60/182-day rule + 365 days in 4 preceding FYs).
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {PREV_FY_LABELS.map((label, i) => (
                          <div key={label}>
                            <p className="text-[10px] font-semibold text-gray-400 mb-1">{label}</p>
                            <NumInput
                              value={prevFYDays[i]}
                              onChange={(v) => {
                                const updated = [...prevFYDays];
                                updated[i] = v;
                                setPrevFYDays(updated);
                              }}
                              max={366}
                              suffix="days"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 rounded-xl px-3 py-2 text-xs flex items-center gap-2"
                        style={{ background: prevFYDays.reduce((s, d) => s + d, 0) >= 365 ? "#EDFAF3" : "#F9FAFB", border: "1px solid #E5E7EB" }}>
                        <span style={{ color: "#6B7280" }}>
                          4-year total: <strong style={{ color: prevFYDays.reduce((s, d) => s + d, 0) >= 365 ? "#05A049" : "#374151" }}>
                            {prevFYDays.reduce((s, d) => s + d, 0)} days
                          </strong>
                          {prevFYDays.reduce((s, d) => s + d, 0) >= 365
                            ? " — meets the ≥365 day threshold"
                            : " — below 365-day threshold"}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => setStep(2)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                      style={{ background: "#05A049", color: "#fff" }}>
                      Next — History <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* ─── STEP 2 ─── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                        <ChevronLeft className="h-3.5 w-3.5" /> Back
                      </button>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                        Step 2 — History
                      </p>
                    </div>

                    {/* NRI years in last 10 */}
                    <div>
                      <SLabel>In how many of the last 10 financial years were you an NRI?</SLabel>
                      <p className="text-[11px] text-gray-400 mb-4">
                        Needed for the RNOR test. You qualify for RNOR if you were NRI in 9 or more of the last 10 FYs.
                      </p>
                      <Stepper value={nriYearsLast10} onChange={setNriYearsLast10} min={0} max={10} />
                      <div className="mt-3 rounded-xl px-3 py-2 text-xs"
                        style={{
                          background: nriYearsLast10 >= 9 ? "#EDFAF3" : nriYearsLast10 >= 7 ? "#FFFBF0" : "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          color: "#6B7280",
                        }}>
                        {nriYearsLast10 >= 9
                          ? `✓ ${nriYearsLast10}/10 NRI years — RNOR condition 1 met`
                          : nriYearsLast10 >= 7
                            ? `${nriYearsLast10}/10 NRI years — close to RNOR condition (need 9+)`
                            : `${nriYearsLast10}/10 NRI years — RNOR condition 1 not met`}
                      </div>
                    </div>

                    {/* Total days in last 7 FYs */}
                    <div>
                      <SLabel>Total days in India across the last 7 financial years</SLabel>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Add up all days you were in India from FY 2018-19 to FY 2024-25. You qualify for RNOR if this total is 729 or fewer.
                      </p>
                      <NumInput value={totalDaysLast7} onChange={setTotalDaysLast7} suffix="days" />
                      <div className="mt-2 rounded-xl px-3 py-2 text-xs"
                        style={{
                          background: totalDaysLast7 <= 729 ? "#EDFAF3" : "#FEF2F2",
                          border: "1px solid #E5E7EB",
                          color: "#6B7280",
                        }}>
                        {totalDaysLast7 <= 729
                          ? `✓ ${totalDaysLast7} days ≤ 729 — RNOR condition 2 met (${729 - totalDaysLast7} days remaining)`
                          : `${totalDaysLast7} days > 729 — RNOR condition 2 not met`}
                      </div>
                    </div>

                    <button onClick={() => setStep(3)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                      style={{ background: "#05A049", color: "#fff" }}>
                      Next — Your Profile <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* ─── STEP 3 ─── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                        <ChevronLeft className="h-3.5 w-3.5" /> Back
                      </button>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                        Step 3 — Your Profile
                      </p>
                    </div>

                    {/* Indian citizen */}
                    <div>
                      <SLabel>Are you an Indian citizen?</SLabel>
                      <div className="flex gap-3">
                        {[true, false].map((v) => (
                          <button key={String(v)} onClick={() => setIsCitizen(v)}
                            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                            style={{
                              background: isCitizen === v ? "#00111B" : "#F9FAFB",
                              color: isCitizen === v ? "#fff" : "#374151",
                              border: `1px solid ${isCitizen === v ? "#00111B" : "#E5E7EB"}`,
                            }}>
                            {v ? "Yes" : "No"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <SLabel>Reason for being outside India</SLabel>
                      <div className="grid grid-cols-1 gap-2">
                        {(Object.entries(REASON_LABELS) as [Reason, string][]).map(([k, label]) => (
                          <button key={k} onClick={() => setReason(k)}
                            className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-left transition-all"
                            style={{
                              background: reason === k ? "#00111B" : "#F9FAFB",
                              color: reason === k ? "#fff" : "#374151",
                              border: `1px solid ${reason === k ? "#00111B" : "#E5E7EB"}`,
                            }}>
                            <span>{label}</span>
                            {reason === k && <CheckCircle2 className="h-4 w-4" style={{ color: "#05A049" }} />}
                          </button>
                        ))}
                      </div>

                      {/* Exception explanation */}
                      {isCitizen && (reason === "employment" || reason === "business") && (
                        <div className="mt-3 rounded-xl px-3 py-2 flex items-start gap-2"
                          style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                          <p className="text-xs" style={{ color: "#374151" }}>
                            <strong>Exception applies:</strong> Indian citizens leaving for employment/business abroad are treated as NRI unless they spend ≥<strong>182 days</strong> in India (not 60 days).
                            Your secondary threshold is <strong>182 days</strong>.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Summary pill */}
                    <div className="rounded-xl p-4"
                      style={{ background: cfg.darkBg, border: `1px solid ${cfg.border}` }}>
                      <p className="text-xs font-bold" style={{ color: cfg.color }}>
                        Current determination: {cfg.abbr} — {cfg.label}
                      </p>
                      <p className="text-[11px] mt-1 text-gray-500">
                        Based on {currentFYDays} days current FY · {prevFYDays.reduce((s, d) => s + d, 0)} days prev 4 FYs ·
                        {nriYearsLast10} NRI years (last 10) · {totalDaysLast7} days (last 7 FYs)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Days in India progress bar (always visible) */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6B7280" }}>
                Your India stay this FY so far
              </p>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>0 days</span>
                <span className="font-bold" style={{ color: barColor }}>
                  {currentFYDays} days
                </span>
                <span>182-day threshold</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${daysPct}%`, background: barColor }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs" style={{ color: "#6B7280" }}>
                  {currentFYDays < 182
                    ? <><strong style={{ color: barColor }}>{daysLeft} more days</strong> before you become Resident this FY</>
                    : <strong style={{ color: "#DC2626" }}>Crossed 182-day resident threshold</strong>}
                </p>
                <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                  style={{ background: barColor + "18", color: barColor }}>
                  {Math.round(daysPct)}%
                </span>
              </div>

              {/* RNOR 7-year bar (only relevant if resident) */}
              {result.isResident && (
                <div className="mt-5 pt-5 border-t" style={{ borderColor: "#F3F4F6" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6B7280" }}>
                    7-year India day count (RNOR test)
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>0 days</span>
                    <span className="font-bold" style={{ color: totalDaysLast7 <= 729 ? "#B8913A" : "#DC2626" }}>
                      {totalDaysLast7} days
                    </span>
                    <span>729-day limit</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${rnorDaysPct}%`, background: totalDaysLast7 <= 729 ? "#B8913A" : "#DC2626" }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                    {totalDaysLast7 <= 729
                      ? <><strong style={{ color: "#B8913A" }}>{rnorDaysRemainingIn7yr} days</strong> remaining before exceeding RNOR 7-year threshold</>
                      : <strong style={{ color: "#DC2626" }}>Exceeded 729-day RNOR threshold</strong>}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════
              RIGHT — LIVE RESULTS
          ═══════════════════════════════ */}
          <div className="space-y-4">

            {/* ── MAIN STATUS BADGE ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: `2px solid ${cfg.color}`, background: "#fff", boxShadow: `0 4px 24px ${cfg.color}20` }}>
              <div className="px-6 py-6" style={{ background: cfg.darkBg }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: cfg.color }}>
                  Your Tax Residency Status
                </p>
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl px-5 py-3 text-center"
                    style={{ background: cfg.color, minWidth: "80px" }}>
                    <p className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                      {cfg.abbr}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">FY 2025-26 · Section 6, IT Act</p>
                  </div>
                </div>
              </div>

              {/* Summary sentences */}
              <div className="px-6 py-4 border-t space-y-2" style={{ borderColor: cfg.border }}>
                {cfg.summary.map((s, i) => (
                  <p key={i} className="text-sm leading-relaxed"
                    style={{ color: i === 0 && result.isRNOR ? "#05A049" : "#374151", fontWeight: i === 0 && result.isRNOR ? 600 : 400 }}>
                    {s}
                  </p>
                ))}
              </div>

              {/* Triggered by */}
              {result.triggeredBy.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Triggered by
                  </p>
                  {result.triggeredBy.map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs mb-1.5" style={{ color: "#374151" }}>
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── TAX IMPLICATIONS ── */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#F3F4F6" }}>
                <Globe className="h-4 w-4" style={{ color: "#6B7280" }} />
                <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  What this means for your taxes
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "#F9FAFB" }}>
                {cfg.implications.map((imp) => (
                  <div key={imp.label} className="px-5 py-3 flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-500">{imp.label}</span>
                    <span className="text-xs font-bold flex-shrink-0"
                      style={{ color: imp.good === true ? "#05A049" : imp.good === false ? "#DC2626" : "#B8913A" }}>
                      {imp.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* RNOR special callouts */}
              {result.status === "RNOR" && (
                <div className="px-5 pb-4 space-y-3 pt-3">
                  <div className="rounded-xl px-4 py-3"
                    style={{ background: "#EDFAF3", border: "1px solid #B4E3C8", borderLeft: "3px solid #05A049" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: "#05A049" }}>
                      🟢 Your foreign income is NOT taxable during RNOR — act now
                    </p>
                    {result.rnorReason && (
                      <p className="text-[11px]" style={{ color: "#374151" }}>
                        RNOR because: <strong>{result.rnorReason}</strong>
                      </p>
                    )}
                  </div>
                  {result.rnorCond2Met && (
                    <div className="rounded-xl px-4 py-3"
                      style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
                      <p className="text-[11px] font-bold mb-0.5" style={{ color: "#B8913A" }}>
                        7-year window: {rnorDaysRemainingIn7yr} days remaining
                      </p>
                      <p className="text-[11px]" style={{ color: "#6B7280" }}>
                        You have used {totalDaysLast7} of 729 allowed days. Once exceeded, this RNOR condition no longer applies.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ROR: GIFT City note */}
              {result.status === "ROR" && (
                <div className="px-5 pb-4 pt-3">
                  <div className="rounded-xl px-4 py-3"
                    style={{ background: "#EEF2FA", border: "1px solid #BFCFE8" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: "#2B4A8A" }}>
                      GIFT City via Valura — your best structure as ROR
                    </p>
                    <ul className="space-y-1 text-[11px]" style={{ color: "#374151" }}>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                        LTCG capped at 14.95% (vs up to 42.74% STCG) — hold 730+ days
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                        FTC via Form 67 prevents double taxation on foreign income
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                        Valura auto-generates your Schedule FA — no manual tracking
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── ITR FORM ── */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <FileText className="h-5 w-5" style={{ color: "#6B7280" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                    Suggested ITR Form
                  </p>
                  <p className="text-base font-extrabold mb-1"
                    style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
                    {cfg.itr.form}
                  </p>
                  <p className="text-xs leading-relaxed text-gray-500">{cfg.itr.note}</p>
                </div>
              </div>
            </div>

            {/* ── Section 6 logic explained ── */}
            <div className="rounded-2xl p-5" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                How your status was determined (Section 6 logic)
              </p>
              <div className="space-y-2 text-xs" style={{ color: "#374151" }}>
                <div className="flex items-start gap-2">
                  {result.condition1Met
                    ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                    : <div className="h-3.5 w-3.5 rounded-full border flex-shrink-0 mt-0.5" style={{ borderColor: "#D1D5DB" }} />}
                  <span>
                    Basic condition 1: ≥182 days in current FY
                    <strong> ({currentFYDays} days)</strong>
                    {result.condition1Met ? " ✓" : " — not met"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  {result.condition2Met
                    ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                    : <div className="h-3.5 w-3.5 rounded-full border flex-shrink-0 mt-0.5" style={{ borderColor: "#D1D5DB" }} />}
                  <span>
                    Basic condition 2: ≥{result.secondaryThreshold} days current FY + ≥365 days in 4 preceding FYs
                    <strong> ({prevFYDays.reduce((s, d) => s + d, 0)} days)</strong>
                    {result.secondaryThreshold === 182 ? " [exception: employment/business abroad applies]" : ""}
                    {result.condition2Met ? " ✓" : " — not met"}
                  </span>
                </div>
                {result.isResident && (
                  <>
                    <div className="border-t my-2" style={{ borderColor: "#E5E7EB" }} />
                    <p className="font-semibold" style={{ color: "#00111B" }}>RNOR test (since you are Resident):</p>
                    <div className="flex items-start gap-2">
                      {result.rnorCond1Met
                        ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                        : <div className="h-3.5 w-3.5 rounded-full border flex-shrink-0 mt-0.5" style={{ borderColor: "#D1D5DB" }} />}
                      <span>
                        RNOR condition 1: NRI in ≥9 of last 10 FYs
                        <strong> ({nriYearsLast10} years)</strong>
                        {result.rnorCond1Met ? " ✓" : " — not met"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      {result.rnorCond2Met
                        ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                        : <div className="h-3.5 w-3.5 rounded-full border flex-shrink-0 mt-0.5" style={{ borderColor: "#D1D5DB" }} />}
                      <span>
                        RNOR condition 2: ≤729 days in last 7 FYs
                        <strong> ({totalDaysLast7} days)</strong>
                        {result.rnorCond2Met ? " ✓" : " — not met"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: "#00111B" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "rgba(180,227,200,0.6)" }}>
                  {cfg.abbr} — Recommended next step
                </p>
                <p className="text-sm font-bold text-white mb-1"
                  style={{ fontFamily: "var(--font-manrope)" }}>
                  {cfg.ctaLabel}
                </p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{cfg.ctaSub}</p>
              </div>
              <a href="/signup"
                className="flex-shrink-0 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#05A049", color: "#fff" }}>
                Open Account <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-center pb-2 leading-relaxed" style={{ color: "#9CA3AF" }}>
              Residency status per Income Tax Act Section 6. Indicative only — rules have nuances for specific situations including deemed residency and High Net Worth provisions. Confirm with a qualified CA before filing your ITR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
