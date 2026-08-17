# CLAUDE CODE PROMPT
## Aura Marketplace — Fashion E-Commerce
### For: Claude Code — Full-Stack React 19 / Next.js 15 Development

---

> **Instructions for Claude Code**: Read this entire file before writing a single line of code. Follow the task ordering strictly. Every database table must exist before the UI that uses it. Every component must be in the shared `packages/ui` package unless it is surface-specific.

---

## 0. PRE-FLIGHT: AUTHENTICATION SETUP CHECKLIST

Before starting development, collect these credentials. Store all in GitHub Secrets + Vercel Environment Variables. **Never commit any secret to the repo.**

```
REQUEST FROM HUMAN:

☐ SUPABASE
  - Create 3 Supabase projects: dev / staging / prod
  - For each: URL + ANON_KEY + SERVICE_ROLE_KEY
  - Enable: PostgreSQL 15, pg_cron, pg_trgm, pg_stat_statements

☐ GITHUB
  - GitHub Personal Access Token (for Actions workflows, changelog)
  - Org/Repo name: {owner}/{repo-name}

☐ VERCEL
  - Vercel Access Token
  - Team ID (from Vercel dashboard)
  - Create 2 projects: web + seller

☐ RAZORPAY
  - Test Key ID + Test Key Secret (for dev/staging)
  - Live Key ID + Live Key Secret (for production)
  - Webhook Secret (generated in Razorpay dashboard)

☐ GOOGLE OAUTH
  - Google Cloud Console → OAuth 2.0 Client ID + Client Secret
  - Authorized redirect URIs: 
    https://{supabase-project-ref}.supabase.co/auth/v1/callback

☐ FACEBOOK OAUTH
  - Facebook Developer App → App ID + App Secret
  - OAuth Redirect URI: same Supabase callback

☐ MSG91
  - Auth Key
  - Template IDs for: OTP, order confirmation, delivery update

☐ RESEND
  - API Key
  - Verified domain (for From: address)

☐ SENTRY
  - Create project → DSN for web app + seller app
  - Auth Token (for source map upload in CI)

☐ MCP SETUP (Claude Code MCP)
  - Supabase MCP: connect to dev Supabase project
  - GitHub MCP: connect to monorepo
  - Vercel MCP: connect to both Vercel projects
  - This allows Claude Code to read DB schema, create PRs, check deploy status

☐ OPTIONAL - DELHIVERY / SHIPROCKET
  - API Key for logistics integration (can be mocked in Phase 1)
```

---

## 1. PROJECT INITIALIZATION

### 1.1 Create Monorepo Structure

```bash
# Run these commands exactly:
mkdir aura-marketplace && cd aura-marketplace
git init
pnpm init

# Install Turborepo
pnpm add -D turbo

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Create apps
mkdir -p apps/web apps/seller packages/ui packages/db packages/validators packages/config

# Initialize Next.js apps
cd apps/web && pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd ../seller && pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 1.2 Install Dependencies (apps/web + apps/seller)

```bash
# Shared across both apps:
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add sonner
pnpm add embla-carousel-react embla-carousel-autoplay
pnpm add date-fns
pnpm add lucide-react
pnpm add clsx tailwind-merge
pnpm add class-variance-authority

# apps/web specific:
pnpm add razorpay
pnpm add @radix-ui/react-dialog @radix-ui/react-accordion @radix-ui/react-sheet
pnpm add @radix-ui/react-checkbox @radix-ui/react-slider @radix-ui/react-scroll-area
pnpm add @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-avatar
pnpm add @radix-ui/react-toast @radix-ui/react-switch
pnpm add react-easy-crop
pnpm add nanoid
pnpm add @tanstack/react-virtual

# apps/seller specific:
pnpm add recharts
pnpm add @tanstack/react-table
pnpm add react-dropzone
pnpm add xlsx

# Dev dependencies (both apps):
pnpm add -D @types/node vitest @vitejs/plugin-react
pnpm add -D @playwright/test @axe-core/playwright
pnpm add -D @sentry/nextjs
```

### 1.3 Environment Variables

Create `.env.example` in repo root and each app:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Messaging
RESEND_API_KEY=
MSG91_AUTH_KEY=
MSG91_OTP_TEMPLATE_ID=

# App secrets
CRON_SECRET=
ISR_REVALIDATION_SECRET=

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Logistics (Phase 1 can be empty — use mock)
LOGISTICS_WEBHOOK_SECRET=
DELHIVERY_API_KEY=
```

