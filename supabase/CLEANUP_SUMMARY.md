# Database Cleanup Summary (2026-01-13)

## What Was Cleaned Up

### ✅ Deleted Files (14 total)
These seed files were redundant and replaced by a centralized seeding approach.

#### Standalone Seed Files (13)
```
supabase/seed_banners.sql              → Replaced by scripts/seed.mjs
supabase/seed_product_images.sql       → Replaced by scripts/seed.mjs
supabase/seed_products_men.sql         → Replaced by scripts/seed.mjs
supabase/seed_products_women.sql       → Replaced by scripts/seed.mjs
supabase/seed_products_footwear_sports.sql  → Replaced by scripts/seed.mjs
supabase/seed_kids_home_studio.sql     → Replaced by scripts/seed.mjs
supabase/seed_products_footwear_ext.sql    → Replaced by scripts/seed.mjs
supabase/seed_products_sports_ext.sql  → Replaced by scripts/seed.mjs
supabase/seed_products_ethnic.sql      → Replaced by scripts/seed.mjs
supabase/seed_products_kids_ext.sql    → Replaced by scripts/seed.mjs
supabase/seed_ratings.sql              → Replaced by scripts/seed.mjs
supabase/seed_master.sql               → Replaced by scripts/seed.mjs
```

#### Seed Runner Script
```
supabase/run_seeds.js                  → Had hardcoded credentials (SECURITY ISSUE)
```

### 🔒 Security Issue Fixed
**File:** `scripts/seed.mjs`

**Problem:** Had hardcoded database credentials in plain text:
```javascript
// ❌ BEFORE (INSECURE)
const DATABASE_URL = "";
```

**Fixed:** Now uses environment variables:
```javascript
// ✅ AFTER (SECURE)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("Set it with: export DATABASE_URL='postgresql://...'");
  process.exit(1);
}
```

**Action Required:** When running `scripts/seed.mjs`, set the environment variable:
```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT.supabase.co:5432/postgres"
node scripts/seed.mjs
```

---

## What Was Kept

### ✅ All Migration Files (19 total)
**Location:** `supabase/migrations/`

These define the complete database schema and are **immutable** once deployed.

```
Core Migrations (Required):
  20250101000000_extensions.sql          (PostgreSQL extensions)
  20250101000001_auth_profiles.sql       (User authentication & profiles)
  20250101000002_catalog.sql             (Products, categories, brands)
  20250101000003_commerce.sql            (Orders, cart, fulfillment)
  20250101000004_financials.sql          (Settlements, coupons, loyalty)
  20250101000005_rpcs.sql                (Database functions)

Enhancement Migrations:
  20250516000000_reviews_nullable.sql    (Reviews improvements)
  20250516000001_avatars_bucket.sql      (User avatar storage)
  20250516000002_enhanced_catalog.sql    (Additional product fields)
  20250516000003_seller_enhancements.sql (Seller optimizations)
  20250516000004_seller_brands.sql       (Brand-seller relationships)
  20250517000001_fix_reviews_trigger.sql (Fix rating calculations)
  20250517000002_review_photos_and_constraints.sql (Photo management)
  20250517000003_order_items_rls.sql     (Security policies)
  20250517000004_seed_sellers.sql        (Test seller data)
  20250517000005_settlements_enhancements.sql (Finance improvements)
  20250518000001_products_compliance_cols.sql (GST/HSN fields)
  20250518000002_fix_brands_public_read.sql (Access control)
  20250518000003_fix_rating_trigger_security.sql (Security fixes)
```

---

## New Documentation Files

To help understand the database architecture, three new guides were created:

### 1. **MIGRATIONS_GUIDE.md**
- Complete migration order and dependencies
- What each migration creates and why
- How to run migrations locally or in production
- Troubleshooting common issues
- Seeding data guide

### 2. **SCHEMA_OVERVIEW.md**
- All 23 tables with full field definitions
- Table relationships and dependencies
- Indexes and performance optimization
- Row-Level Security (RLS) policies
- Storage bucket structure
- Triggers and automatic database features

### 3. **CLEANUP_SUMMARY.md** (this file)
- What was deleted and why
- Security issues fixed
- What was kept and where

---

## Database Architecture At A Glance

