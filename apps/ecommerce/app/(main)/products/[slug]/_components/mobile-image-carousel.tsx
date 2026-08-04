"use client";

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useLocale } from "next-intl";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";

interface MobileImageCarouselProps {
  images: string[];
  productName: string;
}

export const MobileImageCarousel = ({
  images,
  productName,
}: MobileImageCarouselProps) => {
  const locale = useLocale();
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        <ImageWithFallback
          src={PRODUCT_IMAGE_FALLBACK}
          alt={productName}
          fill
          className="object-contain bg-white"
          sizes="100vw"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel
        className="w-full"
        opts={{
          align: "start",
          loop: true,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={getPublicUrl(image, "products")}
                  alt={`${productName} ${index + 1}`}
                  fill
                  className="object-contain bg-white"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselDots />
      </Carousel>
    </div>
  );
};
