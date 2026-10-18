/** Contact details and outbound links shared by the header, footer and pages. */

export const CONTACT = {
  phone: "01003272830",
  phoneIntl: "+201003272830",
  phoneDisplay: "+20 100 327 2830",
  email: "tallabycommerce@gmail.com",
  whatsapp: "https://wa.me/201003272830",
} as const;

export const ROOT_DOMAIN = "tallaby.com";

const withSlash = (url: string) => (url.endsWith("/") ? url : `${url}/`);

/** Seller dashboard (signup, login). Same env var as apps/ecommerce. */
export const DASHBOARD_URL = withSlash(process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.tallaby.com/");

/** The marketplace, until the Phase 10 domain move (PLAN.md §16). */
export const MARKETPLACE_URL = withSlash(process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://www.tallaby.com/");

/** Public origin of this site, for canonical URLs and the sitemap. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004").replace(/\/$/, "");

export const LOGIN_URL = `${DASHBOARD_URL}login`;

export type SocialId = "instagram" | "tiktok" | "youtube" | "x" | "pinterest" | "threads";

// Handles from the "Follow Us" design. Facebook and LinkedIn are not listed:
// the design had placeholder links for them.
export const SOCIAL_LINKS: Record<SocialId, { href: string; handle: string; label: string }> = {
  instagram: { href: "https://www.instagram.com/usetallaby", handle: "@usetallaby", label: "Instagram" },
  tiktok: { href: "https://www.tiktok.com/@tallaby_", handle: "@tallaby_", label: "TikTok" },
  youtube: { href: "https://www.youtube.com/@usetallaby", handle: "@usetallaby", label: "YouTube" },
  x: { href: "https://x.com/usetallaby", handle: "@usetallaby", label: "X" },
  pinterest: { href: "https://www.pinterest.com/tallabycommerce", handle: "tallabycommerce", label: "Pinterest" },
  threads: { href: "https://www.threads.com/@usetallaby", handle: "@usetallaby", label: "Threads" },
};

/**
 * Turns free text into a store-link candidate while typing. Final rules
 * (length, reserved names, `--`) are enforced by `validateSubdomain` on the server.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-/, "")
    .slice(0, 32);
}

export const hasArabic = (value: string) => /[؀-ۿ]/.test(value);
