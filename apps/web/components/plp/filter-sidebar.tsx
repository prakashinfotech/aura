"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

export interface FilterState {
  categories: string[];
  brands: string[];   // brand IDs
  priceMin: number;
  priceMax: number;
  ratings: number[];
  sizes: string[];
  discount: number | null;
}

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70];
const RATING_OPTIONS = [4, 3, 2];

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose?: () => void;
  availableBrands: { id: string; name: string }[];
  availableSizes: string[];
}

export function FilterSidebar({
  filters,
  onChange,
  onClose,
  availableBrands,
  availableSizes,
}: FilterSidebarProps) {
  function toggleSet<K extends keyof FilterState>(
    key: K,
    value: FilterState[K] extends (infer U)[] ? U : never
  ) {
    const arr = filters[key] as unknown[];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onChange({ ...filters, [key]: next });
  }

  const clearAll = () =>
    onChange({ categories: [], brands: [], priceMin: 0, priceMax: 0, ratings: [], sizes: [], discount: null });

  const activeCount = [
    filters.brands.length,
    filters.sizes.length,
    filters.ratings.length,
    filters.discount ? 1 : 0,
    filters.priceMin || filters.priceMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#282C3F]">FILTERS</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-[#6366f1] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-[#6366f1] hover:underline"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin || ""}
                onChange={(e) => onChange({ ...filters, priceMin: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-200 pl-6 pr-2 text-xs text-[#282C3F] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <span className="text-gray-300">—</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax || ""}
                onChange={(e) => onChange({ ...filters, priceMax: Number(e.target.value) })}
                className="h-9 w-full rounded border border-gray-200 pl-6 pr-2 text-xs text-[#282C3F] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
          </div>
        </FilterSection>

        {/* Discount */}
        <FilterSection title="Discount Range">
          <div className="space-y-1">
            {DISCOUNT_OPTIONS.map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-2.5 py-1">
                <input
                  type="radio"
                  name="discount"
                  checked={filters.discount === d}
                  onChange={() => onChange({ ...filters, discount: filters.discount === d ? null : d })}
                  className="accent-[#6366f1]"
                />
                <span className="text-sm text-[#282C3F]">{d}% and above</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Customer Rating">
          {RATING_OPTIONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 py-1">
              <input
                type="checkbox"
                checked={filters.ratings.includes(r)}
                onChange={() => toggleSet("ratings", r)}
                className="accent-[#6366f1]"
              />
              <div className="flex items-center gap-1">
                <span className="rounded bg-[#14958F] px-1.5 py-0.5 text-[11px] font-bold text-white">{r}★</span>
                <span className="text-sm text-[#282C3F]">&amp; above</span>
              </div>
            </label>
          ))}
        </FilterSection>

        {/* Size — derived from actual product variants in the current category */}
        {availableSizes.length > 0 && (
          <FilterSection title="Size">
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSet("sizes", s)}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded border px-2 text-xs font-medium transition-colors ${
                    filters.sizes.includes(s)
                      ? "border-[#6366f1] bg-pink-50 text-[#6366f1]"
                      : "border-gray-200 text-gray-500 hover:border-[#6366f1] hover:text-[#6366f1]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Brand — derived from actual products in the current category */}
        {availableBrands.length > 0 && (
          <FilterSection title="Brand">
            <div className="space-y-1">
              {availableBrands.map((b) => (
                <label key={b.id} className="flex cursor-pointer items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(b.id)}
                    onChange={() => toggleSet("brands", b.id)}
                    className="accent-[#6366f1]"
                  />
                  <span className="text-sm text-[#282C3F]">{b.name}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}
      </div>

      {/* Mobile apply button */}
      {onClose && (
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded bg-[#6366f1] py-2.5 text-sm font-bold text-white hover:bg-[#e63560] transition-colors"
          >
            APPLY FILTERS
          </button>
        </div>
      )}
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#282C3F] hover:text-[#6366f1] transition-colors"
      >
        {title}
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
