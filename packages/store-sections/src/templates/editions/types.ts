/**
 * Niche editions (ROADMAP F-90, docs/systems/niche-editions-plan.md §4): a
 * data pack (catalog, photos, copy) that an existing template (a "look")
 * is built with, so one look serves several trades. No section design is
 * copied: a look reads its copy and photos from a `LookContent`, and an
 * edition supplies another one. No React here.
 */
import type { SiteConfig } from "../../config/schema";
import type { Localized } from "../../core/types";
import type { LibraryPatch } from "../_library";
import type { ProductPageSpec } from "../_product-page";
import type { TemplateDemo } from "../types";

/** One frame for every product photo of a list (`designSystem.spacing.productStage`). */
export type ProductStage = NonNullable<SiteConfig["designSystem"]["spacing"]["productStage"]>;

/** A label with its link (a header link a trade names, a finder option). */
export type LookLink = { label: Localized; href: string };

/** A short promise: its title and one line under it. */
export type LookLine = { title: Localized; line: Localized };

/** What the main product section shows. */
export type JourneySource = "best-sellers" | "newest" | "featured";

/**
 * An edition's copy by slot. The first block is written by every pack; the
 * second holds slots only some looks show, so a pack writes them when one of
 * its looks declares them (`validateEdition` names what is missing).
 * Generic shop labels (New in, Best sellers, View all, Track order, FAQ) are
 * not slots: they stay in the look.
 */
export type EditionCopy = {
  /** Announcement bar or ticker lines: exactly three, most important first (a look shows the first one to three). */
  announcement: readonly Localized[];
  hero: {
    /** Alt text of the hero photo or video. */
    alt: Localized;
    eyebrow: Localized;
    /** At most 6 words in each language. */
    title: Localized;
    line: Localized;
    cta: Localized;
  };
  categories: { title: Localized };
  products: {
    /** The main product section (a grid, rows or a spotlight). `eyebrow`, `cta` and `alt` are for looks whose main section has them. */
    primary: { title: Localized; line: Localized; eyebrow?: Localized; cta?: Localized; alt?: Localized };
  };
  /** The story block on the home page. */
  story: { alt: Localized; eyebrow: Localized; title: Localized; text: Localized; cta: Localized };
  /** Exactly four promises (a look shows the first three or four). */
  trust: readonly LookLine[];
  newsletter: { title: Localized; line: Localized; eyebrow?: Localized; note?: Localized };
  /** The about page: its header line, then the story beside one photo. */
  about: { line: Localized; alt: Localized; eyebrow: Localized; title: Localized; text: Localized; more: Localized; cta: Localized };
  contact: { title: Localized; line: Localized; heading: Localized };
  faq: { line: Localized; question: Localized; answer: Localized };

  /** Labels a trade names: the header's link to the about page ("Atelier"), the search placeholder. */
  labels?: { about?: Localized; search?: Localized };
  /** Header links a trade names (chargers, power banks, cables), each to a catalog route. */
  nav?: readonly LookLink[];
  /** Titles of product rows that are not category rows (a category row reads its category's name). */
  rows?: readonly { title: Localized; line?: Localized }[];
  /** "Shop the look": a photo with product dots (`photos.look`). */
  look?: { alt: Localized; eyebrow: Localized; title: Localized; text: Localized };
  /** A help block: where to ask, then up to three short points. */
  help?: { title: Localized; line: Localized; points?: readonly Localized[] };
  /** A finder: a question and its options, each to a catalog route. */
  finder?: { title: Localized; line: Localized; options: readonly LookLink[] };
  /** Buyer quotes. */
  reviews?: { title: Localized; items: readonly { quote: Localized; name: Localized }[] };
  /** The footer's line about the store. */
  footer?: { line: Localized };
};

