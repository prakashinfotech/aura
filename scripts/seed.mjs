/**
 * Seeds Supabase with: categories, brands, sellers, products, variants, images, banners
 * Run: node scripts/seed.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("Set it with: export DATABASE_URL='postgresql://...'");
  process.exit(1);
}

let client;

async function upsert(table, rows, conflictCol = "id") {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const updateList = cols
    .filter((c) => c !== conflictCol)
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");

  for (const row of rows) {
    const vals = cols.map((c) => row[c]);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `
      INSERT INTO ${table} (${colList})
      VALUES (${placeholders})
      ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateList}
    `;
    await client.query(sql, vals);
  }
}

// UUID helpers — all segments are valid hex (0-9, a-f)
// Format: 00000000-TYPE-NNNN-SSSS-000000000000
function catId(n)     { return `00000000-0001-${pad(n)}-0000-000000000000`; }
function brandId(n)   { return `00000000-0002-${pad(n)}-0000-000000000000`; }
function profId(n)    { return `00000000-0003-${pad(n)}-0000-000000000000`; }
function sellerId(n)  { return `00000000-0004-${pad(n)}-0000-000000000000`; }
function prodId(n)    { return `00000000-0005-${pad(n)}-0000-000000000000`; }
function varId(pn,sn) { return `00000000-0006-${pad(pn)}-${pad(sn)}-000000000000`; }
function imgId(pn,in_){ return `00000000-0007-${pad(pn)}-${pad(in_)}-000000000000`; }
function bannId(n)    { return `00000000-0008-${pad(n)}-0000-000000000000`; }
function pad(n)       { return String(n).padStart(4, "0"); }

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: catId(1),  name: "Men",         slug: "men",          display_order: 1 },
  { id: catId(2),  name: "Women",       slug: "women",        display_order: 2 },
  { id: catId(3),  name: "Kids",        slug: "kids",         display_order: 3 },
  { id: catId(4),  name: "Beauty",      slug: "beauty",       display_order: 4 },
  { id: catId(5),  name: "Home & Living", slug: "home",       display_order: 5 },
  { id: catId(6),  name: "Studio",      slug: "studio",       display_order: 6 },
  // Sub-categories (men)
  { id: catId(11), name: "T-Shirts",    slug: "men-tshirts",  parent_id: catId(1), display_order: 1 },
  { id: catId(12), name: "Shirts",      slug: "men-shirts",   parent_id: catId(1), display_order: 2 },
  { id: catId(13), name: "Jeans",       slug: "men-jeans",    parent_id: catId(1), display_order: 3 },
  { id: catId(14), name: "Shoes",       slug: "men-shoes",    parent_id: catId(1), display_order: 4 },
  // Sub-categories (women)
  { id: catId(21), name: "Kurtas",      slug: "women-kurtas", parent_id: catId(2), display_order: 1 },
  { id: catId(22), name: "Dresses",     slug: "women-dresses",parent_id: catId(2), display_order: 2 },
  { id: catId(23), name: "Tops",        slug: "women-tops",   parent_id: catId(2), display_order: 3 },
];

// ── Brands ───────────────────────────────────────────────────────────────────
const BRANDS = [
  { id: brandId(1),  name: "Roadster",      slug: "roadster" },
  { id: brandId(2),  name: "HERE&NOW",      slug: "here-and-now" },
  { id: brandId(3),  name: "MANGO",         slug: "mango" },
  { id: brandId(4),  name: "H&M",           slug: "h-and-m" },
  { id: brandId(5),  name: "Puma",          slug: "puma" },
  { id: brandId(6),  name: "Nike",          slug: "nike" },
  { id: brandId(7),  name: "Levi's",        slug: "levis" },
  { id: brandId(8),  name: "Zara",          slug: "zara" },
  { id: brandId(9),  name: "BIBA",          slug: "biba" },
  { id: brandId(10), name: "ONLY",          slug: "only" },
  { id: brandId(11), name: "U.S. Polo Assn.", slug: "us-polo" },
  { id: brandId(12), name: "Adidas",        slug: "adidas" },
];

// ── Seller profiles + sellers ─────────────────────────────────────────────
const SELLER_PROFILES = [
  { id: profId(1), name: "Urban Fashion Co",    email: "urban@aura.local" },
  { id: profId(2), name: "StyleStep Footwear",  email: "stylestep@aura.local" },
  { id: profId(3), name: "Ethnix Weavers",      email: "ethnix@aura.local" },
  { id: profId(4), name: "FitLife Activewear",  email: "fitlife@aura.local" },
];

const SELLERS = [
  { id: sellerId(1), user_id: profId(1), store_name: "Urban Fashion Co",   status: "approved", commission_rate: 18 },
  { id: sellerId(2), user_id: profId(2), store_name: "StyleStep Footwear", status: "approved", commission_rate: 20 },
  { id: sellerId(3), user_id: profId(3), store_name: "Ethnix Weavers",     status: "approved", commission_rate: 15 },
  { id: sellerId(4), user_id: profId(4), store_name: "FitLife Activewear", status: "approved", commission_rate: 20 },
];

// ── Shorthand refs ────────────────────────────────────────────────────────────
const B = {
  roadster: brandId(1), herenow: brandId(2), mango: brandId(3),  hm: brandId(4),
  puma: brandId(5),     nike: brandId(6),    levis: brandId(7),  zara: brandId(8),
  biba: brandId(9),     only: brandId(10),   uspolo: brandId(11), adidas: brandId(12),
};
const C = {
  men: catId(1), women: catId(2), kids: catId(3),
  tshirts: catId(11), shirts: catId(12), jeans: catId(13), shoes: catId(14),
  kurtas: catId(21), dresses: catId(22),
};
const SL = { urban: sellerId(1), style: sellerId(2), ethnix: sellerId(3), fitlife: sellerId(4) };

function mkProduct(n, title, slug, brandId, categoryId, sid, gender, description) {
  return {
    id: prodId(n), title, slug,
    brand_id: brandId, category_id: categoryId, seller_id: sid,
    gender, description, status: "active",
    rating_avg: parseFloat((3.8 + (n * 17 % 12) / 10).toFixed(2)),
    rating_count: 100 + (n * 137) % 4900,
  };
}

// ── Products (10 per seller = 40 total) ──────────────────────────────────────
const PRODUCTS = [
  // 1-10: Urban Fashion Co
  mkProduct(1,  "Slim Fit Casual Shirt",         "roadster-slim-fit-shirt",  B.roadster, C.shirts,  SL.urban,   "men",   "Classic slim-fit casual shirt in 100% cotton."),
  mkProduct(2,  "Relaxed Fit Graphic Tee",        "herenow-graphic-tee",      B.herenow,  C.tshirts, SL.urban,   "men",   "Bold graphic print on soft jersey cotton."),
  mkProduct(3,  "Slim Stretch Jeans",             "levis-slim-stretch",       B.levis,    C.jeans,   SL.urban,   "men",   "Slim stretch 5-pocket jeans in mid-wash indigo."),
  mkProduct(4,  "Solid Oxford Shirt",             "hm-oxford-shirt",          B.hm,       C.shirts,  SL.urban,   "men",   "Classic Oxford-weave shirt with button-down collar."),
  mkProduct(5,  "Regular Fit Polo",               "uspolo-regular-polo",      B.uspolo,   C.tshirts, SL.urban,   "men",   "Pique-knit polo with embroidered logo."),
  mkProduct(6,  "Tapered Fit Chinos",             "hm-tapered-chinos",        B.hm,       C.jeans,   SL.urban,   "men",   "Cotton-twill tapered chinos with 4-way stretch."),
  mkProduct(7,  "Linen Blend Shirt",              "roadster-linen-shirt",     B.roadster, C.shirts,  SL.urban,   "men",   "Breathable linen-blend shirt in summer pastels."),
  mkProduct(8,  "Oversized Drop-Shoulder Tee",    "herenow-oversized-tee",    B.herenow,  C.tshirts, SL.urban,   "men",   "Oversized drop-shoulder tee in heavyweight cotton."),
  mkProduct(9,  "Straight Fit Dark Wash Jeans",   "levis-dark-wash",          B.levis,    C.jeans,   SL.urban,   "men",   "Straight-fit dark-wash denim with subtle fading."),
  mkProduct(10, "Mandarin Collar Shirt",          "roadster-mandarin",        B.roadster, C.shirts,  SL.urban,   "men",   "Slim mandarin collar shirt in micro-check print."),

  // 11-20: StyleStep Footwear
  mkProduct(11, "Air Max Street Sneakers",        "nike-air-max-street",      B.nike,     C.shoes,   SL.style,   "men",   "Lightweight mesh sneakers with Air cushioning."),
  mkProduct(12, "Classic Runner Shoes",           "puma-classic-runner",      B.puma,     C.shoes,   SL.style,   "men",   "Timeless running silhouette with EVA midsole."),
  mkProduct(13, "Ultraboost 22 Running",          "adidas-ultraboost",        B.adidas,   C.shoes,   SL.style,   "men",   "Responsive Boost midsole for all-day energy return."),
  mkProduct(14, "Women React Running Shoes",      "nike-women-runner",        B.nike,     C.shoes,   SL.style,   "women", "React foam cushioning for a smooth, fast ride."),
  mkProduct(15, "Suede Platform Sneakers",        "puma-suede-platform",      B.puma,     C.shoes,   SL.style,   "women", "Iconic Suede silhouette on a bold platform sole."),
  mkProduct(16, "Stan Smith Classic",             "adidas-stan-smith",        B.adidas,   C.shoes,   SL.style,   "men",   "The original clean-cut leather tennis shoe."),
  mkProduct(17, "Chunky Sole Sneakers",           "hm-chunky-sneakers",       B.hm,       C.shoes,   SL.style,   "women", "Chunky sole sneakers in faux leather upper."),
  mkProduct(18, "Penny Loafers",                  "roadster-loafers",         B.roadster, C.shoes,   SL.style,   "men",   "Slip-on penny loafers in genuine leather."),
  mkProduct(19, "Trail Running Shoes",            "puma-trail",               B.puma,     C.shoes,   SL.style,   "men",   "All-terrain trail shoes with aggressive lug sole."),
  mkProduct(20, "Pointed Toe Ballet Flats",       "mango-ballet-flats",       B.mango,    C.shoes,   SL.style,   "women", "Pointed-toe ballet flats in soft nappa leather."),

  // 21-30: Ethnix Weavers
  mkProduct(21, "Floral Print Kurta",             "biba-floral-kurta",        B.biba,     C.kurtas,  SL.ethnix,  "women", "Cotton floral print A-line kurta with thread embroidery."),
  mkProduct(22, "Straight Printed Kurta",         "biba-straight-kurta",      B.biba,     C.kurtas,  SL.ethnix,  "women", "Straight-cut digital print kurta in cotton blend."),
  mkProduct(23, "Floral Wrap Dress",              "mango-wrap-dress",         B.mango,    C.dresses, SL.ethnix,  "women", "Midi wrap dress in chiffon with floral print."),
  mkProduct(24, "Pleated A-Line Skirt",           "zara-a-line-skirt",        B.zara,     C.women,   SL.ethnix,  "women", "Pleated A-line midi skirt in satin finish."),
  mkProduct(25, "Embroidered Anarkali Kurta",     "biba-anarkali",            B.biba,     C.kurtas,  SL.ethnix,  "women", "Floor-length anarkali with zari embroidery at yoke."),
  mkProduct(26, "Maxi Slip Dress",                "only-slip-dress",          B.only,     C.dresses, SL.ethnix,  "women", "Satin-finish maxi slip dress with adjustable straps."),
  mkProduct(27, "Relaxed Block Print Kurta",      "biba-relaxed-kurta",       B.biba,     C.kurtas,  SL.ethnix,  "women", "Pure cotton relaxed-fit kurta with block print."),
  mkProduct(28, "Ruffle Hem Mini Dress",          "mango-ruffle-dress",       B.mango,    C.dresses, SL.ethnix,  "women", "Ruffle-hem mini dress in floral cotton."),
  mkProduct(29, "Tie-Dye Pintuck Kurta",          "herenow-tiedye-kurta",     B.herenow,  C.kurtas,  SL.ethnix,  "women", "Tie-dye cotton kurta with pintuck details."),
  mkProduct(30, "Belted Linen Shirt Dress",       "zara-shirt-dress",         B.zara,     C.dresses, SL.ethnix,  "women", "Button-down shirt dress in linen with belted waist."),

  // 31-40: FitLife Activewear
  mkProduct(31, "Dri-FIT Training Tee",           "nike-dri-fit-tee",         B.nike,     C.tshirts, SL.fitlife, "men",   "Dri-FIT moisture-wicking training t-shirt."),
  mkProduct(32, "Compression Shorts",             "adidas-compression",       B.adidas,   C.men,     SL.fitlife, "men",   "Recycled-polyester compression shorts with 7-inch inseam."),
  mkProduct(33, "Medium-Support Sports Bra",      "puma-sports-bra",          B.puma,     C.women,   SL.fitlife, "women", "Medium-support seamless sports bra with racerback."),
  mkProduct(34, "High-Waist Yoga Leggings",       "only-yoga-leggings",       B.only,     C.women,   SL.fitlife, "women", "High-waist 7/8 yoga leggings in sweat-wicking fabric."),
  mkProduct(35, "Packable Windbreaker Jacket",    "adidas-windbreaker",       B.adidas,   C.men,     SL.fitlife, "men",   "Lightweight ripstop windbreaker with packable hood."),
  mkProduct(36, "DryCell Track Pants",            "puma-track-pants",         B.puma,     C.men,     SL.fitlife, "men",   "Tapered track pants with DryCell moisture management."),
  mkProduct(37, "Reflective Running Jacket",      "nike-running-jacket",      B.nike,     C.women,   SL.fitlife, "women", "Lightweight reflective running jacket with zip pockets."),
  mkProduct(38, "4-Way Stretch Gym Shorts",       "herenow-gym-shorts",       B.herenow,  C.men,     SL.fitlife, "men",   "4-way stretch gym shorts with 5-inch inseam."),
  mkProduct(39, "Fleece-Lined Hoodie",            "adidas-women-hoodie",      B.adidas,   C.women,   SL.fitlife, "women", "Fleece-lined hoodie with kangaroo pocket."),
  mkProduct(40, "Padded Cycling Bib Shorts",      "puma-cycling-bib",         B.puma,     C.men,     SL.fitlife, "men",   "Padded cycling bib shorts with chamois insert."),
];

// ── Variants (3 per product) ──────────────────────────────────────────────
const MEN_SIZES   = ["S", "M", "L"];
const WOMEN_SIZES = ["XS", "S", "M"];
const SHOE_SIZES  = ["UK 7", "UK 8", "UK 9"];
const COLORS = [["Black", "#000000"], ["Navy", "#1a1d5b"], ["White", "#ffffff"]];

function makeVariants(p, pn) {
  const isShoe   = pn >= 11 && pn <= 20;
  const isWomen  = p.gender === "women";
  const sizes    = isShoe ? SHOE_SIZES : isWomen ? WOMEN_SIZES : MEN_SIZES;
  const baseMrp  = 500 + (pn * 87) % 4500;
  const discPct  = 0.3 + (pn % 4) * 0.1;

  return sizes.map((size, si) => ({
    id:           varId(pn, si),
    product_id:   p.id,
    size,
    color:        COLORS[si][0],
    color_hex:    COLORS[si][1],
    sku:          `SEED-${String(pn).padStart(3,"0")}-${size.replace(/\s/g,"-")}-${COLORS[si][0].slice(0,3).toUpperCase()}`,
    stock_qty:    10 + (si * 7) % 50,
    mrp:          Math.round(baseMrp / 10) * 10,
    selling_price:Math.round((baseMrp * (1 - discPct)) / 10) * 10,
  }));
}

function makeImages(p, pn) {
  return [0, 1, 2, 3].map((i) => ({
    id:         imgId(pn, i),
    product_id: p.id,
    url:        `https://picsum.photos/seed/${p.slug}-${i}/400/533`,
    sort_order: i,
    is_primary: i === 0,
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase ✓\n");

  console.log("Seeding categories…");
  await upsert("categories", CATEGORIES, "slug");
  console.log(`  ✓ ${CATEGORIES.length} categories`);

  console.log("Seeding brands…");
  await upsert("brands", BRANDS, "slug");
  console.log(`  ✓ ${BRANDS.length} brands`);

  console.log("Seeding auth users + seller profiles…");
  for (const profile of SELLER_PROFILES) {
    try {
      // Insert into auth.users first (bypasses FK constraint on profiles)
      await client.query(
        `INSERT INTO auth.users (
           id, instance_id, aud, role, email,
           encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data,
           created_at, updated_at
         )
         VALUES (
           $1, '00000000-0000-0000-0000-000000000000',
           'authenticated', 'authenticated', $2,
           crypt('Seller@123!', gen_salt('bf')),
           NOW(),
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('name', $3::text),
           NOW(), NOW()
         )
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
        [profile.id, profile.email, profile.name]
      );
    } catch (e) {
      console.warn(`  ⚠ auth.users ${profile.email}: ${e.message.slice(0, 100)}`);
    }
    try {
      await client.query(
        `INSERT INTO profiles (id, name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
        [profile.id, profile.name, profile.email]
      );
    } catch (e) {
      console.warn(`  ⚠ Profile ${profile.email}: ${e.message.slice(0, 100)}`);
    }
  }
  console.log(`  ✓ ${SELLER_PROFILES.length} auth users + profiles`);

  console.log("Seeding sellers…");
  await upsert("sellers", SELLERS, "id");
  console.log(`  ✓ ${SELLERS.length} sellers`);

  console.log("Seeding products…");
  await upsert("products", PRODUCTS, "slug");
  console.log(`  ✓ ${PRODUCTS.length} products`);

  console.log("Seeding variants…");
  const allVariants = PRODUCTS.flatMap((p, i) => makeVariants(p, i + 1));
  for (let i = 0; i < allVariants.length; i += 50) {
    await upsert("product_variants", allVariants.slice(i, i + 50), "sku");
  }
  console.log(`  ✓ ${allVariants.length} variants`);

  console.log("Seeding product images…");
  const allImages = PRODUCTS.flatMap((p, i) => makeImages(p, i + 1));
  for (let i = 0; i < allImages.length; i += 50) {
    await upsert("product_images", allImages.slice(i, i + 50), "id");
  }
  console.log(`  ✓ ${allImages.length} images`);

  console.log("Seeding banners…");
  await upsert("banners", [
    {
      id: bannId(1),
      image_url_desktop: "https://picsum.photos/seed/banner-desktop-1/1280/320",
      image_url_mobile:  "https://picsum.photos/seed/banner-mobile-1/390/200",
      target_url: "/category/men",
      position: "hero", active: true, sort_order: 1,
    },
    {
      id: bannId(2),
      image_url_desktop: "https://picsum.photos/seed/banner-desktop-2/1280/320",
      image_url_mobile:  "https://picsum.photos/seed/banner-mobile-2/390/200",
      target_url: "/category/women",
      position: "hero", active: true, sort_order: 2,
    },
  ], "id");
  console.log("  ✓ 2 banners");

  await client.end();
  console.log("\n✓ Seed complete!");
}

main().catch((err) => {
  console.error("Seed error:", err.message);
  process.exit(1);
});
