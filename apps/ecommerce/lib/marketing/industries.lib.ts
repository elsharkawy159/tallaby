import {
  Baby,
  Camera,
  Croissant,
  Footprints,
  Gem,
  Gift,
  Headphones,
  Images,
  Ruler,
  Shirt,
  Sofa,
  Sparkles,
  Store,
  Timer,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { TemplateCategory } from "./templates.data";

/**
 * /industries/[slug]. One entry here plus one `industryPages.<slug>` block in
 * the messages adds a page. Templates shown come from the real gallery by
 * `templateCategory`, so nothing here names a template.
 */

export type IndustryNeedVisual = "variants" | "gallery" | "countdown" | "catalog";

export type Industry = {
  slug: string;
  icon: LucideIcon;
  templateCategory: Exclude<TemplateCategory, "all">;
  /** Photo used in the illustrations. No people, no body parts. */
  photo: string;
  needs: readonly { visual: IndustryNeedVisual; icon: LucideIcon }[];
  stepIcons: readonly LucideIcon[];
  /** Crop of the photo per demo product, in message order. */
  productFocus: readonly string[];
  /** Swatch colours per demo product, in message order. */
  productColors: readonly (readonly string[])[];
};

export const INDUSTRIES: readonly Industry[] = [
  {
    slug: "clothing-store",
    icon: Shirt,
    templateCategory: "fa",
    photo: "/fashion.png",
    needs: [
      { visual: "variants", icon: Ruler },
      { visual: "gallery", icon: Images },
      { visual: "countdown", icon: Timer },
      { visual: "catalog", icon: Camera },
    ],
    stepIcons: [Store, Ruler, Truck, Camera],
    productFocus: ["55% 45%", "68% 45%", "80% 50%", "92% 45%"],
    productColors: [
      ["#1f2a44", "#e8e4da", "#7a8b99"],
      ["#3b5878", "#1f2326"],
      ["#c9b79c", "#2f3a2c", "#1f2326"],
      ["#ffffff", "#1f2326", "#8a3b2e"],
    ],
  },
];

export const findIndustry = (slug: string) => INDUSTRIES.find((industry) => industry.slug === slug);

/**
 * "متجر ..." chips. A kind of store with its own page links there; the rest
 * go to that category in the template gallery, a real page, until they have one.
 */
export const STORE_KIND_LINKS: readonly { key: string; icon: LucideIcon; href: string }[] = [
  { key: "clothing", icon: Shirt, href: "/industries/clothing-store" },
  { key: "beauty", icon: Sparkles, href: "/templates?category=be" },
  { key: "electronics", icon: Headphones, href: "/templates?category=el" },
  { key: "home", icon: Sofa, href: "/templates?category=ho" },
  { key: "food", icon: Croissant, href: "/templates?category=fo" },
  { key: "jewelry", icon: Gem, href: "/templates?category=jw" },
  { key: "kids", icon: Baby, href: "/templates?category=ki" },
  { key: "shoes", icon: Footprints, href: "/templates?category=fa" },
  { key: "gifts", icon: Gift, href: "/templates?category=ge" },
];
