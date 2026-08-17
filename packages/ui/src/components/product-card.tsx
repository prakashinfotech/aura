"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { cn } from "../lib/cn";
import { PriceDisplay } from "./price-display";
import { Badge } from "./badge";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  brand_name: string;
  selling_price: number;
  mrp: number;
  discount_pct: number;
  rating_avg: number;
  rating_count: number;
  primary_image_url: string;
  blur_data_url?: string | null;
  in_stock: boolean;
  tag?: "New" | "Sale" | "Bestseller" | null;
  color?: string | null;
  color_hex?: string | null;
  card_key?: string;
  images?: string[];
}

interface ProductCardProps {
  product: ProductCardData;
  isWishlisted?: boolean;
  onOpen?: (product: ProductCardData) => void;
  onWishlistToggle?: (productId: string) => void;
  compact?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  isWishlisted = false,
  onOpen,
  onWishlistToggle,
  compact = false,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [carouselIdx, setCarouselIdx] = React.useState(0);
  const [heartPop, setHeartPop] = React.useState(false);
  const imgWrapRef = React.useRef<HTMLDivElement>(null);

  const imageList =
    product.images && product.images.length > 0
      ? product.images
      : [product.primary_image_url];

  const href = `/product/${product.slug}${
    product.color ? `?color=${encodeURIComponent(product.color)}` : ""
  }`;

  // Auto-cycle images while hovered
  React.useEffect(() => {
    if (!isHovered || imageList.length <= 1) return;
    const id = setInterval(
      () => setCarouselIdx((i) => (i + 1) % imageList.length),
      1800
    );
    return () => clearInterval(id);
  }, [isHovered, imageList.length]);

  // Slide-from-right animation whenever the image index changes
  React.useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    // Snap to starting offset without transition
    el.style.transition = "none";
    el.style.transform = "translateX(40px)";
    el.style.opacity = "0.4";
    // Next frame: animate back to resting position
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.38s ease-out, opacity 0.3s ease-out";
        el.style.transform = "translateX(0)";
        el.style.opacity = "1";
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [carouselIdx]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 420);
    onWishlistToggle?.(product.card_key ?? product.id);
  };

  // Strip trailing zero: 1.0K → 1K, 1.5K → 1.5K
  const ratingCount =
    product.rating_count >= 1000
      ? `${+(product.rating_count / 1000).toFixed(1)}K`
      : String(product.rating_count);

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (onOpen) {
          e.preventDefault();
          onOpen(product);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCarouselIdx(0);
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] transition-shadow hover:shadow-[var(--shadow-md)]",
        !product.in_stock && "opacity-75",
        className
      )}
    >
      {/* ── Image ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--background)]">
        {/* Wrapper receives the slide animation */}
        <div ref={imgWrapRef} className="absolute inset-0">
          <Image
            src={imageList[carouselIdx] ?? product.primary_image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            placeholder={
              product.blur_data_url && carouselIdx === 0 ? "blur" : "empty"
            }
            blurDataURL={product.blur_data_url ?? undefined}
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.tag === "New" && <Badge variant="new">New</Badge>}
          {product.tag === "Sale" && <Badge variant="sale">Sale</Badge>}
          {product.tag === "Bestseller" && (
            <Badge variant="bestseller">Bestseller</Badge>
          )}
          {!product.in_stock && (
            <Badge variant="out_of_stock">Out of Stock</Badge>
          )}
        </div>

        {/* Heart — top-right, appears on hover */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all duration-200",
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1",
            heartPop && "scale-125"
          )}
        >
          <Heart
            size={14}
            className={
              isWishlisted
                ? "fill-[var(--brand)] text-[var(--brand)]"
                : "text-gray-500"
            }
          />
        </button>

        {/* Rating chip — bottom-left of image */}
        {product.rating_count > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-start px-2 pb-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white px-2.5 py-[5px] shadow-[0_1px_6px_rgba(0,0,0,0.18)]">
              <span className="font-[700] text-[12px] leading-none tracking-tight text-[#282C3F]">
                {product.rating_avg.toFixed(1)}
              </span>
              <Star size={10} fill="#FFB800" stroke="#FFB800" className="shrink-0" />
              <span className="ml-[3px] text-[11px] font-[500] leading-none text-gray-500">
                {ratingCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className={cn("flex flex-col gap-1", compact ? "p-2" : "p-3")}>
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {product.brand_name}
        </span>
        <p className="line-clamp-2 text-sm leading-tight text-[var(--foreground)]">
          {product.title}
        </p>
        <PriceDisplay price={product.selling_price} mrp={product.mrp} size="sm" />
        {product.color && (
          <div className="flex items-center gap-1">
            <span
              className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
              style={{ background: product.color_hex ?? "#e5e7eb" }}
              title={product.color}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
