import { randomUUID } from "node:crypto";
import {
  and,
  cartItems,
  carts,
  db,
  eq,
  inArray,
  isNull,
  orderItems,
  orders,
  products,
  productVariants,
  shipments,
  sql,
  userAddresses,
  users,
} from "@workspace/db";
import { cancelPendingAffiliateCommission } from "@workspace/db/affiliates";
import { restoreStock, type StockLine } from "@workspace/db/inventory";
import { chargeOrderPlacementFee } from "@workspace/db/wallet";
import { resolveGovernorateSelectValue } from "../address/address.lib";
import { storeSellsProduct } from "../stores/catalog.server";
import { getStorefrontShippingContext } from "../stores/shipping-context.server";
import {
  calculateLocationShippingCost,
  calculateSellerFreeDeliveryDiscount,
  getThresholdShippingDiscount,
} from "../shipping/shipping.lib";
import { resolveStoreOrderShipping, zoneSellerFreeDeliveryDiscount } from "../shipping/store-quote";
import { getPriceFinal } from "../utils/parse-price-json";
import {
  capManualDiscountPiastres,
  isAwaitingCustomer,
  MANUAL_LINK_EXPIRY_HOURS,
  manualOrderErrorKey,
  manualOrderTotals,
  type ManualOrderErrorKey,
  type ManualOrderInput,
  type ManualOrderMeta,
  type ManualOrderTotals,
} from "./manual-order.lib";
import { minOrderShortfalls } from "./min-order-quantity.lib";
import { placeOrderFromCart, type PlaceOrderInventoryItem } from "./place-order";

type Actor = { sellerId: string; actorId: string; storeId: string };

type ResolvedLine = {
  productId: string;
  quantity: number;
  price: number;
  variantData: Record<string, unknown> | null;
  productType: string | null;
  freeDelivery: boolean | null;
  dimensions: unknown;
  sellerFreeDelivery: boolean | null;
  minOrderQuantity: number;
};

/**
 * The seller's own lines, priced from the database. Every product must be
 * active, the seller's own, and sold by this store. Stock is only checked for a
 * clear message; `placeOrderFromCart` decrements it atomically.
 */
async function resolveLines(
  { sellerId, storeId }: Actor,
  lines: ManualOrderInput["lines"],
): Promise<{ ok: true; lines: ResolvedLine[] } | { ok: false; error: ManualOrderErrorKey }> {
  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, line.productId),
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        isNull(products.deletedAt),
      ),
      with: { seller: { columns: { freeDelivery: true } } },
    });
    if (!product || !(await storeSellsProduct(storeId, line.productId))) {
      return { ok: false, error: "productUnavailable" };
    }

    let price = getPriceFinal(product.price);
    let variantData: Record<string, unknown> | null = null;
    let stock = Number(product.quantity ?? 0);
    if (line.variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: and(eq(productVariants.id, line.variantId), eq(productVariants.productId, line.productId)),
      });
      if (!variant) return { ok: false, error: "productUnavailable" };
      price = getPriceFinal(variant.price);
      stock = Number(variant.stock ?? 0);
      variantData = {
        id: variant.id,
        title: variant.title,
        price: variant.price,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        sku: variant.sku,
        imageUrl: variant.imageUrl,
      };
    }
    if (product.trackStock !== false && stock < line.quantity) return { ok: false, error: "insufficientStock" };

    resolved.push({
      productId: line.productId,
      quantity: line.quantity,
      price,
      variantData,
      productType: product.productType,
      freeDelivery: product.freeDelivery,
      dimensions: product.dimensions,
      sellerFreeDelivery: product.seller?.freeDelivery ?? null,
      minOrderQuantity: product.minOrderQuantity,
    });
  }
  return { ok: true, lines: resolved };
}

const goodsPiastresOf = (lines: readonly ResolvedLine[]) =>
  lines.reduce((sum, line) => sum + Math.round(line.price * 100) * line.quantity, 0);

export type ManualOrderPreview =
  | { success: true; totals: ManualOrderTotals }
  | { success: false; error: ManualOrderErrorKey };

