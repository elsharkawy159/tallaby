/**
 * The AI store builder's three template suggestions (spec
 * 2026-11-08-ai-store-builder-v2-design.md §5), all in code, no model call.
 *
 * Score = industry (exact > related, nearest first > the any-store default >
 * other) + the store niche's edition + style overlap (the seller's style words mapped to template
 * styles with a small dictionary) − fit (the home shows more product cards
 * or category tiles than the seller has) − colour harmony (the seller's
 * primary colour barely shows on the template's background). The pick keeps
 * the three apart: no two with the same main style while a different one
 * scores close enough. Ties break on a stable hash of seed + key, so a
 * seller's list doesn't reorder on resume. Pure; no React here.
 *
 * Niche editions (ROADMAP F-90, plan §4.5): with the store's niche
 * (`matchNiche`, in code), a template that has that niche's edition gets
 * `nicheEdition` points and its suggestion carries `editionId`, so it is
 * previewed and installed with the edition. With no pack registered nothing
 * changes.
 *
 * One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md
 * §1): the niche's own template (`NICHE_TEMPLATES`), when its row is ready
 * and it is allowed, is ranked first whatever its score, so it is always the
 * first suggestion. The rest keep their order.
 */
import {
  CODE_TEMPLATES,
  colorContrastRatio,
  editionOnLook,
  readyNicheTemplate,
  templateTraits,
  TEMPLATE_STYLES,
  type Edition,
  type NicheTemplate,
  type TemplateStyle,
  type TemplateTraits,
} from "@workspace/store-sections/templates";
import { RELATED_INDUSTRIES } from "./industries.lib";

export type ShortlistTemplate = Pick<TemplateTraits, "key" | "category" | "style" | "needs"> & Partial<Pick<TemplateTraits, "tone" | "background">>;

export type TemplateShortlistInput = {
  /** A `STORE_INDUSTRIES` id, or null when unknown. */
  industryId: string | null;
  /** The seller's own words about the look (Arabic or English). */
  styleWords: readonly string[];
  /** Styles already picked (chips); added to those read from the words. */
  styles?: readonly TemplateStyle[];
  productCount: number;
  categoryCount: number;
  /** The seller's primary colour, `#rrggbb`. */
  primaryColor?: string | null;
  seed: string;
  /** Keys never to suggest. */
  exclude?: readonly string[];
  /** How many to return (default 3). */
  count?: number;
  /** The templates to choose from (default: every code template). */
  templates?: readonly ShortlistTemplate[];
  /** The store's niche (`matchNiche`), or null/absent when the words do not say. */
  nicheId?: string | null;
  /** The packs to look in. Tests only: callers leave it out (the registered packs). */
  editions?: readonly Edition[];
  /** The niche template rows. Tests only: callers leave it out (`NICHE_TEMPLATES`). */
  nicheTemplates?: readonly NicheTemplate[];
};

export type ScoredTemplate = {
  key: string;
  mainStyle: TemplateStyle;
  score: number;
  parts: { industry: number; style: number; fit: number; color: number; niche: number };
  /** The niche whose edition this template is previewed and installed with. Absent: the template's own content. */
  editionId?: string;
};

/** Score weights. Industry dominates; style decides inside it; fit and colour nudge. */
export const SHORTLIST_WEIGHTS = {
  industryExact: 100,
  /** The nearest related industry; each later one gets `relatedStep` less. */
  industryRelated: 60,
  relatedStep: 5,
  /** The any-store default ("general", Tallaby Classic). */
  industryGeneral: 30,
  styleMain: 30,
  styleSecond: 15,
  /**
   * The template has the store niche's edition (`editionOnLook`). More than a
   * main style match (30) plus the colour nudges, so inside an industry the
   * look that already speaks the seller's trade leads; less than the gap
   * between an exact and the nearest related industry (100 − 60 = 40), so a
   * look borrowed from another industry never passes a template of the
   * store's own industry on this bonus alone. Industry stays dominant.
   */
  nicheEdition: 35,
  /** Per missing product card / category tile, and the most each can cost. */
  productShortfall: 2,
  productShortfallMax: 20,
  categoryShortfall: 4,
  categoryShortfallMax: 20,
  /** Primary on the template background below these contrast ratios. */
  colorPoor: 15,
  colorWeak: 6,
  /** A different main style is picked over a repeat when it scores at most this much less. */
  diversitySlack: 50,
} as const;

