import {
  and,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  shipments,
  sql,
  storeIntegrations,
  stores,
  userAddresses,
  users,
} from "@workspace/db";
import {
  bostaRequest,
  buildBostaDelivery,
  defaultPickupLocation,
  parseCreatedDelivery,
  parsePickupLocations,
  validateBostaConnectInput,
  type BostaCallOptions,
  type BostaErrorCode,
  type BostaMappingError,
  type BostaSecret,
} from "./bosta.lib";
import { decryptCredentials, encryptCredentials } from "./crypto.server";
import { INTEGRATIONS } from "./registry";
import {
  ownStoreStatus,
  summaryColumns,
  toIntegrationSummary,
  UUID_RE,
  type Queryable,
  type StoreIntegrationSummary,
} from "./store-integrations.server";

/**
 * Bosta shipping app data access. The connection is per store (the API key is
 * encrypted and bound to that store); "Ship with Bosta" creates one Bosta
 * delivery for one of the session seller's orders and records it on the
 * order's `shipments` row (carrier `bosta`, the Bosta tracking number), the
 * same row the seller's own riders use. Status updates after that stay manual
 * (Delivery page) until a Bosta webhook is added.
 */

const PROVIDER = "bosta" as const;

export type ConnectBostaError =
  | "not_found"
  | "store_read_only"
  | "not_available"
  | "invalid_token"
  | "token_required"
  | "no_pickup_location"
  | BostaErrorCode;

async function readBostaRow(q: Queryable, sellerId: string, storeId: string) {
  const [row] = await q
    .select({ config: storeIntegrations.config, secret: storeIntegrations.credentialsEncrypted })
    .from(storeIntegrations)
    .where(
      and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)),
    )
    .limit(1);
  return row ?? null;
}

function decryptKey(secret: string | null, storeId: string): string | null {
  if (!secret) return null;
  try {
    return decryptCredentials<BostaSecret>(secret, { storeId, provider: PROVIDER }).apiKey;
  } catch {
    return null;
  }
}

/**
 * Connects Bosta (or updates its options). A new key is checked against
 * Bosta's pickup locations before it is stored; an empty key keeps the saved one.
 */
export async function connectBosta(
  sellerId: string,
  actorId: string,
  storeId: string,
  rawInput: unknown,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<{ success: true; data: StoreIntegrationSummary } | { success: false; error: ConnectBostaError; message?: string }> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };
  if (INTEGRATIONS[PROVIDER].availability !== "available") return { success: false, error: "not_available" };
  const input = validateBostaConnectInput(rawInput);
  if (!input.success) return { success: false, error: input.error };

  const store = await ownStoreStatus(q, sellerId, storeId);
  if (!store) return { success: false, error: "not_found" };
  if (store.status !== "active") return { success: false, error: "store_read_only" };

  const existing = await readBostaRow(q, sellerId, storeId);
  const existingConfig = (existing?.config ?? {}) as Record<string, unknown>;
  const apiKey = input.data.apiKey || decryptKey(existing?.secret ?? null, storeId);
  if (!apiKey) return { success: false, error: "token_required" };

  let pickupLocationName = typeof existingConfig.pickupLocationName === "string" ? existingConfig.pickupLocationName : "";
  let credentialsEncrypted: string | null = null;
  if (input.data.apiKey) {
    const check = await bostaRequest<unknown>(apiKey, "GET", "pickup-locations", undefined, callOptions);
    if (!check.ok) return { success: false, error: check.error, message: check.message };
    const locations = parsePickupLocations(check.data);
    if (locations && locations.length === 0) return { success: false, error: "no_pickup_location" };
    pickupLocationName = (locations && defaultPickupLocation(locations)?.name) || "";
    credentialsEncrypted = encryptCredentials({ apiKey } satisfies BostaSecret, { storeId, provider: PROVIDER });
  }

  const config = {
    pickupLocationName,
    allowOpenPackage: input.data.allowOpenPackage,
    shippedOrders: typeof existingConfig.shippedOrders === "number" ? existingConfig.shippedOrders : 0,
  };

  return q.transaction(async (tx) => {
    const locked = await ownStoreStatus(tx, sellerId, storeId, true);
    if (!locked) return { success: false, error: "not_found" } as const;
    if (locked.status !== "active") return { success: false, error: "store_read_only" } as const;
    const set = {
      status: "connected",
      config,
      lastError: null,
      updatedAt: sql`now()`,
      ...(credentialsEncrypted && { credentialsEncrypted, connectedBy: actorId, connectedAt: sql`now()` }),
    };
    const [row] = existing
      ? await tx
          .update(storeIntegrations)
          .set(set)
          .where(
            and(
              eq(storeIntegrations.storeId, storeId),
              eq(storeIntegrations.sellerId, sellerId),
              eq(storeIntegrations.provider, PROVIDER),
            ),
          )
          .returning(summaryColumns)
      : await tx
          .insert(storeIntegrations)
          .values({
            storeId,
            sellerId,
            provider: PROVIDER,
            status: "connected",
            config,
            credentialsEncrypted,
            connectedBy: actorId,
            connectedAt: sql`now()`,
          })
          .onConflictDoUpdate({ target: [storeIntegrations.storeId, storeIntegrations.provider], set })
          .returning(summaryColumns);
    if (!row) return { success: false, error: "not_found" } as const;
    return { success: true, data: toIntegrationSummary(PROVIDER, row) } as const;
  });
}

