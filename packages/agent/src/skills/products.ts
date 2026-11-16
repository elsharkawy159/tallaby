import { z } from "zod";
import { mergeInvalidations, type CacheInvalidation } from "@workspace/cache/invalidate";
import {
  agentCreateProductSchema,
  agentSearchProductsSchema,
  agentSetProductStatusSchema,
  agentUpdateProductSchema,
} from "@workspace/lib/products/agent";
import {
  agentCreateProduct,
  agentSearchCategories,
  agentSearchProducts,
  agentSetProductStatus,
  agentUpdateProduct,
  type AgentProductContext,
  type ProductImageUploader,
} from "@workspace/lib/products/agent/server";
import { publishNewStoreIfReady } from "@workspace/lib/store-sites/auto-publish";
import { requireOwnedStore, sellerStatusOf } from "../guards.server";
import type { AgentContext, AgentTool, Skill } from "../types";

/**
 * Products skill (spec §14.4): search, create, rewrite copy, publish or hide.
 * Wraps the MCP product functions (F-29f), which check the store and the
 * product belong to the seller. Prices come only from the seller's words
 * (the rules say so; the confirm card shows the price before anything runs).
 */

export type ProductsSkillDeps = {
  /** Downloads a public https photo into the products bucket. Without it, only photos the product already has are accepted. */
  uploadProductImage?: ProductImageUploader;
};

const noUpload: ProductImageUploader = async () => ({ ok: false, reason: "upload_unavailable" });

async function productContext(ctx: AgentContext): Promise<AgentProductContext> {
  return { sellerId: ctx.sellerId, userId: ctx.userId ?? ctx.sellerId, sellerStatus: await sellerStatusOf(ctx.sellerId), storeId: ctx.storeId };
}

/**
 * A product of the store went live: a store that was never published, with a
 * chosen template, goes live with it (owner, 2026-11-17), as in the dashboard.
 * Not inside an AI Store Builder run: the build publishes at its own step.
 * The seller and store are the context's (checked by `requireOwnedStore`);
 * the publish checks them again and never throws.
 */
async function withStoreGoingLive(ctx: AgentContext, invalidation: CacheInvalidation): Promise<CacheInvalidation> {
  if (ctx.source === "builder") return invalidation;
  const result = await publishNewStoreIfReady(ctx.sellerId, ctx.storeId, ctx.userId ?? ctx.sellerId);
  return result.published ? mergeInvalidations(invalidation, result.invalidation) : invalidation;
}

// Model-facing inputs: no storeId (from the context), no publish flag (from the caller), no idempotency key (the runtime has its own).
const searchInput = agentSearchProductsSchema.omit({ storeId: true });
const categoriesInput = z.object({ query: z.string().trim().min(1).max(80) }).strict();
const createInput = agentCreateProductSchema.pick({
  title: true,
  description: true,
  bulletPoints: true,
  price: true,
  compareAtPrice: true,
  quantity: true,
  trackStock: true,
  images: true,
  categoryId: true,
  storeCategoryName: true,
});
const updateCopyInput = agentUpdateProductSchema.pick({ productId: true, title: true, description: true, bulletPoints: true, seo: true });
const statusInput = agentSetProductStatusSchema.omit({ storeId: true });

const egp = (n: number) => n.toFixed(2);

