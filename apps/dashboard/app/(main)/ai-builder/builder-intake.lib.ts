import { cleanCell, cleanMapping, emptyMapping, guessMapping, mappingIsConfident, parsePriceToPiastres, templateMapping, validateRow, type SheetModel } from "@/app/(main)/stores/[storeId]/products/add/from-file/from-file.lib";
import { BULK_LIMITS, type ColumnMapping, type MappedRow, type MappingSource } from "@/app/(main)/stores/[storeId]/products/add/from-file/from-file.dto";
import {
  BUILDER_LIMITS,
  type BuilderEditOutput,
  type BuilderFileRow,
  type BuilderFileSummary,
  type BuilderIntakeOutput,
  type BuilderState,
} from "./builder.dto";
import { industryIsConfident, latinNameInText, mergeReading, rankIndustries, readContact, readSocialLinks, verifiedContact } from "./builder.lib";
import { BUILDER_STYLES, type BuilderStyle } from "./builder-questions.lib";

/**
 * The v2 intake in code (ROADMAP.md F-82e, F-82f): the seller's file as compact
 * rows, the model's one reading cleaned (nothing kept that isn't in the
 * seller's own text, no price or stock ever from the model), and chat edits
 * turned into state changes. Pure, so each rule has a test.
 */

const line = (value: string | null | undefined, max: number) => (value ?? "").replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max).trim();
const squash = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

// ── The file ────────────────────────────────────────────────────────────────

/** The file's columns, read in code when it can (our template, known headers). `needsModel`: ask the intake call. */
export function readFileColumns(model: SheetModel): { mapping: ColumnMapping; source: MappingSource; needsModel: boolean } {
  const template = templateMapping(model.headers);
  if (template) return { mapping: template, source: "template", needsModel: false };
  const guess = guessMapping(model.headers);
  if (mappingIsConfident(model.headers, guess)) return { mapping: guess, source: "dictionary", needsModel: false };
  return { mapping: guess, source: "fallback", needsModel: true };
}

/** The model's mapping, checked like `mapColumns`: real indexes only, and the code's guess where the model said nothing. */
export function mergeModelMapping(raw: Partial<Record<keyof ColumnMapping, unknown>> | undefined, guess: ColumnMapping, columnCount: number): ColumnMapping | null {
  if (!raw) return null;
  const merged = Object.fromEntries(Object.keys(emptyMapping()).map((field) => [field, raw[field as keyof ColumnMapping] ?? guess[field as keyof ColumnMapping]]));
  const mapping = cleanMapping(merged as Partial<ColumnMapping>, columnCount);
  return mapping.name !== null || mapping.nameAr !== null || mapping.nameEn !== null ? mapping : null;
}

/**
 * Mapped rows → the build's compact rows. A row with a good price goes through
 * the importer's own `validateRow`; a row without one is kept with a null
 * price so the seller can fix it (it is not added until then, D4). Rows with no
 * name, a bad SKU or a repeat are dropped. At most `fileProducts` rows.
 */
export function toFileRows(rows: readonly MappedRow[], source: MappingSource): { rows: BuilderFileRow[]; summary: BuilderFileSummary } {
  const out: BuilderFileRow[] = [];
  const seen = new Set<string>();
  const skus = new Set<string>();
  let dropped = 0;
  let truncated = 0;
  for (const input of rows) {
    const check = validateRow(input);
    let row: BuilderFileRow | null = null;
    if (check.ok) {
      const v = check.value;
      row = {
        row: v.row,
        name: (v.name.ar ?? v.name.en ?? "").slice(0, 200),
        nameEn: v.name.ar && v.name.en ? v.name.en.slice(0, 200) : null,
        price: v.salePiastres ?? v.listPiastres,
        compareAt: v.salePiastres !== null ? v.listPiastres : null,
        stock: v.stock,
        unlimited: false,
        images: v.images,
        category: v.category,
        description: line(v.description.ar ?? v.description.en, 600) || null,
        sku: v.sku,
      };
    } else if (check.problem === "noPrice" || check.problem === "badPrice") {
      // Same cleaning as validateRow for what it would have kept; the price waits for the seller.
      const name = line(cleanCell(input.nameAr) || cleanCell(input.name) || cleanCell(input.nameEn), 200);
      const sku = cleanCell(input.sku);
      if (name && sku.length <= BULK_LIMITS.maxSkuLength) {
        const en = line(cleanCell(input.nameEn), 200);
        row = {
          row: input.row,
          name,
          nameEn: en && en !== name ? en : null,
          price: null,
          compareAt: null,
          stock: null,
          unlimited: false,
          images: [],
          category: line(cleanCell(input.category).split(">").pop(), 80) || null,
          description: line(cleanCell(input.descriptionAr) || cleanCell(input.description) || cleanCell(input.descriptionEn), 600) || null,
          sku: sku || null,
        };
      }
    }
    if (!row) {
      dropped++;
      continue;
    }
    const key = JSON.stringify([squash(row.name), row.price]);
    const skuKey = row.sku?.toLowerCase();
    if (seen.has(key) || (skuKey && skus.has(skuKey))) {
      dropped++;
      continue;
    }
    if (out.length >= BUILDER_LIMITS.fileProducts) {
      truncated++;
      continue;
    }
    seen.add(key);
    if (skuKey) skus.add(skuKey);
    out.push(row);
  }
  return {
    rows: out,
    summary: {
      found: rows.length,
      kept: out.length,
      missingPrice: out.filter((row) => row.price === null).length,
      missingStock: out.filter((row) => row.stock === null && !row.unlimited).length,
      dropped,
      truncated,
      mapping: source,
    },
  };
}

