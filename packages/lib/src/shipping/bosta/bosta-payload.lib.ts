import { normalizeEgyptianMobile } from "../egypt-post.lib";
import {
  BOSTA_DELIVERY_TYPE_DELIVER,
  BOSTA_MAX_COD_EGP,
  type BostaCreateDeliveryRequest,
  type BostaPackageSize,
} from "./bosta.types";

/**
 * Tallaby order → Bosta "create delivery" body (plan §3.4). Pure: the caller
 * loads the order (scoped to the store), resolves the Bosta city/district
 * (bosta-geo, BS-02) and passes the store's Bosta settings.
 */

/** Where the order goes, already resolved against Bosta's geography. */
export type BostaDestination = {
  city: string;
  cityId?: string;
  districtId?: string;
  districtName?: string;
  zoneId?: string;
};

export type BostaOrderItemInput = {
  name: string;
  quantity: number;
  imageUrl?: string | null;
};

export type BostaOrderInput = {
  orderId: string;
  orderNumber: string;
  /** What the customer owes in total, in integer piastres. */
  totalPiastres: number;
  /** Items value (for Bosta's insurance), in integer piastres. */
  itemsPiastres: number;
  /** True when nothing is collected on delivery (paid online or by wallet). */
  prepaid: boolean;
  customerName: string;
  phone: string | null;
  fallbackPhone?: string | null;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  deliveryInstructions?: string | null;
  orderNote?: string | null;
  items: BostaOrderItemInput[];
  destination: BostaDestination;
};

export type BostaShipSettings = {
  size: BostaPackageSize;
  allowToOpenPackage: boolean;
  note?: string | null;
  pickupLocationId?: string | null;
};

export type BostaWebhookTarget = { url: string; token: string };

export type BostaPayloadError =
  | "name_required"
  | "invalid_phone"
  | "address_required"
  | "no_items"
  | "cod_too_high"
  | "images_required";

export type BostaPayloadResult =
  | { ok: true; body: BostaCreateDeliveryRequest }
  | { ok: false; error: BostaPayloadError };

const DESCRIPTION_MAX = 120;
const NOTES_MAX = 500;
const LINE_MAX = 250;
const MAX_IMAGES = 10;

/** `uniqueBusinessReference`: Bosta refuses a second delivery for the same order. */
export function bostaUniqueReference(orderId: string): string {
  return `tallaby:${orderId}`;
}

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cut(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function splitReceiverName(fullName: string): { firstName: string; lastName?: string } | null {
  const parts = clean(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return null;
  const [firstName, ...rest] = parts;
  return rest.length > 0 ? { firstName: firstName!, lastName: rest.join(" ") } : { firstName: firstName! };
}

/** Piastres → EGP with at most two decimals, without float drift. */
export function piastresToEgp(piastres: number): number {
  return Math.round(piastres) / 100;
}

/** COD in EGP: the order total, or 0 when it was paid before delivery. */
export function bostaCod(input: Pick<BostaOrderInput, "prepaid" | "totalPiastres">): number {
  return input.prepaid ? 0 : piastresToEgp(Math.max(0, input.totalPiastres));
}

/** Bosta needs `firstLine` longer than 5 characters; short lines get the area appended. */
export function bostaFirstLine(line1: string, destination: BostaDestination): string {
  let line = clean(line1);
  if (line.length <= 5) {
    const area = clean(destination.districtName) || clean(destination.city);
    line = clean(`${line} ${area}`);
  }
  return cut(line, LINE_MAX);
}

export function bostaItemsDescription(items: BostaOrderItemInput[]): string {
  return cut(
    items
      .filter((item) => item.quantity > 0)
      .map((item) => (item.quantity > 1 ? `${item.quantity}× ${clean(item.name)}` : clean(item.name)))
      .join("، "),
    DESCRIPTION_MAX,
  );
}

function packageImages(items: BostaOrderItemInput[]): string[] {
  const urls = new Set<string>();
  for (const item of items) {
    const url = clean(item.imageUrl);
    if (/^https:\/\/\S+$/i.test(url)) urls.add(url);
    if (urls.size === MAX_IMAGES) break;
  }
  return [...urls];
}

export function buildBostaDeliveryRequest(
  order: BostaOrderInput,
  settings: BostaShipSettings,
  webhook?: BostaWebhookTarget,
): BostaPayloadResult {
  const name = splitReceiverName(order.customerName);
  if (!name) return { ok: false, error: "name_required" };

  const phone = normalizeEgyptianMobile(order.phone) ?? normalizeEgyptianMobile(order.fallbackPhone);
  if (!phone) return { ok: false, error: "invalid_phone" };

  const firstLine = bostaFirstLine(order.addressLine1, order.destination);
  if (firstLine.length <= 5 || !clean(order.destination.city)) return { ok: false, error: "address_required" };

  const items = order.items.filter((item) => item.quantity > 0);
  if (items.length === 0) return { ok: false, error: "no_items" };

  const cod = bostaCod(order);
  if (cod > BOSTA_MAX_COD_EGP) return { ok: false, error: "cod_too_high" };

  const images = settings.allowToOpenPackage ? packageImages(items) : [];
  if (settings.allowToOpenPackage && images.length === 0) return { ok: false, error: "images_required" };

  const { city, cityId, districtId, districtName, zoneId } = order.destination;
  const secondLine = cut(clean([order.addressLine2, order.deliveryInstructions].map(clean).filter(Boolean).join(" - ")), LINE_MAX);
  const notes = cut([settings.note, order.orderNote].map(clean).filter(Boolean).join(" | "), NOTES_MAX);
  const email = clean(order.email);

  const body: BostaCreateDeliveryRequest = {
    type: BOSTA_DELIVERY_TYPE_DELIVER,
    cod,
    specs: {
      packageType: "Parcel",
      size: settings.size,
      packageDetails: {
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
        description: bostaItemsDescription(items),
      },
    },
    dropOffAddress: {
      city: clean(city),
      ...(districtId ? { districtId } : districtName && cityId ? { districtName, cityId } : {}),
      ...(zoneId ? { zoneId } : {}),
      firstLine,
      ...(secondLine ? { secondLine } : {}),
    },
    receiver: {
      ...name,
      phone,
      ...(email ? { email } : {}),
    },
    businessReference: order.orderNumber,
    uniqueBusinessReference: bostaUniqueReference(order.orderId),
    goodsInfo: { amount: piastresToEgp(Math.max(0, order.itemsPiastres)) },
    // Never let Bosta ask the customer for a WhatsApp deposit (owner, 2026-10-26).
    escrowInfo: { isExcluded: true },
    allowToOpenPackage: settings.allowToOpenPackage,
    ...(images.length > 0 ? { deliveryImages: [{ type: "ALLOW_TO_OPEN_THE_PACKAGE" as const, images }] } : {}),
    ...(notes ? { notes } : {}),
    ...(settings.pickupLocationId ? { businessLocationId: settings.pickupLocationId } : {}),
    ...(webhook ? { webhookUrl: webhook.url, webhookCustomHeaders: { Authorization: `Bearer ${webhook.token}` } } : {}),
  };
  return { ok: true, body };
}
