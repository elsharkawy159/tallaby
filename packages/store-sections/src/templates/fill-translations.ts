/**
 * "Fill missing translations" (builder › More): fills the language a store's
 * saved text is missing, from the code templates and section designs it came
 * from, never from AI (free) and never over text the seller wrote.
 *
 * Every template and design is written in both languages, but a store keeps
 * its own copy, which can hold one language only for template text: a store
 * whose default language changed before the content was rebased
 * (`config/locale-rebase.ts`), text the seller wiped in one language, an
 * element's Arabic placeholder. For each translatable text of every tree node
 * (`fields` with `translatable`) this:
 *
 * 1. repairs text stored on the wrong side: the default language's slot
 *    holds the other language while the default's own text sits in an
 *    overlay for the default (a store whose default language changed while
 *    the content kept its old base); the two swap;
 * 2. replaces default-language text that is in the other language with its
 *    code translation (the original moves into the other language's overlay);
 * 3. fills a missing (or wrong-script) overlay of the other language with the
 *    code translation of the default-language text.
 *
 * A translation is found by the exact text: first among the pairs of the
 * section's own design (`source`), then among every design and template
 * (skipped when two sources translate the same text differently). Text with
 * no match is left as it is; Arabic text with no English is counted as
 * `missing` (Latin text without Arabic is often a brand or product name).
 * Pure; the dictionary is built once per process.
 */
import type { ComponentNode, PageContent, SectionInstance, SiteLocale } from "../config/schema";
import type { Localized } from "../core/types";
import { DESIGNS, treeBuilder } from "../designs";
import { ELEMENT_PLACEHOLDERS } from "../elements/placeholders";
import { ELEMENT_DEFINITIONS, getElementDefinition } from "../elements/registry";
import type { NodeTemplate } from "../elements/tree";
import { CODE_TEMPLATES } from "./catalog";
import { editionReadyLooks, editionsForLook, templateWithEdition } from "./editions";
import { sourceDesignId } from "./essentials";
import type { TemplateDefinition } from "./types";

type Direction = Map<string, string | null>;
/**
 * `firstWins`: a design's own pairs keep the first translation of a text (a
 * niche edition can reword only the English of the same Arabic copy, and either
 * reads right); anywhere else two translations of one text cancel out.
 */
type Pairs = { arToEn: Direction; enToAr: Direction; firstWins?: boolean };
/** `placeholders`: the elements' default text, looked up last (a short word like "جديد" means more than one thing in templates). */
export type TranslationDictionary = { byDesign: Map<string, Pairs>; all: Pairs; pageNames: Pairs; placeholders: Pairs };
export type FillStats = { filled: number; repaired: number; missing: number };

type Overlays = Partial<Record<SiteLocale, Record<string, unknown>>>;
type Props = Record<string, unknown> & { translations?: Overlays };
type TreeNode = Pick<NodeTemplate, "type" | "props"> & { children?: readonly TreeNode[] };

const AR = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;

/** The language a text is written in; `neutral` for numbers, codes, emails and emoji. */
export function textScript(text: string): SiteLocale | "neutral" {
  if (AR.test(text)) return "ar";
  return LATIN.test(text) ? "en" : "neutral";
}

const other = (locale: SiteLocale): SiteLocale => (locale === "ar" ? "en" : "ar");

const emptyPairs = (firstWins = false): Pairs => ({ arToEn: new Map(), enToAr: new Map(), firstWins });

function addOne(direction: Direction, from: string, to: string, firstWins = false) {
  const known = direction.get(from);
  if (known === undefined) direction.set(from, to);
  else if (!firstWins && known !== null && known !== to) direction.set(from, null);
}

/**
 * The same text can read differently in one design ("الأقسام" is "Categories"
 * as an eyebrow and "Departments" as the title), so each pair is also kept
 * under a key qualified by what the node is (its role, else its type, and
 * the prop), looked up first.
 */
const qualified = (slot: string, text: string) => `\u0000${slot}\u0000${text}`;

