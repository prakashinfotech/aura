"use client";

import * as React from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

export type SortOption = "relevance" | "newest" | "price_asc" | "price_desc" | "rating" | "discount";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "What's New" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Better Discount" },
];

interface SortBarProps {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  totalCount: number;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
}

export function SortBar({
  sort,
  onSortChange,
  totalCount,
  onFilterToggle,
  showFilterButton,
}: SortBarProps) {
  return (
    <div className="sticky top-[var(--header-height,56px)] z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-0 shadow-sm">
      {/* Left: count + mobile filter */}
      <div className="flex items-center gap-3">
        {showFilterButton && (
          <button
            onClick={onFilterToggle}
            className="flex items-center gap-1.5 border-r border-gray-200 py-3 pr-3 text-xs font-semibold text-[#282C3F] hover:text-[#6366f1] transition-colors md:hidden"
          >
            <SlidersHorizontal size={13} />
            FILTER
          </button>
        )}
        <span className="text-xs text-gray-400 py-3">
          <strong className="text-[#282C3F]">{totalCount.toLocaleString()}</strong> Products
        </span>
      </div>

      {/* Right: sort options as horizontal chips on desktop, select on mobile */}
      <div className="hidden md:flex items-stretch">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onSortChange(o.value)}
            className={`flex items-center gap-1 border-b-2 px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap ${
              sort === o.value
                ? "border-[#6366f1] text-[#6366f1]"
                : "border-transparent text-gray-500 hover:text-[#282C3F]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Mobile: sort select */}
      <div className="flex items-center gap-1 md:hidden">
        <span className="text-xs text-gray-400">Sort:</span>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none cursor-pointer border-0 bg-transparent py-3 pl-1 pr-5 text-xs font-bold text-[#282C3F] focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
