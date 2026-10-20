import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/**
 * A template card's picture in a browser frame, with a hover overlay: the
 * template's `image` (thumbnail_url) when it has one, else its real home page
 * drawn live from `liveSrc`.
 */
export function TemplateFrame({
  image,
  liveSrc,
  url,
  overlay,
  badge,
  className,
}: {
  image?: string | null;
  liveSrc?: string | null;
  url?: string;
  overlay?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1.5 group-hover:shadow-lift",
        className,
      )}
    >
      <BrowserBar url={url} />
      {image ? (
        // Admin-provided thumbnail on any https host, so a plain img instead of next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="block aspect-[4/3] w-full object-cover object-top" />
      ) : liveSrc ? (
        <TemplateLiveThumb src={liveSrc} />
      ) : (
        <div className="aspect-[4/3] bg-neutral-100" />
      )}
      {badge ? <div className="pointer-events-none absolute end-3 top-[42px]">{badge}</div> : null}
      {overlay ? (
        <div className="absolute inset-x-0 top-[30px] bottom-0 grid place-items-center bg-teal-900/60 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
