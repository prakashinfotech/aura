import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        new: "bg-[var(--secondary)] text-white",
        sale: "bg-[var(--brand)] text-white",
        bestseller: "bg-amber-500 text-white",
        hot: "bg-[var(--highlight)] text-white",
        out_of_stock: "bg-[var(--border)] text-[var(--foreground-muted)]",
        success: "bg-[var(--success-soft)] text-[var(--success)]",
        warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
        error: "bg-[var(--error-soft)] text-[var(--error)]",
        info: "bg-[var(--info-soft)] text-[var(--info)]",
        default:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
