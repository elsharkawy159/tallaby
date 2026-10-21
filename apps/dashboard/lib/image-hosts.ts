/**
 * Hosts next/image may optimize. Shared by `next.config.ts` (remotePatterns)
 * and components that must fall back to an unoptimized image for any other
 * host, since next/image throws on unconfigured hosts.
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  "sakwqwocbccpyrmwjowq.supabase.co", // production Supabase Storage
  "cxqjrwjianxskhzmrkla.supabase.co", // staging Supabase Storage
  "images.unsplash.com",
  "images.pexels.com",
] as const;

/**
 * True when next/image can optimize `src` (relative paths count as local).
 * SVG and GIF are served as is (vectors and animations don't benefit).
 */
export function isOptimizableImage(src: string): boolean {
  if (/\.(svg|gif)(?:[?#]|$)/i.test(src)) return false;
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      (OPTIMIZED_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}
