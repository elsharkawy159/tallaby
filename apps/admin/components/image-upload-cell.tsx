"use client";

import React, { useCallback, useState, useRef } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/supabase/client";
import { generateImageName, getPublicUrl } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): void {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("File must be JPEG, PNG, or WebP");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File size must not exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }
}

export interface ImageUploadCellProps {
  value: string | null;
  bucket: string;
  onSave: (path: string | null) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  alt?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Reusable image upload cell - same pattern as ProductImageUpload on /products page.
 * Single image: drag-drop to upload/replace, click X to remove.
 */
export function ImageUploadCell({
  value,
  bucket,
  onSave,
  onSuccess,
  alt = "Image",
  size = "sm",
  className,
}: ImageUploadCellProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = size === "sm" ? "size-12" : "size-16";

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        validateFile(file);
        const filePath = generateImageName(file);

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload: ${error.message}`);
          return null;
        }

        return data.path;
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to upload");
        return null;
      }
    },
    [supabase, bucket],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);

      try {
        const uploadedPath = await handleFileUpload(file);

        if (uploadedPath) {
          const result = await onSave(uploadedPath);

          if (result.success) {
            toast.success("Image uploaded successfully");
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to update");
          }
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [handleFileUpload, onSave, onSuccess],
  );

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!value) return;

      setIsUploading(true);
      try {
        const result = await onSave(null);

        if (result.success) {
          toast.success("Image removed");
          onSuccess?.();
        } else {
          toast.error(result.error || "Failed to remove");
        }
      } catch {
        toast.error("Failed to remove image");
      } finally {
        setIsUploading(false);
      }
    },
    [value, onSave, onSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    onDrop,
    disabled: isUploading,
    maxFiles: 1,
    multiple: false,
    noClick: false,
  });

  const imageUrl = value ? getPublicUrl(value, bucket) : null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group/upload relative overflow-hidden rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
        sizeClasses,
        !imageUrl && "bg-muted/50 border-muted-foreground/25 hover:border-muted-foreground/50",
        imageUrl && "border-transparent hover:opacity-90",
        isDragActive && "border-primary bg-primary/10",
        isUploading && "opacity-70 cursor-not-allowed",
        className,
      )}
      title="Drag and drop image or click to upload"
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover"
            sizes="64px"
          />
          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
              <Upload className="h-5 w-5 text-primary" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0.5 right-0.5 rounded-full bg-destructive/90 p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover/upload:opacity-100 hover:opacity-100 focus:opacity-100 focus:outline-none z-10"
            title="Remove image"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <Upload className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}
