/**
 * Dummy client portfolios for the Voguestock × Valura partner demo.
 * Extensive mix of US stocks, ETFs and funds. All figures illustrative.
 */
export const USD_INR = 83.5;
export const FY_LABEL = "FY 2025-26 (1 Apr 2025 – 31 Mar 2026)";
export const FY_START = "2025-04-01";
export const FY_END = "2026-03-31";

export type AssetType = "Stock" | "ETF" | "Fund";

export interface Holding {
  security: string; ticker: string; type: AssetType; isin: string;
  qty: number; buyUSD: number; curUSD: number; buyDate: string;
}
export interface Sale {
  security: string; ticker: string; type: AssetType; isin: string;
  qty: number; buyUSD: number; sellUSD: number; buyDate: string; sellDate: string;
}
export interface Dividend {
  security: string; ticker: string; grossUSD: number; usTaxUSD: number; date: string;
}
export interface Client {
  id: string; name: string; pan: string; usId: string; email: string; since: string;
  holdings: Holding[]; sales: Sale[]; dividends: Dividend[];
}

const H = (security: string, ticker: string, type: AssetType, isin: string, qty: number, buyUSD: number, curUSD: number, buyDate: string): Holding =>
  ({ security, ticker, type, isin, qty, buyUSD, curUSD, buyDate });
const S = (security: string, ticker: string, type: AssetType, isin: string, qty: number, buyUSD: number, sellUSD: number, buyDate: string, sellDate: string): Sale =>
  ({ security, ticker, type, isin, qty, buyUSD, sellUSD, buyDate, sellDate });
const D = (security: string, ticker: string, grossUSD: number, usTaxUSD: number, date: string): Dividend =>
  ({ security, ticker, grossUSD, usTaxUSD, date });

