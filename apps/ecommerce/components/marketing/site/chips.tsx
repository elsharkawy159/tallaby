import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

/** For a link used as a chip; mark the selected one with aria-current. */
export const chipClassName =
  "flex h-10 flex-none items-center rounded-full border border-line-strong bg-white px-[18px] text-sm font-semibold whitespace-nowrap text-ink-600 transition-colors duration-150 hover:border-teal-300 hover:no-underline aria-[current=page]:border-teal-900 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white aria-pressed:border-teal-900 aria-pressed:bg-teal-900 aria-pressed:text-white aria-selected:border-teal-900 aria-selected:bg-teal-900 aria-selected:text-white";

/** A filter pill. Pressed state fills dark teal. */
export function Chip({ selected, className, ...props }: React.ComponentProps<"button"> & { selected?: boolean }) {
  return <button type="button" aria-pressed={selected} className={cn(chipClassName, className)} {...props} />;
}

/** A row of chips that scrolls sideways when it doesn't fit. */
export function ChipRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("no-scrollbar flex gap-2 overflow-x-auto p-0.5", className)} {...props} />;
}
