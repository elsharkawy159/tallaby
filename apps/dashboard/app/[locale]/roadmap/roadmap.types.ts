export const ROADMAP_STATUSES = ["waiting", "planned", "in_progress", "launched"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const ROADMAP_CATEGORIES = [
  "orders",
  "payments",
  "shipping",
  "products",
  "marketing",
  "website",
  "reports",
  "other",
] as const;
export type RoadmapCategory = (typeof ROADMAP_CATEGORIES)[number];

export type RoadmapSort = "votes" | "new";
export type RoadmapTab = "all" | "mine" | "voted";
export type RoadmapView = "board" | "list";

/** One roadmap card as the page sees it (already in the viewer's language). */
export type RoadmapItem = {
  id: string;
  status: RoadmapStatus;
  category: RoadmapCategory;
  title: string;
  description: string;
  /** Primary store name of the seller who suggested it; null = Tallaby team. */
  author: string | null;
  createdAt: string;
  launchedAt: string | null;
  votes: number;
  voted: boolean;
  mine: boolean;
};

/** Who is looking: anyone may browse; only an active seller may vote or suggest. */
export type RoadmapViewer =
  | { kind: "guest" }
  | { kind: "user" } // signed in, but not an active seller
  | { kind: "seller" };

export type RoadmapActionError = "unauthorized" | "invalidInput" | "notVotable" | "rateLimited" | "generic";

export type RoadmapActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: RoadmapActionError };
