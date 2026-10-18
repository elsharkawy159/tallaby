"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ImagePlus, LoaderCircle, Monitor, RotateCcw, Save, Smartphone, Trash2, UploadCloud } from "lucide-react";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import { FONT_PAIRINGS, findFontPairing, storeFontFamily } from "@workspace/store-sections/fonts";
import type { StoreProfile } from "@workspace/store-sections/render";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { FieldHint, SMALL_BUTTON_CLASS, BUTTON_CLASS } from "@/components/form/form-ui";
import { SELLER_IMAGE_ACCEPT_ATTR, useSellerUpload } from "@/components/inputs/use-seller-upload";
import { BannerField, LogoField } from "@/components/stores/brand-image-fields.client";
import { storeLogoSrc } from "@/components/stores/store-logo.client";
import { cn } from "@/lib/utils";
import { publish, saveDesignSystem } from "@/app/(builder)/stores/[storeId]/editor/editor.server";
import { saveStoreGeneral } from "../../settings/store-settings.server";
import { SitePreview, type PreviewCatalog, type PreviewDevice } from "../_components/site-preview.client";
import {
  COLOR_FIELDS,
  PALETTE_PRESETS,
  RADIUS_OPTIONS,
  SPACING_OPTIONS,
  WIDTH_OPTIONS,
  applyPreset,
  isHexColor,
  matchPreset,
  setToken,
  type ColorKey,
} from "./design.lib";

type Brand = { logoUrl: string; faviconUrl: string; bannerUrl: string };

const sample = (id: string, sectionId: string, props: Record<string, unknown> = {}): SectionInstance => ({ id, sectionId, version: 1, props });

