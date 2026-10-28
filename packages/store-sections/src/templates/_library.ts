/**
 * A template section made from a section-library design (Claude Design
 * "Storefront Templates" 02–38 are built from library sections): the
 * library's element tree, with the template's photos in its photo slots and
 * its own copy, links and list settings swapped in. The result is a design
 * owned by the template (id `<template>-<library id>`), so the seller still
 * gets an ordinary tree section where every element can be selected, styled
 * and moved (CLAUDE.md rule 17).
 *
 * Swaps are strict: a copy, link or list setting that the library design
 * does not contain throws when the tree is built, so a library change can
 * never leave a template silently showing the library's demo copy (the
 * template tests build every page).
 *
 * Also, for every template: text that reads the library's placeholder store
 * name gets the `storeName` / `storeInitial` / `copyright` role, so "Use
 * template" puts the seller's name in; a `storeForm` gets the ready-made
 * form its category needs (`newsletter`, or `contact` in contact designs).
 * No React here.
 */
import type { Localized } from "../core/types";
import type { LibraryPatchData } from "../config/schema";
import { defineDesign, type Design, type DesignPhotos, type DesignText } from "../designs/builder";
import { designSlotTree } from "../designs/photo-slots";
import type { StyleValues } from "../elements/style";
import { applyLibraryPatch } from "./library-ref";

/**
 * Props and styles merged into the nodes with one layer label: `style` into
 * the node's own style, `tablet` / `mobile` into its breakpoint styles.
 */
export type NodePatch = {
  props?: Readonly<Record<string, string | number | boolean>>;
  style?: StyleValues;
  tablet?: StyleValues;
  mobile?: StyleValues;
};

/** A list setting: `null` removes it (e.g. a fixed `source`). */
export type ListPatch = {
  source?: string | null;
  sort?: string | null;
  limit?: number | null;
  /** Records skipped first (a category row: its place in the store, minus one). */
  offset?: number | null;
  /** A `category` product list: the store's Nth category (1-based). */
  categoryIndex?: number | null;
};

export type LibraryPatch = DesignPhotos & {
  /** The design's Arabic copy → the template's copy (both languages). Every key must be found. */
  text?: Readonly<Record<string, DesignText>>;
  /**
   * Fixed links (not product/category hrefs bound to data) → the template's
   * link: one href for every occurrence, or one per occurrence in tree order
   * (`undefined` keeps that one). Every key must be found, and a list must
   * name every occurrence.
   */
  links?: Readonly<Record<string, string | readonly (string | undefined)[]>>;
  /** The design's data lists, in tree order; `undefined` keeps one as it is. */
  lists?: readonly (ListPatch | undefined)[];
  /**
   * The design's layer labels (Arabic, as the design writes them) → props
   * and styles for every node with that label, merged before the corner cap.
   * Every label must be found.
   */
  nodes?: Readonly<Record<string, NodePatch>>;
  /** The ready-made form its `storeForm` nodes get (default from the category). */
  form?: string;
  /** Overrides of the design's name / description in the editor. */
  name?: Localized;
  /** The id after the template key when the design is used more than once (default: the library id). */
  as?: string;
  /**
   * The template's corner radius: library designs round their cards and
   * photos themselves (20–28px), so larger radii are clamped to this. Full
   * circles (999: dots, avatars, stickers) stay round.
   */
  corners?: number;
};

/** A code patch as stored JSON (`libraryRef.patch`): a missing photo becomes `null`, the editor-only fields are dropped. */
export function libraryPatchData(patch: LibraryPatch): LibraryPatchData {
  const { name: _name, as: _as, ...data } = patch;
  return JSON.parse(JSON.stringify(data)) as LibraryPatchData;
}

/**
 * The library design with the template's content, as the template's own
 * design. Its tree is the library's slot tree with the patch applied
 * (`applyLibraryPatch`, strict), and it carries `libraryRef` so a template
 * can store the section as a ref (`library-ref.ts`).
 */
export function fromLibrary(templateKey: string, design: Design, patch: LibraryPatch = {}): Design {
  const libraryId = design.libraryId ?? design.id;
  const data = libraryPatchData(patch);
  const id = `${templateKey}-${patch.as ?? design.id}`;
  return defineDesign({
    ...design,
    id,
    libraryId,
    libraryRef: { key: libraryId, patch: data },
    ...(patch.name && { name: patch.name }),
    tree: () => applyLibraryPatch(designSlotTree(design), data, { category: design.category, strict: true, label: `${templateKey}: ${design.id}` }).tree,
  });
}
