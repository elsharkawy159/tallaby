/**
 * The phone menu sheet's items (owner, F-74): the burger sheet lists copies of
 * the header's menu links (`withMobileMenu`, `config/header.ts`); the seller
 * reorders them, renames them, hides some and adds store pages from the
 * builder (header › Content › Mobile menu). Stored on the header instance as
 * `props.mobileMenu`, a draft until Publish like every header option, so no
 * migration. Only the differences are stored, keyed by the copies' ids (which
 * follow the header's own link nodes), so a link added to the header's menu
 * later still shows up, at the end. A header without the prop draws today's
 * sheet exactly.
 */
import type { ComponentNode, SectionInstance } from "./schema";

export const MOBILE_MENU_PROP = "mobileMenu";
export const MOBILE_MENU_MAX_ADDED = 12;

export type MobileMenuLabel = { ar?: string; en?: string };
/** A link the seller added to the sheet (a store page or a fixed place). */
export type MobileMenuLink = { id: string; href: string; label: MobileMenuLabel };
export type MobileMenuConfig = {
  /** Item ids in the seller's order; items not listed follow in their own order. */
  order: string[];
  hidden: string[];
  labels: Record<string, MobileMenuLabel>;
  added: MobileMenuLink[];
};

/** One row of the sheet as the builder lists it. */
export type MobileMenuEntry = { id: string; href: string; label: string; hidden: boolean; added: boolean; renamed: boolean };

type Node = ComponentNode;

const ID = /^[\w-]{1,160}$/;
/** Store paths only: `/`, `/about`, `/profile/orders`. */
const PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const TEXT_TYPES = new Set(["text", "heading", "paragraph", "span"]);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const cleanText = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 60) : "");
const ids = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string" && ID.test(v)))].slice(0, 60) : []);

function readLabel(value: unknown): MobileMenuLabel {
  const out: MobileMenuLabel = {};
  if (!isRecord(value)) return out;
  for (const locale of ["ar", "en"] as const) {
    const text = cleanText(value[locale]);
    if (text) out[locale] = text;
  }
  return out;
}

export const EMPTY_MOBILE_MENU: MobileMenuConfig = { order: [], hidden: [], labels: {}, added: [] };

/** The seller's sheet settings (never trusts the stored value: bad ids, paths and labels are dropped). */
export function readMobileMenu(header: SectionInstance | null | undefined): MobileMenuConfig {
  const raw = header?.props[MOBILE_MENU_PROP];
  if (!isRecord(raw)) return EMPTY_MOBILE_MENU;
  const labels: Record<string, MobileMenuLabel> = {};
  if (isRecord(raw.labels)) {
    for (const [id, value] of Object.entries(raw.labels).slice(0, 60)) {
      const label = readLabel(value);
      if (ID.test(id) && (label.ar || label.en)) labels[id] = label;
    }
  }
  const added: MobileMenuLink[] = [];
  if (Array.isArray(raw.added)) {
    for (const value of raw.added) {
      if (!isRecord(value) || typeof value.id !== "string" || !ID.test(value.id) || typeof value.href !== "string" || !PATH.test(value.href)) continue;
      if (added.some((link) => link.id === value.id)) continue;
      const label = readLabel(value.label);
      if (!label.ar && !label.en) continue;
      added.push({ id: value.id, href: value.href, label });
      if (added.length === MOBILE_MENU_MAX_ADDED) break;
    }
  }
  return { order: ids(raw.order), hidden: ids(raw.hidden), labels, added };
}

/** The header with these settings; the prop is dropped when nothing differs from the default sheet. */
export function setMobileMenu(header: SectionInstance, config: MobileMenuConfig): SectionInstance {
  const { [MOBILE_MENU_PROP]: _, ...props } = header.props;
  const clean = readMobileMenu({ ...header, props: { [MOBILE_MENU_PROP]: config } });
  const empty = !clean.order.length && !clean.hidden.length && !Object.keys(clean.labels).length && !clean.added.length;
  return empty ? { ...header, props } : { ...header, props: { ...props, [MOBILE_MENU_PROP]: clean } };
}

