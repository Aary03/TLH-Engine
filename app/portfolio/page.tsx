"use client";

import { useState } from "react";
import {
  Plus, Trash2, Edit2, CheckCircle2, X, RefreshCw,
  Download, Upload, ChevronDown, Info, TrendingUp, TrendingDown,
  Database, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  usePortfolio, getHoldingMetrics, COMMON_FUNDS, SAMPLE_HOLDINGS,
  type Holding, type InvestorProfile,
} from "@/lib/portfolio-store";
import { formatINR, formatUSD } from "@/lib/utils";

const INCOME_BRACKETS = [
  { value: "up_to_50L",   label: "Up to ₹50L" },
  { value: "50L_to_1Cr",  label: "₹50L – ₹1Cr" },
  { value: "1Cr_to_2Cr",  label: "₹1Cr – ₹2Cr" },
  { value: "2Cr_to_5Cr",  label: "₹2Cr – ₹5Cr" },
  { value: "above_5Cr",   label: "Above ₹5Cr" },
] as const;

const EMPTY_FORM = {
  name: "", symbol: "", amc: "", quantity: "",
  avgCostUSD: "", currentNAVUSD: "", purchaseDate: "", notes: "",
};

// ─── Inline row editor ─────────────────────────────────────────────────────
function HoldingRow({
  h, profile, onUpdate, onDelete,
}: {
  h: Holding;
  profile: InvestorProfile;
  onUpdate: (id: string, patch: Partial<Holding>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Holding>>({});
  const metrics = getHoldingMetrics(h, profile.exchangeRate);

  const save = () => {
    if (Object.keys(draft).length) onUpdate(h.id, draft);
    setEditing(false);
    setDraft({});
  };

  const typeVariants: Record<string, "ltcg" | "stcg" | "stcl" | "ltcl"> = {
    LTCG: "ltcg", STCG: "stcg", STCL: "stcl", LTCL: "ltcl",
  };

  if (editing) {
    return (
      <tr className="border-b border-border bg-primary/5">
        {[
          { field: "name", val: draft.name ?? h.name, wide: true },
          { field: "symbol", val: draft.symbol ?? h.symbol },
          { field: "amc", val: draft.amc ?? h.amc },
          { field: "quantity", val: String(draft.quantity ?? h.quantity), type: "number" },
          { field: "avgCostUSD", val: String(draft.avgCostUSD ?? h.avgCostUSD), type: "number" },
          { field: "currentNAVUSD", val: String(draft.currentNAVUSD ?? h.currentNAVUSD), type: "number" },
          { field: "purchaseDate", val: String(draft.purchaseDate ?? h.purchaseDate), type: "date" },
        ].map(({ field, val, type, wide }) => (
          <td key={field} className={`px-3 py-1.5 ${wide ? "min-w-[160px]" : ""}`}>
            <input
              type={type ?? "text"}
              value={val}
              onChange={(e) => setDraft((d) => ({
                ...d,
                [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
              }))}
              className="w-full rounded border border-primary/40 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </td>
        ))}
        <td className="px-3 py-1.5 text-right" colSpan={4}>
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="gain" onClick={save}><CheckCircle2 className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft({}); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
      <td className="px-4 py-3">
        <p className="text-xs font-semibold leading-tight">{h.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{h.amc}</p>
        {h.notes && <p className="text-[9px] text-muted-foreground/60 italic mt-0.5">{h.notes}</p>}
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{h.symbol}</td>
      <td className="px-3 py-3 text-right text-xs font-mono">{h.quantity.toLocaleString()}</td>
      <td className="px-3 py-3 text-right text-xs">
        <p className="font-mono">${h.avgCostUSD}</p>
        <p className="text-[10px] text-muted-foreground">${h.currentNAVUSD} now</p>
      </td>
      <td className="px-3 py-3 text-right text-xs font-medium">{formatINR(metrics.valueINR)}</td>
      <td className="px-3 py-3 text-right text-xs">
        <p className={`font-semibold ${metrics.isLoss ? "text-rose-400" : "text-emerald-400"}`}>
          {metrics.isLoss ? "" : "+"}{formatINR(metrics.pnlINR)}
        </p>
        <p className={`text-[10px] ${metrics.isLoss ? "text-rose-400/70" : "text-emerald-400/70"}`}>
          {metrics.pnlPercent >= 0 ? "+" : ""}{metrics.pnlPercent.toFixed(1)}%
        </p>
      </td>
      <td className="px-3 py-3 text-right text-xs">
        <p className="font-mono text-muted-foreground">{metrics.holdingDays}d</p>
        {!metrics.isLTCG && metrics.daysToLTCG > 0 && (
          <p className="text-[10px] text-amber-400">{metrics.daysToLTCG}d to LTCG</p>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        <Badge variant={typeVariants[metrics.type] ?? "outline"} className="text-[9px]">
          {metrics.type}
        </Badge>
      </td>
      <td className="px-3 py-3 text-right text-xs">
        <p className={`font-semibold font-mono ${metrics.postTaxXIRR >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {metrics.postTaxXIRR.toFixed(1)}%
        </p>
        {metrics.ltcgXIRR !== null && (
          <p className="text-[9px] text-blue-400">
            {metrics.ltcgXIRR.toFixed(1)}% if wait
          </p>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary p-1 rounded">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(h.id)} className="text-muted-foreground hover:text-rose-400 p-1 rounded">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Add Holding Form ──────────────────────────────────────────────────────
function AddHoldingForm({ onAdd, onClose }: { onAdd: (h: Omit<Holding, "id">) => void; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const applyTemplate = (name: string) => {
    const f = COMMON_FUNDS.find((f) => f.name === name);
    if (f) setForm((prev) => ({ ...prev, name: f.name, symbol: f.symbol, amc: f.amc }));
    setSelectedTemplate(name);
  };

  const submit = () => {
    if (!form.name || !form.quantity || !form.avgCostUSD || !form.currentNAVUSD || !form.purchaseDate) return;
    onAdd({
      name: form.name,
      symbol: form.symbol || form.name.split(" ").map((w) => w[0]).join("").toUpperCase(),
      amc: form.amc,
      quantity: parseFloat(form.quantity),
      avgCostUSD: parseFloat(form.avgCostUSD),
      currentNAVUSD: parseFloat(form.currentNAVUSD),
      purchaseDate: form.purchaseDate,
      isGiftCity: true,
      currency: "USD",
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Add New Holding</p>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>

      {/* Template picker */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1.5">Quick fill from IFSC fund template</label>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_FUNDS.slice(0, 6).map((f) => (
            <button
              key={f.name}
              onClick={() => applyTemplate(f.name)}
              className={`rounded-lg border px-2 py-1 text-[9px] font-medium transition-all ${
                selectedTemplate === f.name
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {f.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Fund Name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} wide />
        <FormField label="Symbol" value={form.symbol} onChange={(v) => setForm((f) => ({ ...f, symbol: v }))} />
        <FormField label="AMC / Issuer" value={form.amc} onChange={(v) => setForm((f) => ({ ...f, amc: v }))} />
        <FormField label="Units / Quantity *" type="number" value={form.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} />
        <FormField label="Avg Cost Price (USD) *" type="number" value={form.avgCostUSD} onChange={(v) => setForm((f) => ({ ...f, avgCostUSD: v }))} />
        <FormField label="Current NAV (USD) *" type="number" value={form.currentNAVUSD} onChange={(v) => setForm((f) => ({ ...f, currentNAVUSD: v }))} />
        <FormField label="Purchase Date *" type="date" value={form.purchaseDate} onChange={(v) => setForm((f) => ({ ...f, purchaseDate: v }))} />
        <FormField label="Notes (optional)" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={submit} size="sm" className="flex-1">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Holding
        </Button>
        <Button onClick={onClose} variant="ghost" size="sm">Cancel</Button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", wide }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

// ─── Profile Editor ────────────────────────────────────────────────────────
function ProfileEditor({ profile, onSave }: { profile: InvestorProfile; onSave: (p: InvestorProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Investor Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="rounded border border-border bg-background px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Income Bracket</label>
            <select
              value={draft.incomeBracket}
              onChange={(e) => setDraft((d) => ({ ...d, incomeBracket: e.target.value as InvestorProfile["incomeBracket"] }))}
              className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {INCOME_BRACKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Tax Regime</label>
            <div className="flex gap-1">
              {(["old", "new"] as const).map((r) => (
                <button key={r} onClick={() => setDraft((d) => ({ ...d, taxRegime: r }))}
                  className={`rounded border px-3 py-1 text-[10px] font-medium transition-all ${
                    draft.taxRegime === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >{r === "old" ? "Old Regime" : "New Regime"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Exchange Rate (₹/$)</label>
            <input
              type="number"
              value={draft.exchangeRate}
              onChange={(e) => setDraft((d) => ({ ...d, exchangeRate: parseFloat(e.target.value) || 83.5 }))}
              className="rounded border border-border bg-background px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button size="sm" onClick={() => onSave(draft)} className="mt-4">Save Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { holdings, profile, addHolding, updateHolding, removeHolding, setProfile, loadSample, clearAll } = usePortfolio();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const xr = profile.exchangeRate;
  const allMetrics = holdings.map((h) => ({ h, m: getHoldingMetrics(h, xr) }));

  const totalValue    = allMetrics.reduce((s, { m }) => s + m.valueINR, 0);
  const totalCost     = allMetrics.reduce((s, { m }) => s + m.costINR, 0);
  const totalPnL      = totalValue - totalCost;
  const gainPositions = allMetrics.filter(({ m }) => !m.isLoss);
  const lossPositions = allMetrics.filter(({ m }) => m.isLoss);
  const ltcgPositions = allMetrics.filter(({ m }) => m.isLTCG && !m.isLoss);
  const stcgPositions = allMetrics.filter(({ m }) => !m.isLTCG && !m.isLoss);
  const harvestableLoss = lossPositions.reduce((s, { m }) => s + Math.abs(m.pnlINR), 0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile.name} · {holdings.length} holdings · data saved locally
            <span className="ml-2 text-[10px] text-blue-400">
              (→ replace with broker API later — single line change)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowProfile(!showProfile)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Profile
          </Button>
          <Button variant="outline" size="sm" onClick={loadSample}>
            <Database className="h-3.5 w-3.5 mr-1.5" /> Load sample data
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-rose-400">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add holding
          </Button>
        </div>
      </div>

      {/* Profile editor */}
      {showProfile && (
        <ProfileEditor profile={profile} onSave={(p) => { setProfile(p); setShowProfile(false); }} />
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-3">
        <KPI label="Portfolio Value" value={formatINR(totalValue)} sub={formatUSD(totalValue / xr)} color="text-foreground" />
        <KPI label="Total P&L"
          value={`${totalPnL >= 0 ? "+" : ""}${formatINR(totalPnL)}`}
          sub={`${((totalPnL / totalCost) * 100).toFixed(1)}% return`}
          color={totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <KPI label="Harvestable Losses" value={formatINR(harvestableLoss)} sub={`${lossPositions.length} positions`} color="text-rose-400" />
        <KPI label="LTCG Positions" value={`${ltcgPositions.length}`} sub="Held >730 days · 14.95% rate" color="text-emerald-400" />
        <KPI label="STCG Positions" value={`${stcgPositions.length}`} sub="Held ≤730 days · 42.74% rate" color="text-yellow-400" />
      </div>

      {/* What is post-tax XIRR banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] space-y-0.5">
          <p className="font-semibold text-blue-400">Post-Tax XIRR — the number that actually matters</p>
          <p className="text-muted-foreground">
            Post-Tax XIRR = annualised return after paying the applicable capital gains tax (42.74% STCG or 14.95% LTCG) if sold today.
            A position with 18% gross XIRR becomes <span className="text-yellow-400">10.4% post-tax (STCG)</span> but <span className="text-emerald-400">15.3% post-tax (LTCG after 6 more months)</span>.
            <span className="text-blue-400"> &quot;If wait&quot;</span> shows the post-tax XIRR assuming you hold to the LTCG threshold.
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddHoldingForm onAdd={(h) => { addHolding(h); setShowAddForm(false); }} onClose={() => setShowAddForm(false)} />
      )}

      {/* Holdings table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Fund", "Symbol", "Qty", "Cost / NAV (USD)", "Value (INR)", "Unrealized P&L", "Held", "Type", "Post-Tax XIRR", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <Database className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No holdings yet</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={loadSample} variant="outline">Load sample data</Button>
                          <Button size="sm" onClick={() => setShowAddForm(true)}>Add first holding</Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  holdings.map((h) => (
                    <HoldingRow key={h.id} h={h} profile={profile} onUpdate={updateHolding} onDelete={removeHolding} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Future integration banner */}
      <div className="rounded-xl border border-dashed border-border p-4 flex items-center gap-4">
        <Zap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Ready for real portfolio integration</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            When you connect broker/AMC APIs, change one line in{" "}
            <code className="text-blue-400">lib/portfolio-store.ts</code>:{" "}
            <code className="text-emerald-400">export const portfolioStore = apiSource</code>.
            All pages (Dashboard, TLH Engine, Calculator, AI Chat) instantly use live data.
          </p>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-base font-bold mt-1 ${color}`}>{value}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
