"use client";

import { useState, useEffect } from "react";
import {
  FileText, FileSpreadsheet, FileCheck2, Layers, TrendingUp, Banknote,
  Download, DownloadCloud, CheckCircle2, Calendar, Video, ArrowRight,
  ShieldCheck, Sparkles, Clock, Loader2, ChevronDown, HelpCircle, BookOpen,
  X, Star, Phone, Languages, Check, PartyPopper,
} from "lucide-react";
import { CLIENTS, clientTotals, type Client } from "@/lib/partner/clients";
import { generateDoc, generateAll, type DocType } from "@/lib/partner/generateDocs";

const C = {
  navy: "#00111B", green: "#05A049", greenBg: "#EDFAF3", greenBorder: "#B4E3C8",
  orange: "#E0822E", orangeBg: "#FCEFE0", orangeBorder: "#F0C99A",
  border: "#E5E7EB", muted: "#6b7280", page: "#FFFFFC",
};

interface DocInfo {
  type: DocType; icon: typeof FileText; title: string; desc: string; accent: string;
  whatIs: string; why: string; todo: string[];
}
const DOCS: DocInfo[] = [
  {
    type: "pnl", icon: TrendingUp, title: "Capital Gains — Tax P&L", desc: "Realised STCG / LTCG on every foreign trade, with holding period and ₹ gain.", accent: "#2B4A8A",
    whatIs: "A list of everything you sold this year and the profit or loss you made on each.",
    why: "The government taxes your profits. This shows exactly how much you made — split into short-term (held ≤2 years, taxed higher) and long-term (held >2 years, taxed at 12.5%).",
    todo: [
      "Hand it to your CA, or use the totals yourself.",
      "Put the short-term and long-term gain figures into the 'Capital Gains' section of your tax return.",
      "If you made losses, they can cancel out gains and cut your tax — keep this sheet as proof.",
    ],
  },
  {
    type: "dividend", icon: Banknote, title: "Dividend Report", desc: "Foreign dividends and the 25% US tax withheld — your FTC starting point.", accent: C.green,
    whatIs: "A list of every dividend (company payout) you received, and the tax the US already took out of it.",
    why: "You must declare this income in India. And the US already grabbed 25% of it — you can claim that back so you don't pay tax twice.",
    todo: [
      "Report the total dividend income in your tax return (under 'Income from Other Sources').",
      "Note the 'US tax paid' figure — you'll need it for Form 67 to get that money back.",
    ],
  },
  {
    type: "holdings", icon: Layers, title: "Holdings Statement", desc: "Every current global holding, valued in ₹ — your Schedule FA reference.", accent: C.orange,
    whatIs: "A snapshot of everything you currently own abroad, with each holding's value in rupees.",
    why: "India makes every resident declare all their foreign assets in a section called 'Schedule FA'. Forgetting even one can mean a ₹10 lakh penalty.",
    todo: [
      "Open the 'Schedule FA' section of your tax return.",
      "List each holding from this sheet — name, value, and when you bought it.",
    ],
  },
  {
    type: "fsi", icon: FileText, title: "Schedule FSI", desc: "Foreign source income, pre-formatted for the FSI section of your ITR.", accent: "#7A2020",
    whatIs: "A one-page summary of all the income you earned outside India — your foreign gains and dividends together.",
    why: "Residents must report foreign income in this exact schedule. It also records the foreign tax you paid, which sets up your refund.",
    todo: [
      "Copy these rows straight into the 'Schedule FSI' part of your ITR.",
      "Make sure the 'tax paid outside India' column matches your Form 67.",
    ],
  },
  {
    type: "tr", icon: FileCheck2, title: "Schedule TR", desc: "Summary of foreign tax paid and the relief you can claim.", accent: "#B8913A",
    whatIs: "A short summary of the total foreign tax you paid and the credit (relief) you're allowed to claim back.",
    why: "It's the 'relief' figure that tells the tax department to reduce your bill so you aren't taxed twice on the same income.",
    todo: [
      "Enter the relief amount in the 'Schedule TR' section of your return.",
      "It links to Schedule FSI — keep both together when filing.",
    ],
  },
  {
    type: "form67", icon: FileSpreadsheet, title: "Form 67 (FTC)", desc: "Foreign Tax Credit application — file before your return to avoid double tax.", accent: C.green,
    whatIs: "The official form that actually claims back the foreign tax you already paid (the 25% the US withheld).",
    why: "Without this form, India won't give you credit for the US tax — so you'd end up paying tax on the same money twice. It must be filed BEFORE your tax return.",
    todo: [
      "Log in to the income-tax website and file Form 67 online — before you file your ITR.",
      "Attach your US '1042-S' statement as proof of the tax already paid.",
      "Once accepted, the credit reduces your Indian tax bill.",
    ],
  },
];

