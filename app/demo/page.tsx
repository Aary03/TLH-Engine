"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_CLIENT } from "@/lib/demo-data";

// ─── Scene metadata ───────────────────────────────────────────────────────────
const SCENE_NAMES = [
  "The First Message",
  "The Client",
  "The Problem",
  "The Optimization",
  "The Portfolio",
  "The TLH Engine",
  "The AI",
  "The Payoff",
  "The Delivery",
];
const SCENE_DURATIONS = [18, 10, 14, 16, 16, 18, 22, 16, 20];

// ─── Design tokens (light theme matching calculators) ─────────────────────────
const T = {
  bg:       "#FFFFFC",
  card:     "#ffffff",
  cardBg:   "#F9FAFB",
  border:   "#E5E7EB",
  dark:     "#00111B",
  body:     "#374151",
  muted:    "#9CA3AF",
  green:    "#05A049",
  greenBg:  "#EDFAF3",
  greenBrd: "#B4E3C8",
  mint:     "#B4E3C8",
  red:      "#DC2626",
  redBg:    "#FEF2F2",
  redBrd:   "#FECACA",
  amber:    "#F59E0B",
  amberBg:  "rgba(245,158,11,0.08)",
  amberBrd: "rgba(245,158,11,0.25)",
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const DEMO_STYLES = `
  @keyframes d-fadeScaleOut { to { opacity:0; transform:scale(0.97); } }
  @keyframes d-slideLeftOut  { to { opacity:0; transform:translateX(-60px); } }
  @keyframes d-fadeOut       { to { opacity:0; } }
  @keyframes d-dissolveOut   { to { opacity:0; transform:scale(1.02); } }

  @keyframes d-fadeIn       { from { opacity:0; }                              to { opacity:1; } }
  @keyframes d-slideUpIn    { from { opacity:0; transform:translateY(32px); }  to { opacity:1; transform:translateY(0); } }
  @keyframes d-slideRightIn { from { opacity:0; transform:translateX(60px); }  to { opacity:1; transform:translateX(0); } }
  @keyframes d-scaleUpIn    { from { opacity:0; transform:scale(0.93); }       to { opacity:1; transform:scale(1); } }
  @keyframes d-explodeIn    { from { opacity:0; transform:scale(0.86); }       to { opacity:1; transform:scale(1); } }

  @keyframes d-up    { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes d-fade  { from { opacity:0; }                              to { opacity:1; } }
  @keyframes d-left  { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }
  @keyframes d-right { from { opacity:0; transform:translateX(36px); }  to { opacity:1; transform:translateX(0); } }
  @keyframes d-scale { from { opacity:0; transform:scale(0.88); }       to { opacity:1; transform:scale(1); } }
  @keyframes d-row   { from { opacity:0; transform:translateY(6px); }   to { opacity:1; transform:translateY(0); } }
  @keyframes d-line  { from { width:0; }                                 to { width:460px; } }
  @keyframes d-barX  { from { transform:scaleX(0); opacity:0; }         to { transform:scaleX(1); opacity:1; } }
  @keyframes d-sweep { from { clip-path:inset(0 100% 0 0); }            to { clip-path:inset(0 0% 0 0); } }
  @keyframes d-stat  { from { opacity:0; transform:scale(0.87); }       to { opacity:1; transform:scale(1); } }
  @keyframes d-total { from { opacity:0; transform:translateY(24px); }  to { opacity:1; transform:translateY(0); } }
  @keyframes d-msg   { from { opacity:0; transform:translateY(10px); }  to { opacity:1; transform:translateY(0); } }

  @keyframes d-harvest-glow {
    0%,100% { box-shadow:-3px 0 8px rgba(5,160,73,0.35); }
    50%     { box-shadow:-3px 0 18px rgba(5,160,73,0.7); }
  }
  @keyframes d-dot-pulse {
    0%,100% { transform:scale(0.7); opacity:0.4; }
    50%     { transform:scale(1.2); opacity:1; }
  }
  @keyframes d-cursor  { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes d-rec-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes d-progress { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes d-ping {
    0%   { transform:scale(1);   opacity:1; }
    100% { transform:scale(2.2); opacity:0; }
  }

  /* Delivery scene */
  @keyframes d-report-in  { from { opacity:0; transform:scale(0.82) translateY(40px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes d-fly-wa  {
    0%   { opacity:1; transform:translate(0,0) scale(1); }
    30%  { opacity:1; transform:translate(-180px,20px) scale(0.9); }
    70%  { opacity:1; transform:translate(-380px,80px) scale(0.5); }
    100% { opacity:0; transform:translate(-520px,120px) scale(0.15); }
  }
  @keyframes d-fly-mail {
    0%   { opacity:1; transform:translate(0,0) scale(1); }
    30%  { opacity:1; transform:translate(180px,20px) scale(0.9); }
    70%  { opacity:1; transform:translate(380px,80px) scale(0.5); }
    100% { opacity:0; transform:translate(520px,120px) scale(0.15); }
  }
  @keyframes d-channel-pop {
    0%   { opacity:0; transform:scale(0.4) translateY(30px); }
    60%  { opacity:1; transform:scale(1.08) translateY(-4px); }
    100% { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes d-notif-bounce {
    0%   { transform:scale(0); opacity:0; }
    50%  { transform:scale(1.3); opacity:1; }
    75%  { transform:scale(0.9); }
    100% { transform:scale(1); opacity:1; }
  }
  @keyframes d-tick-draw {
    from { stroke-dashoffset:40; }
    to   { stroke-dashoffset:0; }
  }
  @keyframes d-glow-pulse {
    0%,100% { box-shadow:0 0 0 0 rgba(5,160,73,0); }
    50%     { box-shadow:0 0 0 18px rgba(5,160,73,0.12); }
  }
  @keyframes d-float {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-8px); }
  }

  .demo-chat::-webkit-scrollbar { width:4px; }
  .demo-chat::-webkit-scrollbar-track { background:transparent; }
  .demo-chat::-webkit-scrollbar-thumb { background:${T.greenBrd}; border-radius:2px; }

  .demo-root * { box-sizing:border-box; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-" : "") + "₹" + abs.toLocaleString("en-IN");
}
function anim(name: string, ms: number, delay = 0, ease = "cubic-bezier(0.16,1,0.3,1)"): React.CSSProperties {
  return { animation: `${name} ${ms}ms ${ease} ${delay}ms both` };
}

function Counter({ target, duration = 1400, prefix = "₹" }: { target: number; duration?: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{prefix}{val.toLocaleString("en-IN")}</>;
}

// Typing text component
function TypedText({ text, mspChar = 22, startDelay = 0, onDone }: { text: string; mspChar?: number; startDelay?: number; onDone?: () => void }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const t0 = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); onDone?.(); }
      }, mspChar);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.7s step-end infinite", marginLeft: 1 }} />
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — The First Message (messaging chain)
// ─────────────────────────────────────────────────────────────────────────────
function Scene1() {
  const [step, setStep] = useState(0);

  const clientMsg = "Hey Suresh, I invested ₹80 lakhs in global markets this year but the bank deducted ₹14 lakhs as TCS. Now FY is ending in 8 days and I have big losses in NVDA and TSLA sitting unrealized. I'm panicking — what do I do?";
  const partnerMsg = "Rajesh — I hear you. Let me check with Valura's AI right now. Give me 2 minutes.";
  const valuraQuery = "Rajesh Kumar — ₹80L remitted, ₹14L TCS deducted. Portfolio has NVDA (₹6.86L loss), TSLA (₹2.59L loss), GOOGL (₹0.24L loss). FY ends in 8 days. 3 urgent actions needed.";

  useEffect(() => {
    const times = [
      200,   // client bubble appears
      3800,  // partner reply
      6200,  // partner opens Valura
      8000,  // Valura query types
      12500, // Valura response
    ];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const MsgBubble = ({
    text, from, avatar, color, align, delay, typed, short,
  }: {
    text: string; from: string; avatar: string; color: string;
    align: "left" | "right"; delay: number; typed?: boolean; short?: boolean;
  }) => (
    <div style={{
      display: "flex",
      flexDirection: align === "right" ? "row-reverse" : "row",
      alignItems: "flex-end",
      gap: 10,
      ...anim("d-msg", 500, delay),
      maxWidth: short ? 480 : 660,
      alignSelf: align === "right" ? "flex-end" : "flex-start",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 13, fontWeight: 800,
        color: "#fff", flexShrink: 0,
        fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
      }}>{avatar}</div>
      <div>
        <div style={{
          fontSize: 10, fontWeight: 600, color: T.muted,
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          marginBottom: 4,
          textAlign: align === "right" ? "right" : "left",
        }}>{from}</div>
        <div style={{
          background: align === "right" ? T.card : T.cardBg,
          border: `1px solid ${T.border}`,
          borderRadius: align === "right" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "12px 16px",
          fontFamily: "var(--font-inter,'Inter',sans-serif)",
          fontSize: 14,
          color: T.dark,
          lineHeight: 1.7,
          boxShadow: "0 1px 4px rgba(0,17,27,0.06)",
        }}>
          {typed ? <TypedText text={text} startDelay={0} mspChar={18} /> : text}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 100px",
      background: T.bg,
    }}>
      {/* Header */}
      <div style={{ ...anim("d-fade", 500, 0), textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.greenBg, border: `1px solid ${T.greenBrd}`,
          borderRadius: 100, padding: "6px 16px", marginBottom: 12,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: "d-rec-dot 1.4s step-end infinite" }} />
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: "0.1em" }}>
            LIVE CLIENT SITUATION · FY 2025-26
          </span>
        </div>
        <div style={{
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 32, fontWeight: 800, color: T.dark, letterSpacing: "-0.02em",
        }}>
          It starts with a WhatsApp message.
        </div>
      </div>

      {/* Chat thread */}
      <div style={{
        width: "100%", maxWidth: 780,
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {/* Client message */}
        {step >= 1 && (
          <MsgBubble
            text={clientMsg} from="Rajesh Kumar · Client" avatar="RK"
            color="#6366F1" align="left" delay={0}
          />
        )}

        {/* Partner reply */}
        {step >= 2 && (
          <MsgBubble
            text={partnerMsg} from="Suresh Iyer · Wealth Manager" avatar="SI"
            color="#0EA5E9" align="right" delay={0} short
          />
        )}

        {/* Partner opens Valura */}
        {step >= 3 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-end" }}>
            <div style={{
              background: T.greenBg, border: `1px solid ${T.greenBrd}`,
              borderRadius: 14, padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: T.green, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 16,
              }}>⚡</div>
              <div>
                <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 12, fontWeight: 700, color: T.green }}>
                  Suresh opened Valura AI Advisor
                </div>
                <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.muted }}>
                  GIFT City · Tax Intelligence Platform
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Valura query (typed) */}
        {step >= 4 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-end", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4, textAlign: "right" }}>
              Suresh Iyer · Asking Valura AI
            </div>
            <div style={{
              background: "#F3F4F6",
              border: `1px solid ${T.border}`,
              borderRadius: "14px 4px 14px 14px",
              padding: "12px 16px",
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 14, color: T.dark, lineHeight: 1.7,
            }}>
              <TypedText text={valuraQuery} mspChar={14} />
            </div>
          </div>
        )}

        {/* Valura response */}
        {step >= 5 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-start", maxWidth: 700 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, background: T.green,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11,
              }}>⚡</div>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700 }}>
                Valura AI · GIFT City Advisor
              </span>
            </div>
            <div style={{
              background: T.greenBg,
              border: `1.5px solid ${T.greenBrd}`,
              borderRadius: "4px 14px 14px 14px",
              padding: "14px 18px",
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 14, color: T.dark, lineHeight: 1.75,
            }}>
              <TypedText
                mspChar={12}
                text={"Rajesh has 3 urgent actions before March 31:\n\n1. Harvest NVDA + TSLA + GOOGL losses NOW — saves ₹4,13,941 in tax.\n2. MSFT: do NOT sell — 150 days to LTCG, saves ₹20,535 by waiting.\n3. Next FY: route ₹10L through wife Priya — saves ₹14,00,000 TCS.\n\nTotal value: ₹19,25,941. Execute harvests by March 28 (T+2)."}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — The Client
// ─────────────────────────────────────────────────────────────────────────────
function Scene2() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", background: T.bg,
    }}>
      <div style={{
        ...anim("d-fade", 600, 0),
        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
        fontSize: 10, color: T.green, letterSpacing: "0.22em",
        textTransform: "uppercase", marginBottom: 28,
      }}>
        DEMO CLIENT · FY 2025-26
      </div>

      <div style={{
        ...anim("d-up", 700, 350),
        fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
        fontSize: 80, fontWeight: 800, color: T.dark,
        letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 34,
      }}>
        Rajesh Kumar
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 44 }}>
        {[
          { label: "₹1.2 Cr  ·  Annual Income", delay: 800 },
          { label: "HNI  ·  Old Tax Regime", delay: 950 },
          { label: "New Delhi  ·  Resident Indian", delay: 1100 },
        ].map(({ label, delay }) => (
          <div key={label} style={{
            ...anim("d-up", 550, delay),
            background: T.greenBg, border: `1px solid ${T.greenBrd}`,
            borderRadius: 100, padding: "8px 22px",
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 13, fontWeight: 600, color: T.body,
          }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{
        ...anim("d-line", 550, 1350, "ease-out"),
        height: 2, background: `linear-gradient(90deg,transparent,${T.green},transparent)`,
        marginBottom: 28, transformOrigin: "center",
      }} />

      <div style={{
        ...anim("d-fade", 650, 1750),
        textAlign: "center",
        fontFamily: "var(--font-inter,'Inter',sans-serif)",
        fontSize: 16, color: T.muted, fontStyle: "italic", lineHeight: 1.85,
      }}>
        Invested ₹80,00,000 in global markets this FY.
        <br />He has a problem. You&rsquo;re about to solve it.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — The Problem
// ─────────────────────────────────────────────────────────────────────────────
function Scene3() {
  const [counterActive, setCounterActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCounterActive(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      display: "flex", height: "100%", alignItems: "center",
      padding: "0 90px", gap: 80, background: T.bg,
    }}>
      {/* LEFT */}
      <div style={{ flex: "0 0 44%", ...anim("d-left", 700, 0) }}>
        <div style={{
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 10, color: T.green, letterSpacing: "0.15em",
          textTransform: "uppercase", marginBottom: 22,
        }}>THE TCS SITUATION</div>

        <div style={{
          ...anim("d-up", 600, 200),
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 36, fontWeight: 800, lineHeight: 1.2,
          color: T.dark, marginBottom: 20,
        }}>
          He remitted ₹80 lakh.
          <br />The government took{" "}
          <span style={{ color: T.red }}>₹14 lakh.</span>
        </div>

        <div style={{
          ...anim("d-fade", 600, 600),
          fontFamily: "var(--font-inter,'Inter',sans-serif)",
          fontSize: 14, color: T.body, lineHeight: 1.8, marginBottom: 28,
        }}>
          TCS deducted at 20% on ₹70L above threshold.
          <br />Locked. Sitting with the income tax department.
          <br />Won&rsquo;t be refunded until ITR is filed.
        </div>

        <div style={{
          ...anim("d-up", 550, 900),
          background: T.redBg,
          borderLeft: `3px solid ${T.red}`,
          borderRadius: "0 10px 10px 0",
          padding: "14px 18px",
        }}>
          <span style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 12, color: T.red,
          }}>
            ₹14L locked for 8 months = ₹1,12,000 in lost returns
          </span>
        </div>
      </div>

      {/* RIGHT — LRS visual */}
      <div style={{ flex: 1, ...anim("d-right", 700, 0) }}>
        <div style={{
          fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
          fontSize: 11, fontWeight: 700, color: T.muted,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 26,
        }}>
          RAJESH&apos;S LRS THIS FY
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bars */}
          {[
            { label: "₹80,00,000 remitted", w: "100%", bg: "rgba(5,160,73,0.15)", c: T.green, del: 400 },
            { label: "₹10,00,000 — TCS-free threshold", w: "12.5%", bg: "rgba(180,227,200,0.4)", c: "#059669", del: 700 },
            { label: "₹70,00,000 — TCS at 20%", w: "87.5%", bg: "rgba(220,38,38,0.1)", c: T.red, del: 1000 },
          ].map((r) => (
            <div key={r.label} style={{ ...anim("d-up", 500, r.del) }}>
              <div style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 12, color: r.c, marginBottom: 6,
              }}>{r.label}</div>
              <div style={{
                height: 32, background: r.bg, borderRadius: 6, width: r.w,
                ...anim("d-barX", 600, r.del, "ease-out"),
                transformOrigin: "left center",
                border: `1px solid ${r.c}33`,
              }} />
            </div>
          ))}

          {/* TCS box */}
          <div style={{
            ...anim("d-up", 550, 1200),
            background: T.redBg, border: `1px solid ${T.redBrd}`,
            borderRadius: 14, padding: "18px 22px",
          }}>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 44, fontWeight: 800, color: T.red, lineHeight: 1,
            }}>
              {counterActive ? <Counter target={1_400_000} duration={1100} /> : "₹0"}
            </div>
            <div style={{
              fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
              fontSize: 12, color: T.muted, marginTop: 7,
            }}>
              TCS Deducted — Refundable via ITR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — The Optimization
// ─────────────────────────────────────────────────────────────────────────────
function Scene4() {
  const [priyaActive, setPriyaActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPriyaActive(true), 2500);
    const t2 = setTimeout(() => setShowResult(true), 3500);
    const t3 = setTimeout(() => setShowTagline(true), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%",
      padding: "0 100px", background: T.bg,
    }}>
      <div style={{
        ...anim("d-fade", 600, 0),
        fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
        fontSize: 44, fontWeight: 800, color: T.dark,
        textAlign: "center", marginBottom: 48,
      }}>
        What if his wife had invested{" "}
        <span style={{ color: T.green }}>₹10L</span>?
      </div>

      <div style={{
        ...anim("d-up", 600, 550),
        display: "flex", gap: 20, width: "100%", maxWidth: 820, marginBottom: 20,
      }}>
        {/* Rajesh */}
        <div style={{
          flex: 1, background: T.redBg, border: `1px solid ${T.redBrd}`,
          borderRadius: 18, padding: "24px 28px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 9, color: T.red, letterSpacing: "0.15em", marginBottom: 16,
          }}>RAJESH ALONE</div>
          {[
            { k: "Remittance", v: "₹80,00,000", c: T.dark },
            { k: "TCS", v: "₹14,00,000 ❌", c: T.red },
            { k: "Effective cost", v: "17.5%", c: T.red },
          ].map((r) => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: 10, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13,
            }}>
              <span style={{ color: T.muted }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Priya */}
        <div style={{
          flex: 1,
          background: priyaActive ? T.greenBg : T.cardBg,
          border: priyaActive ? `1px solid ${T.greenBrd}` : `1px dashed ${T.border}`,
          borderRadius: 18, padding: "24px 28px",
          opacity: priyaActive ? 1 : 0.5,
          transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: priyaActive ? `0 0 32px rgba(5,160,73,0.12)` : "none",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9, color: priyaActive ? T.green : T.muted, letterSpacing: "0.15em",
            }}>PRIYA (WIFE)</div>
            {!priyaActive && (
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>
                Untouched this FY
              </div>
            )}
          </div>
          {[
            { k: "Limit available", v: "₹10,00,000", c: T.dark },
            { k: "TCS if used", v: "₹0 ✓", c: T.green },
            { k: "Within threshold", v: "Yes", c: T.green },
          ].map((r) => (
            <div key={r.k} style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: 10, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13,
            }}>
              <span style={{ color: T.muted }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {showResult && (
        <div style={{
          ...anim("d-scale", 600, 0),
          width: "100%", maxWidth: 820,
          background: "linear-gradient(135deg,rgba(5,160,73,0.07),rgba(5,160,73,0.03))",
          border: `1.5px solid ${T.greenBrd}`,
          borderRadius: 20, padding: "24px 34px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 22,
          boxShadow: "0 4px 24px rgba(5,160,73,0.1)",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
              fontSize: 10, fontWeight: 700, color: T.green,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
            }}>NEXT FY STRATEGY</div>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 22, fontWeight: 700, color: T.dark, marginBottom: 8,
            }}>
              Route ₹10L through Priya before April 1st
            </div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: T.muted }}>
              Priya&apos;s ₹10L limit: completely unused this FY → ₹0 TCS
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 32 }}>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 52, fontWeight: 800, color: T.green, lineHeight: 1,
            }}>
              <Counter target={1_400_000} duration={1200} />
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 12, color: T.muted, marginTop: 4 }}>
              TCS saved next FY
            </div>
          </div>
        </div>
      )}

      {showTagline && (
        <div style={{
          ...anim("d-fade", 800, 0),
          fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
          fontSize: 18, fontWeight: 600, color: T.muted, textAlign: "center",
        }}>
          Two PANs. Two thresholds. Zero TCS.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 — The Portfolio
// ─────────────────────────────────────────────────────────────────────────────
function Scene5() {
  const [harvestOn, setHarvestOn] = useState(false);
  const [showCallout, setShowCallout] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHarvestOn(true), 2500);
    const t2 = setTimeout(() => setShowCallout(true), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const portfolio = DEMO_CLIENT.portfolio;

  const borderColor: Record<string, string> = { LTCG: T.green, STCL: T.red, STCG: T.amber };
  const rowBg: Record<string, string> = {
    LTCG: "rgba(5,160,73,0.03)",
    STCL: "rgba(220,38,38,0.03)",
    STCG: "rgba(245,158,11,0.03)",
  };
  const pillStyle: Record<string, React.CSSProperties> = {
    LTCG: { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBrd}` },
    STCL: { background: T.redBg, color: T.red, border: `1px solid ${T.redBrd}` },
    STCG: { background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBrd}` },
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", padding: "28px 64px 24px", background: T.bg,
    }}>
      <div style={{ ...anim("d-up", 600, 0), marginBottom: 18 }}>
        <div style={{
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 36, fontWeight: 800, color: T.dark,
        }}>
          Rajesh&rsquo;s Global Portfolio
        </div>
        <div style={{
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 13, color: T.muted, marginTop: 4,
        }}>
          6 positions · FY 2025-26 · Exchange rate ₹84.50
        </div>
      </div>

      <div style={{
        flex: 1, background: T.card, borderRadius: 16,
        overflow: "hidden", border: `1px solid ${T.border}`,
        boxShadow: "0 1px 8px rgba(0,17,27,0.06)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "96px minmax(0,1fr) 60px 80px 90px 120px 72px 160px",
          padding: "13px 22px",
          borderBottom: `1px solid ${T.border}`,
          background: T.cardBg,
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 11, color: T.muted,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          <span>STOCK</span><span>NAME</span><span>UNITS</span>
          <span style={{ textAlign: "right" }}>BUY $</span>
          <span style={{ textAlign: "right" }}>NOW $</span>
          <span style={{ textAlign: "right" }}>P/L (₹)</span>
          <span style={{ textAlign: "center" }}>TYPE</span>
          <span style={{ textAlign: "right" }}>TAX EXPOSURE</span>
        </div>

        {portfolio.map((pos, i) => {
          const isH = !!pos.harvestable;
          const glowing = isH && harvestOn;
          const pnl = pos.unrealizedGainINR ?? pos.unrealizedLossINR ?? 0;
          const positive = pnl > 0;

          const taxText: React.ReactNode = pos.type === "STCL"
            ? <span style={{ color: T.green, fontSize: 13 }}>+{fmtINR(pos.taxSavedIfHarvested ?? 0)} saved</span>
            : pos.type === "LTCG"
              ? <span style={{ color: T.amber, fontSize: 13 }}>{fmtINR(pos.taxPayable ?? 0)} LTCG</span>
              : <span style={{ color: T.amber, fontSize: 13 }}>{fmtINR(pos.taxIfSellNow ?? 0)} STCG</span>;

          return (
            <div key={pos.ticker} style={{
              display: "grid",
              gridTemplateColumns: "96px minmax(0,1fr) 60px 80px 90px 120px 72px 160px",
              padding: "15px 22px",
              borderBottom: `1px solid ${T.border}`,
              borderLeft: `3px solid ${borderColor[pos.type]}`,
              background: glowing ? T.greenBg : rowBg[pos.type],
              alignItems: "center",
              animation: glowing
                ? `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${380 + i * 110}ms both, d-harvest-glow 2s ease-in-out infinite`
                : `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${380 + i * 110}ms both`,
              transition: "background 0.5s ease",
            }}>
              <span style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 15, fontWeight: 700, color: T.dark,
              }}>{pos.ticker}</span>
              <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.body }}>
                {pos.name}
              </span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.body }}>
                {pos.units}
              </span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.muted, textAlign: "right" }}>
                ${pos.buyPrice}
              </span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.dark, textAlign: "right", fontWeight: 600 }}>
                ${pos.currentPrice}
              </span>
              <span style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 14, color: positive ? T.green : T.red,
                fontWeight: 700, textAlign: "right",
              }}>
                {positive ? "+" : ""}{fmtINR(pnl)}
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{
                  ...pillStyle[pos.type],
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 4,
                }}>{pos.type}</span>
                {glowing && (
                  <span style={{
                    ...anim("d-fade", 400, 0),
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: 9, color: T.green, fontWeight: 700,
                  }}>⚡ HARVEST</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>{taxText}</div>
            </div>
          );
        })}
      </div>

      {showCallout && (
        <div style={{
          ...anim("d-up", 600, 0), marginTop: 14,
          background: T.greenBg, border: `1px solid ${T.greenBrd}`,
          borderRadius: 12, padding: "15px 24px",
          fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 16, color: T.body,
        }}>
          3 positions in loss → ₹9,68,877 harvestable STCL →{" "}
          <strong style={{ color: T.green }}>₹4,13,941 potential tax saving</strong>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 — The TLH Engine
// ─────────────────────────────────────────────────────────────────────────────
function Scene6() {
  const [showAfter, setShowAfter] = useState(false);
  const [showBigNum, setShowBigNum] = useState(false);
  const [showMsft, setShowMsft] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowAfter(true), 3000);
    const t2 = setTimeout(() => setShowBigNum(true), 4000);
    const t3 = setTimeout(() => setShowMsft(true), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const actions = [
    { num: 1, ticker: "NVDA", action: "Sell 22 units @ $116", loss: "₹6,85,971 STCL", saved: "₹2,93,129", delay: 600 },
    { num: 2, ticker: "TSLA", action: "Sell 30 units @ $178", loss: "₹2,58,570 STCL", saved: "₹1,10,413", delay: 900 },
    { num: 3, ticker: "GOOGL", action: "Sell 12 units @ $154", loss: "₹24,336 STCL", saved: "₹10,399", delay: 1200 },
  ];

  return (
    <div style={{
      display: "flex", height: "100%", alignItems: "stretch",
      padding: "32px 68px", gap: 44, background: T.bg,
    }}>
      {/* LEFT */}
      <div style={{
        flex: "0 0 40%", display: "flex", flexDirection: "column",
        justifyContent: "center", ...anim("d-left", 700, 0),
      }}>
        <div style={{
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: 10, color: T.green, letterSpacing: "0.15em",
          textTransform: "uppercase", marginBottom: 14,
        }}>TAX LOSS HARVESTING</div>

        <div style={{
          ...anim("d-up", 600, 200),
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 36, fontWeight: 800, lineHeight: 1.18,
          color: T.dark, marginBottom: 30,
        }}>
          Harvest 3 positions.
          <br /><span style={{ color: T.green }}>Save ₹4.13 lakh.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {actions.map((ac) => (
            <div key={ac.ticker} style={{
              ...anim("d-left", 500, ac.delay),
              display: "flex", gap: 14, alignItems: "flex-start",
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "14px 16px",
              boxShadow: "0 1px 4px rgba(0,17,27,0.05)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: T.green, display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>{ac.num}</div>
              <div>
                <div style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 13, fontWeight: 700, color: T.dark,
                }}>{ac.ticker} ← {ac.action}</div>
                <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {ac.loss}
                </div>
                <div style={{
                  fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                  fontSize: 15, fontWeight: 700, color: T.green,
                }}>Tax saved: {ac.saved}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          ...anim("d-up", 550, 2500),
          background: T.amberBg, border: `1px solid ${T.amberBrd}`,
          borderRadius: 10, padding: "12px 16px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 11, color: T.amber, lineHeight: 1.75,
          }}>
            No wash-sale rule in India.
            <br />Rebuy all 3 positions immediately.
            <br />Cost basis resets. Loss is locked in.
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 14, ...anim("d-right", 700, 200),
      }}>
        {/* Before */}
        <div style={{
          background: T.redBg, border: `1px solid ${T.redBrd}`,
          borderRadius: 16, padding: "18px 22px",
        }}>
          <div style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 9, color: T.red, letterSpacing: "0.15em", marginBottom: 12,
          }}>BEFORE HARVESTING</div>
          {[
            { label: "STCG payable (MSFT)", val: "₹31,588" },
            { label: "LTCG payable (AAPL + SPY)", val: "₹33,350" },
          ].map((r) => (
            <div key={r.label} style={{
              display: "flex", justifyContent: "space-between",
              marginBottom: 8, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13,
            }}>
              <span style={{ color: T.body }}>{r.label}</span>
              <span style={{ color: T.red, fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}
          <div style={{
            borderTop: `1px solid ${T.redBrd}`, paddingTop: 10,
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontWeight: 700, fontSize: 17,
          }}>
            <span style={{ color: T.body }}>Total</span>
            <span style={{ color: T.red }}>₹64,938</span>
          </div>
        </div>

        {showAfter && (
          <div style={{
            background: T.greenBg, border: `1px solid ${T.greenBrd}`,
            borderRadius: 16, padding: "18px 22px",
            animation: "d-sweep 600ms ease-out both",
          }}>
            <div style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9, color: T.green, letterSpacing: "0.15em", marginBottom: 12,
            }}>AFTER HARVESTING</div>
            {[
              { label: "Available STCL", val: "₹9,68,877", c: T.body },
              { label: "Offsets STCG", val: "₹31,588 → ₹0 ✓", c: T.green },
              { label: "Offsets LTCG", val: "₹33,350 → ₹0 ✓", c: T.green },
              { label: "Carry-forward (8 yrs)", val: "₹9,03,939", c: T.body },
            ].map((r) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 8, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13,
              }}>
                <span style={{ color: T.body }}>{r.label}</span>
                <span style={{ color: r.c, fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        )}

        {showBigNum && (
          <div style={{
            ...anim("d-scale", 600, 0),
            textAlign: "center", padding: "20px",
            background: T.greenBg, borderRadius: 16,
            border: `1.5px solid ${T.greenBrd}`,
            boxShadow: "0 4px 20px rgba(5,160,73,0.12)",
          }}>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 60, fontWeight: 800, color: T.green, lineHeight: 1,
            }}>
              <Counter target={413_941} duration={1400} />
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 600, color: T.body, marginTop: 7 }}>
              Tax saved this action
            </div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.green, marginTop: 4 }}>
              Effective tax rate: 0% on all portfolio gains
            </div>
          </div>
        )}

        {showMsft && (
          <div style={{
            ...anim("d-up", 500, 0),
            background: T.amberBg, border: `1px solid ${T.amberBrd}`,
            borderRadius: 12, padding: "12px 16px",
          }}>
            <div style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 11, color: T.amber, lineHeight: 1.75,
            }}>
              MSFT: Don&rsquo;t sell yet. 150 days to LTCG threshold.
              <br />Wait → tax drops from ₹31,588 to ₹11,053
              <br /><strong>Save an additional ₹20,535 by waiting.</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 7 — The AI
// ─────────────────────────────────────────────────────────────────────────────
function Scene7() {
  const QUESTION = DEMO_CLIENT.ai.question;
  const TYPING_MS = 20;

  const [typedQ, setTypedQ] = useState("");
  const [showDots, setShowDots] = useState(false);
  const [aiText, setAiText] = useState("");
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const aiStarted = useRef(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiText, showDots, typedQ]);

  useEffect(() => {
    let cancelled = false;
    const questionDuration = QUESTION.length * TYPING_MS;

    const t1 = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        if (cancelled) { clearInterval(iv); return; }
        i++;
        setTypedQ(QUESTION.slice(0, i));
        if (i >= QUESTION.length) clearInterval(iv);
      }, TYPING_MS);
    }, 1000);

    const t2 = setTimeout(() => { if (!cancelled) setShowDots(true); }, 1000 + questionDuration + 300);

    const t3 = setTimeout(() => {
      if (cancelled || aiStarted.current) return;
      aiStarted.current = true;
      setShowDots(false);
      startRef.current = Date.now();
      streamAI();
    }, 1000 + questionDuration + 300 + 1800);

    return () => {
      cancelled = true;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
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
            if (d.done) { setDone(true); setElapsed((Date.now() - startRef.current) / 1000); }
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
      /^₹/.test(p)
        ? <span key={i} style={{ background: T.greenBg, color: T.green, borderRadius: 3, padding: "0 2px", fontWeight: 600 }}>{p}</span>
        : p
    );
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      height: "100%", padding: "32px 80px 24px", background: T.bg,
    }}>
      <div style={{ ...anim("d-fade", 600, 0), textAlign: "center", marginBottom: 24, flexShrink: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.greenBg, border: `1px solid ${T.greenBrd}`,
          borderRadius: 100, padding: "5px 14px", marginBottom: 12,
        }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: "0.12em" }}>
            VALURA AI · GIFT CITY ADVISOR
          </span>
        </div>
        <div style={{
          fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
          fontSize: 34, fontWeight: 800, color: T.dark,
        }}>Ask anything. Get exact numbers.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {["Rajesh Kumar", "₹80L LRS", "6 holdings", "FY ends in 8 days"].map((c, i) => (
            <div key={c} style={{
              ...anim("d-fade", 400, 280 + i * 80),
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 10, color: T.green,
              background: T.greenBg, border: `1px solid ${T.greenBrd}`,
              borderRadius: 100, padding: "4px 12px",
            }}>{c}</div>
          ))}
        </div>
      </div>

      <div ref={chatRef} className="demo-chat" style={{
        width: "100%", maxWidth: 740, flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 16, paddingRight: 4,
      }}>
        {/* User bubble */}
        {typedQ && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{
              background: T.cardBg, border: `1px solid ${T.border}`,
              borderRadius: "4px 14px 14px 14px",
              padding: "13px 17px", maxWidth: "84%",
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 14, color: T.dark, lineHeight: 1.68,
              boxShadow: "0 1px 4px rgba(0,17,27,0.06)",
            }}>
              {typedQ}
              {typedQ.length < QUESTION.length && (
                <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.8s step-end infinite", marginLeft: 1 }} />
              )}
            </div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted, marginTop: 4, marginLeft: 4 }}>
              just now
            </div>
          </div>
        )}

        {/* Typing dots */}
        {showDots && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              background: T.greenBg, border: `1px solid ${T.greenBrd}`,
              borderRadius: "14px 14px 4px 14px",
              padding: "14px 20px", display: "flex", gap: 6, alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: T.green,
                  animation: `d-dot-pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* AI response */}
        {aiText && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9, color: T.green, marginBottom: 5, marginRight: 4, fontWeight: 700,
            }}>Valura AI</div>
            <div style={{
              background: T.greenBg, border: `1.5px solid ${T.greenBrd}`,
              borderRadius: "14px 14px 4px 14px",
              padding: "15px 19px", maxWidth: "92%",
              fontFamily: "var(--font-inter,'Inter',sans-serif)",
              fontSize: 14, color: T.dark, lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              boxShadow: "0 2px 12px rgba(5,160,73,0.1)",
            }}>
              {highlightRupees(aiText)}
              {!done && (
                <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.8s step-end infinite", marginLeft: 1 }} />
              )}
            </div>
          </div>
        )}

        {done && (
          <div style={{ ...anim("d-fade", 500, 0), display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 9, color: T.muted,
            }}>
              Response time: {elapsed.toFixed(1)}s · Exact numbers · CA-ready
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 8 — The Payoff
// ─────────────────────────────────────────────────────────────────────────────
function Scene8() {
  const [showTotal, setShowTotal] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTotal(true), 3000);
    const t2 = setTimeout(() => setShowFinal(true), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const boxes = [
    { value: 1_400_000, label: "TCS eliminated via family LRS optimization", sub: "Wife's ₹10L threshold — next FY strategy", color: T.green, delay: 400 },
    { value: 413_941, label: "Tax saved via TLH (NVDA + TSLA + GOOGL)", sub: "0% effective rate on all portfolio gains", color: T.green, delay: 550 },
    { value: 112_000, label: "IRR drag recovered (TCS lock-up cost)", sub: "8 months × ₹14L × 12% assumed return", color: "#059669", delay: 700 },
    { value: 0, label: "Time to find and execute all 3 actions", sub: "Via Valura platform + AI advisor", color: "#B8913A", delay: 850, special: "< 8 min" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", padding: "32px 90px",
      background: "radial-gradient(ellipse at 50% 40%,rgba(5,160,73,0.06) 0%,#FFFFFC 60%)",
    }}>
      <div style={{
        ...anim("d-fade", 600, 0),
        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
        fontSize: 10, color: T.green, letterSpacing: "0.22em",
        textTransform: "uppercase", marginBottom: 12,
      }}>VALURA GIFT CITY DEMO SUMMARY</div>

      <div style={{
        ...anim("d-up", 600, 200),
        fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
        fontSize: 38, fontWeight: 800, color: T.dark,
        textAlign: "center", marginBottom: 34,
      }}>
        What we just did for Rajesh
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 16, width: "100%", maxWidth: 960, marginBottom: 28,
      }}>
        {boxes.map((b, i) => (
          <div key={i} style={{
            animation: `d-stat 700ms cubic-bezier(0.16,1,0.3,1) ${b.delay}ms both`,
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: "26px 28px",
            boxShadow: "0 2px 16px rgba(0,17,27,0.06)",
            borderTop: `3px solid ${b.color}`,
          }}>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 40, fontWeight: 800, color: b.color, lineHeight: 1, marginBottom: 10,
            }}>
              {b.special ? b.special : <Counter target={b.value} duration={1600} />}
            </div>
            <div style={{
              fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
              fontSize: 13, fontWeight: 600, color: T.body, marginBottom: 4,
            }}>{b.label}</div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, color: T.muted }}>
              {b.sub}
            </div>
          </div>
        ))}
      </div>

      {showTotal && (
        <div style={{ ...anim("d-total", 700, 0), textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.muted, marginBottom: 4 }}>
            Total client value created this FY:
          </div>
          <div style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 58, fontWeight: 800, color: T.green, lineHeight: 1, marginBottom: 10,
          }}>
            <Counter target={1_925_941} duration={1900} />
          </div>
          <div style={{
            fontFamily: "var(--font-inter,'Inter',sans-serif)",
            fontSize: 15, color: T.muted, fontStyle: "italic",
          }}>
            Across 3 strategies. One conversation. Zero complexity for the client.
          </div>
        </div>
      )}

      {showFinal && (
        <div style={{
          ...anim("d-fade", 900, 0),
          fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
          fontSize: 14, fontWeight: 500, color: T.muted,
          textAlign: "center", marginTop: 16,
        }}>
          This is what Valura does for every client in your book.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 9 — The Delivery  (Valura report → WhatsApp + Email)
// ─────────────────────────────────────────────────────────────────────────────
function Scene9() {
  const [phase, setPhase] = useState<0|1|2|3>(0);
  // 0 = report visible, 1 = flying, 2 = channels glow, 3 = ticks + final line

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 3200);
    const t2 = setTimeout(() => setPhase(2), 4400);
    const t3 = setTimeout(() => setPhase(3), 6200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const reportActions = [
    { icon: "⚡", label: "Harvest NVDA + TSLA + GOOGL immediately",  saved: "₹4,13,941", color: T.green },
    { icon: "⏳", label: "Hold MSFT — 150 days to LTCG threshold",   saved: "₹20,535",   color: T.amber },
    { icon: "👨‍👩‍👧", label: "Route ₹10L via Priya next FY",             saved: "₹14,00,000", color: T.green },
  ];

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 80px", background: T.bg,
      overflow: "hidden", position: "relative",
    }}>

      {/* ── Valura Report Card ── */}
      <div style={{
        animation: "d-report-in 900ms cubic-bezier(0.16,1,0.3,1) 200ms both",
        ...(phase >= 1 ? {
          animation: `${phase === 1 ? "d-fly-wa 900ms cubic-bezier(0.4,0,1,1) 0ms forwards" : "none"}`,
          opacity: phase >= 2 ? 0 : 1,
        } : {}),
        width: 640, flexShrink: 0, position: "relative", zIndex: 2,
      }}>
        {/* Report header */}
        <div style={{
          background: T.dark, borderRadius: "20px 20px 0 0",
          padding: "22px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Valura logo */}
            <img src="/valura-logo.png" alt="Valura" style={{ height: 32, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />
            <div>
              <div style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}>GIFT CITY IFSC · ADVISOR REPORT</div>
              <div style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2,
              }}>FY 2025-26 Action Summary</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>
              PREPARED BY
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 13, fontWeight: 700, color: "#fff" }}>
              Suresh Iyer
            </div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
              Wealth Manager
            </div>
          </div>
        </div>

        {/* Client header */}
        <div style={{
          background: T.greenBg, borderTop: "none",
          padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${T.greenBrd}`,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, letterSpacing: "0.15em" }}>CLIENT</div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 22, fontWeight: 800, color: T.dark }}>
              Rajesh Kumar
            </div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted }}>
              New Delhi · PAN AAAPK7890Q · HNI Old Regime
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>TOTAL VALUE CREATED</div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 28, fontWeight: 800, color: T.green }}>
              ₹19,25,941
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: T.card, padding: "18px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
          {reportActions.map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "13px 16px", borderRadius: 12,
              background: T.cardBg, border: `1px solid ${T.border}`,
              ...anim("d-up", 500, 600 + i * 150),
            }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</div>
              <div style={{ flex: 1, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.body }}>
                {a.label}
              </div>
              <div style={{
                fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                fontSize: 16, fontWeight: 800, color: a.color, flexShrink: 0,
              }}>
                {a.saved}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          background: T.cardBg, borderRadius: "0 0 20px 20px",
          padding: "14px 28px", borderTop: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>
            Generated by Valura AI · March 28, 2026 · 09:41 AM
          </div>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, fontWeight: 700 }}>
            Execute by March 29 (T+2) →
          </div>
        </div>
      </div>

      {/* ── Flying report mini-clones ── */}
      {phase === 1 && (
        <>
          {/* flies to WhatsApp (left) */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            marginLeft: -320, marginTop: -180,
            width: 200, height: 120,
            background: T.card, borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 20px rgba(0,17,27,0.12)",
            animation: "d-fly-wa 900ms cubic-bezier(0.4,0,1,1) 0ms forwards",
            zIndex: 5, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ background: T.dark, height: 28, padding: "0 12px", display: "flex", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Valura Report</div>
            </div>
            <div style={{ padding: "8px 12px", fontSize: 10, color: T.muted, fontFamily: "var(--font-inter,'Inter',sans-serif)" }}>
              Rajesh Kumar · ₹19,25,941 saved
            </div>
          </div>
          {/* flies to Email (right) */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            marginLeft: 120, marginTop: -180,
            width: 200, height: 120,
            background: T.card, borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 20px rgba(0,17,27,0.12)",
            animation: "d-fly-mail 900ms cubic-bezier(0.4,0,1,1) 0ms forwards",
            zIndex: 5, overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ background: T.dark, height: 28, padding: "0 12px", display: "flex", alignItems: "center" }}>
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 8, color: "rgba(255,255,255,0.5)" }}>Valura Report</div>
            </div>
            <div style={{ padding: "8px 12px", fontSize: 10, color: T.muted, fontFamily: "var(--font-inter,'Inter',sans-serif)" }}>
              Rajesh Kumar · ₹19,25,941 saved
            </div>
          </div>
        </>
      )}

      {/* ── Channel icons ── */}
      {phase >= 2 && (
        <div style={{
          position: "absolute", bottom: 120, left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: 120,
        }}>

          {/* WhatsApp channel */}
          <div style={{
            animation: "d-channel-pop 700ms cubic-bezier(0.16,1,0.3,1) 0ms both",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <div style={{ position: "relative", animation: phase >= 2 ? "d-glow-pulse 2s ease-in-out infinite" : "none" }}>
              <img src="/whatsapp-logo.png" alt="WhatsApp" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 22 }} />
              {phase >= 3 && (
                <div style={{
                  position: "absolute", top: -8, right: -8,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#25D366",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "d-notif-bounce 600ms cubic-bezier(0.16,1,0.3,1) 0ms both",
                  border: "2px solid #fff",
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <polyline points="2,8 6,12 14,4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "d-tick-draw 400ms ease 100ms forwards" }} />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 15, fontWeight: 700, color: T.dark,
              }}>WhatsApp</div>
              {phase >= 3 && (
                <div style={{
                  ...anim("d-fade", 400, 200),
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 10, color: "#25D366", fontWeight: 600,
                }}>Delivered ✓✓</div>
              )}
            </div>
          </div>

          {/* Center arrow / logo */}
          <div style={{
            ...anim("d-fade", 600, 300),
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <img src="/valura-logo.png" alt="Valura" style={{ height: 40, objectFit: "contain", animation: "d-float 3s ease-in-out infinite" }} />
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.muted, letterSpacing: "0.1em" }}>
              SENT VIA VALURA
            </div>
          </div>

          {/* Email channel */}
          <div style={{
            animation: "d-channel-pop 700ms cubic-bezier(0.16,1,0.3,1) 80ms both",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          }}>
            <div style={{ position: "relative", animation: phase >= 2 ? "d-glow-pulse 2s ease-in-out 0.3s infinite" : "none" }}>
              <img src="/mail-logo.png" alt="Email" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 22 }} />
              {phase >= 3 && (
                <div style={{
                  position: "absolute", top: -8, right: -8,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#3B82F6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "d-notif-bounce 600ms cubic-bezier(0.16,1,0.3,1) 150ms both",
                  border: "2px solid #fff",
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <polyline points="2,8 6,12 14,4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "d-tick-draw 400ms ease 250ms forwards" }} />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
                fontSize: 15, fontWeight: 700, color: T.dark,
              }}>Email</div>
              {phase >= 3 && (
                <div style={{
                  ...anim("d-fade", 400, 350),
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 10, color: "#3B82F6", fontWeight: 600,
                }}>Delivered ✓✓</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final tagline */}
      {phase >= 3 && (
        <div style={{
          ...anim("d-up", 700, 800),
          position: "absolute", bottom: 52, left: 0, right: 0,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 26, fontWeight: 800, color: T.dark, marginBottom: 6,
          }}>
            Rajesh gets his action plan. Instantly.
          </div>
          <div style={{
            fontFamily: "var(--font-inter,'Inter',sans-serif)",
            fontSize: 15, color: T.muted, fontStyle: "italic",
          }}>
            No email chains. No follow-ups. Just clarity — delivered in seconds.
          </div>
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
    case 7: return <Scene8 />;
    case 8: return <Scene9 />;
    default: return null;
  }
}

const EXIT_ANIMS  = ["d-fadeScaleOut","d-slideLeftOut","d-fadeOut","d-fadeOut","d-fadeOut","d-slideLeftOut","d-fadeOut","d-dissolveOut","d-fadeOut"];
const ENTER_ANIMS = ["d-fadeIn","d-slideUpIn","d-slideRightIn","d-scaleUpIn","d-fadeIn","d-slideRightIn","d-scaleUpIn","d-explodeIn","d-scaleUpIn"];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [displayScene, setDisplayScene] = useState(0);
  const [exitScene, setExitScene]       = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [recordMode, setRecordMode]     = useState(false);
  const [autoPlay, setAutoPlay]         = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TOTAL = SCENE_NAMES.length;

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

  const goTo = useCallback((next: number) => {
    if (isTransitioning) return;
    const clamped = Math.max(0, Math.min(TOTAL - 1, next));
    if (clamped === displayScene) return;
    setIsTransitioning(true);
    setExitScene(displayScene);
    setTimeout(() => { setDisplayScene(clamped); setExitScene(null); }, 600);
    setTimeout(() => setIsTransitioning(false), 1150);
  }, [isTransitioning, displayScene, TOTAL]);

  const nav = useCallback((dir: number) => goTo(displayScene + dir), [goTo, displayScene]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowRight": case " ": case "ArrowDown": e.preventDefault(); nav(1); break;
        case "ArrowLeft":  case "ArrowUp":             e.preventDefault(); nav(-1); break;
        case "p": case "P": setRecordMode(r => !r); break;
        case "r": case "R": setDisplayScene(0); setExitScene(null); setIsTransitioning(false); break;
        case "a": case "A": setAutoPlay(p => !p); break;
        case "f": case "F": document.documentElement.requestFullscreen?.().catch(() => {}); break;
        default: if (e.key >= "1" && e.key <= "9") goTo(parseInt(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav, goTo]);

  useEffect(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (!autoPlay) return;
    autoTimer.current = setTimeout(() => {
      if (displayScene < TOTAL - 1) nav(1);
      else setAutoPlay(false);
    }, SCENE_DURATIONS[displayScene] * 1000);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [autoPlay, displayScene, nav, TOTAL]);

  const exitAnim  = exitScene !== null ? EXIT_ANIMS[exitScene]  ?? "d-fadeOut"  : "d-fadeOut";
  const enterAnim = ENTER_ANIMS[displayScene] ?? "d-fadeIn";

  return (
    <>
      <style>{DEMO_STYLES}</style>

      <div style={{ width: "100vw", height: "100vh", background: T.bg, overflow: "hidden", position: "relative" }}>

        {/* Auto-play progress bar */}
        {autoPlay && !recordMode && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: T.border, zIndex: 10001 }}>
            <div key={`pb-${displayScene}`} style={{
              height: "100%", background: T.green,
              transformOrigin: "left center",
              animation: `d-progress ${SCENE_DURATIONS[displayScene]}s linear forwards`,
            }} />
          </div>
        )}

        {/* 1920×1080 canvas */}
        <div id="demo-root" className="demo-root" style={{
          width: 1920, height: 1080, overflow: "hidden",
          background: T.bg, position: "relative",
        }}>
          {/* Exiting scene */}
          {exitScene !== null && (
            <div key={`exit-${exitScene}`} style={{
              position: "absolute", inset: 0, zIndex: 2,
              animation: `${exitAnim} 400ms cubic-bezier(0.16,1,0.3,1) forwards`,
            }}>
              {renderScene(exitScene)}
            </div>
          )}

          {/* Active scene */}
          <div key={`active-${displayScene}`} style={{
            position: "absolute", inset: 0, zIndex: 1,
            animation: `${enterAnim} 600ms cubic-bezier(0.16,1,0.3,1) forwards`,
          }}>
            {renderScene(displayScene)}
          </div>

          {/* Scene counter */}
          {!recordMode && (
            <div style={{
              position: "absolute", bottom: 22, right: 28,
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: 11, color: T.muted, pointerEvents: "none", zIndex: 10,
            }}>
              {displayScene + 1} / {TOTAL}
            </div>
          )}
        </div>

        {/* ── Navigator ── */}
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.95)",
          border: `1px solid ${T.border}`,
          borderRadius: 100, padding: "10px 22px",
          display: "flex", alignItems: "center", gap: 14,
          backdropFilter: "blur(24px)",
          boxShadow: "0 4px 24px rgba(0,17,27,0.12)",
          zIndex: 10000, userSelect: "none",
          opacity: recordMode ? 0 : 1,
          pointerEvents: recordMode ? "none" : "auto",
          transition: "opacity 0.3s",
        }}>
          <button onClick={() => nav(-1)} disabled={displayScene === 0} style={{
            background: "none", border: "none",
            color: displayScene === 0 ? T.border : T.muted,
            cursor: displayScene === 0 ? "default" : "pointer",
            fontSize: 16, padding: "0 4px", transition: "color 0.2s",
          }}>←</button>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {SCENE_NAMES.map((name, i) => (
              <button key={i} onClick={() => goTo(i)} title={name} style={{
                width: i === displayScene ? 26 : 7, height: 7,
                borderRadius: 4,
                background: i === displayScene ? T.green : T.border,
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
              }} />
            ))}
          </div>

          <span style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 11, color: T.muted, whiteSpace: "nowrap",
          }}>
            {displayScene + 1} / {TOTAL} · {SCENE_NAMES[displayScene]}
          </span>

          <button onClick={() => nav(1)} disabled={displayScene === TOTAL - 1} style={{
            background: "none", border: "none",
            color: displayScene === TOTAL - 1 ? T.border : T.muted,
            cursor: displayScene === TOTAL - 1 ? "default" : "pointer",
            fontSize: 16, padding: "0 4px", transition: "color 0.2s",
          }}>→</button>

          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={() => setAutoPlay(p => !p)} style={{
            background: autoPlay ? T.greenBg : "transparent",
            border: `1px solid ${autoPlay ? T.greenBrd : T.border}`,
            borderRadius: 6, color: autoPlay ? T.green : T.muted,
            cursor: "pointer", fontSize: 11, padding: "4px 10px",
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            transition: "all 0.2s",
          }}>
            {autoPlay ? "⏸ MANUAL" : "▶ AUTO"}
          </button>

          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={() => setRecordMode(true)} style={{
            background: T.redBg, border: `1px solid ${T.redBrd}`,
            borderRadius: 100, color: T.red, cursor: "pointer",
            fontSize: 11, padding: "4px 13px",
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: T.red, animation: "d-rec-dot 1.4s step-end infinite",
            }} />
            RECORD
          </button>
        </div>

        {/* Record mode hint */}
        {recordMode && (
          <div style={{
            position: "fixed", top: 10, right: 14, zIndex: 10002,
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 9, color: T.muted, pointerEvents: "none",
          }}>
            P to exit record mode
          </div>
        )}
      </div>
    </>
  );
}
