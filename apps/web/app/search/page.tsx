"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@aura/ui/product-card";
import { ProductCardSkeleton } from "@aura/ui/skeleton";
import { useWishlistStore } from "@/stores/wishlist-store";
import { getProductsFiltered } from "@/lib/queries/products";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.has);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => getProductsFiltered({ search: query, limit: 40 }),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });

  const results = data?.products ?? [];

  return (
    <div className="mx-auto max-w-[var(--max-width)] px-4 py-6">
      {query ? (
        <>
          <h1 className="mb-1 text-xl font-bold text-[var(--foreground)]">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            {isLoading ? "Searching…" : `${results.length} products found`}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search size={48} className="text-[var(--border)]" strokeWidth={1} />
              <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Check the spelling or try a different search
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={has(product.id)}
                  onWishlistToggle={(id) => toggle(id)}
                  onOpen={(p) => router.push(`/product/${p.slug}`)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search size={48} className="text-[var(--border)]" strokeWidth={1} />
          <p className="mt-4 text-lg font-semibold text-[var(--foreground)]">Search for products</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Find clothes, shoes, accessories and more
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
