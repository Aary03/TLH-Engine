"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgePercent, Calculator, Map, TrendingUp, Shield, UserCheck,
  ChevronRight, Sparkles, ArrowRight, Lightbulb, AlertCircle,
  CheckCircle2, Clock, Users, BookOpen, Zap, TriangleAlert,
  Calendar, MessageSquare, ChevronDown,
} from "lucide-react";

/* ─── Colour palette ──────────────────────────────────────────────────── */
const C = {
  green: "#05A049", mint: "#B4E3C8", dark: "#00111B",
  amber: "#B8913A", red: "#DC2626", blue: "#2B4A8A",
  bg: "#FFFFFC",
};

/* ─── Mini helpers ────────────────────────────────────────────────────── */
function Tag({ children, color = C.green }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: `${color}18`, color }}>
      {children}
    </span>
  );
}

function Row({ label, value, color = "#374151" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
      <span className="text-xs text-gray-500 pr-2">{label}</span>
      <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

function GreenRow({ label, value }: { label: string; value: string }) {
  return <Row label={label} value={value} color={C.green} />;
}
function RedRow({ label, value }: { label: string; value: string }) {
  return <Row label={label} value={value} color={C.red} />;
}
function GoldRow({ label, value }: { label: string; value: string }) {
  return <Row label={label} value={value} color={C.amber} />;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 mt-3 flex items-start gap-2.5"
      style={{ background: "#FFFBF0", border: `1px solid ${C.amber}44` }}>
      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.amber }} />
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{children}</p>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 mt-3 flex items-start gap-2.5"
      style={{ background: "#FEF2F2", border: `1px solid ${C.red}44` }}>
      <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.red }} />
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{children}</p>
    </div>
  );
}

function Win({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 mt-3 flex items-start gap-2.5"
      style={{ background: "#EDFAF3", border: `1px solid ${C.mint}` }}>
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
      <p className="text-xs leading-relaxed" style={{ color: "#064E24" }}>{children}</p>
    </div>
  );
}

function ActionPill({ color, label, children }: { color: string; label: string; children: React.ReactNode }) {
  const bg: Record<string, string> = {
    [C.red]: "#FFF5F5", [C.amber]: "#FFFBF0", [C.blue]: "#F0F6FF", [C.green]: "#EDFAF3",
  };
  return (
    <div className="rounded-xl px-4 py-2.5 mt-2 flex items-start gap-2"
      style={{ background: bg[color] ?? "#F9FAFB", border: `1px solid ${color}22` }}>
      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 flex-shrink-0" style={{ color }}>{label}</span>
      <span className="text-xs leading-relaxed" style={{ color: C.dark }}>{children}</span>
    </div>
  );
}

function SectionH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-extrabold mt-14 mb-2"
      style={{ fontFamily: "var(--font-bricolage)", color: C.dark }}>
      {children}
    </h2>
  );
}

function SectionH3({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold mt-6 mb-2 flex items-center gap-2"
      style={{ fontFamily: "var(--font-manrope)", color: C.dark }}>
      {icon}{children}
    </h3>
  );
}

function Divider() {
  return <hr className="my-10" style={{ borderColor: "#E5E7EB" }} />;
}

