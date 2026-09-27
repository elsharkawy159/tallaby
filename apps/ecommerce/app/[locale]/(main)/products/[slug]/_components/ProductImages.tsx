"use client";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useState, useRef, useEffect } from "react";
import { MobileImageCarousel } from "./mobile-image-carousel";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/utils";
import { ShareProductPopover } from "@/components/product";
import { useAffiliateShareCoupon } from "@/hooks/use-affiliate-share-coupon";

interface ProductImagesProps {
  images: string[];
  productName: string;
  productId?: string;
  description?: string | null;
  bulletPoints?: string[];
}

export const ProductImages = ({
  images,
  productName,
  productId,
  description,
  bulletPoints,
}: ProductImagesProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  const { coupon: affiliateCoupon, isReady: isShareUrlReady } =
    useAffiliateShareCoupon();

  // Auto-select the first image when images array changes (e.g. variant switch)
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      setSelectedImage(images[0]);
      setHoveredImage(null);
    }
  }, [images]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => setShowZoom(true);
  const handleMouseLeave = () => setShowZoom(false);

  // Get the currently active image (hovered or selected)
  const activeImage = hoveredImage || selectedImage;

  const shareImage = activeImage
    ? getPublicUrl(activeImage, "products")
    : undefined;

  return (
    <>
      {/* Mobile: pinned stage that recedes as the details sheet slides over
          it (scroll-driven, see .product-stage-recede in globals.css). */}
      <div className="product-stage-recede relative block origin-top lg:hidden">
        <MobileImageCarousel
          key={images.join("|")}
          images={images}
          productName={productName}
        />

        <ShareProductPopover
          title={productName}
          image={shareImage}
          productId={productId}
          description={description}
          bulletPoints={bulletPoints}
          coupon={affiliateCoupon}
          isUrlReady={isShareUrlReady}
          className="absolute top-3 end-3 z-20"
        />
      </div>

      {/* Desktop Gallery */}
      <div className="hidden w-full gap-4 lg:flex">
        <div className="flex w-16 shrink-0 flex-col gap-2.5">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              onMouseEnter={() => setSelectedImage(image)}
              aria-label={`${productName} ${index + 1}`}
              aria-current={activeImage === image}
              className={`relative aspect-square overflow-hidden rounded-xl bg-white p-1.5 ring-offset-2 transition-all duration-200 motion-reduce:transition-none ${
                activeImage === image
                  ? "ring-2 ring-primary"
                  : "opacity-80 ring-1 ring-gray-200 hover:opacity-100"
              }`}
            >
              <ImageWithFallback
                src={
                  image
                    ? getPublicUrl(image, "products")
                    : PRODUCT_IMAGE_FALLBACK
                }
                alt={`${productName} ${index + 1}`}
                width={140}
                height={140}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>

        <div className="relative flex-1 z-[999]">
          <div
            ref={mainImageRef}
            className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[2rem]"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <ImageWithFallback
              src={
                activeImage
                  ? getPublicUrl(activeImage, "products")
                  : PRODUCT_IMAGE_FALLBACK
              }
              alt={productName}
              className="h-full w-full object-contain p-10"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={selectedImage == images[0]}
              fetchPriority={selectedImage == images[0] ? "high" : "low"}
            />
          </div>

          {/* Magnified view - only on larger screens */}
          {showZoom && (
            <div className="pointer-events-none absolute top-0 z-[999] hidden h-full w-full overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-black/5 xl:block">
              <div
                className="w-full h-full bg-cover bg-no-repeat z-[999]"
                style={{
                  backgroundImage: `url(${activeImage ? getPublicUrl(activeImage, "products") : PRODUCT_IMAGE_FALLBACK})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: "150%",
                }}
              />
            </div>
          )}

          {/* Share — sits above the zoom overlay so it stays clickable */}
          <ShareProductPopover
            title={productName}
            image={shareImage}
            productId={productId}
            description={description}
            bulletPoints={bulletPoints}
            coupon={affiliateCoupon}
            isUrlReady={isShareUrlReady}
            className="absolute top-4 end-4 z-[1000]"
          />
        </div>
      </div>
    </>
  );
};