/** An edition's art-directed photos (plan §3.1). Product packshots are in its `demo`. */
export type EditionPhotos = {
  /** `wide` 16:9, `tall` 4:5 for phones; `video` is a background video file whose poster is `wide`. */
  hero: { wide: string; tall: string; video?: string };
  /** One per demo category, in the categories' order, 3:4. They become the categories' images. */
  tiles: readonly string[];
  /** 21:9. */
  banner: string;
  /** 4:5. */
  story: string;
  /** The about page's photo, for looks with a third photo block (a look may fall back to `story`). */
  about?: string;
  /** A flat lay for "shop the look", with its dots in percent from the photo's left and top: the store's 1st, 2nd, 3rd newest product. */
  look?: { src: string; dots: readonly { x: number; y: number }[] };
};

export type EditionJourney = {
  /** What the main product section shows (default: the look's). */
  primary?: JourneySource;
  /** The category places (1 = the store's first category) the look's category rows show; as many as the look has rows. */
  rows?: readonly number[];
};

/** A product option group, for the product page preview only. */
export type EditionVariantGroup = { name: Localized; values: readonly Localized[] };

/** A library section an edition adds to the home page, in one of two fixed places. */
export type EditionExtra = { slot: "after-products" | "before-newsletter"; design: string; patch?: LibraryPatch };

export type Edition = {
  /** A niche id (`editions/niches.ts`): stable, never reused. One pack per niche. */
  niche: string;
  /** Template keys this pack is approved on, best first. */
  looks: readonly string[];
  /** 4–8 categories, 12–24 products, EGP prices, both languages. A category's `image` is null: its tile is `photos.tiles`. */
  demo: TemplateDemo;
  /** Plausible EGP prices for this trade; a product outside it fails validation. */
  priceBand: { min: number; max: number };
  /** Product id → option groups (product page preview only). */
  variants?: Readonly<Record<string, readonly EditionVariantGroup[]>>;
  /** Ratio and fit for this niche's packshots. */
  productStage: ProductStage;
  /** `dark` replaces single photos for looks whose page is dark. */
  photos: EditionPhotos & { dark?: Partial<EditionPhotos> };
  copy: EditionCopy;
  journey?: EditionJourney;
  /** At most two. */
  extras?: readonly EditionExtra[];
  /** Merged over the look's product page spec (its reviews and related titles often name the trade). */
  productPage?: Partial<ProductPageSpec>;
};

type Leaf = string | number | boolean | Localized;
/** Every field present (what a look's code reads). */
type Filled<T> = T extends Leaf ? T : T extends readonly (infer E)[] ? readonly Filled<E>[] : { [K in keyof T]-?: Filled<NonNullable<T[K]>> };
/** Any subset (what a look's default content holds: only the slots it declares). */
type Loose<T> = T extends Leaf ? T : T extends readonly (infer E)[] ? readonly Loose<E>[] : { [K in keyof T]?: Loose<NonNullable<T[K]>> };
type Paths<T> = T extends Leaf
  ? never
  : T extends readonly (infer E)[]
    ? `${number}` | `${number}.${Paths<E>}`
    : { [K in keyof T & string]-?: K | `${K}.${Paths<NonNullable<T[K]>>}` }[keyof T & string];

type ContentShape = EditionCopy & {
  /** The demo store's name and description. */
  store: { name: Localized; description: Localized };
  photos: EditionPhotos;
};

/**
 * The content a look is built from: the same slot names in every look. Typed
 * with every slot present so a look reads `c.hero.title` plainly; at run time
 * it holds the slots the look declared, and reading any other slot throws
 * (`editionTemplate`).
 */
export type LookContent = Filled<ContentShape>;

/** A slot by its path: `hero.title`, `trust.2`, `photos.hero.video`, or a whole group (`look`, `about`). */
export type LookSlot = Paths<ContentShape>;

/**
 * A look's own content, written in its file: the slots it declares, except
 * `store` and `photos.tiles`, which come from its demo store.
 */
export type LookDefaults = Loose<Omit<ContentShape, "store" | "photos">> & { photos?: Loose<Omit<EditionPhotos, "tiles">> };

/** What a look's rows and main product section show by default; an edition's `journey` replaces either. */
export type LookJourney = { primary: JourneySource; rows: readonly number[] };
