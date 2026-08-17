import * as React from "react";
import Image from "next/image";
import Link from "next/link";

const UNS = "https://images.unsplash.com/photo-";
const Q = "?auto=format&fit=crop&w=200&h=200&q=80";

const CATEGORIES = [
  {
    id: "men",
    label: "Men",
    href: "/category/men",
    img: `${UNS}1617137968427-85924c800a22${Q}`,
    accent: "#E8EAF6",
  },
  {
    id: "women",
    label: "Women",
    href: "/category/women",
    img: `${UNS}1496747611176-843222e1e57c${Q}`,
    accent: "#FCE4EC",
  },
  {
    id: "kids",
    label: "Kids",
    href: "/category/kids",
    img: "/images/kids-category.webp",
    accent: "#FFF9C4",
  },
  {
    id: "beauty",
    label: "Beauty",
    href: "/category/beauty",
    img: `${UNS}1596462502278-27bfdc403348${Q}`,
    accent: "#F3E5F5",
  },
  {
    id: "home",
    label: "Home",
    href: "/category/home",
    img: `${UNS}1505693416388-ac5ce068fe85${Q}`,
    accent: "#E0F2F1",
  },
  {
    id: "studio",
    label: "Studio",
    href: "/category/studio",
    img: `${UNS}1558655146-9f40138edfeb${Q}`,
    accent: "#FFF3E0",
  },
];

export function CategoryGrid() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-6">
      <h2 className="mb-5 text-center text-base font-bold tracking-wide text-[var(--foreground)] md:text-lg">
        Shop by Category
      </h2>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group flex flex-col items-center gap-2"
            aria-label={`Shop ${cat.label}`}
          >
            <div
              className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-transparent ring-2 ring-transparent transition-all duration-200 group-hover:ring-[var(--brand)] group-hover:ring-offset-2 md:h-24 md:w-24"
              style={{ background: cat.accent }}
            >
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="96px"
              />
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--brand)]">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
