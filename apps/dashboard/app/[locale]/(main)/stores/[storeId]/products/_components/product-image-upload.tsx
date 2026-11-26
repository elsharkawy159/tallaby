"use client";

import React from "react";
import Image from "next/image";
import { Upload, LoaderCircle } from "lucide-react";
import { getPublicUrl } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useProductImageDrop } from "./use-product-image-drop.client";

interface ProductImageUploadProps {
  productId: string;
  images: string[];
  productTitle: string;
}

export function ProductImageUpload({
  productId,
  images,
  productTitle,
}: ProductImageUploadProps) {
  const t = useTranslations("products.imageUpload");
  const { getRootProps, getInputProps, isDragActive, isUploading } = useProductImageDrop({
    productId,
    images,
  });

  // If no images, show drag and drop button
  if (images.length === 0) {
    return (
      <div
        {...getRootProps()}
        className={`h-12 w-12 rounded border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
            : "border-border hover:border-muted-foreground/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        title={t("dropHere")}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    );
  }

  // If has images, show first image with count badge
  return (
    <div className="relative group">
      <div
        {...getRootProps()}
        className="h-16 w-16 overflow-hidden rounded bg-muted cursor-pointer hover:opacity-80 transition-opacity"
        title={t("dropMore")}
      >
        <input {...getInputProps()} />
        <Image
          src={getPublicUrl(images[0], "products")}
          alt={productTitle}
          width={100}
          height={100}
          className="h-16 w-16 object-contain"
        />

        {/* Upload overlay when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <LoaderCircle className="h-4 w-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Image count badge */}
      {images.length > 1 && (
        <div className="absolute -top-1 -end-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {images.length - 1}
        </div>
      )}
    </div>
  );
}
