import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import { pushPrefsInputSchema, pushSubscriptionInputSchema } from "./push-alerts.dto";
import {
  buildPushPayload,
  DEFAULT_PUSH_PREFS,
  isAllowedPushEndpoint,
  isGonePushStatus,
  normalizePushPrefs,
  orderIdsNeedingAmount,
  parseVapidConfig,
  planPushDeliveries,
  pushCategoryOf,
  PUSHED_NOTIFICATION_TYPES,
  safePushPath,
  type PushCandidate,
  type PushDevice,
} from "./push-alerts.lib";

const SELLER_A = "11111111-1111-4111-8111-111111111111";
const SELLER_B = "22222222-2222-4222-8222-222222222222";
const ORDER = "33333333-3333-4333-8333-333333333333";
const STORE = "44444444-4444-4444-8444-444444444444";
const NOW = new Date("2026-10-30T12:00:00Z");

function row(over: Partial<PushCandidate> = {}): PushCandidate {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    sellerId: SELLER_A,
    storeId: STORE,
    type: "order_created",
    data: { orderId: ORDER, orderNumber: "1042" },
    createdAt: "2026-10-30T11:58:00Z",
    ...over,
  };
}

function device(sellerId: string, id = `dev-${sellerId.slice(0, 4)}`): PushDevice {
  return { id, sellerId, endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "k", auth: "a", locale: "ar" };
}

describe("type → push category", () => {
  it("maps new orders and order problems, nothing else", () => {
    expect(pushCategoryOf("order_created")).toBe("newOrder");
    expect(pushCategoryOf("carrier_needs_attention")).toBe("orderProblem");
    expect(pushCategoryOf("carrier_shipment_failed")).toBe("orderProblem");
    expect(pushCategoryOf("review_received")).toBeNull();
    expect(pushCategoryOf("welcome_gift_granted")).toBeNull();
    expect(pushCategoryOf("toString")).toBeNull();
  });

  it("every pushed type has a title and body in both languages", () => {
    for (const messages of [ar, en]) {
      const texts = messages.pushAlerts.messages as Record<string, { title?: string; body?: string }>;
      for (const type of PUSHED_NOTIFICATION_TYPES) {
        expect(texts[type]?.title, type).toBeTruthy();
        expect(texts[type]?.body, type).toBeTruthy();
      }
    }
  });
});

describe("prefs", () => {
  it("defaults to all on and fills missing fields", () => {
    expect(normalizePushPrefs(null)).toEqual(DEFAULT_PUSH_PREFS);
    expect(normalizePushPrefs({ newOrder: false })).toEqual({ newOrder: false, orderProblem: true, lowStock: true });
  });

  it("the input schema is strict", () => {
    expect(pushPrefsInputSchema.safeParse({ newOrder: true, orderProblem: false, lowStock: true }).success).toBe(true);
    expect(pushPrefsInputSchema.safeParse({ newOrder: true, orderProblem: false }).success).toBe(false);
    expect(pushPrefsInputSchema.safeParse({ newOrder: true, orderProblem: false, lowStock: true, x: 1 }).success).toBe(false);
  });
});

describe("planPushDeliveries (claim selection)", () => {
  const devices = new Map([
    [SELLER_A, [device(SELLER_A, "a1"), device(SELLER_A, "a2")]],
    [SELLER_B, [device(SELLER_B, "b1")]],
  ]);

  it("sends a recent new order to each of the seller's devices only", () => {
    const out = planPushDeliveries([row()], new Map(), devices, NOW);
    expect(out.map((d) => d.device.id)).toEqual(["a1", "a2"]);
    expect(out.every((d) => d.category === "newOrder")).toBe(true);
  });

  it("skips non-pushed types, old rows, switched-off types and sellers without devices", () => {
    const rows = [
      row({ type: "review_received" }),
      row({ createdAt: "2026-10-30T10:30:00Z" }),
      row({ sellerId: SELLER_B }),
      row({ sellerId: "66666666-6666-4666-8666-666666666666" }),
    ];
    const prefs = new Map([[SELLER_B, { ...DEFAULT_PUSH_PREFS, newOrder: false }]]);
    expect(planPushDeliveries(rows, prefs, devices, NOW)).toEqual([]);
  });

  it("never sends one seller's row to another seller's device", () => {
    const mixed = new Map([[SELLER_A, [device(SELLER_B, "b9")]]]);
    expect(planPushDeliveries([row()], new Map(), mixed, NOW)).toEqual([]);
  });

  it("only asks for amounts of store orders", () => {
    expect(orderIdsNeedingAmount([row(), row({ storeId: null }), row({ type: "carrier_needs_attention" })])).toEqual([ORDER]);
    expect(orderIdsNeedingAmount([row({ data: { orderId: "x" } })])).toEqual([]);
  });
});

