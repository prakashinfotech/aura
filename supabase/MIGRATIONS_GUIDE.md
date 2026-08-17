# Supabase Database Migrations Guide

This document outlines the complete database architecture for the Aura Marketplace and the order in which migrations must be applied.

## Quick Start

```bash
# Apply all migrations in order (Supabase CLI handles this)
supabase migration up

# Or push migrations to local Supabase instance
supabase db push

# Seed data (REQUIRES DATABASE_URL env var)
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"
node scripts/seed.mjs
```

---

## Migration Order & Dependencies

### Core Setup (Required First)
These migrations must run first as they define base functionality used by all other tables.

#### 1. **20250101000000_extensions.sql** ⭐
- **Purpose:** PostgreSQL extensions and utility functions
- **Creates:**
  - `pg_trgm` extension (full-text search)
  - `unaccent` extension (accent-insensitive search)
  - `update_updated_at_column()` trigger function
- **Dependencies:** None
- **Required by:** All subsequent migrations that use triggers

---

### Authentication & User Layer (Required Second)
These migrations establish user profiles and authentication infrastructure.

#### 2. **20250101000001_auth_profiles.sql** ⭐
- **Purpose:** User profiles and authentication metadata
- **Creates:**
  - `profiles` — buyer & seller user data
  - `addresses` — delivery & billing addresses
  - `login_attempts` — security tracking
  - `user_flags` — fraud/compliance flags
- **Dependencies:** `auth.users` (Supabase Auth)
- **Required by:** sellers, orders, reviews

---

### Catalog & Master Data (Required Third)
These migrations define the product catalog structure.

#### 3. **20250101000002_catalog.sql** ⭐
- **Purpose:** Product catalog, brands, sellers
- **Creates:**
  - `categories` — product categories with hierarchies
  - `brands` — brand metadata
  - `sellers` — seller accounts & ratings
  - `products` — product listing core
  - `product_variants` — SKU-level product details
  - `product_images` — product photography
  - `seller_brands` — which brands each seller stocks
- **Dependencies:** profiles (sellers.user_id FK)
- **Required by:** commerce tables, reviews

---

### Commerce & Transactions (Required Fourth)
These migrations handle orders, payments, and fulfillment.

#### 4. **20250101000003_commerce.sql** ⭐
- **Purpose:** Orders, carts, inventory, fulfillment
- **Creates:**
  - `carts` — shopping cart items
  - `orders` — order header & metadata
  - `order_items` — line items per order
  - `order_events` — order status history
  - `order_reviews` — buyer reviews & ratings
  - `review_photos` — review images
  - `shipments` — tracking & fulfillment
- **Dependencies:** products, sellers, profiles
- **Required by:** financials, settlements

---

### Financial & Payouts (Required Fifth)
These migrations handle seller payouts and financial tracking.

#### 5. **20250101000004_financials.sql** ⭐
- **Purpose:** Seller settlements, ledgers, payouts
- **Creates:**
  - `order_settlements` — order-to-settlement mapping
  - `seller_settlements` — batch payout records
  - `seller_ledger` — debit/credit transaction log
  - `coupons` — discount codes
  - `coupon_usage` — redemption tracking
  - `banners` — homepage marketing banners
  - `loyalty_programs` — insider points, tiers
  - `loyalty_redemptions` — points redemption
- **Dependencies:** orders, sellers, profiles
- **Required by:** RPCs (calculation logic)

---

### Database Functions (Required Sixth)
These migrations define stored procedures for filtering, calculations, and business logic.

#### 6. **20250101000005_rpcs.sql** ⭐
- **Purpose:** PostgreSQL functions for complex queries
- **Creates:**
  - `get_products_filtered()` — advanced product search with filters
  - `get_seller_orders()` — seller order dashboard
  - `get_order_fulfillment()` — fulfillment tracking
  - `calculate_settlement()` — payout calculations
  - `apply_coupon()` — discount application
  - And more...
- **Dependencies:** All catalog & commerce tables
- **Required by:** All application API routes

---

## Enhancements & Fixes (Run After Core)
These migrations add features, fix bugs, and optimize the schema. Applied automatically after the 6 core migrations.

### Reviews & Content
- **20250516000000_reviews_nullable.sql** — Make review descriptions nullable
- **20250517000002_review_photos_and_constraints.sql** — Review photo constraints

### Media & Storage
- **20250516000001_avatars_bucket.sql** — Create Supabase Storage bucket for user avatars

