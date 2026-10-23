/**
 * Non-destructive template apply (PLAN.md §8.1, §12 step 10, P4-05). Pure:
 * @workspace/lib reads the store's drafts, calls this, and writes the result
 * back as DRAFTS only (the live revision is unchanged until Publish).
 *
 * - The design system becomes the template's (a template is a look).
 * - Each template page replaces the matching draft page's sections (the home
 *   page matches the home page, the product page the store's product page,
 *   others by slug among the normal pages). Where a template section has
 *   the same instance id and section type as one of the store's, the store's
 *   text and image overrides (`overrideKeys`, also per translation) are kept.
 * - Template pages the store does not have are created; the store's other
 *   pages are left exactly as they are (never deleted).
 * - Header and footer follow the same per-section rule.
 * No React here.
 */
import type { DesignSystem, PageContent, SectionInstance, SiteConfig } from "../config/schema";
import { isProductPage, type PageKind } from "../config/product-page.lib";

export type DraftPage = { slug: string; isHome: boolean; /** Absent means a normal page. */ kind?: PageKind; content: PageContent };

export type DraftSite = {
  designSystem: DesignSystem;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  pages: DraftPage[];
};

/** Section id → the prop keys that hold seller content (`contentOverrideKeys`). */
export type OverrideKeys = Readonly<Record<string, readonly string[]>>;

export type TemplatePageChange = {
  /** The store page this replaces (`null` = a new page). */
  targetSlug: string | null;
  slug: string;
  /** `product` for the product page. */
  kind: PageKind;
  name: string;
  showInNav: boolean;
  seo: SiteConfig["pages"][number]["seo"];
  content: PageContent;
};

export type TemplateMergeResult = {
  designSystem: DesignSystem;
  header: SectionInstance | null;
  footer: SectionInstance | null;
  pages: TemplatePageChange[];
};

function pick(source: Record<string, unknown> | undefined, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!source) return out;
  for (const key of keys) if (key in source) out[key] = source[key];
  return out;
}

/** The template's instance, with the store's content overrides when it is the same section. */
export function mergeSectionInstance(current: SectionInstance | null | undefined, incoming: SectionInstance, overrideKeys: OverrideKeys): SectionInstance {
  if (!current || current.id !== incoming.id || current.sectionId !== incoming.sectionId) return incoming;
  const keys = overrideKeys[incoming.sectionId] ?? [];
  if (!keys.length) return incoming;

  const translations: NonNullable<SectionInstance["translations"]> = { ...(incoming.translations ?? {}) };
  for (const [locale, values] of Object.entries(current.translations ?? {}) as [keyof typeof translations, Record<string, unknown>][]) {
    const kept = pick(values, keys);
    if (Object.keys(kept).length) translations[locale] = { ...(translations[locale] ?? {}), ...kept };
  }
  return {
    ...incoming,
    props: { ...incoming.props, ...pick(current.props, keys) },
    ...(Object.keys(translations).length ? { translations } : {}),
  };
}

function mergeContent(current: PageContent | undefined, incoming: PageContent, overrideKeys: OverrideKeys): PageContent {
  const byId = new Map((current?.sections ?? []).map((s) => [s.id, s]));
  return { ...incoming, sections: incoming.sections.map((s) => mergeSectionInstance(byId.get(s.id), s, overrideKeys)) };
}

export function mergeTemplateIntoDraft(current: DraftSite, template: SiteConfig, overrideKeys: OverrideKeys): TemplateMergeResult {
  const home = current.pages.find((p) => p.isHome);
  const pages: TemplatePageChange[] = [];
  for (const page of template.pages) {
    const product = isProductPage(page);
    const target = page.isHome ? home : product ? current.pages.find(isProductPage) : current.pages.find((p) => !p.isHome && !isProductPage(p) && p.slug === page.slug);
    // A new page cannot take the slug of one of the store's pages (the home page, or another kind).
    if (!target && !page.isHome && current.pages.some((p) => p.slug === page.slug)) continue;
    if (!target && page.isHome && !home) continue;
    pages.push({
      targetSlug: target?.slug ?? null,
      slug: target?.slug ?? page.slug,
      kind: product ? "product" : "page",
      name: page.name,
      showInNav: page.showInNav ?? true,
      seo: page.seo,
      content: mergeContent(target?.content, page.content, overrideKeys),
    });
  }
  return {
    designSystem: template.designSystem,
    header: template.header ? mergeSectionInstance(current.header, template.header, overrideKeys) : current.header,
    footer: template.footer ? mergeSectionInstance(current.footer, template.footer, overrideKeys) : current.footer,
    pages,
  };
}

/** Section ids per page (a tree section's design, `<design>@<version>`), for the templates gallery's outline preview. */
export function templateOutline(template: SiteConfig) {
  return template.pages.map((page) => ({
    slug: page.slug,
    isHome: page.isHome,
    name: page.name,
    sections: page.content.sections.map((section) => section.source ?? section.sectionId),
  }));
}
