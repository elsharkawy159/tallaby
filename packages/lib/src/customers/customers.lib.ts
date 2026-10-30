/**
 * Store customers (ROADMAP.md F-01): pure helpers that turn a store's orders
 * into one row per customer. Shared by the server query and its tests; the
 * server side is customers.server.ts. No table of its own: a customer is the
 * set of a store's orders with the same phone (or, with no usable phone, the
 * same signed-in user).
 */
import { normalizeBlockedPhone } from "../stores/blocked-phones.lib";

/** One store order, as the customers query reads it. */
export type CustomerOrderRow = {
  orderId: string;
  orderNumber: string;
  storeId: string;
  userId: string;
  createdAt: string;
  status: string | null;
  /** 2 dp decimal string. */
  totalAmount: string;
  paymentMethod: string;
  /** Shipping address first (always has a phone), then the user's profile. */
  addressName: string | null;
  addressPhone: string | null;
  governorate: string | null;
  city: string | null;
  userName: string | null;
  userPhone: string | null;
  /** Real email of a signed-in customer; null for guests. */
  email: string | null;
  /** A shipment of the order was refused or returned (`failed` / `returned`). */
  shipmentRefused: boolean;
};

/** How an order ended, for the COD success rate. */
export type CustomerOrderOutcome = "delivered" | "refused" | "cancelled" | "open";

export type StoreCustomer = {
  /** Stable per store: `p:<phone>` or `u:<userId>`. */
  key: string;
  storeId: string;
  /** `01XXXXXXXXX` when it is an Egyptian mobile, else as typed; null when none. */
  phone: string | null;
  /** The signed-in user of the latest order (guests are users too). */
  userId: string;
  name: string;
  email: string | null;
  governorate: string | null;
  city: string | null;
  orderCount: number;
  deliveredCount: number;
  refusedCount: number;
  cancelledCount: number;
  /** Sum of orders that were not cancelled, refused or refunded; 2 dp string. */
  totalSpent: string;
  firstOrderAt: string;
  lastOrderAt: string;
  /** delivered / (delivered + refused), 0–100 rounded; null before any order ended. */
  successRate: number | null;
};

const trimmed = (value: string | null | undefined) => value?.trim() || null;

/** Guest checkouts get a synthetic `guest_<uuid>@temp.local` address — never show it. */
const realEmail = (email: string | null | undefined) => {
  const value = trimmed(email);
  return value && !value.includes("@temp.local") ? value : null;
};

/** Guests are users named "Guest User"; that placeholder is not a name. */
const realName = (name: string | null | undefined) => {
  const value = trimmed(name);
  return value && value !== "Guest User" ? value : null;
};

/** The phone a customer is grouped by: normalised mobile, else the digits typed. */
export function customerPhone(row: Pick<CustomerOrderRow, "addressPhone" | "userPhone">): string | null {
  for (const raw of [row.addressPhone, row.userPhone]) {
    const value = trimmed(raw);
    if (!value) continue;
    const mobile = normalizeBlockedPhone(value);
    if (mobile) return mobile;
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 6) return digits;
  }
  return null;
}

export function customerKey(row: CustomerOrderRow): string {
  const phone = customerPhone(row);
  return phone ? `p:${phone}` : `u:${row.userId}`;
}

/** Refunds and returns count as refused; a delivered order stays delivered. */
export function orderOutcome(row: Pick<CustomerOrderRow, "status" | "shipmentRefused">): CustomerOrderOutcome {
  if (row.status === "delivered") return "delivered";
  if (row.status === "returned" || row.shipmentRefused) return "refused";
  if (row.status === "cancelled" || row.status === "refunded" || row.status === "refund_requested") return "cancelled";
  return "open";
}

const toPiastres = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

/**
 * Groups one store's orders (any order) into customers, most recent buyer
 * first. Rows of different stores never merge: the key includes the store.
 */
