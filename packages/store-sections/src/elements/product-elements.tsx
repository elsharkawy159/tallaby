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
import { BadgeCheck, Banknote, Check, ChevronDown, ChevronRight, Image as ImageIcon, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { sectionText, type SectionCopyKey } from "../core/copy";
import { DEMO_PRODUCT } from "../core/demo-product";
import { decodeTextEntities } from "../core/text";
import { IMAGE_SIZES, imageSource, type ProductDetail, type ProductElementHook, type RenderContext } from "../core/types";
import { cn, SmartLink } from "../sections/_primitives";
import type { ComponentNode } from "../config/schema";
import { walkNodes, type DataRecord } from "./data";
import { ProductFlags } from "./product-flags";
import type { ElementType } from "./registry";

export const PRODUCT_ELEMENT_TYPES = [
  "productBreadcrumbs",
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
  "pointer-events-none inline-flex h-[54px] items-center justify-center gap-2 rounded-(--sf-radius,12px) px-6 text-base font-bold disabled:cursor-default";

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
  const percent = discountOf(product);
  // A square soft stage (design `.pd-stage`): the photo is contained, so a cut-out product never gets cropped.
  const frame = (
    <div className="relative min-w-0 flex-1 overflow-hidden rounded-[calc(var(--sf-radius,12px)*1.5)] bg-(--sf-shelf)">
      {main ? (
        // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
        <img
          {...imageSource(ctx, main, IMAGE_SIZES.content)}
          alt={product.title}
          className={cn("block aspect-square w-full object-contain", zoom && "cursor-zoom-in")}
          decoding="async"
        />
      ) : (
        <div data-part="gallery-placeholder" aria-hidden className="flex aspect-square w-full items-center justify-center text-(--sf-muted)">
          <ImageIcon className="size-12 opacity-50" />
        </div>
      )}
      {percent != null && (
        <span dir="ltr" data-part="discount" className="absolute start-3 top-3 rounded-full bg-[#dc2626] px-2.5 py-1 text-xs font-bold text-white tabular-nums">
          -{percent}%
        </span>
      )}
      {/* Dots: always without thumbnails, else only on phones (the thumbnails take over from tablet up). */}
      {urls.length > 1 && (
        <span aria-hidden data-part="dots" className={cn("absolute inset-x-0 bottom-3 flex justify-center gap-1.5", thumbs !== "none" && "md:hidden")}>
          {urls.map((url, i) => (
            <span
              key={url}
              className={cn("h-1.5 rounded-full", i === 0 ? "w-5 bg-(--sf-ink)" : "w-1.5 bg-[color-mix(in_srgb,var(--sf-ink)_25%,transparent)]")}
            />
          ))}
        </span>
      )}
    </div>
  );
  const strip =
    urls.length > 1 && thumbs !== "none" ? (
      <div data-part="thumbs" className={cn("flex gap-2.5 overflow-x-auto p-0.5", thumbs === "side" && "md:w-[76px] md:shrink-0 md:flex-col md:overflow-x-visible")}>
        {urls.slice(0, MAX_THUMBS).map((url, i) => (
          <span
            key={url}
            aria-current={i === 0 ? "true" : undefined}
            className={cn(
              "block size-[72px] shrink-0 overflow-hidden rounded-xl bg-(--sf-shelf) p-1.5 outline-2 -outline-offset-2",
              i === 0 ? "outline-(--sf-brand)" : "outline-transparent",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img {...imageSource(ctx, url, "80px")} alt="" className="block size-full rounded-lg object-contain" loading="lazy" decoding="async" />
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
      <ProductFlags product={product} ctx={ctx} />
      {/* Design `.pd-price`: the price, the struck list price, then what the shopper saves. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        {product.price != null && <span className="text-[28px] font-extrabold leading-none tabular-nums text-(--sf-ink) md:text-[32px]">{ctx.formatPrice(product.price)}</span>}
        {list != null && <s className="text-base tabular-nums text-(--sf-muted)">{ctx.formatPrice(list)}</s>}
        {percent != null && list != null && product.price != null && (
          <span className="rounded-full bg-[#dc2626]/10 px-2.5 py-1 text-[13px] font-bold leading-none text-[#dc2626]">
            {sectionText("saveAmount", ctx.locale, { amount: ctx.formatPrice(Math.round((list - product.price) * 100) / 100) })}
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
  // A clear pill: brand dot in stock, amber when few are left, muted when sold out.
  const tone = count <= 0 ? "out" : count <= LOW_STOCK ? "low" : "in";
  return (
    <p
      {...attrs}
      data-stock={tone}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold leading-none",
        tone === "out" ? "bg-(--sf-shelf) text-(--sf-muted)" : tone === "low" ? "bg-[#d97706]/10 text-[#b45309]" : "bg-(--sf-shelf) text-(--sf-ink)",
      )}
    >
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tone === "out" ? "bg-(--sf-muted)" : tone === "low" ? "bg-[#d97706]" : "bg-(--sf-brand)")} />
      {text}
    </p>
  );
}

/** The product's category link: the host's `href`, else the catalog filter by category id. */
function categoryHref(category: NonNullable<ProductDetail["category"]>): string {
  return category.href ?? `/products?category=${encodeURIComponent(category.id)}`;
}

/** A link to a store page; the editor draws it as plain text (nothing to navigate to). */
function StoreLink({ ctx, href, className, children }: { ctx: RenderContext; href: string; className?: string; children: ReactNode }) {
  if (ctx.mode === "edit") return <span className={className}>{children}</span>;
  return (
    <SmartLink ctx={ctx} href={href} className={className}>
      {children}
    </SmartLink>
  );
}

/**
 * The meta row (design `.pd-meta`): the category as a small badge link at the
 * start, the stars, the rating and the review count at the end. Without
 * reviews the storefront still shows the category badge.
 */
function Rating({ product, props, attrs, ctx }: StillProps) {
  const rating = product.rating ?? 0;
  const category = props.showCategory !== false && product.category?.name.trim() ? product.category : null;
  const reviewed = product.reviewCount > 0;
  if (!reviewed && !category && ctx.mode !== "edit") return null;
  const stars =
    reviewed || ctx.mode === "edit" ? (
      <>
        <Stars rating={reviewed ? rating : 0} className="text-base" />
        {reviewed ? (
          <>
            <span className="font-bold tabular-nums text-(--sf-ink)">{rating.toFixed(1)}</span>
            {props.showCount !== false && <span className="text-(--sf-muted)">({sectionText("reviewsCount", ctx.locale, { n: product.reviewCount })})</span>}
          </>
        ) : (
          <span className="text-(--sf-muted)">{sectionText("reviewsNone", ctx.locale)}</span>
        )}
      </>
    ) : null;
  const starsRow = "inline-flex items-center gap-1.5";
  return (
    <div {...attrs} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[13px]">
      {category && (
        <StoreLink
          ctx={ctx}
          href={categoryHref(category)}
          className="inline-flex max-w-full items-center truncate rounded-full bg-(--sf-shelf) px-3 py-1 text-xs font-semibold text-(--sf-brand) hover:opacity-80"
        >
          {category.name}
        </StoreLink>
      )}
      {stars &&
        // The editor has no reviews to jump to; the storefront links to the reviews element.
        (ctx.mode === "edit" || !reviewed ? (
          <span className={starsRow}>{stars}</span>
        ) : (
          <a href="#reviews" className={cn(starsRow, "hover:underline")}>
            {stars}
          </a>
        ))}
    </div>
  );
}

/**
 * Breadcrumbs: Home › the product's category › the product (current page).
 * The product title keeps to one line on phones; the chevrons turn with the
 * reading direction.
 */
function Breadcrumbs({ product, props, attrs, ctx }: StillProps) {
  const home = str(props.homeLabel, 40).trim() || sectionText("crumbHome", ctx.locale);
  const category = props.showCategory !== false && product.category?.name.trim() ? product.category : null;
  const sep = (
    <li aria-hidden className="flex shrink-0 items-center">
      <ChevronRight className="size-3.5 opacity-60 rtl:rotate-180" />
    </li>
  );
  const link = "truncate transition-colors hover:text-(--sf-ink) motion-reduce:transition-none";
  return (
    <nav {...attrs} aria-label={sectionText("breadcrumb", ctx.locale)} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px] text-(--sf-muted)">
        <li className="shrink-0">
          <StoreLink ctx={ctx} href="/" className={link}>
            {home}
          </StoreLink>
        </li>
        {category && (
          <>
            {sep}
            <li className="min-w-0 max-w-[40%] shrink-0 truncate">
              <StoreLink ctx={ctx} href={categoryHref(category)} className={link}>
                {category.name}
              </StoreLink>
            </li>
          </>
        )}
        {sep}
        <li aria-current="page" className="min-w-0 flex-1 truncate font-medium text-(--sf-ink)">
          {product.title}
        </li>
      </ol>
    </nav>
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
      <div className="flex flex-wrap gap-2.5">
        {product.variants.map((variant) => {
          const out = variant.quantity <= 0;
          const on = variant.id === selected.id;
          const swatch = variant.color && SWATCH_RE.test(variant.color) ? variant.color : null;
          // Colour options are round swatches (the label is the selected header's); the rest are pill chips.
          if (swatch)
            return (
              <span
                key={variant.id}
                role="img"
                aria-label={variant.label}
                data-selected={on || undefined}
                data-sold-out={out || undefined}
                title={variant.label}
                className={cn(
                  "relative inline-flex size-10 items-center justify-center rounded-full border-2 bg-(--sf-paper) p-0.5",
                  on ? "border-(--sf-ink)" : "border-transparent",
                  out && "opacity-40",
                )}
              >
                <span aria-hidden className="size-full rounded-full border border-(--sf-line)" style={{ backgroundColor: swatch }} />
                {out && <span aria-hidden className="absolute inset-x-1 top-1/2 h-px -rotate-45 bg-(--sf-ink)" />}
              </span>
            );
          return (
            <span
              key={variant.id}
              data-selected={on || undefined}
              data-sold-out={out || undefined}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] px-[18px] text-sm font-semibold",
                on ? "border-(--sf-ink) bg-(--sf-ink) text-(--sf-paper)" : "border-(--sf-line) bg-(--sf-paper) text-(--sf-ink)",
                out && "text-(--sf-muted) line-through opacity-60",
              )}
            >
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
  const step = "pointer-events-none flex h-full w-[42px] items-center justify-center text-(--sf-ink) disabled:opacity-60";
  // Outline: the cart button is drawn in brand lines and "buy now" is the filled one, so the two stay apart.
  const outline = props.variant === "outline";
  const filled = "bg-(--sf-brand) text-(--sf-brand-ink,#fff)";
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label={sectionText("quantity", ctx.locale)}
          className="inline-flex h-12 shrink-0 items-center rounded-full border-[1.5px] border-(--sf-line) bg-(--sf-paper)"
        >
          <button type="button" disabled tabIndex={-1} aria-label={sectionText("quantityLess", ctx.locale)} className={step}>
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-7 text-center text-base font-bold tabular-nums text-(--sf-ink)">1</span>
          <button type="button" disabled tabIndex={-1} aria-label={sectionText("quantityMore", ctx.locale)} className={step}>
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          disabled
          tabIndex={-1}
          data-part="add-to-cart"
          className={cn(BUTTON_BASE, "min-w-0 flex-1", outline ? "border-[1.5px] border-(--sf-brand) bg-transparent text-(--sf-brand)" : filled, out && "opacity-50")}
        >
          <ShoppingBag className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{addLabel}</span>
        </button>
      </div>
      {props.buyNow !== false && !out && (
        <button type="button" disabled tabIndex={-1} data-part="buy-now" className={cn(BUTTON_BASE, "w-full", outline ? filled : "bg-(--sf-ink) text-(--sf-paper)")}>
          <Zap className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{buyLabel}</span>
        </button>
      )}
    </div>
  );
}

/** Pays by cash on delivery: the store's checkout offers it, or the host did not say. */
function offersCashOnDelivery(ctx: RenderContext): boolean {
  const methods = ctx.store.paymentMethods;
  return !methods || methods.some((method) => method.key === "cash_on_delivery");
}

/**
 * The perks box under the buy box (design `.pd-perks`): three equal columns in
 * one bordered box. Static and drawn by the package, also beside the host's
 * live buy box, so every store gets it (`perks` switch, default on).
 */
function Perks({ ctx }: { ctx: RenderContext }) {
  const t = (key: SectionCopyKey) => sectionText(key, ctx.locale);
  const methods = ctx.store.paymentMethods;
  const others = !methods || methods.some((method) => method.key !== "cash_on_delivery");
  const perks = [
    { icon: Truck, title: t("perkDelivery"), note: t("perkDeliveryNote") },
    offersCashOnDelivery(ctx)
      ? { icon: Banknote, title: t("perkCod"), note: others ? t("perkCodNote") : t("perkCodOnlyNote") }
      : { icon: ShieldCheck, title: t("perkSecure"), note: t("perkSecureNote") },
    { icon: BadgeCheck, title: t("perkQuality"), note: t("perkQualityNote") },
  ];
  return (
    <ul data-part="perks" aria-label={t("perksLabel")} className="grid grid-cols-3 overflow-hidden rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper)">
      {perks.map(({ icon: Icon, title, note }, i) => (
        <li key={title} className={cn("flex min-w-0 flex-col items-center gap-1.5 px-2 py-3.5 text-center text-xs leading-normal", i > 0 && "border-s border-(--sf-line)")}>
          <Icon className="size-5 shrink-0 text-(--sf-brand)" aria-hidden />
          <span className="text-[13px] font-bold text-(--sf-ink)">{title}</span>
          <span className="text-(--sf-muted)">{note}</span>
        </li>
      ))}
    </ul>
  );
}

/** The delivery row's text: the seller's own, else the generic note. */
function deliveryNote(props: Record<string, unknown>, ctx: RenderContext): string {
  return str(props.deliveryText, 600).trim() || sectionText("productDeliveryText", ctx.locale);
}

/**
 * Description, highlights and delivery & returns as collapsible rows (design
 * `.pd-acc`): rows divided by hairlines, a bold summary whose chevron turns
 * when open, a muted body.
 */
function Details({ product, props, attrs, ctx }: StillProps) {
  const description = props.showDescription !== false ? decodeTextEntities(product.description?.trim() ?? "") : "";
  // `descriptionHtml` is sanitised by the host on the server, like `contentHtml` (core/types.ts).
  const descriptionHtml = description ? (product.descriptionHtml?.trim() ?? "") : "";
  const bullets = props.showBullets !== false ? product.bulletPoints.filter((point) => point.trim()).map(decodeTextEntities) : [];
  const delivery = props.showDelivery !== false ? deliveryNote(props, ctx) : "";
  if (!description && !bullets.length && !delivery) return ctx.mode === "edit" ? <EditorNote attrs={attrs}>{sectionText("productNoDetails", ctx.locale)}</EditorNote> : null;
  const returns = ctx.store.policies?.find((policy) => policy.key === "return");
  const row = (title: string, open: boolean, body: ReactNode) => (
    <details open={open} className="group border-b border-(--sf-line)">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-base font-bold text-(--sf-ink) [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-5 shrink-0 text-(--sf-muted) transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="pb-4 text-[15px] leading-[1.8] text-(--sf-muted)">{body}</div>
    </details>
  );
  return (
    <div {...attrs} className="flex min-w-0 flex-col">
      {description &&
        row(
          sectionText("productDescription", ctx.locale),
          true,
          descriptionHtml ? (
            <div className={cn(CONTENT_BASE, "[&>:first-child]:mt-0 [&>:last-child]:mb-0")} dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          ) : (
            <p className="whitespace-pre-line text-pretty">{description}</p>
          ),
        )}
      {bullets.length > 0 &&
        row(
          sectionText("productFeatures", ctx.locale),
          !description,
          <ul data-part="highlights" className="flex flex-col gap-2">
            {bullets.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-[0.35em] inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-(--sf-brand) text-(--sf-brand-ink,#fff)">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="min-w-0">{point}</span>
              </li>
            ))}
          </ul>,
        )}
      {delivery &&
        row(
          sectionText("productDelivery", ctx.locale),
          !description && !bullets.length,
          <>
            <p className="whitespace-pre-line text-pretty">{delivery}</p>
            {returns && (
              <p className="mt-2">
                <StoreLink ctx={ctx} href={returns.href} className="font-semibold text-(--sf-brand) underline underline-offset-4">
                  {sectionText("returnPolicy", ctx.locale)}
                </StoreLink>
              </p>
            )}
          </>,
        )}
    </div>
  );
}

/**
 * Rich text styles for the product's own content, with the store's brand:
 * brand h2 with a short accent bar, bold h3, brand bullets and numbers, a
 * brand-edged quote on the shelf tint, tables with hairlines and zebra rows
 * that scroll sideways on phones, rounded full-width photos, brand links.
 * No body colour or size of its own (the caller sets them).
 */
const CONTENT_BASE = cn(
  "min-w-0 break-words",
  "[&_p]:my-3 [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:leading-snug [&_h1]:text-(--sf-ink)",
  "[&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:leading-snug [&_h2]:text-(--sf-brand) md:[&_h2]:text-2xl",
  "[&_h2]:after:mt-2 [&_h2]:after:block [&_h2]:after:h-1 [&_h2]:after:w-10 [&_h2]:after:rounded-full [&_h2]:after:bg-(--sf-brand) [&_h2]:after:content-['']",
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-(--sf-ink) [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-bold [&_h4]:text-(--sf-ink)",
  "[&_strong]:font-bold [&_strong]:text-(--sf-ink) [&_b]:font-bold [&_b]:text-(--sf-ink)",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1.5 [&_li]:ps-1 [&_li]:marker:text-(--sf-brand) [&_ol>li]:marker:font-bold",
  "[&_a]:font-medium [&_a]:text-(--sf-brand) [&_a]:underline [&_a]:underline-offset-4",
  "[&_blockquote]:my-5 [&_blockquote]:rounded-e-(--sf-radius,12px) [&_blockquote]:border-s-4 [&_blockquote]:border-(--sf-brand) [&_blockquote]:bg-(--sf-shelf) [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:text-(--sf-ink)",
  "[&_table]:my-5 [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-(--sf-line) [&_th]:bg-(--sf-shelf) [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-start [&_th]:font-bold [&_th]:text-(--sf-ink)",
  "[&_td]:border [&_td]:border-(--sf-line) [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_tr:nth-child(even)>td]:bg-[color-mix(in_srgb,var(--sf-shelf)_60%,transparent)]",
  "[&_img]:my-5 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&_img]:rounded-(--sf-radius,12px) [&_figure]:my-5 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm",
  "[&_hr]:my-8 [&_hr]:border-(--sf-line)",
);

/** The long content column: comfortable 16–17px body with roomy lines. */
const CONTENT_CLASS = cn(CONTENT_BASE, "text-base leading-[1.8] text-(--sf-ink) md:text-[17px] [&>:first-child]:mt-0");

function Content({ product, attrs, ctx }: StillProps) {
  const html = product.contentHtml?.trim() ?? "";
  if (!html) return ctx.mode === "edit" ? <EditorNote attrs={attrs}>{sectionText("productNoContent", ctx.locale)}</EditorNote> : null;
  // `contentHtml` is sanitised by the host on the server when it builds the ProductDetail (core/types.ts).
  return <div {...attrs} className={CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * A storefront sells only its own store's products, so "Sold by <store>" says
 * nothing there: shoppers never see it (owner, 2026-10-28). Stores keep the
 * node in their saved pages, so the builder shows a note the seller can delete.
 */
function Seller({ attrs, ctx }: StillProps) {
  if (ctx.mode !== "edit") return null;
  return <EditorNote attrs={attrs}>{sectionText("productSellerHidden", ctx.locale)}</EditorNote>;
}

function Reviews({ product, attrs, ctx }: StillProps) {
  const rating = product.rating ?? 0;
  const count = product.reviewCount;
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-6">
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

const isProductElement = (type: string): type is ProductElementType => (PRODUCT_ELEMENT_TYPES as readonly string[]).includes(type);

/** Hidden on desktop, tablet and phone alike (`hidden` is per device, style.ts). */
function hiddenEverywhere(node: ComponentNode): boolean {
  return node.style?.hidden === true && node.breakpointStyles?.tablet?.hidden === true && node.breakpointStyles?.mobile?.hidden === true;
}

/**
 * The storefront draws nothing for this product part: it has no data for
 * it (the same checks the stills and the host hooks make), or it is hidden
 * on every device.
 */
function productPartEmpty(node: ComponentNode & { type: ProductElementType }, product: ProductDetail): boolean {
  if (hiddenEverywhere(node)) return true;
  const props = node.props ?? {};
  switch (node.type) {
    case "productRating":
      return product.reviewCount <= 0 && !(props.showCategory !== false && product.category?.name.trim());
    case "productVariants":
      return product.variants.length === 0;
    case "productDetails":
      return (
        !(props.showDescription !== false && product.description?.trim()) &&
        !(props.showBullets !== false && product.bulletPoints.some((point) => point.trim())) &&
        props.showDelivery === false
      );
    case "productContent":
      return !product.contentHtml?.trim();
    default:
      return false;
  }
}

/**
 * What a section may hold besides its product parts and still be only a
 * frame for them: layout, decoration and headings (which label the part).
 * Anything else (text, photos, buttons, links, lists, forms, video…) is the
 * seller's own content and keeps the section.
 */
const FRAME_TYPES: ReadonlySet<string> = new Set(["section", "container", "vFlex", "hFlex", "grid", "div", "card", "pattern", "divider", "spacer", "heading"]);

/**
 * A storefront section made only of product parts that all draw nothing
 * for this product (no content, no variants, no reviews yet…) plus its
 * frame (`FRAME_TYPES`) would be an empty padded band, so it is not drawn
 * at all. On a page without a product (a product section pasted onto a
 * normal page) every product part draws nothing, so the same section is
 * not drawn either. Sections with any other content, sections without
 * product parts, and the editor are unaffected.
 */
export function productSectionEmpty(section: ComponentNode, ctx: RenderContext, scope?: DataRecord): boolean {
  if (ctx.mode === "edit") return false;
  const product = productOf(ctx, scope);
  let parts = 0;
  let empty = 0;
  let content = false;
  walkNodes([section], (node) => {
    if (!isProductElement(node.type)) {
      if (!FRAME_TYPES.has(node.type)) content = true;
      return;
    }
    parts += 1;
    if (!product || productPartEmpty(node as ComponentNode & { type: ProductElementType }, product)) empty += 1;
  });
  return !content && parts > 0 && empty === parts;
}

const STILLS: Record<ProductElementType, (p: StillProps) => ReactNode> = {
  productBreadcrumbs: Breadcrumbs,
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
  // The rating links to the reviews (one per page). A part of the page's own product (not a list
  // card's) marks the product page, where the phone bottom navigation steps aside (BottomNavRuntime).
  const ownProduct = scope?.kind !== "product" || scope.record.id === ctx.product?.id;
  const attrs = { ...nodeAttrs, ...(type === "productReviews" && { id: "reviews" }), ...(ownProduct && { "data-sf-product-page": "" }) };
  const hookKey = HOOKS[type];
  const hook: ProductElementHook | undefined = hookKey && ctx.mode === "public" ? ctx[hookKey] : undefined;
  // The seller's live views line sits just above the buy box (public only: the number is illustrative, not data).
  const liveViews = type === "productBuyBox" && product.liveViews && ctx.mode === "public" ? ctx.renderLiveViews?.(product) : null;
  // Above it, the store coupon pop-up's countdown (a client part that draws nothing until the visitor saw the pop-up).
  const offerCountdown = type === "productBuyBox" && ctx.mode === "public" ? ctx.renderOfferCountdown?.(product) : null;
  // Below it, the perks box (static, the package's own): a sibling after the host's buy box, so a
  // sticky phone bar the host draws inside its buy box never takes it along.
  const perks = type === "productBuyBox" && ownProduct && props.perks !== false ? <Perks ctx={ctx} /> : null;
  if (liveViews || offerCountdown || perks) {
    return (
      <div {...attrs} className="flex min-w-0 flex-col gap-3">
        {offerCountdown}
        {liveViews}
        {hook ? hook(product, props) : STILLS[type]({ product, props, attrs: {}, ctx })}
        {perks && <div className="mt-1 min-w-0">{perks}</div>}
      </div>
    );
  }
  if (hook) {
    // The host's live price has no badges of its own: the trending / seasonal chips sit above it.
    return (
      <div {...attrs} className={cn("min-w-0", type === "productPrice" && "flex flex-col gap-2")}>
        {type === "productPrice" && <ProductFlags product={product} ctx={ctx} />}
        {hook(product, props)}
      </div>
    );
  }
  return STILLS[type]({ product, props, attrs, ctx });
}
