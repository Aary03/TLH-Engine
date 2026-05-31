"use client";

import { usePathname } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { JargonToggle, useJargon } from "@/components/answers/JargonContext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { GLOSSARY } from "@/lib/glossary";

interface CalcConfig { plain: string; terms: string[]; }

const CONFIG: Record<string, CalcConfig> = {
  "/calculators/net-returns": {
    plain: "See how much money you actually keep after every tax and fee — direct investing vs through GIFT City, compounded over the years.",
    terms: ["net returns", "TCS", "WHT", "estate tax"],
  },
  "/calculators/lrs-tcs": {
    plain: "Find out how much tax is taken upfront when you send money abroad — and how to legally keep it as low as possible.",
    terms: ["LRS", "TCS"],
  },
  "/calculators/capital-gains": {
    plain: "Work out the tax you'll pay when you sell — and exactly how much holding past the 2-year mark saves you.",
    terms: ["STCG", "LTCG", "730-day", "surcharge", "cess"],
  },
  "/calculators/dtaa": {
    plain: "Check how the India-US treaty stops you being taxed twice on the same income — and what you must file to claim it.",
    terms: ["DTAA", "FTC", "WHT", "Form 67"],
  },
  "/calculators/estate-tax": {
    plain: "See what the US could take from your family if you hold US stocks directly — and how GIFT City removes it.",
    terms: ["estate tax", "US-situs", "NRA"],
  },
  "/calculators/nri-status": {
    plain: "Find out whether you count as NRI, RNOR or resident this year — it changes which income India can tax.",
    terms: ["NRI", "RNOR", "ROR", "Section 6"],
  },
  "/calculators/fee-comparison": {
    plain: "Compare what each platform really costs you, side by side — including the fees you don't usually see.",
    terms: ["TER", "brokerage", "spread"],
  },
};

export default function CalcExplainerBar() {
  const pathname = usePathname();
  const cfg = CONFIG[pathname];
  if (!cfg) return null;
  return <Bar cfg={cfg} />;
}

function Bar({ cfg }: { cfg: CalcConfig }) {
  const { expert } = useJargon();
  return (
    <div className="border-b" style={{ background: "#F0FAF5", borderColor: "#D1F0E1" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#05A049" }} />
          <p className="text-[13px] leading-relaxed" style={{ color: "#1f3d33" }}>
            <span className="font-semibold" style={{ color: "#00111B" }}>In plain words: </span>
            {cfg.plain}
            {cfg.terms.length > 0 && (
              <span className="ml-1">
                {cfg.terms.map((t) => (
                  <TermChip key={t} term={t} showLabel={expert} />
                ))}
              </span>
            )}
          </p>
        </div>
        <div className="flex-shrink-0">
          <JargonToggle />
        </div>
      </div>
    </div>
  );
}

/** Small inline chip: shows the plain term, reveals the definition on hover.
 *  When "tax terms" is on, it also surfaces the technical acronym. */
function TermChip({ term, showLabel }: { term: string; showLabel: boolean }) {
  const def = GLOSSARY[term];
  if (!def) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="mx-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold align-middle transition-colors"
          style={{ background: "#fff", color: "#047857", border: "1px solid #B4E3C8" }}
        >
          {term}
        </button>
      </TooltipTrigger>
      <TooltipContent>{def}</TooltipContent>
    </Tooltip>
  );
}
