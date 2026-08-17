import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Must match the name used in lib/supabase/client.ts so the middleware reads
// the same cookies the browser client writes — this is what isolates seller
// sessions from the buyer app (which uses the default Supabase cookie name).
const SELLER_COOKIE_NAME = "sb-seller";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: SELLER_COOKIE_NAME },
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) =>
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
          ),
      },
    }
  );

  // getUser() validates the JWT server-side — more secure than getSession()
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Second gate: user must have a record in the sellers table.
  // Checking the DB is the only reliable gate that covers accounts created
  // before the role metadata field was introduced (e.g. seeded sellers).
  // ✅ SECURITY: Also check seller status is 'approved'
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!seller) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "not_seller");
    return NextResponse.redirect(url);
  }

  // ✅ SECURITY: Verify seller account is approved
  if (seller.status !== "approved") {
    const url = new URL("/login", req.url);
    if (seller.status === "pending") {
      url.searchParams.set("error", "seller_pending");
    } else if (seller.status === "suspended") {
      url.searchParams.set("error", "seller_suspended");
    } else {
      url.searchParams.set("error", "seller_rejected");
    }
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
