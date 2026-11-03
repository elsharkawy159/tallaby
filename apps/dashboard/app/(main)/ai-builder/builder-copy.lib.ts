import { PRIMARY_PROP } from "@workspace/store-sections/library-fields";
import type { ComponentNode, PageContent } from "@workspace/store-sections/config";
import type { BuilderSiteCopyOutput } from "./builder.dto";

/**
 * Filling a store's drafts with the seller's copy (rules 9 and 17). The model
 * sees numbered text slots and returns strings. Only code touches the tree: it
 * writes those strings into the text prop of nodes the template already has. No
 * model output can add a node or set a type, style, link or HTML. Pure.
 */

/** Text-bearing node types the seller reads as copy. Links, photos and form fields keep the template's values. */
const COPY_TYPES = new Set(["heading", "paragraph", "text", "badge", "listItem", "blockQuote", "textLink", "button", "accordionItem"]);
/** A data list's card is filled from store records. */
const LIST_TYPES = new Set(["productList", "categoryList", "postList"]);
/** Written by the template build (store name, initial, copyright). */
const COMPUTED_ROLES = new Set(["storeName", "storeInitial", "copyright"]);

export const COPY_LIMITS = { slots: 80, shortMax: 90, longMax: 320 } as const;

export type CopySlot = { id: string; type: string; ar: string; en: string; max: number };
export type CopyPage = { content: PageContent };

type Props = Record<string, unknown> & { translations?: Record<string, Record<string, unknown> | undefined> };

function slotProp(node: ComponentNode): string | null {
  if (!COPY_TYPES.has(node.type)) return null;
  const props = node.props as Props;
  const prop = PRIMARY_PROP[node.type];
  if (!prop || typeof props[prop] !== "string" || !(props[prop] as string).trim()) return null;
  if (typeof props.bind === "string") return null;
  if (typeof props.role === "string" && COMPUTED_ROLES.has(props.role)) return null;
  return prop;
}

/** Calls `visit` for each slot node, in a fixed order, so ids mean the same when reading and when writing. */
function walk(pages: readonly CopyPage[], visit: (node: ComponentNode, id: string, prop: string) => ComponentNode): CopyPage[] {
  let index = 0;
  const onNode = (node: ComponentNode): ComponentNode => {
    if (LIST_TYPES.has(node.type)) return node;
    const prop = slotProp(node);
    let next = node;
    if (prop && index < COPY_LIMITS.slots) next = visit(node, `t${index++}`, prop);
    return { ...next, children: next.children.map(onNode) };
  };
  return pages.map((page) => ({
    ...page,
    content: {
      ...page.content,
      sections: page.content.sections.map((section) => (section.componentTree ? { ...section, componentTree: section.componentTree.map(onNode) } : section)),
    },
  }));
}

const textOf = (props: Props, prop: string, locale: "ar" | "en", defaultLocale: "ar" | "en") => {
  const value = locale === defaultLocale ? props[prop] : props.translations?.[locale]?.[prop];
  return typeof value === "string" ? value : "";
};

/** The text slots of the drafts: what the model is shown, nothing else of the tree. */
export function collectCopySlots(pages: readonly CopyPage[], defaultLocale: "ar" | "en"): CopySlot[] {
  const slots: CopySlot[] = [];
  walk(pages, (node, id, prop) => {
    const props = node.props as Props;
    const ar = textOf(props, prop, "ar", defaultLocale);
    const en = textOf(props, prop, "en", defaultLocale);
    const longest = Math.max(ar.length, en.length);
    slots.push({ id, type: node.type, ar: ar.slice(0, 160), en: en.slice(0, 160), max: longest > 80 ? COPY_LIMITS.longMax : COPY_LIMITS.shortMax });
    return node;
  });
  return slots;
}

/** Plain text only, whatever the model returned. */
const plain = (value: string, max: number) => value.replace(/<[^>]*>/g, " ").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max).trim();

/** The model's strings → the drafts. An unknown id or an empty language is ignored and the node keeps its text. */
export function applyCopyValues<P extends CopyPage>(pages: readonly P[], output: BuilderSiteCopyOutput, defaultLocale: "ar" | "en"): { pages: P[]; applied: number } {
  const slots = new Map(collectCopySlots(pages, defaultLocale).map((slot) => [slot.id, slot]));
  const values = new Map(output.values.map((value) => [value.id, value]));
  const other = defaultLocale === "ar" ? "en" : "ar";
  let applied = 0;
  const next = walk(pages, (node, id, prop) => {
    const slot = slots.get(id);
    const value = values.get(id);
    if (!slot || !value) return node;
    const ar = plain(value.ar, slot.max);
    const en = plain(value.en, slot.max);
    if (!ar || !en) return node;
    applied++;
    const props = node.props as Props;
    const base = defaultLocale === "ar" ? ar : en;
    const translated = defaultLocale === "ar" ? en : ar;
    return {
      ...node,
      props: { ...props, [prop]: base, translations: { ...props.translations, [other]: { ...props.translations?.[other], [prop]: translated } } },
    };
  });
  return { pages: next as P[], applied };
}
