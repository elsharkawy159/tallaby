import { EMAIL_CONTACT, EMAIL_SITE_URL, emailColor } from "../theme/tokens.js";

/**
 * The visual identity an email is rendered with. Platform mail (sellers, auth,
 * marketplace orders) uses Tallaby's; a storefront order's customer mail uses
 * the store's own colours, font, logo and name (see `storeEmailBrand`).
 */
export interface EmailBrand {
  /** Shown in the header when there is no logo, and in the footer. */
  name: string;
  homeUrl: string;
  /** Absolute logo URL. Without one the header shows the name (or Tallaby's wordmark). */
  logoUrl?: string | null;
  /** Header background, headings, links. */
  primary: string;
  /** Header stripe and CTA background. */
  accent: string;
  /** Text on the accent (CTA label). */
  onAccent: string;
  /** Text on the primary (header). */
  onPrimary: string;
  /** Muted text on the primary (header meta). */
  onPrimaryMuted: string;
  /** Tinted panel background (meta grid, info callout). */
  tint: string;
  /** Labels inside tinted panels. */
  tintLabel: string;
  /** Tinted panel border. */
  tintBorder: string;
  /** Card border. */
  border: string;
  /** Page background. */
  canvas: string;
  /** Font stack for body text, before the locale fallback. */
  fontFamily?: string | null;
  /** Google Fonts stylesheet for `fontFamily`, when it is a web font. */
  fontUrl?: string | null;
  supportEmail: string;
  /** True for Tallaby's own identity: draws the "t·allaby" wordmark. */
  isPlatform: boolean;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function parseHex(value: string): [number, number, number] | null {
  const raw = value.trim();
  if (!HEX.test(raw)) return null;
  let hex = raw.slice(1);
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  const n = Number.parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes `color` toward `target` by `amount` (0..1). Invalid input returns `color`. */
export function mixHex(color: string, target: string, amount: number): string {
  const a = parseHex(color);
  const b = parseHex(target);
  if (!a || !b) return color;
  return toHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

function luminance(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Near-black or white, whichever reads better on `background`. */
export function readableOn(background: string): string {
  return luminance(background) > 0.45 ? "#171717" : "#ffffff";
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value.trim());
}

export const PLATFORM_BRAND: EmailBrand = {
  name: "Tallaby",
  homeUrl: EMAIL_SITE_URL,
  logoUrl: null,
  primary: emailColor.primary,
  accent: emailColor.accent,
  // The design keeps a white label on the gold CTA for Tallaby's own mail.
  onAccent: "#ffffff",
  onPrimary: "#ffffff",
  onPrimaryMuted: "#cfdde1",
  tint: "#eef3f4",
  tintLabel: "#2c6e80",
  tintBorder: "#cfdde1",
  border: emailColor.border,
  canvas: emailColor.background,
  fontFamily: null,
  fontUrl: null,
  supportEmail: EMAIL_CONTACT,
  isPlatform: true,
};

export interface StoreBrandInput {
  name: string;
  homeUrl: string;
  logoUrl?: string | null;
  primary?: string | null;
  accent?: string | null;
  fontFamily?: string | null;
  fontUrl?: string | null;
  supportEmail?: string | null;
}

/**
 * A store's identity for its customers' mail. Missing or invalid colours fall
 * back to Tallaby's, and every derived shade comes from the store's primary so
 * the panels match the storefront.
 */
export function storeEmailBrand(input: StoreBrandInput): EmailBrand {
  const primary = isHexColor(input.primary) ? input.primary.trim() : PLATFORM_BRAND.primary;
  const accent = isHexColor(input.accent) ? input.accent.trim() : primary;
  const onPrimary = readableOn(primary);
  return {
    name: input.name.trim() || PLATFORM_BRAND.name,
    homeUrl: input.homeUrl,
    logoUrl: input.logoUrl?.startsWith("https://") ? input.logoUrl : null,
    primary,
    accent,
    onAccent: readableOn(accent),
    onPrimary,
    onPrimaryMuted: onPrimary === "#ffffff" ? mixHex(primary, "#ffffff", 0.78) : mixHex(primary, "#000000", 0.55),
    tint: mixHex(primary, "#ffffff", 0.92),
    tintLabel: luminance(primary) > 0.45 ? mixHex(primary, "#000000", 0.55) : mixHex(primary, "#ffffff", 0.15),
    tintBorder: mixHex(primary, "#ffffff", 0.78),
    border: "#e5e5e5",
    canvas: PLATFORM_BRAND.canvas,
    fontFamily: input.fontFamily?.trim() || null,
    fontUrl: input.fontUrl?.startsWith("https://fonts.googleapis.com/") ? input.fontUrl : null,
    supportEmail: input.supportEmail?.trim() || PLATFORM_BRAND.supportEmail,
    isPlatform: false,
  };
}
