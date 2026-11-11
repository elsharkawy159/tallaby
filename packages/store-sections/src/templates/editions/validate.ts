/**
 * The checks an edition must pass on each of its looks (plan §4.4). Run by
 * `editions.test.ts` for every registered pack × look; not part of the
 * package's public exports (it pulls in the section registry to resolve the
 * built pages' lists).
 *
 * Not checked here, because a unit test cannot see a photo: one ratio per
 * photo slot and white-background packshots (plan §4.4: the packshot audit
 * script, and the screenshots of the pilot).
 */
import type { ComponentNode, SectionInstance, SiteConfig } from "../../config/schema";
import { collectCatalogQueries } from "../../core/registry";
import type { Localized, RenderContext } from "../../core/types";
import { getDesign } from "../../designs";
import { isPaginated, listRecords } from "../../elements/data";
import { storeSectionRegistry } from "../../sections";
import { resolveDemoCatalog } from "../demo-catalog";
import { templateDemoProduct } from "../demo-product";
import { isDiscountDesign, OFFER_COPY } from "../no-discounts";
import type { TemplateDefinition } from "../types";
import { applyEdition, isEditionReady } from "./apply";
import type { Edition, EditionPhotos } from "./types";

/**
 * The host of our own public media bucket, for generated photos (plan §3.2,
 * decision 3: the public media bucket under `template-media/`).
 * TODO(lead): set it once the bucket host is decided; empty means Pexels only.
 */
export const EDITION_MEDIA_HOST = "";

const own = (hosts: readonly string[]) => [...hosts, ...(EDITION_MEDIA_HOST ? [EDITION_MEDIA_HOST] : [])];
/** Hosts an edition's photos may come from. */
export const EDITION_PHOTO_HOSTS: readonly string[] = own(["images.pexels.com"]);
/** Hosts an edition's hero video may come from. */
export const EDITION_VIDEO_HOSTS: readonly string[] = own(["videos.pexels.com"]);

export const EDITION_LIMITS = { categories: [4, 8], products: [12, 24], productsPerCategory: 3, heroTitleWords: 6, extras: 2 } as const;

export type ValidateEditionOptions = {
  /** Photo hosts allowed besides `EDITION_PHOTO_HOSTS` (tests). */
  photoHosts?: readonly string[];
};

const ARABIC = /[؀-ۿ]/;
const isLocalized = (value: unknown): value is Localized =>
  typeof value === "object" && value !== null && typeof (value as Localized).ar === "string" && typeof (value as Localized).en === "string";

/** Every `{ ar, en }` inside a value, with its path. */
function localizedIn(value: unknown, path: string, out: [string, Localized][] = []): [string, Localized][] {
  if (isLocalized(value)) out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((item, i) => localizedIn(item, `${path}[${i}]`, out));
  else if (typeof value === "object" && value !== null) for (const [key, item] of Object.entries(value)) localizedIn(item, `${path}.${key}`, out);
  return out;
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** A photo's identity: its URL without the size query (one Pexels photo at two widths is one photo). */
const photoId = (url: string) => url.replace(/\?.*$/, "");

function photoSet(photos: Partial<EditionPhotos>, path: string): [string, string][] {
  const out: [string, string | undefined][] = [
    [`${path}.hero.wide`, photos.hero?.wide],
    [`${path}.hero.tall`, photos.hero?.tall],
    ...(photos.tiles ?? []).map((url, i): [string, string] => [`${path}.tiles[${i}]`, url]),
    [`${path}.banner`, photos.banner],
    [`${path}.story`, photos.story],
    [`${path}.about`, photos.about],
    [`${path}.look.src`, photos.look?.src],
  ];
  return out.filter((entry): entry is [string, string] => entry[1] !== undefined);
}

/** Every photo of a pack with where it is used: product packshots, then the art-directed set and its dark set. */
export function editionPhotos(edition: Edition): [where: string, url: string][] {
  const { dark, ...light } = edition.photos;
  return [
    ...edition.demo.products.map((p): [string, string] => [`product ${p.slug}`, p.image ?? ""]),
    ...photoSet(light, "photos"),
    ...photoSet(dark ?? {}, "photos.dark"),
  ];
}

/** Photos used by more than one pack (plan §4.4), for the whole registry. */
export function sharedPhotos(editions: readonly Edition[]): string[] {
  const seen = new Map<string, string>();
  const problems: string[] = [];
  for (const edition of editions) {
    for (const [where, url] of editionPhotos(edition)) {
      const id = photoId(url);
      const other = seen.get(id);
      if (other && other !== edition.niche) problems.push(`${edition.niche}: ${where} is also used by the "${other}" pack (${id})`);
      else seen.set(id, edition.niche);
    }
  }
  return problems;
}

function hostProblem(url: string, hosts: readonly string[]): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "is not a URL";
  }
  if (parsed.protocol !== "https:") return "is not https";
  return hosts.includes(parsed.hostname) ? null : `is on ${parsed.hostname}, not on ${hosts.join(" or ")}`;
}

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);

