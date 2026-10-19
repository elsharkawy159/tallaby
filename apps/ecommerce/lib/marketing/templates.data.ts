/**
 * Template gallery content for the marketing previews. Descriptions live in
 * messages (`templates.items.<id>`); everything here is visual: colours,
 * layout and the demo products shown inside each preview. The demo store copy
 * ("Shop now", product names) is part of the mock storefront and stays in
 * English in both locales, as in the design.
 */

const SUPABASE = "https://sakwqwocbccpyrmwjowq.supabase.co/storage/v1/object/public/products/";

export const IMG = {
  watch6: `${SUPABASE}2026-09-29/3094260b-6f12-48e0-8e7f-1dc757e56d3e.webp`,
  hayato: `${SUPABASE}2026-09-29/753257b7-01f3-46ab-acdb-2fcf7dd43d71.webp`,
  quencher: `${SUPABASE}2026-09-11/1789081457549-whatsapp-image-2026-09-11-at-15418-am.jpeg`,
  mug: `${SUPABASE}2026-09-10/1789006988452-59784f5f-e0f3-4afe-afea-98b102f91370.png`,
  travelCup: `${SUPABASE}2026-09-10/1789008674323-chatgpt-image-sep-10-2026-055058-am.png`,
  fashion: "/fashion.png",
  cosmetics: "/cosmetics.jpg",
  accessories: "/accessories.jpg",
  banner: "/banner.jpg",
} as const;

export type BannerLayout = "split" | "full" | "center";

export type DemoProduct = {
  image: string;
  name: string;
  price: string;
  /** Crop position for a shared lifestyle photo; omit to show the whole image. */
  focus?: string;
};

/** Everything a mini or full storefront preview needs. */
export type StoreLook = {
  name: string;
  background: string;
  foreground: string;
  accent: string;
  /** Text on accent-coloured buttons. */
  onAccent?: string;
  radius: string;
  /** Soft tint for panels and borders. */
  muted: string;
  layout: BannerLayout;
  /** Show the hero image whole (product cut-outs) instead of cropping it. */
  contain?: boolean;
  hero: string;
  headline: string;
  subline: string;
  products: DemoProduct[];
};

