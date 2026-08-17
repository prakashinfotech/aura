// Saaya — app entry, routing, state, tweaks wiring
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useCallback: useCallbackA } = React;

// Palette presets exposed via Tweaks
const PALETTES = {
  rose: {
    label: 'Rose & Ivory',
    brand: '#B33951', brandStrong: '#962A42', brandSoft: '#F3D5DC',
    ink: '#1F1B1A', surface: '#FBF6E9', surface2: '#FFFFFF', surface3: '#F2ECDB',
    border: '#E6DCC6', borderStrong: '#C9BFAA', accent: '#C99B5E',
  },
  mulberry: {
    label: 'Mulberry & Stone',
    brand: '#7B2D5C', brandStrong: '#5E2147', brandSoft: '#E4CFDB',
    ink: '#1A1518', surface: '#F4F0EC', surface2: '#FFFFFF', surface3: '#EAE4DD',
    border: '#DCD2C7', borderStrong: '#B9ADA0', accent: '#9D8567',
  },
  terracotta: {
    label: 'Terracotta & Sand',
    brand: '#C25434', brandStrong: '#9F4127', brandSoft: '#EDC9B8',
    ink: '#1F1814', surface: '#F8F1E6', surface2: '#FFFFFF', surface3: '#EDE0CC',
    border: '#E0D2BA', borderStrong: '#BDAB8E', accent: '#3D4D58',
  },
  indigo: {
    label: 'Indigo & Cream',
    brand: '#2B4E7A', brandStrong: '#1F3A5C', brandSoft: '#D2DEEC',
    ink: '#161922', surface: '#F4EFE3', surface2: '#FFFFFF', surface3: '#E8E1D1',
    border: '#D8D0BD', borderStrong: '#B4AC97', accent: '#C99B5E',
  },
};


function applyPalette(p) {
  const r = document.documentElement;
  const s = r.style;
  s.setProperty('--brand', p.brand);
  s.setProperty('--brand-strong', p.brandStrong);
  s.setProperty('--brand-soft', p.brandSoft);
  s.setProperty('--ink', p.ink);
  s.setProperty('--surface', p.surface);
  s.setProperty('--surface-2', p.surface2);
  s.setProperty('--surface-3', p.surface3);
  s.setProperty('--border', p.border);
  s.setProperty('--border-strong', p.borderStrong);
  s.setProperty('--accent', p.accent);
}

