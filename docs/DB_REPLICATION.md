# Database Replication Guide

Complete guide to replicate Aura Marketplace database schema and data to a new Supabase project.

---

## Overview

Replication involves 3 phases:

1. **Schema** — Tables, columns, relationships, functions, policies
2. **Core Data** — Brands, categories, coupons, banners (static)
3. **Dynamic Data** — Sellers, products, variants, images (seeded)

---

## Prerequisites

- Supabase account (source + target projects)
- Supabase CLI: `npm install -g supabase`
- pnpm installed
- `.env.local` with source Supabase credentials

---

## Renaming Supabase Project (aura 2.0 → Aura)

### In Supabase Dashboard

1. Go to https://app.supabase.com
2. Select project (currently "aura 2.0")
3. **Settings** → **General** → **Project Name**
4. Change to: `Aura`
5. Save

✅ Project renamed (no data loss)

---

## Phase 1: Export Schema

### Option A: Automatic (Recommended)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
supabase link --project-ref=your-project-ref

# 4. Pull schema
supabase db pull

# Output: Creates supabase/migrations/ with all tables
```

**Project Reference:** Found in Supabase URL
- URL: `https://abc123xyz.supabase.co`
- Project Ref: `abc123xyz`

### Option B: Manual Export

If CLI doesn't work:

1. **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
-- Export all table definitions
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

3. **Copy result** → **Save to** `supabase/migrations/NNNN_schema.sql`

---

## Phase 2: Create Target Project

### Setup Target Supabase

1. **Supabase Dashboard** → **+ New Project**
2. Project name: `Aura-Staging` (or similar)
3. Region: Same as source (for consistency)
4. Password: Generate strong password
5. **Create Project** (wait 2-3 minutes)

### Get Target Credentials

Once created:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

3. Update `.env.target.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://target-abc123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Phase 3: Apply Migrations

### In Target Supabase

1. **SQL Editor** → **New Query**
2. Open each migration file in order:

```
supabase/migrations/
  ├── 00_init_extensions.sql
  ├── 01_auth_profiles.sql
  ├── 02_categories_brands.sql
  ├── 03_products_variants.sql
  ├── 04_images_banners.sql
  ├── 05_orders_payments.sql
  ├── 06_sellers_settlements.sql
  ├── 07_reviews_ratings.sql
  ├── 08_rpc_functions.sql
  └── 09_realtime_policies.sql
```

3. **Copy contents** of each file
4. **Paste in SQL Editor**
5. **Run** (watch for errors)
6. Repeat for next file

**⚠️ Important:** Run migrations **in order** (00 → 09)

---

## Phase 4: Replicate Static Data

### Generate Replication Script

```bash
# Extract brands, categories, coupons, banners from source
node scripts/replicate-db.mjs

# Output: supabase/migrations/NNNN_replicate-data.sql
```

### Apply to Target

1. **SQL Editor** → **New Query**
2. Open: `supabase/migrations/NNNN_replicate-data.sql`
3. **Copy entire contents**
4. **Paste in SQL Editor**
5. **Run**

**Expected Output:**
```
INSERT INTO brands (id, name, slug, ...) VALUES (...);
INSERT INTO brands (id, name, slug, ...) VALUES (...);
... (20 brands total)

INSERT INTO categories (id, name, slug, ...) VALUES (...);
... (10 categories total)

INSERT INTO coupons (code, type, value, ...) VALUES (...);
... (20 coupons total)

INSERT INTO banners (image_url_desktop, ...) VALUES (...);
... (10 banners total)
```

---

## Phase 5: Seed Dynamic Data

### Create Sellers, Products, Variants, Images

```bash
# Set target Supabase URL
export NEXT_PUBLIC_SUPABASE_URL=https://target-abc123.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Seed sellers (4), products (40), variants (120), images (160)
node scripts/seed.mjs

# Expected output:
# Connected to Supabase ✓
# Seeding categories… ✓ 10 categories
# Seeding brands… ✓ 20 brands
# Seeding auth users + seller profiles… ✓ 4 auth users + profiles
# Seeding sellers… ✓ 4 sellers
# Seeding products… ✓ 40 products
# Seeding variants… ✓ 120 variants
# Seeding product images… ✓ 160 images
# Seeding banners… ✓ 2 banners
# ✓ Seed complete!
```

---

## Phase 6: Verify Replication

### Check Table Counts

**Via SQL Editor:**

```sql
SELECT 'brands' as table_name, COUNT(*) as row_count FROM brands
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL SELECT 'sellers', COUNT(*) FROM sellers
UNION ALL SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL SELECT 'banners', COUNT(*) FROM banners;
```

**Expected Results:**
| table_name | row_count |
|------------|-----------|
| brands | 20 |
| categories | 10 |
| products | 40 |
| product_variants | 120 |
| product_images | 160 |
| sellers | 4 |
| coupons | 20 |
| banners | 10 |

### Test App Connection

```bash
# Update .env.local with target credentials
NEXT_PUBLIC_SUPABASE_URL=https://target-abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Run app
pnpm dev:web

