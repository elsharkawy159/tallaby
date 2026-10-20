"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  PageStyles,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  designSystemToTokens,
  storeSectionRegistry,
  type RenderContext,
} from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";

/** Virtual desktop width the section is laid out at before scaling down. */
const PREVIEW_WIDTH = 1280;

/**
 * A section rendered as a scaled, non-interactive thumbnail (P4B-06, like
 * the reference `section-ui-preview.tsx`): the real renderer with the
 * store's theme and products, laid out at desktop width, no iframe. `inert`
 * keeps its links and fields out of the tab order and away from clicks.
 */
export function SectionThumbnail({
  instance,
  ctx,
  designSystem,
  defaultLocale,
  fontClassName,
  maxHeight = 240,
  className,
}: {
  instance: SectionInstance;
  ctx: RenderContext;
  designSystem: DesignSystem;
  defaultLocale: SiteLocale;
  fontClassName: string;
  /** Taller sections are cut at this height (px). */
  maxHeight?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ scale: number; height: number } | null>(null);

  useEffect(() => {
    const box = container.current;
    const inner = content.current;
    if (!box || !inner) return;
    const sync = () => {
      const scale = box.clientWidth / PREVIEW_WIDTH;
      if (scale > 0) setSize({ scale, height: Math.min(maxHeight, Math.ceil(inner.offsetHeight * scale)) });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(box);
    observer.observe(inner);
    sync();
    return () => observer.disconnect();
  }, [maxHeight]);

  return (
    <div
      ref={container}
      className={cn("relative w-full overflow-hidden bg-white", className)}
      style={{ height: size?.height ?? 96 }}
      aria-hidden
    >
      <div
        ref={content}
        inert
        className={`${SITE_ROOT_CLASS} ${fontClassName} pointer-events-none absolute top-0 left-0 origin-top-left select-none`}
        dir={ctx.dir}
        style={{
          width: PREVIEW_WIDTH,
          transform: `scale(${size?.scale ?? 0})`,
          // Inline beats SiteTheme's stylesheet, so the store's tokens are merged here.
          ...({ ...CLASSIC_TOKENS, ...designSystemToTokens(designSystem) } as CSSProperties),
          background: "var(--sf-paper)",
          color: "var(--sf-ink)",
          fontFamily: "var(--sf-font-body, var(--font-storefront)), system-ui, sans-serif",
        }}
      >
        <SiteTheme designSystem={designSystem} />
        {/* Element styles (tree sections), drawn like the canvas draws them. */}
        <PageStyles sections={[instance]} mode={ctx.mode === "edit" ? "edit" : "public"} />
        <SectionRenderer instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
      </div>
    </div>
  );
}
