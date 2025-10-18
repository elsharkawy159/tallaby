"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, LoaderCircle } from "lucide-react";
import { getPublicUrl } from "@/lib/utils";
import { updateProduct } from "@/actions/products";
import { toast } from "sonner";
import { createClient } from "@/supabase/client";
import { generateImageName, getTodayDate, validateImage } from "@/lib/utils";

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
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        // Validate image
        await validateImage(file);

        const imageName = generateImageName(file);
        const filePath = imageName; // generateImageName already includes the date folder

        const { data, error } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload image");
          return null;
        }

        return filePath;
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Failed to upload image");
        return null;
      }
    },
    [supabase]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Check if adding new files would exceed max limit of 5
      if (images.length + acceptedFiles.length > 5) {
        toast.error("Maximum 5 images allowed per product");
        return;
      }

      setIsUploading(true);

      try {
        const uploadedPaths = await Promise.all(
          acceptedFiles.map(handleFileUpload)
        );
        const successfulUploads = uploadedPaths.filter(
          (path): path is string => path !== null
        );

        if (successfulUploads.length > 0) {
          const newImages = [...images, ...successfulUploads];
          const result = await updateProduct(productId, { images: newImages });

          if (result.success) {
            toast.success(
              `${successfulUploads.length} image(s) uploaded successfully`
            );
            // Trigger a page refresh to show updated images
            window.location.reload();
          } else {
            toast.error("Failed to update product images");
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload images");
      } finally {
        setIsUploading(false);
      }
    },
    [images, handleFileUpload, productId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
    disabled: isUploading,
    maxFiles: 5,
    multiple: true,
  });

  // If no images, show drag and drop button
  if (images.length === 0) {
    return (
      <div
        {...getRootProps()}
        className={`h-12 w-12 rounded border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Drag and drop images here"
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <Upload className="h-4 w-4 text-gray-500" />
        )}
      </div>
    );
  }

  // If has images, show first image with count badge
  return (
    <div className="relative group">
      <div
        {...getRootProps()}
        className="h-16 w-16 overflow-hidden rounded bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
        title="Drag and drop to add more images"
      >
        <input {...getInputProps()} />
        <Image
          src={getPublicUrl(images[0], "products")}
          alt={productTitle}
          width={100}
          height={100}
          className="h-16 w-16 object-cover"
        />

        {/* Upload overlay when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <Upload className="h-4 w-4 text-blue-600" />
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
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {images.length - 1}
        </div>
      )}
    </div>
  );
}
