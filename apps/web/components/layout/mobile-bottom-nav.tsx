"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2X2, Search, Heart, User } from "lucide-react";
import { cn } from "@aura/ui/cn";
import { useWishlistStore } from "@/stores/wishlist-store";

const TABS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "categories", label: "Shop", icon: Grid2X2, href: "/category" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "wishlist", label: "Wishlist", icon: Heart, href: "/wishlist" },
  { id: "profile", label: "Profile", icon: User, href: "/account/profile" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const wishCount = useWishlistStore((s) => s.items.size);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] md:hidden"
      style={{
        height: "var(--bottom-nav-height)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Bottom navigation"
    >
      <div className="grid h-full grid-cols-5">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-[var(--brand)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={cn(
                    isActive && "fill-[var(--brand-soft)]"
                  )}
                />
                {tab.id === "wishlist" && wishCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--brand)] px-0.5 text-[8px] font-bold text-white">
                    {wishCount > 9 ? "9+" : wishCount}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
