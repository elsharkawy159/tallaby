/** Search and category filtering for the /integrations and /compare hubs. */

export type HubFilterable = {
  name: string;
  description: string;
  category: string;
  keywords?: string;
};

export function filterHubItems<T extends HubFilterable>(items: readonly T[], category: string, query: string): T[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!needle) return true;
    return `${item.name} ${item.description} ${item.keywords ?? ""}`.toLowerCase().includes(needle);
  });
}

export function hubCategoryCounts(items: readonly HubFilterable[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.category] = (counts[item.category] ?? 0) + 1;
  return counts;
}
