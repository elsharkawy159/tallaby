"use server";

import { revalidatePath } from "next/cache";
import { and, db, desc, eq, inArray, isNull, products, sellerProductCategories, storeDiscountRules } from "@workspace/db";
import { parseDiscountRule, type DiscountRule, type DiscountRuleError } from "@workspace/lib/orders/automatic-discounts";
import { toDiscountRule } from "@workspace/lib/orders/line-discounts/server";
import { productInStore, taxonomyInStore } from "@workspace/lib/stores/scope/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";

/**
 * Automatic discounts (ROADMAP.md F-13a). Every action takes an explicit store id
 * and checks it belongs to the session's seller; ids from the client only narrow
 * that. Gift products must be in the rule's store (F-87c: `productInStore`,
 * scope `managed`; before the split the seller's, as before). Category scope
 * ids must be in the rule's store list (F-87d, `taxonomyInStore`: the seller's
 * list before the split, the store's after it). Checkout reads the rules fresh, so nothing here is cached.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RuleResult = { success: true; rules: DiscountRule[] } | { success: false; error: DiscountRuleError | "notFound" | "rateLimited" | "generic" };

export async function listDiscountRules(storeId: string): Promise<DiscountRule[]> {
  const { store, seller } = await requireStore(storeId);
  const rows = await db
    .select()
    .from(storeDiscountRules)
    .where(and(eq(storeDiscountRules.storeId, store.id), eq(storeDiscountRules.sellerId, seller.sellerId)))
    .orderBy(desc(storeDiscountRules.createdAt));
  return rows.map(toDiscountRule);
}

function failure(error: unknown): RuleResult {
  if (isAccessError(error)) return { success: false, error: "notFound" };
  console.error("[discount-rules] save failed", (error as Error)?.name);
  return { success: false, error: "generic" };
}

async function after(storeId: string): Promise<RuleResult> {
  revalidatePath("/marketing/discounts");
  return { success: true, rules: await listDiscountRules(storeId) };
}

export async function saveDiscountRule(input: { storeId: string; id?: string | null; rule: Record<string, unknown> }): Promise<RuleResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    if (!limiter.check(`discount-rules:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const parsed = parseDiscountRule(input?.rule, new Date());
    if (!parsed.ok) return { success: false, error: parsed.error };
    const rule = parsed.rule;

    const catalogSplit = await isSwitchOn("stores_catalog_split");
    if (rule.categoryIds.length > 0) {
      const scope = { sellerId: seller.sellerId, storeId: store.id, catalogSplit };
      const owned = await db
        .select({ id: sellerProductCategories.id })
        .from(sellerProductCategories)
        .where(and(taxonomyInStore(sellerProductCategories, scope), inArray(sellerProductCategories.id, rule.categoryIds)));
      if (owned.length !== rule.categoryIds.length) return { success: false, error: "categories" };
    }
    if (rule.giftProductIds.length > 0) {
      const inStore = productInStore(store.id, { catalogSplit, scope: "managed" });
      const owned = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.sellerId, seller.sellerId), inArray(products.id, rule.giftProductIds), isNull(products.deletedAt), inStore));
      if (owned.length !== rule.giftProductIds.length) return { success: false, error: "gifts" };
    }

    const values = {
      name: rule.name,
      ruleType: rule.ruleType,
      scope: rule.scope,
      categoryIds: rule.categoryIds,
      discountPercent: rule.discountPercent === null ? null : rule.discountPercent.toFixed(2),
      buyQuantity: rule.buyQuantity,
      getQuantity: rule.getQuantity,
      minSubtotal: rule.minSubtotal === null ? null : rule.minSubtotal.toFixed(2),
      giftProductIds: rule.giftProductIds,
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
    };
    if (input.id) {
      if (!UUID.test(String(input.id))) return { success: false, error: "notFound" };
      const updated = await db
        .update(storeDiscountRules)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(and(eq(storeDiscountRules.id, input.id), eq(storeDiscountRules.storeId, store.id), eq(storeDiscountRules.sellerId, seller.sellerId)))
        .returning({ id: storeDiscountRules.id });
      if (updated.length === 0) return { success: false, error: "notFound" };
    } else {
      await db.insert(storeDiscountRules).values({ ...values, sellerId: seller.sellerId, storeId: store.id });
    }
    return await after(store.id);
  } catch (error) {
    return failure(error);
  }
}

export async function setDiscountRuleActive(input: { storeId: string; id: string; isActive: boolean }): Promise<RuleResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    if (!UUID.test(String(input?.id))) return { success: false, error: "notFound" };
    const updated = await db
      .update(storeDiscountRules)
      .set({ isActive: input.isActive === true, updatedAt: new Date().toISOString() })
      .where(and(eq(storeDiscountRules.id, input.id), eq(storeDiscountRules.storeId, store.id), eq(storeDiscountRules.sellerId, seller.sellerId)))
      .returning({ id: storeDiscountRules.id });
    if (updated.length === 0) return { success: false, error: "notFound" };
    return await after(store.id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteDiscountRule(input: { storeId: string; id: string }): Promise<RuleResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    if (!UUID.test(String(input?.id))) return { success: false, error: "notFound" };
    await db
      .delete(storeDiscountRules)
      .where(and(eq(storeDiscountRules.id, input.id), eq(storeDiscountRules.storeId, store.id), eq(storeDiscountRules.sellerId, seller.sellerId)));
    return await after(store.id);
  } catch (error) {
    return failure(error);
  }
}
