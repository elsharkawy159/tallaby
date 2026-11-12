import * as React from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { isOptimizableStoreImage } from "@/lib/store-site/optimize-image.lib";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import { TemplateLiveThumb } from "./template-live-thumb.client";
import { TemplateThumb } from "./template-thumb";
import type { PreviewShot } from "@workspace/store-sections/template-preview";

/**
 * A template card's picture with a hover overlay: the template's `image`
 * (thumbnail_url, a 7:6 card that draws its own desktop window and phone)
 * when it has one, else its real home page drawn live from `liveSrc` in a
 * browser frame. With `shot` (owner, 2026-11-12) the card is tall (3:4): the
 * home page screenshot, scrolled on hover, or the page drawn live in the same
 * frame when `shot` is null.
 */
export function TemplateFrame({
  image,
  liveSrc,
  shot,
  url,
  overlay,
  badge,
  className,
}: {
  image?: string | null;
  liveSrc?: string | null;
  /** Tall mode: the template's card screenshot (null: drawn live in the tall frame). Left out: the 4:3 window as before. */
  shot?: PreviewShot | null;
  url?: string;
  overlay?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  if (shot !== undefined) {
    return (
      <div
        className={cn(
          "tpl-shot-trigger relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1.5 group-hover:shadow-lift",
          className,
        )}
      >
        <TemplateThumb shot={shot} liveSrc={liveSrc ?? ""} sizes="(min-width: 901px) 300px, (min-width: 601px) 45vw, 80vw" />
        {badge ? <div className="pointer-events-none absolute end-3 top-3">{badge}</div> : null}
      </div>
    );
  }
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
