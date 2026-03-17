"use client";

import { useState, useEffect } from "react";
import ProgressBar from "@/components/journey/ProgressBar";
import PhaseOne from "@/components/journey/PhaseOne";
import PhaseTwo from "@/components/journey/PhaseTwo";
import JourneyView from "@/components/journey/JourneyView";
import type { InvestorType, JourneyId } from "@/lib/journeys";
import { JOURNEYS, JOURNEY_TITLES } from "@/lib/journeys";

const STORAGE_KEY = "valura_journey_profile";

interface JourneyProfile {
  investorType?: InvestorType;
  journeyId?: JourneyId;
  completedAt?: string;
}

// ─── Progress percentage per phase ────────────────────────────────────────

function getProgress(phase: number, investorType?: InvestorType, journeyId?: JourneyId): number {
  if (phase === 1) return 5;
  if (phase === 2) return 35;
  if (phase === 3 && journeyId) {
    const steps = JOURNEYS[journeyId]?.steps?.length || 1;
    return 65; // journey content loaded — let it fill as user scrolls
  }
  return 0;
}

export default function JourneyPage() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [investorType, setInvestorType] = useState<InvestorType | null>(null);
  const [journeyId, setJourneyId] = useState<JourneyId | null>(null);
  const [returning, setReturning] = useState<JourneyProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check localStorage for returning user
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: JourneyProfile = JSON.parse(raw);
        if (data.investorType && data.journeyId) {
          setReturning(data);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  function handlePhaseOneSelect(type: InvestorType) {
    setInvestorType(type);
    setPhase(2);
  }

  function handlePhaseTwoSelect(id: JourneyId) {
    setJourneyId(id);
    setPhase(3);

    // Save to localStorage
    const profile: JourneyProfile = {
      investorType: investorType!,
      journeyId: id,
      completedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  function handleSwitchJourney() {
    setPhase(1);
    setInvestorType(null);
    setJourneyId(null);
    setReturning(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function continueReturning() {
    if (!returning?.investorType || !returning?.journeyId) return;
    setInvestorType(returning.investorType);
    setJourneyId(returning.journeyId);
    setPhase(3);
    setReturning(null);
  }

  // Don't render until mounted (avoids localStorage SSR mismatch)
  if (!mounted) return null;

  const progress = getProgress(phase, investorType ?? undefined, journeyId ?? undefined);

  return (
    // Fixed overlay covers the main app sidebar/nav
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: "#FFFFFC" }}>
      {/* Progress bar */}
      <ProgressBar pct={progress} />

      {/* Back button — visible on phases 2 and 3 */}
      {phase > 1 && (
        <button
          onClick={() => {
            if (phase === 3) {
              setPhase(2);
              setJourneyId(null);
            } else {
              setPhase(1);
              setInvestorType(null);
            }
          }}
          className="fixed top-4 left-4 z-[201] flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:bg-black/5"
          style={{ color: "#6B7280" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
      )}

      {/* Returning user banner */}
      {returning && phase === 1 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[202] flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl"
          style={{ background: "#00111B", maxWidth: "calc(100vw - 32px)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60 mb-0.5">Welcome back</p>
            <p className="text-sm font-semibold text-white truncate">
              Continue &ldquo;{returning.journeyId ? JOURNEY_TITLES[returning.journeyId] : ""}&rdquo; journey?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={continueReturning}
              className="text-xs font-bold px-3 py-2 rounded-xl text-white"
              style={{ background: "#05A049" }}
            >
              Continue
            </button>
            <button
              onClick={() => setReturning(null)}
              className="text-xs font-medium px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* Phases */}
      {phase === 1 && (
        <div className="animate-[fadeIn_0.3s_ease]">
          <PhaseOne onSelect={handlePhaseOneSelect} />
        </div>
      )}

      {phase === 2 && investorType && (
        <div className="animate-[fadeIn_0.3s_ease]">
          <PhaseTwo
            investorType={investorType}
            onSelect={handlePhaseTwoSelect}
          />
        </div>
      )}

      {phase === 3 && journeyId && (
        <div className="animate-[fadeIn_0.3s_ease]">
          <JourneyView
            journeyId={journeyId}
            onSwitchJourney={handleSwitchJourney}
          />
        </div>
      )}
    </div>
  );
}
