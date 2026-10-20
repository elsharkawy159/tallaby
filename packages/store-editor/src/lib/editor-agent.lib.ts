/**
 * AI assistant mentions (UI only for now). The selection is attached to the
 * chat as a mention, so a later agent knows which section, part or element a
 * message is about. Ids only: the agent must re-read the element from the
 * draft (and re-check it belongs to this store) before changing anything.
 */
import type { SectionInstance } from "@workspace/store-sections";
import { findNode, findPath, getElementDefinition, storeSectionRegistry } from "@workspace/store-sections/render";
import type { SectionRef, Selection } from "../state/editor.store";
import { nodeLabel, partField, refOf } from "./editor-selection.lib";

export type AgentMention = {
  /** Stable per selection, so a dismissed mention stays dismissed until the selection changes. */
  key: string;
  ref: SectionRef;
  nodeId?: string;
  part?: string;
  /** What the chip shows: the element's own name, else its type. */
  label: string;
  /** The section it sits in. */
  context: string;
  nodeType?: string;
};

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

export function selectionKey(selection: NonNullable<Selection>): string {
  const ref = refOf(selection);
  const base = ref.target === "page" ? `page:${ref.sectionId}` : ref.target;
  return `${base}:${selection.nodeId ?? selection.part ?? ""}`;
}

/** The mention for the current selection, or null when nothing (or something gone) is selected. */
export function mentionOf(selection: Selection, instance: SectionInstance | null, uiLocale: string): AgentMention | null {
  if (!selection || !instance) return null;
  const definition = storeSectionRegistry.get(instance.sectionId);
  const sectionName = definition ? pick(definition.displayName, uiLocale) : instance.sectionId;
  const base = { key: selectionKey(selection), ref: refOf(selection) };

  if (selection.nodeId) {
    const node = findNode(instance.componentTree ?? [], selection.nodeId);
    if (!node) return null;
    const elementDef = getElementDefinition(node.type);
    const typeName = elementDef ? pick(elementDef.label, uiLocale) : node.type;
    // The tree root names the section (a design's "Hero", "Video"…).
    const root = instance.componentTree?.[0];
    const context = root && root.id !== node.id ? nodeLabel(root, uiLocale) || sectionName : sectionName;
    return { ...base, nodeId: node.id, nodeType: node.type, label: nodeLabel(node, uiLocale) || typeName, context };
  }
  if (selection.part && definition) {
    const field = partField(definition, selection.part);
    return { ...base, part: selection.part, label: field ? pick(field.label, uiLocale) : selection.part, context: sectionName };
  }
  return { ...base, label: sectionName, context: sectionName };
}

/** The element's ancestors from the tree root (for breadcrumbs); empty for a section or part. */
export function ancestorsOf(instance: SectionInstance, nodeId: string | undefined): string[] {
  if (!nodeId) return [];
  return (findPath(instance.componentTree ?? [], nodeId) ?? []).slice(0, -1);
}
