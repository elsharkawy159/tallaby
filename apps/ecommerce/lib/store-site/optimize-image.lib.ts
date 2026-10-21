import { getImageProps } from "next/image";
import type { OptimizedImage } from "@workspace/store-sections/render";

/**
 * Hosts in next.config.mjs `images.remotePatterns` that storefront images come
 * from: our Supabase Storage (seller uploads, template thumbnails) and the
 * stock photo hosts the templates' demo images use.
 */
const STORE_IMAGE_HOSTS = new Set([
  "sakwqwocbccpyrmwjowq.supabase.co", // production
  "cxqjrwjianxskhzmrkla.supabase.co", // staging
  "images.pexels.com",
  "images.unsplash.com",
]);

/** True when next/image may resize `url`: local files or an allowed https host, never SVG or GIF. */
export function isOptimizableStoreImage(url: string): boolean {
  if (/\.(svg|gif)(?:[?#]|$)/i.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && STORE_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * `RenderContext.optimizeImage` for storefronts: next/image's resized
 * `src`/`srcSet` for the rendered `sizes`, or the URL as is for any other host
 * (seller-imported product images can be anywhere).
 */
export function optimizeStoreImage(url: string, sizes: string): OptimizedImage {
  if (!isOptimizableStoreImage(url)) return { src: url };
  const { props } = getImageProps({ src: url, alt: "", fill: true, sizes });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}
