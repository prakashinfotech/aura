import * as React from "react";
import Link from "next/link";

const ACCOUNT_LINKS = [
  { label: "Profile", href: "/account/profile" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Help", href: "/help" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[var(--max-width)] px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <aside className="hidden md:block">
          <nav className="sticky top-[calc(var(--header-height)+1.5rem)] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {ACCOUNT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between border-b border-[var(--border)] last:border-0 px-5 py-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] hover:text-[var(--brand)]"
              >
                {link.label}
                <span className="text-[var(--foreground-subtle)]">›</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
