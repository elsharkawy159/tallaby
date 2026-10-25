/**
 * Templates in their stored form (owner, 2026-10-25): every section built
 * from a section-library design (`fromLibrary`) becomes a `libraryRef` with
 * no tree; the template's own designs stay inline. A section becomes a ref
 * only when the ref, built from the CODE library (what `library_sections`
 * was seeded with), gives exactly the section's tree, so the conversion
 * never changes how a template looks today and a section an admin edited in
 * the Template Studio keeps its tree. Pure, no React.
 */
import type { LibraryRef, SectionInstance, SiteConfig } from "../config/schema";
import { getDesign } from "../designs";
import { designSlotTree } from "../designs/photo-slots";
import { getTemplateDesign } from "./catalog";
import { sourceDesignId } from "./essentials";
import { compactTemplateConfig, type LibraryTreeRow } from "./library-ref";
import type { TemplateDefinition } from "./types";

const codeTrees = new Map<string, LibraryTreeRow | null>();

/** The code library design's slot tree (what `library_sections` was seeded with): the fallback for a key with no row. */
export function codeLibraryTree(key: string): LibraryTreeRow | undefined {
  if (!codeTrees.has(key)) {
    const design = getDesign(key);
    codeTrees.set(key, design && !design.libraryId ? { tree: designSlotTree(design), category: design.category } : null);
  }
  return codeTrees.get(key) ?? undefined;
}

const NO_ROWS = new Map<string, LibraryTreeRow>();

export type ToRefsOptions = {
  /** The template's industry (`templates.category`). */
  industry?: string;
  /** What storing does to a config (`sanitizeSiteConfig`), when the config was stored sanitized. */
  normalize?: (config: SiteConfig) => SiteConfig;
};

/**
 * The config with every tree section whose design (its `source`) is a
 * template copy of a library design turned into a `libraryRef`, when the
 * ref builds exactly its tree from the code library. Sections that already
 * are refs, or have no such design, are unchanged.
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
  return toLibraryRefs(config, (id) => designs.get(id)?.libraryRef, { ...opts, industry: template.category });
}

/**
 * A stored template config (any code template's seed, possibly edited in
 * the Studio) with its unchanged library sections as refs: the
 * `backfill:template-refs` conversion. `normalize` is the sanitizer the
 * stored config went through.
 */
export function storedTemplateRefConfig(config: SiteConfig, opts: ToRefsOptions = {}): SiteConfig {
  return toLibraryRefs(config, (id) => getTemplateDesign(id)?.libraryRef, opts);
}
