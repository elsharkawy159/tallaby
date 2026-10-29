import { CalendarCheck, Hourglass, Rocket, Wrench, type LucideIcon } from "lucide-react";
import type { RoadmapStatus } from "./roadmap.types";

/** Colour + icon per roadmap column (Tallaby tokens; "planned" uses sky as the info tone). */
export const STATUS_STYLE: Record<RoadmapStatus, { icon: LucideIcon; tone: string; dot: string; bar: string }> = {
  waiting: {
    icon: Hourglass,
    tone: "bg-accent-soft text-accent-ink",
    dot: "bg-accent",
    bar: "bg-accent",
  },
  planned: {
    icon: CalendarCheck,
    tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  in_progress: {
    icon: Wrench,
    tone: "bg-primary-soft text-primary-ink",
    dot: "bg-primary",
    bar: "bg-primary",
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
