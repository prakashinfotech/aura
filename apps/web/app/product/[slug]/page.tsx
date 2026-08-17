"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, ShieldCheck, RotateCcw, Truck, Star, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@aura/ui/cn";
import { Button } from "@aura/ui/button";
import { PriceDisplay } from "@aura/ui/price-display";
import { Badge } from "@aura/ui/badge";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { getProductBySlug, getProductReviews, getUserReview, uploadReviewPhoto, submitReview } from "@/lib/queries/products";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const colorParam = searchParams.get("color");

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 300_000,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => getProductReviews(product!.id),
    enabled: !!product?.id,
    staleTime: 60_000,
  });

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [selectedColor, setSelectedColor]         = React.useState<string | null>(null);
  const [selectedImage, setSelectedImage]         = React.useState(0);
  const [sizeError, setSizeError]   = React.useState(false);
  const [colorError, setColorError] = React.useState(false);

  const toggle = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  // Unique colors derived from variants
  const uniqueColors = React.useMemo(() => {
    if (!product) return [];
    const seen = new Set<string>();
    const colors: { name: string; hex: string | null }[] = [];
    for (const v of product.variants) {
      if (!seen.has(v.color)) { seen.add(v.color); colors.push({ name: v.color, hex: v.color_hex }); }
    }
    return colors;
  }, [product]);

  // Initialise color once when product loads: URL param → auto-select if single color
  React.useEffect(() => {
    if (!product) return;
    if (colorParam) {
      const valid = product.variants.some((v) => v.color === colorParam);
      if (valid) { setSelectedColor(colorParam); return; }
    }
    if (uniqueColors.length === 1) setSelectedColor(uniqueColors[0]!.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Keep selectedImage in bounds when gallery changes after color switch
  React.useEffect(() => { setSelectedImage(0); }, [selectedColor]);

  // Sizes available for the selected color (or all sizes if no color chosen yet)
  const sizeMap = React.useMemo(() => {
    if (!product) return new Map<string, NonNullable<typeof product>["variants"][0]>();
    const m = new Map<string, NonNullable<typeof product>["variants"][0]>();
    const filtered = selectedColor
      ? product.variants.filter((v) => v.color === selectedColor)
      : product.variants;
    for (const v of filtered) {
      if (!m.has(v.size)) m.set(v.size, v);
    }
    return m;
  }, [product, selectedColor]);

  const sizes = [...sizeMap.keys()];
  const selectedVariant = selectedVariantId
    ? product?.variants.find((v) => v.id === selectedVariantId) ?? null
    : null;
  const cheapest = product?.variants.reduce((a, b) =>
    a.selling_price <= b.selling_price ? a : b
  );
  const displayVariant = selectedVariant ?? cheapest ?? null;
  const wishlistKey = product
    ? selectedColor ? `${product.id}_${selectedColor}` : product.id
    : null;
  const isWishlisted = wishlistKey ? wishlistItems.has(wishlistKey) : false;

  // Build variantId → color map so gallery images can be filtered by color
  const variantColorMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const v of (product?.variants ?? [])) m.set(v.id, v.color);
    return m;
  }, [product]);

  function handleColorSelect(colorName: string) {
    setSelectedColor(colorName);
    setColorError(false);
    // Reset size selection when color changes
    setSelectedVariantId(null);
    // Jump to first image for this color
    if (product) {
      const idx = product.images.findIndex(
        (img) => img.variant_id && variantColorMap.get(img.variant_id) === colorName
      );
      if (idx !== -1) setSelectedImage(idx);
    }
  }

  function handleAddToCart() {
    if (!product || !displayVariant) return;
    if (uniqueColors.length > 1 && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 2000);
      return;
    }
    if (!selectedVariantId) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    // Build the same filtered image list the gallery is showing right now,
    // then grab the exact frame the user is looking at (selectedImage index).
    // Falls back through: color-filtered selected → color-filtered first → primary → any
    const visibleImages = selectedColor
      ? product.images.filter(
          (img) => !img.variant_id || variantColorMap.get(img.variant_id) === selectedColor
        )
      : product.images;
    const colorImage =
      visibleImages[selectedImage]?.url ??
      visibleImages[0]?.url ??
      product.images.find((img) => img.is_primary)?.url ??
      product.images[0]?.url ??
      "";

    addItem({
      variantId: displayVariant.id,
      productId: product.id,
      name: product.title,
      brand: product.brand_name,
      image: colorImage,
      size: displayVariant.size,
      color: displayVariant.color,
      price: displayVariant.selling_price,
      mrp: displayVariant.mrp,
      qty: 1,
      maxQty: displayVariant.stock_qty,
    });
    toast.success("Added to bag!", { description: `${product.brand_name} · ${displayVariant.color} · Size ${displayVariant.size}` });
  }

  function handleBuyNow() {
    handleAddToCart();
    if (selectedVariantId) router.push("/checkout");
  }

  if (isLoading) return <PDPSkeleton />;
  if (isError || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-[var(--foreground)]">Product not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[var(--brand)] hover:underline">← Go back</button>
      </div>
    );
  }

  // Show color-specific images when a color is selected; always include General images (no variant_id)
  const filteredProductImages = selectedColor
    ? product.images.filter(
        (img) => !img.variant_id || variantColorMap.get(img.variant_id) === selectedColor
      )
    : product.images;
  const images = filteredProductImages.length > 0
    ? filteredProductImages.map((img) => img.url)
    : product.images.length > 0
      ? product.images.map((img) => img.url)
      : [`https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&h=1067&q=80`];

  const discountPct = displayVariant
    ? Math.round(((displayVariant.mrp - displayVariant.selling_price) / displayVariant.mrp) * 100)
    : 0;

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="bg-[var(--background)]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-[var(--max-width)] px-4 py-2 text-xs text-[var(--foreground-muted)]">
        <Link href="/" className="hover:text-[var(--brand)]">Home</Link>
        <ChevronRight size={12} className="mx-1 inline" />
        <Link href="/category" className="hover:text-[var(--brand)]">{product.brand_name}</Link>
        <ChevronRight size={12} className="mx-1 inline" />
        <span className="text-[var(--foreground)]">{product.title}</span>
      </div>

      <div className="mx-auto max-w-[var(--max-width)] md:flex">
        {/* ── Left: image gallery ── */}
        <div className="md:w-[45%] md:sticky md:top-[var(--header-height)] md:self-start">
          {/* Desktop: thumbnails on left, main image on right */}
          <div className="flex gap-2 md:flex-row-reverse md:px-2 md:pb-2">
            <div className="relative flex-1 aspect-[3/4] overflow-hidden bg-white">
              <Image
                src={images[selectedImage]!}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />

              {/* Discount badge */}
              {discountPct >= 5 && (
                <div className="absolute left-3 top-3">
                  <span className="rounded-sm bg-[var(--brand)] px-2 py-0.5 text-xs font-bold text-white">
                    {discountPct}% OFF
                  </span>
                </div>
              )}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-gray-600 shadow-md hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-gray-600 shadow-md hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Floating wishlist circle */}
              <button
                onClick={() => toggle(wishlistKey ?? product.id)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-md"
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  size={20}
                  className={cn(isWishlisted ? "fill-[var(--brand)] text-[var(--brand)]" : "text-gray-400")}
                />
              </button>


              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === selectedImage ? "w-4 bg-[var(--brand)]" : "w-1.5 bg-black/25"
                      )}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails (desktop) */}
            <div className="hidden w-14 flex-col gap-2 md:flex overflow-y-auto max-h-[70vh] scrollbar-none">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden border-2 transition-colors",
                    i === selectedImage ? "border-[var(--brand)]" : "border-[var(--border)] hover:border-gray-300"
                  )}
                >
                  <Image src={src} alt={`View ${i + 1}`} fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile thumbnails (horizontal) */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none md:hidden">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative h-16 w-12 shrink-0 overflow-hidden border-2 transition-colors",
                  i === selectedImage ? "border-[var(--brand)]" : "border-[var(--border)]"
                )}
              >
                <Image src={src} alt={`View ${i + 1}`} fill className="object-cover" sizes="48px" />
              </button>
            ))}
          </div>

        </div>

        {/* ── Right: product info ── */}
        <div className="flex-1 bg-white px-4 py-4 md:px-8 md:py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
            {product.brand_name}
          </p>
          <h1 className="mt-1 text-lg font-semibold leading-snug text-[var(--foreground)] md:text-2xl">
            {product.title}
          </h1>

          {/* Rating summary — hidden when no reviews */}
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-sm bg-[var(--success)] px-2 py-0.5 text-xs font-bold text-white">
                {avgRating.toFixed(1)} <Star size={10} fill="white" />
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {reviews.length} {reviews.length === 1 ? "rating" : "ratings"}
              </span>
            </div>
          )}

          <div className="my-4 border-t border-dashed border-[var(--border)]" />

          {/* Price */}
          {displayVariant && (
            <div>
              <PriceDisplay price={displayVariant.selling_price} mrp={displayVariant.mrp} size="lg" />
              <p className="mt-1 text-xs text-[var(--success)]">inclusive of all taxes</p>
            </div>
          )}

          {/* Offers strip */}
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            <p className="mb-2 text-xs font-bold text-[var(--foreground)]">Available Offers</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              🏷️ Use code <span className="font-semibold text-[var(--brand)]">AURA50</span> — Get 10% off on first order
            </p>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              💳 10% cashback on Aura Axis Bank card (max ₹500)
            </p>
          </div>

          <div className="my-4 border-t border-[var(--border)]" />

          {/* Color selector — shown only when product has multiple colors */}
          {uniqueColors.length > 1 && (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--foreground)]">Select Color</span>
                {selectedColor && (
                  <span className="text-sm text-[var(--foreground-muted)]">
                    — <span className="font-semibold text-[var(--foreground)]">{selectedColor}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {uniqueColors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => handleColorSelect(c.name)}
                      title={c.name}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        isSelected
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] font-bold"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--secondary)]"
                      )}
                    >
                      {c.hex && (
                        <span
                          className={cn(
                            "h-4 w-4 shrink-0 rounded-full border",
                            isSelected ? "border-[var(--brand)]" : "border-black/10"
                          )}
                          style={{ background: c.hex }}
                        />
                      )}
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {colorError && (
                <p className="mt-2 text-xs font-medium text-[var(--error)]">⚠ Please select a color to continue</p>
              )}
            </div>
          )}

          {/* Size selector */}
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--foreground)]">Select Size</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const v = sizeMap.get(size)!;
                const isSelected = selectedVariant?.size === size;
                const outOfStock = v.stock_qty === 0;
                return (
                  <button
                    key={size}
                    onClick={() => { if (!outOfStock) setSelectedVariantId(v.id); }}
                    disabled={outOfStock}
                    className={cn(
                      "flex h-10 min-w-[42px] items-center justify-center rounded-full border px-3 text-sm font-medium transition-all",
                      isSelected
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] font-bold"
                        : outOfStock
                          ? "cursor-not-allowed border-dashed border-[var(--border)] text-[var(--foreground-muted)] line-through opacity-40"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--secondary)]"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {sizeError && (
              <p className="mt-2 text-xs font-medium text-[var(--error)]">⚠ Please select a size to continue</p>
            )}
          </div>

          {selectedVariant && uniqueColors.length === 1 && (
            <p className="mb-4 text-sm text-[var(--foreground-muted)]">
              Color: <span className="font-semibold text-[var(--foreground)]">{selectedVariant.color}</span>
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3">
            <Button variant="primary" size="lg" className="flex-1" onClick={handleAddToCart}>
              Add to Bag
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>

          <div className="my-5 border-t border-[var(--border)]" />

          {/* Delivery & Trust */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, text: "Free Delivery", sub: "On orders ₹499+" },
              { icon: RotateCcw, text: "Easy Returns", sub: "30-day returns" },
              { icon: ShieldCheck, text: "100% Original", sub: "Guaranteed" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-2.5">
                <Icon size={18} className="text-[var(--success)]" />
                <span className="text-[11px] font-semibold text-[var(--foreground)]">{text}</span>
                <span className="text-[10px] text-[var(--foreground-muted)]">{sub}</span>
              </div>
            ))}
          </div>

          {/* Product description */}
          {product.description && (
            <>
              <div className="my-5 border-t border-[var(--border)]" />
              <details open>
                <summary className="cursor-pointer text-sm font-bold text-[var(--foreground)] select-none">
                  Product Details
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {product.description}
                </p>
              </details>
            </>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="mx-auto max-w-[var(--max-width)] mt-2 bg-white px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            Ratings &amp; Reviews
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--foreground-muted)]">({reviews.length})</span>
            )}
          </h2>
          {user ? (
            <WriteReviewButton productId={product.id} userId={user.id} />
          ) : (
            <button
              onClick={openAuth}
              className="rounded-[var(--radius-md)] border border-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              Login to Rate
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] py-10 text-center">
            <Star size={28} className="mx-auto text-gray-200" />
            <p className="mt-2 font-semibold text-[var(--foreground)]">No reviews yet</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Be the first to share your experience</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-sm bg-[var(--success)] px-1.5 py-0.5 text-xs font-bold text-white">
                    {r.rating} <Star size={9} fill="white" />
                  </span>
                  {r.title && <p className="text-sm font-semibold text-[var(--foreground)]">{r.title}</p>}
                </div>
                {r.body && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{r.body}</p>}
                {r.photos.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {r.photos.map((url, i) => (
                      <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                        <Image src={url} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Write / Edit Review modal ─────────────────────────────────────────────────

const MAX_PHOTOS = 5;

function WriteReviewButton({ productId, userId }: { productId: string; userId: string }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  // Existing saved URLs the user still wants to keep
  const [keptUrls, setKeptUrls] = React.useState<string[]>([]);
  // Newly picked files (not yet uploaded)
  const [newFiles, setNewFiles] = React.useState<Array<{ file: File; preview: string }>>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: existingReview, isLoading: loadingExisting } = useQuery({
    queryKey: ["user-review", productId, userId],
    queryFn: () => getUserReview(productId, userId),
    staleTime: 60_000,
  });

  const hasReview = !!existingReview;

  // Combined preview list: saved URLs first, then new local previews
  const allPreviews = [...keptUrls, ...newFiles.map((f) => f.preview)];
  const totalPhotos = allPreviews.length;

  const openModal = () => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title ?? "");
      setBody(existingReview.body ?? "");
      setKeptUrls(existingReview.photos);
    } else {
      setRating(0);
      setTitle("");
      setBody("");
      setKeptUrls([]);
    }
    setNewFiles([]);
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_PHOTOS - totalPhotos);
    setNewFiles((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // idx is the index in allPreviews = [...keptUrls, ...newFiles]
  const removePhoto = (idx: number) => {
    if (idx < keptUrls.length) {
      setKeptUrls((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setNewFiles((prev) => prev.filter((_, i) => i !== idx - keptUrls.length));
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const uploadedUrls: string[] = [];
      try {
        for (const { file } of newFiles) {
          const url = await uploadReviewPhoto(file, userId);
          uploadedUrls.push(url);
        }
      } finally {
        setUploading(false);
      }
      return submitReview(
        productId,
        userId,
        rating,
        title,
        body,
        [...keptUrls, ...uploadedUrls],
        existingReview?.id
      );
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(hasReview ? "Review updated!" : "Review submitted!");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      void queryClient.invalidateQueries({ queryKey: ["user-review", productId, userId] });
    },
    onError: (err: unknown) => {
      setUploading(false);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(msg);
    },
  });

  if (!open) {
    return (
      <button
        onClick={openModal}
        disabled={loadingExisting}
        className="rounded-[var(--radius-md)] border border-[var(--brand)] px-4 py-1.5 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:opacity-50"
      >
        {hasReview ? "Edit Review" : "Rate this Product"}
      </button>
    );
  }

  const isSubmitting = isPending || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-bold">{hasReview ? "Edit Your Review" : "Rate & Review"}</h3>

        {/* Star rating */}
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} aria-label={`${s} star`}>
              <Star
                size={28}
                className={cn(
                  "transition-colors",
                  s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-1 self-center text-sm text-[var(--foreground-muted)]">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>

        <input
          type="text"
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <textarea
          placeholder="Write your review here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mb-4 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] resize-none"
        />

        {/* Photo upload */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-[var(--foreground-muted)]">
            Photos ({totalPhotos}/{MAX_PHOTOS})
          </p>
          <div className="flex flex-wrap gap-2">
            {allPreviews.map((url: string, i: number) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white text-[10px] leading-none"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-2xl text-gray-300 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                aria-label="Add photo"
              >
                +
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => rating > 0 && mutate()}
            disabled={rating === 0 || isSubmitting}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--brand)] py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[var(--brand-hover)] transition-colors"
          >
            {uploading ? "Uploading…" : isPending ? "Saving…" : hasReview ? "Update Review" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PDPSkeleton() {
  return (
    <div className="mx-auto max-w-[var(--max-width)] animate-pulse md:flex">
      <div className="aspect-[3/4] w-full bg-gray-100 md:w-[45%]" />
      <div className="flex-1 px-4 py-6 md:px-8">
        <div className="h-3 w-24 rounded bg-gray-100" />
        <div className="mt-2 h-6 w-3/4 rounded bg-gray-100" />
        <div className="mt-3 h-8 w-1/3 rounded bg-gray-100" />
        <div className="mt-6 h-4 w-1/2 rounded bg-gray-100" />
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 w-10 rounded-full bg-gray-100" />)}
        </div>
        <div className="mt-6 flex gap-3">
          <div className="h-12 flex-1 rounded bg-gray-100" />
          <div className="h-12 flex-1 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