/**
 * The seller's stores that have Bosta connected, plus the primary store (used
 * for marketplace orders, which have no store). For the Delivery page.
 */
export async function getBostaShippingContext(
  sellerId: string,
  q: Queryable = db,
): Promise<{ connectedStoreIds: string[]; primaryStoreId: string | null }> {
  const [connected, primary] = await Promise.all([
    q
      .select({ storeId: storeIntegrations.storeId })
      .from(storeIntegrations)
      .innerJoin(stores, eq(stores.id, storeIntegrations.storeId))
      .where(
        and(
          eq(storeIntegrations.sellerId, sellerId),
          eq(storeIntegrations.provider, PROVIDER),
          eq(stores.sellerId, sellerId),
          sql`${storeIntegrations.credentialsEncrypted} IS NOT NULL`,
          sql`${stores.deletedAt} IS NULL`,
        ),
      ),
    q
      .select({ id: stores.id })
      .from(stores)
      .where(and(eq(stores.sellerId, sellerId), eq(stores.isPrimary, true), sql`${stores.deletedAt} IS NULL`))
      .limit(1),
  ]);
  return { connectedStoreIds: connected.map((c) => c.storeId), primaryStoreId: primary[0]?.id ?? null };
}

export type ShipWithBostaError =
  | "order_not_found"
  | "handled_by_other"
  | "not_ready"
  | "not_connected"
  | "no_address"
  | BostaMappingError
  | BostaErrorCode;

export type ShipWithBostaResult = { trackingNumber: string; alreadyShipped: boolean; storeId: string };

/** Same rule as the Delivery page: every item is this seller's, one is seller-fulfilled, physical order. */
function ownedOrder(sellerId: string) {
  return and(
    sql`exists (select 1 from order_items oi where oi.order_id = ${orders.id} and oi.seller_id = ${sellerId} and oi.fulfillment_type = 'seller_fulfilled')`,
    sql`not exists (select 1 from order_items oi where oi.order_id = ${orders.id} and oi.seller_id <> ${sellerId})`,
    sql`coalesce(${orders.isDigitalOnly}, false) = false`,
  )!;
}

const READY_ORDER_STATUSES = ["confirmed", "shipping_soon"] as const;
/** A shipment the seller can still hand to Bosta (nobody is on the way with it). */
const REASSIGNABLE_SHIPMENT = new Set(["pending", "assigned", "failed"]);

/**
 * "Ship with Bosta" for one order. The order row is locked for the Bosta call,
 * so a double click waits and then sees the tracking number instead of
 * creating a second Bosta delivery.
 */
