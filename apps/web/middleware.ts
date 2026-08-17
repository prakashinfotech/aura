import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/account", "/checkout", "/orders"];
const PROTECTED_EXACT = ["/wishlist"];

function isProtected(pathname: string) {
  if (PROTECTED_EXACT.includes(pathname)) return true;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const result = await (supabase.auth as any).getUser();
    user = result?.data?.user ?? null;
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  if (isProtected(pathname) && !user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("login", "1");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|auth/callback).*)",
  ],
};
