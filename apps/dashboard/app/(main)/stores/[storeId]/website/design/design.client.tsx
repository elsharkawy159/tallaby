"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  Monitor,
  Palette,
  RectangleHorizontal,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Type,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import { FONT_PAIRINGS, findFontPairing, storeFontFamily } from "@workspace/store-sections/fonts";
import type { StoreProfile } from "@workspace/store-sections/render";
import { IconButton, Note, PageHeader, PageTabs, Segmented, SellerButton, SellerCard } from "@/components/seller-ui";
import { SELLER_IMAGE_ACCEPT_ATTR, useSellerUpload } from "@/components/inputs/use-seller-upload";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { LogoField } from "@/components/stores/brand-image-fields.client";
import { storeLogoSrc } from "@/components/stores/store-logo.client";
import { cn } from "@/lib/utils";
import { publish, saveDesignSystem, saveDraft } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import { requestWelcomeGiftCheck } from "@/components/layout/welcome-gift.lib";
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
import { HeroBannerList } from "./hero-banners.client";
import { applyHeroBanners, type HeroBanners } from "./hero-banners.lib";

type Brand = { logoUrl: string; faviconUrl: string; bannerUrl: string };

/** The home page draft whose hero photos the banner list edits (null: no hero photos). */
export type HeroBannersDraft = { hero: HeroBanners; pageId: string; version: number; content: { sections: SectionInstance[] } };

type SectionId = "brand" | "colors" | "typography" | "buttons" | "layout";

/** The page's tabs, in order. `#colors` etc. opens one directly. */
const SECTIONS: readonly { id: SectionId; icon: LucideIcon }[] = [
  { id: "brand", icon: BadgeCheck },
  { id: "colors", icon: Palette },
  { id: "typography", icon: Type },
  { id: "buttons", icon: RectangleHorizontal },
  { id: "layout", icon: LayoutTemplate },
];

/** Custom colors in two groups: the brand's own, then backgrounds and text. */
const COLOR_GROUPS: readonly { id: "brand" | "surfaces"; keys: readonly ColorKey[] }[] = [
  { id: "brand", keys: ["primary", "accent", "secondary"] },
  { id: "surfaces", keys: ["background", "foreground", "muted", "border"] },
];

/** Selected look of the design's choice cards (`.pal`, `.fo`, `.chc`). */
const CHOICE =
  "cursor-pointer rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) transition-[border-color,background-color,box-shadow] duration-150 hover:border-(--s-outline) disabled:cursor-not-allowed disabled:opacity-50 aria-checked:border-(--s-primary) aria-checked:bg-(--s-tint) aria-checked:shadow-[0_0_0_3px_var(--s-focus-soft)]";

const LABEL = "text-[13.5px] font-bold text-(--s-text)";