function Collapse({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden my-3" style={{ border: "1px solid #E5E7EB" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-left transition-colors"
        style={{ background: open ? "#EDFAF3" : "#F9FAFB", color: C.dark }}>
        <span className="flex items-center gap-2">
          {title}
          {badge && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${C.green}18`, color: C.green }}>{badge}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 py-4 text-sm" style={{ color: "#374151" }}>{children}</div>}
    </div>
  );
}

/* Scenario card — the main building block */
function ScenarioCard({
  number, title, subtitle, color, icon: Icon, href, calcLabel, children,
}: {
  number: number; title: string; subtitle: string; color: string;
  icon: React.ElementType; href: string; calcLabel: string; children: React.ReactNode;
}) {
  return (
    <div id={`scenario-${number}`} className="rounded-2xl overflow-hidden scroll-mt-6"
      style={{ border: `1.5px solid ${color}30`, background: C.bg }}>
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-3" style={{ background: `${color}08`, borderBottom: `1px solid ${color}20` }}>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
              Scenario {number}
            </span>
            <Tag color={color}>{calcLabel}</Tag>
          </div>
          <p className="text-base font-bold mt-0.5" style={{ fontFamily: "var(--font-manrope)", color: C.dark }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{subtitle}</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
      <div className="px-5 pb-4">
        <Link href={href}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: color, color: "#fff" }}>
          Open {calcLabel} calculator <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

/* Quick-link pill */
function NavPill({ href, color, children }: { href: string; color: string; children: React.ReactNode }) {
  return (
    <a href={href}
      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all hover:opacity-80 active:scale-[0.97]"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
      {children} <ChevronRight size={11} />
    </a>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────── */
export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <div style={{ background: C.dark }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-12">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Tag color={C.mint}>Platform Guide</Tag>
            <Tag color={C.amber}>FY 2025-26</Tag>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-bricolage)", color: "#FFFFFC" }}>
            How to get the most out of Valura
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Six calculators. One AI advisor. Real tax rules. No guesswork.
            This guide walks through exactly when to use each tool, with real rupee examples
            so you leave every session knowing exactly what to do next.
          </p>

          {/* Quick nav */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { href: "#scenario-1", label: "TCS & LRS",    color: C.green  },
              { href: "#scenario-2", label: "Capital Gains", color: C.dark  },
              { href: "#scenario-3", label: "DTAA / FTC",   color: C.amber  },
              { href: "#scenario-4", label: "Net Returns",   color: C.blue   },
              { href: "#scenario-5", label: "Estate Tax",    color: C.red    },
              { href: "#scenario-6", label: "NRI Status",    color: "#6B7280"},
            ].map((n) => (
              <a key={n.href} href={n.href}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {n.label} <ChevronRight size={11} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MENTAL MODEL — one paragraph
      ════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
        <div className="rounded-2xl p-5 sm:p-6" style={{ background: "#F0FAF4", border: `1px solid ${C.mint}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" style={{ color: C.green }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.green }}>Start here</p>
          </div>
          <p className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-manrope)", color: C.dark }}>
            Three types of tax drag eat your returns as an Indian HNI investing globally.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: "①", label: "Upfront cash lock", desc: "20% TCS deducted the moment you remit. Calculator 1.", color: C.red },
              { num: "②", label: "Return tax leak", desc: "STCG vs LTCG spreads up to 28 percentage points. Calculators 2 & 4.", color: C.amber },
              { num: "③", label: "Structural risk", desc: "US estate tax up to 40% on death if you hold directly. Calculator 5.", color: C.blue },
            ].map((i) => (
              <div key={i.num} className="rounded-xl px-3.5 py-3" style={{ background: "#fff", border: `1px solid ${C.mint}` }}>
                <span className="text-lg font-black" style={{ color: i.color }}>{i.num}</span>
                <p className="text-xs font-bold mt-0.5" style={{ color: C.dark }}>{i.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>{i.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "#374151" }}>
            Valura eliminates or reduces all three simultaneously. Use these calculators to
            <strong> quantify each drag in rupees</strong>, then open an account to apply the fix.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          SCENARIOS
      ════════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 mt-10 space-y-6 pb-16">

        {/* ── Scenario 1: LRS & TCS ── */}
        <ScenarioCard
          number={1}
          title="I want to invest ₹50L abroad. How much TCS will I pay — and how do I cut it?"
          subtitle="Use this whenever you're about to remit money overseas for investment."
          color={C.green}
          icon={BadgePercent}
          href="/calculators/lrs-tcs"
          calcLabel="LRS & TCS"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            India's bank deducts <strong>20% TCS on every rupee above ₹10L per PAN per financial year</strong>.
            You get it back via ITR — but the money is locked for 7–18 months.
            The real cost isn't just the TCS; it's the <em>return you could have earned</em> on that locked cash.
          </p>

          {/* Step-by-step */}
          <SectionH3 icon={<BookOpen size={13} style={{ color: C.green }} />}>
            What to enter — step by step
          </SectionH3>
          <ol className="space-y-2">
            {[
              ["How much to invest this FY?", "₹50L — type it or use the slider"],
              ["Already remitted?", "₹0 if this is your first remittance of the year"],
              ["Purpose?", "Investment (20% TCS). Education via 80E loan = 0% TCS."],
              ["Current month?", "Determines how long TCS is locked before you get it back"],
              ["Do you pay advance tax?", "Switch YES — this is the most important toggle on the page"],
              ["Family members?", "Add your spouse and adult children — each gets their own ₹10L threshold"],
            ].map(([q, a], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                  style={{ background: C.dark, color: "#fff" }}>{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: C.dark }}>{q}</p>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>{a}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Example A */}
          <Collapse title="Example A — Solo investor, ₹50L in January" badge="Worked example">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Inputs</p>
                <Row label="Investment amount" value="₹50L" />
                <Row label="Already remitted" value="₹0" />
                <Row label="Purpose" value="Investment" />
                <Row label="Month" value="January" />
                <Row label="Advance tax?" value="No" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">What the calculator shows</p>
                <GreenRow label="TCS-free portion (threshold)" value="₹10L" />
                <RedRow  label="TCS-liable portion" value="₹40L" />
                <RedRow  label="TCS deducted (20%)" value="₹8L" />
                <Row     label="Net reaching GIFT City" value="₹42L" />
                <RedRow  label="Opportunity cost (9 months, 12% return)" value="₹72,000 lost" />
              </div>
            </div>
            <Warn>Without advance tax, ₹8L is locked from January until ~September. That's ₹72K in return drag on top of the TCS itself.</Warn>
          </Collapse>

          {/* Example B */}
          <Collapse title="Example B — Same investor, advance tax toggle ON" badge="Big difference">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Only one thing changes</p>
                <Row label="Advance tax?" value="YES" color={C.green} />
                <Row label="Next installment" value="March 15" />
                <Row label="Lock-up period" value="1.5 months (not 9)" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">New opportunity cost</p>
                <GreenRow label="New opportunity cost (1.5 months)" value="₹12,000" />
                <GreenRow label="Saving vs no advance tax" value="₹60,000 saved" />
              </div>
            </div>
            <Win>The TCS appears in Form 26AS Part F — just reduce your March 15 advance tax payment by the TCS amount. No paperwork, no application. Free ₹60K saving.</Win>
          </Collapse>

          {/* Example C — Family */}
          <Collapse title="Example C — Sharma family routes ₹30L, zero TCS" badge="Best case">
            <p className="text-xs text-gray-500 mb-3">Three adults: Arvind, Priya, their son Rohan — all with ₹0 remitted so far this FY.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[340px]">
                <thead><tr style={{ background: "#F9FAFB" }}>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Member</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">Route ₹</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">TCS-free</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">TCS paid</th>
                </tr></thead>
                <tbody>
                  {[
                    { name: "Arvind", route: "₹10L", free: "₹10L", tcs: "₹0" },
                    { name: "Priya",  route: "₹10L", free: "₹10L", tcs: "₹0" },
                    { name: "Rohan",  route: "₹10L", free: "₹10L", tcs: "₹0" },
                  ].map((r) => (
                    <tr key={r.name} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-3 py-2 font-medium" style={{ color: C.dark }}>{r.name}</td>
                      <td className="px-3 py-2 text-right">{r.route}</td>
                      <td className="px-3 py-2 text-right font-semibold" style={{ color: C.green }}>{r.free}</td>
                      <td className="px-3 py-2 text-right font-semibold" style={{ color: C.green }}>{r.tcs}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#EDFAF3", borderTop: `2px solid ${C.mint}` }}>
                    <td className="px-3 py-2 font-bold" style={{ color: C.dark }}>Total</td>
                    <td className="px-3 py-2 text-right font-bold">₹30L</td>
                    <td className="px-3 py-2 text-right font-bold" style={{ color: C.green }}>₹30L free</td>
                    <td className="px-3 py-2 text-right font-bold" style={{ color: C.green }}>₹0 TCS</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Win>By distributing ₹10L each across 3 PANs, the family invests ₹30L with <strong>zero TCS</strong>. The same amount as a solo investor would trigger ₹4L in TCS.</Win>
          </Collapse>

          <Tip>Use the AI drawer (green button at the bottom of the calculator) to ask "Should I split this across family members?" — it reads your exact numbers and tells you the optimal split.</Tip>
        </ScenarioCard>

        {/* ── Scenario 2: Capital Gains ── */}
        <ScenarioCard
          number={2}
          title="I want to sell a position. Should I sell now or wait? What's the exact tax?"
          subtitle="Use before selling any equity position — the timing can save lakhs."
          color={C.dark}
          icon={Calculator}
          href="/calculators/capital-gains"
          calcLabel="Capital Gains"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            India draws a sharp line at <strong>730 days (24 months)</strong>. Hold longer: 12.5% flat LTCG,
            surcharge capped at 15%, effective max <strong>14.95%</strong>. Sell before: slab rate up to 30%,
            surcharge uncapped, effective max <strong>42.74%</strong> for income above ₹5 Cr.
            That's a <strong>28 percentage point spread</strong> — the single biggest legal tax saving available.
          </p>

          <SectionH3 icon={<BookOpen size={13} />}>What to enter</SectionH3>
          <ol className="space-y-2">
            {[
              ["Purchase & sale price", "Enter in INR or USD — if USD, set the exchange rate (default ₹84.50)"],
              ["Holding period", "Years + months, or drag the slider. Watch the STCG/LTCG badge update live."],
              ["Number of units", "Total shares or units you're selling"],
              ["Annual income (excluding this gain)", "This sets your slab rate for STCG calculation"],
              ["Tax regime", "New Regime FY 2025-26 or Old Regime"],
              ["Carry-forward losses?", "Toggle Yes and enter your STCL / LTCL amounts to see offset benefit"],
            ].map(([q, a], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                  style={{ background: C.dark, color: "#fff" }}>{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: C.dark }}>{q}</p>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>{a}</p>
                </div>
              </li>
            ))}
          </ol>

          <Collapse title="Example A — Priya has held a US fund for 22 months. Sell now or wait?" badge="Most common question">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Position</p>
                <Row label="Buy price (USD)" value="$180" />
                <Row label="Current price (USD)" value="$260" />
                <Row label="Units" value="1,000" />
                <Row label="Gain" value="₹66.8L" />
                <Row label="Holding" value="22 months (STCG)" color={C.red} />
                <Row label="Income bracket" value="Above ₹5 Cr" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sell now vs wait 2 months</p>
                <RedRow  label="STCG tax if sell today (42.74%)" value="₹28.55L" />
                <GreenRow label="LTCG tax if wait 2 months (14.95%)" value="₹9.98L" />
                <GreenRow label="Tax saved by waiting" value="₹18.57L" />
              </div>
            </div>
            <Win>Waiting just 2 more months saves ₹18.57L in tax. The calculator shows a live countdown: "You are 60 days from LTCG" with a red-to-green timeline bar.</Win>
            <Tip>The calculator automatically shows "The Waiting Game" card whenever your holding is short-term — with the exact date LTCG kicks in and the rupee saving.</Tip>
          </Collapse>

          <Collapse title="Example B — Using carry-forward losses to offset a gain" badge="ITR trick">
            <p className="text-xs text-gray-500 mb-3">Vikram has a ₹20L STCG gain and ₹15L in STCL carry-forward losses from previous years.</p>
            <Row label="Gross STCG gain" value="₹20L" />
            <GreenRow label="STCL carry-forward offset" value="−₹15L" />
            <GreenRow label="Net taxable STCG" value="₹5L" />
            <Row label="Tax on ₹5L (vs ₹20L)" value="₹1.8L saved" color={C.green} />
            <Tip>Toggle "Do you have carry-forward losses?" to Yes. Enter your STCL and LTCL amounts from your last ITR (Schedule CFL). The calculator nets them automatically.</Tip>
          </Collapse>

          <Tip>Rate table at the bottom shows every income bracket — STCG rate, LTCG rate, the spread, and "TLH value per ₹1L." Knowing your spread tells you exactly how much each ₹1L of harvested loss is worth.</Tip>
        </ScenarioCard>

        {/* ── Scenario 3: DTAA ── */}
        <ScenarioCard
          number={3}
          title="I received dividends from US stocks. Am I paying tax twice?"
          subtitle="For Resident Indians with foreign investment income — Form 67 FTC."
          color={C.amber}
          icon={Map}
          href="/calculators/dtaa"
          calcLabel="DTAA / FTC"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            If you're a <strong>Resident Indian</strong>, India taxes your worldwide income.
            But when you receive dividends from US stocks, the US already deducted 25% withholding tax before
            paying you. Without action, you pay 25% to the US <em>and</em> your slab rate to India.
            <strong> Form 67 lets you credit the US WHT against your Indian tax liability</strong> — so you only pay the higher of the two, never both stacked.
          </p>

          <div className="rounded-xl p-3 mt-3" style={{ background: "#FFFBF0", border: `1px solid ${C.amber}44` }}>
            <p className="text-xs font-bold mb-2" style={{ color: C.dark }}>Who this calculator is primarily for:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg px-3 py-2" style={{ background: "#EDFAF3", border: `1px solid ${C.mint}` }}>
                <p className="text-xs font-bold" style={{ color: C.green }}>✓ Resident Indian — main use case</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#374151" }}>Foreign dividends, capital gains. FTC via Form 67.</p>
              </div>
              <div className="rounded-lg px-3 py-2" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <p className="text-xs font-bold" style={{ color: "#9CA3AF" }}>~ NRI via GIFT City — limited use</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>India barely taxes NRIs. DTAA largely irrelevant. See NRI explainer inside.</p>
              </div>
            </div>
          </div>

          <Collapse title="Example — Ananya receives $10,000 in US dividends, income above ₹15L slab" badge="Worked example">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Without FTC (double taxation)</p>
                <RedRow label="US WHT (25% of ₹8.45L)" value="₹2.11L" />
                <RedRow label="Indian slab tax (30% of ₹8.45L)" value="₹2.54L" />
                <RedRow label="Total tax paid" value="₹4.65L" />
                <RedRow label="Effective rate" value="55%" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">With FTC via Form 67</p>
                <Row    label="US WHT deducted (25%)" value="₹2.11L" />
                <Row    label="Indian slab tax (30%)" value="₹2.54L" />
                <GreenRow label="Less: FTC = min(WHT, Indian tax)" value="−₹2.11L" />
                <GreenRow label="Total actually paid" value="₹2.54L" />
                <GreenRow label="FTC saves" value="₹2.11L" />
              </div>
            </div>
            <Win>Ananya pays just ₹2.54L instead of ₹4.65L — saving ₹2.11L by filing Form 67. The rule: you pay the <strong>higher of US WHT or Indian slab tax</strong>, never both.</Win>
          </Collapse>

          <ActionPill color={C.red} label="Deadline">
            File Form 67 by <strong>March 31 of the Assessment Year</strong>. Missing it means permanently losing the foreign tax credit — it cannot be claimed in future years.
          </ActionPill>

          <Tip>The GIFT City explainer inside the calculator shows why NRIs investing via IFSC often don't need DTAA at all — GIFT City fund income is already exempt from Indian tax at source.</Tip>
        </ScenarioCard>

        {/* ── Scenario 4: Net Returns ── */}
        <ScenarioCard
          number={4}
          title="Is it actually better to invest via Valura vs directly through IBKR or Vested?"
          subtitle="The definitive side-by-side comparison of after-tax wealth over time."
          color={C.blue}
          icon={TrendingUp}
          href="/calculators/net-returns"
          calcLabel="Net Returns"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            Direct investment platforms (IBKR, Vested, INDmoney) are fine products — but they
            expose you to 20% TCS upfront, 25% US dividend WHT (vs ~15% via Ireland UCITS route),
            and up to 40% US estate tax on death. Capital gains tax is <strong>identical</strong> either way.
            This calculator shows the full compounded wealth difference over your investment horizon.
          </p>

          <SectionH3 icon={<BookOpen size={13} style={{ color: C.blue }} />}>Key inputs to set</SectionH3>
          <ol className="space-y-2">
            {[
              ["Initial investment", "Use ₹ or USD. Try ₹1 Cr to start."],
              ["Investment horizon", "Use at least 10 years — the compounding gap is dramatic after year 5."],
              ["Expected annual return", "Default 12%. Lower it to 8% for a conservative view."],
              ["Dividend yield", "Default 2%. Index funds typically yield 1.5–2%."],
              ["Holding strategy", "Long Term LTCG is most realistic for most HNIs."],
              ["Income above ₹5 Cr?", "Toggle ON — STCG surcharge is uncapped, making the gap much larger."],
              ["Family members for LRS", "Higher count = more TCS-free capacity in Route B."],
            ].map(([q, a], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                  style={{ background: C.blue, color: "#fff" }}>{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: C.dark }}>{q}</p>
                  <p className="text-[11px]" style={{ color: "#6B7280" }}>{a}</p>
                </div>
              </li>
            ))}
          </ol>

          <Collapse title="Example — ₹1 Cr invested for 15 years, LTCG, income above ₹5 Cr" badge="Worked example">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[360px]">
                <thead><tr style={{ background: C.dark }}>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: C.mint }}>Year</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: C.mint }}>Route A (Direct)</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: C.mint }}>Route B (Valura)</th>
                  <th className="px-3 py-2 text-right font-semibold" style={{ color: C.mint }}>Advantage</th>
                </tr></thead>
                <tbody>
                  {[
                    ["Year 1",  "₹93L",   "₹98L",   "+₹5L"],
                    ["Year 5",  "₹1.4Cr", "₹1.6Cr", "+₹20L"],
                    ["Year 10", "₹2.1Cr", "₹2.6Cr", "+₹50L"],
                    ["Year 15", "₹3.2Cr", "₹4.1Cr", "+₹90L"],
                  ].map(([yr, a, b, adv]) => (
                    <tr key={yr} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-3 py-2 font-medium" style={{ color: C.dark }}>{yr}</td>
                      <td className="px-3 py-2 text-right" style={{ color: C.red }}>{a}</td>
                      <td className="px-3 py-2 text-right" style={{ color: C.green }}>{b}</td>
                      <td className="px-3 py-2 text-right font-bold" style={{ color: C.green }}>{adv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Win>The difference at Year 1 looks small (₹5L). By Year 15 it's ₹90L — the gap compounds because Route B never lost that initial TCS to begin with.</Win>
          </Collapse>

          <Tip>Expand "Advanced" settings to set your INR depreciation assumption and estate tax probability weighting. At 100%, the comparison is fully conservative. Lower it only if you plan to convert back to non-US assets before passing them on.</Tip>
        </ScenarioCard>

        {/* ── Scenario 5: Estate Tax ── */}
        <ScenarioCard
          number={5}
          title="My family could lose 40% of my US stock portfolio to the IRS when I die. Is that real?"
          subtitle="The most emotionally important calculator. Run it once. Act on the result."
          color={C.red}
          icon={Shield}
          href="/calculators/estate-tax"
          calcLabel="Estate Tax"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            Yes, it's real and almost no one talks about it. The IRS classifies Indian investors
            who hold US stocks directly as <strong>Non-Resident Aliens (NRAs)</strong>. On death,
            their US-situs assets (US stocks, US ETFs) attract estate tax with only a <strong>$60,000 exemption</strong>.
            Above that, rates go up to 40%. India has no estate tax. The entire problem is from the US side.
          </p>

          <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.red}30` }}>
            <div className="px-4 py-2" style={{ background: `${C.red}10` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.red }}>US Estate Tax Brackets (Non-Resident Alien)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[300px]">
                <thead><tr style={{ background: "#F9FAFB" }}>
                  <th className="px-3 py-2 text-left text-gray-400 font-semibold">Portfolio value</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">IRS takes</th>
                  <th className="px-3 py-2 text-right text-gray-400 font-semibold">Your family gets</th>
                </tr></thead>
                <tbody>
                  {[
                    ["$50K (below exemption)", "$0", "100%"],
                    ["$200K", "~$28K", "86%"],
                    ["$500K", "~$130K", "74%"],
                    ["$1M", "~$330K", "67%"],
                    ["$2M", "~$730K", "64%"],
                  ].map(([v, t, f]) => (
                    <tr key={v} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                      <td className="px-3 py-2" style={{ color: C.dark }}>{v}</td>
                      <td className="px-3 py-2 text-right font-bold" style={{ color: C.red }}>{t}</td>
                      <td className="px-3 py-2 text-right" style={{ color: "#374151" }}>{f}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <SectionH3>How to use the calculator</SectionH3>
          <p className="text-xs" style={{ color: "#374151" }}>
            Enter your <strong>total US stock and ETF holdings in USD</strong> — use the slider or type the amount.
            Set the exchange rate. The calculator instantly shows bracket-by-bracket IRS tax vs $0 via Valura GIFT City,
            with an INR-equivalent of what your family would lose.
          </p>

          <Collapse title="Example — Mehta family has $300K in US stocks held directly" badge="Worked example">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Direct Investment</p>
                <RedRow label="Exemption (first $60K)" value="$0 tax" />
                <RedRow label="Taxable amount ($240K)" value="$70,600 IRS tax" />
                <RedRow label="Effective estate tax rate" value="23.5%" />
                <RedRow label="Family receives" value="$229,400 (₹1.9 Cr less)" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Via Valura GIFT City</p>
                <GreenRow label="IRS estate tax" value="$0" />
                <GreenRow label="Effective rate" value="0%" />
                <GreenRow label="Family receives" value="100% of $300K" />
                <Row      label="Reason" value="IFSC units = Indian assets" />
              </div>
            </div>
            <Win>The Mehta family's estate saves $70,600 (₹59L at ₹84.50) by simply holding through Valura GIFT City instead of directly. The investment return is identical — the structure is everything.</Win>
          </Collapse>

          <ActionPill color={C.red} label="Why it matters more over time">
            US stocks at 12% CAGR double every 6 years. A $300K portfolio becomes $1.2M in 12 years.
            At $1.2M the estate tax is ~$450K. The longer you wait to restructure, the higher the exposure.
          </ActionPill>
        </ScenarioCard>

        {/* ── Scenario 6: NRI Status ── */}
        <ScenarioCard
          number={6}
          title="I'm not sure if I'm NRI, RNOR, or ROR this year. How does it affect my tax?"
          subtitle="Run this before filing ITR. Your residency status changes every year."
          color="#6B7280"
          icon={UserCheck}
          href="/calculators/nri-status"
          calcLabel="NRI Status"
        >
          <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
            India taxes you based on <strong>how many days you spent in India</strong>, not just your passport.
            The rules under Section 6 of the Income Tax Act create three possible statuses each year,
            with very different tax treatment for global income. Getting it wrong means either
            overpaying tax or under-declaring foreign income.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {[
              { s: "NRI",  col: C.green, bg: "#EDFAF3", border: C.mint, desc: "Only Indian income taxable. Foreign income fully exempt. No LRS limit on investing abroad." },
              { s: "RNOR", col: C.amber, bg: "#FFFBF0", border: "#E8C97A", desc: "Golden window. Foreign income NOT taxable in India. Typically lasts 2–3 years after returning." },
              { s: "ROR",  col: C.blue,  bg: "#EFF4FF", border: "#C7D7F8", desc: "Worldwide income taxable. GIFT City = foreign asset. Schedule FA mandatory." },
            ].map((s) => (
              <div key={s.s} className="rounded-xl p-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: s.col }}>{s.s}</p>
                <p className="text-[10px] mt-1 leading-relaxed" style={{ color: "#374151" }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <Collapse title="Example — Kavitha returns to India after 10 years in Singapore" badge="RNOR golden window">
            <Row label="Days in India FY 2025-26" value="350 days" />
            <Row label="Resident test result" value="YES — 350 ≥ 182 days" />
            <Row label="NRI years in last 10 FYs" value="9 years" color={C.green} />
            <GoldRow label="RNOR Test A result" value="RNOR — 9/10 years as NRI" />
            <GreenRow label="Singapore savings taxable in India?" value="NO — RNOR window" />
            <GreenRow label="Global dividends taxable in India?" value="NO — RNOR window" />
            <Tip>Kavitha should front-load all global investments during her RNOR window (typically 2 years). Gains realised while RNOR are tax-free in India. Once she becomes ROR, all future gains on foreign holdings are taxable at slab rates.</Tip>
          </Collapse>

          <Collapse title="Example — Suresh in Dubai visits India frequently. When does he become Resident?" badge="182-day watch">
            <Row label="Days in India FY 2025-26 so far" value="155 days" color={C.amber} />
            <Row label="Progress bar" value="85% of 182-day threshold" color={C.red} />
            <Row label="Days remaining before Resident" value="27 days" color={C.red} />
            <Win>The calculator shows a red progress bar above 150 days. Suresh knows to leave India by the time he hits 182 days — or he becomes Resident and his foreign income is taxable.</Win>
          </Collapse>
        </ScenarioCard>

        <Divider />

        {/* ════════════════════════════════════════════
            AI ADVISOR GUIDE
        ════════════════════════════════════════════ */}
        <SectionH2>Leveraging the AI Advisor</SectionH2>
        <p className="text-sm text-gray-500 -mt-1">The most powerful feature on the platform. Most users don't use it to its full potential.</p>

        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.green}30` }}>
          <div className="px-5 py-4" style={{ background: C.dark }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4" style={{ color: C.mint }} />
              <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                The AI knows your portfolio, the tax rules, and today's date
              </p>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              It calls real calculation tools — not guesswork. Every number it gives you is computed from the same logic as the calculators.
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">

            {/* Two modes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-3.5" style={{ background: "#F0FAF4", border: `1px solid ${C.mint}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={13} style={{ color: C.green }} />
                  <p className="text-xs font-bold" style={{ color: C.dark }}>Mode 1: Calculator drawer</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#374151" }}>
                  Click the green <strong>"Ask AI about this result →"</strong> button at the bottom of any calculator.
                  The AI already knows your exact inputs and outputs — start asking without re-explaining anything.
                </p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: "#F0F6FF", border: "1px solid #C7D7F8" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} style={{ color: C.blue }} />
                  <p className="text-xs font-bold" style={{ color: C.dark }}>Mode 2: Full chat at /chat</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "#374151" }}>
                  Open-ended, multi-step. Ask anything. The AI calls tools, runs audits,
                  and returns ranked action plans. Best for big-picture questions.
                </p>
              </div>
            </div>

            {/* Best prompts */}
            <SectionH3 icon={<Zap size={13} style={{ color: C.amber }} />}>
              Best prompts to use right now (FY end is near)
            </SectionH3>
            <div className="space-y-2">
              {[
                {
                  prompt: "Audit my full tax position for FY 2025-26",
                  what: "Runs the TLH scan, portfolio summary, and capital gains for every holding simultaneously. Returns a ranked action table sorted by rupee impact.",
                  color: C.red,
                  label: "Full audit",
                },
                {
                  prompt: "I have 15 days left in the FY — what should I do urgently?",
                  what: "Calls get_fy_countdown + run_tlh_scan + run_fy_audit. Returns a TODAY / THIS WEEK / BEFORE MARCH 31 action plan with exact deadlines.",
                  color: C.amber,
                  label: "FY urgency",
                },
                {
                  prompt: "Should I sell my TATA-SP500 loss position now or wait?",
                  what: "Calls compare_scenarios for that holding — shows tax if sold today vs tax after LTCG threshold, with rupee difference and clear recommendation.",
                  color: C.blue,
                  label: "Hold vs sell",
                },
                {
                  prompt: "Build my Schedule FA data for GIFT City holdings",
                  what: "Reads from your portfolio and returns a pre-filled Schedule FA draft with all fields needed for ITR-2 or ITR-3.",
                  color: C.green,
                  label: "ITR prep",
                },
                {
                  prompt: "Optimize my LRS remittance across family before March 31",
                  what: "Calls get_fy_countdown then optimize_family_tcs — tells you exactly how much to route through each PAN to hit zero TCS.",
                  color: C.green,
                  label: "LRS optimize",
                },
              ].map((p) => (
                <div key={p.prompt} className="rounded-xl p-3.5" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-start gap-2">
                    <Tag color={p.color}>{p.label}</Tag>
                    <p className="text-xs font-semibold flex-1" style={{ color: C.dark, fontFamily: "var(--font-manrope)" }}>
                      "{p.prompt}"
                    </p>
                  </div>
                  <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "#6B7280" }}>
                    <span className="font-semibold" style={{ color: "#374151" }}>What happens: </span>{p.what}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* ════════════════════════════════════════════
            FY 2025-26 CHEATSHEET
        ════════════════════════════════════════════ */}
        <SectionH2>FY 2025-26 Tax Cheatsheet</SectionH2>
        <p className="text-sm text-gray-500 -mt-1">Hard-coded into every calculator. Keep this handy.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

          {/* TCS */}
          <div className="rounded-2xl p-4" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.green }}>LRS & TCS</p>
            <Row label="TCS threshold per PAN/FY" value="₹10 Lakh" />
            <Row label="TCS rate (investments)" value="20%" color={C.red} />
            <Row label="TCS rate (education — self-funded)" value="5%" color={C.amber} />
            <Row label="TCS rate (education — 80E loan)" value="0%" color={C.green} />
            <Row label="Max LRS per adult/FY" value="$250,000" />
            <Row label="Advance tax dates" value="Jun 15 / Sep 15 / Dec 15 / Mar 15" />
          </div>

          {/* Capital Gains */}
          <div className="rounded-2xl p-4" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.dark }}>Capital Gains</p>
            <Row label="LTCG threshold" value="730 days (24 months)" />
            <Row label="LTCG rate (Section 112)" value="12.5% flat" color={C.green} />
            <Row label="LTCG surcharge cap" value="15% (HNI advantage)" color={C.green} />
            <Row label="LTCG effective max" value="14.95%" color={C.green} />
            <Row label="STCG rate (slab, income >₹5 Cr)" value="Up to 30%+surcharge" color={C.red} />
            <Row label="STCG effective max (old regime)" value="42.74%" color={C.red} />
            <Row label="Loss carry-forward" value="8 assessment years" />
          </div>

          {/* DTAA */}
          <div className="rounded-2xl p-4" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.amber }}>Foreign WHT on Dividends (India-sourced)</p>
            <Row label="USA" value="25% WHT" color={C.red} />
            <Row label="UK" value="20% WHT" color={C.amber} />
            <Row label="Singapore / Mauritius" value="0% WHT" color={C.green} />
            <Row label="Germany" value="26.375% WHT" color={C.red} />
            <Row label="Netherlands / Japan" value="15% WHT" />
            <Row label="Ireland UCITS ETF route" value="~15% WHT (vs 25% direct US)" color={C.green} />
          </div>

          {/* GIFT City exemptions */}
          <div className="rounded-2xl p-4" style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.blue }}>GIFT City Exemptions (NRI)</p>
            <Row label="Cat III AIF gains/income" value="0% — Section 10(23FBC)" color={C.green} />
            <Row label="GIFT City bond interest (NRI)" value="0% — Section 10(15)(ix)" color={C.green} />
            <Row label="GIFT City bond interest (Resident)" value="Slab rate — NOT exempt" color={C.red} />
            <Row label="US Estate Tax via IFSC units" value="$0 — not US-situs" color={C.green} />
            <Row label="Schedule FA (Resident Indian)" value="Mandatory — ₹10L penalty" color={C.red} />
            <Row label="Form 67 FTC deadline" value="March 31 of AY" color={C.amber} />
          </div>
        </div>

        {/* New Tax Regime slabs */}
        <div className="rounded-2xl overflow-hidden mt-4" style={{ border: "1px solid #E5E7EB" }}>
          <div className="px-4 py-3" style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.dark }}>New Tax Regime Slabs — FY 2025-26</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead><tr style={{ background: C.dark }}>
                {["Income Slab", "Rate", "STCG if this is your bracket", "LTCG (everyone)"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: C.mint }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  ["Up to ₹3L",       "0%",  "0% base STCG",        "12.5% + surcharge"],
                  ["₹3L – ₹7L",      "5%",  "5% base STCG",        "12.5% + surcharge"],
                  ["₹7L – ₹10L",     "10%", "10% base STCG",       "12.5% + surcharge"],
                  ["₹10L – ₹12L",    "15%", "15% base STCG",       "12.5% + surcharge"],
                  ["₹12L – ₹15L",    "20%", "20% base STCG",       "12.5% + surcharge"],
                  ["Above ₹15L",      "30%", "Up to 42.74% (>₹5Cr)", "14.95% max (capped)"],
                ].map(([slab, rate, stcg, ltcg]) => (
                  <tr key={slab} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-3 py-2" style={{ color: C.dark }}>{slab}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: C.dark }}>{rate}</td>
                    <td className="px-3 py-2" style={{ color: C.red }}>{stcg}</td>
                    <td className="px-3 py-2" style={{ color: C.green }}>{ltcg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Divider />

        {/* ════════════════════════════════════════════
            FY END ACTION PLAN
        ════════════════════════════════════════════ */}
        <SectionH2>Before March 31 — Your 4-step action plan</SectionH2>
        <p className="text-sm text-gray-500 -mt-1">The financial year ends on March 31. These four actions can collectively save lakhs.</p>

        <div className="space-y-3 mt-4">
          {[
            {
              step: "1", color: C.red, label: "TODAY",
              title: "Harvest your losses",
              detail: "Go to the TLH Engine. The proactive banner shows your total harvestable losses. Sell the loss positions and immediately rebuy — India has no wash-sale rule. This books the losses for carry-forward, reducing your taxable gains this FY and for 8 years.",
              link: "/tlh", cta: "Open TLH Engine →",
            },
            {
              step: "2", color: C.amber, label: "THIS WEEK",
              title: "Check your LTCG cliffs",
              detail: "Open Capital Gains calculator. If any position is within 60 days of the 730-day threshold and currently at a gain, model the sell-now vs wait decision. The savings can be enormous — the example above showed ₹18.57L saved by waiting just 2 months.",
              link: "/calculators/capital-gains", cta: "Open Capital Gains →",
            },
            {
              step: "3", color: C.blue, label: "BEFORE MARCH 15",
              title: "Offset TCS against advance tax",
              detail: "If you've made LRS remittances this FY, your TCS appears in Form 26AS Part F. When paying your March 15 advance tax installment (100% of annual tax), reduce your payment by the TCS amount. No application needed — it's automatic.",
              link: "/calculators/lrs-tcs", cta: "Calculate your offset →",
            },
            {
              step: "4", color: C.green, label: "BEFORE MARCH 31",
              title: "Prepare Schedule FA and Form 67",
              detail: "If you're a Resident Indian with GIFT City investments, Schedule FA is mandatory. If you received foreign dividends, Form 67 is needed to claim FTC. Ask the AI to build your Schedule FA draft — takes 30 seconds.",
              link: "/chat", cta: "Build Schedule FA with AI →",
            },
          ].map((a) => (
            <div key={a.step} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${a.color}25` }}>
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background: a.color, color: "#fff" }}>
                  {a.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: a.color }}>{a.label}</span>
                    <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: C.dark }}>{a.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{a.detail}</p>
                  <Link href={a.link}
                    className="inline-flex items-center gap-1 text-xs font-bold mt-2 transition-opacity hover:opacity-75"
                    style={{ color: a.color }}>
                    {a.cta} <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] mt-10 text-center leading-relaxed" style={{ color: "#9CA3AF" }}>
          All figures are illustrative based on Finance Act 2025, FY 2025-26. Tax rules, rates, and exemptions may change.
          Consult a qualified CA before making investment or tax decisions. Valura is not a tax advisor.
        </p>

      </div>
    </div>
  );
}
