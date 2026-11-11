/**
 * Edition-ready looks (ROADMAP F-90, plan §4.3). `editionTemplate` is
 * `libraryTemplate` for a look whose copy and photos come from a content
 * object: the exported template is the look built with its own default
 * content (the same template as before its conversion; `look-guard.test.ts`
 * holds the proof), and `applyEdition` builds the same look with an
 * edition's content, catalog, photos, product stage, journey and extras.
 * Both go through the look's `lib`, so every swap is the strict
 * `fromLibrary` patch and no section design is copied. No React here.
 */
import type { Localized } from "../../core/types";
import { getDesign } from "../../designs";
import type { Design } from "../../designs/builder";
import type { Lib } from "../_pages";
import { libraryTemplate, type LibraryTemplatePage, type LibraryTemplateSpec } from "../library-template";
import type { TemplateDefinition, TemplateDemo } from "../types";
import type { Edition, EditionExtra, EditionPhotos, JourneySource, LookContent, LookDefaults, LookJourney, LookSlot, ProductStage } from "./types";

/** What a look builds from a content object. */
export type LookParts = { header: Design; footer: Design; pages: readonly LibraryTemplatePage[] };

export type EditionLookSpec = Omit<LibraryTemplateSpec, "header" | "footer" | "pages" | "lib"> & {
  /** The look's `fromLibrary` bound to its key and corners: its sections, its product page and an edition's extras are built with it. */
  lib: Lib;
  /** Every slot the look reads. An edition without one of them cannot be applied; reading a slot not listed here (or in `optional`) throws. */
  slots: readonly LookSlot[];
  /** Slots the look uses when they are there (a hero video, a fourth promise). */
  optional?: readonly LookSlot[];
  /** True when the page is dark: an edition's `photos.dark` replaces its light photos. */
  dark?: boolean;
  /** What the main product section and the category rows show by default. `rows` has one place per category row of the look. */
  journey: LookJourney;
  /** The look's own content: every slot in `slots`, except `store` and `photos.tiles` (read from `demo`). */
  defaultContent: LookDefaults;
  /** The look: header, footer and pages from a content object. Pure, and it reads nothing but `content` and `journey` for copy and photos. */
  look: (content: LookContent, journey: LookJourney) => LookParts;
};

const LOOKS = new Map<string, EditionLookSpec>();

/** True for a template built with `editionTemplate` (by its key). */
export function isEditionReady(templateKey: string): boolean {
  return LOOKS.has(templateKey);
}

/** The slots an edition-ready look needs (empty for any other template). */
export function lookSlots(templateKey: string): readonly LookSlot[] {
  return LOOKS.get(templateKey)?.slots ?? [];
}

/** The look's default journey, or undefined when the template is not edition-ready. */
export function lookJourney(templateKey: string): LookJourney | undefined {
  return LOOKS.get(templateKey)?.journey;
}

// ── Small helpers for look files ────────────────────────────────────────────

/** The first letter of a store name in each language (a logo mark). */
export const initialOf = (name: Localized): Localized => ({ ar: [...name.ar][0] ?? "", en: [...name.en][0] ?? "" });

/** The footer's copyright line for a store name. */
export const copyrightLine = (name: Localized): Localized => ({ ar: `© ٢٠٢٦ ${name.ar}. كل الحقوق محفوظة.`, en: `© 2026 ${name.en}. All rights reserved.` });

const PRIMARY_HREF: Record<JourneySource, string> = { "best-sellers": "/products?sort=popularity", newest: "/products?sort=newest", featured: "/products" };

/** Where the main product section's "view all" goes for what it shows. */
export const primaryHref = (source: JourneySource): string => PRIMARY_HREF[source];

// ── Slots ───────────────────────────────────────────────────────────────────

const isLeaf = (value: unknown): boolean =>
  typeof value !== "object" || value === null || (typeof (value as Localized).ar === "string" && typeof (value as Localized).en === "string");

