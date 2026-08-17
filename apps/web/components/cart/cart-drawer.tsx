"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, Plus, Minus, Tag, ChevronRight, X, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@aura/ui/sheet";
import { Button } from "@aura/ui/button";
import { formatInr } from "@aura/ui/price-display";
import { useCartStore } from "@/stores/cart-store";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FREE_DELIVERY_THRESHOLD = 499;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQty, subtotal } = useCartStore();
  const [promoCode, setPromoCode] = React.useState("");
  const [promoOpen, setPromoOpen] = React.useState(false);

  const isEmpty = items.length === 0;
  const total = subtotal();
  const savings = items.reduce((acc, item) => acc + (item.mrp - item.price) * item.qty, 0);
  const deliveryFree = total >= FREE_DELIVERY_THRESHOLD;
  const deliveryProgress = Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-[420px]" showClose={false}>
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold text-[#282C3F]">
            <ShoppingBag size={16} className="text-[#6366f1]" />
            My Bag
            {items.length > 0 && (
              <span className="rounded-full bg-[#6366f1] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {items.length}
              </span>
            )}
          </SheetTitle>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </SheetHeader>

        {isEmpty ? (
          <EmptyBag onClose={onClose} />
        ) : (
          <>
            {/* Delivery progress bar */}
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              {deliveryFree ? (
                <div className="flex items-center gap-2 text-xs text-[#03A685] font-medium">
                  <Truck size={13} />
                  <span>You get FREE delivery on this order!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                    <Truck size={13} />
                    <span>
                      Add{" "}
                      <span className="font-semibold text-[#282C3F]">
                        {formatInr(FREE_DELIVERY_THRESHOLD - total)}
                      </span>{" "}
                      more for FREE delivery
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1 rounded-full bg-[#6366f1] transition-all"
                      style={{ width: `${deliveryProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  onRemove={() => removeItem(item.variantId)}
                  onQtyChange={(qty) => updateQty(item.variantId, qty)}
                />
              ))}

              {/* Promo code */}
              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => setPromoOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-sm font-medium text-[#282C3F]"
                >
                  <span className="flex items-center gap-2">
                    <Tag size={14} className="text-[#6366f1]" />
                    Apply Coupon
                  </span>
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${promoOpen ? "rotate-90" : ""}`} />
                </button>
                {promoOpen && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-xs focus:border-[#6366f1] focus:outline-none"
                    />
                    <button className="rounded bg-[#6366f1] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63560]">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Price summary + CTA */}
            <div className="border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Total MRP ({items.reduce((a, i) => a + i.qty, 0)} items)
                  </span>
                  <span className="font-medium text-[#282C3F]">
                    {formatInr(items.reduce((a, i) => a + i.mrp * i.qty, 0))}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount on MRP</span>
                    <span className="font-medium text-[#03A685]">- {formatInr(savings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery Charges</span>
                  {deliveryFree ? (
                    <span className="font-medium text-[#03A685]">FREE</span>
                  ) : (
                    <span className="font-medium text-[#282C3F]">₹49</span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#282C3F]">Total Amount</span>
                  <span className="text-base font-bold text-[#282C3F]">
                    {formatInr(deliveryFree ? total : total + 49)}
                  </span>
                </div>
                {savings > 0 && (
                  <p className="text-center text-xs text-[#03A685] font-medium">
                    You will save {formatInr(savings)} on this order
                  </p>
                )}
              </div>
              <div className="px-4 pb-4">
                <Button variant="primary" size="lg" className="w-full rounded-none font-bold tracking-wide" asChild>
                  <Link href="/checkout" onClick={onClose}>
                    PLACE ORDER
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
          <ShoppingBag size={40} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6366f1] text-xs font-bold text-white">
          0
        </div>
      </div>
      <div>
        <p className="text-base font-bold text-[#282C3F]">Hey, it feels so light!</p>
        <p className="mt-1 text-sm text-gray-400">
          There is nothing in your bag. Let&apos;s add some items.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onClose} className="px-8 font-bold" asChild>
        <Link href="/category">CONTINUE SHOPPING</Link>
      </Button>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onQtyChange,
}: {
  item: ReturnType<typeof useCartStore.getState>["items"][0];
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const discount = item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
    : 0;

  return (
    <div className="flex gap-3 border-b border-gray-100 px-4 py-4">
      {/* Image */}
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{item.brand}</p>
            <p className="line-clamp-2 text-sm font-medium leading-snug text-[#282C3F] mt-0.5">
              {item.name}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="shrink-0 rounded-full p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          {item.color && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-black/10 shrink-0"
                style={{ background: item.color.startsWith("#") ? item.color : "#e5e7eb" }} />
              {item.color}
            </span>
          )}
          {item.size && (
            <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
              Size: {item.size}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-[#282C3F]">{formatInr(item.price)}</span>
            {item.mrp > item.price && (
              <>
                <span className="text-xs text-gray-400 line-through">{formatInr(item.mrp)}</span>
                <span className="text-xs font-semibold text-[#6366f1]">({discount}% off)</span>
              </>
            )}
          </div>

          {/* Qty stepper */}
          <div className="flex items-center gap-0 rounded border border-gray-200 overflow-hidden">
            <button
              onClick={() => onQtyChange(item.qty - 1)}
              disabled={item.qty <= 1}
              className="flex h-6 w-6 items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              aria-label="Decrease"
            >
              <Minus size={11} />
            </button>
            <span className="w-7 border-x border-gray-200 text-center text-xs font-bold text-[#282C3F] leading-6">
              {item.qty}
            </span>
            <button
              onClick={() => onQtyChange(item.qty + 1)}
              disabled={item.qty >= item.maxQty}
              className="flex h-6 w-6 items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
              aria-label="Increase"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
