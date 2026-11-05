"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { applyInvalidation, invalidateProductInventory } from "@workspace/cache";
import { and, db, desc, eq, exists, ilike, inArray, isNull, or, productTranslations, products, productVariants, sql } from "@workspace/db";
import { getPriceFinal } from "@workspace/lib";
import { parseCustomersListFilters } from "@workspace/lib/customers";
import { listStoreCustomersPage } from "@workspace/lib/customers/server";
import { buildOrderPageUrl } from "@workspace/lib/orders";
import { manualOrderInputSchema, type ManualOrderErrorKey, type ManualOrderTotals } from "@workspace/lib/orders/manual";
import { createManualOrder, previewManualOrder } from "@workspace/lib/orders/manual/server";
import { storeSellsProduct } from "@workspace/lib/stores/server";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { isAccessError, requireOrdersStore } from "@/lib/auth/require-seller.server";

/**
 * Orders › Create order (ROADMAP.md F-05). storeId is explicit and checked on
 * every action; products and customers come from this store only, and prices
 * from the database, never the client.
 */

export type ManualProductOption = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  /** The seller's minimum per order (0151). */
  minOrderQuantity: number;
  /** Null when the product doesn't track stock. */
  stock: number | null;
  variants: { id: string; title: string; price: number; stock: number | null }[];
};

const PRODUCT_LIMIT = 15;

export async function searchManualOrderProducts(storeId: string, query: string): Promise<ManualProductOption[]> {
  try {
    const { seller, store } = await requireOrdersStore(String(storeId));
    const locale = await getLocale();
    const text = String(query ?? "").trim().slice(0, 100);
    const pattern = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = await db
      .select({
        id: products.id,
        price: products.price,
        quantity: products.quantity,
        trackStock: products.trackStock,
        minOrderQuantity: products.minOrderQuantity,
        image: sql<string | null>`${products.images}->>0`,
        // Nested: a one-table select strips the table name from a field's top-level columns.
        title: sql<string | null>`${sql`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} ORDER BY (t.locale = ${locale}) DESC LIMIT 1)`}`,
      })
      .from(products)
      .where(
        and(
          eq(products.sellerId, seller.sellerId),
          eq(products.status, "active"),
          isNull(products.deletedAt),
          text
            ? or(
                ilike(products.sku, pattern),
                exists(
                  db
                    .select({ one: sql`1` })
                    .from(productTranslations)
                    .where(and(eq(productTranslations.productId, products.id), ilike(productTranslations.title, pattern))),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(PRODUCT_LIMIT);

    const sold = await Promise.all(rows.map((row) => storeSellsProduct(store.id, row.id)));
    const visible = rows.filter((_, index) => sold[index]);
    const variants = visible.length
      ? await db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, visible.map((row) => row.id)))
      : [];

    return visible.map((row) => {
      const tracked = row.trackStock !== false;
      return {
        id: row.id,
        title: row.title ?? "",
        image: row.image,
        price: getPriceFinal(row.price),
        minOrderQuantity: row.minOrderQuantity,
        stock: tracked ? Number(row.quantity ?? 0) : null,
        variants: variants
          .filter((variant) => variant.productId === row.id)
          .map((variant) => ({
            id: variant.id,
            title: variant.title ?? [variant.option1, variant.option2, variant.option3].filter(Boolean).join(" / "),
            price: getPriceFinal(variant.price),
            stock: tracked ? Number(variant.stock ?? 0) : null,
          })),
      };
    });
  } catch (error) {
    if (!isAccessError(error)) console.error("[manual-order] product search failed", (error as Error)?.name);
    return [];
  }
}

export type ManualCustomerOption = { key: string; name: string; phone: string; governorate: string | null; city: string | null };

/** This store's own customers. A seller never reaches another seller's or Tallaby's accounts. */
export async function searchManualOrderCustomers(storeId: string, query: string): Promise<ManualCustomerOption[]> {
  try {
    const { seller, store } = await requireOrdersStore(String(storeId));
    const text = String(query ?? "").trim();
    if (text.length < 2) return [];
    const { customers } = await listStoreCustomersPage(
      seller.sellerId,
      store.id,
      parseCustomersListFilters({ q: text, page: 1, size: 20 }),
    );
    return customers.flatMap((customer) =>
      customer.phone
        ? [{ key: customer.key, name: customer.name, phone: customer.phone, governorate: customer.governorate, city: customer.city }]
        : [],
    );
  } catch (error) {
    if (!isAccessError(error)) console.error("[manual-order] customer search failed", (error as Error)?.name);
    return [];
  }
}

export type ManualPreviewResult = { success: true; totals: ManualOrderTotals } | { success: false; error: ManualOrderErrorKey | "invalid" };

export async function previewManualOrderAction(storeId: string, input: unknown): Promise<ManualPreviewResult> {
  try {
    const { seller, store } = await requireOrdersStore(String(storeId));
    const parsed = manualOrderInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalid" };
    return await previewManualOrder({ sellerId: seller.sellerId, actorId: seller.userId, storeId: store.id }, parsed.data);
  } catch (error) {
    if (!isAccessError(error)) console.error("[manual-order] preview failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export type ManualCreateResult =
  | { success: true; orderId: string; orderNumber: string; linkUrl: string | null; phone: string }
  | { success: false; error: ManualOrderErrorKey | "invalid" | "readOnly" };

export async function createManualOrderAction(storeId: string, input: unknown): Promise<ManualCreateResult> {
  try {
    const { seller, store } = await requireOrdersStore(String(storeId), { forWrite: true });
    const parsed = manualOrderInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalid" };

    const result = await createManualOrder(
      { sellerId: seller.sellerId, actorId: seller.userId, storeId: store.id },
      parsed.data,
    );
    if (!result.success) return result;

    if (result.inventoryItems.length) {
      await applyInvalidation(invalidateProductInventory(result.inventoryItems), { from: "dashboard", mode: "action" });
    }
    revalidatePath("/orders");

    let linkUrl: string | null = null;
    if (result.awaitingCustomer) {
      const domain = await findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null);
      linkUrl = buildOrderPageUrl(result.orderId, storeUrl(store.subdomain, domain));
    }
    return {
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      linkUrl,
      phone: parsed.data.customer.phone,
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "generic" };
    console.error("[manual-order] create failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
