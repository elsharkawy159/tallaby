/** Every preset of the section library, one file per category. */
import type { SectionPreset } from "../types";
import { ABOUT_PRESETS } from "./about";
import { BRAND_PRESETS } from "./brands";
import { CATEGORY_PRESETS } from "./categories";
import { CONTACT_PRESETS } from "./contact";
import { CONTENT_PRESETS } from "./content";
import { FEATURE_PRESETS } from "./features";
import { FOOTER_PRESETS } from "./footers";
import { HEADER_PRESETS } from "./headers";
import { HERO_PRESETS } from "./hero";
import { PRODUCT_PRESETS } from "./products";
import { PROMOTION_PRESETS } from "./promotions";
import { TESTIMONIAL_PRESETS } from "./testimonials";

export const SECTION_PRESETS: readonly SectionPreset[] = [
  ...HEADER_PRESETS,
  ...HERO_PRESETS,
  ...CATEGORY_PRESETS,
  ...PRODUCT_PRESETS,
  ...BRAND_PRESETS,
  ...PROMOTION_PRESETS,
  ...FEATURE_PRESETS,
  ...TESTIMONIAL_PRESETS,
  ...ABOUT_PRESETS,
  ...CONTENT_PRESETS,
  ...CONTACT_PRESETS,
  ...FOOTER_PRESETS,
];
