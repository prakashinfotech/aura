"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@aura/ui/cn";

interface SearchBarProps {
  autoFocus?: boolean;
  onSubmit?: () => void;
  className?: string;
}

const SUGGESTIONS = [
  "Casual Shirts",
  "Summer Dresses",
  "Running Shoes",
  "Formal Trousers",
  "Ethnic Wear",
];

export function SearchBar({ autoFocus, onSubmit, className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onSubmit?.();
    setFocused(false);
    inputRef.current?.blur();
  }

  function handleSuggestion(suggestion: string) {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    onSubmit?.();
    setFocused(false);
  }

  const showSuggestions = focused && query.length === 0;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 focus-within:border-[var(--brand)] focus-within:ring-1 focus-within:ring-[var(--brand)]">
          <Search size={16} className="shrink-0 text-[var(--foreground-muted)]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search for products, brands and more"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Popular Searches
          </p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => handleSuggestion(s)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--background)]"
            >
              <Search size={14} className="text-[var(--foreground-muted)]" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
