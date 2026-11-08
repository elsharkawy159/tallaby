import type { ComponentNode, PageContent, SectionInstance } from "@workspace/store-sections/config";
import { derivePaletteFromPrimary, isValidHex, type DesignSystemColors, type PaletteNote } from "@workspace/store-sections/palette";
import { collectCopySlots } from "./builder-copy.lib";

/**
 * The v2 build's code-only steps (ROADMAP.md F-82j): the brand palette, stock
 * photos for the hero and about, and the quality gates before publishing.
 * Pure. Everything here changes only values the template already has: an
 * image's `src`, the section's own per-device `hidden` style (the editor's Hide
 * switch), and the design system's colours. It never adds a node.
 */

export type CheckPage = { id: string; slug: string; isHome: boolean; draftVersion: number; content: PageContent };

// ── Brand ───────────────────────────────────────────────────────────────────

/** The template's colours wearing the seller's primary (spec §6.1). Null when there is no usable colour: the template's own stay. */
export function brandColors(base: DesignSystemColors, primary: string | null): { colors: DesignSystemColors; notes: PaletteNote[] } | null {
  if (!primary || !isValidHex(primary)) return null;
  const derived = derivePaletteFromPrimary(primary, base);
  return { colors: derived.colors, notes: derived.notes };
}

// ── Trees ───────────────────────────────────────────────────────────────────

const LIST_TYPES = new Set(["productList", "categoryList", "postList"]);

function visit(nodes: readonly ComponentNode[] | undefined, fn: (node: ComponentNode, inList: boolean) => void, inList = false) {
  for (const node of nodes ?? []) {
    fn(node, inList);
    visit(node.children, fn, inList || LIST_TYPES.has(node.type));
  }
}

function mapNodes(nodes: readonly ComponentNode[], fn: (node: ComponentNode) => ComponentNode): ComponentNode[] {
  return nodes.map((node) => {
    const next = fn(node);
    return { ...next, children: mapNodes(next.children, fn) };
  });
}

// ── Empty product sections (D3) ─────────────────────────────────────────────

export type DataCounts = { liveProducts: number; categories: number };

/** A section shows nothing: a product list with no live products, a category list with none, or a list bound to the Nth category the store hasn't got. */
export function sectionIsEmpty(section: SectionInstance, counts: DataCounts): boolean {
  let empty = false;
  visit(section.componentTree, (node) => {
    const props = (node.props ?? {}) as Record<string, unknown>;
    if (node.type === "productList") {
      if (counts.liveProducts === 0) empty = true;
      const index = props.categoryIndex;
      if (props.source === "category" && typeof index === "number" && index > counts.categories) empty = true;
    }
    if (node.type === "categoryList" && (counts.categories === 0 || counts.liveProducts === 0)) empty = true;
  });
  return empty;
}

const HIDDEN = { hidden: true } as const;

/** The section's root hidden on every device (desktop, tablet, phone), as the editor's Hide does. */
function hideRoot(section: SectionInstance): SectionInstance {
  const [root, ...rest] = section.componentTree ?? [];
  if (!root) return section;
  const bp = root.breakpointStyles ?? {};
  return {
    ...section,
    componentTree: [
      {
        ...root,
        style: { ...root.style, ...HIDDEN },
        breakpointStyles: { ...bp, tablet: { ...bp.tablet, ...HIDDEN }, mobile: { ...bp.mobile, ...HIDDEN } },
      },
      ...rest,
    ],
  };
}

/** Hides each section with nothing to show (never demo products, D3). Returns only the pages it changed. */
export function hideEmptyDataSections<P extends CheckPage>(pages: readonly P[], counts: DataCounts): { pages: P[]; hidden: number } {
  let hidden = 0;
  const changed: P[] = [];
  for (const page of pages) {
    let touched = false;
    const sections = page.content.sections.map((section) => {
      if (!section.componentTree?.length || !sectionIsEmpty(section, counts)) return section;
      const root = section.componentTree[0]!;
      if (root.style?.hidden === true && root.breakpointStyles?.tablet?.hidden === true && root.breakpointStyles?.mobile?.hidden === true) return section;
      touched = true;
      hidden++;
      return hideRoot(section);
    });
    if (touched) changed.push({ ...page, content: { ...page.content, sections } });
  }
  return { pages: changed, hidden };
}

