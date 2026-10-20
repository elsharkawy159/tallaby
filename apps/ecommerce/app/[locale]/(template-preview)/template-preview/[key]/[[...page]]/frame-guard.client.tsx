"use client";

import { useEffect } from "react";

/**
 * Links and forms in a template preview go nowhere: it is a picture of a store, not a store.
 * Opened in its own tab (the template page's Live demo), links to the preview's own pages
 * (`allowPrefix`) still work so the template can be browsed.
 */
export function FrameGuard({ allowPrefix }: { allowPrefix: string }) {
  useEffect(() => {
    const topLevel = window.self === window.top;
    const block = (event: Event) => {
      if (event.type === "submit") return event.preventDefault();
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link) return;
      if (topLevel && isPreviewLink(link, allowPrefix)) return;
      event.preventDefault();
    };
    document.addEventListener("click", block, true);
    document.addEventListener("submit", block, true);
    return () => {
      document.removeEventListener("click", block, true);
      document.removeEventListener("submit", block, true);
    };
  }, [allowPrefix]);
  return null;
}

function isPreviewLink(link: HTMLAnchorElement, prefix: string): boolean {
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
}
