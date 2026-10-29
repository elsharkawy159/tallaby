"use client";

import * as React from "react";
import Image from "next/image";
import { isOptimizableStoreImage } from "@/lib/store-site/optimize-image.lib";
import { templateFrameSrc, type CoverPick } from "@/lib/marketing/templates.lib";
import { TemplateLiveThumb } from "./template-live-thumb.client";

/**
 * A home page category card's picture: one of `covers` picked at random on
 * each visit, so a category isn't always shown by the same template. Picked
 * after mount (the page is prerendered); a pulse box until then. The
 * template's thumbnail, else its home page drawn live, 4:5 so more of the page shows.
 */
export function TemplateRandomCover({ covers, locale }: { covers: CoverPick[]; locale: string }) {
  const [pick, setPick] = React.useState<CoverPick | null>(null);

  React.useEffect(() => {
    setPick(covers[Math.floor(Math.random() * covers.length)] ?? null);
  }, [covers]);

  if (!pick) return <div className="aspect-[4/5] w-full animate-pulse bg-neutral-100" />;
  return pick.thumbnailUrl ? (
    <div className="relative aspect-[4/5] w-full">
      <Image
        src={pick.thumbnailUrl}
        alt=""
        fill
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
        unoptimized={!isOptimizableStoreImage(pick.thumbnailUrl)}
        className="object-cover object-top"
      />
    </div>
  ) : (
    // 1280 × 1600: a desktop-wide frame as tall as the 4:5 box.
    <TemplateLiveThumb src={templateFrameSrc(locale, pick.id, undefined, true)} className="aspect-[4/5]" frameHeight={1600} />
  );
}
