/**
 * Moving stored site content to another default language (the store's
 * default language changed in Store settings › General).
 *
 * Stored text is relative to the store's default language: `props` hold the
 * default locale's text and `props.translations[locale]` the other locale's
 * overlay (`core/locale.ts`), on every tree node and on a coded section's
 * instance. When the default changes, the content has to change base too, or
 * the renderer treats the old default's text as the new default's (an
 * English-default store showing its Arabic template text). Rebasing keeps
 * what each language shows exactly: the new default's overlay moves into
 * `props`, and the values it replaced move into an overlay for the old
 * default. Text that had no overlay stays in `props` (it still shows in both
 * languages, as before). Pure; returns the same object when nothing changes.
 */
import { mergeRecord } from "../core/locale";
import type { ComponentNode, PageContent, SectionInstance, SiteLocale } from "./schema";

type Overlays = Partial<Record<SiteLocale, Record<string, unknown>>>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** `base` and `overlays` with `to`'s overlay moved into the base; null when `to` has no overlay. */
function swapBase(base: Record<string, unknown>, overlays: Overlays | undefined, from: SiteLocale, to: SiteLocale): { base: Record<string, unknown>; overlays: Overlays | undefined } | null {
  const overlay = overlays?.[to];
  if (!isRecord(overlay) || !Object.keys(overlay).length) return null;
  const back: Record<string, unknown> = {};
  for (const key of Object.keys(overlay)) if (overlay[key] !== undefined && key in base) back[key] = base[key];
  const others: Overlays = { ...overlays };
  delete others[to];
  const previous = others[from];
  const fromOverlay = { ...(isRecord(previous) ? previous : {}), ...back };
  const next: Overlays = { ...others, ...(Object.keys(fromOverlay).length && { [from]: fromOverlay }) };
  return { base: mergeRecord(base, overlay), overlays: Object.keys(next).length ? next : undefined };
}

function rebaseNode(node: ComponentNode, from: SiteLocale, to: SiteLocale): ComponentNode {
  const children = node.children.map((child) => rebaseNode(child, from, to));
  const childrenChanged = children.some((child, i) => child !== node.children[i]);
  const { translations, ...rest } = node.props as Record<string, unknown> & { translations?: Overlays };
  const swapped = swapBase(rest, translations, from, to);
  if (!swapped && !childrenChanged) return node;
  const props = swapped ? { ...swapped.base, ...(swapped.overlays && { translations: swapped.overlays }) } : node.props;
  return { ...node, props, children };
}

/** One section with `to` as its base language (its tree and its own props). */
export function rebaseSectionLocale(instance: SectionInstance, from: SiteLocale, to: SiteLocale): SectionInstance {
  if (from === to) return instance;
  const tree = instance.componentTree?.map((node) => rebaseNode(node, from, to));
  const treeChanged = Boolean(tree && tree.some((node, i) => node !== instance.componentTree![i]));
  const swapped = swapBase(instance.props, instance.translations as Overlays | undefined, from, to);
  if (!swapped && !treeChanged) return instance;
  const out: SectionInstance = { ...instance };
  if (swapped) {
    out.props = swapped.base;
    if (swapped.overlays) out.translations = swapped.overlays as SectionInstance["translations"];
    else delete out.translations;
  }
  if (treeChanged) out.componentTree = tree;
  return out;
}

/** A page's sections with `to` as their base language. */
export function rebasePageContentLocale(content: PageContent, from: SiteLocale, to: SiteLocale): PageContent {
  if (from === to) return content;
  const sections = content.sections.map((section) => rebaseSectionLocale(section, from, to));
  let changed = sections.some((section, i) => section !== content.sections[i]);
  let injectedChildren = content.injectedChildren;
  if (injectedChildren) {
    const next = Object.fromEntries(Object.entries(injectedChildren).map(([slot, nodes]) => [slot, nodes.map((node) => rebaseNode(node, from, to))]));
    if (Object.entries(next).some(([slot, nodes]) => nodes.some((node, i) => node !== injectedChildren![slot]![i]))) {
      injectedChildren = next;
      changed = true;
    }
  }
  return changed ? { ...content, sections, ...(injectedChildren && { injectedChildren }) } : content;
}
