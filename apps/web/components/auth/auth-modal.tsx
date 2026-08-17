"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@aura/ui/button";
import { Input } from "@aura/ui/input";
import { createClient } from "@aura/db/client";

type Tab = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<Tab>("login");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const supabase = React.useMemo(() => createClient(), []);

  function handleClose() {
    setTab("login");
    setShowPass(false);
    onClose();
  }

  async function handleSuccess() {
    handleClose();
    const next = searchParams.get("next");
    if (next?.startsWith("/")) router.push(next);
    else router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[var(--brand)] to-[#e6385f] px-8 py-7 text-white">
          <p className="text-3xl font-black italic tracking-tight">Aura</p>
          <p className="mt-1 text-sm font-medium text-white/80">
            {tab === "login" ? "Welcome back! Sign in to continue" : "Join millions of fashion lovers"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t
                  ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "login" ? "Login" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="p-8">
          {tab === "login" ? (
            <LoginForm
              loading={loading}
              setLoading={setLoading}
              showPass={showPass}
              setShowPass={setShowPass}
              onSuccess={handleSuccess}
              supabase={supabase}
            />
          ) : (
            <RegisterForm
              loading={loading}
              setLoading={setLoading}
              showPass={showPass}
              setShowPass={setShowPass}
              onSuccess={handleSuccess}
              supabase={supabase}
            />
          )}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-3">or continue with</span>
            </div>
          </div>

          <GoogleButton supabase={supabase} />

          <p className="mt-5 text-center text-[11px] text-gray-400">
            By continuing, you agree to Aura&apos;s{" "}
            <a href="/terms" className="underline hover:text-[var(--brand)]">Terms of Use</a>{" "}
            &amp;{" "}
            <a href="/privacy" className="underline hover:text-[var(--brand)]">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

function LoginForm({
  loading, setLoading, showPass, setShowPass, onSuccess, supabase,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  onSuccess: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit({ email, password }: LoginValues) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Wrong email or password"
        : error.message);
    } else {
      toast.success("Welcome back!");
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div>
        <Input
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          endIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register("password")}
        />
        <div className="mt-1 text-right">
          <button
            type="button"
            className="text-xs text-[var(--brand)] hover:underline"
            onClick={async () => {
              const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value;
              if (!email) { toast.error("Enter your email first"); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback`,
              });
              if (error) toast.error(error.message);
              else toast.success("Password reset email sent!");
            }}
          >
            Forgot password?
          </button>
        </div>
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Login"}
      </Button>
    </form>
  );
}

// ── Register ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});
type RegisterValues = z.infer<typeof registerSchema>;

function RegisterForm({
  loading, setLoading, showPass, setShowPass, onSuccess, supabase,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  onSuccess: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit({ full_name, email, password }: RegisterValues) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to verify.", { duration: 6000 });
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input
        label="Full Name"
        placeholder="Your name"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type={showPass ? "text" : "password"}
        placeholder="Min 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        endIcon={
          <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...register("password")}
      />
      <Input
        label="Confirm Password"
        type={showPass ? "text" : "password"}
        placeholder="Repeat password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <Button type="submit" variant="primary" size="lg" className="w-full mt-1" disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
      </Button>
    </form>
  );
}

// ── Google ─────────────────────────────────────────────────────────────────────

function GoogleButton({ supabase }: { supabase: ReturnType<typeof createClient> }) {
  const [loading, setLoading] = React.useState(false);

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setLoading(false); toast.error(error.message); }
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin text-gray-500" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}
