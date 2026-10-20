"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { LayoutTemplate } from "lucide-react";
import type { DesignSystem, SectionInstance } from "@workspace/store-sections";
import { CLASSIC_TOKENS, PageStyles, SITE_ROOT_CLASS, SectionRenderer, SiteTheme, designSystemToTokens, storeSectionRegistry } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { previewRenderContext } from "../../preview/site-preview.client";
import type { TemplatePreviewView } from "../../templates.dto";
import type { EditorAdapter } from "../../adapter.types";
import { useEditorAdapter } from "../../adapter.client";
import type { TemplatePreviewHost } from "./template-preview-dialog.client";

/** Virtual desktop width the page is laid out at before scaling down. */
const PREVIEW_WIDTH = 1280;

/** Template content by store and key, kept for the editor session (templates are read-only here). */
const previews = new Map<string, Promise<TemplatePreviewView | null>>();

/**
 * One template's content, loaded once per editor session and shared by the
 * cards and the preview dialogs. A failed load is forgotten so it can be
 * tried again.
 */
export function loadTemplatePreview(templates: EditorAdapter["templates"], storeId: string, key: string): Promise<TemplatePreviewView | null> {
  if (!templates) return Promise.resolve(null);
  const cacheKey = `${storeId}:${key}`;
  let pending = previews.get(cacheKey);
  if (!pending) {
    pending = templates.preview(key).then(
      (result) => (result.success ? result.data : null),
      () => null,
    );
    previews.set(cacheKey, pending);
    void pending.then((data) => data || previews.delete(cacheKey));
  }
  return pending;
}

/**
 * A template page drawn as a scaled, non-interactive thumbnail (like the
 * section thumbnails): the page's header and sections at desktop width,
 * cut to the card. It loads when the card scrolls into view. `look`
 * replaces the template's colours, fonts and header with the store's own
 * (page designs only copy sections).
 */
export function TemplatePageThumbnail({
  templateKey,
  page,
  host,
  look,
  className,
}: {
  templateKey: string;
  page: { slug: string; isHome: boolean };
  host: TemplatePreviewHost;
  look?: { designSystem: DesignSystem; header: SectionInstance | null };
  className?: string;
}) {
  const templatesApi = useEditorAdapter().templates;
  const t = useTranslations("storeEditor.canvas");
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<TemplatePreviewView | null | undefined>(undefined);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const box = container.current;
    if (!box) return;
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: "200px" });
    observer.observe(box);
    const resize = new ResizeObserver(() => setScale(box.clientWidth / PREVIEW_WIDTH));
    resize.observe(box);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    void loadTemplatePreview(templatesApi, host.storeId, templateKey).then((data) => live && setPreview(data));
    return () => {
      live = false;
    };
  }, [visible, templatesApi, host.storeId, templateKey]);

  const templatePage = preview?.pages.find((p) => p.slug === page.slug && p.isHome === page.isHome);
  const designSystem = look?.designSystem ?? preview?.designSystem;
  const header = look ? look.header : (preview?.header ?? null);
  const locale = host.defaultLocale;
  const addToCart = t("addToCart");

  const ctx = useMemo(() => {
    if (!templatePage || !preview) return null;
    // A store with no products yet sees the template with its demo store, as in the dialog.
    const catalog = host.catalog.products.length || !preview.demo ? host.catalog : { products: preview.demo.products, categories: preview.demo.categories };
    return previewRenderContext({ sections: [...templatePage.sections, ...(header ? [header] : [])], catalog, locale, store: host.store, addToCartLabel: addToCart });
  }, [templatePage, preview, header, host.catalog, host.store, locale, addToCart]);

  return (
    <div ref={container} className={cn("relative aspect-[16/10] w-full overflow-hidden bg-muted/50", className)} aria-hidden>
      {templatePage && ctx && designSystem ? (
        <div
          inert
          className={`${SITE_ROOT_CLASS} ${host.fontClassName} pointer-events-none absolute top-0 left-0 origin-top-left select-none`}
          dir={ctx.dir}
          style={{
            width: PREVIEW_WIDTH,
            transform: `scale(${scale})`,
            // Inline beats SiteTheme's stylesheet, so the tokens are merged here.
            ...({ ...CLASSIC_TOKENS, ...designSystemToTokens(designSystem) } as CSSProperties),
            background: "var(--sf-paper)",
            color: "var(--sf-ink)",
            fontFamily: "var(--sf-font-body, var(--font-storefront)), system-ui, sans-serif",
          }}
        >
          <SiteTheme designSystem={designSystem} />
          <PageStyles sections={[header, ...templatePage.sections]} mode="public" />
          <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
          {header && <SectionRenderer instance={header} registry={storeSectionRegistry} ctx={ctx} defaultLocale={host.defaultLocale} />}
          {templatePage.sections.map((section) => (
            <SectionRenderer key={section.id} instance={section} registry={storeSectionRegistry} ctx={ctx} defaultLocale={host.defaultLocale} />
          ))}
        </div>
      ) : (
        <span className={cn("grid size-full place-items-center text-muted-foreground", preview === undefined && "animate-pulse")}>
          <LayoutTemplate className="size-6 opacity-50" />
        </span>
      )}
    </div>
  );
}
