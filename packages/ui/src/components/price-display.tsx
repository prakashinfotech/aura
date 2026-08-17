import * as React from "react";
import { cn } from "../lib/cn";

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPct(mrp: number, price: number) {
  return Math.round(((mrp - price) / mrp) * 100);
}

interface PriceDisplayProps {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { price: "text-sm font-semibold", mrp: "text-xs", off: "text-xs" },
  md: { price: "text-base font-bold", mrp: "text-sm", off: "text-sm" },
  lg: { price: "text-2xl font-bold", mrp: "text-base", off: "text-base" },
};

export function PriceDisplay({ price, mrp, size = "md", className }: PriceDisplayProps) {
  const off = mrp && mrp > price ? discountPct(mrp, price) : 0;
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("tabular-nums text-[var(--foreground)]", s.price)}>
        {formatInr(price)}
      </span>
      {mrp && mrp > price && (
        <>
          <span
            className={cn(
              "tabular-nums text-[var(--foreground-muted)] line-through",
              s.mrp
            )}
          >
            {formatInr(mrp)}
          </span>
          <span className={cn("font-semibold text-[var(--brand)]", s.off)}>
            {off}% off
          </span>
        </>
      )}
    </div>
  );
}
