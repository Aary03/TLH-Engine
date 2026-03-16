"use client";

import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useProfile } from "./ProfileContext";
import { ValuraProfile, BRACKET_LABELS, profileSummary } from "@/lib/user-profile";
import { useState, useEffect } from "react";

const BRACKETS: ValuraProfile["incomeBracket"][] = [
  "up_to_50L",
  "50L_to_1Cr",
  "1Cr_to_2Cr",
  "2Cr_to_5Cr",
  "above_5Cr",
];

const INVESTOR_LABELS: Record<ValuraProfile["investorType"], string> = {
  resident: "🇮🇳 Resident Indian",
  nri: "✈️ NRI",
  foreign: "🌍 Foreign National",
};

export default function ProfilePanel() {
  const { profile, updateProfile, showPanel, setShowPanel } = useProfile();

  const [bracket, setBracket] = useState(profile.incomeBracket);
  const [investorType, setInvestorType] = useState(profile.investorType);
  const [regime, setRegime] = useState(profile.taxRegime);
  const [members, setMembers] = useState(profile.familyMembers);

  // Sync local state when panel opens
  useEffect(() => {
    if (showPanel) {
      setBracket(profile.incomeBracket);
      setInvestorType(profile.investorType);
      setRegime(profile.taxRegime);
      setMembers(profile.familyMembers);
    }
  }, [showPanel, profile]);

  function handleSave() {
    updateProfile({
      incomeBracket: bracket,
      investorType,
      taxRegime: regime,
      familyMembers: members,
      incomeAbove5Cr: bracket === "above_5Cr",
    });
    setShowPanel(false);
  }

  function addMember() {
    if (members.length >= 5) return;
    setMembers((m) => [...m, { name: `Member ${m.length + 1}`, fyRemittedINR: 0 }]);
  }

  function removeMember(idx: number) {
    if (idx === 0) return; // can't remove "You"
    setMembers((m) => m.filter((_, i) => i !== idx));
  }

  function updateMemberName(idx: number, name: string) {
    setMembers((m) => m.map((mem, i) => (i === idx ? { ...mem, name } : mem)));
  }

  if (!showPanel) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowPanel(false)}
      />

      {/* Panel */}
      <div
        className="relative bg-[#FFFFFC] w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden"
        style={{ borderLeft: "1.5px solid #E8E4DE" }}
      >
        {/* Header */}
        <div className="bg-[#00111B] px-5 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-[#B4E3C8] text-[10px] font-semibold tracking-widest uppercase mb-0.5">
              Your Profile
            </p>
            <h2
              className="text-white text-lg font-extrabold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Calculator Settings
            </h2>
            <p className="text-white/50 text-xs mt-0.5 leading-tight">{profileSummary(profile)}</p>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            className="text-white/40 hover:text-white/80 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Income bracket */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#00111B]/50 mb-2">
              Annual Income
            </p>
            <div className="space-y-1.5">
              {BRACKETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBracket(b)}
                  className="w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    background: bracket === b ? "#05A049" : "#F7F5F0",
                    borderColor: bracket === b ? "#05A049" : "#E8E4DE",
                    color: bracket === b ? "#fff" : "#00111B",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {BRACKET_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* Investor type */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#00111B]/50 mb-2">
              Investor Type
            </p>
            <div className="space-y-1.5">
              {(["resident", "nri", "foreign"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setInvestorType(t)}
                  className="w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    background: investorType === t ? "#05A049" : "#F7F5F0",
                    borderColor: investorType === t ? "#05A049" : "#E8E4DE",
                    color: investorType === t ? "#fff" : "#00111B",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {INVESTOR_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Tax regime */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#00111B]/50 mb-2">
              Tax Regime
            </p>
            <div className="flex gap-2">
              {(["new", "old"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className="flex-1 py-2 rounded-lg border text-sm font-semibold transition-all"
                  style={{
                    background: regime === r ? "#05A049" : "#F7F5F0",
                    borderColor: regime === r ? "#05A049" : "#E8E4DE",
                    color: regime === r ? "#fff" : "#00111B",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {r === "new" ? "New" : "Old"}
                </button>
              ))}
            </div>
          </div>

          {/* Family members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#00111B]/50">
                Family Members
              </p>
              {members.length < 5 && (
                <button
                  onClick={addMember}
                  className="flex items-center gap-1 text-[#05A049] text-xs font-medium hover:opacity-75 transition-opacity"
                >
                  <Plus size={12} /> Add member
                </button>
              )}
            </div>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={m.name}
                    onChange={(e) => updateMemberName(i, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border bg-[#F7F5F0] text-sm"
                    style={{ borderColor: "#E8E4DE", fontFamily: "'Inter', sans-serif" }}
                    placeholder={i === 0 ? "You" : `Member ${i + 1}`}
                    readOnly={i === 0}
                  />
                  {i > 0 && (
                    <button
                      onClick={() => removeMember(i)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#00111B]/40 mt-2">
              Combined TCS-free capacity: ₹{(members.length * 10).toLocaleString("en-IN")}L/FY
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E8E4DE] bg-[#F7F5F0] flex-shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#05A049", fontFamily: "'Manrope', sans-serif" }}
          >
            Save changes
          </button>
          <p className="text-xs text-center text-[#00111B]/30 mt-2">
            Saved locally · no sign-in required
          </p>
        </div>
      </div>
    </div>
  );
}