function addPair(pairs: Pairs, ar: string, en: string, slot?: string) {
  const a = ar.trim();
  const e = en.trim();
  if (!a || !e || a === e || textScript(e) === "ar") return;
  addOne(pairs.arToEn, a, e, pairs.firstWins);
  addOne(pairs.enToAr, e, a, pairs.firstWins);
  if (slot) {
    addOne(pairs.arToEn, qualified(slot, a), e, pairs.firstWins);
    addOne(pairs.enToAr, qualified(slot, e), a, pairs.firstWins);
  }
}

/** What a node's text is, for the qualified key. */
const slotOf = (type: string, role: unknown, key: string) => `${typeof role === "string" && role ? role : type}.${key}`;

/**
 * Within one design, the same text in the same kind of node can still read
 * differently ("قريبًا" as "Coming soon" and "Soon"): its pairs are also kept
 * by place, the nth node of that kind in tree order, which a store's copy
 * keeps unless the seller rearranged the section.
 */
const placed = (n: number, slot: string, text: string) => `\u0001${n}${qualified(slot, text)}`;

/** The next place of a kind of node in a tree walk (1-based). */
function nextPlace(counts: Map<string, number>, slot: string): number {
  const n = (counts.get(slot) ?? 0) + 1;
  counts.set(slot, n);
  return n;
}

/** The translatable text props of an element type, and its Layers name (`label`, written in both languages too). */
function textKeys(type: string): string[] {
  const definition = getElementDefinition(type);
  if (!definition) return [];
  return [...definition.fields.filter((field) => field.translatable).map((field) => field.key), "label"];
}

/**
 * Pairs of a tree written Arabic-first (`props` Arabic, `translations.en`
 * English), as code designs are; `own`: the design's pairs, which also get the
 * pairs by place (`counts`: one per tree).
 */
function collectTree(node: TreeNode, into: Pairs[], own?: { pairs: Pairs; counts: Map<string, number> }) {
  const props = (node.props ?? {}) as Props;
  for (const key of textKeys(node.type)) {
    const ar = props[key];
    if (typeof ar !== "string") continue;
    const slot = slotOf(node.type, props.role, key);
    const n = own ? nextPlace(own.counts, slot) : 0;
    const en = props.translations?.en?.[key];
    if (typeof en !== "string") continue;
    for (const pairs of into) addPair(pairs, ar, en, slot);
    if (own && ar.trim() && en.trim() && ar.trim() !== en.trim() && textScript(en) !== "ar") {
      addOne(own.pairs.arToEn, placed(n, slot, ar.trim()), en.trim(), true);
      addOne(own.pairs.enToAr, placed(n, slot, en.trim()), ar.trim(), true);
    }
  }
  for (const child of node.children ?? []) collectTree(child, into, own);
}

function collectTemplate(template: TemplateDefinition, dictionary: TranslationDictionary, designPairs: (id: string) => Pairs) {
  const config = template.config();
  const sections = [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s): s is SectionInstance => s !== null);
  for (const section of sections) {
    const id = sourceDesignId(section);
    const own = id ? { pairs: designPairs(id), counts: new Map<string, number>() } : undefined;
    for (const node of section.componentTree ?? []) collectTree(node, own ? [own.pairs, dictionary.all] : [dictionary.all], own);
  }
  for (const name of Object.values(template.pageNames)) if (name.ar && name.en) addPair(dictionary.pageNames, name.ar, name.en);
}

function buildDictionary(): TranslationDictionary {
  const dictionary: TranslationDictionary = { byDesign: new Map(), all: emptyPairs(), pageNames: emptyPairs(), placeholders: emptyPairs() };
  const designPairs = (id: string) => {
    let pairs = dictionary.byDesign.get(id);
    if (!pairs) dictionary.byDesign.set(id, (pairs = emptyPairs(true)));
    return pairs;
  };
  for (const design of DESIGNS) collectTree(design.tree(treeBuilder), [designPairs(design.id), dictionary.all], { pairs: designPairs(design.id), counts: new Map() });
  for (const template of CODE_TEMPLATES) collectTemplate(template, dictionary, designPairs);
  for (const look of editionReadyLooks()) {
    for (const edition of editionsForLook(look)) {
      const built = templateWithEdition(look, edition.niche);
      if (built) collectTemplate(built, dictionary, designPairs);
    }
  }
  for (const definition of ELEMENT_DEFINITIONS) collectTree({ type: definition.type, props: definition.defaultProps as NodeTemplate["props"] }, [dictionary.placeholders]);
  for (const [ar, en] of ELEMENT_PLACEHOLDERS) addPair(dictionary.placeholders, ar, en);
  addPair(dictionary.pageNames, "الرئيسية", "Home");
  return dictionary;
}

