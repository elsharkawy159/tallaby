import { describe, expect, it } from "vitest";
import {
  aggregateStoreCustomers,
  computeOrderRisks,
  customerKey,
  hasOrderRisk,
  CUSTOMER_EXPORT_COLUMNS,
  CUSTOMER_NOTE_MAX,
  customerExportRow,
  normalizeCustomerNote,
  normalizeCustomerTags,
  customerPhone,
  customerWhatsAppUrl,
  orderOutcome,
  parseCustomerFilter,
  parseCustomerKey,
  parseCustomerSort,
  selectStoreCustomers,
  type CustomerOrderRow,
} from "./customers.lib";

const STORE_A = "11111111-1111-4111-8111-111111111111";
const STORE_B = "22222222-2222-4222-8222-222222222222";
const USER_1 = "33333333-3333-4333-8333-333333333333";
const USER_2 = "44444444-4444-4444-8444-444444444444";

let seq = 0;
function row(overrides: Partial<CustomerOrderRow> = {}): CustomerOrderRow {
  seq += 1;
  return {
    orderId: `order-${seq}`,
    orderNumber: `ORD-${seq}`,
    storeId: STORE_A,
    userId: USER_1,
    createdAt: `2026-10-${String(10 + seq).padStart(2, "0")} 10:00:00+00`,
    status: "pending",
    totalAmount: "100.00",
    paymentMethod: "cash",
    addressName: "Mona Ali",
    addressPhone: "01012345678",
    governorate: "Cairo",
    city: "Nasr City",
    userName: "Guest User",
    userPhone: null,
    email: null,
    shipmentRefused: false,
    ...overrides,
  };
}

describe("customerPhone", () => {
  it("normalises every spelling of the same mobile", () => {
    for (const phone of ["01012345678", "+20 101 234 5678", "201012345678", "٠١٠١٢٣٤٥٦٧٨"]) {
      expect(customerPhone({ addressPhone: phone, userPhone: null })).toBe("01012345678");
    }
  });

  it("falls back to the profile phone, then to digits, then to none", () => {
    expect(customerPhone({ addressPhone: " ", userPhone: "01112223333" })).toBe("01112223333");
    expect(customerPhone({ addressPhone: "+44 20 7946 0958", userPhone: null })).toBe("442079460958");
    expect(customerPhone({ addressPhone: "12", userPhone: null })).toBeNull();
  });
});

describe("orderOutcome", () => {
  it("delivered wins, returns and refused shipments are refused, cancels and refunds are cancelled", () => {
    expect(orderOutcome({ status: "delivered", shipmentRefused: true })).toBe("delivered");
    expect(orderOutcome({ status: "returned", shipmentRefused: false })).toBe("refused");
    expect(orderOutcome({ status: "shipped", shipmentRefused: true })).toBe("refused");
    expect(orderOutcome({ status: "cancelled", shipmentRefused: false })).toBe("cancelled");
    expect(orderOutcome({ status: "refunded", shipmentRefused: false })).toBe("cancelled");
    expect(orderOutcome({ status: "confirmed", shipmentRefused: false })).toBe("open");
  });
});

describe("aggregateStoreCustomers", () => {
  it("groups by phone across guest users and sums only kept orders", () => {
    const customers = aggregateStoreCustomers([
      row({ userId: USER_1, status: "delivered", totalAmount: "150.50" }),
      row({ userId: USER_2, addressPhone: "+201012345678", status: "returned", totalAmount: "99.00" }),
      row({ userId: USER_2, addressPhone: "201012345678", status: "confirmed", totalAmount: "20.25" }),
      row({ status: "cancelled", totalAmount: "500.00" }),
    ]);
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      key: "p:01012345678",
      phone: "01012345678",
      name: "Mona Ali",
      orderCount: 4,
      deliveredCount: 1,
      refusedCount: 1,
      cancelledCount: 1,
      totalSpent: "170.75",
      successRate: 50,
    });
  });

  it("keeps stores apart and sorts by the latest order", () => {
    const old = row({ storeId: STORE_A, createdAt: "2026-09-01 10:00:00+00" });
    const recent = row({ storeId: STORE_B, createdAt: "2026-10-20 10:00:00+00" });
    const customers = aggregateStoreCustomers([old, recent]);
    expect(customers.map((c) => c.storeId)).toEqual([STORE_B, STORE_A]);
  });

  it("takes name, contact and place from the newest order and the first/last dates from both ends", () => {
    const [c] = aggregateStoreCustomers([
      row({ createdAt: "2026-09-01 10:00:00+00", addressName: "Old Name", governorate: "Giza" }),
      row({ createdAt: "2026-10-01 10:00:00+00", addressName: "New Name", governorate: "Alexandria", email: "m@x.com" }),
    ]);
    expect(c).toMatchObject({
      name: "New Name",
      governorate: "Alexandria",
      email: "m@x.com",
      firstOrderAt: "2026-09-01 10:00:00+00",
      lastOrderAt: "2026-10-01 10:00:00+00",
      successRate: null,
    });
  });

  it("hides guest placeholders and groups phoneless orders by user", () => {
    const [c] = aggregateStoreCustomers([
      row({ addressPhone: null, addressName: null, userName: "Guest User", email: "guest_x@temp.local" }),
    ]);
    expect(c).toMatchObject({ key: `u:${USER_1}`, phone: null, name: "", email: null });
  });
});

