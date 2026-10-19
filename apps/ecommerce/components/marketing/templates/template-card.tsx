import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import type { StoreLook } from "@/lib/marketing/templates.data";
import { MiniStore } from "./store-preview";

/**
 * A template preview in a browser frame, with a hover overlay. Hand-made
 * previews draw a `look`; templates from the database without one show their
 * `image` (thumbnail_url).
 */
export function TemplateFrame({
  look,
  image,
  url,
  overlay,
  badge,
  className,
}: {
  look?: StoreLook | null;
  image?: string | null;
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
      {look ? (
        <MiniStore look={look} />
      ) : image ? (
        // Admin-provided thumbnail on any https host, so a plain img instead of next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="block aspect-[4/3] w-full object-cover object-top" />
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

/** "Coming soon" pill for previews that are not installable yet. */
export function SoonBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-teal-900 shadow-sm">{children}</span>;
}
