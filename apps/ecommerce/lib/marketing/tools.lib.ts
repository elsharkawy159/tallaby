/** Free tools under /tools/[slug]. A tool's words are under `toolPages.<slug>`, and its page in the route's map. */
export const TOOL_SLUGS = ["profit-margin-calculator"] as const;

export type ToolSlug = (typeof TOOL_SLUGS)[number];

export function isToolSlug(slug: string): slug is ToolSlug {
  return (TOOL_SLUGS as readonly string[]).includes(slug);
}
