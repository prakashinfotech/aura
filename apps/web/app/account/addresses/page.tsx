"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, MapPin, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@aura/db/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@aura/ui/button";
import { Input } from "@aura/ui/input";
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
type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { type: "home" as const },
  });

  async function fetchAddresses() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses(data ?? []);
    setLoading(false);
  }

  React.useEffect(() => { void fetchAddresses(); }, [user]);

  function openAddForm() {
    setEditId(null);
    reset({ type: "home" });
    setFormOpen(true);
  }

  function openEditForm(addr: Address) {
    setEditId(addr.id);
    reset({
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: (addr.type as "home" | "work" | "other" | null) ?? "home",
    });
    setFormOpen(true);
  }

  async function onSubmit(data: AddressForm) {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const payload = {
      name: data.name,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      type: data.type,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await db
        .from("addresses")
        .update(payload)
        .eq("id", editId)
        .eq("user_id", user.id);
      if (error) { toast.error("Failed to update address"); setSaving(false); return; }
      toast.success("Address updated");
    } else {
      const isFirst = addresses.length === 0;
      const { error } = await db
        .from("addresses")
        .insert({ ...payload, user_id: user.id, is_default: isFirst });
      if (error) { toast.error("Failed to save address"); setSaving(false); return; }
      toast.success("Address saved");
    }

    setSaving(false);
    setFormOpen(false);
    void fetchAddresses();
  }

  async function handleDelete(id: string) {
    if (!user) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) { toast.error("Failed to delete address"); }
    else { toast.success("Address deleted"); void fetchAddresses(); }
    setDeletingId(null);
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;
    await db.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await db.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
    void fetchAddresses();
    toast.success("Default address updated");
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--foreground)]">Saved Addresses</h1>
        {!formOpen && (
          <Button variant="outline" size="sm" className="gap-2 border-[#6366f1] text-[#6366f1] hover:bg-pink-50" onClick={openAddForm}>
            <Plus size={14} />
            Add New
          </Button>
        )}
      </div>

      {/* Add/Edit form */}
      {formOpen && (
        <div className="mb-6 rounded-lg border border-[#6366f1]/30 bg-pink-50/30 p-4">
          <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]">
            {editId ? "Edit Address" : "Add New Address"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
            <Input label="Full Name" placeholder="Recipient name" error={errors.name?.message} {...register("name")} />
            <Input label="Mobile Number" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit number" error={errors.phone?.message} {...register("phone")} />
            <div className="sm:col-span-2">
              <Input label="Address Line 1" placeholder="Flat / House no. / Building / Street" error={errors.line1?.message} {...register("line1")} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Address Line 2 (optional)" placeholder="Locality / Area / Colony" error={errors.line2?.message} {...register("line2")} />
            </div>
            <Input label="City" placeholder="City" error={errors.city?.message} {...register("city")} />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">State</label>
              <select
                {...register("state")}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] focus:border-[#6366f1] focus:outline-none"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-[var(--error)]">{errors.state.message}</p>}
            </div>
            <Input label="Pincode" inputMode="numeric" maxLength={6} placeholder="6-digit pincode" error={errors.pincode?.message} {...register("pincode")} />
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Address Type</label>
              <div className="flex gap-3">
                {(["home", "work", "other"] as const).map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm capitalize text-[var(--foreground)]">
                    <input type="radio" value={t} {...register("type")} className="accent-[#6366f1]" />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" size="md" disabled={saving} className="min-w-[120px]">
                {saving ? <Loader2 size={14} className="animate-spin" /> : editId ? "Update Address" : "Save Address"}
              </Button>
              <Button type="button" variant="outline" size="md" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !formOpen ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
            <MapPin size={28} className="text-[#6366f1]" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[var(--foreground)]">No addresses saved yet</p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Add an address to speed up checkout</p>
          <Button variant="primary" size="md" className="mt-5" onClick={openAddForm}>
            Add Address
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => openEditForm(addr)}
              onDelete={() => handleDelete(addr.id)}
              onSetDefault={() => handleSetDefault(addr.id)}
              deleting={deletingId === addr.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressCard({
  address, onEdit, onDelete, onSetDefault, deleting,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  deleting: boolean;
}) {
  return (
    <div className={`relative rounded-lg border p-4 transition-colors ${address.is_default ? "border-[#6366f1] bg-pink-50/40" : "border-[var(--border)] bg-white"}`}>
      {address.is_default && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#6366f1] px-2 py-0.5 text-[10px] font-bold text-white">
          <Star size={8} fill="white" /> DEFAULT
        </span>
      )}

      <div className="flex items-start gap-3">
        <MapPin size={16} className="mt-0.5 shrink-0 text-[#6366f1]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[var(--foreground)]">{address.name}</p>
            {address.type && (
              <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500">
                {address.type}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">
            {address.city}, {address.state} – {address.pincode}
          </p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">📞 {address.phone}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
        <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-[#6366f1] hover:underline">
          <Pencil size={12} /> Edit
        </button>
        <button onClick={onDelete} disabled={deleting} className="flex items-center gap-1 text-xs font-semibold text-[var(--error)] hover:underline disabled:opacity-50">
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {deleting ? "Deleting…" : "Delete"}
        </button>
        {!address.is_default && (
          <button onClick={onSetDefault} className="ml-auto text-xs font-semibold text-gray-500 hover:text-[#6366f1]">
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
}
