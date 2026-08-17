import * as React from "react";
import { Suspense } from "react";
import { AuthRedirectTrigger } from "@/components/auth/auth-redirect-trigger";
import { HeroCarousel, type BannerSlide } from "@/components/home/hero-carousel";
import { CategoryGrid } from "@/components/home/category-grid";
import { PromoBanners } from "@/components/home/promo-banners";
import { ProductRow } from "@/components/home/product-row";
import { createClient } from "@aura/db/server";
import { getProductsFiltered } from "@/lib/queries/products";

async function fetchBanners(): Promise<BannerSlide[]> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("banners")
      .select("id, image_url_desktop, image_url_mobile, target_url, sort_order")
      .eq("position", "hero")
      .eq("active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("sort_order", { ascending: true });
    if (!data || data.length === 0) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((r) => ({
      id: r.id as string,
      image_url_desktop: r.image_url_desktop as string,
      image_url_mobile: r.image_url_mobile as string,
      target_url: (r.target_url ?? null) as string | null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [bannerSlides, trendingResult, newArrivalsResult] = await Promise.all([
    fetchBanners(),
    getProductsFiltered({ limit: 8, sort: "discount" }).catch(() => ({ products: [], totalCount: 0 })),
    getProductsFiltered({ limit: 6, sort: "newest" }).catch(() => ({ products: [], totalCount: 0 })),
  ]);

  const trending = trendingResult.products;
  const newArrivals = newArrivalsResult.products;

  return (
    <>
      <Suspense>
        <AuthRedirectTrigger />
      </Suspense>

      <HeroCarousel slides={bannerSlides} />
      <CategoryGrid />
      <PromoBanners />

      <div className="mx-auto max-w-[var(--max-width)]">
        {trending.length > 0 && (
          <ProductRow title="Trending Now" viewAllHref="/category" products={trending} />
        )}

        <section className="mx-4 my-2 flex items-center justify-between overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--secondary)] to-[#3d4266] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Limited Time</p>
            <p className="mt-1 text-xl font-bold text-white">Flash Sale — Up to 60% Off 🔥</p>
            <p className="mt-0.5 text-xs text-white/60">On selected brands &amp; styles</p>
          </div>
          <a
            href="/category"
            className="shrink-0 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[var(--brand-hover)]"
          >
            Shop Now
          </a>
        </section>

        {newArrivals.length > 0 && (
          <ProductRow title="New Arrivals" viewAllHref="/category?sort=newest" products={newArrivals} />
        )}
      </div>
    </>
  );
}
