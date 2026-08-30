/**
 * Deterministic, order-independent serialization for cache keys.
 *
 * Replaces the `JSON.stringify(filters)` pattern used throughout the
 * ecommerce actions today, which has two failure modes:
 *   1. Two calls with the same filters in a different property order miss
 *      each other's cache entry (JSON.stringify is key-order-sensitive).
 *   2. `undefined` values are serialized inconsistently by JSON.stringify
 *      depending on whether they appear in an object vs. an array.
 *
 * stableKey() recursively sorts object keys and drops `undefined` values
 * before serializing, so `{ a: 1, b: undefined }` and `{ a: 1 }` collide (by
 * design — they are the same query), and `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }`
 * always collide too.
 */
function sortValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const sorted: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    sorted[k] = sortValue(v);
  }
  return sorted;
}

/**
 * Serializes one or more cache-key arguments into a single deterministic
 * string, safe to pass into unstable_cache's keyParts array.
 */
export function stableKey(...args: readonly unknown[]): string {
  return JSON.stringify(args.map(sortValue));
}
