import {
  and,
  db,
  eq,
  inArray,
  orders,
  sellerNotifications,
  shipmentCarrierEvents,
  shipments,
  sql,
  userAddresses,
  users,
} from "@workspace/db";
import { getStoreBostaAccount, recordBostaResult, type StoreBostaAccount } from "../integrations/bosta.server";
import { toPiastres } from "../orders/platform-fee.lib";
import { applySellerShipmentStatus } from "./apply-seller-shipment.server";
import {
  createBostaDelivery,
  findBostaDeliveryByReference,
  type BostaCallOptions,
} from "./bosta/bosta.client.server";
import { looksLikeDuplicateReference, type BostaErrorReason } from "./bosta/bosta-errors.lib";
import {
  bostaCityIdOfDistrict,
  bostaDistrictOptions,
  resolveBostaDestination,
  type BostaDistrictOption,
} from "./bosta/bosta-geo.lib";
import {
  bostaCod,
  buildBostaDeliveryRequest,
  type BostaDestination,
  type BostaOrderInput,
  type BostaPayloadError,
} from "./bosta/bosta-payload.lib";
import { bostaCollection, bostaShipBlocker, bostaWebhookUrl, type BostaShipBlocker } from "./bosta/bosta-ship.lib";
import type { BostaPackageSize } from "./bosta/bosta.types";

/**
 * Sends one storefront order to the store's Bosta account
 * (docs/superpowers/plans/2026-10-26-bosta-shipping.md §4.4, BS-08).
 *
 * Idempotent: the `shipments` row (unique per order) is claimed before the
 * call, a second click while a call is in flight is refused, and Bosta itself
 * rejects a second delivery for `uniqueBusinessReference = tallaby:<orderId>`
 * (a lost response is repaired by looking the delivery up). Success moves the
 * shipment to `assigned` through the shared seller primitive; Bosta's status
 * updates then drive it (webhook + sync). No money moves here.
 */

const CARRIER = "bosta";
/** A claim older than this is a crashed call and may be retried. */
const CLAIM_STALE_SECONDS = 120;
const CREATING = "creating";

export type BostaShipTrigger = "manual" | "on_confirm" | "retry";

export type BostaShipError =
  | "not_connected"
  | "not_found"
  | BostaShipBlocker
  | "in_progress"
  | "unknown_region"
  | "no_coverage"
  | "district_needed"
  | BostaPayloadError
  | BostaErrorReason;

export type BostaShipOverrides = {
  /** The seller's district pick when the address could not be matched. */
  districtId?: string | null;
  size?: BostaPackageSize | null;
};

export type BostaShipResult =
  | { ok: true; trackingNumber: string; shipmentId: string }
  | {
      ok: false;
      error: BostaShipError;
      /** Bosta's own (redacted) message, for unknown errors. */
      message?: string;
      /** Bosta cities to offer in the district picker (address errors). */
      cityIds?: string[];
    };

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

/** The order, only when it was placed on this store and every line is the store owner's. */
async function loadOrder(storeId: string, sellerId: string, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.storeId, storeId)),
    columns: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      totalAmount: true,
      subtotal: true,
      notes: true,
      shippingAddressId: true,
      userId: true,
    },
    with: {
      orderItems: {
        columns: { sellerId: true, productName: true, variantName: true, quantity: true },
        with: { product: { columns: { images: true } } },
      },
      shipments: {
        columns: { id: true, carrier: true, status: true, externalId: true, riderId: true, sellerId: true, trackingNumber: true },
      },
    },
  });
  if (!order || order.orderItems.length === 0 || order.orderItems.some((i) => i.sellerId !== sellerId)) return null;

  const [address] = order.shippingAddressId
    ? await db.select().from(userAddresses).where(eq(userAddresses.id, order.shippingAddressId)).limit(1)
    : [];
  const [customer] = await db
    .select({ email: users.email, fullName: users.fullName, phone: users.phone })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  return { order, address: address ?? null, customer: customer ?? null, shipment: order.shipments[0] ?? null };
}

