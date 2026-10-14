"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2, Store, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { checkSellerImage, uploadSellerImage } from "./seller-image-upload";

import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Round store avatar with a camera badge; sits over the cover image. */
export function LogoUploader({ value, onChange, disabled = false, className }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Local object URL only while uploading; the form value is the source of truth.
  const [pending, setPending] = useState<string | null>(null);
  const preview = (isUploading && pending) || value || null;
  const t = useTranslations("onboarding");
  const busy = disabled || isUploading;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const check = checkSellerImage(file);
    if (check !== "ok") {
      toast.error(t(check === "not_image" ? "pleaseSelectImageFile" : "fileSizeMustBeLess"));
      return;
    }

    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setPending(objectUrl);
    try {
      onChange(await uploadSellerImage(file, "logo"));
      toast.success(t("logoUploadedSuccessfully"));
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(t("failedToUploadLogo"));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPending(null);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative size-21 shrink-0", className)}>
      <button
        type="button"
        onClick={() => !busy && fileInputRef.current?.click()}
        disabled={busy}
        aria-label={t("uploadLogo")}
        className={cn(
          "relative grid size-full place-items-center overflow-hidden rounded-full border-4 border-card bg-primary-soft text-primary/70 shadow-md",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
          busy ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {preview ? (
          <Image src={preview} alt={t("businessLogo")} fill sizes="84px" className="object-cover" />
        ) : (
          <Store className="size-6.5" aria-hidden />
        )}
        {isUploading && (
          <span className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
          </span>
        )}
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute end-0 bottom-0 grid size-7 place-items-center rounded-full border-2 border-card bg-primary text-white"
      >
        <Camera className="size-3.5" />
      </span>
      {value && !busy && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("removeLogo")}
          className="absolute -top-1 -end-1 grid size-6 cursor-pointer place-items-center rounded-full border-2 border-card bg-destructive text-white hover:bg-destructive/90"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={busy}
      />
    </div>
  );
}