const pounds = (piastres: number) => String(piastres / 100);

/**
 * A compact row back into what the importer reads (`runBulkBatch`), so the
 * importer checks it again. `fallbackCategory`: the store's one category when
 * the file has no category column (the `categories` step).
 */
export function fileRowToMapped(row: BuilderFileRow, fallbackCategory: string | null = null): MappedRow {
  const mapped: MappedRow = { row: row.row, name: row.name };
  if (row.nameEn) mapped.nameEn = row.nameEn;
  if (row.description) mapped.description = row.description;
  if (row.price !== null) {
    if (row.compareAt !== null && row.compareAt > row.price) {
      mapped.price = pounds(row.compareAt);
      mapped.salePrice = pounds(row.price);
    } else mapped.price = pounds(row.price);
  }
  if (row.stock !== null && !row.unlimited) mapped.stock = String(row.stock);
  if (row.sku) mapped.sku = row.sku;
  const category = row.category ?? fallbackCategory;
  if (category) mapped.category = category;
  if (row.images.length) mapped.images = row.images.join(" ");
  return mapped;
}

/** The seller's inline fix of one row (price in pounds, as typed). Null when the value is wrong. */
export function patchFileRow(row: BuilderFileRow, patch: { price?: string | number | null; stock?: number | null; unlimited?: boolean }): BuilderFileRow | null {
  const next = { ...row };
  if (patch.price !== undefined && patch.price !== null) {
    const piastres = parsePriceToPiastres(String(patch.price));
    if (piastres === null) return null;
    next.price = piastres;
    if (next.compareAt !== null && next.compareAt <= piastres) next.compareAt = null;
  }
  if (patch.unlimited !== undefined) next.unlimited = patch.unlimited;
  if (patch.stock !== undefined && patch.stock !== null) {
    if (!Number.isInteger(patch.stock) || patch.stock < 0 || patch.stock > BULK_LIMITS.maxStock) return null;
    next.stock = patch.stock;
    next.unlimited = false;
  }
  if (next.unlimited) next.stock = null;
  return next;
}

// ── The intake reading ──────────────────────────────────────────────────────

export type IntakeReading = {
  name: string | null;
  nameEn: string | null;
  nameIdeas: string[];
  industryHint: string | null;
  audience: string;
  tone: string;
  styleWords: string[];
  taglineAr: string;
  taglineEn: string;
  photoKeywordsEn: string[];
  contact: BuilderState["contact"];
  social: BuilderState["social"];
};


/**
 * The model's answer, kept only where the seller's text backs it: a store
 * name or Latin name only when written, contacts and links only when found
 * verbatim, name ideas only when no name was given. Text fields are clipped
 * and stripped of tags. Prices and stock are not in the schema at all.
 */
