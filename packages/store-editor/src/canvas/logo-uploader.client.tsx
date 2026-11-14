"use client";

import type { MouseEvent } from "react";
import { ExternalLink, ImageUp } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The store logo's place in the canvas header and footer while the store has
 * no logo: a click opens the store's Brand identity settings (Website ›
 * Design › Brand) in a new tab, so the editor and its unsaved work stay where
 * they are; the editor picks the new logo up when the seller comes back
 * (store data refresh on focus). Rendered inside the canvas frame (React
 * portal): `data-editor-action` makes the canvas let the click through
 * instead of selecting, and the click never follows the logo link it sits in
 * (that used to load the dashboard inside the canvas frame).
 */
export function LogoUploader({ size, label, href }: { size: "md" | "lg"; label: string; href: string }) {
  const open = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // The frame has no reliable base URL: resolve on the dashboard origin.
    window.open(new URL(href, window.location.origin).toString(), "_blank", "noopener,noreferrer");
  };
  return (
    <button
      type="button"
      data-editor-action="upload-logo"
      onClick={open}
      title={label}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-current px-2.5 text-xs font-medium opacity-60 transition-opacity hover:opacity-100",
        size === "lg" ? "h-12 min-w-12" : "h-9 min-w-9 md:h-10",
      )}
    >
      <ImageUp className="size-4" aria-hidden />
      <span className="max-sm:sr-only">{label}</span>
      <ExternalLink className="size-3 opacity-70 max-sm:hidden rtl:-scale-x-100" aria-hidden />
    </button>
  );
}
