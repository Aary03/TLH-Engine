"use client";

import { useState, useMemo, useCallback } from "react";
import ProactiveBanner from "@/components/layout/ProactiveBanner";
import {
  Globe, TrendingDown, CheckCircle2, Users, Plus, Trash2,
  RefreshCw, Sigma, Info, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { calculateTCS, optimizeFamilyTCS, calculateTCSIRRDrag, type LRSPurpose } from "@/lib/tax-calculations";
import { formatINR, formatUSD } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  fyRemittedL: number; // in ₹L (0–250)
}

const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: "m1", name: "Rajesh Mehta",  relationship: "Self",         fyRemittedL: 92 },
  { id: "m2", name: "Priya Mehta",   relationship: "Spouse",       fyRemittedL: 85 },
  { id: "m3", name: "Vikram Mehta",  relationship: "Son (Adult)",  fyRemittedL: 28 },
];

const PURPOSE_OPTIONS: { value: LRSPurpose; label: string; description: string; tcsAbove: string }[] = [
  { value: "investment",      label: "Investment (GIFT City)", description: "0% up to ₹10L",       tcsAbove: "20%" },
  { value: "education_loan",  label: "Education Loan",         description: "0% — always",          tcsAbove: "0%"  },
  { value: "education_self",  label: "Education (Self)",       description: "0% up to ₹10L",       tcsAbove: "5%"  },
  { value: "medical",         label: "Medical Treatment",      description: "0% up to ₹10L",       tcsAbove: "5%"  },
  { value: "tour_package",    label: "Tour Package",           description: "5% from ₹1",           tcsAbove: "20%" },
  { value: "gift",            label: "Gift / Maintenance",     description: "0% up to ₹10L",       tcsAbove: "20%" },
];

const RELATIONSHIP_OPTIONS = ["Self", "Spouse", "Son (Adult)", "Daughter (Adult)", "Parent", "Sibling"];

// ─── Circular Gauge ───────────────────────────────────────────────────────

