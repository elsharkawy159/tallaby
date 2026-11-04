import {
  BadgePercent,
  CreditCard,
  Headset,
  Languages,
  Megaphone,
  Palette,
  Rocket,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * /compare and /compare/[slug].
 *
 * THE SWITCH: the owner hasn't decided about naming competitors. While this is
 * false, these pages are noindex, stay out of the sitemap and aren't linked
 * from the header or footer. Set it to true to make them public; nothing else
 * needs to change.
 */
export const COMPARE_PUBLIC = false;

/** Robots for these pages; undefined leaves the normal indexable default. */
export const compareRobots = () => (COMPARE_PUBLIC ? undefined : { index: false, follow: false });

/** y = yes, n = no, p = partly. An unverified fact has no value at all: its row isn't shown. */
export type CellStatus = "y" | "n" | "p";

export type CompareRowId =
  | "freePlan"
  | "monthly"
  | "salesShare"
  | "limits"
  | "signup"
  | "noCode"
  | "import"
  | "domain"
  | "templates"
  | "changeTemplate"
  | "bilingual"
  | "cod"
  | "cards"
  | "transfer"
  | "installments"
  | "carriers"
  | "riders"
  | "zones"
  | "email"
  | "feeds"
  | "apps"
  | "support"
  | "language"
  | "currencies";

export const COMPARE_GROUPS: readonly { id: string; icon: LucideIcon; rows: readonly { id: CompareRowId; tallaby: CellStatus }[] }[] = [
  {
    id: "pricing",
    icon: BadgePercent,
    rows: [
      { id: "freePlan", tallaby: "y" },
      { id: "monthly", tallaby: "y" },
      { id: "salesShare", tallaby: "y" },
      { id: "limits", tallaby: "y" },
    ],
  },
  {
    id: "setup",
    icon: Rocket,
    rows: [
      { id: "signup", tallaby: "y" },
      { id: "noCode", tallaby: "y" },
      { id: "import", tallaby: "y" },
      { id: "domain", tallaby: "y" },
    ],
  },
  {
    id: "design",
    icon: Palette,
    rows: [
      { id: "templates", tallaby: "y" },
      { id: "changeTemplate", tallaby: "y" },
      { id: "bilingual", tallaby: "y" },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    rows: [
      { id: "cod", tallaby: "y" },
      { id: "cards", tallaby: "y" },
      { id: "transfer", tallaby: "y" },
      { id: "installments", tallaby: "n" },
    ],
  },
  {
    id: "shipping",
    icon: Truck,
    rows: [
      { id: "carriers", tallaby: "y" },
      { id: "riders", tallaby: "y" },
      { id: "zones", tallaby: "y" },
    ],
  },
  {
    id: "marketing",
    icon: Megaphone,
    rows: [
      { id: "email", tallaby: "y" },
      { id: "feeds", tallaby: "y" },
      { id: "apps", tallaby: "p" },
    ],
  },
  { id: "support", icon: Headset, rows: [{ id: "support", tallaby: "y" }] },
  {
    id: "language",
    icon: Languages,
    rows: [
      { id: "language", tallaby: "y" },
      { id: "currencies", tallaby: "n" },
    ],
  },
];

export type Competitor = {
  id: string;
  category: "eg" | "global" | "other";
  featured?: boolean;
  /** Latin name for the search box and the page's chip. */
  latin: string;
  /** When these facts were last read from the source; shown on the page. */
  factsCheckedOn: string;
  /**
   * Only facts we can back up, with their text in
   * `competitors.<id>.cells.<row>`. No entry means the row isn't shown.
   */
  cells: Partial<Record<CompareRowId, CellStatus>>;
  /** Where the facts came from, for whoever reviews this entry. Never shown. */
  sources: readonly string[];
};

/**
 * Below this many facts a comparison isn't worth a page. Add an entry only
 * with sources: Salla, Zid, YouCan and ExpandCart are left out until someone
 * supplies theirs.
 */
export const MIN_VERIFIED_FACTS = 4;

export const COMPETITORS: readonly Competitor[] = [
  {
    id: "easyorders",
    category: "eg",
    featured: true,
    latin: "EasyOrders",
    factsCheckedOn: "2026-10-28",
    cells: { freePlan: "y", monthly: "y", noCode: "y", cards: "y", carriers: "y", feeds: "y", currencies: "y" },
    sources: ["MARKETING_PROJECT.md §18 reference platforms (19 Oct 2026)", "ROADMAP.md §2.2 (easyorders.eg, read 2026-10-28)"],
  },
  {
    id: "shopify",
    category: "global",
    featured: true,
    latin: "Shopify",
    factsCheckedOn: "2026-10-28",
    cells: { monthly: "y", salesShare: "p", email: "y", feeds: "y", apps: "y", currencies: "y" },
    sources: ["MARKETING_PROJECT.md §18 reference platforms (19 Oct 2026)", "ROADMAP.md §2.2 (shopify.com/pricing, read 2026-10-28)"],
  },
  {
    id: "woocommerce",
    category: "global",
    latin: "WooCommerce",
    factsCheckedOn: "2026-10-19",
    cells: { freePlan: "p", noCode: "p", domain: "p", apps: "y" },
    sources: ["MARKETING_PROJECT.md §18 reference platforms (19 Oct 2026)"],
  },
  {
    id: "facebook-only",
    category: "other",
    featured: true,
    latin: "Facebook page only",
    factsCheckedOn: "2026-11-04",
    cells: { freePlan: "y", domain: "n", templates: "n", carriers: "n", zones: "n" },
    sources: ["What a plain Facebook page is: no store of its own. Not a competitor's published claim."],
  },
];

export const compareSlug = (competitor: Pick<Competitor, "id">) => `tallaby-vs-${competitor.id}`;

/** Competitors with enough verified facts to deserve a page. */
export function publishableCompetitors(list: readonly Competitor[] = COMPETITORS): Competitor[] {
  return list.filter((competitor) => Object.keys(competitor.cells).length >= MIN_VERIFIED_FACTS);
}

export function findCompetitorBySlug(slug: string): Competitor | undefined {
  return publishableCompetitors().find((competitor) => compareSlug(competitor) === slug);
}

/** The table for one competitor: only rows with a verified value, and no empty groups. */
export function comparisonTable(competitor: Pick<Competitor, "cells">) {
  return COMPARE_GROUPS.map((group) => ({
    id: group.id,
    icon: group.icon,
    rows: group.rows.flatMap((row) => {
      const status = competitor.cells[row.id];
      return status ? [{ id: row.id, tallaby: row.tallaby, competitor: status }] : [];
    }),
  })).filter((group) => group.rows.length > 0);
}

export const COMPARE_CATEGORIES = ["eg", "global", "other"] as const;
