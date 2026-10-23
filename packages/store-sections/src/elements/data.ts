/**
 * Data nodes (tree-sections spec §5.3): element nodes that draw store records.
 * A list node (`productList`, `categoryList`, `postList`) holds an item
 * template — its children — that the renderer repeats once per record. Inside
 * the template, `text`, `heading`, `paragraph`, `badge`, `image`, `button`,
 * `linkBlock` and `textLink` nodes may carry `props.bind`, naming one field of
 * the record (`title`, `price`, `image`…); the authored props are what the
 * editor shows when the node sits outside a list.
 *
 * Queries are collected per data node, keyed by node id, through the same
 * host resolvers as before (`collectCatalogQueries`, `collectContentQueries`,
 * `collectFormIds`), so the storefront and the editor need no new plumbing.
 * Props are untrusted JSON: every value is checked or clamped here.
 */
import type { ComponentNode, SectionInstance, SitePage } from "../config/schema";
import {
  PRODUCT_SORTS,
  PRODUCT_SOURCES,
  type CatalogQuery,
  type CategorySummary,
  type ContentItemSummary,
  type ContentQuery,
  type DataNeed,
  type ProductSort,
  type ProductSource,
  type ProductDetail,
  type ProductSummary,
  type RenderContext,
} from "../core/types";

export const DATA_LIST_TYPES = ["productList", "categoryList", "postList"] as const;
export type DataListType = (typeof DATA_LIST_TYPES)[number];

/** Fields a node inside each list's template can show. */
export const DATA_BINDINGS = {
  productList: ["title", "image", "href", "price", "compareAtPrice", "discount", "rating"],
  categoryList: ["name", "image", "href", "productCount"],
  postList: ["title", "excerpt", "image", "href", "date"],
  /** The product page's current product (`ctx.product`). */
  product: ["title", "image", "href", "price", "compareAtPrice", "discount", "rating", "description", "brand", "category", "reviewCount", "seller"],
} as const satisfies Record<DataListType | "product", readonly string[]>;

export type DataRecord =
  { kind: "product"; record: ProductDetail } | { kind: "productList"; record: ProductSummary } | { kind: "categoryList"; record: CategorySummary } | { kind: "postList"; record: ContentItemSummary };

/** What each data node type needs from the store (Add-panel chips, empty states). */
export const DATA_NODE_NEEDS: Record<string, DataNeed> = {
  productList: "products",
  categoryList: "categories",
  postList: "articles",
  storeForm: "forms",
};

export const MAX_LIST_LIMIT = 24;

export function isDataList(type: string): type is DataListType {
  return (DATA_LIST_TYPES as readonly string[]).includes(type);
}

const clampLimit = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(MAX_LIST_LIMIT, Math.max(1, Math.round(value))) : fallback;
const idOf = (value: unknown) => (typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null);
const idsOf = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(idOf)
        .filter((id): id is string => id !== null)
        .slice(0, MAX_LIST_LIMIT)
    : [];

/** Records a list skips first (a "lead and list" design shows the first record once). */
const offsetOf = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.min(10, Math.max(0, Math.round(value))) : 0);

/** A product list split into pages with page links (`paginate`), e.g. the home page's main grid. */
export function isPaginated(node: ComponentNode): boolean {
  return node.type === "productList" && node.props?.paginate === true;
}

