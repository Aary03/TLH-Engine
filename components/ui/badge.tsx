import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        gain: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        loss: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        stcl: "border-orange-500/30 bg-orange-500/10 text-orange-400",
        ltcl: "border-violet-500/30 bg-violet-500/10 text-violet-400",
        ltcg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        stcg: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        critical: "border-rose-500/50 bg-rose-500/15 text-rose-400 animate-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
