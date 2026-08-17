// Saaya — shared components (atoms + molecules)
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ──────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG, original)
// ──────────────────────────────────────────────────────────────────────────────
const Icon = {
  search: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" />
    </svg>
  ),
  heart: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill={p.filled?"currentColor":"none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 20.5 4.6 13.2a4.8 4.8 0 0 1 6.8-6.8L12 7l.6-.6a4.8 4.8 0 0 1 6.8 6.8Z" />
    </svg>
  ),
  bag: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6Z" /><path d="M9 8a3 3 0 1 1 6 0" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-3.5 4.2-5 7-5s5.5 1.5 7 5" />
    </svg>
  ),
  menu: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill={p.filled?"currentColor":"none"} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.8 1-6L3.2 9.5l6.1-.9Z" />
    </svg>
  ),
  chevronDown: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  chevronLeft: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 6-6 6 6 6" />
    </svg>
  ),
  chevronRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10 6 6 6-6 6" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  ),
  truck: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" />
    </svg>
  ),
  ret: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h11a5 5 0 1 1 0 10H8" /><path d="m8 5-4 4 4 4" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  mic: (p) => (
    <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
};

// ──────────────────────────────────────────────────────────────────────────────
// Logo
// ──────────────────────────────────────────────────────────────────────────────
function Logo({ size = 26, color = "currentColor" }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.5" stroke={color} strokeWidth="1.4" />
        <path d="M10 19c0 2 2 3.2 4.4 3.2 2.5 0 4-1.2 4-2.8 0-3.6-8-2-8-5.4 0-1.6 1.6-2.8 3.8-2.8 2 0 3.6 1 3.8 2.6"
              stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
      <span className="serif" style={{ fontSize: size * 0.95, letterSpacing: '-0.01em', lineHeight: 1, color }}>
        Saaya
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Price + INR formatter
// ──────────────────────────────────────────────────────────────────────────────
function inr(n) {
  return '₹' + new Intl.NumberFormat('en-IN').format(n);
}
function pctOff(mrp, price) {
  return Math.round(((mrp - price) / mrp) * 100);
}
function PriceDisplay({ price, mrp, size = 'md' }) {
  const off = mrp ? pctOff(mrp, price) : 0;
  const sizes = {
    sm: { p: 13, m: 11.5, o: 11 },
    md: { p: 16, m: 13, o: 12.5 },
    lg: { p: 22, m: 14, o: 14 },
  };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <span className="mono" style={{ fontSize: s.p, fontWeight: 600, color: 'var(--ink)' }}>{inr(price)}</span>
      {mrp && mrp > price && (
        <>
          <span className="mono" style={{ fontSize: s.m, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{inr(mrp)}</span>
          <span style={{ fontSize: s.o, color: 'var(--brand)', fontWeight: 600 }}>{off}% off</span>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Rating stars (display)
// ──────────────────────────────────────────────────────────────────────────────
function Rating({ value, count, size = 13 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)', fontSize: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 999, border: '1px solid var(--border)' }}>
        <span style={{ color: '#1F8A5B', display: 'inline-flex' }}><Icon.star size={size} filled /></span>
        <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>{value.toFixed(1)}</span>
      </span>
      {count != null && <span className="mono" style={{ color: 'var(--ink-3)' }}>({new Intl.NumberFormat('en-IN').format(count)})</span>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Product placeholder art — different per product
// ──────────────────────────────────────────────────────────────────────────────
function ProductArt({ product, label = true, ratio = '3 / 4' }) {
  return (
    <div style={{ position: 'relative', aspectRatio: ratio, width: '100%' }}>
      <div className="ph" style={{
        '--ph-bg': product.tone,
        '--ph-fg': 'rgba(31,27,26,.6)',
        position: 'absolute', inset: 0,
      }}>
        {/* hint shape */}
        <div style={{
          position: 'absolute', inset: '12% 14% 18% 14%',
          background: `linear-gradient(180deg, ${product.swatch}33, ${product.swatch}11)`,
          border: `1px dashed ${product.swatch}66`,
          borderRadius: 6,
        }} />
        {label && <span className="ph-label">{product.cat} · product shot</span>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ProductCard
// ──────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, onOpen, onWishlist, isWishlisted, compact }) {
  const [popping, setPopping] = useState(false);
  const off = pctOff(product.mrp, product.price);
  const handleHeart = (e) => {
    e.stopPropagation();
    setPopping(true);
    setTimeout(() => setPopping(false), 420);
    onWishlist && onWishlist(product.id);
  };
  return (
    <article
      onClick={() => onOpen && onOpen(product)}
      className="lift"
      style={{
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative' }}>
        <ProductArt product={product} />
        {/* top badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {product.tag === 'New' && <span className="pill" style={{ background: 'var(--ink)', color: 'var(--surface)', borderColor: 'transparent' }}>New</span>}
          {product.tag === 'Bestseller' && <span className="pill" style={{ background: 'var(--accent)', color: 'var(--ink)', borderColor: 'transparent' }}>Bestseller</span>}
          {product.tag === 'Sale' && <span className="pill" style={{ background: 'var(--brand)', color: '#fff', borderColor: 'transparent' }}>Sale</span>}
        </div>
        {/* heart */}
        <button
          onClick={handleHeart}
          aria-label="Wishlist"
          className={popping ? 'heart-pop' : ''}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 34, height: 34, borderRadius: 999,
            background: 'rgba(255,255,255,.92)', border: '1px solid var(--border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: isWishlisted ? 'var(--brand)' : 'var(--ink-2)',
            boxShadow: '0 1px 4px rgba(31,27,26,.08)',
          }}
        >
          <Icon.heart filled={isWishlisted} size={16} />
        </button>
        {/* discount corner */}
        {off > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'var(--surface-2)', color: 'var(--brand)',
            padding: '4px 9px', borderRadius: 6, fontWeight: 600, fontSize: 11.5,
            border: '1px solid var(--border)',
          }}>
            {off}% off
          </div>
        )}
      </div>
      <div style={{ padding: compact ? '10px 12px 12px' : '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.02em', textTransform: 'uppercase' }}>{product.brand}</span>
          <Rating value={4 + (product.id.charCodeAt(2) % 9) / 10} count={120 + (product.id.charCodeAt(2) * 17) % 900} size={11} />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>
          {product.name}
        </div>
        <PriceDisplay price={product.price} mrp={product.mrp} size="md" />
        {/* color dots */}
        {product.colors && (
          <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
            {product.colors.slice(0,4).map((c, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: 999, background: c, border: '1px solid rgba(0,0,0,.08)' }} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Empty + Skeleton (light)
// ──────────────────────────────────────────────────────────────────────────────
function ProductCardSkeleton() {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ aspectRatio: '3/4', background: 'var(--surface-3)' }} />
      <div style={{ padding: 12 }}>
        <div style={{ height: 10, width: '40%', background: 'var(--surface-3)', borderRadius: 4 }} />
        <div style={{ height: 12, width: '80%', background: 'var(--surface-3)', borderRadius: 4, marginTop: 8 }} />
        <div style={{ height: 14, width: '50%', background: 'var(--surface-3)', borderRadius: 4, marginTop: 10 }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Export to window so other Babel-script files can use them
// ──────────────────────────────────────────────────────────────────────────────
Object.assign(window, {
  Icon, Logo, PriceDisplay, Rating, ProductArt, ProductCard, ProductCardSkeleton,
  inr, pctOff,
});
