"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Scissors, BarChart2, Users, Zap, Calendar, FileText, ShieldAlert, Trophy } from "lucide-react";
import { formatINR, formatUSD } from "@/lib/utils";

// ─── Type guards ──────────────────────────────────────────────────────────

export type WidgetData =
  | TCSWidgetData
  | CGWidgetData
  | FamilySplitData
  | TLHWidgetData
  | RatesWidgetData
  | FYAuditData
  | ScenarioComparisonData
  | ScheduleFAData
  | FYCountdownData;

interface TCSWidgetData { type: "tcs_result"; remittanceINR: number; purpose: string; fyCumulativeINR: number; thresholdINR: number; totalAfterINR: number; taxableAmountINR: number; tcsAmount: number; effectiveRate: number; breakdown: string; isAboveThreshold: boolean; remainingFree: number; }
interface CGWidgetData { type: "cg_result"; gainType: string; holdingDays: number; holdingMonths: number; gainINR: number; gainUSD: number; isLoss: boolean; isLTCG: boolean; effectiveRate: number; taxAmount: number; netProceeds: number; baseRate: number; appliedSurcharge: number; formula: string; daysToLTCG: number; savingByWaiting: number; incomeBracket: string; regime: string; }
interface FamilySplitData { type: "family_split"; totalRemittanceINR: number; purpose: string; memberCount: number; singlePANTCS: number; optimizedTCS: number; tcsSavings: number; allocations: { memberId: string; memberName: string; fyRemittedSoFar: number; allocation: number; tcs: number; remainingThreshold: number }[]; recommendation: string; zeroTCSCapacity: number; }
interface TLHWidgetData { type: "tlh_opportunities"; incomeBracket: string; summary: { opportunityCount: number; totalLossAvailable: number; totalPotentialSavings: number; totalNetBenefit: number; stclCount: number }; topOpportunities: { name: string; symbol: string; isSTCL: boolean; unrealizedLossINR: number; unrealizedLossPercent: number; bestCaseSavings: number; holdingDays: number; priorityScore: number; urgency: string; recommendation: string }[]; }
interface RatesWidgetData { type: "tax_rates"; incomeBracket: string; regime: string; stcgRate: number; ltcgRate: number; spread: number; baseSTCG: number; baseLTCG: number; surcharge: number; ltcgSurcharge: number; stcgFormula: string; ltcgFormula: string; savingPerLakh: number; capBenefit: string | null; }

interface FYAuditData {
  type: "fy_audit_result";
  fyDaysLeft: number;
  portfolioValueINR: number;
  totalUnrealizedLossINR: number;
  totalUnrealizedGainINR: number;
  tlhOpportunities: { symbol: string; name: string; lossINR: number; taxSavingINR: number; urgency: string; isSTCL: boolean }[];
  totalTLHSavingINR: number;
  pendingGains: { name: string; symbol: string; gainType: string; gainINR: number; taxAmount: number; holdingDays: number }[];
  lrsStatus: { familyTotalRemittedINR: number; familyTotalTCSPaidINR: number; optimizedSavingINR: number };
  urgentActions: string[];
}

interface ScenarioComparisonData {
  type: "scenario_comparison";
  holdingName: string;
  buyPriceUSD: number;
  currentPriceUSD: number;
  quantity: number;
  scenarioA: { label: string; holdingMonths: number; holdingDays: number; isLTCG: boolean; gainINR: number; taxAmount: number; effectiveRate: number; netProceedsINR: number; gainType: string };
  scenarioB: { label: string; holdingMonths: number; holdingDays: number; isLTCG: boolean; gainINR: number; taxAmount: number; effectiveRate: number; netProceedsINR: number; gainType: string };
  betterScenario: "A" | "B";
  savingByChoosingBetterINR: number;
  recommendation: string;
}

