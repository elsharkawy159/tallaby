/**
 * Building blocks for store sections. Styled with the Tallaby Classic tokens
 * (`--sf-*`) and Tailwind, so new sections sit naturally next to Classic.
 * Presentational only.
 */
import type { ReactNode } from "react";
import { z } from "zod";
import { isExternalHref, safeHref } from "../core/links";
import type { ProductSummary, RenderContext } from "../core/types";
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
      <div className="mx-auto w-full max-w-(--sf-max-width,1200px) px-4 md:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align: alignment = "start",
  action,
}: {
  title?: string;
  subtitle?: string;
  align?: "start" | "center";
  action?: ReactNode;
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
        {title && <h2 className="text-balance text-2xl font-bold leading-tight md:text-3xl">{title}</h2>}
        {subtitle && <p className="mt-2 text-pretty text-(--sf-muted)">{subtitle}</p>}
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
}: {
  ctx: RenderContext;
  href: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const safe = safeHref(href);
  if (!safe) return <span className={className}>{children}</span>;
  if (isExternalHref(safe) || safe.startsWith("tel:") || safe.startsWith("mailto:")) {
    return (
      <a href={safe} className={className} aria-label={label} rel="noopener noreferrer" target={isExternalHref(safe) ? "_blank" : undefined}>
        {children}
      </a>
    );
  }
  const Link = ctx.Link;
  return (
    <Link href={safe} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

export function ButtonLink({
  ctx,
  href,
  label,
  variant = "solid",
}: {
  ctx: RenderContext;
  href: string;
  label: string;
  variant?: "solid" | "outline" | "light";
}) {
  if (!label || !safeHref(href)) return null;
  return (
    <SmartLink
      ctx={ctx}
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-(--sf-radius,12px) px-6 text-sm font-semibold transition-opacity hover:opacity-90",
        variant === "solid" && "bg-(--sf-brand) text-(--sf-brand-ink,#fff)",
        variant === "outline" && "border border-(--sf-line) bg-(--sf-paper) text-(--sf-ink)",
        variant === "light" && "bg-white text-(--sf-ink)",
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
}: {
  ctx: RenderContext;
  src: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const url = ctx.imageUrl(src);
  if (!url) return <div aria-hidden className={cn("bg-(--sf-shelf)", className)} />;
  // eslint-disable-next-line @next/next/no-img-element -- shared by both apps; no next/image here
  return <img src={url} alt={alt} className={cn("object-cover", className)} loading={eager ? "eager" : "lazy"} decoding="async" />;
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
