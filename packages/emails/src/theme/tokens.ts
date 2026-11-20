/**
 * Light-theme tokens mirrored from `packages/ui/src/styles/globals.css`.
 * Email clients cannot use CSS variables, so values are hex.
 */
export const emailColor = {
  background: "#fafaf8",
  foreground: "#333333",
  primary: "#145163",
  primaryForeground: "#fafafa",
  secondary: "#89a8b1",
  muted: "#f7f7f7",
  mutedForeground: "#808080",
  accent: "#fdad28",
  border: "#e2cbcb",
  card: "#ffffff",
  success: "#0f766e",
} as const;

export const emailRadius = {
  sm: "6px",
  md: "8px",
  lg: "10px",
} as const;

export const emailFont = {
  sans: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  arabic: 'Tahoma, Arial, "Noto Kufi Arabic", sans-serif',
} as const;

export const EMAIL_CONTACT = "omar@tallaby.com";
export const EMAIL_SITE_URL = "https://www.tallaby.com";

/** Tallaby's WhatsApp, offered beside the support email in seller mail. */
export const EMAIL_WHATSAPP_URL = "https://wa.me/@tallaby";

export interface EmailSocialLink {
  id: "facebook" | "instagram" | "tiktok" | "youtube" | "x" | "linkedin";
  label: string;
  href: string;
  /** 64×64 PNG (shown at 32×32) served by apps/marketing (`public/email/social`). */
  iconUrl: string;
}

const socialIcon = (id: EmailSocialLink["id"]) => `${EMAIL_SITE_URL}/email/social/${id}.png`;

/**
 * Tallaby's social accounts, shown in the footer of every email. Mirrors
 * `SOCIAL_LINKS` in `apps/marketing/lib/marketing/site.lib.ts`.
 */
export const EMAIL_SOCIAL_LINKS: readonly EmailSocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/usetallaby", iconUrl: socialIcon("facebook") },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/usetallaby", iconUrl: socialIcon("instagram") },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@tallaby_", iconUrl: socialIcon("tiktok") },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@usetallaby", iconUrl: socialIcon("youtube") },
  { id: "x", label: "X", href: "https://x.com/usetallaby", iconUrl: socialIcon("x") },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/tallaby", iconUrl: socialIcon("linkedin") },
];
