"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_CLIENT } from "@/lib/demo-data";

// ─── Scene metadata ──────────────────────────────────────────────────────────
const SCENE_NAMES = [
  "The Client",
  "The Problem",
  "The Optimization",
  "The Portfolio",
  "The TLH Engine",
  "The AI",
  "The Payoff",
];
const SCENE_DURATIONS = [10, 14, 16, 16, 18, 22, 16]; // seconds

// ─── CSS keyframes (all in one block) ────────────────────────────────────────
const DEMO_STYLES = `
  /* ── Scene-level transitions ── */
  @keyframes d-fadeScaleOut { to { opacity: 0; transform: scale(0.97); } }
  @keyframes d-slideLeftOut  { to { opacity: 0; transform: translateX(-70px); } }
  @keyframes d-fadeOut       { to { opacity: 0; } }
  @keyframes d-dissolveOut   { to { opacity: 0; transform: scale(1.03) blur(4px); } }

  @keyframes d-fadeIn        { from { opacity: 0; } to { opacity: 1; } }
  @keyframes d-slideUpIn     { from { opacity: 0; transform: translateY(36px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes d-slideRightIn  { from { opacity: 0; transform: translateX(70px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes d-scaleUpIn     { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
  @keyframes d-explodeIn     { from { opacity: 0; transform: scale(0.84); } to { opacity: 1; transform: scale(1); } }

  /* ── Element-level animations (used inside scenes) ── */
  @keyframes d-up     { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes d-fade   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes d-left   { from { opacity: 0; transform: translateX(-44px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes d-right  { from { opacity: 0; transform: translateX(44px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes d-scale  { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
  @keyframes d-row    { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes d-line   { from { width: 0; } to { width: 480px; } }
  @keyframes d-barX   { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 1; } }
  @keyframes d-sweep  { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0% 0 0); } }
  @keyframes d-stat   { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
  @keyframes d-total  { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Persistent animations ── */
  @keyframes d-harvest-glow {
    0%, 100% { box-shadow: -3px 0 8px rgba(5,160,73,0.5); }
    50%       { box-shadow: -3px 0 18px rgba(5,160,73,0.9), inset 0 0 24px rgba(5,160,73,0.06); }
  }
  @keyframes d-dot-pulse {
    0%, 100% { transform: scale(0.7); opacity: 0.4; }
    50%       { transform: scale(1.2); opacity: 1; }
  }
  @keyframes d-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes d-rec-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes d-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* scrollbar for AI scene */
  .demo-chat::-webkit-scrollbar { width: 4px; }
  .demo-chat::-webkit-scrollbar-track { background: transparent; }
  .demo-chat::-webkit-scrollbar-thumb { background: rgba(5,160,73,0.3); border-radius: 2px; }
`;

// ─── Utilities ───────────────────────────────────────────────────────────────
function fmtINR(n: number): string {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-" : "") + "₹" + abs.toLocaleString("en-IN");
}

function a(
  name: string,
  ms: number,
  delay = 0,
  ease = "cubic-bezier(0.16,1,0.3,1)"
): React.CSSProperties {
  return { animation: `${name} ${ms}ms ${ease} ${delay}ms both` };
}

// Counter (mounts → counts up automatically)
function Counter({
  target,
  duration = 1400,
  prefix = "₹",
}: {
  target: number;
  duration?: number;
  prefix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - prog, 3)) * target));
      if (prog < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return (
    <>
      {prefix}
      {val.toLocaleString("en-IN")}
    </>
  );
}

