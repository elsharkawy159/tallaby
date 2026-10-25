/**
 * Named fields of a library section (owner, 2026-10-26): every node of a
 * `library_sections` tree carries a stable name in `props.field` (`heading`,
 * `text-2`, `image`, `cta`…), unique within the section. A template stores a
 * library section as the key plus values per field (`libraryRef.props`,
 * `templates/library-ref.ts`), so the template JSON holds only its data and
 * the admin edits it as a form, one section at a time.
 *
 * Names are assigned once, in tree order, and kept: a node that already has
 * a unique name keeps it, so editing the library section (moving, adding,
 * deleting nodes) never renames the others. A duplicated or pasted node,
 * which copies its original's name, gets the next free one. The name is
 * inert (nothing renders it) and built template sections drop it.
 * Pure, no React.
 */
import type { Localized } from "../core/types";
import type { NodeTemplate } from "../elements/tree";

type Props = Record<string, unknown>;

/** Computed by the template build (`library-ref.ts`), so never a name. */
const COMPUTED_ROLES = new Set(["storeName", "storeInitial", "copyright"]);

const TYPE_BASE: Readonly<Record<string, string>> = {
  section: "section",
  heading: "heading",
  paragraph: "text",
  text: "text",
  richText: "text",
  button: "cta",
  textLink: "link",
  linkBlock: "link",
  link: "link",
  image: "image",
  badge: "badge",
  "shadcn-badge": "badge",
  listItem: "item",
  accordionItem: "faq",
  blockQuote: "quote",
  video: "video",
  videoItem: "video",
  productList: "products",
  categoryList: "categories",
  postList: "posts",
  storeForm: "form",
  slide: "slide",
  icon: "icon",
};

/** The prop a field's bare key sets (`"<field>"`); every other prop is `"<field>.<prop>"`. */
export const PRIMARY_PROP: Readonly<Record<string, string>> = {
  heading: "text",
  paragraph: "text",
  text: "text",
  badge: "text",
  listItem: "text",
  blockQuote: "text",
  textLink: "text",
  button: "label",
  image: "src",
  accordionItem: "title",
  video: "url",
  videoItem: "title",
};

/** `hFlex` → `h-flex`. */
const kebab = (type: string) => type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const nameOf = (node: NodeTemplate): string | undefined => {
  const field = (node.props as Props).field;
  return typeof field === "string" && field ? field : undefined;
};

const withName = (node: NodeTemplate, field: string, children: NodeTemplate[] | undefined): NodeTemplate => ({
  ...node,
  props: { ...(node.props as Props), field } as NodeTemplate["props"],
  ...(children && { children }),
});

/** The name a node's field starts from: its content role, else its type. */
export function fieldBase(node: NodeTemplate): string {
  const role = (node.props as Props).role;
  if (typeof role === "string" && role && !COMPUTED_ROLES.has(role)) return kebab(role).replace(/[^a-z0-9-]/g, "") || "box";
  return TYPE_BASE[node.type] ?? (node.children?.length ? "box" : kebab(node.type));
}

function nodesInOrder(tree: NodeTemplate, out: NodeTemplate[] = []): NodeTemplate[] {
  out.push(tree);
  for (const child of tree.children ?? []) nodesInOrder(child, out);
  return out;
}

/** Field names → `base-N` suffix counters, so a new name never reuses one in the tree. */
function nextNameFor(used: Set<string>) {
  return (base: string): string => {
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    for (let n = 2; ; n++) {
      const name = `${base}-${n}`;
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
    }
  };
}

/**
 * Every node named, in tree order. Idempotent: a node whose name is unique
 * keeps it; the later of two nodes with one name (a duplicate) and every
 * unnamed node get the next free `base`, `base-2`…
 */
export function assignFieldNames(tree: NodeTemplate): NodeTemplate {
  // By place in tree order (a duplicate can be the same object as its original).
  const seen = new Set<string>();
  const keep = nodesInOrder(tree).map((node) => {
    const name = nameOf(node);
    if (!name || seen.has(name)) return undefined;
    seen.add(name);
    return name;
  });
  const next = nextNameFor(seen);
  let index = 0;
  const visit = (node: NodeTemplate): NodeTemplate => {
    const kept = keep[index++];
    const name = kept ?? next(fieldBase(node));
    return withName(node, name, node.children?.map(visit));
  };
  return visit(tree);
}

/**
 * A database library tree named like its code design where they still match
 * (same type at the same place), so the database copy and the code fallback
 * give a template's values to the same nodes; nodes that already have a name
 * keep it, and the rest are named by `assignFieldNames`.
 */