describe("selectStoreCustomers", () => {
  const list = aggregateStoreCustomers([
    row({ addressPhone: "01012345678", addressName: "Mona Ali", status: "delivered", totalAmount: "50.00", createdAt: "2026-10-01 10:00:00+00" }),
    row({ addressPhone: "01012345678", addressName: "Mona Ali", totalAmount: "50.00", createdAt: "2026-10-02 10:00:00+00" }),
    row({ addressPhone: "01155556666", addressName: "Omar Said", status: "returned", totalAmount: "900.00", createdAt: "2026-10-03 10:00:00+00" }),
    row({ addressPhone: "01277778888", addressName: "Sara Adel", totalAmount: "300.00", email: "sara@x.com", createdAt: "2026-10-04 10:00:00+00" }),
  ]);
  const names = (r: { name: string }[]) => r.map((c) => c.name);

  it("searches name, email and any spelling of the phone", () => {
    expect(names(selectStoreCustomers(list, { query: "mona" }))).toEqual(["Mona Ali"]);
    expect(names(selectStoreCustomers(list, { query: "SARA@" }))).toEqual(["Sara Adel"]);
    for (const q of ["0101", "+20101", "١٠١٢٣", "1012345678"]) {
      expect(names(selectStoreCustomers(list, { query: q }))).toEqual(["Mona Ali"]);
    }
  });

  it("filters repeat buyers and refusals, and sorts", () => {
    expect(names(selectStoreCustomers(list, { filter: "repeat" }))).toEqual(["Mona Ali"]);
    expect(names(selectStoreCustomers(list, { filter: "refused" }))).toEqual(["Omar Said"]);
    expect(names(selectStoreCustomers(list, {}))).toEqual(["Sara Adel", "Omar Said", "Mona Ali"]);
    expect(names(selectStoreCustomers(list, { sort: "orders" }))).toEqual(["Mona Ali", "Sara Adel", "Omar Said"]);
    // Refused orders are not spend: Omar's 900 does not count.
    expect(names(selectStoreCustomers(list, { sort: "spent" }))).toEqual(["Sara Adel", "Mona Ali", "Omar Said"]);
  });

  it("parses filters and sorts from the URL", () => {
    expect(parseCustomerFilter("refused")).toBe("refused");
    expect(parseCustomerFilter("x")).toBe("all");
    expect(parseCustomerSort("spent")).toBe("spent");
    expect(parseCustomerSort(undefined)).toBe("recent");
  });

  it("builds wa.me links", () => {
    expect(customerWhatsAppUrl("01012345678")).toBe("https://wa.me/201012345678");
    expect(customerWhatsAppUrl("442079460958")).toBe("https://wa.me/442079460958");
  });
});

