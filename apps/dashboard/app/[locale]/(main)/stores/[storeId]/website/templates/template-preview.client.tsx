"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, LoaderCircle, Monitor, RotateCcw, Smartphone, Sparkles } from "lucide-react";
import type { SiteLocale } from "@workspace/store-sections";
import { DEMO_PRODUCT } from "@workspace/store-sections/render";
import { templateDemoProduct } from "@workspace/store-sections/demo-product";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { Segmented, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@workspace/ui/lib/utils";
import { SitePreview, type PreviewDevice } from "../_components/site-preview.client";
import { TemplateLiveThumbnail as SharedTemplateLiveThumbnail, demoCatalog } from "@workspace/store-editor/preview/template-live-thumbnail.client";
import { templatePreview } from "./templates.server";
import type { TemplateCardView, TemplatePreviewView } from "./templates.dto";
import { TEMPLATE_PREVIEW_ORIGIN, templatePreviewTabUrl } from "./templates.lib";

type Localized = { ar?: string; en?: string };

/** Loaded previews by store, template and niche edition, shared by the cards and the dialog. */
const PREVIEWS = new Map<string, Promise<TemplatePreviewView | null>>();

/** A template with a niche edition, as one key: `kasr`, `kasr@dresses`. */
const previewId = (key: string, editionId?: string | null) => (editionId ? `${key}@${editionId}` : key);

function loadPreview(storeId: string, key: string, editionId?: string | null): Promise<TemplatePreviewView | null> {
  const id = `${storeId}:${previewId(key, editionId)}`;
  let pending = PREVIEWS.get(id);
  if (!pending) {
    pending = templatePreview(storeId, key, editionId ?? null).then((result) => (result.success ? result.data : null));
    // A failed load is retried next time.
    void pending.then((data) => data ?? PREVIEWS.delete(id));
    PREVIEWS.set(id, pending);
  }
  return pending;
}

/** A template's pages and look (with a niche edition when given); `failed` when it could not be loaded. */
function useTemplatePreview(storeId: string, key: string | undefined, enabled = true, editionId: string | null = null) {
  const [state, setState] = useState<{ id?: string; data: TemplatePreviewView | null; failed: boolean }>({ data: null, failed: false });
  const id = key ? previewId(key, editionId) : undefined;
  useEffect(() => {
    if (!key || !id || !enabled) return;
    let live = true;
    void loadPreview(storeId, key, editionId).then((data) => live && setState({ id, data, failed: !data }));
    return () => {
      live = false;
    };
  }, [storeId, key, id, editionId, enabled]);
  return state.id === id ? state : { data: null, failed: false };
}

/**
 * Website › Templates preview (storefront templates, 2026-10-19): every page
 * of the template, rendered live with its demo store, in Arabic or English, on
 * a desktop or a phone, with its details beside it (Claude Design `.pmod`).
 * "Use template" hands back to the gallery's confirm.
 */
export function TemplatePreview({
  storeId,
  template,
  current,
  disabled,
  uiLocale,
  fontClassName,
  categoryName,
  editionId = null,
  onUse,
  onOpenChange,
}: {
  storeId: string;
  template: TemplateCardView | null;
  current: boolean;
  disabled: boolean;
  uiLocale: string;
  fontClassName: string;
  categoryName: string;
  /** The niche edition shown (the niche tab it was opened from), or null for the template's own content. */
  editionId?: string | null;
  onUse: (template: TemplateCardView) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("websiteTemplates");
  const tw = useTranslations("sellerWebsite.templates");
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [locale, setLocale] = useState<SiteLocale>("ar");
  const { data: preview, failed } = useTemplatePreview(storeId, template?.key, true, editionId);

  const text = (value: Localized) => (uiLocale === "en" ? value.en || value.ar : value.ar || value.en) || "";
  const page = preview ? (preview.pages.find((p) => p.slug === pageSlug) ?? preview.pages.find((p) => p.isHome) ?? preview.pages[0]) : undefined;
  const demo = preview?.demo ?? null;
  const pageName = (p: { slug: string; name: string }) => (template && demoPageName(template, p, locale)) || p.name;

  return (
    <Dialog
      open={template !== null}
      onOpenChange={(open) => {
        if (!open) setPageSlug(null);
        onOpenChange(open);
      }}
    >
      {/* Full height is what the preview needs, on phones too, so it opts out of the bottom sheet. */}
      <DialogContent className="sui-no-sheet grid h-[92dvh] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[min(1320px,calc(100vw-2rem))] grid-cols-[minmax(0,1fr)_300px] grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 max-[900px]:grid-cols-1 max-[900px]:grid-rows-[minmax(0,1fr)_auto] sm:max-w-[min(1320px,calc(100vw-2rem))]">
        {template && (
          <>
            <div className="flex min-h-0 min-w-0 flex-col gap-3 bg-linear-[160deg,var(--s-fill),var(--s-surface-2)] p-4 pe-14 min-[901px]:pe-4 max-[600px]:p-2.5 max-[600px]:pe-12">
              <div className="flex flex-wrap items-center gap-2">
                <div role="tablist" aria-label={t("preview.pages")} className="flex min-w-0 flex-1 flex-wrap gap-1 max-[600px]:basis-full">
                  {(preview?.pages ?? []).map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      role="tab"
                      aria-selected={page?.slug === p.slug}
                      onClick={() => setPageSlug(p.slug)}
                      className="h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 text-xs font-semibold text-(--s-muted) transition-colors duration-150 hover:text-(--s-ink) aria-selected:bg-(--s-solid) aria-selected:text-(--s-solid-fg) max-[600px]:h-10"
                    >
                      {pageName(p)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Segmented
                    solid
                    value={locale}
                    onChange={(value) => setLocale(value)}
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
              <div className="min-h-0 flex-1">
                {preview && page ? (
                  <SitePreview
                    key={`${previewId(template.key, editionId)}:${page.slug}`}
                    className="h-full"
                    store={{
                      name: demo ? (demo.store.name[locale] ?? demo.store.name.ar ?? "") : text(template.name),
                      description: demo ? (demo.store.description[locale] ?? null) : null,
                      url: "https://example.tallaby.com",
                    }}
                    catalog={demoCatalog(demo)}
                    sections={page.sections}
                    header={preview.header}
                    footer={preview.footer}
                    designSystem={preview.designSystem}
                    locale={locale}
                    defaultLocale="ar"
                    device={device}
                    fontClassName={fontClassName}
                    product={page.kind === "product" ? (demo ? templateDemoProduct(demo, { locale }) : DEMO_PRODUCT) : undefined}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-(--s-muted)">
                    {failed ? t("preview.failed") : <LoaderCircle className="size-5 animate-spin" aria-label={t("preview.loading")} />}
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3.5 overflow-y-auto border-s border-(--s-line) p-6 max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:items-center max-[900px]:gap-2.5 max-[900px]:border-s-0 max-[900px]:border-t max-[900px]:p-3.5">
              <div className="flex min-w-0 flex-col gap-1.5 max-[900px]:flex-1">
                <Tag tone="info" className="w-max max-[900px]:hidden">
                  {categoryName}
                </Tag>
                <DialogTitle className="truncate text-xl font-bold text-(--s-ink) max-[900px]:text-base">{text(template.name)}</DialogTitle>
                <DialogDescription className="text-[13px] leading-[1.8] text-(--s-muted) max-[900px]:sr-only">{text(template.description)}</DialogDescription>
              </div>
              {template.palette.length > 0 && (
                <span aria-hidden className="flex max-[900px]:hidden">
                  {template.palette.slice(0, 4).map((color, index) => (
                    <i key={`${color}-${index}`} className={cn("size-[18px] rounded-full border-2 border-(--s-surface) shadow-[0_0_0_1px_var(--s-field)]", index > 0 && "-ms-1.5")} style={{ background: color }} />
                  ))}
                </span>
              )}
              <ul className="flex flex-col gap-2 text-[12.5px] text-(--s-muted) max-[900px]:hidden">
                {[
                  t("pagesCount", { count: template.pages.length }),
                  tw("keepsYours"),
                  tw("editLater"),
                  ...(demo ? [t("preview.demoNote", { store: text(demo.store.name) })] : []),
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-[15px] shrink-0 text-success" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2 max-[900px]:mt-0 max-[900px]:flex-row max-[900px]:flex-wrap">
                {/* The full-page storefront preview in a new tab, with the edition and page shown here (owner, 2026-11-11). */}
                <SellerButton asChild variant="outline" className="h-11 w-full max-[900px]:w-auto">
                  <a
                    href={templatePreviewTabUrl(TEMPLATE_PREVIEW_ORIGIN, locale, template.key, page, editionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("preview.newTabLabel", { name: text(template.name) })}
                  >
                    <ExternalLink aria-hidden />
                    {t("preview.newTab")}
                  </a>
                </SellerButton>
                <SellerButton className="h-12 w-full max-[900px]:h-11 max-[900px]:w-auto" disabled={disabled} onClick={() => onUse(template)}>
                  {current ? <RotateCcw aria-hidden /> : <Sparkles aria-hidden />}
                  {current ? tw("reapplyShort") : t("use")}
                </SellerButton>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeviceIcon({ icon: Icon, text }: { icon: typeof Monitor; text: string }) {
  return (
    <span className="grid place-items-center">
      <Icon aria-hidden className="size-[15px]" />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** A page tab in the preview's language when the card lists the page in both (code templates). */
function demoPageName(template: TemplateCardView, page: { slug: string }, locale: SiteLocale): string | null {
  return template.pageNames?.[page.slug]?.[locale] ?? null;
}

/** The gallery tile's window (card 1c, 3:4 since 2026-11-12): a desktop page cropped to the tile's shape, for a template with no screenshot. */
const TILE_WIDTH = 1280;
const TILE_HEIGHT = Math.round((TILE_WIDTH * 4) / 3);

/**
 * A template thumbnail: the template's home page with its demo store, loaded
 * through this page's preview cache. `tall` draws the gallery tile; without it
 * the shared 16:10 `TemplateLiveThumbnail` is used.
 */
export function TemplateLiveThumbnail({
  storeId,
  templateKey,
  editionId = null,
  fontClassName,
  fallback,
  tall = false,
}: {
  storeId: string;
  templateKey: string;
  /** A niche edition to draw the template with, or null for its own content. */
  editionId?: string | null;
  fontClassName: string;
  fallback: ReactNode;
  tall?: boolean;
}) {
  const load = useCallback((key: string) => loadPreview(storeId, key, editionId), [storeId, editionId]);
  if (tall) return <TileThumbnail storeId={storeId} templateKey={templateKey} editionId={editionId} fontClassName={fontClassName} fallback={fallback} />;
  // Keyed by the edition: the shared thumbnail loads once per mount.
  return <SharedTemplateLiveThumbnail key={previewId(templateKey, editionId)} templateKey={templateKey} load={load} fontClassName={fontClassName} fallback={fallback} />;
}

function TileThumbnail({
  storeId,
  templateKey,
  editionId,
  fontClassName,
  fallback,
}: {
  storeId: string;
  templateKey: string;
  editionId: string | null;
  fontClassName: string;
  fallback: ReactNode;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.2);
  const { data, failed } = useTemplatePreview(storeId, templateKey, visible, editionId);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const seen = new IntersectionObserver(([entry]) => entry?.isIntersecting && setVisible(true), { rootMargin: "200px" });
    const sized = new ResizeObserver(() => setScale(element.clientWidth / TILE_WIDTH));
    seen.observe(element);
    sized.observe(element);
    return () => {
      seen.disconnect();
      sized.disconnect();
    };
  }, []);

  const home = data?.pages.find((p) => p.isHome) ?? data?.pages[0];
  return (
    <span ref={box} aria-hidden className="relative block aspect-[3/4] w-full overflow-hidden bg-(--s-fill)">
      {data && home ? (
        <span className="pointer-events-none absolute start-0 top-0 block origin-top-left rtl:origin-top-right" style={{ width: TILE_WIDTH, height: TILE_HEIGHT, transform: `scale(${scale})` }}>
          <SitePreview
            className="h-full"
            store={{ name: data.demo?.store.name.ar ?? "", url: "https://example.tallaby.com" }}
            catalog={demoCatalog(data.demo)}
            sections={home.sections.slice(0, 5)}
            header={data.header}
            footer={null}
            designSystem={data.designSystem}
            locale="ar"
            fontClassName={fontClassName}
          />
        </span>
      ) : failed ? (
        fallback
      ) : (
        <span className="flex h-full items-center justify-center text-(--s-subtle)">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        </span>
      )}
    </span>
  );
}
