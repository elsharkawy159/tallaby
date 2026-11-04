import { normalizeLeadPhone } from "@workspace/lib/checkout-leads";
import { realEmail, realName } from "@workspace/lib/customers";

/**
 * Orders › Pending carts (ROADMAP.md F-67): pure rules shared by the query, the
 * list and their tests.
 */

/**
 * A cart with no activity for this long leaves the list. Same as Not completed
 * (LEAD_RETENTION_DAYS), and a guest's cart cookie also lasts 30 days, so an
 * older guest cart can't be reached by its customer any more.
 */
export const PENDING_CART_MAX_AGE_DAYS = 30;
/** Product lines listed per cart; the rest show as "+N more". */
export const PENDING_CART_LINES_SHOWN = 3;
export const PENDING_CART_PAGE_SIZES = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = PENDING_CART_PAGE_SIZES[0];

export type PendingCartsFilters = { page: number; size: number };

export function parsePendingCartsFilters(params: { page?: unknown; size?: unknown }): PendingCartsFilters {
  const page = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Number(params.page) : 1;
  const size = Number(params.size);
  return {
    page: Math.max(page, 1),
    size: (PENDING_CART_PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
  };
}

export type PendingCartContactInput = {
  isGuest: boolean | null;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  leadName: string | null;
  leadPhone: string | null;
};

export type PendingCartContact = {
  /** Null shows as "Guest". */
  name: string | null;
  phone: string | null;
  /** 01XXXXXXXXX when the phone is an Egyptian mobile, for the WhatsApp link. */
  whatsappPhone: string | null;
  /** Digits for the tel: link. */
  callPhone: string | null;
  email: string | null;
};

/**
 * Only what the customer gave. What they typed at this store's checkout comes
 * first, then their account. A guest's "Guest User" name and
 * `guest_<id>@temp.local` email are placeholders, never contact details.
 */
export function resolvePendingCartContact(input: PendingCartContactInput): PendingCartContact {
  const name = realName(input.leadName) ?? realName(input.userName);
  const typedPhone = input.leadPhone?.trim() || input.userPhone?.trim() || null;
  const whatsappPhone = normalizeLeadPhone(input.leadPhone) ?? normalizeLeadPhone(input.userPhone);
  const phone = whatsappPhone ?? typedPhone;
  return {
    name,
    phone,
    whatsappPhone,
    callPhone: phone?.replace(/[^\d+]/g, "") || null,
    email: input.isGuest ? null : realEmail(input.userEmail),
  };
}

/** The product's title in this language, else any it has. */
export function pickProductTitle(titles: Record<string, string> | null | undefined, locale: string): string | null {
  if (!titles) return null;
  return titles[locale]?.trim() || Object.values(titles).find((title) => title?.trim())?.trim() || null;
}

/** The option's name from the cart line's snapshot (`cart_items.variant`), unless it repeats the product's. */
export function cartVariantTitle(variant: unknown, productTitle: string | null): string | null {
  const raw = typeof variant === "string" ? variant : (variant as { title?: unknown } | null | undefined)?.title;
  const title = typeof raw === "string" ? raw.trim() : "";
  return title && title !== productTitle ? title : null;
}

/** Titles for leadProductsText(): one entry per line, so its "and N more" counts the lines not loaded too. */
export function linesForMessage(shownTitles: (string | null)[], lineCount: number): { title: string }[] {
  const titles = shownTitles.flatMap((title) => (title ? [{ title }] : []));
  const missing = Math.max(lineCount - shownTitles.length, 0);
  return [...titles, ...Array.from({ length: missing }, () => ({ title: "-" }))];
}
