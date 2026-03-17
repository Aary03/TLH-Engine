"use client";

import { useState } from "react";
import type { JourneyStep } from "@/lib/journeys";
import StepCalculator from "./StepCalculator";

interface Props {
  step: JourneyStep;
  stepNumber: number;
  totalSteps: number;
}

export default function StepCard({ step, stepNumber, totalSteps }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={`step-${step.id}`}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#fff",
        border: "1.5px solid #E5E7EB",
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold"
              style={{ background: "#05A049", color: "#fff", fontFamily: "var(--font-bricolage)" }}
            >
              {stepNumber}
            </span>
            <h3
              className="text-base sm:text-lg font-bold leading-snug"
              style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}
            >
              {step.title}
            </h3>
          </div>
          <span
            className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: "#F3F4F6", color: "#9CA3AF" }}
          >
            {stepNumber}/{totalSteps}
          </span>
        </div>

        {/* Plain English */}
        <p className="text-sm sm:text-[15px] leading-relaxed mb-4" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
          {step.plainEnglish}
        </p>
      </div>

      {/* What this means */}
      {step.whatThisMeans && (
        <div
          className="mx-6 mb-4 rounded-xl px-4 py-3"
          style={{ background: "rgba(180,227,200,0.15)", borderLeft: "3px solid #05A049" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#05A049" }}>
            What this means for you
          </p>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
            {step.whatThisMeans}
          </p>
        </div>
      )}

      {/* Tip (gold) */}
      {step.tip && (
        <div
          className="mx-6 mb-4 rounded-xl px-4 py-3"
          style={{ background: "rgba(184,145,58,0.08)", borderLeft: "3px solid #B8913A" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#B8913A" }}>
            💡 Smart tip
          </p>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
            {step.tip}
          </p>
        </div>
      )}

      {/* Danger (red) */}
      {step.danger && (
        <div
          className="mx-6 mb-4 rounded-xl px-4 py-3"
          style={{ background: "rgba(220,38,38,0.06)", borderLeft: "3px solid #DC2626" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#DC2626" }}>
            ⚠ Important warning
          </p>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
            {step.danger}
          </p>
        </div>
      )}

      {/* Callout (neutral dark tint) */}
      {step.callout && (
        <div
          className="mx-6 mb-4 rounded-xl px-4 py-3"
          style={{ background: "rgba(0,17,27,0.04)", borderLeft: "3px solid #00111B" }}
        >
          <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: "#00111B", fontFamily: "'Inter', sans-serif" }}>
            {step.callout}
          </p>
        </div>
      )}

      {/* Inline Calculator */}
      {step.calculator && (
        <div className="mx-6 mb-4">
          <StepCalculator type={step.calculator} />
        </div>
      )}

      {/* Documents */}
      {step.documents && step.documents.length > 0 && (
        <div className="mx-6 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
            Documents needed
          </p>
          <div className="flex flex-wrap gap-2">
            {step.documents.map((doc) => (
              <span
                key={doc}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rate Table */}
      {step.rateTable && step.rateTable.length > 0 && (
        <div className="mx-6 mb-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#00111B" }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: "#B4E3C8" }}>Income bracket</th>
                <th className="px-3 py-2 text-right font-semibold" style={{ color: "#FDA5A5" }}>Short-term rate</th>
                <th className="px-3 py-2 text-right font-semibold" style={{ color: "#86EFAC" }}>Long-term rate</th>
                <th className="px-3 py-2 text-right font-semibold" style={{ color: "#FCD34D" }}>Saving per ₹1L</th>
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
                  <td className="px-3 py-2 font-medium" style={{ color: "#00111B" }}>{row.bracket}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: "#DC2626" }}>{row.stcg}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: "#05A049" }}>{row.ltcg}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: "#B8913A" }}>{row.saving}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Checklist */}
      {step.checklist && step.checklist.length > 0 && (
        <div className="mx-6 mb-4 space-y-2">
          {step.checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 h-5 w-5 rounded border-2 mt-0.5"
                style={{ borderColor: "#05A049" }}
              />
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Inter', sans-serif" }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
