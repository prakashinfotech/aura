import * as React from "react";
import Image from "next/image";
import Link from "next/link";

const UNS = "https://images.unsplash.com/photo-";

const BANNERS = [
  {
    id: "sale",
    heading: "End of Season Sale",
    sub: "Up to 80% off on top brands",
    href: "/category",
    cta: "Shop Now",
    img: `${UNS}1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&h=320&q=80`,
    gradient: "from-black/70 via-black/40 to-transparent",
    accent: "var(--brand)",
  },
  {
    id: "insider",
    heading: "Aura Insider",
    sub: "Join & unlock exclusive member perks",
    href: "/insider",
    cta: "Join Free",
    img: `${UNS}1483985988355-763728e1935b?auto=format&fit=crop&w=800&h=320&q=80`,
    gradient: "from-black/70 via-black/40 to-transparent",
    accent: "#FFD700",
  },
];

export function PromoBanners() {
  return (
    <section className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-2">
      {BANNERS.map((banner) => (
        <Link
          key={banner.id}
          href={banner.href}
          className="group relative flex h-36 overflow-hidden rounded-[var(--radius-lg)] md:h-40"
          aria-label={banner.heading}
        >
          <Image
            src={banner.img}
            alt={banner.heading}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: banner.accent }}>
              {banner.sub}
            </p>
            <p className="mt-1 text-xl font-bold text-white drop-shadow">{banner.heading}</p>
            <span className="mt-3 inline-block self-start rounded-[var(--radius-sm)] bg-white px-4 py-1.5 text-xs font-bold text-[var(--secondary)] transition group-hover:bg-[var(--brand)] group-hover:text-white">
              {banner.cta} →
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
