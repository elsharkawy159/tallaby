/**
 * Pure helpers for the manual product order inside a category (ROADMAP.md
 * F-24d). The storefront's "Featured" sort is the same rule in SQL:
 * placed products first by position, then the rest newest first.
 */

export type Positioned = { id: string; position: number | null; createdAt: string | null };

/** Placed first (position ascending), then unplaced newest first; ties by id for a stable order. */
export function compareFeatured(a: Positioned, b: Positioned): number {
  if (a.position != null && b.position != null && a.position !== b.position) return a.position - b.position;
  if (a.position != null && b.position == null) return -1;
  if (a.position == null && b.position != null) return 1;
  const time = (value: string | null) => (value ? Date.parse(value) || 0 : 0);
  const byTime = time(b.createdAt) - time(a.createdAt);
  if (byTime !== 0) return byTime;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortFeatured<T extends Positioned>(items: readonly T[]): T[] {
  return [...items].sort(compareFeatured);
}

/**
 * The rows to store for a new order. Every id must be one of the category's
 * products (`eligible`, already scoped to the seller); null when one is not,
 * so a stale or forged list writes nothing.
 */
export function positionsFor(order: readonly string[], eligible: Iterable<string>): { productId: string; position: number }[] | null {
  const allowed = new Set(eligible);
  if (new Set(order).size !== order.length) return null;
  if (!order.every((id) => allowed.has(id))) return null;
  return order.map((productId, position) => ({ productId, position }));
}

/** Moves one item to a new index (drag end, "move to top"). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}
