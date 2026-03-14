"use client";

import { useState, useMemo } from "react";
import { Calculator, TrendingUp, TrendingDown, Clock, Info, ChevronDown, ChevronUp, BookOpen, Sigma } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  calculateCapitalGains,
  getLTCGEffectiveRate,
  getSTCGEffectiveRate,
  getSurchargeRate,
  getSlabRate,
  bracketToIncome,
  getIncomeBracketLabel,
  type IncomeBracket,
  type TaxRegime,
} from "@/lib/tax-calculations";
import { formatINR } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
  Area, AreaChart, ComposedChart,
} from "recharts";

const INCOME_BRACKETS: IncomeBracket[] = [
  "up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr",
];

// All effective rates table
const RATE_TABLE_DATA = INCOME_BRACKETS.map((bracket) => {
  const income = bracketToIncome(bracket);
  return {
    bracket: getIncomeBracketLabel(bracket),
    stcg: +(getSTCGEffectiveRate(income, "old") * 100).toFixed(2),
    ltcg: +(getLTCGEffectiveRate(income, "old") * 100).toFixed(2),
    stcgNew: +(getSTCGEffectiveRate(income, "new") * 100).toFixed(2),
    ltcgNew: +(getLTCGEffectiveRate(income, "new") * 100).toFixed(2),
    spread: +((getSTCGEffectiveRate(income, "old") - getLTCGEffectiveRate(income, "old")) * 100).toFixed(2),
  };
});

