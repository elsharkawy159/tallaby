/**
 * Pure operations on a custom section's element tree (P4B-07). Immutable:
 * every function returns a new tree and leaves its input untouched. The
 * editor store calls these; ids come from the caller's `makeId`.
 */
import type { ComponentNode } from "../config/schema";
import { LINK_TYPES, MAX_ELEMENT_DEPTH, MAX_NODES_PER_SECTION, getElementDefinition, type ElementType } from "./registry";

export type MakeId = () => string;
export type NodeTemplate = Omit<ComponentNode, "id" | "children"> & { children?: NodeTemplate[] };

/** A new node of `type` with its default props, styles and children. */
export function createNode(type: ElementType, makeId: MakeId): ComponentNode {
  const definition = getElementDefinition(type);
  if (!definition) throw new Error(`Unknown element type: ${type}`);
  return {
    id: makeId(),
    type,
    props: structuredClone(definition.defaultProps),
    children: (definition.defaultChildren?.() ?? []).map((child) => fromTemplate(child as NodeTemplate, makeId)),
    ...(definition.defaultStyle && { style: { ...definition.defaultStyle } }),
    ...(definition.defaultBreakpointStyles && { breakpointStyles: structuredClone(definition.defaultBreakpointStyles) }),
  };
}

/** A node from a template (presets), with fresh ids all the way down. */
export function fromTemplate(template: NodeTemplate, makeId: MakeId): ComponentNode {
  const { children, ...rest } = structuredClone(template);
  return { ...rest, id: makeId(), children: (children ?? []).map((child) => fromTemplate(child, makeId)) };
}

/** Deep copy with new ids (paste, duplicate). */
export function cloneWithNewIds(node: ComponentNode, makeId: MakeId): ComponentNode {
  return { ...structuredClone(node), id: makeId(), children: node.children.map((child) => cloneWithNewIds(child, makeId)) };
}

export function countNodes(nodes: readonly ComponentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);
}

export function treeDepth(nodes: readonly ComponentNode[]): number {
  return nodes.length ? 1 + Math.max(...nodes.map((node) => treeDepth(node.children))) : 0;
}

/** Ids from the root to the node (inclusive), or null when missing. */
export function findPath(nodes: readonly ComponentNode[], id: string): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [node.id];
    const sub = findPath(node.children, id);
    if (sub) return [node.id, ...sub];
  }
  return null;
}

export function findNode(nodes: readonly ComponentNode[], id: string): ComponentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/** The parent of a node (null for a root node) and its index among siblings. */
export function findParent(nodes: readonly ComponentNode[], id: string): { parentId: string | null; index: number } | null {
  const rootIndex = nodes.findIndex((node) => node.id === id);
  if (rootIndex >= 0) return { parentId: null, index: rootIndex };
  for (const node of nodes) {
    const index = node.children.findIndex((child) => child.id === id);
    if (index >= 0) return { parentId: node.id, index };
    const found = findParent(node.children, id);
    if (found) return found;
  }
  return null;
}

function isLinkInside(nodes: readonly ComponentNode[]): boolean {
  return nodes.some((node) => LINK_TYPES.includes(node.type as ElementType) || isLinkInside(node.children));
}

/**
 * Whether `child` may go directly inside `parentId` (null = section root).
 * Rules: only containers take children, `childTypes` lists are respected,
 * list items live only in lists, and links never nest in links.
 */
export function canContain(nodes: readonly ComponentNode[], parentId: string | null, child: ComponentNode): boolean {
  const childDef = getElementDefinition(child.type);
  if (!childDef) return false;
  if (parentId === null) return child.type !== "listItem";
  const parent = findNode(nodes, parentId);
  const parentDef = parent && getElementDefinition(parent.type);
  if (!parent || !parentDef?.container) return false;
  if (parentDef.childTypes && !parentDef.childTypes.includes(childDef.type)) return false;
  if (child.type === "listItem" && parent.type !== "list") return false;
  const path = findPath(nodes, parentId) ?? [];
  const insideLink = path.some((id) => LINK_TYPES.includes(findNode(nodes, id)?.type as ElementType));
  if (insideLink && (LINK_TYPES.includes(childDef.type) || isLinkInside(child.children))) return false;
  return true;
}

