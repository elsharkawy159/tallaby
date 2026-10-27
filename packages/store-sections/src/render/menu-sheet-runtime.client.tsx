"use client";

/**
 * Behaviour for the renderer's own burger sheet (`mobileMenu` without a host
 * sheet, `elements/render.tsx`): a modal `<dialog data-sf-sheet>`. Browsers
 * with invoker commands open and close it from the markup alone; this opens it
 * where they don't, closes it on a link or backdrop tap, and locks the page
 * scroll while it is open. Esc and the focus trap come with the modal dialog.
 * Delegated listeners, so menus that mount later are picked up. `doc`: a
 * preview frame's document (default: this one). Renders nothing; mounted by
 * `CarouselRuntime`, so every host that draws a site has it.
 */
import { useEffect } from "react";

export function MenuSheetRuntime({ doc }: { doc?: Document | null } = {}) {
  useEffect(() => {
    const document = doc ?? globalThis.document;
    const window = document.defaultView;
    if (!window) return;
    const html = document.documentElement;
    const invokers = "command" in window.HTMLButtonElement.prototype;
    const sheetOf = (id: string | undefined) => {
      const el = id ? document.getElementById(id) : null;
      return el instanceof window.HTMLDialogElement ? el : null;
    };
    // Locks the page scroll while a sheet is open and keeps each burger's aria-expanded in step.
    const lock = () => {
      html.style.setProperty("overflow", document.querySelector("dialog[data-sf-sheet][open]") ? "hidden" : "");
      for (const opener of document.querySelectorAll<HTMLElement>("[data-sf-menu-open]")) {
        opener.setAttribute("aria-expanded", String(Boolean(sheetOf(opener.dataset.sfMenuOpen)?.open)));
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const opener = target.closest<HTMLElement>("[data-sf-menu-open]");
      if (opener && !invokers) {
        const sheet = sheetOf(opener.dataset.sfMenuOpen);
        if (sheet && !sheet.open) sheet.showModal();
      }
      const sheet = target.closest<HTMLDialogElement>("dialog[data-sf-sheet]");
      // A tap on the backdrop targets the dialog itself, outside its box.
      const box = sheet?.getBoundingClientRect();
      const outside = !!box && target === sheet && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
      if (sheet && (outside || target.closest("a") || (!invokers && target.closest("[data-sf-menu-close]")))) sheet.close();
      window.requestAnimationFrame(lock);
    };
    const onClose = (event: Event) => {
      if ((event.target as Element | null)?.matches?.("dialog[data-sf-sheet]")) lock();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("close", onClose, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("close", onClose, true);
      html.style.removeProperty("overflow");
    };
  }, [doc]);
  return null;
}