---

## 2. DATABASE SETUP (Do This FIRST)

> **Rule**: Create ALL database tables and RLS policies before writing any React code.

### 2.1 Supabase Local Setup

```bash
pnpm add -g supabase
supabase init
supabase start
supabase link --project-ref {your-dev-project-ref}
```

### 2.2 Migration Files — Create in This Order

**Migration 001: Extensions & Helpers**
```sql
-- supabase/migrations/20250101000000_extensions.sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

**Migration 002: Auth & Profiles**
```sql
-- supabase/migrations/20250101000001_auth_profiles.sql

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male','female','unisex','prefer_not_to_say')),
  dob DATE,
  insider_tier TEXT DEFAULT 'silver' CHECK (insider_tier IN ('silver','gold','platinum')),
  insider_points INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  type TEXT DEFAULT 'home' CHECK (type IN ('home','work','other')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  identifier TEXT NOT NULL,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE addresses SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_single_default_address
  AFTER INSERT OR UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION enforce_single_default_address();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
```

**Migration 003: Catalog**
```sql
-- supabase/migrations/20250101000002_catalog.sql

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  store_name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended','rejected')),
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 20,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  description TEXT,
  gender TEXT CHECK (gender IN ('men','women','boys','girls','unisex')),
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_review','active','rejected','archived')),
  search_vector TSVECTOR,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  sku TEXT UNIQUE NOT NULL,
  stock_qty INTEGER DEFAULT 0,
  mrp NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  url TEXT NOT NULL,
  blur_data_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) UNIQUE,
  guide_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_title_trgm ON products USING GIN(title gin_trgm_ops);
CREATE INDEX idx_products_category ON products(category_id, status, created_at DESC);
CREATE INDEX idx_products_seller ON products(seller_id, status);
CREATE INDEX idx_products_brand ON products(brand_id, status);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories public read" ON categories FOR SELECT USING (active = TRUE);
CREATE POLICY "Brands public read" ON brands FOR SELECT USING (active = TRUE);
CREATE POLICY "Products public read" ON products FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "Variants public read" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "Images public read" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Sellers read own" ON sellers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Products seller manage own" ON products FOR ALL USING (
  seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
);
```

**Migration 004: Commerce Tables**
```sql
-- supabase/migrations/20250101000003_commerce.sql

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE shared_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  address_id UUID REFERENCES addresses(id) NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed','processing','shipped','out_for_delivery','delivered','cancelled','return_initiated','returned')),
  subtotal NUMERIC(10,2) NOT NULL,
  total_discount NUMERIC(10,2) DEFAULT 0,
  delivery_charge NUMERIC(10,2) DEFAULT 0,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  credits_used NUMERIC(10,2) DEFAULT 0,
  gift_card_used NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('upi','card','netbanking','emi','wallet','cod')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id) NOT NULL,
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  mrp NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed','processing','shipped','out_for_delivery','delivered','cancelled','return_initiated','returned')),
  tracking_number TEXT,
  courier TEXT,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  sub_reason TEXT,
  pickup_address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated','approved','pickup_scheduled','picked_up','received','refund_initiated','completed','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id, status);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_wishlist_user ON wishlists(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cart own rows" ON cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Wishlist own rows" ON wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Orders buyer own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Orders seller see own items" ON order_items FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "Returns own" ON returns FOR ALL USING (auth.uid() = user_id);
```

**Migration 005: Financials, Loyalty, Platform**
```sql
-- supabase/migrations/20250101000004_financials.sql

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat','percent','free_delivery','category','brand','first_order','bank')),
  value NUMERIC(10,2) NOT NULL,
  max_discount NUMERIC(10,2),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  applicable_category_id UUID REFERENCES categories(id),
  applicable_brand_id UUID REFERENCES brands(id),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  order_item_id UUID REFERENCES order_items(id) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  helpful_yes INTEGER DEFAULT 0,
  helpful_no INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_item_id)
);

