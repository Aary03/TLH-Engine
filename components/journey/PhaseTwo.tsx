"use client";

import { useState } from "react";
import { USE_CASES, type InvestorType, type JourneyId } from "@/lib/journeys";

interface Props {
  investorType: InvestorType;
  onSelect: (id: JourneyId) => void;
}

const INVESTOR_LABELS: Record<InvestorType, string> = {
  resident: "Resident Indian",
  nri: "NRI",
  foreign: "International Investor",
};

function UseCaseIcon({ icon }: { icon: string }) {
  if (icon === "chart") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="16" width="5" height="9" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="11" y="10" width="5" height="15" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="19" y="4" width="5" height="21" rx="1" fill="currentColor" />
      <path d="M3 20l6-6 6 4 8-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (icon === "shield") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4L5 8v7c0 5 4 9 9 11 5-2 9-6 9-11V8L14 4z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 14l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (icon === "people") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="10" cy="10" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="20" cy="10" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 24c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 17c2.8 0 6 2 6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (icon === "document") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="6" y="3" width="16" height="22" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9h8M10 13h8M10 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (icon === "globe") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="14" rx="5" ry="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 14h20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 9h18M5 19h18" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
  );
  if (icon === "plane") return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M24 10L14 16 6 12l-2 2 8 5 1 7 2-1 1-6 8-5-1-4z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4L4 12v12h7v-7h6v7h7V12L14 4z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function PhaseTwo({ investorType, onSelect }: Props) {
  const [selected, setSelected] = useState<JourneyId | null>(null);
  const cases = USE_CASES[investorType];

  function handleSelect(id: JourneyId) {
    setSelected(id);
    setTimeout(() => onSelect(id), 420);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
      {/* Label */}
      <div className="mb-2">
        <span
          className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}
        >
          {INVESTOR_LABELS[investorType]}
        </span>
      </div>

      {/* Question */}
      <div className="text-center mb-10 max-w-xl">
        <h1
          className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3"
          style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
        >
          What's your goal?
        </h1>
        <p className="text-base sm:text-lg" style={{ color: "#6B7280", fontFamily: "'Inter', sans-serif" }}>
          Pick what matters most to you right now.
        </p>
      </div>

      {/* Cards */}
      <div
        className="w-full max-w-3xl grid gap-3"
        style={{
          gridTemplateColumns: cases.length <= 2 ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {cases.map((card) => {
          const isSelected = selected === card.journeyId;
          return (
            <button
              key={card.journeyId}
              onClick={() => handleSelect(card.journeyId)}
              className="relative text-left rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
              style={{
                background: isSelected ? "#00111B" : "#fff",
                border: isSelected ? "2px solid #05A049" : "1.5px solid #E5E7EB",
                boxShadow: isSelected
                  ? "0 0 0 4px rgba(5,160,73,0.12)"
                  : "0 1px 4px rgba(0,0,0,0.06)",
                minHeight: "100px",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isSelected ? "rgba(180,227,200,0.15)" : "rgba(5,160,73,0.08)",
                    color: isSelected ? "#B4E3C8" : "#05A049",
                  }}
                >
                  <UseCaseIcon icon={card.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm sm:text-base font-bold mb-1"
                    style={{
                      fontFamily: "var(--font-manrope)",
                      color: isSelected ? "#FFFFFC" : "#00111B",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.5)" : "#6B7280",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div
                  className="absolute top-4 right-4 h-5 w-5 rounded-full flex items-center justify-center"
                  style={{ background: "#05A049" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