let cached: TranslationDictionary | undefined;

/** Every Arabic ↔ English pair the code templates and designs hold (built once). */
export function codeTranslationDictionary(): TranslationDictionary {
  return (cached ??= buildDictionary());
}

function lookup(dictionary: TranslationDictionary, designId: string | null, slot: string, place: number, text: string, from: SiteLocale): string | undefined {
  const key = text.trim();
  const direction = (pairs: Pairs | undefined) => (from === "ar" ? pairs?.arToEn : pairs?.enToAr);
  const own = designId ? direction(dictionary.byDesign.get(designId)) : undefined;
  // Latin text is looked up in its own design only: elsewhere "VISA" may be "فيزا", and a brand reads the same.
  const all = from === "ar" ? direction(dictionary.all) : undefined;
  return (
    own?.get(placed(place, slot, key)) ??
    own?.get(qualified(slot, key)) ??
    own?.get(key) ??
    all?.get(qualified(slot, key)) ??
    all?.get(key) ??
    direction(dictionary.placeholders)!.get(key) ??
    undefined
  );
}

const COPYRIGHT_AR = /^© ([٠-٩]+) (.+)\. كل الحقوق محفوظة\.$/;
const COPYRIGHT_EN = /^© (\d+) (.+)\. All rights reserved\.$/;
const toLatinDigits = (value: string) => value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
const toArabicDigits = (value: string) => value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);

/** The copyright line (`role: copyright`, `templates/prepare.ts`) in the other language. */
function copyrightIn(text: string, to: SiteLocale): string | undefined {
  if (to === "en") {
    const match = COPYRIGHT_AR.exec(text.trim());
    return match ? `© ${toLatinDigits(match[1]!)} ${match[2]}. All rights reserved.` : undefined;
  }
  const match = COPYRIGHT_EN.exec(text.trim());
  return match ? `© ${toArabicDigits(match[1]!)} ${match[2]}. كل الحقوق محفوظة.` : undefined;
}

/** A store's own name (`storeName` / `storeInitial`) reads the same in both languages. */
const NAME_ROLES = new Set(["storeName", "storeInitial"]);

/** `places`: the kinds of node seen so far in the section, in tree order (`placed`). */
type FillContext = { defaultLocale: SiteLocale; dictionary: TranslationDictionary; designId: string | null; stats: FillStats; places: Map<string, number> };

function translate(ctx: FillContext, slot: { name: string; place: number; role: unknown }, text: string, from: SiteLocale): string | undefined {
  const found = lookup(ctx.dictionary, ctx.designId, slot.name, slot.place, text, from);
  return found ?? (slot.role === "copyright" ? copyrightIn(text, other(from)) : undefined);
}

function fillNode(node: ComponentNode, ctx: FillContext): ComponentNode {
  const keys = textKeys(node.type);
  // The node's own text first, then its children: the same tree order as `collectTree`.
  const own = keys.length ? fillProps(node, keys, ctx) : null;
  const children = node.children.map((child) => fillNode(child, ctx));
  const childrenChanged = children.some((child, i) => child !== node.children[i]);
  if (!own && !childrenChanged) return node;
  return { ...node, ...(own && { props: own }), children };
}