/** The totals the order will get: same shipping rules as `placeOrderFromCart`. */
export async function previewManualOrder(actor: Actor, input: ManualOrderInput): Promise<ManualOrderPreview> {
  const resolved = await resolveLines(actor, input.lines);
  if (!resolved.ok) return { success: false, error: resolved.error };

  const items = resolved.lines.map((line) => ({
    quantity: line.quantity,
    price: String(line.price),
    sellerId: actor.sellerId,
    product: {
      productType: line.productType,
      freeDelivery: line.freeDelivery,
      dimensions: line.dimensions,
      sellerId: actor.sellerId,
      seller: { freeDelivery: line.sellerFreeDelivery },
    },
  })) as Parameters<typeof calculateLocationShippingCost>[0]["items"];
  const goods = goodsPiastresOf(resolved.lines);
  const cartSubtotal = goods / 100;
  const state = resolveGovernorateSelectValue(input.address.state) || input.address.state;
  const destinationState = state.trim() ? state : "__missing_state__";
  const rate = calculateLocationShippingCost({ items, destinationState, cartSubtotal }) ?? 0;

  let shippingCost = rate;
  let waived = Math.max(
    getThresholdShippingDiscount(cartSubtotal, rate),
    calculateSellerFreeDeliveryDiscount({ items, destinationState, cartSubtotal }),
  );
  const context = await getStorefrontShippingContext(actor.storeId);
  if (context) {
    const quote = resolveStoreOrderShipping(context, {
      address: { state, city: input.address.city, country: "Egypt", addressLine1: input.address.addressLine1 },
      items,
      subtotal: cartSubtotal,
      tallabyRate: () => rate,
    });
    if (quote?.kind === "not_covered") return { success: false, error: "notCovered" };
    if (quote?.kind === "outside_egypt") return { success: false, error: "outsideEgypt" };
    if (quote?.kind === "zone") {
      if (input.payment === "cod" && !quote.codEnabled) return { success: false, error: "noCod" };
      shippingCost = quote.shippingCost;
      waived = Math.min(shippingCost, zoneSellerFreeDeliveryDiscount(quote, items));
    }
  }

  return {
    success: true,
    totals: manualOrderTotals({
      goodsPiastres: goods,
      discountEgp: input.discountEgp,
      shippingPiastres: Math.round(Math.max(0, shippingCost - waived) * 100),
    }),
  };
}

export type CreateManualOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      awaitingCustomer: boolean;
      duplicate: boolean;
      inventoryItems: PlaceOrderInventoryItem[];
    }
  | { success: false; error: ManualOrderErrorKey };

/**
 * Creates the order through `placeOrderFromCart`, so the fee, stock and shipping
 * rules are the normal ones. The customer is a new guest row for each order: a
 * seller never reaches another seller's or the platform's customer accounts.
 * `requestId` is the cart id, so a double click can't make two orders.
 */
export async function createManualOrder(actor: Actor, input: ManualOrderInput): Promise<CreateManualOrderResult> {
  const { sellerId, actorId, storeId } = actor;

  const existing = await db.query.carts.findFirst({ where: eq(carts.id, input.requestId) });
  if (existing) {
    const [order] = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, metadata: orders.metadata, status: orders.status })
      .from(orders)
      .where(and(eq(orders.cartId, input.requestId), eq(orders.storeId, storeId)))
      .limit(1);
    if (!order || existing.storeSellerId !== sellerId) return { success: false, error: "alreadySubmitted" };
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      awaitingCustomer: isAwaitingCustomer(order),
      duplicate: true,
      inventoryItems: [],
    };
  }

  const resolved = await resolveLines(actor, input.lines);
  if (!resolved.ok) return { success: false, error: resolved.error };

  // The form warned the seller; going under the minimum takes their explicit yes.
  if (!input.allowBelowMinimum && minOrderShortfalls(resolved.lines).length > 0) {
    return { success: false, error: "belowMinimum" };
  }

  const guestId = randomUUID();
  let addressId = "";
  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: guestId,
        fullName: input.customer.name,
        email: `manual_${guestId}@temp.local`,
        phone: input.customer.phone,
        isGuest: true,
      });
      const [address] = await tx
        .insert(userAddresses)
        .values({
          userId: guestId,
          addressType: "shipping",
          fullName: input.customer.name,
          phone: input.customer.phone,
          addressLine1: input.address.addressLine1,
          city: input.address.city,
          state: resolveGovernorateSelectValue(input.address.state) || input.address.state,
          postalCode: "",
          country: "Egypt",
        })
        .returning({ id: userAddresses.id });
      addressId = address!.id;
      await tx.insert(carts).values({
        id: input.requestId,
        userId: guestId,
        status: "active",
        currency: "EGP",
        storeId,
        storeSellerId: sellerId,
      });
      await tx.insert(cartItems).values(
        resolved.lines.map((line) => ({
          cartId: input.requestId,
          productId: line.productId,
          sellerId,
          quantity: line.quantity,
          price: line.price.toFixed(2),
          variant: line.variantData,
        })) as (typeof cartItems.$inferInsert)[],
      );
    });
  } catch (error) {
    // Two clicks at once: the cart id is taken, so the other one is placing it.
    if (String((error as { cause?: { code?: string }; code?: string })?.cause?.code ?? (error as { code?: string })?.code) === "23505") {
      return { success: false, error: "alreadySubmitted" };
    }
    throw error;
  }

  const now = new Date().toISOString();
  const paid = input.payment === "paid";
  const manualOrder: ManualOrderMeta = {
    createdBy: actorId,
    createdAt: now,
    ...(paid && input.paidVia ? { paidVia: input.paidVia } : {}),
    ...(input.sendLink ? { awaitingCustomer: true } : {}),
  };
  const paymentOverrides = paid
    ? { paymentMethod: "seller_collected", paymentStatus: "paid" as const, status: "confirmed" as const, paidAt: now }
    : {
        paymentMethod: "cash_on_delivery",
        paymentStatus: "pending" as const,
        status: input.sendLink ? ("pending" as const) : ("confirmed" as const),
      };

  const result = await placeOrderFromCart({
    userId: guestId,
    cartId: input.requestId,
    shippingAddressId: addressId,
    paymentMethod: paymentOverrides.paymentMethod,
    notes: input.notes,
    orderSource: "manual",
    skipCoupons: true,
    locale: "ar",
    sendConfirmationEmail: false,
    paymentOverrides,
    sellerDiscount: {
      amountPiastres: capManualDiscountPiastres(input.discountEgp, goodsPiastresOf(resolved.lines)),
      label: "Seller discount",
    },
    stockContext: { reason: "order", actorId, storeId },
    orderMetadata: { manualOrder, ...(paid ? { paymentCollector: "seller" } : {}) },
    deferPlacementFee: input.sendLink,
    allowBelowMinOrderQuantity: input.allowBelowMinimum,
  });

  if (!result.success) {
    // Nothing else should pick this cart up: no reminder, no lingering active row.
    await db.update(carts).set({ status: "abandoned" }).where(eq(carts.id, input.requestId));
    return { success: false, error: manualOrderErrorKey(result.error) };
  }

  return {
    success: true,
    orderId: result.data.order.id,
    orderNumber: result.data.order.orderNumber,
    awaitingCustomer: input.sendLink,
    duplicate: false,
    inventoryItems: result.data.inventoryItems,
  };
}

