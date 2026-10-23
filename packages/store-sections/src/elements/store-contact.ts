/**
 * Store contact and social data in element trees. Templates ship demo values
 * (a sample phone, `hello@store.com`, `https://wa.me/`, a row of social
 * icons); at render time they become the store's own: the phone, WhatsApp and
 * email from Store settings and the links from Website › Social media. A
 * value the seller typed in the builder is not a demo value, so it is kept.
 *
 * On the storefront a demo value the store has no data for is hidden (with
 * the row it sat in); in the editor it stays as authored so the design shows.
 */
import type { ComponentNode } from "../config/schema";
import type { RenderContext } from "../core/types";
import { SOCIAL_PLATFORMS, formatPhone, getSocialPlatform, normalizeSocialLink, phoneDigits, toLatinDigits } from "../social/platforms";

/** Demo numbers used across the library (country code + digits). */
const DEMO_PHONES = new Set(["201001234567", "201000000000", "201002233440", "201002458820", "201012345678"]);
const DEMO_EMAILS = new Set(["hello@store.com", "hello@example.com", "hello@wardibeauty.com"]);

const TEXT_TYPES = new Set(["heading", "paragraph", "text", "badge", "listItem", "textLink"]);
const HREF_TYPES = new Set(["button", "linkBlock", "textLink"]);
const ROW_TYPES = new Set(["hFlex", "vFlex", "div"]);

const clean = (value: string) => toLatinDigits(value).replace(/[‎‏]/g, "").trim();

function demoPhone(value: string): boolean {
  const digits = phoneDigits(clean(value));
  return digits !== null && DEMO_PHONES.has(digits);
}

const demoEmail = (value: string) => DEMO_EMAILS.has(clean(value).toLowerCase());

type Contact = {
  phone: string | null;
  /** wa.me link (a number or a WhatsApp username). */
  whatsapp: string | null;
  /** The WhatsApp number as text, when it is a number. */
  whatsappNumber: string | null;
  email: string | null;
};

// Rows ask for every child, so the store's values are worked out once per profile.
const contactCache = new WeakMap<RenderContext["store"], Contact>();

function storeContact(ctx: RenderContext): Contact {
  const cached = contactCache.get(ctx.store);
  if (cached) return cached;
  const contact = readContact(ctx);
  contactCache.set(ctx.store, contact);
  return contact;
}

function readContact(ctx: RenderContext): Contact {
  const c = ctx.store.contact ?? {};
  const phone = c.phone?.trim() || null;
  const whatsappValue = c.whatsapp?.trim() || phone || "";
  const email = c.email?.trim() || null;
  return {
    phone,
    whatsapp: normalizeSocialLink("whatsapp", whatsappValue),
    whatsappNumber: whatsappValue ? formatPhone(whatsappValue) : null,
    email,
  };
}

/**
 * The store's value for a demo text: a string to show, `null` when the store
 * has none, `undefined` when the text is not a demo value.
 */
export function contactText(text: string, ctx: RenderContext): string | null | undefined {
  if (!text) return undefined;
  const contact = storeContact(ctx);
  // A store with only a WhatsApp number shows that number.
  if (demoPhone(text)) return contact.phone ?? contact.whatsappNumber;
  if (demoEmail(text)) return contact.email;
  return undefined;
}

/** The store's link for a demo href; `null` when the store has none, `undefined` when it is not a demo link. */
export function contactHref(href: string, ctx: RenderContext): string | null | undefined {
  const value = href.trim();
  const contact = storeContact(ctx);
  const wa = /^https:\/\/wa\.me\/([^?#]*)(\?[^#]*)?$/i.exec(value);
  if (wa) {
    const target = decodeURIComponent(wa[1] ?? "");
    if (target && !demoPhone(target)) return undefined;
    return contact.whatsapp ? `${contact.whatsapp}${wa[2] ?? ""}` : null;
  }
  if (/^tel:/i.test(value)) {
    if (!demoPhone(value.slice(4))) return undefined;
    const digits = contact.phone ? phoneDigits(contact.phone) : null;
    return digits ? `tel:+${digits}` : null;
  }
  if (/^mailto:/i.test(value)) {
    if (!demoEmail(value.slice(7).split("?")[0] ?? "")) return undefined;
    return contact.email ? `mailto:${contact.email}` : null;
  }
  // A platform's bare home page (`https://www.instagram.com/`) is a demo profile link.
  const home = /^https?:\/\/(?:www\.)?([a-z0-9.-]+)\/?$/i.exec(value);
  const platform = home ? SOCIAL_PLATFORMS.find((p) => p.domains.includes(home[1]!.toLowerCase())) : undefined;
  if (platform) return storeSocialLinks(ctx).find((link) => link.platform === platform.key)?.url ?? null;
  return undefined;
}

function hasDemoText(node: ComponentNode, depth = 0): boolean {
  const text = node.props?.text;
  if (TEXT_TYPES.has(node.type) && typeof text === "string" && (demoPhone(text) || demoEmail(text))) return true;
  return depth < 4 && node.children.some((child) => hasDemoText(child, depth + 1));
}

/**
 * A node's props with demo contact values replaced. `null` when the node
 * should not be drawn: a demo value the store has no data for, publicly.
 */
export function withStoreContact(node: ComponentNode, props: Record<string, unknown>, ctx: RenderContext): Record<string, unknown> | null {
  let next = props;
  if (TEXT_TYPES.has(node.type) && typeof props.text === "string") {
    const value = contactText(props.text, ctx);
    if (value === null) {
      if (ctx.mode !== "edit") return null;
    } else if (value !== undefined) {
      next = { ...next, text: value };
    }
  }
  if (HREF_TYPES.has(node.type) && typeof props.href === "string") {
    const value = contactHref(props.href, ctx);
    if (value === null) {
      if (ctx.mode === "edit") return next;
      // A link block around photos (a gallery linking to Instagram) keeps its
      // content, unlinked; a contact tile (it shows a demo number) goes.
      if (node.type === "linkBlock" && !hasDemoText(node)) return { ...next, href: "" };
      return null;
    } else if (value !== undefined) {
      next = { ...next, href: value };
    }
  }
  return next;
}

/**
 * Publicly, a row left with nothing but icons once its demo contact values
 * are hidden (a phone icon beside a hidden number) is hidden too.
 */
export function contactRowGone(node: ComponentNode, ctx: RenderContext, depth = 0): boolean {
  if (ctx.mode === "edit" || !ROW_TYPES.has(node.type) || !node.children.length || depth > 3) return false;
  let gone = 0;
  for (const child of node.children) {
    if (child.type === "icon") continue;
    if (withStoreContact(child, child.props ?? {}, ctx) === null || contactRowGone(child, ctx, depth + 1)) gone++;
    else return false;
  }
  return gone > 0;
}

export type StoreSocialLink = { platform: string; url: string; label: string };

/** The store's enabled social links, in the seller's order, for platforms we know. */
export function storeSocialLinks(ctx: RenderContext): StoreSocialLink[] {
  return (ctx.store.social ?? []).flatMap((link) => {
    const platform = getSocialPlatform(link.platform);
    const url = platform ? normalizeSocialLink(platform.key, link.url) : null;
    return platform && url ? [{ platform: platform.key, url, label: platform.label[ctx.locale === "en" ? "en" : "ar"] }] : [];
  });
}