export function cleanIntakeReading(output: BuilderIntakeOutput, prompt: string): IntakeReading {
  const text = squash(prompt);
  const stated = (value: string | null) => {
    const name = line(value, 60);
    return name.length >= 2 && text.includes(squash(name)) ? name : null;
  };
  const nameEn = latinNameInText(output.storeNameEn, prompt);
  const name = stated(output.storeNameAr) ?? nameEn;
  // No name ideas: the seller always types their own brand name (owner, 2026-11-09).
  const ideas: string[] = [];
  const verified = verifiedContact(output, prompt);
  const typed = readContact(prompt);
  const links = readSocialLinks(prompt);
  return {
    name,
    nameEn,
    nameIdeas: ideas,
    industryHint: line(output.industryHint, 40) || null,
    audience: line(output.audience, 80),
    tone: line(output.tone, 60),
    styleWords: output.styleWords.map((word) => line(word, 20)).filter(Boolean).slice(0, 5),
    taglineAr: line(output.taglineAr, 70),
    taglineEn: line(output.taglineEn, 70),
    photoKeywordsEn: [...new Set(output.photoKeywordsEn.map((word) => line(word, 30).toLowerCase()).filter((word) => /^[a-z][a-z -]{1,29}$/.test(word)))].slice(0, 5),
    contact: {
      phone: typed.phone ?? verified.contact.phone,
      whatsapp: typed.whatsapp ?? verified.contact.whatsapp,
      email: typed.email ?? verified.contact.email,
    },
    social: [...links, ...verified.links.filter((link) => !links.some((own) => own.platform === link.platform))],
  };
}

/** Style words → template styles (a small dictionary, as the shortlist reads them). */
export function stylesOf(words: readonly string[]): BuilderStyle[] {
  const DICT: Record<BuilderStyle, readonly string[]> = {
    luxe: ["luxury", "luxe", "luxurious", "premium", "elegant", "upscale", "فخم", "فاخر", "راقي", "انيق"],
    bold: ["modern", "bold", "vibrant", "colorful", "colourful", "energetic", "urban", "street", "عصري", "جريء", "شبابي", "حيوي"],
    warm: ["warm", "cozy", "cosy", "natural", "earthy", "rustic", "organic", "دافئ", "طبيعي", "ريفي"],
    minimal: ["minimal", "minimalist", "clean", "simple", "calm", "بسيط", "هادئ", "نظيف"],
    playful: ["fun", "playful", "cute", "cheerful", "kids", "مرح", "لطيف", "مبهج"],
    classic: ["classic", "traditional", "timeless", "vintage", "heritage", "retro", "كلاسيك", "كلاسيكي", "تقليدي", "اصيل"],
  };
  const tokens = words.flatMap((word) => word.toLowerCase().replace(/[أإآ]/g, "ا").split(/[^\p{L}]+/u)).map((token) => token.replace(/^ال(?=..)/, ""));
  return BUILDER_STYLES.filter((style) => DICT[style].some((entry) => tokens.includes(entry.replace(/[أإآ]/g, "ا"))));
}

/**
 * The reading → the state. Answers the seller already gave are never replaced.
 * The industry is set only when the code is sure; else its best 3 become the
 * choices. Styles come from the words in code; asked when none are found.
 */
export function applyIntakeReading(state: BuilderState, reading: IntakeReading): BuilderState {
  const ranked = rankIndustries(`${reading.industryHint ?? ""} ${state.about ?? ""}`);
  const sure = industryIsConfident(ranked);
  const styles = state.styles.length ? state.styles : stylesOf([...reading.styleWords, state.about ?? ""]);
  const name = state.name ?? reading.name;
  const nameEn = state.nameEn ?? reading.nameEn;
  return {
    ...state,
    name,
    nameEn,
    nameIdeas: name ? [] : reading.nameIdeas,
    industryId: state.industryId ?? (sure ? ranked[0]!.id : null),
    industryOptions: ranked.slice(0, 3).map((entry) => entry.id),
    industrySuggestion: ranked[0]?.id ?? state.industrySuggestion,
    contact: {
      phone: state.contact.phone ?? reading.contact.phone,
      whatsapp: state.contact.whatsapp ?? reading.contact.whatsapp,
      email: state.contact.email ?? reading.contact.email,
    },
    social: [...state.social, ...reading.social.filter((link) => !state.social.some((own) => own.platform === link.platform))],
    socialDone: true,
    brief: {
      nameEn: nameEn ?? "",
      taglineAr: reading.taglineAr,
      taglineEn: reading.taglineEn,
      audience: reading.audience,
      tone: reading.tone,
      styleWords: reading.styleWords,
    },
    briefConfirmed: true,
    styles,
    styleDone: state.styleDone || styles.length > 0,
    photoKeywordsEn: reading.photoKeywordsEn,
    intakeDone: true,
  };
}

