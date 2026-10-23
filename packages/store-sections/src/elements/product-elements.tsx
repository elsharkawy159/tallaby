/**
 * Product page elements (template product page spec §5.3, §5.5). Each one
 * draws a part of the page's product: from the `product` scope the renderer
 * seeds on a product page, else `ctx.product`. The builder canvas and the
 * Admin editors have no product components, so every element has a hook-free
 * still rendering here, styled by the `--sf-*` tokens and the node's own
 * style (scoped CSS on `data-node-id`); its buttons do nothing. On the
 * storefront, a host hook (`ctx.renderProductBuyBox`…) draws the interactive
 * copy inside the node's box; without one the still rendering is the
 * fallback. Publicly, no product means nothing is drawn. Product content
 * html is printed as given: the host sanitises it on the server (no
 * sanitizer here, so it stays out of the editor's client bundle).
 */
import type { ReactNode } from "react";
import { ChevronDown, Image as ImageIcon, Minus, Plus, ShoppingBag, Star, Store, Truck } from "lucide-react";
import { sectionText } from "../core/copy";
import { DEMO_PRODUCT } from "../core/demo-product";
import { IMAGE_SIZES, imageSource, type ProductDetail, type ProductElementHook, type RenderContext } from "../core/types";
import { cn } from "../sections/_primitives";
import type { DataRecord } from "./data";
import type { ElementType } from "./registry";

export const PRODUCT_ELEMENT_TYPES = [
  "productGallery",
  "productPrice",
  "productStock",
  "productRating",
  "productVariants",
  "productBuyBox",
  "productDetails",
  "productContent",
  "productSeller",
  "productReviews",
] as const satisfies readonly ElementType[];
export type ProductElementType = (typeof PRODUCT_ELEMENT_TYPES)[number];

type HookKey = "renderProductGallery" | "renderProductPrice" | "renderProductStock" | "renderProductVariants" | "renderProductBuyBox" | "renderProductReviews";

/** The interactive elements and the host hook that draws each on the storefront. */
const HOOKS: Partial<Record<ProductElementType, HookKey>> = {
  productGallery: "renderProductGallery",
  productPrice: "renderProductPrice",
  productStock: "renderProductStock",
  productVariants: "renderProductVariants",
  productBuyBox: "renderProductBuyBox",
  productReviews: "renderProductReviews",
};

type Attrs = Record<string, string>;
type StillProps = { product: ProductDetail; props: Record<string, unknown>; attrs: Attrs; ctx: RenderContext };

/** At or below this, stock reads "Only N left" (as on today's product page). */
const LOW_STOCK = 5;
const MAX_GALLERY_IMAGES = 10;
const MAX_THUMBS = 6;
/** Swatch colours go into an inline style: plain colour syntax only, never `url()`. */
const SWATCH_RE = /^(?:#[0-9a-f]{3,8}|[a-z]{3,20}|(?:rgb|hsl)a?\([0-9.,%\s/]+\))$/i;

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
const BUTTON_BASE =
  "pointer-events-none inline-flex h-12 items-center justify-center gap-2 rounded-(--sf-radius,12px) px-6 text-sm font-semibold disabled:cursor-default";

/** The product an element shows: its scope's, the page's, or (editor only) the sample product. */
function productOf(ctx: RenderContext, scope: DataRecord | undefined): ProductDetail | null {
  if (scope?.kind === "product") return scope.record;
  return ctx.product ?? (ctx.mode === "edit" ? DEMO_PRODUCT : null);
}

/** Stock of the whole product: its own count, else what its variants hold. */
export function productStockCount(product: ProductDetail): number {
  if (product.quantity > 0) return product.quantity;
  return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.quantity), 0);
}

/** The list price when it is above the selling price. */
function listPrice(product: ProductDetail): number | null {
  return product.price != null && product.compareAtPrice != null && product.compareAtPrice > product.price ? product.compareAtPrice : null;
}

function discountOf(product: ProductDetail): number | null {
  const list = listPrice(product);
  if (!list || product.price == null) return null;
  const percent = product.discountPercent ?? Math.round((1 - product.price / list) * 100);
  return percent > 0 ? percent : null;
}

/** Resolved, distinct photo URLs: the gallery, else the cover photo. */
function galleryUrls(product: ProductDetail, ctx: RenderContext): string[] {
  const sources = product.images.length ? product.images : product.image ? [product.image] : [];
  const urls = sources.map((src) => ctx.imageUrl(src)).filter((url): url is string => Boolean(url));
  return [...new Set(urls)].slice(0, MAX_GALLERY_IMAGES);
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-[1em]", n <= full ? "fill-(--sf-sun) text-(--sf-sun)" : "text-(--sf-line)")} />
      ))}
    </span>
  );
}

