"use client";

import { PLATFORM_BLOG_BUCKET } from "@workspace/lib/platform-blog";
import { createClient } from "@/supabase/client";
import { generateImageName, getPublicUrl } from "@/lib/utils";

/** Same limits as the `platform-blog` bucket (0073). */
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads a blog image from the browser to the public `platform-blog` bucket
 * (storage policies allow verified admins only) and returns its path.
 * Throws a readable Error on a bad file or a failed upload.
 */
export async function uploadBlogImage(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 2 MB or smaller.");
  const path = generateImageName(file);
  const { error } = await createClient().storage.from(PLATFORM_BLOG_BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message || "Upload failed.");
  return path;
}

/** Public URL of a stored path (absolute URLs pass through). */
export function blogImageUrl(value: string): string {
  if (!value) return "";
  return /^https?:\/\//.test(value) ? value : getPublicUrl(value, PLATFORM_BLOG_BUCKET);
}
