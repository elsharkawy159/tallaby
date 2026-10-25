/**
 * Templates as section refs (owner, 2026-10-25): a template section built
 * from a section-library design is stored as `libraryRef: { key, patch }`
 * (the library key plus the template's photos, copy, links, list settings,
 * layer patches, form and corner cap) instead of a full element tree. The
 * tree is built from the library's CURRENT tree whenever the template is
 * read, so an admin edit of a library section reaches every template that
 * uses it, until a seller applies the template (the store's drafts always
 * get the built tree, never a ref).
 *
 * `applyLibraryPatch` is the one patch implementation: the code templates
 * (`fromLibrary`, strict) and stored refs (lenient) both go through it, so a
 * ref built from the code library gives exactly the code template's tree.
 *
 * Lenient mode never throws: a copy, link or layer the library tree no longer
 * has is skipped (the section shows the library's own copy there) and
 * reported in `missing`; a photo slot with no template photo gets the
 * industry's stock photo. Pure, no React.
 */
import type { LibraryPatchData, LibraryRef, SectionInstance, SiteConfig } from "../config/schema";
import type { Localized } from "../core/types";
import { PHOTO_SLOT_RE, resolvePhotoSlot } from "../designs/photo-slots";
import { instantiateTemplate } from "../designs/builder";
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";

const PLACEHOLDER_NAME = "اسم متجرك";
const PLACEHOLDER_INITIAL = "م";
/** Prop keys that never hold copy. */
const NOT_COPY = new Set(["role", "bind", "translations", "href", "src", "variant", "level", "url", "thumbnail", "poster", "source", "sort", "formTemplate"]);
const FULL_ROUND = 999;

type Props = Record<string, unknown> & { translations?: { en?: Record<string, unknown> } };
type NodePatchData = NonNullable<LibraryPatchData["nodes"]>[string];

const localized = (value: string | Localized): Localized => (typeof value === "string" ? { ar: value, en: value } : value);

/** The ready-made form a library category's `storeForm` nodes get. */
function defaultForm(category: string): string | undefined {
  if (category === "contact") return "contact";
  if (category === "newsletter" || category === "footers") return "newsletter";
  return undefined;
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
function patchNode(node: NodeTemplate, patch: NodePatchData): NodeTemplate {
  const breakpoints = { ...(node.breakpointStyles as Record<string, StyleValues> | undefined) };
  for (const bp of ["tablet", "mobile"] as const) {
    if (patch[bp]) breakpoints[bp] = { ...breakpoints[bp], ...(patch[bp] as StyleValues) };
  }
  return {
    ...node,
    ...(patch.props && { props: { ...node.props, ...patch.props } as NodeTemplate["props"] }),
    ...(patch.style && { style: { ...(node.style as StyleValues | undefined), ...(patch.style as StyleValues) } as NodeTemplate["style"] }),
    ...(Object.keys(breakpoints).length && { breakpointStyles: breakpoints as NodeTemplate["breakpointStyles"] }),
  };
}

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

export type ApplyLibraryPatchOptions = {
  /** The library row's category (`headers`, `contact`…): picks the default form and the chrome roles. */
  category: string;
  /** Throw on anything the patch names that the tree lacks (code templates and their tests). Default false. */
  strict?: boolean;
  /** For errors only. */
  label?: string;
  /** Lenient mode: the stock photos for slots the patch has no photo for. */
  industry?: string;
};

export type ApplyLibraryPatchResult = { tree: NodeTemplate; missing: string[] };

/**
 * A library slot tree (`stock:photo:N` placeholders, `library_sections.tree`)
 * with a template's patch applied: the template's photos in the slots, its
 * copy, links, list settings and layer patches swapped in, the store-name
 * roles set on the placeholder name, the ready-made form on `storeForm`
 * nodes, accent blocks made safe and the corners capped.
 */
export function applyLibraryPatch(slotTree: NodeTemplate, patch: LibraryPatchData, opts: ApplyLibraryPatchOptions): ApplyLibraryPatchResult {
  const strict = opts.strict ?? false;
  const form = patch.form ?? defaultForm(opts.category);
  const chrome = opts.category === "headers" || opts.category === "footers";
  const text = new Map(Object.entries(patch.text ?? {}).map(([ar, value]) => [ar, localized(value)]));
  const links = new Map(Object.entries(patch.links ?? {}));
  const linkSeen = new Map<string, number>();
  const used = new Set<string>();
  const slotMisses = new Set<string>();
  let listIndex = 0;

  const photoFor = (src: string): string => {
    const match = PHOTO_SLOT_RE.exec(src);
    if (!match) return src;
    const kind = match[1] as "photo" | "person";
    const index = Number(match[2]);
    const photo = patch[kind]?.[index];
    if (typeof photo === "string") return photo;
    if (strict) throw new Error(`No template photo for ${kind}(${index})`);
    slotMisses.add(`${kind}(${index})`);
    return resolvePhotoSlot(src, opts.industry);
  };

  const visit = (node: NodeTemplate): NodeTemplate => {
    const props = { ...(node.props as Props) };
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === "string" && PHOTO_SLOT_RE.test(value)) props[key] = photoFor(value);
    }
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
      if (typeof next === "string") props.href = next;
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

  const built = onAccent(visit(slotTree), false);
  const tree = patch.corners === undefined ? built : clampCorners(built, patch.corners);
  const missing = [
    ...[...text.keys()].filter((ar) => !used.has(`text:${ar}`)).map((ar) => `text "${ar}"`),
    ...[...links.keys()].filter((href) => !used.has(`link:${href}`)).map((href) => `link "${href}"`),
    ...Object.keys(patch.nodes ?? {})
      .filter((label) => !used.has(`node:${label}`))
      .map((label) => `node "${label}"`),
    ...[...links.entries()]
      .filter(([href, swap]) => typeof swap !== "string" && swap.length !== (linkSeen.get(href) ?? 0))
      .map(([href, swap]) => `${(swap as readonly unknown[]).length} swaps for ${linkSeen.get(href) ?? 0} "${href}" links`),
    ...(patch.lists && patch.lists.length > listIndex ? [`${patch.lists.length} list patches for ${listIndex} lists`] : []),
    ...[...slotMisses].map((slot) => `photo for ${slot}`),
  ];
  if (strict && missing.length) throw new Error(`${opts.label ?? "library section"} has no ${missing.join(", ")}`);
  return { tree, missing };
}

