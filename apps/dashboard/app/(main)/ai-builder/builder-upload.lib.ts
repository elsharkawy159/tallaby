import type { BUILDER_IMAGE_TYPES } from "./builder.dto";

/** The real type of an uploaded image from its first bytes. Null for anything else (no SVG, no HTML renamed .jpg). */
export function imageTypeOf(bytes: Uint8Array): (typeof BUILDER_IMAGE_TYPES)[number] | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** A path in the "products" bucket this seller's builder uploaded, and no other. */
export const isOwnBuilderPath = (path: string, sellerId: string) => path.startsWith(`ai-builder/${sellerId}/`) && !path.includes("..");

/** The public URL of a stored photo in the "products" bucket. */
export function builderPhotoUrl(path: string, supabaseUrl: string | null | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL): string {
  if (!supabaseUrl) return path;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/products/${path.split("/").map(encodeURIComponent).join("/")}`;
}
