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
import { createTreeBuilder, defineDesign, type Design, type DesignPhotos, type DesignText } from "../designs/builder";
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";

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
export type ListPatch = { source?: string | null; sort?: string | null; limit?: number | null };

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

const PLACEHOLDER_NAME = "اسم متجرك";
const PLACEHOLDER_INITIAL = "م";
/** Prop keys that never hold copy. */
const NOT_COPY = new Set(["role", "bind", "translations", "href", "src", "variant", "level", "url", "thumbnail", "poster", "source", "sort", "formTemplate"]);

type Props = Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };

const localized = (value: DesignText): Localized => (typeof value === "string" ? { ar: value, en: value } : value);

function defaultForm(design: Design): string | undefined {
  if (design.category === "contact") return "contact";
  if (design.category === "newsletter" || design.category === "footers") return "newsletter";
  return undefined;
}

/**
 * The template's photos for a design's `photo(i)` / `person(i)` slots. Every
 * slot the design uses must have one: a library stock photo never slips into
 * a template (template photos are checked by eye: no people or bodies).
 */
function strict(photos: readonly (string | undefined)[] | undefined, kind: string): readonly (string | undefined)[] {
  return new Proxy(photos ?? [], {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key) && target[Number(key)] === undefined) {
        throw new Error(`No template photo for ${kind}(${key})`);
      }
      return Reflect.get(target, key, receiver);
    },
  });
}

/**
 * Library designs treat `accent` as a light "sun" colour and put muted text
 * and accent marks on accent blocks. A template's accent can be strong
 * (orange, red, green), so inside an accent block muted text and accent
 * marks use the foreground colour, which reads on light accents too.
 */
function onAccent(node: NodeTemplate, inside: boolean): NodeTemplate {
  const style = node.style as Record<string, unknown> | undefined;
  const here = inside || style?.background === "accent";
  let next = node;
  if (inside && style) {
    const swapped = { ...style };
    if (swapped.color === "muted" || swapped.color === "accent") swapped.color = "foreground";
    if (swapped.background === "accent") swapped.background = "foreground";
    next = { ...node, style: swapped as NodeTemplate["style"] };
  }
  return { ...next, children: node.children?.map((child) => onAccent(child, here)) };
}

/** A node with `patch` merged into its props and styles. */
function patchNode(node: NodeTemplate, patch: NodePatch): NodeTemplate {
  const breakpoints = { ...(node.breakpointStyles as Record<string, StyleValues> | undefined) };
  for (const bp of ["tablet", "mobile"] as const) {
    if (patch[bp]) breakpoints[bp] = { ...breakpoints[bp], ...patch[bp] };
  }
  return {
    ...node,
    ...(patch.props && { props: { ...node.props, ...patch.props } as NodeTemplate["props"] }),
    ...(patch.style && { style: { ...(node.style as StyleValues | undefined), ...patch.style } as NodeTemplate["style"] }),
    ...(Object.keys(breakpoints).length && { breakpointStyles: breakpoints as NodeTemplate["breakpointStyles"] }),
  };
}

const FULL_ROUND = 999;

function clampCorners(node: NodeTemplate, max: number): NodeTemplate {
  const clamp = (style: Record<string, unknown> | undefined) =>
    style && typeof style.radius === "number" && style.radius < FULL_ROUND && style.radius > max ? { ...style, radius: max } : style;
  const breakpoints = node.breakpointStyles as Record<string, Record<string, unknown>> | undefined;
  return {
    ...node,
    ...(node.style && { style: clamp(node.style as Record<string, unknown>) as NodeTemplate["style"] }),
    ...(breakpoints && {
      breakpointStyles: Object.fromEntries(Object.entries(breakpoints).map(([bp, style]) => [bp, clamp(style)])) as NodeTemplate["breakpointStyles"],
    }),
    children: node.children?.map((child) => clampCorners(child, max)),
  };
}

