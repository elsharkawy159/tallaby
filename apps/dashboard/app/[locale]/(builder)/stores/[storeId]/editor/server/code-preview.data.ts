import { and, db, eq, isNull, sql, storeDesignSystems, storePages, stores } from "@workspace/db";
import type { StoreCatalogScope } from "@workspace/lib/stores/scope/server";
import { resolveCanvasCatalog } from "@workspace/store-editor/lib/editor.lib";
import type { CatalogQuery, RenderContext } from "@workspace/store-sections/render";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { loadEditorCatalog } from "./editor.data";

/**
 * Data of the code-section preview (ROADMAP F-101e). The store must already be
 * checked against the session seller; every read is scoped to it again. Never cached.
 */

/** The store row, its design-system draft and the edited page's kind, in one read. */
export async function loadCodePreviewStore(sellerId: string, storeId: string, pageId: string | undefined) {
  const [row] = await db
    .select({
      name: stores.name,
      subdomain: stores.subdomain,
      logoUrl: stores.logoUrl,
      settings: stores.settings,
      colors: storeDesignSystems.colors,
      typography: storeDesignSystems.typography,
      spacing: storeDesignSystems.spacing,
      pageKind: storePages.kind,
    })
    .from(stores)
    .leftJoin(storeDesignSystems, eq(storeDesignSystems.storeId, stores.id))
    .leftJoin(storePages, pageId ? and(eq(storePages.id, pageId), eq(storePages.storeId, stores.id)) : sql`false`)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return row ?? null;
}

/**
 * The rows a code node's picks need, of this store only, answered by the same
 * rule as the canvas (`resolveCanvasCatalog`): picked products in one query by
 * id; a picked category loads the store's categories and the products the
 * canvas has (the newest it shows). Ids of another store come back as nothing.
 */
export async function loadCodePreviewCatalog(
  sellerId: string,
  storeId: string,
  queries: Record<string, CatalogQuery>,
  locale: "ar" | "en",
): Promise<Pick<RenderContext["catalog"], "products" | "categories">> {
  const list = Object.values(queries);
  if (list.length === 0) return { products: {}, categories: [] };
  const needsCategories = list.some((q) => q.kind === "categories" || (q.kind === "products" && q.source === "category"));
  const productIds = [...new Set(list.flatMap((q) => (q.kind === "products" && q.source === "selected" ? (q.productIds ?? []) : [])))];
  const scope: StoreCatalogScope = { storeId, catalogSplit: await isSwitchOn("stores_catalog_split") };
  const loaded = await loadEditorCatalog(sellerId, scope, needsCategories ? {} : { productIds });
  const resolved = resolveCanvasCatalog(queries, loaded, locale);
  return { products: resolved.products, categories: resolved.categories };
}
