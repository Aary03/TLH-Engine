/**
 * Realistic mock data for Indian HNI investor family
 * Portfolio: ~₹4.2Cr across GIFT City IFSC funds
 * Scenario designed to showcase TLH opportunities clearly
 */

export const USD_TO_INR = 83.5;
export const TODAY = new Date("2026-03-11");

// ─── Family Members ───────────────────────────────────────────────────────

export const FAMILY_MEMBERS = [
  {
    id: "rajesh",
    name: "Rajesh Mehta",
    relationship: "Self",
    fyRemittedINR: 9_200_000,   // ₹92L — well above ₹10L threshold
    fyRemittedUSD: 110_180,
    tcsDeducted: 1_640_000,     // ₹16.4L TCS: (92-10) × 20%
    lrsLimitUSD: 250_000,
    remainingLimitUSD: 139_820,
  },
  {
    id: "priya",
    name: "Priya Mehta",
    relationship: "Spouse",
    fyRemittedINR: 8_500_000,   // ₹85L — above ₹10L threshold
    fyRemittedUSD: 101_796,
    tcsDeducted: 1_500_000,     // ₹15L TCS: (85-10) × 20%
    lrsLimitUSD: 250_000,
    remainingLimitUSD: 148_204,
  },
  {
    id: "vikram",
    name: "Vikram Mehta",
    relationship: "Son (Adult)",
    fyRemittedINR: 2_800_000,   // ₹28L — above ₹10L threshold
    fyRemittedUSD: 33_533,
    tcsDeducted: 360_000,       // ₹3.6L TCS: (28-10) × 20%
    lrsLimitUSD: 250_000,
    remainingLimitUSD: 216_467,
  },
];

// ─── Portfolio Holdings ───────────────────────────────────────────────────

export interface Holding {
  id: string;
  name: string;
  symbol: string;
  amc: string;
  quantity: number;
  avgCostUSD: number;
  currentNAVUSD: number;
  purchaseDate: string;
  isGiftCity: boolean;
  currency: string;
  isin: string;
}

export const HOLDINGS: Holding[] = [
  {
    id: "h1",
    name: "PPFAS Flexi Cap Fund - IFSC Series",
    symbol: "PPFAS-IFSC",
    amc: "PPFAS AMC",
    quantity: 1_200,
    avgCostUSD: 145.50,
    currentNAVUSD: 172.30,
    purchaseDate: "2023-06-15",   // 999 days ago — LTCG territory ✓
    isGiftCity: true,
    currency: "USD",
    isin: "INF209KB1GC4",
  },
  {
    id: "h2",
    name: "Nippon India Global Innovation IFSC",
    symbol: "NIPPON-GLOBAL-IFSC",
    amc: "Nippon India MF",
    quantity: 2_800,
    avgCostUSD: 28.50,
    currentNAVUSD: 34.20,
    purchaseDate: "2022-09-20",   // >730 days — LTCG territory ✓
    isGiftCity: true,
    currency: "USD",
    isin: "INF204KC1GE8",
  },
  {
    id: "h3",
    name: "Tata S&P 500 Index ETF - IFSC",
    symbol: "TATA-SP500",
    amc: "Tata MF",
    quantity: 850,
    avgCostUSD: 218.00,
    currentNAVUSD: 196.50,     // ⬇ LOSS — TLH opportunity
    purchaseDate: "2025-04-10", // ~335 days — STCL
    isGiftCity: true,
    currency: "USD",
    isin: "INF277K01GH5",
  },
  {
    id: "h4",
    name: "Mirae Asset Global Leaders IFSC",
    symbol: "MIRAE-GLOBAL",
    amc: "Mirae Asset MF",
    quantity: 2_200,
    avgCostUSD: 88.75,
    currentNAVUSD: 71.20,      // ⬇ LOSS — TLH opportunity
    purchaseDate: "2025-05-22", // ~293 days — STCL
    isGiftCity: true,
    currency: "USD",
    isin: "INF769K01GT9",
  },
  {
    id: "h5",
    name: "Axis NASDAQ 100 IFSC ETF",
    symbol: "AXIS-NASDAQ",
    amc: "Axis MF",
    quantity: 600,
    avgCostUSD: 335.00,
    currentNAVUSD: 292.40,     // ⬇ LOSS — TLH opportunity
    purchaseDate: "2025-07-14", // ~240 days — STCL
    isGiftCity: true,
    currency: "USD",
    isin: "INF846K01GN3",
  },
  {
    id: "h6",
    name: "DSP BlackRock World Gold IFSC",
    symbol: "DSP-GOLD",
    amc: "DSP MF",
    quantity: 1_800,
    avgCostUSD: 44.80,
    currentNAVUSD: 37.60,      // ⬇ LOSS — TLH opportunity
    purchaseDate: "2025-08-03", // ~220 days — STCL
    isGiftCity: true,
    currency: "USD",
    isin: "INF740K01GQ7",
  },
  {
    id: "h7",
    name: "SBI International Equity IFSC",
    symbol: "SBI-INTL",
    amc: "SBI MF",
    quantity: 3_500,
    avgCostUSD: 22.40,
    currentNAVUSD: 26.80,
    purchaseDate: "2024-02-18", // ~386 days — STCG (approaching LTCG at 730 days)
    isGiftCity: true,
    currency: "USD",
    isin: "INF200K01GF6",
  },
];

