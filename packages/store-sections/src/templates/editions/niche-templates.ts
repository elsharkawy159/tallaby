/**
 * One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md
 * §1–§2): each niche's template, and the industries whose galleries are
 * niche-only. Code only, no React here.
 *
 * A row: `niche` (a `NICHES` id), `template` (a `CODE_TEMPLATES` key, used by
 * no other row) and `edition` (the niche's pack, drawn on that template; left
 * out when the template's own content is already the niche, `native`, or the
 * pack does not exist yet). `status` is `"ready"` when the row can be shown:
 * the pack already draws on the template (it is in the pack's `looks`) or the
 * row is native. `"pending"` rows wait for their template's conversion; the
 * agent that converts one flips its row to `"ready"`.
 *
 * Rules (niche-templates.test.ts): a template in at most one row, a niche in
 * one row, every edition in `EDITIONS` and, when ready, drawn on its
 * template; every niche of a switched industry has a ready row and every
 * template of a switched industry is in a row (Tallaby Classic excepted).
 */
import { CLASSIC_KEY } from "../classic";
import { NICHES, getNiche } from "./niches";

export type NicheTemplateStatus = "ready" | "pending";

export type NicheTemplate = {
  /** A `NICHES` id. */
  niche: string;
  /** A `CODE_TEMPLATES` key. */
  template: string;
  /** The niche's pack (its niche id), drawn on `template`. Absent: native, or no pack yet. */
  edition?: string;
  status: NicheTemplateStatus;
};

/** Wave 1 (plan §2). One row per line; flip `status` to "ready" when the template is converted. */
export const NICHE_TEMPLATES: readonly NicheTemplate[] = [
  // ── fashion ──
  { niche: "dresses", template: "fashion-luxe", edition: "dresses", status: "ready" },
  { niche: "lingerie-sleepwear", template: "vella", edition: "lingerie-sleepwear", status: "ready" },
  { niche: "tshirts", template: "streetwear", edition: "tshirts", status: "ready" },
  { niche: "menswear", template: "zay", edition: "menswear", status: "ready" },
  { niche: "pants-jeans", template: "fashion-bold", edition: "pants-jeans", status: "ready" },
  { niche: "sportswear", template: "sports-luxe", edition: "sportswear", status: "pending" },
  { niche: "modest-wear", template: "sitara", status: "ready" }, // native, then a new pack
  { niche: "kidswear", template: "fashion-warm", status: "pending" }, // new pack
  // ── shoes & bags ──
  { niche: "handbags", template: "shanta", edition: "handbags", status: "ready" },
  { niche: "womens-shoes", template: "kasr", edition: "womens-shoes", status: "ready" },
  { niche: "mens-shoes", template: "ghorza", edition: "mens-shoes", status: "ready" },
  { niche: "slippers-clogs", template: "tasfya", edition: "slippers-clogs", status: "pending" },
  { niche: "sneakers", template: "sports-bold", edition: "sneakers", status: "pending" },
  { niche: "backpacks-travel", template: "safar", status: "pending" }, // new pack
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
  { niche: "earbuds", template: "wasla", status: "pending" }, // new pack
  // ── electronics ──
  { niche: "pc-gaming", template: "arena", edition: "pc-gaming", status: "ready" },
  { niche: "lighting-smart-home", template: "zaki", edition: "lighting-smart-home", status: "ready" },
  { niche: "mobiles", template: "techhub", status: "pending" }, // new pack
  { niche: "audio", template: "electronics-luxe", status: "pending" }, // new pack
  { niche: "wearables", template: "saa", status: "ready" }, // native, then a new pack
  { niche: "small-appliances", template: "shasha", status: "pending" }, // new pack
];

/**
 * Industries (`STORE_INDUSTRIES` ids) whose galleries are niche-only: one card
 * per niche. Add one only when `isIndustrySwitchable` says so; the switch
 * also deletes the industry's templates that are in no row (plan §2).
 */
export const SWITCHED_INDUSTRIES: ReadonlySet<string> = new Set<string>([]);

const isReady = (row: NicheTemplate) => row.status === "ready";

/** A niche's row, or undefined. */
export function nicheTemplateFor(nicheId: string | null | undefined, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  return nicheId ? rows.find((row) => row.niche === nicheId) : undefined;
}

/** The row a template serves, or undefined. */
export function nicheOfTemplate(templateKey: string | null | undefined, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): NicheTemplate | undefined {
  return templateKey ? rows.find((row) => row.template === templateKey) : undefined;
}

/** A niche's row when it is ready to be shown. */
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
