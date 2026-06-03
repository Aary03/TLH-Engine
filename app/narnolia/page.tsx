"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, X, Check, CheckCircle2, ShieldCheck, Globe2,
  Clock, Sparkles, TrendingUp, FileText, Download, RotateCcw, Loader2, Wallet,
} from "lucide-react";
import {
  SHOW, SHOW_CLIENT, SHOW_FUND, computeShow, inrShort, FILING_CHECKLIST,
} from "@/lib/showcase-data";
import { generateShowcaseReport } from "@/lib/partner/showcaseReport";

const C = {
  red: "#E0342A", green: "#05A049", navy: "#00111B", mint: "#B4E3C8",
  muted: "#6b7280", border: "#E5E7EB", page: "#FFFFFC",
  redBg: "#FDECEA", greenBg: "#EDFAF3", greenBorder: "#B4E3C8",
};

const m = computeShow();

type FocusId = "title" | "client" | "fund" | "bought" | "time" | "tax" | "reports" | "close";
interface Step { kicker: string; title: string; sub: string; focus: FocusId; }

const STEPS: Step[] = [
  { kicker: "Narnolia × Valura · Live", title: "Global investing. Fully tax-solved.", sub: "Watch one client go from buying a global fund to a filed, optimised return — in 90 seconds.", focus: "title" },
  { kicker: "Step 1 · Onboard the client", title: "Meet Aarav.", sub: "A resident Indian with ₹50 lakh to put to work globally.", focus: "client" },
  { kicker: "Step 2 · The Narnolia UCITS fund", title: "One fund. Every tax problem, pre-solved.", sub: "Ireland-domiciled and accumulating — the structure quietly does the work.", focus: "fund" },
  { kicker: "Step 2 · Order confirmed", title: "Bought.", sub: `${m.units.toLocaleString("en-IN")} units allotted at $${SHOW.navBuyUSD}. ₹50,00,000 deployed.`, focus: "bought" },
  { kicker: "Step 3 · Time passes", title: "26 months later…", sub: "Markets compound. Dividends quietly reinvest inside the fund — taxed at 0% in India.", focus: "time" },
  { kicker: "Step 4 · The taxable event", title: "Aarav redeems. Now — the tax.", sub: "This is where most tools panic. Watch it get solved.", focus: "tax" },
  { kicker: "Step 5 · The filings", title: "Every report — generated. Done.", sub: "Co-branded Narnolia × Valura, ITR-ready, in one click.", focus: "reports" },
  { kicker: "Narnolia × Valura", title: "Access from Narnolia. Tax solved by Valura.", sub: "From the buy order to the filed return — end to end.", focus: "close" },
];

