"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgePercent, Calculator, Map, ChevronRight, ChevronDown,
  CheckCircle2, AlertCircle, ArrowRight, BookOpen,
  Lightbulb, Clock, Users, TrendingDown, FileText,
  TriangleAlert, Zap,
} from "lucide-react";

/* ── Helpers ── */
const INR_L = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(0)} L`;

/* ── Section types ── */
type CalcKey = "lrs" | "cg" | "dtaa";

const CALCULATORS: { key: CalcKey; icon: React.ElementType; label: string; href: string; color: string; tagline: string }[] = [
  { key: "lrs",  icon: BadgePercent, label: "LRS & TCS",      href: "/calculators/lrs-tcs",      color: "#05A049", tagline: "Minimize the upfront cash cost of overseas remittances" },
  { key: "cg",   icon: Calculator,   label: "Capital Gains",  href: "/calculators/capital-gains", color: "#00111B", tagline: "Model STCG vs LTCG and find the exact break-even day" },
  { key: "dtaa", icon: Map,          label: "DTAA",           href: "/calculators/dtaa",          color: "#B8913A", tagline: "Eliminate double taxation for NRIs and Resident Indians" },
];

/* ── Reusable components ── */
function Tag({ children, color = "#05A049" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: `${color}18`, color }}>
      {children}
    </span>
  );
}

function ExampleBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden my-4" style={{ border: "1px solid #B4E3C8" }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#F0FAF5" }}>
        <Zap className="h-4 w-4 flex-shrink-0" style={{ color: "#05A049" }} />
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>{title}</p>
      </div>
      <div className="px-5 py-4 text-sm space-y-2" style={{ color: "#374151" }}>{children}</div>
    </div>
  );
}

function CalcLine({ label, value, variant = "neutral" }: { label: string; value: string; variant?: "green" | "red" | "gold" | "neutral" }) {
  const c = { green: "#05A049", red: "#DC2626", gold: "#B8913A", neutral: "#374151" }[variant];
  return (
    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "#F3F4F6" }}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-bold" style={{ color: c }}>{value}</span>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 my-3 flex items-start gap-2.5"
      style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{children}</p>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-3 my-3 flex items-start gap-2.5"
      style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
      <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{children}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold mt-8 mb-3 flex items-center gap-2"
      style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
      {children}
    </h3>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 my-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3 text-xs" style={{ color: "#374151" }}>
          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
            style={{ background: "#00111B", color: "#fff" }}>{i + 1}</span>
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden my-3" style={{ border: "1px solid #E5E7EB" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left transition-colors"
        style={{ background: open ? "#F0FAF5" : "#F9FAFB", color: "#00111B" }}>
        {title}
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 py-4 text-sm" style={{ color: "#374151" }}>{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALCULATOR CONTENT
═══════════════════════════════════════════════════════════ */

function LRSContent() {
  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-600">
        Every rupee you remit overseas above ₹10 lakh per PAN per financial year triggers a <strong>20% Tax Collected at Source (TCS)</strong> on investments. The bank deducts it upfront — you get it back via ITR, but your money is locked for 7–18 months. This calculator shows you the real cost and how to minimize it.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "TCS threshold per PAN/FY", value: "₹10 Lakh", color: "#05A049" },
          { label: "TCS rate on investments", value: "20%", color: "#DC2626" },
          { label: "Max USD remittance / adult / FY", value: "$250,000", color: "#00111B" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl px-4 py-3 text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p className="text-[10px] text-gray-400 mb-1">{k.label}</p>
            <p className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── How to use ── */}
      <SectionHeader><BookOpen className="h-4 w-4" style={{ color: "#05A049" }} /> How to use the calculator</SectionHeader>
      <StepList steps={[
        "Enter how much you want to remit this financial year — use the slider (₹1L to ₹5 Cr) or type directly in the text box in Lakhs.",
        "Enter how much you have already remitted this FY from this PAN. If this is your first remittance, leave it at ₹0.",
        "Select the purpose — Investment, Education (self-funded), Medical, or Education via 80E loan. The TCS rate changes accordingly.",
        "Select the current month. This determines how long TCS will be locked before you get it back via ITR.",
        "Toggle 'Do you pay advance tax?' — if Yes, the lock-up collapses dramatically from months to weeks.",
        "Optionally expand 'Add family members' to route remittances through your spouse or adult children, each with their own ₹10L threshold.",
      ]} />

      {/* ── Example 1 ── */}
      <SectionHeader>Example 1 — Solo investor, large remittance</SectionHeader>
      <ExampleBox title="Scenario: Rajesh wants to invest ₹75L in GIFT City in January">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Inputs</p>
            <CalcLine label="Investment amount" value="₹75L" />
            <CalcLine label="Already remitted" value="₹0" />
            <CalcLine label="Purpose" value="Investment" />
            <CalcLine label="Month" value="January" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Output</p>
            <CalcLine label="TCS-free portion" value="₹10L (threshold)" variant="green" />
            <CalcLine label="TCS-liable portion" value="₹65L" variant="red" />
            <CalcLine label="TCS deducted (20%)" value="₹13L" variant="red" />
            <CalcLine label="Effective TCS rate" value="17.33%" variant="red" />
            <CalcLine label="Net reaches GIFT City" value="₹62L" variant="neutral" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="text-xs"><strong>IRR drag (via ITR, 9 months, 12% return):</strong> ₹13L × 12% × (9/12) = <strong style={{ color: "#DC2626" }}>₹1.17L in lost returns</strong>. Rajesh effectively pays ₹14.17L in real cost for his TCS.</p>
        </div>
        <TipBox>
          If Rajesh switches on &ldquo;Do you pay advance tax?&rdquo;, the lock-up drops to ~1.5 months (next installment March 15). His opportunity cost collapses from ₹1.17L to <strong>₹0.19L</strong> — saving ₹98,000 by simply offsetting TCS against advance tax.
        </TipBox>
      </ExampleBox>

      {/* ── Example 2 ── */}
      <SectionHeader>Example 2 — Family optimization</SectionHeader>
      <ExampleBox title="Scenario: Sharma family wants to remit ₹3 Cr collectively">
        <p className="text-xs text-gray-500 mb-3">Three adult PANs: Arvind (already remitted ₹0), Priya (₹0), their adult son Rohan (₹0)</p>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-3 py-2 text-left text-gray-500">Member</th>
                <th className="px-3 py-2 text-right text-gray-500">Routed</th>
                <th className="px-3 py-2 text-right text-gray-500">TCS-Free</th>
                <th className="px-3 py-2 text-right text-gray-500">TCS Paid</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Arvind", routed: "₹1Cr", free: "₹10L", tcs: "₹18L (20%)" },
                { name: "Priya", routed: "₹1Cr", free: "₹10L", tcs: "₹18L (20%)" },
                { name: "Rohan", routed: "₹1Cr", free: "₹10L", tcs: "₹18L (20%)" },
              ].map((r) => (
                <tr key={r.name} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-3 py-2 font-medium" style={{ color: "#00111B" }}>{r.name}</td>
                  <td className="px-3 py-2 text-right">{r.routed}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: "#05A049" }}>{r.free}</td>
                  <td className="px-3 py-2 text-right font-semibold" style={{ color: "#DC2626" }}>{r.tcs}</td>
                </tr>
              ))}
              <tr style={{ background: "#F0FAF5", borderTop: "2px solid #B4E3C8" }}>
                <td className="px-3 py-2 font-bold" style={{ color: "#00111B" }}>Total</td>
                <td className="px-3 py-2 text-right font-bold">₹3 Cr</td>
                <td className="px-3 py-2 text-right font-bold" style={{ color: "#05A049" }}>₹30L free</td>
                <td className="px-3 py-2 text-right font-bold" style={{ color: "#DC2626" }}>₹54L TCS</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
          <p className="text-xs"><strong>If Arvind remitted all ₹3 Cr alone:</strong> TCS = ₹2.9Cr × 20% = ₹58L.<br />
          <strong>By splitting across 3 PANs:</strong> TCS = ₹54L. <strong style={{ color: "#05A049" }}>Family saves ₹4L.</strong></p>
        </div>
        <TipBox>Each adult member of the family — spouse, parents, adult children — gets their own ₹10L TCS-free threshold and their own $250,000 LRS annual limit. A family of 5 can remit ₹50L completely TCS-free every year.</TipBox>
      </ExampleBox>

      {/* ── Advance tax deep dive ── */}
      <SectionHeader><Clock className="h-4 w-4" style={{ color: "#05A049" }} /> The advance tax opportunity</SectionHeader>
      <p className="text-xs text-gray-500 mb-3">The biggest unlock most HNIs miss. TCS appears in Form 26AS Part F and can be directly credited against your advance tax installments — no separate claim, no waiting until July.</p>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <div className="grid grid-cols-3 text-center" style={{ borderBottom: "1px solid #E5E7EB" }}>
          {["Installment", "Date", "% of Annual Tax"].map((h) => (
            <div key={h} className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide" style={{ background: "#F9FAFB" }}>{h}</div>
          ))}
        </div>
        {[["1st", "June 15", "15%"], ["2nd", "September 15", "45%"], ["3rd", "December 15", "75%"], ["4th", "March 15", "100%"]].map(([inst, date, pct]) => (
          <div key={date} className="grid grid-cols-3 text-center border-t text-xs" style={{ borderColor: "#F3F4F6" }}>
            <div className="px-3 py-2.5 font-medium" style={{ color: "#374151" }}>{inst}</div>
            <div className="px-3 py-2.5 font-bold" style={{ color: "#00111B" }}>{date}</div>
            <div className="px-3 py-2.5 font-semibold" style={{ color: "#05A049" }}>{pct}</div>
          </div>
        ))}
      </div>

      <ExampleBox title="Advance tax example: Remitting ₹50L in June">
        <CalcLine label="TCS deducted (20% on ₹40L above threshold)" value="₹8L" variant="red" />
        <CalcLine label="ITR path lock-up (June → Sep next year)" value="16 months" variant="red" />
        <CalcLine label="Opportunity cost via ITR @ 12% return" value="₹1.28L" variant="red" />
        <CalcLine label="Advance tax path lock-up (June → Sep 15)" value="3 months" variant="green" />
        <CalcLine label="Opportunity cost via AT @ 12% return" value="₹0.24L" variant="green" />
        <CalcLine label="Saving by using advance tax offset" value="₹1.04L" variant="green" />
        <p className="text-[10px] text-gray-400 mt-3">When filing your September 15 advance tax, you reduce payment by ₹8L. The ₹8L TCS in Form 26AS Part F offsets directly. No application required.</p>
      </ExampleBox>

      {/* ── Common mistakes ── */}
      <SectionHeader>Common mistakes to avoid</SectionHeader>
      <div className="space-y-2">
        {[
          ["Remitting in one PAN only", "Even if only one person is investing, GIFT City funds can be owned jointly. Split remittances across family PANs to avoid TCS and optimize the ₹10L threshold per PAN."],
          ["Not tracking FY remittances", "TCS kicks in on the total across the FY from one PAN — not per remittance. If you remit ₹8L in April and ₹5L in October from the same PAN, the second remittance hits the threshold mid-way. Track cumulative FY total."],
          ["Missing advance tax offset", "Most investors wait 9–18 months for ITR refund. If you pay advance tax, the same TCS is absorbed in weeks at your next installment. Toggle this on if you pay advance tax above ₹10,000/year."],
        ].map(([title, body]) => (
          <Collapse key={title} title={`⚠ ${title}`}>
            <p className="text-xs leading-relaxed text-gray-600">{body}</p>
          </Collapse>
        ))}
      </div>
    </div>
  );
}

function CGContent() {
  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-600">
        India taxes overseas fund gains differently depending on how long you hold them. The magic number is <strong>730 days (24 months)</strong>. Hold longer: flat 12.5% LTCG with surcharge capped at 15%. Sell earlier: your income slab rate applies — up to 42.74% for the highest earners. This calculator finds the break-even day and models both scenarios exactly.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#DC2626" }}>Short Term (≤ 730 days)</p>
          <p className="text-xs text-gray-600 space-y-1">
            <span className="block">Base rate: your income slab (0–30%)</span>
            <span className="block">Surcharge: up to 37% — <strong>no cap</strong></span>
            <span className="block">Cess: 4%</span>
            <span className="block font-bold" style={{ color: "#DC2626" }}>Max effective: 42.74%</span>
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#05A049" }}>Long Term (&gt; 730 days)</p>
          <p className="text-xs text-gray-600 space-y-1">
            <span className="block">Base rate: 12.5% flat (Section 112)</span>
            <span className="block">Surcharge: <strong>capped at 15%</strong> — key HNI benefit</span>
            <span className="block">Cess: 4%</span>
            <span className="block font-bold" style={{ color: "#05A049" }}>Max effective: 14.95%</span>
          </p>
        </div>
      </div>

      <SectionHeader><BookOpen className="h-4 w-4" style={{ color: "#00111B" }} /> How to use the calculator</SectionHeader>
      <StepList steps={[
        "Choose currency (INR or USD). If USD, edit the exchange rate (default ₹84.50).",
        "Enter your purchase price and sale price per unit.",
        "Enter the number of units/shares.",
        "Set holding period using either the Years + Months inputs or the slider (0–10 years). The badge instantly shows LONG TERM or SHORT TERM.",
        "Set your annual income excluding this gain — this determines your STCG slab rate and surcharge bracket.",
        "Choose tax regime — New (default FY 2025-26) or Old.",
        "If you have carry-forward losses, toggle Yes and enter STCL/LTCL amounts.",
        "Click 'Show Math' on Card 2 to see the full 8-step derivation of your tax.",
      ]} />

      {/* Example 1: STCG */}
      <SectionHeader>Example 1 — Short-term gain, high-income investor</SectionHeader>
      <ExampleBox title="Priya buys a GIFT City fund at $100, sells at $145 after 18 months. Income: ₹5 Cr.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Inputs</p>
            <CalcLine label="Buy price" value="$100 (₹8,450)" />
            <CalcLine label="Sell price" value="$145 (₹12,252)" />
            <CalcLine label="Units" value="1,000" />
            <CalcLine label="Holding" value="18 months (540 days)" variant="red" />
            <CalcLine label="Income" value="₹5 Cr (above ₹2Cr slab)" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Calculation</p>
            <CalcLine label="Gain" value="₹38,02,000 (₹3,802/unit × 1,000)" variant="gold" />
            <CalcLine label="Type" value="STCG (540 days ≤ 730)" variant="red" />
            <CalcLine label="Base slab rate" value="30%" variant="red" />
            <CalcLine label="Surcharge (uncapped)" value="25% → net 37.5% rate" variant="red" />
            <CalcLine label="Cess 4%" value="+4%" />
            <CalcLine label="Effective rate" value="40.56%" variant="red" />
            <CalcLine label="Tax payable" value="~₹15.42L" variant="red" />
            <CalcLine label="Net after tax" value="~₹22.60L" variant="neutral" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: "#FFF7ED", border: "1px solid #FDE68A" }}>
          <p className="text-xs"><strong>The Waiting Game:</strong> Priya is 190 days from LTCG threshold. If she waits, effective rate drops to 14.95%. Tax drops from ₹15.42L to <strong style={{ color: "#05A049" }}>~₹5.69L</strong>. She saves <strong style={{ color: "#05A049" }}>₹9.73L by waiting 190 days.</strong></p>
        </div>
      </ExampleBox>

      {/* Example 2: LTCG */}
      <SectionHeader>Example 2 — Long-term gain with surcharge cap advantage</SectionHeader>
      <ExampleBox title="Vikram holds for 25 months. Income above ₹5 Cr. The surcharge cap is the key.">
        <p className="text-xs text-gray-500 mb-3">Without LTCG, Vikram would be at 37% surcharge. With LTCG, surcharge is capped at 15% regardless of income.</p>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="px-3 py-2 text-left text-gray-500">Item</th>
                <th className="px-3 py-2 text-right text-gray-500">STCG (if held less)</th>
                <th className="px-3 py-2 text-right text-gray-500">LTCG (25 months)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Base rate", "30% (slab)", "12.5% (flat)"],
                ["Surcharge", "37% (uncapped)", "15% (capped)"],
                ["Effective rate", "42.74%", "14.95%"],
                ["Tax on ₹1 Cr gain", "₹42.74L", "₹14.95L"],
                ["Saving vs STCG", "—", "₹27.79L per ₹1 Cr"],
              ].map(([item, stcg, ltcg]) => (
                <tr key={item} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-3 py-2.5 font-medium text-gray-600">{item}</td>
                  <td className="px-3 py-2.5 text-right font-mono" style={{ color: "#DC2626" }}>{stcg}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold" style={{ color: "#05A049" }}>{ltcg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TipBox>The 15% surcharge cap on LTCG is the most underutilised provision for HNIs with income above ₹2 Cr. At ₹5 Cr+ income, the STCG-to-LTCG spread is 27.79 percentage points per rupee of gain. Waiting 730 days is mathematically the single highest-value action.</TipBox>
      </ExampleBox>

      {/* Example 3: Losses */}
      <SectionHeader>Example 3 — Using carry-forward losses</SectionHeader>
      <ExampleBox title="Deepa has ₹5L in STCL from last year. Now she has a ₹12L STCG.">
        <CalcLine label="Gross STCG" value="₹12L" variant="gold" />
        <CalcLine label="STCL carry-forward offset" value="−₹5L" variant="green" />
        <CalcLine label="Taxable STCG after offset" value="₹7L" variant="gold" />
        <CalcLine label="Effective rate (₹50L income, new regime)" value="~17.55%" />
        <CalcLine label="Tax on ₹7L vs ₹12L" value="₹1.23L vs ₹2.11L" variant="green" />
        <CalcLine label="Saving from STCL offset" value="₹0.88L" variant="green" />
        <p className="text-[10px] text-gray-400 mt-3">STCL offsets both STCG and LTCG. LTCL offsets LTCG only. Carry-forward is valid for 8 Assessment Years — but you must file ITR by July 31 to preserve it.</p>
        <WarnBox>If you miss the July 31 ITR deadline, you lose the right to carry forward the loss permanently. Always file on time even if you have no tax to pay.</WarnBox>
      </ExampleBox>

      {/* Rate table reference */}
      <SectionHeader>Rate quick-reference</SectionHeader>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Income Bracket", "STCG Effective", "LTCG Effective", "TLH Value / ₹1L gain"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Up to ₹3L",    "0%",     "13.00%", "—"],
              ["₹3L–₹7L",     "5.46%",  "13.00%", "₹ 763"],
              ["₹7L–₹10L",    "10.92%", "13.00%", "₹ 208"],
              ["₹10L–₹50L",   "17.55%", "13.00%", "₹ 455"],
              ["₹50L–₹1 Cr",  "21.45%", "13.00%", "₹ 845"],
              ["₹1 Cr–₹2 Cr", "24.96%", "13.00%", "₹1,196"],
              ["₹2 Cr–₹5 Cr", "34.32%", "14.95%", "₹1,937"],
              ["Above ₹5 Cr", "42.74%", "14.95%", "₹2,779"],
            ].map(([bracket, stcg, ltcg, tlh]) => (
              <tr key={bracket} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-2.5 font-medium text-gray-700">{bracket}</td>
                <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "#DC2626" }}>{stcg}</td>
                <td className="px-3 py-2.5 font-mono font-bold" style={{ color: "#05A049" }}>{ltcg}</td>
                <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: "#B8913A" }}>{tlh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">TLH Value = tax saved per ₹1L of loss harvested. For income above ₹5 Cr, harvesting a ₹1L loss and reinvesting is worth ₹2,779 in permanent tax saving.</p>
    </div>
  );
}

function DTAAContent() {
  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-600">
        NRIs and Resident Indians with foreign income face double taxation — both India and their country of residence (or the source country) try to tax the same rupee. DTAA treaties cap the rate. This calculator has two completely separate flows: <strong>NRI flow</strong> (country of residence outside India) and <strong>Resident Indian flow</strong> (you live in India, income sourced abroad).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#00111B" }}>NRI Flow (country ≠ India)</p>
          <p className="text-xs text-gray-500 leading-relaxed">India taxes your Indian-source income at DTAA-capped rates. Your residence country taxes globally but credits Indian tax paid. You pay the higher of the two — not both.</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FDE68A" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#00111B" }}>Resident Indian Flow (🇮🇳 India)</p>
          <p className="text-xs text-gray-500 leading-relaxed">You live in India. A foreign source country deducts WHT before paying you. India then taxes the gross at your slab rate. File Form 67 to claim FTC — and pay only the higher of the two rates.</p>
        </div>
      </div>

      {/* NRI Section */}
      <SectionHeader><Globe className="h-4 w-4" style={{ color: "#B8913A" }} /> NRI Flow — How to use</SectionHeader>
      <StepList steps={[
        "Step 1: Select your country of residence (UAE, UK, USA, Singapore, Canada, Australia, Germany, Netherlands, Mauritius, Japan, or Other).",
        "Step 1: Select income type — Dividends, Capital Gains, Interest, or Other.",
        "Step 1: Enter the income amount (INR or USD toggle).",
        "Step 2: Set your marginal income tax rate in your residence country using the slider. A hint shows the typical rate for your selected country.",
        "Step 2: Enter the Indian TDS/WHT already deducted by the payer (pre-filled with the DTAA rate).",
        "Read the two cards: 'Without DTAA' (red, double taxation) vs 'With DTAA' (green, treaty protection). The savings banner shows the exact INR benefit.",
      ]} />

      <ExampleBox title="NRI Example: Rajan lives in UAE, receives ₹10L dividend from an Indian company">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Without DTAA</p>
            <CalcLine label="Indian domestic WHT (30%)" value="₹3L" variant="red" />
            <CalcLine label="UAE tax (0% — no income tax)" value="₹0" variant="neutral" />
            <CalcLine label="Total" value="₹3L (30%)" variant="red" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">With DTAA (India-UAE)</p>
            <CalcLine label="Indian DTAA-capped WHT (10%)" value="₹1L" variant="green" />
            <CalcLine label="UAE tax (0%)" value="₹0" variant="neutral" />
            <CalcLine label="FTC via Form 67" value="₹0 (UAE taxes nothing to credit)" variant="neutral" />
            <CalcLine label="Total" value="₹1L (10%)" variant="green" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
          <p className="text-xs"><strong style={{ color: "#05A049" }}>DTAA saves Rajan ₹2L (20 percentage points)</strong> on this single dividend payment. UAE is one of the lowest DTAA rates (10%). Mauritius is the lowest at 5%.</p>
        </div>
      </ExampleBox>

      <ExampleBox title="NRI Example: Sunita lives in UK, receives ₹20L dividend from Indian stocks">
        <CalcLine label="Without DTAA — Indian tax (30%)" value="₹6L" variant="red" />
        <CalcLine label="Without DTAA — UK tax (45% marginal)" value="₹9L" variant="red" />
        <CalcLine label="Without DTAA — Total double tax" value="₹15L (75%!)" variant="red" />
        <div className="my-2 border-t" style={{ borderColor: "#E5E7EB" }} />
        <CalcLine label="With DTAA — Indian WHT (15% per UK treaty)" value="₹3L" variant="green" />
        <CalcLine label="With DTAA — UK tax (45%)" value="₹9L gross" variant="neutral" />
        <CalcLine label="With DTAA — FTC credit (Indian tax paid)" value="−₹3L" variant="green" />
        <CalcLine label="With DTAA — Net UK tax" value="₹6L" variant="neutral" />
        <CalcLine label="With DTAA — Total" value="₹9L (45%)" variant="green" />
        <p className="text-[10px] text-gray-400 mt-2">Sunita pays only the UK rate (the higher of the two). She does not pay both — that is the core principle of DTAA + FTC.</p>
      </ExampleBox>

      {/* DTAA rates table */}
      <SectionHeader>India DTAA Dividend WHT rates at a glance</SectionHeader>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Country", "Dividend WHT", "Why it matters"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["🇲🇺 Mauritius", "5%", "Lowest treaty rate — ideal for dividend-heavy portfolios"],
              ["🇩🇪 Germany", "10%", "Low rate with strong treaty provisions"],
              ["🇳🇱 Netherlands", "10%", "Low rate; popular UCITS fund domicile"],
              ["🇦🇪 UAE", "10%", "No UAE income tax — only Indian WHT applies"],
              ["🇯🇵 Japan", "10%", "Low rate despite high domestic Japanese tax"],
              ["🇬🇧 UK", "15%", "Standard rate; FTC available against UK tax"],
              ["🇸🇬 Singapore", "15%", "One-tier dividend system — no Singapore WHT beyond this"],
              ["🇦🇺 Australia", "15%", "FTC available against Australian CGT"],
              ["🇮🇳 Without DTAA", "30%", "Full domestic rate — no treaty protection"],
              ["🇺🇸 USA", "25%", "Highest among major destinations — UCITS route preferred"],
              ["🇨🇦 Canada", "25%", "Highest alongside USA"],
            ].map(([c, rate, note]) => (
              <tr key={c} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-2.5 font-medium">{c}</td>
                <td className="px-3 py-2.5 font-mono font-bold"
                  style={{ color: parseFloat(rate) <= 10 ? "#05A049" : parseFloat(rate) >= 25 ? "#DC2626" : "#B8913A" }}>
                  {rate}
                </td>
                <td className="px-3 py-2.5 text-gray-500">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resident Indian section */}
      <SectionHeader><span className="text-base">🇮🇳</span> Resident Indian Flow — How to use</SectionHeader>
      <StepList steps={[
        "Step 1: Select '🇮🇳 India (Resident Indian)' — the UI switches to the FTC flow.",
        "Step 1: Select income type. Note: GIFT City interest is NOT exempt for residents (unlike NRIs). Interest is taxed at your slab rate.",
        "Step 1: Enter the income amount.",
        "Step 2: Select your Indian income tax slab from the dropdown (New Regime FY 2025-26).",
        "Step 2: Select the source country — the country where the income originated (USA, UK, Singapore, etc.).",
        "Read the two cards: 'Without FTC' (both taxes stacked) vs 'With FTC via Form 67' (you pay only the higher rate).",
      ]} />

      <ExampleBox title="Resident Indian Example: Aditya gets $10,000 dividend from a US stock. Income: ₹20L (30% slab).">
        <p className="text-xs text-gray-500 mb-3">Dividend ≈ ₹8.45L at ₹84.50/$. USA deducts 25% NRA withholding (₹2.11L) before paying Aditya.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Without FTC</p>
            <CalcLine label="US WHT deducted (25%)" value="₹2.11L" variant="red" />
            <CalcLine label="Indian slab tax (30%)" value="₹2.54L" variant="red" />
            <CalcLine label="Total" value="₹4.65L (55%!)" variant="red" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">With FTC (Form 67)</p>
            <CalcLine label="US WHT deducted" value="₹2.11L" variant="neutral" />
            <CalcLine label="Indian slab tax" value="₹2.54L" variant="neutral" />
            <CalcLine label="FTC = min(US WHT, Indian tax)" value="−₹2.11L" variant="green" />
            <CalcLine label="Net Indian tax" value="₹0.43L" variant="neutral" />
            <CalcLine label="Total (US WHT + net Indian)" value="₹2.54L (30%)" variant="green" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
          <p className="text-xs"><strong style={{ color: "#05A049" }}>FTC saves ₹2.11L.</strong> Aditya pays only 30% (his Indian slab rate — the higher of the two), not 55%.</p>
        </div>
        <TipBox>
          US WHT (25%) &lt; Indian slab (30%), so FTC covers the full WHT and Aditya still pays the Indian differential. If Aditya were in the 20% slab, US WHT would exceed his Indian tax — he would pay 25% and get no further credit. The FTC rule: you always pay the <strong>higher</strong> of the two rates.
        </TipBox>
      </ExampleBox>

      {/* GIFT City for residents */}
      <SectionHeader>GIFT City: Key differences for Resident Indians</SectionHeader>
      <WarnBox>
        Unlike NRIs, Resident Indians do NOT get the Section 10(15)(ix) interest exemption on GIFT City IFSC bonds. Interest income from GIFT City funds is taxable at your full slab rate. Structure your portfolio towards growth/capital-appreciation funds rather than income-distributing products.
      </WarnBox>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["Income Type", "NRI", "Resident Indian"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["GIFT City interest", "0% — Sec 10(15)(ix) exempt", "Slab rate (up to 30%)"],
              ["LTCG on GIFT City funds", "12.5% (14.95% max)", "12.5% (14.95% max)"],
              ["STCG on GIFT City funds", "Slab rate", "Slab rate"],
              ["Schedule FA disclosure", "Not required", "Mandatory — ₹10L penalty if missed"],
              ["Form 67 for FTC", "Required for foreign tax credit", "Required for foreign WHT credit"],
            ].map(([type, nri, res]) => (
              <tr key={type} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-2.5 font-medium text-gray-700">{type}</td>
                <td className="px-3 py-2.5" style={{ color: "#05A049" }}>{nri}</td>
                <td className="px-3 py-2.5" style={{ color: type.includes("interest") ? "#DC2626" : "#374151" }}>{res}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form 67 */}
      <SectionHeader><FileText className="h-4 w-4" style={{ color: "#B8913A" }} /> Form 67 — the most important deadline</SectionHeader>
      <div className="rounded-xl p-4" style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-bold mb-2" style={{ color: "#B8913A" }}>Must-do checklist</p>
            {["File Form 67 online on the e-filing portal", "Deadline: March 31 of the Assessment Year (not July 31)", "Must match Schedule FSI in your ITR-2 or ITR-3", "Attach TDS certificate from foreign payer / Indian payer", "Cannot be filed late or via revised return"].map((item) => (
              <div key={item} className="flex items-start gap-1.5 mb-1">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                <span className="text-gray-600">{item}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="font-bold mb-2" style={{ color: "#DC2626" }}>What happens if you miss it</p>
            <p className="text-gray-600 leading-relaxed">The Foreign Tax Credit is <strong>permanently lost</strong>. You cannot claim it in a revised return or in subsequent years. For large dividend portfolios, this can mean losing lakhs every year with no recourse. Set a calendar reminder for March 31.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── tiny missing import fix ── */
function Globe(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      {...props}>
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */

export default function CalcDocsPage() {
  const [active, setActive] = useState<CalcKey>("lrs");

  const CONTENT: Record<CalcKey, React.ReactNode> = {
    lrs:  <LRSContent />,
    cg:   <CGContent />,
    dtaa: <DTAAContent />,
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Header ── */}
      <div className="border-b px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>Documentation</span>
              <span className="text-[10px] text-gray-400">FY 2025-26 · Finance Act 2025 · With worked examples</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              Calculator Guide
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              Step-by-step instructions, worked examples, rate tables, and pro tips for all three Valura tax calculators.
            </p>
          </div>
          <div className="hidden md:flex flex-col gap-2">
            {CALCULATORS.map((c) => (
              <Link key={c.key} href={c.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: `${c.color}12`, color: c.color, border: `1px solid ${c.color}30` }}>
                <c.icon className="h-3.5 w-3.5" />
                Open {c.label} <ArrowRight className="h-3 w-3 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Calculator tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {CALCULATORS.map((c) => {
            const isActive = active === c.key;
            return (
              <button key={c.key} onClick={() => setActive(c.key)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: isActive ? c.color : "#F9FAFB",
                  color: isActive ? "#fff" : "#374151",
                  border: isActive ? `1px solid ${c.color}` : "1px solid #E5E7EB",
                  boxShadow: isActive ? `0 4px 12px ${c.color}30` : "none",
                }}>
                <c.icon className="h-4 w-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Active calculator intro strip ── */}
        {CALCULATORS.filter((c) => c.key === active).map((c) => (
          <div key={c.key} className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
            style={{ background: `${c.color}0D`, border: `1px solid ${c.color}30` }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: `${c.color}20` }}>
                <c.icon className="h-5 w-5" style={{ color: c.color }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  {c.label} Calculator
                </p>
                <p className="text-xs text-gray-500">{c.tagline}</p>
              </div>
            </div>
            <Link href={c.href}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all"
              style={{ background: c.color, color: "#fff" }}>
              Open calculator <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}

        {/* ── Content ── */}
        <div>{CONTENT[active]}</div>

        {/* ── Footer nav ── */}
        <div className="mt-12 pt-6 border-t flex flex-wrap gap-3" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-xs text-gray-400 w-full mb-2">Jump to another calculator:</p>
          {CALCULATORS.map((c) => (
            <Link key={c.key} href={c.href}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" }}>
              <c.icon className="h-4 w-4" />
              {c.label}
            </Link>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-center mt-6 pb-4" style={{ color: "#9CA3AF" }}>
          All examples are illustrative only. Tax rates per Finance Act 2025, FY 2025-26. Individual circumstances vary. Consult your CA before making investment or tax decisions.
        </p>
      </div>
    </div>
  );
}
