"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package, ChevronDown, ChevronUp, MapPin, CreditCard,
  CheckCircle, Clock, Truck, Star, XCircle, RefreshCw,
  Loader2, Circle,
} from "lucide-react";
import { formatInr } from "@aura/ui/price-display";
import { createClient } from "@aura/db/client";
import { useAuth } from "@/hooks/use-auth";
import type { Order, OrderItem } from "@aura/db/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProductInfo { title: string }
interface VariantInfo { size: string; color: string }

interface EnrichedItem extends OrderItem {
  products?: ProductInfo | null;
  product_variants?: VariantInfo | null;
  dispatched_at?: string | null;
}

interface AddressInfo { name: string; line1: string; line2: string | null; city: string; state: string; pincode: string; phone: string }

interface OrderWithDetails extends Order {
  order_items?: EnrichedItem[];
  address?: AddressInfo | null;
}

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  placed:           { label: "Order Placed",     color: "text-blue-600",   bg: "bg-blue-50" },
  processing:       { label: "Processing",       color: "text-amber-600",  bg: "bg-amber-50" },
  shipped:          { label: "Shipped",          color: "text-indigo-600", bg: "bg-indigo-50" },
  out_for_delivery: { label: "Out for Delivery", color: "text-purple-600", bg: "bg-purple-50" },
  delivered:        { label: "Delivered",        color: "text-green-600",  bg: "bg-green-50" },
  cancelled:        { label: "Cancelled",        color: "text-red-600",    bg: "bg-red-50" },
  return_initiated: { label: "Return Initiated", color: "text-orange-600", bg: "bg-orange-50" },
  returned:         { label: "Returned",         color: "text-gray-600",   bg: "bg-gray-100" },
};

