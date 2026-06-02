"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, X, Zap, Globe2, ShieldAlert, Scissors,
  Sparkles, TrendingUp, Play, RotateCcw,
} from "lucide-react";

/* ── Premium dark tokens ── */
const M = {
  green: "#05A049", greenSoft: "#7BE2A8", mint: "#B4E3C8",
  red: "#FF6B6B", amber: "#F5C451", blue: "#7AA2F7",
  text: "rgba(255,255,255,0.92)", muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.28)",
  glass: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)",
};

type FocusId =
  | "title" | "portfolio" | "threats" | "estate" | "dividend" | "fork"
  | "fee" | "giftcity" | "tlh" | "ai" | "payoff" | "close";

interface Scene { kicker: string; title: string; sub: string; focus: FocusId; }

const SCENES: Scene[] = [
  { kicker: "Valura · GIFT City Tax Engine", title: "The taxes nobody shows you.", sub: "Made visible — and then made to disappear. A 90-second walkthrough.", focus: "title" },
  { kicker: "Meet the investor", title: "Aarav wants to own the world.", sub: "₹2 crore. Apple, the S&P 500, global markets — all from India.", focus: "portfolio" },
  { kicker: "The problem", title: "Buy it directly, and three taxes start eating.", sub: "Silently. Most investors never see a single one of them.", focus: "threats" },
  { kicker: "Hidden tax #1 · US estate tax", title: "If he dies holding US stocks…", sub: "…the US can take up to 40% above a $60,000 cushion. There is no India–US estate treaty to soften it.", focus: "estate" },
  { kicker: "Hidden tax #2 · dividends", title: "Every ₹100 dividend arrives as ₹70.", sub: "The US withholds 25% before Aarav ever sees it — every single year.", focus: "dividend" },
  { kicker: "The fork", title: "Same goal. Three doors.", sub: "The tax on his profit is identical in all three — so cost and estate risk decide it. Watch the green column.", focus: "fork" },
  { kicker: "The fee they don't print", title: "His feeder fund hides a second fee.", sub: "The fund charges one. The master fund underneath charges another. Aarav pays both — every year, forever.", focus: "fee" },
  { kicker: "The turn · GIFT City", title: "Now watch them disappear.", sub: "Routed through GIFT City into a non-US fund: US estate tax falls to zero, and the dividend drag gets lighter.", focus: "giftcity" },
  { kicker: "The time machine · TLH", title: "And the losses already in his portfolio?", sub: "We turn them into real tax savings — booked before 31 March, with no wash-sale rule to stop the rebuy.", focus: "tlh" },
  { kicker: "The mind-reader · AI advisor", title: "Anything he doesn't understand, he asks.", sub: "It runs the actual tax calculations, knows his profile, and answers in plain English.", focus: "ai" },
  { kicker: "The payoff", title: "Same money. Same markets. 30 years.", sub: "The only difference is knowing what this tool just showed him.", focus: "payoff" },
  { kicker: "Valura", title: "The global investor's tax, solved.", sub: "Beautifully. Correctly. In plain English.", focus: "close" },
];

