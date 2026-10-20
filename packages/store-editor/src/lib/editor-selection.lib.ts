/**
 * Selection helpers (P4B-04): map a selection to the section instance, the
 * editable part's field, or the element node it points at. Pure; the store,
 * canvas and inspector share them.
 */
import type { ComponentNode, PageContent, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  findNode,
  getElementDefinition,
  storeSectionRegistry,
  updateNode,
  type AnySectionDefinition,
  type PropDefinition,
} from "@workspace/store-sections/render";
import { readItemProp, readProp, setItemProp, setSectionProp } from "./editor.lib";
import type { SectionRef, Selection } from "../state/editor.store";

export type EditTarget = { locale: SiteLocale; defaultLocale: SiteLocale };

export type ParsedPart =
  | { kind: "prop"; key: string }
  | { kind: "item"; collection: string; index: number; key: string };

/** `title` → prop; `items.2.title` → item field. Null for anything else. */
export function parsePart(part: string | undefined): ParsedPart | null {
  if (!part) return null;
  const item = /^([A-Za-z][A-Za-z0-9]*)\.(\d{1,3})\.([A-Za-z][A-Za-z0-9]*)$/.exec(part);
  if (item) return { kind: "item", collection: item[1]!, index: Number(item[2]), key: item[3]! };
  return /^[A-Za-z][A-Za-z0-9]*$/.test(part) ? { kind: "prop", key: part } : null;
}

/** `"<instanceId>::<partKey>"` from the canvas attribute. */
export function splitPartAttr(value: string | undefined): { sectionId: string; part: string } | null {
  if (!value) return null;
  const at = value.indexOf("::");
  return at > 0 ? { sectionId: value.slice(0, at), part: value.slice(at + 2) } : null;
}

export function refOf(selection: NonNullable<Selection>): SectionRef {
  return selection.target === "page" ? { target: "page", sectionId: selection.sectionId } : { target: selection.target };
}

export function sameRef(a: SectionRef | null | undefined, b: SectionRef | null | undefined): boolean {
  if (!a || !b || a.target !== b.target) return false;
  return a.target !== "page" || a.sectionId === (b as { sectionId: string }).sectionId;
}

export function getInstance(
  source: { content: PageContent; header: SectionInstance | null; footer: SectionInstance | null },
  ref: SectionRef | null | undefined,
): SectionInstance | null {
  if (!ref) return null;
  if (ref.target === "page") return source.content.sections.find((s) => s.id === ref.sectionId) ?? null;
  return source[ref.target];
}

/** The field definition a part edits, or undefined when the section has no such field. */
export function partField(definition: AnySectionDefinition | undefined, part: string | undefined): PropDefinition | undefined {
  const parsed = parsePart(part);
  if (!definition || !parsed) return undefined;
  if (parsed.kind === "prop") return definition.propDefinitions.find((p) => p.key === parsed.key);
  return definition.itemCollections?.find((c) => c.key === parsed.collection)?.itemPropDefinitions.find((p) => p.key === parsed.key);
}

export function readPart(instance: SectionInstance, part: string, field: PropDefinition | undefined, target: EditTarget): unknown {
  const parsed = parsePart(part);
  if (!parsed) return undefined;
  const editTarget = { ...target, translatable: field?.translatable };
  return parsed.kind === "prop"
    ? readProp(instance, parsed.key, editTarget)
    : readItemProp(instance, parsed.collection, parsed.index, parsed.key, editTarget);
}

export function writePart(
  instance: SectionInstance,
  part: string,
  field: PropDefinition | undefined,
  value: unknown,
  target: EditTarget,
): SectionInstance {
  const parsed = parsePart(part);
  if (!parsed) return instance;
  const editTarget = { ...target, translatable: field?.translatable };
  return parsed.kind === "prop"
    ? setSectionProp(instance, parsed.key, value, editTarget)
    : setItemProp(instance, parsed.collection, parsed.index, parsed.key, value, editTarget);
}

// ---------------------------------------------------------------------------
// Element nodes: text in `props`, other locales in `props.translations[locale]`.
// ---------------------------------------------------------------------------

export function readNodeProp(node: ComponentNode, key: string, target: EditTarget & { translatable?: boolean }): unknown {
  if (target.locale !== target.defaultLocale && target.translatable) {
    const overlay = (node.props.translations as Record<string, Record<string, unknown>> | undefined)?.[target.locale]?.[key];
    if (overlay !== undefined) return overlay;
  }
  return node.props[key];
}

export function setNodeProp(
  node: ComponentNode,
  key: string,
  value: unknown,
  target: EditTarget & { translatable?: boolean },
): ComponentNode {
  if (target.locale === target.defaultLocale || !target.translatable) return { ...node, props: { ...node.props, [key]: value } };
  const translations = (node.props.translations ?? {}) as Record<string, Record<string, unknown>>;
  return {
    ...node,
    props: { ...node.props, translations: { ...translations, [target.locale]: { ...(translations[target.locale] ?? {}), [key]: value } } },
  };
}

type Overlays = Record<string, Record<string, unknown>>;

