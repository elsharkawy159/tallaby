import { z } from "zod";
import { normalizeGovernorate } from "../shipping/governorate.lib";

/**
 * Bosta (Egyptian courier) shipping app: pure client and mappers. Server code
 * (credentials, orders, shipments) is in bosta.server.ts.
 *
 * API: `https://app.bosta.co/api/v2`, the raw API key in `Authorization` (no
 * "Bearer"). Business errors come back as `{ success: false, message }`, some
 * with HTTP 200. The seller makes the key in Bosta › Settings › API
 * integration; deliveries are collected from the business's default pickup
 * location in Bosta.
 */

export const BOSTA_DEFAULT_BASE_URL = "https://app.bosta.co/api/v2";
/** Production and Bosta's staging sandbox; any other host is refused (the key must not leak elsewhere). */
const BOSTA_HOSTS = ["app.bosta.co", "stg-app.bosta.co"] as const;
export const BOSTA_TIMEOUT_MS = 20_000;
/** Delivery type 10 = "Send" (forward delivery, optionally with cash on delivery). */
export const BOSTA_DELIVERY_TYPE_SEND = 10;

export type BostaSecret = { apiKey: string };
export type BostaConfig = { pickupLocationName?: string; allowOpenPackage?: boolean; shippedOrders?: number };

// ---------------------------------------------------------------------------
// Connect input

const API_KEY_RE = /^[A-Za-z0-9._-]{20,200}$/;

export type BostaConnectInput = { apiKey: string; allowOpenPackage: boolean };
export type BostaConnectInputError = "invalid_token";

/** `apiKey` may be "" when a key is already saved and only the options change. */
export function validateBostaConnectInput(
  raw: unknown,
): { success: true; data: BostaConnectInput } | { success: false; error: BostaConnectInputError } {
  const parsed = z
    .object({ apiKey: z.string().max(300).optional(), allowOpenPackage: z.boolean().optional() })
    .safeParse(raw ?? {});
  if (!parsed.success) return { success: false, error: "invalid_token" };
  const apiKey = (parsed.data.apiKey ?? "").trim();
  if (apiKey && !API_KEY_RE.test(apiKey)) return { success: false, error: "invalid_token" };
  return { success: true, data: { apiKey, allowOpenPackage: parsed.data.allowOpenPackage ?? false } };
}

/** The API base URL, from BOSTA_API_BASE_URL when it points at a Bosta host. */
export function bostaBaseUrl(raw: string | undefined = process.env.BOSTA_API_BASE_URL): string {
  if (!raw) return BOSTA_DEFAULT_BASE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !(BOSTA_HOSTS as readonly string[]).includes(url.hostname)) return BOSTA_DEFAULT_BASE_URL;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return BOSTA_DEFAULT_BASE_URL;
  }
}

// ---------------------------------------------------------------------------
// HTTP client

export type BostaErrorCode = "auth" | "rejected" | "throttled" | "unreachable" | "failed";
/** `message` is Bosta's own error text (never the key), trimmed for display. */
export type BostaResult<T> = { ok: true; data: T } | { ok: false; error: BostaErrorCode; message?: string };

export type BostaCallOptions = { fetchImpl?: typeof fetch; timeoutMs?: number; baseUrl?: string };

const cleanMessage = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ").slice(0, 200) : undefined;

export async function bostaRequest<T>(
  apiKey: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  { fetchImpl = fetch, timeoutMs = BOSTA_TIMEOUT_MS, baseUrl = bostaBaseUrl() }: BostaCallOptions = {},
): Promise<BostaResult<T>> {
  if (!API_KEY_RE.test(apiKey)) return { ok: false, error: "auth" };
  try {
    const response = await fetchImpl(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
      method,
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const json = (await response.json().catch(() => null)) as { success?: boolean; message?: unknown; data?: T } | null;
    const message = cleanMessage(json?.message);
    if (response.status === 401 || response.status === 403) return { ok: false, error: "auth", message };
    if (response.status === 429) return { ok: false, error: "throttled", message };
    if (response.status >= 500) return { ok: false, error: "failed", message };
    if (!response.ok || json?.success === false) return { ok: false, error: "rejected", message };
    if (!json) return { ok: false, error: "failed" };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "unreachable" };
  }
}

// ---------------------------------------------------------------------------
// Pickup locations (used to check the key on connect)

export type BostaPickupLocation = { name: string; isDefault: boolean };

/** Reads `GET /pickup-locations` data, which is a list or `{ list: [...] }`. */
export function parsePickupLocations(data: unknown): BostaPickupLocation[] | null {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { list?: unknown }).list)
      ? (data as { list: unknown[] }).list
      : null;
  if (!list) return null;
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = cleanMessage(row.locationName) ?? cleanMessage(row.name) ?? "";
    return [{ name, isDefault: row.isDefault === true }];
  });
}

/** The location Bosta collects from: the default one, else the first. */
export function defaultPickupLocation(locations: BostaPickupLocation[]): BostaPickupLocation | null {
  return locations.find((l) => l.isDefault) ?? locations[0] ?? null;
}

// ---------------------------------------------------------------------------
// Delivery mapping