export function productsSkill(deps: ProductsSkillDeps = {}): Skill {
  const upload = deps.uploadProductImage ?? noUpload;

  const searchProducts: AgentTool<z.infer<typeof searchInput>> = {
    name: "search_products",
    skill: "products",
    description: "Find the store's products by words in the name or SKU, status or low stock.",
    input: searchInput,
    kind: "read",
    credits: 0,
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: false });
      return { data: await agentSearchProducts(await productContext(ctx), { ...input, storeId: ctx.storeId }) };
    },
  };

  const searchCategories: AgentTool<z.infer<typeof categoriesInput>> = {
    name: "search_categories",
    skill: "products",
    description: "Search Tallaby categories by a short Arabic or English word; every new product needs one.",
    input: categoriesInput,
    kind: "read",
    credits: 0,
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: false });
      return { data: { categories: await agentSearchCategories(await productContext(ctx), input.query) } };
    },
  };

  const createProduct: AgentTool<z.infer<typeof createInput>> = {
    name: "create_product",
    skill: "products",
    description: "Add one product. Title and description in both Arabic and English; price in EGP exactly as the seller said.",
    input: createInput,
    kind: "write",
    credits: 1,
    preview: async (ctx, input) => ({
      title: "agent.card.products.create.title",
      params: { name: ctx.locale === "ar" ? input.title.ar : input.title.en },
      lines: [
        { key: "agent.card.products.price", params: { price: egp(input.price) } },
        ...(input.compareAtPrice ? [{ key: "agent.card.products.compareAt", params: { price: egp(input.compareAtPrice) } }] : []),
        ...(input.quantity !== undefined ? [{ key: "agent.card.products.stock", params: { quantity: input.quantity } }] : []),
        { key: "agent.card.products.photos", params: { count: input.images.length } },
        { key: ctx.publishProducts ? "agent.card.products.goesLive" : "agent.card.products.staysDraft" },
      ],
      risk: "low",
    }),
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const created = await agentCreateProduct(
        await productContext(ctx),
        { ...input, storeId: ctx.storeId, publish: ctx.publishProducts === true },
        upload,
      );
      const data = { productId: created.productId, status: created.status, slug: created.slug };
      const invalidation = created.wentLive ? await withStoreGoingLive(ctx, created.invalidation) : created.invalidation;
      return { data, invalidation, resultRef: data };
    },
  };

  const updateCopy: AgentTool<z.infer<typeof updateCopyInput>> = {
    name: "update_product_copy",
    skill: "products",
    description: "Rewrite a product's title, description, bullet points or SEO. Both languages; prices and stock are not changed here.",
    input: updateCopyInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: "agent.card.products.updateCopy.title",
      params: { productId: input.productId },
      lines: (["title", "description", "bulletPoints", "seo"] as const)
        .filter((field) => input[field] !== undefined)
        .map((field) => ({ key: `agent.card.products.field.${field}` })),
      risk: "low",
    }),
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const updated = await agentUpdateProduct(await productContext(ctx), { ...input, storeId: ctx.storeId }, upload);
      return {
        data: { productId: updated.productId, status: updated.status },
        // Only a legacy "pending" product goes live on an edit.
        invalidation: updated.wentLive ? await withStoreGoingLive(ctx, updated.invalidation) : updated.invalidation,
        resultRef: { productId: updated.productId, fields: Object.keys(input).filter((k) => k !== "productId") },
      };
    },
  };

  const setStatus: AgentTool<z.infer<typeof statusInput>> = {
    name: "set_product_status",
    skill: "products",
    description: 'Publish ("active", needs a photo) or hide ("draft") one product.',
    input: statusInput,
    kind: "write",
    credits: 1,
    preview: async (_ctx, input) => ({
      title: input.status === "active" ? "agent.card.products.publish.title" : "agent.card.products.hide.title",
      params: { productId: input.productId },
      lines: [],
      risk: "low",
    }),
    run: async (ctx, input) => {
      await requireOwnedStore(ctx, { forWrite: true });
      const out = await agentSetProductStatus(await productContext(ctx), input.productId, input.status);
      const data = { productId: input.productId, status: out.status, changed: out.changed };
      const invalidation = out.changed && out.status === "active" ? await withStoreGoingLive(ctx, out.invalidation) : out.invalidation;
      return { data, invalidation, resultRef: data };
    },
  };

  return {
    id: "products",
    pages: ["/stores/[storeId]/products", "/stores/[storeId]/products/add", "/stores/[storeId]/products/[productId]", "/products", "/products/add", "/products/[productId]"],
    rules: PRODUCTS_RULES,
    tools: [searchProducts, searchCategories, createProduct, updateCopy, setStatus],
  };
}

const PRODUCTS_RULES = `Skill: products. You help the seller manage the products of one store.
- Prices, stock and discounts come only from the seller's own words. Never guess or change a number they did not give.
- Write every title and description in both Arabic and English.
- Find a categoryId with search_categories before create_product.
- Find product ids with search_products; never invent an id.
- Writes are proposals: the seller sees a card and confirms. Say what you proposed in one short line.`;
