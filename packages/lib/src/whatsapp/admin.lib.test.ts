import { describe, expect, it } from "vitest";
import { WHATSAPP_EVENTS } from "./events.lib";
import {
  DEFAULT_META_RATE_MICROS,
  checkRetryable,
  isBackendFullyConfigured,
  deliveredPercent,
  formatCentsUsd,
  formatMicrosUsd,
  normalizeMetaRates,
  parseUsageDays,
  parseWhatsAppAdminSettings,
  profitMicros,
  sumUsage,
  EMPTY_USAGE_COUNTS,
} from "./admin.lib";

const valid = {
  enabled: true,
  storesDefaultOn: false,
  sellerPriceUsdCents: 0,
  metaRateMicros: { utility: 3600, authentication: 3600, marketing: 64400, service: 0 },
  eventsEnabled: ["order_shipped", "order_placed", "order_placed"],
};

describe("parseWhatsAppAdminSettings", () => {
  it("accepts a valid form and keeps events unique, in event order", () => {
    const result = parseWhatsAppAdminSettings(valid);
    expect(result).toEqual({ success: true, data: { ...valid, eventsEnabled: ["order_placed", "order_shipped"] } });
  });

  it("refuses any seller price above 0 (D3: charging needs owner approval)", () => {
    expect(parseWhatsAppAdminSettings({ ...valid, sellerPriceUsdCents: 1 })).toEqual({ success: false, error: "price_needs_approval" });
    expect(parseWhatsAppAdminSettings({ ...valid, sellerPriceUsdCents: 100 })).toEqual({ success: false, error: "price_needs_approval" });
  });

  it("rejects bad prices, rates, events and extra keys", () => {
    const bad = [
      { ...valid, sellerPriceUsdCents: -1 },
      { ...valid, sellerPriceUsdCents: 0.5 },
      { ...valid, sellerPriceUsdCents: 101 },
      { ...valid, metaRateMicros: { ...valid.metaRateMicros, utility: 1_000_001 } },
      { ...valid, metaRateMicros: { ...valid.metaRateMicros, utility: -1 } },
      { ...valid, metaRateMicros: { ...valid.metaRateMicros, utility: 1.5 } },
      { ...valid, metaRateMicros: { utility: 1, authentication: 1, marketing: 1 } },
      { ...valid, metaRateMicros: { ...valid.metaRateMicros, other: 1 } },
      { ...valid, eventsEnabled: ["order_paid"] },
      { ...valid, enabled: "yes" },
      { ...valid, extra: true },
      null,
    ];
    for (const input of bad) expect(parseWhatsAppAdminSettings(input)).toEqual({ success: false, error: "invalid_input" });
  });

  it("accepts the rate bounds and no events", () => {
    const rates = { utility: 0, authentication: 1_000_000, marketing: 0, service: 1_000_000 };
    expect(parseWhatsAppAdminSettings({ ...valid, metaRateMicros: rates, eventsEnabled: [] }).success).toBe(true);
    expect(parseWhatsAppAdminSettings({ ...valid, eventsEnabled: [...WHATSAPP_EVENTS] }).success).toBe(true);
  });
});

describe("normalizeMetaRates", () => {
  it("falls back to the defaults for missing or bad keys", () => {
    expect(normalizeMetaRates(null)).toEqual(DEFAULT_META_RATE_MICROS);
    expect(normalizeMetaRates({ utility: 5000, marketing: "x", service: -3 })).toEqual({ ...DEFAULT_META_RATE_MICROS, utility: 5000 });
  });
});

describe("usage money", () => {
  it("computes profit in integer micro-USD", () => {
    expect(profitMicros(0, 3600)).toBe(-3600);
    expect(profitMicros(1, 3600)).toBe(6400);
    expect(profitMicros(250, 0)).toBe(2_500_000);
  });

  it("formats micro-USD and cents as dollars", () => {
    expect(formatMicrosUsd(0)).toBe("$0.00");
    expect(formatMicrosUsd(3600)).toBe("$0.0036");
    expect(formatMicrosUsd(64400)).toBe("$0.0644");
    expect(formatMicrosUsd(1_250_000)).toBe("$1.25");
    expect(formatMicrosUsd(-3600)).toBe("-$0.0036");
    expect(formatMicrosUsd(999_990)).toBe("$1.00");
    expect(formatMicrosUsd(12_345_678_000)).toBe("$12,345.678");
    expect(formatCentsUsd(150)).toBe("$1.50");
  });

  it("computes delivered %", () => {
    expect(deliveredPercent(0, 0)).toBeNull();
    expect(deliveredPercent(2, 3)).toBe(66.7);
    expect(deliveredPercent(5, 5)).toBe(100);
  });

  it("sums usage rows", () => {
    const row = { ...EMPTY_USAGE_COUNTS, messages: 2, costMicros: 3600, confirms: 1 };
    expect(sumUsage([row, row])).toEqual({ ...EMPTY_USAGE_COUNTS, messages: 4, costMicros: 7200, confirms: 2 });
  });

  it("parses the usage range", () => {
    expect(parseUsageDays("30")).toBe(30);
    expect(parseUsageDays(90)).toBe(90);
    expect(parseUsageDays("14")).toBe(7);
    expect(parseUsageDays(undefined)).toBe(7);
  });
});

describe("isBackendFullyConfigured", () => {
  const all = { token: true, phoneNumberId: true, wabaId: true, appSecret: true, verifyToken: true, payloadSecret: true };
  it("needs every env flag true", () => {
    expect(isBackendFullyConfigured(all)).toBe(true);
    expect(isBackendFullyConfigured({ ...all, payloadSecret: false })).toBe(false);
    expect(isBackendFullyConfigured({ token: true })).toBe(false);
    expect(isBackendFullyConfigured(null)).toBe(false);
  });
});

describe("checkRetryable", () => {
  it("allows failed rows and unknown rows only when confirmed", () => {
    expect(checkRetryable(["failed"], false)).toEqual({ ok: true });
    expect(checkRetryable(["failed", "unknown"], false)).toEqual({ ok: false, error: "unknown_needs_confirm" });
    expect(checkRetryable(["unknown"], true)).toEqual({ ok: true });
  });

  it("refuses any other status", () => {
    for (const status of ["queued", "sending", "sent", "delivered", "read", "skipped"]) {
      expect(checkRetryable(["failed", status], true)).toEqual({ ok: false, error: "not_retryable" });
    }
  });
});