/** A dashed note telling the seller what fills an empty element (editor only). */
function EditorNote({ attrs, children }: { attrs: Attrs; children: ReactNode }) {
  return (
    <div {...attrs} className="min-w-0">
      <p data-editor-only className="rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-4 text-center text-xs text-(--sf-muted)">
        {children}
      </p>
    </div>
  );
}

function Gallery({ product, props, attrs, ctx }: StillProps) {
  const urls = galleryUrls(product, ctx);
  const thumbs = (["side", "bottom", "none"] as const).find((v) => v === props.thumbs) ?? "side";
  const zoom = props.zoom !== false;
  const [main] = urls;
  const frame = (
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
      {main ? (
        // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
        <img
          {...imageSource(ctx, main, IMAGE_SIZES.content)}
          alt={product.title}
          className={cn("block aspect-square w-full object-cover", zoom && "cursor-zoom-in")}
          decoding="async"
        />
      ) : (
        <div data-part="gallery-placeholder" aria-hidden className="flex aspect-square w-full items-center justify-center text-(--sf-muted)">
          <ImageIcon className="size-12 opacity-50" />
        </div>
      )}
      {urls.length > 1 && thumbs === "none" && (
        <span aria-hidden data-part="dots" className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {urls.map((url, i) => (
            <span key={url} className={cn("h-1.5 rounded-full bg-(--sf-paper)", i === 0 ? "w-5" : "w-1.5 opacity-60")} />
          ))}
        </span>
      )}
    </div>
  );
  const strip =
    urls.length > 1 && thumbs !== "none" ? (
      <div data-part="thumbs" className={cn("flex gap-2 overflow-x-auto", thumbs === "side" && "md:w-20 md:shrink-0 md:flex-col md:overflow-x-visible")}>
        {urls.slice(0, MAX_THUMBS).map((url, i) => (
          <span
            key={url}
            className={cn(
              "block size-16 shrink-0 overflow-hidden rounded-[calc(var(--sf-radius,12px)*0.6)] border-2 bg-(--sf-shelf) md:size-20",
              i === 0 ? "border-(--sf-ink)" : "border-transparent opacity-70",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img {...imageSource(ctx, url, "80px")} alt="" className="block size-full object-cover" loading="lazy" decoding="async" />
          </span>
        ))}
      </div>
    ) : null;
  return (
    // Beside: the strip is first, so it sits at the start side on desktop and (column-reverse) under the photo on phones.
    <div
      {...attrs}
      role="group"
      aria-label={sectionText("productPhotos", ctx.locale)}
      className={cn("flex min-w-0 gap-3", thumbs === "side" ? "flex-col-reverse md:flex-row" : "flex-col")}
    >
      {thumbs === "side" ? (
        <>
          {strip}
          {frame}
        </>
      ) : (
        <>
          {frame}
          {strip}
        </>
      )}
    </div>
  );
}

function Price({ product, props, attrs, ctx }: StillProps) {
  const list = listPrice(product);
  const percent = props.showDiscount !== false ? discountOf(product) : null;
  const endsAt = props.showCountdown !== false && list && product.discountEndsAt && Date.parse(product.discountEndsAt) > Date.now() ? product.discountEndsAt : null;
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {product.price != null && <span className="text-3xl font-bold tabular-nums text-(--sf-ink)">{ctx.formatPrice(product.price)}</span>}
        {list != null && <s className="text-lg tabular-nums text-(--sf-muted)">{ctx.formatPrice(list)}</s>}
        {percent != null && (
          <span dir="ltr" className="rounded-full bg-(--sf-brand) px-2.5 py-0.5 text-xs font-bold text-(--sf-brand-ink,#fff)">
            -{percent}%
          </span>
        )}
      </div>
      {endsAt && (
        <p className="text-sm text-(--sf-muted)">
          {ctx.renderCountdown?.(endsAt, attrs["data-node-id"]!) ?? sectionText("offerEnds", ctx.locale, { date: ctx.formatDate?.(endsAt) ?? endsAt.slice(0, 10) })}
        </p>
      )}
      {product.seller.freeDelivery && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-(--sf-ink)">
          <Truck className="size-4 text-(--sf-brand)" aria-hidden />
          {sectionText("freeDelivery", ctx.locale)}
        </p>
      )}
    </div>
  );
}

function Stock({ product, attrs, ctx }: StillProps) {
  const count = productStockCount(product);
  const text = count <= 0 ? sectionText("outOfStock", ctx.locale) : count <= LOW_STOCK ? sectionText("onlyLeft", ctx.locale, { n: count }) : sectionText("inStock", ctx.locale);
  return (
    <p {...attrs} className={cn("inline-flex w-fit items-center gap-2 text-sm font-medium", count <= 0 ? "text-(--sf-muted)" : "text-(--sf-ink)")}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", count <= 0 ? "bg-(--sf-muted)" : "bg-(--sf-brand)")} />
      {text}
    </p>
  );
}

