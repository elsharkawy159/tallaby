/**
 * `matchNiche`: which niche a store is in, from what the seller typed (store
 * category, store name, product titles) and an optional short hint. Pure code,
 * no model call and no list sent to a model (docs/ai.md rule 2): the AI
 * builder may pass one short hint, the rest is keyword matching.
 *
 * How it scores (constants in `MATCH`):
 * 1. Every text is normalised (Arabic letter forms, tashkeel, digits; lower
 *    case) and split into words.
 * 2. A keyword of several words found as a phrase scores most, and the longest
 *    phrase at a position wins: "ساعات ذكية" is smart watches, not watches.
 * 3. A one-word keyword scores next. A word that only appears inside a niche's
 *    longer keywords scores a little, and less the more niches share it, so a
 *    general word ("ملابس", "accessories") never picks a niche on its own.
 * 4. A longer word that is no keyword at all may match a one-word keyword
 *    within a small edit distance (typos, a dropped letter).
 * 5. The store category weighs most, then the hint, the name, then product
 *    titles (a little each, capped).
 * 6. With an industry, niches of other industries are scaled down, not removed.
 * 7. Null under the threshold, or when the best two are close and are not kin.
 *
 * Deterministic: equal scores order by niche id. No React here.
 */
import { NICHE_INDUSTRY_NAMES, NICHES } from "./niches";

export type MatchNicheInput = {
  /** The store's category as saved (`stores.store_category` / `store_category_ar`). */
  category?: { en?: string | null; ar?: string | null } | null;
  /** The store's name. */
  name?: string | null;
  productTitles?: readonly string[] | null;
  /** A `STORE_INDUSTRIES` id when known. */
  industryId?: string | null;
  /** A short free-text hint (the AI builder's "women's dresses"). */
  hint?: string | null;
};

export type NicheMatch = { nicheId: string; score: number };

export const MATCH = {
  /** A one-word keyword found as a word of the text. */
  word: 8,
  /** Added per extra word of a phrase keyword (2 words = 12, 3 = 16). */
  phraseStep: 4,
  /** A word found only inside a niche's phrase keywords, by how many niches use the word. */
  partial: [3, 1.5, 1, 0.5] as const,
  /** A non-keyword word within edit distance 1 (or 2 from 9 letters) of a one-word keyword. */
  fuzzy: 5,
  fuzzyFar: 4,
  fuzzyMinLength: 5,
  fuzzyFarMinLength: 9,
  weight: { category: 1, hint: 0.9, name: 0.6, title: 0.3 },
  /** The most all product titles together can add to one niche (the others scale down with it). */
  titlesCap: 8,
  maxTitles: 300,
  maxTitleWords: 12,
  /** A niche outside the given industry keeps this share of its score. */
  otherIndustry: 0.6,
  threshold: 4.5,
  /** Null when the runner-up reaches this share of the best score and is not its kin. */
  closeRatio: 0.75,
} as const;

/**
 * Niches close enough in meaning that picking either is right, so a near tie
 * between them still returns the better one instead of null.
 */
const KIN: readonly (readonly [string, string])[] = [
  ["audio", "earbuds"],
  ["books", "kids-books"],
  ["coffee-beans", "coffee-gear"],
  ["kitchen-appliances", "small-appliances"],
  ["handmade-gifts", "kids-gifts"],
  ["school-supplies", "stationery"],
  ["pet-accessories", "pet-food"],
  ["car-accessories", "car-interior"],
  ["gym-fitness", "sportswear"],
  ["fashion-jewelry", "hair-accessories"],
];

