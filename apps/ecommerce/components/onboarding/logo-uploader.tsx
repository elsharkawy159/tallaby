"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { checkSellerImage, uploadSellerImage } from "./seller-image-upload";

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
  const t = useTranslations("onboarding");

  const handleLogoClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const check = checkSellerImage(file);
    if (check !== "ok") {
      toast.error(t(check === "not_image" ? "pleaseSelectImageFile" : "fileSizeMustBeLess"));
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const publicUrl = await uploadSellerImage(file, "logo");
      onChange(publicUrl);
      toast.success(t("logoUploadedSuccessfully"));
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(t("failedToUploadLogo"));
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
          "relative size-32 rounded-full bg-card border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer transition-colors",
          disabled || isUploading
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt={t("businessLogo")}
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
                <span className="text-xs text-gray-500">
                  {t("clickToUpload")}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {t("pngJpgMax")}
                </span>
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


