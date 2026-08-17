import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

export function Rating({ value, count, size = 13, className }: RatingProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]", className)}
    >
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5">
        <Star
          width={size}
          height={size}
          className="fill-[var(--success)] text-[var(--success)]"
        />
        <span className="font-semibold tabular-nums text-[var(--foreground)]">
          {value.toFixed(1)}
        </span>
      </span>
      {count != null && (
        <span className="tabular-nums">
          ({new Intl.NumberFormat("en-IN").format(count)})
        </span>
      )}
    </div>
  );
}

interface StarBarProps {
  distribution: number[];
  total: number;
}

export function StarDistributionBar({ distribution, total }: StarBarProps) {
  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star - 1] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right tabular-nums text-[var(--foreground-muted)]">
              {star}
            </span>
            <Star width={10} height={10} className="fill-[var(--success)] text-[var(--success)]" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--skeleton-base)]">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 tabular-nums text-[var(--foreground-muted)]">
              {new Intl.NumberFormat("en-IN").format(count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
