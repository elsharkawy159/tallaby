/**
 * The seller's low-stock alert (ROADMAP.md F-34, 0122): when the product's
 * "Show a low-stock alert" box is ticked and its real stock is at or below
 * the threshold, the store shows "Only N left". Never a made-up number.
 */

export const LOW_STOCK_THRESHOLD_DEFAULT = 5;
export const LOW_STOCK_THRESHOLD_MIN = 1;
export const LOW_STOCK_THRESHOLD_MAX = 99;

/** A product's saved setting; a null threshold means the default. */
export type LowStockSetting = { show: boolean; threshold: number | null | undefined };

export function lowStockThreshold(threshold: number | null | undefined): number {
  if (typeof threshold !== "number" || !Number.isInteger(threshold)) return LOW_STOCK_THRESHOLD_DEFAULT;
  return Math.min(LOW_STOCK_THRESHOLD_MAX, Math.max(LOW_STOCK_THRESHOLD_MIN, threshold));
}

/** How many are left to show, or null for no alert (off, sold out, or plenty in stock). */
export function lowStockLeft(stock: number, setting: LowStockSetting | null | undefined): number | null {
  if (!setting?.show || !Number.isFinite(stock)) return null;
  const left = Math.floor(stock);
  return left > 0 && left <= lowStockThreshold(setting.threshold) ? left : null;
}

/** The builder element that places the alert on the product page (F-34d). */
export const STOCK_BADGE_TYPE = "productStockBadge";

/**
 * Set on the stock element's props (still and host hook) when the page has
 * its own badge element: the stock line then leaves the alert out.
 */
export const STOCK_ALERT_ELSEWHERE_PROP = "lowStockAlertElsewhere";

type TreeNode ={ type: string; children?: readonly TreeNode[] | null };

/**
 * The page holds the seller's own low-stock badge element (any device,
 * shown or hidden): the alert is then drawn there only, and the stock
 * element stops showing it, so it is never said twice. Pages without one
 * keep the automatic placement inside the stock element.
 */
export function pageHasStockBadge(sections: readonly { componentTree?: readonly TreeNode[] | null }[] | null | undefined): boolean {
  const has = (nodes: readonly TreeNode[] | null | undefined): boolean => (nodes ?? []).some((node) => node.type === STOCK_BADGE_TYPE || has(node.children));
  return (sections ?? []).some((section) => has(section.componentTree));
}

/**
 * The badge line in the store's language, with Arabic counting (قطعة واحدة،
 * قطعتين، 3 قطع، 11 قطعة). The storefront's interactive badge has the same
 * wording in apps/ecommerce messages (`storeProduct.lowStockAlert`).
 */
export function lowStockAlertText(left: number, locale: "ar" | "en"): string {
  if (locale === "en") return `Only ${left} left, order before it's gone`;
  const pieces = left === 1 ? "قطعة واحدة" : left === 2 ? "قطعتين" : left <= 10 ? `${left} قطع` : `${left} قطعة`;
  return `فاضل ${pieces} بس — اطلب قبل ما يخلص`;
}
