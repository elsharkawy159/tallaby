import type { Device } from "../state/editor.store";

/**
 * One colour per edited device, so the canvas, top bar, Style tab and
 * override marks all say which device an edit goes to. Desktop is the base
 * and keeps the neutral look.
 */
export const DEVICE_TONE: Record<Device, { ring: string; strip: string; dot: string; pill: string; text: string; field: string; fieldBelow: string }> = {
  desktop: {
    ring: "",
    strip: "bg-muted/60",
    dot: "bg-muted-foreground",
    pill: "bg-background text-foreground",
    text: "text-muted-foreground",
    field: "",
    fieldBelow: "",
  },
  tablet: {
    ring: "ring-2 ring-violet-500/70",
    strip: "bg-violet-50 text-violet-900 dark:bg-violet-950/60 dark:text-violet-100",
    dot: "bg-violet-500",
    pill: "bg-violet-600 text-white",
    text: "text-violet-600 dark:text-violet-400",
    field: "border-violet-500 bg-violet-50 dark:bg-violet-950/40",
    fieldBelow: "border-dashed border-violet-400",
  },
  mobile: {
    ring: "ring-2 ring-amber-500/80",
    strip: "bg-amber-50 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100",
    dot: "bg-amber-500",
    pill: "bg-amber-500 text-white",
    text: "text-amber-600 dark:text-amber-400",
    field: "border-amber-500 bg-amber-50 dark:bg-amber-950/40",
    fieldBelow: "border-dashed border-amber-400",
  },
};
