"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Sparkles } from "lucide-react";
import CalcDrawer from "@/components/chat/CalcDrawer";

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */

const USD_RATE = 85;

const FEE_KEYS = [
  "brokerage", "forex_markup", "gst", "transaction_fee",
  "platform_fee", "subscription", "withdrawal", "remittance",
] as const;
type FeeKey = (typeof FEE_KEYS)[number];

const FEE_LABELS: Record<FeeKey, string> = {
  brokerage:       "Brokerage",
  forex_markup:    "Forex Markup",
  gst:             "GST (18%)",
  transaction_fee: "Transaction Fee",
  platform_fee:    "Platform Fee",
  subscription:    "Subscription",
  withdrawal:      "Withdrawal Fee",
  remittance:      "Remittance Fee",
};

const FEE_COLORS: Record<FeeKey, string> = {
  brokerage:       "#05A049",
  forex_markup:    "#FF6B6B",
  gst:             "#FFA94D",
  transaction_fee: "#74C0FC",
  platform_fee:    "#B197FC",
  subscription:    "#F783AC",
  withdrawal:      "#63E6BE",
  remittance:      "#FFD43B",
};

type FeeFn = (amount: number) => number;

interface Platform {
  id: string;
  name: string;
  tagline: string;
  isHero?: boolean;
  color: string;
  fees: Record<FeeKey, FeeFn>;
  rateNotes: Partial<Record<FeeKey, string>>;
}

const platforms: Platform[] = [
  {
    id: "valura",
    name: "Valura",
    tagline: "GIFT City IFSC",
    isHero: true,
    color: "#05A049",
    fees: {
      brokerage:       (a) => Math.min(0.002 * a, 20),
      forex_markup:    (a) => 0.006 * a,
      gst:             (a) => 0.18 * Math.min(0.002 * a, 20),
      transaction_fee: () => 0,
      platform_fee:    () => 0,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "0.20%, max $20",
      forex_markup: "0.6% ✦ GIFT City Advantage",
      gst:          "18% on brokerage",
    },
  },
  {
    id: "appreciate",
    name: "Appreciate",
    tagline: "Indian US Investing App",
    color: "#4DABF7",
    fees: {
      brokerage:       (a) => Math.max(5 / USD_RATE, 0.0005 * a),
      forex_markup:    (a) => 0.01 * a,
      gst:             (a) => 0.18 * Math.max(5 / USD_RATE, 0.0005 * a),
      transaction_fee: () => 0,
      platform_fee:    () => 1 / USD_RATE,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "0.05% or ₹5 min (~$0.06) — whichever higher",
      forex_markup: "~1% assumed (not disclosed on app)",
      gst:          "18% on transaction fee",
      platform_fee: "₹1/unit or ticker (~$0.012)",
    },
  },
  {
    id: "vested",
    name: "Vested Finance",
    tagline: "US Stocks from India",
    color: "#E03131",
    fees: {
      brokerage:       (a) => Math.min(0.0025 * a, 25),
      forex_markup:    (a) => 0.015 * a,
      gst:             (a) => 0.18 * Math.min(0.0025 * a, 25),
      transaction_fee: () => 0,
      platform_fee:    () => 0,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "0.25%, max $25",
      forex_markup: "1.2%–1.8% (avg 1.5%)",
      gst:          "18% on brokerage",
    },
  },
  {
    id: "indmoney",
    name: "INDmoney",
    tagline: "Wealth Super App",
    color: "#F76707",
    fees: {
      brokerage:       (a) => Math.min(0.0025 * a, 25),
      forex_markup:    (a) => 0.013 * a,
      gst:             (a) => 0.18 * Math.min(0.0025 * a, 25),
      transaction_fee: () => 0,
      platform_fee:    () => 0,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "0.25%, max $25",
      forex_markup: "1.2%–1.4% (avg 1.3%)",
      gst:          "18% on brokerage",
    },
  },
  {
    id: "tickertape",
    name: "Ticker Tape",
    tagline: "Zerodha Group",
    color: "#7950F2",
    fees: {
      brokerage:       (a) => Math.min(0.002 * a, 20),
      forex_markup:    (a) => 0.0085 * a,
      gst:             (a) => 0.18 * Math.min(0.002 * a, 20),
      transaction_fee: () => 0,
      platform_fee:    () => 0,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "0.20%, max $20",
      forex_markup: "0.8%–0.9% (avg 0.85%)",
      gst:          "18% on brokerage",
    },
  },
  {
    id: "paasa",
    name: "Paasa",
    tagline: "IBKR-Backed Platform",
    color: "#2F9E44",
    fees: {
      brokerage:       (a) => Math.max(0.35, a * 0.00035),
      forex_markup:    (a) => 0.0085 * a,
      gst:             (a) => 0.18 * Math.max(0.35, a * 0.00035),
      transaction_fee: () => 0,
      platform_fee:    () => 0,
      subscription:    () => 0,
      withdrawal:      () => 0,
      remittance:      () => 0,
    },
    rateNotes: {
      brokerage:    "$0.0035/share or $0.35 (higher)",
      forex_markup: "0.8%–0.9% (avg 0.85%)",
      gst:          "18% on brokerage",
    },
  },
];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */

