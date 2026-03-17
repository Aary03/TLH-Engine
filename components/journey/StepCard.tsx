"use client";

import Link from "next/link";
import type { JourneyStep } from "@/lib/journeys";
import StepCalculator from "./StepCalculator";

interface Props {
  step: JourneyStep;
  stepNumber: number;
  totalSteps: number;
}

// ─── Visual header icons per step type ────────────────────────────────────

const VISUAL_CONFIG: Record<
  string,
  { emoji: string; bg: string; border: string; label: string }
> = {
  lrs:        { emoji: "🌐", bg: "linear-gradient(135deg,#00111B 0%,#0a2236 100%)", border: "#1a3a50", label: "LRS" },
  tcs:        { emoji: "🏦", bg: "linear-gradient(135deg,#064E24 0%,#0d7a3a 100%)", border: "#0a5c2c", label: "TCS" },
  gains:      { emoji: "📈", bg: "linear-gradient(135deg,#1a3a6e 0%,#2B4A8A 100%)", border: "#2040a0", label: "Capital Gains" },
  estate:     { emoji: "🛡️", bg: "linear-gradient(135deg,#4a1010 0%,#7A2020 100%)", border: "#7A2020", label: "Estate Tax" },
  nri:        { emoji: "✈️", bg: "linear-gradient(135deg,#4a3800 0%,#8a6300 100%)", border: "#B8913A", label: "NRI Status" },
  family:     { emoji: "👨‍👩‍👧‍👦", bg: "linear-gradient(135deg,#064E24 0%,#0a6b33 100%)", border: "#0a5c2c", label: "Family" },
  tlh:        { emoji: "✂️", bg: "linear-gradient(135deg,#00111B 0%,#1a2a3a 100%)", border: "#334155", label: "TLH Engine" },
  dtaa:       { emoji: "📋", bg: "linear-gradient(135deg,#1a3a6e 0%,#243e7a 100%)", border: "#2B4A8A", label: "DTAA" },
  compliance: { emoji: "⚖️", bg: "linear-gradient(135deg,#4a1010 0%,#6b1616 100%)", border: "#DC2626", label: "Compliance" },
};

const STEP_EMOJIS = ["🚀", "🪪", "🏛️", "💸", "🧠", "🌍", "📊", "🗓️", "📝", "🎯"];

// ─── Calculator CTA card ───────────────────────────────────────────────────

