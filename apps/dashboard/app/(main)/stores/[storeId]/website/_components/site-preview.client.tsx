"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  collectCatalogQueries,
  storeSectionRegistry,
  type ClassicPart,
  type RenderContext,
  type StoreProfile,
} from "@workspace/store-sections/render";
import { resolveCanvasCatalog } from "@/app/(builder)/stores/[storeId]/editor/editor.lib";
import type { EditorCategory, EditorProduct } from "@/app/(builder)/stores/[storeId]/editor/editor.data";

export type PreviewCatalog = { products: EditorProduct[]; categories: EditorCategory[] };
export type PreviewDevice = "desktop" | "mobile";

const instance = (id: string, sectionId: string, props: Record<string, unknown>): SectionInstance => ({ id, sectionId, version: 1, props });

/**
 * Tallaby Classic parts are drawn by the storefront's own components, which
 * the dashboard does not have; the preview shows the closest library
 * sections filled with this store's data instead.
 */
function classicStandIns(store: StoreProfile): Record<ClassicPart, SectionInstance> {
  return {
    "classic-header": instance("preview-classic-header", "store-header", { showLogo: true, showName: true, showNav: true, announcement: "" }),
    "classic-hero": instance("preview-classic-hero", "hero-banner", {
      title: store.name,
      subtitle: store.description ?? "",
      image: store.bannerUrl ?? "",
      ctaLabel: "",
      align: "start",
      height: "md",
    }),
    "classic-categories": instance("preview-classic-categories", "category-grid", { title: "", style: "circles", limit: 8 }),
    "classic-catalog": instance("preview-classic-catalog", "product-grid", { title: "", source: "newest", limit: 8, columns: "4", showViewAll: false }),
    "classic-footer": instance("preview-classic-footer", "store-footer", { about: "", showPolicies: true, showSocial: true, showContact: true }),
  };
}

/** Copies the dashboard's stylesheets (Tailwind, fonts) into the frame. */
function syncStyles(target: Document) {
  target.head.querySelectorAll("[data-copied-style]").forEach((node) => node.remove());
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    const copy = node.cloneNode(true) as HTMLElement;
    copy.setAttribute("data-copied-style", "");
    target.head.appendChild(copy);
  });
}

/**
 * A read-only store page preview for the Website pages (design system,
 * templates): the real section renderer with this store's products, inside
 * an iframe so the phone width hits the same breakpoints as a phone. Links
 * and forms are inert.
 */
export function SitePreview({
  store,
  catalog,
  sections,
  header,
  footer,
  designSystem,
  locale,
  defaultLocale = "ar",
  device = "desktop",
  fontClassName,
  className,
}: {
  store: StoreProfile;
  catalog: PreviewCatalog;
  sections: SectionInstance[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  locale: SiteLocale;
  defaultLocale?: SiteLocale;
  device?: PreviewDevice;
  /** Class names defining the store font variables (store-fonts.ts). */
  fontClassName?: string;
  className?: string;
}) {
  const t = useTranslations("storeEditor.canvas");
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write("<!doctype html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body></body></html>");
    doc.close();
    syncStyles(doc);
    const observer = new MutationObserver(() => syncStyles(doc));
    observer.observe(document.head, { childList: true });
    const block = (event: Event) => {
      if (event.type === "submit" || (event.target as HTMLElement | null)?.closest("a")) event.preventDefault();
    };
    doc.addEventListener("click", block, true);
    doc.addEventListener("submit", block, true);
    setBody(doc.body);
    return () => {
      observer.disconnect();
      doc.removeEventListener("click", block, true);
      doc.removeEventListener("submit", block, true);
    };
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.lang = locale;
    doc.documentElement.dir = dir;
  }, [locale, dir]);

  const standIns = useMemo(() => classicStandIns(store), [store]);

  const ctx = useMemo<RenderContext>(() => {
    const all = [...sections, ...(header ? [header] : []), ...(footer ? [footer] : []), ...Object.values(standIns)];
    const resolved = resolveCanvasCatalog(collectCatalogQueries(all, storeSectionRegistry), catalog, locale);
    const base: RenderContext = {
      mode: "edit",
      locale,
      dir,
      store,
      pages: [],
      catalog: resolved,
      Link: ({ href, className: linkClass, children }) => (
        <a href={href} className={linkClass}>
          {children}
        </a>
      ),
      imageUrl: (src) =>
        src && /^(https?:)?\/\//.test(src) ? src : src ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${src}` : null,
      formatPrice: (amount) =>
        new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(amount),
      renderCartButton: () => <span className="inline-flex h-9 items-center rounded-full border border-(--sf-line) px-3 text-sm">🛒</span>,
      renderAddToCart: () => (
        <span className="inline-flex h-8 items-center justify-center rounded-(--sf-radius,6px) bg-(--sf-brand) px-3 text-xs font-semibold text-(--sf-brand-ink,#fff)">
          {t("addToCart")}
        </span>
      ),
    };
    return {
      ...base,
      renderClassic: (part) => <SectionRenderer instance={standIns[part]} registry={storeSectionRegistry} ctx={base} defaultLocale={defaultLocale} />,
    };
  }, [sections, header, footer, standIns, catalog, locale, dir, store, defaultLocale, t]);

  return (
    <div className={className}>
      <iframe
        ref={frame}
        title="preview"
        className="mx-auto block h-full rounded-lg border bg-white shadow-sm transition-[width]"
        style={{ width: device === "mobile" ? "390px" : "100%", maxWidth: "100%" }}
      />
      {body &&
        createPortal(
          <div
            className={`${SITE_ROOT_CLASS} ${fontClassName ?? ""} flex min-h-screen flex-col`}
            style={{
              ...(CLASSIC_TOKENS as CSSProperties),
              background: "var(--sf-paper)",
              color: "var(--sf-ink)",
              fontFamily: "var(--sf-font-body, var(--font-storefront)), system-ui, sans-serif",
            }}
            dir={dir}
          >
            <SiteTheme designSystem={designSystem} />
            <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
            {header && <SectionRenderer instance={header} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />}
            <main className="flex-1">
              {sections.map((section) => (
                <SectionRenderer key={section.id} instance={section} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              ))}
            </main>
            {footer && <SectionRenderer instance={footer} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />}
          </div>,
          body,
        )}
    </div>
  );
}
