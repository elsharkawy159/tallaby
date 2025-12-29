"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/supabase/client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

export function LogoUploader({
  value,
  onChange,
  disabled = false,
  className,
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const supabase = createClient();

  const handleLogoClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);


      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sellers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        toast.error("Failed to upload logo");
        setPreview(value || null);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("sellers").getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Something went wrong. Please try again.");
      setPreview(value || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleLogoClick}
        className={cn(
          "relative size-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer transition-colors",
          disabled || isUploading
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Business logo"
              width={124}
              height={124}
              className="object-cover rounded-full w-full h-full"
            />
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            {isUploading ? (
              <Loader2 className="size-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Camera className="size-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Click to upload</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG (max 5MB)</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}


