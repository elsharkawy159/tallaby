/**
 * Storefront templates 02–38 (Claude Design "Storefront Templates"), built
 * from section-library designs with `fromLibrary` (`./_library.ts`): this
 * turns a compact description (look, chrome, pages, demo store) into a
 * `TemplateDefinition` like Atelier's. No React here.
 */
import { SITE_CONFIG_VERSION, type SiteConfig, type SitePage } from "../config/schema";
import type { Localized } from "../core/types";
import type { StoreFontName } from "../core/fonts";
import { instantiateDesign, type Design } from "../designs/builder";
import type { TemplateDefinition, TemplateDemo } from "./types";

export type LibraryTemplatePage = {
  slug: string;
  name: Localized;
  seo?: { title?: Localized; description?: Localized };
  sections: readonly Design[];
};

export type LibraryTemplateSpec = {
  key: string;
  version: number;
  name: Localized;
  description: Localized;
  /** A store industry id (`templates.category`). */
  category: string;
  sortOrder: number;
  palette: readonly string[];
  colors: SiteConfig["designSystem"]["colors"];
  fonts: { heading: StoreFontName; body: StoreFontName };
  radius: number;
  containerMaxWidth?: number;
  header: Design;
  footer: Design;
  /** The first page is the home page. */
  pages: readonly LibraryTemplatePage[];
  demo: TemplateDemo;
  changelog?: string;
};

/** A design as a template section: its id doubles as the instance id, so a re-apply keeps matching sections. */
const section = (design: Design) => instantiateDesign(design, { id: design.id, defaultLocale: "ar" });

export function libraryTemplate(spec: LibraryTemplateSpec): TemplateDefinition {
  const config = (): SiteConfig => ({
    schemaVersion: SITE_CONFIG_VERSION,
    designSystem: {
      colors: spec.colors,
      typography: { headingFont: spec.fonts.heading, bodyFont: spec.fonts.body },
      spacing: { borderRadius: spec.radius, containerMaxWidth: spec.containerMaxWidth ?? 1280 },
    },
    header: section(spec.header),
    footer: section(spec.footer),
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: spec.pages.map(
      (page, index): SitePage => ({
        slug: page.slug,
        isHome: index === 0,
        name: page.name.ar,
        showInNav: true,
        seo: { ...(page.seo?.title && { title: page.seo.title.ar }), ...(page.seo?.description && { description: page.seo.description.ar }) },
        content: { sections: page.sections.map(section) },
      }),
    ),
  });
  const home = spec.pages[0]!;
  return {
    key: spec.key,
    version: spec.version,
    name: spec.name,
    description: spec.description,
    category: spec.category,
    sortOrder: spec.sortOrder,
    changelog:
      spec.changelog ??
      `${spec.name.en} v${spec.version}: ${home.sections.length} home sections, ${spec.pages
        .slice(1)
        .map((p) => p.name.en)
        .join(", ")} pages`,
    palette: spec.palette,
    config,
    pageNames: Object.fromEntries(spec.pages.map((p) => [p.slug, p.name])),
    demo: spec.demo,
    designs: [spec.header, ...spec.pages.flatMap((p) => p.sections), spec.footer],
  };
}

type DemoProduct = TemplateDemo["products"][number];

/** Product line of a demo store: `[slug, category, ar, en, photo url, price, options]`. */
export type DemoProductRow = [
  slug: string,
  category: string,
  ar: string,
  en: string,
  image: string,
  price: number,
  o?: Partial<Pick<DemoProduct, "compareAtPrice" | "isFeatured" | "inStock" | "rating" | "sold90">>,
];

/**
 * A preview store from compact rows (preview only: never written to a store).
 * Products are newest first in the order written.
 */
export function demoStore(o: {
  name: Localized;
  description: Localized;
  categories: readonly [id: string, ar: string, en: string, image: string][];
  products: readonly DemoProductRow[];
}): TemplateDemo {
  const products = o.products.map(
    ([slug, category, ar, en, image, price, extra = {}], index): DemoProduct => ({
      id: `demo-${slug}`,
      title: { ar, en },
      slug,
      image,
      price,
      compareAtPrice: extra.compareAtPrice ?? null,
      isFeatured: extra.isFeatured ?? false,
      categoryId: `demo-${category}`,
      inStock: extra.inStock ?? true,
      createdAt: new Date(Date.UTC(2026, 9, 18 - index)).toISOString(),
      rating: extra.rating ?? 4.7,
      sold90: extra.sold90 ?? 10,
      sold14: Math.round((extra.sold90 ?? 10) / 5),
    }),
  );
  return {
    store: { name: o.name, description: o.description },
    categories: o.categories.map(([id, ar, en, image]) => ({
      id: `demo-${id}`,
      name: { ar, en },
      image,
      productCount: products.filter((p) => p.categoryId === `demo-${id}`).length,
    })),
    products,
  };
}

const PEXELS = "https://images.pexels.com/photos/";

/** A Pexels photo URL at a given width (free licence, no attribution needed). */
export function pexels(id: number, width = 1280): string {
  return `${PEXELS}${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

/** A social handle (`@name`) kept left-to-right inside Arabic text (Unicode isolate), so the `@` stays in front. */
export function handle(name: string): string {
  return `\u2066${name}\u2069`;
}
