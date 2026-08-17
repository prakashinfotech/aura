"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@aura/ui/cn";

export interface BannerSlide {
  id: string;
  image_url_desktop: string;
  image_url_mobile: string;
  target_url: string | null;
  heading?: string | null;
  subheading?: string | null;
  cta?: string | null;
  overlay?: "dark" | "light" | "none";
}

const UNS = "https://images.unsplash.com/photo-";
const DQ = "?auto=format&fit=crop&w=1600&h=500&q=85";
const MQ = "?auto=format&fit=crop&w=800&h=400&q=80";

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: "fb1",
    image_url_desktop: `${UNS}1483985988355-763728e1935b${DQ}`,
    image_url_mobile: `${UNS}1483985988355-763728e1935b${MQ}`,
    target_url: "/category/women",
    heading: "New Season Collection",
    subheading: "Women's Fashion — Up to 50% Off",
    cta: "Shop Women",
    overlay: "dark",
  },
  {
    id: "fb2",
    image_url_desktop: `${UNS}1490578474895-06ad3a1f81ec${DQ}`,
    image_url_mobile: `${UNS}1490578474895-06ad3a1f81ec${MQ}`,
    target_url: "/category/men",
    heading: "Men's Essentials",
    subheading: "Top Brands. Best Prices. Free Delivery",
    cta: "Shop Men",
    overlay: "dark",
  },
  {
    id: "fb3",
    image_url_desktop: `${UNS}1607082348824-0a96f2a4b9da${DQ}`,
    image_url_mobile: `${UNS}1607082348824-0a96f2a4b9da${MQ}`,
    target_url: "/category",
    heading: "End of Season Sale",
    subheading: "Grab Up to 80% Off — Limited Time Only",
    cta: "Shop Sale",
    overlay: "dark",
  },
  {
    id: "fb4",
    image_url_desktop: `${UNS}1596462502278-27bfdc403348${DQ}`,
    image_url_mobile: `${UNS}1596462502278-27bfdc403348${MQ}`,
    target_url: "/category/beauty",
    heading: "Beauty & Skincare",
    subheading: "Discover Top Beauty Brands",
    cta: "Shop Beauty",
    overlay: "dark",
  },
];

interface HeroCarouselProps {
  slides?: BannerSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const activeSlides = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4500, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  return (
    <section className="relative w-full overflow-hidden bg-[var(--secondary)]" aria-label="Featured promotions">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {activeSlides.map((slide) => (
            <SlideItem key={slide.id} slide={slide} />
          ))}
        </div>
      </div>

      {/* Dot nav */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === selectedIndex ? "w-8 bg-white" : "w-2 bg-white/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40 md:left-5"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous slide"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40 md:right-5"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next slide"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}

function SlideItem({ slide }: { slide: BannerSlide }) {
  const href = slide.target_url ?? "/category";
  const hasText = slide.heading || slide.subheading;

  return (
    <Link href={href} className="relative min-w-0 flex-[0_0_100%] block" aria-label={slide.heading ?? "Banner"}>
      {/* Mobile image */}
      <div className="relative aspect-[2/1] w-full overflow-hidden md:hidden">
        <Image
          src={slide.image_url_mobile}
          alt={slide.heading ?? "Banner"}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {slide.overlay !== "none" && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        )}
        {hasText && (
          <div className="absolute inset-0 flex items-center px-6">
            <SlideText slide={slide} mobile />
          </div>
        )}
      </div>

      {/* Desktop image */}
      <div className="relative hidden aspect-[16/5] w-full overflow-hidden md:block">
        <Image
          src={slide.image_url_desktop}
          alt={slide.heading ?? "Banner"}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {slide.overlay !== "none" && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
        )}
        {hasText && (
          <div className="absolute inset-0 flex items-center px-12 md:px-20">
            <SlideText slide={slide} />
          </div>
        )}
      </div>
    </Link>
  );
}

function SlideText({ slide, mobile = false }: { slide: BannerSlide; mobile?: boolean }) {
  return (
    <div className="max-w-sm space-y-2 md:max-w-lg md:space-y-3">
      {slide.heading && (
        <h2 className={cn("font-bold leading-tight text-white drop-shadow", mobile ? "text-xl" : "text-3xl md:text-4xl")}>
          {slide.heading}
        </h2>
      )}
      {slide.subheading && (
        <p className={cn("text-white/90 drop-shadow", mobile ? "text-xs" : "text-sm md:text-base")}>
          {slide.subheading}
        </p>
      )}
      {slide.cta && (
        <span className={cn("inline-block rounded-[var(--radius-md)] bg-[var(--brand)] font-semibold text-white shadow-md", mobile ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm")}>
          {slide.cta}
        </span>
      )}
    </div>
  );
}
