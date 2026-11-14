/**
 * The AI step of "Fill missing translations" (builder › More), after the free
 * template fill (`fill-translations.ts`): finds the text a seller wrote that
 * still has no translation, plans it into capped batches, checks what the
 * model returns, and writes it only into the EMPTY other-language value.
 * Pure; the model call, credits and caps live with the caller (dashboard).
 *
 * A text is sent when, on a tree node's translatable field (`fields` with
 * `translatable`; never the editor-only Layers name) or a page name:
 * - the default language's value is set and written in the default language
 *   (an Arabic store: has Arabic letters; an English store: Latin and no
 *   Arabic), so Latin brand words in an Arabic store are left alone;
 * - the other language's value is missing or blank (never overwritten);
 * - it isn't the store's name, a URL, an email, a phone or a number, nor a
 *   very short token (fewer than 2 letters; an English store's short code
 *   such as "XL" or "SKU").
 * The same text is sent once (`occurrences` counts where it is used) and its
 * translation goes everywhere it is used.
 */
import type { ComponentNode, PageContent, SectionInstance, SiteLocale } from "../config/schema";
import type { Localized } from "../core/types";
import { getElementDefinition } from "../elements/registry";
import { textScript } from "./fill-translations";

export const AI_TRANSLATE_LIMITS = {
  /** Distinct texts per run; the rest wait for the next run. */
  maxTexts: 200,
  /** One text longer than this is not sent (counted as left). */
  maxTextChars: 1_200,
  /** Characters sent per run, all batches together. */
  maxRunChars: 10_000,
  /** Per model call. */
  batchTexts: 40,
  batchChars: 2_500,
} as const;

export type AiTranslateLimits = { [K in keyof typeof AI_TRANSLATE_LIMITS]: number };

export type UntranslatedRef = { kind: "node"; nodeId: string; key: string } | { kind: "pageName" };

export type UntranslatedText = {
  /** Trimmed source text; the key of its translation. */
  text: string;
  /** How long the translation may be: the shortest field limit it is used in. */
  maxLength: number;
  refs: UntranslatedRef[];
};

/** What a run collects into: texts by their trimmed source, in first-seen (page) order. */
export type UntranslatedCollection = Map<string, UntranslatedText>;

type Overlays = Partial<Record<SiteLocale, Record<string, unknown>>>;
type Props = Record<string, unknown> & { translations?: Overlays };

export type AiTranslateContext = {
  defaultLocale: SiteLocale;
  /** The store's own name(s): never translated. */
  storeNames?: readonly string[];
};

const other = (locale: SiteLocale): SiteLocale => (locale === "ar" ? "en" : "ar");

/** A store's own name (`storeName` / `storeInitial`) and the template copyright line read the same, or are filled from templates. */
const SKIP_ROLES = new Set(["storeName", "storeInitial"]);
const PAGE_NAME_MAX = 80;
const DEFAULT_FIELD_MAX = 600;

const URL_RE = /^(?:https?:\/\/|www\.)\S+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s\-٠-٩]{6,}$/;
/** Arabic and Latin letters only (not Arabic-Indic digits or punctuation). */
const LETTERS_RE = /[A-Za-zء-يٱ-ۓۺ-ۿ]/g;

/** The translatable text fields of an element type with their limits (no Layers name: it is editor-only). */
function translatableFields(type: string): readonly { key: string; maxLength: number }[] {
  const definition = getElementDefinition(type);
  if (!definition) return [];
  return definition.fields.filter((field) => field.translatable).map((field) => ({ key: field.key, maxLength: field.maxLength ?? DEFAULT_FIELD_MAX }));
}

const normalizeName = (value: string) => value.trim().toLocaleLowerCase();

/**
 * Whether a default-language text is one AI should translate (see the file
 * header). Exported for tests.
 */
export function isAiTranslatable(text: string, ctx: AiTranslateContext): boolean {
  const value = text.trim();
  if (!value) return false;
  if (textScript(value) !== ctx.defaultLocale) return false;
  if (URL_RE.test(value) || EMAIL_RE.test(value) || PHONE_RE.test(value)) return false;
  const letters = value.match(LETTERS_RE)?.length ?? 0;
  if (letters < 2) return false;
  // An English store's short code or size ("XL", "SKU", "USB"): reads the same in Arabic.
  if (ctx.defaultLocale === "en" && !/\s/.test(value) && value.length <= 4 && value === value.toUpperCase()) return false;
  if (ctx.storeNames?.some((name) => name.trim() && normalizeName(name) === normalizeName(value))) return false;
  return true;
}

