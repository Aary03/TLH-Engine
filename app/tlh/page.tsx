"use client";

import { useState, useMemo } from "react";
import ProactiveBanner from "@/components/layout/ProactiveBanner";
import {
  Scissors, Zap, CheckCircle2, AlertTriangle, Clock,
  ArrowRight, RefreshCw, TrendingDown, Info, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { runTLHScan, getTLHSummary, type TLHOpportunity } from "@/lib/tlh-engine";
import { formatINR, holdingPeriodLabel } from "@/lib/utils";
import { getSTCGEffectiveRate, getLTCGEffectiveRate } from "@/lib/tax-calculations";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const INCOME = 60_000_000; // ₹6Cr

const URGENCY_CONFIG = {
  critical: { label: "Critical", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", badge: "critical" as const },
  high: { label: "High Priority", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", badge: "warning" as const },
  medium: { label: "Medium", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/20", badge: "info" as const },
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-secondary/30 border-border", badge: "outline" as const },
};

function OpportunityCard({
  opp, onHarvest, harvested,
}: {
  opp: TLHOpportunity; onHarvest: (id: string) => void; harvested: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = URGENCY_CONFIG[opp.urgency];
  const stcgRate = getSTCGEffectiveRate(INCOME, "old");
  const ltcgRate = getLTCGEffectiveRate(INCOME, "old");

  if (harvested) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3 animate-fade-in">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-400">{opp.holding.name}</p>
          <p className="text-xs text-muted-foreground">
            Harvested — {formatINR(opp.unrealizedLossINR)} STCL booked · Tax saving: {formatINR(opp.bestCaseSavings)}
          </p>
        </div>
        <Badge variant="gain">Executed</Badge>
      </div>
    );
  }

  return (
    <div className={`tlh-opportunity-card rounded-xl border p-0 overflow-hidden transition-all ${cfg.bg}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority indicator */}
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <div className={`h-2.5 w-2.5 rounded-full ${
              opp.urgency === "critical" ? "bg-rose-400 animate-pulse" :
              opp.urgency === "high" ? "bg-amber-400" : "bg-blue-400"
            }`} />
            <span className="text-[9px] font-bold text-muted-foreground">{opp.priorityScore}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold leading-tight">{opp.holding.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {opp.holding.amc} · {opp.holding.symbol} · {opp.holding.quantity.toLocaleString()} units
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge variant={opp.isSTCL ? "stcl" : "ltcl"}>
                  {opp.isSTCL ? "STCL" : "LTCL"}
                </Badge>
                <Badge variant={cfg.badge} className="text-[9px]">{cfg.label}</Badge>
              </div>
            </div>

            {/* Key metrics */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <MetricBlock
                label="Unrealized Loss"
                value={formatINR(opp.unrealizedLossINR)}
                sub={`-${opp.unrealizedLossPercent.toFixed(1)}%`}
                color="text-rose-400"
              />
              <MetricBlock
                label="Est. Tax Saving"
                value={formatINR(opp.bestCaseSavings)}
                sub={opp.isSTCL ? `@ ${(stcgRate * 100).toFixed(1)}%` : `@ ${(ltcgRate * 100).toFixed(1)}%`}
                color="text-emerald-400"
              />
              <MetricBlock
                label="Net Benefit"
                value={formatINR(opp.netBenefit)}
                sub={`After ${formatINR(opp.transactionCost)} cost`}
                color="text-emerald-400"
              />
              <MetricBlock
                label="Held"
                value={holdingPeriodLabel(opp.holdingDays)}
                sub={opp.daysUntilLTCG > 0 ? `${opp.daysUntilLTCG}d to LTCG` : "LTCG eligible"}
                color="text-blue-400"
              />
            </div>

            {/* Recommendation */}
            <div className="mt-3 rounded-lg bg-background/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">{opp.recommendation}</p>
            </div>

            {/* Math breakdown + Replacement */}
            {expanded && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {/* Formula breakdown */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[9px] font-semibold text-primary mb-2 uppercase tracking-wider">
                    How this saving was calculated
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Unrealized loss</p>
                      <p className="text-rose-400 font-bold">
                        (${opp.holding.currentNAVUSD} − ${opp.holding.avgCostUSD}) × {opp.holding.quantity.toLocaleString()} × ₹83.5
                        = −{formatINR(opp.unrealizedLossINR)}
                      </p>
                      <p className="text-muted-foreground mt-2">This is a {opp.isSTCL ? "STCL" : "LTCL"} because</p>
                      <p className="text-blue-400">
                        {opp.holdingDays} days held {opp.isSTCL ? "≤" : ">"} 730-day threshold
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Tax saving formula</p>
                      <p className="text-emerald-400 font-bold">
                        {formatINR(opp.unrealizedLossINR)} × {opp.isSTCL ? `${(stcgRate * 100).toFixed(2)}% (STCG rate)` : `${(ltcgRate * 100).toFixed(2)}% (LTCG rate)`}
                        {" = "}{formatINR(opp.bestCaseSavings)}
                      </p>
                      <p className="text-muted-foreground mt-2">Why this rate?</p>
                      <p className="text-yellow-400">
                        {opp.isSTCL
                          ? `30% slab × 1.37 surcharge × 1.04 cess = ${(stcgRate * 100).toFixed(2)}%`
                          : `12.5% × 1.15 surcharge cap × 1.04 cess = ${(ltcgRate * 100).toFixed(2)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 border-t border-white/5 pt-2 flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Transaction cost ({(opp.transactionCost / (opp.holding.currentNAVUSD * opp.holding.quantity * 83.5) * 100).toFixed(2)}% of position)</span>
                    <span className="text-rose-400">−{formatINR(opp.transactionCost)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1 font-bold">
                    <span>Net benefit</span>
                    <span className="text-emerald-400">{formatINR(opp.netBenefit)}</span>
                  </div>
                </div>

                {/* GAAR-safe replacement */}
                <div className="rounded-lg bg-background/40 px-3 py-2 border border-dashed border-border">
                  <p className="text-[9px] font-semibold text-blue-400 mb-0.5">Suggested replacement (maintains exposure, GAAR-safe)</p>
                  <p className="text-[10px] text-muted-foreground">{opp.suggestedReplacement}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
          <Button
            variant="loss"
            size="sm"
            className="flex-1"
            onClick={() => onHarvest(opp.holding.id)}
          >
            <Scissors className="h-3.5 w-3.5" />
            Harvest {formatINR(opp.unrealizedLossINR)} Loss
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TLHPage() {
  const [harvested, setHarvested] = useState<Set<string>>(new Set());
  const [showInfo, setShowInfo] = useState(false);

  const opportunities = useMemo(
    () => runTLHScan(INCOME, "old", 2_200_000, 50_000),
    []
  );
  const summary = useMemo(() => getTLHSummary(opportunities), [opportunities]);

  const harvestedOpps = opportunities.filter((o) => harvested.has(o.holding.id));
  const pendingOpps = opportunities.filter((o) => !harvested.has(o.holding.id));

  const totalHarvestedSavings = harvestedOpps.reduce((s, o) => s + o.bestCaseSavings, 0);
  const totalHarvestedLoss = harvestedOpps.reduce((s, o) => s + o.unrealizedLossINR, 0);

  const handleHarvest = (id: string) => {
    setHarvested((prev) => new Set([...prev, id]));
  };

  const handleHarvestAll = () => {
    setHarvested(new Set(opportunities.map((o) => o.holding.id)));
  };

  const stcgRate = getSTCGEffectiveRate(INCOME, "old");
  const ltcgRate = getLTCGEffectiveRate(INCOME, "old");

  // Savings chart data
  const savingsData = opportunities.map((o) => ({
    name: o.holding.symbol.split("-")[0],
    loss: Math.round(o.unrealizedLossINR / 100_000),
    saving: Math.round(o.bestCaseSavings / 100_000),
    type: o.isSTCL ? "STCL" : "LTCL",
  }));

  return (
    <>
      <ProactiveBanner />
      <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            TLH Engine
            <Badge variant="critical">FY-end window</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            India has no wash sale rules — harvest and immediately rebuy the same security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowInfo(!showInfo)}>
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Rescan
          </Button>
          {pendingOpps.length > 0 && (
            <Button variant="loss" size="sm" onClick={handleHarvestAll}>
              <Scissors className="h-3.5 w-3.5 mr-1.5" />
              Harvest All ({pendingOpps.length})
            </Button>
          )}
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <Card className="border-blue-500/20 bg-blue-500/5 animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              <InfoPoint
                title="No wash sale rules in India"
                body="Unlike the US (30-day disallowance), India's IT Act has no wash sale provision. CBDT has not notified any such rule. You can sell at a loss and rebuy the same security immediately."
              />
              <InfoPoint
                title="STCL vs LTCL priority"
                body="STCL can offset both STCG (at 42.74%) AND LTCG (at 14.95%). LTCL can only offset LTCG. Therefore, harvesting STCL is almost always more valuable than waiting to book LTCL."
              />
              <InfoPoint
                title="8-year carry-forward"
                body="Both STCL and LTCL carry forward for 8 assessment years. But ITR must be filed by July 31 to preserve this right. Belated filing = carry-forward forfeited permanently."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-5 gap-3">
        <SummaryKPI label="Losses Available" value={formatINR(summary.totalLossAvailable)} accent="rose" />
        <SummaryKPI label="Total Tax Savings" value={formatINR(summary.totalPotentialSavings)} accent="emerald" />
        <SummaryKPI label="Net Benefit" value={formatINR(summary.totalNetBenefit)} accent="emerald" />
        <SummaryKPI label="STCL Positions" value={`${summary.stclCount} (high value)`} accent="orange" />
        <SummaryKPI label="Harvested so far" value={formatINR(totalHarvestedSavings)} accent="blue" />
      </div>

      {/* Running tally */}
      {harvested.size > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    {harvested.size} position{harvested.size > 1 ? "s" : ""} harvested this session
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatINR(totalHarvestedLoss)} in losses booked · {formatINR(totalHarvestedSavings)} in tax savings
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Effective tax savings rate</p>
                <p className="text-lg font-bold text-emerald-400">
                  {totalHarvestedLoss > 0
                    ? `${((totalHarvestedSavings / totalHarvestedLoss) * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Loss vs Tax Saving per Position (₹L)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={savingsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                  formatter={(v: number, n: string) => [`₹${v}L`, n === "loss" ? "Unrealized Loss" : "Tax Saving"]}
                />
                <Bar dataKey="loss" name="loss" fill="rgba(244,63,94,0.4)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="saving" name="saving" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rate comparison */}
        <Card className="bg-gradient-to-br from-rose-950/20 to-emerald-950/20 border-rose-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Why STCL is 3× More Valuable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-background/50 p-4 space-y-3">
              <RateRow
                label="STCL offsets STCG"
                rate={stcgRate}
                per1L={stcgRate * 100_000}
                color="text-rose-400"
                bar={stcgRate / 0.45}
              />
              <RateRow
                label="STCL offsets LTCG"
                rate={ltcgRate}
                per1L={ltcgRate * 100_000}
                color="text-amber-400"
                bar={ltcgRate / 0.45}
              />
              <RateRow
                label="LTCL offsets LTCG"
                rate={ltcgRate}
                per1L={ltcgRate * 100_000}
                color="text-blue-400"
                bar={ltcgRate / 0.45}
              />
            </div>
            <p className="text-[10px] text-muted-foreground bg-secondary/40 rounded-lg p-2">
              Per ₹1L of harvested loss at {">"}₹5Cr income (old regime).
              STCG surcharge is uncapped (37%), LTCG surcharge is capped at 15%.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Harvest Opportunities · {pendingOpps.length} pending
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse inline-block" /> Critical</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" /> Medium</span>
          </div>
        </div>

        <div className="space-y-3">
          {pendingOpps.map((opp) => (
            <OpportunityCard
              key={opp.holding.id}
              opp={opp}
              onHarvest={handleHarvest}
              harvested={false}
            />
          ))}
          {harvestedOpps.map((opp) => (
            <OpportunityCard
              key={opp.holding.id}
              opp={opp}
              onHarvest={handleHarvest}
              harvested={true}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

function MetricBlock({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg bg-background/40 px-2.5 py-2">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-bold mt-0.5 ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function SummaryKPI({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    rose: "text-rose-400", emerald: "text-emerald-400",
    orange: "text-orange-400", blue: "text-blue-400",
  };
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold mt-1 ${colors[accent] || "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoPoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-semibold text-blue-400">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </div>
  );
}

function RateRow({
  label, rate, per1L, color, bar,
}: { label: string; rate: number; per1L: number; color: string; bar: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${color}`}>{(rate * 100).toFixed(2)}%</span>
          <span className="text-[10px] text-muted-foreground">₹{Math.round(per1L / 1000)}K per ₹1L</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${
          color === "text-rose-400" ? "bg-rose-500" :
          color === "text-amber-400" ? "bg-amber-500" : "bg-blue-500"
        }`} style={{ width: `${bar * 100}%` }} />
      </div>
    </div>
  );
}