// ─── SCENE 1 — The Client ────────────────────────────────────────────────────
function Scene1() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 0,
      }}
    >
      <div
        style={{
          ...a("d-fade", 600, 0),
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 10,
          color: "#B4E3C8",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: 30,
        }}
      >
        DEMO CLIENT · FY 2025-26
      </div>

      <div
        style={{
          ...a("d-up", 700, 350),
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 80,
          fontWeight: 800,
          color: "#FFFFFC",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginBottom: 36,
        }}
      >
        Rajesh Kumar
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 44 }}>
        {[
          { label: "₹1.2 Cr  ·  Annual Income", delay: 800 },
          { label: "HNI  ·  Old Tax Regime", delay: 950 },
          { label: "New Delhi  ·  Resident Indian", delay: 1100 },
        ].map(({ label, delay }) => (
          <div
            key={label}
            style={{
              ...a("d-up", 550, delay),
              background: "rgba(180,227,200,0.08)",
              border: "1px solid rgba(180,227,200,0.15)",
              borderRadius: 100,
              padding: "8px 22px",
              fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Green divider */}
      <div
        style={{
          ...a("d-line", 550, 1350, "ease-out"),
          height: 1,
          background: "linear-gradient(90deg,transparent,#05A049,transparent)",
          marginBottom: 30,
          transformOrigin: "center",
        }}
      />

      <div
        style={{
          ...a("d-fade", 650, 1750),
          textAlign: "center",
          fontFamily: "var(--font-inter,'Inter',sans-serif)",
          fontSize: 16,
          color: "rgba(255,255,255,0.35)",
          fontStyle: "italic",
          lineHeight: 1.85,
        }}
      >
        Invested ₹80,00,000 in global markets this FY.
        <br />
        He has a problem. You&rsquo;re about to solve it.
      </div>
    </div>
  );
}

// ─── SCENE 2 — The Problem ───────────────────────────────────────────────────
function Scene2() {
  const [counterActive, setCounterActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCounterActive(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        alignItems: "center",
        padding: "0 90px",
        gap: 80,
      }}
    >
      {/* LEFT */}
      <div style={{ flex: "0 0 44%", ...a("d-left", 700, 0) }}>
        <div
          style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 10,
            color: "#05A049",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          THE TCS SITUATION
        </div>

        <div
          style={{
            ...a("d-up", 600, 200),
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.2,
            color: "#FFFFFC",
            marginBottom: 22,
          }}
        >
          He remitted ₹80 lakh.
          <br />
          The government took{" "}
          <span style={{ color: "#F87171" }}>₹14 lakh.</span>
        </div>

        <div
          style={{
            ...a("d-fade", 600, 600),
            fontFamily: "var(--font-inter,'Inter',sans-serif)",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.8,
            marginBottom: 30,
          }}
        >
          TCS deducted at 20% on ₹70L above threshold.
          <br />
          Locked. Sitting with the income tax department.
          <br />
          Won&rsquo;t be refunded until ITR is filed and processed.
        </div>

        <div
          style={{
            ...a("d-up", 550, 900),
            background: "rgba(248,113,113,0.07)",
            borderLeft: "3px solid #F87171",
            borderRadius: "0 10px 10px 0",
            padding: "14px 18px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 12,
              color: "#F87171",
            }}
          >
            ₹14L locked for 8 months = ₹1,12,000 in lost returns
          </span>
        </div>
      </div>

      {/* RIGHT — LRS visual */}
      <div style={{ flex: 1, ...a("d-right", 700, 0) }}>
        <div
          style={{
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          RAJESH&apos;S LRS THIS FY
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Row 1 */}
          <div style={{ ...a("d-up", 500, 400) }}>
            <div
              style={{
                fontSize: 12,
                color: "#05A049",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                marginBottom: 6,
              }}
            >
              ₹80,00,000 remitted
            </div>
            <div
              style={{
                height: 38,
                background: "rgba(5,160,73,0.22)",
                borderRadius: 6,
                width: "100%",
                ...a("d-barX", 600, 400, "ease-out"),
                transformOrigin: "left center",
              }}
            />
          </div>

          {/* Row 2 */}
          <div style={{ ...a("d-up", 500, 700) }}>
            <div
              style={{
                fontSize: 12,
                color: "#B4E3C8",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                marginBottom: 6,
              }}
            >
              ₹10,00,000 — TCS-free threshold
            </div>
            <div
              style={{
                height: 28,
                background: "rgba(180,227,200,0.15)",
                borderRadius: 6,
                width: "12.5%",
                ...a("d-barX", 600, 700, "ease-out"),
                transformOrigin: "left center",
              }}
            />
          </div>

          {/* Row 3 */}
          <div style={{ ...a("d-up", 500, 1000) }}>
            <div
              style={{
                fontSize: 12,
                color: "#F87171",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                marginBottom: 6,
              }}
            >
              ₹70,00,000 — TCS applies at 20%
            </div>
            <div
              style={{
                height: 28,
                background: "rgba(248,113,113,0.22)",
                borderRadius: 6,
                width: "87.5%",
                ...a("d-barX", 600, 1000, "ease-out"),
                transformOrigin: "left center",
              }}
            />
          </div>

          {/* Result box with counter */}
          <div
            style={{
              ...a("d-up", 550, 1200),
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12,
              padding: "18px 22px",
              marginTop: 6,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 44,
                fontWeight: 800,
                color: "#F87171",
                lineHeight: 1,
              }}
            >
              {counterActive ? (
                <Counter target={1_400_000} duration={1100} />
              ) : (
                "₹0"
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 12,
                color: "rgba(255,255,255,0.38)",
                marginTop: 7,
              }}
            >
              TCS Deducted — Refundable via ITR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCENE 3 — The Optimization ──────────────────────────────────────────────
function Scene3() {
  const [priyaActive, setPriyaActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPriyaActive(true), 2500);
    const t2 = setTimeout(() => setShowResult(true), 3500);
    const t3 = setTimeout(() => setShowTagline(true), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "0 90px",
      }}
    >
      {/* Question headline */}
      <div
        style={{
          ...a("d-fade", 600, 0),
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 44,
          fontWeight: 800,
          color: "#FFFFFC",
          textAlign: "center",
          marginBottom: 52,
        }}
      >
        What if his wife had invested{" "}
        <span style={{ color: "#B4E3C8" }}>₹10L</span>?
      </div>

      {/* Card comparison */}
      <div
        style={{
          ...a("d-up", 600, 550),
          display: "flex",
          gap: 20,
          width: "100%",
          maxWidth: 820,
          marginBottom: 20,
        }}
      >
        {/* Rajesh alone — red */}
        <div
          style={{
            flex: 1,
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.22)",
            borderRadius: 18,
            padding: "26px 30px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9,
              color: "#F87171",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            RAJESH ALONE
          </div>
          {[
            { k: "Remittance", v: "₹80,00,000", c: "#FFFFFC" },
            { k: "TCS", v: "₹14,00,000 ❌", c: "#F87171" },
            { k: "Effective cost", v: "17.5%", c: "#F87171" },
          ].map((r) => (
            <div
              key={r.k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Priya — activates green */}
        <div
          style={{
            flex: 1,
            background: priyaActive
              ? "rgba(5,160,73,0.07)"
              : "rgba(255,255,255,0.02)",
            border: priyaActive
              ? "1px solid rgba(5,160,73,0.3)"
              : "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: "26px 30px",
            opacity: priyaActive ? 1 : 0.48,
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: priyaActive
              ? "0 0 48px rgba(5,160,73,0.1)"
              : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9,
                color: priyaActive ? "#B4E3C8" : "rgba(255,255,255,0.28)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              PRIYA (WIFE)
            </div>
            {!priyaActive && (
              <div
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Untouched this FY
              </div>
            )}
          </div>
          {[
            { k: "Limit available", v: "₹10,00,000", c: "#FFFFFC" },
            { k: "TCS if used", v: "₹0 ✓", c: "#05A049" },
            { k: "Within threshold", v: "Yes", c: "#B4E3C8" },
          ].map((r) => (
            <div
              key={r.k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result panel */}
      {showResult && (
        <div
          style={{
            ...a("d-scale", 600, 0),
            width: "100%",
            maxWidth: 820,
            background:
              "linear-gradient(135deg,rgba(5,160,73,0.09),rgba(5,160,73,0.03))",
            border: "1.5px solid rgba(5,160,73,0.26)",
            borderRadius: 20,
            padding: "26px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 10,
                fontWeight: 700,
                color: "#05A049",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              NEXT FY STRATEGY
            </div>
            <div
              style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 22,
                fontWeight: 700,
                color: "#FFFFFC",
                marginBottom: 8,
              }}
            >
              Route ₹10L through Priya before April 1st
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 13,
                color: "rgba(255,255,255,0.32)",
              }}
            >
              Priya&apos;s ₹10L limit: completely unused this FY → ₹0 TCS
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 32 }}>
            <div
              style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 52,
                fontWeight: 800,
                color: "#05A049",
                lineHeight: 1,
              }}
            >
              <Counter target={1_400_000} duration={1200} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 12,
                color: "rgba(255,255,255,0.32)",
                marginTop: 5,
              }}
            >
              TCS saved next FY
            </div>
          </div>
        </div>
      )}

      {/* Tagline */}
      {showTagline && (
        <div
          style={{
            ...a("d-fade", 800, 0),
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(255,255,255,0.22)",
            textAlign: "center",
          }}
        >
          Two PANs. Two thresholds. Zero TCS.
        </div>
      )}
    </div>
  );
}

// ─── SCENE 4 — The Portfolio ─────────────────────────────────────────────────
function Scene4() {
  const [harvestOn, setHarvestOn] = useState(false);
  const [showCallout, setShowCallout] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHarvestOn(true), 2500);
    const t2 = setTimeout(() => setShowCallout(true), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const portfolio = DEMO_CLIENT.portfolio;

  const borderColor: Record<string, string> = {
    LTCG: "#05A049",
    STCL: "#F87171",
    STCG: "#F59E0B",
  };
  const rowBg: Record<string, string> = {
    LTCG: "rgba(5,160,73,0.04)",
    STCL: "rgba(248,113,113,0.04)",
    STCG: "rgba(245,158,11,0.04)",
  };
  const pillStyle: Record<string, React.CSSProperties> = {
    LTCG: {
      background: "rgba(5,160,73,0.14)",
      color: "#05A049",
      border: "1px solid rgba(5,160,73,0.3)",
    },
    STCL: {
      background: "rgba(248,113,113,0.12)",
      color: "#F87171",
      border: "1px solid rgba(248,113,113,0.3)",
    },
    STCG: {
      background: "rgba(245,158,11,0.12)",
      color: "#F59E0B",
      border: "1px solid rgba(245,158,11,0.3)",
    },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "32px 72px 28px",
      }}
    >
      {/* Header */}
      <div style={{ ...a("d-up", 600, 0), marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 30,
            fontWeight: 800,
            color: "#FFFFFC",
          }}
        >
          Rajesh&rsquo;s Global Portfolio
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 11,
            color: "rgba(255,255,255,0.28)",
            marginTop: 4,
          }}
        >
          6 positions · FY 2025-26 · Exchange rate ₹84.50
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          background: "rgba(10,30,42,0.55)",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "88px minmax(0,1fr) 60px 78px 88px 110px 68px 140px",
            padding: "11px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 9,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>STOCK</span>
          <span>NAME</span>
          <span>UNITS</span>
          <span style={{ textAlign: "right" }}>BUY $</span>
          <span style={{ textAlign: "right" }}>NOW $</span>
          <span style={{ textAlign: "right" }}>P/L (₹)</span>
          <span style={{ textAlign: "center" }}>TYPE</span>
          <span style={{ textAlign: "right" }}>TAX EXPOSURE</span>
        </div>

        {portfolio.map((pos, i) => {
          const isH = !!pos.harvestable;
          const glowing = isH && harvestOn;
          const pnl =
            pos.unrealizedGainINR ?? pos.unrealizedLossINR ?? 0;
          const positive = pnl > 0;

          let taxText: React.ReactNode;
          if (pos.type === "STCL") {
            taxText = (
              <span style={{ color: "#05A049", fontSize: 11 }}>
                +{fmtINR(pos.taxSavedIfHarvested ?? 0)} if harvested
              </span>
            );
          } else if (pos.type === "LTCG") {
            taxText = (
              <span style={{ color: "#F59E0B", fontSize: 11 }}>
                {fmtINR(pos.taxPayable ?? 0)} LTCG
              </span>
            );
          } else {
            taxText = (
              <span style={{ color: "#F59E0B", fontSize: 11 }}>
                {fmtINR(pos.taxIfSellNow ?? 0)} STCG
              </span>
            );
          }

          return (
            <div
              key={pos.ticker}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "88px minmax(0,1fr) 60px 78px 88px 110px 68px 140px",
                padding: "13px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                borderLeft: `3px solid ${borderColor[pos.type]}`,
                background: glowing
                  ? "rgba(5,160,73,0.07)"
                  : rowBg[pos.type],
                alignItems: "center",
                animation: glowing
                  ? `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${400 + i * 120}ms both, d-harvest-glow 2s ease-in-out infinite`
                  : `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${400 + i * 120}ms both`,
                transition: "background 0.5s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#FFFFFC",
                }}
              >
                {pos.ticker}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter,'Inter',sans-serif)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {pos.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {pos.units}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  textAlign: "right",
                }}
              >
                ${pos.buyPrice}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 12,
                  color: "#FFFFFC",
                  textAlign: "right",
                }}
              >
                ${pos.currentPrice}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 12,
                  color: positive ? "#05A049" : "#F87171",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                {positive ? "+" : ""}
                {fmtINR(pnl)}
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    ...pillStyle[pos.type],
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "3px 7px",
                    borderRadius: 4,
                    letterSpacing: "0.04em",
                  }}
                >
                  {pos.type}
                </span>
                {glowing && (
                  <span
                    style={{
                      ...a("d-fade", 400, 0),
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: 8,
                      color: "#B4E3C8",
                      fontWeight: 700,
                    }}
                  >
                    ⚡ HARVEST
                  </span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>{taxText}</div>
            </div>
          );
        })}
      </div>

      {/* Callout */}
      {showCallout && (
        <div
          style={{
            ...a("d-up", 600, 0),
            marginTop: 14,
            background: "rgba(5,160,73,0.08)",
            border: "1px solid rgba(5,160,73,0.2)",
            borderRadius: 12,
            padding: "14px 24px",
            fontFamily: "var(--font-inter,'Inter',sans-serif)",
            fontSize: 14,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          3 positions in loss → ₹9,68,877 harvestable STCL →{" "}
          <strong style={{ color: "#05A049" }}>
            ₹4,13,941 potential tax saving
          </strong>
        </div>
      )}
    </div>
  );
}