// ---------------------------------------------------------------------------
// Template configs with refs
// ---------------------------------------------------------------------------

/** A `library_sections` row as the resolver needs it (published `tree`, never `draft_tree`). */
export type LibraryTreeRow = { tree: NodeTemplate; category: string };
/** Library key → row. A key with no row falls back to `fallback` (the code design) or drops the section. */
export type LibraryTrees = ReadonlyMap<string, LibraryTreeRow>;

export type ResolveTemplateOptions = {
  /** The template's industry (`templates.category`): stock photos for slots with no template photo. */
  industry?: string;
  /**
   * Keep `libraryRef` next to the built tree (the admin Template Studio, so
   * `compactTemplateConfig` can tell which sections are still unchanged).
   * Default false: the result holds plain tree sections only.
   */
  keepRefs?: boolean;
  /** A tree for a key the database has no row for (the code library design). */
  fallback?: (key: string) => LibraryTreeRow | undefined;
};

export type ResolveTemplateResult = {
  config: SiteConfig;
  /** Library keys with no row and no fallback (those sections are left out). */
  unknownKeys: string[];
  /** Per section id: what its patch named that the current library tree lacks. */
  misses: Record<string, string[]>;
};

type AnySection = SectionInstance;

function allSections(config: SiteConfig): AnySection[] {
  return [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)].filter((s): s is AnySection => s !== null);
}

/** The library keys a stored template config refers to, first use first. */
export function templateRefKeys(config: SiteConfig): string[] {
  const keys = new Set<string>();
  for (const section of allSections(config)) if (section.libraryRef) keys.add(section.libraryRef.key);
  return [...keys];
}

/** Whether any section of the config is a library ref. */
export function hasLibraryRefs(config: SiteConfig): boolean {
  return allSections(config).some((section) => section.libraryRef !== undefined);
}

/** The built tree section of a ref (deterministic node ids `<section id>-nN`, like the code templates). */
function buildRefSection(section: AnySection, ref: LibraryRef, row: LibraryTreeRow, opts: ResolveTemplateOptions) {
  const { tree, missing } = applyLibraryPatch(row.tree, ref.patch, { category: row.category, industry: opts.industry });
  const built = instantiateTemplate(tree, { id: section.id, industry: opts.industry });
  const { libraryRef: _ref, componentTree: _tree, ...rest } = section;
  return { section: { ...rest, componentTree: built.componentTree, ...(opts.keepRefs && { libraryRef: ref }) } as AnySection, missing };
}

