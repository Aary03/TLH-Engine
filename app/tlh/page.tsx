"use client";

import { useState, useMemo } from "react";
import ProactiveBanner from "@/components/layout/ProactiveBanner";
import {
  Scissors, CheckCircle2, RefreshCw, Info, ChevronDown,
  ArrowRight, ShieldCheck, Globe2, AlertTriangle, Undo2, SlidersHorizontal, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Term, InfoTip } from "@/components/ui/tooltip";
import { runTLHScan, getTLHSummary, type TLHOpportunity } from "@/lib/tlh-engine";
import { formatINR, holdingPeriodLabel } from "@/lib/utils";
import {
  getSTCGEffectiveRate, getLTCGEffectiveRate, bracketToIncome,
} from "@/lib/tax-calculations";
import { useProfile } from "@/components/profile/ProfileContext";
import { BRACKET_LABELS } from "@/lib/user-profile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

/* ── Valura light design tokens (matches homepage) ── */
const C = {
  navy: "#00111B",
  green: "#05A049",
  greenBg: "#EDFAF3",
  greenBorder: "#B4E3C8",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  amber: "#B8913A",
  blue: "#2B4A8A",
  border: "#E5E7EB",
  muted: "#6b7280",
  page: "#FFFFFC",
};

/* ── Plain-English definitions surfaced as tooltips ── */
const T = {
  stcl: "Short-Term Capital Loss — a loss on something held ≤24 months. The most valuable kind to harvest, because it can offset BOTH short- and long-term gains.",
  ltcl: "Long-Term Capital Loss — a loss on something held >24 months. It can only offset long-term gains.",
  stcg: "Short-Term Capital Gain — profit on an asset held ≤24 months, taxed at your income-slab rate (plus surcharge & cess).",
  ltcg: "Long-Term Capital Gain — profit on an asset held >24 months. On overseas/IFSC funds: 12.5% + surcharge (capped at 15%) + 4% cess.",
  washSale: "A US rule that cancels your tax loss if you rebuy the same security within 30 days. India has NO such rule — but it DOES apply to US-resident investors.",
  gaar: "General Anti-Avoidance Rule — India can deny a tax benefit if a trade has no purpose other than dodging tax. Buying a similar-but-not-identical replacement fund keeps you safe.",
  carry: "Unused capital losses carry forward up to 8 years to offset future gains — but only if you file your ITR by the due date (31 July).",
  cess: "A 4% Health & Education cess added on top of your tax.",
  surcharge: "An extra percentage of tax for high incomes. For capital gains it is capped at 15%.",
  nav: "Net Asset Value — the per-unit price of a fund.",
  sec10: "Section 10(4D)/10(4F) — exempts a non-resident's gains on IFSC fund units & specified securities from Indian tax, when settled in foreign currency.",
};

const URGENCY = {
  critical: { label: "Act now", dot: C.red, text: C.red, bg: C.redBg, border: C.redBorder },
  high: { label: "High priority", dot: C.amber, text: C.amber, bg: "#FFFBF0", border: "#E8C97A" },
  medium: { label: "Medium", dot: C.blue, text: C.blue, bg: "#EFF4FF", border: "#C7D7F8" },
  low: { label: "Low", dot: C.muted, text: C.muted, bg: "#F9FAFB", border: C.border },
} as const;

/* Home-country tax guidance for non-resident (global) investors */
const HOME_COUNTRIES: Record<string, {
  label: string; flag: string; cgt: boolean; washSale: boolean; note: string;
}> = {
  us: { label: "United States", flag: "🇺🇸", cgt: true, washSale: true,
    note: "The US taxes your worldwide capital gains. Harvesting helps — but the 30-day wash-sale rule applies, so you must wait 31 days or switch to a not-substantially-identical fund." },
  uk: { label: "United Kingdom", flag: "🇬🇧", cgt: true, washSale: true,
    note: "UK CGT applies, and the 30-day 'bed & breakfasting' rule mirrors the US wash-sale. Harvest into a different fund to keep the loss." },
  uae: { label: "UAE", flag: "🇦🇪", cgt: false, washSale: false,
    note: "The UAE has no personal capital gains tax. Harvesting losses gives you no tax benefit — your GIFT City gains are already tax-free on both ends." },
  sg: { label: "Singapore", flag: "🇸🇬", cgt: false, washSale: false,
    note: "Singapore does not tax personal capital gains. There is no harvesting benefit to capture." },
  other: { label: "Other / not sure", flag: "🌍", cgt: true, washSale: false,
    note: "Whether harvesting helps depends on your country of tax residence. Check whether it taxes capital gains and whether it has a wash-sale-style rule before you act." },
};