function LRSGauge({ member, fyRemittedINR }: { member: FamilyMember; fyRemittedINR: number }) {
  const USD_LIMIT = 250_000;
  const INR_LIMIT = USD_LIMIT * 83.5;
  const lrsPercent = Math.min(100, (fyRemittedINR / INR_LIMIT) * 100);
  const tcsThreshold = 1_000_000;
  const isAboveTCS = fyRemittedINR > tcsThreshold;
  const remainingFreeINR = Math.max(0, tcsThreshold - fyRemittedINR);
  const tcsAlreadyPaid = isAboveTCS
    ? (fyRemittedINR - tcsThreshold) * 0.20
    : 0;

  const color = lrsPercent > 80 ? "#f43f5e" : lrsPercent > 40 ? "#f59e0b" : "#10b981";
  const r = 50; const cx = 68; const cy = 68;
  const circ = Math.PI * r;
  const offset = circ - (lrsPercent / 100) * circ;

  return (
    <Card className={`transition-all ${isAboveTCS ? "border-rose-500/30" : "border-emerald-500/20"}`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          <svg width="136" height="80" viewBox="0 0 136 80">
            <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" strokeLinecap="round" />
            <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
              fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            {/* Threshold marker at ₹10L / USD_LIMIT position */}
            <circle cx={cx - r * Math.cos(Math.PI * (tcsThreshold / INR_LIMIT))}
              cy={cy - r * Math.sin(Math.PI * (tcsThreshold / INR_LIMIT))}
              r="4" fill="#f59e0b" opacity="0.9" />
            <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="17" fontWeight="bold">
              {lrsPercent.toFixed(0)}%
            </text>
            <text x={cx} y={cy + 7} textAnchor="middle" fill="#6b7280" fontSize="8">
              {formatINR(fyRemittedINR)} used
            </text>
          </svg>

          <h3 className="text-sm font-semibold mt-0.5">{member.name}</h3>
          <p className="text-[10px] text-muted-foreground">{member.relationship}</p>

          <div className="mt-3 w-full space-y-1.5 text-[11px]">
            <Row label="LRS limit (USD)" value={formatUSD(USD_LIMIT)} />
            <Row label="LRS remaining" value={formatUSD(USD_LIMIT - fyRemittedINR / 83.5)} color="text-blue-400" />
            <Row
              label="₹10L TCS bucket left"
              value={isAboveTCS ? "Exhausted" : formatINR(remainingFreeINR)}
              color={isAboveTCS ? "text-rose-400" : "text-emerald-400"}
            />
            <Row
              label="Est. TCS deducted"
              value={isAboveTCS ? formatINR(tcsAlreadyPaid) : "₹0"}
              color={isAboveTCS ? "text-rose-400" : "text-emerald-400"}
            />
          </div>

          {isAboveTCS ? (
            <div className="mt-2 w-full rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-1.5">
              <p className="text-[9px] text-rose-400 text-center font-medium">
                ₹{((fyRemittedINR - tcsThreshold) / 100_000).toFixed(1)}L above ₹10L threshold
                → every additional remittance = 20% TCS
              </p>
            </div>
          ) : (
            <div className="mt-2 w-full rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5">
              <p className="text-[9px] text-emerald-400 text-center font-medium">
                {formatINR(remainingFreeINR)} can be remitted at 0% TCS
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function LRSPage() {
  const [members, setMembers] = useState<FamilyMember[]>(DEFAULT_MEMBERS);
  const [plannedAmountL, setPlannedAmountL] = useState([50]);
  const [selectedPurpose, setSelectedPurpose] = useState<LRSPurpose>("investment");
  const [expectedReturn, setExpectedReturn] = useState([12]);
  const [refundMonths, setRefundMonths] = useState([12]);
  const [showFormula, setShowFormula] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const plannedINR = plannedAmountL[0] * 100_000;

  // Convert members to INR for calculations
  const membersForCalc = useMemo(() =>
    members.map((m) => ({ id: m.id, name: m.name, fyRemittedINR: m.fyRemittedL * 100_000 })),
    [members]
  );

  const optimizationResult = useMemo(() =>
    optimizeFamilyTCS(membersForCalc, plannedINR, selectedPurpose),
    [membersForCalc, plannedINR, selectedPurpose]
  );

  // Without split = all through member with highest existing remittance
  const heaviestMember = useMemo(() =>
    [...members].sort((a, b) => b.fyRemittedL - a.fyRemittedL)[0],
    [members]
  );
  const tcsWithoutSplit = useMemo(() =>
    calculateTCS(plannedINR, selectedPurpose, heaviestMember.fyRemittedL * 100_000).tcsAmount,
    [plannedINR, selectedPurpose, heaviestMember]
  );

  // Total TCS paid so far across all members
  const totalTCSPaid = useMemo(() =>
    members.reduce((sum, m) => {
      const fyINR = m.fyRemittedL * 100_000;
      return sum + Math.max(0, (fyINR - 1_000_000) * 0.20);
    }, 0),
    [members]
  );

  const irrDrag = useMemo(() =>
    calculateTCSIRRDrag(totalTCSPaid, refundMonths[0], expectedReturn[0] / 100),
    [totalTCSPaid, refundMonths, expectedReturn]
  );

  // Cross-FY potential: what if members reset to 0 next FY
  const crossFYCapacity = members.length * 1_000_000;

  const updateMemberSlider = useCallback((id: string, value: number) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, fyRemittedL: value } : m));
  }, []);

  const updateMemberName = useCallback((id: string, name: string) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, name } : m));
  }, []);

  const updateMemberRelationship = useCallback((id: string, rel: string) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, relationship: rel } : m));
  }, []);

  const addMember = () => {
    if (members.length >= 6) return;
    setMembers((prev) => [...prev, {
      id: `m${Date.now()}`,
      name: `Member ${prev.length + 1}`,
      relationship: "Parent",
      fyRemittedL: 0,
    }]);
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const resetAll = () => setMembers(DEFAULT_MEMBERS);

  const familyBarData = members.map((m) => ({
    name: m.name.split(" ")[0],
    remitted: m.fyRemittedL,
    tcs: Math.round(Math.max(0, m.fyRemittedL * 100_000 - 1_000_000) * 0.20 / 100_000 * 10) / 10,
    threshold: 10,
  }));

  // IRR formula steps for display
  const annualR = expectedReturn[0] / 100;
  const monthlyR = Math.pow(1 + annualR, 1 / 12) - 1;
  const growthFactor = Math.pow(1 + monthlyR, refundMonths[0]);

  return (
    <>
      <ProactiveBanner />
      <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LRS Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Edit each family member's FY remittance — optimizer recalculates live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reset to defaults
          </Button>
          {members.length < 6 && (
            <Button variant="outline" size="sm" onClick={addMember}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add member
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Family Total Remitted" value={formatINR(members.reduce((s, m) => s + m.fyRemittedL * 100_000, 0))} sub={`${members.length} members · FY 2025-26`} accent="blue" />
        <KPICard label="Total TCS Paid" value={formatINR(totalTCSPaid)} sub="Refundable via ITR" accent="rose" />
        <KPICard label="TCS Opportunity Cost" value={formatINR(irrDrag.opportunityCost)} sub={`@ ${expectedReturn[0]}% return, ${refundMonths[0]}m locked`} accent="amber" />
        <KPICard label="Zero-TCS Capacity Left" value={formatINR(members.reduce((s, m) => s + Math.max(0, 1_000_000 - m.fyRemittedL * 100_000), 0))} sub="Across all members" accent="emerald" />
      </div>

      {/* ── EDITABLE FAMILY MEMBER SLIDERS ── */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Family Members — Edit FY Remittances
            </CardTitle>
            <Badge variant="info">Drag sliders to simulate different scenarios</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => {
            const fyINR = m.fyRemittedL * 100_000;
            const isAbove = fyINR > 1_000_000;
            const remaining = Math.max(0, 1_000_000 - fyINR);
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className={`rounded-xl border p-4 transition-all ${isAbove ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
                <div className="flex items-start gap-4">
                  {/* Name + relationship */}
                  <div className="w-40 flex-shrink-0">
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <input
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          value={m.name}
                          onChange={(e) => updateMemberName(m.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                        <select
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          value={m.relationship}
                          onChange={(e) => updateMemberRelationship(m.id, e.target.value)}
                        >
                          {RELATIONSHIP_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="cursor-pointer" onClick={() => setEditingId(m.id)}>
                        <p className="text-sm font-semibold leading-tight">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.relationship}</p>
                        <p className="text-[9px] text-primary mt-0.5">click to edit ✏️</p>
                      </div>
                    )}
                  </div>

                  {/* Slider */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">FY remitted so far</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isAbove ? "text-rose-400" : "text-emerald-400"}`}>
                          {formatINR(fyINR)}
                        </span>
                        {isAbove ? (
                          <Badge variant="loss" className="text-[8px]">Above ₹10L → 20% TCS</Badge>
                        ) : (
                          <Badge variant="gain" className="text-[8px]">{formatINR(remaining)} free left</Badge>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Slider
                        min={0} max={250} step={1}
                        value={[m.fyRemittedL]}
                        onValueChange={([v]) => updateMemberSlider(m.id, v)}
                      />
                      {/* ₹10L threshold marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-amber-400 rounded-full pointer-events-none"
                        style={{ left: `${(10 / 250) * 100}%` }}
                        title="₹10L TCS threshold"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>₹0 (0% TCS)</span>
                      <span className="text-amber-400">▲ ₹10L threshold</span>
                      <span>₹2.5Cr (max)</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="w-32 flex-shrink-0 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">USD used</span>
                      <span className="font-mono">{formatUSD(fyINR / 83.5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TCS paid</span>
                      <span className={`font-mono font-bold ${isAbove ? "text-rose-400" : "text-emerald-400"}`}>
                        {isAbove ? formatINR((fyINR - 1_000_000) * 0.20) : "₹0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eff. TCS%</span>
                      <span className="font-mono">
                        {fyINR > 0 ? `${(Math.max(0, (fyINR - 1_000_000) * 0.20) / fyINR * 100).toFixed(1)}%` : "0%"}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  {members.length > 1 && (
                    <button onClick={() => removeMember(m.id)} className="mt-1 text-muted-foreground/40 hover:text-rose-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Gauges + Bar chart */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            LRS Utilization Gauges
            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">● = ₹10L TCS threshold</span>
          </p>
          <div className={`grid gap-3 ${members.length <= 2 ? "grid-cols-2" : members.length <= 3 ? "grid-cols-3" : "grid-cols-3"}`}>
            {members.map((m) => (
              <LRSGauge key={m.id} member={m} fyRemittedINR={m.fyRemittedL * 100_000} />
            ))}
          </div>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Remitted vs ₹10L Threshold (₹L)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={familyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                <Tooltip
                  contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                  formatter={(v: number, n: string) => [`₹${v}L`, n === "remitted" ? "FY Remitted" : n === "tcs" ? "TCS Paid" : "₹10L Threshold"]}
                />
                <Bar dataKey="threshold" name="₹10L Threshold" fill="rgba(245,158,11,0.25)" radius={[4,4,0,0]} />
                <Bar dataKey="remitted" name="FY Remitted" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="tcs" name="TCS Paid" fill="#f43f5e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── OPTIMIZER ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              Family TCS Optimizer
            </CardTitle>
            <Badge variant="gain">Live simulation</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Amount slider */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Planned new remittance</label>
                  <span className="text-sm font-bold text-primary">{formatINR(plannedINR)}</span>
                </div>
                <Slider min={5} max={500} step={5} value={plannedAmountL} onValueChange={setPlannedAmountL} />
                <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                  <span>₹5L</span><span>₹5Cr</span>
                </div>
              </div>

              {/* Result boxes */}
              <div className="grid grid-cols-3 gap-3">
                <ResultBox label="Single PAN" value={formatINR(tcsWithoutSplit)}
                  sub={`Via ${heaviestMember.name.split(" ")[0]}`} accent="rose" />
                <ResultBox label="Optimal split" value={formatINR(optimizationResult.totalTCS)}
                  sub={`${members.length} members`}
                  accent={optimizationResult.totalTCS === 0 ? "emerald" : "amber"} />
                <ResultBox label="TCS saved" value={formatINR(Math.max(0, optimizationResult.tcsSavings))}
                  sub={optimizationResult.tcsSavings > 0 ? "✓ Real saving" : "Already optimal"}
                  accent={optimizationResult.tcsSavings > 0 ? "emerald" : "blue"} />
              </div>

              {/* Recommendation */}
              <div className={`rounded-lg border px-3 py-2.5 text-xs font-medium ${
                optimizationResult.tcsSavings > 0
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                  : "border-blue-500/20 bg-blue-500/5 text-blue-400"
              }`}>
                {optimizationResult.recommendation}
              </div>
            </div>

            {/* Purpose selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Purpose of remittance</label>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSE_OPTIONS.map((p) => (
                  <button key={p.value} onClick={() => setSelectedPurpose(p.value)}
                    className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                      selectedPurpose === p.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <p className="text-[10px] font-semibold">{p.label}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[9px] text-muted-foreground">{p.description}</p>
                      <span className={`text-[9px] font-bold ${p.tcsAbove === "0%" ? "text-emerald-400" : p.tcsAbove === "5%" ? "text-amber-400" : "text-rose-400"}`}>
                        {p.tcsAbove} above
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Per-member allocation table */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Optimal allocation per member
            </p>
            <div className="space-y-2">
              {optimizationResult.allocations.map((alloc) => {
                const totalAfter = alloc.fyRemittedSoFar + alloc.allocation;
                const pct = Math.min(100, (totalAfter / 5_000_000) * 100);
                return (
                  <div key={alloc.memberId} className="rounded-lg bg-background/40 p-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-20 text-xs font-medium truncate">{alloc.memberName.split(" ")[0]}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-muted-foreground">So far: {formatINR(alloc.fyRemittedSoFar)}</span>
                          <span className="text-primary">+ {formatINR(alloc.allocation)} planned</span>
                          <span className={alloc.tcs > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                            TCS: {alloc.tcs > 0 ? formatINR(alloc.tcs) : "₹0 ✓"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${totalAfter > 1_000_000 ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── OPPORTUNITY COST FORMULA PANEL ── */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sigma className="h-4 w-4 text-amber-400" />
              TCS Opportunity Cost — Full Formula Derivation
            </CardTitle>
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {showFormula ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showFormula ? "Collapse" : "Expand"}
            </button>
          </div>
        </CardHeader>
        {showFormula && (
          <CardContent className="space-y-5 animate-fade-in">
            {/* Adjustable inputs */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expected portfolio return (p.a.)</label>
                    <span className="text-sm font-bold text-emerald-400">{expectedReturn[0]}%</span>
                  </div>
                  <Slider min={6} max={25} step={1} value={expectedReturn} onValueChange={setExpectedReturn} />
                  <div className="flex justify-between mt-1 text-[9px] text-muted-foreground"><span>6%</span><span>25%</span></div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Months until ITR refund</label>
                    <span className="text-sm font-bold text-amber-400">{refundMonths[0]}m</span>
                  </div>
                  <Slider min={3} max={24} step={1} value={refundMonths} onValueChange={setRefundMonths} />
                  <div className="flex justify-between mt-1 text-[9px] text-muted-foreground"><span>3m</span><span>24m</span></div>
                </div>
              </div>

              {/* Formula steps */}
              <div className="rounded-xl border border-amber-500/20 bg-background/50 p-4 space-y-2.5">
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  Step-by-step derivation
                </p>

                <FormulaRow step="1" label="TCS locked with government" formula="Sum of TCS deducted by all banks" result={formatINR(totalTCSPaid)} color="text-rose-400" />
                <FormulaRow step="2" label="Convert annual return → monthly"
                  formula={`(1 + ${expectedReturn[0]}%)^(1/12) − 1`}
                  result={`= ${(monthlyR * 100).toFixed(4)}% per month`}
                  color="text-blue-400"
                />
                <FormulaRow step="3" label="Compound over lock-in period"
                  formula={`(1 + ${(monthlyR * 100).toFixed(4)}%)^${refundMonths[0]} months`}
                  result={`= ${growthFactor.toFixed(4)}× growth factor`}
                  color="text-blue-400"
                />
                <FormulaRow step="4" label="Opportunity cost"
                  formula={`${formatINR(totalTCSPaid)} × (${growthFactor.toFixed(4)} − 1)`}
                  result={formatINR(irrDrag.opportunityCost)}
                  color="text-amber-400"
                  bold
                />
                <FormulaRow step="5" label="Expressed as basis points"
                  formula={`(${formatINR(irrDrag.opportunityCost)} ÷ ${formatINR(totalTCSPaid)}) × 10,000`}
                  result={`${irrDrag.effectiveCostBps} bps of drag`}
                  color="text-amber-400"
                />
              </div>
            </div>

            {/* Comparison table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Scenario</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">TCS Locked</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Months Locked</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Opportunity Cost</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Drag (bps)</th>
                  </tr>
                </thead>
                <tbody>
                  {[3, 6, 9, 12, 18, 24].map((m) => {
                    const drag = calculateTCSIRRDrag(totalTCSPaid, m, expectedReturn[0] / 100);
                    const isSelected = m === refundMonths[0];
                    return (
                      <tr
                        key={m}
                        className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? "bg-amber-500/10" : "hover:bg-secondary/30"}`}
                        onClick={() => setRefundMonths([m])}
                      >
                        <td className="px-4 py-2.5 font-medium">{m} months{isSelected ? " ← selected" : ""}</td>
                        <td className="px-4 py-2.5 text-right text-rose-400">{formatINR(totalTCSPaid)}</td>
                        <td className="px-4 py-2.5 text-right">{m}</td>
                        <td className="px-4 py-2.5 text-right text-amber-400 font-bold">{formatINR(drag.opportunityCost)}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{drag.effectiveCostBps}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mitigation tips */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: "Offset against advance tax", body: "Apply TCS credit against advance tax installments (Jun 15, Sep 15, Dec 15, Mar 15) to reduce lock-in from 12m to 3–6m." },
                { title: "Cross-FY remittance split", body: `${formatINR(crossFYCapacity)} can be remitted at 0% TCS (₹10L per person × ${members.length} members) if timed across the FY boundary.` },
                { title: "Family splitting saves upfront", body: `Every ₹1L kept below the ₹10L threshold per PAN = ₹20,000 TCS saved = no opportunity cost on that ₹20K.` },
              ].map((t) => (
                <div key={t.title} className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold text-blue-400">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Row({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400", rose: "text-rose-400",
    amber: "text-amber-400", emerald: "text-emerald-400",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${colors[accent]}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ResultBox({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  const colors: Record<string, string> = {
    rose: "text-rose-400", emerald: "text-emerald-400",
    amber: "text-amber-400", blue: "text-blue-400",
  };
  return (
    <div className="rounded-lg bg-secondary/30 p-3 text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold mt-1 ${colors[accent]}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function FormulaRow({
  step, label, formula, result, color, bold,
}: { step: string; label: string; formula: string; result: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground">
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold text-foreground">{label}</p>
          <p className={`text-[10px] font-mono flex-shrink-0 ${color} ${bold ? "text-sm font-bold" : ""}`}>{result}</p>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{formula}</p>
      </div>
    </div>
  );
}
