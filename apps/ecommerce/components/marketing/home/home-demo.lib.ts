/** Pure maths behind the home page's product demos. */

/** An SVG line and its filled area for a small sparkline. */
export function sparkPaths(values: readonly number[], width = 200, height = 34): { line: string; area: string } {
  if (!values.length) return { line: "", area: "" };
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => `${(i * stepX).toFixed(1)},${(height - 3 - ((v - min) / range) * (height - 6)).toFixed(1)}`);
  const line = `M${points.join("L")}`;
  return { line, area: `${line}L${width},${height}L0,${height}Z` };
}

/** `i` wrapped into 0..n-1. */
export function wrapIndex(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0;
}

/** How far card `i` sits from the carousel position, by the short way round. */
export function carouselOffset(i: number, position: number, n: number): number {
  if (n <= 0) return 0;
  const raw = ((i - position) % n + n) % n;
  return raw > n / 2 ? raw - n : raw;
}

/** A card's scale, opacity and stacking for its distance from the centre. */
export function carouselCardStyle(offset: number): { scale: number; opacity: number; zIndex: number } {
  const a = Math.abs(offset);
  const opacity = a > 2.5 ? 0 : a > 2 ? (2.5 - a) * 0.9 : a > 1 ? 0.85 - (a - 1) * 0.4 : 1 - a * 0.15;
  return { scale: 1 - 0.13 * Math.min(a, 3), opacity, zIndex: 10 - Math.round(a) };
}

export type DemoOrder = {
  id: number;
  customer: string;
  product: string;
  /** A key of the demo's time labels. */
  when: string;
  total: number;
  status: "pending" | "shipped" | "delivered";
};

/** The dashboard's order list after `added` demo orders came in, newest first. */
export function ordersAfter(
  base: readonly DemoOrder[],
  added: number,
  makeOrder: (index: number) => { customer: string; product: string; total: number },
  firstId: number,
  shown = 5,
): DemoOrder[] {
  const fresh: DemoOrder[] = [];
  for (let i = Math.max(0, added - shown); i < added; i++) {
    fresh.unshift({ ...makeOrder(i), id: firstId + i, when: i === added - 1 ? "justNow" : "minuteAgo", status: "pending" });
  }
  return [...fresh, ...base].slice(0, shown);
}
