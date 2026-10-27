/**
 * The `countdown` element (Claude Design premium set, 2026-10-27): days,
 * hours, minutes and seconds left until the date the seller sets
 * (`props.endsAt`, ISO). The server draws the time left when it renders; the
 * host's `MotionRuntime` ticks it every second. Publicly a countdown with no
 * date, or one whose date has passed, draws nothing, so a store never shows a
 * fake or expired deadline; the editor shows zeros and the date field.
 */
import type { ReactNode } from "react";
import { sectionText } from "../core/copy";
import type { RenderContext } from "../core/types";

export const COUNTDOWN_UNITS = ["days", "hours", "minutes", "seconds"] as const;
export type CountdownUnit = (typeof COUNTDOWN_UNITS)[number];
export type CountdownParts = Record<CountdownUnit, number> & { done: boolean };

/** The end time of untrusted props, or null (missing or not a date). */
export function countdownEnd(value: unknown): number | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** Time left until `endsAt` (ISO); zeros and `done` once it has passed; null without a date. */
export function countdownParts(endsAt: unknown, now: number): CountdownParts | null {
  const end = countdownEnd(endsAt);
  if (end === null) return null;
  const left = Math.max(0, Math.floor((end - now) / 1000));
  return {
    days: Math.min(999, Math.floor(left / 86_400)),
    hours: Math.floor((left % 86_400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: left === 0,
  };
}

/** Two digits, in Arabic digits on Arabic pages (the same on server and client). */
export function formatCountdownUnit(value: number, locale: "ar" | "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { minimumIntegerDigits: 2, useGrouping: false }).format(value);
}

const UNIT_COPY = { days: "countdownDays", hours: "countdownHours", minutes: "countdownMinutes", seconds: "countdownSeconds" } as const;

export function CountdownElement({ attrs, props, ctx }: { attrs: Record<string, string>; props: Record<string, unknown>; ctx: RenderContext }): ReactNode {
  const endsAt = typeof props.endsAt === "string" ? props.endsAt : "";
  const parts = countdownParts(endsAt, Date.now());
  if (ctx.mode !== "edit" && (!parts || parts.done)) return null;
  const shown = parts ?? { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  // The caption ("Ends in") belongs to the countdown, so it hides with it.
  const caption = typeof props.caption === "string" ? props.caption.slice(0, 80).trim() : "";
  return (
    <div {...attrs} className="flex min-w-0 flex-col gap-2">
      {caption && <span className="text-sm font-semibold opacity-75">{caption}</span>}
      <div
        role="timer"
        aria-label={caption || sectionText("countdownLabel", ctx.locale)}
        {...(parts && { "data-countdown-ends": endsAt, "data-countdown-locale": ctx.locale })}
        className="flex min-w-0 flex-row flex-wrap items-stretch gap-2 [justify-content:inherit]"
      >
      {COUNTDOWN_UNITS.map((unit, index) => (
        <span
          key={unit}
          data-countdown-unit={unit}
          style={{ ["--sf-unit" as string]: index }}
          className="inline-flex min-w-16 flex-col items-center justify-center gap-1 rounded-(--sf-radius,12px) bg-current/8 px-3 py-2.5 text-center"
        >
          <b data-countdown-value={unit} suppressHydrationWarning className="text-2xl font-bold leading-none tabular-nums md:text-3xl">
            {formatCountdownUnit(shown[unit], ctx.locale)}
          </b>
          <small className="text-[11px] font-medium leading-none opacity-75">{sectionText(UNIT_COPY[unit], ctx.locale)}</small>
        </span>
      ))}
      </div>
    </div>
  );
}
