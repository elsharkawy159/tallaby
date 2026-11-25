"use client";

import * as React from "react";
import { getImageProps } from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { heroPhoneTourSeconds, pickHeroPhoneShot, type HeroPhoneShot } from "./hero-phone.lib";
import { useInView } from "./use-demo.client";

const noSubscription = () => () => {};

/**
 * The hero phone's screen (owner, 2026-11-17): one template's phone
 * screenshot, picked at random in the browser (the page itself is rebuilt only
 * once a minute), that scrolls itself slowly to the bottom and back while the
 * phone is on screen (`.hero-phone` in marketing.css). The server and the
 * first client render draw only the grey placeholder, so hydration matches,
 * and only the picked file is ever requested.
 */
export function HeroPhoneScreen({ shots, className }: { shots: readonly HeroPhoneShot[]; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const hydrated = React.useSyncExternalStore(noSubscription, () => true, () => false);
  const [random] = React.useState(() => Math.random());
  const [loaded, setLoaded] = React.useState(false);
  const shot = hydrated ? pickHeroPhoneShot(shots, random) : null;
  // The files are already phone-sized (600 px wide): served as they are.
  const img = shot ? getImageProps({ src: shot.src, alt: "", width: shot.width, height: shot.height, unoptimized: true, loading: "eager" }).props : null;

  return (
    <div
      ref={ref}
      data-playing={inView && loaded ? "true" : undefined}
      className={cn("hero-phone relative overflow-hidden bg-[#f3f5f5] dark:bg-surface-muted", className)}
      style={shot ? ({ "--hero-phone-run": `${heroPhoneTourSeconds(shot.width, shot.height)}s` } as React.CSSProperties) : undefined}
    >
      {/* A blank store page until the shot has loaded. */}
      <div className={cn("absolute inset-0 flex flex-col gap-[5%] p-[7%] pt-[16%] transition-opacity duration-500", loaded && "opacity-0")}>
        <span className="h-[3%] w-2/5 rounded-full bg-[#e2e7e8] dark:bg-surface-muted" />
        <span className="h-[34%] rounded-xl bg-[#e2e7e8] dark:bg-surface-muted" />
        <span className="h-[3%] w-3/5 rounded-full bg-[#e2e7e8] dark:bg-surface-muted" />
        <span className="flex flex-1 gap-[6%]">
          <i className="flex-1 rounded-xl bg-[#e9edee] dark:bg-surface-muted" />
          <i className="flex-1 rounded-xl bg-[#e9edee] dark:bg-surface-muted" />
        </span>
      </div>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element -- getImageProps supplies the props; the file is served as is.
        <img
          {...img}
          alt=""
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn(
            "hero-phone__shot pointer-events-none absolute inset-x-0 top-0 block h-auto w-full max-w-none opacity-0 transition-opacity duration-700 select-none",
            loaded && "opacity-100",
          )}
        />
      )}
    </div>
  );
}
