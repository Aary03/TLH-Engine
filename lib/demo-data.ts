// ─── Valura Demo Client Data ─────────────────────────────────────────────────
// Fictional HNI client: Rajesh Kumar. All numbers are pre-calculated and
// consistent. Do NOT edit individual figures without recalculating dependents.

export interface PortfolioItem {
  ticker: string;
  name: string;
  units: number;
  buyPrice: number;       // USD
  currentPrice: number;   // USD
  holdingMonths: number;
  type: "LTCG" | "STCL" | "STCG";
  unrealizedGainUSD?: number;
  unrealizedGainINR?: number;
  unrealizedLossUSD?: number;
  unrealizedLossINR?: number;
  harvestable?: boolean;
  taxSavedIfHarvested?: number;  // INR
  taxRate?: number;
  taxPayable?: number;           // INR
  waitingGameDays?: number;
  taxIfSellNow?: number;         // INR
  taxIfWait?: number;            // INR
  savingByWaiting?: number;      // INR
}

export const DEMO_CLIENT = {
  profile: {
    name: "Rajesh Kumar",
    city: "New Delhi",
    annualIncome: 12_000_000,       // ₹1.2 Cr
    incomeBracket: "above-5cr-equivalent",
    pan: "AAAPK7890Q",
    age: 52,
    regime: "old",
    wifeName: "Priya Kumar",
  },

  lrs: {
    remittedByRajesh: 8_000_000,    // ₹80 lakh
    remittedByWife: 0,              // Priya — untouched
    purpose: "investment",
    tcsThreshold: 1_000_000,        // ₹10L per PAN
    tcsRate: 0.20,
    rajeshTcsable: 7_000_000,       // ₹80L − ₹10L
    rajeshTcs: 1_400_000,           // ₹14L deducted
    wifeCapacity: 1_000_000,        // ₹10L available at ₹0 TCS
    tcsAfterOptimization: 0,
    savingFromOptimization: 1_400_000,
    irrDragMonths: 8,
    irrDragAmount: 112_000,         // ₹1.12L lost returns (12% on ₹14L × 8/12)
  },

  portfolio: [
    {
      ticker: "AAPL",
      name: "Apple Inc",
      units: 45,
      buyPrice: 165,
      currentPrice: 189,
      holdingMonths: 28,
      type: "LTCG" as const,
      unrealizedGainUSD: 1_080,
      unrealizedGainINR: 91_260,
      harvestable: false,
      taxRate: 0.1495,
      taxPayable: 13_643,
    },
    {
      ticker: "TSLA",
      name: "Tesla Inc",
      units: 30,
      buyPrice: 280,
      currentPrice: 178,
      holdingMonths: 14,
      type: "STCL" as const,
      unrealizedLossUSD: -3_060,
      unrealizedLossINR: -258_570,
      harvestable: true,
      taxSavedIfHarvested: 110_413,
    },
    {
      ticker: "SPY",
      name: "SPDR S&P 500 ETF",
      units: 20,
      buyPrice: 460,
      currentPrice: 538,
      holdingMonths: 30,
      type: "LTCG" as const,
      unrealizedGainUSD: 1_560,
      unrealizedGainINR: 131_820,
      harvestable: false,
      taxRate: 0.1495,
      taxPayable: 19_707,
    },
    {
      ticker: "NVDA",
      name: "NVIDIA Corp",
      units: 22,
      buyPrice: 485,
      currentPrice: 116,
      holdingMonths: 9,
      type: "STCL" as const,
      unrealizedLossUSD: -8_118,
      unrealizedLossINR: -685_971,
      harvestable: true,
      taxSavedIfHarvested: 293_129,
    },
    {
      ticker: "MSFT",
      name: "Microsoft Corp",
      units: 25,
      buyPrice: 380,
      currentPrice: 415,
      holdingMonths: 19,
      type: "STCG" as const,
      unrealizedGainUSD: 875,
      unrealizedGainINR: 73_937,
      harvestable: false,
      waitingGameDays: 150,
      taxIfSellNow: 31_588,
      taxIfWait: 11_053,
      savingByWaiting: 20_535,
    },
    {
      ticker: "GOOGL",
      name: "Alphabet Inc",
      units: 12,
      buyPrice: 178,
      currentPrice: 154,
      holdingMonths: 11,
      type: "STCL" as const,
      unrealizedLossUSD: -288,
      unrealizedLossINR: -24_336,
      harvestable: true,
      taxSavedIfHarvested: 10_399,
    },
  ] as PortfolioItem[],

  tlh: {
    totalHarvestableSTCL_INR: 968_877,  // TSLA + NVDA + GOOGL losses
    totalTaxSaved: 413_941,              // ₹4.13L total
    topPicksByValue: ["NVDA", "TSLA", "GOOGL"],
  },

  capitalGains: {
    totalLTCG_INR: 223_080,             // AAPL + SPY gains
    totalSTCG_INR: 73_937,              // MSFT if sold now
    ltcgTax: 33_350,
    stcgTax: 31_588,
    totalTaxBeforeTLH: 64_938,
    totalTaxAfterTLH: 0,
    netTaxSavingFromTLH: 413_941,
  },

  summary: {
    tcsSaved: 1_400_000,
    tlhTaxSaved: 413_941,
    irrRecovered: 112_000,
    totalValueCreated: 1_925_941,       // TCS + TLH + IRR
  },

  ai: {
    question:
      "My client Rajesh Kumar — ₹80L remitted, 6 global holdings including big unrealized losses in NVDA and TSLA. FY ends in 8 days. What should I do right now to minimize his tax bill?",
    userMessage:
      "Rajesh Kumar's situation: ₹80L LRS this FY, ₹14L TCS deducted at 20%. Portfolio: NVDA (22 units, bought $485, now $116, held 9 months — STCL ₹6.86L), TSLA (30 units, bought $280, now $178, held 14 months — STCL ₹2.59L), GOOGL (12 units, bought $178, now $154, held 11 months — STCL ₹0.24L), AAPL (45 units, bought $165, now $189, held 28 months — LTCG ₹0.91L), SPY (20 units, bought $460, now $538, held 30 months — LTCG ₹1.32L), MSFT (25 units, bought $380, now $415, held 19 months — STCG ₹0.74L, 150 days to LTCG). Annual income ₹1.2Cr old regime. FY ends in 8 days. What should he do RIGHT NOW? Give 3 numbered actions with exact tax savings.",
  },
} as const;
