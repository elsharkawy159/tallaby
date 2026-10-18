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
  type AnySectionDefinition,
  type PropDefinition,
} from "@workspace/store-sections/render";
import { readItemProp, readProp, setItemProp, setSectionProp } from "./editor.lib";
import type { SectionRef, Selection } from "./editor.store";

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
