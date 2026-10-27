import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { getDesign } from "../designs";
import { CODE_TEMPLATES } from "./catalog";
import { isDiscountDesign } from "./no-discounts";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);

/** Every text a visitor reads in a section, except fields bound to product data (a product's real discount badge). */
function visibleTexts(section: SectionInstance | null | undefined): string[] {
  const out: string[] = [];
  for (const node of walk(section?.componentTree)) {
    if (typeof node.props.bind === "string") continue;
    for (const key of ["text", "label", "title"]) if (typeof node.props[key] === "string") out.push(node.props[key] as string);
    const translations = node.props.translations as Record<string, Record<string, unknown>> | undefined;
    for (const fields of Object.values(translations ?? {})) for (const value of Object.values(fields)) if (typeof value === "string") out.push(value);
  }
  return out;
}

/** An offer: a coupon, a percentage or an amount off, a sale. "No fake discounts" (a promise not to) is fine. */
const OFFER = /كوبون|خصم|كود|تخفيض|أوكازيون|بسعر [٠-٩\d]|coupon|discount|promo code|\b\d+\s*%\s*off\b|\boff (?:your|any|orders?)\b|\bsave \d|\bsale\b|pay for \d|get \d+ free/i;
const ALLOWED = new Set([
  "من غير خصومات وهمية",
  "No fake discounts",
  // A product-list tab that filters the store's own discounted products.
  "عليه خصم",
  "On sale",
  "Four things we check before anything goes on sale.",
  "Every piece is tried at three heights before it goes on sale.",
  // A rental deposit: breakage is taken from it; not an offer.
  "التلف العادي علينا. الكسر بنخصمه من التأمين بعد ما نوريك الصور.",
]);

describe("templates carry no promotions or discounts (owner, 2026-10-27)", () => {
  it("knows the discount designs", () => {
    expect(isDiscountDesign(getDesign("promo-coupon")!)).toBe(true);
    expect(isDiscountDesign(getDesign("bundle-plus")!)).toBe(true);
    expect(isDiscountDesign(getDesign("newsletter-sticker")!)).toBe(true);
    expect(isDiscountDesign(getDesign("newsletter-classic")!)).toBe(false);
    expect(isDiscountDesign(getDesign("products-grid")!)).toBe(false);
  });

  describe.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s", (_key, template) => {
    const config = template.config();
    const sections = [config.header, config.footer, ...config.pages.flatMap((p) => p.content.sections)];
    const designOf = (s: SectionInstance | null | undefined) => template.designs.find((d) => s?.source === `${d.id}@${d.version}`);
    // The cart's coupon box applies the store's real coupons; its labels say "Coupon".
    const shown = sections.filter((s) => designOf(s)?.category !== "cart");

    it("places no promotion, bundle or discount-only section", () => {
      const used = sections.map(designOf).filter((d) => d !== undefined);
      expect(used.filter(isDiscountDesign).map((d) => d.libraryId ?? d.id)).toEqual([]);
    });

    it("shows no coupon, sale or amount off", () => {
      const offers = shown.flatMap((s) => visibleTexts(s)).filter((text) => OFFER.test(text) && !ALLOWED.has(text));
      expect(offers).toEqual([]);
      expect(shown.flatMap((s) => walk(s?.componentTree)).filter((n) => n.props.role === "coupon")).toEqual([]);
    });
  });
});