export function DesignSystemEditor({
  storeId,
  readOnly,
  initial,
  store,
  defaultLocale,
  catalog,
  fontClassName,
}: {
  storeId: string;
  readOnly: boolean;
  initial: { designSystem: DesignSystem; version: number; brand: Brand };
  store: StoreProfile;
  defaultLocale: SiteLocale;
  catalog: PreviewCatalog;
  fontClassName: string;
}) {
  const t = useTranslations("websiteDesign");
  const uiLocale = useLocale() === "en" ? "en" : "ar";
  const router = useRouter();
  const [ds, setDs] = useState(initial.designSystem);
  const [savedDs, setSavedDs] = useState(JSON.stringify(initial.designSystem));
  const [version, setVersion] = useState(initial.version);
  const [conflict, setConflict] = useState(false);
  const [brand, setBrand] = useState(initial.brand);
  const [savedBrand, setSavedBrand] = useState(JSON.stringify(initial.brand));
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [previewLocale, setPreviewLocale] = useState<SiteLocale>(defaultLocale);
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const [savingBrand, startSavingBrand] = useTransition();

  const dirty = JSON.stringify(ds) !== savedDs;
  const brandDirty = JSON.stringify(brand) !== savedBrand;
  const disabled = readOnly || saving || publishing;
  const preset = matchPreset(ds.colors);
  const pairing = findFontPairing(ds.typography);

  const previewStore = useMemo<StoreProfile>(
    () => ({ ...store, logoUrl: brand.logoUrl || null, bannerUrl: brand.bannerUrl || null }),
    [store, brand.logoUrl, brand.bannerUrl],
  );
  const sections = useMemo(
    () => [
      sample("design-hero", "hero-banner", {
        title: store.name,
        subtitle: store.description || (previewLocale === "en" ? "Hand-picked products, delivered across Egypt." : "منتجات مختارة بعناية وتوصيل لكل محافظات مصر."),
        image: brand.bannerUrl,
        ctaLabel: previewLocale === "en" ? "Shop now" : "تسوّق الآن",
        ctaHref: "/",
      }),
      sample("design-products", "product-grid", {
        title: previewLocale === "en" ? "New arrivals" : "أحدث المنتجات",
        source: "newest",
        limit: 4,
        columns: "4",
        showViewAll: true,
      }),
      sample("design-features", "features"),
      sample("design-cta", "cta-banner", previewLocale === "en" ? { title: "Limited-time offer", ctaLabel: "Shop now", ctaHref: "/" } : {}),
    ],
    [store.name, store.description, brand.bannerUrl, previewLocale],
  );
  const header = useMemo(() => sample("design-header", "store-header", { showLogo: true, showName: true, showNav: true, announcement: "" }), []);
  const footer = useMemo(() => sample("design-footer", "store-footer"), []);

  const onSave = (then?: () => void) =>
    startSaving(async () => {
      const result = await saveDesignSystem(storeId, ds, version);
      if (result.success) {
        setVersion(result.data.version);
        setSavedDs(JSON.stringify(ds));
        toast.success(t("savedDraft"));
        then?.();
      } else {
        if (result.error === "versionConflict") setConflict(true);
        toast.error(t(`errors.${result.error}` as never));
      }
    });

  const onPublish = () =>
    startPublishing(async () => {
      const result = await publish(storeId);
      if (result.success) toast.success(t("published", { number: result.data.revisionNumber }));
      else toast.error(t(`errors.${result.error}` as never));
    });

  const onSaveBrand = () =>
    startSavingBrand(async () => {
      const result = await saveStoreGeneral(storeId, {
        logoUrl: brand.logoUrl || null,
        faviconUrl: brand.faviconUrl || null,
        bannerUrl: brand.bannerUrl || null,
      });
      if (result.success) {
        setSavedBrand(JSON.stringify(brand));
        toast.success(t("brand.saved"));
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}` as never));
      }
    });

  const color = (key: ColorKey, value: string) => setDs((prev) => setToken(prev, "colors", key, value));

  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]", fontClassName)}>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Badge variant="outline">{dirty ? t("unsaved") : t("draftSaved")}</Badge>
        </div>
        {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
        {conflict && (
          <p className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
            {t("errors.versionConflict")}
            <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} onClick={() => window.location.reload()}>
              <RotateCcw />
              {t("reload")}
            </Button>
          </p>
        )}

        <Tabs defaultValue="colors" dir={uiLocale === "ar" ? "rtl" : "ltr"}>
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="colors">{t("tabs.colors")}</TabsTrigger>
            <TabsTrigger value="typography">{t("tabs.typography")}</TabsTrigger>
            <TabsTrigger value="brand">{t("tabs.brand")}</TabsTrigger>
            <TabsTrigger value="buttons">{t("tabs.buttons")}</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-5 pt-3">
            <div>
              <p className="mb-2 text-sm font-semibold">{t("colors.presets")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("colors.presets")}>
                {PALETTE_PRESETS.map((p) => {
                  const selected = preset === p.id;
                  const swatch = { primary: "#145163", secondary: "#f2f5f4", accent: "#fdad28", ...p.colors };
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => setDs((prev) => ({ ...prev, colors: applyPreset(prev.colors, p.id) }))}
                      className={cn(
                        "relative flex flex-col gap-2 rounded-xl border p-2.5 text-start transition-colors disabled:opacity-50",
                        selected ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/40",
                      )}
                    >
                      <span className="flex h-7 overflow-hidden rounded-md">
                        <span className="flex-[2]" style={{ background: swatch.primary }} />
                        <span className="flex-1" style={{ background: swatch.secondary }} />
                        <span className="flex-1" style={{ background: swatch.accent }} />
                      </span>
                      <span className="text-xs font-medium">{t(`colors.preset.${p.id}` as never)}</span>
                      {selected && (
                        <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">{t("colors.custom")}</p>
              <FieldHint className="mb-3">{t("colors.customHint")}</FieldHint>
              <div className="grid gap-3 sm:grid-cols-2">
                {COLOR_FIELDS.map(({ key, classic }) => {
                  const value = ds.colors[key] ?? "";
                  const shown = value && isHexColor(value) ? value : classic;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border" style={{ background: value || classic }}>
                        <input
                          type="color"
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                          value={shown.length === 4 ? `#${[...shown.slice(1)].map((c) => c + c).join("")}` : shown}
                          disabled={disabled}
                          aria-label={t(`colors.fields.${key}` as never)}
                          onChange={(e) => color(key, e.target.value)}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{t(`colors.fields.${key}` as never)}</p>
                        <Input
                          dir="ltr"
                          className={cn("h-8 font-mono text-xs", value && !isHexColor(value) && "border-destructive")}
                          placeholder={classic}
                          value={value}
                          disabled={disabled}
                          onChange={(e) => color(key, e.target.value.trim())}
                        />
                      </div>
                      {value && (
                        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled} onClick={() => color(key, "")} aria-label={t("reset")}>
                          <RotateCcw className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-3 pt-3">
            <FieldHint>{t("typography.hint")}</FieldHint>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("tabs.typography")}>
              {FONT_PAIRINGS.map((p) => {
                const selected = pairing.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() =>
                      setDs((prev) => ({
                        ...prev,
                        typography:
                          p.id === "classic"
                            ? (({ headingFont: _h, bodyFont: _b, ...rest }) => rest)(prev.typography)
                            : { ...prev.typography, headingFont: p.heading, bodyFont: p.body },
                      }))
                    }
                    className={cn(
                      "relative flex flex-col gap-1 rounded-xl border p-3 text-start transition-colors disabled:opacity-50",
                      selected ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/40",
                    )}
                  >
                    <span className="text-lg font-bold leading-tight" style={{ fontFamily: storeFontFamily(p.heading) ?? undefined }}>
                      {t("typography.sampleHeading")}
                    </span>
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: storeFontFamily(p.body) ?? undefined }}>
                      {t("typography.sampleBody")}
                    </span>
                    <span dir="ltr" className="mt-1 text-start text-[11px] text-muted-foreground rtl:text-end">
                      {p.heading === p.body ? p.heading : `${p.heading} · ${p.body}`}
                      {p.id === "classic" ? ` — ${t("typography.classic")}` : ""}
                    </span>
                    {selected && (
                      <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="brand" className="space-y-5 pt-3">
            <FieldHint>{t("brand.hint")}</FieldHint>
            <LogoField value={brand.logoUrl} onChange={(logoUrl) => setBrand((b) => ({ ...b, logoUrl }))} name={store.name} disabled={readOnly || savingBrand} />
            <FaviconField value={brand.faviconUrl} onChange={(faviconUrl) => setBrand((b) => ({ ...b, faviconUrl }))} disabled={readOnly || savingBrand} />
            <BannerField value={brand.bannerUrl} onChange={(bannerUrl) => setBrand((b) => ({ ...b, bannerUrl }))} disabled={readOnly || savingBrand} />
            <div className="flex justify-end">
              <Button type="button" className={BUTTON_CLASS} disabled={readOnly || savingBrand || !brandDirty} onClick={onSaveBrand}>
                {savingBrand ? <LoaderCircle className="animate-spin" /> : <Save />}
                {t("brand.save")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="buttons" className="space-y-5 pt-3">
            <div>
              <p className="mb-2 text-sm font-semibold">{t("buttons.radius")}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("buttons.radius")}>
                {[undefined, ...RADIUS_OPTIONS].map((radius) => {
                  const selected = ds.spacing.borderRadius === radius;
                  return (
                    <button
                      key={radius ?? "classic"}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      onClick={() => setDs((prev) => setToken(prev, "spacing", "borderRadius", radius))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs transition-colors disabled:opacity-50",
                        selected ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/40",
                      )}
                    >
                      <span
                        className="inline-flex h-8 items-center px-4 text-xs font-semibold text-white"
                        style={{ background: ds.colors.primary ?? "#145163", borderRadius: radius ?? 12 }}
                      >
                        {t("buttons.sample")}
                      </span>
                      {radius === undefined ? t("buttons.classic") : `${radius}px`}
                    </button>
                  );
                })}
              </div>
            </div>
            <ChoiceRow
              label={t("buttons.width")}
              options={WIDTH_OPTIONS.map((o) => ({ id: o.id, value: o.value, label: t(`buttons.widths.${o.id}` as never) }))}
              current={ds.spacing.containerMaxWidth}
              disabled={disabled}
              onSelect={(value) => setDs((prev) => setToken(prev, "spacing", "containerMaxWidth", value))}
            />
            <ChoiceRow
              label={t("buttons.spacing")}
              options={SPACING_OPTIONS.map((o) => ({ id: o.id, value: o.value, label: t(`buttons.spacings.${o.id}` as never) }))}
              current={ds.spacing.sectionPaddingY}
              disabled={disabled}
              onSelect={(value) => setDs((prev) => setToken(prev, "spacing", "sectionPaddingY", value))}
            />
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 py-3 backdrop-blur">
          <FieldHint className="me-auto">{t("draftNote")}</FieldHint>
          <Button type="button" variant="neutral" className={BUTTON_CLASS} disabled={disabled || !dirty} onClick={() => setDs(JSON.parse(savedDs))}>
            <RotateCcw />
            {t("discard")}
          </Button>
          <Button type="button" variant="neutral" className={BUTTON_CLASS} disabled={disabled || !dirty || conflict} onClick={() => onSave()}>
            {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("saveDraft")}
          </Button>
          <Button type="button" className={BUTTON_CLASS} disabled={disabled || conflict} onClick={() => (dirty ? onSave(onPublish) : onPublish())}>
            {publishing ? <LoaderCircle className="animate-spin" /> : <UploadCloud />}
            {t("publish")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href={`/stores/${storeId}/editor`} className="font-medium text-primary hover:underline">
            {t("openEditor")}
          </Link>
        </p>
      </div>

      <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("preview.title")}</p>
          <div className="flex items-center gap-1">
            {(["ar", "en"] as const).map((l) => (
              <Button key={l} type="button" variant={previewLocale === l ? "secondary" : "ghost"} className="h-8 px-2.5 text-xs" onClick={() => setPreviewLocale(l)}>
                {l.toUpperCase()}
              </Button>
            ))}
            <Button type="button" variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="size-8" onClick={() => setDevice("desktop")} aria-label={t("preview.desktop")}>
              <Monitor className="size-4" />
            </Button>
            <Button type="button" variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="size-8" onClick={() => setDevice("mobile")} aria-label={t("preview.mobile")}>
              <Smartphone className="size-4" />
            </Button>
          </div>
        </div>
        <SitePreview
          className="h-[70vh] min-h-[480px] rounded-xl bg-muted/40 p-2"
          store={previewStore}
          catalog={catalog}
          sections={sections}
          header={header}
          footer={footer}
          designSystem={ds}
          locale={previewLocale}
          defaultLocale={previewLocale}
          device={device}
          fontClassName={fontClassName}
        />
      </div>
    </div>
  );
}

function ChoiceRow<V extends number | undefined>({
  label,
  options,
  current,
  disabled,
  onSelect,
}: {
  label: string;
  options: { id: string; value: V; label: string }[];
  current: number | undefined;
  disabled: boolean;
  onSelect: (value: V) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-50",
                selected ? "border-primary bg-primary/5 font-medium text-primary" : "hover:border-primary/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Square favicon picker (same upload as the logo; shown in browser tabs). */
function FaviconField({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = useTranslations("websiteDesign.brand");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useSellerUpload({ folder: "logos" });
  const src = storeLogoSrc(value);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative grid size-14 place-items-center overflow-hidden rounded-xl border bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={t("favicon")} className="size-8 object-contain" />
        ) : (
          <ImagePlus className="size-5 text-muted-foreground" />
        )}
        {isUploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <LoaderCircle className="size-4 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="min-w-[200px] flex-1">
        <p className="text-sm font-semibold">{t("favicon")}</p>
        <FieldHint className="mt-0.5 mb-2.5">{t("faviconHint")}</FieldHint>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} disabled={disabled || isUploading} onClick={() => inputRef.current?.click()}>
            <UploadCloud />
            {value ? t("changeFavicon") : t("uploadFavicon")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="soft"
              className={cn(SMALL_BUTTON_CLASS, "text-destructive hover:bg-destructive-soft hover:text-destructive")}
              disabled={disabled || isUploading}
              onClick={() => onChange("")}
            >
              <Trash2 />
              {t("remove")}
            </Button>
          )}
        </div>
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
      </div>
    </div>
  );
}
