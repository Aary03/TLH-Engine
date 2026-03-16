"use client";

import { X, Minus, Plus } from "lucide-react";
import { useProfile } from "./ProfileContext";
import { DEFAULT_PROFILE, ValuraProfile, BRACKET_LABELS, saveProfile } from "@/lib/user-profile";
import { useState } from "react";

const BRACKETS: ValuraProfile["incomeBracket"][] = [
  "up_to_50L",
  "50L_to_1Cr",
  "1Cr_to_2Cr",
  "2Cr_to_5Cr",
  "above_5Cr",
];

const INVESTOR_OPTIONS: { value: ValuraProfile["investorType"]; icon: string; label: string; sub: string }[] = [
  { value: "resident", icon: "🇮🇳", label: "Resident Indian", sub: "Live & work in India" },
  { value: "nri", icon: "✈️", label: "NRI", sub: "Live abroad, Indian passport" },
  { value: "foreign", icon: "🌍", label: "Foreign National", sub: "Non-Indian citizen" },
];

export default function ProfileModal() {
  const { showModal, setShowModal, updateProfile } = useProfile();

  const [bracket, setBracket] = useState<ValuraProfile["incomeBracket"]>(DEFAULT_PROFILE.incomeBracket);
  const [investorType, setInvestorType] = useState<ValuraProfile["investorType"]>(DEFAULT_PROFILE.investorType);
  const [regime, setRegime] = useState<ValuraProfile["taxRegime"]>(DEFAULT_PROFILE.taxRegime);
  const [familyCount, setFamilyCount] = useState(1);

  if (!showModal) return null;

  function handleSave() {
    const members: ValuraProfile["familyMembers"] = Array.from({ length: familyCount }, (_, i) =>
      i === 0 ? { name: "You", fyRemittedINR: 0 } : { name: `Member ${i + 1}`, fyRemittedINR: 0 }
    );
    updateProfile({
      incomeBracket: bracket,
      investorType,
      taxRegime: regime,
      familyMembers: members,
      incomeAbove5Cr: bracket === "above_5Cr",
    });
    setShowModal(false);
  }

  function handleSkip() {
    saveProfile(DEFAULT_PROFILE);
    setShowModal(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <div
        className="relative bg-[#FFFFFC] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ border: "1.5px solid #E8E4DE" }}
      >
        {/* Header */}
        <div className="bg-[#00111B] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#B4E3C8] text-xs font-medium tracking-widest uppercase mb-1">
                One-time setup
              </p>
              <h2
                className="text-white text-2xl font-extrabold leading-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Personalise your calculators
              </h2>
              <p className="text-white/60 text-sm mt-1">
                4 quick answers — every calculator pre-fills instantly
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/40 hover:text-white/80 transition-colors mt-1 ml-4 flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Q1: Income bracket */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#00111B]/50 uppercase mb-2">
              1 · Your annual income
            </p>
            <div className="flex flex-wrap gap-2">
              {BRACKETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBracket(b)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={{
                    background: bracket === b ? "#05A049" : "transparent",
                    borderColor: bracket === b ? "#05A049" : "#D4D8D0",
                    color: bracket === b ? "#fff" : "#00111B",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {BRACKET_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Investor type */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#00111B]/50 uppercase mb-2">
              2 · You are
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INVESTOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setInvestorType(opt.value)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    background: investorType === opt.value ? "#05A049" : "#F7F5F0",
                    borderColor: investorType === opt.value ? "#05A049" : "#E8E4DE",
                  }}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{
                      color: investorType === opt.value ? "#fff" : "#00111B",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: investorType === opt.value ? "rgba(255,255,255,0.75)" : "#6B7280" }}
                  >
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Tax regime */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#00111B]/50 uppercase mb-2">
              3 · Tax regime
            </p>
            <div className="flex gap-2">
              {(["new", "old"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                  style={{
                    background: regime === r ? "#05A049" : "#F7F5F0",
                    borderColor: regime === r ? "#05A049" : "#E8E4DE",
                    color: regime === r ? "#fff" : "#00111B",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {r === "new" ? "New Regime (2025-26)" : "Old Regime"}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: Family count */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#00111B]/50 uppercase mb-2">
              4 · Adults investing in your family
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFamilyCount((c) => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ borderColor: "#D4D8D0" }}
              >
                <Minus size={14} />
              </button>
              <span
                className="text-3xl font-extrabold w-8 text-center"
                style={{ color: "#00111B", fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {familyCount}
              </span>
              <button
                onClick={() => setFamilyCount((c) => Math.min(5, c + 1))}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ borderColor: "#D4D8D0" }}
              >
                <Plus size={14} />
              </button>
              <span className="text-sm text-[#00111B]/50 ml-1">
                {familyCount === 1
                  ? "Just you — uses your ₹10L TCS threshold"
                  : `${familyCount} members — ₹${(familyCount * 10).toLocaleString("en-IN")}L combined TCS-free`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DE] bg-[#F7F5F0] flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#05A049", fontFamily: "'Manrope', sans-serif" }}
          >
            Done — personalise my calculators
          </button>
          <button
            onClick={handleSkip}
            className="text-sm text-[#00111B]/40 hover:text-[#00111B]/70 transition-colors whitespace-nowrap"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
