"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@aura/ui/product-card";
import { useWishlistStore } from "@/stores/wishlist-store";

interface ProductRowProps {
  title: string;
  viewAllHref: string;
  products: ProductCardData[];
}

export function ProductRow({ title, viewAllHref, products }: ProductRowProps) {
  const router = useRouter();
  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.has);

  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between px-4">
        <h2 className="text-base font-bold text-[var(--foreground)] md:text-lg">{title}</h2>
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)] hover:underline"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
        {products.map((p) => (
          <div key={p.card_key ?? p.id} className="w-[160px] shrink-0 md:w-[200px]">
            <ProductCard
              product={p}
              isWishlisted={has(p.id)}
              onWishlistToggle={(id) => toggle(id)}
              onOpen={(product) => router.push(`/product/${product.slug}`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
