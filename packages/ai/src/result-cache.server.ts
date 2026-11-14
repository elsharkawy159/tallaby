import { createHash } from "node:crypto"

/**
 * A short-lived, per-instance cache of model answers (docs/ai.md, cost rule
 * "never pay twice"). The same seller sending the same input to the same
 * feature within the TTL gets the stored answer: no model call, no usage row,
 * nothing counted toward the daily cap. Best effort only: a cold or different
 * serverless instance just calls the model.
 *
 * `createResultCache` makes a separate one for a feature that keeps many small
 * answers (the website translation memory), so it never pushes the shared
 * cache's entries out.
 */

type Entry = { value: unknown; expiresAt: number }

export type ResultCache = {
  read<T>(key: string, now?: number): T | undefined
  write(key: string, value: unknown, ttlMs: number, now?: number): void
  clear(): void
}

/** An LRU-by-insertion cache of at most `maxEntries`, with a TTL per entry. */
export function createResultCache(maxEntries: number): ResultCache {
  const entries = new Map<string, Entry>()
  return {
    read<T>(key: string, now = Date.now()): T | undefined {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (entry.expiresAt <= now) {
        entries.delete(key)
        return undefined
      }
      return entry.value as T
    },
    write(key: string, value: unknown, ttlMs: number, now = Date.now()): void {
      if (ttlMs <= 0) return
      entries.delete(key)
      entries.set(key, { value, expiresAt: now + ttlMs })
      // Map keeps insertion order, so the first key is the oldest.
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value as string)
    },
    clear(): void {
      entries.clear()
    },
  }
}

const MAX_ENTRIES = 200
const shared = createResultCache(MAX_ENTRIES)

/** sha256 over every part, each length-prefixed so part boundaries cannot collide. */
export function resultCacheKey(parts: ReadonlyArray<string | Uint8Array>): string {
  const hash = createHash("sha256")
  for (const part of parts) {
    const bytes = typeof part === "string" ? Buffer.from(part, "utf8") : part
    hash.update(`${bytes.length}:`)
    hash.update(bytes)
  }
  return hash.digest("hex")
}

export function readCachedResult<T>(key: string, now = Date.now()): T | undefined {
  return shared.read<T>(key, now)
}

export function writeCachedResult(key: string, value: unknown, ttlMs: number, now = Date.now()): void {
  shared.write(key, value, ttlMs, now)
}

/** Test seam. */
export function clearResultCache(): void {
  shared.clear()
}
