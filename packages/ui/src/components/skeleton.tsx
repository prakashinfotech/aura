import * as React from "react";
import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[var(--skeleton-base)]",
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}