export default function CalculatorPage() {
  const [buyPriceUSD, setBuyPriceUSD] = useState([210]);
  const [sellPriceUSD, setSellPriceUSD] = useState([245]);
  const [quantity, setQuantity] = useState([100]);
  const [holdingMonths, setHoldingMonths] = useState([18]);
  const [bracket, setBracket] = useState<IncomeBracket>("above_5Cr");
  const [regime, setRegime] = useState<TaxRegime>("old");

  const result = useMemo(() => {
    const today = new Date("2026-03-11");
    const buyDate = new Date(today);
    buyDate.setMonth(buyDate.getMonth() - holdingMonths[0]);

    return calculateCapitalGains({
      buyPrice: buyPriceUSD[0],
      sellPrice: sellPriceUSD[0],
      quantity: quantity[0],
      buyDate,
      sellDate: today,
      income: bracketToIncome(bracket),
      regime,
    });
  }, [buyPriceUSD, sellPriceUSD, quantity, holdingMonths, bracket, regime]);

  // Compare scenarios: sell now vs wait for LTCG
  const ltcgScenario = useMemo(() => {
    const today = new Date("2026-03-11");
    const holdMonths = Math.max(holdingMonths[0], 25); // ensure LTCG
    const buyDate = new Date(today);
    buyDate.setMonth(buyDate.getMonth() - holdMonths);

    return calculateCapitalGains({
      buyPrice: buyPriceUSD[0],
      sellPrice: sellPriceUSD[0],
      quantity: quantity[0],
      buyDate,
      sellDate: today,
      income: bracketToIncome(bracket),
      regime,
    });
  }, [buyPriceUSD, sellPriceUSD, quantity, holdingMonths, bracket, regime]);

  const [showMath, setShowMath] = useState(true);

  const income = bracketToIncome(bracket);
  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);
  const surcharge = getSurchargeRate(income, regime);
  const slabRate = getSlabRate(income, regime);
  const ltcgSurcharge = Math.min(surcharge, 0.15);

  const pnlINR = (sellPriceUSD[0] - buyPriceUSD[0]) * quantity[0] * 83.5;
  const isGain = pnlINR >= 0;
  const isLTCG = holdingMonths[0] * 30 > 730;

  // Break-even: how much does waiting for LTCG save?
  const taxIfSTCG = isGain ? Math.abs(pnlINR) * stcgRate : 0;
  const taxIfLTCG = isGain ? Math.abs(pnlINR) * ltcgRate : 0;
  const holdingBenefit = taxIfSTCG - taxIfLTCG;
  const daysToLTCG = Math.max(0, 730 - holdingMonths[0] * 30);

  // Chart data for rate comparison
  const rateCompareData = RATE_TABLE_DATA.map((r) => ({
    bracket: r.bracket.replace("₹", "").replace(" – ", "-"),
    "STCG (Old)": r.stcg,
    "LTCG (Old)": r.ltcg,
    "Spread": r.spread,
  }));

  // Live formula steps
  const gainUSD = (sellPriceUSD[0] - buyPriceUSD[0]) * quantity[0];
  const gainINR = gainUSD * 83.5;
  const baseRate = isLTCG ? 0.125 : slabRate;
  const appliedSurcharge = isLTCG ? ltcgSurcharge : surcharge;
  const effectiveRate = isLTCG ? ltcgRate : stcgRate;
  const taxAmount = isGain ? gainINR * effectiveRate : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Capital Gains Calculator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            IFSC/overseas fund STCG & LTCG · Surcharge · Cess · Scenario comparison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">FY 2025-26 rates</Badge>
          <button
            onClick={() => setShowMath(!showMath)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              showMath
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Sigma className="h-3.5 w-3.5" />
            {showMath ? "Hide Math" : "Show Math"}
          </button>
        </div>
      </div>

      {/* Live Formula Panel */}
      {showMath && (
        <Card className="border-primary/20 bg-primary/5 animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Live Formula — Every number explained
              <Badge variant="info" className="text-[9px]">updates as you move sliders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Step-by-step calculation */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Step-by-Step Calculation
                </p>

                <FormulaStep
                  step="1"
                  label="Gain in USD"
                  formula={`(Sell $${sellPriceUSD[0]} − Buy $${buyPriceUSD[0]}) × ${quantity[0].toLocaleString()} units`}
                  result={`$${gainUSD >= 0 ? "+" : ""}${gainUSD.toFixed(0)}`}
                  isPositive={gainUSD >= 0}
                />
                <FormulaStep
                  step="2"
                  label="Convert to INR"
                  formula={`$${Math.abs(gainUSD).toFixed(0)} × ₹83.50 (RBI ref rate)`}
                  result={`${gainINR >= 0 ? "+" : ""}${formatINR(gainINR)}`}
                  isPositive={gainINR >= 0}
                />
                <FormulaStep
                  step="3"
                  label="Holding Period"
                  formula={`${holdingMonths[0]} months = ~${holdingMonths[0] * 30} days vs 730-day LTCG threshold`}
                  result={isLTCG ? "LTCG ✓ (>730d)" : `STCG (${730 - holdingMonths[0] * 30}d short)`}
                  isPositive={isLTCG}
                  highlight
                />
                <FormulaStep
                  step="4"
                  label="Base Tax Rate"
                  formula={isLTCG
                    ? "Section 112 — 12.5% flat (no indexation)"
                    : `Slab rate — ${(slabRate * 100).toFixed(0)}% (income ${getIncomeBracketLabel(bracket)})`}
                  result={`${(baseRate * 100).toFixed(1)}%`}
                  isPositive={isLTCG}
                />
                <FormulaStep
                  step="5"
                  label="Surcharge"
                  formula={isLTCG
                    ? `Actual surcharge ${(surcharge * 100).toFixed(0)}% BUT capped at 15% by Section 112 proviso`
                    : `${(surcharge * 100).toFixed(0)}% surcharge — NO cap for STCG`}
                  result={`${(appliedSurcharge * 100).toFixed(0)}%${isLTCG && surcharge > 0.15 ? ` (saved ${((surcharge - 0.15) * 100).toFixed(0)}pp by cap!)` : ""}`}
                  isPositive={isLTCG}
                  highlight={isLTCG && surcharge > 0.15}
                />
                <FormulaStep
                  step="6"
                  label="Health & Education Cess"
                  formula="Fixed 4% on (base tax + surcharge) — Finance Act"
                  result="+4%"
                  isPositive={false}
                />
                <FormulaStep
                  step="7"
                  label="Effective Rate"
                  formula={`${(baseRate * 100).toFixed(1)}% × (1 + ${(appliedSurcharge * 100).toFixed(0)}%) × (1 + 4%)`}
                  result={`= ${(effectiveRate * 100).toFixed(2)}%`}
                  isPositive={isLTCG}
                  highlight
                />
                {isGain && (
                  <FormulaStep
                    step="8"
                    label="Tax Payable"
                    formula={`${formatINR(gainINR)} gain × ${(effectiveRate * 100).toFixed(2)}%`}
                    result={formatINR(taxAmount)}
                    isPositive={false}
                  />
                )}
              </div>

              {/* Key insight + scenario comparison */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  The Rate Algebra
                </p>

                {/* LTCG formula card */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-semibold text-emerald-400 mb-2">LTCG Formula (Section 112)</p>
                  <p className="font-mono text-xs text-emerald-300">
                    12.5% × (1 + min(surcharge, <span className="text-yellow-400 font-bold">15%</span>)) × 1.04
                  </p>
                  <p className="font-mono text-xs mt-1 text-emerald-300">
                    = 12.5% × {(1 + ltcgSurcharge).toFixed(2)} × 1.04
                  </p>
                  <p className="font-mono text-xs mt-1 text-white font-bold">
                    = <span className="text-emerald-400">{(ltcgRate * 100).toFixed(2)}%</span>
                    <span className="text-[9px] text-emerald-400/60 ml-2">(max ever = 14.95%)</span>
                  </p>
                </div>

                {/* STCG formula card */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="text-[10px] font-semibold text-rose-400 mb-2">STCG Formula (at slab)</p>
                  <p className="font-mono text-xs text-rose-300">
                    {(slabRate * 100).toFixed(0)}% × (1 + <span className="text-yellow-400 font-bold">{(surcharge * 100).toFixed(0)}%</span>) × 1.04
                  </p>
                  <p className="font-mono text-xs mt-1 text-rose-300">
                    = {(slabRate * 100).toFixed(0)}% × {(1 + surcharge).toFixed(2)} × 1.04
                  </p>
                  <p className="font-mono text-xs mt-1 text-white font-bold">
                    = <span className="text-rose-400">{(stcgRate * 100).toFixed(2)}%</span>
                    <span className="text-[9px] text-rose-400/60 ml-2">(no surcharge cap)</span>
                  </p>
                </div>

                {/* The spread */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-[10px] font-semibold text-amber-400 mb-1">The Spread (why holding 730d matters)</p>
                  <p className="font-mono text-xs">
                    <span className="text-rose-400">{(stcgRate * 100).toFixed(2)}%</span>
                    {" − "}
                    <span className="text-emerald-400">{(ltcgRate * 100).toFixed(2)}%</span>
                    {" = "}
                    <span className="text-amber-400 font-bold">{((stcgRate - ltcgRate) * 100).toFixed(2)} pp</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Per ₹1L gain: save{" "}
                    <span className="text-emerald-400 font-semibold">
                      ₹{Math.round((stcgRate - ltcgRate) * 100_000).toLocaleString()}
                    </span>
                    {" "}by waiting for LTCG
                  </p>
                  {isGain && !isLTCG && (
                    <p className="text-[10px] text-amber-400 font-semibold mt-1">
                      → On your ₹{(gainINR / 100_000).toFixed(1)}L gain: save {formatINR(holdingBenefit)} by waiting {daysToLTCG} more days
                    </p>
                  )}
                </div>

                {/* ITR section reference */}
                <div className="rounded-lg bg-secondary/40 p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground">Statutory References</p>
                  {[
                    ["LTCG rate 12.5%", "Section 112, IT Act (Budget 2024)"],
                    ["Surcharge cap 15%", "Proviso to Section 112"],
                    ["24-month threshold", "Section 2(42A) definition"],
                    ["4% cess", "Finance Act — H&E Cess"],
                    ["No wash sale rule", "Absence of IRC §1091 equivalent"],
                  ].map(([rule, ref]) => (
                    <div key={rule} className="flex justify-between text-[9px]">
                      <span className="text-foreground">{rule}</span>
                      <span className="text-muted-foreground font-mono">{ref}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Transaction Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SliderInput
                label="Buy Price (USD)"
                value={buyPriceUSD}
                onChange={setBuyPriceUSD}
                min={10} max={500} step={5}
                displayValue={`$${buyPriceUSD[0]}`}
                sub={`₹${(buyPriceUSD[0] * 83.5).toFixed(0)}`}
              />
              <SliderInput
                label="Sell Price (USD)"
                value={sellPriceUSD}
                onChange={setSellPriceUSD}
                min={10} max={500} step={5}
                displayValue={`$${sellPriceUSD[0]}`}
                sub={`₹${(sellPriceUSD[0] * 83.5).toFixed(0)}`}
                accent={sellPriceUSD[0] >= buyPriceUSD[0] ? "emerald" : "rose"}
              />
              <SliderInput
                label="Units"
                value={quantity}
                onChange={setQuantity}
                min={10} max={5000} step={10}
                displayValue={quantity[0].toLocaleString()}
                sub={`Total buy: ${formatINR(buyPriceUSD[0] * quantity[0] * 83.5)}`}
              />
              <SliderInput
                label="Holding Period"
                value={holdingMonths}
                onChange={setHoldingMonths}
                min={1} max={48} step={1}
                displayValue={`${holdingMonths[0]}m`}
                sub={holdingMonths[0] > 24 ? "LTCG territory (>24 months)" : `${24 - holdingMonths[0]}m to LTCG`}
                accent={holdingMonths[0] > 24 ? "emerald" : "amber"}
              />

              {/* Bracket + Regime */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Income Bracket</label>
                <div className="flex flex-wrap gap-2">
                  {INCOME_BRACKETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBracket(b)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                        bracket === b
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {getIncomeBracketLabel(b)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Tax Regime</label>
                <div className="flex gap-2">
                  {(["old", "new"] as TaxRegime[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegime(r)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all ${
                        regime === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {r === "old" ? "Old Regime" : "New Regime (2024+)"}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Main result */}
          <Card className={`border-2 ${isGain ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge variant={result.rateBreakdown.isLTCG ? "ltcg" : isGain ? "stcg" : "stcl"} className="text-xs">
                    {result.gainType} · {result.holdingDays} days
                  </Badge>
                  <p className="text-2xl font-bold mt-2 {isGain ? 'text-gain' : 'text-loss'}">
                    <span className={isGain ? "text-gain" : "text-loss"}>
                      {isGain ? "+" : "-"}{formatINR(Math.abs(pnlINR))}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gross {isGain ? "gain" : "loss"} ({quantity[0]} units × ${sellPriceUSD[0] - buyPriceUSD[0]} × ₹83.5)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Effective rate</p>
                  <p className="text-xl font-bold text-rose-400">{(result.rateBreakdown.effectiveRate * 100).toFixed(2)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <ResultMetric label="Base Rate" value={`${(result.rateBreakdown.baseRate * 100).toFixed(1)}%`} />
                <ResultMetric
                  label="Surcharge"
                  value={`${(result.rateBreakdown.surchargeRate * 100).toFixed(0)}%`}
                  sub={result.rateBreakdown.isLTCG ? "capped at 15%" : "uncapped"}
                />
                <ResultMetric label="Cess" value="4%" />
              </div>

              <div className="mt-4 border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Tax amount</p>
                  <p className="text-sm font-bold text-rose-400 mt-0.5">{formatINR(result.taxAmount)}</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Net after-tax proceeds</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatINR(result.netProceeds)}</p>
                </div>
              </div>

              {/* Rate breakdown */}
              <div className="mt-3 text-[10px] text-muted-foreground bg-background/40 rounded-lg p-2.5">
                <span className="font-mono">
                  {(result.rateBreakdown.baseRate * 100).toFixed(1)}% base
                  × {`(1 + ${(result.rateBreakdown.surchargeRate * 100).toFixed(0)}% surcharge)`}
                  × {`(1 + 4% cess)`}
                  = {(result.rateBreakdown.effectiveRate * 100).toFixed(2)}%
                  {result.rateBreakdown.isLTCG && " [surcharge capped at 15% — Sec 112]"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Scenario comparison: harvest now vs wait */}
          {isGain && !result.rateBreakdown.isLTCG && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Harvest Now vs Wait for LTCG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-background/50 p-3 border border-rose-500/20">
                    <p className="text-[10px] text-muted-foreground">Sell now (STCG)</p>
                    <p className="text-sm font-bold text-rose-400">{formatINR(taxIfSTCG)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">@ {(stcgRate * 100).toFixed(2)}%</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-emerald-500/20">
                    <p className="text-[10px] text-muted-foreground">Wait for LTCG (+{daysToLTCG}d)</p>
                    <p className="text-sm font-bold text-emerald-400">{formatINR(taxIfLTCG)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">@ {(ltcgRate * 100).toFixed(2)}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <p className="text-xs text-emerald-400 font-semibold">
                    Savings by waiting: {formatINR(holdingBenefit)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {daysToLTCG} days remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loss scenario */}
          {!isGain && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  Loss Harvesting Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background/50 p-3">
                    <p className="text-[10px] text-muted-foreground">If offset vs STCG</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {formatINR(Math.abs(pnlINR) * stcgRate)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">@ {(stcgRate * 100).toFixed(2)}%</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3">
                    <p className="text-[10px] text-muted-foreground">If offset vs LTCG</p>
                    <p className="text-sm font-bold text-amber-400">
                      {formatINR(Math.abs(pnlINR) * ltcgRate)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">@ {(ltcgRate * 100).toFixed(2)}%</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Book this STCL now (no wash sale rules). Rebuy immediately. 8-year carry-forward available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rate table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Effective Tax Rates by Income Bracket</CardTitle>
            <Badge variant="info">IFSC/Overseas Funds · Old Regime</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Income Bracket", "STCG Rate", "LTCG Rate", "Spread", "Tax saved per ₹1L (STCL vs STCG)"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RATE_TABLE_DATA.map((r, i) => (
                <tr
                  key={r.bracket}
                  className={`border-b border-border/50 ${bracket === INCOME_BRACKETS[i] ? "bg-primary/5" : "hover:bg-secondary/30"} transition-colors`}
                >
                  <td className="px-5 py-3 font-medium">{r.bracket}</td>
                  <td className="px-5 py-3 text-yellow-400 font-semibold font-mono">{r.stcg}%</td>
                  <td className="px-5 py-3 text-emerald-400 font-semibold font-mono">{r.ltcg}%</td>
                  <td className="px-5 py-3 text-rose-400 font-semibold font-mono">{r.spread}pp</td>
                  <td className="px-5 py-3 text-emerald-400 font-semibold">
                    ₹{Math.round(r.stcg * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Rate chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">STCG vs LTCG Spread — The TLH Value Gap</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rateCompareData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="bracket" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9" }}
                formatter={(v: number, n: string) => [`${v}%`, n]}
              />
              <Bar dataKey="STCG (Old)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="LTCG (Old)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Spread" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── SURCHARGE CLIFF MARGINAL RATE ANALYSER ── */}
      <SurchargeCliffAnalyser />
    </div>
  );
}

function SliderInput({
  label, value, onChange, min, max, step, displayValue, sub, accent = "blue",
}: {
  label: string; value: number[]; onChange: (v: number[]) => void;
  min: number; max: number; step: number;
  displayValue: string; sub?: string; accent?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400", rose: "text-rose-400",
    amber: "text-amber-400", blue: "text-primary",
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <div className="text-right">
          <span className={`text-sm font-bold ${colors[accent]}`}>{displayValue}</span>
          {sub && <span className="ml-2 text-[10px] text-muted-foreground">{sub}</span>}
        </div>
      </div>
      <Slider min={min} max={max} step={step} value={value} onValueChange={onChange} />
    </div>
  );
}

function ResultMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-background/40 p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Surcharge Cliff Marginal Rate Analyser ───────────────────────────────

function SurchargeCliffAnalyser() {
  const [selectedIncome, setSelectedIncome] = useState([490]); // in ₹L
  const [showMarginal, setShowMarginal] = useState(true);

  // Generate data points from ₹0 to ₹10Cr in ₹5L increments
  const cliffData = useMemo(() => {
    const points = [];
    for (let incomeL = 0; incomeL <= 1000; incomeL += 5) {
      const income = incomeL * 100_000;
      const stcgRate = getSTCGEffectiveRate(income, "old") * 100;
      const ltcgRate = getLTCGEffectiveRate(income, "old") * 100;

      // Marginal rate: how much extra tax on the next ₹1L of STCG
      const nextIncome = income + 100_000;
      const taxNow  = Math.max(0, income - 250_000) * getSTCGEffectiveRate(income, "old");
      const taxNext = Math.max(0, nextIncome - 250_000) * getSTCGEffectiveRate(nextIncome, "old");
      const marginalSTCG = ((taxNext - taxNow) / 100_000) * 100;

      points.push({
        incomeL,
        incomeLabel: incomeL >= 100 ? `₹${(incomeL / 100).toFixed(0)}Cr` : `₹${incomeL}L`,
        stcgRate: +stcgRate.toFixed(2),
        ltcgRate: +ltcgRate.toFixed(2),
        marginalSTCG: +Math.min(150, marginalSTCG).toFixed(1),
        spread: +(stcgRate - ltcgRate).toFixed(2),
      });
    }
    return points;
  }, []);

  const currentPoint = cliffData.find((d) => d.incomeL === selectedIncome[0]) ?? cliffData[cliffData.length - 1];

  // Cliff annotations
  const CLIFFS = [
    { incomeL: 50,  label: "₹50L", color: "#f59e0b" },
    { incomeL: 100, label: "₹1Cr", color: "#f97316" },
    { incomeL: 200, label: "₹2Cr", color: "#ef4444" },
    { incomeL: 500, label: "₹5Cr", color: "#dc2626" },
  ];

  // The infamous danger zone table
  const dangerZone = [
    { income: "₹4.9Cr → ₹5.1Cr", extraGain: "₹20L STCG",   stcgBefore: "39.00%", stcgAfter: "42.74%", extraTax: "~₹7.5L", marginal: "~37.5%" },
    { income: "₹1.9Cr → ₹2.1Cr", extraGain: "₹20L STCG",   stcgBefore: "35.88%", stcgAfter: "39.00%", extraTax: "~₹6.2L", marginal: "~31%" },
    { income: "₹98L → ₹1.02Cr",  extraGain: "₹4L STCG",    stcgBefore: "34.32%", stcgAfter: "35.88%", extraTax: "~₹1.4L", marginal: "~35%" },
    { income: "₹48L → ₹52L",     extraGain: "₹4L STCG",    stcgBefore: "31.20%", stcgAfter: "34.32%", extraTax: "~₹1.2L", marginal: "~30%" },
  ];

  return (
    <Card className="border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="text-rose-400">⚠</span>
              Surcharge Cliff Marginal Rate Analyser
              <Badge variant="critical" className="text-[9px]">Advanced</Badge>
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">
              The marginal STCG rate near surcharge cliffs can <span className="text-rose-400 font-bold">exceed 37%</span> — more than the LTCG rate on 3× the gain.
              Most investors and CAs miss this.
            </p>
          </div>
          <button
            onClick={() => setShowMarginal(!showMarginal)}
            className={`text-[9px] border rounded px-2 py-1 ${showMarginal ? "border-rose-500/30 text-rose-400" : "border-border text-muted-foreground"}`}
          >
            {showMarginal ? "Hide marginal" : "Show marginal"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Income selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-muted-foreground">Your total income</label>
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-primary">
                {selectedIncome[0] >= 100 ? `₹${(selectedIncome[0] / 100).toFixed(2)}Cr` : `₹${selectedIncome[0]}L`}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                currentPoint.marginalSTCG > 50 ? "bg-rose-500/20 text-rose-400" :
                currentPoint.marginalSTCG > 35 ? "bg-amber-500/20 text-amber-400" :
                "bg-secondary text-muted-foreground"
              }`}>
                Marginal STCG: {currentPoint.marginalSTCG.toFixed(1)}%
              </span>
            </div>
          </div>
          <Slider min={0} max={1000} step={5} value={selectedIncome} onValueChange={setSelectedIncome} />
          <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
            <span>₹0</span>
            {CLIFFS.map((c) => (
              <span key={c.label} style={{ color: c.color }} className="font-bold">{c.label} ▲</span>
            ))}
            <span>₹10Cr</span>
          </div>
        </div>

        {/* Live stats for selected income */}
        <div className="grid grid-cols-4 gap-3">
          <CliffStat label="STCG Effective Rate"  value={`${currentPoint.stcgRate}%`}  color="text-rose-400" />
          <CliffStat label="LTCG Effective Rate"  value={`${currentPoint.ltcgRate}%`}  color="text-emerald-400" />
          <CliffStat label="STCG–LTCG Spread"     value={`${currentPoint.spread.toFixed(2)}pp`} color="text-amber-400" />
          <CliffStat
            label="Marginal Rate next ₹1L STCG"
            value={`${currentPoint.marginalSTCG.toFixed(1)}%`}
            color={currentPoint.marginalSTCG > 50 ? "text-rose-400" : "text-yellow-400"}
            alert={currentPoint.marginalSTCG > 50}
          />
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={cliffData.filter((d) => d.incomeL <= 700)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="incomeLabel" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false}
              interval={19} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "hsl(222 47% 9%)", border: "1px solid hsl(222 47% 15%)", borderRadius: "8px", color: "#f1f5f9", fontSize: "11px" }}
              formatter={(v: number, n: string) => [`${v}%`, n]}
            />
            {/* Cliff reference lines */}
            {CLIFFS.map((c) => (
              <ReferenceLine key={c.label} x={c.label} stroke={c.color} strokeDasharray="4 4" strokeOpacity={0.6}
                label={{ value: c.label, fill: c.color, fontSize: 9, position: "top" }} />
            ))}
            {/* Selected income */}
            {currentPoint && (
              <ReferenceLine
                x={currentPoint.incomeLabel}
                stroke="#3b82f6" strokeWidth={2}
                label={{ value: "You", fill: "#3b82f6", fontSize: 9 }}
              />
            )}
            <Area type="monotone" dataKey="stcgRate" name="STCG Rate" stroke="#f43f5e" fill="rgba(244,63,94,0.1)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ltcgRate" name="LTCG Rate" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            {showMarginal && (
              <Line type="monotone" dataKey="marginalSTCG" name="Marginal STCG Rate" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Danger zone table */}
        <div className="rounded-xl border border-rose-500/20 overflow-hidden">
          <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20">
            <p className="text-xs font-semibold text-rose-400">
              ⚠ Cliff Danger Zones — Marginal rupees crossing these boundaries cost disproportionately
            </p>
          </div>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Income crosses</th>
                <th className="px-4 py-2 text-left font-semibold text-muted-foreground">Trigger</th>
                <th className="px-4 py-2 text-right font-semibold text-muted-foreground">STCG before</th>
                <th className="px-4 py-2 text-right font-semibold text-muted-foreground">STCG after</th>
                <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Extra tax</th>
                <th className="px-4 py-2 text-right font-semibold text-muted-foreground">Marginal</th>
              </tr>
            </thead>
            <tbody>
              {dangerZone.map((row) => (
                <tr key={row.income} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="px-4 py-2.5 font-medium">{row.income}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.extraGain}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-mono">{row.stcgBefore}</td>
                  <td className="px-4 py-2.5 text-right text-rose-400 font-mono">{row.stcgAfter}</td>
                  <td className="px-4 py-2.5 text-right text-rose-400 font-bold">{row.extraTax}</td>
                  <td className="px-4 py-2.5 text-right text-amber-400 font-bold">{row.marginal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The key insight */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[10px] font-semibold text-amber-400 mb-2">The Non-Obvious Insight: When TLH Is Worth Most</p>
          <p className="text-[10px] text-muted-foreground">
            If your income is <span className="text-amber-400 font-bold">just above a surcharge cliff</span> (e.g., ₹5.1Cr), harvesting STCL 
            not only saves tax at 42.74% — it can <span className="text-emerald-400 font-bold">pull you back below the cliff</span>, 
            reducing the surcharge on ALL your remaining STCG from 37% to 25%.
            A ₹20L STCL harvest at this moment could save ₹7–8L+ — not just 42.74% × ₹20L = ₹8.55L,
            but potentially more via the surcharge cascade effect.
            <span className="text-blue-400 ml-1">→ Ask the AI Advisor: "I have ₹5.2Cr income. How much STCL should I harvest to minimise total tax?"</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CliffStat({ label, value, color, alert }: { label: string; value: string; color: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${alert ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-secondary/20"}`}>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`text-base font-bold mt-0.5 ${color}`}>{value}</p>
      {alert && <p className="text-[8px] text-rose-400 mt-0.5">⚠ Near surcharge cliff</p>}
    </div>
  );
}

function FormulaStep({
  step, label, formula, result, isPositive, highlight,
}: {
  step: string; label: string; formula: string; result: string;
  isPositive: boolean; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg px-3 py-2 ${highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-muted-foreground">
          {step}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-foreground">{label}</p>
            <p className={`text-[10px] font-bold flex-shrink-0 font-mono ${isPositive ? "text-emerald-400" : "text-rose-400"} ${highlight ? "text-sm" : ""}`}>
              {result}
            </p>
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{formula}</p>
        </div>
      </div>
    </div>
  );
}