export default function MagicShow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const total = SCENES.length;
  const scene = SCENES[step];

  const next = useCallback(() => setStep((s) => Math.min(total - 1, s + 1)), [total]);
  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const exit = useCallback(() => router.push("/"), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, exit]);

  const isLast = step === total - 1;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden select-none"
      style={{ background: "radial-gradient(120% 120% at 50% 0%, #0A2233 0%, #00121C 45%, #00070E 100%)" }}>

      {/* Animated glow blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[34rem] w-[34rem] rounded-full magic-blob"
        style={{ background: "radial-gradient(circle, rgba(5,160,73,0.22), transparent 60%)", filter: "blur(40px)" }} />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full magic-blob"
        style={{ background: "radial-gradient(circle, rgba(122,162,247,0.16), transparent 60%)", filter: "blur(50px)", animationDelay: "3s" }} />
      {/* Spotlight vignette */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 50% 48%, transparent 40%, rgba(0,4,9,0.55) 100%)" }} />
      {/* Blurred ghost field — "the rest of the app", out of focus */}
      <GhostField />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(5,160,73,0.2)" }}>
            <Zap className="h-3.5 w-3.5" style={{ color: M.green }} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-bricolage)", color: "#fff" }}>Valura</span>
          <span className="hidden sm:inline text-[11px]" style={{ color: M.muted }}>· Magic Demo</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] tabular-nums" style={{ color: M.muted }}>{step + 1} / {total}</span>
          <button onClick={exit} aria-label="Exit demo"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: M.muted }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Progress line */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%`, background: `linear-gradient(90deg, ${M.green}, ${M.greenSoft})` }} />
      </div>

      {/* Scene */}
      <div key={step} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="magic-rise text-[11px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: M.green, animationDelay: "0.05s" }}>
          {scene.kicker}
        </p>
        <h1 className="magic-rise max-w-3xl text-3xl sm:text-5xl font-extrabold leading-[1.07] tracking-tight mb-4"
          style={{ fontFamily: "var(--font-bricolage)", color: "#fff", animationDelay: "0.12s" }}>
          {scene.title}
        </h1>
        <p className="magic-rise max-w-xl text-sm sm:text-base leading-relaxed mb-9" style={{ color: M.muted, animationDelay: "0.2s" }}>
          {scene.sub}
        </p>
        <div className="magic-rise w-full flex justify-center" style={{ animationDelay: "0.3s" }}>
          <Focus id={scene.focus} onReplay={() => setStep(0)} onExplore={exit} />
        </div>
      </div>

      {/* Controls */}
      {!isLast && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-4 pb-7">
          <button onClick={prev} disabled={step === 0} aria-label="Previous"
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-25 hover:bg-white/10"
            style={{ borderColor: M.border, color: "#fff" }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {SCENES.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} aria-label={`Go to scene ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 22 : 6, background: i === step ? M.green : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <button onClick={next} aria-label="Next"
            className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-95"
            style={{ background: `linear-gradient(135deg, ${M.green}, #028037)`, boxShadow: "0 8px 30px rgba(5,160,73,0.4)" }}>
            Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
        Use → ← arrows or Space · Esc to exit
      </p>
    </div>
  );
}

