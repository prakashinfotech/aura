"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, LogOut, Camera } from "lucide-react";
import { z } from "zod";
import { createClient } from "@aura/db/client";
import { Button } from "@aura/ui/button";
import { Input } from "@aura/ui/input";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter valid 10-digit number")
    .optional()
    .or(z.literal("")),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", phone: "" },
  });

  React.useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("name, phone, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { name: string | null; phone: string | null; avatar_url: string | null } | null }) => {
        if (data) {
          reset({
            full_name: data.name ?? user.user_metadata?.["full_name"] ?? "",
            phone: data.phone ?? "",
          });
          setAvatarUrl(data.avatar_url ?? null);
        } else {
          reset({
            full_name: user.user_metadata?.["full_name"] ?? "",
            phone: "",
          });
        }
        setProfileLoaded(true);
      });
  }, [user, reset]);

  async function onSubmit(data: ProfileForm) {
    if (!user) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;
    const { error } = await db
      .from("profiles")
      .upsert({
        id: user.id,
        name: data.full_name,
        phone: data.phone || null,
        email: user.email,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) { toast.error("Failed to save profile"); return; }
    toast.success("Profile updated");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Upload failed: " + (json.error ?? res.statusText));
        return;
      }
      setAvatarUrl(`${json.url}?t=${Date.now()}`);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
  }

  if (isLoading || !profileLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  const initials = (user?.user_metadata?.["full_name"] ?? user?.email ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <h1 className="mb-6 text-lg font-bold text-[var(--foreground)]">My Profile</h1>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--brand)] text-xl font-bold text-white">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[var(--secondary)] text-white disabled:opacity-60"
          >
            {uploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            {user?.user_metadata?.["full_name"] ?? "Set your name"}
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">{user?.email}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            Click the camera icon to change photo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <Input
          label="Email"
          type="email"
          value={user?.email ?? ""}
          disabled
          hint="Email cannot be changed"
        />
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <Button
          variant="outline"
          size="md"
          className="gap-2 text-[var(--error)] hover:border-[var(--error)] hover:text-[var(--error)]"
          onClick={handleSignOut}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
