/**
 * The `hotspot` element (docs/systems/plan.md §10.1): a dot on a photo that
 * opens a small popover. It lives in a box that holds the photo, placed by
 * percent from the box's left and top. Two kinds:
 *
 * - `product`: a product of this store (photo, name, price, a link to it and
 *   the host's add-to-cart button). The seller picks it (`productId`); with
 *   none picked it is the store's Nth newest product (`productIndex`), so a
 *   template works before any setup. The record comes from the host through
 *   the same catalog queries as a product list (`data.ts`), keyed by node id.
 * - `text`: the seller's own title and line, for a part of one product.
 *
 * Server-renderable, no hooks, and a fixed platform component: the popover's
 * markup is written here, never by the seller. The dot is a real `<button>`.
 * Both the dot and the popover are positioned inside the photo box (their
 * wrapper has no box of its own), so the popover is clamped to the photo by
 * CSS alone (`hotspot.lib.ts`), in both directions of the page.
 *
 * `PhotoToolsRuntime` (`render/photo-tools.client.ts`) opens it on hover,
 * focus and tap (`data-hs-open`), one at a time per photo, and closes it on
 * Escape or a tap outside. Until that script runs (and on the editor canvas,
 * which never runs it) `data-hs-static` lets plain CSS open it on hover and
 * focus. It fades in 150 ms, or at once with reduced motion.
 */
import type { CSSProperties, ReactNode } from "react";
import { Plus } from "lucide-react";
import type { ComponentNode } from "../config/schema";
import { sectionText } from "../core/copy";
import { IMAGE_SIZES, imageSource, priceNode, type ProductSummary, type RenderContext } from "../core/types";
import { DataEmpty } from "../sections/_data";
import { SmartLink } from "../sections/_primitives";
import { hotspotProduct } from "./data";
import { hotspotKind, hotspotPoint, hotspotPopoverStyle } from "./hotspot.lib";

type Attrs = Record<string, string>;

export const HOTSPOT_TEXT = { title: 80, body: 400 } as const;

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max).trim() : "");

const DOT_CLASS =
  "absolute z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-(--sf-paper,#fff) text-(--sf-ink,#111) shadow-md ring-2 ring-(--sf-brand,#111) " +
  // A 44px touch target around the 28px dot.
  "before:absolute before:-inset-2 before:rounded-full before:content-[''] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand,#111)";

const POPOVER_CLASS =
  "invisible absolute z-20 flex flex-col py-1 opacity-0 transition-[opacity,visibility] duration-150 motion-reduce:transition-none " +
  "group-data-[hs-open]/hs:visible group-data-[hs-open]/hs:opacity-100 " +
  // Without the script: hover or focus on the dot (or inside the popover) opens it.
  "group-data-[hs-static]/hs:group-hover/hs:visible group-data-[hs-static]/hs:group-hover/hs:opacity-100 " +
  "group-data-[hs-static]/hs:group-focus-within/hs:visible group-data-[hs-static]/hs:group-focus-within/hs:opacity-100";

const CARD_CLASS = "min-h-0 overflow-y-auto rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper,#fff) p-3 text-start text-(--sf-ink,#111) shadow-lg";

function ProductCard({ product, ctx }: { product: ProductSummary; ctx: RenderContext }) {
  const url = product.image ? ctx.imageUrl(product.image) : null;
  const cart = ctx.renderAddToCart?.(product);
  return (
    <>
      <SmartLink ctx={ctx} href={product.href} className="flex min-w-0 items-center gap-3">
        {url && (
          <span className="block size-14 shrink-0 overflow-hidden rounded-[min(var(--sf-radius,8px),8px)] bg-(--sf-shelf)">
            {/* eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage */}
            <img {...imageSource(ctx, url, IMAGE_SIZES.logo)} alt="" className="block size-full object-cover" loading="lazy" decoding="async" />
          </span>
        )}
        <span className="block min-w-0 flex-1">
          <span className="line-clamp-2 block text-sm font-semibold">{product.title}</span>
          {product.price != null && <span className="mt-0.5 block text-sm font-bold text-(--sf-brand)">{priceNode(ctx, product.price)}</span>}
        </span>
      </SmartLink>
      {cart ? <div className="mt-2.5 flex">{cart}</div> : null}
    </>
  );
}

export function HotspotElement({ attrs, node, props, ctx }: { attrs: Attrs; node: ComponentNode; props: Record<string, unknown>; ctx: RenderContext }): ReactNode {
  const kind = hotspotKind(props.kind);
  const edit = ctx.mode === "edit";
  let name: string;
  let card: ReactNode;
  if (kind === "product") {
    const product = hotspotProduct(node, ctx);
    // No product (none in the store, or the picked one is gone): no dot publicly; the editor says what to do.
    if (!product && !edit) return null;
    name = product ? sectionText("hotspotProduct", ctx.locale, { name: product.title }) : sectionText("hotspotShow", ctx.locale);
    card = product ? <ProductCard product={product} ctx={ctx} /> : <DataEmpty need="products" ctx={ctx} filtered={(ctx.catalog.counts?.products ?? 0) > 0} />;
  } else {
    const title = str(props.title, HOTSPOT_TEXT.title);
    const body = str(props.body, HOTSPOT_TEXT.body);
    if (!title && !body && !edit) return null;
    name = title || sectionText("hotspotShow", ctx.locale);
    card =
      title || body ? (
        <>
          {title && <p className="text-sm font-semibold">{title}</p>}
          {body && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-(--sf-muted)">{body}</p>}
        </>
      ) : (
        <p className="text-xs text-(--sf-muted)">{sectionText("hotspotEmpty", ctx.locale)}</p>
      );
  }
  const point = hotspotPoint(props.x, props.y);
  const id = `sf-hs-${node.id.replace(/[^\w-]/g, "")}`;
  return (
    <div data-sf-hotspot={kind} data-hs-static="" className="group/hs contents">
      <button
        {...attrs}
        type="button"
        data-sf-hotspot-dot=""
        aria-label={name}
        aria-expanded={false}
        aria-controls={id}
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
        className={DOT_CLASS}
      >
        <Plus className="size-4 transition-transform duration-150 group-data-[hs-open]/hs:rotate-45 motion-reduce:transition-none" aria-hidden />
      </button>
      <div id={id} data-sf-hotspot-pop="" role="group" aria-label={name} style={hotspotPopoverStyle(point) as CSSProperties} className={POPOVER_CLASS}>
        <div className={CARD_CLASS}>{card}</div>
      </div>
    </div>
  );
}