```
23 Tables
├─ Authentication & Users (5 tables)
│  └ profiles, addresses, user_flags, login_attempts, insider_tiers
├─ Sellers & Catalog (9 tables)
│  └ sellers, categories, brands, seller_brands, products, product_variants, product_images
├─ Shopping & Orders (9 tables)
│  └ carts, orders, order_items, order_events, shipments, order_reviews, review_photos
└─ Financial & Marketing (4 tables)
   └ order_settlements, seller_settlements, seller_ledger, coupons, coupon_usage, loyalty_*, banners

40+ Indexes
├─ Performance: Product search, orders, reviews, carts
├─ Full-text: Product title/description, seller store name
└─ Foreign keys: All relationships optimized

3 Storage Buckets
├─ product-images/ (product photos + thumbnails)
├─ review-photos/ (buyer review images)
└─ avatars/ (user profile pictures)

20+ RLS Policies
└─ Secure: profiles, orders, reviews, addresses, seller_ledger, settlements
```

---

## Migration Execution Order

When deploying:
1. ✅ Extensions & utilities (000)
2. ✅ Authentication (001)
3. ✅ Catalog (002)
4. ✅ Commerce (003)
5. ✅ Financials (004)
6. ✅ Database functions (005)
7. ✅ All enhancements in chronological order (516-518)

Supabase automatically handles this with `supabase migration up`.

---

## How to Use Post-Cleanup

### Apply Migrations
```bash
# Using Supabase CLI (recommended)
supabase migration up

# Or push to cloud
supabase db push --linked
```

### Seed Test Data
```bash
# Set database connection (replace with your Supabase credentials)
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.your-project.supabase.co:5432/postgres"

# Run the unified seed script
node scripts/seed.mjs
```

This creates:
- ✓ 6 product categories with subcategories
- ✓ 12 brands
- ✓ 4 test sellers with user profiles
- ✓ 40 test products with 3 variants each
- ✓ 120 product variants (sizes, colors, SKUs)
- ✓ 160 product images (placeholder)
- ✓ 2 marketing banners

### Query the Database
All database functions (RPCs) are available via Supabase SQL Editor or API:
```sql
SELECT * FROM get_products_filtered(
  p_category_slug => 'men-shirts',
  p_brand_ids => ARRAY['00000000-0002-0001-0000-000000000000'],
  p_min_price => 500,
  p_max_price => 5000
);
```

---

## Best Practices Going Forward

### When Adding Features
1. Create a new migration: `supabase/migrations/YYYYMMDD000NNN_feature.sql`
2. Test locally: `supabase migration up`
3. Push to production: `supabase db push --linked`
4. **Never delete old migrations** — they're immutable history

### Code Changes
- **Migrations are code** — commit them to git
- **Seed data is optional** — can be added at any time via `scripts/seed.mjs`
- **Update documentation** when schema changes

### Environment Variables
- **Never commit credentials** to git
- Use `.env.local` (gitignored) for local development
- Use GitHub Secrets or environment variables in CI/CD
- Rotate credentials every quarter

---

## File Structure After Cleanup

```
supabase/
├── migrations/               (19 SQL files — DO NOT DELETE)
│   ├── 20250101000000_extensions.sql
│   ├── 20250101000001_auth_profiles.sql
│   ├── ...
│   └── 20250518000003_fix_rating_trigger_security.sql
├── MIGRATIONS_GUIDE.md       (📚 NEW — Complete guide)
├── SCHEMA_OVERVIEW.md        (📚 NEW — Table definitions)
├── CLEANUP_SUMMARY.md        (📚 NEW — This file)
└── config.toml              (Existing Supabase config)

scripts/
└── seed.mjs                 (✅ UPDATED — Now uses env vars)
```

---

## Verification

Run this to verify migrations are clean:
```bash
ls -la supabase/migrations/  # Should show 19 .sql files
cat supabase/migrations/     # Verify they're all timestamped

# Verify seed files are gone
ls supabase/seed_*.sql      # Should return "file not found"
ls supabase/run_seeds.js    # Should return "file not found"
```

---

## Questions?

Refer to the new documentation:
- **MIGRATIONS_GUIDE.md** — "How do I run/test migrations?"
- **SCHEMA_OVERVIEW.md** — "What tables exist and what do they do?"
- **CLAUDE.md** — Project setup and architecture overview

---

**Cleanup Date:** 2026-01-13  
**Total Files Deleted:** 14  
**Security Issues Fixed:** 1  
**Documentation Added:** 3 new guides  
**Status:** ✅ Complete
