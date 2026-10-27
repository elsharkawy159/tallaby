/** Contact details and outbound links shared by the header, footer and pages. */

/**
 * Support WhatsApp: the @tallaby username, or a phone number in international
 * digits without "+" (e.g. 2010XXXXXXXX) from NEXT_PUBLIC_SUPPORT_WHATSAPP,
 * which wins when set.
 */
const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
const hasWhatsAppNumber = SUPPORT_WHATSAPP.length >= 10;
const SUPPORT_WHATSAPP_USERNAME = "tallaby";

export const CONTACT = {
  email: "tallabycommerce@gmail.com",
  whatsapp: `https://wa.me/${hasWhatsAppNumber ? SUPPORT_WHATSAPP : SUPPORT_WHATSAPP_USERNAME}`,
  whatsappHandle: hasWhatsAppNumber ? `+${SUPPORT_WHATSAPP}` : `@${SUPPORT_WHATSAPP_USERNAME}`,
} as const;

export const ROOT_DOMAIN = "tallaby.com";

const withSlash = (url: string) => (url.endsWith("/") ? url : `${url}/`);

/** Seller dashboard (signup, login). */
export const DASHBOARD_URL = withSlash(process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.tallaby.com/");

/**
 * Public origin of this site, for canonical URLs and the sitemap. Falls back
 * like robots.txt (lib/constants SITEMAP_BASE_URL) so a missing variable in
 * production never publishes localhost canonicals.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://www.tallaby.com" : "http://localhost:3000")
).replace(/\/$/, "");

export const LOGIN_URL = `${DASHBOARD_URL}login`;

export type SocialId = "facebook" | "instagram" | "tiktok" | "youtube" | "x" | "linkedin" | "pinterest" | "threads";

// Handles from the "Follow Us" design; Facebook, LinkedIn and Threads links from the owner (2026-10-27).
export const SOCIAL_LINKS: Record<SocialId, { href: string; handle: string; label: string }> = {
  facebook: { href: "https://www.facebook.com/usetallaby", handle: "usetallaby", label: "Facebook" },
  instagram: { href: "https://www.instagram.com/usetallaby", handle: "@usetallaby", label: "Instagram" },
  tiktok: { href: "https://www.tiktok.com/@tallaby_", handle: "@tallaby_", label: "TikTok" },
  youtube: { href: "https://www.youtube.com/@usetallaby", handle: "@usetallaby", label: "YouTube" },
  x: { href: "https://x.com/usetallaby", handle: "@usetallaby", label: "X" },
  linkedin: { href: "https://www.linkedin.com/company/tallaby", handle: "tallaby", label: "LinkedIn" },
  pinterest: { href: "https://www.pinterest.com/tallabycommerce", handle: "tallabycommerce", label: "Pinterest" },
  threads: { href: "https://www.threads.net/@usetallaby", handle: "@usetallaby", label: "Threads" },
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

/** "bags-by-sara" → "Bags By Sara". */
export function prettyName(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

export const hasArabic = (value: string) => /[؀-ۿ]/.test(value);
