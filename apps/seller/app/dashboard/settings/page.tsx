"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Store, CreditCard, Bell, Shield, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ── Schemas ────────────────────────────────────────────────────────────────────

const storeSchema = z.object({
  storeName:    z.string().min(2, "Store name required"),
  gstin:        z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").or(z.literal("")),
  supportEmail: z.string().email("Valid email required").or(z.literal("")),
  supportPhone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit number").or(z.literal("")),
});

const bankSchema = z.object({
  accountHolder: z.string().min(2, "Account holder name required"),
  accountNumber: z.string().min(9, "Valid account number required"),
  ifsc:          z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  bankName:      z.string().min(2, "Bank name required"),
});

type StoreForm = z.infer<typeof storeSchema>;
type BankForm  = z.infer<typeof bankSchema>;

const TABS = [
  { id: "store",         label: "Store Info",    icon: Store },
  { id: "bank",          label: "Bank Account",  icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security",      label: "Security",      icon: Shield },
] as const;
type Tab = (typeof TABS)[number]["id"];

const NOTIFICATION_PREFS = [
  { id: "new_order",      label: "New Order Received",    desc: "Get notified when a customer places an order",      email: true,  sms: true },
  { id: "order_cancelled",label: "Order Cancellation",    desc: "Notify when buyer cancels an order",                email: true,  sms: false },
  { id: "return_request", label: "Return Request",        desc: "Alert for new return/refund requests",              email: true,  sms: true },
  { id: "low_stock",      label: "Low Stock Alert",       desc: "Notify when product stock falls below 5 units",     email: true,  sms: false },
  { id: "settlement",     label: "Settlement Processed",  desc: "Confirm when payment is settled to bank",           email: true,  sms: true },
  { id: "promotions",     label: "Promotions & Offers",   desc: "Platform-wide promotional campaign updates",        email: false, sms: false },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-[var(--brand)]" : "bg-gray-200"}`}
      aria-checked={on}
      role="switch"
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [tab, setTab]             = React.useState<Tab>("store");
  const [notifPrefs, setNotifPrefs] = React.useState(NOTIFICATION_PREFS);
  const [team, setTeam]           = React.useState<{ id: string; name: string; email: string; role: string; status: string }[]>([]);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole]   = React.useState("viewer");
  const [saving, setSaving]       = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);
  const [sellerId, setSellerId]   = React.useState<string | null>(null);

  const storeForm = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { storeName: "", gstin: "", supportEmail: "", supportPhone: "" },
  });

  const bankForm = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: { accountHolder: "", accountNumber: "", ifsc: "", bankName: "" },
  });

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoadingData(false); return; }

      const { data: seller } = await (supabase as any)
        .from("sellers")
        .select("id, store_name, gstin, support_email, business_phone, bank_details")
        .eq("user_id", session.user.id)
        .single();

      if (seller) {
        setSellerId(seller.id);
        storeForm.reset({
          storeName:    seller.store_name ?? "",
          gstin:        seller.gstin ?? "",
          supportEmail: seller.support_email ?? "",
          supportPhone: seller.business_phone ?? "",
        });
        if (seller.bank_details) {
          bankForm.reset({
            accountHolder: seller.bank_details.accountHolder ?? "",
            accountNumber: seller.bank_details.accountNumber ?? "",
            ifsc:          seller.bank_details.ifsc ?? "",
            bankName:      seller.bank_details.bankName ?? "",
          });
        }
      }
      setLoadingData(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveStore(data: StoreForm) {
    if (!sellerId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("sellers")
        .update({
          store_name:    data.storeName,
          gstin:         data.gstin || null,
          support_email: data.supportEmail || null,
          business_phone: data.supportPhone || null,
          updated_at:    new Date().toISOString(),
        })
        .eq("id", sellerId);
      if (error) throw error;
      toast.success("Store info saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveBank(data: BankForm) {
    if (!sellerId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("sellers")
        .update({
          bank_details: {
            accountHolder: data.accountHolder,
            accountNumber: data.accountNumber,
            ifsc:          data.ifsc,
            bankName:      data.bankName,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sellerId);
      if (error) throw error;
      toast.success("Bank details saved — verification pending");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotif(id: string, channel: "email" | "sms") {
    setNotifPrefs((prev) => prev.map((p) => p.id === id ? { ...p, [channel]: !p[channel] } : p));
  }

  function handleInvite() {
    if (!inviteEmail.includes("@")) { toast.error("Enter a valid email"); return; }
    if (team.find((t) => t.email === inviteEmail)) { toast.error("Already in team"); return; }
    setTeam((prev) => [
      ...prev,
      { id: Date.now().toString(), name: inviteEmail.split("@")[0]!, email: inviteEmail, role: inviteRole, status: "pending" },
    ]);
    setInviteEmail("");
    toast.success(`Invitation sent to ${inviteEmail}`);
  }

  if (loadingData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Manage your store preferences and account</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Sidebar nav */}
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"}`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)]">

          {/* ── Store Info ── */}
          {tab === "store" && (
            <div className="p-5">
              <h2 className="mb-5 font-semibold text-[var(--foreground)]">Store Information</h2>
              <form onSubmit={storeForm.handleSubmit(saveStore)} className="space-y-4">
                {[
                  { name: "storeName"    as const, label: "Store Name",    placeholder: "Your store name" },
                  { name: "gstin"        as const, label: "GSTIN",         placeholder: "22AAAAA0000A1Z5" },
                  { name: "supportEmail" as const, label: "Support Email", placeholder: "support@store.com" },
                  { name: "supportPhone" as const, label: "Support Phone", placeholder: "10-digit mobile" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">{f.label}</label>
                    <input
                      {...storeForm.register(f.name)}
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none"
                    />
                    {storeForm.formState.errors[f.name] && (
                      <p className="mt-1 text-xs text-[var(--error)]">{storeForm.formState.errors[f.name]?.message}</p>
                    )}
                  </div>
                ))}
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* ── Bank Account ── */}
          {tab === "bank" && (
            <div className="p-5">
              <h2 className="mb-1 font-semibold text-[var(--foreground)]">Bank Account Details</h2>
              <p className="mb-5 text-xs text-[var(--foreground-muted)]">All settlements are transferred to this account. Changes require re-verification.</p>
              <form onSubmit={bankForm.handleSubmit(saveBank)} className="space-y-4">
                {[
                  { name: "accountHolder" as const, label: "Account Holder Name" },
                  { name: "accountNumber" as const, label: "Account Number" },
                  { name: "ifsc"          as const, label: "IFSC Code" },
                  { name: "bankName"      as const, label: "Bank Name" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">{f.label}</label>
                    <input
                      {...bankForm.register(f.name)}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none"
                    />
                    {bankForm.formState.errors[f.name] && (
                      <p className="mt-1 text-xs text-[var(--error)]">{bankForm.formState.errors[f.name]?.message}</p>
                    )}
                  </div>
                ))}
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Update Bank Details
                </button>
              </form>

              {/* Team */}
              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <h2 className="mb-4 font-semibold text-[var(--foreground)]">Team Members</h2>
                <div className="mb-4 space-y-3">
                  {team.length === 0 && (
                    <p className="text-sm text-[var(--foreground-muted)]">No team members yet. Invite colleagues to manage your store.</p>
                  )}
                  {team.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{m.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">{m.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "pending" ? "bg-[var(--warning-soft)] text-[var(--warning)]" : "bg-[var(--success-soft)] text-[var(--success)]"}`}>
                          {m.status}
                        </span>
                        <span className="text-xs font-medium capitalize text-[var(--foreground-muted)]">{m.role}</span>
                        {m.role !== "owner" && (
                          <button onClick={() => setTeam((t) => t.filter((x) => x.id !== m.id))} className="text-[var(--foreground-muted)] hover:text-[var(--error)]">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@email.com"
                    className="h-9 flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:border-[var(--brand)] focus:outline-none"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-2 text-sm focus:border-[var(--brand)] focus:outline-none"
                  >
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button onClick={handleInvite} className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                    <Plus size={14} /> Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="p-5">
              <h2 className="mb-1 font-semibold text-[var(--foreground)]">Notification Preferences</h2>
              <p className="mb-5 text-xs text-[var(--foreground-muted)]">Choose how you&apos;d like to be notified for each event.</p>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Event</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Email</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifPrefs.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-[var(--foreground)]">{p.label}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{p.desc}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Toggle on={p.email} onChange={() => toggleNotif(p.id, "email")} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Toggle on={p.sms} onChange={() => toggleNotif(p.id, "sms")} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => toast.success("Notification preferences saved")}
                className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]"
              >
                <Check size={14} />
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Security ── */}
          {tab === "security" && (
            <div className="divide-y divide-[var(--border)]">
              <div className="p-5">
                <h2 className="mb-1 font-semibold text-[var(--foreground)]">Change Password</h2>
                <p className="mb-4 text-xs text-[var(--foreground-muted)]">Use a strong password with at least 8 characters, including uppercase, lowercase, and numbers.</p>
                <ChangePasswordForm />
              </div>

              <div className="p-5">
                <h2 className="mb-1 font-semibold text-[var(--foreground)]">Two-Factor Authentication</h2>
                <p className="mb-4 text-xs text-[var(--foreground-muted)]">Add an extra layer of security to your seller account.</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success-soft)]">
                    <Shield size={18} className="text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">2FA via Email OTP</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Verify your identity on each login via email.</p>
                  </div>
                  <button onClick={() => toast.info("2FA settings coming soon")} className="ml-auto rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background)]">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Change password sub-form ──────────────────────────────────────────────────

const pwdSchema = z.object({
  current: z.string().min(1, "Current password required"),
  next:    z.string().min(8, "Min 8 characters"),
  confirm: z.string(),
}).refine((d) => d.next === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function ChangePasswordForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(pwdSchema) });
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(data: any) {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.next });
      if (error) throw error;
      toast.success("Password updated successfully");
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm space-y-3">
      {[
        { name: "current", label: "Current Password" },
        { name: "next",    label: "New Password" },
        { name: "confirm", label: "Confirm New Password" },
      ].map((f) => (
        <div key={f.name}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{f.label}</label>
          <input type="password" {...register(f.name as any)} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:border-[var(--brand)] focus:outline-none" />
          {(errors as any)[f.name] && (
            <p className="mt-1 text-xs text-[var(--error)]">{(errors as any)[f.name]?.message}</p>
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit(onSubmit)}
        disabled={saving}
        className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Update Password
      </button>
    </div>
  );
}
