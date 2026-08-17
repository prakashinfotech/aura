"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Package, Star,
  ArrowUpRight, ArrowDownRight, Clock, Loader2,
  ChevronRight, Zap, AlertCircle,
} from "lucide-react";
import { formatInr } from "@aura/ui/price-display";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashStats {
  total_revenue: number; total_orders: number;
  active_products: number; avg_rating: number; pending_count: number;
  curr_month_revenue: number; prev_month_revenue: number;
  curr_month_orders: number;  prev_month_orders: number;
}

interface RecentOrder {
  item_id: string; order_number: string; product_title: string;
  selling_price: number; qty: number; item_status: string; order_created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  placed:      { label: "New",        cls: "text-[#FF9800] bg-[#FFF8E1]" },
  processing:  { label: "Processing", cls: "text-[#2874F0] bg-[#E8F0FD]" },
  shipped:     { label: "Shipped",    cls: "text-[#6366f1] bg-[#f0f4ff]" },
  delivered:   { label: "Delivered",  cls: "text-[#03A685] bg-[#E6F8F5]" },
  cancelled:   { label: "Cancelled",  cls: "text-[#F32F2F] bg-[#FFF0F0]" },
  returned:    { label: "Returned",   cls: "text-[#696B79] bg-[#F5F5F6]" },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string; value: string; change: number;
  icon: React.ElementType; accent: string; accentBg: string;
  subtitle?: string;
}

function StatCard({ label, value, change, icon: Icon, accent, accentBg, subtitle }: StatCardProps) {
  const up = change >= 0;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* subtle accent band */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ background: accent }} />
      <div className="mb-3 flex items-start justify-between pl-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#696B79]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: accentBg }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
      <p className="pl-2 text-2xl font-extrabold tracking-tight text-[#282C3F]">{value}</p>
      {subtitle && <p className="pl-2 text-[11px] text-[#696B79]">{subtitle}</p>}
      <div className={`mt-2 flex items-center gap-1 pl-2 text-[11px] font-semibold ${up ? "text-[#03A685]" : "text-[#F32F2F]"}`}>
        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(change)}% vs last month
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white p-5">
      <div className="mb-3 flex justify-between">
        <div className="h-3 w-20 rounded-full bg-[#E9E9EB]" />
        <div className="h-9 w-9 rounded-xl bg-[#E9E9EB]" />
      </div>
      <div className="h-8 w-28 rounded-lg bg-[#E9E9EB]" />
      <div className="mt-2 h-3 w-24 rounded-full bg-[#E9E9EB]" />
    </div>
  );
}

