"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scissors,
  Globe,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  HOLDINGS,
  FAMILY_MEMBERS,
  LRS_SUMMARY,
  COMPLIANCE_DEADLINES,
  getUnrealizedPnL,
  getPortfolioSummary,
} from "@/lib/mock-data";
import { runTLHScan, getTLHSummary } from "@/lib/tlh-engine";
import { formatINR, formatUSD, formatPercent, holdingPeriodLabel } from "@/lib/utils";
import { getHoldingDays } from "@/lib/mock-data";
import { getLTCGEffectiveRate, getSTCGEffectiveRate } from "@/lib/tax-calculations";
import Link from "next/link";

const INCOME = 60_000_000; // ₹6Cr (ultra-HNI)

// ─── Simulated portfolio history ──────────────────────────────────────────
const PORTFOLIO_HISTORY = [
  { month: "Apr", value: 3.12 },
  { month: "May", value: 3.28 },
  { month: "Jun", value: 3.45 },
  { month: "Jul", value: 3.61 },
  { month: "Aug", value: 3.52 },
  { month: "Sep", value: 3.74 },
  { month: "Oct", value: 3.88 },
  { month: "Nov", value: 3.71 },
  { month: "Dec", value: 3.95 },
  { month: "Jan", value: 4.12 },
  { month: "Feb", value: 3.98 },
  { month: "Mar", value: 4.19 },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#84cc16"];

export default function Dashboard() {
  const summary = useMemo(() => getPortfolioSummary(), []);
  const tlhOpportunities = useMemo(() => runTLHScan(INCOME, "old", 2_200_000), []);
  const tlhSummary = useMemo(() => getTLHSummary(tlhOpportunities), [tlhOpportunities]);

  const totalTCS = LRS_SUMMARY.familyTotalTCS;
  const stcgRate = getSTCGEffectiveRate(INCOME, "old");
  const ltcgRate = getLTCGEffectiveRate(INCOME, "old");

  // Holdings for pie chart
  const holdingsForPie = HOLDINGS.map((h) => ({
    name: h.symbol,
    value: Math.round((h.currentNAVUSD * h.quantity * 83.5) / 100_000) / 10, // ₹L
  }));

  // Gain/loss bar data
  const gainLossData = HOLDINGS.map((h) => {
    const pnl = getUnrealizedPnL(h);
    const days = getHoldingDays(h.purchaseDate);
    return {
      name: h.symbol.replace("-IFSC", "").replace("-", " "),
      pnl: Math.round(pnl.pnlINR / 100_000),
      type: pnl.isLoss ? "loss" : "gain",
      isLTCG: days > 730,
    };
  });

  const criticalDeadlines = COMPLIANCE_DEADLINES.filter(
    (d) => d.urgency === "critical" || d.urgency === "high"
  ).slice(0, 3);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rajesh Mehta Family · FY 2025-26 · GIFT City IFSC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">₹1 = $0.01198 (₹83.50)</Badge>
          <Badge variant="warning">20 days to FY end</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Portfolio Value"
          value={formatINR(summary.totalValueINR)}
          subValue={formatUSD(summary.totalValueINR / 83.5)}
          change={formatPercent(summary.totalPnLPercent)}
          isPositive={summary.totalPnLPercent >= 0}
          icon={<TrendingUp className="h-4 w-4" />}
          description="7 GIFT City IFSC holdings"
        />
        <KPICard
          title="Unrealized P&L"
          value={formatINR(summary.totalPnLINR)}
          subValue={`${formatINR(summary.totalGainINR)} gains`}
          change={`${formatINR(Math.abs(summary.totalLossINR))} losses`}
          isPositive={summary.totalPnLINR >= 0}
          icon={summary.totalPnLINR >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          description="Across all IFSC positions"
        />
        <KPICard
          title="TLH Savings Available"
          value={formatINR(tlhSummary.totalPotentialSavings)}
          subValue={`${tlhSummary.opportunityCount} opportunities`}
          change={`${tlhSummary.stclCount} STCL @ ${(stcgRate * 100).toFixed(1)}%`}
          isPositive={false}
          isOpportunity
          icon={<Scissors className="h-4 w-4" />}
          description="If all losses harvested now"
          href="/tlh"
        />
        <KPICard
          title="Family TCS Paid"
          value={formatINR(totalTCS)}
          subValue={`₹${(LRS_SUMMARY.familyTotalRemittedINR / 10_000_000).toFixed(2)}Cr remitted`}
          change="Refundable via ITR"
          isPositive={false}
          isWarning
          icon={<Globe className="h-4 w-4" />}
          description="3 family members · FY 2025-26"
          href="/lrs"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Portfolio value over time */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Portfolio Value (₹Cr)</CardTitle>
              <Badge variant="gain">+34.3% YTD</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={PORTFOLIO_HISTORY}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}Cr`} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                  formatter={(v: number) => [`₹${v}Cr`, "Portfolio"]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portfolioGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Holdings allocation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Allocation by Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={holdingsForPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                  {holdingsForPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                  formatter={(v: number) => [`₹${v}L`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {HOLDINGS.slice(0, 6).map((h, i) => (
                <div key={h.id} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="truncate text-[10px] text-muted-foreground">{h.symbol.split("-")[0]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table + Gain/Loss Chart */}
      <div className="grid grid-cols-3 gap-4">
        {/* Gain/Loss Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Gain / Loss by Fund (₹L)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gainLossData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                  formatter={(v: number) => [`₹${v}L`, "P&L"]}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {gainLossData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Holdings Table */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Holdings</CardTitle>
              <span className="text-[10px] text-muted-foreground">All GIFT City IFSC</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">Fund</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">NAV (USD)</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Value</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">P&L</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Holding</th>
                    <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLDINGS.map((h) => {
                    const pnl = getUnrealizedPnL(h);
                    const days = getHoldingDays(h.purchaseDate);
                    const isLTCG = days > 730;
                    const valueINR = h.currentNAVUSD * h.quantity * 83.5;
                    const daysToLTCG = Math.max(0, 730 - days);
                    return (
                      <tr key={h.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{h.amc}</p>
                          <p className="text-muted-foreground text-[10px]">{h.symbol}</p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-mono">${h.currentNAVUSD}</p>
                          <p className="text-[10px] text-muted-foreground">
                            avg ${h.avgCostUSD}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{formatINR(valueINR)}</td>
                        <td className="px-3 py-3 text-right">
                          <p className={pnl.isLoss ? "text-loss font-medium" : "text-gain font-medium"}>
                            {pnl.isLoss ? "-" : "+"}{formatINR(Math.abs(pnl.pnlINR))}
                          </p>
                          <p className={`text-[10px] ${pnl.isLoss ? "text-loss/70" : "text-gain/70"}`}>
                            {formatPercent(pnl.pnlPercent)}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <p className="font-mono text-muted-foreground">{holdingPeriodLabel(days)}</p>
                          {!isLTCG && daysToLTCG <= 120 && (
                            <p className="text-[10px] text-amber-400">{daysToLTCG}d to LTCG</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant={isLTCG ? "ltcg" : pnl.isLoss ? "stcl" : "stcg"} className="text-[9px]">
                            {isLTCG ? "LTCG" : pnl.isLoss ? "STCL" : "STCG"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: TLH summary + Deadlines */}
      <div className="grid grid-cols-2 gap-4">
        {/* TLH Summary */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Scissors className="h-4 w-4 text-rose-400" />
                TLH Opportunities
              </CardTitle>
              <Link href="/tlh">
                <Button size="sm" variant="loss">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <StatBlock label="Losses Available" value={formatINR(tlhSummary.totalLossAvailable)} accent="loss" />
              <StatBlock label="Tax Savings" value={formatINR(tlhSummary.totalPotentialSavings)} accent="loss" />
              <StatBlock label="STCL Count" value={`${tlhSummary.stclCount} positions`} accent="warning" />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground bg-secondary/50 rounded-lg p-2">
              <span className="text-amber-400 font-semibold">India has no wash sale rules.</span>{" "}
              Sell at a loss and immediately rebuy the same security. New cost basis = rebuy price.
              STCL harvested now saves up to <span className="text-rose-400 font-semibold">{(stcgRate * 100).toFixed(2)}%</span> in taxes.
            </p>
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Compliance Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalDeadlines.map((d) => {
                const today = new Date("2026-03-11");
                const daysLeft = Math.ceil((d.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={d.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      d.urgency === "critical" ? "bg-rose-400 animate-pulse" :
                      d.urgency === "high" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{d.label}</p>
                        <span className={`text-[10px] font-semibold ${
                          daysLeft <= 20 ? "text-rose-400" : daysLeft <= 60 ? "text-amber-400" : "text-muted-foreground"
                        }`}>
                          {daysLeft > 0 ? `${daysLeft}d` : "OVERDUE"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax rate reference */}
      <Card className="bg-gradient-to-r from-blue-950/30 to-purple-950/30 border-blue-900/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-semibold text-blue-400">Effective Tax Rates — Ultra HNI (above ₹5Cr income)</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <TaxRateBlock label="STCG Rate" value={`${(stcgRate * 100).toFixed(2)}%`} sub="Slab 30% + 37% surcharge + 4% cess" color="text-yellow-400" />
            <TaxRateBlock label="LTCG Rate" value={`${(ltcgRate * 100).toFixed(2)}%`} sub="12.5% flat + 15% surcharge cap + 4% cess" color="text-emerald-400" />
            <TaxRateBlock label="STCL Value" value="3× LTCG" sub="Can offset STCG AND LTCG — broadest offset" color="text-rose-400" />
            <TaxRateBlock label="IFSC Advantage" value="Zero STT/GST" sub="No stamp duty, no STT — cost advantage" color="text-blue-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function KPICard({
  title, value, subValue, change, isPositive, isOpportunity, isWarning, icon, description, href,
}: {
  title: string; value: string; subValue: string; change: string;
  isPositive: boolean; isOpportunity?: boolean; isWarning?: boolean;
  icon: React.ReactNode; description: string; href?: string;
}) {
  const content = (
    <Card className={`hover:border-primary/30 transition-colors cursor-default ${
      isOpportunity ? "border-rose-500/20" : isWarning ? "border-amber-500/20" : ""
    }`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className={`p-1.5 rounded-md ${
            isOpportunity ? "bg-rose-500/10 text-rose-400" :
            isWarning ? "bg-amber-500/10 text-amber-400" :
            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          }`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] font-medium ${
            isOpportunity ? "text-rose-400" : isWarning ? "text-amber-400" :
            isPositive ? "text-emerald-400" : "text-rose-400"
          }`}>
            {change}
          </span>
          <span className="text-[9px] text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent: "gain" | "loss" | "warning" }) {
  const color = accent === "gain" ? "text-gain" : accent === "loss" ? "text-loss" : "text-amber-400";
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function TaxRateBlock({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg bg-background/40 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
