/**
 * One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md
 * §1–§2): each niche's template, and the industries whose galleries are
 * niche-only. Code only, no React here.
 *
 * A row: `niche` (a `NICHES` id), `template` (a `CODE_TEMPLATES` key, used by
 * no other row) and `edition` (the niche's pack, drawn on that template; left
 * out when the template's own content is already the niche, `native`, or the
 * pack does not exist yet). `status`:
 * - `"ready"`: the pack already draws on the template (it is in the pack's
 *   `looks`), or the row is native;
 * - `"own"`: shown with the template's own content until the niche's pack is
 *   built (owner, 2026-11-12: every niche mapped now, the rest deleted); the
 *   agent that builds the pack adds `edition` and flips the row to `"ready"`;
 * - `"pending"`: not shown yet (no row uses it since 2026-11-12).
 *
 * Rules (niche-templates.test.ts): a template in at most one row, a niche in
 * one row, every edition in `EDITIONS` and, when ready, drawn on its
 * template; every niche of a switched industry has a ready row and every
 * template of a switched industry is in a row (Tallaby Classic excepted).
 */
import { CLASSIC_KEY } from "../classic";
import { NICHES, getNiche } from "./niches";

export type NicheTemplateStatus = "ready" | "own" | "pending";

export type NicheTemplate = {
  /** A `NICHES` id. */
  niche: string;
  /** A `CODE_TEMPLATES` key. */
  template: string;
  /** The niche's pack (its niche id), drawn on `template`. Absent: native, or no pack yet. */
  edition?: string;
  status: NicheTemplateStatus;
};

