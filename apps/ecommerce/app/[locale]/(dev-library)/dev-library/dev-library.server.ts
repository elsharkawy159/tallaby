import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { DESIGNS, LIBRARY_CATEGORIES, siteDarkCss, type Design } from "@workspace/store-sections/render";
import { CODE_TEMPLATES, TEMPLATE_OWN_DESIGNS } from "@workspace/store-sections/templates";
import type { DevLibraryData, DevSectionGroup, DevSectionItem, DevTemplateGroup } from "./dev-library.types";

/**
 * The section and template library (owner, 2026-10-27): every code design and
 * template, open on tallaby.com and in local dev, never indexed (noindex meta
 * in the layout, `X-Robots-Tag` in next.config, not in the sitemap). Store
 * hosts never reach it: the proxy sends every store path to the storefront.
 * Platform code and demo data only; no store or user data.
 */

const REPO = resolve(process.cwd(), "../..");
const SECTIONS_SRC = join(REPO, "packages/store-sections/src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__snapshots__" ? [] : sourceFiles(path);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

/**
 * The file that declares each design id (`id: "…"`), repo-relative, so the card can say where to edit it.
 * Read from the working tree, so only where the sources are on disk (local dev); a deployed build has
 * no `packages/` sources and simply shows no file paths.
 */
function designFiles(): Map<string, string> {
  const out = new Map<string, string>();
  let files: string[];
  try {
    files = [...sourceFiles(join(SECTIONS_SRC, "designs")), ...sourceFiles(join(SECTIONS_SRC, "templates"))];
  } catch {
    return out;
  }
  for (const file of files) {
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(/\bid: "([a-z0-9-]+)"/g)) {
      if (!out.has(match[1]!)) out.set(match[1]!, relative(REPO, file).replace(/\\/g, "/"));
    }
  }
  return out;
}

let cached: DevLibraryData | null = null;

/** Built once per server instance (it builds every template's config); rebuilt each time in dev, where the code changes. */
export function devLibraryData(): DevLibraryData {
  if (process.env.NODE_ENV !== "development" && cached) return cached;
  cached = buildDevLibraryData();
  return cached;
}

function buildDevLibraryData(): DevLibraryData {
  const files = designFiles();
  // Which templates are built from each section: library templates copy a library design
  // (`libraryId`); Classic and Atelier use their own designs by id.
  const usedBy = new Map<string, string[]>();
  const templateSections = new Map<string, string[]>();
  for (const template of CODE_TEMPLATES) {
    const ids = [...new Set(template.designs.map((d) => d.libraryId ?? d.id))];
    templateSections.set(template.key, ids);
    for (const id of ids) usedBy.set(id, [...(usedBy.get(id) ?? []), template.key]);
  }
  const item = (design: Design, subcategories: readonly { id: string; name: { ar: string; en: string } }[] = []): DevSectionItem => ({
    id: design.id,
    name: design.name,
    description: design.description,
    category: design.category,
    subcategory: subcategories.find((s) => s.id === design.subcategory)?.name.en ?? design.subcategory,
    version: design.version,
    file: files.get(design.id) ?? null,
    usedBy: usedBy.get(design.id) ?? [],
  });

  const sections: DevSectionGroup[] = LIBRARY_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    items: DESIGNS.filter((design) => design.category === category.id).map((design) => item(design, category.subcategories)),
  }));
  // Anything in a category the tree doesn't list yet still shows.
  const listed = new Set(LIBRARY_CATEGORIES.map((c) => c.id));
  const unlisted = DESIGNS.filter((design) => !listed.has(design.category));
  if (unlisted.length) sections.push({ id: "other", name: { ar: "أخرى", en: "Other" }, items: unlisted.map((d) => item(d)) });
  sections.push({
    id: "template-own",
    name: { ar: "تصاميم القوالب الخاصة", en: "Template-own designs (Classic, Atelier)" },
    items: TEMPLATE_OWN_DESIGNS.map((d) => item(d)),
  });

  const byCategory = new Map<string, DevTemplateGroup>();
  for (const template of CODE_TEMPLATES) {
    const group = byCategory.get(template.category) ?? { id: template.category, items: [] };
    const config = template.config();
    group.items.push({
      key: template.key,
      name: template.name,
      description: template.description,
      version: template.version,
      isDefault: template.isDefault === true,
      folder: `packages/store-sections/src/templates/${template.folder ?? template.key}`,
      palette: [...template.palette],
      pages: config.pages.map((page) => ({ slug: page.isHome ? "" : page.slug, name: template.pageNames[page.slug] ?? { ar: page.name, en: page.name } })),
      homeSections: config.pages.find((p) => p.isHome)?.content.sections.length ?? 0,
      sections: templateSections.get(template.key) ?? [],
    });
    byCategory.set(template.category, group);
  }

  return {
    sections: sections.filter((group) => group.items.length > 0),
    templates: [...byCategory.values()],
    demoTemplates: CODE_TEMPLATES.map((t) => ({ key: t.key, name: t.name.en })),
    darkCss: siteDarkCss(),
  };
}
