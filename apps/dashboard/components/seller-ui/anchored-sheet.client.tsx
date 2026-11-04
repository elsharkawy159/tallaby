"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@/lib/utils";

/**
 * A panel anchored to its button on desktop and a bottom sheet with a scrim at
 * 600px and below (globals.css, `data-sui-sheet`). The notification panel and
 * the store switcher use it.
 */
export function AnchoredSheet({
  open,
  onOpenChange,
  trigger,
  side = "bottom",
  align = "end",
  label,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** One element; it receives the toggle behaviour. */
  trigger: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** The panel's accessible name. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {open && (
        // Radix closes the panel on any press outside it, this scrim included.
        <div aria-hidden className="fixed inset-0 z-[60] bg-(--s-scrim) min-[601px]:hidden" />
      )}
      <PopoverContent
        data-sui-sheet
        aria-label={label}
        side={side}
        align={align}
        sideOffset={10}
        collisionPadding={12}
        className={cn(
          "z-[75] flex flex-col overflow-hidden rounded-[24px] border border-(--s-field) bg-(--s-surface) p-0 text-(--s-body)",
          className,
        )}
      >
        <div aria-hidden className="flex justify-center pt-2 min-[601px]:hidden">
          <i className="h-[5px] w-10 rounded-full bg-(--s-field-strong)" />
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}
