// Saaya — sample catalog. All names + brands are fictional originals.
window.SAAYA_DATA = (() => {
  const brands = ['Solene', 'Ravi Mills', 'Indu Co.', 'Kavi Studio', 'Bhumi', 'Noir & Daze', 'Verma House', 'Mira Atelier', 'Tilak Threads', 'Ochre Lane'];

  const cats = [
    { id: 'women',  label: 'Women',  hue: '#B33951', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=160&h=160&fit=crop&auto=format' },
    { id: 'men',    label: 'Men',    hue: '#3D4D58' },
    { id: 'kids',   label: 'Kids',   hue: '#C99B5E', img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=160&h=160&fit=crop&auto=format' },
    { id: 'beauty', label: 'Beauty', hue: '#8C5B72' },
    { id: 'home',   label: 'Home',   hue: '#6B7B5A', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=160&h=160&fit=crop&auto=format' },
    { id: 'studio', label: 'Studio', hue: '#1F1B1A' },
  ];

  // Editorial product names — original, generic descriptors
  const products = [
    { id: 'p01', brand: 'Solene',       name: 'Block-print cotton kurta',          mrp: 2499, price: 1299, cat: 'women', tag: 'New',     colors: ['#B33951','#1F1B1A','#FBF6E9'], swatch: '#B33951', tone: '#E3C1B7' },
    { id: 'p02', brand: 'Noir & Daze',  name: 'Wide-leg pleated trouser',          mrp: 3490, price: 2093, cat: 'women', tag: 'Bestseller', colors: ['#1F1B1A','#3D4D58','#C99B5E'], swatch: '#3D4D58', tone: '#C7CDD2' },
    { id: 'p03', brand: 'Ravi Mills',   name: 'Handloom silk drape saree',         mrp: 8990, price: 5394, cat: 'women', tag: 'Sale',    colors: ['#C99B5E','#B33951','#6B7B5A'], swatch: '#C99B5E', tone: '#EAD7B7' },
    { id: 'p04', brand: 'Indu Co.',     name: 'Cropped poplin overshirt',          mrp: 1899, price: 1329, cat: 'women', tag: null,      colors: ['#FBF6E9','#B33951','#1F1B1A'], swatch: '#FBF6E9', tone: '#F2EBDA' },
    { id: 'p05', brand: 'Kavi Studio',  name: 'Linen-blend tailored blazer',       mrp: 4990, price: 2495, cat: 'men',   tag: 'New',     colors: ['#3D4D58','#1F1B1A','#8B7355'], swatch: '#3D4D58', tone: '#BFC6CC' },
    { id: 'p06', brand: 'Verma House',  name: 'Slim-fit khadi formal shirt',       mrp: 1799, price: 1259, cat: 'men',   tag: null,      colors: ['#FBF6E9','#3D4D58','#8C5B72'], swatch: '#FBF6E9', tone: '#EFE9D8' },
    { id: 'p07', brand: 'Tilak Threads',name: 'Mid-rise relaxed denim',            mrp: 2999, price: 1799, cat: 'men',   tag: 'Sale',    colors: ['#3D4D58','#1F1B1A'],           swatch: '#3D4D58', tone: '#B6BFC6' },
    { id: 'p08', brand: 'Ochre Lane',   name: 'Embroidered Bandhgala jacket',      mrp: 6990, price: 4893, cat: 'men',   tag: 'Bestseller', colors: ['#1F1B1A','#B33951','#C99B5E'], swatch: '#1F1B1A', tone: '#9C9A99' },
    { id: 'p09', brand: 'Bhumi',        name: 'Floral mini wrap dress',            mrp: 2299, price: 1379, cat: 'women', tag: 'Sale',    colors: ['#B33951','#C99B5E'],           swatch: '#B33951', tone: '#E3BFB9' },
    { id: 'p10', brand: 'Mira Atelier', name: 'Hand-spun chanderi dupatta',        mrp: 3490, price: 2443, cat: 'women', tag: null,      colors: ['#C99B5E','#FBF6E9','#B33951'], swatch: '#C99B5E', tone: '#E8D2AC' },
    { id: 'p11', brand: 'Solene',       name: 'Strappy slip midi dress',           mrp: 2799, price: 1959, cat: 'women', tag: 'New',     colors: ['#8C5B72','#1F1B1A','#C99B5E'], swatch: '#8C5B72', tone: '#D2BAC4' },
    { id: 'p12', brand: 'Indu Co.',     name: 'Cotton ribbed knit sweater',        mrp: 2199, price: 1539, cat: 'men',   tag: null,      colors: ['#6B7B5A','#1F1B1A','#C99B5E'], swatch: '#6B7B5A', tone: '#C4CDB9' },
  ];

  const reviews = [
    { id: 'r1', name: 'Anika S.', stars: 5, time: '2 weeks ago', body: 'Fabric drapes beautifully and the colour is exactly as shown. The block-print detail is very crisp.', size: 'M', verified: true },
    { id: 'r2', name: 'Priya M.', stars: 4, time: '1 month ago', body: 'Lovely fit through the shoulders. Sleeve length runs a touch long — easy to alter.', size: 'S', verified: true },
    { id: 'r3', name: 'Devika R.', stars: 5, time: '5 weeks ago', body: 'Worth every rupee. The hand-feel is exceptional and it washes well.', size: 'L', verified: true },
  ];

  // Sizes available per category type
  const sizesApparel = ['XS','S','M','L','XL','XXL'];

  return { brands, cats, products, reviews, sizesApparel };
})();
