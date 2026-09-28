import { createClient } from "@/supabase/client";

export const SELLER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type SellerImageCheck = "ok" | "not_image" | "too_large";

export function checkSellerImage(file: File): SellerImageCheck {
  if (!file.type.startsWith("image/")) return "not_image";
  if (file.size > SELLER_IMAGE_MAX_BYTES) return "too_large";
  return "ok";
}

/**
 * Uploads to the public `sellers` bucket and returns the public URL.
 * Paths follow the existing layout: `logos/logo-<ts>.<ext>`,
 * `banners/<ts>-banner.<ext>`.
 */
export async function uploadSellerImage(file: File, kind: "logo" | "banner") {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path =
    kind === "logo"
      ? `logos/logo-${Date.now()}.${ext}`
      : `banners/${Date.now()}-banner.${ext}`;

  const { error } = await supabase.storage
    .from("sellers")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  return supabase.storage.from("sellers").getPublicUrl(path).data.publicUrl;
}