function Rating({ product, props, attrs, ctx }: StillProps) {
  const rating = product.rating ?? 0;
  if (product.reviewCount <= 0 && ctx.mode !== "edit") return null;
  const body = (
    <>
      <Stars rating={rating} className="text-base" />
      {product.reviewCount > 0 ? (
        <>
          <span className="font-semibold tabular-nums text-(--sf-ink)">{rating.toFixed(1)}</span>
          {props.showCount !== false && <span className="text-(--sf-muted)">({sectionText("reviewsCount", ctx.locale, { n: product.reviewCount })})</span>}
        </>
      ) : (
        <span className="text-(--sf-muted)">{sectionText("reviewsNone", ctx.locale)}</span>
      )}
    </>
  );
  const row = "inline-flex w-fit items-center gap-2 text-sm";
  // The editor has no reviews to jump to; the storefront links to the reviews element.
  return ctx.mode === "edit" ? (
    <div {...attrs} className={row}>
      {body}
    </div>
  ) : (
    <a {...attrs} href="#reviews" className={cn(row, "hover:underline")}>
      {body}
    </a>
  );
}

function Variants({ product, attrs, ctx }: StillProps) {
  if (!product.variants.length) return ctx.mode === "edit" ? <EditorNote attrs={attrs}>{sectionText("productNoOptions", ctx.locale)}</EditorNote> : null;
  const selected = product.variants.find((variant) => variant.quantity > 0) ?? product.variants[0]!;
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-3">
      <p className="text-sm font-semibold text-(--sf-ink)">
        {sectionText("productOptions", ctx.locale)}: <span className="font-normal text-(--sf-muted)">{selected.label}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {product.variants.map((variant) => {
          const out = variant.quantity <= 0;
          const swatch = variant.color && SWATCH_RE.test(variant.color) ? variant.color : null;
          return (
            <span
              key={variant.id}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border bg-(--sf-paper) px-4 text-sm font-medium",
                variant.id === selected.id ? "border-(--sf-ink) text-(--sf-ink) ring-1 ring-(--sf-ink)" : "border-(--sf-line) text-(--sf-ink)",
                out && "text-(--sf-muted) line-through opacity-60",
              )}
            >
              {swatch && <span aria-hidden className="size-5 shrink-0 rounded-full border border-(--sf-line)" style={{ backgroundColor: swatch }} />}
              {variant.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function BuyBox({ product, props, attrs, ctx }: StillProps) {
  const out = productStockCount(product) <= 0;
  const addLabel = out ? sectionText("outOfStock", ctx.locale) : str(props.addLabel, 60) || sectionText("addToCart", ctx.locale);
  const buyLabel = str(props.buyLabel, 60) || sectionText("buyNow", ctx.locale);
  const step = "pointer-events-none flex size-11 items-center justify-center text-(--sf-ink) disabled:opacity-60";
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-stretch gap-3">
        <div role="group" aria-label={sectionText("quantity", ctx.locale)} className="inline-flex h-12 shrink-0 items-center rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper)">
          <button type="button" disabled tabIndex={-1} aria-label={sectionText("quantityLess", ctx.locale)} className={step}>
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums text-(--sf-ink)">1</span>
          <button type="button" disabled tabIndex={-1} aria-label={sectionText("quantityMore", ctx.locale)} className={step}>
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <button type="button" disabled tabIndex={-1} className={cn(BUTTON_BASE, "min-w-0 flex-1 bg-(--sf-brand) text-(--sf-brand-ink,#fff)", out && "opacity-50")}>
          <ShoppingBag className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{addLabel}</span>
        </button>
      </div>
      {props.buyNow !== false && !out && (
        <button type="button" disabled tabIndex={-1} className={cn(BUTTON_BASE, "w-full border border-(--sf-ink) bg-transparent text-(--sf-ink)")}>
          {buyLabel}
        </button>
      )}
    </div>
  );
}

/** Description and key features as collapsible rows, drawn like the accordion element. */
function Details({ product, props, attrs, ctx }: StillProps) {
  const description = props.showDescription !== false ? product.description?.trim() : "";
  const bullets = props.showBullets !== false ? product.bulletPoints.filter((point) => point.trim()) : [];
  if (!description && !bullets.length) return ctx.mode === "edit" ? <EditorNote attrs={attrs}>{sectionText("productNoDetails", ctx.locale)}</EditorNote> : null;
  const row = (title: string, open: boolean, body: ReactNode) => (
    <details open={open} className="group border-b border-(--sf-line) py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-semibold text-(--sf-ink) [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="mt-3">{body}</div>
    </details>
  );
  return (
    <div {...attrs} className="flex min-w-0 flex-col border-t border-(--sf-line)">
      {description && row(sectionText("productDescription", ctx.locale), true, <p className="whitespace-pre-line text-pretty leading-relaxed text-(--sf-muted)">{description}</p>)}
      {bullets.length > 0 &&
        row(
          sectionText("productFeatures", ctx.locale),
          !description,
          <ul className="list-disc space-y-1.5 ps-5 leading-relaxed text-(--sf-muted)">
            {bullets.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>,
        )}
    </div>
  );
}

/** Rich text styles for the product's own content (headings, lists, links, photos). */
const CONTENT_CLASS = cn(
  "min-w-0 leading-relaxed text-(--sf-ink)",
  "[&_p]:my-3 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1",
  "[&_a]:text-(--sf-brand) [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-s-4 [&_blockquote]:border-(--sf-brand) [&_blockquote]:ps-4 [&_blockquote]:italic",
  "[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-(--sf-radius,12px) [&_hr]:my-6 [&_hr]:border-(--sf-line)",
);

function Content({ product, attrs, ctx }: StillProps) {
  const html = product.contentHtml?.trim() ?? "";
  if (!html) return ctx.mode === "edit" ? <EditorNote attrs={attrs}>{sectionText("productNoContent", ctx.locale)}</EditorNote> : null;
  // `contentHtml` is sanitised by the host on the server when it builds the ProductDetail (core/types.ts).
  return <div {...attrs} className={CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Seller({ product, attrs, ctx }: StillProps) {
  const { seller } = product;
  return (
    <div {...attrs} className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--sf-shelf) text-(--sf-ink)">
        <Store className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-(--sf-muted)">{sectionText("soldBy", ctx.locale)}</p>
        <p className="truncate font-semibold text-(--sf-ink)">{seller.name}</p>
      </div>
      {seller.rating != null && seller.ratingCount > 0 && (
        <span className="ms-auto inline-flex shrink-0 items-center gap-1 text-sm">
          <Star className="size-4 fill-(--sf-sun) text-(--sf-sun)" aria-hidden />
          <span className="font-semibold tabular-nums">{seller.rating.toFixed(1)}</span>
          <span className="text-(--sf-muted)">({seller.ratingCount})</span>
        </span>
      )}
    </div>
  );
}

function Reviews({ product, attrs, ctx }: StillProps) {
  const rating = product.rating ?? 0;
  const count = product.reviewCount;
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-6">
      <h2 className="text-2xl font-bold text-(--sf-ink)">{sectionText("reviewsTitle", ctx.locale)}</h2>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-5xl font-bold tabular-nums text-(--sf-ink)">{count > 0 ? rating.toFixed(1) : "0.0"}</span>
        <div className="flex flex-col gap-1">
          <Stars rating={count > 0 ? rating : 0} className="text-lg" />
          <span className="text-sm text-(--sf-muted)">{count > 0 ? sectionText("reviewsCount", ctx.locale, { n: count }) : sectionText("reviewsNone", ctx.locale)}</span>
        </div>
      </div>
      {count <= 0 && <p className="rounded-(--sf-radius,12px) bg-(--sf-shelf) p-6 text-center text-sm text-(--sf-muted)">{sectionText("reviewsEmpty", ctx.locale)}</p>}
    </div>
  );
}

const STILLS: Record<ProductElementType, (p: StillProps) => ReactNode> = {
  productGallery: Gallery,
  productPrice: Price,
  productStock: Stock,
  productRating: Rating,
  productVariants: Variants,
  productBuyBox: BuyBox,
  productDetails: Details,
  productContent: Content,
  productSeller: Seller,
  productReviews: Reviews,
};

/**
 * One product element. On the storefront the host hook, when there is one,
 * draws inside the node's box; otherwise (the editor, Admin, or a host
 * without hooks) the still rendering.
 */
export function renderProductElement(type: ProductElementType, props: Record<string, unknown>, nodeAttrs: Attrs, ctx: RenderContext, scope?: DataRecord): ReactNode {
  const product = productOf(ctx, scope);
  if (!product) return null;
  // The rating links to the reviews (one per page).
  const attrs = type === "productReviews" ? { ...nodeAttrs, id: "reviews" } : nodeAttrs;
  const hookKey = HOOKS[type];
  const hook: ProductElementHook | undefined = hookKey && ctx.mode === "public" ? ctx[hookKey] : undefined;
  if (hook) {
    return (
      <div {...attrs} className="min-w-0">
        {hook(product, props)}
      </div>
    );
  }
  return STILLS[type]({ product, props, attrs, ctx });
}
