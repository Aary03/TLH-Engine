"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, AlertCircle, TrendingUp, Scissors, Clock, FileText } from "lucide-react";
import {
  HOLDINGS,
  getHoldingDays,
  getUnrealizedPnL,
  USD_TO_INR,
} from "@/lib/mock-data";
import {
  getSTCGEffectiveRate,
  getLTCGEffectiveRate,
  bracketToIncome,
} from "@/lib/tax-calculations";

// ─── Types ────────────────────────────────────────────────────────────────

type InsightColor = "red" | "amber" | "green" | "blue";

interface Insight {
  id: string;
  color: InsightColor;
  icon: React.ReactNode;
  message: string;
  cta: string;
  ctaHref: string;
  priority: number; // lower = shown first
}

// ─── Color config ─────────────────────────────────────────────────────────

const COLOR_STYLES: Record<InsightColor, {
  bg: string; border: string; dot: string; text: string; ctaColor: string;
}> = {
  red:   { bg: "#FFF5F5", border: "rgba(220,38,38,0.25)", dot: "#DC2626", text: "#7A2020", ctaColor: "#DC2626" },
  amber: { bg: "#FFFBF0", border: "rgba(184,145,58,0.3)", dot: "#B8913A", text: "#7A5C15", ctaColor: "#B8913A" },
  green: { bg: "#F0FAF4", border: "rgba(5,160,73,0.25)", dot: "#05A049", text: "#064E24", ctaColor: "#05A049" },
  blue:  { bg: "#F0F6FF", border: "rgba(43,74,138,0.25)", dot: "#2B4A8A", text: "#1A3060", ctaColor: "#2B4A8A" },
};

const ICONS: Record<InsightColor, React.ReactNode> = {
  red:   <AlertCircle size={13} />,
  amber: <Clock size={13} />,
  green: <Scissors size={13} />,
  blue:  <TrendingUp size={13} />,
};

// ─── Insight computation ──────────────────────────────────────────────────

