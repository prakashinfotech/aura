import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@aura/db/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = next.startsWith("/") ? `${origin}${next}` : origin;
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