/** A node's Layers name in the editor UI language (designs carry it in both); "" when unnamed. */
export function nodeLabel(node: ComponentNode, uiLocale: string): string {
  const overlay = (node.props.translations as Overlays | undefined)?.[uiLocale]?.label;
  if (typeof overlay === "string" && overlay) return overlay;
  return typeof node.props.label === "string" ? node.props.label : "";
}

/** The node renamed by the seller: one name for every language (its old translated names are dropped). */
export function renameNode(node: ComponentNode, label: string): ComponentNode {
  const name = label.trim().slice(0, 60) || undefined;
  const translations = node.props.translations as Overlays | undefined;
  const cleaned = translations
    ? Object.fromEntries(
        Object.entries(translations)
          .map(([locale, values]) => [locale, Object.fromEntries(Object.entries(values).filter(([key]) => key !== "label"))] as const)
          .filter(([, values]) => Object.keys(values).length > 0),
      )
    : undefined;
  const { translations: _old, ...props } = node.props;
  return { ...node, props: { ...props, label: name, ...(cleaned && Object.keys(cleaned).length && { translations: cleaned }) } };
}

export function withTree(instance: SectionInstance, update: (nodes: ComponentNode[]) => ComponentNode[]): SectionInstance {
  return { ...instance, componentTree: update(instance.componentTree ?? []) };
}

export function getNode(instance: SectionInstance | null, nodeId: string | undefined): ComponentNode | null {
  return instance && nodeId ? findNode(instance.componentTree ?? [], nodeId) : null;
}

/** A short label for the selection badge and sidebar header. */
export function selectionLabel(
  instance: SectionInstance | null,
  selection: Selection,
  locale: string,
): { title: string; detail?: string; kind: "section" | "element" } | null {
  if (!instance || !selection) return null;
  const pick = (value: { ar: string; en: string }) => (locale === "en" ? value.en : value.ar) || value.ar;
  const definition = storeSectionRegistry.get(instance.sectionId);
  const sectionName = definition ? pick(definition.displayName) : instance.sectionId;
  const node = getNode(instance, selection.nodeId);
  if (node) {
    const elementDef = getElementDefinition(node.type);
    return { title: elementDef ? pick(elementDef.label) : node.type, detail: sectionName, kind: "element" };
  }
  if (selection.part) {
    const field = partField(definition, selection.part);
    return { title: field ? pick(field.label) : selection.part, detail: sectionName, kind: "element" };
  }
  return { title: sectionName, kind: "section" };
}

/** Whether the selection's text can be edited in place, and whether it allows line breaks (P4B-10). */
export function inlineTextInfo(instance: SectionInstance | null, selection: Selection): { multiline: boolean } | null {
  if (!instance || !selection) return null;
  const node = getNode(instance, selection.nodeId);
  if (node) {
    const definition = getElementDefinition(node.type);
    const field = definition?.fields.find((f) => f.key === definition.textProp);
    return field ? { multiline: field.type === "textarea" } : null;
  }
  const field = partField(storeSectionRegistry.get(instance.sectionId), selection.part);
  return field && (field.type === "text" || field.type === "textarea") ? { multiline: field.type === "textarea" } : null;
}

/** Whether the selection is an image (double-click opens the media library). */
export function isImageSelection(instance: SectionInstance | null, selection: Selection): boolean {
  if (!instance || !selection) return false;
  const node = getNode(instance, selection.nodeId);
  if (node) return node.type === "image";
  return partField(storeSectionRegistry.get(instance.sectionId), selection.part)?.type === "image";
}

export type ImageSpot = { nodeId: string } | { part: string };

/**
 * The image a picked picture goes on: the selected image, or, when a whole
 * section is selected, its first image (first Image element, then first
 * image field, then the first item's image). Null when there is none.
 */
export function imageSpotOf(instance: SectionInstance | null, selection: Selection): ImageSpot | null {
  if (!instance || !selection) return null;
  if (isImageSelection(instance, selection)) return selection.nodeId ? { nodeId: selection.nodeId } : { part: selection.part! };
  if (selection.nodeId || selection.part) return null;
  const firstImage = (nodes: readonly ComponentNode[]): ComponentNode | null => {
    for (const node of nodes) {
      if (node.type === "image") return node;
      const inner = firstImage(node.children ?? []);
      if (inner) return inner;
    }
    return null;
  };
  const node = firstImage(instance.componentTree ?? []);
  if (node) return { nodeId: node.id };
  const definition = storeSectionRegistry.get(instance.sectionId);
  const prop = definition?.propDefinitions.find((p) => p.type === "image");
  if (prop) return { part: prop.key };
  for (const collection of definition?.itemCollections ?? []) {
    const field = collection.itemPropDefinitions.find((p) => p.type === "image");
    const items = (instance.props as Record<string, unknown> | undefined)?.[collection.key];
    if (field && Array.isArray(items) && items.length > 0) return { part: `${collection.key}.0.${field.key}` };
  }
  return null;
}

/** The instance with `src` on an image spot (current locale). */
export function setImageAt(instance: SectionInstance, spot: ImageSpot, src: string, target: EditTarget): SectionInstance {
  if ("nodeId" in spot) return withTree(instance, (nodes) => updateNode(nodes, spot.nodeId, (n) => setNodeProp(n, "src", src, target)));
  return writePart(instance, spot.part, partField(storeSectionRegistry.get(instance.sectionId), spot.part), src, target);
}
