/**
 * Portfolio Data Layer
 * ─────────────────────────────────────────────────────────────────────────
 * ARCHITECTURE: All components consume this module, NOT the raw mock-data.
 *
 * CURRENT: localStorage (user inputs their own data in the Portfolio Manager).
 * FUTURE:  Replace `localStorageSource` with `apiSource` pointing to your
 *          broker/AMC integration. Zero changes needed in any other file.
 *
 * To switch to real data:
 *   Change the export at the bottom from `localStorageSource` to `apiSource`.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface Holding {
  id: string;
  name: string;
  symbol: string;
  amc: string;
  quantity: number;
  avgCostUSD: number;
  currentNAVUSD: number;
  purchaseDate: string; // ISO "YYYY-MM-DD"
  isGiftCity: boolean;
  currency: "USD" | "INR";
  notes?: string;
}

export interface InvestorProfile {
  name: string;
  incomeBracket: "up_to_50L" | "50L_to_1Cr" | "1Cr_to_2Cr" | "2Cr_to_5Cr" | "above_5Cr";
  taxRegime: "old" | "new";
  exchangeRate: number;
}

// ─── Interface (swap this for API calls later) ─────────────────────────────

export interface PortfolioDataSource {
  getHoldings(): Holding[];
  addHolding(h: Omit<Holding, "id">): Holding;
  updateHolding(id: string, patch: Partial<Holding>): void;
  removeHolding(id: string): void;
  getProfile(): InvestorProfile;
  setProfile(p: InvestorProfile): void;
  subscribe(cb: () => void): () => void; // returns unsubscribe
}

// ─── Sample data (loaded when user has no stored data) ─────────────────────

const COMMON_FUNDS = [
  { name: "PPFAS Flexi Cap Fund - IFSC", symbol: "PPFAS-IFSC", amc: "PPFAS AMC" },
  { name: "Tata S&P 500 Index ETF - IFSC", symbol: "TATA-SP500", amc: "Tata MF" },
  { name: "Mirae Asset Global Leaders IFSC", symbol: "MIRAE-GLOBAL", amc: "Mirae Asset MF" },
  { name: "Axis NASDAQ 100 IFSC ETF", symbol: "AXIS-NASDAQ", amc: "Axis MF" },
  { name: "DSP BlackRock World Gold IFSC", symbol: "DSP-GOLD", amc: "DSP MF" },
  { name: "Nippon India Global Innovation IFSC", symbol: "NIPPON-GLOBAL", amc: "Nippon India MF" },
  { name: "SBI International Equity IFSC", symbol: "SBI-INTL", amc: "SBI MF" },
  { name: "Franklin NASDAQ Composite IFSC ETF", symbol: "FRANKLIN-NASDAQ", amc: "Franklin Templeton" },
  { name: "HSBC Global Equity IFSC Fund", symbol: "HSBC-GLOBAL", amc: "HSBC MF" },
  { name: "iShares Core S&P 500 UCITS ETF (IFSC)", symbol: "ISHARES-SP500", amc: "BlackRock IFSC" },
];
export { COMMON_FUNDS };

export const SAMPLE_HOLDINGS: Holding[] = [
  {
    id: "h1",
    name: "PPFAS Flexi Cap Fund - IFSC",
    symbol: "PPFAS-IFSC",
    amc: "PPFAS AMC",
    quantity: 1200,
    avgCostUSD: 145.50,
    currentNAVUSD: 172.30,
    purchaseDate: "2023-06-15",
    isGiftCity: true,
    currency: "USD",
    notes: "Long-term core holding — approaching LTCG",
  },
  {
    id: "h2",
    name: "Nippon India Global Innovation IFSC",
    symbol: "NIPPON-GLOBAL",
    amc: "Nippon India MF",
    quantity: 2800,
    avgCostUSD: 28.50,
    currentNAVUSD: 34.20,
    purchaseDate: "2022-09-20",
    isGiftCity: true,
    currency: "USD",
    notes: "LTCG territory — do not sell before rebalance plan",
  },
  {
    id: "h3",
    name: "Tata S&P 500 Index ETF - IFSC",
    symbol: "TATA-SP500",
    amc: "Tata MF",
    quantity: 850,
    avgCostUSD: 218.00,
    currentNAVUSD: 196.50,
    purchaseDate: "2025-04-10",
    isGiftCity: true,
    currency: "USD",
    notes: "In loss — TLH candidate",
  },
  {
    id: "h4",
    name: "Mirae Asset Global Leaders IFSC",
    symbol: "MIRAE-GLOBAL",
    amc: "Mirae Asset MF",
    quantity: 2200,
    avgCostUSD: 88.75,
    currentNAVUSD: 71.20,
    purchaseDate: "2025-05-22",
    isGiftCity: true,
    currency: "USD",
    notes: "In loss — TLH candidate (highest priority)",
  },
  {
    id: "h5",
    name: "Axis NASDAQ 100 IFSC ETF",
    symbol: "AXIS-NASDAQ",
    amc: "Axis MF",
    quantity: 600,
    avgCostUSD: 335.00,
    currentNAVUSD: 292.40,
    purchaseDate: "2025-07-14",
    isGiftCity: true,
    currency: "USD",
    notes: "In loss — TLH candidate",
  },
  {
    id: "h6",
    name: "DSP BlackRock World Gold IFSC",
    symbol: "DSP-GOLD",
    amc: "DSP MF",
    quantity: 1800,
    avgCostUSD: 44.80,
    currentNAVUSD: 37.60,
    purchaseDate: "2025-08-03",
    isGiftCity: true,
    currency: "USD",
    notes: "Gold hedge — in loss, consider harvesting",
  },
  {
    id: "h7",
    name: "SBI International Equity IFSC",
    symbol: "SBI-INTL",
    amc: "SBI MF",
    quantity: 3500,
    avgCostUSD: 22.40,
    currentNAVUSD: 26.80,
    purchaseDate: "2024-02-18",
    isGiftCity: true,
    currency: "USD",
    notes: "Growing position — ~386 days held",
  },
];

export const DEFAULT_PROFILE: InvestorProfile = {
  name: "My Portfolio",
  incomeBracket: "above_5Cr",
  taxRegime: "old",
  exchangeRate: 83.5,
};

// ─── localStorage implementation ───────────────────────────────────────────

const HOLDINGS_KEY = "tlh_holdings_v2";
const PROFILE_KEY  = "tlh_profile_v2";

function uid(): string {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const listeners = new Set<() => void>();
function notifyAll() { listeners.forEach((cb) => cb()); }

const localStorageSource: PortfolioDataSource = {
  getHoldings() {
    if (typeof window === "undefined") return SAMPLE_HOLDINGS;
    try {
      const raw = localStorage.getItem(HOLDINGS_KEY);
      return raw ? (JSON.parse(raw) as Holding[]) : SAMPLE_HOLDINGS;
    } catch { return SAMPLE_HOLDINGS; }
  },

  addHolding(h) {
    const newH: Holding = { ...h, id: uid() };
    const current = this.getHoldings();
    const updated = [...current, newH];
    if (typeof window !== "undefined") localStorage.setItem(HOLDINGS_KEY, JSON.stringify(updated));
    notifyAll();
    return newH;
  },

  updateHolding(id, patch) {
    const updated = this.getHoldings().map((h) => h.id === id ? { ...h, ...patch } : h);
    if (typeof window !== "undefined") localStorage.setItem(HOLDINGS_KEY, JSON.stringify(updated));
    notifyAll();
  },

  removeHolding(id) {
    const updated = this.getHoldings().filter((h) => h.id !== id);
    if (typeof window !== "undefined") localStorage.setItem(HOLDINGS_KEY, JSON.stringify(updated));
    notifyAll();
  },

  getProfile() {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as InvestorProfile) : DEFAULT_PROFILE;
    } catch { return DEFAULT_PROFILE; }
  },

  setProfile(p) {
    if (typeof window !== "undefined") localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    notifyAll();
  },

  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

// ─── Future API stub (swap this export when real data is ready) ────────────
// const apiSource: PortfolioDataSource = {
//   getHoldings() { /* fetch from /api/holdings */ },
//   addHolding(h) { /* POST /api/holdings */ },
//   ...
// };