/* ════════ Focal content per scene ════════ */
function Focus({ id, onReplay, onExplore }: { id: FocusId; onReplay: () => void; onExplore: () => void }) {
  switch (id) {
    case "title":
      return (
        <div className="magic-pop flex items-center gap-3 rounded-2xl px-6 py-4 magic-glow"
          style={{ background: M.glass, border: `1px solid ${M.border}`, backdropFilter: "blur(12px)" }}>
          <Play className="h-5 w-5" style={{ color: M.green }} />
          <span className="text-sm font-semibold" style={{ color: M.text }}>Press <b style={{ color: "#fff" }}>Next →</b> to begin</span>
        </div>
      );

    case "portfolio":
      return (
        <GlassCard glow>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "rgba(5,160,73,0.2)", color: M.greenSoft }}>AM</div>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: "#fff" }}>Aarav Mehta</p>
              <p className="text-[11px]" style={{ color: M.muted }}>Resident Indian · investing globally</p>
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#fff" }}>₹2,00,00,000</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 magic-stagger">
            {["🍎 Apple", "📈 S&P 500", "💻 Nasdaq", "🏅 Gold"].map((t) => (
              <span key={t} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: M.mint, border: `1px solid ${M.border}` }}>{t}</span>
            ))}
          </div>
        </GlassCard>
      );

    case "threats":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 magic-stagger">
          {[
            { icon: ShieldAlert, c: M.red, t: "Estate tax", d: "Up to 40% to the US" },
            { icon: TrendingUp, c: M.amber, t: "Dividend tax", d: "25% skimmed at source" },
            { icon: Globe2, c: M.blue, t: "Schedule FA", d: "₹10L/yr if you slip" },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl px-5 py-4 w-56" style={{ background: M.glass, border: `1px solid ${M.border}`, backdropFilter: "blur(10px)" }}>
              <x.icon className="h-6 w-6 mb-2 mx-auto" style={{ color: x.c }} />
              <p className="text-sm font-bold" style={{ color: "#fff" }}>{x.t}</p>
              <p className="text-[11px] mt-0.5" style={{ color: M.muted }}>{x.d}</p>
            </div>
          ))}
        </div>
      );

    case "estate":
      return (
        <BigStat value="40%" valueColor={M.red} caption="US estate tax · US stocks above a $60,000 cushion" />
      );

    case "dividend":
      return (
        <GlassCard>
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: M.muted }}>Every ₹100 of US dividend</p>
          <div className="space-y-2 w-72">
            <WaterRow label="Dividend declared" amount="₹100" kind="start" pct={100} />
            <WaterRow label="US withholds (25%)" amount="−₹25" kind="bad" pct={25} />
            <WaterRow label="Extra Indian tax" amount="−₹5" kind="bad" pct={5} />
            <WaterRow label="In Aarav's hand" amount="₹70" kind="good" pct={70} />
          </div>
        </GlassCard>
      );

    case "fork":
      return (
        <GlassCard wide>
          <div className="grid grid-cols-4 text-[11px] sm:text-xs">
            <Cell head="" />
            <Cell head="Direct" />
            <Cell head="Feeder" />
            <Cell head="UCITS" best />
            <Cell label="Yearly fee" />
            <Cell v="~0%" /><Cell v="2.3%" /><Cell v="0.2%" best />
            <Cell label="US estate tax" />
            <Cell v="up to 40%" bad /><Cell v="depends" /><Cell v="$0" best />
            <Cell label="Tax on profit" />
            <Cell v="12.5%" /><Cell v="12.5%" /><Cell v="12.5%" best />
          </div>
          <p className="mt-3 text-[11px]" style={{ color: M.muted }}>Green = lowest cost & lowest risk.</p>
        </GlassCard>
      );

    case "fee":
      return (
        <GlassCard>
          <p className="text-sm font-bold mb-1" style={{ color: "#fff" }}>Edelweiss US Technology feeder</p>
          <p className="text-[11px] mb-4" style={{ color: M.muted }}>What you actually pay every year</p>
          <div className="h-5 w-72 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full magic-grow flex items-center justify-center text-[10px] font-bold text-white" style={{ width: "66%", background: M.green }}>1.51%</div>
            <div className="h-full magic-grow flex items-center justify-center text-[10px] font-bold text-white" style={{ width: "34%", background: M.amber, animationDelay: "0.5s" }}>0.78%</div>
          </div>
          <div className="mt-3 flex items-center justify-between w-72 text-xs">
            <span style={{ color: M.muted }}>Feeder + hidden master fee</span>
            <span className="text-lg font-extrabold" style={{ color: "#fff", fontFamily: "var(--font-bricolage)" }}>= 2.29%</span>
          </div>
        </GlassCard>
      );

    case "giftcity":
      return (
        <div className="flex flex-col items-center gap-4">
          <BigStat value="$0" valueColor={M.greenSoft} caption="US estate tax — when the fund's underlying isn't US-domiciled (Ireland UCITS)" />
          <div className="flex flex-wrap justify-center gap-2 magic-stagger">
            {["Dividend drag → lighter", "No US-situs estate net", "Indian onboarding"].map((t) => (
              <span key={t} className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "rgba(5,160,73,0.14)", color: M.greenSoft, border: "1px solid rgba(5,160,73,0.3)" }}>✓ {t}</span>
            ))}
          </div>
        </div>
      );

    case "tlh":
      return (
        <div className="relative">
          <div className="absolute inset-0 -z-10 space-y-2 opacity-30 blur-[3px]">
            {[0, 1, 2].map((i) => <div key={i} className="h-10 w-72 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />)}
          </div>
          <GlassCard glow>
            <div className="flex items-center gap-2 justify-center mb-1">
              <Scissors className="h-4 w-4" style={{ color: M.green }} />
              <p className="text-[11px] uppercase tracking-widest" style={{ color: M.muted }}>Tax-loss harvesting</p>
            </div>
            <p className="text-5xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: M.greenSoft }}>₹28.6L</p>
            <p className="text-[12px] mt-2" style={{ color: M.muted }}>saved from losses already in his portfolio · booked before 31 March</p>
          </GlassCard>
        </div>
      );

    case "ai":
      return (
        <GlassCard wide>
          <div className="text-left space-y-2.5">
            <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs text-white" style={{ background: M.green }}>
              How are my US dividends taxed?
            </div>
            <div className="w-fit max-w-[88%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${M.border}`, color: M.text }}>
              <p className="mb-1.5">The US withholds <b className="text-white">25%</b>; you reclaim it via Form 67.</p>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: M.muted }}>
                <Sparkles className="h-3 w-3" style={{ color: M.greenSoft }} /> ran the real calculation · knows your profile
              </div>
            </div>
          </div>
        </GlassCard>
      );

    case "payoff":
      return (
        <BigStat value="+₹3.1 Cr" valueColor={M.greenSoft} caption="more kept over 30 years vs investing direct & untaxed-optimised (illustrative)" />
      );

    case "close":
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl magic-glow" style={{ background: "rgba(5,160,73,0.18)" }}>
            <Zap className="h-8 w-8" style={{ color: M.green }} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onExplore}
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-95"
              style={{ background: `linear-gradient(135deg, ${M.green}, #028037)`, boxShadow: "0 8px 30px rgba(5,160,73,0.4)" }}>
              Explore the platform <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onReplay}
              className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all hover:bg-white/10"
              style={{ color: "#fff", border: `1px solid ${M.border}` }}>
              <RotateCcw className="h-4 w-4" /> Replay
            </button>
          </div>
        </div>
      );
  }
}

