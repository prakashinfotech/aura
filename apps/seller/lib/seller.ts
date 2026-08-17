/**
 * Server-side helper: resolve the current seller record from the auth session.
 * Returns null if user is not authenticated or has no seller profile.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  gstin: string | null;
  pan: string | null;
  status: "pending" | "approved" | "suspended" | "rejected";
  rating_avg: number;
  rating_count: number;
  commission_rate: number;
  bank_account_verified: boolean;
  business_phone: string | null;
  support_email: string | null;
  business_type: string | null;
  warehouse_address: Record<string, string> | null;
  bank_details: Record<string, string> | null;
  declaration_accepted: boolean;
  onboarding_step: number;
}

export async function getCurrentSeller(): Promise<SellerProfile | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return (data as SellerProfile) ?? null;
}

/** Client-side helper — call once on mount to get the seller record */
export async function getClientSeller(supabase: ReturnType<typeof import("@aura/db/client").createClient>): Promise<SellerProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("sellers").select("*").eq("user_id", session.user.id).single();

  return (data as SellerProfile) ?? null;
}