/** The node's props with its missing language filled; null when nothing changes. */
function fillProps(node: ComponentNode, keys: readonly string[], ctx: FillContext): ComponentNode["props"] | null {
  let changed = false;
  const source = node.props as Props;
  // The store's name is never translated, only moved to the right side.
  const isName = NAME_ROLES.has(source.role as string);

  const d = ctx.defaultLocale;
  const o = other(d);
  const props: Props = { ...source };
  const overlays: Overlays = { ...(source.translations ?? {}) };
  const own: Record<string, unknown> = { ...(overlays[d] ?? {}) };
  const theirs: Record<string, unknown> = { ...(overlays[o] ?? {}) };

  for (const key of keys) {
    const raw = props[key];
    if (typeof raw !== "string") continue;
    let value: string = raw;
    const name = slotOf(node.type, source.role, key);
    const slot = { name, place: nextPlace(ctx.places, name), role: source.role };
    if (!value.trim()) continue;
    const stored = own[key];
    // 1. The default's text sits in an overlay for the default (nothing writes one but a
    // store whose default changed while its content kept the old base), the old default's
    // text in props. Text the seller has since rewritten in the default language stays.
    if (typeof stored === "string" && stored.trim() && stored !== value && textScript(value) !== d && textScript(stored) !== o) {
      if (theirs[key] === undefined) theirs[key] = value;
      props[key] = stored;
      delete own[key];
      value = stored;
      ctx.stats.repaired += 1;
      changed = true;
    }
    // 2. An English store's text written in Arabic (Latin text in an Arabic store is often a brand: kept).
    const fixed = isName && key !== "label";
    if (!fixed && d === "en" && textScript(value) === o) {
      const translated = translate(ctx, slot, value, o);
      if (translated) {
        if (theirs[key] === undefined) theirs[key] = value;
        props[key] = translated;
        value = translated;
        ctx.stats.filled += 1;
        changed = true;
      } else if (o === "ar") ctx.stats.missing += 1;
    }
    // 3. The other language is missing (or holds the default's language).
    const current = theirs[key];
    const lacking = typeof current !== "string" || !current.trim() || textScript(current) === d;
    // Symbols too: a breadcrumb's "‹" is "›" in English.
    const script = textScript(value);
    if (!fixed && lacking && script !== o) {
      const translated = translate(ctx, slot, value, d);
      if (translated) {
        theirs[key] = translated;
        ctx.stats.filled += 1;
        changed = true;
      } else if (d === "ar" && script === "ar") ctx.stats.missing += 1;
    }
  }
  if (!changed) return null;
  const next: Overlays = { ...overlays, [o]: theirs, [d]: own };
  for (const locale of [d, o]) if (!Object.keys(next[locale] ?? {}).length) delete next[locale];
  delete props.translations;
  return { ...props, ...(Object.keys(next).length && { translations: next }) };
}

/** One section with its missing language filled from the code templates (tree sections only). */
export function fillSectionTranslations(
  instance: SectionInstance,
  opts: { defaultLocale: SiteLocale; dictionary?: TranslationDictionary; stats?: FillStats },
): { instance: SectionInstance; stats: FillStats } {
  const stats = opts.stats ?? { filled: 0, repaired: 0, missing: 0 };
  if (!instance.componentTree?.length) return { instance, stats };
  const ctx: FillContext = { defaultLocale: opts.defaultLocale, dictionary: opts.dictionary ?? codeTranslationDictionary(), designId: sourceDesignId(instance), stats, places: new Map() };
  const tree = instance.componentTree.map((node) => fillNode(node, ctx));
  const changed = tree.some((node, i) => node !== instance.componentTree![i]);
  return { instance: changed ? { ...instance, componentTree: tree } : instance, stats };
}

/** A page's sections with their missing language filled. */
export function fillPageTranslations(
  content: PageContent,
  opts: { defaultLocale: SiteLocale; dictionary?: TranslationDictionary; stats?: FillStats },
): { content: PageContent; stats: FillStats } {
  const stats = opts.stats ?? { filled: 0, repaired: 0, missing: 0 };
  const sections = content.sections.map((section) => fillSectionTranslations(section, { ...opts, stats }).instance);
  const changed = sections.some((section, i) => section !== content.sections[i]);
  return { content: changed ? { ...content, sections } : content, stats };
}

/** A page name with its missing language filled from the templates' page names; null when nothing changes. */
export function fillPageName(name: Partial<Localized>, dictionary: TranslationDictionary = codeTranslationDictionary()): Partial<Localized> | null {
  const ar = name.ar?.trim();
  const en = name.en?.trim();
  if (ar && !en) {
    const found = dictionary.pageNames.arToEn.get(ar) ?? dictionary.all.arToEn.get(ar);
    return found ? { ...name, en: found } : null;
  }
  if (en && !ar) {
    const found = dictionary.pageNames.enToAr.get(en) ?? dictionary.all.enToAr.get(en);
    return found ? { ...name, ar: found } : null;
  }
  return null;
}
