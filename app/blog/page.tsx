import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, Newspaper } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";

const CATEGORIES = ["All", "Fundamentals", "Estate Planning", "TCS Strategy", "NRI Planning"];

export default function BlogPage() {
  const featured = BLOG_POSTS[0];
  const rest     = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Header ── */}
      <div className="border-b px-4 sm:px-6 md:px-8 py-6" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ background: "rgba(5,160,73,0.1)", color: "#05A049" }}>
                Knowledge Base
              </span>
              <span className="text-[10px] text-gray-400">GIFT City · IFSC · Tax strategy · FY 2025-26</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight"
              style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
              GIFT City Investment Blog
            </h1>
            <p className="mt-1 text-sm text-gray-500 max-w-lg">
              Substantive guides on LRS, TCS, estate tax, DTAA, and NRI residency — written for investors who want to understand the rules, not just follow them.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-400">{BLOG_POSTS.length} articles · updated FY 2025-26</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10">

        {/* ── Featured article ── */}
        <Link href={`/blog/${featured.slug}`}
          className="group block rounded-2xl overflow-hidden mb-10 transition-all hover:shadow-xl hover:-translate-y-0.5"
          style={{ border: "2px solid #E5E7EB", background: "#fff" }}>
          <div className="h-1.5" style={{ background: featured.accentColor }} />
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: `${featured.accentColor}18`, color: featured.accentColor }}>
                  {featured.category}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {featured.readTime} min read
                </span>
                <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
                  style={{ background: "#EDFAF3", color: "#05A049" }}>Featured</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight mb-2"
                style={{ fontFamily: "var(--font-bricolage)", color: "#00111B" }}>
                {featured.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-2xl">{featured.excerpt}</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold group-hover:gap-3 transition-all"
                style={{ color: featured.accentColor }}>
                Read full article <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 text-right">
              <p className="text-[10px] text-gray-400">{featured.date}</p>
              <p className="text-[10px] text-gray-400">by {featured.author}</p>
            </div>
          </div>
        </Link>

        {/* ── Category pills (decorative for now) ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <span key={c}
              className="rounded-full px-3 py-1 text-xs font-semibold cursor-default"
              style={{
                background: c === "All" ? "#00111B" : "#F3F4F6",
                color: c === "All" ? "#fff" : "#374151",
                border: "1px solid transparent",
              }}>
              {c}
            </span>
          ))}
        </div>

        {/* ── Articles grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
              <div className="h-1" style={{ background: post.accentColor }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5"
                    style={{ background: `${post.accentColor}15`, color: post.accentColor }}>
                    {post.category}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readTime} min
                  </span>
                </div>
                <h3 className="text-sm font-bold leading-snug mb-2"
                  style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                  {post.title}
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{post.date}</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold group-hover:gap-1 transition-all"
                    style={{ color: post.accentColor }}>
                    Read <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Related calculators strip ── */}
        <div className="mt-14 rounded-2xl p-6 sm:p-8" style={{ background: "#00111B" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(180,227,200,0.5)" }}>
                Put the knowledge to work
              </p>
              <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
                Run the numbers yourself — free calculators
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Net Returns", desc: "Direct vs Valura · flagship", href: "/calculators/net-returns" },
              { label: "LRS & TCS",   desc: "Minimize remittance TCS",     href: "/calculators/lrs-tcs" },
              { label: "Estate Tax",  desc: "US NRA exposure calculator",  href: "/calculators/estate-tax" },
              { label: "DTAA / FTC",  desc: "Foreign tax credit calculator",href: "/calculators/dtaa" },
              { label: "Capital Gains",desc: "730-day LTCG optimizer",     href: "/calculators/capital-gains" },
              { label: "NRI Status",  desc: "NRI / RNOR / ROR checker",    href: "/calculators/nri-status" },
            ].map((c) => (
              <Link key={c.href} href={c.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-xs font-semibold text-white">{c.label}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{c.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
              </Link>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-center mt-6 pb-4" style={{ color: "#9CA3AF" }}>
          All content is educational only. Tax rules per Finance Act 2025. Consult your CA before making investment or tax decisions.
        </p>
      </div>
    </div>
  );
}
