import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@aura/db/server";
import { validateFileSignature } from "@/lib/file-validation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  // Verify the caller is authenticated
  const supabaseUser = await createClient();
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 2 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // ✅ SECURITY: Validate file signature (magic bytes) to prevent spoofing
  const ext = validateFileSignature(new Uint8Array(buffer), file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Invalid image format. File signature does not match MIME type." },
      { status: 400 }
    );
  }

  const path = `${user.id}/avatar.${ext}`;

  // Use admin client (service role key as bearer token) to bypass RLS.
  // Safe: the caller's identity was verified above via the user session.
  const supabaseAdmin = createAdminClient();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

  // Persist avatar_url on the profile row
  await (supabaseAdmin as any).from("profiles").upsert({
    id: user.id,
    avatar_url: publicUrl,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ url: publicUrl });
}