describe("computeOrderRisks", () => {
  it("counts the customer's other refusals and deliveries on the same store", () => {
    const now = row({ orderId: "now", createdAt: "2026-10-20 10:00:00+00" });
    const risks = computeOrderRisks([
      now,
      row({ status: "returned", createdAt: "2026-09-01 10:00:00+00" }),
      row({ status: "shipped", shipmentRefused: true, addressPhone: "+201012345678", createdAt: "2026-09-02 10:00:00+00" }),
      row({ status: "delivered", createdAt: "2026-09-03 10:00:00+00" }),
      // Another store and another phone never count.
      row({ storeId: STORE_B, status: "returned", createdAt: "2026-09-04 10:00:00+00" }),
      row({ addressPhone: "01199998888", status: "returned", createdAt: "2026-09-05 10:00:00+00" }),
    ]);
    expect(risks.get("now")).toEqual({ refused: 2, delivered: 1, duplicates: [] });
    expect(hasOrderRisk(risks.get("now"))).toBe(true);
  });

  it("flags still-open orders of the same customer within 10 minutes, both ways", () => {
    const risks = computeOrderRisks([
      row({ orderId: "a", orderNumber: "A", createdAt: "2026-10-20 10:00:00+00" }),
      row({ orderId: "b", orderNumber: "B", createdAt: "2026-10-20 10:09:00+00" }),
      row({ orderId: "c", orderNumber: "C", createdAt: "2026-10-20 10:30:00+00" }),
      row({ orderId: "d", orderNumber: "D", status: "cancelled", createdAt: "2026-10-20 10:02:00+00" }),
      row({ orderId: "e", orderNumber: "E", status: "returned", createdAt: "2026-10-20 10:03:00+00" }),
    ]);
    expect(risks.get("a")?.duplicates).toEqual(["B"]);
    expect(risks.get("b")?.duplicates).toEqual(["A"]);
    expect(risks.get("c")?.duplicates).toEqual([]);
    // E was returned: a refusal for the others, never a duplicate.
    expect(risks.get("c")).toEqual({ refused: 1, delivered: 0, duplicates: [] });
    expect(hasOrderRisk({ refused: 0, delivered: 3, duplicates: [] })).toBe(false);
    expect(hasOrderRisk(undefined)).toBe(false);
  });
});

describe("normalizeCustomerNote", () => {
  it("trims the note, cleans and dedupes tags, caps both", () => {
    expect(normalizeCustomerNote({ note: "  calls after 6  ", tags: [" VIP ", "vip", "", "  wholesale   buyer ", 3] })).toEqual({
      note: "calls after 6",
      tags: ["VIP", "wholesale buyer"],
    });
    expect(normalizeCustomerNote({ note: "   ", tags: "VIP" })).toEqual({ note: null, tags: [] });
    expect(normalizeCustomerNote({ note: "x".repeat(3000) }).note).toHaveLength(CUSTOMER_NOTE_MAX);
    const many = normalizeCustomerTags(Array.from({ length: 15 }, (_, i) => `tag ${i} ${"y".repeat(40)}`));
    expect(many).toHaveLength(10);
    expect(many.every((t) => t.length <= 30)).toBe(true);
  });
});

describe("parseCustomerKey", () => {
  it("round-trips the keys and refuses anything else", () => {
    expect(parseCustomerKey(customerKey(row()))).toEqual({ phone: "01012345678" });
    expect(parseCustomerKey(`u:${USER_1}`)).toEqual({ userId: USER_1 });
    expect(parseCustomerKey("p:0101' OR 1=1")).toBeNull();
    expect(parseCustomerKey("u:not-a-uuid")).toBeNull();
    expect(parseCustomerKey("x:1")).toBeNull();
  });
});

describe("customerExportRow", () => {
  it("keeps the phone as text, money and counts as numbers, dates in Cairo time", () => {
    const [customer] = aggregateStoreCustomers([
      row({ addressPhone: "+20 101 234 5678", totalAmount: "150.50", status: "delivered", createdAt: "2026-10-29T22:30:00Z" }),
      row({ addressPhone: "01012345678", totalAmount: "99.99", status: "returned", createdAt: "2026-10-30T09:05:00Z" }),
    ]);
    const out = customerExportRow(customer!, { note: "Calls after 6", tags: ["VIP", "Wholesale"] });
    expect(Object.keys(out)).toEqual([...CUSTOMER_EXPORT_COLUMNS]);
    expect(out.phone).toBe("01012345678");
    expect(out.orders).toBe(2);
    expect(out.spent).toBe(150.5);
    expect(out.successRate).toBe(50);
    // 22:30Z on Oct 29 is 01:30 on Oct 30 in Cairo (UTC+3 in summer time, +2 in winter).
    expect(out.firstOrder).toMatch(/^2026-10-30 0[01]:30$/);
    expect(out.tags).toBe("VIP, Wholesale");
    expect(out.note).toBe("Calls after 6");
  });

  it("leaves empty cells for a customer with no note, phone or ended order", () => {
    const [customer] = aggregateStoreCustomers([row({ addressPhone: null, userPhone: null, status: "pending" })]);
    const out = customerExportRow(customer!, undefined);
    expect(out).toMatchObject({ phone: "", successRate: "", tags: "", note: "" });
  });
});
