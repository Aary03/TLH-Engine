"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[60] max-w-[260px] rounded-xl px-3 py-2 text-[11px] leading-relaxed shadow-xl",
        "animate-fade-in",
        className
      )}
      style={{ background: "#00111B", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(5,160,73,0.25)" }}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow style={{ fill: "#00111B" }} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/**
 * Term — an inline word with a dotted underline that reveals a plain-English
 * definition on hover/focus. Keyboard accessible.
 */
export function Term({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help underline decoration-dotted decoration-from-font underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[#05A049]/40 rounded"
          style={{ textDecorationColor: "rgba(5,160,73,0.6)" }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

/**
 * InfoTip — a small "?" icon that reveals a definition. For labels where an
 * inline underline would be awkward.
 */
export function InfoTip({ hint, className }: { hint: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className={cn(
            "inline-flex items-center justify-center align-middle outline-none focus-visible:ring-2 focus-visible:ring-[#05A049]/40 rounded-full text-gray-400 hover:text-[#05A049] transition-colors",
            className
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