export const CLIENTS: Client[] = [
  {
    id: "aarav", name: "Aarav Mehta", pan: "ABCPM4521F", usId: "Passport Z3456789", email: "aarav.mehta@email.com", since: "Jun 2023",
    holdings: [
      H("Apple Inc.", "AAPL", "Stock", "US0378331005", 120, 148.20, 211.40, "2023-08-12"),
      H("Microsoft Corp.", "MSFT", "Stock", "US5949181045", 60, 305.50, 438.10, "2022-11-05"),
      H("Alphabet Inc. Class A", "GOOGL", "Stock", "US02079K3059", 80, 122.40, 178.90, "2023-04-18"),
      H("Amazon.com Inc.", "AMZN", "Stock", "US0231351067", 70, 128.30, 197.60, "2023-09-25"),
      H("NVIDIA Corp.", "NVDA", "Stock", "US67066G1040", 40, 210.00, 905.00, "2023-05-10"),
      H("Meta Platforms Inc.", "META", "Stock", "US30303M1027", 25, 285.00, 612.40, "2023-10-02"),
      H("Eli Lilly & Co.", "LLY", "Stock", "US5324571083", 18, 540.00, 798.20, "2024-01-22"),
      H("Visa Inc. Class A", "V", "Stock", "US92826C8394", 55, 232.00, 289.70, "2023-07-14"),
      H("Berkshire Hathaway Cl B", "BRK.B", "Stock", "US0846707026", 45, 312.00, 468.00, "2022-10-12"),
      H("Broadcom Inc.", "AVGO", "Stock", "US11135F1012", 30, 88.50, 178.40, "2024-03-05"),
      H("Vanguard S&P 500 ETF", "VOO", "ETF", "US9229083632", 65, 382.00, 512.30, "2023-02-20"),
      H("Invesco QQQ Trust", "QQQ", "ETF", "US46090E1038", 50, 352.10, 498.70, "2024-01-15"),
      H("Vanguard Total Stock Mkt ETF", "VTI", "ETF", "US9229087690", 40, 205.40, 276.10, "2023-03-30"),
      H("Schwab US Dividend ETF", "SCHD", "ETF", "US8085246080", 150, 72.10, 78.90, "2023-07-22"),
      H("SPDR Gold Shares", "GLD", "ETF", "US78463V1070", 35, 182.00, 246.50, "2024-02-10"),
      H("iShares Core MSCI EM ETF", "IEMG", "ETF", "US46434G1031", 90, 51.20, 58.60, "2024-05-02"),
      H("Parag Parikh US FoF", "PPFAS-US", "Fund", "INF879O01027", 2000, 14.20, 16.80, "2023-06-15"),
      H("Motilal Oswal Nasdaq 100 FoF", "MO-N100", "Fund", "INF247L01536", 5000, 0.32, 0.41, "2024-01-20"),
      H("Edelweiss US Technology FoF", "EDEL-UST", "Fund", "INF843K01EH9", 3000, 1.05, 1.62, "2023-11-08"),
    ],
    sales: [
      S("NVIDIA Corp.", "NVDA", "Stock", "US67066G1040", 15, 188.00, 905.00, "2023-03-10", "2025-12-20"),
      S("Amazon.com Inc.", "AMZN", "Stock", "US0231351067", 20, 131.00, 184.50, "2025-02-01", "2025-11-15"),
      S("Tesla Inc.", "TSLA", "Stock", "US88160R1014", 25, 242.00, 188.00, "2025-05-01", "2026-01-10"),
      S("Meta Platforms Inc.", "META", "Stock", "US30303M1027", 12, 318.00, 602.00, "2024-04-05", "2025-10-08"),
      S("Netflix Inc.", "NFLX", "Stock", "US64110L1061", 8, 612.00, 489.00, "2025-06-14", "2026-02-02"),
      S("Advanced Micro Devices", "AMD", "Stock", "US0079031078", 30, 168.00, 142.00, "2025-04-20", "2025-12-01"),
      S("Costco Wholesale", "COST", "Stock", "US22160K1051", 6, 548.00, 892.00, "2023-01-18", "2025-09-12"),
      S("Vanguard FTSE All-World ETF", "VWRA", "ETF", "IE00BK5BQT80", 40, 98.00, 132.50, "2024-02-14", "2025-12-18"),
      S("UnitedHealth Group", "UNH", "Stock", "US91324P1021", 10, 488.00, 521.00, "2025-03-25", "2025-10-30"),
      S("Adobe Inc.", "ADBE", "Stock", "US00724F1012", 14, 612.00, 548.00, "2025-07-08", "2026-01-28"),
      S("JPMorgan Chase & Co.", "JPM", "Stock", "US46625H1005", 25, 138.00, 246.00, "2022-12-01", "2025-09-30"),
      S("Coca-Cola Co.", "KO", "Stock", "US1912161007", 60, 58.20, 71.40, "2023-08-30", "2026-02-20"),
    ],
    dividends: [
      D("Apple Inc.", "AAPL", 28.80, 7.20, "2025-05-15"),
      D("Apple Inc.", "AAPL", 28.80, 7.20, "2025-08-14"),
      D("Apple Inc.", "AAPL", 30.00, 7.50, "2025-11-13"),
      D("Microsoft Corp.", "MSFT", 45.00, 11.25, "2025-06-12"),
      D("Microsoft Corp.", "MSFT", 45.00, 11.25, "2025-09-11"),
      D("Microsoft Corp.", "MSFT", 49.80, 12.45, "2025-12-11"),
      D("Visa Inc. Class A", "V", 29.15, 7.29, "2025-09-02"),
      D("Vanguard S&P 500 ETF", "VOO", 142.00, 35.50, "2025-06-28"),
      D("Vanguard S&P 500 ETF", "VOO", 148.70, 37.18, "2025-12-29"),
      D("Schwab US Dividend ETF", "SCHD", 187.50, 46.88, "2025-09-25"),
      D("Schwab US Dividend ETF", "SCHD", 198.00, 49.50, "2025-12-22"),
      D("Invesco QQQ Trust", "QQQ", 84.00, 21.00, "2025-12-22"),
      D("Berkshire Hathaway Cl B", "BRK.B", 0, 0, "2025-12-01"),
      D("iShares Core MSCI EM ETF", "IEMG", 96.40, 24.10, "2025-12-18"),
    ],
  },
  {
    id: "priya", name: "Priya Nair", pan: "AKLPN7788Q", usId: "Passport N1122334", email: "priya.nair@email.com", since: "Jan 2024",
    holdings: [
      H("Alphabet Inc. Class A", "GOOGL", "Stock", "US02079K3059", 40, 122.40, 178.90, "2024-03-18"),
      H("Apple Inc.", "AAPL", "Stock", "US0378331005", 30, 165.00, 211.40, "2024-02-05"),
      H("ASML Holding ADR", "ASML", "Stock", "USN070592100", 12, 620.00, 892.00, "2024-04-12"),
      H("Mastercard Inc. Class A", "MA", "Stock", "US57636Q1040", 20, 398.00, 512.00, "2024-06-20"),
      H("iShares Core MSCI EM ETF", "IEMG", "ETF", "US46434G1031", 90, 51.20, 58.60, "2024-05-02"),
      H("SPDR Gold Shares", "GLD", "ETF", "US78463V1070", 35, 182.00, 246.50, "2024-02-10"),
      H("Vanguard S&P 500 ETF", "VOO", "ETF", "US9229083632", 25, 410.00, 512.30, "2024-07-01"),
      H("iShares MSCI India ETF", "INDA", "ETF", "US4642876043", 60, 48.50, 56.20, "2024-08-15"),
      H("Motilal Oswal Nasdaq 100 FoF", "MO-N100", "Fund", "INF247L01536", 5000, 0.32, 0.41, "2024-01-20"),
      H("Mirae Asset NYSE FANG+ FoF", "MIRAE-FANG", "Fund", "INF769K01EU5", 4000, 0.74, 1.18, "2024-03-10"),
    ],
    sales: [
      S("Meta Platforms Inc.", "META", "Stock", "US30303M1027", 12, 318.00, 602.00, "2024-04-05", "2025-10-08"),
      S("PayPal Holdings", "PYPL", "Stock", "US70450Y1038", 30, 68.00, 58.00, "2025-05-10", "2025-12-05"),
      S("Walt Disney Co.", "DIS", "Stock", "US2546871060", 18, 92.00, 112.00, "2024-09-01", "2026-01-15"),
    ],
    dividends: [
      D("iShares Core MSCI EM ETF", "IEMG", 48.20, 12.05, "2025-06-18"),
      D("iShares Core MSCI EM ETF", "IEMG", 48.20, 12.05, "2025-12-18"),
      D("Mastercard Inc. Class A", "MA", 13.20, 3.30, "2025-11-09"),
      D("Vanguard S&P 500 ETF", "VOO", 55.00, 13.75, "2025-12-29"),
    ],
  },
  {
    id: "rohan", name: "Rohan Kapoor", pan: "BNZPK1093L", usId: "Passport K9087654", email: "rohan.kapoor@email.com", since: "Sep 2022",
    holdings: [
      H("Berkshire Hathaway Cl B", "BRK.B", "Stock", "US0846707026", 50, 312.00, 468.00, "2022-10-12"),
      H("Johnson & Johnson", "JNJ", "Stock", "US4781601046", 40, 158.00, 162.40, "2022-11-20"),
      H("Procter & Gamble", "PG", "Stock", "US7427181091", 35, 142.00, 168.90, "2023-01-15"),
      H("Exxon Mobil Corp.", "XOM", "Stock", "US30231G1022", 60, 98.00, 118.60, "2023-03-08"),
      H("Vanguard Total World ETF", "VT", "ETF", "US9220427766", 120, 95.40, 124.80, "2023-01-09"),
      H("Schwab US Dividend ETF", "SCHD", "ETF", "US8085246080", 200, 72.10, 78.90, "2023-07-22"),
      H("Vanguard Real Estate ETF", "VNQ", "ETF", "US9229085538", 80, 84.20, 92.50, "2023-05-18"),
      H("iShares 20+ Yr Treasury ETF", "TLT", "ETF", "US4642874329", 100, 98.00, 91.20, "2023-09-12"),
      H("Vanguard FTSE Dev Mkts ETF", "VEA", "ETF", "US9219438580", 150, 44.10, 51.80, "2023-04-25"),
      H("DSP Global Allocation FoF", "DSP-GA", "Fund", "INF740K01PT8", 6000, 0.58, 0.69, "2023-02-28"),
      H("Franklin US Opportunities FoF", "FT-USO", "Fund", "INF090I01526", 4500, 1.12, 1.58, "2022-12-15"),
    ],
    sales: [
      S("JPMorgan Chase & Co.", "JPM", "Stock", "US46625H1005", 30, 138.00, 246.00, "2022-12-01", "2025-09-30"),
      S("Netflix Inc.", "NFLX", "Stock", "US64110L1061", 8, 612.00, 489.00, "2025-06-14", "2026-02-02"),
      S("Chevron Corp.", "CVX", "Stock", "US1667641005", 25, 152.00, 168.00, "2023-02-10", "2025-11-22"),
      S("Cisco Systems", "CSCO", "Stock", "US17275R1023", 80, 48.00, 58.40, "2024-01-30", "2026-01-08"),
      S("Intel Corp.", "INTC", "Stock", "US4581401001", 100, 42.00, 31.00, "2025-04-15", "2025-12-12"),
    ],
    dividends: [
      D("Schwab US Dividend ETF", "SCHD", 270.00, 67.50, "2025-09-25"),
      D("Schwab US Dividend ETF", "SCHD", 270.00, 67.50, "2025-12-22"),
      D("Vanguard Total World ETF", "VT", 134.40, 33.60, "2025-06-20"),
      D("Vanguard Total World ETF", "VT", 134.40, 33.60, "2025-12-20"),
      D("Johnson & Johnson", "JNJ", 47.60, 11.90, "2025-09-08"),
      D("Procter & Gamble", "PG", 35.20, 8.80, "2025-11-14"),
      D("Exxon Mobil Corp.", "XOM", 56.40, 14.10, "2025-12-10"),
    ],
  },
];

