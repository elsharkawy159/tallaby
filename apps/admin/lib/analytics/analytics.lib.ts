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
 * Run async tasks in fixed-size batches. Needed when talking to Supabase's
 * transaction pooler (:6543) — a large Promise.all stamps pgbouncer and
 * trips statement_timeout even when each query alone is fast.
 */
export async function runInBatches<T> (
  tasks: Array<() => Promise<T>>,
  batchSize = 3
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((task) => task()))
    results.push(...batchResults)
  }

  return results
}
