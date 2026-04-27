// Uploads an image file to Supabase Storage (`media` bucket) and returns its public URL.
// Returns { url, error } — exactly one of the two will be non-null.

import { supabase } from "./supabase";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "media";
const FOLDER = "projects";

export async function uploadImage(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "只接受圖片檔（image/*）" };
  }
  if (file.size > MAX_BYTES) {
    return {
      url: null,
      error: `檔案太大（${(file.size / 1024 / 1024).toFixed(1)} MB），上限 5 MB`,
    };
  }

  // Sanitize filename for storage path safety + uniqueness via timestamp prefix.
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
  const path = `${FOLDER}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000", // 1 year — public asset
    upsert: false,
  });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
