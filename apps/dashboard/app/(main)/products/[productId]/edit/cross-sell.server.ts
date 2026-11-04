"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreCrossSells } from "@workspace/cache";
import { and, asc, db, eq, inArray, isNull, productCrossSells, products, productTranslations, stores } from "@workspace/db";
import { parseCrossSellDiscount } from "@workspace/lib/orders/cross-sell";
import { getLocale } from "next-intl/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * "Frequently bought with" on the product form (ROADMAP.md F-32c). Offers belong
 * to the seller and apply in every store. Both products must be the session
 * seller's own; ids from the client only ever narrow that.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CrossSellRow = {
  id: string;
  offerProductId: string;
  title: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  isActive: boolean;
};

export type CrossSellResult = { success: true; offers: CrossSellRow[] } | { success: false; error: "invalid" | "duplicate" | "notFound" | "rateLimited" | "generic" };

export async function listCrossSells(productId: string): Promise<CrossSellRow[]> {
  const { sellerId } = await requireSeller();
  if (!UUID.test(String(productId))) return [];
  const locale = await getLocale();
  const rows = await db
    .select()
    .from(productCrossSells)
    .where(and(eq(productCrossSells.sellerId, sellerId), eq(productCrossSells.productId, productId), isNull(productCrossSells.storeId)))
    .orderBy(asc(productCrossSells.sortOrder), asc(productCrossSells.createdAt));
  const ids = rows.map((row) => row.offerProductId);
  const titles = ids.length ? await db.select().from(productTranslations).where(inArray(productTranslations.productId, ids)) : [];
  return rows.map((row) => {
    const own = titles.filter((title) => title.productId === row.offerProductId);
    return {
      id: row.id,
      offerProductId: row.offerProductId,
      title: (own.find((title) => title.locale === locale) ?? own[0])?.title ?? "",
      discountType: row.discountType === "fixed" ? "fixed" : "percent",
      discountValue: Number(row.discountValue),
      isActive: row.isActive,
    };
  });
}

/** Offer changes show at once on every store of this seller. */
async function afterChange(sellerId: string, productId: string): Promise<CrossSellRow[]> {
  const own = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, sellerId));
  await applyInvalidation(invalidateStoreCrossSells(sellerId, own.map((store) => store.id)), { from: "dashboard", mode: "action" });
  revalidatePath(`/products/${productId}/edit`);
  return listCrossSells(productId);
}

function failure(error: unknown): CrossSellResult {
  if (isAccessError(error)) return { success: false, error: "notFound" };
  console.error("[cross-sell] save failed", (error as Error)?.name);
  return { success: false, error: "generic" };
}

export async function addCrossSell(input: { productId: string; offerProductId: string; discountType: unknown; discountValue: unknown }): Promise<CrossSellResult> {
  try {
    const { sellerId } = await requireSeller({ forWrite: true });
    if (!limiter.check(`cross-sell:${sellerId}`)) return { success: false, error: "rateLimited" };
    const productId = String(input?.productId ?? "");
    const offerProductId = String(input?.offerProductId ?? "");
    const discount = parseCrossSellDiscount(input?.discountType, input?.discountValue);
    if (!discount || !UUID.test(productId) || !UUID.test(offerProductId) || productId === offerProductId) {
      return { success: false, error: "invalid" };
    }
    const owned = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.sellerId, sellerId), inArray(products.id, [productId, offerProductId]), isNull(products.deletedAt)));
    if (owned.length !== 2) return { success: false, error: "notFound" };

    const inserted = await db
      .insert(productCrossSells)
      .values({ sellerId, productId, offerProductId, discountType: discount.type, discountValue: discount.value.toFixed(2) })
      .onConflictDoNothing()
      .returning({ id: productCrossSells.id });
    if (inserted.length === 0) return { success: false, error: "duplicate" };
    return { success: true, offers: await afterChange(sellerId, productId) };
  } catch (error) {
    return failure(error);
  }
}

export async function setCrossSellActive(input: { id: string; productId: string; isActive: boolean }): Promise<CrossSellResult> {
  try {
    const { sellerId } = await requireSeller({ forWrite: true });
    if (!UUID.test(String(input?.id)) || !UUID.test(String(input?.productId))) return { success: false, error: "invalid" };
    const updated = await db
      .update(productCrossSells)
      .set({ isActive: input.isActive === true, updatedAt: new Date().toISOString() })
      .where(and(eq(productCrossSells.id, input.id), eq(productCrossSells.sellerId, sellerId)))
      .returning({ id: productCrossSells.id });
    if (updated.length === 0) return { success: false, error: "notFound" };
    return { success: true, offers: await afterChange(sellerId, input.productId) };
  } catch (error) {
    return failure(error);
  }
}

export async function removeCrossSell(input: { id: string; productId: string }): Promise<CrossSellResult> {
  try {
    const { sellerId } = await requireSeller({ forWrite: true });
    if (!UUID.test(String(input?.id)) || !UUID.test(String(input?.productId))) return { success: false, error: "invalid" };
    await db.delete(productCrossSells).where(and(eq(productCrossSells.id, input.id), eq(productCrossSells.sellerId, sellerId)));
    return { success: true, offers: await afterChange(sellerId, input.productId) };
  } catch (error) {
    return failure(error);
  }
}
