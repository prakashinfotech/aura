/**
 * Creates the `avatars` storage bucket and its RLS policies via Supabase APIs.
 * Run once: node scripts/create-avatars-bucket.mjs
 */

const SUPABASE_URL = "https://[Api].supabase.co";
const SERVICE_ROLE_KEY ="SUPABASE_SERVICE_ROLE_KEY";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function req(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  // 1. Create bucket
  console.log("Creating avatars bucket…");
  const bucket = await req("POST", "/storage/v1/bucket", {
    id: "avatars",
    name: "avatars",
    public: true,
    file_size_limit: 2097152,
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
  });
  if (bucket.ok || (typeof bucket.json === "object" && bucket.json?.error === "Duplicate")) {
    console.log("  ✓ Bucket ready");
  } else {
    console.error("  ✗ Bucket error:", JSON.stringify(bucket.json));
    // Don't exit — the bucket may already exist
  }

  // 2. Apply RLS policies via postgres-meta REST API
  const policies = [
    {
      name: "avatar_upload",
      table: "objects",
      schema: "storage",
      action: "INSERT",
      roles: ["authenticated"],
      check: `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,
    },
    {
      name: "avatar_update",
      table: "objects",
      schema: "storage",
      action: "UPDATE",
      roles: ["authenticated"],
      using: `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,
    },
    {
      name: "avatar_delete",
      table: "objects",
      schema: "storage",
      action: "DELETE",
      roles: ["authenticated"],
      using: `(bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)`,
    },
    {
      name: "avatar_read",
      table: "objects",
      schema: "storage",
      action: "SELECT",
      roles: ["public"],
      using: `(bucket_id = 'avatars')`,
    },
  ];

  console.log("\nApplying RLS policies…");
  for (const p of policies) {
    const res = await req("POST", "/rest/v1/rpc/apply_rls_policy", p);
    if (res.ok) {
      console.log(`  ✓ ${p.name}`);
    } else {
      // Supabase doesn't expose a policy RPC — use pg-meta instead
      const pgMeta = await req("POST", "/pg-meta/v0/policies", {
        schema: p.schema,
        table: p.table,
        name: p.name,
        action: p.action,
        roles: p.roles,
        using: p.using || null,
        check: p.check || null,
      });
      if (pgMeta.ok) {
        console.log(`  ✓ ${p.name} (via pg-meta)`);
      } else {
        console.warn(`  ! ${p.name} — apply via SQL migration instead (status ${pgMeta.status}):`, JSON.stringify(pgMeta.json).slice(0, 120));
      }
    }
  }

  console.log("\nDone. If policies failed, run the SQL migration manually in the Supabase SQL editor.");
  console.log("File: supabase/migrations/20250516000001_avatars_bucket.sql");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
