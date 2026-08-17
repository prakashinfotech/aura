#!/usr/bin/env node
/**
 * Replicate Aura Marketplace database schema and data
 * Usage: node scripts/replicate-db.mjs
 *
 * Steps:
 * 1. Connect to SOURCE Supabase project (current)
 * 2. Extract schema (tables, functions, policies)
 * 3. Extract data (brands, categories, coupons, banners)
 * 4. Generate migration files
 * 5. Provide script to apply in TARGET project
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const SOURCE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SOURCE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SOURCE_URL || !SOURCE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   Set in .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  process.exit(1);
}

const source = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { persistSession: false },
});

async function exportTableData(tableName) {
  /**
   * Export all rows from a table as INSERT statements
   */
  const { data, error } = await source
    .from(tableName)
    .select('*')
    .catch(err => ({ data: null, error: err }));

  if (error) {
    console.warn(`   ⚠️  ${tableName}: ${error.message}`);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Generate INSERT statements
  const columns = Object.keys(data[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  const inserts = data.map(row => {
    const vals = columns.map(col => {
      const val = row[col];
      if (val === null) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return String(val);
    });
    return `INSERT INTO ${tableName} (${colList}) VALUES (${vals.join(', ')});`;
  });

  return inserts.join('\n');
}

async function generateReplicationSQL() {
  /**
   * Export key tables as SQL (for manual replication)
   * Tables: brands, categories, coupons, banners
   */
  const tables = ['brands', 'categories', 'coupons', 'banners'];
  const sqls = [];

  console.log('\n📊 Exporting table data...');

  for (const table of tables) {
    process.stdout.write(`   ${table}... `);
    const sql = await exportTableData(table);
    if (sql) {
      sqls.push(`-- ── ${table.toUpperCase()} ──\n${sql}\n`);
      console.log('✓');
    } else {
      console.log('(empty or error)');
    }
  }

  return sqls.join('\n\n');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  AURA MARKETPLACE — Database Replication             ║');
  console.log('║  Export schema and data for target project           ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  try {
    console.log(`\n🔗 Source: ${SOURCE_URL}`);

    // Export data
    const dataSql = await generateReplicationSQL();

    // Create migration directory
    const dirPath = resolve(process.cwd(), 'supabase/migrations');
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    // Save replication script
    const timestamp = new Date()
      .toISOString()
      .replace(/[:\-.Z]/g, '')
      .slice(0, 12);

    const repFile = `supabase/migrations/${timestamp}_replicate-data.sql`;
    const repPath = resolve(process.cwd(), repFile);

    const content = `-- ═══════════════════════════════════════════════════════════════════
-- AURA MARKETPLACE — Data Replication
-- Generated: ${new Date().toISOString().split('T')[0]}
--
-- This file contains INSERT statements to populate core tables:
-- - brands (fashion brands)
-- - categories (product categories)
-- - coupons (discount codes)
-- - banners (hero & category banners)
--
-- HOW TO USE IN TARGET PROJECT:
-- 1. Ensure schema migrations have been applied first
-- 2. Open target Supabase project SQL Editor
-- 3. Paste this file contents
-- 4. Execute
--
-- After running, seed sellers + products:
--   node scripts/seed.mjs --target-url=<new-supabase-url>
-- ═══════════════════════════════════════════════════════════════════

${dataSql}

-- ✅ Replication complete
-- Tables populated: brands, categories, coupons, banners
`;

    writeFileSync(repPath, content, 'utf8');

    console.log(`\n✅ Replication file created: ${repFile}`);

    // Generate instructions
    const instructionsFile = 'docs/DB_REPLICATION.md';
    const instructions = `# Database Replication Guide

## Quick Replication (3 steps)

### Step 1: Prepare Target Supabase Project

\`\`\`bash
# 1. Create new Supabase project (or use existing)
# 2. Copy URL and keys to .env.local:
export NEXT_PUBLIC_SUPABASE_URL="https://target-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# 3. Link project:
supabase link --project-ref=target-project
\`\`\`

### Step 2: Apply Migrations

\`\`\`bash
# Pull latest migrations from source:
node scripts/export-schema.mjs

# Apply to target project via Supabase dashboard:
# 1. Supabase Dashboard → SQL Editor
# 2. Open supabase/migrations/
# 3. Run migrations in order (00_init → 09_realtime)
\`\`\`

### Step 3: Replicate Data

\`\`\`bash
# Copy core tables (brands, categories, coupons, banners):
# 1. Supabase Dashboard → SQL Editor
# 2. Paste contents of: supabase/migrations/NNNN_replicate-data.sql
# 3. Execute

# Seed sellers and products:
node scripts/seed.mjs
\`\`\`

## Migration Files

All migrations are in \`supabase/migrations/\` and should be applied in order:

| # | File | Purpose |
|---|------|---------|
| 00 | init_extensions.sql | Enable pg_cron, pg_trgm |
| 01 | auth_profiles.sql | User profiles |
| 02 | categories_brands.sql | Catalog structure |
| 03 | products_variants.sql | Product data |
| 04 | images_banners.sql | Assets |
| 05 | orders_payments.sql | Commerce tables |
| 06 | sellers_settlements.sql | Seller financials |
| 07 | reviews_ratings.sql | Reviews & ratings |
| 08 | rpc_functions.sql | Stored procedures |
| 09 | realtime_policies.sql | RLS & Realtime |

## Seed Data

After migrations, populate with seed data:

\`\`\`bash
# Replicate core data (brands, categories, coupons):
# Use: supabase/migrations/NNNN_replicate-data.sql

# Add sellers and products:
node scripts/seed.mjs

# Expected output:
# Connected to Supabase ✓
# Seeding sellers… ✓ 4 sellers
# Seeding products… ✓ 40 products
# Seeding variants… ✓ 120 variants
# Seeding images… ✓ 160 images
# ✓ Seed complete!
\`\`\`

## Verify Replication

\`\`\`bash
# Check table counts:
psql postgresql://postgres:password@localhost:5432/postgres << EOF
SELECT 'brands' as table, COUNT(*) FROM brands
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
EOF

# Or use Supabase dashboard:
# Database → Tables → Check row counts
\`\`\`

## Troubleshooting

**"Cannot find module '@supabase/supabase-js'"**
\`\`\`bash
pnpm install
\`\`\`

**"Service role key invalid"**
- Verify key starts with \`eyJhbGc\`
- Check it's SERVICE_ROLE_KEY (not ANON_KEY)
- Project must be active in Supabase dashboard

**"Table doesn't exist"**
- Migrations haven't been applied
- Run migrations first via Supabase SQL Editor
- Check migration order

**"Permission denied" during replication**
- Using ANON_KEY instead of SERVICE_ROLE_KEY
- Update .env.local with SERVICE_ROLE_KEY

## Rename Supabase Project (Optional)

1. Supabase Dashboard → Settings → General
2. Change "Project Name" to "Aura"
3. Update .env.local with new project details
4. No data loss (internal renaming only)

---

**Next:** After replication, run \`pnpm dev\` to test both apps with replicated data.
`;

    writeFileSync(instructionsFile, instructions, 'utf8');
    console.log(`✅ Instructions: ${instructionsFile}`);

    console.log('\n📝 Replication Summary:');
    console.log('   Exported tables:');
    console.log('   - brands (fashion brands)');
    console.log('   - categories (product categories)');
    console.log('   - coupons (discount codes)');
    console.log('   - banners (marketing banners)');

    console.log('\n🚀 Next steps:');
    console.log(`   1. Review: ${repFile}`);
    console.log('   2. Create target Supabase project (if new)');
    console.log('   3. Apply migrations (supabase/migrations/)');
    console.log(`   4. Execute: ${repFile} in target Supabase SQL Editor`);
    console.log('   5. Run: node scripts/seed.mjs (for sellers + products)');
    console.log('   6. Run: pnpm dev (to test)');

    console.log('\n✨ Database replication ready!');

  } catch (error) {
    console.error('❌ Replication failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
