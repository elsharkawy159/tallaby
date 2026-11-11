"use client";

/**
 * Loader for the `beforeAfter` and `hotspot` behaviour (mount once, beside
 * `CarouselRuntime`, wherever a store site is drawn). It ships only this
 * check: the behaviour itself (`photo-tools.client.ts`) is a separate chunk,
 * fetched the first time the page holds one of the two elements, so every
 * other page pays nothing for it. `doc`: a preview frame's document (default:
 * this one). Renders nothing.
 */
import { useEffect } from "react";
import { watchMounts } from "./watch-mounts.client";

export function PhotoToolsRuntime({ doc }: { doc?: Document | null } = {}) {
  useEffect(() => {
    const document = doc ?? globalThis.document;
    if (!document?.defaultView) return;
    let stop: (() => void) | undefined;
    let asked = false;
    let gone = false;
    // Elements that mount later (client navigation, a preview's new page) are found too.
    const stopWatching = watchMounts(document, () => {
      if (asked || !document.querySelector("[data-sf-ba],[data-sf-hotspot]")) return;
      asked = true;
      void import("./photo-tools.client").then((tools) => {
        if (!gone) stop = tools.startPhotoTools(document);
      });
    });
    return () => {
      gone = true;
      stopWatching();
      stop?.();
    };
  }, [doc]);
  return null;
}