### Seller Features
- **20250516000003_seller_enhancements.sql** — Seller dashboard optimizations
- **20250516000004_seller_brands.sql** — Brand-seller relationship table
- **20250517000004_seed_sellers.sql** — Default test seller accounts

### Catalog Improvements
- **20250516000002_enhanced_catalog.sql** — Add product compliance columns (HSN, GST, etc.)
- **20250518000001_products_compliance_cols.sql** — Additional compliance fields

### Security & Triggers
- **20250517000001_fix_reviews_trigger.sql** — Fix review rating aggregation trigger
- **20250517000003_order_items_rls.sql** — Order items Row-Level Security policies
- **20250518000002_fix_brands_public_read.sql** — Allow public brand reads (needed for product listing)
- **20250518000003_fix_rating_trigger_security.sql** — Secure rating trigger logic

---

## Database Architecture Overview

### Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION & USERS                                      │
├─────────────────────────────────────────────────────────────┤
│ auth.users ◄──┐
│ profiles ◄──┬─┘
│ addresses ◄─┘
│ user_flags
│ login_attempts
└─────────────────────────────────────────────────────────────┘
        ▲
        │
┌─────────────────────────────────────────────────────────────┐
│ SELLERS                                                     │
├─────────────────────────────────────────────────────────────┤
│ sellers (user_id → profiles)
│ seller_brands (seller_id, brand_id)
│ seller_ledger
│ seller_settlements
└─────────────────────────────────────────────────────────────┘
        ▲
        │
┌─────────────────────────────────────────────────────────────┐
│ CATALOG                                                     │
├─────────────────────────────────────────────────────────────┤
│ categories (hierarchical: parent_id)
│ brands
│ products (seller_id, brand_id, category_id)
│ product_variants (product_id)
│ product_images (product_id)
└─────────────────────────────────────────────────────────────┘
        ▲
        │
┌─────────────────────────────────────────────────────────────┐
│ COMMERCE                                                    │
├─────────────────────────────────────────────────────────────┤
│ carts (user_id, product_variant_id)
│ orders (user_id, seller_id)
│ order_items (order_id, product_variant_id)
│ order_events (order_id)
│ order_reviews (order_id, user_id)
│ review_photos (order_review_id)
│ shipments (order_id)
│ order_settlements
└─────────────────────────────────────────────────────────────┘
        ▲
        │
┌─────────────────────────────────────────────────────────────┐
│ PROMOTIONS & LOYALTY                                        │
├─────────────────────────────────────────────────────────────┤
│ coupons
│ coupon_usage (order_id, coupon_id)
│ loyalty_programs
│ loyalty_redemptions (user_id)
│ banners
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Tables by Responsibility

### Authentication & Identity
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User identity (buyer/seller) | id, name, email, phone, avatar_url |
| `addresses` | Shipping/billing addresses | user_id, type (home/work/other), is_default |
| `user_flags` | Fraud detection, compliance | user_id, flag_type, reason |

### Catalog & Products
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `categories` | Product taxonomy | id, slug, parent_id (for subcats), display_order |
| `brands` | Brand registry | id, slug, logo_url |
| `products` | Product listings | id, slug, seller_id, brand_id, category_id, status |
| `product_variants` | SKU-level details | product_id, size, color, sku, stock_qty, mrp, selling_price |
| `product_images` | Product photography | product_id, url, is_primary, sort_order |

### Sellers & Partnerships
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `sellers` | Seller accounts | user_id, store_name, status, commission_rate, rating |
| `seller_brands` | Brand-seller mappings | seller_id, brand_id |
| `seller_ledger` | Financial transactions | seller_id, transaction_type, amount, order_id |
| `seller_settlements` | Batch payouts | seller_id, period_start, period_end, amount, status |

### Orders & Fulfillment
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `orders` | Order header | user_id, seller_id, status, total, discount, tax |
| `order_items` | Line items | order_id, product_variant_id, quantity, price |
| `order_events` | Status timeline | order_id, event_type (created/confirmed/shipped/delivered), ts |
| `shipments` | Fulfillment tracking | order_id, tracking_id, carrier, status |
| `order_reviews` | Buyer reviews | order_id, user_id, rating, text |
| `order_settlements` | Settlement mapping | order_id, seller_settlement_id |

### Promotions & Loyalty
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `coupons` | Discount codes | id, code, discount_type, discount_value, usage_limit |
| `coupon_usage` | Redemption tracking | coupon_id, user_id, order_id |
| `loyalty_programs` | Insider tiers | user_id, tier (silver/gold/platinum), points |
| `banners` | Marketing hero banners | image_url_desktop, image_url_mobile, target_url, position |