interface CA { id: string; name: string; initials: string; exp: string; specialty: string[]; langs: string; rating: number; reviews: number; slots: string[]; }
const CAS: CA[] = [
  { id: "anjali", name: "CA Anjali Rao", initials: "AR", exp: "12 yrs", specialty: ["Foreign assets", "Form 67", "Schedule FA"], langs: "English · Hindi", rating: 4.9, reviews: 218, slots: ["Tomorrow · 11:00 AM", "Tomorrow · 3:30 PM", "Thu · 10:00 AM"] },
  { id: "vikram", name: "CA Vikram Shah", initials: "VS", exp: "15 yrs", specialty: ["HNI returns", "Estate planning", "DTAA"], langs: "English · Gujarati", rating: 4.8, reviews: 341, slots: ["Thu · 4:30 PM", "Fri · 12:00 PM", "Sat · 11:00 AM"] },
  { id: "meera", name: "CA Meera Iyer", initials: "MI", exp: "9 yrs", specialty: ["NRI taxation", "Capital gains", "Tax-loss harvesting"], langs: "English · Tamil", rating: 5.0, reviews: 156, slots: ["Tomorrow · 5:00 PM", "Fri · 9:30 AM", "Mon · 2:00 PM"] },
];

const STEPS = [
  { t: "Download your 6 documents", d: "One click below generates every co-branded statement your CA needs — already in the ITR format." },
  { t: "Declare holdings in Schedule FA", d: "Use the Holdings Statement to list each foreign asset. Mandatory for residents — ₹10L/yr penalty if missed." },
  { t: "Report income in Schedule FSI", d: "Enter your foreign capital gains and dividends from the pre-filled FSI sheet." },
  { t: "Claim your credit with Form 67", d: "File Form 67 before your ITR to recover the 25% US tax already withheld — no double taxation." },
  { t: "File your ITR-2 / ITR-3", d: "Attach Schedule TR for the relief total, then file before 31 July to keep loss carry-forward." },
];