export default function NarnoliaShow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const scene = STEPS[step];
  const next = useCallback(() => setStep((s) => Math.min(total - 1, s + 1)), [total]);
  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const exit = useCallback(() => router.push("/partner"), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, exit]);

  const isLast = step === total - 1;

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden select-none" style={{ background: C.page }}>
      {/* soft glows */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-[28rem] w-[28rem] rounded-full" style={{ background: "radial-gradient(circle, rgba(224,52,42,0.10), transparent 60%)", filter: "blur(50px)" }} />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-[26rem] w-[26rem] rounded-full" style={{ background: "radial-gradient(circle, rgba(5,160,73,0.12), transparent 60%)", filter: "blur(55px)" }} />

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.red }}>Narnolia</span>
          <span className="text-sm text-gray-300">×</span>
          <span className="text-base font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] tabular-nums" style={{ color: C.muted }}>{step + 1} / {total}</span>
          <button onClick={exit} aria-label="Exit" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" style={{ color: C.muted }}><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5" style={{ background: "#F0F0EE" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${((step + 1) / total) * 100}%`, background: `linear-gradient(90deg, ${C.red}, ${C.green})` }} />
      </div>

      {/* scene */}
      <div key={step} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="magic-rise text-[11px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: C.green, animationDelay: "0.05s" }}>{scene.kicker}</p>
        <h1 className="magic-rise max-w-3xl text-3xl sm:text-5xl font-extrabold leading-[1.08] tracking-tight mb-3" style={{ fontFamily: "var(--font-bricolage)", color: C.navy, animationDelay: "0.12s" }}>{scene.title}</h1>
        <p className="magic-rise max-w-xl text-sm sm:text-base leading-relaxed mb-8" style={{ color: C.muted, animationDelay: "0.2s" }}>{scene.sub}</p>
        <div className="magic-rise w-full flex justify-center" style={{ animationDelay: "0.3s" }}>
          <Focus id={scene.focus} onBuy={next} onReplay={() => setStep(0)} onExit={exit} />
        </div>
      </div>

      {/* controls */}
      {!isLast && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-4 pb-7">
          <button onClick={prev} disabled={step === 0} className="flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-25 hover:bg-gray-50" style={{ borderColor: C.border, color: C.navy }}><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 22 : 6, background: i === step ? C.green : "#D7DBDD" }} />
            ))}
          </div>
          <button onClick={next} className="group flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-95" style={{ background: `linear-gradient(135deg, ${C.green}, #028037)`, boxShadow: "0 8px 28px rgba(5,160,73,0.32)" }}>
            Next <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-[10px]" style={{ color: "#C4C8CA" }}>→ ← arrows · Space · Esc to exit</p>
    </div>
  );
}

/* ───── focal content ───── */
function Focus({ id, onBuy, onReplay, onExit }: { id: FocusId; onBuy: () => void; onReplay: () => void; onExit: () => void }) {
  switch (id) {
    case "title":
      return (
        <Card glow>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.red }}>Narnolia</span>
            <span className="text-lg text-gray-300">×</span>
            <span className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
          </div>
          <p className="mt-3 text-xs" style={{ color: C.muted }}>Press <b style={{ color: C.navy }}>Next →</b> to begin the journey</p>
        </Card>
      );

    case "client":
      return (
        <Card glow>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold" style={{ background: C.green, color: "#fff" }}>AM</div>
            <div className="text-left">
              <p className="text-base font-bold" style={{ color: C.navy }}>{SHOW_CLIENT.name}</p>
              <p className="text-[11px]" style={{ color: C.muted }}>PAN {SHOW_CLIENT.pan} · {SHOW_CLIENT.residency}</p>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: C.greenBg }}>
            <p className="text-[11px]" style={{ color: C.muted }}>To invest globally</p>
            <p className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.navy }}>₹50,00,000</p>
          </div>
        </Card>
      );

    case "fund":
      return (
        <Card wide glow>
          <div className="flex items-start justify-between">
            <div className="text-left">
              <p className="text-base font-bold" style={{ color: C.navy }}>{SHOW_FUND.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{SHOW_FUND.isin} · {SHOW_FUND.domicile} · {SHOW_FUND.structure} · TER {SHOW_FUND.ter}%</p>
            </div>
            <Globe2 className="h-6 w-6 flex-shrink-0" style={{ color: C.green }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              "15% dividend tax — not 25%",
              "$0 US estate tax",
              "12.5% long-term capital gains",
              "Dividends auto-reinvest, 0% in India",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left" style={{ background: C.greenBg }}>
                <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.green }} />
                <span className="text-[11px] font-semibold" style={{ color: "#256" }}>{b}</span>
              </div>
            ))}
          </div>
          <button onClick={onBuy} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-95" style={{ background: C.navy }}>
            <Wallet className="h-4 w-4" /> Buy ₹50,00,000 of this fund <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      );

    case "bought":
      return (
        <Card glow>
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-3" style={{ background: C.greenBg }}><CheckCircle2 className="h-7 w-7" style={{ color: C.green }} /></div>
            <p className="text-lg font-extrabold" style={{ color: C.navy, fontFamily: "var(--font-bricolage)" }}>Order confirmed</p>
            <div className="mt-3 w-full space-y-1.5 text-left">
              {[["Fund", SHOW_FUND.short], ["Units", m.units.toLocaleString("en-IN")], ["NAV", `$${SHOW.navBuyUSD}`], ["Invested", "₹50,00,000"], ["Trade date", SHOW.buyDate]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <span style={{ color: C.muted }}>{k}</span><span className="font-bold" style={{ color: C.navy }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      );

    case "time":
      return (
        <Card glow>
          <div className="flex items-center justify-center gap-2 mb-2" style={{ color: C.muted }}>
            <Clock className="h-4 w-4 animate-pulse" style={{ color: C.green }} />
            <span className="text-[11px] uppercase tracking-widest">Dec 2023 → Feb 2026</span>
          </div>
          <p className="text-5xl sm:text-6xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.navy }}>
            <CountUp from={SHOW.investINR} to={m.proceedsINR} />
          </p>
          <p className="mt-2 text-sm font-bold" style={{ color: C.green }}>+{m.gainPct.toFixed(1)}% · {inrShort(m.gainINR)} gain</p>
          <p className="mt-3 text-[11px] rounded-lg px-3 py-2" style={{ background: C.greenBg, color: "#256" }}>
            ~{inrShort(m.divReinvestedINR)} of dividends accumulated inside the fund — taxed at <b>0% in India</b>.
          </p>
        </Card>
      );

    case "tax":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 magic-stagger" style={{ maxWidth: 560 }}>
          <TaxCard label="Capital gain" value={inrShort(m.gainINR)} sub="held 26 months → long-term" color={C.navy} />
          <TaxCard label={`LTCG tax @ ${m.effRatePct.toFixed(2)}%`} value={inrShort(m.taxINR)} sub="12.5% + surcharge + cess" color={C.red} />
          <TaxCard label="Dividend tax in India" value="₹0" sub="accumulating — nothing to declare" color={C.green} />
          <TaxCard label="US estate tax" value="$0" sub="Irish unit — non-US asset" color={C.green} />
          <div className="sm:col-span-2 rounded-2xl p-4 flex items-center justify-between" style={{ background: C.navy }}>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Net in Aarav's hand</span>
            <span className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#7BE2A8" }}>{inrShort(m.netINR)}</span>
          </div>
        </div>
      );

    case "reports":
      return <ReportsFocus />;

    case "close":
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.red }}>Narnolia</span>
            <span className="text-xl text-gray-300">×</span>
            <span className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onExit} className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-95" style={{ background: `linear-gradient(135deg, ${C.green}, #028037)` }}>Open the partner suite <ArrowRight className="h-4 w-4" /></button>
            <button onClick={onReplay} className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all hover:bg-gray-50" style={{ color: C.navy, border: `1px solid ${C.border}` }}><RotateCcw className="h-4 w-4" /> Replay</button>
          </div>
        </div>
      );
  }
}