# Test:
# 1. Visit http://localhost:3000
# 2. Should see 40 products on homepage
# 3. Click category → should see filtered products
# 4. Click product → should see images, reviews, variants
```

---

## Complete Replication Checklist

### Before Starting
- [ ] Source Supabase credentials in .env.local
- [ ] Target Supabase project created
- [ ] Supabase CLI installed (`supabase --version`)

### Schema Export
- [ ] Run `supabase db pull` (or export manually)
- [ ] Verify `supabase/migrations/` contains schema files
- [ ] Check migrations are numbered (00_, 01_, etc.)

### Target Setup
- [ ] Target Supabase project created
- [ ] Target credentials saved in .env.local (or .env.target.local)

### Migrations
- [ ] Applied migration 00_init_extensions.sql
- [ ] Applied migration 01_auth_profiles.sql
- [ ] Applied migration 02_categories_brands.sql
- [ ] Applied migration 03_products_variants.sql
- [ ] Applied migration 04_images_banners.sql
- [ ] Applied migration 05_orders_payments.sql
- [ ] Applied migration 06_sellers_settlements.sql
- [ ] Applied migration 07_reviews_ratings.sql
- [ ] Applied migration 08_rpc_functions.sql
- [ ] Applied migration 09_realtime_policies.sql

### Data Replication
- [ ] Ran `node scripts/replicate-db.mjs`
- [ ] Applied replicate-data.sql (brands, categories, coupons, banners)
- [ ] Ran `node scripts/seed.mjs` (sellers, products, variants, images)

### Verification
- [ ] Checked table row counts (SQL Editor)
- [ ] Ran `pnpm dev:web` locally
- [ ] Tested product browsing (homepage → category → product)
- [ ] Tested seller portal (login with seeded credentials)

### Optional
- [ ] Renamed Supabase project to "Aura"
- [ ] Set up custom domain (if needed)
- [ ] Enabled 2FA on Supabase account

---

## Troubleshooting

### "Project reference invalid"

**Cause:** Wrong project ref format

**Fix:**
```bash
# Correct format: just the subdomain
# URL: https://abc123xyz.supabase.co
# Ref: abc123xyz (NOT the full URL)

supabase link --project-ref=abc123xyz
```

### "Cannot find module '@supabase/supabase-js'"

**Cause:** Dependencies not installed

**Fix:**
```bash
pnpm install
```

### "Service role key invalid"

**Cause:** Using wrong key

**Fix:**
```bash
# Make sure:
# - Key starts with: eyJhbGc...
# - It's the SERVICE_ROLE_KEY (not ANON_KEY)
# - Not expired (check in Supabase dashboard)

echo $SUPABASE_SERVICE_ROLE_KEY
# Should output: eyJhbGc...
```

### "Table doesn't exist" during seed

**Cause:** Migrations not applied or failed

**Fix:**
```bash
# 1. Check Supabase SQL Editor for errors
# 2. Re-apply failed migration
# 3. Verify all 10 migrations ran
# 4. Try seed again
```

### "Permissions denied" error

**Cause:** RLS policies blocking inserts

**Fix:**
```sql
-- Temporarily disable RLS (use SERVICE_ROLE_KEY):
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sellers DISABLE ROW LEVEL SECURITY;

-- After seed, re-enable:
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
```

### "Duplicate key value" error

**Cause:** Data already exists in target

**Fix:**
```sql
-- Option 1: Use ON CONFLICT in replicate-data.sql
-- Option 2: Clear table and re-seed
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM banners;

-- Then re-run replicate-data.sql and seed.mjs
```

---

## Automated Replication Script (Optional)

For faster replication, create `.scripts/full-replicate.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Aura Marketplace — Full Database Replication"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Export schema...${NC}"
supabase db pull

echo -e "${BLUE}2. Generate replication script...${NC}"
node scripts/replicate-db.mjs

echo -e "${BLUE}3. Instructions:${NC}"
echo "   a) Create target Supabase project"
echo "   b) Apply migrations (00_init → 09_realtime)"
echo "   c) Run: node scripts/replicate-db.mjs"
echo "   d) Run replicate-data.sql in target SQL Editor"
echo "   e) Run: node scripts/seed.mjs"
echo ""
echo -e "${GREEN}✅ Replication ready!${NC}"
```

Run:
```bash
chmod +x scripts/full-replicate.sh
./scripts/full-replicate.sh
```

---

## Next Steps

After successful replication:

1. **Test Apps Locally**
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Deploy to Staging**
   - Push to staging branch
   - Deploy to Vercel with target Supabase URL

3. **Production Replication**
   - Repeat process for production Supabase
   - Use production-grade backups
   - Test thoroughly before switching traffic

---

**Questions?** Check:
- `.env.local` for correct credentials
- Supabase dashboard for project status
- Migration files in `supabase/migrations/`
- Seed script output for errors

---

**Timeline:**
- Schema export: 5 min
- Migrations: 10 min
- Data replication: 5 min
- Verification: 5 min
- **Total: ~25 minutes**
