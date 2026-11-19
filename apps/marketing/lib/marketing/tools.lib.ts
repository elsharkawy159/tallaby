/** Free tools under /tools/[slug]. A tool's words are under `toolPages.<slug>`, and its page in the route's map. The footer lists the first three. */
export const TOOL_SLUGS = ["store-cost-calculator", "profit-margin-calculator"] as const;

/** The /tools hub's chips. Words are under `toolsHub.categories`. */
export const TOOL_GROUP: Record<(typeof TOOL_SLUGS)[number], "pricing" | "costs"> = {
  "store-cost-calculator": "costs",
  "profit-margin-calculator": "pricing",
};

export type ToolSlug = (typeof TOOL_SLUGS)[number];

export function isToolSlug(slug: string): slug is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(slug);
}

/**
 * Each tool's "related pages" cards (SEO_PLAN.md §13.1: a solution, a sibling
 * tool, pricing). Only real pages; titles are in `toolPages.<slug>.related`, in this order.
 */
export const TOOL_RELATED: Record<ToolSlug, readonly string[]> = {
  "store-cost-calculator": ["/tools/profit-margin-calculator", "/pricing", "/solutions/free-online-store", "/integrations/paymob"],
  "profit-margin-calculator": ["/tools/store-cost-calculator", "/pricing", "/solutions/cash-on-delivery-store"],
};
