"use client";

import * as React from "react";
import {
  TrendingUp, ShoppingBag, Star, ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import { formatInr } from "@aura/ui/price-display";
import { createClient } from "@/lib/supabase/client";

interface MonthlyRow { month_label: string; revenue: number; order_count: number }
interface TopProduct  { product_id: string; product_title: string; units_sold: number; revenue: number; avg_rating: number }
interface DashStats   { total_revenue: number; total_orders: number; avg_rating: number; curr_month_revenue: number; prev_month_revenue: number; curr_month_orders: number; prev_month_orders: number }

function pct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function StatCard({ label, value, change, icon: Icon }: { label: string; value: string; change: number; icon: React.ElementType }) {
  const pos = change >= 0;
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-soft)]">
          <Icon size={18} className="text-[var(--brand)]" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${pos ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
        {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(change)}% vs last month
      </p>
    </div>
  );
}

function RevenueChart({ data }: { data: MonthlyRow[] }) {
  const max = Math.max(...data.map((d) => Number(d.revenue)), 1);
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d) => {
        const h = Math.max(4, Math.round((Number(d.revenue) / max) * 100));
        return (
          <div key={d.month_label} className="group flex flex-1 flex-col items-center gap-1">
            <div className="relative w-full flex-1">
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-[var(--brand-soft)] transition-all group-hover:bg-[var(--brand)]"
                style={{ height: `${h}%` }}
                title={`${d.month_label}: ${formatInr(d.revenue)} (${d.order_count} orders)`}
              />
            </div>
            <span className="text-[10px] font-medium text-[var(--foreground-muted)]">{d.month_label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = React.useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashStats | null>(null);
  const [monthly, setMonthly] = React.useState<MonthlyRow[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data: seller } = await (supabase as any)
        .from("sellers").select("id").eq("user_id", session.user.id).single();
      if (!seller) { setLoading(false); return; }

      const [statsRes, monthlyRes, topRes] = await Promise.all([
        (supabase as any).rpc("get_seller_dashboard_stats", { p_seller_id: seller.id }),
        (supabase as any).rpc("get_seller_monthly_revenue", { p_seller_id: seller.id, p_months: 6 }),
        (supabase as any).rpc("get_seller_top_products",    { p_seller_id: seller.id, p_limit: 5 }),
      ]);

      if (statsRes.data)   setStats(statsRes.data as DashStats);
      if (monthlyRes.data) setMonthly(monthlyRes.data as MonthlyRow[]);
      if (topRes.data)     setTopProducts(topRes.data as TopProduct[]);
      setLoading(false);
    })();
  }, []);

  const revenueChange = stats ? pct(stats.curr_month_revenue, stats.prev_month_revenue) : 0;
  const ordersChange  = stats ? pct(stats.curr_month_orders,  stats.prev_month_orders)  : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Analytics</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Performance overview for your store</p>
        </div>
        <div className="flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] text-xs font-semibold">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${period === p ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--background)]"}`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Revenue" value={stats ? formatInr(stats.total_revenue) : "—"} change={revenueChange} icon={TrendingUp} />
        <StatCard label="Total Orders"  value={stats ? String(stats.total_orders)     : "—"} change={ordersChange}  icon={ShoppingBag} />
        <StatCard label="Avg Rating"    value={stats?.avg_rating ? `${stats.avg_rating}★` : "—"} change={0} icon={Star} />
      </div>

      {/* Revenue chart */}
      {monthly.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--foreground)]">Monthly Revenue</h2>
            <span className="text-xs text-[var(--foreground-muted)]">Last 6 months</span>
          </div>
          <RevenueChart data={monthly} />
          <div className="mt-4 grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${monthly.length}, 1fr)` }}>
            {monthly.map((d) => (
              <div key={d.month_label}>
                <p className="text-xs font-bold text-[var(--foreground)]">
                  {Number(d.revenue) > 0 ? `₹${Math.round(Number(d.revenue) / 1000)}K` : "—"}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)]">{d.order_count} orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top products */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">Top Performing Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--foreground-muted)]">
            No sales data yet — orders will populate this table.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  {["#", "Product", "Units Sold", "Revenue", "Rating"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
                    <td className="px-5 py-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-bold text-[var(--brand)]">{i + 1}</span>
                    </td>
                    <td className="max-w-[200px] px-5 py-4 text-sm font-medium text-[var(--foreground)] truncate">{p.product_title}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)]">{Number(p.units_sold)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)]">{formatInr(Number(p.revenue))}</td>
                    <td className="px-5 py-4">
                      {Number(p.avg_rating) > 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[var(--success)] px-1.5 py-0.5 text-xs font-bold text-white">
                          {Number(p.avg_rating).toFixed(1)}★
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--foreground-muted)]">No reviews</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
