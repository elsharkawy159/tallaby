/**
 * Where the editions' own photos live (ROADMAP F-90, plan §3.2; owner,
 * 2026-11-11): the public `library-media` bucket, folder `editions/<niche>/`,
 * one WebP per demo product named after its slug. They are generated
 * white-background packshots (no stock site has them for most trades). The
 * bucket is public and holds platform media only, so the URL is a constant
 * and every environment reads the same files. No React here.
 */
export const EDITION_MEDIA_HOST = "sakwqwocbccpyrmwjowq.supabase.co";

const BASE = `https://${EDITION_MEDIA_HOST}/storage/v1/object/public/library-media/editions`;

/** The packshot of a pack's demo product: `editionPhoto("dresses", "black-satin-slip-dress")`. */
export function editionPhoto(niche: string, slug: string): string {
  return `${BASE}/${niche}/${slug}.webp`;
}
