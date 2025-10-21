"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";

interface MobileImageCarouselProps {
  images: string[];
  productName: string;
}

export const MobileImageCarousel = ({
  images,
  productName,
}: MobileImageCarouselProps) => {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
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
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={getPublicUrl(image, "products") || ""}
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

        {/* Navigation arrows - only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md z-10 border-0" />
            <CarouselNext className="right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md z-10 border-0" />
          </>
        )}

        <CarouselDots />
      </Carousel>
    </div>
  );
};
