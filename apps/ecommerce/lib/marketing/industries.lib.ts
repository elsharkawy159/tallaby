import {
  Baby,
  BadgePercent,
  Bell,
  Camera,
  Car,
  ClipboardList,
  Croissant,
  CreditCard,
  Dumbbell,
  Gem,
  Hand,
  Headphones,
  Images,
  type LucideIcon,
  MapPin,
  NotebookPen,
  Package,
  Ruler,
  Shirt,
  Sofa,
  Sparkles,
  SprayCan,
  Star,
  Store,
  Timer,
  Truck,
} from "lucide-react";
import type { TemplateCategory } from "./templates.data";

/**
 * /industries and /industries/[slug]. One entry here plus one
 * `industryPages.<slug>` block and one `industriesHub.items.<slug>` line in
 * the messages adds a page. Templates shown come from the real code catalog
 * (`templateKeys`, else `templateCategory`), so nothing here invents one.
 */

/**
 * The coded picture beside each need. `variants`, `gallery`, `countdown` and
 * `catalog` are the clothing page's; the rest are small product-UI mocks of
 * live features (SEO_PLAN.md §9.0): price per size, a spec list, delivery
 * prices by area, quantity offers, product reviews, order notes, the new
 * order push and the back-in-stock form.
 */
export type IndustryNeedVisual =
  | "variants"
  | "gallery"
  | "countdown"
  | "catalog"
  | "sizes"
  | "specs"
  | "zones"
  | "offers"
  | "reviews"
  | "notes"
  | "alert"
  | "restock";

/** The hub's filter groups. */
export const INDUSTRY_GROUPS = ["fashion", "beauty", "home", "tech", "food"] as const;
export type IndustryGroup = (typeof INDUSTRY_GROUPS)[number];

export type Industry = {
  slug: string;
  icon: LucideIcon;
  group: IndustryGroup;
  /** One of the hub's three featured cards. */
  featured?: boolean;
  /** Gallery filter code for the "All templates" link. */
  templateCategory: Exclude<TemplateCategory, "all">;
  /** The niche's own templates, in order. Unset: the first of `templateCategory`. */
  templateKeys?: readonly string[];
  /** The store mock's banner photo. No people, no body parts. */
  photo: string;
  /** Crop the banner to fill (a photo) instead of showing it whole (a cut-out). */
  heroCover?: boolean;
  /** One photo per demo product, in message order. Unset: crops of `photo`. */
  productPhotos?: readonly string[];
  needs: readonly { visual: IndustryNeedVisual; icon: LucideIcon }[];
  stepIcons: readonly LucideIcon[];
  /** Crop of the photo per demo product, in message order. */
  productFocus: readonly string[];
  /** Swatch colours per demo product, in message order. */
  productColors: readonly (readonly string[])[];
};

/** A product-only photo the templates already use (checked by eye: no people, hands or logos). */
const px = (id: number, width = 640) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
const CENTER = ["50% 50%", "50% 50%", "50% 50%", "50% 50%"] as const;
const STEPS: readonly LucideIcon[] = [Store, Package, Truck, Camera];

