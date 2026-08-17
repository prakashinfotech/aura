"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3,
  Wallet, Settings, LogOut, Menu, X, ChevronRight,
  Bell, TrendingUp,
} from "lucide-react";
import { cn } from "@aura/ui/cn";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Products",    href: "/dashboard/products",     icon: Package },
  { label: "Orders",      href: "/dashboard/orders",       icon: ShoppingBag },
  { label: "Analytics",   href: "/dashboard/analytics",   icon: BarChart3 },
  { label: "Settlements", href: "/dashboard/settlements",  icon: Wallet },
  { label: "Settings",    href: "/dashboard/settings",     icon: Settings },
];

interface SellerInfo {
  store_name: string;
  support_email: string | null;
  status: string;
}

function StoreAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#6366f1] text-xs font-bold text-white shadow-sm">
      {initials || "S"}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [seller, setSeller] = React.useState<SellerInfo | null>(null);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any)
        .from("sellers")
        .select("store_name, support_email, status, business_phone")
        .eq("user_id", session.user.id)
        .single();
      setSeller({
        store_name:    data?.store_name ?? "My Store",
        support_email: data?.support_email ?? session.user.email ?? null,
        status:        data?.status ?? "pending",
      });
    })();
  }, []);

  const statusBanner = seller && seller.status !== "approved" ? (
    <div className={cn(
      "mx-3 mt-2 mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
      seller.status === "pending"   ? "bg-amber-500/15 text-amber-300"
      : seller.status === "rejected"  ? "bg-red-500/15 text-red-300"
      : "bg-red-500/15 text-red-300"
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {seller.status === "pending"   && "Application under review"}
      {seller.status === "rejected"  && "Application rejected"}
      {seller.status === "suspended" && "Account suspended"}
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen bg-[#F5F5F6]">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
        style={{ background: "linear-gradient(180deg, #282C3F 0%, #1e2130 100%)" }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            {/* Aura-style wordmark */}
            <div className="flex items-center gap-1">
              <span className="text-[22px] font-extrabold leading-none tracking-tight text-white">A</span>
              <div className="flex flex-col gap-0">
                <span className="text-[9px] font-bold uppercase leading-none tracking-[0.15em] text-[#6366f1]">SELLER</span>
                <span className="text-[9px] font-bold uppercase leading-none tracking-[0.15em] text-white/50">HUB</span>
              </div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white md:hidden">
            <X size={18} />
          </button>
        </div>

        {statusBanner}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative mb-0.5 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#6366f1]/15 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
              >
                {/* Active left bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#6366f1]" />
                )}
                <item.icon
                  size={17}
                  className={cn("shrink-0 transition-colors", active ? "text-[#6366f1]" : "text-white/40 group-hover:text-white/70")}
                />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={13} className="text-[#6366f1]/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/8" />

        {/* Seller footer */}
        <div className="px-3 py-4">
          <div className="mb-3 flex items-center gap-3 rounded-[10px] bg-white/5 px-3 py-2.5">
            <StoreAvatar name={seller?.store_name ?? "S"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/90">
                {seller?.store_name ?? "Loading…"}
              </p>
              <p className="truncate text-[10px] text-white/35">
                {seller?.support_email ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const { createClient: cc } = await import("@aura/db/client");
              await cc().auth.signOut();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-xs font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#E9E9EB] bg-white px-4 py-3 shadow-sm md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E9E9EB] text-[#282C3F]"
          >
            <Menu size={19} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold leading-none text-[#282C3F]">A</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#6366f1]">SELLER</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="max-w-[120px] truncate text-xs font-medium text-[#696B79]">
              {seller?.store_name ?? ""}
            </span>
            <div className="relative">
              <Bell size={18} className="text-[#282C3F]" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#6366f1]" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E9E9EB] px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#94969F]">© 2025 Aura Seller Hub</span>
            <div className="flex items-center gap-1 text-[11px] text-[#94969F]">
              <TrendingUp size={11} className="text-[#03A685]" />
              <span>All systems operational</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
