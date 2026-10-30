"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EllipsisVertical, Share, Smartphone, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

/** Chrome/Edge/Samsung's install event (not in the DOM typings). */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Caught as soon as this chunk loads: the browser may fire it before the footer mounts.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    listeners.forEach((notify) => notify());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((notify) => notify());
  });
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const CLASS =
  "inline-flex h-10 items-center gap-2 rounded-full border border-current/20 px-4 text-sm font-medium transition-colors hover:bg-(--sf-shelf) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)";

/**
 * The store footer's "Download application" button (`appInstall` node,
 * ROADMAP.md F-36). Installs the store website as an app with the store's
 * name and icon (`/manifest.webmanifest` on the store host): the browser's
 * install dialog where there is one (Android, desktop Chrome/Edge), else a
 * short guide (iPhone: Share › Add to Home Screen). Hidden inside the
 * installed app. Also registers the store's service worker (offline page).
 */
export function StoreAppInstallButton({ storeName }: { storeName: string }) {
  const t = useTranslations("storefront.app");
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState<"ios" | "other" | null>(null);

  useEffect(() => {
    setInstalled(isStandalone());
    const sync = () => setInstalled(isStandalone());
    listeners.add(sync);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/store-sw.js", { scope: "/" }).catch(() => {});
    }
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (deferredPrompt) {
      const event = deferredPrompt;
      deferredPrompt = null;
      await event.prompt();
      const { outcome } = await event.userChoice.catch(() => ({ outcome: "dismissed" }));
      if (outcome === "accepted") setInstalled(true);
      return;
    }
    setGuide(isIos() ? "ios" : "other");
  };

  const steps =
    guide === "ios"
      ? [
          { icon: Share, text: t("iosStep1") },
          { icon: SquarePlus, text: t("iosStep2") },
        ]
      : [
          { icon: EllipsisVertical, text: t("otherStep1") },
          { icon: SquarePlus, text: t("otherStep2") },
        ];

  return (
    <>
      <button type="button" onClick={install} className={CLASS}>
        <Smartphone className="size-4" aria-hidden />
        {t("download")}
      </button>
      <Dialog open={guide !== null} onOpenChange={(open) => !open && setGuide(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("guideTitle", { name: storeName })}</DialogTitle>
            <DialogDescription>{t("guideDescription")}</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3">
            {steps.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span>
                  <span className="font-semibold">{i + 1}. </span>
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
