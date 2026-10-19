/**
 * Section designs (tree-sections plan 1): a pre-built section is data, a tree
 * of element nodes written with the `t` helpers below. Inserting a design
 * gives an ordinary `custom-section` whose one root is a `section` node, so
 * every element is selectable, styleable and movable like any custom element.
 *
 * Text is authored as `{ ar, en }`. The store's default locale goes into
 * `props`, the other into `props.translations` (the overlay `core/locale.ts`
 * reads). Pure and React-free.
 */
import type { ComponentNode, SectionInstance, SiteLocale } from "../config/schema";
import type { Localized } from "../core/types";
import type { LibraryCategoryId } from "../library/types";
import { getElementDefinition, type ElementIconName, type ElementType, type PatternVariant } from "../elements/registry";
import type { StyleBreakpoint, StyleValues } from "../elements/style";
import { fromTemplate, type MakeId, type NodeTemplate } from "../elements/tree";
import { peoplePhoto, stockPhoto } from "./stock-photos";

/** A plain string is the same in both locales. */
export type DesignText = string | Localized;

export type NodeOptions = {
  /** Layers name of the node. */
  label?: DesignText;
  /** Content role (`title`, `image`, `items`…), used to carry content between designs. */
  role?: string;
  /** Inside a data list: the record field this node shows (`title`, `price`, `image`, `href`…). */
  bind?: string;
  style?: StyleValues;
  tablet?: StyleValues;
  mobile?: StyleValues;
};

export type GridOptions = NodeOptions & { columns: { desktop: number; tablet?: number; mobile?: number } };

/** A data list: grid columns plus what it shows (`elements/data.ts`). */
export type ListOptions = GridOptions & {
  source?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  /** The section still shows when this list is empty (another list carries it). */
  optional?: boolean;
};

export type Design = {
  id: string;
  version: number;
  category: LibraryCategoryId;
  subcategory: string;
  name: Localized;
  description: Localized;
  keywords: readonly string[];
  tree: (t: TreeBuilder) => NodeTemplate;
};

const DESIGN_ID_RE = /^[a-z0-9-]+$/;

export function defineDesign(design: Design): Design {
  if (!DESIGN_ID_RE.test(design.id)) throw new Error(`Invalid design id: ${design.id}`);
  return design;
}

// ---------------------------------------------------------------------------
// Node helpers
// ---------------------------------------------------------------------------

/** Localized props in authoring form: Arabic in `props`, English in `translations.en`. */
function localize(values: Record<string, DesignText | undefined>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const en: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (typeof value === "string") props[key] = value;
    else {
      props[key] = value.ar;
      if (value.en !== value.ar) en[key] = value.en;
    }
  }
  if (Object.keys(en).length) props.translations = { en };
  return props;
}

function make(type: ElementType, props: Record<string, DesignText | boolean | undefined>, opts: NodeOptions = {}, children: NodeTemplate[] = []): NodeTemplate {
  const text: Record<string, DesignText | undefined> = { label: opts.label };
  const plain: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" || (value && typeof value === "object")) text[key] = value as DesignText;
    else if (value !== undefined) plain[key] = value;
  }
  const breakpointStyles: Partial<Record<StyleBreakpoint, StyleValues>> = {};
  if (opts.tablet) breakpointStyles.tablet = opts.tablet;
  if (opts.mobile) breakpointStyles.mobile = opts.mobile;
  return {
    type: type as ComponentNode["type"],
    props: { ...plain, ...(opts.role && { role: opts.role }), ...(opts.bind && { bind: opts.bind }), ...localize(text) },
    children,
    ...(opts.style && { style: { ...opts.style } }),
    ...(Object.keys(breakpointStyles).length && { breakpointStyles }),
  };
}

/** Registry defaults first, then the design's own style. */
function withDefaults(type: ElementType, opts: NodeOptions = {}): NodeOptions {
  const definition = getElementDefinition(type);
  const style = { ...definition?.defaultStyle, ...opts.style };
  const tablet = { ...definition?.defaultBreakpointStyles?.tablet, ...opts.tablet };
  const mobile = { ...definition?.defaultBreakpointStyles?.mobile, ...opts.mobile };
  return {
    ...opts,
    ...(Object.keys(style).length && { style }),
    ...(Object.keys(tablet).length && { tablet }),
    ...(Object.keys(mobile).length && { mobile }),
  };
}

