import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/** Browser chrome (traffic-light dots + optional address bar) around a preview. */
export function BrowserBar({ url, size = "md", className }: { url?: React.ReactNode; size?: "sm" | "md"; className?: string }) {
  return (
    <div
      dir="ltr"
      className={cn(
        "flex items-center gap-2.5 border-b border-neutral-200 dark:border-line bg-[#f1f3f2] dark:bg-surface-muted px-3",
        size === "sm" ? "h-[26px]" : "h-[30px]",
        className,
      )}
    >
      <div className="flex gap-[5px]">
        {[0, 1, 2].map((i) => (
          <i key={i} className={cn("block rounded-full bg-[#d6dad9] dark:bg-tint-strong", size === "sm" ? "size-[7px]" : "size-2")} />
        ))}
      </div>
      {url ? (
        <div className="mx-auto flex h-5 max-w-[300px] flex-1 items-center justify-center gap-1.5 rounded-md bg-surface font-latin text-[11px] font-medium text-neutral-600 dark:text-ink-700">
          <Lock className="size-[11px] text-success" aria-hidden />
          {url}
        </div>
      ) : null}
    </div>
  );
}
