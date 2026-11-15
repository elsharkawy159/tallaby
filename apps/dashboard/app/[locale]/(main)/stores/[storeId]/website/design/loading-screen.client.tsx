"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { MEDIA_BUCKET, mediaPublicUrl } from "@workspace/lib/media";
import {
  LOADING_SCREEN_ACCEPT_ATTR,
  LOADING_SCREEN_BLUR_MAX,
  LOADING_SCREEN_MAX_BYTES,
  LOADING_SCREEN_PX,
  isLoadingScreenMediaType,
  loadingScreenBackground,
  type StoreLoadingScreen,
} from "@workspace/lib/stores/loading-screen";
import { Note, SellerButton, Segmented, Toggle } from "@/components/seller-ui";
import { uploadOwnFolderFile } from "@/components/inputs/use-seller-upload";
import { createUploadPaths, recordUpload } from "@/components/media/media.server";
import { cn } from "@/lib/utils";
import { isHexColor } from "./design.lib";
import { saveLoadingScreen } from "./loading-screen.server";

const LABEL = "text-[13.5px] font-bold text-(--s-text)";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** The preview phone is this wide; a real phone is about 390 px, so px sizes are scaled to match. */
const MOCK_WIDTH = 210;
const PHONE_WIDTH = 390;

/**
 * Website › Design › Loading screen (ROADMAP.md F-96): an optional cover the
 * store website shows while its first page loads. Saved at once (not a draft),
 * like the logo on the Brand tab. The image goes to the store's media library
 * through the server-signed `store-media` upload; the save action re-checks
 * its real size and type.
 */
