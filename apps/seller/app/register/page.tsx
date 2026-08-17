"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Store, User, Building2, FileText,
  MapPin, FolderOpen, CreditCard, CheckCircle2,
  Eye, EyeOff, ChevronRight, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Account",    icon: User },
  { id: 2, label: "Business",   icon: Building2 },
  { id: 3, label: "Tax",        icon: FileText },
  { id: 4, label: "Warehouse",  icon: MapPin },
  { id: 5, label: "Documents",  icon: FolderOpen },
  { id: 6, label: "Bank",       icon: CreditCard },
  { id: 7, label: "Confirm",    icon: CheckCircle2 },
] as const;

// ── Schemas ───────────────────────────────────────────────────────────────────

const s1 = z.object({
  name:     z.string().min(2, "Name required"),
  email:    z.string().email("Valid email required"),
  phone:    z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  password: z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Needs an uppercase letter").regex(/\d/, "Needs a number"),
});

const s2 = z.object({
  storeName:    z.string().min(2, "Store name required"),
  businessType: z.enum(["individual","proprietorship","partnership","pvt_ltd","ltd","llp"]),
  supportEmail: z.string().email("Valid email").optional().or(z.literal("")),
});

const s3 = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN"),
  pan:   z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN"),
});

const s4 = z.object({
  wh_line1:   z.string().min(5, "Address required"),
  wh_line2:   z.string().optional(),
  wh_city:    z.string().min(2, "City required"),
  wh_state:   z.string().min(2, "State required"),
  wh_pincode: z.string().regex(/^\d{6}$/, "6-digit pincode"),
  wh_phone:   z.string().regex(/^[6-9]\d{9}$/, "Valid mobile"),
});

const s6 = z.object({
  accountHolder: z.string().min(2, "Account holder required"),
  accountNumber: z.string().min(9, "Account number required"),
  ifsc:          z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"),
  bankName:      z.string().min(2, "Bank name required"),
});

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

const BUSINESS_TYPES = [
  { value: "individual",      label: "Individual" },
  { value: "proprietorship",  label: "Sole Proprietorship" },
  { value: "partnership",     label: "Partnership Firm" },
  { value: "pvt_ltd",         label: "Private Limited" },
  { value: "ltd",             label: "Public Limited" },
  { value: "llp",             label: "LLP" },
];

// ── UI primitives ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
      {children}
    </label>
  );
}

