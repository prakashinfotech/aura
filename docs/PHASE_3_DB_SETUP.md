# Phase 3: Database Setup & Replication

Complete guide for setting up and replicating the Aura Marketplace database.

---

## 🎯 Phase 3 Objectives

- ✅ Connect to existing Supabase project (currently "aura 2.0")
- ✅ Rename project to "Aura"
- ✅ Extract current database schema
- ✅ Create replication scripts for new instances
- ✅ Document seed data strategy

---

## 📊 Database Architecture

### Tables by Category

**Authentication & Users**
- `auth.users` (Supabase Auth)
- `profiles` (extended user data)
- `addresses` (delivery addresses)

**Catalog**
- `brands` (fashion brands, 20 rows)
- `categories` (product categories, 10 rows)
- `products` (product master, 40 rows)
- `product_variants` (sizes/colors, 120 rows)
- `product_images` (product photos, 160 rows)

**Commerce**
- `orders` (customer orders)
- `order_items` (line items)
- `coupons` (discount codes, 20 rows)

**Seller Portal**
- `sellers` (seller stores, 4 rows)
- `product_variants` → (seller fulfillment)

**Content**
- `reviews` (product reviews)
- `banners` (hero & category banners, 10 rows)

---

## 🔄 Replication Strategy

### Data Layers

**Layer 1: Schema** (Static)
- 10 migration files in `supabase/migrations/`
- Tables, columns, types, functions, policies
- RLS rules for security
- Stored procedures (RPCs)

**Layer 2: Static Data** (Fast)
- Brands (20 rows)
- Categories (10 rows)
- Coupons (20 rows)
- Banners (10 rows)
- ✅ Replication script: `scripts/replicate-db.mjs`

**Layer 3: Dynamic Data** (Generated)
- Sellers (4, with auth users)
- Products (40)
- Variants (120)
- Images (160, picsum URLs)
- ✅ Seed script: `scripts/seed.mjs`

---

## 📋 Step-by-Step Setup

### Step 1: Rename Current Project

**In Supabase Dashboard:**

1. Go to https://app.supabase.com
2. Select "aura 2.0" project
3. **Settings** → **General** → **Project Name**
4. Change to: `Aura`
5. **Save**

✅ Project renamed (no data loss)

### Step 2: Export Current Schema

**Option A: Via Supabase CLI (Recommended)**

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Get project reference from URL
# https://abc123xyz.supabase.co → abc123xyz

# Link project
supabase link --project-ref=abc123xyz

# Pull schema
supabase db pull

# Result: supabase/migrations/ populated with schema files
```

**Option B: Manual (if CLI doesn't work)**

- Supabase Dashboard → **SQL Editor**
- Create query to export schema (provided in DB_REPLICATION.md)
- Save output to `supabase/migrations/`

### Step 3: Generate Replication Scripts

```bash
# Extract static data (brands, categories, coupons, banners)
node scripts/replicate-db.mjs

# Creates: supabase/migrations/NNNN_replicate-data.sql
# Also creates: docs/DB_REPLICATION.md (detailed guide)
```

### Step 4: Test Replication on New Project

```bash
# Create new Supabase project (Aura-Staging)
# Copy URL and service role key

# Update .env.local with new credentials
export NEXT_PUBLIC_SUPABASE_URL=https://target-abc123.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Apply migrations (via Supabase SQL Editor):
# - Copy contents of each file: supabase/migrations/00_ → 09_
# - Paste in SQL Editor
# - Run (watch for errors)

# Replicate static data:
# - Paste contents: supabase/migrations/NNNN_replicate-data.sql
# - Run in SQL Editor

# Seed dynamic data:
node scripts/seed.mjs