/** A link's text in `locale` (its translation overlay, else its own text), as the renderer shows it. */
export function linkText(node: Node, locale: string): string {
  const own = (n: Node) => {
    const overlay = (n.props.translations as Record<string, Record<string, unknown>> | undefined)?.[locale]?.text;
    return cleanText(typeof overlay === "string" ? overlay : n.props.text);
  };
  if (node.type === "textLink") return own(node);
  const walk = (list: readonly Node[]): string => {
    for (const child of list) {
      const text = TEXT_TYPES.has(child.type) ? own(child) : walk(child.children);
      if (text) return text;
    }
    return "";
  };
  return walk(node.children);
}

const pick = (label: MobileMenuLabel | undefined, locale: string) => (locale === "en" ? label?.en : label?.ar) || "";

/** The link with its first text replaced (the other language's overlay goes too: the label is per language already). */
function relabel(node: Node, text: string): Node {
  const setText = (n: Node): Node => {
    const { translations: _, ...props } = n.props;
    return { ...n, props: { ...props, text } };
  };
  if (node.type === "textLink") return setText(node);
  let done = false;
  const walk = (list: Node[]): Node[] =>
    list.map((child) => {
      if (done) return child;
      if (TEXT_TYPES.has(child.type)) {
        done = true;
        return setText(child);
      }
      return { ...child, children: walk(child.children) };
    });
  const children = walk(node.children);
  return done ? { ...node, children } : { ...node, children: [...node.children, { id: `${node.id}-label`, type: "text", props: { text }, children: [] }] };
}

type Item = { id: string; node: Node; added: boolean };

function orderedItems(links: readonly Node[], config: MobileMenuConfig, locale: string, prefix: string): Item[] {
  const added = config.added.map((link) => ({
    id: link.id,
    added: true,
    node: {
      id: `${prefix}-mma-${link.id}`,
      type: "linkBlock" as const,
      props: { href: link.href },
      children: [{ id: `${prefix}-mma-${link.id}-t`, type: "text" as const, props: { text: pick(link.label, locale) || link.label.ar || link.label.en || "" }, children: [] }],
    },
  }));
  const all: Item[] = [...links.map((node) => ({ id: node.id, node, added: false })), ...added];
  const byId = new Map(all.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const id of config.order) {
    const item = byId.get(id);
    if (item && !seen.has(id)) {
      seen.add(id);
      out.push(item);
    }
  }
  for (const item of all) if (!seen.has(item.id)) out.push(item);
  return out;
}

/** The sheet's links with the seller's order, names, hidden items and added pages applied. */
export function applyMobileMenu(links: readonly Node[], config: MobileMenuConfig, locale: string, prefix: string): Node[] {
  if (config === EMPTY_MOBILE_MENU) return [...links];
  const hidden = new Set(config.hidden);
  return orderedItems(links, config, locale, prefix)
    .filter((item) => !hidden.has(item.id))
    .map(({ id, node }) => {
      const label = pick(config.labels[id], locale);
      return label ? relabel(node, label) : node;
    });
}

/** Every row of the sheet for the builder, hidden ones included, in the order the sheet shows them. */
export function mobileMenuEntries(links: readonly Node[], config: MobileMenuConfig, locale: string, prefix: string): MobileMenuEntry[] {
  const hidden = new Set(config.hidden);
  return orderedItems(links, config, locale, prefix).map(({ id, node, added }) => {
    const label = pick(config.labels[id], locale);
    return {
      id,
      href: typeof node.props.href === "string" ? node.props.href : "",
      label: label || linkText(node, locale),
      hidden: hidden.has(id),
      added,
      renamed: Boolean(label) && !added,
    };
  });
}