const POOR_CONTRAST = 1.5;
const WEAK_CONTRAST = 2.2;

/** Style words, Arabic and English (matched after `normalizeWord`: one alef, ى/ئ→ي, ؤ→و, no ء, ة→ه, no "ال"). */
const STYLE_WORDS: Readonly<Record<TemplateStyle, readonly string[]>> = {
  luxe: ["فخم", "فخامه", "فاخر", "راقي", "رقي", "انيق", "اناقه", "luxury", "luxe", "luxurious", "premium", "elegant", "upscale", "fancy", "highend"],
  bold: ["عصري", "جريء", "جرئ", "قوي", "ملون", "حيوي", "شبابي", "modern", "bold", "vibrant", "colorful", "colourful", "energetic", "edgy", "loud", "urban", "street", "streetwear"],
  warm: ["دافئ", "دافي", "دفا", "دفء", "طبيعي", "بيتي", "ريفي", "warm", "cozy", "cosy", "homey", "natural", "earthy", "rustic", "organic"],
  minimal: ["بسيط", "بساطه", "هادئ", "هادي", "نظيف", "مينيمال", "minimal", "minimalist", "clean", "simple", "calm", "quiet", "plain", "neat"],
  playful: ["مرح", "لطيف", "مبهج", "اطفال", "طفولي", "فرفوش", "fun", "playful", "kids", "kid", "cute", "cheerful", "happy", "toy", "toys"],
  classic: ["كلاسيك", "كلاسيكي", "تقليدي", "عريق", "اصيل", "قديم", "classic", "classical", "traditional", "timeless", "vintage", "heritage", "retro"],
};

const normalizeWord = (word: string) =>
  word
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ء/g, "")
    .replace(/ة/g, "ه")
    .replace(/[-_]/g, "");

const WORD_TO_STYLE = new Map<string, TemplateStyle>(TEMPLATE_STYLES.flatMap((style) => STYLE_WORDS[style].map((word) => [normalizeWord(word), style] as const)));

