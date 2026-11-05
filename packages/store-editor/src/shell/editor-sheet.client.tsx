"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";

/** How far (px) the handle must travel to count as a pull rather than a tap. */
const PULL = 24;

/**
 * A bottom sheet on small screens (Claude Design "Seller Editor v3 (Mobile)"): its
 * handle pulls up to the tall size, pulls down to shrink or close, and a tap switches.
 * It opens at its normal height every time. `modal={false}` leaves the canvas usable.
 */
export function EditorSheet({
  open,
  onOpenChange,
  modal = true,
  height,
  className,
  style,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal?: boolean;
  /** Class for the normal height. */
  height: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [full, setFull] = useState(false);
  // Adjusted during render (React's pattern for state that follows a prop).
  if (!open && full) setFull(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      <SheetContent
        side="bottom"
        data-editor-sheet=""
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={modal ? undefined : (event) => event.preventDefault()}
        className={cn(
          "gap-0 rounded-t-[24px] border-0 bg-(--s-surface) p-0 shadow-[0_-12px_40px_rgb(13_55_67/0.2)] transition-[height] duration-300 ease-out motion-reduce:transition-none",
          full ? "h-[94dvh]" : height,
          className,
        )}
        style={style}
      >
        <SheetGrab full={full} onFullChange={setFull} onClose={() => onOpenChange(false)} />
        {children}
      </SheetContent>
    </Sheet>
  );
}

function SheetGrab({ full, onFullChange, onClose }: { full: boolean; onFullChange: (full: boolean) => void; onClose: () => void }) {
  const t = useTranslations("storeEditor");
  const startY = useRef<number | null>(null);

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    startY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const up = (event: PointerEvent<HTMLButtonElement>) => {
    if (startY.current === null) return;
    const moved = event.clientY - startY.current;
    startY.current = null;
    if (moved <= -PULL) onFullChange(true);
    else if (moved >= PULL) {
      if (full) onFullChange(false);
      else onClose();
    } else onFullChange(!full);
  };
  // A pointer was handled above; this is Enter or Space.
  const click = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) onFullChange(!full);
  };

  return (
    <button
      type="button"
      aria-label={t(full ? "sheetShrink" : "sheetGrow")}
      aria-expanded={full}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => {
        startY.current = null;
      }}
      onClick={click}
      className="flex h-6 w-full shrink-0 cursor-grab touch-none justify-center pt-2 active:cursor-grabbing"
    >
      <span aria-hidden className="h-[5px] w-10 rounded-full bg-(--s-field-strong)" />
    </button>
  );
}