/** The catalog query of a data node, or null (not a catalog node, or not set up yet). */
export function nodeCatalogQuery(node: ComponentNode, opts?: { product?: ProductDetail }): CatalogQuery | null {
  const props = node.props ?? {};
  if (node.type === "productList") {
    const source = PRODUCT_SOURCES.find((s) => s === props.source) ?? ("newest" satisfies ProductSource);
    const sort = PRODUCT_SORTS.find((s) => s === props.sort) ?? ("default" satisfies ProductSort);
    // A paginated list shows `limit` products per page (the host picks the page) and skips no lead record.
    const paginate = isPaginated(node);
    const limit = clampLimit(props.limit, 8) + (paginate ? 0 : offsetOf(props.offset));
    const extra = paginate ? { paginate: true } : {};
    if (source === "category") {
      const categoryId = idOf(props.categoryId);
      return categoryId ? { kind: "products", source, categoryId, sort, limit, ...extra } : null;
    }
    if (source === "selected") {
      const productIds = idsOf(props.productIds);
      return productIds.length ? { kind: "products", source, productIds, sort, limit, ...extra } : null;
    }
    if (source === "related") {
      // Without a current product (any page but the product page) "related" is the newest.
      const product = opts?.product;
      if (!product) return { kind: "products", source: "newest", sort, limit, ...extra };
      return { kind: "products", source, relatedTo: { productId: product.id, categoryId: product.category?.id ?? null }, sort, limit, ...extra };
    }
    return { kind: "products", source, sort, limit, ...extra };
  }
  if (node.type === "categoryList") {
    // Picked categories may sit anywhere in the store's list: load them all.
    return { kind: "categories", limit: idsOf(props.categoryIds).length ? 200 : clampLimit(props.limit, 8) + offsetOf(props.offset) };
  }
  return null;
}

/** The blog query of a post list. */
export function nodeContentQuery(node: ComponentNode): ContentQuery | null {
  return node.type === "postList" ? { collection: "blog", limit: clampLimit(node.props?.limit, 3) + offsetOf(node.props?.offset) } : null;
}

/** The store form a form node shows. */
export function nodeFormId(node: ComponentNode): string | null {
  return node.type === "storeForm" ? idOf(node.props?.formId) : null;
}

/** Every node of a tree, depth first. */
export function walkNodes(nodes: readonly ComponentNode[] | undefined, visit: (node: ComponentNode) => void): void {
  for (const node of nodes ?? []) {
    visit(node);
    walkNodes(node.children, visit);
  }
}

/** The id of the product list in `productCatalogSection`; its records go in `ctx.catalog.products[CATALOG_LIST_ID]`. */
export const CATALOG_LIST_ID = "catalog-products";

/**
 * The site's own product card on pages the builder does not lay out (the
 * /products catalog): the item template of the first product list on the
 * home page, else on any page, repeated in a plain catalog grid (4/3/2
 * columns, the list's own gaps). Null when the site has no product list.
 */
export function productCatalogSection(pages: readonly SitePage[]): SectionInstance | null {
  const ordered = [...pages.filter((p) => p.isHome), ...pages.filter((p) => !p.isHome)];
  let list: ComponentNode | undefined;
  for (const page of ordered) {
    for (const instance of page.content.sections) {
      walkNodes(instance.componentTree, (node) => {
        if (!list && node.type === "productList" && node.children.length) list = node;
      });
      if (list) break;
    }
    if (list) break;
  }
  if (!list) return null;
  const gap = list.style?.gap ?? 16;
  const tablet = list.breakpointStyles?.tablet?.gap;
  const mobile = list.breakpointStyles?.mobile?.gap;
  return {
    id: "products-catalog",
    sectionId: "custom-section",
    version: 1,
    props: {},
    componentTree: [
      {
        id: "products-catalog-root",
        type: "section",
        props: {},
        children: [
          {
            id: CATALOG_LIST_ID,
            type: "productList",
            props: { source: "newest", limit: MAX_LIST_LIMIT },
            style: { columns: 4, gap },
            breakpointStyles: { tablet: { columns: 3, ...(tablet != null && { gap: tablet }) }, mobile: { columns: 2, ...(mobile != null && { gap: mobile }) } },
            children: list.children,
          },
        ],
      },
    ],
  };
}

/** The store data a tree draws (for presets and empty-state chips). */
export function treeDataNeeds(nodes: readonly ComponentNode[] | undefined): DataNeed[] {
  const out = new Set<DataNeed>();
  walkNodes(nodes, (node) => {
    const need = DATA_NODE_NEEDS[node.type];
    if (need) out.add(need);
  });
  return [...out];
}

