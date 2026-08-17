/**
 * Migration runner — connects to Supabase PostgreSQL and applies all .sql files
 * in supabase/migrations/ in alphabetical order.
 *
 * Usage: node scripts/run-migrations.mjs
 */

import { createRequire } from "module";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

// Direct connection — bypasses PgBouncer (required for DDL + extensions)
const DATABASE_URL = "";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to Supabase…");
  await client.connect();
  console.log("Connected ✓\n");

  const migrationsDir = join(root, "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Running ${file}…`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
      // Continue on non-fatal errors (e.g. already exists)
      if (
        err.message.includes("already exists") ||
        err.message.includes("duplicate key")
      ) {
        console.log("  (skipped — already applied)");
      } else {
        await client.end();
        process.exit(1);
      }
    }
  }

  await client.end();
  console.log("\nAll migrations complete ✓");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
