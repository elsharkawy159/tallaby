/** Midnight in Cairo for the day that contains `now`, as a UTC instant. */
export function cairoDayStart(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  // Cairo wall-clock time read as if it were UTC; the gap to `now` is Cairo's offset.
  const wallAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  const offsetMs = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")) - offsetMs)
}