/** The records a list node draws, in order. Unresolved means none. */
export function listRecords(node: ComponentNode, ctx: RenderContext): DataRecord[] {
  const props = node.props ?? {};
  if (node.type === "productList") {
    if (!nodeCatalogQuery(node)) return [];
    // The host already resolved the current page of a paginated list.
    const offset = isPaginated(node) ? 0 : offsetOf(props.offset);
    return (ctx.catalog.products[node.id] ?? []).slice(offset, offset + clampLimit(props.limit, 8)).map((record) => ({ kind: "productList", record }));
  }
  if (node.type === "categoryList") {
    const picked = idsOf(props.categoryIds);
    const all = ctx.catalog.categories ?? [];
    const list = picked.length
      ? picked.map((id) => all.find((c) => c.id === id)).filter((c): c is CategorySummary => Boolean(c))
      : all.slice(offsetOf(props.offset), offsetOf(props.offset) + clampLimit(props.limit, 8));
    return list.map((record) => ({ kind: "categoryList", record }));
  }
  if (node.type === "postList") {
    const offset = offsetOf(props.offset);
    return (ctx.content?.items[node.id] ?? []).slice(offset, offset + clampLimit(props.limit, 3)).map((record) => ({ kind: "postList", record }));
  }
  return [];
}

/** The fields a product list card and the product page share. */
function productSummaryValue(p: ProductSummary, bind: string, ctx: RenderContext): string | null {
  switch (bind) {
    case "title":
      return p.title;
    case "image":
      return p.image;
    case "href":
      return p.href;
    case "price":
      return p.price == null ? null : ctx.formatPrice(p.price);
    case "compareAtPrice":
      return p.compareAtPrice != null && p.price != null && p.compareAtPrice > p.price ? ctx.formatPrice(p.compareAtPrice) : null;
    case "discount": {
      if (p.compareAtPrice == null || p.price == null || p.compareAtPrice <= p.price) return null;
      const off = Math.round((1 - p.price / p.compareAtPrice) * 100);
      // Locale percent keeps the minus on the right side in Arabic ("‎-٢٣٪").
      return off > 0 ? new Intl.NumberFormat(ctx.locale === "ar" ? "ar-EG" : "en-US", { style: "percent", signDisplay: "always" }).format(-off / 100) : null;
    }
    case "rating":
      return p.rating ? new Intl.NumberFormat(ctx.locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 1 }).format(p.rating) : null;
  }
  return null;
}

/**
 * The value of `bind` for a record: text, a link or an image URL. `null`
 * means "nothing to show" (no sale price, no image), and the node is skipped.
 */
export function boundValue(scope: DataRecord, bind: unknown, ctx: RenderContext): string | null {
  if (typeof bind !== "string") return null;
  switch (scope.kind) {
    case "product": {
      const p = scope.record;
      switch (bind) {
        case "description":
          return p.description || null;
        case "brand":
          return p.brand || null;
        case "category":
          return p.category?.name ?? null;
        case "reviewCount":
          return p.reviewCount > 0 ? new Intl.NumberFormat(ctx.locale === "ar" ? "ar-EG" : "en-US").format(p.reviewCount) : null;
        case "seller":
          return p.seller.name || null;
      }
      return productSummaryValue(p, bind, ctx);
    }
    case "productList":
      return productSummaryValue(scope.record, bind, ctx);
    case "categoryList": {
      const c = scope.record;
      switch (bind) {
        case "name":
          return c.name;
        case "image":
          return c.image;
        case "href":
          return c.href;
        case "productCount":
          return c.productCount == null ? null : new Intl.NumberFormat(ctx.locale === "ar" ? "ar-EG" : "en-US").format(c.productCount);
      }
      return null;
    }
    case "postList": {
      const post = scope.record;
      switch (bind) {
        case "title":
          return post.title;
        case "excerpt":
          return post.excerpt ?? null;
        case "image":
          return post.image ?? null;
        case "href":
          return post.href;
        case "date":
          return post.publishedAt ? (ctx.formatDate?.(post.publishedAt) ?? post.publishedAt.slice(0, 10)) : null;
      }
      return null;
    }
  }
}
