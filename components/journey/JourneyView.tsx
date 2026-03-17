"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Journey, JourneyId } from "@/lib/journeys";
import { JOURNEYS } from "@/lib/journeys";
import StepCard from "./StepCard";

interface Props {
  journeyId: JourneyId;
  onSwitchJourney: () => void;
}

const SUMMARY_FACTS: Record<JourneyId, string[]> = {
  ri_global_invest: [
    "You can invest up to $2,50,000 per year in global markets via LRS.",
    "TCS above ₹10L is not a permanent cost — you get it back when you file ITR.",
    "Hold investments for 730+ days to pay 14.95% max tax instead of up to 42.74%.",
  ],
  ri_tax_reduce: [
    "Waiting past 730 days can save up to ₹28K per ₹1L gain at the highest bracket.",
    "India has no wash-sale rule — harvest losses and immediately rebuy.",
    "File ITR by July 31 to preserve tax loss carry-forwards for up to 8 years.",
  ],
  ri_family_wealth: [
    "Each adult family member gets a separate ₹10L TCS-free limit and $2,50,000 LRS limit.",
    "A family of 4 can invest ₹40L per year with zero TCS.",
    "Harvest losses in the highest-income family member's account for max savings.",
  ],
  ri_itr_guide: [
    "GIFT City holdings are treated as foreign assets — you must use ITR-2 or ITR-3.",
    "Missing Schedule FA disclosure has a ₹10L/year penalty under the Black Money Act.",
    "File Form 67 by March 31 of the Assessment Year to claim Foreign Tax Credit.",
  ],
  nri_global_invest: [
    "As an NRI, there's no annual limit and no TCS on your investments.",
    "GIFT City Category III AIF gains are 100% exempt from Indian tax under Section 10(23FBC).",
    "IFSC fund units are not US-situs assets — your family's US estate tax exposure is $0.",
  ],
  nri_rnor_window: [
    "RNOR status means foreign income is not taxable in India — even while you live here.",
    "The RNOR period typically lasts 2-3 years after returning from abroad.",
    "Front-load investments during RNOR: gains realised in this period are tax-free in India.",
  ],
  nri_repatriation: [
    "GIFT City proceeds can be wired directly to your NRE account — no repatriation cap.",
    "No Form 15CA/15CB required for GIFT City to NRE account transfers.",
    "UAE-based NRIs face zero tax globally on GIFT City fund gains.",
  ],
  nri_india_invest: [
    "GIFT City funds offer a simpler route to Indian markets vs the Portfolio Investment Scheme.",
    "India has DTAA treaties with 90+ countries to prevent double taxation.",
    "Long-term gains on Indian securities are taxed at 14.95% max effective rate.",
  ],
  fn_global: [
    "As a non-Indian investor in GIFT City Category III funds, gains are exempt from Indian tax.",
    "Ireland UCITS ETFs via Valura pay 15% US dividend withholding vs 25% for direct holdings.",
    "GIFT City has no capital controls — full repatriation of capital and gains.",
  ],
  fn_india: [
    "Access Indian markets through GIFT City without the complexity of FPI registration.",
    "Long-term gains on Indian securities are taxed at 14.95% max effective rate.",
    "India's DTAA treaties allow you to credit Indian tax against your home country's tax.",
  ],
};

// ─── Calculator hub ────────────────────────────────────────────────────────