function ReportsFocus() {
  const [busy, setBusy] = useState(false);
  const dl = async () => { setBusy(true); try { await generateShowcaseReport(); } finally { setBusy(false); } };
  return (
    <Card wide glow>
      <div className="space-y-1.5">
        {FILING_CHECKLIST.map((f) => {
          const need = f.status === "required";
          return (
            <div key={f.doc} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left" style={{ background: need ? C.greenBg : "#F9FAFB" }}>
              {need ? <Check className="h-4 w-4 flex-shrink-0" style={{ color: C.green }} /> : <span className="h-4 w-4 flex-shrink-0 text-center text-xs" style={{ color: C.muted }}>—</span>}
              <span className="text-[12px] font-bold flex-1" style={{ color: C.navy }}>{f.doc}</span>
              <span className="text-[10px] font-semibold" style={{ color: need ? C.green : C.muted }}>{need ? "Generated" : "Not needed"}</span>
            </div>
          );
        })}
      </div>
      <a href="/narnolia/report" className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-95" style={{ background: `linear-gradient(135deg, ${C.red}, #B82820)` }}>
        <FileText className="h-4 w-4" /> Open the beautiful report →
      </a>
      <button onClick={dl} disabled={busy} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold disabled:opacity-60" style={{ color: C.muted }}>
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        or download as Excel
      </button>
    </Card>
  );
}

/* ───── bits ───── */
function Card({ children, wide, glow }: { children: React.ReactNode; wide?: boolean; glow?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 ${glow ? "magic-glow" : ""}`} style={{ background: "#fff", borderColor: C.border, minWidth: wide ? 360 : 300, maxWidth: wide ? 480 : 380, boxShadow: glow ? undefined : "0 20px 50px rgba(0,17,27,0.08)" }}>
      {children}
    </div>
  );
}

function TaxCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border p-4 text-left" style={{ background: "#fff", borderColor: C.border }}>
      <p className="text-[11px]" style={{ color: C.muted }}>{label}</p>
      <p className="text-2xl font-extrabold mt-0.5" style={{ fontFamily: "var(--font-bricolage)", color }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</p>
    </div>
  );
}

function CountUp({ from, to, durationMs = 1500 }: { from: number; to: number; durationMs?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, durationMs]);
  return <>{inrShort(v)}</>;
}
