"use client";

import { useState } from "react";
import type { InvestorType } from "@/lib/journeys";

interface Props {
  onSelect: (type: InvestorType) => void;
}

const CARDS: {
  type: InvestorType;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}[] = [
  {
    type: "resident",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4L4 14v14h8v-8h8v8h8V14L16 4z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 4L28 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "I live in India",
    description:
      "You can invest globally up to $2,50,000 per year. We'll show you how to do it tax-efficiently.",
    tag: "Most popular",
  },
  {
    type: "nri",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 20c3-2 6-3 9-1l6 4c3 2 6 1 9-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 14l4-4 4 2 4-4 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="16" cy="13" rx="12" ry="5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
      </svg>
    ),
    title: "I live outside India",
    description:
      "No investment limits. No TCS. Invest in global markets through your GIFT City account.",
    tag: "Zero restrictions",
  },
  {
    type: "foreign",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
        <ellipse cx="16" cy="16" rx="6" ry="12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 16h24" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 11h21M5.5 21h21" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
      </svg>
    ),
    title: "I'm not Indian",
    description:
      "Access global markets and Indian opportunities through GIFT City's international platform.",
    tag: "100+ nationalities",
  },
];

export default function PhaseOne({ onSelect }: Props) {
  const [selected, setSelected] = useState<InvestorType | null>(null);

  function handleSelect(type: InvestorType) {
    setSelected(type);
    setTimeout(() => onSelect(type), 420);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
      {/* Question */}
      <div className="text-center mb-10 max-w-xl">
        <h1
          className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3"
          style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}
        >
          How do you invest?
        </h1>
        <p className="text-base sm:text-lg" style={{ color: "#6B7280", fontFamily: "'Inter', sans-serif" }}>
          We'll set up a journey that makes sense for you.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const isSelected = selected === card.type;
          return (
            <button
              key={card.type}
              onClick={() => handleSelect(card.type)}
              className="relative text-left rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
              style={{
                background: isSelected ? "#00111B" : "#fff",
                border: isSelected ? "2px solid #05A049" : "1.5px solid #E5E7EB",
                boxShadow: isSelected
                  ? "0 0 0 4px rgba(5,160,73,0.12)"
                  : "0 1px 4px rgba(0,0,0,0.06)",
                minHeight: "180px",
              }}
            >
              {/* Tag */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4"
                style={{
                  background: isSelected ? "rgba(180,227,200,0.2)" : "rgba(5,160,73,0.1)",
                  color: isSelected ? "#B4E3C8" : "#05A049",
                }}
              >
                {card.tag}
              </span>

              {/* Icon */}
              <div
                className="mb-3"
                style={{ color: isSelected ? "#B4E3C8" : "#00111B" }}
              >
                {card.icon}
              </div>

              {/* Text */}
              <h3
                className="text-lg font-bold mb-1.5"
                style={{
                  fontFamily: "var(--font-manrope)",
                  color: isSelected ? "#FFFFFC" : "#00111B",
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: isSelected ? "rgba(255,255,255,0.55)" : "#6B7280",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {card.description}
              </p>

              {/* Selected checkmark */}
              {isSelected && (
                <div
                  className="absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ background: "#05A049" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