export function aggregateStoreCustomers(rows: CustomerOrderRow[]): StoreCustomer[] {
  const sorted = [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const groups = new Map<string, { customer: StoreCustomer; spent: number }>();

  // Newest first, so the first row of a group sets name, contact and place.
  for (const row of sorted) {
    const key = customerKey(row);
    const mapKey = `${row.storeId}|${key}`;
    let group = groups.get(mapKey);
    if (!group) {
      group = {
        spent: 0,
        customer: {
          key,
          storeId: row.storeId,
          phone: customerPhone(row),
          userId: row.userId,
          name: realName(row.addressName) ?? realName(row.userName) ?? "",
          email: realEmail(row.email),
          governorate: trimmed(row.governorate),
          city: trimmed(row.city),
          orderCount: 0,
          deliveredCount: 0,
          refusedCount: 0,
          cancelledCount: 0,
          totalSpent: "0.00",
          firstOrderAt: row.createdAt,
          lastOrderAt: row.createdAt,
          successRate: null,
        },
      };
      groups.set(mapKey, group);
    }
    const c = group.customer;
    c.orderCount += 1;
    c.firstOrderAt = row.createdAt;
    if (!c.name) c.name = realName(row.addressName) ?? realName(row.userName) ?? "";
    if (!c.email) c.email = realEmail(row.email);
    if (!c.governorate) c.governorate = trimmed(row.governorate);
    if (!c.city) c.city = trimmed(row.city);

    const outcome = orderOutcome(row);
    if (outcome === "delivered") c.deliveredCount += 1;
    else if (outcome === "refused") c.refusedCount += 1;
    else if (outcome === "cancelled") c.cancelledCount += 1;
    if (outcome === "delivered" || outcome === "open") group.spent += toPiastres(row.totalAmount);
  }

  return [...groups.values()].map(({ customer, spent }) => {
    const ended = customer.deliveredCount + customer.refusedCount;
    return {
      ...customer,
      totalSpent: (spent / 100).toFixed(2),
      successRate: ended > 0 ? Math.round((customer.deliveredCount / ended) * 100) : null,
    };
  });
}

export const CUSTOMER_FILTERS = ["all", "repeat", "refused"] as const;
export type CustomerFilter = (typeof CUSTOMER_FILTERS)[number];
export const CUSTOMER_SORTS = ["recent", "orders", "spent"] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export const parseCustomerFilter = (value: unknown): CustomerFilter =>
  CUSTOMER_FILTERS.includes(value as CustomerFilter) ? (value as CustomerFilter) : "all";
export const parseCustomerSort = (value: unknown): CustomerSort =>
  CUSTOMER_SORTS.includes(value as CustomerSort) ? (value as CustomerSort) : "recent";

/**
 * Search (name, phone in any spelling, email), filter and sort for the
 * Customers page. Ties keep the most recent buyer first.
 */
export function selectStoreCustomers(
  customers: StoreCustomer[],
  options: { query?: string; filter?: CustomerFilter; sort?: CustomerSort },
): StoreCustomer[] {
  const query = (options.query ?? "").trim().toLowerCase();
  // Phone part: ASCII digits without the +20 / 0020 prefix or leading zeros, so
  // "0101", "+20101" and "١٠١" all find 01012345678.
  const ascii = query.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const digits = ascii.replace(/^\s*(\+20|0020)/, "").replace(/\D/g, "").replace(/^0+/, "");
  const matches = (c: StoreCustomer) =>
    !query ||
    c.name.toLowerCase().includes(query) ||
    (c.email ?? "").toLowerCase().includes(query) ||
    (digits.length >= 3 && (c.phone ?? "").includes(digits));

  const filter = options.filter ?? "all";
  const kept = customers.filter(
    (c) =>
      matches(c) &&
      (filter === "all" || (filter === "repeat" ? c.orderCount >= 2 : c.refusedCount > 0)),
  );

  const sort = options.sort ?? "recent";
  const byRecent = (a: StoreCustomer, b: StoreCustomer) =>
    a.lastOrderAt < b.lastOrderAt ? 1 : a.lastOrderAt > b.lastOrderAt ? -1 : 0;
  return kept.sort((a, b) => {
    if (sort === "orders" && a.orderCount !== b.orderCount) return b.orderCount - a.orderCount;
    if (sort === "spent") {
      const diff = toPiastres(b.totalSpent) - toPiastres(a.totalSpent);
      if (diff !== 0) return diff;
    }
    return byRecent(a, b);
  });
}

/** Customer note limits (0121, F-01c); the table CHECKs match. */
export const CUSTOMER_NOTE_MAX = 2000;
export const CUSTOMER_TAGS_MAX = 10;
export const CUSTOMER_TAG_MAX_LENGTH = 30;

export type CustomerNote = { note: string | null; tags: string[] };

/** Trims, collapses spaces, drops empties and case-insensitive repeats, caps count and length. */
export function normalizeCustomerTags(tags: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    if (typeof raw !== "string") continue;
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, CUSTOMER_TAG_MAX_LENGTH).trim();
    const folded = tag.toLowerCase();
    if (!tag || seen.has(folded)) continue;
    seen.add(folded);
    out.push(tag);
    if (out.length === CUSTOMER_TAGS_MAX) break;
  }
  return out;
}

