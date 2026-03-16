import Link from "next/link";
import {
  ArrowRight, BadgePercent, Calculator, Map, Shield,
  UserCheck, TrendingUp, BookOpen, Zap, CheckCircle2,
  ChevronRight, Newspaper,
} from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";

/* ── Calculator cards ── */
const CALCULATORS = [
  {
    href: "/calculators/net-returns",
    icon: TrendingUp,
    label: "Net Returns",
    tag: "Flagship",
    tagColor: "#05A049",
    desc: "The closing argument. Compare Direct vs Valura after every tax drag — TCS, dividend WHT, estate tax — compounded over 30 years.",
    color: "#05A049",
    bg: "#EDFAF3",
    border: "#B4E3C8",
  },
  {
    href: "/calculators/lrs-tcs",
    icon: BadgePercent,
    label: "LRS & TCS",
    tag: "TCS optimizer",
    tagColor: "#05A049",
    desc: "20% TCS on remittances above ₹10L per PAN. Optimize across family members and use advance tax to collapse the lock-up from months to weeks.",
    color: "#05A049",
    bg: "#F0FAF5",
    border: "#D1F0E1",
  },
  {
    href: "/calculators/capital-gains",
    icon: Calculator,
    label: "Capital Gains",
    tag: "730-day rule",
    tagColor: "#00111B",
    desc: "LTCG 14.95% max vs STCG up to 42.74%. The surcharge cap for LTCG saves HNIs lakhs. Find your exact break-even day.",
    color: "#00111B",
    bg: "#F9FAFB",
    border: "#E5E7EB",
  },
  {
    href: "/calculators/estate-tax",
    icon: Shield,
    label: "US Estate Tax",
    tag: "NRA rules",
    tagColor: "#7A2020",
    desc: "Indian investors buying US stocks directly face up to 40% IRS estate tax above $60K. GIFT City IFSC units are $0. Run your numbers.",
    color: "#7A2020",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  {
    href: "/calculators/dtaa",
    icon: Map,
    label: "DTAA / FTC",
    tag: "Form 67",
    tagColor: "#B8913A",
    desc: "Resident Indians: claim Foreign Tax Credit to stop paying 55% on US dividends. NRIs: understand why GIFT City makes DTAA irrelevant.",
    color: "#B8913A",
    bg: "#FFFBF0",
    border: "#E8C97A",
  },
  {
    href: "/calculators/nri-status",
    icon: UserCheck,
    label: "NRI Status",
    tag: "Section 6",
    tagColor: "#2B4A8A",
    desc: "Are you NRI, RNOR, or ROR? Runs the full Section 6 logic. Discover if you're in the RNOR golden window before it closes.",
    color: "#2B4A8A",
    bg: "#EFF4FF",
    border: "#C7D7F8",
  },
];

const PROBLEMS = [
  {
    icon: BadgePercent,
    stat: "Up to ₹1 Cr+",
    label: "TCS locked per ₹5 Cr remittance",
    desc: "20% is deducted before your money ever reaches your account. It returns via ITR — but only after 9–18 months of compounding opportunity cost.",
    fix: "Family LRS optimization + advance tax offset",
    fixColor: "#05A049",
  },
  {
    icon: Shield,
    stat: "Up to 40%",
    label: "US estate tax for NRAs above $60K",
    desc: "Every Indian holding Apple, an S&P 500 ETF, or any US stock directly is a Non-Resident Alien under IRS rules. Their $60K exemption, not $13.6M.",
    fix: "IFSC fund units are not US-situs assets — $0 estate tax",
    fixColor: "#05A049",
  },
  {
    icon: Map,
    stat: "25% vs 15%",
    label: "Dividend WHT: direct US stocks vs UCITS route",
    desc: "Buy Apple directly: IRS withholds 25% on every dividend. Via an Ireland UCITS ETF through Valura: 15% under India-Ireland DTAA. Every single year.",
    fix: "10 percentage points saved on every dividend payment",
    fixColor: "#05A049",
  },
];

export default function HomePage() {
  const featuredPosts = BLOG_POSTS.slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{ background: "#00111B" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16">

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(5,160,73,0.2)", color: "#05A049" }}>
              Finance Act 2025 · FY 2025-26
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
              GIFT City · IFSC
            </span>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
              Free to use
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white mb-4"
            style={{ fontFamily: "var(--font-bricolage)" }}>
            India&apos;s sharpest tax calculators
            <span style={{ color: "#05A049" }}> for GIFT City investors</span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mb-8 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Six precision calculators covering LRS, capital gains, US estate tax, DTAA, NRI residency, and full net returns — built for Indian HNIs who invest globally.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link href="/calculators/net-returns"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold transition-all hover:opacity-90"
              style={{ background: "#05A049", color: "#fff", boxShadow: "0 4px 16px rgba(5,160,73,0.35)" }}>
              Start calculating <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="/signup"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              Open Valura Account
            </a>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { value: "₹0", label: "TCS via family optimization" },
              { value: "$0", label: "US estate tax via GIFT City" },
              { value: "14.95%", label: "max LTCG effective rate" },
              { value: "6", label: "free precision calculators" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-4 py-2.5 flex items-baseline gap-2"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="text-lg font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#05A049" }}>{s.value}</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALCULATORS GRID
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: "#FFFFFC" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#05A049" }}>The tools</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              Six calculators. Every angle covered.
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl">
              Each calculator is built on hard-coded Finance Act 2025 tax rules — no generic AI estimates, no approximations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CALCULATORS.map((c) => (
              <Link key={c.href} href={c.href}
                className="group rounded-2xl p-5 flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "#fff", border: `1px solid ${c.border}` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: c.bg }}>
                    <c.icon className="h-5 w-5" style={{ color: c.color }} />
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                    style={{ background: `${c.tagColor}15`, color: c.tagColor }}>
                    {c.tag}
                  </span>
                </div>
                <p className="text-sm font-bold mb-1.5" style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  {c.label}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed flex-1">{c.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                  style={{ color: c.color }}>
                  Open calculator <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/calculators/docs"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-gray-100"
              style={{ background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" }}>
              <BookOpen className="h-4 w-4" />
              Read the calculator guide with worked examples
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROBLEM → GIFT CITY SOLUTION
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: "#00111B" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(180,227,200,0.5)" }}>The problem</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
              Direct investment has hidden costs<br className="hidden sm:block" /> you&apos;re not seeing
            </h2>
            <p className="mt-2 text-sm max-w-xl" style={{ color: "rgba(255,255,255,0.4)" }}>
              IBKR, Vested, and INDmoney give you market access. They don&apos;t optimize your Indian tax. Three drags compound silently over decades.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {PROBLEMS.map((p) => (
              <div key={p.label} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-2xl font-extrabold mb-1" style={{ fontFamily: "var(--font-bricolage)", color: "#DC2626" }}>
                  {p.stat}
                </p>
                <p className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{p.label}</p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>{p.desc}</p>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#B4E3C8" }}>{p.fix}</p>
                </div>
              </div>
            ))}
          </div>

          {/* GIFT City advantages */}
          <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(5,160,73,0.08)", border: "1px solid rgba(5,160,73,0.2)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(5,160,73,0.2)" }}>
                    <Zap className="h-4 w-4" style={{ color: "#05A049" }} />
                  </div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-manrope)" }}>
                    Valura GIFT City IFSC eliminates all three
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    "Family LRS optimization → TCS = ₹0",
                    "IFSC units not US-situs → Estate tax = $0",
                    "Ireland UCITS route → Dividend WHT = 15%",
                    "LTCG surcharge capped at 15%",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#B4E3C8" }}>
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05A049" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/calculators/net-returns"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition-all hover:opacity-90 whitespace-nowrap"
                style={{ background: "#05A049", color: "#fff" }}>
                See the numbers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOG PREVIEW
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-20" style={{ background: "#FFFFFC" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#05A049" }}>Knowledge base</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
                Understand the rules before you optimize
              </h2>
            </div>
            <Link href="/blog"
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "#05A049" }}>
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featuredPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
                {/* Color header */}
                <div className="h-2" style={{ background: post.accentColor }} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                      style={{ background: `${post.accentColor}15`, color: post.accentColor }}>
                      {post.category}
                    </span>
                    <span className="text-[10px] text-gray-400">{post.readTime} min read</span>
                  </div>
                  <h3 className="text-sm font-bold leading-snug mb-2"
                    style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all"
                    style={{ color: post.accentColor }}>
                    Read article <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════ */}
      <section style={{ background: "#00111B" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-14 sm:py-20">
          <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(5,160,73,0.4)" }}>
            <div className="px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              style={{ background: "rgba(5,160,73,0.06)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(180,227,200,0.5)" }}>
                  Ready to invest smarter
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-white mb-2"
                  style={{ fontFamily: "var(--font-bricolage)" }}>
                  Open your Valura GIFT City account
                </p>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Zero TCS. Zero estate tax. Ireland UCITS ETF access. IFSCA regulated.
                </p>
                <div className="flex flex-wrap gap-4">
                  {["Zero TCS via family optimization", "$0 US estate tax", "15% dividend WHT", "LTCG capped at 14.95%"].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#B4E3C8" }}>
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#05A049" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <a href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ background: "#05A049", color: "#fff", boxShadow: "0 4px 16px rgba(5,160,73,0.35)" }}>
                  Open Account in 10 Minutes <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/calculators/net-returns"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Run your numbers first
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="py-4 text-center" style={{ background: "#00111B" }}>
        <p className="text-[9px] px-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          All calculators are illustrative only. Tax rates per Finance Act 2025, FY 2025-26. Consult your CA and financial advisor before making investment or tax decisions.
        </p>
      </div>
    </div>
  );
}