/**
 * Catalog and account routes, the platform's own pages and the outside links
 * the templates use today (docs/template-rules.md §5; social, WhatsApp and
 * map links are replaced by the store's contact data on install).
 */
const ROUTE =
  /^(\/|\/products(\?(category=[\w-]+|search=[^&]+|sort=(newest|popularity|rating|price-low|price-high)))?|\/(cart|profile|profile\/wishlist|profile\/orders)|\/(privacy|terms|shipping|returns|blog)|https:\/\/(www\.facebook\.com|www\.instagram\.com|www\.youtube\.com|www\.tiktok\.com|wa\.me|maps\.google\.com)\/\S*|https:\/\/tallaby\.com|tel:\+\d+|mailto:[^\s]+)$/;

/** Links of the built site that go nowhere: not a page of the look, not a catalog route. */
function deadLinks(config: SiteConfig): string[] {
  const pages = new Set(config.pages.filter((p) => p.kind !== "product").map((p) => `/${p.slug}`));
  const sections = [config.header, config.footer, ...config.pages.flatMap((p) => p.content.sections)];
  const dead = new Set<string>();
  for (const section of sections) {
    for (const node of walk(section?.componentTree)) {
      const href = node.props.href;
      if (typeof href === "string" && !pages.has(href) && !ROUTE.test(href)) dead.add(`${section!.id}: "${href}"`);
    }
  }
  return [...dead];
}

/** Lists of the built site the pack's catalog does not fill (the rule of `demo-fill.test.ts`): `section > list: shown/limit`. */
function shortLists(template: TemplateDefinition, config: SiteConfig): string[] {
  const product = templateDemoProduct(template.demo, { locale: "en" });
  const problems: string[] = [];
  const check = (sections: readonly SectionInstance[], withProduct: boolean) => {
    const queries = collectCatalogQueries(sections, storeSectionRegistry, withProduct ? { product } : undefined);
    const ctx = { catalog: resolveDemoCatalog(queries, template.demo, "en"), mode: "view" } as unknown as RenderContext;
    for (const section of sections) {
      for (const node of walk(section.componentTree)) {
        if (node.type !== "productList" && node.type !== "categoryList") continue;
        if (isPaginated(node) || (Array.isArray(node.props?.categoryIds) && node.props.categoryIds.length)) continue;
        const limit = typeof node.props?.limit === "number" ? node.props.limit : 8;
        const columns = typeof (node.style as { columns?: unknown } | undefined)?.columns === "number" ? ((node.style as { columns: number }).columns) : 1;
        const shown = listRecords(node, ctx).length;
        if (shown < limit || (columns > 1 && shown % columns !== 0)) problems.push(`${section.id} > ${node.type}: ${shown}/${limit} (${columns} columns)`);
      }
    }
  };
  check(
    [config.header, config.footer].filter((section): section is SectionInstance => section != null),
    false,
  );
  for (const page of config.pages) check(page.content.sections, page.kind === "product");
  return problems;
}

/**
 * The problems of an edition on one look; empty when it may ship. `look` is
 * the look's own template (`getCodeTemplate(key)`).
 */
