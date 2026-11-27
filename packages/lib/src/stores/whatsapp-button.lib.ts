import { formatPhone, phoneDigits } from "@workspace/store-sections/social";
import { salesPopupPageKind } from "./sales-popup.lib";

/**
 * WhatsApp button app (owner request, 2026-11-27): a floating WhatsApp chat
 * button at the bottom-right or bottom-left of the store website. Pure, safe
 * on the client.
 *
 * Not installed by default: the storefront shows it only while the store has a
 * live `whatsapp_button` row in `store_app_installs`. Settings live in
 * `stores.settings.whatsappButton` (other keys kept); no migration. Every
 * field is re-validated on read and on save.
 */

export const WHATSAPP_BUTTON_APP = "whatsapp_button";

export const WHATSAPP_BUTTON_POSITIONS = ["right", "left"] as const;
export type WhatsAppButtonPosition = (typeof WHATSAPP_BUTTON_POSITIONS)[number];

export const WHATSAPP_BUTTON_DEVICES = ["all", "desktop", "mobile"] as const;
export type WhatsAppButtonDevices = (typeof WHATSAPP_BUTTON_DEVICES)[number];

export const WHATSAPP_BUTTON_SIZES = ["small", "medium", "large"] as const;
export type WhatsAppButtonSize = (typeof WHATSAPP_BUTTON_SIZES)[number];

/** The button's diameter in px. */
export const WHATSAPP_BUTTON_SIZE_PX: Readonly<Record<WhatsAppButtonSize, number>> = { small: 48, medium: 56, large: 64 };

/** Distance from the bottom of the screen in px (the phone's safe area is added on top). */
export const WHATSAPP_BUTTON_OFFSET = { min: 0, max: 200 } as const;
export const WHATSAPP_BUTTON_MESSAGE_MAX = 300;
export const WHATSAPP_BUTTON_LABEL_MAX = 40;

export type StoreWhatsAppButtonSettings = {
  /** Null: the store's contact WhatsApp number (else its phone). Otherwise `01…` or `+<country code>…`. */
  phone: string | null;
  /** Pre-filled chat text ("" for none). */
  message: string;
  /** "right" is the visual right in Arabic and English alike. */
  position: WhatsAppButtonPosition;
  devices: WhatsAppButtonDevices;
  size: WhatsAppButtonSize;
  offsetDesktop: number;
  offsetMobile: number;
  /** Short text next to the icon on desktop ("" for icon only). */
  label: string;
  /** Also on the cart and checkout pages. Account, orders and sign-in never show it. */
  showOnCart: boolean;
};

/**
 * Defaults: 24px on desktop; 88px on phones, which clears the 64px bottom
 * navigation and the floating cart bar (12px + 56px) of the storefront.
 */
export const WHATSAPP_BUTTON_DEFAULTS: Readonly<StoreWhatsAppButtonSettings> = {
  phone: null,
  message: "",
  position: "right",
  devices: "all",
  size: "medium",
  offsetDesktop: 24,
  offsetMobile: 88,
  label: "",
  showOnCart: false,
};

function pick<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function clampOffset(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(WHATSAPP_BUTTON_OFFSET.max, Math.max(WHATSAPP_BUTTON_OFFSET.min, Math.round(n)));
}

// Control characters (line breaks are kept in the message, not in the label).
const CONTROL_RE = /[\u0000-\u0009\u000B-\u001F\u007F]/g;

function cleanText(value: unknown, max: number, singleLine: boolean): string {
  if (typeof value !== "string") return "";
  let text = value.replace(CONTROL_RE, "");
  if (singleLine) text = text.replace(/\s+/g, " ");
  return text.trim().slice(0, max).trim();
}

/** A saved number in the form people read (`01…` / `+…`), or null for none or an invalid one. */
export function cleanWhatsAppButtonPhone(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > 40) return null;
  return formatPhone(value);
}

/** The store's WhatsApp button settings from `stores.settings`, every field re-validated. */
export function parseStoreWhatsAppButton(settings: unknown): StoreWhatsAppButtonSettings {
  const raw = (settings as { whatsappButton?: unknown } | null | undefined)?.whatsappButton;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...WHATSAPP_BUTTON_DEFAULTS };
  const v = raw as Record<string, unknown>;
  const d = WHATSAPP_BUTTON_DEFAULTS;
  return {
    phone: cleanWhatsAppButtonPhone(v.phone),
    message: cleanText(v.message, WHATSAPP_BUTTON_MESSAGE_MAX, false),
    position: pick(WHATSAPP_BUTTON_POSITIONS, v.position, d.position),
    devices: pick(WHATSAPP_BUTTON_DEVICES, v.devices, d.devices),
    size: pick(WHATSAPP_BUTTON_SIZES, v.size, d.size),
    offsetDesktop: clampOffset(v.offsetDesktop, d.offsetDesktop),
    offsetMobile: clampOffset(v.offsetMobile, d.offsetMobile),
    label: cleanText(v.label, WHATSAPP_BUTTON_LABEL_MAX, true),
    showOnCart: v.showOnCart === true,
  };
}

export type WhatsAppButtonInputResult =
  | { success: true; settings: StoreWhatsAppButtonSettings }
  | { success: false; error: "invalidPhone" };

/**
 * A save from the dashboard, cleaned the same way (never trusted as sent). A
 * typed number that isn't valid is refused rather than silently dropped.
 */
export function normalizeWhatsAppButtonInput(input: unknown): WhatsAppButtonInputResult {
  const phone = (input as { phone?: unknown } | null | undefined)?.phone;
  if (typeof phone === "string" && phone.trim() && !cleanWhatsAppButtonPhone(phone)) return { success: false, error: "invalidPhone" };
  return { success: true, settings: parseStoreWhatsAppButton({ whatsappButton: input }) };
}

/**
 * The number the button opens, as wa.me digits (`201…`): the app's own number,
 * else the store's contact WhatsApp, else its phone. Null when none is usable.
 */
export function whatsAppButtonDigits(
  settings: Pick<StoreWhatsAppButtonSettings, "phone">,
  contact: { whatsapp?: string | null; phone?: string | null },
): string | null {
  for (const value of [settings.phone, contact.whatsapp, contact.phone]) {
    const digits = typeof value === "string" && value.trim() && value.length <= 40 ? phoneDigits(value) : null;
    if (digits) return digits;
  }
  return null;
}

/** `https://wa.me/<digits>` plus the URL-encoded pre-filled text. */
export function whatsAppButtonHref(digits: string, message: string): string {
  const text = message.trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

const CART_SEGMENTS = new Set(["cart", "checkout"]);

/**
 * Whether the button shows on a store-website path (locale prefix already
 * stripped). Uses the sales pop-up's page kinds; of the pages that never show
 * the pop-up, only cart and checkout can show the button, and only with
 * `showOnCart`. Account, orders, sign-in, wishlist and payment pages never do.
 */
export function whatsAppButtonShowsOn(settings: Pick<StoreWhatsAppButtonSettings, "showOnCart">, pathname: string | null | undefined): boolean {
  if (salesPopupPageKind(pathname) != null) return true;
  if (!settings.showOnCart) return false;
  const path = (pathname || "/").split(/[?#]/)[0]!;
  const first = (path.split("/").filter(Boolean)[0] ?? "").toLowerCase();
  return CART_SEGMENTS.has(first);
}
