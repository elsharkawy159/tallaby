/**
 * The whole-site outline "Edit with AI" picks a section from (owner request
 * 2026-11-26): one short line per page section, the header and the footer,
 * with its id, name, kind, a one-line summary of its main text and whether it
 * shows a photo. Pure, capped (docs/ai.md rule 3), never catalog data: bound
 * elements are skipped.
 */
import type { ComponentNode, SectionInstance, SiteLocale } from "../config/schema";
import { getElementDefinition } from "../elements/registry";
import { codeSectionNode, sectionImageSrcs, textPropsOf } from "./section-ops";
import { promptText } from "./serialize";

export const MAX_SITE_OUTLINE_SECTIONS = 40;
const MAX_SUMMARY = 70;
const MAX_NAME = 60;

export type SiteOutlineEntry = { id: string; name: string; kind: "tree" | "code"; summary: string; hasImage: boolean };

type Bag = Record<string, unknown>;
const isBag = (v: unknown): v is Bag => v != null && typeof v === "object" && !Array.isArray(v);

function overlay(props: Bag, locale: SiteLocale, key: string): unknown {
  const translations = isBag(props.translations) ? props.translations : {};
  const forLocale = translations[locale];
  return isBag(forLocale) ? forLocale[key] : undefined;
}

/** The section's name: its tree root's name, else its code element's name, else its type. */
export function sectionDisplayName(section: SectionInstance, locale: SiteLocale): string {
  const root = section.componentTree?.[0];
  if (root && root.type !== "code") {
    const label = overlay(root.props ?? {}, locale, "label") ?? root.props?.label;
    if (typeof label === "string" && label.trim()) return label.trim().slice(0, MAX_NAME);
  }
  const code = codeSectionNode(section.componentTree);
  if (code && typeof code.props?.name === "string" && code.props.name.trim()) return code.props.name.trim().slice(0, MAX_NAME);
  return section.sectionId.slice(0, MAX_NAME);
}

/** The first text a visitor reads in the section, in the store's default language. */
function firstText(nodes: readonly ComponentNode[], defaultLocale: SiteLocale): string {
  for (const node of nodes) {
    if (node.type !== "code" && typeof node.props?.bind !== "string") {
      const def = getElementDefinition(node.type);
      for (const prop of def ? textPropsOf(def).keys() : []) {
        if (prop === "alt") continue;
        const value = node.props?.[prop];
        if (typeof value === "string" && value.replace(/<[^>]*>/g, "").trim()) return value;
      }
    }
    const inner = firstText(node.children ?? [], defaultLocale);
    if (inner) return inner;
  }
  return "";
}

function codeSummary(section: SectionInstance, defaultLocale: SiteLocale): string {
  const code = codeSectionNode(section.componentTree);
  const settings = isBag(code?.props?.settings) ? code.props.settings : {};
  for (const value of Object.values(settings)) {
    if (typeof value === "string" && value.trim() && !/^(https?:|\/|#)/.test(value)) return value;
    if (isBag(value) && typeof value[defaultLocale] === "string" && (value[defaultLocale] as string).trim()) return value[defaultLocale] as string;
  }
  return "";
}

export function siteOutlineEntry(section: SectionInstance, defaultLocale: SiteLocale): SiteOutlineEntry {
  const code = codeSectionNode(section.componentTree) !== null;
  return {
    id: section.id,
    name: sectionDisplayName(section, defaultLocale),
    kind: code ? "code" : "tree",
    summary: (code ? codeSummary(section, defaultLocale) : firstText(section.componentTree ?? [], defaultLocale)).slice(0, 400),
    hasImage: sectionImageSrcs(section).size > 0,
  };
}

/** The page's sections, at most `MAX_SITE_OUTLINE_SECTIONS`. */
export function siteOutline(sections: readonly SectionInstance[], defaultLocale: SiteLocale): SiteOutlineEntry[] {
  return sections.slice(0, MAX_SITE_OUTLINE_SECTIONS).map((s) => siteOutlineEntry(s, defaultLocale));
}

const line = (label: string, e: SiteOutlineEntry) =>
  `${label} ${e.id} | ${promptText(e.name, MAX_NAME)} | ${e.kind} | photo: ${e.hasImage ? "yes" : "no"} | ${promptText(e.summary, MAX_SUMMARY) || '""'}`;

/** One line per section for the target pick: `index. id | name | kind | photo | "first text"`, then the header and the footer. */
export function serializeSiteOutline(input: { page: readonly SiteOutlineEntry[]; header: SiteOutlineEntry | null; footer: SiteOutlineEntry | null }): string {
  const lines: string[] = [];
  if (input.header) lines.push(line("HEADER", input.header));
  input.page.forEach((entry, i) => lines.push(line(`${i}.`, entry)));
  if (input.footer) lines.push(line("FOOTER", input.footer));
  return lines.join("\n") || "(empty site)";
}
