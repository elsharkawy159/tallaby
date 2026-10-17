"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { DesignSystem, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  CLASSIC_TOKENS,
  SITE_ROOT_CLASS,
  SectionRenderer,
  SiteTheme,
  storeSectionRegistry,
  type RenderContext,
} from "@workspace/store-sections/render";
import type { Device, Selection } from "./editor.store";

const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "820px", mobile: "390px" };

/** Copies the dashboard's stylesheets into the frame (Tailwind and fonts). */
function syncStyles(target: Document) {
  target.head.querySelectorAll("[data-copied-style]").forEach((node) => node.remove());
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    const copy = node.cloneNode(true) as HTMLElement;
    copy.setAttribute("data-copied-style", "");
    target.head.appendChild(copy);
  });
}

/**
 * The editor canvas (PLAN.md P4-06): the real section renderer inside an
 * iframe, so tablet/mobile widths trigger the same breakpoints as on a
 * phone. Links never navigate; a click selects the section under it.
 */
export function EditorCanvas({
  ctx,
  sections,
  header,
  footer,
  designSystem,
  defaultLocale,
  device,
  selection,
  onSelect,
}: {
  ctx: RenderContext;
  sections: SectionInstance[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  designSystem: DesignSystem;
  defaultLocale: SiteLocale;
  device: Device;
  selection: Selection;
  onSelect: (selection: Selection) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write("<!doctype html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body></body></html>");
    doc.close();
    syncStyles(doc);
    const observer = new MutationObserver(() => syncStyles(doc));
    observer.observe(document.head, { childList: true });

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a")) event.preventDefault();
      const chrome = target?.closest<HTMLElement>("[data-editor-chrome]");
      if (chrome) {
        onSelectRef.current({ target: chrome.dataset.editorChrome as "header" | "footer" });
        return;
      }
      const section = target?.closest<HTMLElement>("[data-section-id]");
      if (section?.dataset.sectionId) onSelectRef.current({ target: "page", sectionId: section.dataset.sectionId });
    };
    const onSubmit = (event: Event) => event.preventDefault();
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("submit", onSubmit, true);
    setBody(doc.body);
    return () => {
      observer.disconnect();
      doc.removeEventListener("click", onClick, true);
      doc.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.lang = ctx.locale;
    doc.documentElement.dir = ctx.dir;
  }, [ctx.locale, ctx.dir]);

  const selectedCss =
    selection?.target === "page"
      ? `[data-section-id="${CSS.escape(selection.sectionId)}"]{outline:2px solid #145163;outline-offset:-2px}`
      : selection
        ? `[data-editor-chrome="${selection.target}"]{outline:2px solid #145163;outline-offset:-2px}`
        : "";

  return (
    <div className="flex h-full justify-center overflow-auto bg-muted/40 p-3">
      <iframe
        ref={frame}
        title="canvas"
        className="h-full rounded-lg border bg-white shadow-sm transition-[width]"
        style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
      />
      {body &&
        createPortal(
          <div
            className={`${SITE_ROOT_CLASS} flex min-h-screen flex-col`}
            style={{ ...(CLASSIC_TOKENS as CSSProperties), background: "var(--sf-paper)", color: "var(--sf-ink)" }}
            dir={ctx.dir}
          >
            <SiteTheme designSystem={designSystem} />
            <style>{`[data-section-id]{cursor:pointer}[data-section-id]:hover,[data-editor-chrome]:hover{outline:1px dashed #145163;outline-offset:-1px}${selectedCss}`}</style>
            {header && (
              <div data-editor-chrome="header">
                <SectionRenderer instance={header} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              </div>
            )}
            <main className="flex-1">
              {sections.map((instance) => (
                <SectionRenderer key={instance.id} instance={instance} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              ))}
            </main>
            {footer && (
              <div data-editor-chrome="footer">
                <SectionRenderer instance={footer} registry={storeSectionRegistry} ctx={ctx} defaultLocale={defaultLocale} />
              </div>
            )}
          </div>,
          body,
        )}
    </div>
  );
}
