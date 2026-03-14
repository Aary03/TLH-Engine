/**
 * Tax Loss Harvesting engine
 * India has NO wash sale rules — immediate rebuy is legal and optimal
 * Priority: STCL offsetting STCG > STCL offsetting LTCG > LTCL offsetting LTCG
 */

import { HOLDINGS, getHoldingDays, getUnrealizedPnL, USD_TO_INR, type Holding } from "./mock-data";
import {
  getLTCGEffectiveRate,
  getSTCGEffectiveRate,
} from "./tax-calculations";

export interface TLHOpportunity {
  holding: Holding;
  holdingDays: number;
  isSTCL: boolean;
  unrealizedLossINR: number;
  unrealizedLossUSD: number;
  unrealizedLossPercent: number;

  // Tax savings estimates
  savingsVsSTCG: number;    // STCL can offset STCG at high rate
  savingsVsLTCG: number;    // Both STCL and LTCL can offset LTCG

  bestCaseSavings: number;  // Max possible savings
  transactionCost: number;  // Estimated brokerage + spread (0.15%)
  netBenefit: number;       // Best savings - transaction cost
  priorityScore: number;    // 0–100

  // Timing
  daysUntilLTCG: number;
  urgency: "critical" | "high" | "medium" | "low";
  recommendation: string;

  // Replacement security (maintains exposure, avoids GAAR scrutiny)
  suggestedReplacement: string;
}

const REPLACEMENT_MAP: Record<string, string> = {
  "TATA-SP500": "iShares Core S&P 500 UCITS ETF (IFSC) — maintains US large-cap exposure",
  "MIRAE-GLOBAL": "HSBC Global Equity IFSC Fund — global diversified exposure maintained",
  "AXIS-NASDAQ": "Franklin NASDAQ Composite IFSC ETF — NASDAQ-equivalent exposure",
  "DSP-GOLD": "Nippon India Gold Fund IFSC — gold/precious metals exposure maintained",
};

export function runTLHScan(
  income: number,
  regime: "old" | "new" = "old",
  existingSTCGINR = 0,
  minLossThreshold = 50_000  // ₹50K minimum
): TLHOpportunity[] {
  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);

  const opportunities: TLHOpportunity[] = [];

  for (const holding of HOLDINGS) {
    const pnl = getUnrealizedPnL(holding);
    if (!pnl.isLoss || Math.abs(pnl.pnlINR) < minLossThreshold) continue;

    const holdingDays = getHoldingDays(holding.purchaseDate);
    const isSTCL = holdingDays <= 730;
    const unrealizedLossINR = Math.abs(pnl.pnlINR);
    const unrealizedLossUSD = Math.abs(pnl.pnlUSD);

    // STCL is more valuable: can offset STCG at 42.74% AND LTCG at 14.95%
    // LTCL can ONLY offset LTCG at 14.95%
    const savingsVsSTCG = isSTCL ? unrealizedLossINR * stcgRate : 0;
    const savingsVsLTCG = unrealizedLossINR * ltcgRate;

    // Best case: offset existing STCG first (highest value)
    let bestCaseSavings: number;
    if (isSTCL && existingSTCGINR > 0) {
      const canOffsetSTCG = Math.min(unrealizedLossINR, existingSTCGINR);
      const remainder = unrealizedLossINR - canOffsetSTCG;
      bestCaseSavings = canOffsetSTCG * stcgRate + remainder * ltcgRate;
    } else {
      bestCaseSavings = isSTCL ? savingsVsSTCG : savingsVsLTCG;
    }

    // Transaction cost: 0.15% of position value (brokerage + spread)
    const positionValueINR = holding.currentNAVUSD * holding.quantity * USD_TO_INR;
    const transactionCost = positionValueINR * 0.0015;
    const netBenefit = bestCaseSavings - transactionCost;

    // Days until LTCG threshold
    const daysUntilLTCG = Math.max(0, 730 - holdingDays);

    // Urgency: critical if within 20 days of FY end AND is STCL
    const daysUntilFYEnd = Math.floor(
      (new Date("2026-03-31").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: TLHOpportunity["urgency"];
    if (daysUntilFYEnd <= 20 && isSTCL) urgency = "critical";
    else if (netBenefit > 500_000) urgency = "high";
    else if (netBenefit > 200_000) urgency = "medium";
    else urgency = "low";

    // Priority score 0-100
    let priorityScore = 0;
    priorityScore += Math.min(40, (netBenefit / 1_000_000) * 40); // Net benefit component
    if (isSTCL) priorityScore += 30;                               // STCL bonus (broader offset)
    if (existingSTCGINR > 0) priorityScore += 20;                  // Existing STCG to offset
    if (daysUntilFYEnd <= 30) priorityScore += 10;                 // FY-end urgency
    priorityScore = Math.min(100, Math.round(priorityScore));

    // Recommendation
    let recommendation = "";
    if (!isSTCL) {
      recommendation = `LTCL: Can only offset LTCG. Consider if you expect ₹${(savingsVsLTCG / 100_000).toFixed(1)}L future LTCG.`;
    } else if (existingSTCGINR > 0) {
      recommendation = `Harvest now — offsets existing STCG at ${(stcgRate * 100).toFixed(2)}%. Rebuy immediately (no wash sale rules in India).`;
    } else {
      recommendation = `Book STCL for carry-forward. Can offset both STCG and LTCG for 8 years. Rebuy same day is allowed.`;
    }

    opportunities.push({
      holding,
      holdingDays,
      isSTCL,
      unrealizedLossINR,
      unrealizedLossUSD,
      unrealizedLossPercent: Math.abs(pnl.pnlPercent),
      savingsVsSTCG,
      savingsVsLTCG,
      bestCaseSavings,
      transactionCost,
      netBenefit,
      priorityScore,
      daysUntilLTCG,
      urgency,
      recommendation,
      suggestedReplacement:
        REPLACEMENT_MAP[holding.symbol] ||
        `Equivalent IFSC fund tracking same index — consult AMC for available options`,
    });
  }

  // Sort by priority score descending
  return opportunities.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getTLHSummary(opportunities: TLHOpportunity[]) {
  const totalLossAvailable = opportunities.reduce((s, o) => s + o.unrealizedLossINR, 0);
  const totalPotentialSavings = opportunities.reduce((s, o) => s + o.bestCaseSavings, 0);
  const totalNetBenefit = opportunities.reduce((s, o) => s + o.netBenefit, 0);
  const stclCount = opportunities.filter((o) => o.isSTCL).length;
  const ltclCount = opportunities.filter((o) => !o.isSTCL).length;

  return {
    opportunityCount: opportunities.length,
    totalLossAvailable,
    totalPotentialSavings,
    totalNetBenefit,
    stclCount,
    ltclCount,
    highPriorityCount: opportunities.filter((o) => o.urgency === "critical" || o.urgency === "high").length,
  };
}
