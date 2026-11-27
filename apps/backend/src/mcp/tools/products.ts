import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mergeInvalidations, type CacheInvalidation } from "@workspace/cache/invalidate";
import { logServerError } from "@workspace/db/log";
import type { AgentActor } from "@workspace/lib/agents";
import {
  agentCreateProductSchema,
  agentProductIdsSchema,
  agentProductRefSchema,
  agentSearchCategoriesSchema,
  agentSearchProductsSchema,
  agentSetProductStatusSchema,
  agentStoreRefSchema,
  agentUpdateProductSchema,
} from "@workspace/lib/products/agent";
import {
  agentCreateProduct,
  agentGetProduct,
  agentListStoreCategories,
  agentRestoreProducts,
  agentSearchCategories,
  agentSearchProducts,
  agentSetProductStatus,
  agentTrashProducts,
  agentUpdateProduct,
  type AgentProductContext,
} from "@workspace/lib/products/agent/server";
import { uploadProductImageFromUrl } from "../images";
import { registerTool } from "../tool";

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } as const;

const contextFor = (actor: AgentActor, storeId: string): AgentProductContext => ({
  sellerId: actor.sellerId,
  userId: actor.userId,
  sellerStatus: actor.sellerStatus,
  storeId,
});

/**
 * A product of the store went live: a store that was never published, with a
 * chosen template, goes live with it (owner, 2026-11-17), as in the dashboard.
 * The seller and store come from the verified token and the store-in-grant
 * check (tool.ts); the publish checks the store against the seller again. It
 * never throws. The store's site purge joins the tool's cache broadcast.
 * Imported on first use: the site publish code (schema and templates) is
 * large, and most requests to this function never need it.
 */
async function storeGoesLive(
  actor: AgentActor,
  storeId: string,
  invalidation: CacheInvalidation,
): Promise<{ storeWentLive: boolean; invalidation: CacheInvalidation }> {
  try {
    const { publishNewStoreIfReady } = await import("@workspace/lib/store-sites/auto-publish");
    const result = await publishNewStoreIfReady(actor.sellerId, storeId, actor.userId);
    return result.published
      ? { storeWentLive: true, invalidation: mergeInvalidations(invalidation, result.invalidation) }
      : { storeWentLive: false, invalidation };
  } catch (error) {
    // The product write is done: a failed load must not fail the tool.
    logServerError("publish", "mcp auto-publish failed", { storeId }, error);
    return { storeWentLive: false, invalidation };
  }
}

const COPY_RULES =
  "Write every title and text in BOTH Arabic (Egyptian-friendly Modern Standard Arabic) and English. Prices are in Egyptian pounds (EGP).";