/** THE SINGLE SOURCE OF TRUTH — change this one export to switch data sources */
export const portfolioStore = localStorageSource;

// ─── React hook ────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [profile, setProfileState] = useState<InvestorProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setHoldings(portfolioStore.getHoldings());
    setProfileState(portfolioStore.getProfile());
    const unsub = portfolioStore.subscribe(() => {
      setHoldings(portfolioStore.getHoldings());
      setProfileState(portfolioStore.getProfile());
    });
    return unsub;
  }, []);

  const addHolding  = useCallback((h: Omit<Holding, "id">) => portfolioStore.addHolding(h), []);
  const updateHolding = useCallback((id: string, patch: Partial<Holding>) => portfolioStore.updateHolding(id, patch), []);
  const removeHolding = useCallback((id: string) => portfolioStore.removeHolding(id), []);
  const setProfile  = useCallback((p: InvestorProfile) => portfolioStore.setProfile(p), []);
  const loadSample  = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(HOLDINGS_KEY, JSON.stringify(SAMPLE_HOLDINGS));
      notifyAll();
    }
  }, []);
  const clearAll    = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(HOLDINGS_KEY);
      notifyAll();
    }
  }, []);

  return { holdings, profile, addHolding, updateHolding, removeHolding, setProfile, loadSample, clearAll };
}

