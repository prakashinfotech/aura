"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@aura/db";

// Using a distinct cookie name isolates seller sessions from the buyer app.
// Both apps share the same Supabase project, so without this they'd share
// auth cookies on the same domain, letting a buyer access seller routes.
export const SELLER_COOKIE_NAME = "sb-seller";

export function createClient() {
  return createBrowserClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    { cookieOptions: { name: SELLER_COOKIE_NAME } }
  );
}
