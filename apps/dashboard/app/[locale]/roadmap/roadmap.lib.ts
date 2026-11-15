import type {
  RoadmapCategory,
  RoadmapItem,
  RoadmapSort,
  RoadmapStatus,
  RoadmapTab,
} from "./roadmap.types";

/** Votes are open until a card is being built; built and launched cards keep their count. */
export function canVote(status: RoadmapStatus): boolean {
  return status === "waiting" || status === "planned";
}

/** How far along the four roadmap stages a card is (0 = waiting … 3 = launched). */
export function statusStep(status: RoadmapStatus): number {
  return ["waiting", "planned", "in_progress", "launched"].indexOf(status);
}

/** Lower-cases and strips Arabic diacritics, tatweel and alef/yaa/taa marbuta variants. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export type RoadmapFilters = {
  query: string;
  category: RoadmapCategory | "";
  tab: RoadmapTab;
  sort: RoadmapSort;
};

export function filterItems(items: RoadmapItem[], filters: RoadmapFilters): RoadmapItem[] {
  const q = normalizeText(filters.query);
  const out = items.filter(
    (item) =>
      (!filters.category || item.category === filters.category) &&
      (filters.tab !== "mine" || item.mine) &&
      (filters.tab !== "voted" || item.voted) &&
      (!q || normalizeText(`${item.title} ${item.description}`).includes(q)),
  );
  return out.sort((a, b) =>
    filters.sort === "votes"
      ? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );
}

/** Existing cards whose titles share a meaningful word with a draft title (duplicate hint). */
export function findSimilar(items: RoadmapItem[], draftTitle: string, limit = 3): RoadmapItem[] {
  const words = normalizeText(draftTitle)
    .split(" ")
    .filter((w) => w.length > 2);
  if (!words.length) return [];
  return items
    .map((item) => {
      const title = normalizeText(item.title);
      return { item, score: words.filter((w) => title.includes(w)).length };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.item.votes - a.item.votes)
    .slice(0, limit)
    .map((m) => m.item);
}

/** Applies a vote toggle to the local list (optimistic update). */
export function applyVote(items: RoadmapItem[], id: string): RoadmapItem[] {
  return items.map((item) =>
    item.id === id && canVote(item.status)
      ? { ...item, voted: !item.voted, votes: Math.max(0, item.votes + (item.voted ? -1 : 1)) }
      : item,
  );
}
