import * as React from "react";
import Link from "next/link";

const FOOTER_LINKS = {
  "Online Shopping": [
    { label: "Men", href: "/category/men" },
    { label: "Women", href: "/category/women" },
    { label: "Kids", href: "/category/kids" },
    { label: "Beauty", href: "/category/beauty" },
    { label: "Home & Living", href: "/category/home" },
    { label: "Gift Cards", href: "/gift-cards" },
  ],
  "Customer Policies": [
    { label: "Contact Us", href: "/help/contact" },
    { label: "FAQ", href: "/help/faq" },
    { label: "T&C", href: "/terms" },
    { label: "Terms of Use", href: "/terms-of-use" },
    { label: "Track Orders", href: "/track-order" },
    { label: "Shipping", href: "/help/shipping" },
    { label: "Cancellation", href: "/help/cancellation" },
    { label: "Returns", href: "/help/returns" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
  Experience: [
    { label: "Aura Insider", href: "/insider" },
    { label: "Aura Studio", href: "/category/studio" },
    { label: "Sell on Aura", href: "https://seller.aura.local" },
  ],
};

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    bg: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://twitter.com",
    bg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    bg: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--secondary)] text-white">
      <div className="mx-auto max-w-[var(--max-width)] px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-bold tracking-tight">aura</span>
            <p className="mt-2 text-sm text-white/60">
              India's fashion destination. Shop the latest styles from top brands.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                  style={{ background: s.bg }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Aura Marketplace. All rights reserved.
          <span className="mx-2">·</span>
          <span className="font-mono">v1.0.0.0</span>
        </div>
      </div>
    </footer>
  );
}
