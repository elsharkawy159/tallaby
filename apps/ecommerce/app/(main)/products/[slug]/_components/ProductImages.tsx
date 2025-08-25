"use client";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { useState, useRef } from "react";
import { MobileImageCarousel } from "./mobile-image-carousel";

interface ProductImagesProps {
  images: string[];
  productName: string;
}

export const ProductImages = ({ images, productName }: ProductImagesProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const mainImageRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {/* Mobile Carousel */}
      <div className="block lg:hidden">
        <MobileImageCarousel images={images} productName={productName} />
      </div>

      {/* Desktop Gallery */}
      <div className="hidden lg:flex space-y-4 max-w-2xl w-full gap-2.5">
        <div className="flex flex-col gap-1.5 w-14">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              onMouseEnter={() => setHoveredImage(image)}
              onMouseLeave={() => setHoveredImage(null)}
              className={`aspect-square relative bg-gray-100 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                activeImage === image
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={getPublicUrl(image, "products") || ""}
                alt={`${productName} ${index + 1}`}
                width={140}
                height={140}
                className="w-full h-full object-contain bg-white"
              />
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <div
            ref={mainImageRef}
            className="aspect-square bg-gray-100 relative rounded-lg overflow-hidden w-full cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Image
              src={getPublicUrl(activeImage || "", "products")}
              alt={productName}
              className="w-full h-full object-contain bg-white"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Magnified view - only on larger screens */}
          {showZoom && (
            <div className="absolute left-full top-0 ml-2 w-80 h-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden pointer-events-none z-10 hidden xl:block">
              <div
                className="w-full h-full bg-cover bg-no-repeat"
                style={{
                  backgroundImage: `url(${getPublicUrl(activeImage || "", "products")})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: "400%",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
