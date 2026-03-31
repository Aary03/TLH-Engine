"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DEMO_CLIENT } from "@/lib/demo-data";

// ─── Scene metadata ───────────────────────────────────────────────────────────
const SCENE_NAMES = [
  "Tax. Solved.", "The Message", "The Situation",
  "The AI Advisor", "One Click.", "Your Results", "The Close",
];
const SCENE_DURATIONS = [12, 18, 14, 22, 16, 16, 20];

// ─── Design tokens (unchanged) ────────────────────────────────────────────────
const T = {
  bg:       "#00111B",
  card:     "#0A1E2A",
  cardBg:   "#071520",
  border:   "rgba(255,255,255,0.08)",
  dark:     "#FFFFFC",
  body:     "rgba(255,255,255,0.75)",
  muted:    "rgba(255,255,255,0.35)",
  green:    "#05A049",
  greenBg:  "rgba(5,160,73,0.1)",
  greenBrd: "rgba(5,160,73,0.25)",
  mint:     "#B4E3C8",
  red:      "#F87171",
  redBg:    "rgba(248,113,113,0.08)",
  redBrd:   "rgba(248,113,113,0.2)",
  amber:    "#F59E0B",
  amberBg:  "rgba(245,158,11,0.08)",
  amberBrd: "rgba(245,158,11,0.2)",
};

// ─── Shared background helpers ────────────────────────────────────────────────
const GRID_BG: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(rgba(5,160,73,0.04) 1px,transparent 1px)",
    "linear-gradient(90deg,rgba(5,160,73,0.04) 1px,transparent 1px)",
  ].join(","),
  backgroundSize: "48px 48px",
};

// ─── CSS (existing keyframes + new ones) ──────────────────────────────────────
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

  @keyframes d-box0 { from{opacity:0;transform:translateX(-40px) rotate(-2deg)} to{opacity:1;transform:translateX(0) rotate(0deg)} }
  @keyframes d-box1 { from{opacity:0;transform:translateX(40px) rotate(2deg)}  to{opacity:1;transform:translateX(0) rotate(0deg)} }
  @keyframes d-box2 { from{opacity:0;transform:translateY(-36px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-box3 { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }

  /* ── Persistent ── */
  @keyframes d-harvest-glow { 0%,100%{box-shadow:-3px 0 8px rgba(5,160,73,0.35)} 50%{box-shadow:-3px 0 20px rgba(5,160,73,0.75)} }
  @keyframes d-dot-pulse { 0%,100%{transform:scale(0.7);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }
  @keyframes d-cursor    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes d-rec-dot   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes d-progress  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes d-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes d-bar-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes d-ripple    { 0%{box-shadow:0 0 0 0 rgba(5,160,73,0.4)} 100%{box-shadow:0 0 0 16px rgba(5,160,73,0)} }
  @keyframes d-scanner   { from{top:0;opacity:0.9} to{top:100%;opacity:0} }
  @keyframes d-badge-pop { 0%{transform:scale(0)} 55%{transform:scale(1.3)} 80%{transform:scale(0.88)} 100%{transform:scale(1)} }
  @keyframes d-scan-line { from{transform:translateX(-100%)} to{transform:translateX(100vw)} }

  /* ── Spotlight ── */
  @keyframes d-spotlight-pulse { 0%{box-shadow:0 0 0 0 rgba(5,160,73,0.45)} 50%{box-shadow:0 0 0 18px rgba(5,160,73,0)} 100%{box-shadow:0 0 0 0 rgba(5,160,73,0)} }
  .spotlight-soft   { box-shadow:0 0 0 2px rgba(5,160,73,0.22),0 0 22px rgba(5,160,73,0.1) !important; transition:box-shadow 0.4s ease !important; }
  .spotlight-strong { animation:d-spotlight-pulse 820ms ease-out !important; }

  /* ── Dramatic counter ── */
  @keyframes d-num-flash       { 0%{opacity:0} 30%{opacity:1} 100%{opacity:0} }
  @keyframes d-underline-sweep { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes d-p0  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-55px,-55px) scale(0)} }
  @keyframes d-p1  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(0,-75px) scale(0)} }
  @keyframes d-p2  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(55px,-55px) scale(0)} }
  @keyframes d-p3  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(75px,0) scale(0)} }
  @keyframes d-p4  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(55px,55px) scale(0)} }
  @keyframes d-p5  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(0,75px) scale(0)} }
  @keyframes d-p6  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-55px,55px) scale(0)} }
  @keyframes d-p7  { 0%{opacity:0} 8%{opacity:1} 100%{opacity:0;transform:translate(-75px,0) scale(0)} }

  /* ── Record ── */
  @keyframes d-rec-flash { 0%{opacity:0} 15%{opacity:1} 70%{opacity:1} 100%{opacity:0} }

  /* ── Closing scene ── */
  @keyframes d-glow-text  { 0%,100%{text-shadow:0 0 80px rgba(5,160,73,0.4)} 50%{text-shadow:0 0 140px rgba(5,160,73,0.65),0 0 40px rgba(5,160,73,0.3)} }
  @keyframes d-close-dot  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.7} }

  /* ── NEW: Scene 4 (One Click) ── */
  @keyframes btn-shimmer      { 0%{background-position:-100% center} 100%{background-position:200% center} }
  @keyframes harvest-ripple   { 0%{transform:scale(0);opacity:0.6} 100%{transform:scale(4);opacity:0} }
  @keyframes card-green-fill  { from{opacity:0;transform:scaleY(0)} to{opacity:1;transform:scaleY(1)} }
  @keyframes d-notif-bounce   { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.3);opacity:1} 80%{transform:scale(0.9)} 100%{transform:scale(1);opacity:1} }

  /* ── NEW: Scene 5 (Your Results) bubbles ── */
  @keyframes bubble-pop {
    0%  {opacity:0;transform:scale(0.5) translateY(30px)}
    60% {opacity:1;transform:scale(1.06) translateY(-6px)}
    80% {transform:scale(0.97) translateY(2px)}
    100%{opacity:1;transform:scale(1) translateY(0)}
  }
  @keyframes zero-glow {
    0%,100%{box-shadow:0 0 0 0 rgba(5,160,73,0.2),0 8px 48px rgba(0,0,0,0.4)}
    50%    {box-shadow:0 0 0 20px rgba(5,160,73,0),0 8px 48px rgba(0,0,0,0.4)}
  }

  /* scrollbar */
  .demo-chat::-webkit-scrollbar { width:4px; }
  .demo-chat::-webkit-scrollbar-track { background:transparent; }
  .demo-chat::-webkit-scrollbar-thumb { background:rgba(5,160,73,0.2); border-radius:2px; }
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