# Verify:
pnpm dev:web
# Visit http://localhost:3000 → should see 40 products
```

---

## 🛠️ Scripts Reference

### `scripts/export-schema.mjs`
**Purpose:** Export current Supabase schema

**Usage:**
```bash
node scripts/export-schema.mjs
```

**What it does:**
- Connects to Supabase using credentials
- Exports all tables, functions, policies
- Generates migration file

**Output:** `supabase/migrations/NNNN_schema-snapshot.sql`

### `scripts/replicate-db.mjs`
**Purpose:** Generate replication script with static data

**Usage:**
```bash
node scripts/replicate-db.mjs
```

**What it does:**
- Connects to source Supabase
- Exports: brands, categories, coupons, banners
- Generates INSERT statements
- Creates `supabase/migrations/NNNN_replicate-data.sql`
- Creates `docs/DB_REPLICATION.md` (detailed guide)

**Output:**
- SQL file with INSERT statements
- Replication guide (markdown)

### `scripts/seed.mjs`
**Purpose:** Populate sellers, products, variants, images

**Usage:**
```bash
node scripts/seed.mjs
```

**What it does:**
- Inserts 4 sellers (with auth users)
- Inserts 40 products
- Inserts 120 variants (3 per product)
- Inserts 160 product images
- Uses picsum.photos for placeholder images

**Output:**
```
✓ 4 sellers seeded
✓ 40 products seeded
✓ 120 variants seeded
✓ 160 images seeded
```

---

## 📁 Migration Files

Located in `supabase/migrations/`:

| File | Purpose | Row Count |
|------|---------|-----------|
| 00_init_extensions.sql | Enable pg_cron, pg_trgm | - |
| 01_auth_profiles.sql | User authentication | - |
| 02_categories_brands.sql | Catalog structure | - |
| 03_products_variants.sql | Product data model | - |
| 04_images_banners.sql | Media & promotions | - |
| 05_orders_payments.sql | Commerce transactions | - |
| 06_sellers_settlements.sql | Seller financials | - |
| 07_reviews_ratings.sql | User-generated content | - |
| 08_rpc_functions.sql | Stored procedures | - |
| 09_realtime_policies.sql | RLS & Realtime | - |
| NNNN_replicate-data.sql | Static data (generated) | 60 rows |

---

## ✅ Complete Checklist

### Before Starting
- [ ] Source Supabase credentials available
- [ ] `.env.local` updated with credentials
- [ ] pnpm installed

### Rename Project
- [ ] Logged into Supabase dashboard
- [ ] Project "aura 2.0" renamed to "Aura"

### Export Schema
- [ ] Ran `supabase db pull` (or exported manually)
- [ ] `supabase/migrations/` contains 10+ files
- [ ] Files numbered 00_ through 09_

### Generate Replication Scripts
- [ ] Ran `node scripts/replicate-db.mjs`
- [ ] Generated: `supabase/migrations/NNNN_replicate-data.sql`
- [ ] Generated: `docs/DB_REPLICATION.md`

### Create Target Project
- [ ] New Supabase project created (e.g., "Aura-Staging")
- [ ] Credentials copied to .env file

### Apply Migrations to Target
- [ ] Migration 00_init_extensions.sql applied
- [ ] Migration 01_auth_profiles.sql applied
- [ ] Migration 02_categories_brands.sql applied
- [ ] Migration 03_products_variants.sql applied
- [ ] Migration 04_images_banners.sql applied
- [ ] Migration 05_orders_payments.sql applied
- [ ] Migration 06_sellers_settlements.sql applied
- [ ] Migration 07_reviews_ratings.sql applied
- [ ] Migration 08_rpc_functions.sql applied
- [ ] Migration 09_realtime_policies.sql applied

### Replicate Data
- [ ] Applied `NNNN_replicate-data.sql` (brands, categories, coupons, banners)
- [ ] Ran `node scripts/seed.mjs` (sellers, products, variants, images)

### Verify Replication
- [ ] SQL: Brands count = 20
- [ ] SQL: Categories count = 10
- [ ] SQL: Products count = 40
- [ ] SQL: Product variants count = 120
- [ ] SQL: Sellers count = 4
- [ ] App: `pnpm dev:web` loads homepage
- [ ] App: 40 products visible
- [ ] App: Can browse categories
- [ ] App: Can view product details

---

## 🔑 Key Credentials Needed

**Source (Current Aura Project)**
```
NEXT_PUBLIC_SUPABASE_URL=https://current-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Target (New/Staging Project)**
```
NEXT_PUBLIC_SUPABASE_URL=https://target-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Get credentials from:
1. Supabase Dashboard
2. **Settings** → **API**
3. Copy Project URL and service_role key

---

## 📚 Documentation Files

Created in Phase 3:

| File | Purpose |
|------|---------|
| `docs/DB_REPLICATION.md` | Detailed replication guide |
| `docs/PHASE_3_DB_SETUP.md` | This file - overview |
| `scripts/export-schema.mjs` | Export schema script |
| `scripts/replicate-db.mjs` | Replication script generator |

---

## ⏱️ Timeline

| Step | Time | Notes |
|------|------|-------|
| Rename project | 2 min | Dashboard only |
| Export schema | 5 min | Via Supabase CLI |
| Generate replication script | 2 min | `replicate-db.mjs` |
| Create target project | 5 min | Wait for Supabase setup |
| Apply migrations | 10 min | 10 files, SQL Editor |
| Replicate static data | 3 min | Run SQL script |
| Seed dynamic data | 5 min | `seed.mjs` |
| Verify | 5 min | SQL count check + app test |
| **Total** | **37 min** | One-time setup |

---

## 🚀 Next Actions

1. **Today:**
   - [ ] Rename Supabase project to "Aura"
   - [ ] Export current schema via `supabase db pull`
   - [ ] Run `node scripts/replicate-db.mjs`

2. **For New Environment (Staging/Dev):**
   - [ ] Create new Supabase project
   - [ ] Apply all 10 migrations
   - [ ] Run replication script
   - [ ] Run seed script
   - [ ] Test apps

3. **For Production:**
   - [ ] Create production Supabase project
   - [ ] Repeat replication (with production data if any)
   - [ ] Run comprehensive tests
   - [ ] Deploy apps with production URL

---

## 📞 Support

**If migrations fail:**
- Check Supabase SQL Editor for error messages
- Verify migration order (00 → 09)
- Review DB_REPLICATION.md troubleshooting section

**If seed fails:**
- Verify `.env.local` has correct credentials
- Check SERVICE_ROLE_KEY (not ANON_KEY)
- Run `pnpm install` to ensure deps installed

**If app won't connect:**
- Double-check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Verify CORS settings in Supabase dashboard
- Check network connectivity to Supabase

---

**Questions?** See `docs/DB_REPLICATION.md` for detailed guide.

**Ready to replicate?** Start with Step 1: Rename the project in Supabase dashboard.