function valueAt(content: unknown, slot: string): unknown {
  let value = content;
  for (const key of slot.split(".")) {
    if (typeof value !== "object" || value === null) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

const present = (value: unknown): boolean => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);

/** The slots of `slots` that `content` does not hold. */
export function missingSlots(content: unknown, slots: readonly string[]): string[] {
  return slots.filter((slot) => !present(valueAt(content, slot)));
}

const covers = (declared: readonly string[], path: string) => declared.some((slot) => path === slot || path.startsWith(`${slot}.`));

/** Keys a runtime may probe on any object; never slots. */
const PROBES = new Set(["toJSON", "then", "constructor"]);

/**
 * `content` for a look's code: a read of a slot the look did not declare
 * throws, so `slots` is always the whole list of what the look needs and an
 * edition can be checked against it before anything is built.
 */
function guarded<T extends object>(content: T, declared: readonly string[], label: string, base = ""): T {
  return new Proxy(content, {
    get(target, key, receiver) {
      const value: unknown = Reflect.get(target, key, receiver);
      if (typeof key !== "string" || PROBES.has(key)) return value;
      // Array methods and `length` are not slots; an element (a numeric key) is.
      if (Array.isArray(target) && !/^\d+$/.test(key)) return value;
      const path = base ? `${base}.${key}` : key;
      if (value === undefined || isLeaf(value)) {
        // An absent group above an optional slot (`photos.look` over `photos.look.src`) reads as absent.
        const above = value === undefined && declared.some((slot) => slot.startsWith(`${path}.`));
        if (!above && !covers(declared, path)) throw new Error(`${label} reads slot "${path}" that it does not declare (add it to slots or optional)`);
        return value;
      }
      return guarded(value as object, declared, label, path);
    },
  });
}

// ── Building ────────────────────────────────────────────────────────────────

type BuildOptions = {
  demo: TemplateDemo;
  productStage?: ProductStage;
  productPage?: LibraryTemplateSpec["productPage"];
  extras?: readonly EditionExtra[];
  label: string;
};

/** The home sections with an edition's extras in their two fixed places. */
function withExtras(spec: EditionLookSpec, home: readonly Design[], extras: readonly EditionExtra[], label: string): Design[] {
  const out = [...home];
  for (const extra of extras) {
    if (!getDesign(extra.design)) throw new Error(`${label}: extra "${extra.design}" is not a section library design`);
    const design = spec.lib(extra.design, { as: `edition-${extra.design}`, ...extra.patch });
    if (extra.slot === "after-products") {
      const at = out.findIndex((d) => d.category === "products");
      out.splice(at === -1 ? Math.min(2, out.length) : at + 1, 0, design);
    } else {
      const at = out.map((d) => d.category).lastIndexOf("newsletter");
      out.splice(at === -1 ? out.length : at, 0, design);
    }
  }
  return out;
}

function build(spec: EditionLookSpec, content: object, journey: LookJourney, o: BuildOptions): TemplateDefinition {
  const { slots, optional = [], dark: _dark, journey: _journey, defaultContent: _defaults, look, ...base } = spec;
  const missing = missingSlots(content, slots);
  if (missing.length) throw new Error(`${o.label} lacks ${missing.length === 1 ? "slot" : "slots"} ${missing.map((s) => `"${s}"`).join(", ")} for look "${spec.key}"`);
  if (journey.rows.length !== spec.journey.rows.length) {
    throw new Error(`${o.label}: journey.rows has ${journey.rows.length} places, look "${spec.key}" has ${spec.journey.rows.length} category rows`);
  }
  const outside = journey.rows.filter((place) => !Number.isInteger(place) || place < 1 || place > o.demo.categories.length);
  if (outside.length) throw new Error(`${o.label}: journey.rows ${outside.join(", ")} is outside its ${o.demo.categories.length} categories`);

  // The store and the tiles are in every content, so a look never declares them.
  const parts = look(guarded(content, [...slots, ...optional, "store", "photos.tiles"], `look "${spec.key}"`) as LookContent, journey);
  const pages = o.extras?.length ? parts.pages.map((page, i) => (i === 0 ? { ...page, sections: withExtras(spec, page.sections, o.extras!, o.label) } : page)) : parts.pages;
  return libraryTemplate({
    ...base,
    ...(o.productStage && { productStage: o.productStage }),
    ...(o.productPage && { productPage: o.productPage }),
    header: parts.header,
    footer: parts.footer,
    pages,
    demo: o.demo,
  });
}

/**
 * A look that takes editions. The result is the look with its default
 * content: the template its key has always meant.
 */
export function editionTemplate(spec: EditionLookSpec): TemplateDefinition {
  if (LOOKS.has(spec.key)) throw new Error(`editionTemplate: look "${spec.key}" is defined twice`);
  const content = {
    ...spec.defaultContent,
    store: spec.demo.store,
    photos: { ...spec.defaultContent.photos, tiles: spec.demo.categories.map((c) => c.image) },
  };
  const template = build(spec, content, spec.journey, { demo: spec.demo, label: `look "${spec.key}": its default content` });
  LOOKS.set(spec.key, spec);
  return template;
}

/** An edition's photos for a look: its dark set over its light one when the look's page is dark. */
function photosFor(edition: Edition, dark: boolean): EditionPhotos {
  const { dark: darkSet, ...light } = edition.photos;
  if (!dark || !darkSet) return light;
  return { ...light, ...darkSet, hero: { ...light.hero, ...darkSet.hero } };
}

/**
 * The look built with an edition: its copy, catalog, photos, product stage,
 * journey and extras. The key stays the look's; `edition` names the niche.
 * Throws when the template is not edition-ready, the pack is not approved on
 * it, or the pack lacks a slot the look needs. A copy or link the look's
 * sections do not hold throws when a page is built (`config()`), as for any
 * library template.
 */
export function applyEdition(template: TemplateDefinition, edition: Edition): TemplateDefinition {
  const spec = LOOKS.get(template.key);
  const label = `edition "${edition.niche}"`;
  if (!spec) throw new Error(`applyEdition: template "${template.key}" is not edition-ready (it is not built with editionTemplate)`);
  if (!edition.looks.includes(template.key)) throw new Error(`applyEdition: ${label} is not approved on look "${template.key}"`);

  const photos = photosFor(edition, spec.dark === true);
  // A category's photo is its tile.
  const demo: TemplateDemo = { ...edition.demo, categories: edition.demo.categories.map((c, i) => ({ ...c, image: photos.tiles[i] ?? c.image })) };
  const content = { ...edition.copy, store: demo.store, photos };
  const journey: LookJourney = { primary: edition.journey?.primary ?? spec.journey.primary, rows: edition.journey?.rows ?? spec.journey.rows };
  const productPage = edition.productPage
    ? { ...spec.productPage, ...edition.productPage, copy: { ...spec.productPage?.copy, ...edition.productPage.copy } }
    : undefined;
  const built = build(spec, content, journey, { demo, productStage: edition.productStage, productPage, extras: edition.extras, label });
  return { ...built, edition: edition.niche };
}
