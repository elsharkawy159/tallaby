/**
 * Building blocks for store sections. Styled with the Tallaby Classic tokens
 * (`--sf-*`) and Tailwind, so new sections sit naturally next to Classic.
 * Presentational only.
 */
import { Fragment, type ReactNode } from "react";
import { z } from "zod";
import { isExternalHref, safeHref } from "../core/links";
import { IMAGE_SIZES, imageSource, type ProductSummary, type RenderContext } from "../core/types";
import { sectionText } from "../core/copy";

// ---------------------------------------------------------------------------
// Prop schema helpers
// ---------------------------------------------------------------------------

export const text = (max: number) => z.string().max(max).catch("");
export const optionalUrl = z
  .string()
  .max(2048)
  .transform((v) => safeHref(v) ?? "")
  .catch("");
export const imageSrc = z.string().max(2048).catch("");
export const align = z.enum(["start", "center"]).catch("start");

/** `data-part` of an editable part of a section (P4B-01); empty when not marked. */
export type PartAttr = { "data-part"?: string };

/**
 * Marks the editable parts of a section instance: the editor selects them on
 * click and part styles (`instance.style.parts`) target them. Emitted in both
 * modes, so the storefront applies the same styles. `key` is a prop key or
 * `collection.index.field`.
 */
export function partOf(instanceId: string) {
  return (key: string): PartAttr => ({ "data-part": `${instanceId}::${key}` });
}

/**
 * Marks one item of an item collection (`collection.index`) so the editor
 * can reorder items by dragging them (P4B-16). Emitted in both modes, like
 * `data-part`.
 */
export function itemOf(instanceId: string) {
  return (collection: string, index: number): { "data-item": string } => ({ "data-item": `${instanceId}::${collection}.${index}` });
}

/**
 * A slot of editable parts (P4B-16): renders `parts` in order inside one
 * element marked `data-slot`, which the editor reads to place dragged parts.
 * An empty slot renders nothing on the storefront and a drop area in the editor.
 */
