/**
 * The builder element that places cross-sell offers on the product page
 * (ROADMAP.md F-32d). Pages without it keep the automatic placement under the
 * buy box, so the default template and every existing store look the same.
 */

export const CROSS_SELL_TYPE = "productCrossSell";

/** Set on the buy box's props when the page has its own offers element: the buy box then leaves them out. */
export const CROSS_SELL_ELSEWHERE_PROP = "crossSellElsewhere";

type TreeNode = { type: string; children?: readonly TreeNode[] | null };

/**
 * The page holds the seller's own offers element (any device, shown or hidden):
 * offers are then drawn there only, never twice.
 */
export function pageHasCrossSell(sections: readonly { componentTree?: readonly TreeNode[] | null }[] | null | undefined): boolean {
  const has = (nodes: readonly TreeNode[] | null | undefined): boolean => (nodes ?? []).some((node) => node.type === CROSS_SELL_TYPE || has(node.children));
  return (sections ?? []).some((section) => has(section.componentTree));
}
