"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@aura/ui/product-card";
import { ProductCardSkeleton } from "@aura/ui/skeleton";
import { FilterSidebar, type FilterState } from "@/components/plp/filter-sidebar";
import { SortBar, type SortOption } from "@/components/plp/sort-bar";
import { useWishlistStore } from "@/stores/wishlist-store";
import { getProductsFiltered, getFilterOptions } from "@/lib/queries/products";

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  brands: [],
  priceMin: 0,
  priceMax: 0,
  ratings: [],
  sizes: [],
  discount: null,
};

const CATEGORY_LABELS: Record<string, string> = {
  men: "Men", women: "Women", kids: "Kids",
  beauty: "Beauty", home: "Home & Living", studio: "Studio",
  "men-tshirts": "T-Shirts", "men-shirts": "Shirts",
  "men-jeans": "Jeans", "men-shoes": "Shoes",
  "women-kurtas": "Kurtas", "women-dresses": "Dresses", "women-tops": "Tops",
};

const SORT_MAP: Record<SortOption, string> = {
  relevance: "relevance", newest: "newest",
  price_asc: "price_asc", price_desc: "price_desc",
  rating: "rating", discount: "discount",
};

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const category = slug ?? null;
  const title = (slug ? CATEGORY_LABELS[slug] : null) ?? "All Products";

  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortOption>(
    (searchParams.get("sort") as SortOption) ?? "relevance"
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const toggle = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);

  // Filter options (brands + sizes) scoped to the current category
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions", category],
    queryFn: () => getFilterOptions(category),
    staleTime: 5 * 60_000,
  });

  // Map brand ID → name for active chips display
  const brandIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const b of (filterOptions?.brands ?? [])) map.set(b.id, b.name);
    return map;
  }, [filterOptions]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", category, filters, sort, page],
    queryFn: () =>
      getProductsFiltered({
        categorySlug: category,
        brandIds: filters.brands.length > 0 ? filters.brands : null,
        minPrice: filters.priceMin > 0 ? filters.priceMin : null,
        maxPrice: filters.priceMax > 0 ? filters.priceMax : null,
        minDiscount: filters.discount,
        sizes: filters.sizes.length > 0 ? filters.sizes : null,
        minRating: filters.ratings.length > 0 ? Math.min(...filters.ratings) : null,
        sort: SORT_MAP[sort],
        page,
        limit: 24,
      }),
    staleTime: 60_000,
  });

  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 24);

  React.useEffect(() => { setPage(1); }, [category, filters, sort]);

  // Active filter chips
  const activeChips: { label: string; clear: () => void }[] = [
    ...filters.sizes.map((s) => ({ label: `Size: ${s}`, clear: () => setFilters((f) => ({ ...f, sizes: f.sizes.filter((x) => x !== s) })) })),
    ...filters.brands.map((id) => ({ label: brandIdToName.get(id) ?? id, clear: () => setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== id) })) })),
    ...filters.ratings.map((r) => ({ label: `${r}★ & above`, clear: () => setFilters((f) => ({ ...f, ratings: f.ratings.filter((x) => x !== r) })) })),
    ...(filters.discount ? [{ label: `${filters.discount}% off`, clear: () => setFilters((f) => ({ ...f, discount: null })) }] : []),
    ...(filters.priceMin || filters.priceMax ? [{
      label: `₹${filters.priceMin || 0}–₹${filters.priceMax || "∞"}`,
      clear: () => setFilters((f) => ({ ...f, priceMin: 0, priceMax: 0 }))
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="mx-auto max-w-[var(--max-width)]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 bg-white px-4 py-2.5 text-xs text-gray-400">
          <Link href="/" className="hover:text-[#6366f1] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="font-medium text-[#282C3F]">{title}</span>
        </div>

        {/* Sort bar */}
        <SortBar
          sort={sort}
          onSortChange={setSort}
          totalCount={isLoading ? 0 : totalCount}
          showFilterButton
          onFilterToggle={() => setMobileFiltersOpen(true)}
        />

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-2 border-b border-gray-100">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.clear}
                className="flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-[#282C3F] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
              >
                {chip.label}
                <X size={10} />
              </button>
            ))}
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-semibold text-[#6366f1] hover:underline"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex">
          {/* Desktop filter sidebar */}
          <aside className="hidden w-60 shrink-0 md:block">
            <div className="sticky top-[calc(var(--header-height,56px)+45px)] max-h-[calc(100vh-100px)] overflow-y-auto">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                availableBrands={filterOptions?.brands ?? []}
                availableSizes={filterOptions?.sizes ?? []}
              />
            </div>
          </aside>

          {/* Product grid */}
          <main className="flex-1 bg-[#F5F5F6] p-3">
            {isError ? (
              <ErrorState />
            ) : isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState onClear={() => setFilters(DEFAULT_FILTERS)} hasFilters={activeChips.length > 0} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.card_key ?? product.id}
                      product={product}
                      isWishlisted={wishlistItems.has(product.card_key ?? product.id)}
                      onWishlistToggle={(key) => toggle(key)}
                      onOpen={(p) =>
                        router.push(
                          `/product/${p.slug}${p.color ? `?color=${encodeURIComponent(p.color)}` : ""}`
                        )
                      }
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 top-0 w-72 shadow-xl">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onClose={() => setMobileFiltersOpen(false)}
              availableBrands={filterOptions?.brands ?? []}
              availableSizes={filterOptions?.sizes ?? []}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="mt-8 mb-4 flex items-center justify-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => { onPageChange(page - 1); window.scrollTo(0, 0); }}
        className="flex h-9 items-center justify-center rounded border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:border-[#6366f1] hover:text-[#6366f1] disabled:opacity-40 transition-colors"
      >
        ‹ Prev
      </button>

      {pages[0]! > 1 && <span className="px-2 text-gray-400 text-sm">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => { onPageChange(p); window.scrollTo(0, 0); }}
          className={`flex h-9 w-9 items-center justify-center rounded border text-sm font-medium transition-colors ${
            p === page
              ? "border-[#6366f1] bg-[#6366f1] text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#6366f1] hover:text-[#6366f1]"
          }`}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1]! < totalPages && <span className="px-2 text-gray-400 text-sm">…</span>}

      <button
        disabled={page >= totalPages}
        onClick={() => { onPageChange(page + 1); window.scrollTo(0, 0); }}
        className="flex h-9 items-center justify-center rounded border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:border-[#6366f1] hover:text-[#6366f1] disabled:opacity-40 transition-colors"
      >
        Next ›
      </button>
    </div>
  );
}

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-pink-50">
        <PackageSearch size={36} className="text-[#6366f1]" strokeWidth={1.5} />
      </div>
      <p className="text-lg font-bold text-[#282C3F]">No Products Found</p>
      <p className="mt-2 text-sm text-gray-400 max-w-xs">
        {hasFilters
          ? "We couldn't find anything matching your filters. Try removing some."
          : "No products available in this category yet."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 rounded bg-[#6366f1] px-6 py-2 text-sm font-bold text-white hover:bg-[#e63560] transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-bold text-[#282C3F]">Something went wrong</p>
      <p className="mt-2 text-sm text-gray-400">Please try refreshing the page</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-5 rounded bg-[#6366f1] px-6 py-2 text-sm font-bold text-white hover:bg-[#e63560] transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
