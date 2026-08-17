"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, X, LogOut, Package } from "lucide-react";
import { cn } from "@aura/ui/cn";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchBar } from "@/components/search/search-bar";
import { MobileMenuDrawer } from "@/components/layout/mobile-menu-drawer";

const NAV_LINKS = [
  { label: "MEN", href: "/category/men" },
  { label: "WOMEN", href: "/category/women" },
  { label: "KIDS", href: "/category/kids" },
  { label: "BEAUTY", href: "/category/beauty" },
  { label: "HOME", href: "/category/home" },
  { label: "STUDIO", href: "/category/studio" },
];

export function Header() {
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.itemCount());
  const wishCount = useWishlistStore((s) => s.items.size);
  const { user, signOut } = useAuth();
  const { openAuth } = useAuthModal();

  // Close user menu on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* Main header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white shadow-sm">

        <div
          className="mx-auto flex max-w-[var(--max-width)] items-center gap-3 px-4 md:gap-6 md:px-6"
          style={{ height: "var(--header-height)" }}
        >
          {/* Mobile menu */}
          <button
            className="flex items-center justify-center rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground)] hover:bg-[var(--background)] md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            aria-label="Aura home"
            className="shrink-0 text-2xl font-black italic tracking-tight text-[var(--brand)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Aura
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-end gap-0 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center px-3 py-1 text-sm font-semibold tracking-wide transition-colors hover:text-[var(--brand)]",
                  pathname.startsWith(link.href)
                    ? "text-[var(--brand)] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:bg-[var(--brand)] after:content-['']"
                    : "text-[var(--foreground)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Desktop search */}
          <div className="hidden w-full max-w-xs md:block lg:max-w-sm">
            <SearchBar />
          </div>

          {/* Mobile search toggle */}
          <button
            className="flex items-center justify-center rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground)] hover:bg-[var(--background)] md:hidden"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={20} />
          </button>

          {/* Right icons */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Profile / Login */}
            {user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 text-[var(--foreground)] hover:text-[var(--brand)]"
                >
                  <User size={20} />
                  <span className="text-[10px] font-semibold">Profile</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
                    <div className="border-b border-[var(--border)] px-4 py-3">
                      <p className="text-xs text-[var(--foreground-muted)]">Signed in as</p>
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {user.email ?? user.phone ?? "User"}
                      </p>
                    </div>
                    <MenuItem href="/account/profile" icon={<User size={15} />} label="My Profile" onClick={() => setUserMenuOpen(false)} />
                    <MenuItem href="/account/orders" icon={<Package size={15} />} label="Orders" onClick={() => setUserMenuOpen(false)} />
                    <MenuItem href="/wishlist" icon={<Heart size={15} />} label="Wishlist" onClick={() => setUserMenuOpen(false)} />
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--error)] hover:bg-[var(--background)]"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="hidden flex-col items-center gap-0.5 px-2 py-1 text-[var(--foreground)] hover:text-[var(--brand)] md:flex"
              >
                <User size={20} />
                <span className="text-[10px] font-semibold">Login</span>
              </button>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-[var(--foreground)] hover:text-[var(--brand)]"
              aria-label={`Wishlist${wishCount > 0 ? `, ${wishCount} items` : ""}`}
            >
              <Heart size={20} />
              <span className="hidden text-[10px] font-semibold md:block">Wishlist</span>
              {wishCount > 0 && <CountBadge count={wishCount} />}
            </Link>

            {/* Cart/Bag */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 text-[var(--foreground)] hover:text-[var(--brand)]"
              aria-label={`Bag${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag size={20} />
              <span className="hidden text-[10px] font-semibold md:block">Bag</span>
              {cartCount > 0 && <CountBadge count={cartCount} />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="flex items-center gap-2 border-t border-[var(--border)] bg-white px-4 py-3 md:hidden">
            <div className="flex-1">
              <SearchBar autoFocus onSubmit={() => setSearchOpen(false)} />
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background)]"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} />
    </>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--background)] hover:text-[var(--brand)]"
    >
      {icon}
      {label}
    </Link>
  );
}
