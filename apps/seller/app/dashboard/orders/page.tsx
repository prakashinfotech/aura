"use client";

import * as React from "react";
import {
  Search, Loader2, Package, Truck, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatInr } from "@aura/ui/price-display";

type ItemStatus = "placed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";

interface SellerOrderItem {
  item_id: string;
  order_id: string;
  order_number: string;
  product_title: string;
  product_image: string | null;
  variant_size: string | null;
  variant_color: string | null;
  qty: number;
  selling_price: number;
  item_status: ItemStatus;
  tracking_number: string | null;
  courier: string | null;
  dispatched_at: string | null;
  order_created_at: string;
  sla_hours: number | null;
  delivery_address: {
    name: string; line1: string; line2?: string;
    city: string; state: string; pincode: string;
    phone: string;
  } | null;
}

const TAB_CONFIG = [
  { key: "all",          label: "All",        icon: Package },
  { key: "placed",       label: "New",        icon: Clock },
  { key: "processing",   label: "Processing", icon: Package },
  { key: "shipped",      label: "Shipped",    icon: Truck },
  { key: "delivered",    label: "Delivered",  icon: CheckCircle2 },
  { key: "cancelled",    label: "Cancelled",  icon: XCircle },
] as const;

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  placed:           { label: "New Order",     cls: "text-[var(--warning)] bg-[var(--warning-soft)]" },
  processing:       { label: "Processing",   cls: "text-[var(--info)] bg-[var(--info-soft)]" },
  shipped:          { label: "Shipped",      cls: "text-[var(--brand)] bg-[var(--brand-soft)]" },
  out_for_delivery: { label: "Out Delivery", cls: "text-purple-600 bg-purple-50" },
  delivered:        { label: "Delivered",    cls: "text-[var(--success)] bg-[var(--success-soft)]" },
  cancelled:        { label: "Cancelled",    cls: "text-[var(--error)] bg-[var(--error-soft)]" },
  returned:         { label: "Returned",     cls: "text-[var(--foreground-muted)] bg-[var(--background)]" },
};

function effectiveStatus(item: SellerOrderItem): ItemStatus {
  if (item.item_status === "shipped" && item.dispatched_at) {
    const dispatched = new Date(item.dispatched_at).getTime();
    const now = Date.now();
    if (now >= dispatched + 4 * 86400_000) return "delivered";
    if (now >= dispatched + 1 * 86400_000) return "out_for_delivery";
  }
  return item.item_status;
}