export function LoadingScreenSettings({
  storeId,
  initial,
  disabled: readOnly,
}: {
  storeId: string;
  initial: StoreLoadingScreen;
  disabled: boolean;
}) {
  const t = useTranslations("websiteDesign.loading");
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [colorText, setColorText] = useState(initial.background.color);
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(value) !== saved;
  const disabled = readOnly || saving || uploading;
  const empty = value.enabled && !value.mediaPath && value.background.opacity === 0;
  const mediaUrl = value.mediaPath && SUPABASE_URL ? mediaPublicUrl(SUPABASE_URL, value.mediaPath) : null;
  const px = value.size.mode === "px" ? value.size.px : LOADING_SCREEN_PX.default;

  const setBackground = (patch: Partial<StoreLoadingScreen["background"]>) =>
    setValue((prev) => ({ ...prev, background: { ...prev.background, ...patch } }));

  const onFile = async (file: File) => {
    if (!isLoadingScreenMediaType(file.type)) return void toast.error(t("errors.invalidType"));
    if (file.size > LOADING_SCREEN_MAX_BYTES) return void toast.error(t("errors.tooLarge"));
    setUploading(true);
    try {
      const paths = await createUploadPaths(storeId, { shared: false, types: [file.type] });
      const path = paths.success ? paths.data[0] : null;
      if (!path) throw new Error("no upload path");
      await uploadOwnFolderFile(file, { bucket: MEDIA_BUCKET, path });
      const recorded = await recordUpload(storeId, { storagePath: path, filename: file.name.slice(0, 200) || "loading" });
      if (!recorded.success) throw new Error(recorded.error);
      setValue((prev) => ({ ...prev, mediaPath: path }));
    } catch (error) {
      console.error("Loading screen upload failed:", error);
      toast.error(t("errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const onSave = () =>
    startSaving(async () => {
      const result = await saveLoadingScreen(storeId, value);
      if (result.success) {
        setValue(result.settings);
        setColorText(result.settings.background.color);
        setSaved(JSON.stringify(result.settings));
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}` as never));
      }
    });

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
        <div className="min-w-0">
          <b className="block text-sm font-bold text-(--s-ink)">{t("enabled")}</b>
          <small className="block text-xs leading-[1.6] text-(--s-subtle)">{t("enabledHint")}</small>
        </div>
        <Toggle
          aria-label={t("enabled")}
          checked={value.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => setValue((prev) => ({ ...prev, enabled }))}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 max-[640px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Image */}
          <div className="flex items-center gap-4 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
            <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--s-fill) text-(--s-subtle)">
              {mediaUrl ? (
                // A plain <img>: next/image would freeze an animated GIF.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt="" className="size-12 object-contain" />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
              {uploading && (
                <span className="absolute inset-0 grid place-items-center bg-black/40">
                  <LoaderCircle className="size-4 animate-spin text-white" aria-hidden />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-sm font-bold text-(--s-ink)">{t("media")}</b>
              <small className="block text-xs leading-[1.6] text-(--s-subtle)">{t("mediaHint")}</small>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <SellerButton variant="mini" size="xs" disabled={disabled} onClick={() => inputRef.current?.click()}>
                  <UploadCloud aria-hidden />
                  {value.mediaPath ? t("changeMedia") : t("uploadMedia")}
                </SellerButton>
                {value.mediaPath && (
                  <SellerButton
                    variant="mini"
                    size="xs"
                    className="text-destructive [&_svg]:text-destructive"
                    disabled={disabled}
                    onClick={() => setValue((prev) => ({ ...prev, mediaPath: null }))}
                  >
                    <Trash2 aria-hidden />
                    {t("removeMedia")}
                  </SellerButton>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={LOADING_SCREEN_ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onFile(file);
                }}
              />
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-2">
            <p className={LABEL}>{t("size")}</p>
            <Segmented
              label={t("size")}
              className="self-start"
              value={value.size.mode}
              onChange={(mode) => setValue((prev) => ({ ...prev, size: mode === "full" ? { mode: "full" } : { mode: "px", px } }))}
              options={[
                { value: "px" as const, label: t("sizePx") },
                { value: "full" as const, label: t("sizeFull") },
              ]}
            />
            {value.size.mode === "px" && (
              <Slider
                label={t("width")}
                value={value.size.px}
                min={LOADING_SCREEN_PX.min}
                max={LOADING_SCREEN_PX.max}
                step={4}
                unit="px"
                disabled={disabled}
                onChange={(next) => setValue((prev) => ({ ...prev, size: { mode: "px", px: next } }))}
              />
            )}
            <small className="text-xs text-(--s-faint)">{value.size.mode === "full" ? t("sizeFullHint") : t("sizePxHint")}</small>
          </div>

          {/* Background */}
          <div className="flex flex-col gap-3">
            <p className={LABEL}>{t("background")}</p>
            <div className="flex items-center gap-2.5 rounded-[14px] border border-(--s-line) bg-(--s-surface) px-2.5 py-2 hover:border-(--s-outline)">
              <label className="relative size-[34px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-black/10" style={{ background: value.background.color }}>
                <input
                  type="color"
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  value={value.background.color.length === 4 ? `#${[...value.background.color.slice(1)].map((c) => c + c).join("")}` : value.background.color}
                  disabled={disabled}
                  aria-label={t("color")}
                  onChange={(e) => {
                    setColorText(e.target.value);
                    setBackground({ color: e.target.value.toLowerCase() });
                  }}
                />
              </label>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[13px] font-bold text-(--s-text)">{t("color")}</b>
                <input
                  dir="ltr"
                  className={cn(
                    "h-6 w-full bg-transparent text-start font-montserrat text-[11.5px] font-medium uppercase text-(--s-subtle) outline-none focus:text-(--s-text) rtl:text-end",
                    !isHexColor(colorText) && "text-destructive",
                  )}
                  value={colorText}
                  disabled={disabled}
                  aria-label={`${t("color")} (hex)`}
                  aria-invalid={!isHexColor(colorText) || undefined}
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    setColorText(next);
                    if (isHexColor(next)) setBackground({ color: next.toLowerCase() });
                  }}
                />
              </div>
            </div>
            <Slider label={t("opacity")} value={value.background.opacity} min={0} max={100} step={5} unit="%" disabled={disabled} onChange={(opacity) => setBackground({ opacity })} />
            <Slider label={t("blur")} value={value.background.blur} min={0} max={LOADING_SCREEN_BLUR_MAX} step={1} unit="px" disabled={disabled} onChange={(blur) => setBackground({ blur })} />
          </div>
        </div>

        <LoadingScreenMock value={value} mediaUrl={mediaUrl} label={t("preview")} />
      </div>

      {empty && <Note tone="danger">{t("errors.empty")}</Note>}
      <Note>{t("hint")}</Note>
      <div className="flex justify-end gap-2 max-[720px]:[&>*]:flex-1">
        <SellerButton
          variant="outline"
          disabled={disabled || !dirty}
          onClick={() => {
            const previous = JSON.parse(saved) as StoreLoadingScreen;
            setValue(previous);
            setColorText(previous.background.color);
          }}
        >
          <RotateCcw aria-hidden />
          {t("discard")}
        </SellerButton>
        <SellerButton variant="solid" disabled={disabled || !dirty || empty || !isHexColor(colorText)} onClick={onSave}>
          {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {t("save")}
        </SellerButton>
      </div>
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-[13px] text-(--s-muted)">
      <span className="w-24 shrink-0 font-semibold">{label}</span>
      <input
        type="range"
        className="h-10 min-w-0 flex-1 cursor-pointer accent-(--s-primary) disabled:cursor-not-allowed"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output dir="ltr" className="w-14 shrink-0 text-end font-montserrat text-xs font-semibold text-(--s-text) tabular-nums">
        {value}
        {unit}
      </output>
    </label>
  );
}

/** A small phone with a sketched store page behind the loading screen, so the opacity and blur show. */
function LoadingScreenMock({ value, mediaUrl, label }: { value: StoreLoadingScreen; mediaUrl: string | null; label: string }) {
  const color = isHexColor(value.background.color) ? value.background.color : "#ffffff";
  const scale = MOCK_WIDTH / PHONE_WIDTH;
  return (
    <figure className="flex flex-col items-center gap-2 max-[640px]:self-center" aria-label={label}>
      <div
        className="relative overflow-hidden rounded-[28px] border-[6px] border-(--s-ink) bg-white shadow-sm"
        style={{ width: MOCK_WIDTH + 12, height: Math.round(MOCK_WIDTH * 1.9) }}
      >
        {/* The store page behind */}
        <div aria-hidden className="flex h-full flex-col gap-2.5 p-3">
          <div className="flex items-center justify-between">
            <span className="h-3 w-14 rounded-full bg-slate-800" />
            <span className="size-4 rounded-full bg-slate-300" />
          </div>
          <div className="h-24 rounded-xl bg-linear-[135deg,#f59e0b,#ec4899]" />
          <span className="h-2.5 w-3/4 rounded-full bg-slate-700" />
          <span className="h-2 w-1/2 rounded-full bg-slate-300" />
          <div className="grid grid-cols-2 gap-2">
            {["#22c55e", "#3b82f6", "#a855f7", "#f97316"].map((tone) => (
              <div key={tone} className="flex flex-col gap-1">
                <span className="h-16 rounded-lg" style={{ background: tone }} />
                <span className="h-1.5 w-3/4 rounded-full bg-slate-400" />
              </div>
            ))}
          </div>
        </div>
        {/* The loading screen (shown even while off, so the seller sees what they're setting) */}
        <div
          aria-hidden
          className={cn("absolute inset-0 grid place-items-center transition-opacity", !value.enabled && "opacity-60")}
          style={{
            background: loadingScreenBackground(color, value.background.opacity),
            backdropFilter: value.background.blur ? `blur(${value.background.blur * scale}px)` : undefined,
            WebkitBackdropFilter: value.background.blur ? `blur(${value.background.blur * scale}px)` : undefined,
          }}
        >
          {mediaUrl &&
            (value.size.mode === "full" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="h-auto max-w-[90%] object-contain" style={{ width: Math.round(value.size.px * scale) }} />
            ))}
        </div>
      </div>
      <figcaption className="text-xs font-semibold text-(--s-subtle)">{label}</figcaption>
    </figure>
  );
}