export default function TLHPage() {
  const { profile } = useProfile();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen" style={{ background: C.page }}>
        <ProactiveBanner />
        {profile.investorType === "resident"
          ? <ResidentEngine />
          : <NonResidentView />}
      </div>
    </TooltipProvider>
  );
}

/* ════════════════════════════════════════════════════════════════════
   RESIDENT INDIAN — full TLH engine (gains ARE taxable in India)
═══════════════════════════════════════════════════════════════════════ */
function ResidentEngine() {
  const { profile, setShowPanel } = useProfile();
  const income = bracketToIncome(profile.incomeBracket as any);
  const regime = profile.taxRegime;

  // Gains already booked this year — materially changes best-case savings.
  const [bookedSTCG, setBookedSTCG] = useState(2_200_000);
  const [planned, setPlanned] = useState<Set<string>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const [scanning, setScanning] = useState(false);

  const opportunities = useMemo(
    () => runTLHScan(income, regime, bookedSTCG, 50_000),
    [income, regime, bookedSTCG, scanKey]
  );
  const summary = useMemo(() => getTLHSummary(opportunities), [opportunities]);

  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);

  const plannedOpps = opportunities.filter((o) => planned.has(o.holding.id));
  const pendingOpps = opportunities.filter((o) => !planned.has(o.holding.id));
  const plannedSavings = plannedOpps.reduce((s, o) => s + o.bestCaseSavings, 0);
  const plannedLoss = plannedOpps.reduce((s, o) => s + o.unrealizedLossINR, 0);

  const togglePlan = (id: string) =>
    setPlanned((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const planAll = () => {
    setPlanned(new Set(opportunities.map((o) => o.holding.id)));
    setConfirmAll(false);
  };
  const resetPlan = () => setPlanned(new Set());
  const rescan = () => {
    setScanning(true);
    setScanKey((k) => k + 1);
    setTimeout(() => setScanning(false), 500);
  };

  const savingsData = opportunities.map((o) => ({
    name: o.holding.symbol.split("-")[0],
    loss: Math.round(o.unrealizedLossINR / 100_000),
    saving: Math.round(o.bestCaseSavings / 100_000),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: C.navy }}>
              Tax-Loss Harvesting
            </h1>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: C.redBg, color: C.red }}>
              FY-end window
            </span>
          </div>
          <p className="mt-1 text-sm max-w-xl" style={{ color: C.muted }}>
            Turn paper losses into real tax savings before 31 March. India has{" "}
            <Term hint={T.washSale}>no wash-sale rule</Term> — you can sell at a loss and rebuy
            immediately (keep it <Term hint={T.gaar}>GAAR</Term>-safe with a similar fund).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInfo((v) => !v)}>
            <Info className="h-3.5 w-3.5 mr-1.5" /> How it works
          </Button>
          <Button variant="outline" size="sm" onClick={rescan} disabled={scanning}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : "Rescan"}
          </Button>
        </div>
      </div>

      {/* ── Personalization chip ── */}
      <button
        onClick={() => setShowPanel(true)}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all hover:shadow-sm"
        style={{ background: "#fff", borderColor: C.border }}
      >
        <p className="text-xs sm:text-sm" style={{ color: C.navy }}>
          Calculated for{" "}
          <span className="font-bold">Resident Indian</span> ·{" "}
          <span className="font-semibold">{BRACKET_LABELS[profile.incomeBracket]}</span> ·{" "}
          <span className="font-semibold">{regime === "new" ? "New regime" : "Old regime"}</span>
        </p>
        <span className="flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"
          style={{ color: C.green }}>
          <SlidersHorizontal className="h-3.5 w-3.5" /> Edit
        </span>
      </button>

      {/* ── Simulation banner ── */}
      <div className="flex items-start gap-2 rounded-xl px-4 py-2.5"
        style={{ background: "#F0FAF5", border: `1px solid ${C.greenBorder}` }}>
        <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "#256" }}>
          <span className="font-semibold" style={{ color: C.navy }}>This is a planning simulation.</span>{" "}
          Nothing is sold and no orders are placed. Build a harvest plan here, then execute with your broker or
          Valura before 31 March.
        </p>
      </div>

      {/* ── Info panel ── */}
      {showInfo && (
        <Card className="animate-fade-in" style={{ background: C.greenBg, borderColor: C.greenBorder }}>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 text-xs">
              <InfoPoint title="No wash-sale rule in India"
                body={<>Unlike the US (30-day disallowance), India has no <Term hint={T.washSale}>wash-sale</Term> provision. You can sell at a loss and rebuy the same security immediately to keep your exposure.</>} />
              <InfoPoint title="STCL beats LTCL"
                body={<><Term hint={T.stcl}>STCL</Term> offsets both <Term hint={T.stcg}>STCG</Term> (up to ~42.7%) and <Term hint={T.ltcg}>LTCG</Term> (~15%). <Term hint={T.ltcl}>LTCL</Term> only offsets LTCG — so booking STCL is usually worth more.</>} />
              <InfoPoint title="8-year carry-forward"
                body={<>Both losses <Term hint={T.carry}>carry forward 8 years</Term> — but your ITR must be filed by 31 July to keep that right. Miss it and the carry-forward is lost permanently.</>} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ── */}
      {opportunities.length === 0 ? (
        <Card style={{ borderColor: C.border }}>
          <CardContent className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.greenBg }}>
              <CheckCircle2 className="h-6 w-6" style={{ color: C.green }} />
            </div>
            <p className="text-base font-bold" style={{ color: C.navy }}>No losses to harvest right now</p>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>
              None of your holdings is far enough underwater to clear the ₹50,000 minimum. We'll flag new
              opportunities as markets move — check back near FY-end.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── KPI summary (responsive) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPI label="Harvestable losses" hint="Total paper losses you can book across all flagged positions."
              value={formatINR(summary.totalLossAvailable)} color={C.red} />
            <KPI label="Potential tax saving" hint="Estimated tax reduced if you harvest every flagged position."
              value={formatINR(summary.totalPotentialSavings)} color={C.green} />
            <KPI label="Net benefit" hint="Tax saving minus estimated transaction costs."
              value={formatINR(summary.totalNetBenefit)} color={C.green} />
            <KPI label="STCL positions" hint={T.stcl}
              value={`${summary.stclCount} high-value`} color={C.amber} />
          </div>

          {/* ── Booked-gains input (personalization) ── */}
          <Card style={{ borderColor: C.border }}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold" style={{ color: C.navy }}>
                  Gains already booked this year
                </p>
                <InfoTip hint="Realized short-term gains you've already taken this financial year. Harvested STCL offsets these first — at the highest rate — so this drives your best-case saving." />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="range" min={0} max={10_000_000} step={100_000}
                  value={bookedSTCG}
                  onChange={(e) => setBookedSTCG(Number(e.target.value))}
                  className="flex-1 accent-[#05A049]"
                />
                <span className="text-sm font-bold tabular-nums w-20 text-right" style={{ color: C.navy }}>
                  {formatINR(bookedSTCG)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── Running plan tally ── */}
          {planned.size > 0 && (
            <Card className="animate-fade-in" style={{ background: C.greenBg, borderColor: C.greenBorder }}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: C.green }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.navy }}>
                      {planned.size} position{planned.size > 1 ? "s" : ""} in your harvest plan
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      {formatINR(plannedLoss)} losses booked · {formatINR(plannedSavings)} estimated tax saving
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px]" style={{ color: C.muted }}>Effective saving rate</p>
                    <p className="text-lg font-extrabold" style={{ color: C.green }}>
                      {plannedLoss > 0 ? `${((plannedSavings / plannedLoss) * 100).toFixed(1)}%` : "—"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetPlan}>
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Charts (responsive) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card style={{ borderColor: C.border }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold" style={{ color: C.navy }}>
                  Loss vs tax saving per position (₹ Lakh)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={savingsData} layout="vertical" margin={{ left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F2" horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#374151", fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                    <RTooltip
                      contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.navy, fontSize: 12 }}
                      formatter={(v: number, n: string) => [`₹${v}L`, n === "loss" ? "Unrealized loss" : "Tax saving"]}
                    />
                    <Bar dataKey="loss" name="loss" fill="#FCA5A5" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="saving" name="saving" fill={C.green} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card style={{ borderColor: C.border }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.navy }}>
                  Why <Term hint={T.stcl}>STCL</Term> is worth ~3× more
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RateRow label={<>STCL offsets <Term hint={T.stcg}>STCG</Term></>} rate={stcgRate} color={C.red} bar={stcgRate / 0.45} />
                <RateRow label={<>STCL offsets <Term hint={T.ltcg}>LTCG</Term></>} rate={ltcgRate} color={C.amber} bar={ltcgRate / 0.45} />
                <RateRow label={<>LTCL offsets LTCG</>} rate={ltcgRate} color={C.blue} bar={ltcgRate / 0.45} />
                <p className="text-[11px] leading-relaxed rounded-lg p-2.5" style={{ background: "#F9FAFB", color: C.muted }}>
                  Per ₹1L of harvested loss at your income level. STCG <Term hint={T.surcharge}>surcharge</Term> is
                  uncapped; LTCG surcharge is capped at 15% — which is exactly why short-term losses are the prize.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Opportunity list ── */}
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: C.navy }}>
                Harvest opportunities · {pendingOpps.length} to plan
              </h2>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: C.muted }}>
                <Legend dot={C.red} label="Act now" />
                <Legend dot={C.amber} label="High" />
                <Legend dot={C.blue} label="Medium" />
              </div>
            </div>

            {/* Plan-all confirm */}
            {pendingOpps.length > 0 && (
              <div className="mb-3">
                {confirmAll ? (
                  <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
                    style={{ background: C.redBg, borderColor: C.redBorder }}>
                    <p className="text-xs flex-1" style={{ color: C.navy }}>
                      Add all {pendingOpps.length} positions to your harvest plan?
                    </p>
                    <Button size="sm" className="text-white hover:opacity-90" style={{ background: C.red }} onClick={planAll}>Yes, plan all</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAll(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmAll(true)}>
                    <Scissors className="h-3.5 w-3.5 mr-1.5" /> Plan all {pendingOpps.length}
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-3">
              {pendingOpps.map((opp) => (
                <OpportunityCard key={opp.holding.id} opp={opp} onToggle={togglePlan} planned={false}
                  stcgRate={stcgRate} ltcgRate={ltcgRate} />
              ))}
              {plannedOpps.map((opp) => (
                <OpportunityCard key={opp.holding.id} opp={opp} onToggle={togglePlan} planned={true}
                  stcgRate={stcgRate} ltcgRate={ltcgRate} />
              ))}
            </div>
          </div>

          <Glossary />
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   NON-RESIDENT (NRI / FOREIGN) — Indian TLH does not apply
═══════════════════════════════════════════════════════════════════════ */
function NonResidentView() {
  const { profile, setShowPanel } = useProfile();
  const [country, setCountry] = useState<string>(profile.investorType === "foreign" ? "us" : "uae");
  const [previewEngine, setPreviewEngine] = useState(false);
  const c = HOME_COUNTRIES[country];

  if (previewEngine) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <button onClick={() => setPreviewEngine(false)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.green }}>
          <Undo2 className="h-4 w-4" /> Back to your view
        </button>
        <div className="rounded-xl px-4 py-2.5 mb-4 text-[11px]"
          style={{ background: "#FFFBF0", border: "1px solid #E8C97A", color: "#7a5c14" }}>
          Preview only — these Indian tax numbers are for a <b>resident</b> investor and do not reflect your situation.
        </div>
        <ResidentEngine />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "var(--font-bricolage)", color: C.navy }}>
                Tax-Loss Harvesting
              </h1>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: C.greenBg, color: C.green }}>
                {profile.investorType === "nri" ? "NRI" : "Global investor"}
              </span>
            </div>
            <p className="mt-1 text-sm max-w-xl" style={{ color: C.muted }}>
              Good news first: through GIFT City, your gains are likely already tax-free in India.
            </p>
          </div>
          <button onClick={() => setShowPanel(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold flex-shrink-0" style={{ color: C.green }}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Not you? Edit profile
          </button>
        </div>

        {/* The headline exemption */}
        <Card style={{ background: C.greenBg, borderColor: C.greenBorder }}>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(5,160,73,0.15)" }}>
                <ShieldCheck className="h-5 w-5" style={{ color: C.green }} />
              </div>
              <div>
                <p className="text-base font-extrabold" style={{ color: C.navy }}>
                  Your IFSC gains are exempt from Indian tax
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#33514a" }}>
                  As a non-resident investing through a GIFT City IFSC fund, your capital gains on fund units and
                  specified securities are exempt under{" "}
                  <Term hint={T.sec10}>Section 10(4D)/10(4F)</Term> — regardless of holding period — when settled in
                  foreign currency. Because there's no Indian tax on the gain,{" "}
                  <span className="font-semibold" style={{ color: C.navy }}>booking a loss saves you nothing on the Indian side.</span>{" "}
                  So Indian-style tax-loss harvesting simply doesn't apply to you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where TLH still helps — home country */}
        <Card style={{ borderColor: C.border }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: C.navy }}>
              <Globe2 className="h-4 w-4" style={{ color: C.green }} />
              Where harvesting still matters: your country of tax residence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(HOME_COUNTRIES).map(([key, v]) => (
                <button key={key} onClick={() => setCountry(key)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={country === key
                    ? { background: C.navy, color: "#fff", borderColor: C.navy }
                    : { background: "#fff", color: C.navy, borderColor: C.border }}>
                  {v.flag} {v.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: "#F9FAFB" }}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: C.navy }}>{c.flag} {c.label}</span>
                <Badge variant={c.cgt ? "warning" : "gain"}>
                  {c.cgt ? "Taxes capital gains" : "No capital gains tax"}
                </Badge>
                {c.washSale && (
                  <Badge variant="loss">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Wash-sale rule applies
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{c.note}</p>
              {c.washSale && (
                <p className="mt-2 text-[11px] leading-relaxed rounded-lg p-2.5"
                  style={{ background: C.redBg, color: "#7a2020" }}>
                  ⚠️ Important: the page's "rebuy immediately" advice is <b>India-only</b>. In {c.label}, rebuying the
                  same fund within 30 days <Term hint={T.washSale}>cancels the loss</Term>. Wait 31 days or buy a
                  similar-but-different fund.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What you SHOULD focus on */}
        <Card style={{ borderColor: C.border }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold" style={{ color: C.navy }}>
              What actually moves the needle for you
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {[
                "GIFT City removes US estate-tax exposure — IFSC fund units aren't US-situs assets ($0 vs up to 40%).",
                "No Indian capital gains, no STT, no Indian dividend tax on the IFSC route.",
                "Your only harvesting decision lives in your home country — and only if it taxes capital gains.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => setPreviewEngine(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.green }}>
              Curious? Preview the resident-investor engine <ArrowRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        <Glossary />
      </div>
    </TooltipProvider>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Opportunity card (resident)
═══════════════════════════════════════════════════════════════════════ */
function OpportunityCard({
  opp, onToggle, planned, stcgRate, ltcgRate,
}: {
  opp: TLHOpportunity; onToggle: (id: string) => void; planned: boolean;
  stcgRate: number; ltcgRate: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const u = URGENCY[opp.urgency];

  if (planned) {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4 animate-fade-in"
        style={{ background: C.greenBg, borderColor: C.greenBorder }}>
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: C.green }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: C.navy }}>{opp.holding.name}</p>
          <p className="text-xs" style={{ color: C.muted }}>
            Planned — {formatINR(opp.unrealizedLossINR)} loss booked · {formatINR(opp.bestCaseSavings)} tax saving
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggle(opp.holding.id)}>
          <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden transition-all" style={{ background: "#fff", borderColor: u.border }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: u.dot }} />
            <span className="text-[10px] font-bold" style={{ color: C.muted }}>{opp.priorityScore}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate" style={{ color: C.navy }}>{opp.holding.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {opp.holding.amc} · {opp.holding.symbol} · {opp.holding.quantity.toLocaleString()} units
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge variant={opp.isSTCL ? "stcl" : "ltcl"}>
                  <Term hint={opp.isSTCL ? T.stcl : T.ltcl}>{opp.isSTCL ? "STCL" : "LTCL"}</Term>
                </Badge>
                <span className="text-[10px] font-semibold" style={{ color: u.text }}>{u.label}</span>
              </div>
            </div>

            {/* Metrics — responsive */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Metric label="Unrealized loss" value={formatINR(opp.unrealizedLossINR)} sub={`−${opp.unrealizedLossPercent.toFixed(1)}%`} color={C.red} />
              <Metric label="Est. tax saving" value={formatINR(opp.bestCaseSavings)} sub={opp.isSTCL ? `@ ${(stcgRate * 100).toFixed(1)}%` : `@ ${(ltcgRate * 100).toFixed(1)}%`} color={C.green} />
              <Metric label="Net benefit" value={formatINR(opp.netBenefit)} sub={`after ${formatINR(opp.transactionCost)} cost`} color={C.green} />
              <Metric label="Held" value={holdingPeriodLabel(opp.holdingDays)} sub={opp.daysUntilLTCG > 0 ? `${opp.daysUntilLTCG}d to LTCG` : "LTCG eligible"} color={C.blue} />
            </div>

            <div className="mt-3 rounded-lg px-3 py-2" style={{ background: "#F9FAFB" }}>
              <p className="text-[11px]" style={{ color: "#374151" }}>{opp.recommendation}</p>
            </div>

            {expanded && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <div className="rounded-xl border p-3" style={{ borderColor: C.greenBorder, background: C.greenBg }}>
                  <p className="text-[10px] font-bold mb-2 uppercase tracking-wider" style={{ color: C.green }}>
                    How this saving was calculated
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <p style={{ color: C.muted }}>Unrealized loss</p>
                      <p className="font-bold" style={{ color: C.red }}>
                        (${opp.holding.currentNAVUSD} − ${opp.holding.avgCostUSD}) × {opp.holding.quantity.toLocaleString()} × ₹83.5 = −{formatINR(opp.unrealizedLossINR)}
                      </p>
                      <p className="mt-2" style={{ color: C.muted }}>This is a {opp.isSTCL ? "short-term" : "long-term"} loss because</p>
                      <p style={{ color: C.blue }}>{opp.holdingDays} days held {opp.isSTCL ? "≤" : ">"} 730-day (24-month) threshold</p>
                    </div>
                    <div className="space-y-1">
                      <p style={{ color: C.muted }}>Tax saving</p>
                      <p className="font-bold" style={{ color: C.green }}>
                        {formatINR(opp.unrealizedLossINR)} × {opp.isSTCL ? `${(stcgRate * 100).toFixed(2)}% (STCG)` : `${(ltcgRate * 100).toFixed(2)}% (LTCG)`} = {formatINR(opp.bestCaseSavings)}
                      </p>
                      <p className="mt-2" style={{ color: C.muted }}>Why this rate?</p>
                      <p style={{ color: C.amber }}>
                        {opp.isSTCL
                          ? `slab × surcharge × 1.04 cess = ${(stcgRate * 100).toFixed(2)}%`
                          : `12.5% × 1.15 surcharge cap × 1.04 cess = ${(ltcgRate * 100).toFixed(2)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 border-t pt-2 flex justify-between text-[11px]" style={{ borderColor: C.greenBorder }}>
                    <span style={{ color: C.muted }}>Transaction cost</span>
                    <span style={{ color: C.red }}>−{formatINR(opp.transactionCost)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-1 font-bold">
                    <span style={{ color: C.navy }}>Net benefit</span>
                    <span style={{ color: C.green }}>{formatINR(opp.netBenefit)}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed px-3 py-2" style={{ borderColor: C.border, background: "#F9FAFB" }}>
                  <p className="text-[10px] font-bold mb-0.5" style={{ color: C.blue }}>
                    Suggested replacement (keeps your exposure, <Term hint={T.gaar}>GAAR</Term>-safe)
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>{opp.suggestedReplacement}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t pt-3" style={{ borderColor: C.border }}>
          <Button size="sm" className="flex-1 text-white hover:opacity-90"
            style={{ background: C.green }} onClick={() => onToggle(opp.holding.id)}>
            <Scissors className="h-3.5 w-3.5 mr-1.5" />
            Add {formatINR(opp.unrealizedLossINR)} to plan
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} style={{ color: C.muted }}>
            <span className="text-xs mr-1">{expanded ? "Hide" : "Show the math"}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Small building blocks ── */
function Metric({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: "#F9FAFB" }}>
      <p className="text-[10px]" style={{ color: C.muted }}>{label}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
      <p className="text-[10px]" style={{ color: C.muted }}>{sub}</p>
    </div>
  );
}

function KPI({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <Card style={{ borderColor: C.border }}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1">
          <p className="text-[11px]" style={{ color: C.muted }}>{label}</p>
          <InfoTip hint={hint} />
        </div>
        <p className="text-base font-extrabold mt-1" style={{ color }}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoPoint({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold" style={{ color: C.green }}>{title}</p>
      <p className="mt-1 leading-relaxed" style={{ color: "#33514a" }}>{body}</p>
    </div>
  );
}

function RateRow({ label, rate, color, bar }: { label: React.ReactNode; rate: number; color: string; bar: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: C.muted }}>{label}</span>
        <span className="font-bold" style={{ color }}>{(rate * 100).toFixed(2)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#EEF0F2" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, bar * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full inline-block" style={{ background: dot }} /> {label}
    </span>
  );
}

function Glossary() {
  const items: [string, string][] = [
    ["STCL", T.stcl], ["LTCL", T.ltcl], ["STCG", T.stcg], ["LTCG", T.ltcg],
    ["Wash-sale rule", T.washSale], ["GAAR", T.gaar], ["Carry-forward", T.carry],
    ["Surcharge", T.surcharge], ["Cess", T.cess], ["Section 10(4D)", T.sec10],
  ];
  return (
    <details className="rounded-xl border" style={{ borderColor: C.border, background: "#fff" }}>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold flex items-center justify-between"
        style={{ color: C.navy }}>
        Glossary — every term in plain English
        <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />
      </summary>
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(([term, def]) => (
          <div key={term} className="rounded-lg p-3" style={{ background: "#F9FAFB" }}>
            <p className="text-xs font-bold" style={{ color: C.navy }}>{term}</p>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: C.muted }}>{def}</p>
          </div>
        ))}
      </div>
      <p className="px-4 pb-4 text-[10px]" style={{ color: C.muted }}>
        Illustrative only · Tax rates per Finance Act 2025, FY 2025-26 · Consult your CA before acting.
      </p>
    </details>
  );
}