const COMBINING = /[̀-ͯؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const LETTER_FORMS: Readonly<Record<string, string>> = {
  أ: "ا", إ: "ا", آ: "ا", ٱ: "ا", ى: "ي", ی: "ي", ئ: "ي", ؤ: "و", ة: "ه", ک: "ك", گ: "ج", چ: "ج", ڤ: "ف", پ: "ب",
};

/**
 * One spelling per word: lower case, no tashkeel or tatweel, alef and hamza
 * forms unified, ى→ي, ة→ه, Arabic-Indic digits as 0–9, apostrophes dropped
 * ("men's" = "mens"), everything else that is not a letter or digit a space.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(COMBINING, "")
    .replace(/[أإآٱىیئؤةکگچڤپ]/g, (letter) => LETTER_FORMS[letter] ?? letter)
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9ء-ي]+/g, " ")
    .trim();
}

/** Joining words that carry no meaning and would only split a phrase. */
const SKIPPED = new Set(["and", "و"]);

const rawWords = (value: string): string[] => {
  const text = normalizeText(value);
  return text ? text.split(" ").filter((word) => !SKIPPED.has(word)) : [];
};

// ── The index, built once ──

const NICHE_IDS = NICHES.map((niche) => niche.id);
const NICHE_INDUSTRY = NICHES.map((niche) => niche.industry);
/** One-word keyword → niche indexes. */
const WORDS = new Map<string, number[]>();
/** Phrase keyword (words joined by a space) → niche indexes. */
const PHRASES = new Map<string, number[]>();
/** A word inside phrase keywords → niche indexes that use it there. */
const PHRASE_WORDS = new Map<string, number[]>();
/** Every word of every keyword. */
const VOCAB = new Set<string>();
/** One-word keywords by first letter, for the typo pass. */
const WORDS_BY_INITIAL = new Map<string, string[]>();
let longestPhrase = 2;

const push = (map: Map<string, number[]>, key: string, niche: number) => {
  const list = map.get(key);
  if (!list) map.set(key, [niche]);
  else if (!list.includes(niche)) list.push(niche);
};

NICHES.forEach((niche, index) => {
  for (const keyword of [...niche.keywords.ar, ...niche.keywords.en]) {
    const words = rawWords(keyword);
    if (words.length === 0) continue;
    words.forEach((word) => VOCAB.add(word));
    if (words.length === 1) {
      push(WORDS, words[0]!, index);
      continue;
    }
    push(PHRASES, words.join(" "), index);
    longestPhrase = Math.max(longestPhrase, words.length);
    // Short words and bare numbers ("t", "21") say nothing on their own.
    for (const word of words) if (word.length >= 3 && !/^\d+$/.test(word)) push(PHRASE_WORDS, word, index);
  }
});

for (const word of WORDS.keys()) {
  const initial = word[0]!;
  const list = WORDS_BY_INITIAL.get(initial);
  if (list) list.push(word);
  else WORDS_BY_INITIAL.set(initial, [word]);
}

/** How many niches use a word at all (as a keyword or inside one). */
const breadth = (word: string): number => new Set([...(WORDS.get(word) ?? []), ...(PHRASE_WORDS.get(word) ?? [])]).size;

/** As `findIndustry` compares a saved category: "Kitchen & Appliances" is the industry, "Kitchen appliances" is a niche. */
const sameName = (value: string) => value.trim().toLowerCase();
const INDUSTRY_BY_NAME = new Map<string, string>();
for (const [id, names] of Object.entries(NICHE_INDUSTRY_NAMES)) for (const name of names) INDUSTRY_BY_NAME.set(sameName(name), id);

const KIN_KEYS = new Set(KIN.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));

// ── Words of a text ──

const AR_PREFIXES = ["وال", "بال", "لل", "ال", "و"] as const;

/**
 * A text word as the index knows it: itself when it is a keyword word, else
 * without an Arabic article or "و" when that leaves one ("والجرابات" →
 * "جرابات"). Unknown words lose a leading "ال" for the typo pass.
 */
function knownForm(word: string): string {
  if (VOCAB.has(word)) return word;
  for (const prefix of AR_PREFIXES) {
    if (!word.startsWith(prefix)) continue;
    const rest = word.slice(prefix.length);
    if (rest.length >= 2 && VOCAB.has(rest)) return rest;
  }
  return word.startsWith("ال") && word.length >= 6 ? word.slice(2) : word;
}

const textWords = (value: string): string[] => rawWords(value).map(knownForm);

/** Optimal string alignment distance (a swap of two neighbours counts 1), cut off above `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let before: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, before[j - 2]! + 1);
      current.push(value);
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    before = previous;
    previous = current;
  }
  return previous[b.length]!;
}

type Fuzzy = { niches: number[]; points: number } | null;

/** The nearest one-word keywords of a word that is no keyword word itself (same first letter). */
function fuzzyNiches(word: string, memo: Map<string, Fuzzy>): Fuzzy {
  const cached = memo.get(word);
  if (cached !== undefined) return cached;
  let result: Fuzzy = null;
  if (word.length >= MATCH.fuzzyMinLength && !/\d/.test(word)) {
    const max = word.length >= MATCH.fuzzyFarMinLength ? 2 : 1;
    let nearest = max + 1;
    let niches: number[] = [];
    for (const keyword of WORDS_BY_INITIAL.get(word[0]!) ?? []) {
      if (keyword.length < MATCH.fuzzyMinLength - 1) continue;
      const distance = editDistance(word, keyword, Math.min(max, nearest));
      if (distance > max || distance > nearest) continue;
      if (distance < nearest) {
        nearest = distance;
        niches = [];
      }
      for (const niche of WORDS.get(keyword)!) if (!niches.includes(niche)) niches.push(niche);
    }
    if (niches.length > 0) result = { niches, points: nearest === 1 ? MATCH.fuzzy : MATCH.fuzzyFar };
  }
  memo.set(word, result);
  return result;
}