export async function shipOrderWithBosta(
  sellerId: string,
  orderId: string,
  options: BostaCallOptions & { q?: Queryable } = {},
): Promise<{ success: true; data: ShipWithBostaResult } | { success: false; error: ShipWithBostaError; message?: string }> {
  const { q = db, ...callOptions } = options;
  if (!UUID_RE.test(orderId)) return { success: false, error: "order_not_found" };

  const [order] = await q
    .select({
      id: orders.id,
      storeId: orders.storeId,
      storeSellerId: stores.sellerId,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      paymentStatus: orders.paymentStatus,
      userName: users.fullName,
      userPhone: users.phone,
      userEmail: users.email,
      address: {
        fullName: userAddresses.fullName,
        phone: userAddresses.phone,
        addressLine1: userAddresses.addressLine1,
        addressLine2: userAddresses.addressLine2,
        city: userAddresses.city,
        state: userAddresses.state,
        deliveryInstructions: userAddresses.deliveryInstructions,
      },
    })
    .from(orders)
    .leftJoin(stores, eq(stores.id, orders.storeId))
    .leftJoin(users, eq(users.id, orders.userId))
    .leftJoin(userAddresses, eq(userAddresses.id, orders.shippingAddressId))
    .where(and(eq(orders.id, orderId), ownedOrder(sellerId)))
    .limit(1);
  if (!order) return { success: false, error: "order_not_found" };
  if (order.storeId && order.storeSellerId !== sellerId) return { success: false, error: "order_not_found" };

  // Storefront orders use their store's Bosta account; marketplace orders the primary store's.
  const storeId = order.storeId ?? (await getBostaShippingContext(sellerId, q)).primaryStoreId;
  if (!storeId) return { success: false, error: "not_connected" };
  const row = await readBostaRow(q, sellerId, storeId);
  const apiKey = decryptKey(row?.secret ?? null, storeId);
  if (!apiKey) return { success: false, error: "not_connected" };
  const config = (row?.config ?? {}) as Record<string, unknown>;

  if (!order.address?.addressLine1) return { success: false, error: "no_address" };
  const items = await q
    .select({ productName: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, sellerId)));

  const settled = order.paymentStatus === "paid" || order.paymentStatus === "collected";
  const payload = buildBostaDelivery({
    orderNumber: order.orderNumber,
    cod: settled ? 0 : Number(order.totalAmount ?? 0),
    receiverName: order.address.fullName?.trim() || order.userName?.trim() || "",
    phone: order.address.phone || order.userPhone,
    email: order.userEmail,
    addressLine1: order.address.addressLine1,
    addressLine2: order.address.addressLine2,
    area: order.address.city,
    state: order.address.state,
    deliveryInstructions: order.address.deliveryInstructions,
    itemsCount: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    itemsSummary: items.map((i) => `${i.quantity ?? 1}x ${i.productName}`).join(", "),
    allowOpenPackage: config.allowOpenPackage === true,
  });
  if (!payload.success) return { success: false, error: payload.error };

  return q.transaction(async (tx) => {
    await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
    const [shipment] = await tx
      .select({ sellerId: shipments.sellerId, status: shipments.status, carrier: shipments.carrier, trackingNumber: shipments.trackingNumber })
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .limit(1);
    const [current] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId));

    if (shipment?.carrier === PROVIDER && shipment.trackingNumber) {
      return { success: true, data: { trackingNumber: shipment.trackingNumber, alreadyShipped: true, storeId } } as const;
    }
    if (shipment && shipment.sellerId !== sellerId) return { success: false, error: "handled_by_other" } as const;
    if (shipment ? !REASSIGNABLE_SHIPMENT.has(shipment.status) : !READY_ORDER_STATUSES.includes(current?.status as never)) {
      return { success: false, error: "not_ready" } as const;
    }

    const created = await bostaRequest<unknown>(apiKey, "POST", "deliveries?apiVersion=1", payload.data, callOptions);
    if (!created.ok) {
      if (created.error === "auth") {
        await tx
          .update(storeIntegrations)
          .set({ status: "error", lastError: "Bosta: auth", updatedAt: sql`now()` })
          .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.provider, PROVIDER)));
      }
      return { success: false, error: created.error, message: created.message } as const;
    }
    const delivery = parseCreatedDelivery(created.data);
    if (!delivery) {
      console.error("[bosta] delivery created but the response had no tracking number", { orderId });
      return { success: false, error: "failed" } as const;
    }

    const now = new Date().toISOString();
    await tx
      .insert(shipments)
      .values({
        orderId,
        sellerId,
        carrier: PROVIDER,
        trackingNumber: delivery.trackingNumber,
        status: "assigned",
        assignedAt: now,
        updatedAt: now,
        notes: delivery.id ? `bosta:${delivery.id}` : null,
      })
      .onConflictDoUpdate({
        target: shipments.orderId,
        set: {
          riderId: null,
          carrier: PROVIDER,
          trackingNumber: delivery.trackingNumber,
          status: "assigned",
          assignedAt: now,
          updatedAt: now,
          failureReason: null,
          notes: delivery.id ? `bosta:${delivery.id}` : null,
        },
        setWhere: eq(shipments.sellerId, sellerId),
      });
    await tx
      .update(orders)
      .set({ status: "shipped", updatedAt: now })
      .where(and(eq(orders.id, orderId), inArray(orders.status, [...READY_ORDER_STATUSES])));
    await tx
      .update(orderItems)
      .set({ status: "shipping_soon", updatedAt: now })
      .where(and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, sellerId)));
    await tx
      .update(storeIntegrations)
      .set({
        status: "connected",
        lastError: null,
        lastSyncedAt: sql`now()`,
        updatedAt: sql`now()`,
        config: sql`jsonb_set(${storeIntegrations.config}, '{shippedOrders}', to_jsonb(COALESCE((${storeIntegrations.config}->>'shippedOrders')::int, 0) + 1))`,
      })
      .where(and(eq(storeIntegrations.storeId, storeId), eq(storeIntegrations.sellerId, sellerId), eq(storeIntegrations.provider, PROVIDER)));

    return { success: true, data: { trackingNumber: delivery.trackingNumber, alreadyShipped: false, storeId } } as const;
  });
}