interface ScheduleFAData {
  type: "schedule_fa_draft";
  reportingCalendarYear: number;
  itrFormNeeded: string;
  filingDeadline: string;
  accounts: { slNo: string; country: string; institution: string; accountType: string; accountNumber: string; openingBalanceINR: number; peakBalanceINR: number; closingBalanceINR: number; incomeEarnedINR: number; taxableInIndia: string }[];
  holdingSummary: { name: string; isin: string; quantityUnits: number; costINR: number; marketValueINR: number }[];
  blackMoneyActNote: string;
  complianceChecklist: string[];
  valuraNote: string;
}

interface FYCountdownData {
  type: "fy_countdown";
  today: string;
  fyEndDate: string;
  daysLeft: number;
  lastTLHDate: string;
  nextAdvanceTaxDate: string;
  nextAdvanceTaxPct: number;
  urgencyLevel: "critical" | "high" | "medium";
  keyDeadlines: { event: string; date: string; daysAway: number }[];
}

// ─── Widget Router ────────────────────────────────────────────────────────

export function WidgetRenderer({ widget }: { widget: Record<string, unknown> }) {
  switch (widget.type) {
    case "tcs_result":     return <TCSWidget data={widget as unknown as TCSWidgetData} />;
    case "cg_result":      return <CGWidget data={widget as unknown as CGWidgetData} />;
    case "family_split":   return <FamilySplitWidget data={widget as unknown as FamilySplitData} />;
    case "tlh_opportunities": return <TLHWidget data={widget as unknown as TLHWidgetData} />;
    case "tax_rates":      return <RatesWidget data={widget as unknown as RatesWidgetData} />;
    case "fy_audit_result": return <FYAuditWidget data={widget as unknown as FYAuditData} />;
    case "scenario_comparison": return <ScenarioComparisonWidget data={widget as unknown as ScenarioComparisonData} />;
    case "schedule_fa_draft": return <ScheduleFAWidget data={widget as unknown as ScheduleFAData} />;
    case "fy_countdown":  return <FYCountdownWidget data={widget as unknown as FYCountdownData} />;
    default:               return null;
  }
}

// ─── TCS Widget ───────────────────────────────────────────────────────────