function App() {
  // Tweaks state
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  // Apply palette on mount + change
  useEffectA(() => {
    const p = PALETTES[t.palette] || PALETTES.rose;
    applyPalette(p);
    document.body.dataset.density = t.density;
    document.body.dataset.corners = t.corners;
    document.body.dataset.type = t.type === 'editorial' ? 'editorial' : 'sans';
  }, [t.palette, t.density, t.corners, t.type]);

  // Routing — flat state object
  const [route, setRoute] = useStateA({ name: 'home' });
  const navigate = (next) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Bag + wishlist
  const [bag, setBag] = useStateA([]);
  const [wishlist, setWishlist] = useStateA(new Set());
  const [bagOpen, setBagOpen] = useStateA(false);
  const [toast, setToast] = useStateA(null);
  const [mobileNavOpen, setMobileNavOpen] = useStateA(false);

  // Custom toast events
  useEffectA(() => {
    const fn = (e) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 2400);
    };
    window.addEventListener('saaya:toast', fn);
    return () => window.removeEventListener('saaya:toast', fn);
  }, []);

  const addToBag = (product, opts) => {
    const k = product.id + '-' + opts.size + '-' + opts.color;
    setBag(prev => {
      const ex = prev.find(i => i.k === k);
      if (ex) return prev.map(i => i.k === k ? { ...i, qty: i.qty + opts.qty } : i);
      return [...prev, { k, product, ...opts }];
    });
    setBagOpen(true);
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); setToast('Removed from wishlist'); }
      else { s.add(id); setToast('Added to wishlist'); }
      setTimeout(() => setToast(null), 2200);
      return s;
    });
  };

  const onOpenPDP = (product) => navigate({ name: 'pdp', id: product.id });

  // Current screen
  let screen;
  if (route.name === 'home') {
    screen = <HomeScreen navigate={navigate} onWishlist={toggleWishlist} wishlist={wishlist} onOpenPDP={onOpenPDP} />;
  } else if (route.name === 'plp') {
    screen = <PLPScreen route={route} navigate={navigate} onWishlist={toggleWishlist} wishlist={wishlist} onOpenPDP={onOpenPDP} />;
  } else if (route.name === 'pdp') {
    const product = window.SAAYA_DATA.products.find(p => p.id === route.id) || window.SAAYA_DATA.products[0];
    screen = <PDPScreen product={product} navigate={navigate} onAddToBag={addToBag} onWishlist={toggleWishlist} wishlist={wishlist} route={route} />;
  } else if (route.name === 'wishlist') {
    screen = <WishlistScreen wishlist={wishlist} onWishlist={toggleWishlist} navigate={navigate} onOpenPDP={onOpenPDP} />;
  } else if (route.name === 'profile') {
    screen = <ProfileScreen />;
  } else if (route.name === 'checkout') {
    screen = <CheckoutScreen bag={bag} navigate={navigate} />;
  } else {
    screen = <HomeScreen navigate={navigate} onWishlist={toggleWishlist} wishlist={wishlist} onOpenPDP={onOpenPDP} />;
  }

  const bagCount = bag.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <Header
        route={route}
        navigate={navigate}
        bagCount={bagCount}
        wishCount={wishlist.size}
        onOpenBag={() => setBagOpen(true)}
        onOpenMenu={() => setMobileNavOpen(true)}
      />
      <main>{screen}</main>
      <MobileTabBar route={route} navigate={navigate} onOpenBag={() => setBagOpen(true)} />

      <CartDrawer open={bagOpen} onClose={() => setBagOpen(false)} items={bag} setItems={setBag} navigate={navigate} />

      {/* Mobile menu drawer */}
      {mobileNavOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250 }}>
          <div className="backdrop" onClick={() => setMobileNavOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <aside className="drawer" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'min(320px, 86%)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', animation: 'slide-in-l .35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <header style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <Logo size={22} />
              <button onClick={() => setMobileNavOpen(false)} style={{ background: 'transparent', border: 0, padding: 6 }}><Icon.close /></button>
            </header>
            <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
              {window.SAAYA_DATA.cats.map(c => (
                <button key={c.id} onClick={() => { setMobileNavOpen(false); navigate({ name: 'plp', cat: c.id }); }} style={{
                  width: '100%', textAlign: 'left', padding: '14px 22px', background: 'transparent', border: 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontFamily: 'var(--font-display)',
                }}>
                  {c.label} <Icon.chevronRight />
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 22px' }} />
              {['Track order', 'Returns', 'Help', 'Saaya Insider'].map(x => (
                <div key={x} style={{ padding: '12px 22px', fontSize: 13, color: 'var(--ink-2)' }}>{x}</div>
              ))}
            </nav>
          </aside>
          <style>{`@keyframes slide-in-l { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakSelect label="Tone" value={t.palette}
          options={Object.keys(PALETTES).map(k => ({ value: k, label: PALETTES[k].label }))}
          onChange={(v) => setTweak('palette', v)} />

        <TweakSection label="Typography" />
        <TweakRadio label="Display" value={t.type}
          options={['editorial', 'sans']}
          onChange={(v) => setTweak('type', v)} />

        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
          options={['roomy', 'compact']}
          onChange={(v) => setTweak('density', v)} />
        <TweakRadio label="Corners" value={t.corners}
          options={['soft', 'sharp']}
          onChange={(v) => setTweak('corners', v)} />
      </TweaksPanel>
    </>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