const isBlank = (value: unknown) => typeof value !== "string" || !value.trim();

function addText(into: UntranslatedCollection, text: string, maxLength: number, ref: UntranslatedRef) {
  const key = text.trim();
  const found = into.get(key);
  if (found) {
    found.maxLength = Math.min(found.maxLength, maxLength);
    found.refs.push(ref);
  } else into.set(key, { text: key, maxLength, refs: [ref] });
}

type Walk = AiTranslateContext & {
  /** Collect mode: where untranslated texts go. */
  collect?: UntranslatedCollection;
  /** Apply mode: trimmed source → translation. */
  translations?: ReadonlyMap<string, string>;
  /** Apply mode: how many values were written. */
  applied?: { count: number };
};

function walkNode(node: ComponentNode, walk: Walk): ComponentNode {
  const props = walkProps(node, walk);
  const children = node.children.map((child) => walkNode(child, walk));
  const childrenChanged = children.some((child, i) => child !== node.children[i]);
  if (!props && !childrenChanged) return node;
  return { ...node, ...(props && { props }), children };
}

/** The node's props with translations written into its empty other-language values; null when nothing changes. */
function walkProps(node: ComponentNode, walk: Walk): ComponentNode["props"] | null {
  const source = node.props as Props;
  if (SKIP_ROLES.has(source.role as string)) return null;
  const fields = translatableFields(node.type);
  if (!fields.length) return null;
  const o = other(walk.defaultLocale);
  const theirs: Record<string, unknown> = { ...(source.translations?.[o] ?? {}) };
  let changed = false;
  for (const { key, maxLength } of fields) {
    const value = source[key];
    if (typeof value !== "string" || !isBlank(theirs[key]) || !isAiTranslatable(value, walk)) continue;
    if (walk.collect) addText(walk.collect, value, maxLength, { kind: "node", nodeId: node.id, key });
    const translated = walk.translations?.get(value.trim());
    if (translated && translated.trim() && translated.length <= maxLength) {
      theirs[key] = translated;
      changed = true;
      if (walk.applied) walk.applied.count += 1;
    }
  }
  if (!changed) return null;
  return { ...source, translations: { ...(source.translations ?? {}), [o]: theirs } };
}

function walkSection(instance: SectionInstance, walk: Walk): SectionInstance {
  if (!instance.componentTree?.length) return instance;
  const tree = instance.componentTree.map((node) => walkNode(node, walk));
  return tree.some((node, i) => node !== instance.componentTree![i]) ? { ...instance, componentTree: tree } : instance;
}

/** Adds a section's untranslated texts (tree sections only) to `into`. */
export function collectSectionUntranslated(instance: SectionInstance, ctx: AiTranslateContext, into: UntranslatedCollection): UntranslatedCollection {
  walkSection(instance, { ...ctx, collect: into });
  return into;
}

/** Adds a page's untranslated texts to `into`. */
export function collectPageUntranslated(content: PageContent, ctx: AiTranslateContext, into: UntranslatedCollection): UntranslatedCollection {
  for (const section of content.sections) walkSection(section, { ...ctx, collect: into });
  return into;
}

/** Adds a page name missing the other language to `into`. */
export function collectPageNameUntranslated(name: Partial<Localized>, ctx: AiTranslateContext, into: UntranslatedCollection): UntranslatedCollection {
  const value = name[ctx.defaultLocale];
  if (typeof value === "string" && isBlank(name[other(ctx.defaultLocale)]) && isAiTranslatable(value, ctx)) addText(into, value, PAGE_NAME_MAX, { kind: "pageName" });
  return into;
}

/**
 * The section with `translations` written into its EMPTY other-language
 * values (never over text that is there, never into the default language);
 * the same object when nothing changes.
 */
export function applySectionAiTranslations(
  instance: SectionInstance,
  ctx: AiTranslateContext & { translations: ReadonlyMap<string, string> },
): { instance: SectionInstance; applied: number } {
  const applied = { count: 0 };
  const next = walkSection(instance, { ...ctx, applied });
  return { instance: next, applied: applied.count };
}