// ─── Spotlight hook ────────────────────────────────────────────────────────────
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

// ─── Dramatic Counter ──────────────────────────────────────────────────────────
function Counter({
  target, duration = 1600, prefix = "₹", isFinal = false,
}: { target: number; duration?: number; prefix?: string; isFinal?: boolean }) {
  const [val, setVal] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [showLine, setShowLine] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    let start: number | null = null; let raf: number; let locked = false;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      if (p < 1) {
        let v: number;
        if (p < 0.3)      { const base = Math.round((p/0.3)*0.5*target); const noise = Math.round((Math.random()-0.38)*target*0.13); v = Math.max(0, Math.min(target-1, base+noise)); }
        else if (p < 0.7) { const q = (p-0.3)/0.4; v = Math.round(0.5*target+(1-Math.pow(1-q,2))*0.46*target); }
        else              { const q = (p-0.7)/0.3; v = Math.round(0.96*target+(1-Math.pow(1-q,4))*0.04*target); }
        setVal(v); raf = requestAnimationFrame(step);
      } else if (!locked) {
        locked = true; setVal(target);
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
      <span style={{ display: "inline-block", transform: bouncing ? "scale(1.07)" : "scale(1)", transition: "transform 0.36s cubic-bezier(0.34,1.56,0.64,1)", filter: "drop-shadow(0 2px 12px rgba(5,160,73,0.3))" }}>
        {prefix}{val.toLocaleString("en-IN")}
      </span>
      {flashing && <span style={{ position: "absolute", inset: "-4px -6px", background: "rgba(5,160,73,0.14)", borderRadius: 6, animation: "d-num-flash 480ms ease forwards", pointerEvents: "none", zIndex: 1 }} />}
      {showLine && <span style={{ position: "absolute", bottom: -3, left: 0, right: 0, height: 2, background: T.green, transformOrigin: "left center", animation: "d-underline-sweep 280ms ease-out both", pointerEvents: "none" }} />}
      {showParticles && Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: "50%", background: i%3===0?T.green:i%3===1?"#4ADE80":T.greenBrd, animationName: `d-p${i%8}`, animationDuration: "640ms", animationTimingFunction: "cubic-bezier(0.25,1,0.5,1)", animationDelay: `${i*18}ms`, animationFillMode: "both", pointerEvents: "none" }} />
      ))}
    </span>
  );
}

// ─── TypedText ─────────────────────────────────────────────────────────────────
function TypedText({ text, mspChar = 22, startDelay = 0, onDone }: {
  text: string; mspChar?: number; startDelay?: number; onDone?: () => void;
}) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const t0 = setTimeout(() => {
      const iv = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); onDone?.(); } }, mspChar);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <span>
      {shown}
      {shown.length < text.length && <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.7s step-end infinite", marginLeft: 1 }} />}
    </span>
  );
}

// ─── Speaker Guide ────────────────────────────────────────────────────────────
const GUIDE_POINTS: { text: string; time: number }[][] = [
  [ // Scene 0 — Tax. Solved.
    { text: "Every tax headache. Solved.", time: 0 },
    { text: "No CA required. No spreadsheets.", time: 3600 },
    { text: "This is what Valura gives you.", time: 7000 },
  ],
  [ // Scene 1 — The Message
    { text: "This is your client. 9pm. Panicking.", time: 0 },
    { text: "Watch how this resolves in two minutes.", time: 3800 },
    { text: "₹19.25 lakh of value. One conversation.", time: 12500 },
  ],
  [ // Scene 2 — The Situation
    { text: "₹14 lakh TCS — locked, sitting with government", time: 0 },
    { text: "Wife's limit completely unused this year", time: 800 },
    { text: "₹9.68 lakh in losses sitting idle — harvestable", time: 2200 },
  ],
  [ // Scene 3 — The AI Advisor
    { text: "Your agentic tax advisor working in real time", time: 0 },
    { text: "Three actions. Exact rupee savings.", time: 5000 },
    { text: "This is what your client expects from you.", time: 15000 },
  ],
  [ // Scene 4 — One Click.
    { text: "Three positions. ₹9.68 lakh in losses.", time: 0 },
    { text: "One button. Watch what happens.", time: 2000 },
    { text: "Harvested, rebuyed, loss locked — instantly.", time: 5000 },
  ],
  [ // Scene 5 — Your Results
    { text: "₹14 lakh TCS — eliminated", time: 600 },
    { text: "Tax bill this year — zero", time: 800 },
    { text: "Total value: ₹19.25 lakh. One client. One conversation.", time: 3500 },
  ],
  [ // Scene 6 — The Close
    { text: "The complexity stays with us.", time: 1000 },
    { text: "The credit goes to you.", time: 2200 },
    { text: "This is what Valura gives every advisor.", time: 5000 },
  ],
];