interface FeeCalc extends Record<FeeKey, number> {
  total: number;
  effectivePct: number;
}

function calcFees(platform: Platform, amount: number, includeForex = true): FeeCalc {
  const result = {} as Record<FeeKey, number>;
  let total = 0;
  for (const key of FEE_KEYS) {
    const raw = platform.fees[key](amount);
    // Zero out forex_markup when toggle is off
    const val = parseFloat((!includeForex && key === "forex_markup" ? 0 : raw).toFixed(4));
    result[key] = val;
    total += val;
  }
  return {
    ...result,
    total:        parseFloat(total.toFixed(2)),
    effectivePct: parseFloat(((total / amount) * 100).toFixed(3)),
  };
}

/* ══════════════════════════════════════════════════════
   CUSTOM TOOLTIP
══════════════════════════════════════════════════════ */

interface TooltipPayloadItem {
  name: string;
  value: number;
  fill: string;
}

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#00111B",
      border: "1px solid #05A049",
      borderRadius: 10,
      padding: "12px 16px",
      fontFamily: "var(--font-inter)",
      fontSize: 13,
      color: "#FFFFFC",
    }}>
      <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, marginBottom: 8, color: "#B4E3C8" }}>
        {label}
      </div>
      {payload.map((p, i) =>
        p.value > 0 ? (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: p.fill }} />
            <span style={{ color: "#aaa" }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>${p.value.toFixed(2)}</span>
          </div>
        ) : null
      )}
      <div style={{ borderTop: "1px solid #333", marginTop: 8, paddingTop: 8, fontWeight: 700, color: "#B4E3C8" }}>
        Total: ${payload.reduce((s, p) => s + p.value, 0).toFixed(2)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */

const SCENARIOS = [100, 1000, 10000, 50000] as const;

export default function FeeComparisonPage() {
  const [tradeAmount, setTradeAmount] = useState(1000);
  const [inputVal, setInputVal]       = useState("1000");
  const [activeTab, setActiveTab]     = useState<"chart" | "table" | "scenarios">("chart");
  const [includeForex, setIncludeForex] = useState(true);
  const [aiOpen, setAiOpen]           = useState(false);

  const feeData = useMemo(
    () => platforms.map((p) => ({ ...p, calc: calcFees(p, tradeAmount, includeForex) })),
    [tradeAmount, includeForex],
  );

  const valuraCost = feeData.find((p) => p.isHero)?.calc.total ?? 0;
  const maxOther   = Math.max(...feeData.filter((p) => !p.isHero).map((p) => p.calc.total));
  const savings    = maxOther - valuraCost;
  const savingsPct = maxOther > 0 ? Math.round((savings / maxOther) * 100) : 0;

  const chartData = feeData.map((p) => ({
    name: p.name,
    isHero: p.isHero,
    ...Object.fromEntries(FEE_KEYS.map((k) => [FEE_LABELS[k], p.calc[k]])),
  }));

  return (
    <>
      <div style={{
        background: "#00111B",
        minHeight: "100vh",
        fontFamily: "var(--font-inter)",
        color: "#FFFFFC",
        paddingBottom: 60,
      }}>
        <style>{`
          .scenario-btn {
            border: 1.5px solid #1a3a2a; background: transparent; color: #B4E3C8;
            border-radius: 8px; padding: 8px 18px; cursor: pointer;
            font-family: var(--font-manrope); font-size: 14px; font-weight: 600;
            transition: all 0.2s;
          }
          .scenario-btn:hover { background: #0a2a1a; border-color: #05A049; }
          .scenario-btn.active { background: #05A049; color: #00111B; border-color: #05A049; }
          .fee-tab-btn {
            background: transparent; border: none; cursor: pointer;
            font-family: var(--font-manrope); font-size: 14px; font-weight: 600;
            padding: 10px 20px; border-bottom: 2px solid transparent;
            transition: all 0.2s; color: #666;
          }
          .fee-tab-btn.active { color: #05A049; border-bottom-color: #05A049; }
          .fee-tab-btn:hover { color: #B4E3C8; }
          .platform-row:hover { background: #0a1f18 !important; }
          .forex-toggle-pill {
            display: inline-flex; align-items: center;
            background: #010f18; border: 1.5px solid #0a2a1a;
            border-radius: 10px; padding: 4px; gap: 0;
          }
          .forex-toggle-opt {
            padding: 8px 16px; border-radius: 7px; font-size: 13px; font-weight: 700;
            font-family: var(--font-manrope); cursor: pointer; border: none;
            transition: all 0.2s; white-space: nowrap;
          }
          .forex-toggle-opt.on  { background: #05A049; color: #00111B; }
          .forex-toggle-opt.off { background: transparent; color: #4a7a5a; }
          .forex-toggle-opt.off:hover { color: #B4E3C8; }
          .forex-toggle-opt.off-active { background: #331010; color: #FF6B6B; border: none; }
          .forex-toggle-opt.off-inactive { background: transparent; color: #4a7a5a; }
          .forex-toggle-opt.off-inactive:hover { color: #B4E3C8; }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #001a10 0%, #00111B 60%)",
          borderBottom: "1px solid #0a2a1a",
          padding: "28px 32px 24px",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{
                    background: "#05A049", color: "#00111B", fontSize: 11, fontWeight: 800,
                    fontFamily: "var(--font-manrope)", letterSpacing: "0.12em",
                    padding: "3px 10px", borderRadius: 4, textTransform: "uppercase",
                  }}>GIFT City IFSC</div>
                  <div style={{ color: "#B4E3C8", fontSize: 11, fontFamily: "var(--font-manrope)", fontWeight: 500 }}>
                    Channel Partner Tool
                  </div>
                </div>
                <h1 style={{
                  fontFamily: "var(--font-bricolage)", fontSize: "clamp(22px, 4vw, 32px)",
                  fontWeight: 800, color: "#FFFFFC", letterSpacing: "-0.02em", lineHeight: 1.1,
                }}>
                  Platform Fee Comparison
                </h1>
                <p style={{ color: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                  Real cost breakdown — Valura vs Vested, INDmoney, Ticker Tape, Paasa &amp; Appreciate
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#B4E3C8", fontFamily: "var(--font-manrope)", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  POWERED BY
                </div>
                <div style={{ fontFamily: "var(--font-bricolage)", fontSize: 22, fontWeight: 800, color: "#05A049", letterSpacing: "-0.03em" }}>
                  valura
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

          {/* ── Trade Amount Input ── */}
          <div style={{
            background: "#010f18", border: "1px solid #0a2a1a", borderRadius: 16,
            padding: "24px 28px", margin: "28px 0 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{
                  color: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 11,
                  fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase",
                }}>
                  Trade Amount (USD)
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    background: "#0a2a1a", borderRadius: "10px 0 0 10px", padding: "12px 16px",
                    fontSize: 22, color: "#05A049", fontFamily: "var(--font-bricolage)", fontWeight: 700,
                    border: "1.5px solid #0d3a20", borderRight: "none",
                  }}>$</div>
                  <input
                    type="number"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v > 0) setTradeAmount(v);
                    }}
                    style={{
                      flex: 1, background: "#010f18", border: "1.5px solid #0d3a20",
                      borderRadius: "0 10px 10px 0", padding: "12px 16px",
                      fontSize: 22, color: "#FFFFFC", fontFamily: "var(--font-bricolage)",
                      fontWeight: 700, width: "100%", outline: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{
                  color: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 11,
                  fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase",
                }}>Quick Scenarios</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SCENARIOS.map((s) => (
                    <button
                      key={s}
                      className={`scenario-btn${tradeAmount === s ? " active" : ""}`}
                      onClick={() => { setTradeAmount(s); setInputVal(String(s)); }}
                    >
                      ${s.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Forex Toggle ── */}
              <div style={{ marginLeft: "auto" }}>
                <div style={{
                  color: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 11,
                  fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase",
                }}>Forex Markup</div>
                <div className="forex-toggle-pill">
                  <button
                    className={`forex-toggle-opt ${includeForex ? "on" : "off"}`}
                    onClick={() => setIncludeForex(true)}
                  >
                    💱 With Forex
                  </button>
                  <button
                    className={`forex-toggle-opt ${!includeForex ? "off-active" : "off-inactive"}`}
                    onClick={() => setIncludeForex(false)}
                  >
                    Without Forex
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Valura Savings Hero ── */}
          <div style={{
            background: includeForex
              ? "linear-gradient(135deg, #032a12 0%, #051a0c 100%)"
              : "linear-gradient(135deg, #1a1000 0%, #0f0800 100%)",
            border: `1.5px solid ${includeForex ? "#05A049" : "#FF9900"}`,
            borderRadius: 14, padding: "20px 28px",
            marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
            transition: "all 0.3s ease",
          }}>
            <div style={{
              background: includeForex ? "#05A049" : "#CC7700",
              color: "#00111B", borderRadius: 10, padding: "10px 18px",
              fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 28,
              letterSpacing: "-0.02em", whiteSpace: "nowrap",
            }}>
              Save up to {savingsPct}%
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 16, color: "#B4E3C8" }}>
                With Valura, you pay{" "}
                <span style={{ color: includeForex ? "#05A049" : "#FFB347" }}>${valuraCost.toFixed(2)}</span>
                {" "}on a ${tradeAmount.toLocaleString()} trade
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#3a6a4a", marginTop: 4 }}>
                vs up to{" "}
                <span style={{ color: "#FF6B6B" }}>${maxOther.toFixed(2)}</span>
                {" "}on other platforms — saving you{" "}
                <span style={{ color: includeForex ? "#05A049" : "#FFB347" }}>${savings.toFixed(2)}</span> per trade
              </div>
              {!includeForex && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  marginTop: 8, padding: "4px 10px", borderRadius: 6,
                  background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.25)",
                  fontFamily: "var(--font-manrope)", fontSize: 11, fontWeight: 700, color: "#FF6B6B",
                }}>
                  ⚠️ Forex excluded — showing brokerage + GST only
                </div>
              )}
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                EFFECTIVE RATE
              </div>
              <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22, color: includeForex ? "#05A049" : "#FFB347" }}>
                {feeData.find((p) => p.isHero)?.calc.effectivePct}%
              </div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#3a5a48", marginTop: 2 }}>
                {includeForex ? "incl. forex" : "excl. forex"}
              </div>
            </div>
          </div>

          {/* ── Tab Switcher ── */}
          <div style={{ display: "flex", borderBottom: "1px solid #0a2a1a", marginBottom: 20 }}>
            {([
              ["chart",     "📊 Bar Chart"],
              ["table",     "📋 Full Breakdown"],
              ["scenarios", "⚡ All Scenarios"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                className={`fee-tab-btn${activeTab === k ? " active" : ""}`}
                onClick={() => setActiveTab(k)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* ════════════════ BAR CHART TAB ════════════════ */}
          {activeTab === "chart" && (
            <div style={{ background: "#010f18", border: "1px solid #0a2a1a", borderRadius: 16, padding: "24px 12px" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20, paddingLeft: 12, paddingRight: 12, flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 14, color: "#B4E3C8" }}>
                  Total Cost Comparison — ${tradeAmount.toLocaleString()} Trade (USD)
                </div>
                <div style={{
                  fontFamily: "var(--font-manrope)", fontSize: 11, fontWeight: 700,
                  color: includeForex ? "#05A049" : "#FF6B6B",
                  background: includeForex ? "rgba(5,160,73,0.1)" : "rgba(255,107,107,0.1)",
                  border: `1px solid ${includeForex ? "rgba(5,160,73,0.25)" : "rgba(255,107,107,0.25)"}`,
                  borderRadius: 6, padding: "4px 10px",
                }}>
                  {includeForex ? "💱 Forex Included" : "🚫 Forex Excluded"}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a2a1a" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#4a7a5a", fontFamily: "var(--font-manrope)", fontSize: 12 }}
                    axisLine={{ stroke: "#0a2a1a" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#4a7a5a", fontFamily: "var(--font-inter)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {FEE_KEYS.map((key) => (
                    <Bar key={key} dataKey={FEE_LABELS[key]} stackId="a" fill={FEE_COLORS[key]}
                      radius={key === "remittance" || key === "withdrawal" ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={FEE_COLORS[key] + (entry.isHero ? "" : "99")}
                          opacity={entry.isHero ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 12, marginTop: 16 }}>
                {FEE_KEYS.filter((k) => feeData.some((p) => p.calc[k] > 0)).map((k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: FEE_COLORS[k] }} />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4a7a5a" }}>
                      {FEE_LABELS[k]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ TABLE TAB ════════════════ */}
          {activeTab === "table" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#010f18" }}>
                    <th style={{
                      textAlign: "left", padding: "14px 16px",
                      fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 12,
                      color: "#4a7a5a", letterSpacing: "0.08em", borderBottom: "1px solid #0a2a1a",
                      textTransform: "uppercase", minWidth: 140,
                    }}>Fee Type</th>
                    {feeData.map((p) => (
                      <th key={p.id} style={{
                        textAlign: "right", padding: "14px 16px", borderBottom: "1px solid #0a2a1a",
                        minWidth: 120, background: p.isHero ? "#031a0e" : "transparent",
                      }}>
                        <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: 13, color: p.isHero ? "#05A049" : "#FFFFFC" }}>
                          {p.name}
                        </div>
                        <div style={{ fontFamily: "var(--font-inter)", fontSize: 10, color: "#3a5a48", fontWeight: 400, marginTop: 2 }}>
                          {p.tagline}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEE_KEYS.map((key) => {
                    // When forex is excluded, still show the row but greyed/struck out
                    const isForexRow = key === "forex_markup";
                    const isExcluded = isForexRow && !includeForex;
                    // Use original (un-toggled) values for the forex row display when excluded
                    const anyNonZeroRaw = platforms.some((p) => p.fees[key](tradeAmount) > 0);
                    if (!anyNonZeroRaw) return null;
                    return (
                      <tr key={key} style={{
                        borderBottom: "1px solid #060f14",
                        opacity: isExcluded ? 0.35 : 1,
                        transition: "opacity 0.25s",
                      }}>
                        <td style={{ padding: "12px 16px", color: "#8aa89a", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: FEE_COLORS[key], flexShrink: 0 }} />
                            <span style={{ textDecoration: isExcluded ? "line-through" : "none" }}>
                              {FEE_LABELS[key]}
                            </span>
                            {isExcluded && (
                              <span style={{ fontSize: 10, fontFamily: "var(--font-manrope)", fontWeight: 700, color: "#FF6B6B", background: "rgba(255,107,107,0.12)", borderRadius: 4, padding: "1px 6px" }}>
                                excluded
                              </span>
                            )}
                          </div>
                        </td>
                        {feeData.map((p) => {
                          const v = p.calc[key];
                          // Show original value struck through when excluded
                          const rawVal = isExcluded ? parseFloat(p.fees[key](tradeAmount).toFixed(2)) : v;
                          return (
                            <td key={p.id} style={{
                              textAlign: "right", padding: "12px 16px",
                              background: p.isHero ? "#010e08" : "transparent",
                              fontWeight: rawVal === 0 ? 600 : 500,
                              color: rawVal === 0 ? "#05A049" : isForexRow && !isExcluded ? "#FF6B6B" : "#FFFFFC",
                            }}>
                              {isExcluded
                                ? <span style={{ textDecoration: "line-through", color: "#FF6B6B" }}>${rawVal.toFixed(2)}</span>
                                : rawVal === 0 ? "—" : `$${rawVal.toFixed(2)}`}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr style={{ background: "#020e09", borderTop: "2px solid #0a2a1a" }}>
                    <td style={{ padding: "16px", fontFamily: "var(--font-manrope)", fontWeight: 800, color: "#FFFFFC", fontSize: 14 }}>
                      TOTAL COST
                    </td>
                    {feeData.map((p) => (
                      <td key={p.id} style={{
                        textAlign: "right", padding: "16px",
                        fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 18,
                        background: p.isHero ? "#031a0e" : "transparent",
                        color: p.isHero ? "#05A049" : "#FF6B6B",
                      }}>
                        ${p.calc.total.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  {/* Effective % */}
                  <tr style={{ background: "#010b07" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-manrope)", fontWeight: 600, color: "#3a6a4a", fontSize: 12 }}>
                      Effective Rate
                    </td>
                    {feeData.map((p) => (
                      <td key={p.id} style={{
                        textAlign: "right", padding: "10px 16px", fontSize: 12,
                        fontFamily: "var(--font-manrope)", fontWeight: 700,
                        color: p.isHero ? "#B4E3C8" : "#3a5a48",
                        background: p.isHero ? "#031a0e" : "transparent",
                      }}>
                        {p.calc.effectivePct}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Rate Structure Reference */}
              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {feeData.map((p) => (
                  <div key={p.id} style={{
                    background: p.isHero ? "#031a0e" : "#010f18",
                    border: `1px solid ${p.isHero ? "#05A049" : "#0a2a1a"}`,
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: 13, color: p.isHero ? "#05A049" : "#FFFFFC", marginBottom: 8 }}>
                      {p.name} — Rate Structure
                    </div>
                    {(Object.entries(p.rateNotes) as [FeeKey, string][]).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: "#3a6a4a", fontFamily: "var(--font-inter)", fontSize: 11 }}>{FEE_LABELS[k]}</span>
                        <span style={{ color: "#8aa89a", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500, textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ SCENARIOS TAB ════════════════ */}
          {activeTab === "scenarios" && (
            <div>
              {/* Forex context banner */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", marginBottom: 16,
                borderRadius: 10,
                background: includeForex ? "rgba(5,160,73,0.07)" : "rgba(255,107,107,0.07)",
                border: `1px solid ${includeForex ? "rgba(5,160,73,0.2)" : "rgba(255,107,107,0.2)"}`,
                fontFamily: "var(--font-manrope)", fontSize: 13, fontWeight: 600,
                color: includeForex ? "#B4E3C8" : "#FF9999",
              }}>
                <span>{includeForex ? "💱" : "🚫"}</span>
                {includeForex
                  ? "Showing total cost including forex markup. Forex is the biggest fee component — it's where Valura's GIFT City advantage is most visible."
                  : "Forex excluded. Numbers reflect brokerage + GST only. Toggle on to see the full picture including forex conversion cost."}
              </div>
              {([100, 1000, 10000, 50000] as const).map((amt) => {
                const data = platforms.map((p) => ({ ...p, calc: calcFees(p, amt, includeForex) }));
                const valuraTotal = data.find((p) => p.isHero)?.calc.total ?? 0;
                const maxOtherAmt = Math.max(...data.filter((p) => !p.isHero).map((p) => p.calc.total));
                return (
                  <div key={amt} style={{
                    background: "#010f18", border: "1px solid #0a2a1a",
                    borderRadius: 14, marginBottom: 16, overflow: "hidden",
                  }}>
                    <div style={{
                      background: "#020e09", padding: "16px 24px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 12, borderBottom: "1px solid #0a2a1a",
                    }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 20, color: "#FFFFFC" }}>
                          ${amt.toLocaleString()} Trade
                        </span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#3a6a4a", marginLeft: 10 }}>
                          ≈ ₹{(amt * USD_RATE).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div style={{
                        background: "#05A049", color: "#00111B", borderRadius: 8,
                        padding: "6px 14px", fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: 13,
                      }}>
                        Valura saves ${(maxOtherAmt - valuraTotal).toFixed(2)} vs worst
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-inter)", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {data.map((p) => (
                              <th key={p.id} style={{
                                padding: "12px 20px", textAlign: "center",
                                background: p.isHero ? "#031a0e" : "transparent",
                                borderBottom: "1px solid #0a2a1a", minWidth: 130,
                              }}>
                                <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 800, fontSize: 13, color: p.isHero ? "#05A049" : "#FFFFFC" }}>
                                  {p.name}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {data.map((p) => {
                              const allTotals = data.map((d) => d.calc.total);
                              const isMax = p.calc.total === Math.max(...allTotals);
                              return (
                                <td key={p.id} style={{
                                  padding: "16px 20px", textAlign: "center",
                                  background: p.isHero ? "#031a0e" : "transparent",
                                }}>
                                  <div style={{
                                    fontFamily: "var(--font-bricolage)", fontWeight: 800, fontSize: 22,
                                    color: p.isHero ? "#05A049" : isMax ? "#FF6B6B" : "#FFFFFC",
                                  }}>
                                    ${p.calc.total.toFixed(2)}
                                  </div>
                                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#3a5a48", marginTop: 3 }}>
                                    {p.calc.effectivePct}% effective
                                  </div>
                                  {p.isHero && (
                                    <div style={{
                                      fontFamily: "var(--font-manrope)", fontSize: 10, fontWeight: 700,
                                      color: "#05A049", marginTop: 4, background: "#041a0a",
                                      borderRadius: 4, padding: "2px 6px", display: "inline-block",
                                    }}>
                                      ✦ LOWEST
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {/* Mini progress bars */}
                          <tr>
                            {data.map((p) => {
                              const maxTotal = Math.max(...data.map((d) => d.calc.total));
                              const pct = maxTotal > 0 ? (p.calc.total / maxTotal) * 100 : 0;
                              return (
                                <td key={p.id} style={{ padding: "0 20px 16px", background: p.isHero ? "#031a0e" : "transparent" }}>
                                  <div style={{ background: "#0a2a1a", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%", width: `${pct}%`,
                                      background: p.isHero ? "#05A049" : "#FF6B6B88",
                                      borderRadius: 4, transition: "width 0.6s ease",
                                    }} />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Disclaimer ── */}
          <div style={{
            marginTop: 28, padding: "16px 20px",
            background: "#010b07", border: "1px solid #0a2a1a",
            borderRadius: 10, fontFamily: "var(--font-inter)", fontSize: 11,
            color: "#2a4a34", lineHeight: 1.7,
          }}>
            <span style={{ color: "#3a6a4a", fontWeight: 700 }}>Disclosure &amp; Assumptions: </span>
            Valura: 0.20% brokerage capped $20, 0.6% forex markup (GIFT City IFSC), GST 18% on brokerage. | Appreciate: 0.05% or ₹5 min transaction fee (whichever higher), ₹1 platform fee/ticker, GST 18%, forex markup assumed 1% (actual may vary). | Vested Finance: 0.25% max $25, forex 1.5% avg, GST 18%. | INDmoney: 0.25% max $25, forex 1.3% avg, GST 18%. | Ticker Tape: 0.20% max $20, forex 0.85% avg, GST 18%. | Paasa: $0.0035/share or $0.35 (higher), forex 0.85%, GST 18%, avg share price $10 assumed. | Rate: ₹85 = $1. Illustrative only — not financial advice.
          </div>

          {/* ── Ask AI button ── */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
            <button
              onClick={() => setAiOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
                borderRadius: 999, background: "#05A049", color: "#fff",
                fontSize: 14, fontWeight: 600, fontFamily: "var(--font-manrope)",
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(5,160,73,0.35)",
              }}
            >
              <Sparkles style={{ width: 16, height: 16 }} />
              Ask AI about this comparison →
            </button>
          </div>
        </div>
      </div>

      <CalcDrawer
        page="Fee Comparison"
        inputs={{
          tradeAmountUSD: tradeAmount,
          forexIncluded: includeForex,
          platformsCompared: platforms.map((p) => p.name).join(", "),
        }}
        outputs={{
          valuraTotalCostUSD:    valuraCost,
          valuraEffectivePct:    feeData.find((p) => p.isHero)?.calc.effectivePct ?? 0,
          maxOtherPlatformCostUSD: maxOther,
          savingsVsWorstUSD:     parseFloat(savings.toFixed(2)),
          savingsPct:            savingsPct,
        }}
        chips={[
          "Why is Valura's forex markup lower?",
          "How much do I save over 10 trades per month?",
          "What makes GIFT City forex rates competitive?",
        ]}
        open={aiOpen}
        onClose={() => setAiOpen(false)}
      />
    </>
  );
}
