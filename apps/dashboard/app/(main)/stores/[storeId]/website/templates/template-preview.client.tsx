"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, Monitor, RotateCcw, Smartphone, Sparkles } from "lucide-react";
import type { SiteLocale, TemplateDemo } from "@workspace/store-sections";
import { DEMO_PRODUCT } from "@workspace/store-sections/render";
import { templateDemoProduct } from "@workspace/store-sections/demo-product";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { SitePreview, type PreviewCatalog, type PreviewDevice } from "../_components/site-preview.client";
import { templatePreview } from "./templates.server";
import type { TemplateCardView, TemplatePreviewView } from "./templates.dto";

type Localized = { ar?: string; en?: string };

const EMPTY_CATALOG: PreviewCatalog = { products: [], categories: [] };

/** Loaded previews by store and template, shared by the cards and the dialog. */
const PREVIEWS = new Map<string, Promise<TemplatePreviewView | null>>();

function loadPreview(storeId: string, key: string): Promise<TemplatePreviewView | null> {
  const id = `${storeId}:${key}`;
  let pending = PREVIEWS.get(id);
  if (!pending) {
    pending = templatePreview(storeId, key).then((result) => (result.success ? result.data : null));
    // A failed load is retried next time.
    void pending.then((data) => data ?? PREVIEWS.delete(id));
    PREVIEWS.set(id, pending);
  }
  return pending;
}

/** A template's pages and look; `failed` when it could not be loaded. */
function useTemplatePreview(storeId: string, key: string | undefined, enabled = true) {
  const [state, setState] = useState<{ key?: string; data: TemplatePreviewView | null; failed: boolean }>({ data: null, failed: false });
  useEffect(() => {
    if (!key || !enabled) return;
    let live = true;
    void loadPreview(storeId, key).then((data) => live && setState({ key, data, failed: !data }));
    return () => {
      live = false;
    };
  }, [storeId, key, enabled]);
  return state.key === key ? state : { data: null, failed: false };
}

/** The demo store as the preview's catalog (same shape as the editor's). */
function demoCatalog(demo: TemplateDemo | null): PreviewCatalog {
  return demo ? { products: demo.products, categories: demo.categories } : EMPTY_CATALOG;
}

/**
 * Website › Templates preview (storefront templates, 2026-10-19): every page
 * of the template, rendered live with its demo store (a fashion house for
 * Atelier) so the seller sees it as designed, in Arabic or English, on a
 * desktop or a phone. "Use template" hands back to the gallery's confirm.
 */
export function TemplatePreview({
  storeId,
  template,
  current,
  disabled,
  uiLocale,
  fontClassName,
  onUse,
  onOpenChange,
}: {
  storeId: string;
  template: TemplateCardView | null;
  current: boolean;
  disabled: boolean;
  uiLocale: string;
  fontClassName: string;
  onUse: (template: TemplateCardView) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("websiteTemplates");
  const [pageSlug, setPageSlug] = useState<string | null>(null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [locale, setLocale] = useState<SiteLocale>("ar");
  const { data: preview, failed } = useTemplatePreview(storeId, template?.key);

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
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-2rem)] max-w-[min(1320px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1320px,calc(100vw-2rem))]">
        {template && (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 pe-12">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{text(template.name)}</DialogTitle>
                <DialogDescription className="truncate text-xs">{demo ? t("preview.demoNote", { store: text(demo.store.name) }) : text(template.description)}</DialogDescription>
              </div>
              <Button type="button" disabled={disabled} onClick={() => onUse(template)}>
                {current ? <RotateCcw /> : <Sparkles />}
                {current ? t("reapply") : t("use")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
              <div role="tablist" aria-label={t("preview.pages")} className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                {(preview?.pages ?? []).map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    role="tab"
                    aria-selected={page?.slug === p.slug}
                    onClick={() => setPageSlug(p.slug)}
                    className={cn(
                      "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
                      page?.slug === p.slug ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {pageName(p)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {(["ar", "en"] as const).map((l) => (
                  <Button key={l} type="button" variant={locale === l ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setLocale(l)} aria-pressed={locale === l}>
                    {l.toUpperCase()}
                  </Button>
                ))}
                <Button type="button" variant={device === "desktop" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("desktop")} aria-label={t("preview.desktop")} aria-pressed={device === "desktop"}>
                  <Monitor className="size-3.5" />
                </Button>
                <Button type="button" variant={device === "mobile" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setDevice("mobile")} aria-label={t("preview.mobile")} aria-pressed={device === "mobile"}>
                  <Smartphone className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-muted/30 p-2">
              {preview && page ? (
                <SitePreview
                  key={`${template.key}:${page.slug}`}
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
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {failed ? t("preview.failed") : <LoaderCircle className="size-5 animate-spin" aria-label={t("preview.loading")} />}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A page tab in the preview's language when the card lists the page in both (code templates). */
function demoPageName(template: TemplateCardView, page: { slug: string }, locale: SiteLocale): string | null {
  return template.pageNames?.[page.slug]?.[locale] ?? null;
}

/** The thumbnail frame: a 16:10 desktop window. */
const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 800;

/**
 * A card thumbnail: the template's home page with its demo store, drawn at
 * desktop width and scaled to the card. Loads when the card scrolls into view.
 */
export function TemplateLiveThumbnail({
  storeId,
  template,
  fontClassName,
  fallback,
}: {
  storeId: string;
  template: TemplateCardView;
  fontClassName: string;
  fallback: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.3);
  const { data, failed } = useTemplatePreview(storeId, template.key, visible);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setVisible(true), { rootMargin: "200px" });
    const ro = new ResizeObserver(() => setScale(el.clientWidth / THUMB_WIDTH));
    io.observe(el);
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  const home = data?.pages.find((p) => p.isHome) ?? data?.pages[0];
  return (
    <div ref={box} className="relative aspect-[16/10] w-full overflow-hidden border-b bg-muted/40" aria-hidden>
      {data && home ? (
        <div className="pointer-events-none absolute start-0 top-0 origin-top-left rtl:origin-top-right" style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, transform: `scale(${scale})` }}>
          <SitePreview
            className="h-full"
            store={{ name: data.demo?.store.name.ar ?? "", url: "https://example.tallaby.com" }}
            catalog={demoCatalog(data.demo)}
            sections={home.sections.slice(0, 3)}
            header={data.header}
            footer={null}
            designSystem={data.designSystem}
            locale="ar"
            fontClassName={fontClassName}
          />
        </div>
      ) : failed ? (
        fallback
      ) : (
        <div className="flex h-full items-center justify-center">
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