export function DesignSystemEditor({
  storeId,
  readOnly,
  initial,
  store,
  defaultLocale,
  catalog,
  preview,
  heroBanners,
  fontClassName,
  translated = false,
}: {
  storeId: string;
  readOnly: boolean;
  initial: { designSystem: DesignSystem; version: number; brand: Brand };
  store: StoreProfile;
  defaultLocale: SiteLocale;
  catalog: PreviewCatalog;
  /** The store's draft home page, header and footer. */
  preview: { sections: SectionInstance[]; header: SectionInstance | null; footer: SectionInstance | null };
  heroBanners: HeroBannersDraft | null;
  fontClassName: string;
  /** The store has more than one language (the preview header shows its language switcher). */
  translated?: boolean;
}) {
  const t = useTranslations("websiteDesign");
  const router = useRouter();
  const [tab, setTab] = useState<SectionId>("brand");
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
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [banners, setBanners] = useState(heroBanners?.hero.srcs ?? []);
  const [savedBanners, setSavedBanners] = useState(JSON.stringify(heroBanners?.hero.srcs ?? []));
  const [homeVersion, setHomeVersion] = useState(heroBanners?.version ?? 0);

  // An old link to a section of this page opens its tab.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (SECTIONS.some((section) => section.id === hash)) setTab(hash as SectionId);
  }, []);

  const dirty = JSON.stringify(ds) !== savedDs;
  const bannersDirty = JSON.stringify(banners) !== savedBanners;
  const brandDirty = JSON.stringify(brand) !== savedBrand || bannersDirty;
  const disabled = readOnly || saving || publishing;
  const preset = matchPreset(ds.colors);
  const pairing = findFontPairing(ds.typography);

  // Closing the tab with unsaved work warns, as the SaveBar does on other pages.
  useEffect(() => {
    if (!dirty && !brandDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, brandDirty]);

  const previewStore = useMemo<StoreProfile>(
    () => ({ ...store, logoUrl: brand.logoUrl || null, bannerUrl: banners[0] || brand.bannerUrl || null }),
    [store, brand.logoUrl, brand.bannerUrl, banners],
  );
  // The preview shows the banners before they are saved.
  const previewSections = useMemo(
    () => (heroBanners ? applyHeroBanners(preview.sections, heroBanners.hero, banners) : preview.sections),
    [heroBanners, preview.sections, banners],
  );

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
      if (result.success) {
        toast.success(t("published", { number: result.data.revisionNumber }));
        setConfirmPublish(false);
        requestWelcomeGiftCheck();
      } else toast.error(t(`errors.${result.error}` as never));
    });

  const onSaveBrand = () =>
    startSavingBrand(async () => {
      // Banners are the home page hero's photos: saved to its draft (live on Publish).
      if (heroBanners && bannersDirty) {
        const sections = applyHeroBanners(heroBanners.content.sections, heroBanners.hero, banners);
        const draft = await saveDraft(storeId, heroBanners.pageId, { ...heroBanners.content, sections }, homeVersion);
        if (!draft.success) {
          if (draft.error === "versionConflict") setConflict(true);
          toast.error(t(`errors.${draft.error}` as never));
          return;
        }
        setHomeVersion(draft.data.draftVersion);
        setSavedBanners(JSON.stringify(banners));
      }
      // The first banner is also the store's banner.
      const first = banners[0];
      const result = await saveStoreGeneral(storeId, {
        logoUrl: brand.logoUrl || null,
        faviconUrl: brand.faviconUrl || null,
        ...(bannersDirty && first && /^https:\/\//.test(first) && { bannerUrl: first }),
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
  const current = SECTIONS.find((section) => section.id === tab)!;

  return (
    <>
      <PageHeader
        className="sui-rise"
        title={t("title")}
        description={t("draftNote")}
        actions={
          <>
            <span
              className={cn(
                "inline-flex items-center gap-[7px] px-1.5 text-[12.5px] font-semibold max-[720px]:w-full",
                dirty ? "text-accent-ink" : "text-success",
              )}
            >
              <i aria-hidden className="size-2 rounded-full bg-current" />
              {dirty ? t("unsaved") : t("draftSaved")}
            </span>
            <SellerButton variant="outline" size="sm" disabled={disabled || !dirty} onClick={() => setDs(JSON.parse(savedDs))}>
              <RotateCcw aria-hidden />
              {t("discard")}
            </SellerButton>
            <SellerButton variant="outline" size="sm" disabled={disabled || !dirty || conflict} onClick={() => onSave()}>
              {saving ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              {t("saveDraft")}
            </SellerButton>
            <SellerButton disabled={disabled || conflict} onClick={() => setConfirmPublish(true)}>
              {publishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
              {t("publish")}
            </SellerButton>
          </>
        }
      />
      {/* Publish puts every draft change on the live site (pages, template too), not only the design. */}
      <ConfirmActionDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={t("publishConfirm.title")}
        description={t("publishConfirm.description")}
        confirmLabel={t("publish")}
        pending={saving || publishing}
        onConfirm={() => (dirty ? onSave(onPublish) : onPublish())}
      />
      {readOnly && <Note>{t("readOnly")}</Note>}
      {conflict && (
        <Note tone="danger">
          <span className="flex flex-wrap items-center justify-between gap-2">
            {t("errors.versionConflict")}
            <SellerButton variant="mini" size="xs" onClick={() => window.location.reload()}>
              <RotateCcw aria-hidden />
              {t("reload")}
            </SellerButton>
          </span>
        </Note>
      )}

      <div className={cn("grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-5 max-[1180px]:grid-cols-1", fontClassName)}>
        <div className="sui-rise flex min-w-0 flex-col gap-3.5 [animation-delay:.05s]">
          <PageTabs
            sticky={false}
            // Five tabs in half a page: tighter, with no icons, while the column is narrow.
            className="min-[1181px]:max-[1560px]:[&>*]:px-2.5 min-[1181px]:max-[1560px]:[&_svg]:hidden"
            label={t("jumpTo")}
            value={tab}
            onChange={(key) => setTab(key as SectionId)}
            tabs={SECTIONS.map(({ id, icon }) => ({ key: id, icon, label: t(`sections.${id}.title` as never) }))}
          />

          <SellerCard
            key={tab}
            role="tabpanel"
            aria-labelledby={`design-${tab}-title`}
            className="sui-rise flex flex-col gap-5 px-6 pb-6 pt-[22px] max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]"
          >
            <div>
              <h2 id={`design-${tab}-title`} className="text-[17px] font-bold text-(--s-ink)">
                {t(`sections.${current.id}.title` as never)}
              </h2>
              <p className="text-pretty text-[13px] text-(--s-subtle)">{t(`sections.${current.id}.description` as never)}</p>
            </div>

            {tab === "brand" && (
              <>
                <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
                  <LogoField value={brand.logoUrl} onChange={(logoUrl) => setBrand((b) => ({ ...b, logoUrl }))} name={store.name} disabled={readOnly || savingBrand} />
                </div>
                <FaviconField value={brand.faviconUrl} onChange={(faviconUrl) => setBrand((b) => ({ ...b, faviconUrl }))} disabled={readOnly || savingBrand} />
                {/* Only a theme whose hero has photos gets banners (owner, 2026-10-31). */}
                {heroBanners && (
                  <HeroBannerList kind={heroBanners.hero.kind} size={heroBanners.hero.size} value={banners} onChange={setBanners} disabled={readOnly || savingBrand || conflict} />
                )}
                <Note>{t("brand.hint")}</Note>
                <div className="flex justify-end max-[720px]:[&>*]:flex-1">
                  <SellerButton variant="solid" disabled={readOnly || savingBrand || !brandDirty} onClick={onSaveBrand}>
                    {savingBrand ? <LoaderCircle className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                    {t("brand.save")}
                  </SellerButton>
                </div>
              </>
            )}

            {tab === "colors" && (
              <>
                <div className="flex flex-col gap-2">
                  <p className={LABEL}>{t("colors.presets")}</p>
                  <div className="grid grid-cols-3 gap-2 max-[480px]:grid-cols-2" role="radiogroup" aria-label={t("colors.presets")}>
                    {PALETTE_PRESETS.map((p) => {
                      const swatch = { primary: "#145163", secondary: "#f2f5f4", accent: "#fdad28", ...p.colors };
                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={preset === p.id}
                          disabled={disabled}
                          onClick={() => setDs((prev) => ({ ...prev, colors: applyPreset(prev.colors, p.id) }))}
                          className={cn(CHOICE, "flex flex-col gap-2 p-2.5 text-start")}
                        >
                          <span className="flex h-[30px] overflow-hidden rounded-[9px]">
                            <span className="flex-[2]" style={{ background: swatch.primary }} />
                            <span className="flex-1" style={{ background: swatch.secondary }} />
                            <span className="flex-1" style={{ background: swatch.accent }} />
                          </span>
                          <b className="text-[12.5px] font-bold text-(--s-text)">{t(`colors.preset.${p.id}` as never)}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className={LABEL}>{t("colors.custom")}</p>
                    <p className="text-pretty text-xs text-(--s-faint)">{t("colors.customHint")}</p>
                  </div>
                  {COLOR_GROUPS.map((group) => (
                    <div key={group.id} className="flex flex-col gap-2">
                      <small className="text-xs font-bold text-(--s-faint)">{t(`colorGroups.${group.id}` as never)}</small>
                      <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
                        {COLOR_FIELDS.filter(({ key }) => group.keys.includes(key)).map(({ key, classic }) => {
                          const value = ds.colors[key] ?? "";
                          const shown = value && isHexColor(value) ? value : classic;
                          return (
                            <div key={key} className="flex items-center gap-2.5 rounded-[14px] border border-(--s-line) bg-(--s-surface) px-2.5 py-2 hover:border-(--s-outline)">
                              <label className="relative size-[34px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-black/10" style={{ background: value || classic }}>
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
                                <b className="block truncate text-[13px] font-bold text-(--s-text)">{t(`colors.fields.${key}` as never)}</b>
                                <input
                                  dir="ltr"
                                  className={cn(
                                    "h-6 w-full bg-transparent text-start font-montserrat text-[11.5px] font-medium uppercase text-(--s-subtle) outline-none placeholder:text-(--s-faint) focus:text-(--s-text) rtl:text-end",
                                    value && !isHexColor(value) && "text-destructive",
                                  )}
                                  placeholder={classic}
                                  value={value}
                                  disabled={disabled}
                                  aria-label={`${t(`colors.fields.${key}` as never)} (hex)`}
                                  aria-invalid={Boolean(value && !isHexColor(value)) || undefined}
                                  onChange={(e) => color(key, e.target.value.trim())}
                                />
                              </div>
                              {value && (
                                <IconButton disabled={disabled} onClick={() => color(key, "")} aria-label={t("reset")} title={t("reset")} className="size-8 max-[600px]:size-10">
                                  <RotateCcw className="!size-3.5" aria-hidden />
                                </IconButton>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "typography" && (
              <div className="flex flex-col gap-2">
                <p className="text-pretty text-xs text-(--s-faint)">{t("typography.hint")}</p>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("sections.typography.title")}>
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
                        className={cn(CHOICE, "flex items-center gap-3.5 px-3.5 py-3 text-start")}
                      >
                        <span
                          aria-hidden
                          className="grid size-12 shrink-0 place-items-center rounded-[13px] bg-primary-soft text-xl text-primary-ink"
                          style={{ fontFamily: storeFontFamily(p.heading) ?? undefined }}
                        >
                          أب
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-[17px] font-bold leading-normal text-(--s-ink)" style={{ fontFamily: storeFontFamily(p.heading) ?? undefined }}>
                            {t("typography.sampleHeading")}
                          </b>
                          <span className="block truncate text-[13px] text-(--s-muted)" style={{ fontFamily: storeFontFamily(p.body) ?? undefined }}>
                            {t("typography.sampleBody")}
                          </span>
                          <small dir="ltr" className="block text-start font-montserrat text-[11.5px] font-medium text-(--s-subtle) rtl:text-end">
                            {p.heading === p.body ? p.heading : `${p.heading} · ${p.body}`}
                            {p.id === "classic" ? ` · ${t("typography.classic")}` : ""}
                          </small>
                        </span>
                        <Radio on={selected} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "buttons" && (
              <div className="flex flex-col gap-2">
                <p className={LABEL}>{t("buttons.radius")}</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2" role="radiogroup" aria-label={t("buttons.radius")}>
                  {[undefined, ...RADIUS_OPTIONS].map((radius) => (
                    <button
                      key={radius ?? "classic"}
                      type="button"
                      role="radio"
                      aria-checked={ds.spacing.borderRadius === radius}
                      disabled={disabled}
                      onClick={() => setDs((prev) => setToken(prev, "spacing", "borderRadius", radius))}
                      className={cn(CHOICE, "flex flex-col items-center gap-2 px-2.5 py-3.5 text-[12.5px] font-semibold text-(--s-muted)")}
                    >
                      <span
                        className="inline-flex h-[30px] items-center px-4 text-xs font-semibold text-white"
                        style={{ background: ds.colors.primary ?? "#145163", borderRadius: radius ?? 12 }}
                      >
                        {t("buttons.sample")}
                      </span>
                      {radius === undefined ? t("buttons.classic") : `${radius}px`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "layout" && (
              <>
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
              </>
            )}
          </SellerCard>
        </div>

        <aside className="sui-rise flex min-w-0 flex-col gap-2.5 [animation-delay:.1s] min-[1181px]:sticky min-[1181px]:top-[88px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <b className="flex items-center gap-2 text-sm font-bold text-(--s-ink)">{t("preview.title")}</b>
            <div className="flex gap-1.5">
              <Segmented
                solid
                value={previewLocale}
                onChange={(value) => setPreviewLocale(value)}
                options={(["ar", "en"] as const).map((l) => ({ value: l, label: <span className="font-montserrat">{l.toUpperCase()}</span> }))}
              />
              <Segmented
                value={device}
                onChange={setDevice}
                options={[
                  { value: "desktop" as const, label: <DeviceIcon icon={Monitor} text={t("preview.desktop")} /> },
                  { value: "mobile" as const, label: <DeviceIcon icon={Smartphone} text={t("preview.mobile")} /> },
                ]}
              />
            </div>
          </div>
          <SitePreview
            className="h-[calc(100dvh-160px)] min-h-[520px] rounded-[24px] border border-(--s-line) bg-linear-[160deg,var(--s-fill),var(--s-surface-2)] p-3 max-[1180px]:h-[70vh] max-[720px]:p-2"
            store={previewStore}
            catalog={catalog}
            sections={previewSections}
            header={preview.header}
            footer={preview.footer}
            designSystem={ds}
            locale={previewLocale}
            defaultLocale={previewLocale}
            device={device}
            fontClassName={fontClassName}
            translated={translated}
          />
        </aside>
      </div>
    </>
  );
}

function DeviceIcon({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="grid place-items-center">
      <Icon aria-hidden className="size-[15px]" />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** The design's round radio (`.rd`). */
function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-(--s-primary) bg-(--s-primary) text-(--s-solid-fg)" : "border-(--s-field-strong)")}
    >
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
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
    <div className="flex flex-col gap-2">
      <p className={LABEL}>{label}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={current === option.value}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={cn(CHOICE, "min-h-11 px-3 py-2.5 text-[13px] font-semibold text-(--s-muted) aria-checked:text-(--s-ink)")}
          >
            {option.label}
          </button>
        ))}
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