const ALL_CALCULATORS = [
  {
    href: "/calculators/net-returns",
    emoji: "📊",
    label: "Net Returns",
    desc: "Compare Direct vs Valura over 30 years",
    color: "#05A049",
    bg: "#EDFAF3",
    border: "#B4E3C8",
  },
  {
    href: "/calculators/lrs-tcs",
    emoji: "🏦",
    label: "LRS & TCS",
    desc: "Optimize family remittance, minimize TCS",
    color: "#05A049",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  {
    href: "/calculators/capital-gains",
    emoji: "📈",
    label: "Capital Gains",
    desc: "Exact tax on your investment profits",
    color: "#2B4A8A",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    href: "/calculators/dtaa",
    emoji: "📋",
    label: "DTAA / FTC",
    desc: "Avoid double taxation, claim Form 67 credit",
    color: "#2B4A8A",
    bg: "#F0F4FF",
    border: "#C7D2FE",
  },
  {
    href: "/calculators/estate-tax",
    emoji: "🛡️",
    label: "Estate Tax",
    desc: "US estate tax exposure on your holdings",
    color: "#7A2020",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  {
    href: "/calculators/nri-status",
    emoji: "✈️",
    label: "NRI Status",
    desc: "NRI / RNOR / ROR residency checker",
    color: "#B8913A",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    href: "/tlh",
    emoji: "✂️",
    label: "TLH Engine",
    desc: "Scan portfolio for tax loss opportunities",
    color: "#00111B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
  {
    href: "/chat",
    emoji: "🤖",
    label: "AI Advisor",
    desc: "Autonomous multi-step tax analysis",
    color: "#05A049",
    bg: "#EDFAF3",
    border: "#B4E3C8",
  },
];

export default function JourneyView({ journeyId, onSwitchJourney }: Props) {
  const journey: Journey = JOURNEYS[journeyId];
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((r) => r === entry.target);
            if (idx >= 0) setActiveStep(idx);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
    );
    stepRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  function scrollToStep(idx: number) {
    stepRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
        style={{ background: "rgba(255,255,252,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onSwitchJourney}
            className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
            title="Switch journey"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2
            className="text-sm sm:text-base font-extrabold leading-tight truncate"
            style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
          >
            {journey.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}
          >
            {activeStep + 1} / {journey.steps.length}
          </span>
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "#05A049" }}
          >
            Open account →
          </Link>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full">

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden lg:flex flex-col gap-0.5 w-52 flex-shrink-0 sticky top-[53px] self-start py-6 pl-4 pr-3"
          style={{ maxHeight: "calc(100vh - 53px)", overflowY: "auto" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest px-2.5 mb-3" style={{ color: "#9CA3AF" }}>
            Steps
          </p>
          {journey.steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => scrollToStep(idx)}
              className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-black/[0.04]"
              style={{
                borderLeft: activeStep === idx ? "2px solid #05A049" : "2px solid transparent",
                background: activeStep === idx ? "rgba(5,160,73,0.05)" : "transparent",
              }}
            >
              <span
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-extrabold mt-0.5"
                style={{
                  background: idx < activeStep ? "#05A049" : idx === activeStep ? "#05A049" : "#E5E7EB",
                  color: idx <= activeStep ? "#fff" : "#9CA3AF",
                }}
              >
                {idx < activeStep ? (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className="text-xs leading-snug"
                style={{
                  color: activeStep === idx ? "#05A049" : idx < activeStep ? "#6B7280" : "#9CA3AF",
                  fontWeight: activeStep === idx ? 600 : 400,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {step.title}
              </span>
            </button>
          ))}

          {/* Mini calculator links in sidebar */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-2.5 mb-2" style={{ color: "#9CA3AF" }}>
              Calculators
            </p>
            {ALL_CALCULATORS.slice(0, 5).map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/[0.04]"
                style={{ color: "#6B7280" }}
              >
                <span className="text-sm">{calc.emoji}</span>
                {calc.label}
              </Link>
            ))}
            <Link
              href="/calculators/docs"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/[0.04]"
              style={{ color: "#9CA3AF" }}
            >
              <span className="text-sm">📖</span>
              All calculators →
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-5">

          {journey.steps.map((step, idx) => (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[idx] = el; }}
            >
              <StepCard step={step} stepNumber={idx + 1} totalSteps={journey.steps.length} />
            </div>
          ))}

          {/* ── Calculator Hub ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid #E5E7EB" }}
          >
            {/* Header */}
            <div
              className="px-5 sm:px-6 py-5"
              style={{ background: "linear-gradient(135deg,#00111B 0%,#0d1f2e 100%)", borderBottom: "1px solid #1a3a50" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧮</span>
                <p
                  className="text-base sm:text-lg font-extrabold text-white"
                  style={{ fontFamily: "var(--font-bricolage)" }}
                >
                  Your calculator toolkit
                </p>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Use these to run exact numbers for your situation. Each one is free, no login required.
              </p>
            </div>

            {/* Calculator grid */}
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_CALCULATORS.map((calc) => (
                <Link
                  key={calc.href}
                  href={calc.href}
                  className="flex items-start gap-3 rounded-xl p-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] group"
                  style={{
                    background: calc.bg,
                    border: `1.5px solid ${calc.border}`,
                  }}
                >
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(255,255,255,0.7)" }}
                  >
                    {calc.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold mb-0.5"
                      style={{ color: calc.color, fontFamily: "var(--font-manrope)" }}
                    >
                      {calc.label}
                    </p>
                    <p className="text-xs leading-snug" style={{ color: "#6B7280" }}>
                      {calc.desc}
                    </p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-70 transition-opacity"
                  >
                    <path d="M3 7h8M8 4.5L10.5 7 8 9.5" stroke={calc.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Completion summary ── */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: "#00111B" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h3
                className="text-xl sm:text-2xl font-extrabold text-white"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                Here's what you learned
              </h3>
            </div>
            <ul className="space-y-3 mb-8">
              {(SUMMARY_FACTS[journeyId] || []).map((fact, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "#05A049" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="text-sm sm:text-[15px]" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif" }}>
                    {fact}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
              Everything you learned here is saved to your profile and pre-fills all calculators.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#05A049" }}
            >
              Open your Valura account in under 10 minutes →
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-center pb-8" style={{ color: "#D1D5DB" }}>
            Educational content only. Tax rules per Finance Act 2025 (FY 2025-26). Individual circumstances may vary. Consult a qualified CA before making investment or tax decisions.
          </p>
        </main>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      <div
        className="lg:hidden sticky bottom-0 z-30 flex items-center justify-between px-4 py-3 gap-3"
        style={{ background: "rgba(255,255,252,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #E5E7EB" }}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {journey.steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToStep(idx)}
              className="flex-shrink-0 h-2 rounded-full transition-all"
              style={{
                width: activeStep === idx ? "20px" : "8px",
                background: activeStep === idx ? "#05A049" : idx < activeStep ? "#05A049" : "#E5E7EB",
                opacity: idx < activeStep ? 0.5 : 1,
              }}
            />
          ))}
          <span className="text-xs font-semibold ml-1 flex-shrink-0" style={{ color: "#9CA3AF" }}>
            {activeStep + 1}/{journey.steps.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeStep < journey.steps.length - 1 ? (
            <button
              onClick={() => scrollToStep(activeStep + 1)}
              className="text-xs font-bold px-4 py-2 rounded-full text-white"
              style={{ background: "#05A049" }}
            >
              Next →
            </button>
          ) : (
            <Link
              href="/signup"
              className="text-xs font-bold px-4 py-2 rounded-full text-white"
              style={{ background: "#05A049" }}
            >
              Open account →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
