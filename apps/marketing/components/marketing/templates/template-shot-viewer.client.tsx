"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { TEMPLATE_PREVIEW_MOBILE_MEDIA, type PreviewShot } from "@workspace/store-sections/template-preview";
import { BrowserBar } from "@/components/marketing/site/browser-frame";

type Device = "desktop" | "mobile";

/** The desktop frame's width: the 1400 px container less its gutters and the stage padding, at most 1200 px. */
const DESKTOP_SIZES = "(min-width: 1081px) min(1200px, calc(100vw - 144px)), calc(100vw - 56px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(TEMPLATE_PREVIEW_MOBILE_MEDIA);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on the screens that get the phone shot; false on the server. */
function usePhoneScreen(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(TEMPLATE_PREVIEW_MOBILE_MEDIA).matches,
    () => false,
  );
}

/**
 * The template page's big preview (2026-11-16, after themes.shopify.com): the
 * full home page screenshot in a tall frame the visitor scrolls, with a
 * desktop / phone switch over the same shots as the gallery card.
 *
 * Until the visitor picks, phones see the phone shot and wider screens the
 * desktop one through `<picture>`, so each device downloads only its own file;
 * the desktop shot has a `600w, 1200w` srcset when the 1200 px file exists.
 * Picking the other device loads that shot on demand.
 */
export function TemplateShotViewer({ name, shot, host }: { name: string; shot: PreviewShot; host: string }) {
  const t = useTranslations("templates.detail");
  const phoneScreen = usePhoneScreen();
  const [choice, setChoice] = React.useState<Device | null>(null);
  const device: Device = choice ?? (phoneScreen && shot.mobile ? "mobile" : "desktop");
  const desktopSrcSet = shot.large ? `${shot.src} ${shot.width}w, ${shot.large.src} ${shot.large.width}w` : undefined;
  const region = t("shotRegion", { name });

  const scrollBox = "block w-full overflow-y-auto overscroll-contain bg-white outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-teal-500";

  return (
    <div className="rounded-card border border-line bg-[#eef3f4] shadow-[0_30px_70px_rgba(13,55,67,0.1)]">
      {shot.mobile ? (
        <div className="flex justify-center px-3.5 pt-3.5 min-[901px]:pt-5">
          <div role="group" aria-label={t("device")} className="flex rounded-full bg-white p-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            {(["desktop", "mobile"] as const).map((d) => {
              const Icon = d === "desktop" ? Monitor : Smartphone;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={device === d}
                  onClick={() => setChoice(d)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-teal-500 focus-visible:outline-none",
                    device === d ? "bg-teal-900 text-white" : "text-ink-600 hover:text-teal-900",
                  )}
                >
                  <Icon className="size-[15px]" aria-hidden />
                  {t(d)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid place-items-center p-3.5 min-[901px]:p-7">
        {device === "mobile" && shot.mobile ? (
          <div className="w-full max-w-[390px] overflow-hidden rounded-[36px] border-[10px] border-[#0b0f10] bg-white shadow-raise">
            {/* A scrollable region: keyboard users scroll it once it has focus. */}
            <div tabIndex={0} role="region" aria-label={region} className={cn(scrollBox, "h-[min(78vh,780px)]")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- stored WebP shot, served as is */}
              <img src={shot.mobile.src} width={shot.mobile.width} height={shot.mobile.height} alt="" draggable={false} className="block h-auto w-full max-w-none select-none" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1200px] overflow-hidden rounded-xl bg-white shadow-raise">
            <BrowserBar url={host} />
            <div tabIndex={0} role="region" aria-label={region} className={cn(scrollBox, "h-[min(78vh,880px)]")}>
              <picture>
                {/* Before a pick, phones get the phone shot only. */}
                {choice === null && shot.mobile ? <source media={TEMPLATE_PREVIEW_MOBILE_MEDIA} srcSet={shot.mobile.src} width={shot.mobile.width} height={shot.mobile.height} /> : null}
                {/* Stored WebP shots with their own srcset, served as is. */}
                <img
                  src={shot.src}
                  srcSet={desktopSrcSet}
                  sizes={desktopSrcSet ? DESKTOP_SIZES : undefined}
                  width={shot.width}
                  height={shot.height}
                  alt=""
                  fetchPriority="high"
                  draggable={false}
                  className="block h-auto w-full max-w-none select-none"
                />
              </picture>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
