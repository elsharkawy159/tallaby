/**
 * Draws `code` nodes and scopes seller CSS on the storefront (ROADMAP F-101,
 * code-sections design §4 and §6). Server only: it runs the Liquid engine
 * (`node:crypto`) and postcss, so it is reached through its own package entry
 * (`@workspace/store-sections/code-render`) and injected into the shared
 * renderer as `ctx.renderCodeNode`; the editor canvas never imports it.
 *
 * - Liquid reads only data the page already loaded (`collectCatalogQueries`
 *   with `codeSections`), of the request's store only (rule 5).
 * - Every result is cleaned by `sanitizeCodeHtml` (the security boundary) and
 *   drawn in one `<div data-node-id class="code-node">`. No script is emitted.
 * - Nothing is drawn when the switch is off, on a pass-through route (§4.8),
 *   or for a page type other than `CODE_PAGE_TYPES` ("page", "product"). The
 *   storefront draws builder pages as "page" and the product page as
 *   "product", and the shared header and footer as "page" on every route that
 *   isn't pass-through (the catalog, blog and search pages too), so code in
 *   them shows site-wide; the catalog's own product cards are "catalog".
 * - Output is cached in-process for 60 s per store, revision, node, locale and
 *   data hash (rule 8); never in a preview.
 */
import { createHash } from "node:crypto";
import type { ReactNode } from "react";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { CODE_PAGE_TYPES, type CategorySummary, type CodeSectionsContext, type ProductDetail, type ProductSummary, type RenderContext } from "../core/types";
import { codeCollectionKey, codeProductsKey, type DataRecord } from "../elements/data";
import { codeCssTargets } from "../elements/style";
import { blockSettingDefs, readCodeProps, type RenderableCodeProps } from "./code-props";
import { renderLiquid } from "./liquid.server";
import {
  LiquidHtml,
  toLiquidBlock,
  toLiquidProduct,
  type LiquidCollection,
  type LiquidImage,
  type LiquidProduct,
  type LiquidProductInput,
  type LiquidScope,
} from "./liquid-objects";
import { sanitizeCodeHtml } from "./sanitize-code";
import { scopeCss } from "./scope-css";
import { hasValue, type SettingDef } from "./section-schema";

const NODE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** True when code nodes may draw for this request (switch on, a builder page or the product page, not a pass-through route). */
export function codeSectionsAllowed(cs: CodeSectionsContext | undefined): cs is CodeSectionsContext {
  return Boolean(cs?.enabled && !cs.passThrough && (CODE_PAGE_TYPES as readonly string[]).includes(cs.pageType));
}

// ---------------------------------------------------------------------------
// In-process cache (a small LRU on a Map)
// ---------------------------------------------------------------------------

export const CODE_CACHE_TTL_MS = 60_000;
const CODE_CACHE_SIZE = 1000;

class TtlLru {
  private readonly map = new Map<string, { value: string; expires: number }>();
  constructor(private readonly size: number) {}
  get(key: string): string | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    this.map.delete(key);
    if (entry.expires <= Date.now()) return undefined;
    this.map.set(key, entry);
    return entry.value;
  }
  set(key: string, value: string): void {
    this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + CODE_CACHE_TTL_MS });
    while (this.map.size > this.size) this.map.delete(this.map.keys().next().value as string);
  }
  clear(): void {
    this.map.clear();
  }
  get count(): number {
    return this.map.size;
  }
}

const outputCache = new TtlLru(CODE_CACHE_SIZE);
const cssCache = new TtlLru(CODE_CACHE_SIZE);

/** For tests. */
export function clearCodeRenderCache(): void {
  outputCache.clear();
  cssCache.clear();
}

