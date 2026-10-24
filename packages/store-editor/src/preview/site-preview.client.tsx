"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CarouselRuntime } from "@workspace/store-sections/client";
import { useTranslations } from "next-intl";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  PageStyles,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  collectCatalogQueries,
  designSystemToTokens,
  drawChrome,
  flushHeaderOnMobile,
  storeSectionRegistry,
  type ProductDetail,
  type RenderContext,
  type StoreProfile,
} from "@workspace/store-sections/render";
import { resolveCanvasCatalog } from "../lib/editor.lib";
import type { EditorCategory, EditorProduct } from "../editor.dto";

export type PreviewCatalog = { products: EditorProduct[]; categories: EditorCategory[] };
export type PreviewDevice = "desktop" | "mobile";

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
 * The render context of a read-only preview: this store's details, the
 * catalog resolved for `sections`, inert links and stand-in cart buttons.
 */
export function previewRenderContext({
  sections,
  catalog,
  locale,
  store,
  addToCartLabel,
  product,
}: {
  /** Every section drawn (page sections, header, footer), for the catalog queries. */
  sections: SectionInstance[];
  catalog: PreviewCatalog;
  locale: SiteLocale;
  store: StoreProfile;
  addToCartLabel: string;
  /** The product a product page shows (its template preview). */
  product?: ProductDetail;
}): RenderContext {
  const resolved = resolveCanvasCatalog(collectCatalogQueries(sections, storeSectionRegistry, { product }), catalog, locale);
  return {
    mode: "edit",
    ...(product ? { product } : {}),
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
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
    renderWishlistButton: () => <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full border border-(--sf-line) bg-(--sf-paper) text-sm">♡</span>,
    renderAddToCart: () => (
      <span className="inline-flex h-8 items-center justify-center rounded-(--sf-radius,6px) bg-(--sf-brand) px-3 text-xs font-semibold text-(--sf-brand-ink,#fff)">
        {addToCartLabel}
      </span>
    ),
  };
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
  product,
  translated = false,
}: {
  /** The store has more than one language: the header shows its language switcher (unless hidden). */
  translated?: boolean;
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
  /** Draws a product page: the product its elements show. */
  product?: ProductDetail;
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

  const ctx = useMemo(
    () =>
      previewRenderContext({
        sections: [...sections, ...(header ? [header] : []), ...(footer ? [footer] : [])],
        catalog,
        locale,
        store,
        addToCartLabel: t("addToCart"),
        product,
      }),
    [sections, header, footer, catalog, locale, store, t, product],
  );
  // The header and footer as the storefront draws them: the store's logo and the tools the seller turned on.
  const hasLogo = Boolean(store.logoUrl);
  const drawnHeader = useMemo(() => drawChrome(flushHeaderOnMobile(header), "header", { translated, hasLogo }), [header, translated, hasLogo]);
  const drawnFooter = useMemo(() => drawChrome(footer, "footer", { translated, hasLogo }), [footer, translated, hasLogo]);

  return (
    <div className={className}>
      <iframe
        ref={frame}
        title="preview"
        className="mx-auto block h-full rounded-lg border bg-white shadow-sm transition-[width]"
        style={{ width: device === "mobile" ? "390px" : "100%", maxWidth: "100%" }}
      />
      {body && <CarouselRuntime doc={body.ownerDocument} />}
      {body &&
        createPortal(
          <div
            className={`${SITE_ROOT_CLASS} ${fontClassName ?? ""} flex min-h-screen flex-col`}
            style={{
              // Inline beats SiteTheme's stylesheet, so the store's tokens are merged here.
              ...({ ...CLASSIC_TOKENS, ...designSystemToTokens(designSystem) } as CSSProperties),
              background: "var(--sf-paper)",
              color: "var(--sf-ink)",
              fontFamily: "var(--sf-font-body, var(--font-storefront)), system-ui, sans-serif",
            }}
            dir={dir}
          >
            <SiteTheme designSystem={designSystem} />
            {/* Element styles of tree sections, as on the storefront. */}
            <PageStyles sections={[drawnHeader, ...sections, drawnFooter]} mode="public" />
            <style>{`.${SITE_ROOT_CLASS} :where(h1,h2,h3,h4){font-family:var(--sf-font-heading,var(--sf-font-body,var(--font-storefront))),system-ui,sans-serif}`}</style>
            {drawnHeader && <SectionRenderer instance={drawnHeader} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />}
            <main className="flex-1">
              {sections.map((section) => (
                <SectionRenderer key={section.id} instance={section} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              ))}
            </main>
            {drawnFooter && <SectionRenderer instance={drawnFooter} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />}
          </div>,
          body,
        )}
    </div>
  );
}