/**
 * The `t` helpers. `industry` picks the default photos (`./stock-photos.ts`)
 * that `photo`/`person` put in; everything else is the same for every store.
 */
export function createTreeBuilder(industry?: string) {
  const image = (src: string, alt: DesignText, opts?: NodeOptions) => make("image", { src, alt }, withDefaults("image", opts));
  /** Columns per device as styles, like `grid`. */
  const columned = (type: ElementType, props: Record<string, DesignText | boolean | undefined>, opts: GridOptions, children: NodeTemplate[]) => {
    const { columns, ...rest } = opts;
    return make(
      type,
      props,
      {
        ...rest,
        style: { columns: columns.desktop, ...rest.style },
        ...(columns.tablet !== undefined && { tablet: { columns: columns.tablet, ...rest.tablet } }),
        ...(columns.mobile !== undefined && { mobile: { columns: columns.mobile, ...rest.mobile } }),
      },
      children,
    );
  };
  const list = (type: "productList" | "categoryList" | "postList", children: NodeTemplate[], opts: ListOptions) => {
    const { source, sort, limit, offset, optional, ...rest } = opts;
    const node = columned(type, { source, sort, optional }, rest, children);
    return { ...node, props: { ...node.props, ...(limit !== undefined && { limit }), ...(offset && { offset }) } };
  };
  return {
    section: (opts: NodeOptions, children: NodeTemplate[]) => make("section", {}, withDefaults("section", opts), children),
    container: (children: NodeTemplate[], opts?: NodeOptions) => make("container", {}, opts, children),
    stack: (children: NodeTemplate[], opts?: NodeOptions) => make("vFlex", {}, opts, children),
    row: (children: NodeTemplate[], opts?: NodeOptions) => make("hFlex", {}, opts, children),
    grid: (children: NodeTemplate[], opts: GridOptions) => columned("grid", {}, opts, children),
    /** Store products; `children` is the card repeated per product (bind its parts). */
    productList: (children: NodeTemplate[], opts: ListOptions) => list("productList", children, opts),
    /** Store categories; `children` is the card repeated per category. */
    categoryList: (children: NodeTemplate[], opts: ListOptions) => list("categoryList", children, opts),
    /** Published blog posts; `children` is the card repeated per post. */
    postList: (children: NodeTemplate[], opts: ListOptions) => list("postList", children, opts),
    /**
     * One of the store's forms, picked by the seller after inserting. In a
     * template, `formTemplate` names the ready-made form (`contact`,
     * `newsletter`…) that "Use template" creates and binds here.
     */
    storeForm: (opts?: NodeOptions & { formTemplate?: string }) => {
      const { formTemplate, ...rest } = opts ?? {};
      const node = make("storeForm", {}, { label: { ar: "النموذج", en: "Form" }, ...rest });
      return formTemplate ? { ...node, props: { ...node.props, formTemplate } } : node;
    },
    /** The cart button of the product a list card shows. */
    addToCart: (opts?: NodeOptions) => make("addToCart", {}, opts),
    /** The wishlist heart of the product a list card shows. */
    wishlistButton: (opts?: NodeOptions) => make("wishlistButton", {}, opts),
    card: (children: NodeTemplate[], opts?: NodeOptions) => make("card", {}, withDefaults("card", opts), children),
    box: (children: NodeTemplate[], opts?: NodeOptions) => make("div", {}, opts, children),
    pattern: (variant: PatternVariant, opts?: NodeOptions) => make("pattern", { variant }, opts),
    heading: (text: DesignText, level: "h1" | "h2" | "h3" | "h4", opts?: NodeOptions) => make("heading", { text, level }, opts),
    paragraph: (text: DesignText, opts?: NodeOptions) => make("paragraph", { text }, opts),
    text: (text: DesignText, opts?: NodeOptions) => make("text", { text }, opts),
    badge: (text: DesignText, opts?: NodeOptions) => make("badge", { text }, opts),
    button: (label: DesignText, href: string, variant: "solid" | "outline" | "light" = "solid", opts?: NodeOptions) =>
      make("button", { label, href, variant }, opts),
    image,
    /** Default photo `index` for the store's industry. */
    photo: (index: number, alt: DesignText, opts?: NodeOptions) => image(stockPhoto(industry, index), alt, opts),
    /** Default photo of people (owner, team, packing). */
    person: (index: number, alt: DesignText, opts?: NodeOptions) => image(peoplePhoto(index), alt, opts),
    /**
     * A YouTube player (link set by the seller). `poster` is the default photo
     * `index`, shown on the canvas until a link is pasted.
     */
    video: (poster: number, title: DesignText, opts?: NodeOptions) =>
      make("video", { url: "", thumbnail: "auto", controls: true, poster: stockPhoto(industry, poster), title }, withDefaults("video", opts)),
    /**
     * A playlist: a player beside (or above) its list. Each video gets its
     * link from the seller; `poster` is a default photo used as its thumbnail.
     */
    playlist: (
      videos: { title: DesignText; duration?: DesignText; poster: number }[],
      opts?: NodeOptions & { listPosition?: "end" | "start" | "below" },
    ) =>
      make(
        "videoPlaylist",
        { listPosition: opts?.listPosition ?? "end", controls: true },
        withDefaults("videoPlaylist", opts),
        videos.map((v) => make("videoItem", { url: "", title: v.title, duration: v.duration, poster: stockPhoto(industry, v.poster) })),
      ),
    quote: (text: DesignText, opts?: NodeOptions) => make("blockQuote", { text }, opts),
    textLink: (text: DesignText, href: string, opts?: NodeOptions) => make("textLink", { text, href }, opts),
    link: (href: string, children: NodeTemplate[], opts?: NodeOptions) => make("linkBlock", { href }, withDefaults("linkBlock", opts), children),
    icon: (name: ElementIconName, opts?: NodeOptions) => make("icon", { name }, opts),
    list: (items: DesignText[], opts?: NodeOptions) =>
      make(
        "list",
        {},
        opts,
        items.map((text) => make("listItem", { text })),
      ),
    accordion: (items: { title: DesignText; body: DesignText; open?: boolean }[], opts?: NodeOptions) =>
      make(
        "accordion",
        {},
        opts,
        items.map((item) => make("accordionItem", { title: item.title, open: item.open || undefined }, {}, [make("paragraph", { text: item.body })])),
      ),
    divider: (opts?: NodeOptions) => make("divider", {}, opts),
    spacer: (height: number, opts?: NodeOptions) => make("spacer", {}, { ...opts, style: { minHeight: height, ...opts?.style } }),
  };
}

