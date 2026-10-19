/**
 * Page templates in the editor (Add › Templates): which template pages fit
 * the page being edited, and a fresh copy of one to put on that page only.
 * Pure; the site-wide "Use template" (Website › Templates, `applyTemplate`)
 * is a separate action and is not used here.
 *
 * Matching uses what pages and templates actually store: the home page
 * matches template home pages, any other page matches template pages with
 * the same address (slug). There is no page-type field or alias list, so
 * none is invented (`/about-us` does not match `/about`); "Show all
 * designs" lets the seller pick any template page on purpose.
 */
import { MAX_SECTIONS_PER_PAGE, type ComponentNode, type PageContent, type SectionInstance } from "@workspace/store-sections";
import { storeSectionRegistry, type MakeId } from "@workspace/store-sections/render";
import type { TemplateCardView } from "@/app/(main)/stores/[storeId]/website/templates/templates.dto";

type OutlinePage = TemplateCardView["pages"][number];

export type TemplatePageOption = { template: TemplateCardView; page: OutlinePage };

/** Whether a template page is a design for this store page. */
export function matchesPage(templatePage: Pick<OutlinePage, "slug" | "isHome">, page: { slug: string; isHome: boolean }): boolean {
  if (page.isHome || templatePage.isHome) return page.isHome && templatePage.isHome;
  return templatePage.slug === page.slug;
}

/** Template pages that fit `page`, in gallery order (premium templates are left out: they can't be applied yet). */
export function templatePagesFor(templates: readonly TemplateCardView[], page: { slug: string; isHome: boolean }): TemplatePageOption[] {
  return templates.flatMap((template) =>
    template.isPremium ? [] : template.pages.filter((p) => matchesPage(p, page)).map((p) => ({ template, page: p })),
  );
}

/** Every page of every applicable template ("Show all designs"). */
export function allTemplatePages(templates: readonly TemplateCardView[]): TemplatePageOption[] {
  return templates.flatMap((template) => (template.isPremium ? [] : template.pages.map((page) => ({ template, page }))));
}

function reIdNodes(nodes: readonly ComponentNode[], makeId: MakeId, ids: Map<string, string>): ComponentNode[] {
  return nodes.map((node) => {
    const id = makeId();
    ids.set(node.id, id);
    return { ...node, id, children: reIdNodes(node.children, makeId, ids) };
  });
}

/** Re-keys a page-level map whose keys are element ids; other keys stay as they are. */
function reKey<T>(record: Record<string, T> | undefined, ids: Map<string, string>): Record<string, T> | undefined {
  if (!record) return undefined;
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [ids.get(key) ?? key, value]));
}

/**
 * An independent copy of a template page's content for one store page:
 * deep-cloned (the template is never touched), new ids for every section
 * and element (page-level maps keyed by element id follow them), and only
 * sections the library knows and that belong in a page (no header/footer:
 * those are shared by every page and are not changed here).
 */
export function instantiateTemplatePage(content: PageContent, makeSectionId: () => string, makeNodeId: MakeId): PageContent {
  const copy = structuredClone(content);
  const ids = new Map<string, string>();
  const sections: SectionInstance[] = copy.sections
    .filter((section) => {
      const definition = storeSectionRegistry.get(section.sectionId);
      return definition && !definition.chrome;
    })
    .slice(0, MAX_SECTIONS_PER_PAGE)
    .map((section) => ({
      ...section,
      id: makeSectionId(),
      ...(section.componentTree && { componentTree: reIdNodes(section.componentTree, makeNodeId, ids) }),
    }));
  const elementStyles = reKey(copy.elementStyles, ids);
  const elementAttributes = reKey(copy.elementAttributes, ids);
  const injectedChildren = copy.injectedChildren
    ? Object.fromEntries(Object.entries(copy.injectedChildren).map(([key, nodes]) => [ids.get(key) ?? key, reIdNodes(nodes, makeNodeId, ids)]))
    : undefined;
  return {
    sections,
    ...(elementStyles && { elementStyles }),
    ...(elementAttributes && { elementAttributes }),
    ...(injectedChildren && { injectedChildren }),
  };
}
