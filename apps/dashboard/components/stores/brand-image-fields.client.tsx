"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { ImagePlus, ImageUp, LoaderCircle, Trash2, Upload, UploadCloud } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { FieldHint, LabelNote, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { SellerButton } from "@/components/seller-ui";
import { SELLER_IMAGE_ACCEPT, SELLER_IMAGE_ACCEPT_ATTR, useSellerUpload } from "@/components/inputs/use-seller-upload";
import { storeLogoSrc } from "@/components/stores/store-logo.client";
import { isOptimizableImage } from "@/lib/image-hosts";
import { cn } from "@/lib/utils";

/**
 * Logo and banner pickers for store settings, as controlled fields
 * (value = public URL or legacy bucket path, "" = none). Same look as the
 * identity section of /settings; uploads go through useSellerUpload.
 */

function useUploadPreview(folder: "logos" | "banners", onUploaded: (url: string) => void) {
  const { upload, isUploading } = useSellerUpload({ folder });
  const [preview, setPreview] = useState<string | null>(null);
  const pick = async (file: File) => {
    const blob = URL.createObjectURL(file);
    setPreview(blob);
    const url = await upload(file);
    if (url) onUploaded(url);
    setPreview(null);
    URL.revokeObjectURL(blob);
  };
  return { pick, preview, isUploading };
}

export function LogoField({
  value,
  onChange,
  name,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Store name, for the fallback initial. */
  name: string;
  disabled?: boolean;
}) {
  const t = useTranslations("settings");
  const inputRef = useRef<HTMLInputElement>(null);
  const logo = useUploadPreview("logos", onChange);
  const src = logo.preview ?? storeLogoSrc(value);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <Avatar className="size-22 border bg-muted">
          <AvatarImage src={src} alt={t("identity.logo")} className="object-cover" />
          <AvatarFallback className="bg-muted text-2xl font-semibold text-faint">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {logo.isUploading && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
            <LoaderCircle className="size-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="text-sm font-semibold">{t("identity.logo")}</p>
        <FieldHint className="mt-0.5 mb-2.5">{t("identity.logoHint")}</FieldHint>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="neutral"
            className={SMALL_BUTTON_CLASS}
            disabled={disabled || logo.isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            {value ? t("identity.changeLogo") : t("identity.uploadLogo")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="soft"
              className={cn(SMALL_BUTTON_CLASS, "text-destructive hover:bg-destructive-soft hover:text-destructive")}
              disabled={disabled || logo.isUploading}
              onClick={() => onChange("")}
            >
              <Trash2 />
              {t("identity.remove")}
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={SELLER_IMAGE_ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void logo.pick(file);
          }}
        />
      </div>
    </div>
  );
}

export function BannerField({
  value,
  onChange,
  disabled,
  label,
  sizeNote,
  removable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Field label and size note for other wide images (e.g. the SEO share image). */
  label?: string;
  sizeNote?: string;
  /** False hides the remove button (an image that must stay, like a hero photo). */
  removable?: boolean;
}) {
  const t = useTranslations("settings");
  const banner = useUploadPreview("banners", onChange);
  const src = banner.preview ?? storeLogoSrc(value);
  const drop = useDropzone({
    accept: SELLER_IMAGE_ACCEPT,
    multiple: false,
    disabled: disabled || banner.isUploading,
    noClick: Boolean(src),
    noKeyboard: Boolean(src),
    onDrop: ([file]) => {
      if (file) void banner.pick(file);
    },
  });

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex justify-between gap-2 text-[13px] font-semibold">
        {label ?? t("fields.banner")}
        <LabelNote>{sizeNote ?? t("identity.bannerSize")}</LabelNote>
      </p>
      <div
        {...drop.getRootProps({ "aria-label": src ? undefined : t("identity.bannerEmpty") })}
        className={cn(
          "relative aspect-[2.4/1] overflow-hidden rounded-xl border bg-muted outline-none sm:aspect-[4/1]",
          !src &&
            "cursor-pointer border-[1.5px] border-dashed border-input transition-colors hover:border-primary hover:bg-primary-soft focus-visible:border-primary",
          drop.isDragActive && "border-primary bg-primary-soft",
        )}
      >
        <input {...drop.getInputProps()} />
        {src ? (
          <>
            <Image
              src={src}
              alt={t("fields.banner")}
              fill
              sizes="(max-width: 768px) 100vw, 880px"
              className="object-cover"
              unoptimized={src.startsWith("blob:") || !isOptimizableImage(src)}
            />
            <div className="absolute end-3 bottom-3 flex gap-2">
              <Button
                type="button"
                variant="neutral"
                className={cn(SMALL_BUTTON_CLASS, "border-transparent bg-white/95 text-[#1f2a2e] hover:bg-white dark:bg-white/95")}
                disabled={disabled || banner.isUploading}
                onClick={drop.open}
              >
                <ImageUp />
                {t("identity.changeBanner")}
              </Button>
              {removable && (
                <Button
                  type="button"
                  variant="neutral"
                  className={cn(SMALL_BUTTON_CLASS, "border-transparent bg-white/95 px-2.5 text-[#c62828] hover:bg-[#fdecec] dark:bg-white/95")}
                  disabled={disabled || banner.isUploading}
                  onClick={() => onChange("")}
                  aria-label={t("identity.removeBanner")}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
            {banner.isUploading && (
              <div className="absolute inset-0 grid place-items-center bg-black/40">
                <LoaderCircle className="size-6 animate-spin text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center text-muted-foreground">
            {banner.isUploading ? <LoaderCircle className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
            <span className="text-sm">{t("identity.bannerEmpty")}</span>
            <FieldHint>{t("identity.formats")}</FieldHint>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Square favicon picker (same upload as the logo; shown in browser tabs), in
 * the Website › Design look. Moved from design.client.tsx so other pages can
 * use the same field.
 */
export function FaviconField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = useTranslations("websiteDesign.brand");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useSellerUpload({ folder: "logos" });
  const src = storeLogoSrc(value);

  return (
    <UploadRow
      media={
        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--s-fill) text-(--s-subtle)">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={t("favicon")} className="size-8 object-contain" />
          ) : (
            <ImagePlus className="size-5" aria-hidden />
          )}
          {isUploading && (
            <span className="absolute inset-0 grid place-items-center bg-black/40">
              <LoaderCircle className="size-4 animate-spin text-white" aria-hidden />
            </span>
          )}
        </span>
      }
      title={t("favicon")}
      hint={t("faviconHint")}
    >
      <SellerButton variant="mini" size="xs" disabled={disabled || isUploading} onClick={() => inputRef.current?.click()}>
        <UploadCloud aria-hidden />
        {value ? t("changeFavicon") : t("uploadFavicon")}
      </SellerButton>
      {value && (
        <SellerButton variant="mini" size="xs" className="text-destructive [&_svg]:text-destructive" disabled={disabled || isUploading} onClick={() => onChange("")}>
          <Trash2 aria-hidden />
          {t("remove")}
        </SellerButton>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={SELLER_IMAGE_ACCEPT_ATTR}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const url = await upload(file);
          if (url) onChange(url);
        }}
      />
    </UploadRow>
  );
}

/** The design's upload row (`.up`): image, title, hint and small actions. */
function UploadRow({ media, title, hint, children }: { media: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
      {media}
      <div className="min-w-0 flex-1">
        <b className="block text-sm font-bold text-(--s-ink)">{title}</b>
        <small className="block text-xs leading-[1.6] text-(--s-subtle)">{hint}</small>
        <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
      </div>
    </div>
  );
}
