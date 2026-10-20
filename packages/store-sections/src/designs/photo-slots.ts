/**
 * Photo slots: a stored library tree keeps `stock:photo:3` / `stock:person:0`
 * placeholders where a design has default photos, and they are resolved for
 * the inserting store's industry at insert time (`instantiateTemplate`). Pure.
 */
import type { NodeTemplate } from "../elements/tree";
import { createTreeBuilder, type Design } from "./builder";
import { peoplePhoto, stockPhoto } from "./stock-photos";

export type PhotoSlotKind = "photo" | "person";

export const PHOTO_SLOT_RE = /^stock:(photo|person):(\d+)$/;

export function photoSlot(kind: PhotoSlotKind, index: number): string {
  return `stock:${kind}:${index}`;
}

/** The photo a slot stands for; anything that is not a slot is returned unchanged. */
export function resolvePhotoSlot(src: string, industry?: string): string {
  const match = PHOTO_SLOT_RE.exec(src);
  if (!match) return src;
  const index = Number(match[2]);
  return match[1] === "person" ? peoplePhoto(index) : stockPhoto(industry, index);
}

/** A copy of the tree with every slot (in any string prop) replaced by its photo. */
export function resolvePhotoSlots(tree: NodeTemplate, industry?: string): NodeTemplate {
  const props = Object.fromEntries(Object.entries(tree.props).map(([key, value]) => [key, typeof value === "string" ? resolvePhotoSlot(value, industry) : value]));
  return { ...tree, props, children: (tree.children ?? []).map((child) => resolvePhotoSlots(child, industry)) };
}

/** A design's tree with slots instead of photos. */
export function designSlotTree(design: Design): NodeTemplate {
  return design.tree(createTreeBuilder(undefined, undefined, { slots: true }));
}
