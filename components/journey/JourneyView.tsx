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
    "Hold investments for 730+ days to pay 14.95% tax instead of up to 42.74%.",
  ],
  ri_tax_reduce: [
    "Waiting past 730 days can save up to ₹28K per ₹1L gain at the highest bracket.",
    "India has no wash-sale rule — harvest losses and immediately rebuy to lower your tax bill.",
    "File ITR by July 31 to preserve tax loss carry-forwards for up to 8 years.",
  ],
  ri_family_wealth: [
    "Each adult family member gets a separate ₹10L TCS-free limit and $2,50,000 LRS limit.",
    "A family of 4 can invest ₹40L per year with zero TCS.",
    "Harvest losses in the highest-income family member's account for maximum tax savings.",
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
    "GIFT City account proceeds can be wired directly to your NRE account — no repatriation cap.",
    "No Form 15CA/15CB required for GIFT City to NRE account transfers.",
    "UAE-based NRIs face zero tax globally on GIFT City fund gains.",
  ],
  nri_india_invest: [
    "GIFT City funds offer a simpler route to Indian markets vs the Portfolio Investment Scheme.",
    "India has DTAA treaties with 90+ countries to prevent double taxation.",
    "Long-term gains on Indian securities are taxed at 14.95% max effective rate.",
  ],
  fn_global: [
    "As a non-Indian investor in GIFT City Category III funds, your gains are exempt from Indian tax.",
    "Ireland UCITS ETFs via Valura pay 15% US dividend withholding vs 25% for direct US holdings.",
    "GIFT City has no capital controls — full repatriation of capital and gains.",
  ],
  fn_india: [
    "You can access Indian markets through GIFT City without the complexity of FPI registration.",
    "Long-term gains on Indian securities are taxed at 14.95% max effective rate.",
    "India's DTAA treaties allow you to credit Indian tax against your home country's tax.",
  ],
};

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
      { threshold: 0.4 }
    );

    stepRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  function scrollToStep(idx: number) {
    stepRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#FFFFFC" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: "#FFFFFC", borderBottom: "1px solid #E5E7EB" }}
      >
        <div>
          <h2
            className="text-base sm:text-lg font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
          >
            {journey.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}
          >
            Step {activeStep + 1} of {journey.steps.length}
          </span>
          <button
            onClick={onSwitchJourney}
            className="text-xs font-semibold underline"
            style={{ color: "#9CA3AF" }}
          >
            Switch journey
          </button>
          <Link
            href="/signup"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white"
            style={{ background: "#05A049" }}
          >
            Open account →
          </Link>
        </div>
      </div>

      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        {/* Sidebar — desktop only */}
        <aside
          className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0 sticky top-[57px] self-start py-6 pl-4 pr-3"
          style={{ maxHeight: "calc(100vh - 57px)", overflowY: "auto" }}
        >
          {journey.steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => scrollToStep(idx)}
              className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all hover:bg-black/5"
              style={{
                borderLeft: activeStep === idx ? "3px solid #05A049" : "3px solid transparent",
              }}
            >
              <span
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
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
                className="text-xs font-medium leading-snug"
                style={{
                  color: activeStep === idx ? "#05A049" : idx < activeStep ? "#6B7280" : "#9CA3AF",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {step.title}
              </span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 space-y-6">
          {journey.steps.map((step, idx) => (
            <div
              key={step.id}
              ref={(el) => { stepRefs.current[idx] = el; }}
            >
              <StepCard step={step} stepNumber={idx + 1} totalSteps={journey.steps.length} />
            </div>
          ))}

          {/* Completion summary */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ background: "#00111B" }}
          >
            <h3
              className="text-xl sm:text-2xl font-extrabold text-white mb-4"
              style={{ fontFamily: "var(--font-bricolage)" }}
            >
              Here's what you learned
            </h3>
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
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              Everything you learned here is saved to your profile.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
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

      {/* Mobile sticky bottom bar */}
      <div
        className="lg:hidden sticky bottom-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: "#FFFFFC", borderTop: "1px solid #E5E7EB" }}
      >
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}
        >
          Step {activeStep + 1} of {journey.steps.length}
        </span>
        <div className="flex items-center gap-2">
          {activeStep < journey.steps.length - 1 ? (
            <button
              onClick={() => scrollToStep(activeStep + 1)}
              className="text-xs font-bold px-4 py-2 rounded-full text-white"
              style={{ background: "#05A049" }}
            >
              Next step →
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
