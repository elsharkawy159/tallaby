"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { checkSellerImage, uploadSellerImage } from "./seller-image-upload";

interface BannerUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Wide cover image for the store page. Same 3:1 / 4:1 frame the storefront
 * uses, so what the seller sees here is what shoppers see.
 */
export function BannerUploader({ value, onChange, disabled = false, className }: BannerUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Local object URL only while uploading; otherwise the form value is the
  // source of truth, so a restored draft shows its banner too.
  const [pending, setPending] = useState<string | null>(null);
  const preview = (isUploading && pending) || value || null;
  const t = useTranslations("onboarding");
  const busy = disabled || isUploading;

  const pick = () => {
    if (!busy) inputRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      onChange(await uploadSellerImage(file, "banner"));
      toast.success(t("bannerUploaded"));
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error(t("bannerUploadFailed"));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPending(null);
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label={preview ? t("changeBanner") : t("uploadBanner")}
        className={cn(
          "group relative grid aspect-[3/1] min-h-30 w-full place-items-center overflow-hidden border-b sm:aspect-[4/1]",
          "border-neutral-200 bg-[repeating-linear-gradient(135deg,var(--muted)_0_10px,var(--card)_10px_20px)] dark:border-input",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:ring-inset",
          busy ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {preview ? (
          <Image src={preview} alt="" fill sizes="(min-width: 768px) 760px, 100vw" className="object-cover" />
        ) : (
          // Kept above the overlapping logo so it is never covered.
          <span className="flex flex-col items-center gap-1.5 px-4 pb-8 text-center text-sm font-semibold text-neutral-700 transition-colors group-hover:text-primary sm:pb-6 dark:text-foreground">
            <ImagePlus className="size-5" aria-hidden />
            {t("uploadBanner")}
            <small className="text-xs font-normal text-muted-foreground">{t("bannerHint")}</small>
          </span>
        )}
        {isUploading && (
          <span className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          </span>
        )}
      </button>

      {preview && !busy && (
        <div className="absolute end-3 top-3 flex gap-1.5">
          <button
            type="button"
            onClick={pick}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[12.5px] text-white hover:bg-black/70"
          >
            <Camera className="size-3.5" aria-hidden />
            {t("changeBanner")}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("removeBanner")}
            className="grid size-7.5 cursor-pointer place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        disabled={busy}
      />
    </div>
  );
}
