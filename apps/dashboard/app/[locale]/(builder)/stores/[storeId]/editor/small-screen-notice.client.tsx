"use client";

import { useState, useSyncExternalStore } from "react";
import { Monitor, X } from "lucide-react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "tallaby:editor-small-screen-notice:dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage blocked: show the notice again next time.
    return false;
  }
}

const subscribe = () => () => {};

/**
 * A thin notice above the editor on phones only (`md:hidden`): editing is easier
 * on a bigger screen, but the seller can keep working. It never covers the
 * editor's controls: the editor shrinks under it (see `SmallScreenNoticeFrame`).
 * Dismissed once per browser (localStorage, best effort).
 */
export function SmallScreenNoticeFrame({ children }: { children: React.ReactNode }) {
  const t = useTranslations("editorSmallScreen");
  // Server and first paint: hidden, so a seller who dismissed it never sees a flash.
  const storedDismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const [dismissedNow, setDismissedNow] = useState(false);
  const show = !storedDismissed && !dismissedNow;

  const dismiss = () => {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage blocked: hidden for this visit only.
    }
  };

  return (
    <div className="max-md:flex max-md:h-dvh max-md:flex-col">
      {show && (
        <div
          role="status"
          className="flex shrink-0 items-center gap-2 border-b border-border bg-muted px-3 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] text-xs text-muted-foreground md:hidden"
        >
          <Monitor className="size-4 shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 leading-snug">{t("message")}</p>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("dismiss")}
            className="-me-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {/* On phones the editor fills what's left under the notice instead of the whole screen. */}
      <div className="max-md:min-h-0 max-md:flex-1 max-md:[&_.store-editor-chrome]:h-full">{children}</div>
    </div>
  );
}