describe("buildPushPayload", () => {
  const t = (key: string, values?: Record<string, string | number>) => `${key}|${values?.orderNumber}|${values?.amount}`;

  it("uses the amount body when an amount is known, and links to the order", () => {
    const p = buildPushPayload(row(), "ar", t, "EGP 250");
    expect(p.title).toBe("order_created.title|1042|EGP 250");
    expect(p.body).toBe("order_created.bodyWithAmount|1042|EGP 250");
    expect(p.url).toBe(`/orders?order=${ORDER}`);
    expect(p.dir).toBe("rtl");
    expect(p.tag).toContain(row().id);
  });

  it("falls back to the plain body, and only reads the order number from data", () => {
    const p = buildPushPayload(row({ data: { orderNumber: "7", customerName: "X", phone: "010" } }), "en", t);
    expect(p.body).toBe("order_created.body|7|");
    expect(p.body).not.toContain("010");
    expect(p.url).toBe("/orders");
    expect(p.dir).toBe("ltr");
  });

  it("low stock (F-10 type) maps to its switch and opens the products list", () => {
    expect(pushCategoryOf("low_stock")).toBe("lowStock");
    const p = buildPushPayload(row({ type: "low_stock", data: { name: "Mug", variantTitle: "Red" } }), "en", (key, v) => `${key}|${v?.productName}`);
    expect(p.body).toBe("low_stock.bodyWithProduct|Mug · Red");
    // The bell's own link when it has one (F-10: inventory page), else the products list.
    expect(p.url.startsWith("/products")).toBe(true);
    expect(buildPushPayload(row({ type: "low_stock", data: {} }), "en", (key) => key).body).toBe("low_stock.body");
    expect(p.url.startsWith("/")).toBe(true);
  });

  it("clips long text", () => {
    const long = () => "x".repeat(500);
    const p = buildPushPayload(row(), "en", long);
    expect(p.title.length).toBeLessThanOrEqual(80);
    expect(p.body.length).toBeLessThanOrEqual(180);
  });
});

describe("real push text", () => {
  it("renders the Arabic and English messages with next-intl", async () => {
    const { createTranslator } = await import("next-intl");
    for (const [locale, messages] of [["ar", ar], ["en", en]] as const) {
      const t = createTranslator({ locale, messages, namespace: "pushAlerts.messages" } as never) as unknown as (
        key: string,
        values?: Record<string, string | number>,
      ) => string;
      const p = buildPushPayload(row(), locale, t, "250 EGP");
      expect(p.body).toContain("1042");
      expect(p.body).toContain("250 EGP");
    }
    // The first next-intl import can take over 5 s on a cold run.
  }, 30_000);
});

describe("safety helpers", () => {
  it("safePushPath keeps same-origin paths only", () => {
    expect(safePushPath("/orders?order=1")).toBe("/orders?order=1");
    expect(safePushPath("//evil.com")).toBe("/");
    expect(safePushPath("/\\evil.com")).toBe("/");
    expect(safePushPath("https://evil.com")).toBe("/");
    expect(safePushPath(null)).toBe("/");
  });

  it("accepts only known push services", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://wns2-db5p.notify.windows.com/w/?token=x")).toBe(true);
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://169.254.169.254/latest")).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/x")).toBe(false);
  });

  it("validates the browser subscription", () => {
    const ok = { endpoint: "https://fcm.googleapis.com/fcm/send/x", keys: { p256dh: "BOr_abc-123", auth: "xyz_0" }, expirationTime: null };
    expect(pushSubscriptionInputSchema.safeParse(ok).success).toBe(true);
    expect(pushSubscriptionInputSchema.safeParse({ ...ok, endpoint: "https://example.com/x" }).success).toBe(false);
    expect(pushSubscriptionInputSchema.safeParse({ ...ok, keys: { p256dh: "a b", auth: "x" } }).success).toBe(false);
  });

  it("deletes subscriptions on 404/410 only", () => {
    expect(isGonePushStatus(410)).toBe(true);
    expect(isGonePushStatus(404)).toBe(true);
    expect(isGonePushStatus(500)).toBe(false);
    expect(isGonePushStatus(undefined)).toBe(false);
  });

  it("parseVapidConfig needs all three valid values", () => {
    const env = {
      VAPID_PUBLIC_KEY: `B${"A".repeat(86)}`,
      VAPID_PRIVATE_KEY: "a".repeat(43),
      VAPID_SUBJECT: "mailto:support@tallaby.com",
    };
    expect(parseVapidConfig(env)).not.toBeNull();
    expect(parseVapidConfig({ ...env, VAPID_PRIVATE_KEY: undefined })).toBeNull();
    expect(parseVapidConfig({ ...env, VAPID_SUBJECT: "support@tallaby.com" })).toBeNull();
    expect(parseVapidConfig({ ...env, VAPID_PUBLIC_KEY: "short" })).toBeNull();
  });
});