const ORDER_STEPS = [
  { key: "placed",           label: "Order Placed",    Icon: CheckCircle },
  { key: "processing",       label: "Confirmed",       Icon: Clock },
  { key: "shipped",          label: "Shipped",         Icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery",Icon: MapPin },
  { key: "delivered",        label: "Delivered",       Icon: Star },
] as const;

const STATUS_IDX: Record<string, number> = {
  placed: 0, processing: 1, shipped: 2, out_for_delivery: 3, delivered: 4,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function effectiveOrderStatus(status: string, items: EnrichedItem[]): string {
  // Compute display status from dispatched_at when order is still at "shipped"
  if (status === "shipped" || status === "processing" || status === "placed") {
    const dispatched = items.find((i) => i.dispatched_at)?.dispatched_at;
    if (dispatched) {
      const ms = Date.now() - new Date(dispatched).getTime();
      if (ms >= 4 * 86400_000) return "delivered";
      if (ms >= 1 * 86400_000) return "out_for_delivery";
      return "shipped";
    }
  }
  return status;
}

function fmt(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Order status timeline ────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: OrderWithDetails }) {
  const items = order.order_items ?? [];
  const status = effectiveOrderStatus(order.status ?? "placed", items);
  const idx    = STATUS_IDX[status] ?? 0;
  const terminal = ["cancelled", "return_initiated", "returned"].includes(status);

  if (terminal) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
        <XCircle size={18} className="shrink-0 text-red-500" />
        <p className="text-sm font-semibold text-red-700">{STATUS_CFG[status]?.label ?? status}</p>
      </div>
    );
  }

  // Build step timestamps
  const dispatchedAt = items.find((i) => i.dispatched_at)?.dispatched_at ?? null;
  const createdAt    = order.created_at ?? null;

  function stepTimestamp(key: string): string | null {
    switch (key) {
      case "placed":           return createdAt ? fmt(createdAt) : null;
      case "processing":       return createdAt ? fmt(new Date(new Date(createdAt).getTime() + 3_600_000).toISOString()) : null;
      case "shipped":          return dispatchedAt ? fmt(dispatchedAt) : null;
      case "out_for_delivery": {
        if (!dispatchedAt) return null;
        const t = new Date(dispatchedAt).getTime() + 86400_000;
        const isFuture = t > Date.now();
        return isFuture
          ? `Est. ${new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : fmt(new Date(t).toISOString());
      }
      case "delivered": {
        if (!dispatchedAt) return null;
        const t = new Date(dispatchedAt).getTime() + 4 * 86400_000;
        const isFuture = t > Date.now();
        return isFuture
          ? `Est. ${new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : fmt(new Date(t).toISOString());
      }
      default: return null;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start">
        {ORDER_STEPS.map((step, i) => {
          const done = i <= idx;
          const cur  = i === idx;
          return (
            <React.Fragment key={step.key}>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-[var(--border)] bg-white text-[var(--foreground-muted)]"}`}>
                  <step.Icon size={12} />
                </div>
                <p className={`text-center text-[10px] leading-tight ${cur ? "font-bold text-[#6366f1]" : done ? "font-medium text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>
                  {step.label}
                </p>
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div className={`mt-3 h-0.5 flex-1 transition-colors ${i < idx ? "bg-[#6366f1]" : "bg-[var(--border)]"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step timestamps below */}
      <div className="grid grid-cols-5 gap-1">
        {ORDER_STEPS.map((step, i) => {
          const done = i <= idx;
          const ts   = stepTimestamp(step.key);
          return (
            <p key={step.key} className={`text-center text-[9px] leading-tight ${done ? "text-[var(--foreground-muted)]" : "text-transparent"}`}>
              {ts ?? "·"}
            </p>
          );
        })}
      </div>

      {/* EDD banner for in-progress orders */}
      {dispatchedAt && status !== "delivered" && (
        <div className="mt-1 rounded-md bg-indigo-50 px-3 py-2 text-center text-xs text-indigo-700">
          Expected delivery by{" "}
          <span className="font-semibold">
            {new Date(new Date(dispatchedAt).getTime() + 4 * 86400_000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Per-item delivery info ────────────────────────────────────────────────────

function ItemDeliveryBadge({ item }: { item: EnrichedItem }) {
  if (!item.tracking_number && !item.dispatched_at) return null;

  let label = "";
  let cls   = "text-indigo-600 bg-indigo-50";

  if (item.dispatched_at) {
    const ms = Date.now() - new Date(item.dispatched_at).getTime();
    if (ms >= 4 * 86400_000) {
      label = "Delivered";
      cls   = "text-green-700 bg-green-50";
    } else if (ms >= 1 * 86400_000) {
      label = "Out for Delivery";
      cls   = "text-purple-700 bg-purple-50";
    } else {
      const edd = new Date(new Date(item.dispatched_at).getTime() + 4 * 86400_000);
      label = `Arrives by ${edd.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {label && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
          <Circle size={6} className="fill-current" />
          {label}
        </span>
      )}
      {item.tracking_number && (
        <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
          {item.courier ?? "Aura Logistics"} · {item.tracking_number}
        </span>
      )}
    </div>
  );
}

// ── Order detail ─────────────────────────────────────────────────────────────

function OrderDetail({ order }: { order: OrderWithDetails }) {
  const addr  = order.address;
  const items = order.order_items ?? [];

  return (
    <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Delivery Progress</p>
        <OrderTimeline order={order} />
      </div>

      {items.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Items ({items.length})</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg bg-[var(--surface-2,#f9f9f9)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.products?.title ?? "Product"}</p>
                    {item.product_variants && (
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {item.product_variants.size} · {item.product_variants.color} · Qty {item.qty}
                      </p>
                    )}
                    <ItemDeliveryBadge item={item} />
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatInr((item.selling_price ?? 0) * item.qty)}</p>
                    {(item.selling_price ?? 0) < (item.mrp ?? 0) && (
                      <p className="text-xs text-[var(--foreground-muted)] line-through">{formatInr((item.mrp ?? 0) * item.qty)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price breakdown */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Price Details</p>
        <div className="space-y-1.5 rounded-lg bg-[var(--surface-2,#f9f9f9)] p-3 text-sm">
          <div className="flex justify-between"><span className="text-[var(--foreground-muted)]">Subtotal</span><span>{formatInr(order.subtotal)}</span></div>
          {(order.total_discount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatInr(order.total_discount ?? 0)}</span></div>}
          {(order.coupon_discount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>−{formatInr(order.coupon_discount ?? 0)}</span></div>}
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Delivery</span>
            {(order.delivery_charge ?? 0) === 0 ? <span className="font-medium text-green-600">FREE</span> : <span>{formatInr(order.delivery_charge ?? 0)}</span>}
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-1.5 font-bold"><span>Total Paid</span><span>{formatInr(order.total)}</span></div>
        </div>
      </div>

      {/* Payment */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Payment</p>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2,#f9f9f9)] p-3">
          <CreditCard size={15} className="text-[var(--foreground-muted)]" />
          <p className="text-sm capitalize text-[var(--foreground)]">{order.payment_method ?? "Online"}</p>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${order.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {order.payment_status === "paid" ? "Paid" : order.payment_status ?? "Pending"}
          </span>
        </div>
      </div>

      {/* Address */}
      {addr && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Delivery Address</p>
          <div className="flex items-start gap-2 rounded-lg bg-[var(--surface-2,#f9f9f9)] p-3 text-sm">
            <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--foreground-muted)]" />
            <div className="text-[var(--foreground-muted)]">
              <p className="font-semibold text-[var(--foreground)]">{addr.name}</p>
              <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
              <p>{addr.city}, {addr.state} – {addr.pincode}</p>
              <p className="mt-0.5">📞 {addr.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderWithDetails }) {
  const [expanded, setExpanded] = React.useState(false);
  const items  = order.order_items ?? [];
  const status = effectiveOrderStatus(order.status ?? "placed", items);
  const cfg    = STATUS_CFG[status] ?? STATUS_CFG.placed;

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">Order ID</p>
          <p className="font-mono text-sm font-bold text-[var(--foreground)]">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
          {cfg.label}
        </span>
      </div>

      {items.length > 0 && (
        <div className="mb-3 space-y-1">
          {items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366f1]" />
              <p className="truncate text-sm text-[var(--foreground)]">{item.products?.title ?? "Item"} ×{item.qty}</p>
              {item.tracking_number && <Truck size={12} className="shrink-0 text-indigo-500" />}
            </div>
          ))}
          {items.length > 2 && <p className="pl-3.5 text-xs text-[var(--foreground-muted)]">+{items.length - 2} more</p>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span className="text-sm font-bold text-[var(--foreground)]">{formatInr(order.total)}</span>
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-[#6366f1] hover:underline">
          {expanded ? "Hide" : "View Details"} {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && <OrderDetail order={order} />}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = React.useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]   = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data, error: e } = await supabase
        .from("orders")
        .select("*, address:addresses(name,line1,line2,city,state,pincode,phone), order_items(*, products(title), product_variants(size,color))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (e) throw e;
      setOrders((data as OrderWithDetails[]) ?? []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [user]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    void fetchOrders();
  }, [user, authLoading, fetchOrders]);

  const isLoading = loading || authLoading;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--foreground)]">My Orders</h1>
        {!isLoading && orders.length > 0 && (
          <button onClick={() => void fetchOrders()} className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            <RefreshCw size={12} /> Refresh
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 size={24} className="animate-spin text-[#6366f1]" /></div>
      ) : error ? (
        <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
          <Package size={40} className="mb-3 text-[var(--border)]" strokeWidth={1} />
          <p className="text-sm font-medium text-[var(--foreground)]">Failed to load orders</p>
          <button onClick={() => void fetchOrders()} className="mt-4 rounded-[var(--radius-md)] border border-[#6366f1] px-4 py-2 text-sm font-semibold text-[#6366f1] hover:bg-pink-50">
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] py-20 text-center">
          <Package size={56} className="text-[var(--border)]" strokeWidth={1} />
          <p className="mt-4 text-lg font-bold text-[var(--foreground)]">No orders yet</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Your orders will appear here once you shop</p>
          <Link href="/category" className="mt-6 rounded-[var(--radius-md)] bg-[#6366f1] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