/** One text's points per niche index. */
function scoreText(value: string, memo: Map<string, Fuzzy>, limit?: number): Map<number, number> {
  const scores = new Map<number, number>();
  let words = textWords(value);
  if (limit) words = words.slice(0, limit);
  if (words.length === 0) return scores;
  const add = (niche: number, points: number) => scores.set(niche, (scores.get(niche) ?? 0) + points);

  // Phrase hits, longest first; a hit inside a longer one is dropped.
  const hits: { start: number; length: number; key: string }[] = [];
  for (let length = Math.min(longestPhrase, words.length); length >= 2; length--) {
    for (let start = 0; start + length <= words.length; start++) {
      const key = words.slice(start, start + length).join(" ");
      if (!PHRASES.has(key)) continue;
      if (hits.some((hit) => hit.length > length && hit.start <= start && start + length <= hit.start + hit.length)) continue;
      hits.push({ start, length, key });
    }
  }
  const covered = new Set<number>();
  const counted = new Set<string>();
  for (const hit of hits) {
    for (let i = hit.start; i < hit.start + hit.length; i++) covered.add(i);
    if (counted.has(hit.key)) continue;
    counted.add(hit.key);
    for (const niche of PHRASES.get(hit.key)!) add(niche, MATCH.word + MATCH.phraseStep * (hit.length - 1));
  }

  // Words outside every phrase hit, each word once.
  words.forEach((word, position) => {
    if (covered.has(position) || counted.has(word)) return;
    counted.add(word);
    const owners = WORDS.get(word);
    for (const niche of owners ?? []) add(niche, MATCH.word);
    const inPhrases = PHRASE_WORDS.get(word);
    if (inPhrases) {
      const points = MATCH.partial[Math.min(breadth(word), MATCH.partial.length) - 1]!;
      for (const niche of inPhrases) if (!owners?.includes(niche)) add(niche, points);
    }
    if (owners || inPhrases || VOCAB.has(word)) return;
    const fuzzy = fuzzyNiches(word, memo);
    if (fuzzy) for (const niche of fuzzy.niches) add(niche, fuzzy.points);
  });
  return scores;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** The store's niche, or null when the words do not say (the caller then keeps the look's default edition). */
export function matchNiche(input: MatchNicheInput): NicheMatch | null {
  const memo = new Map<string, Fuzzy>();
  const totals = new Map<number, number>();
  const addAll = (scores: Map<number, number>, weight: number) => {
    for (const [niche, points] of scores) totals.set(niche, (totals.get(niche) ?? 0) + points * weight);
  };

  // A category that is exactly an industry's name gives the industry, not a niche.
  let industryId = input.industryId || null;
  const categoryScores: Map<number, number>[] = [];
  for (const text of [input.category?.en, input.category?.ar]) {
    if (!text) continue;
    const industry = INDUSTRY_BY_NAME.get(sameName(text));
    if (industry) industryId ??= industry;
    else categoryScores.push(scoreText(text, memo));
  }
  // English and Arabic say the same thing twice: the stronger one counts.
  const category = new Map<number, number>();
  for (const scores of categoryScores) for (const [niche, points] of scores) category.set(niche, Math.max(category.get(niche) ?? 0, points));
  addAll(category, MATCH.weight.category);

  if (input.hint) addAll(scoreText(input.hint, memo), MATCH.weight.hint);
  if (input.name) addAll(scoreText(input.name, memo), MATCH.weight.name);

  const titles = new Map<number, number>();
  for (const title of (input.productTitles ?? []).slice(0, MATCH.maxTitles)) {
    if (!title) continue;
    for (const [niche, points] of scoreText(title, memo, MATCH.maxTitleWords)) titles.set(niche, (titles.get(niche) ?? 0) + points * MATCH.weight.title);
  }
  // Capped by scaling, so a large catalog keeps the gap between its niches.
  const strongest = Math.max(0, ...titles.values());
  addAll(titles, strongest > MATCH.titlesCap ? MATCH.titlesCap / strongest : 1);

  const ranked = [...totals]
    .map(([niche, points]) => ({ niche, score: industryId && NICHE_INDUSTRY[niche] !== industryId ? points * MATCH.otherIndustry : points }))
    .sort((a, b) => b.score - a.score || (NICHE_IDS[a.niche]! < NICHE_IDS[b.niche]! ? -1 : 1));

  const best = ranked[0];
  if (!best || best.score < MATCH.threshold) return null;
  const second = ranked[1];
  if (second && second.score >= best.score * MATCH.closeRatio && !KIN_KEYS.has(`${NICHE_IDS[best.niche]}|${NICHE_IDS[second.niche]}`)) return null;
  return { nicheId: NICHE_IDS[best.niche]!, score: round(best.score) };
}
