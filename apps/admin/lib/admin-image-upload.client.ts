"use client";

import { createClient } from "@/supabase/client";
import { generateImageName } from "@/lib/utils";
import { createAdminImageUploadUrl } from "./admin-image-upload.server";

/**
 * Uploads one Admin image (product, brand or category) through a signed
 * upload URL from the server (the buckets refuse direct writes, 0153).
 * Resolves to the stored path; throws on failure.
 */
export async function uploadAdminImage(bucket: "products" | "brands" | "categories", file: File): Promise<string> {
  const fileName = generateImageName(file).split("/").pop() ?? "";
  const signed = await createAdminImageUploadUrl(bucket, fileName);
  if (!signed.success) throw new Error(`upload not signed: ${signed.error}`);
  const { data, error } = await createClient()
    .storage.from(bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, { cacheControl: "31536000", contentType: file.type || undefined });
  if (error) throw error;
  return data.path;
}
