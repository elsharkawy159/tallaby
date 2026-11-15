import { CalendarCheck, Hourglass, Rocket, Wrench, type LucideIcon } from "lucide-react";
import type { RoadmapStatus } from "./roadmap.types";

/** Colour + icon per roadmap column (`.col.b`, `.col.a`, `.col.g`; waiting is the neutral one). */
export const STATUS_STYLE: Record<RoadmapStatus, { icon: LucideIcon; tone: string; dot: string; bar: string }> = {
  waiting: {
    icon: Hourglass,
    tone: "bg-(--s-surface) text-(--s-muted)",
    dot: "bg-(--s-subtle)",
    bar: "bg-(--s-subtle)",
  },
  planned: {
    icon: CalendarCheck,
    tone: "bg-(--s-info-soft) text-(--s-info)",
    dot: "bg-(--s-info)",
    bar: "bg-(--s-info)",
  },
  in_progress: {
    icon: Wrench,
    tone: "bg-accent-soft text-accent-ink",
    dot: "bg-accent",
    bar: "bg-accent",
  },
  launched: {
    icon: Rocket,
    tone: "bg-success-soft text-success",
    dot: "bg-success",
    bar: "bg-success",
  },
};

/** Deterministic date (Cairo time, Latin digits) so server and client render the same text. */
export function formatRoadmapDate(value: string, locale: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(date);
}