export type TreeBuilder = ReturnType<typeof createTreeBuilder>;

export const treeBuilder: TreeBuilder = createTreeBuilder();

// ---------------------------------------------------------------------------
// Instantiation
// ---------------------------------------------------------------------------

/** Puts English in `props` and Arabic in `translations.ar` (English-default stores). */
function swapToEnglish(node: NodeTemplate): NodeTemplate {
  const { translations, ...props } = node.props as Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
  const en = translations?.en;
  let next = props;
  if (en && Object.keys(en).length) {
    const ar = Object.fromEntries(Object.keys(en).map((key) => [key, props[key]]));
    next = { ...props, ...en, translations: { ar } };
  }
  return { ...node, props: next, children: (node.children ?? []).map(swapToEnglish) };
}

/**
 * A new tree section from a design: fresh node ids (`${id}-n1`, `${id}-n2`…
 * unless `makeId` is given), text in the store's default locale, photos for
 * the store's industry.
 */
export function instantiateDesign(design: Design, opts: { id: string; defaultLocale?: SiteLocale; makeId?: MakeId; industry?: string }): SectionInstance {
  let counter = 0;
  const makeId = opts.makeId ?? (() => `${opts.id}-n${++counter}`);
  const template = design.tree(opts.industry ? createTreeBuilder(opts.industry) : treeBuilder);
  const localized = opts.defaultLocale === "en" ? swapToEnglish(template) : template;
  return {
    id: opts.id,
    sectionId: "custom-section",
    version: 1,
    props: {},
    source: `${design.id}@${design.version}`,
    componentTree: [fromTemplate(localized, makeId)],
  };
}
