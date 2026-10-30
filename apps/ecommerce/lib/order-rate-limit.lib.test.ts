import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit.lib";
import { createOrderRateLimit, ORDER_RATE_LIMITS, orderRateLimitKeys, orderRatePhone } from "./order-rate-limit.lib";

const STORE = "store-1";
const MIN = 60_000;

describe("orderRatePhone", () => {
  it("normalizes Egyptian mobiles", () => {
    expect(orderRatePhone("+20 101 234 5678")).toBe("01012345678");
    expect(orderRatePhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
  });
  it("keeps other numbers as digits and drops junk", () => {
    expect(orderRatePhone("+44 7700 900123")).toBe("447700900123");
    expect(orderRatePhone("12")).toBeNull();
    expect(orderRatePhone(null)).toBeNull();
  });
});

describe("orderRateLimitKeys", () => {
  it("scopes every key to the store", () => {
    expect(orderRateLimitKeys({ storeId: STORE, ip: " 1.2.3.4 ", phone: "01012345678", userId: "u1" })).toEqual({
      ip: "store-1:ip:1.2.3.4",
      phone: "store-1:phone:01012345678",
      user: "store-1:user:u1",
    });
  });
  it("leaves out unknown parts", () => {
    expect(orderRateLimitKeys({ storeId: STORE, ip: "unknown", phone: "", userId: null })).toEqual({});
  });
  it("gives the same phone the same key however it is written", () => {
    const a = orderRateLimitKeys({ storeId: STORE, phone: "01012345678" });
    const b = orderRateLimitKeys({ storeId: STORE, phone: "+201012345678" });
    expect(a.phone).toBe(b.phone);
  });
});

describe("createOrderRateLimit", () => {
  it("allows 5 orders per IP in 10 minutes, then refuses until the window ends", () => {
    const rl = createOrderRateLimit();
    const t0 = 1_000_000;
    for (let i = 0; i < ORDER_RATE_LIMITS.ip.limit; i++) {
      const keys = orderRateLimitKeys({ storeId: STORE, ip: "1.1.1.1", userId: `u${i}`, phone: `0101234567${i}` });
      expect(rl.allows(keys, t0)).toBe(true);
      rl.record(keys, t0);
    }
    const next = orderRateLimitKeys({ storeId: STORE, ip: "1.1.1.1", userId: "u9", phone: "01099999999" });
    expect(rl.allows(next, t0 + MIN)).toBe(false);
    expect(rl.allows(next, t0 + 10 * MIN)).toBe(true);
  });

  it("allows 3 orders per phone per hour, from any IP", () => {
    const rl = createOrderRateLimit();
    for (let i = 0; i < 3; i++) {
      rl.record(orderRateLimitKeys({ storeId: STORE, ip: `10.0.0.${i}`, userId: `u${i}`, phone: "01012345678" }), 0);
    }
    const keys = orderRateLimitKeys({ storeId: STORE, ip: "10.0.0.9", userId: "u9", phone: "+20 10 1234 5678" });
    expect(rl.allows(keys, 30 * MIN)).toBe(false);
    expect(rl.allows(keys, 60 * MIN)).toBe(true);
  });

  it("counts per store", () => {
    const rl = createOrderRateLimit();
    for (let i = 0; i < 3; i++) rl.record(orderRateLimitKeys({ storeId: STORE, phone: "01012345678" }), 0);
    expect(rl.allows(orderRateLimitKeys({ storeId: "store-2", phone: "01012345678" }), 0)).toBe(true);
  });

  it("checking counts nothing: only recorded orders use the allowance", () => {
    const rl = createOrderRateLimit();
    const keys = orderRateLimitKeys({ storeId: STORE, userId: "u1" });
    for (let i = 0; i < 50; i++) expect(rl.allows(keys, 0)).toBe(true);
  });

  it("allows a checkout with no keys", () => {
    expect(createOrderRateLimit().allows({}, 0)).toBe(true);
  });
});

describe("createRateLimiter.peek", () => {
  it("matches check without counting", () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(l.peek("k", 0)).toBe(true);
    expect(l.peek("k", 0)).toBe(true);
    expect(l.check("k", 0)).toBe(true);
    expect(l.peek("k", 1)).toBe(false);
    expect(l.peek("k", 1000)).toBe(true);
  });
});