export const TEMPLATE_CATEGORIES = ["all", "ge", "el", "fa", "be", "ho", "ac"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type StoreTemplate = {
  id: "classic" | "volt" | "atelier" | "glow" | "nook" | "charm" | "tick";
  /** `templates.key` of the installable template this preview shows. Without one, the preview is "coming soon". */
  dbKey?: string;
  category: Exclude<TemplateCategory, "all">;
  font: string;
  /** Preset [accent, background] pairs offered on the template page. */
  variants: [string, string][];
  look: StoreLook;
};

export const TEMPLATES: StoreTemplate[] = [
  {
    id: "volt",
    category: "el",
    font: "Montserrat",
    variants: [
      ["#7fd8c3", "#0f1315"],
      ["#fdad28", "#0f1315"],
      ["#8fb3ff", "#0f1315"],
    ],
    look: {
      name: "VOLT",
      background: "#0f1315",
      foreground: "#eef2f1",
      accent: "#7fd8c3",
      onAccent: "#0f1315",
      radius: "6px",
      muted: "#ffffff12",
      layout: "split",
      contain: true,
      hero: IMG.hayato,
      headline: "Power that keeps up.",
      subline: "Chargers, audio and smart gear.",
      products: [
        { image: IMG.watch6, name: "Watch 6", price: "1,730" },
        { image: IMG.hayato, name: "Hayato", price: "1,835" },
        { image: IMG.watch6, name: "Watch X", price: "1,080" },
        { image: IMG.hayato, name: "Ultra 3", price: "1,450" },
      ],
    },
  },
  {
    id: "atelier",
    dbKey: "atelier",
    category: "fa",
    font: "Montserrat",
    variants: [
      ["#2a2420", "#f4efe8"],
      ["#7a3b2e", "#f4efe8"],
      ["#1f3a5f", "#f2f2ee"],
    ],
    look: {
      name: "ATELIER",
      background: "#f4efe8",
      foreground: "#2a2420",
      accent: "#2a2420",
      radius: "0px",
      muted: "#2a24200f",
      layout: "full",
      hero: IMG.fashion,
      headline: "The new season edit",
      subline: "Made in Cairo, in small batches.",
      products: [
        { image: IMG.fashion, name: "Linen shirt", price: "890", focus: "15% 30%" },
        { image: IMG.fashion, name: "Wide trousers", price: "1,150", focus: "60% 60%" },
        { image: IMG.fashion, name: "Knit set", price: "1,400", focus: "90% 40%" },
        { image: IMG.fashion, name: "Overshirt", price: "990", focus: "40% 20%" },
      ],
    },
  },
  {
    id: "glow",
    category: "be",
    font: "Montserrat",
    variants: [
      ["#c8586b", "#fbf1ef"],
      ["#8c6bb1", "#f6f1fb"],
      ["#3f8f7a", "#eef6f2"],
    ],
    look: {
      name: "glow",
      background: "#fbf1ef",
      foreground: "#4a2c2a",
      accent: "#c8586b",
      radius: "18px",
      muted: "#c8586b14",
      layout: "center",
      hero: IMG.cosmetics,
      headline: "Skin first. Always.",
      subline: "Clean formulas for everyday care.",
      products: [
        { image: IMG.cosmetics, name: "Serum", price: "420", focus: "20% 50%" },
        { image: IMG.cosmetics, name: "Lip tint", price: "260", focus: "55% 40%" },
        { image: IMG.cosmetics, name: "Cleanser", price: "310", focus: "85% 60%" },
        { image: IMG.cosmetics, name: "Toner", price: "290", focus: "40% 70%" },
      ],
    },
  },
  {
    id: "nook",
    category: "ho",
    font: "Montserrat",
    variants: [
      ["#5b7a4f", "#eef0e8"],
      ["#b5653a", "#f5efe7"],
      ["#3e5c76", "#eef1f4"],
    ],
    look: {
      name: "Nook",
      background: "#eef0e8",
      foreground: "#2f3a2c",
      accent: "#5b7a4f",
      radius: "10px",
      muted: "#ffffff",
      layout: "split",
      contain: true,
      hero: IMG.quencher,
      headline: "Slow mornings, warm cups.",
      subline: "Drinkware and kitchen pieces.",
      products: [
        { image: IMG.quencher, name: "Quencher 1.2L", price: "450" },
        { image: IMG.mug, name: "Steel mug", price: "350" },
        { image: IMG.travelCup, name: "Travel cup", price: "400" },
        { image: IMG.quencher, name: "Tumbler 900ml", price: "380" },
      ],
    },
  },
  {
    id: "charm",
    category: "ac",
    font: "Montserrat",
    variants: [
      ["#d4a64a", "#141414"],
      ["#c9c9c9", "#141414"],
      ["#e08a7b", "#1a1416"],
    ],
    look: {
      name: "CHARM",
      background: "#141414",
      foreground: "#efe6d8",
      accent: "#d4a64a",
      onAccent: "#141414",
      radius: "2px",
      muted: "#ffffff10",
      layout: "full",
      hero: IMG.accessories,
      headline: "Small details, big presence",
      subline: "Handpicked pieces for every day.",
      products: [
        { image: IMG.accessories, name: "Gold chain", price: "650", focus: "20% 40%" },
        { image: IMG.accessories, name: "Bracelet", price: "380", focus: "50% 70%" },
        { image: IMG.accessories, name: "Sunglasses", price: "520", focus: "85% 30%" },
        { image: IMG.accessories, name: "Ring set", price: "450", focus: "60% 20%" },
      ],
    },
  },
  {
    id: "tick",
    category: "el",
    font: "Montserrat",
    variants: [
      ["#e4572e", "#ffffff"],
      ["#145163", "#ffffff"],
      ["#6d28d9", "#ffffff"],
    ],
    look: {
      name: "tick.",
      background: "#ffffff",
      foreground: "#14213d",
      accent: "#e4572e",
      radius: "12px",
      muted: "#14213d0d",
      layout: "split",
      contain: true,
      hero: IMG.hayato,
      headline: "Time, upgraded.",
      subline: "Smartwatches with local warranty.",
      products: [
        { image: IMG.watch6, name: "Watch 6", price: "1,080" },
        { image: IMG.hayato, name: "Ultra 3", price: "1,450" },
        { image: IMG.hayato, name: "Hayato", price: "1,250" },
        { image: IMG.watch6, name: "Watch X", price: "990" },
      ],
    },
  },
];

/**
 * Tallaby Classic, every new store's starting site (`tallaby-classic`, 0071).
 * Kept out of TEMPLATES so the home hero and fan, which index TEMPLATES by
 * position, stay as designed. Colours and font are the template's own.
 */
export const CLASSIC_TEMPLATE: StoreTemplate = {
  id: "classic",
  dbKey: "tallaby-classic",
  category: "ge",
  font: "Readex Pro",
  variants: [
    ["#145163", "#f7f6f2"],
    ["#fdad28", "#f7f6f2"],
    ["#1b2629", "#ffffff"],
  ],
  look: {
    name: "CLASSIC",
    background: "#f7f6f2",
    foreground: "#1b2629",
    accent: "#145163",
    radius: "16px",
    muted: "#1452630f",
    layout: "split",
    hero: "https://images.pexels.com/photos/4397877/pexels-photo-4397877.jpeg?auto=compress&cs=tinysrgb&w=900",
    headline: "Everything you need, in one place",
    subline: "Shop now · New arrivals",
    products: [
      { image: IMG.mug, name: "Mug", price: "180" },
      { image: IMG.quencher, name: "Quencher", price: "650" },
      { image: IMG.travelCup, name: "Travel cup", price: "320" },
      { image: IMG.watch6, name: "Watch 6", price: "1,080" },
    ],
  },
};

/** Every preview the template gallery and pages can show, Classic first. */
export const GALLERY_TEMPLATES: StoreTemplate[] = [CLASSIC_TEMPLATE, ...TEMPLATES];

/** "VOLT" → "Volt", "tick." → "Tick". */
export function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(".", "");
}

export function findTemplate(id: string): StoreTemplate | undefined {
  return GALLERY_TEMPLATES.find((t) => t.id === id);
}

/** Dark backgrounds need dark text on the accent button. */
const DARK_BACKGROUNDS = new Set(["#0f1315", "#141414"]);

/** The look with a colour preset and corner style applied. */
export function applyVariant(look: StoreLook, [accent, background]: [string, string], radius: string): StoreLook {
  return {
    ...look,
    accent,
    background,
    radius,
    onAccent: DARK_BACKGROUNDS.has(background) ? background : "#ffffff",
  };
}
