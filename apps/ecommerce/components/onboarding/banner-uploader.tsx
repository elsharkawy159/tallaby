"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
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

  const remove = () => onChange("");

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label={preview ? t("changeBanner") : t("uploadBanner")}
        className={cn(
          "group relative block aspect-[3/1] w-full overflow-hidden rounded-xl md:aspect-[4/1]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          preview
            ? "bg-muted"
            : "border-2 border-dashed border-border bg-muted/40 hover:border-primary hover:bg-primary/5",
          busy && "cursor-not-allowed",
        )}
      >
        {preview ? (
          <>
            <Image src={preview} alt="" fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
            {!busy && (
              <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <RefreshCw className="h-4 w-4" aria-hidden />
                {t("changeBanner")}
              </span>
            )}
          </>
        ) : (
          // Content sits in the top/end area so the overlapping logo never covers it.
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 pb-6 text-center md:items-end md:pe-10 md:pb-0">
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{t("uploadBanner")}</span>
            <span className="text-xs text-muted-foreground">{t("bannerHint")}</span>
          </span>
        )}
        {isUploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          </span>
        )}
      </button>

      {preview && !busy && (
        <button
          type="button"
          onClick={remove}
          className="absolute end-2 top-2 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t("removeBanner")}
        </button>
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