/** Whether the tree stays inside the node and depth limits. */
export function withinLimits(nodes: readonly ComponentNode[]): boolean {
  return countNodes(nodes) <= MAX_NODES_PER_SECTION && treeDepth(nodes) <= MAX_ELEMENT_DEPTH;
}

function mapChildren(
  nodes: readonly ComponentNode[],
  parentId: string | null,
  update: (children: ComponentNode[]) => ComponentNode[],
): ComponentNode[] {
  if (parentId === null) return update([...nodes]);
  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: update([...node.children]) }
      : node.children.length
        ? { ...node, children: mapChildren(node.children, parentId, update) }
        : node,
  );
}

/** Inserts `node` at `index` (end when omitted). Unchanged when not allowed or over the limits. */
export function insertNode(nodes: readonly ComponentNode[], parentId: string | null, node: ComponentNode, index?: number): ComponentNode[] {
  if (!canContain(nodes, parentId, node)) return [...nodes];
  const next = mapChildren(nodes, parentId, (children) => {
    children.splice(index === undefined ? children.length : Math.max(0, Math.min(index, children.length)), 0, node);
    return children;
  });
  return withinLimits(next) ? next : [...nodes];
}

export function removeNode(nodes: readonly ComponentNode[], id: string): ComponentNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children.length ? { ...node, children: removeNode(node.children, id) } : node));
}

export function updateNode(nodes: readonly ComponentNode[], id: string, update: (node: ComponentNode) => ComponentNode): ComponentNode[] {
  return nodes.map((node) =>
    node.id === id ? update(node) : node.children.length ? { ...node, children: updateNode(node.children, id, update) } : node,
  );
}

/** Moves a node under `parentId` at `index` (index counted after removal). No-op into itself or a descendant. */
export function moveNode(nodes: readonly ComponentNode[], id: string, parentId: string | null, index: number): ComponentNode[] {
  const node = findNode(nodes, id);
  if (!node) return [...nodes];
  if (parentId !== null && (parentId === id || findNode(node.children, parentId))) return [...nodes];
  const without = removeNode(nodes, id);
  const next = insertNode(without, parentId, node, index);
  return findNode(next, id) ? next : [...nodes];
}

/** Copies a node right after itself. Returns the new id (null when not possible). */
export function duplicateNode(nodes: readonly ComponentNode[], id: string, makeId: MakeId): { nodes: ComponentNode[]; newId: string | null } {
  const node = findNode(nodes, id);
  const place = findParent(nodes, id);
  if (!node || !place) return { nodes: [...nodes], newId: null };
  const copy = cloneWithNewIds(node, makeId);
  const next = insertNode(nodes, place.parentId, copy, place.index + 1);
  return findNode(next, copy.id) ? { nodes: next, newId: copy.id } : { nodes: [...nodes], newId: null };
}

/** Wraps sibling nodes (same parent) in a new container of `type`, at the first one's place. */
export function wrapNodes(
  nodes: readonly ComponentNode[],
  ids: readonly string[],
  type: ElementType,
  makeId: MakeId,
): { nodes: ComponentNode[]; wrapperId: string | null } {
  const places = ids.map((id) => ({ id, place: findParent(nodes, id) }));
  const parentId = places[0]?.place?.parentId;
  if (!places.length || places.some((p) => !p.place || p.place.parentId !== parentId)) return { nodes: [...nodes], wrapperId: null };
  const ordered = [...places].sort((a, b) => a.place!.index - b.place!.index);
  const wrapper = { ...createNode(type, makeId), children: ordered.map((p) => findNode(nodes, p.id)!) };
  let next = nodes as ComponentNode[];
  for (const { id } of ordered) next = removeNode(next, id);
  next = insertNode(next, parentId ?? null, wrapper, ordered[0]!.place!.index);
  return findNode(next, wrapper.id) ? { nodes: next, wrapperId: wrapper.id } : { nodes: [...nodes], wrapperId: null };
}