/** The library design with the template's content, as the template's own design. */
export function fromLibrary(templateKey: string, design: Design, patch: LibraryPatch = {}): Design {
  const form = patch.form ?? defaultForm(design);
  const chrome = design.category === "headers" || design.category === "footers";
  return defineDesign({
    ...design,
    id: `${templateKey}-${patch.as ?? design.id}`,
    libraryId: design.libraryId ?? design.id,
    ...(patch.name && { name: patch.name }),
    tree: () => {
      const tree = design.tree(createTreeBuilder(undefined, { photo: strict(patch.photo, "photo"), person: strict(patch.person, "person") }));
      const text = new Map(Object.entries(patch.text ?? {}).map(([ar, value]) => [ar, localized(value)]));
      const links = new Map(Object.entries(patch.links ?? {}));
      const linkSeen = new Map<string, number>();
      const used = new Set<string>();
      let listIndex = 0;

      const visit = (node: NodeTemplate): NodeTemplate => {
        const props = { ...(node.props as Props) };
        const en = { ...(props.translations?.en ?? {}) };
        for (const [key, value] of Object.entries(props)) {
          if (NOT_COPY.has(key) || typeof value !== "string") continue;
          const next = text.get(value);
          if (next) {
            used.add(`text:${value}`);
            props[key] = next.ar;
            if (next.en !== next.ar) en[key] = next.en;
            else delete en[key];
          }
        }
        if (Object.keys(en).length) props.translations = { ...props.translations, en };
        else if (props.translations) {
          const { en: _drop, ...rest } = props.translations;
          props.translations = Object.keys(rest).length ? rest : undefined;
          if (!props.translations) delete props.translations;
        }
        if (typeof props.href === "string" && props.bind !== "href" && links.has(props.href)) {
          const href = props.href;
          const swap = links.get(href)!;
          const seen = linkSeen.get(href) ?? 0;
          linkSeen.set(href, seen + 1);
          used.add(`link:${href}`);
          const next = typeof swap === "string" ? swap : swap[seen];
          if (next !== undefined) props.href = next;
        }
        if (node.type === "productList" || node.type === "categoryList" || node.type === "postList") {
          const list = patch.lists?.[listIndex++];
          for (const [key, value] of Object.entries(list ?? {})) {
            if (value === null) delete props[key];
            else if (value !== undefined) props[key] = value;
          }
        }
        if (node.type === "storeForm" && form) props.formTemplate = form;
        const label = (node.props as Props).label;
        const nodePatch = typeof label === "string" ? patch.nodes?.[label] : undefined;
        if (nodePatch) used.add(`node:${label}`);
        // The library's placeholder name (original copy) → the store's name on "Use template".
        const original = (node.props as Props).text;
        if (!props.role || props.role === "title") {
          if (original === PLACEHOLDER_NAME) props.role = "storeName";
          else if (chrome && original === PLACEHOLDER_INITIAL) props.role = "storeInitial";
          else if (typeof original === "string" && original.startsWith("©") && original.includes(PLACEHOLDER_NAME)) props.role = "copyright";
        }
        const next = { ...node, props: props as NodeTemplate["props"], children: node.children?.map(visit) };
        return nodePatch ? patchNode(next, nodePatch) : next;
      };

      const built = onAccent(visit(tree), false);
      const result = patch.corners === undefined ? built : clampCorners(built, patch.corners);
      const missing = [
        ...[...text.keys()].filter((ar) => !used.has(`text:${ar}`)).map((ar) => `text "${ar}"`),
        ...[...links.keys()].filter((href) => !used.has(`link:${href}`)).map((href) => `link "${href}"`),
        ...Object.keys(patch.nodes ?? {})
          .filter((label) => !used.has(`node:${label}`))
          .map((label) => `node "${label}"`),
        ...[...links.entries()]
          .filter(([href, swap]) => typeof swap !== "string" && swap.length !== (linkSeen.get(href) ?? 0))
          .map(([href, swap]) => `${swap.length} swaps for ${linkSeen.get(href) ?? 0} "${href}" links`),
        ...(patch.lists && patch.lists.length > listIndex ? [`${patch.lists.length} list patches for ${listIndex} lists`] : []),
      ];
      if (missing.length) throw new Error(`${templateKey}: ${design.id} has no ${missing.join(", ")}`);
      return result;
    },
  });
}