/** A page's sections with `translations` applied (see `applySectionAiTranslations`). */
export function applyPageAiTranslations(
  content: PageContent,
  ctx: AiTranslateContext & { translations: ReadonlyMap<string, string> },
): { content: PageContent; applied: number } {
  let applied = 0;
  const sections = content.sections.map((section) => {
    const result = applySectionAiTranslations(section, ctx);
    applied += result.applied;
    return result.instance;
  });
  const changed = sections.some((section, i) => section !== content.sections[i]);
  return { content: changed ? { ...content, sections } : content, applied };
}

/** A page name with its empty other language filled from `translations`; null when nothing changes. */
export function applyPageNameAiTranslation(
  name: Partial<Localized>,
  ctx: AiTranslateContext & { translations: ReadonlyMap<string, string> },
): Partial<Localized> | null {
  const o = other(ctx.defaultLocale);
  const value = name[ctx.defaultLocale];
  if (typeof value !== "string" || !isBlank(name[o]) || !isAiTranslatable(value, ctx)) return null;
  const translated = ctx.translations.get(value.trim())?.trim();
  return translated && translated.length <= PAGE_NAME_MAX ? { ...name, [o]: translated } : null;
}

// ---------------------------------------------------------------------------
// Planning a run
// ---------------------------------------------------------------------------

export type AiTranslatePlan = {
  /** Texts for the model, in calls; each text appears once. */
  batches: UntranslatedText[][];
  /** Texts not sent this run: too long, or over the run caps or the calls allowed. */
  left: number;
  /** Of `left`: texts that fit the caps but not the calls allowed (the daily cap). */
  overCalls: number;
};

/**
 * Splits the texts that still need a model into batches within the caps, in
 * page order (the home page first). `maxCalls`: model calls allowed (the
 * daily cap left); texts beyond it count as left.
 */
export function planAiTranslationRun(texts: readonly UntranslatedText[], options: { maxCalls: number; limits?: AiTranslateLimits }): AiTranslatePlan {
  const limits = options.limits ?? AI_TRANSLATE_LIMITS;
  const batches: UntranslatedText[][] = [];
  let left = 0;
  let overCalls = 0;
  let sent = 0;
  let runChars = 0;
  let current: UntranslatedText[] = [];
  let currentChars = 0;
  const maxCalls = Math.max(0, Math.floor(options.maxCalls));
  for (const item of texts) {
    const size = item.text.length;
    if (size > limits.maxTextChars || sent >= limits.maxTexts || runChars + size > limits.maxRunChars) {
      left += 1;
      continue;
    }
    if (current.length && (current.length >= limits.batchTexts || currentChars + size > limits.batchChars)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    if (!current.length && batches.length >= maxCalls) {
      left += 1;
      overCalls += 1;
      continue;
    }
    current.push(item);
    currentChars += size;
    runChars += size;
    sent += 1;
  }
  if (current.length) batches.push(current);
  return { batches, left, overCalls };
}

// ---------------------------------------------------------------------------
// Checking what the model returns
// ---------------------------------------------------------------------------

const PLACEHOLDER_RE = /\{[^{}\s]{1,40}\}/g;
const TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"')]+|[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;
const AR_RE = /[؀-ۿ]/;
const LATIN_RE = /[A-Za-z]/;

const sorted = (values: Iterable<string>) => [...values].sort().join("\u0000");
const lineBreaks = (value: string) => (value.match(/\n/g) ?? []).length;

/**
 * The translation, trimmed, when it is safe to write: in the target script,
 * with the same `{placeholders}`, HTML tags, links/emails and line breaks as
 * the source, and within the field's limit; otherwise null (the text stays
 * untranslated and counts as left).
 */
export function acceptAiTranslation(source: string, translation: unknown, to: SiteLocale, maxLength: number): string | null {
  if (typeof translation !== "string") return null;
  const value = translation.trim();
  if (!value || value.length > maxLength || value === source.trim()) return null;
  if (to === "ar" ? !AR_RE.test(value) : !LATIN_RE.test(value) || AR_RE.test(value)) return null;
  if (sorted(source.match(PLACEHOLDER_RE) ?? []) !== sorted(value.match(PLACEHOLDER_RE) ?? [])) return null;
  const tags = (text: string) => [...text.matchAll(TAG_RE)].map((m) => `${m[0].startsWith("</") ? "/" : ""}${m[1]!.toLowerCase()}`);
  if (sorted(tags(source)) !== sorted(tags(value))) return null;
  const links = source.match(LINK_RE) ?? [];
  if (links.some((link) => !value.includes(link))) return null;
  if (lineBreaks(source.trim()) !== lineBreaks(value)) return null;
  return value;
}
