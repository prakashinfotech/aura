# How aura 2.0 Works: Complete Data Flow Analysis

## TL;DR
**The app IS using a real Supabase PostgreSQL database with proper authentication.** Database credentials are stored in `.env.local` files (not version controlled). Here's how everything connects:

---

## 1. Database Credentials Setup

### Environment Files (Not in Git)
The app uses `.env.local` files to store credentials:

**`apps/web/.env.local`** & **`apps/seller/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

These are **NOT empty** — they contain real Supabase project credentials.

---

## 2. How Database Clients Are Created

### Browser Client (`packages/db/src/client.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,      // ✅ Loaded from .env.local
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!  // ✅ Loaded from .env.local
  );
}
```

**Why `NEXT_PUBLIC_*`?** These are client-side keys (anon key) which are intentionally public and rate-limited. Row-Level Security (RLS) policies protect data in the database.

### Server Client (`packages/db/src/server.ts`)
```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    { cookies: { getAll(), setAll() } }
  );
}

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,  // ✅ Service role (admin)
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

The server has **two clients**:
1. **Regular client** — respects RLS policies (same anon key as browser)
2. **Admin client** — bypasses RLS (uses service role key for trusted operations)

---

## 3. Data Flow: How Products Are Fetched

### Client Request Flow
```
User Opens Homepage
    ↓
app/page.tsx (Server Component)
    ↓
getProductsFiltered() called in lib/queries/products.ts
    ↓
createClient() creates Supabase client with NEXT_PUBLIC_* env vars
    ↓
supabase.rpc("get_products_filtered", {...}) executes RPC function
    ↓
PostgreSQL RPC function runs (supabase/migrations/20250101000005_rpcs.sql)
    ↓
Results returned to component
    ↓
HTML rendered with products
```

### Category Page (Client-Side)
```
User Navigates to /category
    ↓
CategoryPage component (use client)
    ↓
useQuery hook calls getProductsFiltered()
    ↓
Same Supabase client initialization
    ↓
Results cached by TanStack Query
    ↓
Products filtered on-demand as user changes filters
```

---

## 4. Database RPC Functions

The heavy lifting is done by a PostgreSQL function: **`get_products_filtered()`**

**File:** `supabase/migrations/20250101000005_rpcs.sql`

### Function Signature
```sql
CREATE OR REPLACE FUNCTION get_products_filtered(
  p_category_slug TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_brand_ids UUID[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_discount INTEGER DEFAULT NULL,
  p_sizes TEXT[] DEFAULT NULL,
  p_colors TEXT[] DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'relevance',
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20
)
```

### What It Does
1. **Filters** products by category, search, brand, price, discount, sizes, colors, rating, gender
2. **Joins** with related tables (brands, categories, product_variants)
3. **Calculates** discounts, stock availability, image URLs
4. **Sorts** by relevance/price/rating/discount/newest
5. **Paginates** results (page-based)
6. **Security:** SECURITY DEFINER means it runs with elevated permissions but enforces business logic

### Example Call from TypeScript
```typescript
// From lib/queries/products.ts (line 48-62)
const { data, error } = await supabase.rpc("get_products_filtered", {
  p_category_slug: params.categorySlug ?? null,
  p_search: params.search ?? null,
  p_brand_ids: (params.brandIds ?? null) as string[] | null,
  p_min_price: params.minPrice ?? null,
  // ... rest of params
  p_sort: params.sort ?? "relevance",
  p_page: params.page ?? 1,
  p_limit: params.limit ?? 24,
});
```

---

## 5. Complete Product Query Pipeline

### 1️⃣ Initial RPC Call (get_products_filtered)
Fetches basic product info from a single RPC call.

### 2️⃣ Variant & Image Data
After getting product IDs, the code makes **two parallel queries**:

```typescript
// From lib/queries/products.ts (line 94-103)
const [{ data: variantRows }, { data: imageRows }] = await Promise.all([
  supabase
    .from("product_variants")
    .select("id, product_id, color, color_hex")
    .in("product_id", ids),
  supabase
    .from("product_images")
    .select("product_id, variant_id, url, is_primary, sort_order")
    .in("product_id", ids),
]);
```

### 3️⃣ Client-Side Expansion
Products are expanded into **one card per color** with color-specific images:

```typescript
// Expand products into one card per unique color
const expanded: ProductCardData[] = [];
for (const product of products) {
  const colors = colorMap.get(product.id) ?? [];
  for (const c of colors) {
    const colorImages = colorImagesMap.get(`${product.id}_${c.color}`) ?? [];
    expanded.push({
      ...product,
      color: c.color,
      color_hex: c.color_hex,
      primary_image_url: colorImages[0] ?? product.primary_image_url,
      images: colorImages.length > 0 ? colorImages : undefined,
      card_key: `${product.id}_${c.color}`,
    });
  }
}
```

