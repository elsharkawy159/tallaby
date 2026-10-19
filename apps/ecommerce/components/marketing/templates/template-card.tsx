import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { BrowserBar } from "@/components/marketing/site/browser-frame";
import type { StoreLook } from "@/lib/marketing/templates.data";
import { MiniStore } from "./store-preview";

/** A template preview in a browser frame, with a hover overlay. */
export function TemplateFrame({
  look,
  url,
  overlay,
  className,
}: {
  look: StoreLook;
  url?: string;
  overlay?: React.ReactNode;
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
      <MiniStore look={look} />
      {overlay ? (
        <div className="absolute inset-x-0 top-[30px] bottom-0 grid place-items-center bg-teal-900/60 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