// ─── Derived calculations ──────────────────────────────────────────────────

export const TODAY = new Date("2026-03-11");

export function getHoldingDays(purchaseDate: string): number {
  return Math.floor((TODAY.getTime() - new Date(purchaseDate).getTime()) / 86_400_000);
}

export function getHoldingMetrics(h: Holding, exchangeRate: number) {
  const costINR     = h.avgCostUSD * h.quantity * exchangeRate;
  const valueINR    = h.currentNAVUSD * h.quantity * exchangeRate;
  const pnlINR      = valueINR - costINR;
  const pnlUSD      = (h.currentNAVUSD - h.avgCostUSD) * h.quantity;
  const pnlPercent  = ((h.currentNAVUSD - h.avgCostUSD) / h.avgCostUSD) * 100;
  const holdingDays = getHoldingDays(h.purchaseDate);
  const isLTCG      = holdingDays > 730;
  const isLoss      = pnlINR < 0;
  const daysToLTCG  = Math.max(0, 730 - holdingDays);

  // Post-tax XIRR: annualised return AFTER paying the applicable capital gains tax
  const stcgRate  = 0.4274; // max effective rate (above ₹5Cr, old regime)
  const ltcgRate  = 0.1495;
  const taxRate   = isLTCG ? ltcgRate : stcgRate;
  const grossReturn = pnlINR / costINR;
  const netProceeds = isLoss ? valueINR : valueINR - (pnlINR * taxRate);
  const postTaxReturn = (netProceeds / costINR) - 1;
  const postTaxXIRR = holdingDays > 0
    ? (Math.pow(1 + postTaxReturn, 365 / holdingDays) - 1) * 100
    : 0;

  // Post-tax XIRR if held to LTCG threshold (for STCG positions)
  const ltcgXIRR = (!isLTCG && daysToLTCG > 0 && !isLoss)
    ? (() => {
        const totalDays  = holdingDays + daysToLTCG;
        const netProceedsLTCG = valueINR - (pnlINR * ltcgRate);
        const r = (netProceedsLTCG / costINR) - 1;
        return (Math.pow(1 + r, 365 / totalDays) - 1) * 100;
      })()
    : null;

  return {
    costINR, valueINR, pnlINR, pnlUSD, pnlPercent, holdingDays,
    isLTCG, isLoss, daysToLTCG, postTaxXIRR, ltcgXIRR, grossReturn,
    type: isLTCG ? "LTCG" : (isLoss ? (holdingDays <= 730 ? "STCL" : "LTCL") : "STCG"),
  };
}