function computeInsights(): Insight[] {
  const insights: Insight[] = [];
  const today = new Date();
  const income = bracketToIncome("above_5Cr");
  const stcgRate = getSTCGEffectiveRate(income, "old");
  const ltcgRate = getLTCGEffectiveRate(income, "old");

  // ── 1. FY_END_URGENCY ────────────────────────────────────────────────────
  const fyEnd = new Date("2026-03-31T23:59:59");
  const msPerDay = 86_400_000;
  const daysLeft = Math.floor((fyEnd.getTime() - today.getTime()) / msPerDay);
  if (daysLeft > 0 && daysLeft < 20) {
    const lastTLHDate = new Date(fyEnd);
    lastTLHDate.setDate(fyEnd.getDate() - 2); // T+2 settlement
    insights.push({
      id: "fy_end",
      color: "red",
      icon: ICONS.red,
      message: `FY 2025-26 ends in ${daysLeft} days. Last day to book losses for tax offset: March ${lastTLHDate.getDate()}.`,
      cta: "View TLH opportunities →",
      ctaHref: "/tlh",
      priority: 1,
    });
  }

  // ── 2. LTCG_CLIFF ────────────────────────────────────────────────────────
  let ltcgCliffAdded = false;
  for (const h of HOLDINGS) {
    if (ltcgCliffAdded) break;
    const pnl = getUnrealizedPnL(h);
    if (pnl.isLoss) continue; // only relevant for gains
    const days = getHoldingDays(h.purchaseDate);
    const daysToLTCG = 730 - days;
    if (daysToLTCG > 0 && daysToLTCG <= 60) {
      const extraTax = Math.round(pnl.pnlINR * (stcgRate - ltcgRate));
      if (extraTax > 0) {
        const shortName = h.name.replace(/ - IFSC(?: Series)?/i, "").replace(/ IFSC/i, "");
        const extraK = extraTax >= 100_000
          ? `₹${(extraTax / 100_000).toFixed(1)}L`
          : `₹${Math.round(extraTax / 1000)}K`;
        insights.push({
          id: `ltcg_cliff_${h.id}`,
          color: "amber",
          icon: ICONS.amber,
          message: `${shortName} crosses into LTCG in ${daysToLTCG} days. Selling before then costs ${extraK} more in tax.`,
          cta: "See the math →",
          ctaHref: "/calculators/capital-gains",
          priority: 2,
        });
        ltcgCliffAdded = true;
      }
    }
  }

  // ── 3. UNHARVESTED_LOSS ──────────────────────────────────────────────────
  let totalLossINR = 0;
  for (const h of HOLDINGS) {
    const pnl = getUnrealizedPnL(h);
    if (pnl.isLoss) totalLossINR += Math.abs(pnl.pnlINR);
  }
  if (totalLossINR > 50_000) {
    const taxSavingINR = Math.round(totalLossINR * stcgRate);
    const lossLabel = totalLossINR >= 100_000
      ? `₹${(totalLossINR / 100_000).toFixed(1)}L`
      : `₹${Math.round(totalLossINR / 1_000)}K`;
    const savingLabel = taxSavingINR >= 100_000
      ? `₹${(taxSavingINR / 100_000).toFixed(1)}L`
      : `₹${Math.round(taxSavingINR / 1_000)}K`;
    insights.push({
      id: "unharvested_loss",
      color: "green",
      icon: ICONS.green,
      message: `You have ${lossLabel} in harvestable losses. At your income bracket, harvesting saves ${savingLabel} this FY.`,
      cta: "Harvest now →",
      ctaHref: "/tlh",
      priority: 3,
    });
  }

  // ── 4. ADVANCE_TAX_REMINDER ──────────────────────────────────────────────
  const advanceTaxDates: { date: Date; pct: number; label: string }[] = [
    { date: new Date(2025, 5, 15),  pct: 15,  label: "June 15" },
    { date: new Date(2025, 8, 15),  pct: 45,  label: "September 15" },
    { date: new Date(2025, 11, 15), pct: 75,  label: "December 15" },
    { date: new Date(2026, 2, 15),  pct: 100, label: "March 15" },
  ];
  for (const at of advanceTaxDates) {
    const daysToAT = Math.floor((at.date.getTime() - today.getTime()) / msPerDay);
    if (daysToAT >= 0 && daysToAT <= 30) {
      insights.push({
        id: "advance_tax",
        color: "blue",
        icon: ICONS.blue,
        message: `Next advance tax installment (${at.pct}% of annual tax) due ${at.label}. Your TCS credits from LRS remittances reduce this directly.`,
        cta: "Calculate LRS offset →",
        ctaHref: "/calculators/lrs-tcs",
        // More urgent when very close
        priority: daysToAT <= 7 ? 1.5 : 4,
      });
      break;
    }
  }

  // ── 5. SCHEDULE_FA_REMINDER ──────────────────────────────────────────────
  const month = today.getMonth(); // 0-indexed
  const isComplianceSeason = month >= 9 || month <= 2; // Oct–Mar
  if (isComplianceSeason) {
    const prefill = encodeURIComponent("Build my Schedule FA data for GIFT City holdings — I need to file ITR-2.");
    insights.push({
      id: "schedule_fa",
      color: "amber",
      icon: <FileText size={13} />,
      message: "GIFT City holdings must be disclosed in Schedule FA of ITR-2/ITR-3. Non-disclosure penalty: ₹10 lakh/year under Black Money Act.",
      cta: "Build Schedule FA data →",
      ctaHref: `/chat?prefill=${prefill}`,
      priority: 5,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 2);
}

// ─── Single strip ─────────────────────────────────────────────────────────

function InsightStrip({
  insight,
  onDismiss,
  isFirst,
}: {
  insight: Insight;
  onDismiss: (id: string) => void;
  isFirst: boolean;
}) {
  const c = COLOR_STYLES[insight.color];
  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{
        minHeight: "44px",
        background: c.bg,
        borderBottom: `1px solid ${c.border}`,
        borderTop: isFirst ? `1px solid ${c.border}` : undefined,
      }}
    >
      {/* Colored dot + icon */}
      <span
        className="flex-shrink-0 flex items-center gap-1.5"
        style={{ color: c.dot }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: c.dot }}
        />
        {insight.icon}
      </span>

      {/* Message */}
      <p
        className="flex-1 min-w-0 text-[12px] leading-snug truncate sm:whitespace-normal"
        style={{ color: c.text, fontFamily: "'Inter', sans-serif" }}
      >
        {insight.message}
      </p>

      {/* CTA + dismiss */}
      <div className="flex-shrink-0 flex items-center gap-3 ml-2">
        <Link
          href={insight.ctaHref}
          className="text-[11px] font-semibold whitespace-nowrap transition-opacity hover:opacity-75"
          style={{ color: c.ctaColor, fontFamily: "'Inter', sans-serif" }}
        >
          {insight.cta}
        </Link>
        <button
          onClick={() => onDismiss(insight.id)}
          className="h-5 w-5 flex items-center justify-center rounded-full transition-colors hover:bg-black/8 flex-shrink-0"
          style={{ color: c.dot, opacity: 0.6 }}
          aria-label="Dismiss"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

const DISMISSED_KEY = "dismissed_insights";

export default function ProactiveBanner() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Compute insights client-side only (avoids SSR mismatch)
    const dismissed = new Set<string>(
      JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? "[]")
    );
    const active = computeInsights().filter((i) => !dismissed.has(i.id));
    setInsights(active);
    setMounted(true);
    // Trigger slide-in animation after a short settle
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function dismiss(id: string) {
    const dismissed = new Set<string>(
      JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? "[]")
    );
    dismissed.add(id);
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }

  if (!mounted || insights.length === 0) return null;

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: visible ? `${insights.length * 60}px` : "0px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
      }}
    >
      {insights.map((insight, i) => (
        <InsightStrip
          key={insight.id}
          insight={insight}
          onDismiss={dismiss}
          isFirst={i === 0}
        />
      ))}
    </div>
  );
}