CREATE TABLE review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  blur_data_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE review_votes (
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  helpful BOOLEAN NOT NULL,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE insider_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem','expire','bonus')),
  reference_id UUID,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url_desktop TEXT NOT NULL,
  image_url_mobile TEXT NOT NULL,
  target_url TEXT,
  position TEXT DEFAULT 'hero' CHECK (position IN ('hero','category','sidebar','deals')),
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deals_of_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  deal_price NUMERIC(10,2) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission NUMERIC(10,2) NOT NULL,
  tds NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  razorpay_payout_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Reviews buyer write own" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reviews buyer update within 7 days" ON reviews FOR UPDATE
  USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '7 days');
CREATE POLICY "Notifications own" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coupons public read active" ON coupons FOR SELECT USING (active = TRUE AND valid_until > NOW());
CREATE POLICY "Banners public read active" ON banners FOR SELECT USING (active = TRUE);

CREATE TRIGGER trg_reviews_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();
```

**Migration 006: Supabase RPCs**
```sql
-- supabase/migrations/20250101000005_rpcs.sql

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
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, brand_name TEXT,
  selling_price NUMERIC, mrp NUMERIC, discount_pct INTEGER,
  rating_avg NUMERIC, rating_count INTEGER,
  primary_image_url TEXT, blur_data_url TEXT,
  in_stock BOOLEAN, total_count BIGINT
) AS $$
  -- Implementation: join products → variants → images → brands → categories
  -- Filter by all params, sort by p_sort, paginate
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_address_id UUID,
  p_cart_item_ids UUID[],
  p_coupon_code TEXT DEFAULT NULL,
  p_credits_amount NUMERIC DEFAULT 0,
  p_razorpay_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (order_id UUID, total NUMERIC, error_code TEXT) AS $$
DECLARE
  v_order_id UUID;
BEGIN
  RETURN QUERY SELECT v_order_id, 0::NUMERIC, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Migration 007: pg_cron Jobs**
```sql
-- supabase/migrations/20250101000006_cron.sql

SELECT cron.schedule('expire-credits', '0 2 * * *', $$
  UPDATE credits_ledger SET expired = TRUE WHERE expires_at < NOW() AND expired = FALSE;
$$);

SELECT cron.schedule('price-drop-check', '0 9 * * *', $$
  SELECT net.http_post('https://{project-ref}.supabase.co/functions/v1/price-drop-check',
    '{}', '{"Authorization":"Bearer {SERVICE_ROLE_KEY}"}');
$$);
```

### 2.3 Generate TypeScript Types

```bash
supabase gen types typescript --local > packages/db/src/types.ts
```

---

## 3. SEED DATA (4 Sellers, 40+ Products)

### 3.1 Sellers

Seed 4 diverse seller profiles:
- Seller 1: Urban Fashion Co (Clothing)
- Seller 2: StyleStep Footwear (Shoes & Accessories)
- Seller 3: Ethnix Weavers (Ethnic Wear)
- Seller 4: FitLife Activewear (Sports & Activewear)

### 3.2 Products (Minimum 10 per seller)

Each product: at least 3 variants (size/color combinations), at least 4 images, realistic MRP and selling_price (20–60% discounts).

---

## 4. REACT DEVELOPMENT — TASK ORDER

> **Build in this exact order. Do not jump ahead.**

### PHASE A: Foundation (Week 1)
```
Task A1: Set up monorepo tooling (turbo.json, ESLint, TypeScript configs)
Task A2: Create packages/ui with design tokens (Tailwind config, CSS vars)
Task A3: Set up Supabase clients (browser + server in packages/db)
Task A4: Create shared layout (Header, Footer, mobile bottom nav) in packages/ui
Task A5: Set up TanStack Query provider + Zustand stores
Task A6: Implement auth (login modal, OTP flow, Google OAuth, session middleware)
```

### PHASE B: Buyer — Discovery (Week 2–3)
```
Task B1: Homepage (hero carousel, category links, trending sections)
Task B2: Category mega-menu + mobile drawer
Task B3: Product Listing Page (grid, filter sidebar, sort, URL sync)
Task B4: Product Detail Page (gallery, variants, delivery check, ATC)
Task B5: Search with autocomplete + voice
```