/* ════════ building blocks ════════ */
function GlassCard({ children, glow, wide }: { children: React.ReactNode; glow?: boolean; wide?: boolean }) {
  return (
    <div className={`rounded-3xl px-7 py-6 ${glow ? "magic-glow" : ""}`}
      style={{ background: M.glass, border: `1px solid ${M.border}`, backdropFilter: "blur(16px)", minWidth: wide ? 340 : 280, maxWidth: wide ? 460 : 360,
        boxShadow: glow ? undefined : "0 20px 60px rgba(0,0,0,0.4)" }}>
      {children}
    </div>
  );
}

function BigStat({ value, valueColor, caption }: { value: string; valueColor: string; caption: string }) {
  return (
    <div className="magic-pop flex flex-col items-center">
      <p className="text-7xl sm:text-8xl font-extrabold leading-none" style={{ fontFamily: "var(--font-bricolage)", color: valueColor, textShadow: `0 0 60px ${valueColor}55` }}>
        {value}
      </p>
      <p className="mt-4 max-w-sm text-sm" style={{ color: M.muted }}>{caption}</p>
    </div>
  );
}

function WaterRow({ label, amount, kind, pct }: { label: string; amount: string; kind: "start" | "bad" | "good"; pct: number }) {
  const col = kind === "good" ? M.greenSoft : kind === "bad" ? M.red : "#fff";
  const bg = kind === "good" ? "rgba(5,160,73,0.15)" : kind === "bad" ? "rgba(255,107,107,0.12)" : "rgba(255,255,255,0.06)";
  return (
    <div className="relative overflow-hidden rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="absolute inset-y-0 left-0 magic-grow" style={{ width: `${pct}%`, background: bg }} />
      <span className="relative text-[12px]" style={{ color: M.text }}>{label}</span>
      <span className="relative text-[12px] font-bold tabular-nums" style={{ color: col }}>{amount}</span>
    </div>
  );
}

function Cell({ head, label, v, best, bad }: { head?: string; label?: string; v?: string; best?: boolean; bad?: boolean }) {
  if (head !== undefined) {
    return <div className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: best ? M.greenSoft : M.muted }}>{head}</div>;
  }
  if (label) {
    return <div className="px-2 py-2 text-left font-semibold" style={{ color: "#fff" }}>{label}</div>;
  }
  return (
    <div className="px-2 py-2 rounded-md" style={{ background: best ? "rgba(5,160,73,0.16)" : "transparent", color: best ? M.greenSoft : bad ? M.red : M.text, fontWeight: best ? 700 : 400 }}>{v}</div>
  );
}

/* Blurred "rest of the app" behind the spotlight */
function GhostField() {
  const ghosts = [
    { t: "8%", l: "6%", w: 150, h: 90 }, { t: "20%", l: "78%", w: 130, h: 80 },
    { t: "62%", l: "4%", w: 160, h: 100 }, { t: "70%", l: "80%", w: 140, h: 90 },
    { t: "40%", l: "86%", w: 110, h: 70 }, { t: "78%", l: "40%", w: 180, h: 70 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {ghosts.map((g, i) => (
        <div key={i} className="absolute rounded-2xl"
          style={{ top: g.t, left: g.l, width: g.w, height: g.h, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)", filter: "blur(2px)", opacity: 0.5 }} />
      ))}
    </div>
  );
}
