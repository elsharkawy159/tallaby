"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useLocale } from "next-intl";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";

interface MobileImageCarouselProps {
  images: string[];
  productName: string;
}

const STAGE_IMAGE = "object-contain p-6";

export const MobileImageCarousel = ({
  images,
  productName,
}: MobileImageCarouselProps) => {
  const locale = useLocale();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-white md:aspect-[4/3]">
        <ImageWithFallback
          src={PRODUCT_IMAGE_FALLBACK}
          alt={productName}
          fill
          className={STAGE_IMAGE}
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div className="relative bg-white">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: images.length > 1,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
      >
        <CarouselContent className="ms-0">
          {images.map((image, index) => (
            <CarouselItem key={index} className="ps-0">
              <div className="relative aspect-square bg-white md:aspect-[4/3]">
                <ImageWithFallback
                  src={getPublicUrl(image, "products")}
                  alt={`${productName} ${index + 1}`}
                  fill
                  className={STAGE_IMAGE}
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Sits above the rounded edge of the details sheet, which overlaps the
          bottom of the stage on mobile. */}
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-11 flex items-center justify-center gap-1.5">
          {images.map((image, index) => (
            <span
              key={image + index}
              className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                index === current ? "w-5 bg-primary" : "w-1.5 bg-primary/25"
              }`}
            />
          ))}
          <span className="sr-only" aria-live="polite">
            {current + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};
