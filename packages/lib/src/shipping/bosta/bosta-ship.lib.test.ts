import { describe, expect, it } from "vitest";
import { bostaCollection, bostaShipBlocker, bostaWebhookUrl } from "./bosta-ship.lib";

const cod = { status: "confirmed", paymentStatus: "pending", paymentMethod: "cash_on_delivery" };

describe("bostaCollection", () => {
  it("collects cash orders in full and nothing on settled ones", () => {
    expect(bostaCollection({ paymentStatus: "pending", paymentMethod: "cash_on_delivery" })).toEqual({ ok: true, prepaid: false });
    expect(bostaCollection({ paymentStatus: null, paymentMethod: null })).toEqual({ ok: true, prepaid: false });
    expect(bostaCollection({ paymentStatus: "paid", paymentMethod: "card" })).toEqual({ ok: true, prepaid: true });
    expect(bostaCollection({ paymentStatus: "collected", paymentMethod: "cash_on_delivery" })).toEqual({ ok: true, prepaid: true });
  });

  it("makes unpaid online orders (including a wallet part-payment) wait", () => {
    expect(bostaCollection({ paymentStatus: "pending", paymentMethod: "instapay" })).toEqual({ ok: false, error: "awaiting_payment" });
    expect(bostaCollection({ paymentStatus: "pending", paymentMethod: "wallet_vodafone_cash" })).toEqual({ ok: false, error: "awaiting_payment" });
    expect(bostaCollection({ paymentStatus: "failed", paymentMethod: "online_payment" })).toEqual({ ok: false, error: "awaiting_payment" });
  });
});

describe("bostaShipBlocker", () => {
  it("lets a new, confirmed or prepaid order ship", () => {
    expect(bostaShipBlocker(cod, null)).toBeNull();
    expect(bostaShipBlocker({ ...cod, status: "pending" }, null)).toBeNull();
    expect(bostaShipBlocker({ status: "pending", paymentStatus: "paid", paymentMethod: "card" }, null)).toBeNull();
  });

  it("refuses finished, cancelled and unpaid orders", () => {
    expect(bostaShipBlocker({ ...cod, status: "delivered" }, null)).toBe("not_shippable");
    expect(bostaShipBlocker({ ...cod, status: "cancelled" }, null)).toBe("not_shippable");
    expect(bostaShipBlocker({ ...cod, status: "payment_processing" }, null)).toBe("awaiting_payment");
  });

  it("takes over a pending seller shipment or a failed Bosta claim, nothing else", () => {
    const base = { externalId: null, riderId: null, status: "pending" };
    expect(bostaShipBlocker(cod, { ...base, carrier: "seller" })).toBeNull();
    expect(bostaShipBlocker(cod, { ...base, carrier: "bosta" })).toBeNull();
    expect(bostaShipBlocker(cod, { ...base, carrier: "bosta", externalId: "x" })).toBe("already_shipped");
    expect(bostaShipBlocker(cod, { ...base, carrier: "seller", status: "out_for_delivery" })).toBe("already_shipped");
    expect(bostaShipBlocker(cod, { ...base, carrier: "seller", riderId: "r" })).toBe("other_carrier");
    expect(bostaShipBlocker(cod, { ...base, carrier: "tallaby" })).toBe("other_carrier");
  });
});

describe("bostaWebhookUrl", () => {
  it("builds the per-integration backend URL from an https base", () => {
    expect(bostaWebhookUrl("abc", "https://api.tallaby.com/")).toBe("https://api.tallaby.com/api/webhooks/bosta/abc");
  });

  it("is null without a public https backend", () => {
    expect(bostaWebhookUrl("abc", "")).toBeNull();
    expect(bostaWebhookUrl("abc", "http://localhost:3001")).toBeNull();
  });
});
