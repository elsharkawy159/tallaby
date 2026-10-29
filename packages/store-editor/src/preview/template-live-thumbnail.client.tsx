"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { TemplateDemo } from "@workspace/store-sections";
import type { TemplatePreviewView } from "../templates.dto";
import { SitePreview, type PreviewCatalog } from "./site-preview.client";

/** The thumbnail frame: a 16:10 desktop window. */
const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 800;

/** The demo store as the preview's catalog (same shape as the editor's). */
export function demoCatalog(demo: TemplateDemo | null): PreviewCatalog {
  return demo ? { products: demo.products, categories: demo.categories } : { products: [], categories: [] };
}

/**
 * A template card thumbnail (shared by the dashboard's Website › Templates
 * and admin's Change theme): the template's home page with its demo store,
 * drawn at desktop width and scaled to the card. `load` fetches the
 * template's content (each app has its own access-checked action); it runs
 * once the card scrolls into view. Needs a next-intl provider (SitePreview).
 */
export function TemplateLiveThumbnail({
  templateKey,
  load,
  fontClassName,
  fallback,
}: {
  templateKey: string;
  load: (key: string) => Promise<TemplatePreviewView | null>;
  fontClassName: string;
  fallback: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.3);
  const [state, setState] = useState<{
    key?: string;
    data: TemplatePreviewView | null;
    failed: boolean;
  }>({ data: null, failed: false });

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

  useEffect(() => {
    if (!visible) return;
    let live = true;
    void load(templateKey).then(
      (data) => live && setState({ key: templateKey, data, failed: !data }),
      () => live && setState({ key: templateKey, data: null, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [visible, load, templateKey]);

  const { data, failed } = state.key === templateKey ? state : { data: null, failed: false };
  const home = data?.pages.find((p) => p.isHome) ?? data?.pages[0];
  return (
    <div ref={box} className="relative aspect-[16/10] w-full overflow-hidden border-b bg-muted/40" aria-hidden>
      {data && home ? (
        <div
          className="pointer-events-none absolute start-0 top-0 origin-top-left rtl:origin-top-right"
          style={{
            width: THUMB_WIDTH,
            height: THUMB_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <SitePreview
            className="h-full"
            store={{
              name: data.demo?.store.name.ar ?? "",
              url: "https://example.tallaby.com",
            }}
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
