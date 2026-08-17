/**
 * Generates packages/db/src/types.ts from live Supabase schema
 * by querying information_schema directly.
 */

import { createRequire } from "module";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const __dir = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = "";

const PG_TO_TS = {
  uuid: "string",
  text: "string",
  varchar: "string",
  "character varying": "string",
  bpchar: "string",
  bool: "boolean",
  boolean: "boolean",
  int2: "number",
  int4: "number",
  int8: "number",
  integer: "number",
  smallint: "number",
  bigint: "number",
  numeric: "number",
  decimal: "number",
  float4: "number",
  float8: "number",
  real: "number",
  "double precision": "number",
  timestamptz: "string",
  timestamp: "string",
  "timestamp with time zone": "string",
  "timestamp without time zone": "string",
  date: "string",
  jsonb: "Record<string, unknown>",
  json: "Record<string, unknown>",
  tsvector: "string",
};

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: tables } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const { rows: columns } = await client.query(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      tc.constraint_type
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name
      AND kcu.table_schema = 'public'
    LEFT JOIN information_schema.table_constraints tc
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = 'public'
      AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `);

  // Group columns by table (deduplicate — composite PKs produce multiple join rows)
  const byTable = {};
  const seen = new Set();
  for (const row of columns) {
    const key = `${row.table_name}:${row.column_name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!byTable[row.table_name]) byTable[row.table_name] = [];
    byTable[row.table_name].push(row);
  }

  function pgType(col) {
    const t = PG_TO_TS[col.data_type] ?? PG_TO_TS[col.udt_name] ?? "unknown";
    return col.is_nullable === "YES" ? `${t} | null` : t;
  }

  let out = `// AUTO-GENERATED — do not edit manually
// Run: node scripts/gen-types.mjs

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
`;

  for (const { table_name } of tables) {
    const cols = byTable[table_name] ?? [];
    const rowCols = cols.map((c) => `          ${c.column_name}: ${pgType(c)}`).join("\n");
    const insertCols = cols
      .map((c) => {
        const hasDefault = c.column_default !== null || c.is_nullable === "YES";
        const suffix = hasDefault ? "?" : "";
        return `          ${c.column_name}${suffix}: ${pgType(c).replace(" | null", "")}${hasDefault ? " | null | undefined" : ""}`;
      })
      .join("\n");

    out += `      ${table_name}: {
        Row: {
${rowCols}
        }
        Insert: {
${insertCols}
        }
        Update: Partial<Database["public"]["Tables"]["${table_name}"]["Insert"]>
        Relationships: []
      }\n`;
  }

  out += `    }
    Views: Record<string, never>
    Functions: {
      get_products_filtered: {
        Args: {
          p_category_slug?: string | null
          p_search?: string | null
          p_brand_ids?: string[] | null
          p_min_price?: number | null
          p_max_price?: number | null
          p_min_discount?: number | null
          p_sizes?: string[] | null
          p_colors?: string[] | null
          p_min_rating?: number | null
          p_gender?: string | null
          p_sort?: string
          p_page?: number
          p_limit?: number
        }
        Returns: Array<{
          id: string
          title: string
          slug: string
          brand_name: string
          selling_price: number
          mrp: number
          discount_pct: number
          rating_avg: number
          rating_count: number
          primary_image_url: string | null
          blur_data_url: string | null
          in_stock: boolean
          total_count: number
        }>
      }
      create_order: {
        Args: {
          p_user_id: string
          p_address_id: string
          p_variant_ids: string[]
          p_quantities: number[]
          p_coupon_code?: string | null
          p_razorpay_order_id?: string | null
          p_razorpay_payment_id?: string | null
        }
        Returns: Array<{ order_id: string | null; total: number; error_code: string | null }>
      }
      apply_coupon: {
        Args: { p_code: string; p_user_id: string; p_order_total: number }
        Returns: Array<{ discount: number; error_code: string | null }>
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Address = Database["public"]["Tables"]["addresses"]["Row"]
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Brand = Database["public"]["Tables"]["brands"]["Row"]
export type Seller = Database["public"]["Tables"]["sellers"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"]
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"]
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"]
export type WishlistItem = Database["public"]["Tables"]["wishlists"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"]
export type Banner = Database["public"]["Tables"]["banners"]["Row"]
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"]
`;

  await client.end();

  const outPath = join(__dir, "..", "packages", "db", "src", "types.ts");
  writeFileSync(outPath, out);
  console.log(`✓ Types written to packages/db/src/types.ts`);
  console.log(`  Tables: ${tables.map((t) => t.table_name).join(", ")}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