export const INDUSTRIES: readonly Industry[] = [
  {
    slug: "clothing-store",
    icon: Shirt,
    group: "fashion",
    featured: true,
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
  {
    slug: "beauty-store",
    icon: Sparkles,
    group: "beauty",
    featured: true,
    templateCategory: "be",
    templateKeys: ["beauty-luxe", "beauty-bold", "pure", "botanica"],
    photo: px(8101511, 1200),
    heroCover: true,
    productPhotos: [px(8101534), px(8054400), px(8049849), px(6690232)],
    needs: [
      { visual: "gallery", icon: Images },
      { visual: "offers", icon: BadgePercent },
      { visual: "restock", icon: Bell },
      { visual: "reviews", icon: Star },
    ],
    stepIcons: STEPS,
    productFocus: CENTER,
    productColors: [[], ["#c98a5b", "#e9d8c4"], [], []],
  },
  {
    slug: "electronics-store",
    icon: Headphones,
    group: "tech",
    templateCategory: "el",
    templateKeys: ["electronics-luxe", "electronics-bold", "electronics-warm", "techhub"],
    photo: px(7772548, 1200),
    heroCover: true,
    productPhotos: [px(8858287), px(11934173), px(4884116), px(13007642)],
    needs: [
      { visual: "specs", icon: ClipboardList },
      { visual: "variants", icon: Package },
      { visual: "restock", icon: Bell },
      { visual: "zones", icon: CreditCard },
    ],
    stepIcons: [Store, ClipboardList, CreditCard, Camera],
    productFocus: CENTER,
    productColors: [[], ["#1f2326", "#5d6a73", "#d8dde0"], [], []],
  },
  {
    slug: "perfume-store",
    icon: SprayCan,
    group: "beauty",
    templateCategory: "be",
    templateKeys: ["perfumes-luxe", "perfumes-bold", "perfumes-warm"],
    photo: px(8450248, 1200),
    heroCover: true,
    productPhotos: [px(7670678), px(16266286), px(7005938), px(3831748)],
    needs: [
      { visual: "sizes", icon: SprayCan },
      { visual: "offers", icon: BadgePercent },
      { visual: "gallery", icon: Images },
      { visual: "reviews", icon: Star },
    ],
    stepIcons: [Store, SprayCan, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#e9c9b8", "#d9a35f"], [], []],
  },
  {
    slug: "home-furniture-store",
    icon: Sofa,
    group: "home",
    templateCategory: "ho",
    templateKeys: ["furniture-luxe", "furniture-bold", "furniture-warm", "mobilia"],
    photo: px(30520758, 1200),
    heroCover: true,
    productPhotos: [px(12269764), px(31173588), px(33000100), px(29917912)],
    needs: [
      { visual: "gallery", icon: Images },
      { visual: "specs", icon: Ruler },
      { visual: "zones", icon: MapPin },
      { visual: "notes", icon: NotebookPen },
    ],
    stepIcons: [Store, Ruler, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#c8a27a", "#6b4a32"], [], []],
  },
  {
    slug: "jewelry-accessories-store",
    icon: Gem,
    group: "fashion",
    templateCategory: "jw",
    templateKeys: ["jewelry-luxe", "zahra", "jewelry-warm", "karat"],
    photo: px(12194350, 1200),
    heroCover: true,
    productPhotos: [px(12124617), px(29967978), px(7679654), px(8502482)],
    needs: [
      { visual: "gallery", icon: Images },
      { visual: "variants", icon: Ruler },
      { visual: "countdown", icon: Timer },
      { visual: "notes", icon: NotebookPen },
    ],
    stepIcons: [Store, Gem, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#d4af37", "#c0c0c0", "#b76e79"], [], []],
  },
  {
    slug: "food-store",
    icon: Croissant,
    group: "food",
    featured: true,
    templateCategory: "fo",
    templateKeys: ["halawa", "grocery-luxe", "grocery-bold", "grocery-warm"],
    photo: px(36355419, 1200),
    heroCover: true,
    productPhotos: [px(10395259), px(5985991), px(36691304), px(17255896)],
    needs: [
      { visual: "zones", icon: MapPin },
      { visual: "alert", icon: Bell },
      { visual: "sizes", icon: Package },
      { visual: "notes", icon: NotebookPen },
    ],
    stepIcons: [Store, Package, Truck, Bell],
    productFocus: CENTER,
    productColors: [[], [], [], []],
  },
  {
    slug: "kids-store",
    icon: Baby,
    group: "home",
    templateCategory: "ki",
    templateKeys: ["kids-luxe", "kids-bold", "kids-warm", "bambino"],
    photo: px(3661222, 1200),
    heroCover: true,
    productPhotos: [px(3875082), px(6743164), px(19612921), px(6792048)],
    needs: [
      { visual: "variants", icon: Ruler },
      { visual: "offers", icon: BadgePercent },
      { visual: "restock", icon: Bell },
      { visual: "zones", icon: Truck },
    ],
    stepIcons: [Store, Ruler, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#e45b5b", "#f2c94c", "#4c9be4"], [], []],
  },
  {
    slug: "car-accessories-store",
    icon: Car,
    group: "tech",
    templateCategory: "au",
    templateKeys: ["garage", "drive", "moto", "pitstop"],
    photo: px(10196155, 1200),
    heroCover: true,
    productPhotos: [px(7738878), px(39813049), px(7568447), px(3921704)],
    needs: [
      { visual: "specs", icon: ClipboardList },
      { visual: "catalog", icon: Camera },
      { visual: "zones", icon: Truck },
      { visual: "reviews", icon: Star },
    ],
    stepIcons: [Store, ClipboardList, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#1f2326", "#7a4a2a"], [], []],
  },
  {
    slug: "handmade-store",
    icon: Hand,
    group: "home",
    templateCategory: "ge",
    templateKeys: ["fokhar", "gifts-luxe", "gifts-bold", "gifts-warm"],
    photo: px(6213678, 1200),
    heroCover: true,
    productPhotos: [px(7674564), px(4830752), px(11232062), px(6311847)],
    needs: [
      { visual: "notes", icon: NotebookPen },
      { visual: "gallery", icon: Images },
      { visual: "restock", icon: Bell },
      { visual: "zones", icon: CreditCard },
    ],
    stepIcons: [Store, Images, CreditCard, Camera],
    productFocus: CENTER,
    productColors: [[], ["#e8e1d6", "#b0603c"], [], []],
  },
  {
    slug: "sports-store",
    icon: Dumbbell,
    group: "fashion",
    templateCategory: "sp",
    templateKeys: ["sports-luxe", "sports-bold", "sports-warm", "stride"],
    photo: px(7880188, 1200),
    heroCover: true,
    productPhotos: [px(29224210), px(40074772), px(16695681), px(13007642)],
    needs: [
      { visual: "variants", icon: Ruler },
      { visual: "offers", icon: BadgePercent },
      { visual: "catalog", icon: Camera },
      { visual: "countdown", icon: Timer },
    ],
    stepIcons: [Store, Ruler, Truck, Camera],
    productFocus: CENTER,
    productColors: [[], ["#1e9e5a", "#f28c28", "#2f80ed"], [], []],
  },
];

export const findIndustry = (slug: string) => INDUSTRIES.find((industry) => industry.slug === slug);

export const industryHref = (industry: Pick<Industry, "slug">) => `/industries/${industry.slug}`;

/**
 * The templates an industry page shows: its own niche's templates in order
 * when set, else the first of its gallery category. Only what the catalog
 * really offers, so a removed template simply drops out.
 */
export function industryTemplates<T extends { id: string; category: string }>(industry: Pick<Industry, "templateKeys" | "templateCategory">, gallery: readonly T[], max = 3): T[] {
  const picked = industry.templateKeys
    ? industry.templateKeys.flatMap((key) => gallery.filter((entry) => entry.id === key))
    : gallery.filter((entry) => entry.category === industry.templateCategory);
  return picked.slice(0, max);
}

/**
 * "متجر ..." chips (the industry pages' "other kinds of store" and the
 * solution pages). Every chip is a real industry page; `key` names its label
 * under `storeKinds`.
 */
export const STORE_KIND_LINKS: readonly { key: string; icon: LucideIcon; href: string }[] = [
  { key: "clothing", slug: "clothing-store" },
  { key: "beauty", slug: "beauty-store" },
  { key: "perfume", slug: "perfume-store" },
  { key: "electronics", slug: "electronics-store" },
  { key: "home", slug: "home-furniture-store" },
  { key: "jewelry", slug: "jewelry-accessories-store" },
  { key: "food", slug: "food-store" },
  { key: "kids", slug: "kids-store" },
  { key: "car", slug: "car-accessories-store" },
  { key: "handmade", slug: "handmade-store" },
  { key: "sports", slug: "sports-store" },
].map(({ key, slug }) => ({ key, icon: findIndustry(slug)!.icon, href: `/industries/${slug}` }));
