"use client";

import { useState, useMemo } from "react";
import {
  getSTCGEffectiveRate,
  bracketToIncome,
  type IncomeBracket,
} from "@/lib/tax-calculations";
import type { CalculatorType } from "@/lib/journeys";

// ─── Formatting helpers ────────────────────────────────────────────────────

function inr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${Math.round(n)}`;
}

const BRACKETS: { value: IncomeBracket; label: string }[] = [
  { value: "up_to_50L",   label: "Up to ₹50L" },
  { value: "50L_to_1Cr",  label: "₹50L – ₹1Cr" },
  { value: "1Cr_to_2Cr",  label: "₹1Cr – ₹2Cr" },
  { value: "2Cr_to_5Cr",  label: "₹2Cr – ₹5Cr" },
  { value: "above_5Cr",   label: "Above ₹5Cr" },
];

// ─── Sub-calculators ───────────────────────────────────────────────────────

function TCSBasic() {
  const [amount, setAmount] = useState(2000000);

  const taxable = Math.max(0, amount - 1_000_000);
  const tcs = taxable * 0.20;
  const net = amount - tcs;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold" style={{ color: "#00111B" }}>
            How much do you want to invest?
          </label>
          <span className="text-xs font-bold" style={{ color: "#05A049" }}>{inr(amount)}</span>
        </div>
        <input
          type="range"
          min={100000}
          max={50000000}
          step={100000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-green-600"
          style={{ accentColor: "#05A049" }}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
          <span>₹1L</span><span>₹5Cr</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <div className="px-4 py-2 flex justify-between items-center"
          style={{ background: tcs > 0 ? "#FEF2F2" : "#EDFAF3" }}>
          <span className="text-xs font-medium" style={{ color: "#374151" }}>TCS deducted upfront</span>
          <span className="text-sm font-bold" style={{ color: tcs > 0 ? "#DC2626" : "#05A049" }}>
            {tcs > 0 ? inr(tcs) : "₹0"}
          </span>
        </div>
        <div className="px-4 py-2 flex justify-between items-center border-t" style={{ borderColor: "#F3F4F6" }}>
          <span className="text-xs font-medium" style={{ color: "#374151" }}>You get back (via ITR)</span>
          <span className="text-sm font-bold" style={{ color: "#05A049" }}>{inr(tcs)}</span>
        </div>
        <div className="px-4 py-2 flex justify-between items-center border-t" style={{ borderColor: "#F3F4F6", background: "#F9FAFB" }}>
          <span className="text-xs font-semibold" style={{ color: "#00111B" }}>Net reaching your account</span>
          <span className="text-sm font-bold" style={{ color: "#00111B" }}>{inr(net)}</span>
        </div>
      </div>

      {tcs === 0 && (
        <p className="text-[11px] text-center" style={{ color: "#05A049" }}>
          ✓ Below ₹10L threshold — zero TCS on this investment
        </p>
      )}
    </div>
  );
}

function FamilyTCS() {
  const [amount, setAmount] = useState(3000000);
  const [count, setCount] = useState(2);

  const threshold = count * 1_000_000;
  const tcsIndividual = Math.max(0, amount - 1_000_000) * 0.20;
  const tcsFamily = Math.max(0, amount - threshold) * 0.20;
  const saving = tcsIndividual - tcsFamily;

  return (
    <div className="space-y-4">
      {/* Family count */}
      <div>
        <label className="text-xs font-semibold block mb-2" style={{ color: "#00111B" }}>
          Number of adults in your family
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCount(Math.max(1, count - 1))}
            className="h-9 w-9 rounded-xl border text-lg font-bold transition-colors hover:border-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >−</button>
          <span className="text-xl font-bold w-8 text-center" style={{ color: "#00111B" }}>{count}</span>
          <button
            onClick={() => setCount(Math.min(5, count + 1))}
            className="h-9 w-9 rounded-xl border text-lg font-bold transition-colors hover:border-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >+</button>
          <span className="text-xs ml-1" style={{ color: "#6B7280" }}>
            TCS-free limit: {inr(threshold)}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
          Total amount you want to invest
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-500"
          style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          placeholder="e.g. 5000000"
        />
        <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{inr(amount)}</p>
      </div>

      {/* Results */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <div className="px-4 py-2.5 flex justify-between border-b" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
          <span className="text-xs font-medium" style={{ color: "#374151" }}>Without family split: TCS</span>
          <span className="text-sm font-bold" style={{ color: "#DC2626" }}>{inr(tcsIndividual)}</span>
        </div>
        <div className="px-4 py-2.5 flex justify-between border-b" style={{ background: tcsFamily === 0 ? "#EDFAF3" : "#FFFBF0", borderColor: "#E5E7EB" }}>
          <span className="text-xs font-medium" style={{ color: "#374151" }}>With {count} family members: TCS</span>
          <span className="text-sm font-bold" style={{ color: tcsFamily === 0 ? "#05A049" : "#B8913A" }}>
            {tcsFamily === 0 ? "₹0" : inr(tcsFamily)}
          </span>
        </div>
        <div className="px-4 py-3 flex justify-between" style={{ background: "#EDFAF3" }}>
          <span className="text-sm font-bold" style={{ color: "#00111B" }}>You save</span>
          <span className="text-xl font-extrabold" style={{ color: "#05A049", fontFamily: "var(--font-bricolage)" }}>
            {inr(saving)}
          </span>
        </div>
      </div>
    </div>
  );
}

function WaitingGame() {
  const [gain, setGain] = useState(5000000);
  const [bracket, setBracket] = useState<IncomeBracket>("above_5Cr");
  const [daysHeld, setDaysHeld] = useState(700);

  const income = bracketToIncome(bracket);
  const stcgRate = getSTCGEffectiveRate(income, "new");
  const ltcgRate = income > 10_000_000 ? 0.1495 : 0.13;
  const stcgTax = gain * stcgRate;
  const ltcgTax = gain * ltcgRate;
  const saving = stcgTax - ltcgTax;
  const daysToLTCG = Math.max(0, 730 - daysHeld);
  const isLTCG = daysHeld >= 730;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            Your expected profit (₹)
          </label>
          <input
            type="number"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value) || 0)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          />
          <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{inr(gain)}</p>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            Your income bracket
          </label>
          <select
            value={bracket}
            onChange={(e) => setBracket(e.target.value as IncomeBracket)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >
            {BRACKETS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold" style={{ color: "#00111B" }}>Days held so far</label>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: isLTCG ? "rgba(5,160,73,0.1)" : "rgba(184,145,58,0.1)",
                color: isLTCG ? "#05A049" : "#B8913A",
              }}
            >
              {isLTCG ? "LONG TERM" : "SHORT TERM"}
            </span>
            <span className="text-xs font-bold" style={{ color: "#00111B" }}>{daysHeld} days</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={800}
          value={daysHeld}
          onChange={(e) => setDaysHeld(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: isLTCG ? "#05A049" : "#B8913A" }}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
          <span>0</span><span style={{ color: isLTCG ? "#05A049" : "#B8913A" }}>730 ← 2 years</span><span>800</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${isLTCG ? "#B4E3C8" : "#E5E7EB"}` }}>
        {isLTCG ? (
          <>
            <div className="px-4 py-3 flex justify-between" style={{ background: "#EDFAF3" }}>
              <span className="text-sm font-bold" style={{ color: "#064E24" }}>Tax now (long-term — optimal)</span>
              <span className="text-xl font-extrabold" style={{ color: "#05A049", fontFamily: "var(--font-bricolage)" }}>{inr(ltcgTax)}</span>
            </div>
            <div className="px-4 py-2 text-center">
              <span className="text-xs" style={{ color: "#05A049" }}>
                ✓ You're in the optimal zone — {(ltcgRate * 100).toFixed(2)}% max rate
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-2.5 flex justify-between border-b" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
              <span className="text-xs font-medium" style={{ color: "#374151" }}>Tax if you sell today (short-term)</span>
              <span className="text-sm font-bold" style={{ color: "#DC2626" }}>{inr(stcgTax)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between border-b" style={{ background: "#EDFAF3", borderColor: "#E5E7EB" }}>
              <span className="text-xs font-medium" style={{ color: "#374151" }}>
                Tax after {daysToLTCG} more days (long-term)
              </span>
              <span className="text-sm font-bold" style={{ color: "#05A049" }}>{inr(ltcgTax)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between" style={{ background: "#FFFBF0" }}>
              <span className="text-sm font-bold" style={{ color: "#00111B" }}>Save by waiting {daysToLTCG} days</span>
              <span className="text-xl font-extrabold" style={{ color: "#B8913A", fontFamily: "var(--font-bricolage)" }}>{inr(saving)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TLHSavings() {
  const [loss, setLoss] = useState(500000);
  const [bracket, setBracket] = useState<IncomeBracket>("above_5Cr");

  const income = bracketToIncome(bracket);
  const stcgRate = getSTCGEffectiveRate(income, "new");
  const savings = loss * stcgRate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            Unrealized loss position (₹)
          </label>
          <input
            type="number"
            value={loss}
            onChange={(e) => setLoss(Number(e.target.value) || 0)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          />
          <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>{inr(loss)}</p>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            Your income bracket
          </label>
          <select
            value={bracket}
            onChange={(e) => setBracket(e.target.value as IncomeBracket)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >
            {BRACKETS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl px-5 py-4 text-center"
        style={{ background: "#EDFAF3", border: "1.5px solid #B4E3C8" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "#374151" }}>
          Harvesting this loss saves you
        </p>
        <p className="text-3xl font-extrabold" style={{ color: "#05A049", fontFamily: "var(--font-bricolage)" }}>
          {inr(savings)}
        </p>
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          in tax this financial year ({(stcgRate * 100).toFixed(2)}% rate on {inr(loss)} loss)
        </p>
      </div>
    </div>
  );
}

function FamilyCapacity() {
  const [count, setCount] = useState(2);
  const USD_RATE = 84.5;

  const usdCapacity = count * 250000;
  const inrCapacity = usdCapacity * USD_RATE;
  const tcsFreeLimit = count * 10; // in lakhs

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold block mb-2" style={{ color: "#00111B" }}>
          Number of adults in your family
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCount(Math.max(1, count - 1))}
            className="h-10 w-10 rounded-xl border text-xl font-bold transition-colors hover:border-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >−</button>
          <span className="text-2xl font-extrabold w-10 text-center" style={{ color: "#00111B", fontFamily: "var(--font-bricolage)" }}>{count}</span>
          <button
            onClick={() => setCount(Math.min(5, count + 1))}
            className="h-10 w-10 rounded-xl border text-xl font-bold transition-colors hover:border-green-500"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          >+</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#EDFAF3", border: "1px solid #B4E3C8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#05A049" }}>Annual investment capacity</p>
          <p className="text-xl font-extrabold" style={{ color: "#00111B", fontFamily: "var(--font-bricolage)" }}>
            ${usdCapacity.toLocaleString()}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            (~{inr(inrCapacity)})
          </p>
        </div>
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#F0FAF4", border: "1px solid #B4E3C8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#05A049" }}>TCS-free limit per year</p>
          <p className="text-xl font-extrabold" style={{ color: "#00111B", fontFamily: "var(--font-bricolage)" }}>
            ₹{tcsFreeLimit}L
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
            {count} × ₹10L threshold
          </p>
        </div>
      </div>
    </div>
  );
}

function NRIStatusSimple() {
  const [nriYears, setNriYears] = useState(7);
  const [totalDays, setTotalDays] = useState(600);

  const isRNOR = nriYears >= 9 || totalDays <= 729;
  const statusLabel = isRNOR ? "RNOR" : "Resident (ROR)";
  const statusColor = isRNOR ? "#B8913A" : "#2B4A8A";
  const statusBg = isRNOR ? "rgba(184,145,58,0.1)" : "rgba(43,74,138,0.1)";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            NRI years in last 10 financial years
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNriYears(Math.max(0, nriYears - 1))}
              className="h-8 w-8 rounded-lg border text-sm font-bold"
              style={{ borderColor: "#E5E7EB", color: "#00111B" }}
            >−</button>
            <span className="text-lg font-bold w-8 text-center" style={{ color: "#00111B" }}>{nriYears}</span>
            <button
              onClick={() => setNriYears(Math.min(10, nriYears + 1))}
              className="h-8 w-8 rounded-lg border text-sm font-bold"
              style={{ borderColor: "#E5E7EB", color: "#00111B" }}
            >+</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#00111B" }}>
            Total India days in last 7 years
          </label>
          <input
            type="number"
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value) || 0)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "#E5E7EB", color: "#00111B" }}
          />
        </div>
      </div>

      <div className="rounded-xl px-5 py-4" style={{ background: statusBg, border: `1.5px solid ${statusColor}44` }}>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-sm font-extrabold px-3 py-1 rounded-full"
            style={{ background: statusColor, color: "#fff", fontFamily: "var(--font-bricolage)" }}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
          {isRNOR
            ? "Your foreign income is NOT taxable in India during this period. This is your golden window."
            : "As a full resident (ROR), all worldwide income is taxable in India. GIFT City investments must be declared in Schedule FA."}
        </p>
        {isRNOR && nriYears >= 9 && (
          <p className="text-[11px] mt-1.5" style={{ color: "#B8913A" }}>
            ✓ RNOR Test A: {nriYears}/10 years as NRI (needs ≥ 9)
          </p>
        )}
        {isRNOR && totalDays <= 729 && (
          <p className="text-[11px] mt-1" style={{ color: "#B8913A" }}>
            ✓ RNOR Test B: {totalDays} days in India in last 7 years (needs ≤ 729)
          </p>
        )}
      </div>

      <p className="text-[11px] text-center" style={{ color: "#9CA3AF" }}>
        For precise calculation with all Section 6 rules →{" "}
        <a href="/calculators/nri-status" className="underline" style={{ color: "#05A049" }}>
          Full NRI Status Calculator
        </a>
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────

export default function StepCalculator({ type }: { type: CalculatorType }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 mt-3"
      style={{ background: "#fff", border: "1.5px solid #E5E7EB" }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-4"
        style={{ color: "#05A049" }}
      >
        Try it yourself
      </p>
      {type === "tcs_basic"         && <TCSBasic />}
      {type === "family_tcs"        && <FamilyTCS />}
      {type === "waiting_game"      && <WaitingGame />}
      {type === "tlh_savings"       && <TLHSavings />}
      {type === "family_capacity"   && <FamilyCapacity />}
      {type === "nri_status_simple" && <NRIStatusSimple />}
    </div>
  );
}