/** No model, or nothing to read: the cards start from what the code found itself. */
export function intakeWithoutModel(state: BuilderState): BuilderState {
  const prompt = state.about ?? "";
  return applyIntakeReading(state, {
    name: null,
    nameEn: latinNameInText(null, prompt),
    nameIdeas: [],
    industryHint: null,
    audience: "",
    tone: "",
    styleWords: [],
    taglineAr: "",
    taglineEn: "",
    photoKeywordsEn: [],
    contact: readContact(prompt),
    social: readSocialLinks(prompt),
  });
}

// ── Chat edits ──────────────────────────────────────────────────────────────

/** Brand colours a seller names, Arabic and English → hex. Code's own values: the model only names the colour. */
const COLOR_WORDS: Record<string, string> = {
  green: "#2e7d32", اخضر: "#2e7d32",
  olive: "#6b7a2a", زيتي: "#6b7a2a",
  blue: "#1e5bb8", ازرق: "#1e5bb8",
  navy: "#1b2a4a", كحلي: "#1b2a4a",
  sky: "#3b9ddd", لبني: "#3b9ddd",
  teal: "#0f7c80", turquoise: "#0f9a9a", تركواز: "#0f9a9a",
  red: "#c62828", احمر: "#c62828",
  maroon: "#7b1e2b", burgundy: "#7b1e2b", نبيتي: "#7b1e2b",
  pink: "#d63384", بمبي: "#d63384", وردي: "#d63384", روز: "#e07a9a",
  purple: "#6a3fb5", بنفسجي: "#6a3fb5", موف: "#8e5bb8",
  orange: "#e8701a", برتقالي: "#e8701a",
  yellow: "#e0a800", اصفر: "#e0a800",
  gold: "#b8892f", golden: "#b8892f", دهبي: "#b8892f", ذهبي: "#b8892f",
  brown: "#7a4e2d", بني: "#7a4e2d",
  beige: "#c8b08a", بيج: "#c8b08a",
  black: "#111111", اسود: "#111111",
  gray: "#5f6368", grey: "#5f6368", رمادي: "#5f6368",
};

const folded = (value: string) => value.toLowerCase().replace(/[أإآ]/g, "ا").replace(/^ال(?=..)/, "");

/**
 * A brand colour the seller asked for: a hex they typed, else (only when the
 * model read a request for a colour, so "a black bag for 200" changes nothing)
 * a colour word in their text, else the model's word, looked up in code.
 */
export function colorFromText(text: string, colorWord: string | null): string | null {
  const hex = /#[0-9a-f]{6}\b/i.exec(text)?.[0];
  if (hex) return hex.toLowerCase();
  if (!colorWord?.trim()) return null;
  const words = text.split(/[^\p{L}]+/u).map(folded);
  for (const word of words) if (COLOR_WORDS[word]) return COLOR_WORDS[word]!;
  const fromModel = colorWord ? COLOR_WORDS[folded(colorWord.trim())] : undefined;
  return fromModel ?? null;
}

/**
 * What the seller typed between cards → the state. Contacts and products as in
 * v1 (`mergeReading`: only what is in the text). On top, an explicit change of
 * name, colour, look or field replaces the earlier answer, since the seller
 * asked for it; a name only when it is written in the text.
 */
export function applyEditReading(state: BuilderState, output: BuilderEditOutput, text: string, newId: () => string): BuilderState {
  let next = mergeReading(state, output, text, newId);
  const name = line(output.storeName, 80);
  if (name.length >= 2 && squash(text).includes(squash(name))) next = { ...next, name, nameIdeas: [] };
  const color = colorFromText(text, output.colorWord);
  if (color) next = { ...next, primaryColor: color, colorDone: true };
  const styles = stylesOf(output.styleWords);
  if (styles.length) next = { ...next, styles: styles.slice(0, 2), styleDone: true };
  const ranked = rankIndustries(`${output.industryHint ?? ""}`);
  if (industryIsConfident(ranked) && ranked[0]!.id !== next.industryId && !next.templateKey) next = { ...next, industryId: ranked[0]!.id, shortlist: [] };
  return next;
}