// ── Quick action tiles ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Add Product",    href: "/dashboard/products", icon: Package,     color: "#6366f1", bg: "#f0f4ff" },
  { label: "View Orders",    href: "/dashboard/orders",   icon: ShoppingBag, color: "#2874F0", bg: "#E8F0FD" },
  { label: "Analytics",      href: "/dashboard/analytics",icon: TrendingUp,  color: "#03A685", bg: "#E6F8F5" },
  { label: "Settlements",    href: "/dashboard/settlements",icon: Zap,        color: "#f59e0b", bg: "#fef3c7" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]     = React.useState<DashStats | null>(null);
  const [recent, setRecent]   = React.useState<RecentOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [storeName, setStoreName] = React.useState("");
  const [greeting, setGreeting] = React.useState("Welcome");
  const [dateStr, setDateStr]   = React.useState("");

  React.useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: seller } = await (supabase as any)
        .from("sellers").select("id, store_name").eq("user_id", session.user.id).single();
      if (!seller) { setLoading(false); return; }

      setStoreName(seller.store_name ?? "your store");

      const [{ data: statsData }, { data: ordersData }] = await Promise.all([
        (supabase as any).rpc("get_seller_dashboard_stats", { p_seller_id: seller.id }),
        (supabase as any).rpc("get_seller_orders",          { p_seller_id: seller.id, p_limit: 5 }),
      ]);
      if (statsData) setStats(statsData as DashStats);
      if (ordersData) setRecent(ordersData as RecentOrder[]);
      setLoading(false);
    })();
  }, []);

  const revenueChange = stats ? pct(stats.curr_month_revenue, stats.prev_month_revenue) : 0;
  const ordersChange  = stats ? pct(stats.curr_month_orders,  stats.prev_month_orders)  : 0;

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#282C3F] px-6 py-5 text-white shadow-md">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/60">{greeting} 👋</p>
          <h1 className="mt-1 text-xl font-extrabold leading-tight">
            {loading ? "Loading…" : storeName || "Welcome back"}
          </h1>
          <p className="mt-1 text-xs text-white/50">{dateStr}</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#6366f1]/10" />
        <div className="absolute -bottom-6 right-16 h-20 w-20 rounded-full bg-[#6366f1]/8" />
      </div>

      {/* ── Pending order alert ──────────────────────────── */}
      {stats && stats.pending_count > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#FF9800]/40 bg-[#FFF8E1] px-4 py-3.5 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF9800]/15">
            <AlertCircle size={18} className="text-[#FF9800]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#282C3F]">
              {stats.pending_count} order{stats.pending_count > 1 ? "s" : ""} awaiting confirmation
            </p>
            <p className="text-xs text-[#696B79]">Accept orders to keep your seller rating high</p>
          </div>
          <Link href="/dashboard/orders"
            className="flex shrink-0 items-center gap-1 rounded-xl bg-[#FF9800] px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors">
            Review <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          [1,2,3,4].map((n) => <SkeletonCard key={n} />)
        ) : stats ? (
          <>
            <StatCard label="Total Revenue"   value={formatInr(stats.total_revenue)}       change={revenueChange} icon={TrendingUp}  accent="#FF3F6C" accentBg="#FFF0F3" subtitle="Lifetime earnings" />
            <StatCard label="Total Orders"    value={String(stats.total_orders)}           change={ordersChange}  icon={ShoppingBag} accent="#2874F0" accentBg="#E8F0FD" subtitle="All time" />
            <StatCard label="Active Products" value={String(stats.active_products)}        change={0}             icon={Package}     accent="#03A685" accentBg="#E6F8F5" subtitle="Live on Aura" />
            <StatCard label="Avg Rating"      value={stats.avg_rating ? stats.avg_rating.toFixed(1) : "—"} change={0} icon={Star} accent="#f59e0b" accentBg="#FFF5F0" subtitle={stats.avg_rating ? "out of 5 stars" : "No ratings yet"} />
          </>
        ) : (
          <div className="col-span-2 rounded-2xl border border-[#E9E9EB] bg-white p-8 text-center text-sm text-[#696B79] lg:col-span-4">
            No data yet — list your first product to start seeing stats.
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#696B79]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}
              className="flex items-center gap-3 rounded-2xl border border-[#E9E9EB] bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#FF3F6C]/30 hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: a.bg }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#282C3F]">{a.label}</p>
                <ChevronRight size={13} className="text-[#C8C9CF]" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent orders ────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E9E9EB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E9E9EB] bg-white px-5 py-4">
          <div>
            <h2 className="font-bold text-[#282C3F]">Recent Orders</h2>
            <p className="text-[11px] text-[#696B79]">Last 5 orders across all products</p>
          </div>
          <Link href="/dashboard/orders"
            className="flex items-center gap-1 rounded-xl border border-[#E9E9EB] px-3 py-1.5 text-xs font-semibold text-[#282C3F] hover:bg-[#F5F5F6]">
            View All <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[#FF3F6C]" />
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F6]">
              <ShoppingBag size={24} className="text-[#C8C9CF]" strokeWidth={1.5} />
            </div>
            <p className="font-semibold text-[#282C3F]">No orders yet</p>
            <p className="mt-1 text-xs text-[#696B79]">Orders appear here once customers start purchasing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E9E9EB] bg-[#F5F5F6]">
                  {["Order #", "Product", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#696B79]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const cfg = STATUS_CFG[o.item_status] ?? { label: o.item_status, cls: "text-[#696B79] bg-[#F5F5F6]" };
                  return (
                    <tr key={o.item_id} className="border-b border-[#E9E9EB] last:border-0 transition-colors hover:bg-[#FFF0F3]/20">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#282C3F]">#{o.order_number}</td>
                      <td className="max-w-[180px] px-5 py-3.5 text-sm text-[#282C3F]">
                        <p className="truncate">{o.product_title}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-[#282C3F]">
                        {formatInr(o.selling_price * o.qty)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#696B79]">
                        {new Date(o.order_created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cfg.cls}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── This month highlight ─────────────────────────── */}
      {stats && !loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#E9E9EB] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#696B79]">This Month</p>
            <p className="mt-2 text-xl font-extrabold text-[#282C3F]">{formatInr(stats.curr_month_revenue)}</p>
            <p className="text-xs text-[#696B79]">Revenue</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#F5F5F6]">
              <div className="h-full rounded-full bg-[#FF3F6C] transition-all" style={{ width: `${Math.min(100, (stats.curr_month_revenue / (stats.prev_month_revenue || 1)) * 100)}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E9E9EB] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#696B79]">This Month</p>
            <p className="mt-2 text-xl font-extrabold text-[#282C3F]">{stats.curr_month_orders}</p>
            <p className="text-xs text-[#696B79]">Orders</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#F5F5F6]">
              <div className="h-full rounded-full bg-[#2874F0] transition-all" style={{ width: `${Math.min(100, (stats.curr_month_orders / (stats.prev_month_orders || 1)) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
