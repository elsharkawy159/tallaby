"use client";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
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

  // Auto-select the first image when images array changes
  useEffect(() => {
    if (images.length > 0 && images[0]) {
      setSelectedImage(images[0]);
    }
  }, [images[0]]); // Track the first image to auto-select when variant changes

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
      <div className="hidden lg:sticky lg:top-5 lg:flex space-y-4 w-full gap-2.5">
        <div className="flex flex-col gap-1.5 w-14">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              onMouseEnter={() => setSelectedImage(image)}
              // onMouseLeave={() => setHoveredImage(null)}
              className={`aspect-square relative bg-white p-1 rounded overflow-hidden border transition-all duration-200 ${
                activeImage === image
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={
                  image ? getPublicUrl(image, "products") : "/png product.png"
                }
                alt={`${productName} ${index + 1}`}
                width={140}
                height={140}
                className="w-full h-full object-contain bg-white"
              />
            </button>
          ))}
        </div>

        <div className="relative flex-1 z-[999]">
          <div
            ref={mainImageRef}
            className="aspect-square bg-gray-100 relative rounded-lg overflow-hidden w-full cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Image
              src={
                activeImage
                  ? getPublicUrl(activeImage, "products")
                  : "/png product.png"
              }
              alt={productName}
              className="w-full h-full object-contain bg-white"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={selectedImage == images[0]}
              fetchPriority={selectedImage == images[0] ? "high" : "low"}
            />
          </div>

          {/* Magnified view - only on larger screens */}
          {showZoom && (
            <div className="absolute w-full h-full top-0 border border-gray-200 rounded-lg shadow-lg overflow-hidden pointer-events-none z-[999] hidden xl:block">
              <div
                className="w-full h-full bg-cover bg-no-repeat z-[999]"
                style={{
                  backgroundImage: `url(${activeImage ? getPublicUrl(activeImage, "products") : "/png product.png"})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: "150%",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