// ─── Derived calculations ─────────────────────────────────────────────────

export function getHoldingDays(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  return Math.floor((TODAY.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUnrealizedPnL(h: Holding) {
  const pnlUSD = (h.currentNAVUSD - h.avgCostUSD) * h.quantity;
  return {
    pnlUSD,
    pnlINR: pnlUSD * USD_TO_INR,
    pnlPercent: ((h.currentNAVUSD - h.avgCostUSD) / h.avgCostUSD) * 100,
    isLoss: pnlUSD < 0,
  };
}

export function getPortfolioSummary() {
  let totalValueINR = 0;
  let totalCostINR = 0;
  let totalGainINR = 0;
  let totalLossINR = 0;

  for (const h of HOLDINGS) {
    const valueINR = h.currentNAVUSD * h.quantity * USD_TO_INR;
    const costINR = h.avgCostUSD * h.quantity * USD_TO_INR;
    const pnl = getUnrealizedPnL(h);

    totalValueINR += valueINR;
    totalCostINR += costINR;

    if (pnl.isLoss) {
      totalLossINR += Math.abs(pnl.pnlINR);
    } else {
      totalGainINR += pnl.pnlINR;
    }
  }

  return {
    totalValueINR,
    totalCostINR,
    totalPnLINR: totalValueINR - totalCostINR,
    totalGainINR,
    totalLossINR,
    totalPnLPercent: ((totalValueINR - totalCostINR) / totalCostINR) * 100,
    holdingCount: HOLDINGS.length,
  };
}

// ─── LRS Summary ──────────────────────────────────────────────────────────

export const LRS_SUMMARY = {
  familyTotalRemittedINR: FAMILY_MEMBERS.reduce((s, m) => s + m.fyRemittedINR, 0),
  familyTotalTCS: FAMILY_MEMBERS.reduce((s, m) => s + m.tcsDeducted, 0),
  familyTotalRemittedUSD: FAMILY_MEMBERS.reduce((s, m) => s + m.fyRemittedUSD, 0),
  financialYear: "FY 2025-26",
  exchangeRate: USD_TO_INR,
};

// ─── Loss carry-forward ───────────────────────────────────────────────────

export const LOSS_CARRY_FORWARDS = [
  {
    id: "lcf1",
    assessmentYear: "AY 2024-25",
    lossType: "STCL" as const,
    originalAmount: 4_200_000,  // ₹42L
    utilized: 1_800_000,        // ₹18L utilized
    remaining: 2_400_000,       // ₹24L remaining
    expiryYear: "AY 2032-33",
    daysUntilExpiry: 365 * 7,
  },
  {
    id: "lcf2",
    assessmentYear: "AY 2023-24",
    lossType: "LTCL" as const,
    originalAmount: 1_500_000,  // ₹15L
    utilized: 0,
    remaining: 1_500_000,
    expiryYear: "AY 2031-32",
    daysUntilExpiry: 365 * 6,
  },
];

// ─── Compliance deadlines ─────────────────────────────────────────────────

export const COMPLIANCE_DEADLINES = [
  {
    id: "d1",
    label: "FY End — Last TLH Window",
    date: new Date("2026-03-31"),
    description: "Final opportunity to book losses before FY 2025-26 closes",
    urgency: "critical" as const,
    type: "tlh",
  },
  {
    id: "d2",
    label: "Advance Tax (Q4)",
    date: new Date("2026-03-15"),
    description: "15% of tax liability due. Offset TCS against advance tax.",
    urgency: "high" as const,
    type: "tax",
  },
  {
    id: "d3",
    label: "ITR Filing Deadline",
    date: new Date("2026-07-31"),
    description: "File on time to preserve loss carry-forward rights",
    urgency: "high" as const,
    type: "compliance",
  },
  {
    id: "d4",
    label: "Form 67 (FTC Claim)",
    date: new Date("2027-03-31"),
    description: "File Form 67 by end of AY 2026-27 to claim foreign tax credits",
    urgency: "medium" as const,
    type: "compliance",
  },
];
