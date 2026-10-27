/**
 * Templates carry no promotions or discounts (owner, 2026-10-27): a seller may
 * apply a template and forget to edit it, and a store must never promise a
 * sale, a coupon code or a percentage off that it doesn't give. So templates
 * leave out the promotion and bundle sections and the designs that exist only
 * for a discount. Template copy holds no coupon codes, sales or amounts off
 * either (`no-discounts.test.ts` checks every template).
 * The designs stay in the section library: a seller adds one on purpose and
 * fills in a real offer. Product cards' discount badges are bound to the
 * product's own compare-at price, so they stay. No React here.
 */
import { getDesign } from "../designs";
import type { Design } from "../designs/builder";

/** Library categories that are all about an offer. */
const DISCOUNT_CATEGORIES: ReadonlySet<string> = new Set(["promotions", "bundles"]);
/** Designs from other categories built around a discount (a "10% off" sticker, a referral reward). */
const DISCOUNT_DESIGNS: ReadonlySet<string> = new Set(["newsletter-coupon", "newsletter-sticker", "popup-reward", "newsletter-offer"]);

/** True for a design (or a template's copy of one) a template must not use. */
export function isDiscountDesign(design: Design): boolean {
  const id = design.libraryId ?? design.id;
  const category = design.libraryId ? (getDesign(id)?.category ?? design.category) : design.category;
  return DISCOUNT_CATEGORIES.has(category) || DISCOUNT_DESIGNS.has(id);
}