/**
 * A stored template config with every `libraryRef` section built from the
 * library's current tree. Sections without a ref are returned unchanged; a
 * ref whose key has no row and no fallback is dropped (a header or footer
 * becomes null).
 */
export function resolveTemplateRefs(config: SiteConfig, trees: LibraryTrees, opts: ResolveTemplateOptions = {}): ResolveTemplateResult {
  const unknownKeys = new Set<string>();
  const misses: Record<string, string[]> = {};
  const resolve = (section: AnySection | null): AnySection | null => {
    if (!section?.libraryRef) return section;
    const ref = section.libraryRef;
    const row = trees.get(ref.key) ?? opts.fallback?.(ref.key);
    if (!row) {
      unknownKeys.add(ref.key);
      return null;
    }
    const { section: built, missing } = buildRefSection(section, ref, row, opts);
    if (missing.length) misses[section.id] = missing;
    return built;
  };
  const resolved: SiteConfig = {
    ...config,
    header: resolve(config.header),
    footer: resolve(config.footer),
    pages: config.pages.map((page) => ({
      ...page,
      content: { ...page.content, sections: page.content.sections.map(resolve).filter((s): s is AnySection => s !== null) },
    })),
  };
  return { config: resolved, unknownKeys: [...unknownKeys], misses };
}

/** Deep equality of plain JSON values (key order ignored; `undefined` values count as absent). */
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === (b as unknown[]).length && a.every((item, i) => sameJson(item, (b as unknown[])[i]));
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => sameJson((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/**
 * The storage form of an edited template (Template Studio save / publish):
 * a section that still carries its `libraryRef` and whose tree is exactly
 * what the ref builds today is stored as the ref alone (it keeps following
 * the library); one the admin changed keeps its tree and loses the ref (it
 * is the template's own now). Sections without a ref are unchanged.
 */
export function compactTemplateConfig(
  config: SiteConfig,
  trees: LibraryTrees,
  opts: Omit<ResolveTemplateOptions, "keepRefs"> & {
    /**
     * What saving does to a config (the sanitizer in `validateSiteConfig`),
     * so a built tree is compared in the form the saved one is in. Gets a
     * config holding only the one section, in the same place.
     */
    normalize?: (config: SiteConfig) => SiteConfig;
  } = {},
): SiteConfig {
  const empty: SiteConfig = { ...config, header: null, footer: null, pages: [] };
  type Slot = "header" | "footer" | "page";
  const normalized = (section: AnySection, slot: Slot): AnySection | null => {
    if (!opts.normalize) return section;
    const page = config.pages[0];
    const alone: SiteConfig =
      slot === "page"
        ? { ...empty, pages: page ? [{ ...page, content: { sections: [section] } }] : [] }
        : { ...empty, [slot]: section };
    const out = opts.normalize(alone);
    return slot === "page" ? (out.pages[0]?.content.sections[0] ?? null) : out[slot];
  };
  const compact = (section: AnySection | null, slot: Slot): AnySection | null => {
    if (!section?.libraryRef || !section.componentTree) return section;
    const ref = section.libraryRef;
    const row = trees.get(ref.key) ?? opts.fallback?.(ref.key);
    const built = row ? normalized(buildRefSection(section, ref, row, opts).section, slot) : null;
    if (built && sameJson(built.componentTree, section.componentTree)) {
      const { componentTree: _tree, ...rest } = section;
      return rest;
    }
    const { libraryRef: _ref, ...rest } = section;
    return rest;
  };
  return {
    ...config,
    header: compact(config.header, "header"),
    footer: compact(config.footer, "footer"),
    pages: config.pages.map((page) => ({ ...page, content: { ...page.content, sections: page.content.sections.map((s) => compact(s, "page")!) } })),
  };
}

/** A config with every `libraryRef` removed (store drafts never hold refs). Ref sections with no tree are dropped. */
export function stripLibraryRefs(config: SiteConfig): SiteConfig {
  const strip = (section: AnySection | null): AnySection | null => {
    if (!section?.libraryRef) return section;
    if (!section.componentTree) return null;
    const { libraryRef: _ref, ...rest } = section;
    return rest;
  };
  return {
    ...config,
    header: strip(config.header),
    footer: strip(config.footer),
    pages: config.pages.map((page) => ({
      ...page,
      content: { ...page.content, sections: page.content.sections.map(strip).filter((s): s is AnySection => s !== null) },
    })),
  };
}
