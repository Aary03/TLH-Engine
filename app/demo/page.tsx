"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_CLIENT } from "@/lib/demo-data";

// ─── Scene metadata ───────────────────────────────────────────────────────────
const SCENE_NAMES = [
  "The First Message", "The Client", "The Problem", "The Optimization",
  "The Portfolio", "The TLH Engine", "The AI", "The Payoff", "The Delivery", "The Close",
];
const SCENE_DURATIONS = [18, 10, 14, 16, 16, 18, 22, 16, 20, 20];

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FFFFFC", card: "#ffffff", cardBg: "#F9FAFB", border: "#E5E7EB",
  dark: "#00111B", body: "#374151", muted: "#9CA3AF",
  green: "#05A049", greenBg: "#EDFAF3", greenBrd: "#B4E3C8", mint: "#B4E3C8",
  red: "#DC2626", redBg: "#FEF2F2", redBrd: "#FECACA",
  amber: "#F59E0B", amberBg: "rgba(245,158,11,0.08)", amberBrd: "rgba(245,158,11,0.25)",
};

// ─── CSS (all keyframes + spotlight classes) ──────────────────────────────────
const DEMO_STYLES = `
  /* ── Scene transitions ── */
  @keyframes d-fadeScaleOut { to { opacity:0; transform:scale(0.97); } }
  @keyframes d-slideLeftOut  { to { opacity:0; transform:translateX(-60px); } }
  @keyframes d-fadeOut       { to { opacity:0; } }
  @keyframes d-dissolveOut   { to { opacity:0; transform:scale(1.02); } }
  @keyframes d-flashOut      { 0%{opacity:1;filter:brightness(1)} 40%{opacity:1;filter:brightness(2.2)} 100%{opacity:0;filter:brightness(1)} }

  @keyframes d-fadeIn       { from{opacity:0} to{opacity:1} }
  @keyframes d-slideUpIn    { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-slideRightIn { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
  @keyframes d-scaleUpIn    { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes d-explodeIn    { from{opacity:0;transform:scale(0.82)} to{opacity:1;transform:scale(1)} }

  /* ── Element animations ── */
  @keyframes d-up    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-fade  { from{opacity:0} to{opacity:1} }
  @keyframes d-left  { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:translateX(0)} }
  @keyframes d-right { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:translateX(0)} }
  @keyframes d-scale { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  @keyframes d-row   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-line  { from{width:0} to{width:460px} }
  @keyframes d-barX  { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }
  @keyframes d-sweep { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
  @keyframes d-msg   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-total { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

  /* Staggered box entrances for payoff scene */
  @keyframes d-box0 { from{opacity:0;transform:translateX(-40px) rotate(-2deg)} to{opacity:1;transform:translateX(0) rotate(0deg)} }
  @keyframes d-box1 { from{opacity:0;transform:translateX(40px) rotate(2deg)}  to{opacity:1;transform:translateX(0) rotate(0deg)} }
  @keyframes d-box2 { from{opacity:0;transform:translateY(-36px)}               to{opacity:1;transform:translateY(0)} }
  @keyframes d-box3 { from{opacity:0;transform:translateY(36px)}                to{opacity:1;transform:translateY(0)} }

  /* ── Persistent / looping ── */
  @keyframes d-harvest-glow {
    0%,100% { box-shadow:-3px 0 8px rgba(5,160,73,0.35); }
    50%     { box-shadow:-3px 0 20px rgba(5,160,73,0.75); }
  }
  @keyframes d-dot-pulse { 0%,100%{transform:scale(0.7);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }
  @keyframes d-cursor    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes d-rec-dot   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes d-progress  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes d-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes d-bar-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes d-ripple    { 0%{box-shadow:0 0 0 0 rgba(5,160,73,0.4)} 100%{box-shadow:0 0 0 16px rgba(5,160,73,0)} }
  @keyframes d-scanner   { from{top:0;opacity:0.9} to{top:100%;opacity:0} }
  @keyframes d-badge-pop { 0%{transform:scale(0)} 55%{transform:scale(1.3)} 80%{transform:scale(0.88)} 100%{transform:scale(1)} }

  /* ── Spotlight system ── */
  @keyframes d-spotlight-pulse {
    0%  { box-shadow:0 0 0 0   rgba(5,160,73,0.45) }
    50% { box-shadow:0 0 0 18px rgba(5,160,73,0)   }
    100%{ box-shadow:0 0 0 0   rgba(5,160,73,0)    }
  }
  .spotlight-soft   { box-shadow:0 0 0 2px rgba(5,160,73,0.22),0 0 22px rgba(5,160,73,0.1) !important; transition:box-shadow 0.4s ease !important; }
  .spotlight-strong { animation:d-spotlight-pulse 820ms ease-out !important; }

  /* ── Dramatic Counter lock-in ── */
  @keyframes d-num-flash      { 0%{opacity:0} 30%{opacity:1} 100%{opacity:0} }
  @keyframes d-underline-sweep{ from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes d-p0  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-55px,-55px) scale(0)} }
  @keyframes d-p1  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(0,-75px) scale(0)} }
  @keyframes d-p2  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(55px,-55px) scale(0)} }
  @keyframes d-p3  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(75px,0) scale(0)} }
  @keyframes d-p4  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(55px,55px) scale(0)} }
  @keyframes d-p5  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(0,75px) scale(0)} }
  @keyframes d-p6  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-55px,55px) scale(0)} }
  @keyframes d-p7  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-75px,0) scale(0)} }

  /* ── Record mode flash ── */
  @keyframes d-rec-flash { 0%{opacity:0} 15%{opacity:1} 70%{opacity:1} 100%{opacity:0} }

  /* ── The Close scene ── */
  @keyframes d-scan-line  { from{transform:translateX(-100%)} to{transform:translateX(100vw)} }
  @keyframes d-glow-text  {
    0%,100% { text-shadow:0 0 80px rgba(5,160,73,0.4); }
    50%     { text-shadow:0 0 140px rgba(5,160,73,0.65),0 0 40px rgba(5,160,73,0.3); }
  }
  @keyframes d-close-dot  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.7} }

  /* ── Delivery scene ── */
  @keyframes d-report-in  { from{opacity:0;transform:scale(0.85) translateY(36px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes fly-to-wa    { 0%{opacity:1;transform:translate(0,0) scale(1);filter:blur(0)} 100%{opacity:0;transform:translate(-310px,200px) scale(0.1);filter:blur(3px)} }
  @keyframes fly-to-email { 0%{opacity:1;transform:translate(0,0) scale(1);filter:blur(0)} 100%{opacity:0;transform:translate(310px,200px) scale(0.1);filter:blur(3px)} }
  @keyframes d-channel-pop{ 0%{opacity:0;transform:scale(0.3) translateY(24px)} 65%{opacity:1;transform:scale(1.1) translateY(-3px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes d-notif-bounce{ 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.3);opacity:1} 80%{transform:scale(0.9)} 100%{transform:scale(1);opacity:1} }
  @keyframes d-tick-draw   { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
  @keyframes channel-radar {
    0%  { box-shadow:0 0 0 0  rgba(37,211,102,0.5); }
    100%{ box-shadow:0 0 0 44px rgba(37,211,102,0); }
  }
  @keyframes channel-radar-email {
    0%  { box-shadow:0 0 0 0  rgba(59,130,246,0.5); }
    100%{ box-shadow:0 0 0 44px rgba(59,130,246,0); }
  }

  /* scrollbar */
  .demo-chat::-webkit-scrollbar { width:4px; }
  .demo-chat::-webkit-scrollbar-track { background:transparent; }
  .demo-chat::-webkit-scrollbar-thumb { background:${T.greenBrd}; border-radius:2px; }
  .demo-root * { box-sizing:border-box; }
`;

// ─── Shared background helpers ───────────────────────────────────────────────
const GRID_BG: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(rgba(5,160,73,0.025) 1px,transparent 1px)",
    "linear-gradient(90deg,rgba(5,160,73,0.025) 1px,transparent 1px)",
  ].join(","),
  backgroundSize: "48px 48px",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-" : "") + "₹" + abs.toLocaleString("en-IN");
}
function anim(name: string, ms: number, delay = 0, ease = "cubic-bezier(0.16,1,0.3,1)"): React.CSSProperties {
  return { animation: `${name} ${ms}ms ${ease} ${delay}ms both` };
}

