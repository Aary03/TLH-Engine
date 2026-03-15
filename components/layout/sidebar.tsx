"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Scissors,
  Calculator,
  MessageSquare,
  Globe,
  Zap,
  FolderOpen,
  BadgePercent,
  ChevronRight,
  Sparkles,
  Map,
  BookOpen,
  Shield,
  UserCheck,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Portfolio overview" },
      { href: "/portfolio", label: "Portfolio", icon: FolderOpen, desc: "Holdings · Post-Tax XIRR" },
    ],
  },
  {
    label: "Calculators",
    items: [
      { href: "/calculators/net-returns",    label: "Net Returns",   icon: TrendingUp,   desc: "Direct vs Valura · flagship", badge: "New" },
      { href: "/calculators/lrs-tcs",        label: "LRS & TCS",     icon: BadgePercent, desc: "Minimize remittance TCS" },
      { href: "/calculators/capital-gains",  label: "Capital Gains", icon: Calculator,   desc: "STCG / LTCG + 730-day rule" },
      { href: "/calculators/dtaa",           label: "DTAA / FTC",    icon: Map,          desc: "NRI double-tax relief" },
      { href: "/calculators/estate-tax",     label: "Estate Tax",    icon: Shield,       desc: "US NRA exposure" },
      { href: "/calculators/nri-status",     label: "NRI Status",    icon: UserCheck,    desc: "NRI / RNOR / ROR check" },
      { href: "/calculators/docs",           label: "Calc Guide",    icon: BookOpen,     desc: "Examples & formulas" },
      { href: "/lrs",                        label: "LRS Tracker",   icon: Globe,        desc: "Family remittance tracker" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/tlh",  label: "TLH Engine", icon: Scissors,       desc: "Tax-loss harvesting", badge: "4 found" },
      { href: "/chat", label: "AI Advisor",  icon: MessageSquare,  desc: "GPT-4o + 6 tools" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: "rgba(5,160,73,0.2)" }}>
          <Zap className="h-4 w-4" style={{ color: "#05A049" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none tracking-tight"
            style={{ fontFamily: "var(--font-bricolage)", color: "#FFFFFC" }}>Valura</p>
          <p className="mt-0.5 text-[10px]" style={{ color: "rgba(180,227,200,0.7)" }}>GIFT City · IFSC</p>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(180,227,200,0.45)" }}>
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                      isActive ? "text-white" : "text-white/50 hover:text-white/80"
                    )}
                    style={isActive
                      ? { background: "rgba(5,160,73,0.18)", borderLeft: "2px solid #05A049" }
                      : { borderLeft: "2px solid transparent" }}>
                    <Icon className="h-4 w-4 flex-shrink-0"
                      style={{ color: isActive ? "#05A049" : "rgba(255,255,255,0.4)" }} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium leading-none text-[13px]", isActive ? "text-white" : "text-white/60")}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {item.desc}
                      </p>
                    </div>
                    {item.badge && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold flex-shrink-0"
                        style={item.badge === "New"
                          ? { background: "rgba(5,160,73,0.25)", color: "#05A049" }
                          : { background: "rgba(220,38,38,0.2)", color: "#F87171" }}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: "#05A049" }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="rounded-lg p-3" style={{ background: "rgba(5,160,73,0.1)", border: "1px solid rgba(5,160,73,0.2)" }}>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#05A049] animate-pulse" />
            <p className="text-[11px] font-semibold" style={{ color: "#05A049" }}>FY 2025-26</p>
          </div>
          <p className="mt-1 text-[10px]" style={{ color: "rgba(180,227,200,0.55)" }}>
            Finance Act 2025 rates active
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 px-1">
          <Sparkles className="h-3 w-3" style={{ color: "rgba(184,145,58,0.7)" }} />
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Illustrative only. Consult your CA.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ══════════════════════════════════════
          MOBILE TOP BAR (hidden on md+)
      ══════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 md:hidden"
        style={{ background: "#00111B", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
          className="h-9 w-9 flex items-center justify-center rounded-xl mr-3 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <Menu className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "rgba(5,160,73,0.2)" }}>
            <Zap className="h-3.5 w-3.5" style={{ color: "#05A049" }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate"
              style={{ fontFamily: "var(--font-bricolage)", color: "#FFFFFC" }}>Valura</p>
            <p className="text-[9px] truncate" style={{ color: "rgba(180,227,200,0.6)" }}>GIFT City · IFSC</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          <span className="text-[9px] font-bold rounded-full px-2 py-1"
            style={{ background: "rgba(5,160,73,0.18)", color: "#05A049" }}>FY 2025-26</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BACKDROP
      ══════════════════════════════════════ */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} />

      {/* ══════════════════════════════════════
          SIDEBAR PANEL
      ══════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-[240px] flex-shrink-0 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          // Mobile: slide in/out. Desktop: always visible.
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: "#00111B" }}>
        {sidebarContent}
      </aside>
    </>
  );
}