// ── Leftover demo text ──────────────────────────────────────────────────────

/** Template texts worth checking: a short button label ("Shop now") may well stay. */
const MIN_CHECK_CHARS = 16;

/** The template's own texts before the site copy, kept to compare later. */
export function originalTexts(pages: readonly { content: PageContent }[], locale: "ar" | "en"): string[] {
  const texts = collectCopySlots(pages, locale).flatMap((slot) => [slot.ar, slot.en]).filter((text) => text.length >= MIN_CHECK_CHARS);
  return [...new Set(texts)].slice(0, 160);
}

/** How many text slots still read exactly as the template wrote them. */
export function leftoverTemplateText(pages: readonly { content: PageContent }[], originals: readonly string[], locale: "ar" | "en"): number {
  const known = new Set(originals);
  return collectCopySlots(pages, locale).filter((slot) => known.has(slot.ar) || known.has(slot.en)).length;
}

// ── Stock photos (D7) ───────────────────────────────────────────────────────

/** Pexels' alt text names what is in the photo: these words mean a person (template rule: no people or body parts). */
const PEOPLE = /\b(?:person|people|man|men|woman|women|girl|girls|boy|boys|child|children|kid|kids|baby|model|portrait|face|faces|hand|hands|finger|fingers|leg|legs|feet|foot|body|selfie|couple|family|lady|guy|bride|groom|smiling|wearing)\b/i;

export const isPeopleFree = (alt: string) => Boolean(alt.trim()) && !PEOPLE.test(alt);

const HERO_IMAGES = 3;
const ABOUT_IMAGES = 2;

const imageTargets = (sections: readonly SectionInstance[], max: number) => {
  const ids: string[] = [];
  for (const section of sections) {
    visit(section.componentTree, (node, inList) => {
      const props = (node.props ?? {}) as Record<string, unknown>;
      // A photo the template already has, and nothing filled from records.
      if (node.type === "image" && !inList && typeof props.src === "string" && props.src && typeof props.bind !== "string" && ids.length < max) ids.push(node.id);
    });
  }
  return ids;
};

/** The image nodes the build may swap: the home page's first section (the hero) and the about page's first two. */
export function heroImageTargets(pages: readonly CheckPage[]): { pageId: string; nodeIds: string[] }[] {
  const out: { pageId: string; nodeIds: string[] }[] = [];
  const home = pages.find((page) => page.isHome);
  if (home) out.push({ pageId: home.id, nodeIds: imageTargets(home.content.sections.slice(0, 1), HERO_IMAGES) });
  const about = pages.find((page) => !page.isHome && page.slug === "about");
  if (about) out.push({ pageId: about.id, nodeIds: imageTargets(about.content.sections.slice(0, 2), ABOUT_IMAGES) });
  return out.filter((target) => target.nodeIds.length > 0);
}

/** Writes one photo per target node, in order; a node with no photo left keeps the template's. Returns only changed pages. */
export function assignStockPhotos<P extends CheckPage>(pages: readonly P[], urls: readonly string[]): { pages: P[]; placed: number } {
  const targets = heroImageTargets(pages);
  let next = 0;
  let placed = 0;
  const changed: P[] = [];
  for (const target of targets) {
    const page = pages.find((p) => p.id === target.pageId)!;
    const wanted = new Map<string, string>();
    for (const id of target.nodeIds) {
      const url = urls[next++];
      if (url) wanted.set(id, url);
    }
    if (!wanted.size) continue;
    const sections = page.content.sections.map((section) =>
      section.componentTree
        ? { ...section, componentTree: mapNodes(section.componentTree, (node) => (wanted.has(node.id) ? { ...node, props: { ...node.props, src: wanted.get(node.id)! } } : node)) }
        : section,
    );
    placed += wanted.size;
    changed.push({ ...page, content: { ...page.content, sections } });
  }
  return { pages: changed, placed };
}