/**
 * The customer confirmed from the order link. Takes the fee now, like a card
 * order when it's paid: a link nobody confirmed costs the seller nothing.
 * The caller has checked the signed access token.
 */
export async function confirmManualOrderLink(orderId: string): Promise<{ confirmed: boolean }> {
  const now = new Date().toISOString();
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({
        status: "confirmed",
        processedAt: now,
        updatedAt: now,
        metadata: sql`jsonb_set(jsonb_set(${orders.metadata}, '{manualOrder,awaitingCustomer}', 'false'::jsonb), '{manualOrder,confirmedAt}', to_jsonb(${now}::text))`,
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.status, "pending"),
          sql`${orders.metadata} -> 'manualOrder' ->> 'awaitingCustomer' = 'true'`,
        ),
      )
      .returning({ id: orders.id });
    if (updated.length === 0) return { confirmed: false };

    await tx
      .update(orderItems)
      .set({ status: "confirmed", updatedAt: now })
      .where(and(eq(orderItems.orderId, orderId), eq(orderItems.status, "pending")));
    await chargeOrderPlacementFee(tx, orderId);
    return { confirmed: true };
  });
}

/**
 * Cancels links nobody confirmed and puts their stock back. Each order is its
 * own transaction, and the status check means a late confirm wins or loses cleanly.
 */
export async function expireManualOrderLinks(now: Date = new Date()): Promise<{ expired: number; failed: number }> {
  const cutoff = new Date(now.getTime() - MANUAL_LINK_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const due = await db
    .select({ id: orders.id, storeId: orders.storeId })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        sql`${orders.metadata} -> 'manualOrder' ->> 'awaitingCustomer' = 'true'`,
        sql`${orders.createdAt} < ${cutoff}`,
      ),
    )
    .limit(200);

  const counts = { expired: 0, failed: 0 };
  for (const order of due) {
    try {
      const stamp = now.toISOString();
      const done = await db.transaction(async (tx) => {
        const updated = await tx
          .update(orders)
          .set({ status: "cancelled", cancelledAt: stamp, updatedAt: stamp })
          .where(and(eq(orders.id, order.id), eq(orders.status, "pending")))
          .returning({ id: orders.id });
        if (updated.length === 0) return false;

        const lines = await tx
          .update(orderItems)
          .set({ status: "cancelled", cancelledAt: stamp, updatedAt: stamp })
          .where(eq(orderItems.orderId, order.id))
          .returning({
            productId: orderItems.productId,
            variantId: orderItems.variantId,
            quantity: orderItems.quantity,
          });
        await tx
          .update(shipments)
          .set({ status: "cancelled", updatedAt: stamp })
          .where(and(eq(shipments.orderId, order.id), inArray(shipments.status, ["pending", "assigned"])));
        const stockLines: StockLine[] = lines.map((line) =>
          line.variantId
            ? { kind: "variant", id: line.variantId, quantity: line.quantity }
            : { kind: "product", id: line.productId, quantity: line.quantity },
        );
        await restoreStock(tx, stockLines, { reason: "cancel", orderId: order.id, storeId: order.storeId });
        await cancelPendingAffiliateCommission(tx, order.id);
        return true;
      });
      if (done) counts.expired += 1;
    } catch (error) {
      counts.failed += 1;
      console.error("[manual-order] link expiry failed", order.id, error instanceof Error ? error.message : error);
    }
  }
  return counts;
}
