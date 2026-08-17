import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — mutations will be handled by middleware
          }
        },
      },
    }
  );
}

/**
 * Admin client — uses the service role key as the Authorization bearer token.
 * This bypasses Row Level Security entirely. Only use in trusted server contexts
 * after independently verifying the caller's identity.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
      auth: { persistSession: false },
    }
  );
}
