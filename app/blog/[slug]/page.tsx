import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, TriangleAlert, Info, ChevronRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFC" }}>

      {/* ── Breadcrumb bar ── */}
      <div className="border-b px-4 sm:px-6 md:px-8 py-3 flex items-center gap-2 text-xs"
        style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-gray-300" />
        <Link href="/blog" className="text-gray-400 hover:text-gray-600 transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3 text-gray-300" />
        <span className="text-gray-600 font-medium truncate max-w-[200px]">{post.category}</span>
      </div>

      {/* ── Article hero ── */}
      <div style={{ background: "#00111B" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-10 sm:pb-12">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: `${post.accentColor}25`, color: post.accentColor }}>
              {post.category}
            </span>
            <span className="text-[10px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Clock className="h-3 w-3" /> {post.readTime} min read
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{post.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-white mb-3"
            style={{ fontFamily: "var(--font-bricolage)" }}>
            {post.title}
          </h1>
          <p className="text-sm sm:text-base leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {post.subtitle}
          </p>
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: post.accentColor }}>V</div>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>by {post.author}</span>
          </div>
        </div>
      </div>

      {/* ── Related calculator CTA ── */}
      {post.relatedCalc && (
        <div className="px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4 max-w-3xl mx-auto my-6">
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-1"
            style={{ background: `${post.accentColor}10`, border: `1px solid ${post.accentColor}30` }}>
            <p className="text-xs" style={{ color: "#374151" }}>
              <strong style={{ color: post.accentColor }}>Related calculator:</strong> Run the numbers from this article live
            </p>
            <Link href={post.relatedCalc.href}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
              style={{ background: post.accentColor, color: "#fff" }}>
              {post.relatedCalc.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Article body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 pb-16">

        {/* Accent rule */}
        <div className="h-0.5 rounded-full mb-8 w-16" style={{ background: post.accentColor }} />

        <div className="space-y-8">
          {post.sections.map((section, i) => {
            if (section.type === "tip") {
              return (
                <div key={i} className="rounded-xl px-5 py-4 flex items-start gap-3"
                  style={{ background: "#FFFBF0", border: "1px solid #E8C97A" }}>
                  <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#B8913A" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{section.body}</p>
                </div>
              );
            }
            if (section.type === "warning") {
              return (
                <div key={i} className="rounded-xl px-5 py-4 flex items-start gap-3"
                  style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{section.body}</p>
                </div>
              );
            }
            if (section.type === "callout") {
              return (
                <div key={i} className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${post.accentColor}30` }}>
                  <div className="px-5 py-3 flex items-center gap-2"
                    style={{ background: `${post.accentColor}12` }}>
                    <Info className="h-4 w-4 flex-shrink-0" style={{ color: post.accentColor }} />
                    <p className="text-xs font-bold" style={{ color: post.accentColor }}>
                      {section.calloutTitle ?? "Key insight"}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{section.body}</p>
                  </div>
                </div>
              );
            }
            // Default: text section
            return (
              <div key={i}>
                {section.heading && (
                  <h2 className="text-lg font-bold mb-3"
                    style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                    {section.heading}
                  </h2>
                )}
                <p className="text-sm leading-relaxed" style={{ color: "#374151", lineHeight: "1.85" }}>
                  {section.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Bottom CTA ── */}
        {post.relatedCalc && (
          <div className="mt-12 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ background: "#00111B", border: `1px solid ${post.accentColor}30` }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "rgba(180,227,200,0.5)" }}>Put this into practice</p>
              <p className="text-base font-extrabold text-white mb-1"
                style={{ fontFamily: "var(--font-bricolage)" }}>
                Run the numbers from this article
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                The {post.relatedCalc.label} shows the exact calculations described above with your numbers.
              </p>
            </div>
            <Link href={post.relatedCalc.href}
              className="flex-shrink-0 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ background: post.accentColor, color: "#fff" }}>
              Open {post.relatedCalc.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ── Back to blog + other articles ── */}
        <div className="mt-10 pt-8 border-t" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between mb-6">
            <Link href="/blog"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" /> All articles
            </Link>
          </div>
          {others.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>
                More from the knowledge base
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {others.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}
                    className="group rounded-xl overflow-hidden transition-all hover:shadow-md"
                    style={{ border: "1px solid #E5E7EB", background: "#fff" }}>
                    <div className="h-0.5" style={{ background: p.accentColor }} />
                    <div className="p-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 mb-2 inline-block"
                        style={{ background: `${p.accentColor}15`, color: p.accentColor }}>
                        {p.category}
                      </span>
                      <h3 className="text-xs font-bold leading-snug mb-1"
                        style={{ fontFamily: "var(--font-manrope)", color: "#00111B" }}>
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] font-semibold group-hover:gap-2 transition-all mt-2"
                        style={{ color: p.accentColor }}>
                        Read <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <p className="text-[10px] text-center mt-8" style={{ color: "#9CA3AF" }}>
            Content is educational only. Tax rules per Finance Act 2025. Consult your CA before making investment or tax decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