function orderInput(loaded: LoadedOrder, destination: BostaDestination, prepaid: boolean): BostaOrderInput {
  const { order, address, customer } = loaded;
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalPiastres: toPiastres(order.totalAmount),
    itemsPiastres: toPiastres(order.subtotal),
    prepaid,
    customerName: address?.fullName || customer?.fullName || "",
    phone: address?.phone ?? null,
    fallbackPhone: customer?.phone ?? null,
    email: customer?.email ?? null,
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? null,
    deliveryInstructions: address?.deliveryInstructions ?? null,
    orderNote: order.notes,
    items: order.orderItems.map((item) => ({
      name: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
      quantity: item.quantity,
      imageUrl: (item.product?.images as string[] | null | undefined)?.[0] ?? null,
    })),
    destination,
  };
}

function resolveDestination(loaded: LoadedOrder, districtId: string | null | undefined) {
  return resolveBostaDestination({
    state: loaded.address?.state,
    city: loaded.address?.city,
    addressLine1: loaded.address?.addressLine1,
    addressLine2: loaded.address?.addressLine2,
    districtId,
  });
}

export type BostaShipPreview = {
  orderNumber: string;
  receiver: { name: string; phone: string | null };
  address: { line1: string; line2: string | null; city: string; state: string } | null;
  /** What Bosta collects on delivery, in EGP (0 when prepaid). */
  cod: number;
  prepaid: boolean;
  itemsCount: number;
  size: BostaPackageSize;
  allowToOpenPackage: boolean;
  pickupLocationName: string | null;
  autoShip: StoreBostaAccount["settings"]["autoShip"];
  /** Why it can't be sent now, or null. */
  blocker: BostaShipBlocker | null;
  destination:
    | { ok: true; city: string; districtId: string | null; via: "override" | "zone" | "district" }
    | { ok: false; reason: "unknown_region" | "no_coverage" | "district_needed" };
  /** Districts to pick from: the match's city, or the candidates when the address did not match. */
  districtOptions: BostaDistrictOption[];
  /** The last failed attempt, when the order is waiting for a fix. */
  lastError: string | null;
};

/**
 * What "Ship with Bosta" would send, for the confirm sheet: the matched
 * district (or the picker), the COD amount and the package. Reads only.
 */
export async function previewBostaShipment(
  sellerId: string,
  storeId: string,
  orderId: string,
  options: { districtId?: string | null; locale?: string } = {},
): Promise<{ ok: true; data: BostaShipPreview } | { ok: false; error: "not_connected" | "not_found" }> {
  const account = await getStoreBostaAccount(storeId);
  if (!account || account.sellerId !== sellerId) return { ok: false, error: "not_connected" };
  const loaded = await loadOrder(storeId, sellerId, orderId);
  if (!loaded) return { ok: false, error: "not_found" };

  const match = resolveDestination(loaded, options.districtId);
  const collection = bostaCollection(loaded.order);
  const prepaid = collection.ok ? collection.prepaid : false;
  const matchedCity = match.ok && match.destination.districtId ? bostaCityIdOfDistrict(match.destination.districtId) : null;
  const pickerCities = match.ok ? (matchedCity ? [matchedCity] : []) : match.cityIds;
  const [lastError] = loaded.shipment
    ? await db.select({ lastError: shipments.lastError }).from(shipments).where(eq(shipments.id, loaded.shipment.id)).limit(1)
    : [];

  return {
    ok: true,
    data: {
      orderNumber: loaded.order.orderNumber,
      receiver: {
        name: loaded.address?.fullName || loaded.customer?.fullName || "",
        phone: loaded.address?.phone ?? loaded.customer?.phone ?? null,
      },
      address: loaded.address
        ? {
            line1: loaded.address.addressLine1,
            line2: loaded.address.addressLine2,
            city: loaded.address.city,
            state: loaded.address.state,
          }
        : null,
      cod: bostaCod({ prepaid, totalPiastres: toPiastres(loaded.order.totalAmount) }),
      prepaid,
      itemsCount: loaded.order.orderItems.reduce((sum, item) => sum + Math.max(0, item.quantity), 0),
      size: account.settings.size,
      allowToOpenPackage: account.settings.allowToOpenPackage,
      pickupLocationName: account.settings.pickupLocationName,
      autoShip: account.settings.autoShip,
      blocker: bostaShipBlocker(loaded.order, loaded.shipment),
      destination: match.ok
        ? { ok: true, city: match.destination.city, districtId: match.destination.districtId ?? null, via: match.via }
        : { ok: false, reason: match.reason },
      districtOptions: pickerCities.length ? bostaDistrictOptions(pickerCities, options.locale ?? "ar") : [],
      lastError: lastError?.lastError ?? null,
    },
  };
}

