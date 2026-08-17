// Saaya — screens: Home, PLP, PDP, Cart drawer
const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS, useCallback: useCallbackS } = React;

// ──────────────────────────────────────────────────────────────────────────────
// HEADER (desktop + mobile)
// ──────────────────────────────────────────────────────────────────────────────
function Header({ route, navigate, bagCount, wishCount, onOpenSearch, onOpenBag, onOpenMenu }) {
  const cats = window.SAAYA_DATA.cats;
  const [searchOpen, setSearchOpen] = useStateS(false);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Announcement bar */}
      <div style={{ background: 'var(--ink)', color: 'var(--surface)', fontSize: 11.5, letterSpacing: '.02em' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
          <span style={{ fontFamily: 'var(--font-mono)', opacity: .85 }}>FREE SHIPPING ON ORDERS OVER ₹1,499 · EASY 14-DAY RETURNS</span>
          <span style={{ display: 'none', gap: 16, fontFamily: 'var(--font-mono)', opacity: .85 }} className="hide-mobile">
            <span>Track Order</span><span>Saaya Insider</span><span>Help</span>
          </span>
        </div>
      </div>

      {/* Main row */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24, height: 64 }}>
        {/* Mobile menu */}
        <button onClick={onOpenMenu} className="hide-desktop" aria-label="Menu" style={{
          background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', display: 'inline-flex'
        }}>
          <Icon.menu size={22} />
        </button>

        <button onClick={() => navigate({ name: 'home' })} aria-label="Saaya home" style={{ background: 'transparent', border: 0, padding: 0 }}>
          <Logo size={26} />
        </button>

        {/* Desktop nav */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 22, marginLeft: 12 }}>
          {cats.map(c => (
            <button key={c.id}
              onClick={() => navigate({ name: 'plp', cat: c.id })}
              style={{
                background: 'transparent', border: 0, padding: '8px 0',
                fontSize: 13.5, fontWeight: 500, color: 'var(--ink)',
                borderBottom: route.name === 'plp' && route.cat === c.id ? `2px solid var(--brand)` : '2px solid transparent',
              }}>
              {c.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div className="hide-mobile" style={{ flex: '0 1 380px' }}>
          <SearchBar onSubmit={(q) => navigate({ name: 'plp', cat: 'women', q })} />
        </div>
        <button onClick={() => setSearchOpen(true)} className="hide-desktop" aria-label="Search" style={{
          background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', display: 'inline-flex'
        }}>
          <Icon.search size={20} />
        </button>

        {/* Right actions */}
        <IconAction label="Profile" Icon={Icon.user} className="hide-mobile" onClick={() => navigate({ name: 'profile' })} />
        <IconAction label="Wishlist" Icon={Icon.heart} count={wishCount} onClick={() => navigate({ name: 'wishlist' })} />
        <IconAction label="Bag" Icon={Icon.bag} count={bagCount} onClick={onOpenBag} />
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div style={{ padding: '10px 16px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SearchBar onSubmit={(q) => { setSearchOpen(false); navigate({ name: 'plp', cat: 'women', q }); }} autoFocus />
          </div>
          <button className="btn btn-ghost" onClick={() => setSearchOpen(false)} style={{ padding: '10px 14px' }}>Cancel</button>
        </div>
      )}

      <style>{`
        @media (max-width: 899px) { .hide-mobile { display: none !important; } }
        @media (min-width: 900px) { .hide-desktop { display: none !important; } }
      `}</style>
    </header>
  );
}

function IconAction({ Icon: I, count, onClick, label, className }) {
  return (
    <button onClick={onClick} aria-label={label} className={className} style={{
      background: 'transparent', border: 0, padding: 6, color: 'var(--ink)',
      position: 'relative', display: 'inline-flex', alignItems: 'center',
    }}>
      <I size={20} />
      {count > 0 && (
        <span className="mono" style={{
          position: 'absolute', top: -2, right: -4,
          background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 600,
          minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{count}</span>
      )}
    </button>
  );
}

function SearchBar({ onSubmit, autoFocus }) {
  const [q, setQ] = useStateS('');
  const [focused, setFocused] = useStateS(false);
  const suggestions = ['Block-print kurta', 'Linen blazer men', 'Silk saree', 'Bandhgala jacket', 'Wide-leg trousers'];
  const filtered = q ? suggestions.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 4) : [];
  return (
    <div style={{ position: 'relative' }}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(q || 'kurta'); }} style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 42,
        padding: '0 14px', borderRadius: 999, border: '1px solid var(--border-strong)',
        background: 'var(--surface-2)',
      }}>
        <Icon.search size={16} />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search for products, brands & more"
          style={{
            flex: 1, height: '100%', border: 0, background: 'transparent', outline: 'none',
            fontSize: 13.5, color: 'var(--ink)',
          }}
        />
        <button type="button" aria-label="Voice search" style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--ink-2)', display: 'inline-flex' }}>
          <Icon.mic />
        </button>
      </form>
      {focused && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 50,
        }}>
          {filtered.map(s => (
            <button key={s} onMouseDown={() => onSubmit && onSubmit(s)} style={{
              display: 'flex', width: '100%', gap: 10, padding: '10px 14px', alignItems: 'center',
              background: 'transparent', border: 0, textAlign: 'left', fontSize: 13, color: 'var(--ink-2)',
            }}>
              <Icon.search size={14} /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MOBILE BOTTOM TAB BAR
// ──────────────────────────────────────────────────────────────────────────────
function MobileTabBar({ route, navigate, onOpenBag }) {
  const tabs = [
    { id: 'home',     label: 'Home',     Icon: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="m3 11 9-7 9 7v9h-6v-6h-6v6H3z"/></svg>) },
    { id: 'cats',     label: 'Shop',     Icon: () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>) },
    { id: 'wishlist', label: 'Wishlist', Icon: Icon.heart },
    { id: 'profile',  label: 'Account',  Icon: Icon.user },
  ];
  return (
    <nav className="hide-desktop" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
      background: 'var(--surface-2)', borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    }}>
      {tabs.map(t => {
        const active = (t.id === 'home' && route.name === 'home') ||
                       (t.id === 'cats' && route.name === 'plp') ||
                       (t.id === 'wishlist' && route.name === 'wishlist') ||
                       (t.id === 'profile' && route.name === 'profile');
        return (
          <button key={t.id} onClick={() => {
            if (t.id === 'home') navigate({ name: 'home' });
            else if (t.id === 'cats') navigate({ name: 'plp', cat: 'women' });
            else if (t.id === 'wishlist') navigate({ name: 'wishlist' });
            else if (t.id === 'profile') navigate({ name: 'profile' });
          }} style={{
            background: 'transparent', border: 0, padding: '10px 4px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: active ? 'var(--brand)' : 'var(--ink-2)',
            fontSize: 10.5, fontWeight: 500,
          }}>
            <t.Icon /> {t.label}
          </button>
        );
      })}
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ──────────────────────────────────────────────────────────────────────────────
function HomeScreen({ navigate, onWishlist, wishlist, onOpenPDP }) {
  const data = window.SAAYA_DATA;
  const products = data.products;
  return (
    <div style={{ paddingBottom: 60 }}>
      {/* HERO */}
      <Hero navigate={navigate} />

      {/* Category quick-links */}
      <section style={{ padding: '36px 0 8px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <h2 className="serif" style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.01em' }}>Shop by Category</h2>
          </div>
          <div className="h-scroll" style={{ display: 'flex', gap: 18, padding: '4px 0' }}>
            {data.cats.map(c => (
              <button key={c.id} onClick={() => navigate({ name: 'plp', cat: c.id })}
                style={{
                  background: 'transparent', border: 0, padding: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  flexShrink: 0, minWidth: 84, cursor: 'pointer',
                }}>
                <span style={{
                  width: 86, height: 86, borderRadius: 999,
                  background: `linear-gradient(135deg, ${c.hue}33, ${c.hue}11)`,
                  border: `2px solid ${c.hue}55`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  color: c.hue, fontFamily: 'var(--font-display)', fontSize: 26,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {c.img
                    ? <img src={c.img} alt={c.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : c.label[0]
                  }
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial split */}
      <EditorialSplit navigate={navigate} />

      {/* Trending */}
      <ProductRail
        eyebrow="The Edit · 02"
        title="Trending this week"
        subtitle="Re-loved pieces from our handpicked atelier."
        cta={{ label: 'Browse all new', onClick: () => navigate({ name: 'plp', cat: 'women' }) }}
        products={products.slice(0, 6)}
        onOpen={onOpenPDP} onWishlist={onWishlist} wishlist={wishlist}
      />

      {/* Deals strip */}
      <DealsStrip />

      {/* Deal products */}
      <ProductRail
        eyebrow="The Edit · 03"
        title="Deals of the day"
        subtitle="Limited drop. Restocks not guaranteed."
        cta={{ label: 'See all deals', onClick: () => navigate({ name: 'plp', cat: 'women' }) }}
        products={products.slice(2, 10)}
        onOpen={onOpenPDP} onWishlist={onWishlist} wishlist={wishlist}
      />

      {/* Brand strip */}
      <BrandStrip />

      {/* Insider banner */}
      <InsiderBanner />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Hero({ navigate }) {
  return (
    <section style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 56 }}>
        <div className="hero-grid">
          <div>
            <div className="pill" style={{ background: 'var(--surface-2)', marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--brand)' }} /> Edit 14 · Monsoon Drop
            </div>
            <h1 className="serif" style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 1.04, letterSpacing: '-0.02em' }}>
              The new<br />
              <em style={{ color: 'var(--brand)' }}>monsoon</em> wardrobe<br />
              has arrived.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: 440, marginTop: 18, lineHeight: 1.6 }}>
              Handloom silks, breezy cottons and a quietly tailored line — curated for
              the season's stickier days and softer evenings.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate({ name: 'plp', cat: 'women' })} style={{ padding: '14px 22px' }}>
                Shop the edit <Icon.arrowRight />
              </button>
              <button className="btn btn-ghost" onClick={() => navigate({ name: 'plp', cat: 'men' })} style={{ padding: '14px 22px' }}>
                Shop menswear
              </button>
            </div>
            <div style={{ display: 'flex', gap: 28, marginTop: 36, color: 'var(--ink-2)', fontSize: 12.5 }}>
              <div><div className="serif" style={{ fontSize: 26, color: 'var(--ink)' }}>1.2M</div>orders / month</div>
              <div><div className="serif" style={{ fontSize: 26, color: 'var(--ink)' }}>4,800+</div>brands & ateliers</div>
              <div><div className="serif" style={{ fontSize: 26, color: 'var(--ink)' }}>14d</div>easy returns</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="hero-art-grid">
              <div style={{ gridArea: 'a', position: 'relative' }}>
                <div className="ph" style={{ '--ph-bg': '#E3C1B7', borderRadius: 'var(--r-lg)', height: '100%' }}>
                  <span className="ph-label">editorial · saree, model shot</span>
                </div>
                <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>
                  Handloom · Solene
                </div>
              </div>
              <div style={{ gridArea: 'b' }}>
                <div className="ph" style={{ '--ph-bg': '#CFC0AB', borderRadius: 'var(--r-lg)', height: '100%' }}>
                  <span className="ph-label">menswear · linen blazer</span>
                </div>
              </div>
              <div style={{ gridArea: 'c' }}>
                <div className="ph" style={{ '--ph-bg': '#BFC6CC', borderRadius: 'var(--r-lg)', height: '100%' }}>
                  <span className="ph-label">accessory · clutch</span>
                </div>
              </div>
            </div>
            {/* Floating quote card */}
            <div style={{
              position: 'absolute', bottom: -24, left: -24,
              background: 'var(--surface-2)', padding: '14px 16px', borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-md)', maxWidth: 220, display: 'none',
            }} className="show-desktop">
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Featured in</div>
              <div className="serif" style={{ fontSize: 18, lineHeight: 1.3, marginTop: 4 }}>"Indian fashion's most considered marketplace."</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 6 }}>— Verve, May 2026</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .hero-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 56px; align-items: center; }
        .hero-art-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          grid-template-rows: 1fr 1fr;
          grid-template-areas: "a b" "a c";
          gap: 12px;
          height: 480px;
        }
        @media (max-width: 899px) {
          .hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .hero-art-grid { height: 380px; }
        }
        @media (min-width: 900px) { .show-desktop { display: block !important; } }
      `}</style>
    </section>
  );
}

function EditorialSplit({ navigate }) {
  const cards = [
    { tag: 'Heritage', title: 'Block-prints, by hand.', body: 'Pieces traced from family ledgers in Bagru and Sanganer.', tone: '#E3C1B7' },
    { tag: 'Tailored', title: 'The Studio line.', body: 'Quietly cut suiting, sized in half-numbers.', tone: '#3D4D58' },
  ];
  return (
    <section style={{ padding: '32px 0' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <button key={i} onClick={() => navigate({ name: 'plp', cat: i ? 'men' : 'women' })}
            style={{
              position: 'relative', overflow: 'hidden', borderRadius: 'var(--r-lg)',
              border: 0, padding: 0, textAlign: 'left', cursor: 'pointer',
              minHeight: 260, color: i === 1 ? '#fff' : 'var(--ink)',
              background: c.tone,
            }}>
            <div className="ph" style={{ '--ph-bg': c.tone, position: 'absolute', inset: 0 }}>
              <span className="ph-label" style={{ color: i === 1 ? 'rgba(255,255,255,.7)' : undefined }}>editorial · {c.tag.toLowerCase()}</span>
            </div>
            <div style={{ position: 'relative', padding: 28, maxWidth: 380 }}>
              <div className="pill" style={{ background: i === 1 ? 'rgba(255,255,255,.18)' : 'var(--surface-2)', borderColor: 'transparent', color: 'inherit' }}>{c.tag}</div>
              <h3 className="serif" style={{ fontSize: 36, lineHeight: 1.1, margin: '14px 0 8px', letterSpacing: '-0.02em' }}>{c.title}</h3>
              <p style={{ fontSize: 14, opacity: .85, margin: 0, maxWidth: 280 }}>{c.body}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 13, fontWeight: 500, borderBottom: '1px solid currentColor', paddingBottom: 2 }}>
                Explore <Icon.arrowRight />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductRail({ eyebrow, title, subtitle, cta, products, onOpen, onWishlist, wishlist }) {
  return (
    <section style={{ padding: '40px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{eyebrow}</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '8px 0 6px', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</h2>
            {subtitle && <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: 14 }}>{subtitle}</p>}
          </div>
          {cta && (
            <button onClick={cta.onClick} className="btn btn-ghost">
              {cta.label} <Icon.arrowRight />
            </button>
          )}
        </div>
        <div className="h-scroll" style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(220px, 1fr)', gap: 14, padding: '4px 0 12px' }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p}
              onOpen={onOpen} onWishlist={onWishlist}
              isWishlisted={wishlist.has(p.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealsStrip() {
  const [tick, setTick] = useStateS(60 * 60 * 7 + 32 * 60 + 18);
  useEffectS(() => {
    const i = setInterval(() => setTick(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const h = String(Math.floor(tick / 3600)).padStart(2, '0');
  const m = String(Math.floor((tick % 3600) / 60)).padStart(2, '0');
  const s = String(tick % 60).padStart(2, '0');
  return (
    <section style={{ padding: '0 0 16px' }}>
      <div className="container">
        <div style={{
          background: 'var(--ink)', color: 'var(--surface)',
          borderRadius: 'var(--r-lg)', padding: '22px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: .7, letterSpacing: '.12em', textTransform: 'uppercase' }}>Today only · up to 50% off</div>
            <div className="serif" style={{ fontSize: 32, lineHeight: 1.1, marginTop: 4 }}>The flash edit ends in</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['HRS', h], ['MIN', m], ['SEC', s]].map(([l, v]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', padding: '10px 16px', borderRadius: 8, textAlign: 'center', minWidth: 70 }}>
                <div className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{v}</div>
                <div className="mono" style={{ fontSize: 10, opacity: .6, letterSpacing: '.1em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandStrip() {
  const brands = window.SAAYA_DATA.brands;
  return (
    <section style={{ padding: '36px 0' }}>
      <div className="container">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>4,800+ ateliers and brands</div>
        <div className="h-scroll" style={{ display: 'flex', gap: 36, justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
          {brands.map(b => (
            <div key={b} className="serif" style={{ fontSize: 22, color: 'var(--ink-2)', whiteSpace: 'nowrap', letterSpacing: '-0.01em', opacity: .65 }}>{b}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsiderBanner() {
  return (
    <section style={{ padding: '24px 0 60px' }}>
      <div className="container">
        <div style={{
          borderRadius: 'var(--r-xl)', overflow: 'hidden',
          background: 'linear-gradient(120deg, #1F1B1A 0%, #2B2422 60%, #3A2A26 100%)',
          color: 'var(--surface)', padding: '40px 36px',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center', minHeight: 220,
        }}>
          <div>
            <div className="pill" style={{ background: 'rgba(255,255,255,.10)', borderColor: 'rgba(255,255,255,.18)', color: 'var(--surface)' }}>Saaya Insider · Members only</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '14px 0 10px', lineHeight: 1.1 }}>Earn back 5% on every order.</h2>
            <p style={{ margin: 0, opacity: .75, maxWidth: 480 }}>Early access to drops, complimentary styling and free express delivery on every order. Three tiers, no fee.</p>
            <button className="btn" style={{ background: 'var(--surface)', color: 'var(--ink)', marginTop: 22 }}>Join Insider — it's free <Icon.arrowRight /></button>
          </div>
          <div className="hide-mobile">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { t: 'Silver', d: '3% back · free delivery' },
                { t: 'Gold',   d: '5% back · early access' },
                { t: 'Plat',   d: '8% back · stylist on-call' },
              ].map(x => (
                <div key={x.t} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 'var(--r-md)', padding: 14 }}>
                  <div className="serif" style={{ fontSize: 22 }}>{x.t}</div>
                  <div style={{ fontSize: 11.5, opacity: .65, marginTop: 4 }}>{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { t: 'Shop',      items: ['Women', 'Men', 'Kids', 'Beauty', 'Home', 'Studio'] },
    { t: 'Help',      items: ['Track order', 'Returns', 'Size guide', 'Contact us'] },
    { t: 'About',     items: ['Our story', 'Sustainability', 'Press', 'Careers'] },
    { t: 'For brands', items: ['Sell on Saaya', 'Seller portal', 'Affiliates'] },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 0 40px', background: 'var(--surface)' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 24 }}>
        <div>
          <Logo size={28} />
          <p style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 280, marginTop: 14 }}>
            Saaya is an Indian fashion marketplace home to atelier brands, handloom workshops and
            quietly modern labels.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
            <span>EN · IN ₹</span><span>·</span><span>est. 2026</span>
          </div>
        </div>
        {cols.map(c => (
          <div key={c.t}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>{c.t}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.items.map(i => <li key={i} style={{ fontSize: 13, color: 'var(--ink-2)' }}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="container" style={{ borderTop: '1px solid var(--border)', marginTop: 36, paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
        <span>© 2026 Saaya Atelier Pvt Ltd</span>
        <span>Privacy · Terms · Cookies</span>
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PLP — Product Listing Page
// ──────────────────────────────────────────────────────────────────────────────
function PLPScreen({ route, navigate, onWishlist, wishlist, onOpenPDP }) {
  const data = window.SAAYA_DATA;
  const cat = data.cats.find(c => c.id === route.cat) || data.cats[0];
  const baseProducts = data.products.filter(p => p.cat === cat.id);
  // dup to fill grid (keep original IDs so wishlist state matches)
  const allProducts = [...baseProducts, ...data.products, ...baseProducts].slice(0, 16);

  const [filters, setFilters] = useStateS({
    brands: new Set(),
    minDiscount: 0,
    sizes: new Set(),
    colors: new Set(),
    priceRange: [0, 10000],
    rating: 0,
  });
  const [sort, setSort] = useStateS('relevance');
  const [filterOpen, setFilterOpen] = useStateS(false);

  const filtered = useMemoS(() => {
    let arr = [...allProducts];
    if (filters.brands.size > 0) arr = arr.filter(p => filters.brands.has(p.brand));
    if (filters.minDiscount > 0) arr = arr.filter(p => pctOff(p.mrp, p.price) >= filters.minDiscount);
    if (filters.colors.size > 0) arr = arr.filter(p => p.colors.some(c => filters.colors.has(c)));
    arr = arr.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
    if (sort === 'discount') arr.sort((a, b) => pctOff(b.mrp, b.price) - pctOff(a.mrp, a.price));
    return arr;
  }, [allProducts, filters, sort]);

  const activeChips = [];
  filters.brands.forEach(b => activeChips.push({ k: 'brand:' + b, label: b, remove: () => setFilters(f => { const s = new Set(f.brands); s.delete(b); return { ...f, brands: s }; }) }));
  if (filters.minDiscount > 0) activeChips.push({ k: 'disc', label: filters.minDiscount + '%+ off', remove: () => setFilters(f => ({ ...f, minDiscount: 0 })) });
  filters.colors.forEach(c => activeChips.push({ k: 'color:' + c, label: 'Color', swatch: c, remove: () => setFilters(f => { const s = new Set(f.colors); s.delete(c); return { ...f, colors: s }; }) }));
  filters.sizes.forEach(c => activeChips.push({ k: 'size:' + c, label: c, remove: () => setFilters(f => { const s = new Set(f.sizes); s.delete(c); return { ...f, sizes: s }; }) }));

  return (
    <div style={{ paddingBottom: 60, background: 'var(--surface)' }}>
      {/* Breadcrumb + title */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ paddingTop: 24, paddingBottom: 20 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate({ name: 'home' })}>home</span> / shop / <span style={{ color: 'var(--ink)' }}>{cat.label.toLowerCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 className="serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{cat.label}</h1>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>{filtered.length} pieces · curated from {Math.floor(filtered.length * .7)} brands</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sort:</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                padding: '8px 12px', fontSize: 13, color: 'var(--ink)',
              }}>
                <option value="relevance">Most relevant</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="discount">Biggest discount</option>
              </select>
              <button className="btn btn-ghost hide-desktop" onClick={() => setFilterOpen(true)} style={{ padding: '8px 14px' }}>
                <Icon.filter /> Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="plp-grid">
          {/* Sidebar */}
          <aside className="plp-sidebar hide-mobile">
            <FilterSidebar filters={filters} setFilters={setFilters} products={baseProducts} />
          </aside>

          <main>
            {/* Applied chips */}
            {activeChips.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                {activeChips.map(c => (
                  <span key={c.k} className="pill" style={{ paddingLeft: c.swatch ? 6 : 10 }}>
                    {c.swatch && <span style={{ width: 12, height: 12, borderRadius: 999, background: c.swatch, border: '1px solid rgba(0,0,0,.1)' }} />}
                    {c.label}
                    <button onClick={c.remove} aria-label="Remove" style={{ background: 'transparent', border: 0, padding: 2, color: 'var(--ink-3)', display: 'inline-flex' }}>
                      <Icon.close size={12} />
                    </button>
                  </span>
                ))}
                <button onClick={() => setFilters({ brands: new Set(), minDiscount: 0, sizes: new Set(), colors: new Set(), priceRange: [0, 10000], rating: 0 })}
                  className="mono" style={{ background: 'transparent', border: 0, fontSize: 11.5, color: 'var(--brand)', padding: '4px 0', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="plp-cards">
              {filtered.map((p, idx) => (
                <ProductCard key={p.id + '-' + idx} product={p}
                  onOpen={onOpenPDP} onWishlist={onWishlist}
                  isWishlisted={wishlist.has(p.id)} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0 12px' }}>
              <button className="btn btn-ghost">Load more</button>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div className="backdrop" onClick={() => setFilterOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} />
          <div className="drawer" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85vh', background: 'var(--surface)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <strong>Filters</strong>
              <button onClick={() => setFilterOpen(false)} style={{ background: 'transparent', border: 0, padding: 6 }}><Icon.close /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '14px 18px' }}>
              <FilterSidebar filters={filters} setFilters={setFilters} products={baseProducts} />
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={() => setFilterOpen(false)} style={{ width: '100%' }}>Show {filtered.length} pieces</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .plp-grid { display: grid; grid-template-columns: 240px 1fr; gap: 32px; }
        .plp-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 1100px) { .plp-cards { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 899px) {
          .plp-grid { grid-template-columns: 1fr; gap: 16px; }
          .plp-cards { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

function FilterSidebar({ filters, setFilters, products }) {
  const allBrands = [...new Set(products.map(p => p.brand))];
  const swatchColors = ['#B33951','#1F1B1A','#3D4D58','#C99B5E','#FBF6E9','#6B7B5A','#8C5B72'];
  const toggleSet = (k, v) => setFilters(f => {
    const s = new Set(f[k]);
    if (s.has(v)) s.delete(v); else s.add(v);
    return { ...f, [k]: s };
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FilterGroup title="Price">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 12 }}>{inr(filters.priceRange[0])}</span>
          <div style={{ flex: 1, height: 4, background: 'var(--surface-3)', borderRadius: 999, position: 'relative' }}>
            <div style={{ position: 'absolute', height: 4, background: 'var(--brand)', borderRadius: 999, left: `${(filters.priceRange[0]/10000)*100}%`, right: `${100 - (filters.priceRange[1]/10000)*100}%` }} />
          </div>
          <span className="mono" style={{ fontSize: 12 }}>{inr(filters.priceRange[1])}</span>
        </div>
        <input type="range" min="0" max="10000" step="100" value={filters.priceRange[1]}
          onChange={e => setFilters(f => ({ ...f, priceRange: [f.priceRange[0], +e.target.value] }))}
          style={{ width: '100%', accentColor: 'var(--brand)' }} />
      </FilterGroup>

      <FilterGroup title="Brand">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allBrands.map(b => (
            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={filters.brands.has(b)} onChange={() => toggleSet('brands', b)} style={{ accentColor: 'var(--brand)' }} />
              {b}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Discount">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[10, 20, 30, 40, 50].map(d => (
            <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="disc" checked={filters.minDiscount === d}
                onChange={() => setFilters(f => ({ ...f, minDiscount: d }))} style={{ accentColor: 'var(--brand)' }} /> {d}% and above
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {swatchColors.map(c => (
            <button key={c} onClick={() => toggleSet('colors', c)} title={c} style={{
              width: 28, height: 28, borderRadius: 999, background: c,
              border: filters.colors.has(c) ? `2px solid var(--brand)` : '1px solid rgba(0,0,0,.15)',
              outline: filters.colors.has(c) ? '2px solid var(--surface)' : 'none', outlineOffset: -4,
              cursor: 'pointer',
            }} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Size">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {window.SAAYA_DATA.sizesApparel.map(s => (
            <button key={s} onClick={() => toggleSet('sizes', s)} style={{
              padding: '8px 0', background: filters.sizes.has(s) ? 'var(--ink)' : 'var(--surface-2)',
              color: filters.sizes.has(s) ? 'var(--surface)' : 'var(--ink)',
              border: '1px solid ' + (filters.sizes.has(s) ? 'var(--ink)' : 'var(--border)'),
              borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }) {
  const [open, setOpen] = useStateS(true);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'transparent', border: 0, padding: 0, width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase',
        color: 'var(--ink-3)', marginBottom: 12,
      }}>
        {title} <span style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .2s' }}><Icon.chevronDown size={12} /></span>
      </button>
      {open && children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PDP — Product Detail Page
// ──────────────────────────────────────────────────────────────────────────────
function PDPScreen({ product, navigate, onAddToBag, onWishlist, wishlist, route }) {
  const data = window.SAAYA_DATA;
  const [activeImg, setActiveImg] = useStateS(0);
  const [size, setSize] = useStateS(null);
  const [color, setColor] = useStateS(product.colors[0]);
  const [qty, setQty] = useStateS(1);
  const [pin, setPin] = useStateS('');
  const [pinChecked, setPinChecked] = useStateS(false);
  const [activeAccordion, setActiveAccordion] = useStateS('details');
  const [zoom, setZoom] = useStateS({ on: false, x: 50, y: 50 });

  const off = pctOff(product.mrp, product.price);
  const sizes = data.sizesApparel;
  const isWishlisted = wishlist.has(product.id);

  const handleAdd = () => {
    if (!size) { window.dispatchEvent(new CustomEvent('saaya:toast', { detail: 'Please select a size' })); return; }
    onAddToBag(product, { size, color, qty });
  };

  const related = data.products.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate({ name: 'home' })}>home</span> /
          <span style={{ cursor: 'pointer' }} onClick={() => navigate({ name: 'plp', cat: product.cat })}> {product.cat}</span> /
          <span style={{ color: 'var(--ink)' }}> {product.brand.toLowerCase()}</span>
        </div>
      </div>

      <div className="container">
        <div className="pdp-grid">
          {/* Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-thumbs">
              {[0,1,2,3].map(i => (
                <button key={i} onClick={() => setActiveImg(i)} style={{
                  width: '100%', aspectRatio: '3/4',
                  border: activeImg === i ? '2px solid var(--ink)' : '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', overflow: 'hidden', padding: 0, cursor: 'pointer', background: 'transparent',
                }}>
                  <div className="ph" style={{ '--ph-bg': product.tone, height: '100%' }}>
                    <span className="ph-label" style={{ fontSize: 8 }}>view {i+1}</span>
                  </div>
                </button>
              ))}
            </div>
            <div
              className="pdp-main"
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onMouseLeave={() => setZoom(z => ({ ...z, on: false }))}
              style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', cursor: zoom.on ? 'zoom-in' : 'default' }}
            >
              <div style={{ transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: zoom.on ? 'scale(1.5)' : 'scale(1)', transition: zoom.on ? 'none' : 'transform .3s ease' }}>
                <div className="ph" style={{ '--ph-bg': product.tone, aspectRatio: '3/4' }}>
                  <span className="ph-label">{product.cat} · view {activeImg + 1} · model shot</span>
                </div>
              </div>
              <button onClick={() => onWishlist(product.id)} aria-label="Wishlist" style={{
                position: 'absolute', top: 16, right: 16,
                width: 42, height: 42, borderRadius: 999,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: isWishlisted ? 'var(--brand)' : 'var(--ink-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.heart filled={isWishlisted} />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="pdp-info">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '.04em', textTransform: 'uppercase' }}>{product.brand}</span>
              <Rating value={4.3} count={1248} size={14} />
            </div>
            <h1 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '8px 0 4px', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {product.name}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Sold by <strong>{product.brand} Atelier</strong> · est. shipping from Jaipur, IN</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{inr(product.price)}</span>
              <span className="mono" style={{ fontSize: 15, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{inr(product.mrp)}</span>
              {off > 0 && <span style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 14 }}>{off}% off</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>inclusive of all taxes</div>

            {/* Color */}
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 500 }}>Colour: <span style={{ color: 'var(--ink-2)' }}>{['Pomegranate','Charcoal','Cream','Slate','Olive','Mulberry'][product.colors.indexOf(color) % 6]}</span></span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {product.colors.map(c => (
                  <button key={c} onClick={() => setColor(c)} aria-label={'Color ' + c} style={{
                    width: 38, height: 38, borderRadius: 999, background: c,
                    border: color === c ? '2px solid var(--ink)' : '1px solid rgba(0,0,0,.15)',
                    outline: color === c ? '2px solid var(--surface)' : 'none', outlineOffset: -5,
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>

            {/* Size */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 500 }}>Select size</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sizes.map(s => {
                  const oos = s === 'XS' || s === 'XXL';
                  return (
                    <button key={s} onClick={() => !oos && setSize(s)} disabled={oos} style={{
                      minWidth: 52, height: 44, padding: '0 12px',
                      borderRadius: 'var(--r-sm)',
                      background: size === s ? 'var(--ink)' : 'var(--surface-2)',
                      color: oos ? 'var(--ink-3)' : (size === s ? 'var(--surface)' : 'var(--ink)'),
                      border: '1px solid ' + (size === s ? 'var(--ink)' : 'var(--border-strong)'),
                      fontSize: 13, fontWeight: 500,
                      cursor: oos ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      opacity: oos ? .6 : 1,
                    }}>
                      {s}
                      {oos && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 47%, var(--ink-3) 49% 51%, transparent 53%)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qty */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontWeight: 500 }}>Quantity</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: 'transparent', border: 0, color: 'var(--ink)' }}><Icon.minus /></button>
                <span className="mono" style={{ width: 30, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, background: 'transparent', border: 0, color: 'var(--ink)' }}><Icon.plus /></button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1, height: 52, fontSize: 14, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <Icon.bag size={16} /> Add to bag
              </button>
              <button onClick={() => onWishlist(product.id)} className="btn btn-ghost" style={{ flex: 1, height: 52, fontSize: 14, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <Icon.heart filled={isWishlisted} size={16} /> {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            {/* Delivery checker */}
            <div style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
              <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 10 }}>Check delivery & returns</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={pin} maxLength={6} onChange={e => setPin(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit pincode" style={{
                  flex: 1, padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)',
                  outline: 'none', fontSize: 13, background: 'var(--surface-2)',
                }} />
                <button className="btn btn-ink" onClick={() => setPinChecked(true)} style={{ padding: '0 18px' }}>Check</button>
              </div>
              {pinChecked && pin.length === 6 && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                    <Icon.truck size={14} /> <span style={{ color: 'var(--ink)' }}>Delivery by <strong>Mon, 19 May</strong></span> · Free
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon.ret size={14} /> 14-day returns & exchange available
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon.shield size={14} /> Cash on delivery available
                  </div>
                </div>
              )}
            </div>

            {/* Accordion */}
            <div style={{ marginTop: 28, borderTop: '1px solid var(--border)' }}>
              {[
                { id: 'details', t: 'Description', body: 'Hand-block printed on naturally dyed cotton, this kurta is woven on traditional pit looms in Jaipur. The cut is loose through the chest with a slim sleeve, and the print is registered by eye — small variations are part of the craft.' },
                { id: 'fit', t: 'Size & fit', body: 'Model is 5\'8" wearing size S. The fit runs true to size; size down for a closer cut. Length sits at mid-thigh. Sleeve hits mid-bicep.' },
                { id: 'mat', t: 'Material & care', body: '100% cotton, 110 GSM. Cold gentle wash, line dry in shade. Iron on reverse. Hand-block prints may bleed on first wash — wash separately.' },
                { id: 'spec', t: 'Specifications', body: 'Country of origin: India · SKU: SAA-' + product.id.toUpperCase() + ' · Manufacturer: ' + product.brand + ' Atelier, Jaipur.' },
              ].map(s => (
                <div key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => setActiveAccordion(a => a === s.id ? '' : s.id)} style={{
                    width: '100%', padding: '18px 0', background: 'transparent', border: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontWeight: 500, fontSize: 14, color: 'var(--ink)', cursor: 'pointer',
                  }}>
                    {s.t}
                    <span style={{ transform: activeAccordion === s.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}><Icon.chevronDown /></span>
                  </button>
                  {activeAccordion === s.id && (
                    <div style={{ paddingBottom: 18, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.7, maxWidth: 540 }}>
                      {s.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <h2 className="serif" style={{ fontSize: 32, margin: '0 0 24px' }}>Customer reviews</h2>
          <div className="reviews-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="serif" style={{ fontSize: 64, lineHeight: 1 }}>4.3</span>
                <div>
                  <div style={{ display: 'flex', color: '#1F8A5B' }}>{[1,2,3,4,5].map(i => <Icon.star key={i} filled={i <= 4} size={16} />)}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>1,248 ratings · 386 written reviews</div>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[[5,72],[4,18],[3,6],[2,2],[1,2]].map(([n, pct]) => (
                  <div key={n} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--ink-2)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{n} <Icon.star filled size={11} /></span>
                    <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 999 }}>
                      <div style={{ width: pct + '%', height: '100%', background: 'var(--brand)', borderRadius: 999 }} />
                    </div>
                    <span className="mono">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {data.reviews.map(r => (
                <div key={r.id} style={{ padding: 18, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--surface-3)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{r.name[0]}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name} {r.verified && <span style={{ fontSize: 10, color: 'var(--success)', marginLeft: 4 }}>✓ Verified</span>}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Size {r.size} · {r.time}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', color: '#1F8A5B' }}>{[1,2,3,4,5].map(i => <Icon.star key={i} filled={i <= r.stars} size={12} />)}</div>
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* You may also like */}
        <section style={{ marginTop: 60 }}>
          <h2 className="serif" style={{ fontSize: 32, margin: '0 0 24px' }}>You may also like</h2>
          <div className="plp-cards">
            {related.map(p => (
              <ProductCard key={p.id} product={p}
                onOpen={(pr) => navigate({ name: 'pdp', id: pr.id })}
                onWishlist={onWishlist}
                isWishlisted={wishlist.has(p.id)} />
            ))}
          </div>
        </section>
      </div>

      {/* Mobile sticky bar */}
      <div className="hide-desktop" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80,
        background: 'var(--surface-2)', borderTop: '1px solid var(--border)',
        padding: '10px 14px', display: 'flex', gap: 8,
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button onClick={() => onWishlist(product.id)} className="btn btn-ghost" style={{ width: 52, height: 48, padding: 0 }}>
          <Icon.heart filled={isWishlisted} size={18} />
        </button>
        <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1, height: 48, fontWeight: 600, letterSpacing: '.04em' }}>
          Add to bag — {inr(product.price * qty)}
        </button>
      </div>

      <style>{`
        .pdp-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 48px; }
        .pdp-gallery { display: grid; grid-template-columns: 88px 1fr; gap: 14px; align-items: start; }
        .pdp-thumbs { display: flex; flex-direction: column; gap: 10px; position: sticky; top: 110px; }
        .reviews-grid { display: grid; grid-template-columns: 280px 1fr; gap: 36px; }
        @media (max-width: 899px) {
          .pdp-grid { grid-template-columns: 1fr; gap: 28px; }
          .pdp-gallery { grid-template-columns: 1fr; }
          .pdp-thumbs { display: none; }
          .reviews-grid { grid-template-columns: 1fr; gap: 18px; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// CART DRAWER
// ──────────────────────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, items, setItems, navigate }) {
  if (!open) return null;
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.qty, 0);
  const shipping = subtotal > 1499 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;
  const setQty = (k, q) => setItems(prev => prev.map(i => i.k === k ? { ...i, qty: Math.max(1, q) } : i));
  const remove = (k) => setItems(prev => prev.filter(i => i.k !== k));
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <div className="backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,27,26,.42)' }} />
      <aside className="drawer" style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: 'min(440px, 100%)',
        background: 'var(--surface)', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <header style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="serif" style={{ fontSize: 24, margin: 0 }}>Your bag <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>({items.length})</span></h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, padding: 6 }}><Icon.close /></button>
        </header>

        {items.length === 0 ? (
          <div style={{ padding: '60px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
              <Icon.bag size={32} />
            </div>
            <div className="serif" style={{ fontSize: 26 }}>Your bag is empty.</div>
            <p style={{ color: 'var(--ink-2)', fontSize: 13.5, margin: 0, maxWidth: 280 }}>Bookmark pieces with the heart icon, or start exploring the new monsoon edit.</p>
            <button onClick={() => { onClose(); navigate({ name: 'plp', cat: 'women' }); }} className="btn btn-primary">Continue shopping <Icon.arrowRight /></button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
              {/* Shipping progress */}
              {subtotal < 1499 && subtotal > 0 && (
                <div style={{ background: 'var(--surface-3)', padding: 14, borderRadius: 'var(--r-md)', marginBottom: 18 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Add <strong style={{ color: 'var(--ink)' }}>{inr(1499 - subtotal)}</strong> more for free shipping.</div>
                  <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: Math.min(100, (subtotal / 1499) * 100) + '%', height: '100%', background: 'var(--brand)' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map(i => (
                  <div key={i.k} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 80, flexShrink: 0, borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <ProductArt product={i.product} label={false} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>{i.product.brand}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.35, marginTop: 2 }}>{i.product.name}</div>
                        </div>
                        <button onClick={() => remove(i.k)} style={{ background: 'transparent', border: 0, color: 'var(--ink-3)', padding: 2, alignSelf: 'flex-start' }}><Icon.close size={14} /></button>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
                        <span>Size: <strong style={{ color: 'var(--ink)' }}>{i.size}</strong></span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Color: <span style={{ width: 10, height: 10, borderRadius: 999, background: i.color, border: '1px solid rgba(0,0,0,.1)' }} /></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)' }}>
                          <button onClick={() => setQty(i.k, i.qty - 1)} style={{ width: 28, height: 28, background: 'transparent', border: 0 }}><Icon.minus size={12} /></button>
                          <span className="mono" style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 600 }}>{i.qty}</span>
                          <button onClick={() => setQty(i.k, i.qty + 1)} style={{ width: 28, height: 28, background: 'transparent', border: 0 }}><Icon.plus size={12} /></button>
                        </div>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{inr(i.product.price * i.qty)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 22px', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--ink-2)' }}>
                <Row label="Subtotal" value={inr(subtotal)} />
                <Row label="MRP savings" value={'− ' + inr(mrpTotal - subtotal)} color="var(--brand)" />
                <Row label="Shipping" value={shipping === 0 ? 'Free' : inr(shipping)} />
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <Row label={<strong style={{ fontSize: 14, color: 'var(--ink)' }}>Total</strong>} value={<strong className="mono" style={{ fontSize: 18 }}>{inr(total)}</strong>} />
              </div>
              <button className="btn btn-primary" onClick={() => { onClose(); navigate({ name: 'checkout' }); }} style={{ width: '100%', height: 50, marginTop: 14, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                Proceed to checkout <Icon.arrowRight />
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.shield size={12} /> Secure checkout</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.ret size={12} /> 14-day returns</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{label}</span>
      <span style={{ color }} className="mono">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// WISHLIST SCREEN
// ──────────────────────────────────────────────────────────────────────────────
function WishlistScreen({ wishlist, onWishlist, navigate, onOpenPDP }) {
  const data = window.SAAYA_DATA;
  const products = data.products.filter(p => wishlist.has(p.id));
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 24 }}>
          <h1 className="serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', margin: 0, letterSpacing: '-0.02em' }}>Wishlist</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>{products.length} saved {products.length === 1 ? 'piece' : 'pieces'}</div>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {products.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
              <Icon.heart size={32} />
            </div>
            <div className="serif" style={{ fontSize: 28 }}>Nothing saved yet.</div>
            <p style={{ color: 'var(--ink-2)', maxWidth: 360 }}>Tap the heart on any piece to save it for later — your list is private and stays on this device.</p>
            <button onClick={() => navigate({ name: 'plp', cat: 'women' })} className="btn btn-primary">Browse new arrivals <Icon.arrowRight /></button>
          </div>
        ) : (
          <div className="plp-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onOpen={onOpenPDP} onWishlist={onWishlist} isWishlisted />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ──────────────────────────────────────────────────────────────────────────────
function ProfileField({ label, value, onChange, placeholder, type = 'text', prefix }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', background: 'var(--surface)', overflow: 'hidden' }}>
        {prefix && (
          <span style={{ padding: '10px 10px 10px 12px', fontSize: 13, color: 'var(--ink-2)', borderRight: '1px solid var(--border)', background: 'var(--surface-3)', whiteSpace: 'nowrap' }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: '10px 12px', border: 0, background: 'transparent', outline: 'none', fontSize: 13.5, color: 'var(--ink)' }}
        />
      </div>
    </div>
  );
}

function ProfileScreen() {
  const loadSaved = () => {
    try {
      const s = localStorage.getItem('saaya_profile');
      return s ? JSON.parse(s) : { name: '', email: '', mobile: '', avatar: null };
    } catch { return { name: '', email: '', mobile: '', avatar: null }; }
  };

  const [profile, setProfile] = useStateS(loadSaved);
  const [draft, setDraft] = useStateS(loadSaved);
  const [editing, setEditing] = useStateS(false);
  const [uploading, setUploading] = useStateS(false);
  const fileRef = useRefS(null);

  const toast = (msg) => window.dispatchEvent(new CustomEvent('saaya:toast', { detail: msg }));

  const save = () => {
    try { localStorage.setItem('saaya_profile', JSON.stringify(draft)); } catch {}
    setProfile(draft);
    setEditing(false);
    toast('Profile saved');
  };

  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraft(d => ({ ...d, avatar: ev.target.result }));
      setEditing(true);
      setUploading(false);
    };
    reader.onerror = () => {
      toast('Could not read image — please try a different file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const menuItems = [
    { label: 'My Orders', sub: 'Track, return or buy again', Icon: Icon.bag },
    { label: 'Saved Addresses', sub: 'Manage delivery addresses', Icon: Icon.truck },
    { label: 'Payment Methods', sub: 'Cards, UPI & wallets', Icon: Icon.shield },
    { label: 'Saaya Insider', sub: 'Your rewards & benefits', Icon: Icon.star },
    { label: 'Help & Support', sub: 'FAQs, returns & contact us', Icon: Icon.ret },
  ];

  const avatarLetter = (draft.name || draft.email || 'G')[0].toUpperCase();

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 24 }}>
          <h1 className="serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', margin: 0, letterSpacing: '-0.02em' }}>Account</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="profile-layout">
          {/* Profile card */}
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 28, alignSelf: 'start' }}>
            {/* Avatar upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => !uploading && fileRef.current && fileRef.current.click()}
                  aria-label="Change profile photo"
                  style={{
                    width: 96, height: 96, borderRadius: 999, padding: 0, border: '2px solid var(--border)',
                    background: draft.avatar ? 'transparent' : 'var(--brand-soft)',
                    overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer', display: 'block',
                  }}
                >
                  {draft.avatar
                    ? <img src={draft.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 38, fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>{avatarLetter}</span>
                  }
                </button>
                <button
                  onClick={() => !uploading && fileRef.current && fileRef.current.click()}
                  aria-label="Upload photo"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: 999,
                    background: uploading ? 'var(--ink-3)' : 'var(--brand)',
                    border: '2px solid var(--surface-2)',
                    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                  }}
                >
                  {uploading
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9" style={{ animation: 'spin 1s linear infinite' }}/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.name || 'Set your name'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  {profile.mobile ? '+91 ' + profile.mobile : 'No mobile number saved'}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ProfileField
                label="Full name"
                value={draft.name}
                onChange={v => { setDraft(d => ({ ...d, name: v })); setEditing(true); }}
                placeholder="Your full name"
              />
              <ProfileField
                label="Email address"
                type="email"
                value={draft.email}
                onChange={v => { setDraft(d => ({ ...d, email: v })); setEditing(true); }}
                placeholder="you@example.com"
              />
              <ProfileField
                label="Mobile number"
                type="tel"
                value={draft.mobile}
                onChange={v => {
                  const cleaned = v.replace(/\D/g, '').slice(0, 10);
                  setDraft(d => ({ ...d, mobile: cleaned }));
                  setEditing(true);
                }}
                placeholder="10-digit number"
                prefix="+91"
              />
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button onClick={save} className="btn btn-primary" style={{ flex: 1 }}>Save changes</button>
                <button onClick={cancel} className="btn btn-ghost">Cancel</button>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menuItems.map(item => (
              <button key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', width: '100%',
                color: 'var(--ink)',
              }}>
                <span style={{ color: 'var(--brand)', display: 'inline-flex' }}><item.Icon size={20} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <Icon.chevronRight size={16} />
              </button>
            ))}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', cursor: 'pointer', color: 'var(--brand)',
              marginTop: 4, width: '100%',
            }}>
              <Icon.close size={20} />
              <span style={{ fontWeight: 500, fontSize: 14 }}>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-layout { display: grid; grid-template-columns: 340px 1fr; gap: 32px; align-items: start; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 899px) { .profile-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// CHECKOUT — address form + checkout screen
// ──────────────────────────────────────────────────────────────────────────────

// Map DB row → UI shape (is_default → default, type capitalised)
function dbToAddr(a) {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || '',
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    type: a.type.charAt(0).toUpperCase() + a.type.slice(1),
    default: a.is_default,
  };
}

function AddressForm({ initial, onSave, onCancel }) {
  const STATES = ['Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'];
  const blank = { name:'', phone:'', line1:'', line2:'', city:'', state:'Gujarat', pincode:'', type:'Home' };
  const [form, setForm] = useStateS(initial
    ? { name:initial.name, phone:initial.phone, line1:initial.line1, line2:initial.line2||'', city:initial.city, state:initial.state, pincode:initial.pincode, type:initial.type }
    : blank);
  const [errors, setErrors] = useStateS({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name    = 'Required';
    if (!/^\d{10}$/.test(form.phone))  e.phone   = '10-digit mobile number required';
    if (!form.line1.trim())            e.line1   = 'Required';
    if (!form.city.trim())             e.city    = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  const inp = (hasErr) => ({
    width:'100%', padding:'10px 12px',
    border:`1px solid ${hasErr ? 'var(--brand)' : 'var(--border-strong)'}`,
    borderRadius:'var(--r-sm)', fontSize:13.5,
    background:'var(--surface-2)', outline:'none', color:'var(--ink)', boxSizing:'border-box',
  });
  const lbl = { fontSize:11.5, fontWeight:600, color:'var(--ink-3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:5, display:'block' };
  const errMsg = { fontSize:11, color:'var(--brand)', marginTop:3 };

  return (
    <div style={{ border:'2px solid var(--ink)', borderRadius:'var(--r-lg)', padding:22, marginBottom:20 }}>
      <div style={{ fontWeight:600, fontSize:16, marginBottom:18 }}>{initial ? 'Edit address' : 'Add new address'}</div>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="addr-2col">
          <div>
            <label style={lbl}>Full name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" style={inp(errors.name)} />
            {errors.name && <div style={errMsg}>{errors.name}</div>}
          </div>
          <div>
            <label style={lbl}>Mobile number</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" style={inp(errors.phone)} />
            {errors.phone && <div style={errMsg}>{errors.phone}</div>}
          </div>
        </div>

        <div>
          <label style={lbl}>Address line 1</label>
          <input value={form.line1} onChange={e => set('line1', e.target.value)} placeholder="Flat no., Building, Street" style={inp(errors.line1)} />
          {errors.line1 && <div style={errMsg}>{errors.line1}</div>}
        </div>

        <div>
          <label style={lbl}>Address line 2 <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:11 }}>(optional)</span></label>
          <input value={form.line2} onChange={e => set('line2', e.target.value)} placeholder="Area, Landmark" style={inp(false)} />
        </div>

        <div className="addr-3col">
          <div>
            <label style={lbl}>City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" style={inp(errors.city)} />
            {errors.city && <div style={errMsg}>{errors.city}</div>}
          </div>
          <div>
            <label style={lbl}>State</label>
            <select value={form.state} onChange={e => set('state', e.target.value)} style={{ ...inp(false), height:42, paddingTop:0, paddingBottom:0 }}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Pincode</label>
            <input value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6 digits" style={inp(errors.pincode)} />
            {errors.pincode && <div style={errMsg}>{errors.pincode}</div>}
          </div>
        </div>

        <div>
          <label style={lbl}>Address type</label>
          <div style={{ display:'flex', gap:8 }}>
            {['Home','Work','Other'].map(tp => (
              <button key={tp} type="button" onClick={() => set('type', tp)} style={{
                padding:'8px 20px', borderRadius:'var(--r-md)', fontSize:13, fontWeight:500,
                border:`1px solid ${form.type===tp ? 'var(--ink)' : 'var(--border)'}`,
                background:form.type===tp ? 'var(--ink)' : 'var(--surface-2)',
                color:form.type===tp ? 'var(--surface)' : 'var(--ink)', cursor:'pointer',
              }}>{tp}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button type="submit" className="btn btn-primary" style={{ flex:1, height:44 }}>Save address</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel} style={{ padding:'0 22px', height:44 }}>Cancel</button>
        </div>
      </form>
      <style>{`
        .addr-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .addr-3col { display: grid; grid-template-columns: 1fr 1fr 110px; gap: 12px; }
        @media (max-width: 520px) {
          .addr-2col, .addr-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function CheckoutScreen({ bag, navigate }) {
  // Address state — managed locally so checkout always fetches fresh on open
  const [addresses, setAddresses] = useStateS([]);
  const [userId, setUserId] = useStateS(null);
  const [addrLoaded, setAddrLoaded] = useStateS(false);

  const [selectedId, setSelectedId] = useStateS(null);
  const [showForm, setShowForm] = useStateS(false);
  const [editAddr, setEditAddr] = useStateS(null);
  const [placed, setPlaced] = useStateS(false);

  // Fetch addresses for the current user on every checkout open
  useEffectS(() => {
    let cancelled = false;
    async function load() {
      const sb = window.supabaseClient;
      if (!sb) { setAddrLoaded(true); return; }
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setAddrLoaded(true); return; }
      // Explicit user_id filter + RLS double-guard ensures only this user's addresses
      const { data } = await sb.from('addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      if (cancelled) return;
      setUserId(session.user.id);
      const mapped = data ? data.map(dbToAddr) : [];
      setAddresses(mapped);
      setAddrLoaded(true);
      // Auto-select default or first address; open form if none saved
      if (mapped.length === 0) {
        setShowForm(true);
      } else {
        const def = mapped.find(a => a.default) || mapped[0];
        setSelectedId(def.id);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const subtotal = bag.reduce((s, i) => s + i.product.price * i.qty, 0);
  const mrpTotal = bag.reduce((s, i) => s + i.product.mrp * i.qty, 0);
  const shipping  = subtotal > 1499 || subtotal === 0 ? 0 : 99;
  const total     = subtotal + shipping;

  const handleSave = async (data) => {
    const sb = window.supabaseClient;
    const typeDb = data.type.toLowerCase();

    if (editAddr) {
      if (sb && userId) {
        await sb.from('addresses').update({
          name: data.name, phone: data.phone,
          line1: data.line1, line2: data.line2 || null,
          city: data.city, state: data.state, pincode: data.pincode,
          type: typeDb,
        }).eq('id', editAddr.id);
      }
      setAddresses(prev => prev.map(a => a.id === editAddr.id ? { ...a, ...data } : a));
      setSelectedId(editAddr.id);
    } else {
      const isFirst = addresses.length === 0;
      if (sb && userId) {
        const { data: inserted } = await sb.from('addresses').insert({
          user_id: userId,
          name: data.name, phone: data.phone,
          line1: data.line1, line2: data.line2 || null,
          city: data.city, state: data.state, pincode: data.pincode,
          type: typeDb, is_default: isFirst,
        }).select().single();
        if (inserted) {
          const n = { ...data, id: inserted.id, default: isFirst };
          setAddresses(prev => [...prev, n]);
          setSelectedId(inserted.id);
        }
      } else {
        const n = { ...data, id: 'a' + Date.now(), default: isFirst };
        setAddresses(prev => [...prev, n]);
        setSelectedId(n.id);
      }
    }
    setShowForm(false);
    setEditAddr(null);
  };

  const handlePlace = () => {
    if (!selectedId) {
      window.dispatchEvent(new CustomEvent('saaya:toast', { detail: 'Please select a delivery address' }));
      return;
    }
    setPlaced(true);
  };

  if (bag.length === 0 && !placed) {
    return (
      <div style={{ padding:'80px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div className="serif" style={{ fontSize:28 }}>Your bag is empty.</div>
        <button onClick={() => navigate({ name:'plp', cat:'women' })} className="btn btn-primary">Start shopping <Icon.arrowRight /></button>
      </div>
    );
  }

  if (placed) {
    return (
      <div style={{ padding:'80px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:80, height:80, borderRadius:999, background:'var(--brand-soft)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'var(--brand)', fontSize:36, fontWeight:700 }}>&#10003;</div>
        <div className="serif" style={{ fontSize:32 }}>Order placed!</div>
        <p style={{ color:'var(--ink-2)', maxWidth:360, margin:0, fontSize:14, lineHeight:1.65 }}>Your order has been confirmed and will be dispatched within 24 hours. Estimated delivery in 3–5 business days.</p>
        <button onClick={() => navigate({ name:'home' })} className="btn btn-primary">Continue shopping <Icon.arrowRight /></button>
      </div>
    );
  }

  return (
    <div style={{ background:'var(--surface)', paddingBottom:80 }}>
      {/* Steps breadcrumb */}
      <div style={{ borderBottom:'1px solid var(--border)', background:'var(--surface-2)' }}>
        <div className="container" style={{ paddingTop:16, paddingBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
            <span style={{ color:'var(--ink-3)' }}>Bag</span>
            <Icon.chevronRight size={13} />
            <span style={{ fontWeight:600, color:'var(--ink)' }}>Delivery address</span>
            <Icon.chevronRight size={13} />
            <span style={{ color:'var(--ink-3)' }}>Payment</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop:36, paddingBottom:36 }}>
        <div className="checkout-grid">

          {/* ── LEFT: addresses ── */}
          <div>
            <div style={{ marginBottom:22 }}>
              <h2 className="serif" style={{ fontSize:28, margin:0 }}>Delivery address</h2>
            </div>

            {!addrLoaded && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[1,2].map(n => (
                  <div key={n} style={{ border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:18, background:'var(--surface-2)' }}>
                    <div style={{ height:14, width:'40%', borderRadius:4, background:'var(--surface-3)', marginBottom:10 }} />
                    <div style={{ height:12, width:'70%', borderRadius:4, background:'var(--surface-3)', marginBottom:6 }} />
                    <div style={{ height:12, width:'55%', borderRadius:4, background:'var(--surface-3)' }} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {addresses.map(addr => {
                const isSelected = selectedId === addr.id && !showForm;

                if (editAddr?.id === addr.id && showForm) {
                  return (
                    <AddressForm
                      key={addr.id}
                      initial={editAddr}
                      onSave={handleSave}
                      onCancel={() => { setShowForm(false); setEditAddr(null); }}
                    />
                  );
                }

                return (
                  <div key={addr.id}
                    onClick={() => !showForm && setSelectedId(addr.id)}
                    style={{
                      border:`2px solid ${isSelected ? 'var(--ink)' : 'var(--border)'}`,
                      borderRadius:'var(--r-md)', padding:18,
                      cursor: showForm ? 'default' : 'pointer',
                      background: isSelected ? 'var(--surface-3)' : 'var(--surface)',
                      opacity: showForm && !editAddr ? 0.55 : 1,
                      transition:'border-color .15s, background .15s, opacity .2s',
                    }}>
                    <div style={{ display:'flex', gap:12 }}>
                      <div style={{ paddingTop:3, flexShrink:0 }}>
                        <div style={{ width:18, height:18, borderRadius:999, border:`2px solid ${isSelected?'var(--ink)':'var(--border-strong)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {isSelected && <div style={{ width:8, height:8, borderRadius:999, background:'var(--ink)' }} />}
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                          <span style={{ fontWeight:600, fontSize:14 }}>{addr.name}</span>
                          <span className="pill" style={{ fontSize:10.5, padding:'2px 8px' }}>{addr.type}</span>
                          {addr.default && <span className="pill" style={{ fontSize:10.5, padding:'2px 8px', background:'var(--brand-soft)', borderColor:'transparent', color:'var(--brand)' }}>Default</span>}
                        </div>
                        <div style={{ fontSize:13, color:'var(--ink-2)', lineHeight:1.65 }}>
                          {addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />
                          {addr.city}, {addr.state} — {addr.pincode}
                        </div>
                        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>Mobile: {addr.phone}</div>
                        {isSelected && (
                          <button onClick={e => { e.stopPropagation(); setEditAddr(addr); setShowForm(true); }}
                            className="btn-link" style={{ fontSize:12.5, marginTop:10 }}>
                            Edit this address
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* New address form — expands below existing cards */}
              {showForm && !editAddr && (
                <AddressForm
                  initial={null}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditAddr(null); }}
                />
              )}

              {/* Add new address / empty state */}
              {!showForm && (
                addresses.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px 20px', border:'1px dashed var(--border-strong)', borderRadius:'var(--r-lg)' }}>
                    <p style={{ color:'var(--ink-2)', margin:'0 0 16px', fontSize:14 }}>No saved addresses yet.</p>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add address</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowForm(true); setEditAddr(null); }}
                    style={{
                      width:'100%', padding:'14px 18px',
                      border:'2px dashed var(--border-strong)',
                      borderRadius:'var(--r-md)',
                      background:'var(--surface)',
                      cursor:'pointer',
                      color:'var(--ink-2)',
                      fontSize:13.5, fontWeight:500,
                      display:'flex', alignItems:'center', gap:8,
                      justifyContent:'center',
                      transition:'border-color .15s, color .15s',
                    }}>
                    + Add new address
                  </button>
                )
              )}
            </div>
          </div>

          {/* ── RIGHT: order summary ── */}
          <div>
            <h2 className="serif" style={{ fontSize:28, margin:'0 0 20px' }}>Order summary</h2>
            <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14, maxHeight:300, overflowY:'auto' }}>
                {bag.map(i => (
                  <div key={i.k} style={{ display:'flex', gap:12 }}>
                    <div style={{ width:58, flexShrink:0, borderRadius:'var(--r-sm)', overflow:'hidden', border:'1px solid var(--border)' }}>
                      <ProductArt product={i.product} label={false} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10.5, color:'var(--ink-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>{i.product.brand}</div>
                      <div style={{ fontSize:13, lineHeight:1.3, marginTop:2 }}>{i.product.name}</div>
                      <div style={{ fontSize:11.5, color:'var(--ink-3)', marginTop:3 }}>Size: {i.size} · Qty: {i.qty}</div>
                    </div>
                    <div className="mono" style={{ fontWeight:600, fontSize:13.5, whiteSpace:'nowrap', alignSelf:'center' }}>{inr(i.product.price * i.qty)}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--surface-2)', borderTop:'1px solid var(--border)', padding:'16px 18px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13, color:'var(--ink-2)' }}>
                  <Row label="Subtotal" value={inr(subtotal)} />
                  <Row label="MRP savings" value={'− ' + inr(mrpTotal - subtotal)} color="var(--brand)" />
                  <Row label="Shipping" value={shipping === 0 ? 'Free' : inr(shipping)} />
                  <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
                  <Row label={<strong style={{ fontSize:14, color:'var(--ink)' }}>Total</strong>} value={<strong className="mono" style={{ fontSize:18 }}>{inr(total)}</strong>} />
                </div>
                <button onClick={handlePlace} className="btn btn-primary"
                  style={{ width:'100%', height:50, marginTop:16, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', fontSize:14, opacity:selectedId?1:0.65 }}>
                  {selectedId ? `Place order — ${inr(total)}` : 'Select an address to continue'} <Icon.arrowRight />
                </button>
                <div style={{ display:'flex', justifyContent:'center', gap:14, marginTop:12, fontSize:11, color:'var(--ink-3)' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icon.shield size={12} /> Secure checkout</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icon.ret size={12} /> 14-day returns</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .checkout-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: start; }
        @media (max-width: 899px) { .checkout-grid { grid-template-columns: 1fr; gap: 28px; } }
      `}</style>
    </div>
  );
}

Object.assign(window, {
  Header, MobileTabBar, HomeScreen, PLPScreen, PDPScreen, CartDrawer, WishlistScreen, ProfileScreen, CheckoutScreen,
});
