import { describe, expect, it } from "vitest";
import { customerCanCancel, customerCanConfirm } from "./customer-order-actions.lib";

describe("customerCanConfirm", () => {
  const ok = { status: "pending", isTest: false, isDigitalOnly: false, depositStatus: null, foreignLines: 0, carrierManaged: false };
  it("confirms a plain pending order", () => {
    expect(customerCanConfirm(ok)).toBe(true);
  });
  it("follows the dashboard's confirm rule", () => {
    expect(customerCanConfirm({ ...ok, status: "confirmed" })).toBe(false);
    expect(customerCanConfirm({ ...ok, isTest: true })).toBe(false);
    expect(customerCanConfirm({ ...ok, isDigitalOnly: true })).toBe(false);
    expect(customerCanConfirm({ ...ok, depositStatus: "awaiting" })).toBe(false);
    expect(customerCanConfirm({ ...ok, depositStatus: "reported" })).toBe(false);
    expect(customerCanConfirm({ ...ok, depositStatus: "paid" })).toBe(true);
    expect(customerCanConfirm({ ...ok, foreignLines: 1 })).toBe(false);
    expect(customerCanConfirm({ ...ok, carrierManaged: true })).toBe(false);
  });
});

describe("customerCanCancel", () => {
  const ok = { status: "pending", isTest: false, paymentStatus: "pending", depositStatus: null, walletPaid: false, hasOpenShipment: false };
  it("cancels pending and confirmed orders with nothing paid or shipped", () => {
    expect(customerCanCancel(ok)).toBe(true);
    expect(customerCanCancel({ ...ok, status: "confirmed" })).toBe(true);
    expect(customerCanCancel({ ...ok, paymentStatus: null })).toBe(true);
  });
  it("refuses anything that would need a refund or a recall", () => {
    expect(customerCanCancel({ ...ok, status: "payment_processing" })).toBe(false);
    expect(customerCanCancel({ ...ok, status: "shipped" })).toBe(false);
    expect(customerCanCancel({ ...ok, status: "cancelled" })).toBe(false);
    expect(customerCanCancel({ ...ok, paymentStatus: "paid" })).toBe(false);
    expect(customerCanCancel({ ...ok, paymentStatus: "collected" })).toBe(false);
    expect(customerCanCancel({ ...ok, depositStatus: "paid" })).toBe(false);
    expect(customerCanCancel({ ...ok, walletPaid: true })).toBe(false);
    expect(customerCanCancel({ ...ok, hasOpenShipment: true })).toBe(false);
    expect(customerCanCancel({ ...ok, isTest: true })).toBe(false);
  });
});