export default function PartnerPage() {
  const [client, setClient] = useState<Client>(CLIENTS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const t = clientTotals(client);

  const dl = async (type: DocType) => {
    setBusy(type);
    try { await generateDoc(client, type); } finally { setBusy(null); }
  };
  const dlAll = async () => {
    setBusy("all");
    try { await generateAll(client); } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen" style={{ background: C.page }}>
      {/* Co-branded hero */}
      <section style={{ background: C.navy }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-9 pb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl font-extrabold italic" style={{ fontFamily: "var(--font-bricolage)", color: C.orange }}>Voguestock</span>
            <span className="text-xl font-light text-white/40">×</span>
            <span className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
            <span className="ml-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(5,160,73,0.18)", color: "#7BE2A8" }}>Partner tax suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white max-w-2xl" style={{ fontFamily: "var(--font-bricolage)" }}>
            Your clients' global-tax paperwork — done for them.
          </h1>
          <p className="mt-3 text-base max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Pick a client and generate every ITR-ready document — Capital Gains, Dividends, Schedule FSI, TR and Form 67 —
            beautifully co-branded, in one click. Then book them a CA. End-to-end.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
        {/* Client picker */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>1 · Choose a client</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CLIENTS.map((cl) => {
              const active = cl.id === client.id;
              const init = cl.name.split(" ").map((x) => x[0]).join("");
              return (
                <button key={cl.id} onClick={() => setClient(cl)}
                  className="rounded-2xl border p-4 text-left transition-all"
                  style={active
                    ? { background: "#fff", borderColor: C.green, boxShadow: "0 0 0 3px rgba(5,160,73,0.12)" }
                    : { background: "#fff", borderColor: C.border }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                      style={{ background: active ? C.green : "#F1F5F9", color: active ? "#fff" : C.navy }}>{init}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: C.navy }}>{cl.name}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>PAN {cl.pan} · client since {cl.since}</p>
                    </div>
                    {active && <CheckCircle2 className="h-5 w-5 ml-auto flex-shrink-0" style={{ color: C.green }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Client summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Holdings value" value={inr(t.holdingsValueINR)} accent={C.orange} />
          <Stat label="Capital gains (FY)" value={inr(t.capGainsINR)} accent={C.green} />
          <Stat label="Dividends (gross)" value={inr(t.divGrossINR)} accent="#2B4A8A" />
          <Stat label="US tax to reclaim" value={inr(t.usTaxINR)} accent="#7A2020" />
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>2 · Generate co-branded documents</p>
            <button onClick={dlAll} disabled={!!busy}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${C.green}, #028037)` }}>
              {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              Download all 6
            </button>
          </div>
          {/* Plain-English overview of how the 6 fit together */}
          <div className="rounded-2xl border p-4 mb-3" style={{ background: C.greenBg, borderColor: C.greenBorder }}>
            <div className="flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
              <p className="text-[13px] leading-relaxed" style={{ color: "#33514a" }}>
                <b style={{ color: C.navy }}>In plain English: </b>
                Three of these <i>show what happened</i> (what you <b>own</b>, what you <b>sold</b>, and the <b>dividends</b> you got).
                The other three <i>go into your tax return</i> (<b>Schedule FSI</b> reports the foreign income,
                <b> Form 67</b> claims back the US tax, and <b>Schedule TR</b> records that relief).
                Tap <span className="font-semibold" style={{ color: C.green }}>“Why &amp; what to do”</span> on any card to see it step by step.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            {DOCS.map((d) => (
              <DocCard key={d.type} d={d} busy={busy} onDownload={() => dl(d.type)} />
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: C.green }} /> Generated live for <b style={{ color: C.navy }}>&nbsp;{client.name}</b> — co-branded Voguestock × Valura, ITR-formatted, illustrative.
          </p>
        </div>

        {/* Exact steps */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>3 · Exactly what to do next</p>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, background: "#fff" }}>
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border-b last:border-b-0" style={{ borderColor: C.border }}>
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: C.greenBg, color: C.green }}>{i + 1}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: C.navy }}>{s.t}</p>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: C.muted }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CA booking */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>4 · Need a hand? Book a CA — end to end</p>
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: C.greenBorder }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6" style={{ background: C.greenBg }}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-5 w-5" style={{ color: C.green }} />
                  <p className="text-sm font-bold" style={{ color: C.navy }}>Valura CA Desk — for {client.name}</p>
                </div>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#33514a" }}>
                  A vetted chartered accountant reviews these exact documents, files Form 67, and signs off the return.
                  Voguestock clients get priority slots.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Schedule FA review", "Form 67 filing", "ITR-2 / ITR-3", "Estate-tax planning"].map((x) => (
                    <span key={x} className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "#fff", color: C.green, border: `1px solid ${C.greenBorder}` }}>✓ {x}</span>
                  ))}
                </div>
              </div>
              <div className="p-6 flex flex-col justify-center" style={{ background: "#fff" }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Next available</p>
                <div className="space-y-2 mb-4">
                  {[
                    { d: "Tomorrow · 11:00 AM", who: "CA Anjali Rao" },
                    { d: "Thu · 4:30 PM", who: "CA Vikram Shah" },
                  ].map((s) => (
                    <button key={s.d} onClick={() => setBookOpen(true)}
                      className="w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all hover:border-[#05A049]" style={{ borderColor: C.border }}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: C.green }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: C.navy }}>{s.d}</p>
                          <p className="text-[10px]" style={{ color: C.muted }}>{s.who} · 30 min</p>
                        </div>
                      </div>
                      <span className="rounded-full h-2 w-2" style={{ background: C.green }} />
                    </button>
                  ))}
                </div>
                <button onClick={() => setBookOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: C.navy }}>
                  <Video className="h-4 w-4" /> Book a CA meeting <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-2 text-center text-[10px]" style={{ color: C.muted }}>
                  <Calendar className="inline h-3 w-3 mr-0.5" /> Opens the booking flow · video link sent on confirm (placeholder)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* End-to-end banner */}
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: C.orangeBg, border: `1px solid ${C.orangeBorder}` }}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: C.orange }} />
            <p className="text-sm" style={{ color: C.navy }}>
              <b>End-to-end:</b> Voguestock gives your clients the trades — Valura turns them into filed, CA-signed tax returns.
            </p>
          </div>
        </div>
      </div>

      {bookOpen && <BookingModal client={client} onClose={() => setBookOpen(false)} />}
    </div>
  );
}