/** Tallaby governorate key (shipping-rates.ts) → the city name Bosta's API accepts. */
export const BOSTA_CITIES: Record<string, string> = {
  CAIRO: "Cairo",
  GIZA: "Giza",
  QALIUBIA: "Qalyubia",
  ALEXANDRIA: "Alexandria",
  BEHEIRA: "Behira",
  "KAFR EL SHEIKH": "Kafr Alsheikh",
  SHARKIA: "Sharqia",
  GHARBIA: "Gharbia",
  MONUFIA: "Menofia",
  DAMIETTA: "Damietta",
  DAKAHLIA: "Dakahlia",
  ISMAILIA: "Ismailia",
  SUEZ: "Suez",
  "PORT SAID": "Port Said",
  FAYOUM: "Fayoum",
  "BENI SUEF": "Bani Suif",
  MINYA: "Menya",
  ASSIUT: "Assuit",
  SOHAG: "Sohag",
  QENA: "Qena",
  LUXOR: "Luxor",
  ASWAN: "Aswan",
  "RED SEA": "Red Sea",
  "MARSA MATROUH": "Matrouh",
  "NEW VALLEY": "New Valley",
  "NORTH SINAI": "North Sinai",
  "SOUTH SINAI": "South Sinai",
};

export function bostaCityFor(state: string | null | undefined): string | null {
  const key = normalizeGovernorate(state);
  return key ? (BOSTA_CITIES[key] ?? null) : null;
}

/** Egyptian mobile in the local 01XXXXXXXXX form Bosta expects, or null. */
export function bostaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  const local = digits.startsWith("20") && digits.length === 12 ? `0${digits.slice(2)}` : digits;
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

export type BostaOrderInput = {
  orderNumber: string;
  /** Cash Bosta collects from the customer, in EGP (0 when prepaid). */
  cod: number;
  receiverName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  /** Area / district (user_addresses.city). */
  area: string | null;
  /** Governorate (user_addresses.state). */
  state: string | null;
  deliveryInstructions: string | null;
  itemsCount: number;
  itemsSummary: string;
  allowOpenPackage: boolean;
};

export type BostaDeliveryPayload = {
  type: number;
  specs: { packageDetails: { itemsCount: number; description: string } };
  cod: number;
  dropOffAddress: { city: string; firstLine: string; secondLine?: string };
  receiver: { firstName: string; lastName?: string; phone: string; email?: string };
  businessReference: string;
  notes?: string;
  allowToOpenPackage: boolean;
};

export type BostaMappingError = "invalid_phone" | "unsupported_city" | "missing_address";

const clip = (value: string, max: number) => value.trim().replace(/\s+/g, " ").slice(0, max);

/** Builds the `POST /deliveries` body for one order. Money is rounded to piastres. */
export function buildBostaDelivery(
  input: BostaOrderInput,
): { success: true; data: BostaDeliveryPayload } | { success: false; error: BostaMappingError } {
  const phone = bostaPhone(input.phone);
  if (!phone) return { success: false, error: "invalid_phone" };
  const city = bostaCityFor(input.state);
  if (!city) return { success: false, error: "unsupported_city" };
  const firstLine = clip(input.addressLine1 ?? "", 250);
  if (!firstLine) return { success: false, error: "missing_address" };

  const secondLine = clip([input.addressLine2, input.area].filter(Boolean).join(", "), 250);
  const [first = "", ...rest] = clip(input.receiverName || "Customer", 120).split(" ");
  const email = input.email && z.email().safeParse(input.email).success ? input.email : undefined;
  const cod = Math.max(0, Math.round((Number.isFinite(input.cod) ? input.cod : 0) * 100)) / 100;
  const notes = input.deliveryInstructions ? clip(input.deliveryInstructions, 500) : "";

  return {
    success: true,
    data: {
      type: BOSTA_DELIVERY_TYPE_SEND,
      specs: {
        packageDetails: {
          itemsCount: Math.max(1, Math.floor(input.itemsCount) || 1),
          description: clip(input.itemsSummary || input.orderNumber, 500),
        },
      },
      cod,
      dropOffAddress: { city, firstLine, ...(secondLine && { secondLine }) },
      receiver: { firstName: first, ...(rest.length && { lastName: rest.join(" ") }), phone, ...(email && { email }) },
      businessReference: clip(input.orderNumber, 100),
      ...(notes && { notes }),
      allowToOpenPackage: input.allowOpenPackage,
    },
  };
}

/** Reads `{ _id, trackingNumber }` from a create response. */
export function parseCreatedDelivery(data: unknown): { id: string | null; trackingNumber: string } | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const tracking = typeof row.trackingNumber === "number" ? String(row.trackingNumber) : row.trackingNumber;
  if (typeof tracking !== "string" || !BOSTA_TRACKING_RE.test(tracking)) return null;
  return { id: typeof row._id === "string" ? row._id.slice(0, 64) : null, trackingNumber: tracking };
}

export const BOSTA_TRACKING_RE = /^[A-Za-z0-9-]{4,32}$/;

/** Public tracking page for the customer and the seller. */
export function bostaTrackingUrl(trackingNumber: string): string | null {
  return BOSTA_TRACKING_RE.test(trackingNumber)
    ? `https://bosta.co/tracking-shipments?shipment-number=${encodeURIComponent(trackingNumber)}`
    : null;
}
