import OpenAI from "openai";
import { NextRequest } from "next/server";
import {
  calculateTCS,
  optimizeFamilyTCS,
  getLTCGEffectiveRate,
  getSTCGEffectiveRate,
  getSurchargeRate,
  getSlabRate,
  bracketToIncome,
  type LRSPurpose,
  type IncomeBracket,
  type TaxRegime,
} from "@/lib/tax-calculations";
import { runTLHScan, getTLHSummary } from "@/lib/tlh-engine";
import {
  FAMILY_MEMBERS,
  HOLDINGS,
  getHoldingDays,
  getUnrealizedPnL,
  getPortfolioSummary,
  USD_TO_INR,
} from "@/lib/mock-data";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;
const USD_INR = 83.5;

// ─── Tool Definitions ─────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculate_tcs",
      description: "Calculate TCS (Tax Collected at Source) on an LRS remittance. Use whenever the user asks about TCS on a specific amount, how much TCS will be deducted, or whether a remittance is above the threshold.",
      parameters: {
        type: "object",
        properties: {
          remittance_inr: { type: "number", description: "Planned remittance amount in INR (e.g., 5000000 for ₹50L)" },
          purpose: {
            type: "string",
            enum: ["investment", "education_loan", "education_self", "medical", "tour_package", "gift"],
            description: "Purpose of remittance. Default to 'investment' for GIFT City IFSC funds.",
          },
          fy_cumulative_inr: {
            type: "number",
            description: "Amount already remitted this FY in INR. Defaults to 0 if not specified.",
          },
        },
        required: ["remittance_inr", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_capital_gains",
      description: "Calculate STCG or LTCG tax on an IFSC/overseas fund redemption. Use when user provides buy price, sell price, quantity, or asks about tax on a specific trade.",
      parameters: {
        type: "object",
        properties: {
          buy_price_usd: { type: "number", description: "Purchase price per unit in USD" },
          sell_price_usd: { type: "number", description: "Redemption price per unit in USD" },
          quantity: { type: "number", description: "Number of units" },
          holding_months: { type: "number", description: "Holding period in months (>24 = LTCG, ≤24 = STCG)" },
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
            description: "Investor's total annual income bracket. Default to 'above_5Cr' for HNI.",
          },
          regime: {
            type: "string",
            enum: ["old", "new"],
            description: "Tax regime. Default to 'old'.",
          },
        },
        required: ["buy_price_usd", "sell_price_usd", "quantity", "holding_months", "income_bracket"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "optimize_family_tcs",
      description: "Optimize TCS by splitting a planned LRS remittance across family members. Use when user asks how to reduce TCS, family splitting, or optimal distribution.",
      parameters: {
        type: "object",
        properties: {
          total_remittance_inr: { type: "number", description: "Total planned remittance in INR" },
          purpose: { type: "string", enum: ["investment", "education_loan", "education_self", "medical", "tour_package", "gift"] },
          members: {
            type: "array",
            description: "Family members with their existing FY remittances. If not provided, uses Rajesh family defaults.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                fy_remitted_inr: { type: "number", description: "Amount already remitted this FY by this member" },
              },
              required: ["name", "fy_remitted_inr"],
            },
          },
        },
        required: ["total_remittance_inr", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tlh_opportunities",
      description: "Fetch the current tax loss harvesting opportunities from the portfolio. Use when user asks about TLH, what losses to harvest, or how much tax they can save.",
      parameters: {
        type: "object",
        properties: {
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
            description: "Income bracket to compute savings. Defaults to above_5Cr.",
          },
          existing_stcg_inr: {
            type: "number",
            description: "Existing STCG in current FY in INR. Defaults to 2200000 (₹22L).",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tax_rates",
      description: "Show effective STCG and LTCG rates for a given income bracket. Use when user asks about tax rates, what percentage tax, or rate comparison.",
      parameters: {
        type: "object",
        properties: {
          income_bracket: {
            type: "string",
            enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
          },
          regime: { type: "string", enum: ["old", "new"] },
        },
        required: ["income_bracket"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_fy_audit",
      description: "Run a complete FY tax audit. Call this when the user asks for a full picture, tax review, 'what should I do', 'audit my taxes', or wants a ranked action plan. Automatically runs portfolio summary, TLH scan, family TCS optimization, and capital gains analysis for every holding.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_scenarios",
      description: "Compare sell-now vs wait-for-LTCG scenarios side by side. Call when the user asks 'should I sell now or wait', 'what if I hold X more months', or wants a comparison of two selling strategies for a specific holding.",
      parameters: {
        type: "object",
        properties: {
          scenarioA: {
            type: "object",
            description: "First scenario (e.g. sell now)",
            properties: {
              holdingMonths: { type: "number" },
              label: { type: "string" },
            },
            required: ["holdingMonths", "label"],
          },
          scenarioB: {
            type: "object",
            description: "Second scenario (e.g. wait for LTCG)",
            properties: {
              holdingMonths: { type: "number" },
              label: { type: "string" },
            },
            required: ["holdingMonths", "label"],
          },
          holdingDetails: {
            type: "object",
            properties: {
              buyPriceUSD: { type: "number" },
              currentPriceUSD: { type: "number" },
              quantity: { type: "number" },
              incomeBracket: {
                type: "string",
                enum: ["up_to_50L", "50L_to_1Cr", "1Cr_to_2Cr", "2Cr_to_5Cr", "above_5Cr"],
              },
              regime: { type: "string", enum: ["old", "new"] },
              holdingName: { type: "string" },
            },
            required: ["buyPriceUSD", "currentPriceUSD", "quantity", "incomeBracket"],
          },
        },
        required: ["scenarioA", "scenarioB", "holdingDetails"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_schedule_fa_data",
      description: "Build a structured Schedule FA draft for GIFT City IFSC holdings. Call when user asks about Schedule FA, ITR-2/ITR-3 foreign asset disclosure, or FEMA compliance for GIFT City investments.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fy_countdown",
      description: "Get precise FY deadline data — days left in FY, last TLH date, next advance tax installment. Always call this when the user asks about timing, urgency, March 31 deadlines, or advance tax dates.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

// ─── Tool Executors ───────────────────────────────────────────────────────

function execCalculateTCS(args: {
  remittance_inr: number;
  purpose: LRSPurpose;
  fy_cumulative_inr?: number;
}) {
  const cumulative = args.fy_cumulative_inr ?? 0;
  const result = calculateTCS(args.remittance_inr, args.purpose, cumulative);
  const THRESHOLD = 1_000_000;
  const totalAfter = cumulative + args.remittance_inr;
  const taxableAbove = Math.max(0, totalAfter - THRESHOLD) - Math.max(0, cumulative - THRESHOLD);

  return {
    type: "tcs_result" as const,
    remittanceINR: args.remittance_inr,
    purpose: args.purpose,
    fyCumulativeINR: cumulative,
    thresholdINR: THRESHOLD,
    totalAfterINR: totalAfter,
    taxableAmountINR: taxableAbove,
    tcsAmount: result.tcsAmount,
    tcsRate: result.tcsRate,
    effectiveRate: result.effectiveRate,
    breakdown: result.breakdown,
    isAboveThreshold: totalAfter > THRESHOLD,
    remainingFree: Math.max(0, THRESHOLD - cumulative),
  };
}

function execCalculateCapitalGains(args: {
  buy_price_usd: number;
  sell_price_usd: number;
  quantity: number;
  holding_months: number;
  income_bracket: IncomeBracket;
  regime?: TaxRegime;
}) {
  const regime = args.regime ?? "old";
  const income = bracketToIncome(args.income_bracket);
  const holdingDays = Math.round(args.holding_months * 30.4);
  const isLTCG = holdingDays > 730;
  const gainUSD = (args.sell_price_usd - args.buy_price_usd) * args.quantity;
  const gainINR = gainUSD * USD_INR;
  const isLoss = gainINR < 0;

  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);
  const effectiveRate = isLTCG ? ltcgRate : stcgRate;
  const taxAmount = isLoss ? 0 : Math.abs(gainINR) * effectiveRate;
  const netProceeds = args.sell_price_usd * args.quantity * USD_INR - taxAmount;

  const surcharge = getSurchargeRate(income, regime);
  const appliedSurcharge = isLTCG ? Math.min(surcharge, 0.15) : surcharge;
  const baseRate = isLTCG ? 0.125 : getSlabRate(income, regime);

  return {
    type: "cg_result" as const,
    gainType: isLTCG ? "LTCG" : (isLoss ? (holdingDays <= 730 ? "STCL" : "LTCL") : "STCG"),
    holdingDays,
    holdingMonths: args.holding_months,
    gainINR,
    gainUSD,
    isLoss,
    isLTCG,
    effectiveRate,
    taxAmount,
    netProceeds,
    baseRate,
    appliedSurcharge,
    formula: isLTCG
      ? `12.5% × (1 + ${(appliedSurcharge * 100).toFixed(0)}% cap) × 1.04 = ${(effectiveRate * 100).toFixed(2)}%`
      : `${(baseRate * 100).toFixed(0)}% × (1 + ${(appliedSurcharge * 100).toFixed(0)}%) × 1.04 = ${(effectiveRate * 100).toFixed(2)}%`,
    daysToLTCG: Math.max(0, 730 - holdingDays),
    savingByWaiting: isLTCG ? 0 : (isLoss ? 0 : Math.abs(gainINR) * (stcgRate - ltcgRate)),
    incomeBracket: args.income_bracket,
    regime,
  };
}

function execOptimizeFamilyTCS(args: {
  total_remittance_inr: number;
  purpose: LRSPurpose;
  members?: { name: string; fy_remitted_inr: number }[];
}) {
  const members = args.members ?? FAMILY_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    fyRemittedINR: m.fyRemittedINR,
  }));

  const membersForCalc = members.map((m, i) => ({
    id: (m as { id?: string }).id ?? `m${i}`,
    name: m.name,
    fyRemittedINR: (m as { fyRemittedINR?: number }).fyRemittedINR ?? (m as { fy_remitted_inr?: number }).fy_remitted_inr ?? 0,
  }));

  const result = optimizeFamilyTCS(membersForCalc, args.total_remittance_inr, args.purpose);

  const singleMember = membersForCalc.sort((a, b) => b.fyRemittedINR - a.fyRemittedINR)[0];
  const singlePANTCS = calculateTCS(args.total_remittance_inr, args.purpose, singleMember.fyRemittedINR).tcsAmount;

  return {
    type: "family_split" as const,
    totalRemittanceINR: args.total_remittance_inr,
    purpose: args.purpose,
    memberCount: membersForCalc.length,
    singlePANTCS,
    optimizedTCS: result.totalTCS,
    tcsSavings: Math.max(0, result.tcsSavings),
    allocations: result.allocations,
    recommendation: result.recommendation,
    zeroTCSCapacity: membersForCalc.reduce(
      (s, m) => s + Math.max(0, 1_000_000 - m.fyRemittedINR), 0
    ),
  };
}

function execGetTLHOpportunities(args: {
  income_bracket?: IncomeBracket;
  existing_stcg_inr?: number;
}) {
  const income = bracketToIncome(args.income_bracket ?? "above_5Cr");
  const existingSTCG = args.existing_stcg_inr ?? 2_200_000;
  const opps = runTLHScan(income, "old", existingSTCG, 50_000);
  const summary = getTLHSummary(opps);

  return {
    type: "tlh_opportunities" as const,
    incomeBracket: args.income_bracket ?? "above_5Cr",
    summary,
    topOpportunities: opps.slice(0, 4).map((o) => ({
      name: o.holding.name,
      symbol: o.holding.symbol,
      isSTCL: o.isSTCL,
      unrealizedLossINR: o.unrealizedLossINR,
      unrealizedLossPercent: o.unrealizedLossPercent,
      bestCaseSavings: o.bestCaseSavings,
      netBenefit: o.netBenefit,
      holdingDays: o.holdingDays,
      priorityScore: o.priorityScore,
      urgency: o.urgency,
      recommendation: o.recommendation,
    })),
  };
}

function execGetTaxRates(args: {
  income_bracket: IncomeBracket;
  regime?: TaxRegime;
}) {
  const regime = args.regime ?? "old";
  const income = bracketToIncome(args.income_bracket);
  const stcgRate = getSTCGEffectiveRate(income, regime);
  const ltcgRate = getLTCGEffectiveRate(income, regime);
  const surcharge = getSurchargeRate(income, regime);
  const slabRate = getSlabRate(income, regime);

  return {
    type: "tax_rates" as const,
    incomeBracket: args.income_bracket,
    regime,
    stcgRate,
    ltcgRate,
    spread: stcgRate - ltcgRate,
    baseSTCG: slabRate,
    baseLTCG: 0.125,
    surcharge,
    ltcgSurcharge: Math.min(surcharge, 0.15),
    cess: 0.04,
    stcgFormula: `${(slabRate * 100).toFixed(0)}% × (1 + ${(surcharge * 100).toFixed(0)}%) × 1.04`,
    ltcgFormula: `12.5% × (1 + ${(Math.min(surcharge, 0.15) * 100).toFixed(0)}% cap) × 1.04`,
    savingPerLakh: Math.round((stcgRate - ltcgRate) * 100_000),
    isMaxBracket: args.income_bracket === "above_5Cr",
    capBenefit: surcharge > 0.15 ? `Surcharge cap saves ${((surcharge - 0.15) * 0.125 * 1.04 * 100).toFixed(2)}pp on LTCG` : null,
  };
}

// ─── New tool executors ────────────────────────────────────────────────────

function execRunFYAudit(): Record<string, unknown> {
  const income = bracketToIncome("above_5Cr");
  const summary = getPortfolioSummary();

  // TLH scan
  const opps = runTLHScan(income, "old", 2_200_000, 10_000);
  const tlhSummary = getTLHSummary(opps);

  // Family TCS optimization
  const familyMembers = FAMILY_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    fyRemittedINR: m.fyRemittedINR,
  }));
  const familyOpt = optimizeFamilyTCS(familyMembers, 10_000_000, "investment");

  // Capital gains per holding
  const pendingGains: Array<{
    name: string; symbol: string; gainType: string;
    gainINR: number; taxAmount: number; holdingDays: number;
  }> = [];

  for (const h of HOLDINGS) {
    const pnl = getUnrealizedPnL(h);
    if (!pnl.isLoss) {
      const days = getHoldingDays(h.purchaseDate);
      const isLTCG = days > 730;
      const rate = isLTCG
        ? getLTCGEffectiveRate(income, "old")
        : getSTCGEffectiveRate(income, "old");
      const tax = pnl.pnlINR * rate;
      pendingGains.push({
        name: h.name,
        symbol: h.symbol,
        gainType: isLTCG ? "LTCG" : "STCG",
        gainINR: Math.round(pnl.pnlINR),
        taxAmount: Math.round(tax),
        holdingDays: days,
      });
    }
  }

  const today = new Date();
  const fyEnd = new Date(today.getFullYear(), 2, 31); // March 31
  if (today > fyEnd) fyEnd.setFullYear(fyEnd.getFullYear() + 1);
  const fyDaysLeft = Math.ceil((fyEnd.getTime() - today.getTime()) / 86_400_000);

  // Ranked urgent actions by rupee impact
  const urgentActions: string[] = [];
  if (tlhSummary.totalNetBenefit > 0) {
    urgentActions.push(
      `Harvest TLH losses — save ₹${Math.round(tlhSummary.totalNetBenefit / 1000)}K in tax (${tlhSummary.opportunityCount} positions available)`
    );
  }
  const totalPendingTax = pendingGains.reduce((s, g) => s + g.taxAmount, 0);
  if (totalPendingTax > 0) {
    urgentActions.push(
      `Review ₹${Math.round(totalPendingTax / 100_000)}L in pending capital gains tax before FY end`
    );
  }
  if (familyOpt.tcsSavings > 0) {
    urgentActions.push(
      `Optimize family LRS routing — save ₹${Math.round(familyOpt.tcsSavings / 1000)}K in TCS`
    );
  }
  if (fyDaysLeft < 30) {
    urgentActions.unshift(
      `URGENT: Only ${fyDaysLeft} days left in FY — execute TLH by March 28 (T+2 settlement)`
    );
  }

  return {
    type: "fy_audit_result" as const,
    fyDaysLeft,
    portfolioValueINR: Math.round(summary.totalValueINR),
    totalUnrealizedLossINR: Math.round(summary.totalLossINR),
    totalUnrealizedGainINR: Math.round(summary.totalGainINR),
    tlhOpportunities: opps.slice(0, 4).map((o) => ({
      symbol: o.holding.symbol,
      name: o.holding.name,
      lossINR: Math.round(o.unrealizedLossINR),
      taxSavingINR: Math.round(o.bestCaseSavings),
      urgency: o.urgency,
      isSTCL: o.isSTCL,
    })),
    totalTLHSavingINR: Math.round(tlhSummary.totalNetBenefit),
    pendingGains,
    lrsStatus: {
      familyTotalRemittedINR: FAMILY_MEMBERS.reduce((s, m) => s + m.fyRemittedINR, 0),
      familyTotalTCSPaidINR: FAMILY_MEMBERS.reduce((s, m) => s + m.tcsDeducted, 0),
      optimizedSavingINR: Math.round(familyOpt.tcsSavings),
    },
    urgentActions,
  };
}

function execCompareScenarios(args: {
  scenarioA: { holdingMonths: number; label: string };
  scenarioB: { holdingMonths: number; label: string };
  holdingDetails: {
    buyPriceUSD: number;
    currentPriceUSD: number;
    quantity: number;
    incomeBracket: IncomeBracket;
    regime?: TaxRegime;
    holdingName?: string;
  };
}): Record<string, unknown> {
  const regime = args.holdingDetails.regime ?? "old";
  const income = bracketToIncome(args.holdingDetails.incomeBracket);
  const { buyPriceUSD, currentPriceUSD, quantity } = args.holdingDetails;

  function calcScenario(holdingMonths: number) {
    const holdingDays = Math.round(holdingMonths * 30.4);
    const isLTCG = holdingDays > 730;
    const gainUSD = (currentPriceUSD - buyPriceUSD) * quantity;
    const gainINR = gainUSD * USD_TO_INR;
    const isLoss = gainINR < 0;
    const rate = isLTCG ? getLTCGEffectiveRate(income, regime) : getSTCGEffectiveRate(income, regime);
    const taxAmount = isLoss ? 0 : gainINR * rate;
    const netProceeds = currentPriceUSD * quantity * USD_TO_INR - taxAmount;
    return {
      holdingMonths,
      holdingDays,
      isLTCG,
      gainINR: Math.round(gainINR),
      taxAmount: Math.round(taxAmount),
      effectiveRate: rate,
      netProceedsINR: Math.round(netProceeds),
      gainType: isLTCG ? "LTCG" : (isLoss ? "Loss" : "STCG"),
    };
  }

  const a = calcScenario(args.scenarioA.holdingMonths);
  const b = calcScenario(args.scenarioB.holdingMonths);
  const betterScenario = b.netProceedsINR >= a.netProceedsINR ? "B" : "A";
  const savingByChoosingBetter = Math.abs(b.netProceedsINR - a.netProceedsINR);

  return {
    type: "scenario_comparison" as const,
    holdingName: args.holdingDetails.holdingName ?? "This position",
    buyPriceUSD,
    currentPriceUSD,
    quantity,
    scenarioA: { ...a, label: args.scenarioA.label },
    scenarioB: { ...b, label: args.scenarioB.label },
    betterScenario,
    savingByChoosingBetterINR: Math.round(savingByChoosingBetter),
    recommendation: betterScenario === "B"
      ? `Wait for Scenario B — saves ₹${Math.round(savingByChoosingBetter / 1000)}K more in your pocket`
      : `Sell now (Scenario A) — Scenario B gives ₹${Math.round(savingByChoosingBetter / 1000)}K less`,
  };
}

function execBuildScheduleFAData(): Record<string, unknown> {
  const today = new Date();
  const calendarYear = today.getFullYear() - 1; // Schedule FA reports prior calendar year

  const totalPortfolioValueINR = HOLDINGS.reduce(
    (s, h) => s + h.currentNAVUSD * h.quantity * USD_TO_INR, 0
  );
  const totalCostINR = HOLDINGS.reduce(
    (s, h) => s + h.avgCostUSD * h.quantity * USD_TO_INR, 0
  );

  // Peak balance estimate: cost basis + 10% (approximate mid-year peak)
  const peakBalanceINR = totalCostINR * 1.1;

  // Estimated income earned (dividends/interest — minimal for growth funds)
  const estimatedIncomeINR = totalPortfolioValueINR * 0.005; // ~0.5% income yield

  return {
    type: "schedule_fa_draft" as const,
    reportingCalendarYear: calendarYear,
    itrFormNeeded: "ITR-2 or ITR-3",
    filingDeadline: "July 31 of Assessment Year",
    accounts: [
      {
        slNo: "A1",
        country: "India (IFSC — treated as foreign asset under FEMA)",
        institution: "Valura GIFT City IFSC",
        accountType: "IFSC Fund Units / Investment Account",
        accountNumber: "IFSC-2025-MEHTA-001",
        openingBalanceINR: Math.round(totalCostINR),
        peakBalanceINR: Math.round(peakBalanceINR),
        closingBalanceINR: Math.round(totalPortfolioValueINR),
        incomeEarnedINR: Math.round(estimatedIncomeINR),
        taxableInIndia: "Subject to slab rate (Resident Indians) — see Schedule FSI",
      },
    ],
    holdingSummary: HOLDINGS.map((h) => ({
      name: h.name,
      isin: h.isin,
      quantityUnits: h.quantity,
      costINR: Math.round(h.avgCostUSD * h.quantity * USD_TO_INR),
      marketValueINR: Math.round(h.currentNAVUSD * h.quantity * USD_TO_INR),
    })),
    blackMoneyActNote:
      "Failure to disclose GIFT City IFSC holdings in Schedule FA = ₹10 lakh penalty per year under Section 42 of the Black Money (Undisclosed Foreign Income and Assets) Act, 2015.",
    complianceChecklist: [
      "File in ITR-2 (salaried/capital gains) or ITR-3 (business income) — NOT ITR-1",
      "Also fill Schedule FSI (Foreign Source Income) and Schedule TR (Tax Relief)",
      "File Form 67 by March 31 of Assessment Year to claim FTC on any foreign WHT",
      "Match Schedule FA entries with Form 26AS and AIS data",
    ],
    valuraNote: "Valura auto-generates your Schedule FA data — download from the Compliance section before July 31.",
  };
}

function execGetFYCountdown(): Record<string, unknown> {
  const today = new Date();
  const fyEnd = new Date(today.getFullYear(), 2, 31); // March 31 current year
  if (today > fyEnd) fyEnd.setFullYear(fyEnd.getFullYear() + 1);

  const daysLeft = Math.ceil((fyEnd.getTime() - today.getTime()) / 86_400_000);

  // Last TLH date: March 28 (T+2 means trade on 28th, settles by 31st)
  const lastTLHDate = new Date(fyEnd);
  lastTLHDate.setDate(28);

  // Advance tax installments (FY 2025-26)
  const advanceTaxDates = [
    { date: new Date(2025, 5, 15), pct: 15, label: "June 15" },
    { date: new Date(2025, 8, 15), pct: 45, label: "September 15" },
    { date: new Date(2025, 11, 15), pct: 75, label: "December 15" },
    { date: new Date(2026, 2, 15), pct: 100, label: "March 15" },
  ];

  const nextAT = advanceTaxDates.find((d) => d.date > today) ?? advanceTaxDates[advanceTaxDates.length - 1];

  const urgencyLevel: "critical" | "high" | "medium" =
    daysLeft <= 10 ? "critical" : daysLeft <= 30 ? "high" : "medium";

  return {
    type: "fy_countdown" as const,
    today: today.toISOString().split("T")[0],
    fyEndDate: fyEnd.toISOString().split("T")[0],
    daysLeft,
    lastTLHDate: `${lastTLHDate.toISOString().split("T")[0]} (T+2 settlement — trade by this date to settle before March 31)`,
    nextAdvanceTaxDate: nextAT.label,
    nextAdvanceTaxPct: nextAT.pct,
    urgencyLevel,
    keyDeadlines: [
      { event: "Last TLH trade date", date: "March 28, 2026", daysAway: Math.ceil((lastTLHDate.getTime() - today.getTime()) / 86_400_000) },
      { event: "FY 2025-26 ends", date: "March 31, 2026", daysAway: daysLeft },
      { event: "Advance tax final installment", date: "March 15, 2026", daysAway: Math.ceil((new Date(2026, 2, 15).getTime() - today.getTime()) / 86_400_000) },
      { event: "ITR filing deadline", date: "July 31, 2026", daysAway: Math.ceil((new Date(2026, 6, 31).getTime() - today.getTime()) / 86_400_000) },
    ],
  };
}

// ─── Tool dispatch ────────────────────────────────────────────────────────

function executeTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case "calculate_tcs":
      return execCalculateTCS(args as Parameters<typeof execCalculateTCS>[0]);
    case "calculate_capital_gains":
      return execCalculateCapitalGains(args as Parameters<typeof execCalculateCapitalGains>[0]);
    case "optimize_family_tcs":
      return execOptimizeFamilyTCS(args as Parameters<typeof execOptimizeFamilyTCS>[0]);
    case "get_tlh_opportunities":
      return execGetTLHOpportunities(args as Parameters<typeof execGetTLHOpportunities>[0]);
    case "get_tax_rates":
      return execGetTaxRates(args as Parameters<typeof execGetTaxRates>[0]);
    case "run_fy_audit":
      return execRunFYAudit();
    case "compare_scenarios":
      return execCompareScenarios(args as Parameters<typeof execCompareScenarios>[0]);
    case "build_schedule_fa_data":
      return execBuildScheduleFAData();
    case "get_fy_countdown":
      return execGetFYCountdown();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────

const TODAY_ISO = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `You are Valura's AI Tax Advisor — an autonomous agent, not a chatbot. You have access to the user's actual portfolio, real calculation tools, and India's regulatory knowledge base.

CRITICAL RULES:
1. ALWAYS call tools to get real numbers. Never estimate, guess, or use example figures.
2. When asked a multi-part question, call ALL relevant tools before responding — do not ask clarifying questions first.
3. Today's date is ${TODAY_ISO}. FY 2025-26 ends March 31, 2026. Always factor in FY urgency.
4. Your output must contain: (a) the exact calculation with real numbers from tools, (b) one clear recommendation in bold, (c) a specific next action with a deadline.
5. Show comparison tables whenever two scenarios exist. Never just explain one option.
6. Every response ends with: what to do TODAY, what to do THIS WEEK, what to do BEFORE MARCH 31.

TAX RULES (FY 2025-26, Finance Act 2025):
- LTCG: 12.5% flat after 730 days, surcharge capped 15%, effective max 14.95%
- STCG: slab rate up to 30%, surcharge uncapped, effective max 42.74% (old regime >5Cr)
- TCS: 0% up to ₹10L per PAN per FY, 20% above for investment remittances
- No wash-sale rule in India — sell and immediately rebuy is legal and optimal for TLH
- STCL offsets STCG AND LTCG. LTCL offsets LTCG only. 8-year carry-forward.
- TCS credits offset advance tax installments (Jun 15, Sep 15, Dec 15, Mar 15)
- Schedule FA: GIFT City holdings = foreign assets under FEMA. ₹10L/year penalty if missed.

AGENTIC BEHAVIOR — call tools automatically, without asking first:
- "audit my taxes" / "full picture" / "what should I do" → call run_fy_audit, then generate ranked action plan
- "should I sell [holding]" / "sell now or wait" → call compare_scenarios (sell-now vs wait-for-LTCG)
- "optimize my LRS" / "family TCS" → call get_fy_countdown then optimize_family_tcs
- "what should I do before March 31" → call get_fy_countdown + run_tlh_scan + run_fy_audit
- any holding + "harvest?" → call run_tlh_scan + calculate_capital_gains, give yes/no with exact numbers
- "Schedule FA" / "ITR disclosure" / "foreign assets" → call build_schedule_fa_data
- any timing question → call get_fy_countdown first

TOOLS:
- calculate_tcs: TCS on any LRS remittance
- calculate_capital_gains: STCG/LTCG tax on a specific trade
- optimize_family_tcs: Optimal LRS split across family
- get_tlh_opportunities: Live TLH scan from portfolio
- get_tax_rates: Effective rates for income bracket
- run_fy_audit: Full FY audit — runs ALL tools, returns ranked action plan
- compare_scenarios: Side-by-side sell-now vs wait comparison
- build_schedule_fa_data: Schedule FA draft for ITR-2/ITR-3
- get_fy_countdown: FY deadlines, advance tax dates, urgency level

RESPONSE FORMAT:
- Lead with the key number in bold
- Show comparison table if two scenarios exist
- One clear recommendation in bold
- End every response with three bullets: **Today:** / **This week:** / **Before March 31:**
- Final line: *For specific advice, consult a qualified CA.*`;

// ─── SSE helpers ─────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ─── Route Handler ────────────────────────────────────────────────────────

interface ProfileContext {
  incomeBracket: string;
  incomeBracketLabel: string;
  investorType: string;
  taxRegime: string;
  familyMembersCount: number;
  incomeAbove5Cr: boolean;
}

export async function POST(req: NextRequest) {
  const { messages, query, profile, calcContext } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    query: string;
    profile?: ProfileContext;
    calcContext?: string;
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(sseEvent(data)));

      try {
        // ── Step 1: RAG Search ──────────────────────────────────────────
        send({ type: "status", message: "Searching regulations…" });
        let ragContext = "";
        const sources: string[] = [];

        if (VECTOR_STORE_ID) {
          try {
            const results = await openai.vectorStores.search(VECTOR_STORE_ID, {
              query,
              max_num_results: 5,
              rewrite_query: true,
            });
            if (results.data.length > 0) {
              ragContext = results.data
                .map((r) => `<source file="${r.filename}" score="${r.score.toFixed(2)}">\n${r.content.map((c) => c.text).join("\n")}\n</source>`)
                .join("\n\n");
              results.data.forEach((r) => {
                if (!sources.includes(r.filename)) sources.push(r.filename);
              });
            }
          } catch { /* continue without RAG */ }
        }

        // ── Step 2: First call — detect tool needs ──────────────────────
        send({ type: "status", message: "Thinking…" });

        const profileSection = profile
          ? `\n\nUSER PROFILE (pre-loaded — do not ask for these details again):\n` +
            `- Income bracket: ${profile.incomeBracketLabel} (${profile.incomeBracket})\n` +
            `- Investor type: ${profile.investorType}\n` +
            `- Tax regime: ${profile.taxRegime} regime\n` +
            `- Family members investing: ${profile.familyMembersCount}\n` +
            `- Income above ₹5 Cr: ${profile.incomeAbove5Cr ? "Yes" : "No"}\n` +
            `Use these values directly in any calculations or explanations. Acknowledge the profile silently — no need to repeat it back to the user.`
          : "";

        const calcContextSection = calcContext
          ? `\n\nCALCULATOR CONTEXT (user's current calculation — answer relative to these exact numbers):\n${calcContext}`
          : "";

        const systemWithRAG = SYSTEM_PROMPT + profileSection + calcContextSection + (ragContext
          ? `\n\nRELEVANT REGULATORY CONTEXT (from knowledge base):\n${ragContext}`
          : "");

        const firstResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemWithRAG },
            ...messages,
          ],
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.15,
        });

        const assistantMsg = firstResponse.choices[0].message;
        const toolCalls = assistantMsg.tool_calls ?? [];
        const widgets: Record<string, unknown>[] = [];

        // ── Step 3: Execute tool calls ──────────────────────────────────
        const toolResults: { role: "tool"; tool_call_id: string; content: string }[] = [];

        for (const toolCall of toolCalls) {
          send({ type: "tool_start", tool: toolCall.function.name });

          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          const result = executeTool(toolCall.function.name, args);

          widgets.push(result);
          send({ type: "widget", widget: result });

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });

          send({ type: "tool_done", tool: toolCall.function.name });
        }

        // ── Step 4: Final synthesis (streaming) ─────────────────────────
        send({ type: "text_start" });

        const conversationWithTools = [
          { role: "system" as const, content: systemWithRAG },
          ...messages,
          ...(toolCalls.length > 0 ? [
            { role: "assistant" as const, content: null, tool_calls: toolCalls } as OpenAI.Chat.Completions.ChatCompletionMessageParam,
            ...toolResults as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          ] : []),
        ];

        // If no tool calls at all, still produce text from the first response
        if (toolCalls.length === 0 && assistantMsg.content) {
          send({ type: "text_chunk", content: assistantMsg.content });
          send({ type: "done", sources, widgetCount: 0 });
          controller.close();
          return;
        }

        const finalStream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: conversationWithTools,
          stream: true,
          temperature: 0.15,
          max_tokens: 800,
        });

        for await (const chunk of finalStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) send({ type: "text_chunk", content: delta });
        }

        send({ type: "done", sources, widgetCount: widgets.length });
        controller.close();
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
