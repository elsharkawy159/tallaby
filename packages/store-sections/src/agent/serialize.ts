/**
 * The compact text the editor agent's model reads about the page (ROADMAP
 * F-83c): the targeted section and an outline of the page, each capped
 * (docs/ai.md rule 3). Pure. Never includes catalog or product data: bound
 * elements show their field, not the record.
 *
 * - A tree section: one line per element, indented by depth:
 *   `n-12 heading field=title text="…"|en="…" link=/x style: fontSize=4xl | mobile: fontSize=2xl`.
 * - A code section: the joined file and the current values (≤ 24 KB).
 */
import type { ComponentNode, SectionInstance, SiteLocale } from "../config/schema";
import { capUtf8, normalizeCodeNodeProps, utf8Length } from "../code/code-node";
import { joinSectionFile } from "../code/section-file";
import { getElementDefinition } from "../elements/registry";
import { normalizeStyle } from "../elements/style";
import { findCodeNode, textPropsOf } from "./section-ops";

export const MAX_TREE_PROMPT_BYTES = 12 * 1024;
export const MAX_CODE_PROMPT_BYTES = 24 * 1024;
export const MAX_OUTLINE_SECTIONS = 30;
const MAX_TEXT_IN_PROMPT = 160;
const MAX_VALUES_BYTES = 4 * 1024;

type Bag = Record<string, unknown>;
const isBag = (v: unknown): v is Bag => v != null && typeof v === "object" && !Array.isArray(v);

/** One line of text for the prompt: no newlines, capped, quotes kept readable. */
export function promptText(value: unknown, max = MAX_TEXT_IN_PROMPT): string {
  if (typeof value !== "string") return "";
  const flat = value.replace(/<[^>]{0,200}>/g, " ").replace(/\s+/g, " ").trim();
  return JSON.stringify(flat.length > max ? `${flat.slice(0, max)}…` : flat);
}

function styleText(style: unknown): string {
  const clean = normalizeStyle(style) as Bag;
  return Object.entries(clean)
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" ");
}

function nodeLine(node: ComponentNode, depth: number, defaultLocale: SiteLocale): string {
  const parts = [`${"  ".repeat(depth)}- ${node.id} ${node.type}`];
  const props = node.props ?? {};
  if (typeof props.field === "string") parts.push(`field=${props.field}`);
  const label = typeof props.label === "string" && node.type !== "button" ? props.label : "";
  if (label) parts.push(`name=${promptText(label, 40)}`);
  if (typeof props.bind === "string") parts.push(`bound=${props.bind} (shows store data; can't edit its text)`);
  else if (node.type !== "code") {
    const def = getElementDefinition(node.type);
    const other: SiteLocale = defaultLocale === "ar" ? "en" : "ar";
    const translations = isBag(props.translations) ? (props.translations as Record<string, Bag>) : {};
    for (const prop of def ? textPropsOf(def).keys() : []) {
      const main = props[prop];
      const second = translations[other]?.[prop];
      if (typeof main !== "string" && typeof second !== "string") continue;
      parts.push(`${prop}: ${defaultLocale}=${promptText(main)} ${other}=${promptText(second)}`);
    }
    if (typeof props.href === "string" && def?.fields.some((f) => f.key === "href")) parts.push(`href=${promptText(props.href, 120)}`);
  }
  const base = styleText(node.style);
  if (base) parts.push(`style: ${base}`);
  for (const [device, value] of Object.entries(node.breakpointStyles ?? {})) {
    const text = styleText(value);
    if (text) parts.push(`| ${device}: ${text}`);
  }
  if (node.customCss) parts.push(`customCss=${promptText(node.customCss, 200)}`);
  return parts.join(" ");
}

/** A tree section as indented element lines, at most `MAX_TREE_PROMPT_BYTES`. */
export function serializeTreeSection(section: SectionInstance, defaultLocale: SiteLocale): string {
  const lines: string[] = [`TREE SECTION ${section.id}`];
  if (section.customCss) lines.push(`section customCss=${promptText(section.customCss, 200)}`);
  let bytes = utf8Length(lines.join("\n"));
  let left = 0;
  const walk = (nodes: readonly ComponentNode[], depth: number) => {
    for (const node of nodes) {
      const line = nodeLine(node, depth, defaultLocale);
      const size = utf8Length(line) + 1;
      if (bytes + size > MAX_TREE_PROMPT_BYTES - 80) {
        left += 1 + countAll(node.children);
        continue;
      }
      bytes += size;
      lines.push(line);
      walk(node.children, depth + 1);
    }
  };
  walk(section.componentTree ?? [], 0);
  if (left) lines.push(`… ${left} more elements not shown`);
  return lines.join("\n");
}

function countAll(nodes: readonly ComponentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countAll(n.children), 0);
}

/** A code section: its joined file and current values, at most `MAX_CODE_PROMPT_BYTES`; `truncated` when the file didn't fit. */
export function serializeCodeSection(section: SectionInstance): { text: string; truncated: boolean } {
  const node = findCodeNode(section.componentTree);
  if (!node) return { text: serializeTreeSection(section, "ar"), truncated: false };
  const props = normalizeCodeNodeProps(node.props).props;
  const file = joinSectionFile({ source: props.source, css: props.css ?? "", schema: props.schema });
  const values = capUtf8(JSON.stringify({ settings: props.settings, blocks: props.blocks }), MAX_VALUES_BYTES);
  const head = `CODE SECTION ${section.id} (code element ${node.id}${props.name ? `, name ${promptText(props.name, 60)}` : ""})`;
  const budget = MAX_CODE_PROMPT_BYTES - utf8Length(head) - utf8Length(values) - 200;
  const truncated = utf8Length(file) > budget;
  const shown = truncated ? capUtf8(file, Math.max(budget, 0)) : file;
  const text = [
    head,
    "--- file ---",
    shown,
    ...(truncated ? ["--- the file is cut here: it is too long to show. Don't rewrite it; change only settings or blocks. ---"] : []),
    "--- current values (the seller's; keep their setting ids) ---",
    values,
  ].join("\n");
  return { text, truncated };
}

export function isCodeSection(section: SectionInstance): boolean {
  return findCodeNode(section.componentTree) !== null;
}

export type OutlineEntry = { id: string; name: string; kind: string };

/** At most `MAX_OUTLINE_SECTIONS` lines, centred on the targeted section when the page is longer. */
export function serializeOutline(outline: readonly OutlineEntry[], targetId?: string): string {
  let list = outline;
  let offset = 0;
  if (outline.length > MAX_OUTLINE_SECTIONS) {
    const at = Math.max(0, outline.findIndex((s) => s.id === targetId));
    offset = Math.min(Math.max(0, at - Math.floor(MAX_OUTLINE_SECTIONS / 2)), outline.length - MAX_OUTLINE_SECTIONS);
    list = outline.slice(offset, offset + MAX_OUTLINE_SECTIONS);
  }
  const lines = list.map((s, i) => `${offset + i}. ${s.id} | ${promptText(s.name, 60)} | ${promptText(s.kind, 20)}${s.id === targetId ? " ← targeted" : ""}`);
  if (offset > 0) lines.unshift(`(${offset} sections above not shown)`);
  const below = outline.length - offset - list.length;
  if (below > 0) lines.push(`(${below} sections below not shown)`);
  return lines.join("\n");
}
