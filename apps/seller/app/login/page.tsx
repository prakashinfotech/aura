"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, ShoppingBag, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const PERKS = [
  { icon: ShoppingBag, text: "50M+ active buyers" },
  { icon: TrendingUp,  text: "Grow your brand fast" },
  { icon: Package,     text: "Zero listing fees" },
];

export default function SellerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]       = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd]   = React.useState(false);
  const [loading, setLoading]   = React.useState(false);

  // Middleware sets ?error=not_seller when an authenticated user lacks the seller role
  const notSellerError = searchParams.get("error") === "not_seller";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); toast.error(error.message); return; }

    // Check if this auth user has a seller record (source of truth — works
    // for all accounts regardless of when/how they were created)
    const { data: seller } = await (supabase as any)
      .from("sellers")
      .select("id, onboarding_step")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    setLoading(false);
    if (!seller) {
      // Account exists but has no seller record — could be a buyer account
      await supabase.auth.signOut();
      toast.error("This account is not registered as a seller. Apply to sell on Aura or use the buyer app.");
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F6]">
      {/* ── Left panel (desktop only) ── */}
      <div className="hidden flex-col justify-between bg-[#282C3F] p-10 lg:flex lg:w-[420px]">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold leading-none text-white">A</span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6366f1]">SELLER</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">HUB</p>
          </div>
        </div>

        {/* Hero copy */}
        <div>
          <h2 className="mb-4 text-3xl font-extrabold leading-tight text-white">
            India's largest<br />
            <span className="text-[#6366f1]">fashion platform</span><br />
            awaits you.
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/50">
            Join 5 lakh+ brands and sellers already growing on Aura. Manage listings, track orders, and settle payments — all in one place.
          </p>
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/15">
                  <Icon size={15} className="text-[#6366f1]" />
                </div>
                <span className="text-sm font-medium text-white/70">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/25">© 2025 Aura Designs Pvt. Ltd.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="text-3xl font-extrabold text-[#282C3F]">A</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6366f1]">SELLER</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#94969F]">HUB</p>
            </div>
          </div>

          <h1 className="mb-1 text-2xl font-extrabold text-[#282C3F]">Sign in</h1>
          <p className="mb-7 text-sm text-[#696B79]">Access your seller dashboard</p>

          {notSellerError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <span>This account does not have seller access. Sign in with a registered seller account or{" "}
                <a href="/register" className="font-semibold underline">apply to sell</a>.
              </span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#696B79]">Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstore.com" autoComplete="email"
                className="h-11 w-full rounded-xl border border-[#E9E9EB] bg-white px-4 text-sm text-[#282C3F] placeholder:text-[#94969F] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#696B79]">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[#E9E9EB] bg-white px-4 pr-11 text-sm text-[#282C3F] placeholder:text-[#94969F] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15 transition-all"
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94969F] hover:text-[#282C3F]">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] text-sm font-bold text-white shadow-md hover:bg-[#4f46e5] active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#696B79]">
            New seller?{" "}
            <a href="/register" className="font-bold text-[#6366f1] hover:underline">
              Apply to sell on Aura
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