/* ── derived helpers ── */
export function holdingDays(buy: string, sell: string): number {
  return Math.floor((new Date(sell).getTime() - new Date(buy).getTime()) / 86_400_000);
}
export function isLongTerm(buy: string, sell: string): boolean {
  return holdingDays(buy, sell) > 730; // 24 months for foreign assets
}
export function inr(usd: number): number { return Math.round(usd * USD_INR); }
export function quarterOf(date: string): string {
  const m = new Date(date).getMonth(); // 0-11 ; FY starts Apr
  if (m >= 3 && m <= 5) return "Q1 (Apr–Jun)";
  if (m >= 6 && m <= 8) return "Q2 (Jul–Sep)";
  if (m >= 9 && m <= 11) return "Q3 (Oct–Dec)";
  return "Q4 (Jan–Mar)";
}

export function clientTotals(c: Client) {
  const stcgINR = c.sales.filter((s) => !isLongTerm(s.buyDate, s.sellDate))
    .reduce((t, s) => t + (s.sellUSD - s.buyUSD) * s.qty * USD_INR, 0);
  const ltcgINR = c.sales.filter((s) => isLongTerm(s.buyDate, s.sellDate))
    .reduce((t, s) => t + (s.sellUSD - s.buyUSD) * s.qty * USD_INR, 0);
  const divGrossINR = c.dividends.reduce((t, d) => t + d.grossUSD * USD_INR, 0);
  const usTaxINR = c.dividends.reduce((t, d) => t + d.usTaxUSD * USD_INR, 0);
  const holdingsValueINR = c.holdings.reduce((t, h) => t + h.curUSD * h.qty * USD_INR, 0);
  const holdingsCostINR = c.holdings.reduce((t, h) => t + h.buyUSD * h.qty * USD_INR, 0);
  return {
    stcgINR: Math.round(stcgINR), ltcgINR: Math.round(ltcgINR),
    capGainsINR: Math.round(stcgINR + ltcgINR),
    divGrossINR: Math.round(divGrossINR), usTaxINR: Math.round(usTaxINR),
    holdingsValueINR: Math.round(holdingsValueINR),
    holdingsCostINR: Math.round(holdingsCostINR),
    unrealisedINR: Math.round(holdingsValueINR - holdingsCostINR),
  };
}