/** For tests. */
export function codeRenderCacheSize(): number {
  return outputCache.count;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

const isPlainObject = (v: unknown): v is Record<string, unknown> => v != null && typeof v === "object" && !Array.isArray(v);

/** A stored `{ ar, en }` (or plain) text in the request locale, falling back to the other language. */
function localText(value: unknown, locale: "ar" | "en"): string {
  if (typeof value === "string") return value;
  if (!isPlainObject(value)) return "";
  const other = locale === "ar" ? "en" : "ar";
  const mine = Object.hasOwn(value, locale) ? value[locale] : undefined;
  const fallback = Object.hasOwn(value, other) ? value[other] : undefined;
  if (typeof mine === "string" && mine) return mine;
  return typeof fallback === "string" ? fallback : "";
}

const image = (src: string | null | undefined, alt = ""): LiquidImage | null => (src ? { src, alt, width: null, height: null } : null);

/**
 * The path prefix of the page's language on the store, by the storefront's own
 * link rule (`storeLocalePrefix` in `@workspace/lib/storefront`, which the
 * storefront's `Link` follows): "" in the language of the store's unprefixed
 * address, else "/ar" or "/en".
 */
export function codeLocalePrefix(locale: "ar" | "en", defaultLocale: string | null | undefined): string {
  const base = defaultLocale === "en" ? "en" : "ar";
  return locale === base ? "" : `/${locale}`;
}

/**
 * A storefront path ("/", "/products/x", "/products?category=y") in the page's
 * language, as the storefront's `Link` writes it. Links to other sites,
 * `mailto:`/`tel:`, "#…" and paths that already start with a language stay
 * as they are.
 */
export function localizeCodePath(url: string, prefix: string): string {
  if (!prefix || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return url;
  if (/^\/(?:ar|en)(?=$|[/?#])/.test(url)) return url;
  return url === "/" ? prefix : `${prefix}${url}`;
}

/** The slug of a storefront product link (`/products/<slug>`), else the id. */
function slugOf(p: ProductSummary): string {
  const match = /^\/products\/([^/?#]+)/.exec(p.href);
  if (!match?.[1]) return p.id;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function summaryInput(p: ProductSummary, prefix: string): LiquidProductInput {
  return {
    id: p.id,
    title: p.title,
    slug: slugOf(p),
    url: localizeCodePath(p.href, prefix),
    price: p.price ?? 0,
    compareAtPrice: p.compareAtPrice ?? null,
    available: p.inStock !== false,
    images: [p.image, p.secondImage].filter((src): src is string => typeof src === "string" && src !== "").map((url) => ({ url })),
    rating: p.rating ?? null,
  };
}

function detailInput(p: ProductDetail, prefix: string): LiquidProductInput {
  return {
    ...summaryInput(p, prefix),
    slug: p.slug || slugOf(p),
    images: (p.images.length ? p.images : [p.image]).filter((src): src is string => typeof src === "string" && src !== "").map((url) => ({ url })),
    brandName: p.brand,
    categoryName: p.category?.name ?? null,
    reviewCount: p.reviewCount,
    variants: p.variants.map((v) => ({ id: v.id, title: v.label, price: v.price ?? p.price ?? 0, available: v.quantity > 0 })),
  };
}

/** The product around the node: the list card it repeats in, or the product page's product. */
function scopeProduct(scope: DataRecord | undefined, prefix: string): LiquidProduct | null {
  if (scope?.kind === "productList") return toLiquidProduct(summaryInput(scope.record, prefix));
  if (scope?.kind === "product") return toLiquidProduct(detailInput(scope.record, prefix));
  return null;
}

/** Resolves picked products and categories from the page's catalog: only records the host returned for this store. */
function catalogLookup(nodeId: string, ctx: CodeScopeContext, prefix: string) {
  const picked = new Map((ctx.catalog.products[codeProductsKey(nodeId)] ?? []).map((p) => [p.id, p]));
  const products = new Map<string, LiquidProduct | null>();
  const collections = new Map<string, LiquidCollection | null>();
  const product = (id: unknown): LiquidProduct | null => {
    if (typeof id !== "string") return null;
    if (!products.has(id)) {
      const row = picked.get(id);
      products.set(id, row ? toLiquidProduct(summaryInput(row, prefix)) : null);
    }
    return products.get(id) ?? null;
  };
  const collection = (id: unknown): LiquidCollection | null => {
    if (typeof id !== "string") return null;
    if (!collections.has(id)) {
      const category: CategorySummary | undefined = ctx.catalog.categories.find((c) => c.id === id);
      if (!category) collections.set(id, null);
      else {
        const list = (ctx.catalog.products[codeCollectionKey(nodeId, id)] ?? []).map((p) => toLiquidProduct(summaryInput(p, prefix)));
        collections.set(id, {
          id: category.id,
          title: category.name,
          handle: category.key,
          url: localizeCodePath(category.href, prefix),
          image: image(category.image, category.name),
          products: list,
          products_count: category.productCount ?? list.length,
        });
      }
    }
    return collections.get(id) ?? null;
  };
  return { product, collection };
}

type Lookup = ReturnType<typeof catalogLookup> & { prefix: string };

/** Setting values in the request locale, with picks resolved; only the defined settings. */
function localizeSettings(defs: readonly SettingDef[], values: Record<string, unknown>, ctx: CodeScopeContext, lookup: Lookup): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of defs) {
    if (!hasValue(def) || !Object.hasOwn(values, def.id)) continue;
    const value = values[def.id];
    switch (def.type) {
      case "text":
      case "textarea":
        out[def.id] = localText(value, ctx.locale);
        break;
      case "richtext":
      case "inline_richtext":
        // Cleaned on save; the whole output is cleaned again after Liquid runs.
        out[def.id] = new LiquidHtml(localText(value, ctx.locale));
        break;
      case "image_picker":
        out[def.id] = typeof value === "string" ? image(ctx.imageUrl(value)) : null;
        break;
      case "product":
        out[def.id] = lookup.product(value);
        break;
      case "product_list":
        out[def.id] = Array.isArray(value) ? value.map(lookup.product).filter((p): p is LiquidProduct => p !== null) : [];
        break;
      case "collection":
        out[def.id] = lookup.collection(value);
        break;
      case "collection_list":
        out[def.id] = Array.isArray(value) ? value.map(lookup.collection).filter((c): c is LiquidCollection => c !== null) : [];
        break;
      case "url":
        // A store page link follows the page's language, as a link element's does.
        out[def.id] = typeof value === "string" ? localizeCodePath(value, lookup.prefix) : value;
        break;
      default:
        // number, range, checkbox, select, radio, text_alignment, color(s), video_url: already plain values.
        out[def.id] = value;
    }
  }
  return out;
}

/** Plain string and number values only, for Liquid's `settings` (the design system). */
function plainValues(source: Record<string, unknown> | undefined): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) out[key] = value;
  }
  return out;
}

function designSettings(ds: CodeSectionsContext["designSystem"]): Record<string, unknown> {
  const typography = plainValues(ds?.typography);
  const spacing = plainValues(ds?.spacing);
  return {
    colors: plainValues(ds?.colors),
    font_heading: typography.headingFont ?? "",
    font_body: typography.bodyFont ?? "",
    font_arabic: typography.arabicFont ?? "",
    border_radius: spacing.borderRadius ?? null,
    container_max_width: spacing.containerMaxWidth ?? null,
    section_padding_y: spacing.sectionPaddingY ?? null,
  };
}

/**
 * What building a code node's Liquid data reads from the render context: the
 * storefront passes its `RenderContext`, the editor preview (`preview-code.server.ts`)
 * a context of the seller's own store.
 */
export type CodeScopeContext = Pick<RenderContext, "locale" | "dir" | "imageUrl"> & {
  store: Pick<RenderContext["store"], "name" | "url" | "logoUrl">;
  catalog: Pick<RenderContext["catalog"], "products" | "categories">;
};

/**
 * The Liquid data of one code node (design §4.3, §11.4). `designMode`: the
 * editor canvas draws it (`request.design_mode`); false on the storefront.
 */
export function buildCodeScope(
  node: Pick<ComponentNode, "id">,
  code: RenderableCodeProps,
  ctx: CodeScopeContext,
  cs: Pick<CodeSectionsContext, "pageType" | "currency" | "designSystem" | "defaultLocale">,
  scope: DataRecord | undefined,
  options: { designMode?: boolean } = {},
): LiquidScope {
  const prefix = codeLocalePrefix(ctx.locale, cs.defaultLocale);
  const lookup: Lookup = { ...catalogLookup(node.id, ctx, prefix), prefix };
  const path = (p: string) => localizeCodePath(p, prefix);
  const shop = {
    name: ctx.store.name,
    url: ctx.store.url,
    logo: image(ctx.store.logoUrl, ctx.store.name),
    currency: cs.currency,
    locale: ctx.locale,
    dir: ctx.dir,
  };
  return {
    section: {
      id: node.id,
      settings: localizeSettings(code.schema.settings, code.settings, ctx, lookup),
      blocks: code.blocks.map((block) =>
        toLiquidBlock({ id: block.id, type: block.type, settings: localizeSettings(blockSettingDefs(code.schema, block.type), block.settings, ctx, lookup) }),
      ),
    },
    product: scopeProduct(scope, prefix),
    shop,
    store: shop,
    request: { locale: ctx.locale, page_type: cs.pageType, design_mode: options.designMode === true },
    routes: { root_url: path("/"), collections_url: path("/products"), cart_url: path("/cart"), search_url: path("/products") },
    settings: designSettings(cs.designSystem),
    localization: {
      language: { iso_code: ctx.locale, name: ctx.locale === "ar" ? "العربية" : "English" },
      direction: ctx.dir,
    },
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** The cleaned HTML of one code node, or "" (nothing to draw). Never throws. */
export function renderCodeHtml(node: ComponentNode, ctx: RenderContext, scope?: DataRecord): string {
  const cs = ctx.codeSections;
  if (!codeSectionsAllowed(cs) || node.type !== "code" || !NODE_ID.test(node.id)) return "";
  const code = readCodeProps(node.props);
  if (!code) return "";
  const data = buildCodeScope(node, code, ctx, cs, scope);
  const cacheable = !cs.preview && ctx.mode === "public";
  const key = cacheable
    ? [cs.storeId, cs.revisionId || "live", node.id, ctx.locale, sha256(JSON.stringify([code.source, data, cs.currency, cs.currencyLabel ?? ""]))].join("\u0000")
    : "";
  if (cacheable) {
    const hit = outputCache.get(key);
    if (hit !== undefined) return hit;
  }
  let html = "";
  try {
    const result = renderLiquid(code.source, data, { locale: ctx.locale, currency: cs.currency, currencyLabel: cs.currencyLabel });
    if (result.error) {
      // One line: never the template or the message (it can quote the seller's code).
      console.warn(`[code-section] render failed store=${cs.storeId} node=${node.id} kind=${result.error.kind}`);
    } else {
      html = sanitizeCodeHtml(result.html, { nodeId: node.id });
    }
  } catch {
    console.warn(`[code-section] render failed store=${cs.storeId} node=${node.id} kind=render`);
    html = "";
  }
  // Errors are cached too, so a broken node logs once a minute, not on every request.
  if (cacheable) outputCache.set(key, html);
  return html;
}

/** `ctx.renderCodeNode` for the storefront's server render. */
export function renderCodeNode(node: ComponentNode, ctx: RenderContext, scope: DataRecord | undefined): ReactNode {
  const html = renderCodeHtml(node, ctx, scope);
  if (!html) return null;
  return <div data-node-id={node.id} className="code-node" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

/**
 * The page's seller CSS, scoped (design §6): each section's and node's
 * `customCss` and, on pages that draw code, each code node's `css`. Empty when
 * code sections are off, on pass-through routes, or when the page has none.
 * Pass it to `PageStyles` as `extraCss`; it is escaped there with the page's CSS.
 */
export function codePageCss(sections: readonly (SectionInstance | null | undefined)[], cs: CodeSectionsContext | undefined): string {
  if (!cs?.enabled || cs.passThrough) return "";
  const targets = codeCssTargets(sections, { codeNodes: codeSectionsAllowed(cs) });
  let out = "";
  for (const target of targets) {
    const key = [cs.storeId, sha256(`${target.scope}\u0000${target.keyframePrefix}\u0000${target.css}`)].join("\u0000");
    let css = cssCache.get(key);
    if (css === undefined) {
      try {
        css = scopeCss(target.css, { scope: target.scope, keyframePrefix: target.keyframePrefix }).css;
      } catch {
        css = "";
      }
      cssCache.set(key, css);
    }
    out += css;
  }
  return out;
}