function edd(dispatchedAt: string): string {
  const d = new Date(new Date(dispatchedAt).getTime() + 4 * 86400_000);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function SellerOrdersPage() {
  const [orders, setOrders]     = React.useState<SellerOrderItem[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [search, setSearch]     = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | ItemStatus>("all");
  const [actioning, setActioning] = React.useState<Set<string>>(new Set());
  const [sellerId, setSellerId] = React.useState<string | null>(null);

  async function fetchOrders(sid: string) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .rpc("get_seller_orders", { p_seller_id: sid, p_limit: 100 });
    if (error || !data) {
      toast.error("Could not load orders");
    } else {
      setOrders(data as SellerOrderItem[]);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: seller } = await (supabase as any)
        .from("sellers").select("id").eq("user_id", session.user.id).single();
      if (!seller) { setLoading(false); return; }
      setSellerId(seller.id);
      await fetchOrders(seller.id);
    })();
  }, []);

  async function handleAction(itemId: string, action: "accept" | "dispatch") {
    setActioning((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId: itemId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      if (action === "accept") {
        toast.success("Order accepted — now processing");
        setOrders((prev) => prev.map((o) =>
          o.item_id === itemId ? { ...o, item_status: "processing" } : o
        ));
      } else {
        toast.success(`Dispatched! Tracking: ${data.trackingNumber}`);
        setOrders((prev) => prev.map((o) =>
          o.item_id === itemId
            ? { ...o, item_status: "shipped", tracking_number: data.trackingNumber, dispatched_at: new Date().toISOString() }
            : o
        ));
      }
    } catch (err: any) {
      toast.error(err.message ?? "Action failed");
    } finally {
      setActioning((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
    }
  }

  const tabCounts = React.useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach((o) => { c[o.item_status] = (c[o.item_status] ?? 0) + 1; });
    return c;
  }, [orders]);

  const filtered = React.useMemo(() =>
    orders.filter((o) => {
      const matchTab    = activeTab === "all" || o.item_status === activeTab;
      const matchSearch = !search
        || o.order_number.toLowerCase().includes(search.toLowerCase())
        || o.product_title.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    }),
    [orders, activeTab, search]
  );

  function SLABadge({ hours }: { hours?: number | null }) {
    if (hours == null) return null;
    const color = hours > 24 ? "text-[var(--success)]" : hours > 6 ? "text-[var(--warning)]" : "text-[var(--error)]";
    return <span className={`block text-[10px] font-semibold ${color}`}>⏱ {hours}h SLA</span>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Orders</h1>
          <p className="text-sm text-[var(--foreground-muted)]">{orders.length} total orders</p>
        </div>
        {sellerId && (
          <button
            onClick={() => fetchOrders(sellerId)}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border)] scrollbar-none">
        {TAB_CONFIG.map((tab) => {
          const Icon  = tab.icon;
          const count = tabCounts[tab.key] ?? 0;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
            >
              <Icon size={13} />
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? "bg-[var(--brand)] text-white" : "bg-[var(--background)] text-[var(--foreground-muted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <Search size={15} className="text-[var(--foreground-muted)]" />
        <input
          type="search"
          placeholder="Search by order number or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--foreground-muted)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--brand)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={32} className="text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <p className="mt-3 font-semibold text-[var(--foreground)]">No orders found</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {search ? "Try a different search" : `No ${activeTab === "all" ? "" : activeTab} orders`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Order", "Product", "Qty", "Amount", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const eff = effectiveStatus(o);
                  const cfg = STATUS_CFG[eff] ?? STATUS_CFG[o.item_status] ?? { label: o.item_status, cls: "text-[var(--foreground-muted)] bg-[var(--background)]" };
                  const busy = actioning.has(o.item_id);
                  return (
                    <tr key={o.item_id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
                      {/* Order */}
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-bold text-[var(--foreground)]">#{o.order_number}</p>
                        <SLABadge hours={o.sla_hours} />
                      </td>
                      {/* Product */}
                      <td className="max-w-[180px] px-4 py-3">
                        <p className="truncate text-sm text-[var(--foreground)]">{o.product_title}</p>
                        {(o.variant_size || o.variant_color) && (
                          <p className="text-[11px] text-[var(--foreground-muted)]">
                            {[o.variant_size, o.variant_color].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{o.qty}</td>
                      {/* Amount */}
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                        {formatInr(o.selling_price * o.qty)}
                      </td>
                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--foreground-muted)]">
                        {new Date(o.order_created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                        {o.dispatched_at && eff !== "delivered" && (
                          <p className="mt-0.5 text-[10px] text-[var(--foreground-muted)]">EDD {edd(o.dispatched_at)}</p>
                        )}
                        {o.tracking_number && (
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--foreground-muted)]">{o.tracking_number}</p>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {o.item_status === "placed" && (
                            <button
                              onClick={() => handleAction(o.item_id, "accept")}
                              disabled={busy}
                              className="flex items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-[var(--success)] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {busy ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                              Accept
                            </button>
                          )}
                          {o.item_status === "processing" && (
                            <button
                              onClick={() => handleAction(o.item_id, "dispatch")}
                              disabled={busy}
                              className="flex items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-[var(--secondary)] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            >
                              {busy ? <Loader2 size={10} className="animate-spin" /> : <Truck size={10} />}
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