const tokensOf = (text: string) => text.split(/[\s,،.؛;:!?()"'/|+&]+/u).map(normalizeWord).filter(Boolean);

/** Template styles named in the seller's words, in the order first mentioned. */
export function stylesFromWords(words: readonly string[]): TemplateStyle[] {
  const out: TemplateStyle[] = [];
  for (const token of words.flatMap(tokensOf)) {
    // "الفخم", "والعصري", "بالبسيط": try the word, then without a leading و/ب/ل/ف and "ال".
    const bare = token.replace(/^[وبلف](?=ال)/, "").replace(/^ال(?=..)/, "");
    const style = WORD_TO_STYLE.get(token) ?? WORD_TO_STYLE.get(bare);
    if (style && !out.includes(style)) out.push(style);
  }
  return out;
}

/** FNV-1a: a small stable hash for tie-breaks. */
function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function industryScore(category: string, industryId: string | null): number {
  if (!industryId) return category === "general" ? SHORTLIST_WEIGHTS.industryGeneral : 0;
  if (category === industryId) return SHORTLIST_WEIGHTS.industryExact;
  const index = (RELATED_INDUSTRIES[industryId] ?? []).indexOf(category);
  if (index >= 0) return SHORTLIST_WEIGHTS.industryRelated - index * SHORTLIST_WEIGHTS.relatedStep;
  return category === "general" ? SHORTLIST_WEIGHTS.industryGeneral : 0;
}

function styleScore(style: readonly TemplateStyle[], wanted: readonly TemplateStyle[]): number {
  let score = 0;
  for (const want of wanted) {
    if (style[0] === want) score += SHORTLIST_WEIGHTS.styleMain;
    else if (style.includes(want)) score += SHORTLIST_WEIGHTS.styleSecond;
  }
  return score;
}

const count = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

/** A penalty (≤ 0) when the home shows more cards or tiles than the seller can fill. */
export function fitPenalty(needs: ShortlistTemplate["needs"], productCount: number, categoryCount: number): number {
  const products = Math.max(0, needs.productCards - count(productCount));
  const categories = Math.max(0, needs.categoryTiles - count(categoryCount));
  const cost =
    Math.min(SHORTLIST_WEIGHTS.productShortfallMax, products * SHORTLIST_WEIGHTS.productShortfall) +
    Math.min(SHORTLIST_WEIGHTS.categoryShortfallMax, categories * SHORTLIST_WEIGHTS.categoryShortfall);
  return cost === 0 ? 0 : -cost;
}

/** A penalty (≤ 0) when the primary colour barely shows on the template's background (a very light primary on a light template, a very dark one on a dark template). */
export function colorPenalty(template: Pick<ShortlistTemplate, "tone" | "background">, primaryColor: string | null | undefined): number {
  if (!primaryColor) return 0;
  const background = template.background ?? (template.tone === "dark" ? "#111111" : "#ffffff");
  const ratio = colorContrastRatio(primaryColor, background);
  if (ratio === null) return 0;
  if (ratio < POOR_CONTRAST) return -SHORTLIST_WEIGHTS.colorPoor;
  if (ratio < WEAK_CONTRAST) return -SHORTLIST_WEIGHTS.colorWeak;
  return 0;
}

let codeTraits: readonly ShortlistTemplate[] | null = null;
/** Every code template's traits, built once. */
function defaultTemplates(): readonly ShortlistTemplate[] {
  codeTraits ??= CODE_TEMPLATES.map(templateTraits);
  return codeTraits;
}

type Ranked = ScoredTemplate & { order: number };

/** Every allowed template, scored, best first (ties by the seed hash). */
export function rankTemplates(input: TemplateShortlistInput): ScoredTemplate[] {
  return rank(input).map(({ order: _order, ...scored }) => scored);
}

function rank(input: TemplateShortlistInput): Ranked[] {
  const wanted = [...new Set([...(input.styles ?? []), ...stylesFromWords(input.styleWords)])];
  const excluded = new Set(input.exclude ?? []);
  const ranked = (input.templates ?? defaultTemplates())
    .filter((template) => !excluded.has(template.key) && template.style.length > 0)
    .map((template): Ranked => {
      // Only a pack approved on this template counts (an unknown niche id finds none).
      const edition = input.nicheId ? editionOnLook(template.key, input.nicheId, input.editions) : undefined;
      const parts = {
        industry: industryScore(template.category, input.industryId),
        style: styleScore(template.style, wanted),
        fit: fitPenalty(template.needs, input.productCount, input.categoryCount),
        color: colorPenalty(template, input.primaryColor),
        niche: edition ? SHORTLIST_WEIGHTS.nicheEdition : 0,
      };
      return {
        key: template.key,
        mainStyle: template.style[0]!,
        score: parts.industry + parts.style + parts.fit + parts.color + parts.niche,
        parts,
        ...(edition && { editionId: edition.niche }),
        order: stableHash(`${input.seed}:${template.key}`),
      };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order || (a.key < b.key ? -1 : 1));
  return nicheTemplateLeads(ranked, input);
}

/** The store niche's ready niche template first (when it is in the list); the others in their order. */
function nicheTemplateLeads(ranked: Ranked[], input: TemplateShortlistInput): Ranked[] {
  const lead = readyNicheTemplate(input.nicheId, input.nicheTemplates)?.template;
  const index = lead ? ranked.findIndex((entry) => entry.key === lead) : -1;
  return index > 0 ? [ranked[index]!, ...ranked.slice(0, index), ...ranked.slice(index + 1)] : ranked;
}

/**
 * The top `count` (default 3) templates, kept different: each next pick is
 * the best one with a main style not shown yet, unless that scores more than
 * `diversitySlack` below the best remaining one (then the best one is
 * taken). Returned in pick order.
 */
export function scoreTemplates(input: TemplateShortlistInput): ScoredTemplate[] {
  const want = Math.max(0, Math.floor(input.count ?? 3));
  const remaining = rank(input);
  const picked: Ranked[] = [];
  while (picked.length < want && remaining.length) {
    const best = remaining[0]!;
    const shown = new Set(picked.map((p) => p.mainStyle));
    const index = remaining.findIndex((t) => !shown.has(t.mainStyle) && t.score >= best.score - SHORTLIST_WEIGHTS.diversitySlack);
    picked.push(...remaining.splice(index >= 0 ? index : 0, 1));
  }
  return picked.map(({ order: _order, ...scored }) => scored);
}

/** "Show 3 more": the next pick, never repeating one already shown. */
export function nextTemplates(input: TemplateShortlistInput, alreadyShown: readonly string[]): ScoredTemplate[] {
  return scoreTemplates({ ...input, exclude: [...(input.exclude ?? []), ...alreadyShown] });
}