/** The saved form of a note: trimmed text (null when empty) and clean tags. */
export function normalizeCustomerNote(input: { note?: unknown; tags?: unknown }): CustomerNote {
  const note = typeof input.note === "string" ? input.note.trim().slice(0, CUSTOMER_NOTE_MAX) : "";
  return { note: note || null, tags: normalizeCustomerTags(Array.isArray(input.tags) ? input.tags : []) };
}

/** Two orders of the same customer this close together look like a duplicate. */
export const DUPLICATE_WINDOW_MINUTES = 10;

/** Risk signals of one store order (ROADMAP.md F-02d), from the customer's other orders. */
export type OrderRisk = {
  /** The customer's other orders on this store that were refused or returned. */
  refused: number;
  /** …and that were delivered, so "1 refused of 5" reads fairly. */
  delivered: number;
  /** Order numbers of other still-open orders (not delivered, refused or cancelled) within DUPLICATE_WINDOW_MINUTES. */
  duplicates: string[];
};

export const hasOrderRisk = (risk: OrderRisk | null | undefined): risk is OrderRisk =>
  Boolean(risk && (risk.refused > 0 || risk.duplicates.length > 0));

/**
 * Risk for every row, keyed by order id. Rows are compared only with rows of
 * the same store and customer key; rows of other stores never count.
 */
export function computeOrderRisks(rows: CustomerOrderRow[]): Map<string, OrderRisk> {
  const groups = new Map<string, CustomerOrderRow[]>();
  for (const row of rows) {
    const key = `${row.storeId}|${customerKey(row)}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }

  const windowMs = DUPLICATE_WINDOW_MINUTES * 60_000;
  const risks = new Map<string, OrderRisk>();
  for (const group of groups.values()) {
    const outcomes = group.map((r) => orderOutcome(r));
    const times = group.map((r) => Date.parse(r.createdAt));
    group.forEach((row, i) => {
      const risk: OrderRisk = { refused: 0, delivered: 0, duplicates: [] };
      group.forEach((other, j) => {
        if (i === j) return;
        if (outcomes[j] === "refused") risk.refused += 1;
        else if (outcomes[j] === "delivered") risk.delivered += 1;
        if (
          outcomes[j] === "open" &&
          Number.isFinite(times[i]) &&
          Number.isFinite(times[j]) &&
          Math.abs(times[i]! - times[j]!) <= windowMs
        ) {
          risk.duplicates.push(other.orderNumber);
        }
      });
      risks.set(row.orderId, risk);
    });
  }
  return risks;
}

/** Spreadsheet columns of the Customers export (F-01d), in order. */
export const CUSTOMER_EXPORT_COLUMNS = [
  "name",
  "phone",
  "email",
  "governorate",
  "city",
  "orders",
  "delivered",
  "refused",
  "cancelled",
  "spent",
  "successRate",
  "firstOrder",
  "lastOrder",
  "tags",
  "note",
] as const;
export type CustomerExportColumn = (typeof CUSTOMER_EXPORT_COLUMNS)[number];

/** `2026-10-30 14:05` in Cairo time, so the sheet sorts as text too. */
const cairoStamp = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
};

/**
 * One export row. Phones stay text (keeps the leading 0); counts and money
 * are numbers so the sheet can sum them; the success rate is empty before any
 * order ended.
 */
export function customerExportRow(
  customer: StoreCustomer,
  note: CustomerNote | null | undefined,
): Record<CustomerExportColumn, string | number> {
  return {
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    governorate: customer.governorate ?? "",
    city: customer.city ?? "",
    orders: customer.orderCount,
    delivered: customer.deliveredCount,
    refused: customer.refusedCount,
    cancelled: customer.cancelledCount,
    spent: toPiastres(customer.totalSpent) / 100,
    successRate: customer.successRate == null ? "" : customer.successRate,
    firstOrder: cairoStamp(customer.firstOrderAt),
    lastOrder: cairoStamp(customer.lastOrderAt),
    tags: (note?.tags ?? []).join(", "),
    note: note?.note ?? "",
  };
}

/** wa.me link for a customer phone: Egyptian mobiles get the 20 prefix. */
export function customerWhatsAppUrl(phone: string): string {
  const international = /^01\d{9}$/.test(phone) ? `20${phone.slice(1)}` : phone;
  return `https://wa.me/${international}`;
}

/** `p:01012345678` / `u:<uuid>` → what the detail query filters by; null when malformed. */
export function parseCustomerKey(key: string): { phone: string } | { userId: string } | null {
  if (key.startsWith("p:")) {
    const phone = key.slice(2);
    return /^\d{6,20}$/.test(phone) ? { phone } : null;
  }
  if (key.startsWith("u:")) {
    const userId = key.slice(2);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? { userId } : null;
  }
  return null;
}
