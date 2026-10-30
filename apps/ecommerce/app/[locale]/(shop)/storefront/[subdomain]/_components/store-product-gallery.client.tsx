"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { ShareProductPopover } from "@/components/product";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { useAffiliateShareCoupon } from "@/hooks/use-affiliate-share-coupon";
import { PRODUCT_IMAGE_FALLBACK, cn } from "@/lib/utils";
import { StoreWishlistButton } from "./store-wishlist-button.client";

/**
 * The store product page's gallery (the store look of `ProductImages`): a
 * square stage on the store's shelf colour that swipes on every screen, the
 * discount badge at the top start, round wishlist and share buttons at the
 * top end, dots on phones (the active one a pill), and 72px thumbnails below
 * on phones and beside (or below, or none) on desktop. Hover zoom on desktop.
 */

const TOOL =
  "size-11 rounded-full border-0 bg-(--sf-paper) text-(--sf-ink) shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-0 hover:bg-(--sf-paper) hover:text-(--sf-brand) md:size-11";

export function StoreGallery({
  productId,
  images,
  productName,
  description,
  bulletPoints,
  discountPercent,
  thumbs,
  zoom,
}: {
  productId: string;
  images: string[];
  productName: string;
  description?: string | null;
  bulletPoints?: string[];
  discountPercent: number | null;
  thumbs: "side" | "bottom" | "none";
  zoom: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("storeProduct");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const { coupon, isReady } = useAffiliateShareCoupon();
  const slides = images.length ? images : [null];
  const many = slides.length > 1;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const src = (image: string | null) => (image ? getPublicUrl(image, "products") || PRODUCT_IMAGE_FALLBACK : PRODUCT_IMAGE_FALLBACK);
  const active = slides[Math.min(current, slides.length - 1)] ?? null;

  // Desktop pointers only: a tap on a phone must not zoom.
  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!zoom || !window.matchMedia("(hover: hover) and (min-width: 1024px)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setLens({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  const thumbList = many && thumbs !== "none" && (
    <div
      className={cn(
        "flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]",
        thumbs === "side" && "lg:order-first lg:max-h-[600px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0",
      )}
    >
      {slides.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={() => api?.scrollTo(index)}
          aria-label={t("photoOf", { index: index + 1, total: slides.length })}
          aria-current={index === current}
          className={cn(
            "relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-(--sf-shelf) outline-2 -outline-offset-2 transition-[outline-color] motion-reduce:transition-none",
            index === current ? "outline-(--sf-brand)" : "outline-transparent hover:outline-(--sf-line)",
          )}
        >
          <ImageWithFallback src={src(image)} alt="" fill sizes="72px" className="object-contain p-1.5" />
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("grid min-w-0 gap-3", thumbs === "side" && many && "lg:grid-cols-[72px_minmax(0,1fr)] lg:items-start lg:gap-4")}>
      <div className="relative min-w-0">
        <div className="overflow-hidden rounded-[calc(var(--sf-radius,12px)*1.5)] bg-(--sf-shelf)">
          <Carousel
            setApi={setApi}
            className="w-full"
            aria-label={t("photos")}
            opts={{ align: "start", loop: many, direction: locale === "ar" ? "rtl" : "ltr" }}
          >
            <CarouselContent className="ms-0">
              {slides.map((image, index) => (
                <CarouselItem key={`${image}-${index}`} className="ps-0" aria-label={t("photoOf", { index: index + 1, total: slides.length })}>
                  <div
                    className={cn("relative aspect-square overflow-hidden", zoom && "lg:cursor-zoom-in")}
                    onMouseMove={onMove}
                    onMouseLeave={() => setLens(null)}
                  >
                    <ImageWithFallback
                      src={src(image)}
                      alt={index === 0 ? productName : `${productName} ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={index === 0}
                      fetchPriority={index === 0 ? "high" : "low"}
                      className="object-contain transition-transform duration-200 ease-out motion-reduce:transition-none"
                      style={
                        lens && index === current
                          ? { transform: "scale(1.8)", transformOrigin: `${lens.x}% ${lens.y}%` }
                          : undefined
                      }
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Badges at the top start, tools at the top end. Only the badge text is
            LTR: `dir` on the badge itself would flip `start` to the left on
            Arabic pages, under the wishlist button. */}
        {discountPercent != null && (
          <span
            className="pointer-events-none absolute start-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-extrabold leading-none text-white md:start-4 md:top-4 md:text-[13px]"
            style={{ background: "var(--destructive,#dc2626)" }}
          >
            <bdi dir="ltr">{t("discountBadge", { percent: discountPercent })}</bdi>
          </span>
        )}

        <div className="absolute end-3 top-3 z-10 flex flex-col gap-2 md:end-4 md:top-4">
          <StoreWishlistButton productId={productId} className={cn("inline-flex items-center justify-center", TOOL)} />
          <ShareProductPopover
            title={productName}
            image={active ? getPublicUrl(active, "products") : undefined}
            description={description}
            bulletPoints={bulletPoints}
            coupon={coupon}
            isUrlReady={isReady}
            className={TOOL}
          />
        </div>

        {/* Phones: where you are in the photos. */}
        {many && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
            {slides.map((image, index) => (
              <span
                key={`${image}-${index}`}
                className={cn(
                  "h-1.5 rounded-full transition-[width] duration-200 motion-reduce:transition-none",
                  index === current ? "w-5 bg-(--sf-ink)" : "w-1.5 bg-[color-mix(in_srgb,var(--sf-ink)_25%,transparent)]",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {thumbList}
    </div>
  );
}