export function registerProductTools(server: McpServer, actor: AgentActor) {
  registerTool(server, actor, {
    name: "search_products",
    title: "Search products",
    description:
      "Find products in a store by words in the Arabic or English name or by SKU, filtered by status (active, draft, trash), store category (a main category includes its sub-categories) or low stock. Returns compact rows; use get_product for the full details. Paged: pass nextCursor back as cursor.",
    input: agentSearchProductsSchema,
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async (args) => ({ data: await agentSearchProducts(contextFor(actor, args.storeId), args), storeId: args.storeId }),
  });

  registerTool(server, actor, {
    name: "get_product",
    title: "Get a product",
    description:
      "Everything about one product: Arabic and English copy, price and compare-at price, stock, photos (public URLs), categories, variants with their ids, and its web address. Call this before update_product.",
    input: agentProductRefSchema,
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async (args) => ({ data: await agentGetProduct(contextFor(actor, args.storeId), args.productId), storeId: args.storeId }),
  });

  registerTool(server, actor, {
    name: "list_store_categories",
    title: "List store categories",
    description:
      "This store's own product categories (made by the seller and shown on the store), with ids for storeCategoryId and how many products are directly in each. Categories have two levels: a main category (parentId null) holds sub-categories (parentId and parentName set); listed in tree order. A product goes in one category, main or sub. Use only these ids in this store; storeCategoryName finds one by name (a main category first) or adds it as a new main category.",
    input: agentStoreRefSchema,
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async (args) => ({ data: { categories: await agentListStoreCategories(contextFor(actor, args.storeId)) }, storeId: args.storeId }),
  });

  registerTool(server, actor, {
    name: "search_categories",
    title: "Search Tallaby categories",
    description:
      "Search Tallaby's category list in Arabic or English (e.g. \"mugs\", \"أكواب\"). Every product needs one of these as categoryId; pick the most specific match. Products you add are physical, so leave productKind out; pass productKind \"digital\" only to find a category for a digital product the seller set up in the dashboard.",
    input: agentSearchCategoriesSchema,
    scope: "store.read",
    write: false,
    annotations: READ,
    run: async (args) => ({ data: { categories: await agentSearchCategories(contextFor(actor, args.storeId), args.query, args.productKind) }, storeId: args.storeId }),
  });

  registerTool(server, actor, {
    name: "create_product",
    title: "Add a product",
    description: [
      "Add a new product to the seller's catalog.",
      COPY_RULES,
      "Required: storeId, title {ar, en}, price, images (1–10 public https links to JPEG/PNG/WebP photos, up to 5 MB each; Tallaby downloads and stores them), and a categoryId from search_categories (or a storeCategoryId/storeCategoryName whose category Tallaby already knows).",
      "Optional: description and content (HTML or plain text) {ar, en}, bulletPoints {ar: [], en: []}, seo, compareAtPrice (the higher \"before\" price), quantity, trackStock (false = unlimited stock for digital, made-to-order or services: orders never count it), sku, variants (e.g. sizes and colours: each variant lists the same options in the same order, with its own price and stock), freeDelivery, weightGrams.",
      "With a photo the product goes live on the store at once; pass publish: false to keep it as a hidden draft. Show the seller what you will add before adding many products. Pass an idempotencyKey so a retry never adds the product twice.",
    ].join(" "),
    input: agentCreateProductSchema,
    scope: "products.write",
    write: true,
    annotations: WRITE,
    run: async (args) => {
      const created = await agentCreateProduct(contextFor(actor, args.storeId), args, uploadProductImageFromUrl);
      const site = created.wentLive ? await storeGoesLive(actor, args.storeId, created.invalidation) : null;
      // The stored price: the store's price rounding rule (F-112b) may have changed what was sent.
      const data = { productId: created.productId, status: created.status, slug: created.slug, ...created.savedPrice, ...(site?.storeWentLive && { storeWentLive: true }) };
      return { data, storeId: args.storeId, resultRef: data, invalidation: site?.invalidation ?? created.invalidation };
    },
  });

  registerTool(server, actor, {
    name: "update_product",
    title: "Edit a product",
    description: [
      "Change an existing product. Send only the fields to change.",
      COPY_RULES,
      "title, description, content and bulletPoints need both ar and en. images replaces the photo list: keep a photo by passing its URL from get_product, add one with a public https link. variants replaces the whole variant list: pass each existing variant's id (from get_product) to keep it, leave a variant out to delete it, [] removes all variants.",
      "A live product stays live and a draft stays a draft; use set_product_status to publish or hide.",
    ].join(" "),
    input: agentUpdateProductSchema,
    scope: "products.write",
    write: true,
    annotations: { ...WRITE, idempotentHint: true },
    run: async (args) => {
      const updated = await agentUpdateProduct(contextFor(actor, args.storeId), args, uploadProductImageFromUrl);
      // Only a legacy "pending" product goes live on an edit.
      const site = updated.wentLive ? await storeGoesLive(actor, args.storeId, updated.invalidation) : null;
      const data = { productId: updated.productId, status: updated.status, slug: updated.slug, ...updated.savedPrice, ...(site?.storeWentLive && { storeWentLive: true }) };
      return { data, storeId: args.storeId, resultRef: { productId: updated.productId, fields: Object.keys(args).filter((k) => k !== "storeId" && k !== "productId") }, invalidation: site?.invalidation ?? updated.invalidation };
    },
  });

  registerTool(server, actor, {
    name: "set_product_status",
    title: "Publish or hide a product",
    description:
      "status \"active\" shows the product on the store (it needs at least one photo); \"draft\" hides it without deleting anything.",
    input: agentSetProductStatusSchema,
    scope: "products.write",
    write: true,
    annotations: { ...WRITE, idempotentHint: true, openWorldHint: false },
    run: async (args) => {
      const out = await agentSetProductStatus(contextFor(actor, args.storeId), args.productId, args.status);
      const site = out.changed && out.status === "active" ? await storeGoesLive(actor, args.storeId, out.invalidation) : null;
      const data = { productId: args.productId, status: out.status, changed: out.changed, ...(site?.storeWentLive && { storeWentLive: true }) };
      return { data, storeId: args.storeId, resultRef: data, invalidation: site?.invalidation ?? out.invalidation };
    },
  });

  registerTool(server, actor, {
    name: "trash_products",
    title: "Move products to Trash",
    description:
      "Moves up to 50 products to Trash: they disappear from the store and from shoppers' carts. The seller (or restore_products) can bring them back within 30 days. Always confirm with the seller first.",
    input: agentProductIdsSchema,
    scope: "products.write",
    write: true,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    run: async (args) => {
      const out = await agentTrashProducts(contextFor(actor, args.storeId), args.productIds);
      return {
        data: { trashed: out.trashed, notFound: args.productIds.filter((id) => !out.trashed.includes(id)) },
        storeId: args.storeId,
        resultRef: { trashed: out.trashed },
        invalidation: out.invalidation,
      };
    },
  });

  registerTool(server, actor, {
    name: "restore_products",
    title: "Restore products from Trash",
    description: "Brings products back from Trash with the status they had (a live product with no photo comes back as a draft).",
    input: agentProductIdsSchema,
    scope: "products.write",
    write: true,
    annotations: { ...WRITE, idempotentHint: true, openWorldHint: false },
    run: async (args) => {
      const out = await agentRestoreProducts(contextFor(actor, args.storeId), args.productIds);
      // Once for the store, whatever the number of products restored.
      const site = out.wentLive ? await storeGoesLive(actor, args.storeId, out.invalidation) : null;
      return {
        data: { restored: out.restored, notFound: args.productIds.filter((id) => !out.restored.includes(id)), ...(site?.storeWentLive && { storeWentLive: true }) },
        storeId: args.storeId,
        resultRef: { restored: out.restored },
        invalidation: site?.invalidation ?? out.invalidation,
      };
    },
  });
}