/* ════════════════ CA booking modal ════════════════ */
function BookingModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [caId, setCaId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<"video" | "phone">("video");
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const ca = CAS.find((x) => x.id === caId);
  const confirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setBooked(true); }, 900); // placeholder
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-fade-up"
        style={{ background: "#fff" }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 border-b"
          style={{ background: "#fff", borderColor: C.border }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold italic" style={{ fontFamily: "var(--font-bricolage)", color: C.orange }}>Voguestock</span>
              <span className="text-xs text-gray-400">×</span>
              <span className="text-sm font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: C.green }}>Valura</span>
              <span className="text-sm font-bold" style={{ color: C.navy }}>· CA Desk</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Booking a consultation for <b style={{ color: C.navy }}>{client.name}</b></p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" style={{ color: C.muted }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {booked ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: C.greenBg }}>
              <PartyPopper className="h-7 w-7" style={{ color: C.green }} />
            </div>
            <p className="text-xl font-extrabold" style={{ color: C.navy, fontFamily: "var(--font-bricolage)" }}>Meeting booked!</p>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: C.muted }}>
              <b style={{ color: C.navy }}>{ca?.name}</b> · {slot} · {mode === "video" ? "Video call" : "Phone call"} (30 min).
              A calendar invite{mode === "video" ? " with a video link" : ""} has been sent to <b style={{ color: C.navy }}>{client.email}</b>.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: C.greenBg, color: C.green }}>
              <Check className="h-3.5 w-3.5" /> The 6 tax documents will be shared with your CA automatically
            </div>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: C.navy }}>Done</button>
              <button onClick={() => { setBooked(false); setCaId(null); setSlot(null); }} className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ color: C.navy, border: `1px solid ${C.border}` }}>Book another</button>
            </div>
            <p className="mt-4 text-[10px]" style={{ color: C.muted }}>Demo placeholder — wire this to Calendly / Cal.com / Google Calendar for the live flow.</p>
          </div>
        ) : (
          <>
            <div className="px-5 sm:px-6 py-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>1 · Pick your chartered accountant</p>
              {CAS.map((c) => {
                const active = c.id === caId;
                return (
                  <button key={c.id} onClick={() => { setCaId(c.id); setSlot(null); }}
                    className="w-full rounded-2xl border p-4 text-left transition-all"
                    style={active ? { borderColor: C.green, boxShadow: "0 0 0 3px rgba(5,160,73,0.12)" } : { borderColor: C.border }}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: active ? C.green : "#F1F5F9", color: active ? "#fff" : C.navy }}>{c.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold" style={{ color: C.navy }}>{c.name}</p>
                          <span className="flex items-center gap-1 text-[11px] font-bold flex-shrink-0" style={{ color: C.navy }}>
                            <Star className="h-3.5 w-3.5" style={{ color: "#F5C451", fill: "#F5C451" }} /> {c.rating}
                            <span className="font-normal" style={{ color: C.muted }}>({c.reviews})</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {c.specialty.map((s) => (
                            <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: C.greenBg, color: "#047857" }}>{s}</span>
                          ))}
                        </div>
                        <p className="flex items-center gap-1.5 text-[11px] mt-1.5" style={{ color: C.muted }}>
                          <Languages className="h-3 w-3" /> {c.langs} · {c.exp} experience
                        </p>
                      </div>
                    </div>

                    {active && (
                      <div className="mt-3 pt-3 border-t animate-fade-in" style={{ borderColor: C.border }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>2 · Pick a time slot</p>
                        <div className="flex flex-wrap gap-2">
                          {c.slots.map((sl) => {
                            const on = sl === slot;
                            return (
                              <span key={sl} onClick={(e) => { e.stopPropagation(); setSlot(sl); }}
                                className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                                style={on ? { background: C.navy, color: "#fff" } : { background: "#F9FAFB", color: C.navy, border: `1px solid ${C.border}` }}>
                                {sl}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-5 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ background: "#fff", borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: C.muted }}>Mode:</span>
                {([["video", Video, "Video"], ["phone", Phone, "Phone"]] as const).map(([m, Icon, label]) => (
                  <button key={m} onClick={() => setMode(m)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                    style={mode === m ? { background: C.navy, color: "#fff" } : { background: "#F9FAFB", color: C.navy, border: `1px solid ${C.border}` }}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
              <button onClick={confirm} disabled={!caId || !slot || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${C.green}, #028037)` }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {ca && slot ? `Confirm · ${slot}` : "Confirm booking"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DocCard({ d, busy, onDownload }: { d: DocInfo; busy: string | null; onDownload: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border p-4 flex flex-col" style={{ background: "#fff", borderColor: C.border }}>
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ background: `${d.accent}12` }}>
          <d.icon className="h-5 w-5" style={{ color: d.accent }} />
        </div>
        <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: "#F1F5F9", color: C.muted }}>.xlsx</span>
      </div>
      <p className="text-sm font-bold" style={{ color: C.navy }}>{d.title}</p>
      <p className="text-[12px] leading-relaxed mt-1" style={{ color: C.muted }}>{d.desc}</p>

      <button onClick={() => setOpen((v) => !v)}
        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold w-fit" style={{ color: d.accent }}>
        <HelpCircle className="h-3.5 w-3.5" /> Why &amp; what to do
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2.5 rounded-xl p-3 animate-fade-in" style={{ background: "#F9FAFB" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>What it is</p>
          <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "#374151" }}>{d.whatIs}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-2.5" style={{ color: C.muted }}>Why you need it</p>
          <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "#374151" }}>{d.why}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-2.5" style={{ color: C.muted }}>What to do with it</p>
          <ol className="mt-1 space-y-1.5">
            {d.todo.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: "#374151" }}>
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold mt-0.5" style={{ background: C.greenBg, color: C.green }}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      <button onClick={onDownload} disabled={!!busy}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-[#F9FAFB] disabled:opacity-60"
        style={{ borderColor: C.border, color: C.navy }}>
        {busy === d.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" style={{ color: d.accent }} />}
        Download Excel
      </button>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "#fff", borderColor: C.border }}>
      <p className="text-[11px]" style={{ color: C.muted }}>{label}</p>
      <p className="text-lg font-extrabold mt-1" style={{ color: accent, fontFamily: "var(--font-bricolage)" }}>{value}</p>
    </div>
  );
}

function inr(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
