/**
 * The curated Tallaby section library (PLAN.md P4-02, §8.2). Every id here is
 * allowed in a published site; anything else is skipped by the renderer and
 * rejected at publish (validateSiteConfig({ allowedSections })).
 */
import { createSectionRegistry } from "../core/registry";
import type { AnySectionDefinition } from "../core/types";
import { storeFooter, storeHeader } from "./chrome";
import { categoryGrid, featuredProduct, productGrid } from "./commerce";
import { ctaBanner, features, heroBanner, imageWithText, richText, spacer } from "./content";
import { contactInfo, faq, imageGallery, logoCloud, testimonials } from "./engagement";

export const STORE_SECTIONS: readonly AnySectionDefinition[] = [
  storeHeader,
  heroBanner,
  productGrid,
  featuredProduct,
  categoryGrid,
  features,
  imageWithText,
  richText,
  testimonials,
  faq,
  imageGallery,
  logoCloud,
  ctaBanner,
  contactInfo,
  spacer,
  storeFooter,
];

export const storeSectionRegistry = createSectionRegistry(STORE_SECTIONS);

export {
  categoryGrid,
  contactInfo,
  ctaBanner,
  faq,
  featuredProduct,
  features,
  heroBanner,
  imageGallery,
  imageWithText,
  logoCloud,
  productGrid,
  richText,
  spacer,
  storeFooter,
  storeHeader,
  testimonials,
};