function SpeakerOverlay({ scene, visible }: { scene: number; visible: boolean }) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const pts = GUIDE_POINTS[scene] ?? [];
    setIdx(0); setFading(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    pts.forEach((p, i) => {
      if (i === 0) return;
      const t = setTimeout(() => { setFading(true); setTimeout(() => { setIdx(i); setFading(false); }, 400); }, p.time);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [scene]);
  if (!visible) return null;
  const current = (GUIDE_POINTS[scene] ?? [])[idx];
  if (!current) return null;
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(0,17,27,0.86)", border: "1px solid rgba(180,227,200,0.15)", borderRadius: 12, padding: "11px 22px", maxWidth: 520, backdropFilter: "blur(20px)", zIndex: 10001, opacity: fading ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: "none" }}>
      <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap" }}>
        💬 {current.text}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 0 — Tax. Solved.
// ═════════════════════════════════════════════════════════════════════════════
function Scene0() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const times = [0, 600, 1000, 1500, 2200, 3600, 5200, 7000];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const chips = [
    "✓  TCS Optimization",
    "✓  Tax Loss Harvesting",
    "✓  LRS Family Planning",
    "✓  AI-Powered Tax Advisor",
  ];

  return (
    <div style={{
      height: "100%", width: "100%",
      background: "#00111B",
      backgroundImage: [
        "radial-gradient(ellipse at 35% 55%,rgba(5,160,73,0.11) 0%,transparent 55%)",
        "radial-gradient(ellipse at 75% 30%,rgba(180,227,200,0.05) 0%,transparent 45%)",
      ].join(","),
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {/* Scanner line */}
      {step >= 1 && (
        <div style={{
          position: "absolute", top: "50%", left: 0, width: "100%", height: 1,
          background: "linear-gradient(90deg,transparent,#05A049,transparent)",
          animation: "d-scan-line 500ms ease-out both",
          pointerEvents: "none", zIndex: 1,
        }} />
      )}

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Badge */}
        {step >= 2 && (
          <div style={{
            ...anim("d-fade", 500, 0),
            background: "rgba(5,160,73,0.08)", border: "1px solid rgba(5,160,73,0.2)",
            borderRadius: 100, padding: "6px 18px", marginBottom: 52,
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em",
          }}>
            VALURA · GIFT CITY · IFSCA REGULATED
          </div>
        )}

        {/* Headline */}
        {step >= 3 && (
          <div style={{ ...anim("d-up", 700, 0), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 88, fontWeight: 800, color: "#FFFFFC", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
            Every tax headache
          </div>
        )}
        {step >= 4 && (
          <div style={{ ...anim("d-up", 700, 0), fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 88, fontWeight: 800, color: "rgba(255,255,255,0.32)", letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: 8 }}>
            your clients have —
          </div>
        )}
        {step >= 5 && (
          <div style={{
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 88, fontWeight: 800, color: "#05A049",
            letterSpacing: "-0.04em", lineHeight: 1.0,
            animation: "d-up 500ms cubic-bezier(0.16,1,0.3,1) both, d-glow-text 2s ease-in-out 800ms infinite",
            textShadow: "0 0 80px rgba(5,160,73,0.5),0 0 160px rgba(5,160,73,0.2)",
          }}>
            Solved.
          </div>
        )}

        {/* Chips */}
        {step >= 6 && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
            {chips.map((c, i) => (
              <div key={c} style={{
                ...anim("d-scale", 500, i * 100),
                background: "rgba(5,160,73,0.1)", border: "1px solid rgba(5,160,73,0.22)",
                borderRadius: 100, padding: "8px 20px",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: 12, color: T.mint,
              }}>{c}</div>
            ))}
          </div>
        )}

        {/* Tagline */}
        {step >= 7 && (
          <div style={{
            ...anim("d-fade", 800, 0),
            marginTop: 36,
            fontFamily: "var(--font-manrope,'Manrope',sans-serif)",
            fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.25)",
            fontStyle: "italic",
          }}>
            No CA required. No spreadsheets. No 11pm panic.
          </div>
        )}

        {/* Wordmark */}
        {step >= 8 && (
          <div style={{
            ...anim("d-fade", 600, 0),
            position: "absolute", bottom: -120, right: 0,
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 16, color: "rgba(255,255,255,0.2)", letterSpacing: "-0.02em",
          }}>
            Valura.Ai
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 1 — The Message  (modified chat scene)
// ═════════════════════════════════════════════════════════════════════════════
function Scene1() {
  const [step, setStep] = useState(0);
  const [aiResponseDone, setAiResponseDone] = useState(false);
  const [showFinalLine, setShowFinalLine] = useState(false);

  const clientMsg = "Hey Suresh, I invested ₹80 lakhs in global markets this year but the bank deducted ₹14 lakhs as TCS. Now FY is ending in 8 days and I have big losses in NVDA and TSLA sitting unrealized. I'm panicking — what do I do?";
  const partnerMsg = "Rajesh — I hear you. Let me check with Valura's AI right now. Give me 2 minutes.";
  const valuraQuery = "Rajesh Kumar — ₹80L remitted, ₹14L TCS deducted. NVDA down ₹6.86L, TSLA down ₹2.59L, GOOGL down ₹0.24L. FY closes in 6 days. 3 urgent actions needed.";
  const aiReply = "Rajesh has 3 urgent actions before March 31:\n\n1. Harvest NVDA + TSLA + GOOGL losses NOW — saves ₹4,13,941 in tax.\n2. MSFT: do NOT sell — 150 days to LTCG, saves ₹20,535 by waiting.\n3. Next FY: route ₹10L through wife Priya — saves ₹14,00,000 TCS.\n\nTotal value: ₹19,25,941. Execute harvests by March 28 (T+2).";

  useEffect(() => {
    const times = [200, 3800, 6200, 8000, 12500];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!aiResponseDone) return;
    const t = setTimeout(() => setShowFinalLine(true), 1500);
    return () => clearTimeout(t);
  }, [aiResponseDone]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 100px", background: T.bg, ...GRID_BG }}>
      {/* Header */}
      <div style={{ ...anim("d-fade", 500, 0), textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 32, fontWeight: 800, color: T.dark, letterSpacing: "-0.02em" }}>
          This is your client.
        </div>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 8, letterSpacing: "0.05em" }}>
          9pm. March 28th. Six days to FY end.
        </div>
      </div>

      {/* Chat thread */}
      <div style={{ width: "100%", maxWidth: 780, display: "flex", flexDirection: "column", gap: 18 }}>
        {step >= 1 && (
          <div style={{ ...anim("d-msg", 500, 0), display: "flex", gap: 10, alignItems: "flex-end", maxWidth: 680, alignSelf: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)" }}>RK</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4 }}>Rajesh Kumar · Client</div>
              <div style={{ background: "#0D2535", border: `1px solid ${T.border}`, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
                {clientMsg}
              </div>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div style={{ ...anim("d-msg", 500, 0), display: "flex", flexDirection: "row-reverse", gap: 10, alignItems: "flex-end", maxWidth: 500, alignSelf: "flex-end" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)" }}>SI</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", marginBottom: 4, textAlign: "right" }}>Suresh Iyer · Wealth Manager</div>
              <div style={{ background: T.card, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "14px 4px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
                {partnerMsg}
              </div>
            </div>
          </div>
        )}

        {step >= 3 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-end" }}>
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, animation: "d-ripple 1.2s ease-out 1", boxShadow: "0 0 0 0 rgba(5,160,73,0.4)" }}>⚡</div>
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
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "14px 4px 14px 14px", padding: "12px 16px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
              <TypedText text={valuraQuery} mspChar={14} />
            </div>
          </div>
        )}

        {step >= 5 && (
          <div style={{ ...anim("d-msg", 500, 0), alignSelf: "flex-start", maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700 }}>Valura AI · GIFT City Advisor</span>
            </div>
            <div style={{ background: "rgba(5,160,73,0.1)", border: "1.5px solid rgba(5,160,73,0.3)", borderRadius: "4px 14px 14px 14px", padding: "14px 18px", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.75 }}>
              <TypedText mspChar={11} text={aiReply} onDone={() => setAiResponseDone(true)} />
            </div>
          </div>
        )}
      </div>

      {showFinalLine && (
        <div style={{ ...anim("d-fade", 600, 0), marginTop: 24, fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 16, color: "rgba(255,255,255,0.3)", fontStyle: "italic", textAlign: "center" }}>
          Your client is waiting. You have two minutes.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 2 — The Situation
// ═════════════════════════════════════════════════════════════════════════════
function Scene2() {
  const [tcsCounter, setTcsCounter] = useState(false);
  const [lossCounter, setLossCounter] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTcsCounter(true), 800);
    const t2 = setTimeout(() => setLossCounter(true), 1100);
    const t3 = setTimeout(() => setShowChips(true), 1400);
    const t4 = setTimeout(() => setShowBottom(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", padding: "32px 90px", background: T.bg, ...GRID_BG, gap: 32 }}>
      {/* Header */}
      <div style={{ ...anim("d-up", 600, 0), textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
          CLIENT SITUATION · FY 2025-26
        </div>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 44, fontWeight: 800, color: T.dark, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Rajesh Kumar. ₹80 lakh invested.
        </div>
        <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>
          Two problems. Both solvable. Right now.
        </div>
      </div>

      {/* Two cards */}
      <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 1000, alignItems: "stretch" }}>
        {/* Card Left — TCS */}
        <div style={{
          ...anim("d-left", 600, 600),
          flex: 1, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)",
          borderRadius: 20, padding: "32px 36px", borderTop: "3px solid #F87171",
        }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.red, letterSpacing: "0.15em", marginBottom: 18, textTransform: "uppercase" }}>PROBLEM 01</div>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 56, fontWeight: 800, color: T.red, lineHeight: 1, marginBottom: 14 }}>
            {tcsCounter ? <Counter target={1_400_000} duration={1100} /> : "₹0"}
          </div>
          <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>TCS deducted upfront</div>
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20, lineHeight: 1.6 }}>
            Locked with the government for 8 months.
          </div>
          <div style={{ borderTop: "1px solid rgba(248,113,113,0.15)", paddingTop: 16 }}>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8, lineHeight: 1.6 }}>
              Wife Priya&apos;s ₹10L limit — completely unused this year.
            </div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, fontWeight: 600, color: T.red }}>
              → ₹14L that never needed to go.
            </div>
          </div>
        </div>

        {/* Card Right — Losses */}
        <div style={{
          ...anim("d-right", 600, 900),
          flex: 1, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
          borderRadius: 20, padding: "32px 36px", borderTop: `3px solid ${T.amber}`,
        }}>
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.amber, letterSpacing: "0.15em", marginBottom: 18, textTransform: "uppercase" }}>PROBLEM 02</div>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 56, fontWeight: 800, color: T.amber, lineHeight: 1, marginBottom: 14 }}>
            {lossCounter ? <Counter target={968_877} duration={1100} /> : "₹0"}
          </div>
          <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Unrealised losses in NVDA, TSLA, GOOGL</div>
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20, lineHeight: 1.6 }}>
            Sitting there. Doing nothing. FY closing in 6 days.
          </div>
          {showChips && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "NVDA  -₹6.86L", delay: 0 },
                { label: "TSLA  -₹2.59L", delay: 100 },
                { label: "GOOGL -₹0.24L", delay: 200 },
              ].map((c) => (
                <div key={c.label} style={{
                  ...anim("d-scale", 400, c.delay),
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11,
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
                  borderRadius: 100, padding: "4px 12px", color: T.red,
                }}>{c.label}</div>
              ))}
            </div>
          )}
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, fontWeight: 600, color: T.amber }}>
            → Tax savings waiting to be unlocked.
          </div>
        </div>
      </div>

      {/* Bottom line */}
      {showBottom && (
        <div style={{ ...anim("d-fade", 700, 0), fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
          Valura&apos;s AI identifies both. Solves both. Instantly.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 3 — The AI Advisor  (reused AI scene, modified)
// ═════════════════════════════════════════════════════════════════════════════
function Scene3() {
  const QUESTION = "Rajesh Kumar — ₹80L remitted, ₹14L TCS deducted. NVDA down ₹6.86L, TSLA down ₹2.59L, GOOGL down ₹0.24L. FY closes in 6 days. What are the exact 3 actions and savings?";
  const TYPING_MS = 20;
  const [typedQ, setTypedQ] = useState("");
  const [showDots, setShowDots] = useState(false);
  const [aiText, setAiText] = useState("");
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
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

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setShowBadge(true), 800);
    return () => clearTimeout(t);
  }, [done]);

  const streamAI = async () => {
    try {
      const resp = await fetch("/api/ai-demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: DEMO_CLIENT.ai.userMessage }) });
      if (!resp.body) return;
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
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
        ? <span key={i} style={{ background: "rgba(5,160,73,0.15)", color: T.mint, borderRadius: 3, padding: "0 2px", fontWeight: 600 }}>{p}</span>
        : p
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "32px 80px 24px", background: T.bg, ...GRID_BG }}>
      <div style={{ ...anim("d-fade", 600, 0), textAlign: "center", marginBottom: 28, flexShrink: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: 100, padding: "5px 14px", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: "0.12em" }}>VALURA AI · GIFT CITY ADVISOR</span>
        </div>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 36, fontWeight: 800, color: T.dark }}>
          Your agentic tax advisor.
        </div>
        <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 15, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Rajesh&apos;s full situation. Three actions. Exact savings.
        </div>
      </div>

      <div ref={chatRef} className="demo-chat" style={{ width: "100%", maxWidth: 740, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 4 }}>
        {typedQ && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ background: "#0D2535", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "4px 14px 14px 14px", padding: "13px 17px", maxWidth: "84%", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.68 }}>
              {typedQ}{typedQ.length < QUESTION.length && <span style={{ borderRight: `2px solid ${T.green}`, animation: "d-cursor 0.8s step-end infinite", marginLeft: 1 }} />}
            </div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.muted, marginTop: 4, marginLeft: 4 }}>just now</div>
          </div>
        )}

        {showDots && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBrd}`, borderRadius: "14px 14px 4px 14px", padding: "14px 20px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, animation: `d-dot-pulse 1.2s ease-in-out ${i*0.22}s infinite` }} />)}
            </div>
          </div>
        )}

        {aiText && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.green, marginBottom: 5, marginRight: 4, fontWeight: 700 }}>Valura AI</div>
            <div style={{ background: "rgba(5,160,73,0.1)", border: "1.5px solid rgba(5,160,73,0.28)", borderRadius: "14px 14px 4px 14px", padding: "15px 19px", maxWidth: "92%", fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.75, whiteSpace: "pre-wrap", boxShadow: "0 2px 16px rgba(5,160,73,0.08)" }}>
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

      {showBadge && (
        <div style={{ ...anim("d-scale", 600, 0), marginTop: 16, background: "rgba(5,160,73,0.12)", border: "1px solid rgba(5,160,73,0.25)", borderRadius: 14, padding: "14px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 20, fontWeight: 700, color: T.green }}>
            ₹19,25,941 total value identified
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 4 — One Click.
// ═════════════════════════════════════════════════════════════════════════════
function Scene4() {
  const [showButton, setShowButton] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [harvestedCards, setHarvestedCards] = useState([false, false, false]);
  const [buttonHarvested, setButtonHarvested] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  const cards = [
    { ticker: "NVDA", name: "NVIDIA Corp",   loss: "₹6,85,971", saved: "₹2,93,129" },
    { ticker: "TSLA", name: "Tesla Inc",     loss: "₹2,58,570", saved: "₹1,10,413" },
    { ticker: "GOOGL", name: "Alphabet Inc", loss: "₹24,336",   saved: "₹10,399"   },
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setShowButton(true), 2000));
    // Auto-click sequence
    timers.push(setTimeout(() => { setButtonPressed(true); }, 4500));
    timers.push(setTimeout(() => { setButtonPressed(false); setShowRipple(true); }, 4620));
    timers.push(setTimeout(() => setShowRipple(false), 5300));
    // Harvest cards
    timers.push(setTimeout(() => setHarvestedCards([true, false, false]), 5000));
    timers.push(setTimeout(() => setHarvestedCards([true, true, false]), 5150));
    timers.push(setTimeout(() => setHarvestedCards([true, true, true]), 5300));
    timers.push(setTimeout(() => setButtonHarvested(true), 5400));
    // Result
    timers.push(setTimeout(() => setShowResult(true), 6000));
    timers.push(setTimeout(() => setShowTagline(true), 7500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 80px", gap: 28,
      background: "#00111B",
      backgroundImage: "radial-gradient(ellipse at 50% 40%,rgba(5,160,73,0.09) 0%,transparent 55%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ ...anim("d-up", 600, 200), textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: T.green, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          TAX LOSS HARVESTING ENGINE
        </div>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 42, fontWeight: 800, color: T.dark, letterSpacing: "-0.03em" }}>
          Three positions. ₹9.68 lakh in harvestable losses.
        </div>
      </div>

      {/* Position cards */}
      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 900 }}>
        {cards.map((c, i) => {
          const harvested = harvestedCards[i];
          return (
            <div key={c.ticker} style={{
              ...anim("d-up", 550, 600 + i * 120),
              flex: 1, position: "relative", overflow: "hidden",
              background: harvested ? "rgba(5,160,73,0.12)" : T.card,
              border: harvested ? "1px solid rgba(5,160,73,0.3)" : `1px solid ${T.border}`,
              borderRadius: 16, padding: "18px 24px",
              transition: "background 0.5s ease, border-color 0.5s ease",
            }}>
              {harvested && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top,rgba(5,160,73,0.18) 0%,rgba(5,160,73,0.05) 100%)",
                  animation: "card-green-fill 400ms ease-out both",
                  transformOrigin: "bottom center",
                  pointerEvents: "none", zIndex: 0,
                }} />
              )}
              {harvested && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: T.green, color: "#fff",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: 9, fontWeight: 700,
                  borderRadius: 4, padding: "3px 8px",
                  animation: "d-notif-bounce 500ms cubic-bezier(0.16,1,0.3,1) both",
                  zIndex: 1,
                }}>HARVESTED</div>
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 18, fontWeight: 700, color: T.dark, marginBottom: 2 }}>{c.ticker}</div>
                <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>{c.name}</div>
                <div style={{
                  fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
                  fontSize: 28, fontWeight: 800,
                  color: harvested ? T.green : T.red,
                  transition: "color 0.3s ease", marginBottom: 2,
                }}>
                  {c.loss}{harvested ? " ✓" : ""}
                </div>
                <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                  Harvestable STCL
                </div>
                <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 13, fontWeight: 600, color: T.green }}>
                  Saves {c.saved}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        Total harvestable: ₹9,68,877 · Tax saved: ₹4,13,941
      </div>

      {/* The Button */}
      {showButton && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative" }}>
          <button style={{
            width: 380, height: 72,
            background: buttonHarvested
              ? "linear-gradient(135deg,#05A049,#038C3E)"
              : "linear-gradient(90deg,#038C3E,#05A049,#07C45C,#05A049,#038C3E)",
            backgroundSize: "200% 100%",
            border: "none", borderRadius: 100, cursor: "pointer",
            fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
            fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em",
            boxShadow: buttonHarvested
              ? "0 0 60px rgba(5,160,73,0.6),0 8px 32px rgba(5,160,73,0.3)"
              : "0 0 40px rgba(5,160,73,0.4),0 8px 32px rgba(5,160,73,0.3)",
            transform: buttonPressed ? "scale(0.95)" : "scale(1)",
            transition: "transform 0.12s ease, box-shadow 0.4s ease",
            animation: !buttonHarvested ? "d-scale 700ms cubic-bezier(0.16,1,0.3,1) both, btn-shimmer 2.5s ease-in-out 800ms infinite" : "d-scale 700ms cubic-bezier(0.16,1,0.3,1) both",
          }}>
            {buttonHarvested ? "✓  Harvested" : "⚡  Harvest All Losses"}
          </button>

          {/* Ripple */}
          {showRipple && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              width: 200, height: 200,
              marginLeft: -100, marginTop: -100,
              borderRadius: "50%",
              background: "rgba(5,160,73,0.3)",
              animation: "harvest-ripple 600ms ease-out forwards",
              pointerEvents: "none",
            }} />
          )}

          {showButton && !buttonHarvested && (
            <div style={{ ...anim("d-fade", 500, 300), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
              No wash-sale rule in India. Sell and rebuy instantly.
            </div>
          )}
        </div>
      )}

      {/* Result panel */}
      {showResult && (
        <div style={{
          ...anim("d-up", 700, 0),
          background: "rgba(5,160,73,0.09)", border: "1.5px solid rgba(5,160,73,0.25)",
          borderRadius: 20, padding: "24px 36px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", maxWidth: 700,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Tax saved for Rajesh</div>
            <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>This financial year</div>
          </div>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 56, fontWeight: 800, color: T.green, lineHeight: 1, filter: "drop-shadow(0 2px 20px rgba(5,160,73,0.5))" }}>
            <Counter target={413_941} duration={1600} />
          </div>
        </div>
      )}

      {showTagline && (
        <div style={{ ...anim("d-fade", 700, 0), fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
          Positions sold and reburied instantly. Cost basis reset. Loss locked.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Your Results
// ═════════════════════════════════════════════════════════════════════════════
function Scene5() {
  const [showTotal, setShowTotal] = useState(false);
  const [showCallout, setShowCallout] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTotal(true), 3500);
    const t2 = setTimeout(() => setShowCallout(true), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useSpotlight([
    { id: "bubble-0", delay: 600, duration: 2000, intensity: "soft" },
    { id: "bubble-1", delay: 800, duration: 2500, intensity: "strong" },
    { id: "bubble-2", delay: 1000, duration: 2000, intensity: "soft" },
  ]);

  const bubbles = [
    {
      id: "bubble-0", delay: 600, scale: 1,
      bg: "rgba(5,160,73,0.12)", border: "1.5px solid rgba(5,160,73,0.3)",
      value: 1_400_000, fontSize: 52, label: "LRS Optimized",
      sub: "Wife's ₹10L threshold used — zero TCS next FY",
    },
    {
      id: "bubble-1", delay: 800, scale: 1.1,
      bg: "rgba(5,160,73,0.1)", border: "1.5px solid rgba(5,160,73,0.25)",
      value: 0, fontSize: 72, label: "Tax Bill This Year",
      sub: "All gains wiped by harvested losses",
      isZero: true,
    },
    {
      id: "bubble-2", delay: 1000, scale: 1,
      bg: "rgba(5,160,73,0.12)", border: "1.5px solid rgba(5,160,73,0.3)",
      value: 413_941, fontSize: 44, label: "Tax Saved via TLH",
      sub: "NVDA + TSLA + GOOGL harvested and rebuyed",
    },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: "40px 90px", gap: 32,
      background: "#00111B",
      backgroundImage: "radial-gradient(ellipse at 50% 50%,rgba(5,160,73,0.08) 0%,transparent 50%)",
    }}>
      {/* Header */}
      <div style={{ ...anim("d-up", 500, 0), textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 40, fontWeight: 800, color: T.dark, letterSpacing: "-0.03em" }}>
          What Valura just did for your client.
        </div>
        <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.3)", fontStyle: "italic", marginTop: 8 }}>
          One conversation. No CA. No spreadsheet. No waiting.
        </div>
      </div>

      {/* Bubbles */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "center" }}>
        {bubbles.map((b) => (
          <div key={b.id} id={b.id} style={{
            width: 280, height: 280,
            transform: `scale(${b.scale})`,
            borderRadius: 28, padding: "32px",
            background: b.bg, border: b.border,
            boxShadow: b.isZero ? undefined : "0 8px 48px rgba(0,0,0,0.4)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            textAlign: "center",
            animation: `bubble-pop 800ms cubic-bezier(0.16,1,0.3,1) ${b.delay}ms both${b.isZero ? ", zero-glow 2.5s ease-in-out 1600ms infinite" : ""}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "rgba(5,160,73,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: 20, color: T.green, marginBottom: 12,
            }}>₹</div>
            <div style={{
              fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
              fontSize: b.fontSize, fontWeight: 800, color: T.green, lineHeight: 1,
              marginBottom: 10,
              filter: "drop-shadow(0 2px 16px rgba(5,160,73,0.4))",
            }}>
              {b.isZero
                ? <span style={{ ...anim("d-scale", 600, b.delay + 600) }}>₹0</span>
                : <Counter target={b.value} duration={1600} />
              }
            </div>
            <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 700, color: T.dark, marginBottom: 8 }}>{b.label}</div>
            <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Total */}
      {showTotal && (
        <div style={{ ...anim("d-total", 700, 0), textAlign: "center" }}>
          <div style={{ width: 400, height: 1, background: T.green, margin: "0 auto 16px", opacity: 0.3 }} />
          <div style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
            Total value created for Rajesh:
          </div>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 68, fontWeight: 800, color: T.green, lineHeight: 1, filter: "drop-shadow(0 4px 32px rgba(5,160,73,0.5))" }}>
            <Counter target={1_925_941} duration={2000} isFinal />
          </div>
        </div>
      )}

      {/* Partner callout */}
      {showCallout && (
        <div style={{
          ...anim("d-fade", 800, 0),
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "14px 24px", maxWidth: 600, textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            Multiply this across 20 clients = ₹3.85 crore in value created this FY.
          </div>
          <div style={{ fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            That&apos;s what Valura does for your book.
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENE 6 — The Close  (reused unchanged)
// ═════════════════════════════════════════════════════════════════════════════
function Scene6() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const times = [400, 1000, 1400, 2200, 2600, 3800, 5500];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const lineStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)",
    fontSize: 96, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em",
    ...anim("d-up", 700, 0), ...extra,
  });

  return (
    <div style={{
      height: "100%", width: "100%", background: "#00111B",
      backgroundImage: [
        "radial-gradient(ellipse at 40% 60%,rgba(5,160,73,0.12) 0%,transparent 55%)",
        "radial-gradient(ellipse at 70% 30%,rgba(180,227,200,0.06) 0%,transparent 50%)",
      ].join(","),
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {step >= 1 && (
        <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 1.5, background: "rgba(5,160,73,0.6)", animation: "d-scan-line 600ms ease-out both", pointerEvents: "none", zIndex: 1 }} />
      )}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        {step >= 2 && <div style={lineStyle({ color: "#FFFFFC", display: "block" })}>The complexity</div>}
        {step >= 3 && <div style={lineStyle({ color: "rgba(255,255,255,0.32)", display: "block", marginBottom: 4 })}>stays with us.</div>}
        <div style={{ height: 12 }} />
        {step >= 4 && <div style={lineStyle({ color: "#FFFFFC", display: "block" })}>The credit</div>}
        {step >= 5 && (
          <div style={{ ...lineStyle(), color: "#05A049", display: "block", textShadow: "0 0 80px rgba(5,160,73,0.4)", animation: "d-up 700ms cubic-bezier(0.16,1,0.3,1) 0ms both, d-glow-text 2s ease-in-out 800ms infinite" }}>
            goes to you.
          </div>
        )}
        {step >= 6 && (
          <div style={{ ...anim("d-fade", 800, 0), marginTop: 40, fontFamily: "var(--font-manrope,'Manrope',sans-serif)", fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.28)", fontStyle: "italic", lineHeight: 1.65, textAlign: "center" }}>
            So you walk into every client conversation
            <br />as the smartest person in the room.
          </div>
        )}
      </div>
      {step >= 7 && (
        <div style={{ ...anim("d-fade", 600, 0), position: "absolute", bottom: 52, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
          <div style={{ fontFamily: "var(--font-bricolage,'Bricolage Grotesque',sans-serif)", fontSize: 18, fontWeight: 700, color: "#FFFFFC", letterSpacing: "-0.02em" }}>Valura · GIFT City</div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#05A049", animation: "d-close-dot 2s ease-in-out infinite" }} />
          <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>Launching April 3rd, 2026</div>
        </div>
      )}
    </div>
  );
}

// ─── Scene renderer ────────────────────────────────────────────────────────────
function renderScene(idx: number) {
  switch (idx) {
    case 0: return <Scene0 />;
    case 1: return <Scene1 />;
    case 2: return <Scene2 />;
    case 3: return <Scene3 />;
    case 4: return <Scene4 />;
    case 5: return <Scene5 />;
    case 6: return <Scene6 />;
    default: return null;
  }
}

const EXIT_ANIMS  = ["d-fadeOut","d-slideLeftOut","d-fadeOut","d-fadeOut","d-flashOut","d-dissolveOut","d-fadeOut"];
const ENTER_ANIMS = ["d-fadeIn","d-slideUpIn","d-slideRightIn","d-scaleUpIn","d-explodeIn","d-scaleUpIn","d-fadeIn"];

// ─── Main page ─────────────────────────────────────────────────────────────────
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
        default: if (e.key >= "1" && e.key <= "7") goTo(parseInt(e.key) - 1);
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
      <div style={{ width: "100vw", height: "100vh", background: "#00111B", overflow: "hidden", position: "relative" }}>

        {autoPlay && !recordMode && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: T.border, zIndex: 10001 }}>
            <div key={`pb-${displayScene}`} style={{ height: "100%", background: T.green, transformOrigin: "left center", animation: `d-progress ${SCENE_DURATIONS[displayScene]}s linear forwards` }} />
          </div>
        )}

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

        {showRecFlash && (
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 13, color: T.red, fontWeight: 700, letterSpacing: "0.12em", animation: "d-rec-flash 800ms ease forwards", zIndex: 10003, pointerEvents: "none" }}>● REC</div>
        )}

        {!recordMode && <SpeakerOverlay scene={displayScene} visible={showGuide} />}

        {/* Navigator */}
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,17,27,0.92)", border: "1px solid rgba(180,227,200,0.12)",
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
          <button onClick={() => nav(-1)} disabled={displayScene === 0} style={{ background: "none", border: "none", color: displayScene === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)", cursor: displayScene === 0 ? "default" : "pointer", fontSize: 16, padding: "0 4px", transition: "color 0.2s" }}>←</button>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {SCENE_NAMES.map((name, i) => (
              <button key={i} onClick={() => goTo(i)} title={name} style={{ width: i === displayScene ? 26 : 7, height: 7, borderRadius: 4, background: i === displayScene ? T.green : T.border, border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", position: "relative", boxShadow: i === displayScene ? "0 0 12px rgba(5,160,73,0.45)" : "none" }} />
            ))}
          </div>

          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
            {displayScene + 1} / {TOTAL} · {SCENE_NAMES[displayScene]}
          </span>

          <button onClick={() => nav(1)} disabled={displayScene === TOTAL - 1} style={{ background: "none", border: "none", color: displayScene === TOTAL - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)", cursor: displayScene === TOTAL - 1 ? "default" : "pointer", fontSize: 16, padding: "0 4px", transition: "color 0.2s" }}>→</button>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

          <button onClick={() => setShowGuide(g => !g)} style={{ background: showGuide ? T.greenBg : "transparent", border: `1px solid ${showGuide ? T.greenBrd : "rgba(255,255,255,0.1)"}`, borderRadius: 6, color: showGuide ? T.green : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", transition: "all 0.2s" }}>
            💬 GUIDE
          </button>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

          <button onClick={() => setAutoPlay(p => !p)} style={{ background: autoPlay ? T.greenBg : "transparent", border: `1px solid ${autoPlay ? T.greenBrd : "rgba(255,255,255,0.1)"}`, borderRadius: 6, color: autoPlay ? T.green : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, padding: "4px 10px", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", transition: "all 0.2s" }}>
            {autoPlay ? "⏸ MANUAL" : "▶ AUTO"}
          </button>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

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