// ─── Spotlight hook ───────────────────────────────────────────────────────────
type SpotlightTarget = { id: string; delay: number; duration: number; intensity: "soft" | "strong" };
function useSpotlight(targets: SpotlightTarget[]) {
  const ref = useRef(targets);
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ref.current.forEach(({ id, delay, duration, intensity }) => {
      const t = setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        const cls = intensity === "soft" ? "spotlight-soft" : "spotlight-strong";
        el.classList.add(cls);
        if (intensity === "strong") {
          el.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
          el.style.transform = "scale(1.04)";
          setTimeout(() => { el.style.transform = "scale(1)"; }, 420);
        }
        const t2 = setTimeout(() => { el?.classList.remove("spotlight-soft", "spotlight-strong"); }, duration);
        timers.push(t2);
      }, delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Dramatic Counter ─────────────────────────────────────────────────────────
function Counter({
  target, duration = 1600, prefix = "₹", isFinal = false,
}: { target: number; duration?: number; prefix?: string; isFinal?: boolean }) {
  const [val, setVal] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [showLine, setShowLine] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    let locked = false;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      if (p < 1) {
        let v: number;
        if (p < 0.3) {
          const base = Math.round((p / 0.3) * 0.5 * target);
          const noise = Math.round((Math.random() - 0.38) * target * 0.13);
          v = Math.max(0, Math.min(target - 1, base + noise));
        } else if (p < 0.7) {
          const q = (p - 0.3) / 0.4;
          v = Math.round(0.5 * target + (1 - Math.pow(1 - q, 2)) * 0.46 * target);
        } else {
          const q = (p - 0.7) / 0.3;
          v = Math.round(0.96 * target + (1 - Math.pow(1 - q, 4)) * 0.04 * target);
        }
        setVal(v);
        raf = requestAnimationFrame(step);
      } else if (!locked) {
        locked = true;
        setVal(target);
        setBouncing(true); setFlashing(true); setShowLine(true);
        setTimeout(() => setBouncing(false), 360);
        setTimeout(() => setFlashing(false), 480);
        if (isFinal) setTimeout(() => setShowParticles(true), 180);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, isFinal]);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{
        display: "inline-block",
        transform: bouncing ? "scale(1.07)" : "scale(1)",
        transition: "transform 0.36s cubic-bezier(0.34,1.56,0.64,1)",
        filter: "drop-shadow(0 2px 12px rgba(5,160,73,0.3))",
      }}>
        {prefix}{val.toLocaleString("en-IN")}
      </span>
      {flashing && (
        <span style={{
          position: "absolute", inset: "-4px -6px",
          background: "rgba(5,160,73,0.14)", borderRadius: 6,
          animation: "d-num-flash 480ms ease forwards",
          pointerEvents: "none", zIndex: 1,
        }} />
      )}
      {showLine && (
        <span style={{
          position: "absolute", bottom: -3, left: 0, right: 0, height: 2,
          background: T.green, transformOrigin: "left center",
          animation: "d-underline-sweep 280ms ease-out both",
          pointerEvents: "none",
        }} />
      )}
      {showParticles && Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{
          position: "absolute", left: "50%", top: "50%",
          width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5,
          borderRadius: "50%",
          background: i % 3 === 0 ? T.green : i % 3 === 1 ? "#4ADE80" : T.greenBrd,
          animationName: `d-p${i % 8}`,
          animationDuration: "640ms",
          animationTimingFunction: "cubic-bezier(0.25,1,0.5,1)",
          animationDelay: `${i * 18}ms`,
          animationFillMode: "both",
          pointerEvents: "none",
        }} />
      ))}
    </span>
  );
}