/** Every niche (plan §2): wave 1, then waves 2–13 (2026-11-12). One row per line; a row gets its `edition` and "ready" when its pack is built. */
export const NICHE_TEMPLATES: readonly NicheTemplate[] = [
  // ── fashion ──
  { niche: "dresses", template: "fashion-luxe", edition: "dresses", status: "ready" },
  { niche: "lingerie-sleepwear", template: "vella", edition: "lingerie-sleepwear", status: "ready" },
  { niche: "tshirts", template: "streetwear", edition: "tshirts", status: "ready" },
  { niche: "menswear", template: "zay", edition: "menswear", status: "ready" },
  { niche: "pants-jeans", template: "fashion-bold", edition: "pants-jeans", status: "ready" },
  { niche: "sportswear", template: "sports-luxe", edition: "sportswear", status: "ready" },
  { niche: "modest-wear", template: "sitara", status: "ready" }, // native, then a new pack
  { niche: "kidswear", template: "fashion-warm", status: "own" }, // new pack
  // ── shoes & bags ──
  { niche: "handbags", template: "shanta", edition: "handbags", status: "ready" },
  { niche: "womens-shoes", template: "kasr", edition: "womens-shoes", status: "ready" },
  { niche: "mens-shoes", template: "ghorza", edition: "mens-shoes", status: "ready" },
  { niche: "slippers-clogs", template: "tasfya", edition: "slippers-clogs", status: "ready" },
  { niche: "sneakers", template: "sports-bold", edition: "sneakers", status: "ready" },
  { niche: "backpacks-travel", template: "safar", status: "own" }, // new pack
  // ── accessories (industry "jewelry") ──
  { niche: "gold-jewelry", template: "jewelry-luxe", edition: "gold-jewelry", status: "ready" },
  { niche: "glasses", template: "karat", edition: "glasses", status: "ready" },
  { niche: "watches", template: "saat", edition: "watches", status: "ready" },
  { niche: "fashion-jewelry", template: "zahra", edition: "fashion-jewelry", status: "ready" },
  { niche: "hair-accessories", template: "kholkhal", edition: "hair-accessories", status: "ready" },
  { niche: "belts-wallets", template: "jewelry-warm", edition: "belts-wallets", status: "ready" },
  { niche: "silver-jewelry", template: "fadda", status: "ready" }, // native, then a new pack
  // ── mobile accessories ──
  { niche: "phone-cases", template: "volt", edition: "phone-cases", status: "ready" },
  { niche: "chargers-cables", template: "kabl", edition: "chargers-cables", status: "ready" },
  { niche: "earbuds", template: "wasla", status: "own" }, // new pack
  // ── electronics ──
  { niche: "pc-gaming", template: "arena", edition: "pc-gaming", status: "ready" },
  { niche: "lighting-smart-home", template: "zaki", edition: "lighting-smart-home", status: "ready" },
  { niche: "mobiles", template: "techhub", status: "own" }, // new pack
  { niche: "audio", template: "electronics-luxe", status: "own" }, // new pack
  { niche: "wearables", template: "saa", status: "ready" }, // native, then a new pack
  { niche: "small-appliances", template: "shasha", status: "own" }, // new pack
  // ── beauty (wave 2) ──
  { niche: "skincare", template: "pure", status: "own" },
  { niche: "makeup", template: "beauty-bold", status: "own" },
  { niche: "perfumes", template: "perfumes-bold", status: "own" },
  { niche: "haircare", template: "botanica", status: "own" },
  { niche: "mens-grooming", template: "barber", status: "own" },
  // ── home (wave 3) ──
  { niche: "furniture", template: "furniture-luxe", status: "own" },
  { niche: "bedding-textiles", template: "mafrash", status: "own" },
  { niche: "decor", template: "rokn", status: "own" },
  { niche: "plants-garden", template: "zarea", status: "own" },
  { niche: "home-organisation", template: "tanzim", status: "own" }, // a kitchen template
  // ── kitchen (wave 4) ──
  { niche: "cookware", template: "matbakh", status: "own" },
  { niche: "tableware", template: "sufra", status: "own" },
  { niche: "coffee-gear", template: "qahwa", status: "own" },
  { niche: "kitchen-appliances", template: "beity", status: "own" },
  // ── food (wave 5) ──
  { niche: "grocery", template: "souq", status: "own" },
  { niche: "fresh-produce", template: "khodar", status: "own" },
  { niche: "meat-poultry", template: "lahma", status: "own" },
  { niche: "bakery", template: "loaf", status: "own" },
  { niche: "spices-herbs", template: "atara", status: "own" },
  { niche: "fast-food", template: "sizzle", status: "own" },
  // ── sweets (wave 6) ──
  { niche: "oriental-sweets", template: "halawa", status: "own" },
  { niche: "chocolate-cakes", template: "roast", status: "own" }, // a food template
  { niche: "coffee-beans", template: "bunn", status: "own" },
  { niche: "dates-nuts", template: "grocery-luxe", status: "own" }, // a food template
  // ── kids (wave 7) ──
  { niche: "toys", template: "farha", status: "own" },
  { niche: "baby-essentials", template: "bambino", status: "own" },
  { niche: "kids-gifts", template: "hadaya", status: "own" },
  { niche: "school-supplies", template: "kids-bold", status: "own" },
  // ── sports (wave 8) ──
  { niche: "gym-fitness", template: "core", status: "own" },
  { niche: "football", template: "koora", status: "own" },
  { niche: "running", template: "stride", status: "own" },
  { niche: "cycling", template: "darraga", status: "own" },
  { niche: "outdoor-camping", template: "basecamp", status: "own" },
  { niche: "yoga", template: "yoga", status: "own" },
  // ── health (wave 9; the industry had no template: beauty's) ──
  { niche: "vitamins-supplements", template: "nada", status: "own" },
  { niche: "pharmacy-care", template: "ward", status: "own" },
  { niche: "medical-devices", template: "beauty-luxe", status: "own" },
  // ── pets (wave 10; the industry had no template: food's, kids' and sports') ──
  { niche: "pet-food", template: "grocery-warm", status: "own" },
  { niche: "pet-accessories", template: "kids-warm", status: "own" },
  { niche: "fish-birds", template: "sabaha", status: "own" },
  // ── auto (wave 11) ──
  { niche: "car-accessories", template: "garage", status: "own" },
  { niche: "car-care", template: "garagy", status: "own" },
  { niche: "tyres-batteries", template: "tyre", status: "own" },
  { niche: "motorcycle", template: "moto", status: "own" },
  { niche: "car-interior", template: "zeina", status: "own" },
  { niche: "ev-charging", template: "kahraba", status: "own" },
  // ── handmade (wave 12) ──
  { niche: "handmade-gifts", template: "gifts-warm", status: "own" },
  { niche: "ceramics", template: "fokhar", status: "own" },
  { niche: "candles-soap", template: "gifts-luxe", status: "own" },
  { niche: "crochet-embroidery", template: "tawla", status: "own" }, // a home template
  // ── books & stationery (wave 13) ──
  { niche: "books", template: "hekaya", status: "own" },
  { niche: "stationery", template: "doodle", status: "own" }, // a kids template
  { niche: "kids-books", template: "kids-luxe", status: "own" }, // a kids template
];