**Result:** One `ProductCardData` per color variant → More browsable options for users

---

## 6. How Fallback Images Work

When a product has no `primary_image_url` in the database, it uses a deterministic Unsplash URL:

```typescript
// From lib/queries/products.ts (line 16-21)
function fashionFallback(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  const id = FASHION_IDS[Math.abs(h) % FASHION_IDS.length]!;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&h=533&q=80`;
}
```

**Why?** Consistent fashion images based on product slug, not random picsum images.

---

## 7. Mock Products (Not Currently Used)

`apps/web/lib/mock-products.ts` contains hardcoded product data (TRENDING_PRODUCTS, NEW_ARRIVALS) but **it's not used in the actual data flow**. It exists for documentation/testing.

---

## 8. Security Architecture

### Row-Level Security (RLS)
- **Anon key** can only read public product data
- User-specific data (orders, addresses, wishlist) is protected by RLS policies
- Sensitive mutations use **admin/service role key** on the server

### Rate Limiting
- **Anon key:** Rate limited by Supabase (prevents abuse)
- **Service role key:** Only used server-side after authentication verification

### SECURITY DEFINER Functions
RPC functions like `get_products_filtered()` are marked `SECURITY DEFINER`, meaning:
- They run with database owner privileges
- They can enforce complex business logic safely
- Callers can't bypass the logic

---

## 9. Database Tables Used

| Table | Used For | Query Method |
|-------|----------|--------------|
| `products` | Product catalog | RPC + JOIN |
| `brands` | Brand info | RPC JOIN |
| `categories` | Category filtering | RPC JOIN |
| `product_variants` | Size/color options | Direct query |
| `product_images` | Product photos | Direct query |
| `reviews` | User reviews | Direct query |
| `banners` | Homepage banners | Direct query |
| `orders` | Order history | Service role |
| `order_items` | Order line items | Service role |
| `coupons` | Discount codes | RPC |

---

## 10. Complete Environment Variable Reference

### Required for Product Browsing (Buyer App)
```env
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Required for Server Operations
```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=<direct-postgres-url>
```

### Required for Payments
```env
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<public-key>
```

### Required for Emails
```env
RESEND_API_KEY=<key>
RESEND_FROM_EMAIL=<email>
```

---

## 11. Why There's No Hardcoded DB String in Source Code

✅ **Correct Approach:**
- Credentials stored in `.env.local` (local development) or environment secrets (production)
- `.env.local` is in `.gitignore` (not committed)
- Code loads credentials from `process.env` at runtime

❌ **What NOT to do:**
- Store credentials in `.env.example` (it's for documentation only)
- Hardcode credentials in the source code
- Commit `.env.local` files

---

## 12. Local Development Setup

To run this app locally:

```bash
# 1. Copy .env.example to .env.local
cp .env.example apps/web/.env.local
cp .env.example apps/seller/.env.local

# 2. Fill in actual credentials from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 3. Install and run
pnpm install
pnpm dev:web    # Buyer app on localhost:3000
pnpm dev:seller # Seller app on localhost:3001
```

---

## 13. Production Deployment

On Vercel/production, environment variables are set via:
- Vercel dashboard → Environment Variables
- GitHub Secrets (for CI/CD)
- Cloud provider secret manager

**Never commit `.env.local` files!**

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser/Client                            │
│  (apps/web, apps/seller)                                    │
│  - NEXT_PUBLIC_SUPABASE_URL (public)                         │
│  - NEXT_PUBLIC_SUPABASE_ANON_KEY (public, rate-limited)     │
└────────────┬──────────────────────────────────────────────────┘
             │ HTTP/REST
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase API Layer                         │
│  https://[Api].supabase.co                  │
│  - REST API                                                 │
│  - Real-time subscriptions                                  │
│  - RPC function calls                                       │
└────────────┬──────────────────────────────────────────────────┘
             │ TCP
             ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL 15 Database                         │
│  db.[Api].supabase.co:5432                  │
│                                                              │
│  Tables:                                                    │
│  - products, brands, categories                             │
│  - product_variants, product_images                         │
│  - orders, order_items                                      │
│  - users, profiles, addresses                               │
│  - reviews, coupons, settlements                            │
│                                                              │
│  RPC Functions:                                             │
│  - get_products_filtered()                                  │
│  - create_order()                                           │
│  - apply_coupon()                                           │
│  - ... + 10 more                                            │
└─────────────────────────────────────────────────────────────┘
```

The app is **fully connected to a real database** with proper security and data integrity! 🎉