function TCSWidget({ data }: { data: TCSWidgetData }) {
  const isZero = data.tcsAmount === 0;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-background overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/10">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">TCS Calculation</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isZero ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
          {isZero ? "₹0 TCS — Under threshold ✓" : `TCS: ${formatINR(data.tcsAmount)}`}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Left: inputs */}
        <div className="space-y-2">
          <Row label="Remittance" value={formatINR(data.remittanceINR)} />
          <Row label="Purpose" value={data.purpose.replace("_", " ")} />
          <Row label="FY already remitted" value={formatINR(data.fyCumulativeINR)} />
          <Row label="Total after remittance" value={formatINR(data.totalAfterINR)} highlight={data.isAboveThreshold} />
          <Row label="₹10L threshold" value={formatINR(data.thresholdINR)} color="text-amber-400" />
        </div>

        {/* Right: calculation */}
        <div className="space-y-2">
          <div className="rounded-lg bg-background/60 p-3 space-y-2">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Formula</p>
            {data.isAboveThreshold ? (
              <>
                <p className="text-[10px] font-mono text-foreground">
                  Taxable = {formatINR(data.totalAfterINR)} − {formatINR(data.thresholdINR)} = {formatINR(data.taxableAmountINR)}
                </p>
                <p className="text-[10px] font-mono">
                  TCS = {formatINR(data.taxableAmountINR)} × {(data.effectiveRate * 100 || 20).toFixed(0)}%
                </p>
                <p className="text-[10px] font-mono font-bold text-rose-400">
                  = {formatINR(data.tcsAmount)}
                </p>
              </>
            ) : (
              <p className="text-[10px] font-mono text-emerald-400">
                {formatINR(data.totalAfterINR)} ≤ ₹10L threshold → TCS = ₹0
              </p>
            )}
          </div>
          <div className={`rounded-lg border px-3 py-2 text-center ${isZero ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
            <p className="text-[9px] text-muted-foreground">TCS Payable</p>
            <p className={`text-lg font-bold ${isZero ? "text-emerald-400" : "text-rose-400"}`}>{formatINR(data.tcsAmount)}</p>
            {!isZero && <p className="text-[9px] text-muted-foreground">Eff. rate: {(data.effectiveRate * 100).toFixed(1)}%</p>}
          </div>
          {data.remainingFree > 0 && (
            <p className="text-[9px] text-emerald-400 text-center">
              {formatINR(data.remainingFree)} can still be remitted at 0% TCS
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Capital Gains Widget ─────────────────────────────────────────────────

function CGWidget({ data }: { data: CGWidgetData }) {
  const isGain = !data.isLoss;
  const typeColor = data.isLTCG ? "text-emerald-400" : data.isLoss ? "text-rose-400" : "text-yellow-400";
  const typeBg = data.isLTCG ? "bg-emerald-500/10 border-emerald-500/30" : data.isLoss ? "bg-rose-500/10 border-rose-500/30" : "bg-yellow-500/10 border-yellow-500/30";

  return (
    <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/10">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400">Capital Gains Calculation</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeBg} ${typeColor}`}>
          {data.gainType} · {data.holdingDays}d held
        </span>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Row label="Holding period" value={`${data.holdingDays} days (${data.holdingMonths}m)`} />
          <Row label="Classification" value={data.isLTCG ? "LTCG — >730 days ✓" : `STCG — ${data.daysToLTCG}d to LTCG`} color={data.isLTCG ? "text-emerald-400" : "text-yellow-400"} />
          <Row label="Gain / Loss (INR)" value={`${data.gainINR >= 0 ? "+" : ""}${formatINR(data.gainINR)}`} color={data.isLoss ? "text-rose-400" : "text-emerald-400"} />

          <div className="rounded-lg bg-background/60 p-3 space-y-1.5">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Rate Formula</p>
            <p className="text-[10px] font-mono text-foreground">{data.formula}</p>
            {data.isLTCG && (
              <p className="text-[9px] text-emerald-400">↑ Surcharge capped at 15% by Section 112 proviso</p>
            )}
            {!data.isLTCG && !data.isLoss && (
              <p className="text-[9px] text-rose-400">↑ No surcharge cap on STCG — full rate applies</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-background/60 p-3 text-center">
            <p className="text-[9px] text-muted-foreground">Effective Rate</p>
            <p className={`text-xl font-bold ${data.isLTCG ? "text-emerald-400" : "text-rose-400"}`}>
              {(data.effectiveRate * 100).toFixed(2)}%
            </p>
          </div>
          {isGain && (
            <div className="rounded-lg border border-border bg-background/60 p-3 text-center">
              <p className="text-[9px] text-muted-foreground">Tax Amount</p>
              <p className="text-sm font-bold text-rose-400">{formatINR(data.taxAmount)}</p>
            </div>
          )}
          {isGain && !data.isLTCG && data.savingByWaiting > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Save by waiting {data.daysToLTCG}d</p>
              <p className="text-xs font-bold text-emerald-400">{formatINR(data.savingByWaiting)}</p>
            </div>
          )}
          {data.isLoss && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Harvest value</p>
              <p className="text-xs font-bold text-emerald-400">{formatINR(Math.abs(data.gainINR) * data.effectiveRate)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Family Split Widget ──────────────────────────────────────────────────

function FamilySplitWidget({ data }: { data: FamilySplitData }) {
  const saved = data.tcsSavings > 0;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-500/20 bg-emerald-500/10">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Family TCS Optimizer</span>
        </div>
        {saved ? (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            Saves {formatINR(data.tcsSavings)} in TCS
          </span>
        ) : (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Already optimal</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
            <p className="text-[9px] text-muted-foreground">Single PAN TCS</p>
            <p className="text-sm font-bold text-rose-400">{formatINR(data.singlePANTCS)}</p>
          </div>
          <div className={`rounded-lg border p-3 ${data.optimizedTCS === 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
            <p className="text-[9px] text-muted-foreground">With {data.memberCount} members</p>
            <p className={`text-sm font-bold ${data.optimizedTCS === 0 ? "text-emerald-400" : "text-amber-400"}`}>{formatINR(data.optimizedTCS)}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <p className="text-[9px] text-muted-foreground">TCS Saved</p>
            <p className="text-sm font-bold text-emerald-400">{formatINR(data.tcsSavings)}</p>
          </div>
        </div>

        {/* Per-member table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Member</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">FY so far</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Planned</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">TCS</th>
              </tr>
            </thead>
            <tbody>
              {data.allocations.filter((a) => a.allocation > 0).map((a) => (
                <tr key={a.memberId} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium">{a.memberName.split(" ")[0]}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{formatINR(a.fyRemittedSoFar)}</td>
                  <td className="px-3 py-2 text-right text-primary">{formatINR(a.allocation)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${a.tcs > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {a.tcs > 0 ? formatINR(a.tcs) : "₹0 ✓"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-emerald-400 font-medium">{data.recommendation}</p>
      </div>
    </div>
  );
}

// ─── TLH Widget ───────────────────────────────────────────────────────────

function TLHWidget({ data }: { data: TLHWidgetData }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-rose-500/20 bg-rose-500/10">
        <div className="flex items-center gap-2">
          <Scissors className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-400">TLH Opportunities</span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
          {data.summary.opportunityCount} opportunities · {formatINR(data.summary.totalPotentialSavings)} potential savings
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
            <p className="text-[9px] text-muted-foreground">Total Losses</p>
            <p className="text-sm font-bold text-rose-400">{formatINR(data.summary.totalLossAvailable)}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
            <p className="text-[9px] text-muted-foreground">Tax Savings</p>
            <p className="text-sm font-bold text-emerald-400">{formatINR(data.summary.totalPotentialSavings)}</p>
          </div>
          <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-2">
            <p className="text-[9px] text-muted-foreground">STCL Positions</p>
            <p className="text-sm font-bold text-orange-400">{data.summary.stclCount} (high value)</p>
          </div>
        </div>

        {/* Top opportunities */}
        <div className="space-y-2">
          {data.topOpportunities.map((o, i) => (
            <div key={i} className={`rounded-lg border p-2.5 flex items-center justify-between gap-3 ${
              o.urgency === "critical" ? "border-rose-500/30 bg-rose-500/5" :
              o.urgency === "high" ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-secondary/20"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${o.urgency === "critical" ? "bg-rose-400 animate-pulse" : "bg-amber-400"}`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold truncate">{o.name.replace(" - IFSC", "").replace(" IFSC", "")}</p>
                  <p className="text-[9px] text-muted-foreground">{o.symbol} · {o.holdingDays}d · {o.isSTCL ? "STCL" : "LTCL"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <div>
                  <p className="text-[9px] text-muted-foreground">Loss</p>
                  <p className="text-[10px] font-bold text-rose-400">{formatINR(o.unrealizedLossINR)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">Tax saved</p>
                  <p className="text-[10px] font-bold text-emerald-400">{formatINR(o.bestCaseSavings)}</p>
                </div>
                <div className="rounded-full bg-secondary h-7 w-7 flex items-center justify-center text-[9px] font-bold">
                  {o.priorityScore}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground text-center">India has no wash sale rules — sell and rebuy the same fund immediately</p>
      </div>
    </div>
  );
}

// ─── Tax Rates Widget ─────────────────────────────────────────────────────

function RatesWidget({ data }: { data: RatesWidgetData }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-primary/20 bg-primary/10">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Effective Tax Rates</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">
          {data.incomeBracket.replace(/_/g, " ")} · {data.regime} regime
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* STCG */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="text-[9px] text-muted-foreground">STCG Rate (≤730 days)</p>
            <p className="text-2xl font-bold text-rose-400">{(data.stcgRate * 100).toFixed(2)}%</p>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">{data.stcgFormula}</p>
            <p className="text-[9px] text-rose-400/70 mt-1">No surcharge cap</p>
          </div>
          {/* LTCG */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[9px] text-muted-foreground">LTCG Rate (&gt;730 days)</p>
            <p className="text-2xl font-bold text-emerald-400">{(data.ltcgRate * 100).toFixed(2)}%</p>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">{data.ltcgFormula}</p>
            <p className="text-[9px] text-emerald-400/70 mt-1">Sec 112: surcharge capped at 15%</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-muted-foreground">Spread (STCG − LTCG)</p>
            <p className="text-lg font-bold text-amber-400">{(data.spread * 100).toFixed(2)} pp</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground">Tax saved per ₹1L by holding &gt;730d</p>
            <p className="text-base font-bold text-emerald-400">₹{data.savingPerLakh.toLocaleString()}</p>
          </div>
        </div>

        {data.capBenefit && (
          <p className="text-[9px] text-emerald-400 text-center bg-emerald-500/5 rounded-lg py-1.5">
            ✓ {data.capBenefit} (Section 112 proviso benefit)
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FY Audit Widget ──────────────────────────────────────────────────────

function FYAuditWidget({ data }: { data: FYAuditData }) {
  const isCritical = data.fyDaysLeft <= 10;
  const isHigh = data.fyDaysLeft <= 30;
  const urgencyColor = isCritical ? "text-rose-400" : isHigh ? "text-amber-400" : "text-emerald-400";
  const urgencyBg = isCritical ? "bg-rose-500/10 border-rose-500/30" : isHigh ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30";

  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-background overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/20 bg-violet-500/10">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400">FY 2025-26 Full Audit</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${urgencyBg} ${urgencyColor}`}>
          {data.fyDaysLeft}d left in FY
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Top stat row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={`rounded-lg border p-3 ${urgencyBg}`}>
            <p className="text-[9px] text-muted-foreground">FY Days Left</p>
            <p className={`text-2xl font-bold ${urgencyColor}`}>{data.fyDaysLeft}</p>
            <p className="text-[8px] text-muted-foreground">ends Mar 31</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <p className="text-[9px] text-muted-foreground">TLH Savings Available</p>
            <p className="text-xl font-bold text-emerald-400">{formatINR(data.totalTLHSavingINR)}</p>
            <p className="text-[8px] text-muted-foreground">{data.tlhOpportunities.length} positions</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="text-[9px] text-muted-foreground">LRS TCS Optimizable</p>
            <p className="text-xl font-bold text-amber-400">{formatINR(data.lrsStatus.optimizedSavingINR)}</p>
            <p className="text-[8px] text-muted-foreground">via family split</p>
          </div>
        </div>

        {/* Ranked action table */}
        {data.urgentActions.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-secondary/40 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ranked Action Plan</p>
            </div>
            <div className="divide-y divide-border/50">
              {data.urgentActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                  <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    i === 0 ? "bg-rose-500/20 text-rose-400" : i === 1 ? "bg-amber-500/20 text-amber-400" : "bg-secondary text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <p className="text-[10px] leading-relaxed text-foreground">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TLH positions */}
        {data.tlhOpportunities.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">TLH Positions</p>
            {data.tlhOpportunities.map((o, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                o.urgency === "critical" ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-secondary/20"
              }`}>
                <div>
                  <p className="text-[10px] font-semibold">{o.symbol}</p>
                  <p className="text-[9px] text-muted-foreground">{o.isSTCL ? "STCL" : "LTCL"} · {o.urgency}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-rose-400">{formatINR(o.lossINR)} loss</p>
                  <p className="text-[9px] text-emerald-400 font-bold">{formatINR(o.taxSavingINR)} saved</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[9px] text-muted-foreground text-center">
          Portfolio value: {formatINR(data.portfolioValueINR)} · Unrealized gain: {formatINR(data.totalUnrealizedGainINR)} · Unrealized loss: {formatINR(data.totalUnrealizedLossINR)}
        </p>
      </div>
    </div>
  );
}

// ─── Scenario Comparison Widget ───────────────────────────────────────────

function ScenarioComparisonWidget({ data }: { data: ScenarioComparisonData }) {
  const aIsBetter = data.betterScenario === "A";
  const better = aIsBetter ? data.scenarioA : data.scenarioB;
  const worse = aIsBetter ? data.scenarioB : data.scenarioA;

  function ScenarioCard({ s, isBetter }: { s: ScenarioComparisonData["scenarioA"]; isBetter: boolean }) {
    return (
      <div className={`rounded-xl border p-3 space-y-2 ${isBetter ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
        <div className="flex items-center justify-between">
          <p className={`text-[10px] font-bold ${isBetter ? "text-emerald-400" : "text-rose-400"}`}>{s.label}</p>
          {isBetter && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">BETTER</span>}
        </div>
        <div className="space-y-1">
          <Row label="Gain type" value={s.gainType} color={s.isLTCG ? "text-emerald-400" : "text-yellow-400"} />
          <Row label="Tax rate" value={`${(s.effectiveRate * 100).toFixed(2)}%`} color={s.isLTCG ? "text-emerald-400" : "text-rose-400"} />
          <Row label="Tax payable" value={formatINR(s.taxAmount)} color="text-rose-400" />
          <Row label="Net proceeds" value={formatINR(s.netProceedsINR)} color={isBetter ? "text-emerald-400" : "text-foreground"} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-950/30 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400">Scenario Comparison — {data.holdingName}</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
          {data.betterScenario === "B" ? data.scenarioB.label : data.scenarioA.label} wins by {formatINR(data.savingByChoosingBetterINR)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ScenarioCard s={data.scenarioA} isBetter={aIsBetter} />
          <ScenarioCard s={data.scenarioB} isBetter={!aIsBetter} />
        </div>

        {/* Winner banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">Recommendation</p>
          <p className="text-sm font-bold text-emerald-400">{data.recommendation}</p>
          <p className="text-[9px] text-muted-foreground mt-1">
            Difference: {formatINR(data.savingByChoosingBetterINR)} more in your pocket
          </p>
        </div>

        <p className="text-[9px] text-muted-foreground text-center">
          {data.quantity} units @ buy ${data.buyPriceUSD} → current ${data.currentPriceUSD}
        </p>
      </div>
    </div>
  );
}

// ─── Schedule FA Widget ───────────────────────────────────────────────────

function ScheduleFAWidget({ data }: { data: ScheduleFAData }) {
  const [copied, setCopied] = useState(false);

  function copyToITR() {
    const text = [
      `SCHEDULE FA — Foreign Assets Disclosure`,
      `Reporting Calendar Year: ${data.reportingCalendarYear}`,
      `ITR Form: ${data.itrFormNeeded}`,
      `Filing Deadline: ${data.filingDeadline}`,
      ``,
      `ACCOUNT DETAILS:`,
      ...data.accounts.map((a) =>
        `${a.slNo}. ${a.institution} (${a.country})\n` +
        `   Account: ${a.accountNumber}\n` +
        `   Opening: ${formatINR(a.openingBalanceINR)} | Peak: ${formatINR(a.peakBalanceINR)} | Closing: ${formatINR(a.closingBalanceINR)}\n` +
        `   Income earned: ${formatINR(a.incomeEarnedINR)}`
      ),
      ``,
      `COMPLIANCE: ${data.blackMoneyActNote}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-orange-500/20 bg-orange-500/10">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">Schedule FA Draft — {data.reportingCalendarYear}</span>
        </div>
        <button
          onClick={copyToITR}
          className="text-[9px] font-bold px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
        >
          {copied ? "Copied ✓" : "Copy to ITR →"}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Warning banner */}
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-rose-300 leading-relaxed">{data.blackMoneyActNote}</p>
        </div>

        {/* Account table */}
        {data.accounts.map((a, i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-secondary/40 border-b border-border">
              <p className="text-[10px] font-semibold">{a.institution}</p>
              <p className="text-[9px] text-muted-foreground">{a.country} · {a.accountType}</p>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              <Row label="Opening balance" value={formatINR(a.openingBalanceINR)} />
              <Row label="Peak balance" value={formatINR(a.peakBalanceINR)} />
              <Row label="Closing balance" value={formatINR(a.closingBalanceINR)} color="text-foreground" />
              <Row label="Income earned" value={formatINR(a.incomeEarnedINR)} />
            </div>
          </div>
        ))}

        {/* Compliance checklist */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Compliance Checklist</p>
          {data.complianceChecklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-emerald-400 text-center font-medium">{data.valuraNote}</p>
      </div>
    </div>
  );
}

// ─── FY Countdown Widget ──────────────────────────────────────────────────

function FYCountdownWidget({ data }: { data: FYCountdownData }) {
  const isCritical = data.urgencyLevel === "critical";
  const isHigh = data.urgencyLevel === "high";
  const urgencyColor = isCritical ? "text-rose-400" : isHigh ? "text-amber-400" : "text-emerald-400";
  const urgencyBg = isCritical ? "border-rose-500/30 bg-rose-500/10" : isHigh ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10";

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-background overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/20 bg-cyan-500/10">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400">FY 2025-26 Countdown</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${urgencyBg} ${urgencyColor}`}>
          {data.urgencyLevel.toUpperCase()} urgency
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Big days left */}
        <div className={`rounded-xl border ${urgencyBg} p-4 text-center`}>
          <p className="text-[10px] text-muted-foreground">Days left in FY</p>
          <p className={`text-5xl font-extrabold ${urgencyColor}`}>{data.daysLeft}</p>
          <p className="text-[9px] text-muted-foreground mt-1">FY ends {data.fyEndDate}</p>
        </div>

        {/* Key deadlines */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-2 bg-secondary/40 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Key Deadlines</p>
          </div>
          <div className="divide-y divide-border/50">
            {data.keyDeadlines.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-[10px] font-medium">{d.event}</p>
                  <p className="text-[9px] text-muted-foreground">{d.date}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  d.daysAway <= 7 ? "bg-rose-500/20 text-rose-400" :
                  d.daysAway <= 30 ? "bg-amber-500/20 text-amber-400" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {d.daysAway}d
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-[9px] text-amber-400">
            <span className="font-bold">Next advance tax:</span> {data.nextAdvanceTaxDate} ({data.nextAdvanceTaxPct}% of annual tax due) · TCS credits can offset this directly
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────

function Row({ label, value, color = "text-foreground", highlight }: { label: string; value: string; color?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-[10px] ${highlight ? "text-rose-400" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Tool Status Pill ─────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  calculate_tcs:          { label: "Calculating TCS",                icon: "⚡" },
  calculate_capital_gains:{ label: "Computing capital gains",        icon: "📊" },
  optimize_family_tcs:    { label: "Optimizing family split",        icon: "👨‍👩‍👧" },
  get_tlh_opportunities:  { label: "Scanning TLH opportunities",     icon: "✂️" },
  get_tax_rates:          { label: "Fetching tax rates",             icon: "📈" },
  run_fy_audit:           { label: "Running full FY audit",          icon: "🔍" },
  compare_scenarios:      { label: "Comparing sell scenarios",       icon: "⚖️" },
  build_schedule_fa_data: { label: "Building Schedule FA draft",     icon: "📋" },
  get_fy_countdown:       { label: "Checking FY deadlines",          icon: "⏰" },
};

export function ToolPill({ tool, done }: { tool: string; done: boolean }) {
  const cfg = TOOL_LABELS[tool] ?? { label: tool, icon: "🔧" };
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all ${
      done
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-primary/30 bg-primary/10 text-primary animate-pulse"
    }`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
      {done && <CheckCircle2 className="h-3 w-3" />}
    </div>
  );
}