export function validateEdition(edition: Edition, look: TemplateDefinition, options: ValidateEditionOptions = {}): string[] {
  const problems: string[] = [];
  const { demo } = edition;
  const between = (n: number, [min, max]: readonly [number, number]) => n >= min && n <= max;

  // ── The catalog ──
  if (!between(demo.categories.length, EDITION_LIMITS.categories)) problems.push(`has ${demo.categories.length} categories (4–8)`);
  if (!between(demo.products.length, EDITION_LIMITS.products)) problems.push(`has ${demo.products.length} products (12–24)`);
  const categoryIds = new Set(demo.categories.map((c) => c.id));
  if (categoryIds.size !== demo.categories.length) problems.push("has two categories with one id");
  for (const key of ["id", "slug"] as const) {
    const values = demo.products.map((p) => p[key]);
    const twice = values.filter((value, i) => values.indexOf(value) !== i);
    if (twice.length) problems.push(`has two products with the ${key} "${twice[0]}"`);
  }
  for (const product of demo.products) {
    if (!categoryIds.has(product.categoryId)) problems.push(`product ${product.slug} is in "${product.categoryId}", which is not one of its categories`);
    if (product.price === null || product.price < edition.priceBand.min || product.price > edition.priceBand.max) {
      problems.push(`product ${product.slug} costs ${product.price} EGP, outside ${edition.priceBand.min}–${edition.priceBand.max}`);
    }
    if (product.compareAtPrice !== null && product.price !== null && product.compareAtPrice <= product.price) {
      problems.push(`product ${product.slug} has a compare-at price that is not above its price`);
    }
    if (!product.image) problems.push(`product ${product.slug} has no photo`);
  }
  demo.categories.forEach((category, i) => {
    const count = demo.products.filter((p) => p.categoryId === category.id).length;
    if (count < EDITION_LIMITS.productsPerCategory) problems.push(`category ${category.id} has ${count} products (at least ${EDITION_LIMITS.productsPerCategory})`);
    if (category.productCount !== count) problems.push(`category ${category.id} says ${category.productCount} products, it has ${count}`);
    if (category.image !== null && category.image !== edition.photos.tiles[i]) problems.push(`category ${category.id} has its own image: its photo is photos.tiles[${i}], leave image null`);
  });
  for (const id of Object.keys(edition.variants ?? {})) {
    if (!demo.products.some((p) => p.id === id)) problems.push(`variants: "${id}" is not one of its product ids`);
  }

  // ── The copy ──
  const strings = [
    ...localizedIn(edition.copy, "copy"),
    ...localizedIn(demo.store, "demo.store"),
    ...demo.categories.flatMap((c) => localizedIn(c.name, `category ${c.id}`)),
    ...demo.products.flatMap((p) => localizedIn(p.title, `product ${p.slug}`)),
    ...localizedIn(edition.variants ?? {}, "variants"),
    ...localizedIn(edition.productPage?.copy ?? {}, "productPage.copy"),
    ...(edition.extras ?? []).flatMap((extra, i) => localizedIn(extra.patch?.text ?? {}, `extras[${i}].text`)),
  ];
  for (const [path, text] of strings) {
    if (!text.ar.trim()) problems.push(`${path}: the Arabic is empty`);
    else if (!ARABIC.test(text.ar)) problems.push(`${path}: the Arabic side has no Arabic ("${text.ar}")`);
    if (!text.en.trim()) problems.push(`${path}: the English is empty`);
    else if (ARABIC.test(text.en)) problems.push(`${path}: the English side has Arabic ("${text.en}")`);
    for (const side of [text.ar, text.en]) if (OFFER_COPY.test(side)) problems.push(`${path}: reads as an offer or discount ("${side}")`);
  }
  for (const locale of ["ar", "en"] as const) {
    const count = words(edition.copy.hero.title[locale]);
    if (count > EDITION_LIMITS.heroTitleWords) problems.push(`copy.hero.title.${locale} has ${count} words (at most ${EDITION_LIMITS.heroTitleWords})`);
  }
  if (edition.copy.announcement.length !== 3) problems.push(`copy.announcement has ${edition.copy.announcement.length} lines (exactly 3)`);
  if (edition.copy.trust.length !== 4) problems.push(`copy.trust has ${edition.copy.trust.length} promises (exactly 4)`);

  // ── The photos ──
  const photoHosts = [...EDITION_PHOTO_HOSTS, ...(options.photoHosts ?? [])];
  const photos = editionPhotos(edition);
  for (const [where, url] of photos) {
    const problem = url ? hostProblem(url, photoHosts) : null;
    if (problem) problems.push(`${where}: the photo ${problem}`);
  }
  for (const video of [edition.photos.hero.video, edition.photos.dark?.hero?.video]) {
    const problem = video ? hostProblem(video, [...EDITION_VIDEO_HOSTS, ...(options.photoHosts ?? [])]) : null;
    if (problem) problems.push(`photos.hero.video: the video ${problem}`);
  }
  const firstUse = new Map<string, string>();
  for (const [where, url] of photos) {
    if (!url) continue;
    const id = photoId(url);
    const before = firstUse.get(id);
    if (before) problems.push(`${where} uses the same photo as ${before} (${id})`);
    else firstUse.set(id, where);
  }
  for (const [name, tiles] of [
    ["photos.tiles", edition.photos.tiles],
    ["photos.dark.tiles", edition.photos.dark?.tiles],
  ] as const) {
    if (tiles && tiles.length !== demo.categories.length) problems.push(`${name} has ${tiles.length} photos for ${demo.categories.length} categories`);
  }

  // ── The extras ──
  const extras = edition.extras ?? [];
  if (extras.length > EDITION_LIMITS.extras) problems.push(`has ${extras.length} extras (at most ${EDITION_LIMITS.extras})`);
  for (const extra of extras) {
    const design = getDesign(extra.design);
    if (!design) problems.push(`extra "${extra.design}" is not a section library design`);
    else if (isDiscountDesign(design)) problems.push(`extra "${extra.design}" is a promotion or discount section`);
  }

  // ── On the look ──
  if (!isEditionReady(look.key)) return [...problems, `look "${look.key}" is not edition-ready`];
  let config: SiteConfig;
  let built: TemplateDefinition;
  try {
    built = applyEdition(look, edition);
    // Builds every page: a copy, link or list the look's sections do not hold throws here.
    config = built.config();
  } catch (error) {
    return [...problems, `does not build on look "${look.key}": ${error instanceof Error ? error.message : String(error)}`];
  }
  for (const link of deadLinks(config)) problems.push(`on look "${look.key}", a link goes to no page or catalog route: ${link}`);
  for (const list of shortLists(built, config)) problems.push(`on look "${look.key}", its catalog does not fill a list: ${list}`);
  return problems;
}
