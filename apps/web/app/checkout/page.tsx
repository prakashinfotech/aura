"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShoppingBag, ChevronRight, Loader2, Plus, MapPin } from "lucide-react";
import { z } from "zod";
import { Button } from "@aura/ui/button";
import { Input } from "@aura/ui/input";
import { PriceDisplay, formatInr } from "@aura/ui/price-display";
import { useCartStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@aura/db/client";
import type { Address } from "@aura/db/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

const addressSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile"),
  line1: z.string().min(5, "Address line 1 required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  type: z.enum(["home", "work", "other"]),
});
type AddressFormData = z.infer<typeof addressSchema>;

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: { order_id: string; payment_id: string };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

const ADDRESS_TYPES = [
  { value: "home" as const, icon: "🏠", label: "Home" },
  { value: "work" as const, icon: "💼", label: "Work" },
  { value: "other" as const, icon: "📍", label: "Other" },
];

function AddressTypeToggle({ register }: { register: UseFormRegister<AddressFormData> }) {
  return (
    <div className="mb-5 flex gap-2">
      {ADDRESS_TYPES.map(({ value, icon, label }) => (
        <label
          key={value}
          className="relative flex cursor-pointer select-none items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-soft)] has-[:checked]:text-[var(--brand)] has-[:checked]:shadow-[inset_0_0_0_1px_var(--brand)]"
        >
          <input type="radio" value={value} {...register("type")} className="sr-only" />
          <span>{icon}</span>
          {label}
        </label>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuth();

  // Address state
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = React.useState(true);
  const [selectedAddrId, setSelectedAddrId] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [paymentLoading, setPaymentLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { type: "home" },
  });

  const total = subtotal();
  const deliveryCharge = total >= 499 ? 0 : 49;
  const grandTotal = total + deliveryCharge;

  React.useEffect(() => {
    if (items.length === 0) router.replace("/");
  }, [items, router]);

  // Fetch this user's addresses from the addresses table (user_id FK + RLS double-guard)
  async function fetchAddresses(selectId?: string) {
    if (!user) { setAddrLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    const list: Address[] = (data as Address[] | null) ?? [];
    setAddresses(list);
    setAddrLoading(false);
    if (list.length === 0) {
      setShowAddForm(true);
    } else {
      const target = selectId
        ? (list.find((a) => a.id === selectId) ?? list.find((a) => a.is_default) ?? list[0])
        : (list.find((a) => a.is_default) ?? list[0]);
      if (target) setSelectedAddrId(target.id);
    }
  }

  React.useEffect(() => { void fetchAddresses(); }, [user]);

  // Save a new address, re-fetch, and auto-select the newly inserted one
  async function onSaveAddress(data: AddressFormData) {
    if (!user) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;
    const isFirst = addresses.length === 0;
    const { data: inserted, error } = await db
      .from("addresses")
      .insert({
        user_id: user.id,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        type: data.type,
        is_default: isFirst,
      })
      .select()
      .single() as { data: Address | null; error: unknown };
    setSaving(false);
    if (error || !inserted) { toast.error("Failed to save address"); return; }
    toast.success("Address saved");
    setShowAddForm(false);
    reset({ type: "home" });
    await fetchAddresses(inserted.id);
  }

  async function loadRazorpay(): Promise<boolean> {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    if (!selectedAddrId) {
      toast.error("Please select a delivery address");
      return;
    }
    const addr = addresses.find((a) => a.id === selectedAddrId);
    if (!addr) return;

    setPaymentLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Could not load payment gateway. Check your connection.");
      setPaymentLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal, address_id: selectedAddrId, address: addr }),
      });
      if (!res.ok) {
        toast.error("Failed to create order. Please try again.");
        setPaymentLoading(false);
        return;
      }

      const order = (await res.json()) as { id: string };

      const orderContext = {
        address_id: selectedAddrId,
        subtotal: total,
        delivery_charge: deliveryCharge,
        total: grandTotal,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          qty: i.qty,
          mrp: i.mrp,
          price: i.price,
          name: i.name,
          brand: i.brand,
          size: i.size,
          color: i.color,
        })),
      };

      const rzp = new window.Razorpay({
        key: process.env["NEXT_PUBLIC_RAZORPAY_KEY_ID"] ?? "",
        amount: grandTotal * 100,
        currency: "INR",
        name: "Aura Clone",
        description: `Order for ${items.length} item(s)`,
        order_id: order.id,
        prefill: { name: addr.name, contact: `+91${addr.phone}` },
        theme: { color: "#ff3f6c" },
        handler: async (response) => {
          try {
            const verify = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, ...orderContext }),
            });
            if (verify.ok) {
              clearCart();
              toast.success("Order placed successfully!");
              router.push("/account/orders");
            } else {
              const errBody = await verify.json().catch(() => ({})) as { error?: string };
              toast.error(errBody.error ?? "Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Network error during verification. Please contact support.");
          }
        },
      });

      rzp.on("payment.failed", async (response) => {
        await fetch("/api/orders/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.error.metadata.order_id,
            razorpay_payment_id: response.error.metadata.payment_id,
            payment_failed: true,
            ...orderContext,
          }),
        });
        toast.error(`Payment failed: ${response.error.description}. Please try again.`);
        setPaymentLoading(false);
      });

      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-[var(--max-width)] px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-[var(--foreground)]">Checkout</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* ── Left: delivery address ── */}
        <div>
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Delivery Address</h2>
              {addresses.length > 0 && !showAddForm && (
                <button
                  onClick={() => { setShowAddForm(true); reset({ type: "home" }); }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#6366f1] hover:underline"
                >
                  <Plus size={13} /> Add New
                </button>
              )}
            </div>

            {addrLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((n) => (
                  <div key={n} className="animate-pulse rounded-lg border border-[var(--border)] p-4">
                    <div className="mb-2 h-3 w-2/5 rounded bg-[var(--border)]" />
                    <div className="mb-1.5 h-3 w-3/5 rounded bg-[var(--border)]" />
                    <div className="h-3 w-2/5 rounded bg-[var(--border)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Saved addresses as radio buttons */}
                {addresses.map((addr) => {
                  const isSelected = selectedAddrId === addr.id && !showAddForm;
                  return (
                    <label
                      key={addr.id}
                      className={[
                        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                        isSelected
                          ? "border-[#6366f1] bg-pink-50/40"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-gray-300",
                        showAddForm ? "pointer-events-none opacity-50" : "",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="delivery-address"
                        value={addr.id}
                        checked={isSelected}
                        onChange={() => setSelectedAddrId(addr.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#6366f1]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--foreground)]">{addr.name}</span>
                          {addr.type && (
                            <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500">
                              {addr.type}
                            </span>
                          )}
                          {addr.is_default && (
                            <span className="rounded-full bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">📞 {addr.phone}</p>
                      </div>
                    </label>
                  );
                })}

                {/* Add new address form */}
                {showAddForm && (
                  <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand)] shadow-[var(--shadow-sm)]">
                    {/* Form header */}
                    <div className="flex items-center gap-3 border-b border-[var(--brand)]/20 bg-[var(--brand-soft)] px-5 py-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white">
                        <MapPin size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {addresses.length === 0 ? "Add delivery address" : "Add new address"}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {addresses.length === 0
                            ? "Where should we deliver your order?"
                            : "This will be saved to your account"}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit(onSaveAddress)} className="bg-[var(--surface)] px-5 py-5">
                      {/* ── Contact ── */}
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                        Contact
                      </p>
                      <div className="mb-5 grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Full Name"
                          placeholder="Recipient's full name"
                          error={errors.name?.message}
                          {...register("name")}
                        />
                        <Input
                          label="Mobile Number"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          error={errors.phone?.message}
                          {...register("phone")}
                        />
                      </div>

                      {/* ── Address ── */}
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                        Address
                      </p>
                      <div className="mb-5 grid gap-4">
                        <Input
                          label="Address Line 1"
                          placeholder="Flat no., Building name, Street"
                          error={errors.line1?.message}
                          {...register("line1")}
                        />
                        <Input
                          label="Address Line 2"
                          placeholder="Area, Landmark (optional)"
                          {...register("line2")}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Input
                            label="City"
                            placeholder="City"
                            error={errors.city?.message}
                            {...register("city")}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[var(--foreground)]">State</label>
                            <select
                              {...register("state")}
                              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--brand)] focus:outline-[2px] focus:outline-[var(--brand)] focus:outline-offset-0"
                            >
                              <option value="">Select state</option>
                              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.state && (
                              <p className="text-xs text-[var(--error)]">{errors.state.message}</p>
                            )}
                          </div>
                          <Input
                            label="Pincode"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit pincode"
                            error={errors.pincode?.message}
                            {...register("pincode")}
                          />
                        </div>
                      </div>

                      {/* ── Address type ── */}
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]">
                        Save as
                      </p>
                      <AddressTypeToggle register={register} />

                      {/* ── Actions ── */}
                      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                        {addresses.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            className="w-full sm:w-auto"
                            onClick={() => { setShowAddForm(false); reset({ type: "home" }); }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          disabled={saving}
                          loading={saving}
                          className="w-full sm:w-auto sm:min-w-[160px]"
                        >
                          {saving ? "Saving…" : "Save & use this address"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Fallback empty state (only if somehow form is closed with no addresses) */}
                {addresses.length === 0 && !showAddForm && (
                  <div className="flex flex-col items-center py-10 text-center">
                    <MapPin size={28} className="mb-3 text-[#6366f1]" strokeWidth={1.5} />
                    <p className="text-sm text-[var(--foreground-muted)]">No saved addresses. Add one to continue.</p>
                    <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowAddForm(true)}>
                      Add Address
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
              <ShoppingBag size={18} />
              Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
            </h2>

            <div className="flex flex-col divide-y divide-[var(--border)]">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 py-3">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--background)]">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground-muted)]">{item.brand}</p>
                    <p className="line-clamp-2 text-sm text-[var(--foreground)]">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {item.color && (
                        <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border border-black/10"
                            style={{ background: item.color.startsWith("#") ? item.color : undefined }}
                          />
                          {item.color}
                        </span>
                      )}
                      <span className="text-xs text-[var(--foreground-muted)]">Size: {item.size}</span>
                      <span className="text-xs text-[var(--foreground-muted)]">Qty: {item.qty}</span>
                    </div>
                  </div>
                  <PriceDisplay price={item.price} size="sm" />
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--foreground-muted)]">Total MRP</span>
                <span>{formatInr(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground-muted)]">Delivery</span>
                {deliveryCharge === 0 ? (
                  <span className="font-medium text-[var(--success)]">FREE</span>
                ) : (
                  <span>{formatInr(deliveryCharge)}</span>
                )}
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold">
                <span>Total Amount</span>
                <span>{formatInr(grandTotal)}</span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={paymentLoading || !selectedAddrId || showAddForm || addrLoading}
            onClick={handlePayment}
          >
            {paymentLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </>
            ) : (
              <>
                Pay {formatInr(grandTotal)}
                <ChevronRight size={16} />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-[var(--foreground-muted)]">
            Secured by Razorpay · 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}