// ─── TypedText ────────────────────────────────────────────────────────────────
function TypedText({ text, mspChar = 22, startDelay = 0, onDone }: {
  text: string; mspChar?: number; startDelay?: number; onDone?: () => void;
}) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const t0 = setTimeout(() => {
      const iv = setInterval(() => {
        i++; setShown(text.slice(0, i));
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

// ─── Speaker Guide talking points ────────────────────────────────────────────
const GUIDE_POINTS: { text: string; time: number }[][] = [
  [ // Scene 0 — Chat
    { text: "It starts with a panic message at 9pm", time: 0 },
    { text: "Suresh doesn't scramble — he opens Valura", time: 3800 },
    { text: "GPT-4o answers in seconds with exact numbers", time: 8000 },
    { text: "₹19.25 lakh of value. Two minutes.", time: 12500 },
  ],
  [ // Scene 1 — Client
    { text: "Meet Rajesh Kumar — HNI, New Delhi", time: 0 },
    { text: "₹80 lakh invested in global markets this year", time: 1500 },
    { text: "Did everything right. Has one problem.", time: 3000 },
  ],
  [ // Scene 2 — Problem
    { text: "The government took ₹14 lakh upfront", time: 0 },
    { text: "That's TCS — refundable but locked 8 months", time: 1800 },
    { text: "The hidden cost: ₹1.12 lakh in lost returns", time: 2800 },
  ],
  [ // Scene 3 — Optimization
    { text: "Wife's ₹10L threshold — completely untouched", time: 0 },
    { text: "Two PANs. Two thresholds. Zero TCS.", time: 2500 },
    { text: "₹14 lakh saved — next FY strategy", time: 3500 },
  ],
  [ // Scene 4 — Portfolio
    { text: "Six global positions — two doing great", time: 0 },
    { text: "These three: NVDA, TSLA, GOOGL — in the red", time: 1200 },
    { text: "That's not bad news. That's the opportunity.", time: 2500 },
  ],
  [ // Scene 5 — TLH Engine
    { text: "Harvest all three. Book the STCL.", time: 0 },
    { text: "India has no wash-sale rule — sell and rebuy same day", time: 1800 },
    { text: "MSFT: don't touch it. 150 days to long-term.", time: 5000 },
    { text: "Total tax saved: ₹4.13 lakh", time: 4000 },
  ],
  [ // Scene 6 — AI
    { text: "9pm. Complex question. Two minutes.", time: 0 },
    { text: "Watch what Valura AI does with this", time: 1000 },
    { text: "Exact numbers. Three actions. Ranked by impact.", time: 12000 },
  ],
  [ // Scene 7 — Payoff
    { text: "₹14L TCS eliminated", time: 400 },
    { text: "₹4.13L in tax saved", time: 550 },
    { text: "Total value created: ₹19.25 lakh", time: 3000 },
    { text: "One client. One conversation. Eight minutes.", time: 6000 },
  ],
  [ // Scene 8 — Delivery
    { text: "The report is ready — built by Valura AI", time: 200 },
    { text: "Watch it fly to Rajesh's WhatsApp and email", time: 3200 },
    { text: "Rajesh gets clarity in seconds. You look like a genius.", time: 6200 },
  ],
  [ // Scene 9 — The Close
    { text: "The complexity stays with us. The credit goes to you.", time: 0 },
    { text: "Every client conversation. Every time.", time: 3800 },
    { text: "This is what Valura does for advisors.", time: 5500 },
  ],
];

// ─── Speaker Overlay ──────────────────────────────────────────────────────────
function SpeakerOverlay({ scene, visible }: { scene: number; visible: boolean }) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const pts = GUIDE_POINTS[scene] ?? [];
    setIdx(0); setFading(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    pts.forEach((p, i) => {
      if (i === 0) return;
      const t = setTimeout(() => {
        setFading(true);
        setTimeout(() => { setIdx(i); setFading(false); }, 400);
      }, p.time);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [scene]);

  if (!visible) return null;
  const pts = GUIDE_POINTS[scene] ?? [];
  const current = pts[idx];
  if (!current) return null;

  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,17,27,0.86)", border: "1px solid rgba(180,227,200,0.15)",
      borderRadius: 12, padding: "11px 22px", maxWidth: 520,
      backdropFilter: "blur(20px)", zIndex: 10001,
      opacity: fading ? 0 : 1, transition: "opacity 0.4s ease",
      pointerEvents: "none",
    }}>
      <div style={{
        fontFamily: "var(--font-inter,'Inter',sans-serif)",
        fontSize: 13, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap",
      }}>
        💬 {current.text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — The First Message
// ─────────────────────────────────────────────────────────────────────────────
function Scene1() {
  const [step, setStep] = useState(0);

  const clientMsg = "Hey Suresh, I invested ₹80 lakhs in global markets this year but the bank deducted ₹14 lakhs as TCS. Now FY is ending in 8 days and I have big losses in NVDA and TSLA sitting unrealized. I'm panicking — what do I do?";
  const partnerMsg = "Rajesh — I hear you. Let me check with Valura's AI right now. Give me 2 minutes.";
  const valuraQuery = "Rajesh Kumar — ₹80L remitted, ₹14L TCS deducted. Portfolio has NVDA (₹6.86L loss), TSLA (₹2.59L loss), GOOGL (₹0.24L loss). FY ends in 8 days. 3 urgent actions needed.";
  const aiReply = "Rajesh has 3 urgent actions before March 31:\n\n1. Harvest NVDA + TSLA + GOOGL losses NOW — saves ₹4,13,941 in tax.\n2. MSFT: do NOT sell — 150 days to LTCG, saves ₹20,535 by waiting.\n3. Next FY: route ₹10L through wife Priya — saves ₹14,00,000 TCS.\n\nTotal value: ₹19,25,941. Execute harvests by March 28 (T+2).";

  useEffect(() => {
    const times = [200, 3800, 6200, 8000, 12500];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  useSpotlight([
    { id: "chat-rajesh-msg", delay: 200, duration: 4000, intensity: "soft" },
    { id: "chat-tcs-amount", delay: 3200, duration: 2500, intensity: "strong" },
    { id: "chat-valura-card", delay: 6200, duration: 3000, intensity: "soft" },
    { id: "chat-ai-response", delay: 12000, duration: 6000, intensity: "soft" },
  ]);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 100px", background: T.bg, ...GRID_BG,
    }}>
      <div style={{ ...anim("d-fade", 500, 0), textAlign: "center", marginBottom: 36 }}>
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

      <div style={{ width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", gap: 18 }}>
        {step >= 1 && (
          <div id="chat-rajesh-msg" style={{ ...anim("d-msg", 500, 0), display: "flex", gap: 10, alignItems: "flex-end", maxWidth: 680, alignSelf: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)" }}>RK</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4 }}>Rajesh Kumar · Client</div>
              <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.7, boxShadow: "0 1px 4px rgba(0,17,27,0.06)" }}>
                {clientMsg.split("₹14 lakhs").map((part, i) => (
                  <span key={i}>{part}{i === 0 && <span id="chat-tcs-amount" style={{ color: T.red, fontWeight: 700 }}>₹14 lakhs</span>}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div style={{ ...anim("d-msg", 500, 0), display: "flex", flexDirection: "row-reverse", gap: 10, alignItems: "flex-end", maxWidth: 500, alignSelf: "flex-end" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)" }}>SI</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4, textAlign: "right" }}>Suresh Iyer · Wealth Manager</div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "14px 4px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.7, boxShadow: "0 1px 4px rgba(0,17,27,0.06)" }}>
                {partnerMsg}
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div id="chat-valura-card" style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-end" }}>
            <div style={{
              background: T.greenBg, border: `1px solid ${T.greenBrd}`,
              borderRadius: 14, padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: T.green,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                animation: "d-ripple 1.2s ease-out 1",
                boxShadow: "0 0 0 0 rgba(5,160,73,0.4)",
              }}>⚡</div>
              <div>
                <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 12, fontWeight: 700, color: T.green }}>Suresh opened Valura AI Advisor</div>
                <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.muted }}>GIFT City · Tax Intelligence Platform</div>
              </div>
            </div>
          </div>
        )}

        {step >= 4 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-end", maxWidth: 680 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4, textAlign: "right" }}>Suresh Iyer · Asking Valura AI</div>
            <div style={{ background: "#F3F4F6", border: `1px solid ${T.border}`, borderRadius: "14px 4px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.7 }}>
              <TypedText text={valuraQuery} mspChar={14} />
            </div>
          </div>
        )}

        {step >= 5 && (
          <div id="chat-ai-response" style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-start", maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700 }}>Valura AI · GIFT City Advisor</span>
            </div>
            <div style={{ background: T.greenBg, border: `1.5px solid ${T.greenBrd}`, borderRadius: "4px 14px 14px 14px", padding: "14px 18px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.75 }}>
              <TypedText mspChar={11} text={aiReply} />
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
  useSpotlight([
    { id: "client-name", delay: 350, duration: 2000, intensity: "soft" },
    { id: "client-income", delay: 800, duration: 1500, intensity: "soft" },
    { id: "client-amount", delay: 2000, duration: 2000, intensity: "strong" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: T.bg, ...GRID_BG }}>
      <div style={{ ...anim("d-fade", 600, 0), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 28 }}>
        DEMO CLIENT · FY 2025-26
      </div>

      <div id="client-name" style={{ ...anim("d-up", 700, 350), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 80, fontWeight: 800, color: T.dark, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 34 }}>
        Rajesh Kumar
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 44 }}>
        {[
          { label: "₹1.2 Cr  ·  Annual Income", delay: 800, id: "client-income" },
          { label: "HNI  ·  Old Tax Regime", delay: 950, id: "" },
          { label: "New Delhi  ·  Resident Indian", delay: 1100, id: "" },
        ].map(({ label, delay, id }) => (
          <div key={label} id={id || undefined} style={{ ...anim("d-up", 550, delay), background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 100, padding: "8px 22px", fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 13, fontWeight: 600, color: T.body }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ ...anim("d-line", 550, 1350, "ease-out"), height: 2, background: `linear-gradient(90deg,transparent,${T.green},transparent)`, marginBottom: 28, transformOrigin: "center" }} />

      <div id="client-amount" style={{ ...anim("d-fade", 650, 1750), textAlign: "center", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 16, color: T.muted, fontStyle: "italic", lineHeight: 1.85 }}>
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
  useEffect(() => { const t = setTimeout(() => setCounterActive(true), 1200); return () => clearTimeout(t); }, []);

  useSpotlight([
    { id: "problem-headline", delay: 200, duration: 2500, intensity: "soft" },
    { id: "tcs-amount-red", delay: 1000, duration: 3000, intensity: "strong" },
    { id: "irr-callout", delay: 2800, duration: 2500, intensity: "soft" },
    { id: "tcs-counter-box", delay: 1200, duration: 2000, intensity: "strong" },
  ]);

  return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", padding: "0 90px", gap: 80, background: T.bg, ...GRID_BG }}>
      <div style={{ flex: "0 0 44%", ...anim("d-left", 700, 0) }}>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 22 }}>THE TCS SITUATION</div>

        <div id="problem-headline" style={{ ...anim("d-up", 600, 200), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 36, fontWeight: 800, lineHeight: 1.2, color: T.dark, marginBottom: 20 }}>
          He remitted ₹80 lakh.
          <br />The government took{" "}
          <span id="tcs-amount-red" style={{ color: T.red }}>₹14 lakh.</span>
        </div>

        <div style={{ ...anim("d-fade", 600, 600), fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.body, lineHeight: 1.8, marginBottom: 28 }}>
          TCS deducted at 20% on ₹70L above threshold.
          <br />Locked. Sitting with the income tax department.
          <br />Won&rsquo;t be refunded until ITR is filed.
        </div>

        <div id="irr-callout" style={{ ...anim("d-up", 550, 900), background: T.redBg, borderLeft: `3px solid ${T.red}`, borderRadius: "0 10px 10px 0", padding: "14px 18px" }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: T.red }}>
            ₹14L locked for 8 months = ₹1,12,000 in lost returns
          </span>
        </div>
      </div>

      <div style={{ flex: 1, ...anim("d-right", 700, 0) }}>
        <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 26 }}>
          RAJESH&apos;S LRS THIS FY
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "₹80,00,000 remitted", w: "100%", bg: "rgba(5,160,73,0.15)", c: T.green, del: 400 },
            { label: "₹10,00,000 — TCS-free threshold", w: "12.5%", bg: "rgba(180,227,200,0.4)", c: "#059669", del: 700 },
            { label: "₹70,00,000 — TCS at 20%", w: "87.5%", bg: "rgba(220,38,38,0.1)", c: T.red, del: 1000, pulse: true },
          ].map((r) => (
            <div key={r.label} style={{ ...anim("d-up", 500, r.del) }}>
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: r.c, marginBottom: 6 }}>{r.label}</div>
              <div style={{
                height: 32, background: r.bg, borderRadius: 6, width: r.w,
                ...anim("d-barX", 600, r.del, "ease-out"),
                transformOrigin: "left center", border: `1px solid ${r.c}33`,
                animation: r.pulse
                  ? `d-barX 600ms cubic-bezier(0.16,1,0.3,1) ${r.del}ms both, d-bar-pulse 1.5s ease-in-out 1.8s infinite`
                  : `d-barX 600ms cubic-bezier(0.16,1,0.3,1) ${r.del}ms both`,
              }} />
            </div>
          ))}

          <div id="tcs-counter-box" style={{ ...anim("d-up", 550, 1200), background: T.redBg, border: `1px solid ${T.redBrd}`, borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 44, fontWeight: 800, color: T.red, lineHeight: 1 }}>
              {counterActive ? <Counter target={1_400_000} duration={1200} /> : "₹0"}
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 12, color: T.muted, marginTop: 7 }}>TCS Deducted — Refundable via ITR</div>
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

  useSpotlight([
    { id: "opt-question", delay: 0, duration: 2500, intensity: "soft" },
    { id: "rajesh-card", delay: 600, duration: 1500, intensity: "soft" },
    { id: "priya-card", delay: 2500, duration: 3000, intensity: "strong" },
    { id: "opt-result-num", delay: 3500, duration: 3000, intensity: "strong" },
    { id: "opt-tagline", delay: 5000, duration: 2500, intensity: "soft" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 100px", background: T.bg, ...GRID_BG }}>
      <div id="opt-question" style={{ ...anim("d-fade", 600, 0), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 44, fontWeight: 800, color: T.dark, textAlign: "center", marginBottom: 48 }}>
        What if his wife had invested{" "}<span style={{ color: T.green }}>₹10L</span>?
      </div>

      <div style={{ ...anim("d-up", 600, 550), display: "flex", gap: 20, width: "100%", maxWidth: 820, marginBottom: 20 }}>
        <div id="rajesh-card" style={{ flex: 1, background: T.redBg, border: `1px solid ${T.redBrd}`, borderRadius: 18, padding: "24px 28px" }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.red, letterSpacing: "0.15em", marginBottom: 16 }}>RAJESH ALONE</div>
          {[{ k: "Remittance", v: "₹80,00,000", c: T.dark }, { k: "TCS", v: "₹14,00,000 ❌", c: T.red }, { k: "Effective cost", v: "17.5%", c: T.red }].map((r) => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13 }}>
              <span style={{ color: T.muted }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div id="priya-card" style={{
          flex: 1,
          background: priyaActive ? T.greenBg : T.cardBg,
          border: priyaActive ? `1.5px solid ${T.greenBrd}` : `1px dashed ${T.border}`,
          borderRadius: 18, padding: "24px 28px",
          opacity: priyaActive ? 1 : 0.5,
          transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: priyaActive ? "0 0 36px rgba(5,160,73,0.15)" : "none",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: priyaActive ? T.green : T.muted, letterSpacing: "0.15em" }}>PRIYA (WIFE)</div>
            {!priyaActive && <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>Untouched this FY</div>}
          </div>
          {[{ k: "Limit available", v: "₹10,00,000", c: T.dark }, { k: "TCS if used", v: "₹0 ✓", c: T.green }, { k: "Within threshold", v: "Yes", c: T.green }].map((r) => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13 }}>
              <span style={{ color: T.muted }}>{r.k}</span>
              <span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {showResult && (
        <div style={{ ...anim("d-scale", 600, 0), width: "100%", maxWidth: 820, background: "linear-gradient(135deg,rgba(5,160,73,0.07),rgba(5,160,73,0.03))", border: `1.5px solid ${T.greenBrd}`, borderRadius: 20, padding: "24px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, boxShadow: "0 4px 24px rgba(5,160,73,0.1)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>NEXT FY STRATEGY</div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 22, fontWeight: 700, color: T.dark, marginBottom: 8 }}>Route ₹10L through Priya before April 1st</div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: T.muted }}>Priya&apos;s ₹10L limit: completely unused this FY → ₹0 TCS</div>
          </div>
          <div id="opt-result-num" style={{ textAlign: "right", flexShrink: 0, marginLeft: 32 }}>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 52, fontWeight: 800, color: T.green, lineHeight: 1 }}>
              <Counter target={1_400_000} duration={1200} />
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 12, color: T.muted, marginTop: 4 }}>TCS saved next FY</div>
          </div>
        </div>
      )}

      {showTagline && (
        <div id="opt-tagline" style={{ ...anim("d-fade", 800, 0), fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 18, fontWeight: 600, color: T.muted, textAlign: "center" }}>
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
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setScanning(true), 2300);
    const t1 = setTimeout(() => setHarvestOn(true), 2900);
    const t2 = setTimeout(() => setShowCallout(true), 4200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useSpotlight([
    { id: "row-TSLA", delay: 2900, duration: 3000, intensity: "strong" },
    { id: "row-NVDA", delay: 3100, duration: 3000, intensity: "strong" },
    { id: "row-GOOGL", delay: 3300, duration: 3000, intensity: "strong" },
    { id: "portfolio-callout", delay: 4200, duration: 3000, intensity: "soft" },
  ]);

  const portfolio = DEMO_CLIENT.portfolio;
  const borderColor: Record<string, string> = { LTCG: T.green, STCL: T.red, STCG: T.amber };
  const rowBg: Record<string, string> = { LTCG: "rgba(5,160,73,0.03)", STCL: "rgba(220,38,38,0.03)", STCG: "rgba(245,158,11,0.03)" };
  const pillStyle: Record<string, React.CSSProperties> = {
    LTCG: { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBrd}` },
    STCL: { background: T.redBg, color: T.red, border: `1px solid ${T.redBrd}` },
    STCG: { background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBrd}` },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 64px 24px", background: T.bg, ...GRID_BG }}>
      <div style={{ ...anim("d-up", 600, 0), marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 36, fontWeight: 800, color: T.dark }}>Rajesh&rsquo;s Global Portfolio</div>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 13, color: T.muted, marginTop: 4 }}>6 positions · FY 2025-26 · Exchange rate ₹84.50</div>
      </div>

      <div style={{ flex: 1, background: T.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,17,27,0.04),0 4px 16px rgba(0,17,27,0.07)", position: "relative" }}>
        {/* Scanner line */}
        {scanning && !harvestOn && (
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${T.green},transparent)`, zIndex: 10, animation: "d-scanner 600ms linear forwards", pointerEvents: "none" }} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "96px minmax(0,1fr) 60px 80px 90px 120px 72px 160px", padding: "13px 22px", borderBottom: `1px solid ${T.border}`, background: T.cardBg, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
            <div key={pos.ticker} id={`row-${pos.ticker}`} style={{
              display: "grid", gridTemplateColumns: "96px minmax(0,1fr) 60px 80px 90px 120px 72px 160px",
              padding: "15px 22px", borderBottom: `1px solid ${T.border}`,
              borderLeft: `3px solid ${borderColor[pos.type]}`,
              background: glowing ? T.greenBg : rowBg[pos.type], alignItems: "center",
              animation: glowing
                ? `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${380 + i * 110}ms both, d-harvest-glow 2s ease-in-out infinite`
                : `d-row 500ms cubic-bezier(0.16,1,0.3,1) ${380 + i * 110}ms both`,
              transition: "background 0.5s ease",
            }}>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 15, fontWeight: 700, color: T.dark }}>{pos.ticker}</span>
              <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.body }}>{pos.name}</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.body }}>{pos.units}</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.muted, textAlign: "right" }}>${pos.buyPrice}</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: T.dark, textAlign: "right", fontWeight: 600 }}>${pos.currentPrice}</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 14, color: positive ? T.green : T.red, fontWeight: 700, textAlign: "right" }}>
                {positive ? "+" : ""}{fmtINR(pnl)}
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ ...pillStyle[pos.type], fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>{pos.type}</span>
                {glowing && (
                  <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, fontWeight: 700, animation: "d-badge-pop 500ms cubic-bezier(0.16,1,0.3,1) both" }}>⚡ HARVEST</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>{taxText}</div>
            </div>
          );
        })}
      </div>

      {showCallout && (
        <div id="portfolio-callout" style={{ ...anim("d-up", 600, 0), marginTop: 14, background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 12, padding: "15px 24px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 16, color: T.body }}>
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
  const [typeStcg, setTypeStcg] = useState(false);
  const [typeLtcg, setTypeLtcg] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowAfter(true), 3000);
    const t2 = setTimeout(() => setTypeStcg(true), 3400);
    const t3 = setTimeout(() => setTypeLtcg(true), 3700);
    const t4 = setTimeout(() => setShowBigNum(true), 4200);
    const t5 = setTimeout(() => setShowMsft(true), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  useSpotlight([
    { id: "tlh-action-1", delay: 600, duration: 2000, intensity: "soft" },
    { id: "tlh-action-2", delay: 900, duration: 2000, intensity: "soft" },
    { id: "tlh-action-3", delay: 1200, duration: 2000, intensity: "soft" },
    { id: "tlh-wash-note", delay: 2500, duration: 2500, intensity: "soft" },
    { id: "tlh-big-num", delay: 4200, duration: 4000, intensity: "strong" },
    { id: "tlh-msft-note", delay: 5200, duration: 2500, intensity: "soft" },
  ]);

  const actions = [
    { id: "tlh-action-1", num: 1, ticker: "NVDA", action: "Sell 22 units @ $116", loss: "₹6,85,971 STCL", saved: "₹2,93,129", delay: 600 },
    { id: "tlh-action-2", num: 2, ticker: "TSLA", action: "Sell 30 units @ $178", loss: "₹2,58,570 STCL", saved: "₹1,10,413", delay: 900 },
    { id: "tlh-action-3", num: 3, ticker: "GOOGL", action: "Sell 12 units @ $154", loss: "₹24,336 STCL", saved: "₹10,399", delay: 1200 },
  ];

  return (
    <div style={{ display: "flex", height: "100%", alignItems: "stretch", padding: "32px 68px", gap: 44, background: T.bg, ...GRID_BG }}>
      <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", justifyContent: "center", ...anim("d-left", 700, 0) }}>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>TAX LOSS HARVESTING</div>
        <div style={{ ...anim("d-up", 600, 200), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 36, fontWeight: 800, lineHeight: 1.18, color: T.dark, marginBottom: 30 }}>
          Harvest 3 positions.<br /><span style={{ color: T.green }}>Save ₹4.13 lakh.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {actions.map((ac) => (
            <div key={ac.ticker} id={ac.id} style={{ ...anim("d-left", 500, ac.delay), display: "flex", gap: 14, alignItems: "flex-start", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,17,27,0.04),0 4px 16px rgba(0,17,27,0.06)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ac.num}</div>
              <div>
                <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 13, fontWeight: 700, color: T.dark }}>{ac.ticker} ← {ac.action}</div>
                <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted, marginTop: 2 }}>{ac.loss}</div>
                <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 15, fontWeight: 700, color: T.green }}>Tax saved: {ac.saved}</div>
              </div>
            </div>
          ))}
        </div>

        <div id="tlh-wash-note" style={{ ...anim("d-up", 550, 2500), background: T.amberBg, border: `1px solid ${T.amberBrd}`, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.amber, lineHeight: 1.75 }}>
            No wash-sale rule in India.<br />Rebuy all 3 positions immediately.<br />Cost basis resets. Loss is locked in.
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, ...anim("d-right", 700, 200) }}>
        <div style={{ background: T.redBg, border: `1px solid ${T.redBrd}`, borderRadius: 16, padding: "18px 22px" }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.red, letterSpacing: "0.15em", marginBottom: 12 }}>BEFORE HARVESTING</div>
          {[{ label: "STCG payable (MSFT)", val: "₹31,588" }, { label: "LTCG payable (AAPL + SPY)", val: "₹33,350" }].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13 }}>
              <span style={{ color: T.body }}>{r.label}</span>
              <span style={{ color: T.red, fontWeight: 600 }}>{r.val}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.redBrd}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontWeight: 700, fontSize: 17 }}>
            <span style={{ color: T.body }}>Total</span>
            <span style={{ color: T.red }}>₹64,938</span>
          </div>
        </div>

        {showAfter && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 16, padding: "18px 22px", animation: "d-sweep 600ms ease-out both" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, letterSpacing: "0.15em", marginBottom: 12 }}>AFTER HARVESTING</div>
            {[
              { label: "Available STCL", val: "₹9,68,877", c: T.body, typed: false },
              { label: "Offsets STCG", base: "₹31,588", typed: typeStcg, c: T.green },
              { label: "Offsets LTCG", base: "₹33,350", typed: typeLtcg, c: T.green },
              { label: "Carry-forward (8 yrs)", val: "₹9,03,939", c: T.body, typed: false },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13 }}>
                <span style={{ color: T.body }}>{r.label}</span>
                <span style={{ color: r.c, fontWeight: 600 }}>
                  {r.typed !== undefined && r.base ? (
                    <>
                      <span style={{ textDecoration: "line-through", color: T.muted, marginRight: 4 }}>{r.base}</span>
                      {r.typed ? <TypedText text="→ ₹0 ✓" mspChar={45} /> : null}
                    </>
                  ) : r.val}
                </span>
              </div>
            ))}
          </div>
        )}

        {showBigNum && (
          <div id="tlh-big-num" style={{ ...anim("d-scale", 600, 0), textAlign: "center", padding: "20px", background: T.greenBg, borderRadius: 16, border: `1.5px solid ${T.greenBrd}`, boxShadow: "0 4px 20px rgba(5,160,73,0.12)" }}>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 60, fontWeight: 800, color: T.green, lineHeight: 1 }}>
              <Counter target={413_941} duration={1600} />
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 600, color: T.body, marginTop: 7 }}>Tax saved this action</div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.green, marginTop: 4 }}>Effective tax rate: 0% on all portfolio gains</div>
          </div>
        )}

        {showMsft && (
          <div id="tlh-msft-note" style={{ ...anim("d-up", 500, 0), background: T.amberBg, border: `1px solid ${T.amberBrd}`, borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.amber, lineHeight: 1.75 }}>
              MSFT: Don&rsquo;t sell yet. 150 days to LTCG threshold.<br />
              Wait → tax drops from ₹31,588 to ₹11,053<br />
              <strong>Save an additional ₹20,535 by waiting.</strong>
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
    const qDur = QUESTION.length * TYPING_MS;
    const t1 = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        if (cancelled) { clearInterval(iv); return; }
        i++; setTypedQ(QUESTION.slice(0, i));
        if (i >= QUESTION.length) clearInterval(iv);
      }, TYPING_MS);
    }, 1000);
    const t2 = setTimeout(() => { if (!cancelled) setShowDots(true); }, 1000 + qDur + 300);
    const t3 = setTimeout(() => {
      if (cancelled || aiStarted.current) return;
      aiStarted.current = true; setShowDots(false); startRef.current = Date.now(); streamAI();
    }, 1000 + qDur + 2100);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSpotlight([
    { id: "ai-question-bubble", delay: 1000, duration: 4000, intensity: "soft" },
    { id: "ai-response-bubble", delay: 5000, duration: 8000, intensity: "soft" },
  ]);

  const streamAI = async () => {
    try {
      const resp = await fetch("/api/ai-demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: DEMO_CLIENT.ai.userMessage }) });
      if (!resp.body) return;
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
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
      setDone(true); setElapsed((Date.now() - startRef.current) / 1000);
    } catch {
      setAiText("Unable to reach AI service. Check your OPENAI_API_KEY.");
      setDone(true);
    }
  };

  const highlightRupees = (text: string): React.ReactNode =>
    text.split(/(₹[\d,]+(?:\.\d+)?(?:\s*(?:L|Cr|K|lakh|crore))?)/gi).map((p, i) =>
      /^₹/.test(p)
        ? <span key={i} style={{ background: T.greenBg, color: T.green, borderRadius: 3, padding: "0 2px", fontWeight: 600 }}>{p}</span>
        : p
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "32px 80px 24px", background: T.bg, ...GRID_BG }}>
      <div style={{ ...anim("d-fade", 600, 0), textAlign: "center", marginBottom: 24, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 100, padding: "5px 14px", marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: "0.12em" }}>VALURA AI · GIFT CITY ADVISOR</span>
        </div>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 34, fontWeight: 800, color: T.dark }}>Ask anything. Get exact numbers.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          {["Rajesh Kumar", "₹80L LRS", "6 holdings", "FY ends in 8 days"].map((c, i) => (
            <div key={c} style={{ ...anim("d-fade", 400, 280 + i * 80), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 100, padding: "4px 12px" }}>{c}</div>
          ))}
        </div>
      </div>

      <div ref={chatRef} className="demo-chat" style={{ width: "100%", maxWidth: 740, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 4 }}>
        {typedQ && (
          <div id="ai-question-bubble" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: "4px 14px 14px 14px", padding: "13px 17px", maxWidth: "84%", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.68, boxShadow: "0 1px 4px rgba(0,17,27,0.06)" }}>
              {typedQ}{typedQ.length < QUESTION.length && <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.8s step-end infinite", marginLeft: 1 }} />}
            </div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted, marginTop: 4, marginLeft: 4 }}>just now</div>
          </div>
        )}

        {showDots && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: "14px 14px 4px 14px", padding: "14px 20px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (<div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: `d-dot-pulse 1.2s ease-in-out ${i * 0.22}s infinite` }} />))}
            </div>
          </div>
        )}

        {aiText && (
          <div id="ai-response-bubble" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, marginBottom: 5, marginRight: 4, fontWeight: 700 }}>Valura AI</div>
            <div style={{ background: T.greenBg, border: `1.5px solid ${T.greenBrd}`, borderRadius: "14px 14px 4px 14px", padding: "15px 19px", maxWidth: "92%", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: T.dark, lineHeight: 1.75, whiteSpace: "pre-wrap", boxShadow: "0 2px 12px rgba(5,160,73,0.1)" }}>
              {highlightRupees(aiText)}
              {!done && <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.8s step-end infinite", marginLeft: 1 }} />}
            </div>
          </div>
        )}

        {done && (
          <div style={{ ...anim("d-fade", 500, 0), display: "flex", justifyContent: "flex-end" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>
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
    const t2 = setTimeout(() => setShowFinal(true), 6200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useSpotlight([
    { id: "stat-box-0", delay: 400, duration: 2000, intensity: "strong" },
    { id: "stat-box-1", delay: 550, duration: 2000, intensity: "strong" },
    { id: "stat-box-2", delay: 700, duration: 2000, intensity: "soft" },
    { id: "stat-box-3", delay: 850, duration: 2000, intensity: "soft" },
    { id: "payoff-total", delay: 3000, duration: 5000, intensity: "strong" },
  ]);

  const boxAnims = ["d-box0", "d-box1", "d-box2", "d-box3"];
  const boxes = [
    { value: 1_400_000, label: "TCS eliminated via family LRS optimization", sub: "Wife's ₹10L threshold — next FY strategy", color: T.green, delay: 400 },
    { value: 413_941,   label: "Tax saved via TLH (NVDA + TSLA + GOOGL)",   sub: "0% effective rate on all portfolio gains",    color: T.green, delay: 550 },
    { value: 112_000,   label: "IRR drag recovered (TCS lock-up cost)",      sub: "8 months × ₹14L × 12% assumed return",         color: "#059669", delay: 700 },
    { value: 0,         label: "Time to find and execute all 3 actions",      sub: "Via Valura platform + AI advisor",              color: "#B8913A", delay: 850, special: "< 8 min" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: "32px 90px",
      background: "radial-gradient(ellipse at 50% 40%,rgba(5,160,73,0.06) 0%,#FFFFFC 60%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* subtle grid bg */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(5,160,73,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(5,160,73,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...anim("d-fade", 600, 0), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12 }}>VALURA GIFT CITY DEMO SUMMARY</div>

        <div style={{ ...anim("d-up", 600, 200), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 38, fontWeight: 800, color: T.dark, textAlign: "center", marginBottom: 34 }}>
          What we just did for Rajesh
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 960, marginBottom: 28 }}>
          {boxes.map((b, i) => (
            <div key={i} id={`stat-box-${i}`} style={{
              animation: `${boxAnims[i]} 700ms cubic-bezier(0.16,1,0.3,1) ${b.delay}ms both`,
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "26px 28px",
              boxShadow: "0 1px 3px rgba(0,17,27,0.04),0 4px 20px rgba(0,17,27,0.08)",
              borderTop: `3px solid ${b.color}`,
            }}>
              <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 40, fontWeight: 800, color: b.color, lineHeight: 1, marginBottom: 10 }}>
                {b.special ? b.special : <Counter target={b.value} duration={1700} />}
              </div>
              <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 13, fontWeight: 600, color: T.body, marginBottom: 4 }}>{b.label}</div>
              <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 11, color: T.muted }}>{b.sub}</div>
            </div>
          ))}
        </div>

        {showTotal && (
          <div id="payoff-total" style={{ ...anim("d-total", 700, 0), textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: T.muted, marginBottom: 6, letterSpacing: "0.05em" }}>
              <TypedText text="Total client value created this FY:" mspChar={30} />
            </div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 62, fontWeight: 800, color: T.green, lineHeight: 1, marginBottom: 12 }}>
              <Counter target={1_925_941} duration={2000} isFinal />
            </div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 15, color: T.muted, fontStyle: "italic" }}>
              Across 3 strategies. One conversation. Zero complexity for the client.
            </div>
          </div>
        )}

        {showFinal && (
          <div style={{ ...anim("d-fade", 900, 0), fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 500, color: T.muted, textAlign: "center", marginTop: 18 }}>
            This is what Valura does for every client in your book.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 9 — The Delivery  (complete rebuild)
// ─────────────────────────────────────────────────────────────────────────────
function Scene9() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 3200);
    const t2 = setTimeout(() => setPhase(2), 4400);
    const t3 = setTimeout(() => setPhase(3), 6200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useSpotlight([
    { id: "delivery-report", delay: 200, duration: 3000, intensity: "soft" },
    { id: "delivery-wa", delay: 4400, duration: 3000, intensity: "strong" },
    { id: "delivery-email", delay: 4600, duration: 3000, intensity: "strong" },
    { id: "delivery-tagline", delay: 6200, duration: 3000, intensity: "soft" },
  ]);

  const actions = [
    { icon: "⚡", label: "Harvest NVDA + TSLA + GOOGL immediately", saved: "₹4,13,941", color: T.green },
    { icon: "⏳", label: "Hold MSFT — 150 days to LTCG threshold", saved: "₹20,535", color: T.amber },
    { icon: "👨‍👩‍👧", label: "Route ₹10L via wife Priya next FY", saved: "₹14,00,000", color: T.green },
  ];

  const reportVisible = phase < 2;
  const reportBlurred = phase === 1;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 100px", background: T.bg, overflow: "hidden", position: "relative", ...GRID_BG }}>

      {/* ── REPORT CARD ── */}
      <div id="delivery-report" style={{
        width: 660, flexShrink: 0, position: "relative", zIndex: 3,
        animation: phase === 0 ? "d-report-in 900ms cubic-bezier(0.16,1,0.3,1) 200ms both" : undefined,
        opacity: reportVisible ? (reportBlurred ? 0.28 : 1) : 0,
        filter: reportBlurred ? "blur(3px)" : "none",
        transform: reportBlurred ? "scale(0.96)" : "scale(1)",
        transition: "opacity 0.7s ease, filter 0.7s ease, transform 0.7s ease",
        boxShadow: "0 8px 48px rgba(0,17,27,0.14)",
        borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(5,160,73,0.18)",
      }}>
        {/* Dark header */}
        <div style={{ background: T.dark, padding: "20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 22, fontWeight: 800, color: T.green, letterSpacing: "-0.03em" }}>valura</div>
            <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.12)" }} />
            <div>
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>ADVISOR REPORT · FY 2025-26</div>
              <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 }}>GIFT City IFSC · Tax Action Summary</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>PREPARED BY</div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 700, color: "#fff" }}>Suresh Iyer</div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Wealth Manager</div>
          </div>
        </div>

        {/* Client strip */}
        <div style={{ background: T.greenBg, padding: "14px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.greenBrd}` }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, letterSpacing: "0.15em", textTransform: "uppercase" }}>CLIENT</div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 22, fontWeight: 800, color: T.dark }}>Rajesh Kumar</div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted }}>New Delhi · PAN AAAPK7890Q · HNI Old Regime</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>TOTAL VALUE CREATED</div>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 30, fontWeight: 800, color: T.green }}>₹19,25,941</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: T.card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {actions.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: T.cardBg, border: `1px solid ${T.border}`, ...anim("d-up", 500, 600 + i * 140) }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
              <span style={{ flex: 1, fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: T.body }}>{a.label}</span>
              <span style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 15, fontWeight: 800, color: a.color, flexShrink: 0 }}>{a.saved}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: T.cardBg, padding: "12px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted }}>Generated by Valura AI · March 28, 2026 · 09:41 AM</div>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, fontWeight: 700 }}>Execute by March 29 (T+2) →</div>
        </div>
      </div>

      {/* ── FLYING MINI-CLONES (phase 1 only) ── */}
      {phase === 1 && (
        <div style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -330, marginTop: -200, width: 660, height: 300, pointerEvents: "none", zIndex: 6 }}>
          {/* Clone → WhatsApp */}
          <div style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
            animation: "fly-to-wa 900ms cubic-bezier(0.4,0,1,1) both",
            background: T.card, borderRadius: 16, overflow: "hidden",
            border: `1px solid ${T.greenBrd}`, boxShadow: "0 4px 20px rgba(0,17,27,0.1)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ background: T.dark, padding: "10px 14px" }}>
              <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 14, fontWeight: 800, color: T.green }}>valura</div>
            </div>
            <div style={{ padding: "10px 14px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted }}>Rajesh Kumar · ₹19,25,941 saved</div>
          </div>
          {/* Clone → Email */}
          <div style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
            animation: "fly-to-email 900ms cubic-bezier(0.4,0,1,1) both",
            background: T.card, borderRadius: 16, overflow: "hidden",
            border: `1px solid ${T.greenBrd}`, boxShadow: "0 4px 20px rgba(0,17,27,0.1)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ background: T.dark, padding: "10px 14px" }}>
              <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 14, fontWeight: 800, color: T.green }}>valura</div>
            </div>
            <div style={{ padding: "10px 14px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: T.muted }}>Rajesh Kumar · ₹19,25,941 saved</div>
          </div>
        </div>
      )}

      {/* ── CHANNEL ICONS ── */}
      {phase >= 2 && (
        <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 160 }}>
          {/* WhatsApp */}
          <div id="delivery-wa" style={{ animation: "d-channel-pop 700ms cubic-bezier(0.16,1,0.3,1) 0ms both", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", animation: "channel-radar 1.5s ease-out 2", borderRadius: 22 }}>
              <img
                src="/whatsapp-logo.png" alt="" width={88} height={88}
                style={{ borderRadius: 22, display: "block" }}
                onError={(e) => {
                  const t = e.currentTarget.parentElement!;
                  e.currentTarget.style.display = "none";
                  t.style.cssText += `width:88px;height:88px;background:#25D366;border-radius:22px;display:flex;align-items:center;justify-content:center;`;
                  t.innerHTML = `<svg width="50" height="50" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.519 21.39l.28-1.024A9.457 9.457 0 012.5 12.5C2.5 7.253 6.753 3 12 3s9.5 4.253 9.5 9.5-4.253 9.5-9.5 9.5a9.457 9.457 0 01-4.866-1.337L3 21.5l2.519-.11z"/></svg>`;
                }}
              />
              {phase >= 3 && (
                <div style={{ position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", animation: "d-notif-bounce 600ms cubic-bezier(0.16,1,0.3,1) both", border: "2.5px solid #fff" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "d-tick-draw 400ms ease 100ms forwards" }} /></svg>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 15, fontWeight: 700, color: T.dark }}>WhatsApp</div>
              {phase >= 3 && <div style={{ ...anim("d-fade", 400, 200), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "#25D366", fontWeight: 600 }}>Delivered ✓✓</div>}
            </div>
          </div>

          {/* Centre badge */}
          <div style={{ ...anim("d-fade", 600, 400), display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 8 }}>
            <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 32, fontWeight: 800, color: T.green, lineHeight: 1, animation: "d-float 3s ease-in-out infinite" }}>v</div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Sent via Valura</div>
          </div>

          {/* Email */}
          <div id="delivery-email" style={{ animation: "d-channel-pop 700ms cubic-bezier(0.16,1,0.3,1) 80ms both", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", animation: "channel-radar-email 1.5s ease-out 2", borderRadius: 22 }}>
              <img
                src="/mail-logo.png" alt="" width={88} height={88}
                style={{ borderRadius: 22, display: "block" }}
                onError={(e) => {
                  const t = e.currentTarget.parentElement!;
                  e.currentTarget.style.display = "none";
                  t.style.cssText += `width:88px;height:88px;background:#3B82F6;border-radius:22px;display:flex;align-items:center;justify-content:center;`;
                  t.innerHTML = `<svg width="50" height="40" viewBox="0 0 50 40" fill="none"><rect x="1" y="1" width="48" height="38" rx="5" stroke="white" strokeWidth="2"/><polyline points="1,5 25,24 49,5" stroke="white" strokeWidth="2" fill="none"/></svg>`;
                }}
              />
              {phase >= 3 && (
                <div style={{ position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", animation: "d-notif-bounce 600ms cubic-bezier(0.16,1,0.3,1) 160ms both", border: "2.5px solid #fff" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "d-tick-draw 400ms ease 260ms forwards" }} /></svg>
                </div>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 15, fontWeight: 700, color: T.dark }}>Email</div>
              {phase >= 3 && <div style={{ ...anim("d-fade", 400, 360), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>Delivered ✓✓</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── FINAL TAGLINE ── */}
      {phase >= 3 && (
        <div id="delivery-tagline" style={{ ...anim("d-up", 700, 800), position: "absolute", bottom: 52, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 28, fontWeight: 800, color: T.dark, marginBottom: 7 }}>
            Rajesh gets his action plan. Instantly.
          </div>
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 15, color: T.muted, fontStyle: "italic" }}>
            No email chains. No follow-ups. Just clarity — delivered in seconds.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 10 — The Close  (dark, typographic, final)
// ─────────────────────────────────────────────────────────────────────────────
function Scene10() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const times = [400, 1000, 1400, 2200, 2600, 3800, 5500];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const lineStyle = (delay: number, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
    fontSize: 96, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em",
    ...anim("d-up", 700, delay),
    ...extra,
  });

  return (
    <div style={{
      height: "100%", width: "100%",
      background: "#00111B",
      backgroundImage: [
        "radial-gradient(ellipse at 40% 60%,rgba(5,160,73,0.12) 0%,transparent 55%)",
        "radial-gradient(ellipse at 70% 30%,rgba(180,227,200,0.06) 0%,transparent 50%)",
      ].join(","),
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {/* Scanner line (step 1) */}
      {step >= 1 && (
        <div style={{
          position: "absolute", top: "50%", left: 0,
          width: "100%", height: 1.5,
          background: "rgba(5,160,73,0.6)",
          animation: "d-scan-line 600ms ease-out both",
          pointerEvents: "none", zIndex: 1,
        }} />
      )}

      {/* Headline block */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        {/* Line 1 */}
        {step >= 2 && (
          <div style={lineStyle(0, { color: "#FFFFFC", display: "block" })}>
            The complexity
          </div>
        )}

        {/* Line 2 */}
        {step >= 3 && (
          <div style={lineStyle(0, { color: "rgba(255,255,255,0.32)", display: "block", marginBottom: 4 })}>
            stays with us.
          </div>
        )}

        {/* Gap */}
        <div style={{ height: 12 }} />

        {/* Line 3 */}
        {step >= 4 && (
          <div style={lineStyle(0, { color: "#FFFFFC", display: "block" })}>
            The credit
          </div>
        )}

        {/* Line 4 — THE payoff line */}
        {step >= 5 && (
          <div style={{
            ...lineStyle(0),
            color: "#05A049",
            display: "block",
            textShadow: "0 0 80px rgba(5,160,73,0.4)",
            animation: `d-up 700ms cubic-bezier(0.16,1,0.3,1) 0ms both, d-glow-text 2s ease-in-out 800ms infinite`,
          }}>
            goes to you.
          </div>
        )}

        {/* Sub-line */}
        {step >= 6 && (
          <div style={{
            ...anim("d-fade", 800, 0),
            marginTop: 40,
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 22, fontWeight: 500,
            color: "rgba(255,255,255,0.28)",
            fontStyle: "italic",
            lineHeight: 1.65,
            textAlign: "center",
          }}>
            So you walk into every client conversation
            <br />as the smartest person in the room.
          </div>
        )}
      </div>

      {/* Bottom branding */}
      {step >= 7 && (
        <div style={{
          ...anim("d-fade", 600, 0),
          position: "absolute", bottom: 52, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 32,
        }}>
          <div style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 18, fontWeight: 700, color: "#FFFFFC",
            letterSpacing: "-0.02em",
          }}>
            Valura · GIFT City
          </div>

          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#05A049",
            animation: "d-close-dot 2s ease-in-out infinite",
          }} />

          <div style={{
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 12, color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.04em",
          }}>
            Launching April 3rd, 2026
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
    case 9: return <Scene10 />;
    default: return null;
  }
}

const EXIT_ANIMS  = ["d-fadeScaleOut","d-slideLeftOut","d-fadeOut","d-fadeOut","d-fadeOut","d-slideLeftOut","d-fadeOut","d-flashOut","d-fadeOut","d-fadeOut"];
const ENTER_ANIMS = ["d-fadeIn","d-slideUpIn","d-slideRightIn","d-scaleUpIn","d-fadeIn","d-slideRightIn","d-scaleUpIn","d-explodeIn","d-scaleUpIn","d-fadeIn"];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [displayScene, setDisplayScene] = useState(0);
  const [exitScene, setExitScene]       = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [recordMode, setRecordMode]     = useState(false);
  const [autoPlay, setAutoPlay]         = useState(false);
  const [showGuide, setShowGuide]       = useState(true);
  const [showRecFlash, setShowRecFlash] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TOTAL = SCENE_NAMES.length;

  // Scaling
  useEffect(() => {
    function scale() {
      const root = document.getElementById("demo-root");
      if (!root) return;
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const l = (window.innerWidth - 1920 * s) / 2;
      const t = Math.max(0, (window.innerHeight - 1080 * s) / 2);
      Object.assign(root.style, { transform: `scale(${s})`, transformOrigin: "top left", left: `${Math.max(0, l)}px`, top: `${t}px`, position: "absolute" });
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
        case "p": case "P":
          setRecordMode(r => {
            if (!r) { setShowRecFlash(true); setTimeout(() => setShowRecFlash(false), 800); }
            return !r;
          });
          break;
        case "r": case "R": setDisplayScene(0); setExitScene(null); setIsTransitioning(false); break;
        case "a": case "A": setAutoPlay(p => !p); break;
        case "g": case "G": setShowGuide(g => !g); break;
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

  const exitAnim  = exitScene !== null ? EXIT_ANIMS[exitScene]  ?? "d-fadeOut" : "d-fadeOut";
  const enterAnim = ENTER_ANIMS[displayScene] ?? "d-fadeIn";

  return (
    <>
      <style>{DEMO_STYLES}</style>

      <div style={{ width: "100vw", height: "100vh", background: T.bg, overflow: "hidden", position: "relative" }}>

        {/* Auto-play progress bar */}
        {autoPlay && !recordMode && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: T.border, zIndex: 10001 }}>
            <div key={`pb-${displayScene}`} style={{ height: "100%", background: T.green, transformOrigin: "left center", animation: `d-progress ${SCENE_DURATIONS[displayScene]}s linear forwards` }} />
          </div>
        )}

        {/* 1920×1080 canvas */}
        <div id="demo-root" className="demo-root" style={{
          width: 1920, height: 1080, overflow: "hidden",
          background: T.bg, position: "relative",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        } as React.CSSProperties}>
          {exitScene !== null && (
            <div key={`exit-${exitScene}`} style={{ position: "absolute", inset: 0, zIndex: 2, animation: `${exitAnim} 420ms cubic-bezier(0.16,1,0.3,1) forwards` }}>
              {renderScene(exitScene)}
            </div>
          )}
          <div key={`active-${displayScene}`} style={{ position: "absolute", inset: 0, zIndex: 1, animation: `${enterAnim} 600ms cubic-bezier(0.16,1,0.3,1) forwards` }}>
            {renderScene(displayScene)}
          </div>

          {!recordMode && (
            <div style={{ position: "absolute", bottom: 22, right: 28, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.muted, pointerEvents: "none", zIndex: 10 }}>
              {displayScene + 1} / {TOTAL}
            </div>
          )}
        </div>

        {/* ── Record mode entrance flash ── */}
        {showRecFlash && (
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 13, color: T.red, fontWeight: 700, letterSpacing: "0.12em",
            animation: "d-rec-flash 800ms ease forwards",
            zIndex: 10003, pointerEvents: "none",
          }}>● REC</div>
        )}

        {/* ── Speaker guide (above navigator) ── */}
        {!recordMode && <SpeakerOverlay scene={displayScene} visible={showGuide} />}

        {/* ── Navigator ── */}
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.96)", border: `1px solid ${T.border}`,
          borderRadius: 100, padding: "10px 22px",
          display: "flex", alignItems: "center", gap: 14,
          backdropFilter: "blur(24px)",
          boxShadow: "0 4px 24px rgba(0,17,27,0.12)",
          borderTop: "1px solid rgba(5,160,73,0.15)",
          zIndex: 10000, userSelect: "none",
          opacity: recordMode ? 0 : 1,
          pointerEvents: recordMode ? "none" : "auto",
          transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          ...(recordMode ? { transform: "translateX(-50%) scale(0.1)" } : {}),
        }}>
          <button onClick={() => nav(-1)} disabled={displayScene === 0} style={{ background: "none", border: "none", color: displayScene === 0 ? T.border : T.muted, cursor: displayScene === 0 ? "default" : "pointer", fontSize: 16, padding: "0 4px", transition: "color 0.2s" }}>←</button>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {SCENE_NAMES.map((name, i) => (
              <button key={i} onClick={() => goTo(i)} title={name} style={{ width: i === displayScene ? 26 : 7, height: 7, borderRadius: 4, background: i === displayScene ? T.green : T.border, border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", position: "relative", boxShadow: i === displayScene ? "0 0 12px rgba(5,160,73,0.45)" : "none" }} />
            ))}
          </div>

          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>
            {displayScene + 1} / {TOTAL} · {SCENE_NAMES[displayScene]}
          </span>

          <button onClick={() => nav(1)} disabled={displayScene === TOTAL - 1} style={{ background: "none", border: "none", color: displayScene === TOTAL - 1 ? T.border : T.muted, cursor: displayScene === TOTAL - 1 ? "default" : "pointer", fontSize: 16, padding: "0 4px", transition: "color 0.2s" }}>→</button>

          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={() => setShowGuide(g => !g)} style={{ background: showGuide ? T.greenBg : "transparent", border: `1px solid ${showGuide ? T.greenBrd : T.border}`, borderRadius: 6, color: showGuide ? T.green : T.muted, cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", transition: "all 0.2s" }}>
            💬 GUIDE
          </button>

          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={() => setAutoPlay(p => !p)} style={{ background: autoPlay ? T.greenBg : "transparent", border: `1px solid ${autoPlay ? T.greenBrd : T.border}`, borderRadius: 6, color: autoPlay ? T.green : T.muted, cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", transition: "all 0.2s" }}>
            {autoPlay ? "⏸ MANUAL" : "▶ AUTO"}
          </button>

          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={() => { setRecordMode(true); setShowRecFlash(true); setTimeout(() => setShowRecFlash(false), 800); }} style={{ background: T.redBg, border: `1px solid ${T.redBrd}`, borderRadius: 100, color: T.red, cursor: "pointer", fontSize: 11, padding: "4px 13px", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: T.red, animation: "d-rec-dot 1.4s step-end infinite" }} />
            RECORD
          </button>
        </div>

        {recordMode && (
          <div style={{ position: "fixed", top: 10, right: 14, zIndex: 10002, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted, pointerEvents: "none" }}>
            P to exit record mode
          </div>
        )}
      </div>
    </>
  );
}
