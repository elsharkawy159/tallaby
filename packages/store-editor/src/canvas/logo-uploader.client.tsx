"use client";

import { useRef } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { MEDIA_ACCEPT_ATTR } from "@workspace/lib/media";
import { cn } from "@workspace/ui/lib/utils";

/**
 * The store logo's place in the canvas header and footer while the store has
 * no logo: a click picks an image, which becomes the store logo. Rendered
 * inside the canvas frame (React portal); `data-editor-action` makes the
 * canvas let the click through instead of selecting.
 */
export function LogoUploader({
  size,
  label,
  uploading,
  onFile,
}: {
  size: "md" | "lg";
  label: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        data-editor-action="upload-logo"
        disabled={uploading}
        onClick={() => input.current?.click()}
        title={label}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-current px-2.5 text-xs font-medium opacity-60 transition-opacity hover:opacity-100 disabled:cursor-wait",
          size === "lg" ? "h-12 min-w-12" : "h-9 min-w-9 md:h-10",
        )}
      >
        {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
        <span className="max-sm:sr-only">{label}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={MEDIA_ACCEPT_ATTR}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </>
  );
}
