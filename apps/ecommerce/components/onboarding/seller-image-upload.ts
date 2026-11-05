import { createClient } from "@/supabase/client";

export const SELLER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type SellerImageCheck = "ok" | "not_image" | "too_large";

export function checkSellerImage(file: File): SellerImageCheck {
  if (!file.type.startsWith("image/")) return "not_image";
  if (file.size > SELLER_IMAGE_MAX_BYTES) return "too_large";
  return "ok";
}

/**
 * Uploads to the signed-in user's own folder of the public `sellers` bucket
 * and returns the public URL: `logos/<userId>/logo-<ts>.<ext>`,
 * `banners/<userId>/<ts>-banner.<ext>`. The bucket accepts writes only from
 * a signed-in user into their own `<folder>/<auth.uid()>/` (0152).
 */
export async function uploadSellerImage(file: File, kind: "logo" | "banner") {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id?.toLowerCase();
  if (!userId) throw new Error("not signed in");
  const ext = (file.name.split(".").pop() ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 16) || "png";
  const path =
    kind === "logo"
      ? `logos/${userId}/logo-${Date.now()}.${ext}`
      : `banners/${userId}/${Date.now()}-banner.${ext}`;

  const { error } = await supabase.storage
    .from("sellers")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;

  return supabase.storage.from("sellers").getPublicUrl(path).data.publicUrl;
}
