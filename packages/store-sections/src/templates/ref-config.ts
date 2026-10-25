/**
 * Templates in their stored form (owner, 2026-10-25; named fields
 * 2026-10-26): every section built from a section-library design
 * (`fromLibrary`), and every Classic / Atelier design (library sections
 * too), becomes a `libraryRef` with no tree: the library key plus the
 * template's values per named field (`library-fields.ts`). A section becomes
 * a ref only when the ref, built from the CODE library (what
 * `library_sections` was seeded with), gives exactly the section's tree, so
 * the conversion never changes how a template looks and a section an admin
 * edited in the Template Studio keeps its tree. Pure, no React.
 */
import type { LibraryRef, SectionInstance, SiteConfig } from "../config/schema";
import { getDesign, treeBuilder, type Design } from "../designs";
import { designSlotTree } from "../designs/photo-slots";
import { getTemplateDesign, getTemplateOwnDesign } from "./catalog";
import { sourceDesignId } from "./essentials";
import { assignFieldNames } from "./library-fields";
import { compactTemplateConfig, libraryValuesFromTree, resolveTemplateRefs, type LibraryTreeRow } from "./library-ref";
import type { TemplateDefinition } from "./types";

const codeTrees = new Map<string, LibraryTreeRow | null>();

/** A library key's code design: a section-library design, or a Classic / Atelier design. */
export function codeLibraryDesign(key: string): Design | undefined {
  const design = getDesign(key);
  return design && !design.libraryId ? design : getTemplateOwnDesign(key);
}

/** The code library design's named slot tree (what `library_sections` was seeded with): the fallback for a key with no row. */
export function codeLibraryTree(key: string): LibraryTreeRow | undefined {
  if (!codeTrees.has(key)) {
    const design = codeLibraryDesign(key);
    codeTrees.set(key, design ? { tree: assignFieldNames(designSlotTree(design)), category: design.category } : null);
  }
  return codeTrees.get(key) ?? undefined;
}

const refs = new Map<string, LibraryRef | null>();

/**
 * A template design as a ref: its library key and the values that turn the
 * library tree into the design's tree (null when it is not a library design,
 * or its tree is not the library tree with values). Built once per design.
 */
export function designRef(design: Design, industry?: string): LibraryRef | undefined {
  const cacheKey = `${design.id}|${industry ?? ""}`;
  if (!refs.has(cacheKey)) refs.set(cacheKey, buildDesignRef(design, industry));
  return refs.get(cacheKey) ?? undefined;
}

function buildDesignRef(design: Design, industry: string | undefined): LibraryRef | null {
  const own = getTemplateOwnDesign(design.id) === design;
  const key = own ? design.id : design.libraryRef?.key;
  const row = key ? codeLibraryTree(key) : undefined;
  if (!key || !row) return null;
  // A template design builds the tree its config holds (`instantiateDesign`: real photos, not slots).
  const built = design.tree(treeBuilder);
  const values = libraryValuesFromTree(row.tree, built, {
    category: row.category,
    industry,
    corners: design.libraryRef?.patch?.corners,
    plain: own,
  });
  return values ? { key, ...values } : null;
}

const NO_ROWS = new Map<string, LibraryTreeRow>();

const sectionsOf = (config: SiteConfig) => [config.header, config.footer, ...config.pages.flatMap((page) => page.content.sections)];

/** Whether any section is a ref in the earlier `patch` form (TR-01). */
export function hasPatchRefs(config: SiteConfig): boolean {
  return sectionsOf(config).some((section) => section?.libraryRef?.patch !== undefined);
}

export type ToRefsOptions = {
  /** The template's industry (`templates.category`). */
  industry?: string;
  /** What storing does to a config (`sanitizeSiteConfig`), when the config was stored sanitized. */
  normalize?: (config: SiteConfig) => SiteConfig;
};

/**
 * The config with every tree section whose design (its `source`) is a
 * library design copy turned into a `libraryRef`, when the ref builds exactly
 * its tree from the code library. Sections that already are refs, or have no
 * such design, are unchanged.
 */
export function toLibraryRefs(config: SiteConfig, refOf: (designId: string) => LibraryRef | undefined, opts: ToRefsOptions = {}): SiteConfig {
  const attach = (section: SectionInstance | null): SectionInstance | null => {
    if (!section?.componentTree || section.libraryRef) return section;
    const id = sourceDesignId(section);
    const ref = id ? refOf(id) : undefined;
    return ref ? { ...section, libraryRef: ref } : section;
  };
  const candidate: SiteConfig = {
    ...config,
    header: attach(config.header),
    footer: attach(config.footer),
    pages: config.pages.map((page) => ({ ...page, content: { ...page.content, sections: page.content.sections.map((s) => attach(s)!) } })),
  };
  return compactTemplateConfig(candidate, NO_ROWS, { industry: opts.industry, fallback: codeLibraryTree, normalize: opts.normalize });
}

/** A code template's config with its library sections as refs (`templateConfigJson`, the seed SQL). */
export function templateRefConfig(template: TemplateDefinition, config: SiteConfig = template.config(), opts: Omit<ToRefsOptions, "industry"> = {}): SiteConfig {
  const designs = new Map(template.designs.map((design) => [design.id, design]));
  return toLibraryRefs(
    config,
    (id) => {
      const design = designs.get(id);
      return design ? designRef(design, template.category) : undefined;
    },
    { ...opts, industry: template.category },
  );
}

/**
 * A stored template config (any code template's seed, possibly edited in
 * the Studio) with its unchanged library sections as refs: the
 * `backfill:template-refs` conversion. `normalize` is the sanitizer the
 * stored config went through.
 */
export function storedTemplateRefConfig(config: SiteConfig, opts: ToRefsOptions = {}): SiteConfig {
  // Refs in the earlier patch form are built first (from the code library), then converted like trees.
  const built = hasPatchRefs(config)
    ? resolveTemplateRefs(config, NO_ROWS, { industry: opts.industry, fallback: codeLibraryTree, patchOnly: true }).config
    : config;
  return toLibraryRefs(
    opts.normalize && built !== config ? opts.normalize(built) : built,
    (id) => {
      const design = getTemplateDesign(id);
      return design ? designRef(design, opts.industry) : undefined;
    },
    opts,
  );
}