/**
 * Claims the order's shipment for Bosta: creates it, or takes over a seller
 * shipment still at `pending` / a failed Bosta claim. Returns null when
 * another call holds a fresh claim or the shipment has moved on.
 */
async function claimShipment(account: StoreBostaAccount, orderId: string): Promise<string | null> {
  const now = sql`now()`;
  const [row] = await db
    .insert(shipments)
    .values({
      orderId,
      sellerId: account.sellerId,
      carrier: CARRIER,
      status: "pending",
      storeIntegrationId: account.integrationId,
      externalState: CREATING,
      createAttempts: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: shipments.orderId,
      set: {
        carrier: CARRIER,
        storeIntegrationId: account.integrationId,
        externalState: CREATING,
        createAttempts: sql`${shipments.createAttempts} + 1`,
        updatedAt: now,
      },
      setWhere: sql`${shipments.externalId} IS NULL
        AND ${shipments.status} = 'pending'
        AND ${shipments.sellerId} = ${account.sellerId}
        AND ${shipments.riderId} IS NULL
        -- A Wassalha sheet export is not a handover yet, so Bosta may still take it (F-12c).
        AND ${shipments.carrier} IN ('seller', 'bosta', 'wassalha')
        AND (${shipments.externalState} IS DISTINCT FROM ${CREATING}
          OR ${shipments.updatedAt} < now() - make_interval(secs => ${CLAIM_STALE_SECONDS}))`,
    })
    .returning({ id: shipments.id });
  return row?.id ?? null;
}

async function notifySeller(
  account: StoreBostaAccount,
  type: "carrier_shipment_failed" | "carrier_needs_attention",
  order: { id: string; orderNumber: string },
  dedupe: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db
      .insert(sellerNotifications)
      .values({
        sellerId: account.sellerId,
        storeId: account.storeId,
        type,
        data: { orderId: order.id, orderNumber: order.orderNumber, ...data },
        dedupeKey: `${type}:${order.id}:${dedupe}`,
      })
      .onConflictDoNothing();
  } catch {
    // A missed bell must never fail the shipment bookkeeping.
  }
}

/** Records a failed attempt on the claimed shipment: the order stays as it was, ready for a retry. */
async function recordFailure(
  account: StoreBostaAccount,
  shipmentId: string,
  loaded: LoadedOrder,
  error: BostaShipError,
  message: string | undefined,
): Promise<void> {
  const [row] = await db
    .update(shipments)
    .set({
      externalState: null,
      needsAttention: true,
      lastError: message ? `${error}: ${message}`.slice(0, 500) : error,
      updatedAt: sql`now()`,
    })
    .where(and(eq(shipments.id, shipmentId), sql`${shipments.externalId} IS NULL`))
    .returning({ attempts: shipments.createAttempts });
  await notifySeller(account, "carrier_shipment_failed", loaded.order, String(row?.attempts ?? 0), { reason: error });
}

