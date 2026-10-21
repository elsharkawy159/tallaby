import * as React from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { isOptimizableStoreImage } from "@/lib/store-site/optimize-image.lib";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/**
 * A template card's picture with a hover overlay: the template's `image`
 * (thumbnail_url, a 7:6 card that draws its own desktop window and phone)
 * when it has one, else its real home page drawn live from `liveSrc` in a
 * browser frame.
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
      {image ? null : <BrowserBar url={url} />}
      {image ? (
        <div className="relative aspect-[7/6] w-full">
          {/* Admin-provided thumbnail: resized when its host is allowed, else served as is. */}
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            unoptimized={!isOptimizableStoreImage(image)}
            className="object-cover object-top"
          />
        </div>
      ) : liveSrc ? (
        <TemplateLiveThumb src={liveSrc} />
      ) : (
        <div className="aspect-[4/3] bg-neutral-100" />
      )}
      {badge ? <div className={cn("pointer-events-none absolute end-3", image ? "top-3" : "top-[42px]")}>{badge}</div> : null}
      {overlay ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 grid place-items-center bg-teal-900/60 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100",
            image ? "top-0" : "top-[30px]",
          )}
        >
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