export function alignFieldNames(tree: NodeTemplate, code: NodeTemplate | undefined): NodeTemplate {
  if (!code) return assignFieldNames(tree);
  const named = assignFieldNames(code);
  const used = new Set(nodesInOrder(tree).map(nameOf).filter((name): name is string => !!name));
  const visit = (node: NodeTemplate, twin: NodeTemplate | undefined): NodeTemplate => {
    const match = twin && twin.type === node.type ? twin : undefined;
    const children = node.children?.map((child, i) => visit(child, match?.children?.[i]));
    const codeName = match ? nameOf(match) : undefined;
    if (!nameOf(node) && codeName && !used.has(codeName)) {
      used.add(codeName);
      return withName(node, codeName, children);
    }
    return children ? { ...node, children } : node;
  };
  return assignFieldNames(visit(tree, named));
}

/** The tree without field names (built template sections, store drafts). */
export function stripFieldNames(tree: NodeTemplate): NodeTemplate {
  const { field: _field, ...props } = tree.props as Props;
  return {
    ...tree,
    props: ("field" in (tree.props as Props) ? props : tree.props) as NodeTemplate["props"],
    ...(tree.children && { children: tree.children.map(stripFieldNames) }),
  };
}

/** What the template form can set on a field. */
export type LibraryFieldKind = "text" | "image" | "link" | "list" | "form" | "video";

export type LibraryField = {
  field: string;
  type: string;
  /** The layer name (both languages), else empty: the form falls back to the type. */
  label: Localized | null;
  kind: LibraryFieldKind;
  /** The prop the bare key sets. */
  prop: string;
  /** Other props the form offers (`href`, `alt`, `source`…). */
  extras: string[];
  /** The library's own value of `prop` (both languages for copy): the placeholder. */
  original: unknown;
  /** The library's own value of each extra (both languages for `alt` / `title`). */
  extraOriginals: Record<string, unknown>;
  /** Filled from store data (a data-list card, a bound field): shown, not editable. */
  bound: boolean;
};

const LIST_TYPES = new Set(["productList", "categoryList", "postList"]);
/** Extras that are copy (both languages). */
export const LOCALIZED_EXTRAS: ReadonlySet<string> = new Set(["alt", "title"]);

function localizedProp(props: Props, key: string): Localized | null {
  const ar = props[key];
  if (typeof ar !== "string") return null;
  const en = (props.translations as { en?: Props } | undefined)?.en?.[key];
  return { ar, en: typeof en === "string" ? en : ar };
}

function kindOf(node: NodeTemplate): { kind: LibraryFieldKind; prop: string; extras: string[] } | null {
  const props = node.props as Props;
  if (LIST_TYPES.has(node.type)) return { kind: "list", prop: "source", extras: ["sort", "limit"] };
  if (node.type === "storeForm") return { kind: "form", prop: "formTemplate", extras: [] };
  if (node.type === "image") return { kind: "image", prop: "src", extras: ["alt"] };
  if (node.type === "video") return { kind: "video", prop: "url", extras: ["title"] };
  if (node.type === "linkBlock") return { kind: "link", prop: "href", extras: [] };
  const prop = PRIMARY_PROP[node.type];
  if (prop && typeof props[prop] === "string") return { kind: "text", prop, extras: typeof props.href === "string" ? ["href"] : [] };
  return null;
}

/**
 * The fields a template can fill in a named library tree, in tree order:
 * copy, photos, links, data lists, forms and videos. Nodes inside a data
 * list (its repeated card) or bound to a record field are `bound`.
 */
export function libraryFieldsOf(tree: NodeTemplate): LibraryField[] {
  const out: LibraryField[] = [];
  const visit = (node: NodeTemplate, inList: boolean) => {
    const props = node.props as Props;
    const field = nameOf(node);
    const kind = kindOf(node);
    if (field && kind) {
      const copy = kind.kind === "text";
      out.push({
        field,
        type: node.type,
        label: localizedProp(props, "label") ?? null,
        ...kind,
        original: copy ? localizedProp(props, kind.prop) : (props[kind.prop] ?? null),
        extraOriginals: Object.fromEntries(
          kind.extras.map((extra) => [extra, LOCALIZED_EXTRAS.has(extra) ? localizedProp(props, extra) : (props[extra] ?? null)]),
        ),
        bound: inList || typeof props.bind === "string",
      });
    }
    for (const child of node.children ?? []) visit(child, inList || LIST_TYPES.has(node.type));
  };
  visit(tree, false);
  return out;
}