// ─── SCENE 5 — The TLH Engine ────────────────────────────────────────────────
function Scene5() {
  const [showAfter, setShowAfter] = useState(false);
  const [showBigNum, setShowBigNum] = useState(false);
  const [showMsft, setShowMsft] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowAfter(true), 3000);
    const t2 = setTimeout(() => setShowBigNum(true), 4000);
    const t3 = setTimeout(() => setShowMsft(true), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const actions = [
    {
      num: 1,
      ticker: "NVDA",
      action: "Sell 22 units @ $116",
      loss: "₹6,85,971 STCL",
      saved: "₹2,93,129",
      delay: 600,
    },
    {
      num: 2,
      ticker: "TSLA",
      action: "Sell 30 units @ $178",
      loss: "₹2,58,570 STCL",
      saved: "₹1,10,413",
      delay: 900,
    },
    {
      num: 3,
      ticker: "GOOGL",
      action: "Sell 12 units @ $154",
      loss: "₹24,336 STCL",
      saved: "₹10,399",
      delay: 1200,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        alignItems: "stretch",
        padding: "36px 72px",
        gap: 48,
      }}
    >
      {/* LEFT — Actions */}
      <div
        style={{
          flex: "0 0 40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          ...a("d-left", 700, 0),
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 10,
            color: "#05A049",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          TAX LOSS HARVESTING
        </div>
        <div
          style={{
            ...a("d-up", 600, 200),
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 38,
            fontWeight: 800,
            lineHeight: 1.18,
            color: "#FFFFFC",
            marginBottom: 32,
          }}
        >
          Harvest 3 positions.
          <br />
          <span style={{ color: "#05A049" }}>Save ₹4.13 lakh.</span>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}
        >
          {actions.map((ac) => (
            <div
              key={ac.ticker}
              style={{
                ...a("d-left", 500, ac.delay),
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#05A049",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#00111B",
                  flexShrink: 0,
                }}
              >
                {ac.num}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#FFFFFC",
                  }}
                >
                  {ac.ticker} ← {ac.action}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-inter,'Inter',sans-serif)",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.38)",
                    marginTop: 2,
                  }}
                >
                  {ac.loss}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#05A049",
                  }}
                >
                  Tax saved: {ac.saved}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wash-sale note */}
        <div
          style={{
            ...a("d-up", 550, 2500),
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10,
            padding: "13px 16px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 11,
              color: "#F59E0B",
              lineHeight: 1.75,
            }}
          >
            No wash-sale rule in India.
            <br />
            Rebuy all 3 positions immediately.
            <br />
            Cost basis resets. Loss is locked in.
          </div>
        </div>
      </div>

      {/* RIGHT — Before / After */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
          ...a("d-right", 700, 200),
        }}
      >
        {/* Before */}
        <div
          style={{
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.15)",
            borderRadius: 16,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9,
              color: "#F87171",
              letterSpacing: "0.15em",
              marginBottom: 14,
            }}
          >
            BEFORE HARVESTING
          </div>
          {[
            { label: "STCG payable (MSFT)", val: "₹31,588" },
            { label: "LTCG payable (AAPL + SPY)", val: "₹33,350" },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{r.label}</span>
              <span style={{ color: "#F87171", fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Total</span>
            <span style={{ color: "#F87171" }}>₹64,938</span>
          </div>
        </div>

        {/* After */}
        {showAfter && (
          <div
            style={{
              background: "rgba(5,160,73,0.06)",
              border: "1px solid rgba(5,160,73,0.2)",
              borderRadius: 16,
              padding: "20px 24px",
              animation: "d-sweep 600ms ease-out both",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9,
                color: "#05A049",
                letterSpacing: "0.15em",
                marginBottom: 14,
              }}
            >
              AFTER HARVESTING
            </div>
            {[
              { label: "Available STCL", val: "₹9,68,877", c: "#B4E3C8" },
              { label: "Offsets STCG", val: "₹31,588 → ₹0 ✓", c: "#05A049" },
              { label: "Offsets LTCG", val: "₹33,350 → ₹0 ✓", c: "#05A049" },
              {
                label: "Carry-forward (valid 8 yrs)",
                val: "₹9,03,939",
                c: "#B4E3C8",
              },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontFamily: "var(--font-inter,'Inter',sans-serif)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  {r.label}
                </span>
                <span style={{ color: r.c, fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Giant result */}
        {showBigNum && (
          <div
            style={{
              ...a("d-scale", 600, 0),
              textAlign: "center",
              padding: "22px",
              background: "rgba(5,160,73,0.04)",
              borderRadius: 16,
              border: "1px solid rgba(5,160,73,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 64,
                fontWeight: 800,
                color: "#05A049",
                lineHeight: 1,
              }}
            >
              <Counter target={413_941} duration={1400} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255,255,255,0.45)",
                marginTop: 7,
              }}
            >
              Tax saved this action
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 11,
                color: "#B4E3C8",
                marginTop: 4,
              }}
            >
              Effective tax rate: 0% on all portfolio gains
            </div>
          </div>
        )}

        {/* MSFT callout */}
        {showMsft && (
          <div
            style={{
              ...a("d-up", 500, 0),
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 12,
              padding: "13px 18px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 11,
                color: "#F59E0B",
                lineHeight: 1.75,
              }}
            >
              MSFT: Don&rsquo;t sell yet. 150 days to LTCG threshold.
              <br />
              Wait → tax drops from ₹31,588 to ₹11,053
              <br />
              <strong>Save an additional ₹20,535 by waiting.</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCENE 6 — The AI ────────────────────────────────────────────────────────
function Scene6() {
  const QUESTION = DEMO_CLIENT.ai.question;
  const TYPING_MS = 20; // ms per char → ~3.9s for 194 chars

  const [typedQ, setTypedQ] = useState("");
  const [showDots, setShowDots] = useState(false);
  const [aiText, setAiText] = useState("");
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const aiStarted = useRef(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiText, showDots, typedQ]);

  useEffect(() => {
    let cancelled = false;
    const questionDuration = QUESTION.length * TYPING_MS;

    // 1s: start typing question
    const t1 = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        if (cancelled) { clearInterval(iv); return; }
        i++;
        setTypedQ(QUESTION.slice(0, i));
        if (i >= QUESTION.length) clearInterval(iv);
      }, TYPING_MS);
    }, 1000);

    // after question done + 300ms: show typing dots
    const t2 = setTimeout(
      () => { if (!cancelled) setShowDots(true); },
      1000 + questionDuration + 300
    );

    // after dots (1.8s): start AI
    const t3 = setTimeout(() => {
      if (cancelled || aiStarted.current) return;
      aiStarted.current = true;
      setShowDots(false);
      startRef.current = Date.now();
      streamAI();
    }, 1000 + questionDuration + 300 + 1800);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streamAI = async () => {
    try {
      const resp = await fetch("/api/ai-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: DEMO_CLIENT.ai.userMessage }),
      });
      if (!resp.body) return;
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const d = JSON.parse(raw) as { content?: string; done?: boolean };
            if (d.content) setAiText((p) => p + d.content);
            if (d.done) {
              setDone(true);
              setElapsed((Date.now() - startRef.current) / 1000);
            }
          } catch { /* ignore */ }
        }
      }
      setDone(true);
      setElapsed((Date.now() - startRef.current) / 1000);
    } catch {
      setAiText("Unable to reach AI service. Check your OPENAI_API_KEY.");
      setDone(true);
    }
  };

  const highlightRupees = (text: string): React.ReactNode => {
    const parts = text.split(/(₹[\d,]+(?:\.\d+)?(?:\s*(?:L|Cr|K|lakh|crore))?)/gi);
    return parts.map((p, i) =>
      /^₹/.test(p) ? (
        <span
          key={i}
          style={{
            background: "rgba(5,160,73,0.18)",
            borderRadius: 3,
            padding: "0 2px",
          }}
        >
          {p}
        </span>
      ) : (
        p
      )
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        padding: "36px 80px 28px",
      }}
    >
      {/* Header */}
      <div
        style={{
          ...a("d-fade", 600, 0),
          textAlign: "center",
          marginBottom: 28,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 10,
            color: "#B4E3C8",
            letterSpacing: "0.22em",
            marginBottom: 12,
          }}
        >
          VALURA AI · GIFT CITY ADVISOR
        </div>
        <div
          style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 36,
            fontWeight: 800,
            color: "#FFFFFC",
          }}
        >
          Ask anything. Get exact numbers.
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginTop: 14,
          }}
        >
          {["Rajesh Kumar", "₹80L LRS", "6 holdings", "FY ends in 8 days"].map(
            (c, i) => (
              <div
                key={c}
                style={{
                  ...a("d-fade", 400, 280 + i * 80),
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 10,
                  color: "#B4E3C8",
                  background: "rgba(180,227,200,0.08)",
                  border: "1px solid rgba(180,227,200,0.15)",
                  borderRadius: 100,
                  padding: "4px 12px",
                }}
              >
                {c}
              </div>
            )
          )}
        </div>
      </div>

      {/* Chat */}
      <div
        ref={chatRef}
        className="demo-chat"
        style={{
          width: "100%",
          maxWidth: 740,
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          paddingRight: 4,
        }}
      >
        {/* User bubble */}
        {typedQ && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                background: "#1D3244",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "4px 14px 14px 14px",
                padding: "14px 18px",
                maxWidth: "84%",
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 14,
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.68,
              }}
            >
              {typedQ}
              {typedQ.length < QUESTION.length && (
                <span
                  style={{
                    animation: "d-cursor 0.8s step-end infinite",
                    borderRight: "2px solid #B4E3C8",
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
                marginTop: 4,
                marginLeft: 4,
              }}
            >
              just now
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {showDots && (
          <div
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <div
              style={{
                background: "rgba(5,160,73,0.07)",
                border: "1px solid rgba(5,160,73,0.18)",
                borderRadius: "14px 14px 4px 14px",
                padding: "14px 20px",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#05A049",
                    animation: `d-dot-pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI response */}
        {aiText && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9,
                color: "#05A049",
                marginBottom: 5,
                marginRight: 4,
              }}
            >
              Valura AI
            </div>
            <div
              style={{
                background: "rgba(5,160,73,0.07)",
                border: "1px solid rgba(5,160,73,0.18)",
                borderRadius: "14px 14px 4px 14px",
                padding: "16px 20px",
                maxWidth: "92%",
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 14,
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
              }}
            >
              {highlightRupees(aiText)}
              {!done && (
                <span
                  style={{
                    animation: "d-cursor 0.8s step-end infinite",
                    borderRight: "2px solid #05A049",
                    marginLeft: 1,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Done state */}
        {done && (
          <div
            style={{
              ...a("d-fade", 500, 0),
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              Response time: {elapsed.toFixed(1)}s · Exact numbers · CA-ready
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCENE 7 — The Payoff ────────────────────────────────────────────────────
function Scene7() {
  const [showTotal, setShowTotal] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTotal(true), 3000);
    const t2 = setTimeout(() => setShowFinal(true), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const boxes = [
    {
      value: 1_400_000,
      label: "TCS eliminated via family LRS optimization",
      sub: "Wife's ₹10L threshold — next FY strategy",
      color: "#05A049",
      delay: 400,
    },
    {
      value: 413_941,
      label: "Tax saved via TLH (NVDA + TSLA + GOOGL)",
      sub: "0% effective rate on all portfolio gains",
      color: "#05A049",
      delay: 550,
    },
    {
      value: 112_000,
      label: "IRR drag recovered (TCS lock-up cost)",
      sub: "8 months × ₹14L × 12% assumed return",
      color: "#B4E3C8",
      delay: 700,
    },
    {
      value: 0,
      label: "Time to find and execute all 3 actions",
      sub: "Via Valura platform + AI advisor",
      color: "#B8913A",
      delay: 850,
      special: "< 8 min",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "36px 90px",
        background:
          "radial-gradient(ellipse at 50% 45%,rgba(5,160,73,0.07) 0%,#00111B 68%)",
      }}
    >
      <div
        style={{
          ...a("d-fade", 600, 0),
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 10,
          color: "#05A049",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        VALURA GIFT CITY DEMO SUMMARY
      </div>

      <div
        style={{
          ...a("d-up", 600, 200),
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 40,
          fontWeight: 800,
          color: "#FFFFFC",
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        What we just did for Rajesh
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 960,
          marginBottom: 32,
        }}
      >
        {boxes.map((b, i) => (
          <div
            key={i}
            style={{
              animation: `d-stat 700ms cubic-bezier(0.16,1,0.3,1) ${b.delay}ms both`,
              background: "rgba(5,160,73,0.06)",
              border: "1px solid rgba(5,160,73,0.15)",
              borderRadius: 20,
              padding: "28px 30px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 42,
                fontWeight: 800,
                color: b.color,
                lineHeight: 1,
                marginBottom: 10,
              }}
            >
              {b.special ? (
                b.special
              ) : (
                <Counter target={b.value} duration={1600} />
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.65)",
                marginBottom: 4,
              }}
            >
              {b.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter,'Inter',sans-serif)",
                fontSize: 11,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {b.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Grand total */}
      {showTotal && (
        <div
          style={{
            ...a("d-total", 700, 0),
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 14,
              color: "rgba(255,255,255,0.38)",
              marginBottom: 6,
            }}
          >
            Total client value created this FY:
          </div>
          <div
            style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 60,
              fontWeight: 800,
              color: "#05A049",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            <Counter target={1_925_941} duration={1900} />
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 15,
              color: "rgba(255,255,255,0.28)",
              fontStyle: "italic",
            }}
          >
            Across 3 strategies. One conversation. Zero complexity for the
            client.
          </div>
        </div>
      )}

      {showFinal && (
        <div
          style={{
            ...a("d-fade", 900, 0),
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.18)",
            textAlign: "center",
            marginTop: 18,
          }}
        >
          This is what Valura does for every client in your book.
        </div>
      )}
    </div>
  );
}

// ─── Scene renderer ───────────────────────────────────────────────────────────
function renderScene(idx: number) {
  switch (idx) {
    case 0: return <Scene1 />;
    case 1: return <Scene2 />;
    case 2: return <Scene3 />;
    case 3: return <Scene4 />;
    case 4: return <Scene5 />;
    case 5: return <Scene6 />;
    case 6: return <Scene7 />;
    default: return null;
  }
}

// Transition animation names (forward direction)
const EXIT_ANIMS = [
  "d-fadeScaleOut",
  "d-slideLeftOut",
  "d-fadeOut",
  "d-fadeOut",
  "d-slideLeftOut",
  "d-fadeOut",
  "d-dissolveOut",
];
const ENTER_ANIMS = [
  "d-fadeIn",
  "d-slideUpIn",
  "d-slideRightIn",
  "d-fadeIn",
  "d-slideRightIn",
  "d-scaleUpIn",
  "d-explodeIn",
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [displayScene, setDisplayScene] = useState(0);
  const [exitScene, setExitScene] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [recordMode, setRecordMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scale canvas to viewport ────────────────────────────────────────────
  useEffect(() => {
    function scale() {
      const root = document.getElementById("demo-root");
      if (!root) return;
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const l = (window.innerWidth - 1920 * s) / 2;
      const t = Math.max(0, (window.innerHeight - 1080 * s) / 2);
      Object.assign(root.style, {
        transform: `scale(${s})`,
        transformOrigin: "top left",
        left: `${Math.max(0, l)}px`,
        top: `${t}px`,
        position: "absolute",
      });
    }
    scale();
    window.addEventListener("resize", scale);
    return () => window.removeEventListener("resize", scale);
  }, []);

  // ── Navigate ────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (next: number) => {
      if (isTransitioning) return;
      const clamped = Math.max(0, Math.min(6, next));
      if (clamped === displayScene) return;
      setIsTransitioning(true);
      setExitScene(displayScene);
      setTimeout(() => {
        setDisplayScene(clamped);
        setExitScene(null);
      }, 600); // 400ms exit + 200ms gap
      setTimeout(() => setIsTransitioning(false), 1150);
    },
    [isTransitioning, displayScene]
  );

  const nav = useCallback((dir: number) => goTo(displayScene + dir), [goTo, displayScene]);

  // ── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "ArrowDown":
          e.preventDefault();
          nav(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nav(-1);
          break;
        case "p":
        case "P":
          setRecordMode((r) => !r);
          break;
        case "r":
        case "R":
          setDisplayScene(0);
          setExitScene(null);
          setIsTransitioning(false);
          break;
        case "a":
        case "A":
          setAutoPlay((p) => !p);
          break;
        case "f":
        case "F":
          document.documentElement.requestFullscreen?.().catch(() => {});
          break;
        default:
          if (e.key >= "1" && e.key <= "7") goTo(parseInt(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, goTo]);

  // ── Auto-play ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (!autoPlay) return;
    autoTimer.current = setTimeout(
      () => {
        if (displayScene < 6) nav(1);
        else setAutoPlay(false);
      },
      SCENE_DURATIONS[displayScene] * 1000
    );
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [autoPlay, displayScene, nav]);

  const exitAnim =
    exitScene !== null ? EXIT_ANIMS[exitScene] ?? "d-fadeOut" : "d-fadeOut";
  const enterAnim = ENTER_ANIMS[displayScene] ?? "d-fadeIn";

  return (
    <>
      <style>{DEMO_STYLES}</style>

      {/* Full-window wrapper */}
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#00111B",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Auto-play progress bar */}
        {autoPlay && !recordMode && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(255,255,255,0.07)",
              zIndex: 10001,
            }}
          >
            <div
              key={`pb-${displayScene}`}
              style={{
                height: "100%",
                background: "#05A049",
                transformOrigin: "left center",
                animation: `d-progress ${SCENE_DURATIONS[displayScene]}s linear forwards`,
              }}
            />
          </div>
        )}

        {/* 1920×1080 canvas */}
        <div
          id="demo-root"
          style={{
            width: 1920,
            height: 1080,
            overflow: "hidden",
            background: "#00111B",
            position: "relative",
          }}
        >
          {/* Exiting scene */}
          {exitScene !== null && (
            <div
              key={`exit-${exitScene}`}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                animation: `${exitAnim} 400ms cubic-bezier(0.16,1,0.3,1) forwards`,
              }}
            >
              {renderScene(exitScene)}
            </div>
          )}

          {/* Active scene */}
          <div
            key={`active-${displayScene}`}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              animation: `${enterAnim} 600ms cubic-bezier(0.16,1,0.3,1) forwards`,
            }}
          >
            {renderScene(displayScene)}
          </div>

          {/* Scene counter (present mode) */}
          {!recordMode && (
            <div
              style={{
                position: "absolute",
                bottom: 22,
                right: 28,
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 11,
                color: "rgba(255,255,255,0.16)",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {displayScene + 1} / 7
            </div>
          )}
        </div>

        {/* ── Navigator (outside canvas — natural viewport scale) ── */}
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(8,22,32,0.94)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 100,
            padding: "10px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            backdropFilter: "blur(24px)",
            zIndex: 10000,
            userSelect: "none",
            opacity: recordMode ? 0 : 1,
            pointerEvents: recordMode ? "none" : "auto",
            transition: "opacity 0.3s",
          }}
        >
          {/* Prev */}
          <button
            onClick={() => nav(-1)}
            disabled={displayScene === 0}
            style={{
              background: "none",
              border: "none",
              color:
                displayScene === 0
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(255,255,255,0.5)",
              cursor: displayScene === 0 ? "default" : "pointer",
              fontSize: 15,
              padding: "0 4px",
              transition: "color 0.2s",
            }}
          >
            ←
          </button>

          {/* Dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {SCENE_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                title={name}
                style={{
                  width: i === displayScene ? 26 : 7,
                  height: 7,
                  borderRadius: 4,
                  background:
                    i === displayScene
                      ? "#05A049"
                      : "rgba(255,255,255,0.18)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            ))}
          </div>

          {/* Scene label */}
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 11,
              color: "rgba(255,255,255,0.24)",
              whiteSpace: "nowrap",
            }}
          >
            {displayScene + 1} / 7 · {SCENE_NAMES[displayScene]}
          </span>

          {/* Next */}
          <button
            onClick={() => nav(1)}
            disabled={displayScene === 6}
            style={{
              background: "none",
              border: "none",
              color:
                displayScene === 6
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(255,255,255,0.5)",
              cursor: displayScene === 6 ? "default" : "pointer",
              fontSize: 15,
              padding: "0 4px",
              transition: "color 0.2s",
            }}
          >
            →
          </button>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 18,
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Auto-play */}
          <button
            onClick={() => setAutoPlay((p) => !p)}
            style={{
              background: autoPlay
                ? "rgba(5,160,73,0.15)"
                : "transparent",
              border: autoPlay
                ? "1px solid rgba(5,160,73,0.3)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              color: autoPlay ? "#05A049" : "rgba(255,255,255,0.38)",
              cursor: "pointer",
              fontSize: 11,
              padding: "4px 10px",
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              transition: "all 0.2s",
            }}
          >
            {autoPlay ? "⏸ MANUAL" : "▶ AUTO"}
          </button>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 18,
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Record mode */}
          <button
            onClick={() => setRecordMode(true)}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.28)",
              borderRadius: 100,
              color: "#EF4444",
              cursor: "pointer",
              fontSize: 11,
              padding: "4px 13px",
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#EF4444",
                animation: "d-rec-dot 1.4s step-end infinite",
              }}
            />
            RECORD
          </button>
        </div>

        {/* Record mode exit hint */}
        {recordMode && (
          <div
            style={{
              position: "fixed",
              top: 10,
              right: 14,
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9,
              color: "rgba(255,255,255,0.1)",
              zIndex: 10002,
              pointerEvents: "none",
            }}
          >
            P to exit record mode
          </div>
        )}
      </div>
    </>
  );
}