function CalculatorCTA({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:opacity-90 active:scale-[0.99] group"
      style={{
        background: "#00111B",
        border: "1px solid rgba(5,160,73,0.3)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(5,160,73,0.2)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="#05A049" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="#05A049" opacity="0.5" />
            <rect x="1" y="8" width="5" height="5" rx="1" fill="#05A049" opacity="0.5" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#05A049" opacity="0.3" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(180,227,200,0.6)" }}>
            Full Calculator
          </p>
          <p className="text-sm font-semibold" style={{ color: "#FFFFFC" }}>
            {label}
          </p>
        </div>
      </div>
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ background: "rgba(5,160,73,0.2)" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="#05A049" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

// ─── Main StepCard ─────────────────────────────────────────────────────────

export default function StepCard({ step, stepNumber, totalSteps }: Props) {
  const visual = step.visual ? VISUAL_CONFIG[step.visual] : null;
  const stepEmoji = STEP_EMOJIS[(stepNumber - 1) % STEP_EMOJIS.length];

  return (
    <div
      id={`step-${step.id}`}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#fff",
        border: "1.5px solid #E5E7EB",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── Pictorial header band ── */}
      <div
        className="relative overflow-hidden px-5 sm:px-6 pt-5 pb-5"
        style={{
          background: visual
            ? visual.bg
            : `linear-gradient(135deg, #00111B 0%, #0d1f2e 100%)`,
          borderBottom: `1px solid ${visual?.border ?? "#1a3a50"}`,
        }}
      >
        {/* Decorative large background emoji */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl select-none pointer-events-none"
          style={{ opacity: 0.12, filter: "blur(1px)" }}
        >
          {visual?.emoji ?? stepEmoji}
        </div>

        <div className="relative flex items-start gap-3">
          {/* Step badge */}
          <div
            className="flex-shrink-0 flex flex-col items-center gap-1"
          >
            <span
              className="h-9 w-9 rounded-xl flex items-center justify-center text-base font-extrabold"
              style={{
                background: "rgba(5,160,73,0.25)",
                border: "1.5px solid rgba(5,160,73,0.4)",
                color: "#B4E3C8",
                fontFamily: "var(--font-bricolage)",
              }}
            >
              {stepNumber}
            </span>
            {visual && (
              <span
                className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ color: "rgba(180,227,200,0.5)" }}
              >
                {visual.label}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl leading-none">{visual?.emoji ?? stepEmoji}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
              >
                {stepNumber} of {totalSteps}
              </span>
            </div>
            <h3
              className="text-base sm:text-lg font-bold text-white leading-snug"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {step.title}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 sm:px-6 pt-5 pb-2 space-y-4">

        {/* Plain English */}
        <p
          className="text-sm sm:text-[15px] leading-relaxed"
          style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}
        >
          {step.plainEnglish}
        </p>

        {/* What this means */}
        {step.whatThisMeans && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{
              background: "rgba(5,160,73,0.06)",
              border: "1px solid rgba(5,160,73,0.15)",
              borderLeft: "3px solid #05A049",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" fill="#05A049" opacity="0.2" />
                <path d="M6 5v4M6 4v-.5" stroke="#05A049" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#05A049" }}>
                What this means for you
              </p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#1F2937", fontFamily: "'Inter', sans-serif" }}>
              {step.whatThisMeans}
            </p>
          </div>
        )}

        {/* Tip (gold) */}
        {step.tip && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{
              background: "rgba(184,145,58,0.07)",
              border: "1px solid rgba(184,145,58,0.2)",
              borderLeft: "3px solid #B8913A",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">💡</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#B8913A" }}>
                Smart tip
              </p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#1F2937", fontFamily: "'Inter', sans-serif" }}>
              {step.tip}
            </p>
          </div>
        )}

        {/* Danger (red) */}
        {step.danger && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{
              background: "rgba(220,38,38,0.05)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderLeft: "3px solid #DC2626",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">⚠️</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#DC2626" }}>
                Important warning
              </p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#1F2937", fontFamily: "'Inter', sans-serif" }}>
              {step.danger}
            </p>
          </div>
        )}

        {/* Callout */}
        {step.callout && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{
              background: "rgba(0,17,27,0.04)",
              border: "1px solid rgba(0,17,27,0.08)",
              borderLeft: "3px solid #00111B",
            }}
          >
            <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: "#00111B", fontFamily: "'Inter', sans-serif" }}>
              {step.callout}
            </p>
          </div>
        )}

        {/* Documents */}
        {step.documents && step.documents.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
              Documents you'll need
            </p>
            <div className="flex flex-wrap gap-2">
              {step.documents.map((doc) => (
                <span
                  key={doc}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: "#F3F4F6",
                    color: "#374151",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <span className="text-[11px]">📄</span>
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rate Table */}
        {step.rateTable && step.rateTable.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
              Tax rate comparison
            </p>
            <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #E5E7EB" }}>
              <table className="w-full min-w-[420px] text-xs" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#00111B" }}>
                    <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "#B4E3C8" }}>Income bracket</th>
                    <th className="px-3 py-2.5 text-right font-semibold" style={{ color: "#FDA5A5" }}>Short-term</th>
                    <th className="px-3 py-2.5 text-right font-semibold" style={{ color: "#86EFAC" }}>Long-term</th>
                    <th className="px-3 py-2.5 text-right font-semibold" style={{ color: "#FCD34D" }}>Saving/₹1L</th>
                  </tr>
                </thead>
                <tbody>
                  {step.rateTable.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? "#F9FAFB" : "#fff",
                        borderBottom: "1px solid #F3F4F6",
                      }}
                    >
                      <td className="px-3 py-2.5 font-medium" style={{ color: "#00111B" }}>{row.bracket}</td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "#DC2626" }}>{row.stcg}</td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "#05A049" }}>{row.ltcg}</td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: "#B8913A" }}>{row.saving}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Checklist */}
        {step.checklist && step.checklist.length > 0 && (
          <div className="space-y-2.5">
            {step.checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 h-5 w-5 rounded-md border-2 mt-0.5 flex items-center justify-center"
                  style={{ borderColor: "#05A049" }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: "rgba(5,160,73,0.3)" }} />
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Inline Calculator */}
        {step.calculator && (
          <div>
            <StepCalculator type={step.calculator} />
          </div>
        )}

      </div>

      {/* ── Calculator CTA footer ── */}
      {step.calculatorLink && step.calculatorLabel && (
        <div className="px-5 sm:px-6 pb-5 pt-1">
          <CalculatorCTA href={step.calculatorLink} label={step.calculatorLabel} />
        </div>
      )}

    </div>
  );
}
