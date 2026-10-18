/**
 * The curated Tallaby section library (PLAN.md P4-02, §8.2). Every id here is
 * allowed in a published site; anything else is skipped by the renderer and
 * rejected at publish (validateSiteConfig({ allowedSections })).
 */
import { createSectionRegistry } from "../core/registry";
import type { AnySectionDefinition } from "../core/types";
import { storeFooter, storeHeader } from "./chrome";
import { CLASSIC_SECTIONS } from "./classic";
import { categoryGrid, featuredProduct, productGrid } from "./commerce";
import { ctaBanner, features, heroBanner, imageWithText, richText, spacer } from "./content";
import { contactInfo, faq, imageGallery, logoCloud, testimonials } from "./engagement";
import { contactForm } from "./forms";

export const STORE_SECTIONS: readonly AnySectionDefinition[] = [
  ...CLASSIC_SECTIONS,
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
  contactForm,
  spacer,
  storeFooter,
];

export const storeSectionRegistry = createSectionRegistry(STORE_SECTIONS);

export * from "./classic";
export { FORM_SUBMIT_CLASS, FormFieldsView, formCopy } from "./forms";

export {
  categoryGrid,
  contactForm,
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
