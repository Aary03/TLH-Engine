/**
 * Voguestock × Valura showcase — demo client buys a Voguestock UCITS fund,
 * holds, redeems, and every resident-Indian tax filing is solved.
 * All figures illustrative. Tax rules per Finance Act 2025 (FY 2025-26).
 */
export const USD_INR = 83.5;

export const SHOW_CLIENT = {
  name: "Aarav Mehta",
  pan: "ABCPM4521F",
  usId: "Passport Z3456789",
  residency: "Resident Indian",
  email: "aarav.mehta@email.com",
};

export const SHOW_FUND = {
  name: "Voguestock Global Equity UCITS Fund",
  short: "Voguestock Global Equity",
  isin: "IE00BNAR0L12",
  domicile: "Ireland (UCITS)",
  structure: "Accumulating",
  ter: 0.22,
  benchmark: "MSCI World Index",
};

export const SHOW = {
  investINR: 5_000_000,         // ₹50,00,000 deployed
  navBuyUSD: 52.40,
  buyDate: "2023-12-08",
  navSellUSD: 64.90,
  sellDate: "2026-02-15",        // ~26 months → long-term
  ltcgRate: 0.1495,              // 12.5% + 15% surcharge cap + 4% cess (HNI)
  fundYield: 0.016,              // ~1.6% dividend, accumulated inside the fund
  usWHTinFund: 0.15,             // US-Ireland treaty rate suffered inside the fund
  directUSDividendWHT: 0.25,     // what a direct US holding would suffer
};

export interface ShowMath {
  units: number;
  holdMonths: number;
  isLong: boolean;
  proceedsINR: number;
  gainINR: number;
  gainPct: number;
  taxINR: number;
  netINR: number;
  effRatePct: number;
  divReinvestedINR: number;     // dividends accumulated inside fund (not declarable)
  estateTaxSaved: number;       // illustrative US estate exposure avoided
}

export function computeShow(): ShowMath {
  const units = SHOW.investINR / USD_INR / SHOW.navBuyUSD;
  const proceedsINR = units * SHOW.navSellUSD * USD_INR;
  const gainINR = proceedsINR - SHOW.investINR;
  const taxINR = gainINR * SHOW.ltcgRate;
  const months = Math.round(
    (new Date(SHOW.sellDate).getTime() - new Date(SHOW.buyDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  // ~ dividends accumulated over the hold (illustrative, compounded simple)
  const years = months / 12;
  const divReinvestedINR = SHOW.investINR * SHOW.fundYield * years;
  return {
    units: Math.round(units),
    holdMonths: months,
    isLong: months > 24,
    proceedsINR: Math.round(proceedsINR),
    gainINR: Math.round(gainINR),
    gainPct: (SHOW.navSellUSD / SHOW.navBuyUSD - 1) * 100,
    taxINR: Math.round(taxINR),
    netINR: Math.round(proceedsINR - taxINR),
    effRatePct: SHOW.ltcgRate * 100,
    divReinvestedINR: Math.round(divReinvestedINR),
    estateTaxSaved: Math.round(proceedsINR * 0.4), // up to 40% had it been US-situs
  };
}

/** Indian short money format: ₹1.23 Cr / ₹4.56 L / ₹78,900 */
export function inrShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Every report a resident Indian touches for this holding, with status. */
export const FILING_CHECKLIST = [
  { doc: "Capital Gains — Tax P&L", status: "required", note: "Reports your ₹ gain, split STCG / LTCG." },
  { doc: "Schedule FA (Foreign Assets)", status: "required", note: "Mandatory disclosure of the holding — no minimum threshold." },
  { doc: "Schedule FSI (Foreign Source Income)", status: "required", note: "Reports the foreign capital gain in your ITR." },
  { doc: "Holdings Statement", status: "required", note: "Snapshot that feeds Schedule FA." },
  { doc: "Schedule TR (Tax Relief)", status: "not-needed", note: "No foreign tax in your hands to claim — nothing to relieve." },
  { doc: "Form 67 (Foreign Tax Credit)", status: "not-needed", note: "Accumulating fund — no dividend withheld from you, so no credit to claim." },
  { doc: "Dividend Report", status: "not-needed", note: "Accumulating: dividends reinvent inside the fund — nothing to declare in India." },
] as const;
