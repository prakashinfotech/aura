"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star, Trash2, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@aura/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { getProductsByIds } from "@/lib/queries/products";
import type { ProductCardData } from "@aura/ui/product-card";

export default function WishlistPage() {
  const router = useRouter();
  const { items, toggle } = useWishlistStore();
  const { addItem } = useCartStore();

  // items now stores card_keys (e.g. "uuid_red" or plain "uuid")
  const wishlistKeys = [...items];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", wishlistKeys.join(",")],
    queryFn: () => getProductsByIds(wishlistKeys),
    enabled: wishlistKeys.length > 0,
    staleTime: 60_000,
  });

  if (wishlistKeys.length === 0) {
    return <EmptyWishlist />;
  }

  const totalSavings = products.reduce(
    (acc, p) => acc + Math.max(0, p.mrp - p.selling_price),
    0
  );

  return (
    <div className="min-h-screen bg-[#F5F5F6]">
      <div className="mx-auto max-w-[var(--max-width)] px-4 py-6">
        {/* Page header */}
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-[#6366f1]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-[#282C3F] font-medium">Wishlist</span>
        </div>

        <div className="flex items-baseline gap-3 mb-5">
          <h1 className="text-xl font-bold text-[#282C3F]">My Wishlist</h1>
          <span className="text-sm text-gray-400">
            {wishlistKeys.length} {wishlistKeys.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {wishlistKeys.map((k) => (
                  <WishlistCardSkeleton key={k} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => {
                  const cardKey = product.card_key ?? product.id;
                  return (
                    <WishlistCard
                      key={cardKey}
                      product={product}
                      onRemove={() => toggle(cardKey)}
                      onMoveToBag={() => {
                        addItem({
                          variantId: product.id + "-default",
                          productId: product.id,
                          name: product.title,
                          brand: product.brand_name,
                          image: product.primary_image_url,
                          size: "M",
                          color: product.color ?? "",
                          price: product.selling_price,
                          mrp: product.mrp,
                          qty: 1,
                          maxQty: 10,
                        });
                        toggle(cardKey);
                      }}
                      onClick={() =>
                        router.push(
                          `/product/${product.slug}${product.color ? `?color=${encodeURIComponent(product.color)}` : ""}`
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          {!isLoading && products.length > 0 && (
            <div className="w-full md:w-64 shrink-0">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                  Price Summary
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total MRP</span>
                    <span>₹{products.reduce((a, p) => a + p.mrp, 0).toLocaleString("en-IN")}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-[#03A685]">
                      <span>Discount</span>
                      <span>- ₹{totalSavings.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-[#282C3F]">
                    <span>Total</span>
                    <span>₹{products.reduce((a, p) => a + p.selling_price, 0).toLocaleString("en-IN")}</span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="rounded bg-[#EAFAF5] px-2 py-1.5 text-center text-xs font-medium text-[#03A685]">
                      You will save ₹{totalSavings.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-4 w-full font-bold"
                  onClick={() => router.push("/category")}
                >
                  CONTINUE SHOPPING
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WishlistCard({
  product,
  onRemove,
  onMoveToBag,
  onClick,
}: {
  product: ProductCardData;
  onRemove: () => void;
  onMoveToBag: () => void;
  onClick: () => void;
}) {
  const discount = product.mrp > product.selling_price
    ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md text-gray-400 hover:text-[#6366f1] transition-colors"
        aria-label="Remove from wishlist"
      >
        <Trash2 size={13} />
      </button>

      {/* Image */}
      <div
        className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-gray-50"
        onClick={onClick}
      >
        <Image
          src={product.primary_image_url}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount > 0 && (
          <div className="absolute left-0 top-3 bg-[#6366f1] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {discount}% OFF
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <p className="rounded bg-gray-800 px-2 py-1 text-xs font-bold text-white">
              OUT OF STOCK
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 truncate">
          {product.brand_name}
        </p>
        <p
          className="mt-0.5 line-clamp-2 text-xs font-medium text-[#282C3F] leading-snug cursor-pointer hover:text-[#6366f1]"
          onClick={onClick}
        >
          {product.title}
        </p>

        {/* Color swatch */}
        {product.color && (
          <div className="mt-1 flex items-center gap-1">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
              style={{ background: product.color_hex ?? "#e5e7eb" }}
              title={product.color}
            />
            <span className="text-[10px] text-gray-400">{product.color}</span>
          </div>
        )}

        {product.rating_count > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex items-center gap-0.5 rounded bg-[#14958F] px-1 py-0.5 text-[10px] font-bold text-white">
              <span>{product.rating_avg.toFixed(1)}</span>
              <Star size={8} fill="white" />
            </div>
            <span className="text-[10px] text-gray-400">({product.rating_count})</span>
          </div>
        )}

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-[#282C3F]">
            ₹{product.selling_price.toLocaleString("en-IN")}
          </span>
          {product.mrp > product.selling_price && (
            <span className="text-[10px] text-gray-400 line-through">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Move to bag */}
        <button
          onClick={onMoveToBag}
          disabled={!product.in_stock}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-[#6366f1] py-1.5 text-[11px] font-bold text-[#6366f1] hover:bg-[#6366f1] hover:text-white transition-colors disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={12} />
          MOVE TO BAG
        </button>
      </div>
    </div>
  );
}

function WishlistCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-2 w-16 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-3/4 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
        <div className="h-7 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-pink-50">
          <Heart size={48} className="text-[#6366f1]" strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <p className="text-lg font-bold text-[#282C3F]">Your wishlist is empty!</p>
        <p className="mt-2 text-sm text-gray-400 max-w-xs">
          Save the items you love. Your wishlist is waiting.
        </p>
      </div>
      <Button variant="primary" size="md" className="px-8 font-bold" asChild>
        <Link href="/category">EXPLORE PRODUCTS</Link>
      </Button>
    </div>
  );
}
