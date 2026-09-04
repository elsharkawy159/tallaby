export function toNumber (value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function percentChange (current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function startOfUtcDay (date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addUtcDays (date: Date, days: number): Date {
  const next = startOfUtcDay(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function formatIsoDate (date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10)
}

export function eachUtcDay (from: Date, to: Date): string[] {
  const days: string[] = []
  let cursor = startOfUtcDay(from)
  const end = startOfUtcDay(to)

  while (cursor <= end) {
    days.push(formatIsoDate(cursor))
    cursor = addUtcDays(cursor, 1)
  }

  return days
}

export function fillDailySeries (
  days: string[],
  rows: Array<{ date: string, value: number }>
): Array<{ date: string, value: number }> {
  const byDate = new Map(rows.map((row) => [row.date, row.value]))
  return days.map((date) => ({ date, value: byDate.get(date) ?? 0 }))
}

export function fillCustomerSeries (
  days: string[],
  rows: Array<{ date: string, new: number, returning: number }>
): Array<{ date: string, new: number, returning: number }> {
  const byDate = new Map(rows.map((row) => [row.date, row]))
  return days.map((date) => ({
    date,
    new: byDate.get(date)?.new ?? 0,
    returning: byDate.get(date)?.returning ?? 0
  }))
}

/**
 * Ceiling on analytics queries in flight at once, process-wide.
 *
 * The postgres-js pool deadlocks — permanently, not slowly — once noticeably
 * more queries are queued than it has connections (see packages/db's pool
 * config). A per-call batch size cannot prevent that, because several requests
 * render concurrently and each would get its own budget. This counter is
 * module-level, so it bounds the whole process no matter how many dashboards
 * are being rendered, and leaves the pool plenty of headroom for everything
 * else (Server Actions, transactions, the sidebar).
 */
const MAX_QUERIES_IN_FLIGHT = 6

let inFlight = 0
const waiting: Array<() => void> = []

async function acquireSlot (): Promise<void> {
  if (inFlight < MAX_QUERIES_IN_FLIGHT) {
    inFlight += 1
    return
  }

  await new Promise<void>((resolve) => waiting.push(resolve))
  inFlight += 1
}

function releaseSlot (): void {
  inFlight -= 1
  waiting.shift()?.()
}

/**
 * Run tasks concurrently, but never more than MAX_QUERIES_IN_FLIGHT at a time.
 *
 * Results come back positionally, like Promise.all, and the tuple typing keeps
 * each one's own row type — so a destructured result stays precisely typed
 * instead of collapsing to a union of every query's shape.
 */
export async function runLimited<
  const T extends ReadonlyArray<() => Promise<unknown>>
> (
  tasks: T
): Promise<{ -readonly [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  return await Promise.all(
    tasks.map(async (task) => {
      await acquireSlot()
      try {
        return await task()
      } finally {
        releaseSlot()
      }
    })
  ) as { -readonly [K in keyof T]: Awaited<ReturnType<T[K]>> }
}