/** Links the Bosta delivery to the shipment and moves it to `assigned` (items → shipping soon). */
async function recordSuccess(
  account: StoreBostaAccount,
  shipmentId: string,
  orderId: string,
  delivery: { _id: string; trackingNumber: string; state?: { code: number; value?: string } },
): Promise<void> {
  const stateCode = delivery.state?.code ?? 10;
  const linked = await db
    .update(shipments)
    .set({
      externalId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      externalStateCode: stateCode,
      externalState: delivery.state?.value ?? "created",
      needsAttention: false,
      lastError: null,
      lastSyncedAt: sql`now()`,
      assignedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(and(eq(shipments.id, shipmentId), sql`${shipments.externalId} IS NULL`))
    .returning({ status: shipments.status });

  await db
    .insert(shipmentCarrierEvents)
    .values({
      shipmentId,
      carrier: CARRIER,
      stateCode,
      stateText: delivery.state?.value ?? null,
      occurredAt: new Date().toISOString(),
      payload: { source: "create", trackingNumber: delivery.trackingNumber },
    })
    .onConflictDoNothing();

  if (linked[0]?.status === "pending") {
    try {
      await applySellerShipmentStatus({
        orderId,
        sellerId: account.sellerId,
        shipmentId,
        status: "assigned",
        expectedFromStatus: "pending",
      });
    } catch (error) {
      // Someone moved it meanwhile; the Bosta link is saved and the sync catches up.
      if (!(error instanceof Error && error.message.startsWith("Shipment was already updated"))) throw error;
    }
  }
}

/**
 * Creates the Bosta delivery for one order of this store. The caller has
 * already checked that the session seller owns `storeId` (or is the cron);
 * the order must belong to that store and that seller.
 */
export async function shipOrderWithBosta(
  storeId: string,
  orderId: string,
  options: { trigger: BostaShipTrigger; overrides?: BostaShipOverrides; sellerId?: string } & BostaCallOptions,
): Promise<BostaShipResult> {
  const { trigger: _trigger, overrides = {}, sellerId, ...callOptions } = options;
  const account = await getStoreBostaAccount(storeId);
  if (!account || (sellerId && account.sellerId !== sellerId)) return { ok: false, error: "not_connected" };

  const loaded = await loadOrder(storeId, account.sellerId, orderId);
  if (!loaded) return { ok: false, error: "not_found" };

  const blocker = bostaShipBlocker(loaded.order, loaded.shipment);
  if (blocker) return { ok: false, error: blocker };
  const collection = bostaCollection(loaded.order);
  if (!collection.ok) return { ok: false, error: collection.error };

  const shipmentId = await claimShipment(account, orderId);
  if (!shipmentId) return { ok: false, error: "in_progress" };

  const match = resolveDestination(loaded, overrides.districtId);
  if (!match.ok) {
    await recordFailure(account, shipmentId, loaded, match.reason, undefined);
    return { ok: false, error: match.reason, cityIds: match.cityIds };
  }

  const webhookUrl = bostaWebhookUrl(account.integrationId);
  const payload = buildBostaDeliveryRequest(
    orderInput(loaded, match.destination, collection.prepaid),
    {
      size: overrides.size ?? account.settings.size,
      allowToOpenPackage: account.settings.allowToOpenPackage,
      note: account.settings.note,
      pickupLocationId: account.settings.pickupLocationId,
    },
    webhookUrl ? { url: webhookUrl, token: account.webhookToken } : undefined,
  );
  if (!payload.ok) {
    await recordFailure(account, shipmentId, loaded, payload.error, undefined);
    return { ok: false, error: payload.error };
  }

  const created = await createBostaDelivery(account.apiKey, payload.body, callOptions);
  if (created.ok) {
    await recordSuccess(account, shipmentId, orderId, created.data);
    await recordBostaResult(storeId, { ok: true });
    return { ok: true, trackingNumber: created.data.trackingNumber, shipmentId };
  }

  const failure = created.error;
  if (failure.reason === "duplicate" || looksLikeDuplicateReference(failure.message)) {
    // Bosta already has this order (an earlier response was lost): link it.
    const found = await findBostaDeliveryByReference(account.apiKey, payload.body.businessReference, callOptions);
    if (found.ok && found.data) {
      await recordSuccess(account, shipmentId, orderId, found.data);
      return { ok: true, trackingNumber: found.data.trackingNumber, shipmentId };
    }
  }

  if (failure.reason === "invalid_key" || failure.reason === "forbidden") {
    await recordBostaResult(storeId, { ok: false, error: failure.message });
  }
  await recordFailure(account, shipmentId, loaded, failure.reason, failure.message);
  const addressError = ["city_not_found", "zone_not_found", "district_not_found", "address_required"].includes(failure.reason);
  return {
    ok: false,
    error: failure.reason,
    message: failure.message,
    ...(addressError ? { cityIds: [bostaCityIdOfDistrict(match.destination.districtId ?? "")].filter((id): id is string => Boolean(id)) } : {}),
  };
}

/** Orders a sweep may retry: Bosta claims with no delivery yet, not in flight, under 3 attempts. */
export async function listBostaRetryCandidates(limit = 20): Promise<Array<{ storeId: string; orderId: string }>> {
  const rows = await db
    .select({ orderId: shipments.orderId, storeId: orders.storeId })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .where(
      and(
        eq(shipments.carrier, CARRIER),
        sql`${shipments.externalId} IS NULL`,
        eq(shipments.status, "pending"),
        sql`${shipments.createAttempts} < 3`,
        sql`${shipments.updatedAt} < now() - interval '10 minutes'`,
        inArray(orders.status, ["pending", "confirmed", "shipping_soon", "shipped"]),
        sql`${orders.storeId} IS NOT NULL`,
        // Address problems need the seller; retrying them only spams Bosta.
        sql`coalesce(${shipments.lastError}, '') !~ '^(unknown_region|no_coverage|district_needed|city_not_found|zone_not_found|district_not_found|address_required|name_required|invalid_phone|no_items|cod_too_high|images_required)'`,
      ),
    )
    .limit(limit);
  return rows.flatMap((row) => (row.storeId ? [{ storeId: row.storeId, orderId: row.orderId }] : []));
}


/**
 * The "Automatically when I confirm an order" setting (BS-09): ships the
 * order only when the store's Bosta is set to `on_confirm`. Returns
 * `skipped` otherwise. Unpaid online orders are refused by the blocker
 * before anything is claimed. Never throws: it runs after the response.
 */
export async function autoShipOrderWithBosta(
  storeId: string,
  orderId: string,
  sellerId: string,
  options: BostaCallOptions = {},
): Promise<BostaShipResult | { ok: false; error: "skipped" }> {
  try {
    const account = await getStoreBostaAccount(storeId);
    if (!account || account.sellerId !== sellerId || account.settings.autoShip !== "on_confirm") {
      return { ok: false, error: "skipped" };
    }
    return await shipOrderWithBosta(storeId, orderId, { trigger: "on_confirm", sellerId, ...options });
  } catch (error) {
    console.error("[bosta] auto-ship failed", (error as Error)?.name);
    return { ok: false, error: "server" };
  }
}

/**
 * The safety net for auto-ship (BS-09): retries Bosta claims that never got
 * a delivery (a crashed `after()`, a Bosta outage), at most 3 attempts each,
 * from the sync cron. Address and data errors are left for the seller.
 */
export async function runBostaRetrySweep(
  options: BostaCallOptions & { limit?: number } = {},
): Promise<{ retried: number; shipped: number }> {
  const { limit = 20, ...callOptions } = options;
  const candidates = await listBostaRetryCandidates(limit);
  let shipped = 0;
  for (const { storeId, orderId } of candidates) {
    const result = await shipOrderWithBosta(storeId, orderId, { trigger: "retry", ...callOptions });
    if (result.ok) shipped += 1;
  }
  return { retried: candidates.length, shipped };
}
