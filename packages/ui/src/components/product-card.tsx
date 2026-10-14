"use client";

import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";
import { Card, CardContent } from "@workspace/ui/components/card";

/*
 * The storefront product card, as pure presentation. The ecommerce app wraps it
 * with live data, links and cart/wishlist buttons; the seller dashboard renders
 * the same card as a "how customers see it" preview. Change the card here and
 * both stay in sync.
 */

export interface ProductCardSwatch {
  key: string;
  hex: string;
  label: string;
  href?: string;
  /** Shown in place of the main image while the swatch is hovered. */
  image?: string;
}

type LinkLikeProps = {
  href: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export interface ProductCardImageRenderProps {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  sizes: string;
  loading?: "lazy" | "eager";
}

export interface ProductCardViewProps {
  title: string;
  /** Product page link. Without it the card renders as static content. */
  href?: string;
  image: string;
  /** Price strings may contain markup (e.g. `formatPrice` wraps the currency). */
  priceHtml: string;
  listPriceHtml?: string | null;
  discountPercent?: number | null;
  discountLabel?: string;
  swatches?: ProductCardSwatch[];
  swatchOverflow?: number;
  swatchOverflowLabel?: string;
  /** Top corner opposite the discount badge — the wishlist button. */
  topEndSlot?: React.ReactNode;
  /** Bottom corner of the image — the add-to-cart / quantity control. */
  bottomEndSlot?: React.ReactNode;
  linkComponent?: React.ElementType<LinkLikeProps>;
  renderImage?: (props: ProductCardImageRenderProps) => React.ReactNode;
  dir?: "rtl" | "ltr";
  className?: string;
}

const IMAGE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw";

const defaultRenderImage = ({ src, alt, ...props }: ProductCardImageRenderProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} {...props} />
);

function MaybeLink({
  href,
  linkComponent: LinkComponent = "a",
  className,
  children,
  ...props
}: {
  href?: string;
  linkComponent?: React.ElementType<LinkLikeProps>;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (!href) {
    return (
      <span className={className} {...(props as React.HTMLAttributes<HTMLSpanElement>)}>
        {children}
      </span>
    );
  }
  return (
    <LinkComponent href={href} className={className} {...props}>
      {children}
    </LinkComponent>
  );
}

function ProductCardView({
  title,
  href,
  image,
  priceHtml,
  listPriceHtml,
  discountPercent,
  discountLabel,
  swatches = [],
  swatchOverflow = 0,
  swatchOverflowLabel,
  topEndSlot,
  bottomEndSlot,
  linkComponent,
  renderImage = defaultRenderImage,
  dir,
  className,
}: ProductCardViewProps) {
  // Keep the last hover image mounted while the overlay fades out, so the swap
  // doesn't pop back to the base image mid-transition.
  const [hoverImage, setHoverImage] = React.useState<string | null>(null);
  const [lastHoverImage, setLastHoverImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (hoverImage) setLastHoverImage(hoverImage);
  }, [hoverImage]);

  const hasDiscount = !!listPriceHtml;
  const showBadge = discountPercent != null && discountPercent > 0;

  return (
    <Card
      className={cn(
        "group relative h-full w-full overflow-hidden rounded-lg border-0 bg-white p-0 shadow-sm",
        className
      )}
      dir={dir}
    >
      <CardContent className="flex h-full flex-col p-2 md:p-2.5">
        <div className="relative">
          <div className="relative overflow-hidden rounded-md bg-muted/20 p-1.5 md:p-2">
            <MaybeLink href={href} linkComponent={linkComponent} className="relative block">
              {renderImage({
                src: image,
                alt: title,
                width: 270,
                height: 310,
                loading: "lazy",
                sizes: IMAGE_SIZES,
                className: cn(
                  "aspect-[2.6/3] h-full w-full object-contain transition-opacity duration-300",
                  hoverImage ? "opacity-0" : "opacity-100"
                ),
              })}
              {lastHoverImage &&
                renderImage({
                  src: lastHoverImage,
                  alt: title,
                  width: 270,
                  height: 310,
                  sizes: IMAGE_SIZES,
                  className: cn(
                    "absolute inset-0 aspect-[2.6/3] object-contain transition-opacity duration-300",
                    hoverImage ? "opacity-100" : "opacity-0"
                  ),
                })}
            </MaybeLink>
          </div>

          {showBadge && (
            <span
              className={cn(
                "pointer-events-none absolute top-1.5 start-1.5 z-20 md:top-2 md:start-2",
                "inline-flex items-center justify-center",
                "rounded-md px-1.5 py-0.5 md:px-2 md:py-1",
                "bg-primary text-primary-foreground",
                "text-[10px] font-bold leading-none tracking-tight md:text-xs",
                "shadow-sm ring-1 ring-black/5"
              )}
              aria-label={discountLabel}
            >
              −{discountPercent}%
            </span>
          )}

          {topEndSlot && (
            <div className="absolute top-1.5 end-1.5 z-20 md:top-2 md:end-2">{topEndSlot}</div>
          )}

          <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10 flex items-end gap-1.5 md:inset-x-2 md:bottom-2 md:gap-2">
            {swatches.length > 0 && (
              <div
                className="pointer-events-auto flex min-w-0 max-w-[65%] items-center gap-0.5 rounded-full bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur-sm sm:max-w-[70%] md:gap-1 md:px-1.5 md:py-1"
                onClick={(event) => event.stopPropagation()}
              >
                {swatches.map((swatch) => (
                  <MaybeLink
                    key={swatch.key}
                    href={swatch.href}
                    linkComponent={linkComponent}
                    aria-label={swatch.label}
                    title={swatch.label}
                    className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:size-4"
                    style={{ backgroundColor: swatch.hex }}
                    onMouseEnter={() => setHoverImage(swatch.image ?? null)}
                    onMouseLeave={() => setHoverImage(null)}
                    onFocus={() => setHoverImage(swatch.image ?? null)}
                    onBlur={() => setHoverImage(null)}
                  />
                ))}
                {swatchOverflow > 0 && (
                  <span
                    className="px-0.5 text-[9px] font-medium text-gray-600 md:text-[10px]"
                    aria-label={swatchOverflowLabel}
                  >
                    +{swatchOverflow}
                  </span>
                )}
              </div>
            )}

            {bottomEndSlot && (
              <div className="pointer-events-auto ms-auto shrink-0">{bottomEndSlot}</div>
            )}
          </div>
        </div>

        <div className="mt-auto flex justify-between gap-2 pt-1.5 md:pt-2.5">
          <MaybeLink href={href} linkComponent={linkComponent} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-xs font-medium text-gray-900 md:text-sm">{title}</h3>
          </MaybeLink>

          <div className="flex shrink-0 flex-col items-end gap-y-0.5">
            <p
              className={cn(
                "text-sm font-semibold md:text-lg",
                hasDiscount ? "text-primary" : "text-gray-900"
              )}
              dangerouslySetInnerHTML={{ __html: priceHtml }}
            />
            {hasDiscount && (
              <p
                className="text-[11px] font-medium leading-none text-muted-foreground line-through decoration-muted-foreground/70 md:text-xs"
                dangerouslySetInnerHTML={{ __html: listPriceHtml }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProductCardView };
