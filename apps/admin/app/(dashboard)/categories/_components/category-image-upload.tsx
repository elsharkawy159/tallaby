"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { LoaderCircle, Upload, ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { createClient } from "@/supabase/client";
import { generateImageName, getPublicUrl, validateImage } from "@/lib/utils";
import { toast } from "sonner";
import {
  CATEGORY_BUCKET,
  MAX_IMAGE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "../categories.constants";
import { updateCategory } from "@/actions/categories";

interface CategoryImageUploadProps {
  categoryId: string;
  currentImageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryImageUpload({
  categoryId,
  currentImageUrl,
  open,
  onOpenChange,
  onSuccess,
}: CategoryImageUploadProps) {
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const uniqueFileName = generateImageName(file);

      try {
        const { data, error } = await supabase.storage
          .from(CATEGORY_BUCKET)
          .upload(uniqueFileName, file, { upsert: false });

        if (error) throw error;

        return data.path;
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        return null;
      }
    },
    [supabase]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file
      try {
        await validateImage(file);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Invalid image file"
        );
        return;
      }

      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(
          `File size must not exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
        );
        return;
      }

      // Check file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("File must be JPEG, PNG, or WebP");
        return;
      }

      setPreview(URL.createObjectURL(file));
      setIsUploading(true);

      try {
        const uploadedPath = await handleFileUpload(file);

        if (uploadedPath) {
          // Update category with new image URL
          const result = await updateCategory(categoryId, {
            imageUrl: uploadedPath,
          });

          if (result.success) {
            toast.success("Image uploaded successfully");
            onSuccess();
            onOpenChange(false);
            setPreview(null);
          } else {
            toast.error(result.error || "Failed to update category");
          }
        }
      } catch (error) {
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      }
    },
    [handleFileUpload, categoryId, onSuccess, onOpenChange, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": ACCEPTED_IMAGE_TYPES,
    },
    onDrop,
    disabled: isUploading,
    maxFiles: 1,
  });

  const handleRemove = async () => {
    if (!currentImageUrl) return;

    setIsUploading(true);
    try {
      const result = await updateCategory(categoryId, {
        imageUrl: null,
      });

      if (result.success) {
        toast.success("Image removed successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to remove image");
      }
    } catch (error) {
      toast.error("Failed to remove image");
    } finally {
      setIsUploading(false);
    }
  };

  const currentImage = currentImageUrl
    ? getPublicUrl(currentImageUrl, CATEGORY_BUCKET)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Category Image</DialogTitle>
          <DialogDescription>
            Upload a thumbnail image for this category. Recommended size:
            200x200px
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Image Preview */}
          {currentImage && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-gray-50">
              <Image
                src={currentImage}
                alt="Current category image"
                fill
                className="object-cover"
                sizes="400px"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
            } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Drop the image here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or WebP (MAX. 2MB)
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