export function PartSlot({
  instanceId,
  slot,
  parts,
  ctx,
  className,
  render,
}: {
  instanceId: string;
  slot: string;
  parts: readonly string[];
  ctx: RenderContext;
  className?: string;
  render: (part: string) => ReactNode;
}) {
  const empty = parts.length === 0;
  if (empty && ctx.mode !== "edit") return null;
  return (
    <div
      data-slot={`${instanceId}::${slot}`}
      className={cn(className, empty && "min-h-16 rounded-(--sf-radius,12px) border border-dashed border-(--sf-line)")}
    >
      {parts.map((part) => (
        <Fragment key={part}>{render(part)}</Fragment>
      ))}
    </div>
  );
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Section frame: vertical rhythm and the store's content width. */
export function SectionShell({
  children,
  tone = "paper",
  className,
  id,
}: {
  children: ReactNode;
  tone?: "paper" | "shelf" | "brand";
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-(--sf-section-y,48px)",
        tone === "shelf" && "bg-(--sf-shelf)",
        tone === "brand" && "bg-(--sf-brand) text-(--sf-brand-ink,#fff)",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-(--sf-max-width,1280px) px-[clamp(16px,4vw,48px)]">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align: alignment = "start",
  action,
  parts,
}: {
  title?: string;
  subtitle?: string;
  align?: "start" | "center";
  action?: ReactNode;
  parts?: { title?: PartAttr; subtitle?: PartAttr };
}) {
  if (!title && !subtitle && !action) return null;
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end gap-3 md:mb-8",
        alignment === "center" ? "flex-col items-center text-center" : "justify-between",
      )}
    >
      <div className={cn("min-w-0", alignment === "center" && "max-w-2xl")}>
        {title && <h2 {...parts?.title} className="text-balance text-2xl font-bold leading-tight md:text-3xl">{title}</h2>}
        {subtitle && <p {...parts?.subtitle} className="mt-2 text-pretty text-(--sf-muted)">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Links and buttons
// ---------------------------------------------------------------------------

export function SmartLink({
  ctx,
  href,
  className,
  children,
  label,
  part,
}: {
  ctx: RenderContext;
  href: string;
  className?: string;
  children: ReactNode;
  label?: string;
  part?: PartAttr;
}) {
  const safe = safeHref(href);
  if (!safe)
    return (
      <span {...part} className={className}>
        {children}
      </span>
    );
  if (isExternalHref(safe) || safe.startsWith("tel:") || safe.startsWith("mailto:")) {
    return (
      <a {...part} href={safe} className={className} aria-label={label} rel="noopener noreferrer" target={isExternalHref(safe) ? "_blank" : undefined}>
        {children}
      </a>
    );
  }
  const Link = ctx.Link;
  return (
    <Link {...part} href={safe} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

export function ButtonLink({
  ctx,
  href,
  label,
  variant = "solid",
  part,
}: {
  ctx: RenderContext;
  href: string;
  label: string;
  variant?: "solid" | "outline" | "light";
  part?: PartAttr;
}) {
  if (!label || !safeHref(href)) return null;
  return (
    <SmartLink
      ctx={ctx}
      href={href}
      part={part}
      className={cn(
        // Colour change and a 2px lift on hover, no scale (docs/section-rules.md §6.5).
        "inline-flex h-12 items-center justify-center rounded-(--sf-radius,12px) px-7 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        variant === "solid" && "bg-(--sf-brand) text-(--sf-brand-ink,#fff) hover:bg-[color-mix(in_srgb,var(--sf-brand)_86%,#000)]",
        variant === "outline" && "border border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:border-(--sf-ink)",
        // A white button always needs dark text: the theme ink is light on dark themes.
        variant === "light" && "bg-white text-neutral-900 hover:bg-neutral-100",
      )}
    >
      {label}
    </SmartLink>
  );
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export function SectionImage({
  ctx,
  src,
  alt,
  className,
  eager = false,
  sizes = IMAGE_SIZES.card,
  part,
}: {
  ctx: RenderContext;
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
  /** Rendered width hint for the host optimizer (defaults to a grid card). */
  sizes?: string;
  part?: PartAttr;
}) {
  const url = ctx.imageUrl(src);
  if (!url) return <div {...part} aria-hidden className={cn("bg-(--sf-shelf)", className)} />;
  // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; the host optimizes through ctx.optimizeImage
  return <img {...part} {...imageSource(ctx, url, sizes)} alt={alt} className={cn("object-cover", className)} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------

export function ProductCardView({ product, ctx }: { product: ProductSummary; ctx: RenderContext }) {
  const onSale = product.compareAtPrice != null && product.price != null && product.compareAtPrice > product.price;
  return (
    <article className="group flex flex-col overflow-hidden rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper)">
      <SmartLink ctx={ctx} href={product.href} className="block aspect-square overflow-hidden bg-(--sf-shelf)">
        <SectionImage ctx={ctx} src={product.image} alt={product.title} className="size-full transition-transform group-hover:scale-[1.03]" />
      </SmartLink>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <SmartLink ctx={ctx} href={product.href} className="line-clamp-2 text-sm font-medium leading-snug">
          {product.title}
        </SmartLink>
        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          {product.price != null && (
            <span className="font-bold tabular-nums" dir="ltr">
              {ctx.formatPrice(product.price)}
            </span>
          )}
          {onSale && (
            <s className="text-xs text-(--sf-muted) tabular-nums" dir="ltr">
              {ctx.formatPrice(product.compareAtPrice!)}
            </s>
          )}
        </div>
        {product.inStock === false ? (
          <span className="text-xs text-(--sf-muted)">{sectionText("outOfStock", ctx.locale)}</span>
        ) : (
          ctx.renderAddToCart?.(product)
        )}
      </div>
    </article>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-8 text-center text-sm text-(--sf-muted)">
      {children}
    </p>
  );
}
