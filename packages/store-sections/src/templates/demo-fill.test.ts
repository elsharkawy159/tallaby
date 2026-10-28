/**
 * A template's demo store fills every list it shows (owner, 2026-10-28): a
 * category or product list gets as many demo records as its limit, and a
 * grid's limit fills whole desktop rows (6 categories in a 6-column grid,
 * never 4). Paginated lists and lists of picked categories are left out.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { collectCatalogQueries } from "../core/registry";
import type { RenderContext } from "../core/types";
import { isPaginated, listRecords } from "../elements/data";
import { storeSectionRegistry } from "../sections";
import { CODE_TEMPLATES } from "./catalog";
import { resolveDemoCatalog } from "./demo-catalog";
import { templateDemoProduct } from "./demo-product";

const walk = (nodes: readonly ComponentNode[] | undefined, visit: (node: ComponentNode) => void): void =>
  nodes?.forEach((node) => {
    visit(node);
    walk(node.children, visit);
  });

const desktopColumns = (node: ComponentNode): number => {
  const columns = (node.style as { columns?: unknown } | undefined)?.columns;
  return typeof columns === "number" ? columns : 1;
};

/** Each short list of a template, as `section > list: shown/limit (columns)`. */
function shortLists(template: (typeof CODE_TEMPLATES)[number]): string[] {
  const site = template.config();
  const product = templateDemoProduct(template.demo, { locale: "en" });
  const problems: string[] = [];
  const check = (sections: readonly SectionInstance[], withProduct: boolean) => {
    const queries = collectCatalogQueries(sections, storeSectionRegistry, withProduct ? { product } : undefined);
    const ctx = { catalog: resolveDemoCatalog(queries, template.demo, "en"), mode: "view" } as unknown as RenderContext;
    for (const section of sections) {
      walk(section.componentTree, (node) => {
        if (node.type !== "productList" && node.type !== "categoryList") return;
        if (isPaginated(node) || (Array.isArray(node.props?.categoryIds) && node.props.categoryIds.length)) return;
        const limit = typeof node.props?.limit === "number" ? node.props.limit : 8;
        const columns = desktopColumns(node);
        const shown = listRecords(node, ctx).length;
        if (shown < limit || (columns > 1 && shown % columns !== 0)) problems.push(`${section.id} > ${node.type}: ${shown}/${limit} (${columns} columns)`);
      });
    }
  };
  check(
    [site.header, site.footer].filter((section): section is SectionInstance => section != null),
    false,
  );
  for (const page of site.pages) check(page.content.sections, page.kind === "product");
  return problems;
}

describe("template demo stores fill their lists", () => {
  it.each(CODE_TEMPLATES.map((template) => [template.key, template] as const))("%s", (_key, template) => {
    const problems = shortLists(template);
    expect(problems, problems.join("; ")).toEqual([]);
  });
});
