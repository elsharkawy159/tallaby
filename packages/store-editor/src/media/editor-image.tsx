import Image, { type ImageProps } from "next/image";

/**
 * Hosts both editor apps (dashboard, admin) allow in `images.remotePatterns`:
 * our Supabase Storage and the stock photo CDNs.
 */
const EDITOR_IMAGE_HOSTS = new Set([
  "sakwqwocbccpyrmwjowq.supabase.co", // production
  "cxqjrwjianxskhzmrkla.supabase.co", // staging
  "images.pexels.com",
  "images.unsplash.com",
]);

/** True when next/image may resize `src`: an allowed https host, never SVG or GIF. */
export function isEditorOptimizable(src: string): boolean {
  if (/\.(svg|gif)(?:[?#]|$)/i.test(src)) return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && EDITOR_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * next/image for editor media: resized when the host is allowed, served as is
 * otherwise (seller-entered URLs, video stills), since next/image throws on
 * unconfigured hosts.
 */
export function EditorImage({ src, unoptimized, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image {...props} src={src} unoptimized={unoptimized || !isEditorOptimizable(src)} />;
}