/**
 * Industries (`STORE_INDUSTRIES` ids) whose galleries are niche-only: one card
 * per niche. Add one only when `isIndustrySwitchable` says so; the switch
 * also deletes the industry's templates that are in no row (plan §2).
 */
export const SWITCHED_INDUSTRIES: ReadonlySet<string> = new Set<string>([
  // Accessories, 2026-11-12: lulu, mahr and jewelry-bold deleted.
  "jewelry",
  // Every other industry, 2026-11-12 (owner: map all niches now, delete the rest): 32 templates deleted.
  "fashion",
  "shoes-bags",
  "mobile-accessories",
  "electronics",
  "beauty",
  "home",
  "kitchen",
  "food",
  "sweets",
  "kids",
  "sports",
  "health",
  "pets",
  "auto",
  "handmade",
  "books",
]);

/** A row a gallery shows: its pack drawn (or native), or the template's own content until the pack is built. */
const isReady = (row: NicheTemplate) => row.status === "ready" || row.status === "own";

/** A niche's row, or undefined. */
export function nicheTemplateFor(nicheId: string | null | undefined, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  return nicheId ? rows.find((row) => row.niche === nicheId) : undefined;
}

/** The row a template serves, or undefined. */
export function nicheOfTemplate(templateKey: string | null | undefined, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  return templateKey ? rows.find((row) => row.template === templateKey) : undefined;
}

/** A niche's row when it can be shown (`"ready"` or `"own"`). */
export function readyNicheTemplate(nicheId: string | null | undefined, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  const row = nicheTemplateFor(nicheId, rows);
  return row && isReady(row) ? row : undefined;
}

/** Can the industry switch to niche-only? Every niche of it in `NICHES` has a ready row (an industry with no niche cannot). */
export function isIndustrySwitchable(industryId: string, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): boolean {
  const niches = NICHES.filter((niche) => niche.industry === industryId);
  return niches.length > 0 && niches.every((niche) => readyNicheTemplate(niche.id, rows) !== undefined);
}

/** Is the industry's gallery niche-only? */
export function isIndustrySwitched(industryId: string | null | undefined, switched: ReadonlySet<string> = SWITCHED_INDUSTRIES): boolean {
  return !!industryId && switched.has(industryId);
}

/** A switched industry's ready rows, in `NICHES` order (its gallery cards); empty for an unswitched one. */
export function switchedNicheTemplates(industryId: string | null | undefined, switched: ReadonlySet<string> = SWITCHED_INDUSTRIES, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate[] {
  if (!isIndustrySwitched(industryId, switched)) return [];
  return NICHES.filter((niche) => niche.industry === industryId).flatMap((niche) => readyNicheTemplate(niche.id, rows) ?? []);
}

/** The ready row a template serves in a switched industry (its niche card), else undefined. */
export function switchedNicheCard(templateKey: string, switched: ReadonlySet<string> = SWITCHED_INDUSTRIES, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  const row = nicheOfTemplate(templateKey, rows);
  return row && isReady(row) && isIndustrySwitched(getNiche(row.niche)?.industry, switched) ? row : undefined;
}

/**
 * A template a niche-only gallery leaves out: its own industry is switched
 * and it serves no ready row there (Tallaby Classic never). Deleted from code
 * with the switch; until then, galleries hide it.
 */
export function isRetiredTemplate(template: { key: string; category: string }, switched: ReadonlySet<string> = SWITCHED_INDUSTRIES, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): boolean {
  if (template.key === CLASSIC_KEY || !isIndustrySwitched(template.category, switched)) return false;
  return switchedNicheCard(template.key, switched, rows) === undefined;
}

/** A niche's looks (best first) with its ready niche template moved to the front when it is among them. */
export function nicheTemplateFirst(nicheId: string | null | undefined, looks: readonly string[], rows: readonly NicheTemplate[] = NICHE_TEMPLATES): string[] {
  const lead = readyNicheTemplate(nicheId, rows)?.template;
  return lead && looks.includes(lead) ? [lead, ...looks.filter((look) => look !== lead)] : [...looks];
}