---

## Running Migrations

### Using Supabase CLI (Recommended)

```bash
# List pending migrations
supabase migration list

# Apply all pending migrations
supabase migration up

# Migrate to production (after git push)
supabase db push --linked
```

### Manual PostgreSQL (Direct Access)

```bash
# Connect to Supabase PostgreSQL
psql "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# Apply all migrations in order
\i supabase/migrations/20250101000000_extensions.sql
\i supabase/migrations/20250101000001_auth_profiles.sql
\i supabase/migrations/20250101000002_catalog.sql
\i supabase/migrations/20250101000003_commerce.sql
\i supabase/migrations/20250101000004_financials.sql
\i supabase/migrations/20250101000005_rpcs.sql
```

---

## Seeding Data

After all migrations are applied, seed test data:

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT.supabase.co:5432/postgres"

# Run the seed script
node scripts/seed.mjs
```

**What it seeds:**
- ✓ 6 product categories (Men, Women, Kids, Beauty, Home, Studio)
- ✓ 12 brands (Nike, Adidas, Zara, etc.)
- ✓ 4 test seller accounts with real user profiles
- ✓ 40 test products (10 per seller) with variants and images
- ✓ Product variants (3 sizes/colors per product = 120 variants)
- ✓ Product images (4 per product = 160 placeholder images)
- ✓ 2 marketing banners

---

## Important Notes

### Security
- **Never commit `DATABASE_URL` to git** — use `.env.local` or environment variables
- **Migrations are versioned and immutable** — once pushed to production, don't delete or reorder them
- **Always test migrations locally first** — then push to development, staging, and finally production
- **Row-Level Security (RLS)** is configured on sensitive tables (orders, reviews) — verify before modifying

### Database Size
- With seed data: ~50MB
- Production (100k products, 10M orders): ~500GB+
- Use appropriate indexes for performance

### Backup Strategy
- Supabase auto-backs up daily
- Download backups via Supabase Dashboard > Backups
- Test restore procedures quarterly

### Customization
To add new features:
1. Create a new migration file: `supabase/migrations/YYYYMMDD000NNN_feature.sql`
2. Apply with `supabase db push`
3. Update this guide with the new table documentation

---

## Troubleshooting

### Migration Conflicts
If migrations fail on push:
```bash
# Check migration history
supabase migration list

# Reset local migrations (DESTRUCTIVE)
supabase db reset
```

### Permission Denied Errors
Ensure your Supabase user has superuser privileges:
```sql
ALTER USER postgres SUPERUSER;
```

### Foreign Key Constraint Violations
Check that migrations are applied in order. Dependencies are:
- Extensions (000) → Auth (001) → Catalog (002) → Commerce (003) → Financials (004) → RPCs (005)

---

## Migration Status

| Migration | Status | Type | Description |
|-----------|--------|------|-------------|
| 20250101000000 | ✅ Core | Setup | Extensions & utilities |
| 20250101000001 | ✅ Core | Auth | Profiles & authentication |
| 20250101000002 | ✅ Core | Catalog | Products, categories, brands |
| 20250101000003 | ✅ Core | Commerce | Orders, fulfillment, reviews |
| 20250101000004 | ✅ Core | Finance | Settlements, coupons, loyalty |
| 20250101000005 | ✅ Core | RPC | Database functions & procedures |
| 20250516000000 | ✅ Enhancement | Reviews | Nullable descriptions |
| 20250516000001 | ✅ Enhancement | Media | Avatar storage |
| 20250516000002 | ✅ Enhancement | Catalog | Enhanced product fields |
| 20250516000003 | ✅ Enhancement | Sellers | Seller optimizations |
| 20250516000004 | ✅ Enhancement | Sellers | Brand relationships |
| 20250517000001 | ✅ Enhancement | Triggers | Review aggregation fix |
| 20250517000002 | ✅ Enhancement | Reviews | Photo constraints |
| 20250517000003 | ✅ Enhancement | Security | Order items RLS |
| 20250517000004 | ✅ Enhancement | Data | Test sellers |
| 20250517000005 | ✅ Enhancement | Finance | Settlement improvements |
| 20250518000001 | ✅ Enhancement | Catalog | Compliance fields (HSN, GST) |
| 20250518000002 | ✅ Enhancement | Security | Brand read access |
| 20250518000003 | ✅ Enhancement | Security | Rating trigger security |

---

**Last updated:** 2026-01-13  
**Next review:** When adding new features or schema changes
