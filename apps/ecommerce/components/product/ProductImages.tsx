"use client";
import { useState } from "react";

interface ProductImagesProps {
  images: string[];
  productName: string;
}

export const ProductImages = ({ images, productName }: ProductImagesProps) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="space-y-4 max-w-xl">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
              selectedImage === image ? "border-primary" : "border-transparent"
            }`}
          >
            <img
              src={image}
              alt={`${productName} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
