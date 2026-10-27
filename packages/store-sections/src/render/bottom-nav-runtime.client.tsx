"use client";

/**
 * Behaviour for the phone bottom navigation (`render/bottom-nav.tsx`): marks
 * the item for the current page (`aria-current="page"`, which the bar styles)
 * and hides the bar on checkout and on the product page (its parts carry
 * `data-sf-product-page`; the storefront's docked buy bar `data-sf-buy-bar`). An item matches when its link's own path is
 * the page's path, or a parent of it (not for Home), so it works with every
 * host's link rewriting (store hosts, template preview). Re-checked on client
 * navigation (DOM changes, back/forward). `doc`: a preview frame's document
 * (default: this one). Renders nothing; mounted by `CarouselRuntime`, so
 * every host that draws a site has it.
 */
import { useEffect } from "react";
import { BOTTOM_NAV_ATTR } from "./bottom-nav";

const trim = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export function BottomNavRuntime({ doc }: { doc?: Document | null } = {}) {
  useEffect(() => {
    const document = doc ?? globalThis.document;
    const window = document.defaultView;
    if (!window) return;
    let last = "";
    const sync = () => {
      const navs = document.querySelectorAll<HTMLElement>(`[${BOTTOM_NAV_ATTR}]`);
      const path = trim(window.location.pathname);
      // The product page (its parts are marked by the renderer) and its docked buy bar take the bottom edge (docs/template-rules.md §4.2).
      const productPage = Boolean(document.querySelector("[data-sf-product-page],[data-sf-buy-bar]"));
      const key = `${path}|${navs.length}|${productPage}`;
      if (!navs.length || key === last) return;
      last = key;
      for (const nav of navs) {
        nav.hidden = productPage || /\/checkout(\/|$)/.test(path);
        const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[href]")];
        const paths = links.map((a) => trim(new URL(a.href, window.location.href).pathname));
        // The longest match wins, so Home (a parent of every page) only marks itself.
        let best = -1;
        paths.forEach((p, i) => {
          const exact = p === path;
          const parent = i > 0 && path.startsWith(`${p}/`);
          if ((exact || parent) && (best < 0 || p.length > paths[best]!.length)) best = i;
        });
        links.forEach((a, i) => (i === best ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
      }
    };
    sync();
    const observer = new window.MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", sync);
    };
  }, [doc]);
  return null;
}