### PHASE C: Buyer — Transact (Week 4–5)
```
Task C1: Wishlist (toggle, page, share link)
Task C2: Cart (drawer, merge-on-login, summary)
Task C3: Checkout 3-step flow
Task C4: Razorpay payment integration
Task C5: Coupons + Credits + Gift Cards
Task C6: Order Confirmation + Order Tracking page
Task C7: Returns flow
```

### PHASE D: Buyer — Account (Week 6)
```
Task D1: Profile management + avatar upload
Task D2: Address book
Task D3: Reviews & Ratings
Task D4: Insider Loyalty Program UI
Task D5: Notifications page
```

### PHASE E: Seller Portal (Week 7–9)
```
Task E1: Seller auth + registration flow
Task E2: Seller dashboard (metrics, charts)
Task E3: Product creation wizard (5-step)
Task E4: Inventory management (variant grid)
Task E5: Order management table + dispatch flow
Task E6: Returns management
Task E7: Payments / Settlements page
Task E8: Seller analytics
```

### PHASE F: Quality & Launch (Week 10)
```
Task F1: SEO (generateMetadata, JSON-LD, sitemap, robots.txt)
Task F2: Accessibility audit (axe-core Playwright)
Task F3: Performance optimization (Lighthouse CI targets)
Task F4: E2E tests (critical buyer + seller paths)
Task F5: CI/CD pipeline setup (GitHub Actions)
Task F6: Production deploy (Vercel + Supabase prod migration)
```

---

## 5. COLOR PALETTE APPLICATION

```
PRIMARY (#FF3F6C):
  - All primary CTAs: "Add to Bag", "Proceed", "Apply"
  - Active nav items, selected filters, wishlist filled heart
  - Sale badge text color, discount percentage

SECONDARY (#282C3F):
  - Header background, primary text, footer background

HIGHLIGHT (#FF905A):
  - "Deal of the Day" section bg, countdown timer numbers

SUPPORT (#F5F5F6):
  - Page background, skeleton loading color
```

---

## 6. SEO CONFIGURATION

```typescript
// apps/web/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://www.yourdomain.com'),
  title: { default: 'BrandName — Fashion Online', template: '%s | BrandName' },
  description: 'Shop the latest fashion for men, women, and kids.',
  openGraph: { type: 'website', locale: 'en_IN', siteName: 'BrandName' },
  robots: { index: true, follow: true },
};

// JSON-LD for PDP
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.title,
  image: product.images.map(i => i.url),
  offers: {
    '@type': 'Offer',
    price: product.lowestVariantPrice,
    priceCurrency: 'INR',
    availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: product.rating_avg,
    reviewCount: product.rating_count,
  },
};
```

---

## 7. RESPONSIVENESS REQUIREMENTS

```
Breakpoints (Tailwind):
  base: 375px — Primary mobile target
  sm:   640px
  md:   768px — Tablets
  lg:   1024px
  xl:   1280px — Desktop
  2xl:  1536px

Mobile patterns: bottom nav (fixed, 64px), filter as bottom sheet, cart as full page, swipe carousel
Desktop patterns: mega-menu, cart as right drawer (400px), sticky filter sidebar (240px), 4-column grid
Touch targets: min 44×44px on all interactive elements
```

---

## 8. ADDITIONAL TECHNICAL NOTES

### Razorpay Integration
```typescript
// POST /api/checkout/create-order:
// 1. Validate cart server-side (stock check)
// 2. Calculate total
// 3. Call Razorpay Orders API (server-side with secret key)
// 4. Return { razorpay_order_id, amount, currency }

// Client: dynamically import Razorpay SDK → open checkout modal
// On success → POST /api/checkout/verify → call create_order RPC → redirect to /orders/{id}/confirmation
```

### Supabase Auth Middleware
```typescript
// apps/web/middleware.ts — protected routes: /account/*, /checkout/*, /wishlist/*
// Seller routes: /seller/* (check sellers.status = 'approved')
// Redirect unauthenticated to /login?next={current_path}
```

### Vercel Configuration
```json
// vercel.json (apps/web)
{
  "framework": "nextjs",
  "regions": ["bom1"],
  "headers": [...]
}
```

*Version 1.0 | React 19 · Next.js 15 · TypeScript 5 · Supabase · Razorpay · Vercel*