function FieldInput({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none transition-colors";

const selectCls = inputCls + " cursor-pointer";

// ── State type ────────────────────────────────────────────────────────────────

interface FormData {
  name: string; email: string; phone: string; password: string;
  storeName: string; businessType: string; supportEmail: string;
  gstin: string; pan: string;
  wh_line1: string; wh_line2: string; wh_city: string; wh_state: string; wh_pincode: string; wh_phone: string;
  accountHolder: string; accountNumber: string; ifsc: string; bankName: string;
  declaration: boolean;
}

const INIT: FormData = {
  name: "", email: "", phone: "", password: "",
  storeName: "", businessType: "individual", supportEmail: "",
  gstin: "", pan: "",
  wh_line1: "", wh_line2: "", wh_city: "", wh_state: "", wh_pincode: "", wh_phone: "",
  accountHolder: "", accountNumber: "", ifsc: "", bankName: "",
  declaration: false,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState<FormData>(INIT);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [sellerId, setSellerId] = React.useState<string | null>(null);

  function merge(partial: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  // ── Step 1: Account ────────────────────────────────────────────────────────

  const form1 = useForm<z.infer<typeof s1>>({ resolver: zodResolver(s1), defaultValues: data });

  async function submitStep1(vals: z.infer<typeof s1>) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: vals.email,
        password: vals.password,
        options: { data: { name: vals.name, phone: vals.phone, role: "seller" } },
      });
      if (error) { toast.error(error.message); return; }
      setUserId(authData.user?.id ?? null);
      merge(vals);
      setStep(2);
      toast.success("Account created! Continue setting up your store.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2: Business ───────────────────────────────────────────────────────

  const form2 = useForm<z.infer<typeof s2>>({ resolver: zodResolver(s2), defaultValues: { storeName: data.storeName, businessType: data.businessType as z.infer<typeof s2>["businessType"], supportEmail: data.supportEmail } });

  async function submitStep2(vals: z.infer<typeof s2>) {
    merge(vals as Partial<FormData>);
    // Create / update the seller row immediately so the user can access the
    // dashboard and add products even before completing all 7 steps.
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? userId;
      if (uid) {
        await (supabase as any).from("sellers").upsert({
          user_id: uid,
          store_name: vals.storeName,
          business_type: vals.businessType,
          support_email: vals.supportEmail || session?.user?.email || null,
          status: "pending",
          onboarding_step: 2,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    } catch {
      // Non-blocking — seller row can be completed in step 7
    }
    setStep(3);
  }

  // ── Step 3: Tax ────────────────────────────────────────────────────────────

  const form3 = useForm<z.infer<typeof s3>>({ resolver: zodResolver(s3), defaultValues: data });

  function submitStep3(vals: z.infer<typeof s3>) {
    merge(vals);
    setStep(4);
  }

  // ── Step 4: Warehouse ──────────────────────────────────────────────────────

  const form4 = useForm<z.infer<typeof s4>>({ resolver: zodResolver(s4), defaultValues: data });

  function submitStep4(vals: z.infer<typeof s4>) {
    merge(vals);
    setStep(5);
  }

  // ── Step 5: Documents (upload later) ──────────────────────────────────────

  function submitStep5() { setStep(6); }

  // ── Step 6: Bank ───────────────────────────────────────────────────────────

  const form6 = useForm<z.infer<typeof s6>>({ resolver: zodResolver(s6), defaultValues: data });

  function submitStep6(vals: z.infer<typeof s6>) {
    merge(vals);
    setStep(7);
  }

  // ── Step 7: Submit ─────────────────────────────────────────────────────────

  async function submitFinal() {
    if (!data.declaration) { toast.error("Please accept the declaration"); return; }
    setSubmitting(true);
    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uid = session?.user?.id ?? userId;
      if (!uid) { toast.error("Session lost — please log in and retry"); return; }

      const sellerPayload = {
        user_id: uid,
        store_name: data.storeName,
        gstin: data.gstin,
        pan: data.pan,
        business_type: data.businessType,
        business_phone: data.phone,
        support_email: data.supportEmail || data.email,
        status: "pending" as const,
        warehouse_address: {
          line1: data.wh_line1,
          line2: data.wh_line2,
          city: data.wh_city,
          state: data.wh_state,
          pincode: data.wh_pincode,
          phone: data.wh_phone,
        },
        bank_details: {
          accountHolder: data.accountHolder,
          accountNumber: data.accountNumber,
          ifsc: data.ifsc,
          bankName: data.bankName,
        },
        declaration_accepted: true,
        onboarding_step: 7,
        updated_at: new Date().toISOString(),
      };

      // Upsert seller record (in case of re-try)
      const { data: seller, error } = await (supabase as any)
        .from("sellers")
        .upsert(sellerPayload, { onConflict: "user_id" })
        .select("id")
        .single();

      if (error) { toast.error("Registration failed: " + error.message); return; }
      setSellerId(seller?.id ?? null);

      toast.success("Application submitted! We'll review and approve within 2–3 business days.");
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  function StepBar() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done    = step > s.id;
            const current = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                      done    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : current ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                      :           "border-[var(--border)] bg-white text-[var(--foreground-muted)]",
                    ].join(" ")}
                  >
                    {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                  </div>
                  <span className={`hidden text-[9px] font-semibold sm:block ${current ? "text-[var(--brand)]" : "text-[var(--foreground-muted)]"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${step > s.id ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  function NavButtons({ onBack, loading }: { onBack?: () => void; loading?: boolean }) {
    return (
      <div className="mt-6 flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            <ChevronLeft size={15} /> Back
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--secondary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Continue <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)]">
            <Store size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Become a Seller</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Step {step} of {STEPS.length} — {STEPS[step - 1]?.label}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <StepBar />

          {/* ─── Step 1 ─── */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(submitStep1)} className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Create your account</h2>
              <FieldInput label="Full Name" error={form1.formState.errors.name?.message}>
                <input {...form1.register("name")} className={inputCls} placeholder="Your full name" />
              </FieldInput>
              <FieldInput label="Email Address" error={form1.formState.errors.email?.message}>
                <input {...form1.register("email")} type="email" className={inputCls} placeholder="seller@yourbrand.com" />
              </FieldInput>
              <FieldInput label="Mobile Number" error={form1.formState.errors.phone?.message}>
                <input {...form1.register("phone")} type="tel" maxLength={10} className={inputCls} placeholder="10-digit mobile" />
              </FieldInput>
              <FieldInput label="Password" error={form1.formState.errors.password?.message}>
                <div className="relative">
                  <input {...form1.register("password")} type={showPwd ? "text" : "password"} className={inputCls + " pr-10"} placeholder="Min 8 chars, 1 uppercase, 1 number" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FieldInput>
              <NavButtons loading={submitting} />
            </form>
          )}

          {/* ─── Step 2 ─── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(submitStep2)} className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Business information</h2>
              <FieldInput label="Store / Brand Name" error={form2.formState.errors.storeName?.message}>
                <input {...form2.register("storeName")} className={inputCls} placeholder="e.g. Urban Threads" />
              </FieldInput>
              <FieldInput label="Business Type" error={form2.formState.errors.businessType?.message}>
                <select {...form2.register("businessType")} className={selectCls}>
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </FieldInput>
              <FieldInput label="Support Email (optional)" error={form2.formState.errors.supportEmail?.message}>
                <input {...form2.register("supportEmail")} type="email" className={inputCls} placeholder="support@yourbrand.com" />
              </FieldInput>
              <NavButtons onBack={() => setStep(1)} />
            </form>
          )}

          {/* ─── Step 3 ─── */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(submitStep3)} className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Tax registration details</h2>
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                Your GSTIN and PAN are required for seller payouts and TDS compliance.
              </div>
              <FieldInput label="GSTIN (15 digits)" error={form3.formState.errors.gstin?.message}>
                <input
                  {...form3.register("gstin", { setValueAs: (v) => v.toUpperCase() })}
                  className={inputCls} placeholder="27AAPFU0939F1ZV" maxLength={15}
                  onChange={(e) => form3.setValue("gstin", e.target.value.toUpperCase(), { shouldValidate: false })}
                  style={{ textTransform: "uppercase" }}
                />
              </FieldInput>
              <FieldInput label="PAN (10 characters)" error={form3.formState.errors.pan?.message}>
                <input
                  {...form3.register("pan", { setValueAs: (v) => v.toUpperCase() })}
                  className={inputCls} placeholder="AAPFU0939F" maxLength={10}
                  onChange={(e) => form3.setValue("pan", e.target.value.toUpperCase(), { shouldValidate: false })}
                  style={{ textTransform: "uppercase" }}
                />
              </FieldInput>
              <NavButtons onBack={() => setStep(2)} />
            </form>
          )}

          {/* ─── Step 4 ─── */}
          {step === 4 && (
            <form onSubmit={form4.handleSubmit(submitStep4)} className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Warehouse / pickup address</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Courier will pick up orders from this address.</p>
              <FieldInput label="Address Line 1" error={form4.formState.errors.wh_line1?.message}>
                <input {...form4.register("wh_line1")} className={inputCls} placeholder="Building / Street / Area" />
              </FieldInput>
              <FieldInput label="Address Line 2 (optional)" error={form4.formState.errors.wh_line2?.message}>
                <input {...form4.register("wh_line2")} className={inputCls} placeholder="Landmark / Block" />
              </FieldInput>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="City" error={form4.formState.errors.wh_city?.message}>
                  <input {...form4.register("wh_city")} className={inputCls} placeholder="City" />
                </FieldInput>
                <FieldInput label="Pincode" error={form4.formState.errors.wh_pincode?.message}>
                  <input {...form4.register("wh_pincode")} className={inputCls} placeholder="6 digits" maxLength={6} />
                </FieldInput>
              </div>
              <FieldInput label="State" error={form4.formState.errors.wh_state?.message}>
                <select {...form4.register("wh_state")} className={selectCls}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FieldInput>
              <FieldInput label="Warehouse Phone" error={form4.formState.errors.wh_phone?.message}>
                <input {...form4.register("wh_phone")} type="tel" className={inputCls} placeholder="10-digit number" maxLength={10} />
              </FieldInput>
              <NavButtons onBack={() => setStep(3)} />
            </form>
          )}

          {/* ─── Step 5 ─── */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Upload documents</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Required: GST Certificate, PAN Card, Address Proof (any govt. ID). Max 10MB per file, PDF/JPG/PNG.</p>
              {[
                { label: "GST Registration Certificate", required: true },
                { label: "PAN Card", required: true },
                { label: "Address Proof (Aadhar / Passport / Utility Bill)", required: true },
                { label: "Cancelled Cheque / Bank Statement", required: false },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border)] p-3 hover:border-[var(--brand)] transition-colors">
                  <FolderOpen size={20} className="shrink-0 text-[var(--foreground-muted)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{doc.label}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)]">{doc.required ? "Required" : "Optional"}</p>
                  </div>
                  <label className="cursor-pointer rounded-[var(--radius-sm)] border border-[var(--brand)] px-3 py-1 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]">
                    Upload
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={() => toast.info("Document upload available after approval")} />
                  </label>
                </div>
              ))}
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                Documents will be verified during account review (2–3 business days). You can upload after submitting.
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setStep(4)} className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]">
                  <ChevronLeft size={15} /> Back
                </button>
                <button type="button" onClick={submitStep5} className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--secondary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                  Continue <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 6 ─── */}
          {step === 6 && (
            <form onSubmit={form6.handleSubmit(submitStep6)} className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Bank account for payouts</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Settlements are processed every Mon/Wed/Fri (D+15 cycle).</p>
              <FieldInput label="Account Holder Name" error={form6.formState.errors.accountHolder?.message}>
                <input {...form6.register("accountHolder")} className={inputCls} placeholder="As per bank records" />
              </FieldInput>
              <FieldInput label="Account Number" error={form6.formState.errors.accountNumber?.message}>
                <input {...form6.register("accountNumber")} className={inputCls} placeholder="Your bank account number" />
              </FieldInput>
              <FieldInput label="IFSC Code" error={form6.formState.errors.ifsc?.message}>
                <input
                  {...form6.register("ifsc", { setValueAs: (v) => v.toUpperCase() })}
                  className={inputCls} placeholder="e.g. SBIN0001234" maxLength={11}
                  onChange={(e) => form6.setValue("ifsc", e.target.value.toUpperCase(), { shouldValidate: false })}
                  style={{ textTransform: "uppercase" }}
                />
              </FieldInput>
              <FieldInput label="Bank Name" error={form6.formState.errors.bankName?.message}>
                <input {...form6.register("bankName")} className={inputCls} placeholder="e.g. State Bank of India" />
              </FieldInput>
              <NavButtons onBack={() => setStep(5)} />
            </form>
          )}

          {/* ─── Step 7 ─── */}
          {step === 7 && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Review & submit</h2>

              {/* Summary */}
              {[
                { label: "Name",         value: data.name },
                { label: "Email",        value: data.email },
                { label: "Store",        value: data.storeName },
                { label: "Business",     value: BUSINESS_TYPES.find((b) => b.value === data.businessType)?.label },
                { label: "GSTIN",        value: data.gstin },
                { label: "PAN",          value: data.pan },
                { label: "Warehouse",    value: [data.wh_city, data.wh_state, data.wh_pincode].filter(Boolean).join(", ") },
                { label: "Bank",         value: data.bankName ? `${data.bankName} — ${data.accountNumber.slice(0, 4)}${"•".repeat(Math.max(0, data.accountNumber.length - 4))}` : "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">{row.label}</span>
                  <span className="font-medium text-[var(--foreground)]">{row.value || "—"}</span>
                </div>
              ))}

              <div className="rounded-lg border border-[var(--border)] p-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={data.declaration}
                    onChange={(e) => merge({ declaration: e.target.checked })}
                    className="mt-0.5 accent-[var(--brand)]"
                  />
                  <span className="text-[var(--foreground-muted)] leading-relaxed">
                    I confirm that all information provided is accurate and I agree to Aura's{" "}
                    <span className="text-[var(--brand)] underline cursor-pointer">Seller Policy</span>,{" "}
                    <span className="text-[var(--brand)] underline cursor-pointer">Terms of Service</span>, and{" "}
                    <span className="text-[var(--brand)] underline cursor-pointer">Privacy Policy</span>.
                    I understand that submitting false information may result in account termination.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(6)} className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]">
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={submitFinal}
                  disabled={submitting || !data.declaration}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--secondary)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-[var(--foreground-muted)]">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-[var(--brand)] hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
