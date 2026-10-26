import { describe, expect, it } from "vitest";
import {
  isSellerHandledLine,
  progressIndex,
  resolveSellerOrderFlow,
  type SellerOrderFlowInput,
} from "./order-flow.lib";

const base: SellerOrderFlowInput = {
  orderStatus: "pending",
  paymentStatus: "pending",
  isDigitalOnly: false,
  allLinesOwned: true,
  sellerFulfilled: true,
  shipment: null,
  walletPaid: false,
};

const flow = (patch: Partial<SellerOrderFlowInput>) => resolveSellerOrderFlow({ ...base, ...patch });

describe("resolveSellerOrderFlow", () => {
  it("a new cash-on-delivery order is confirmed or cancelled", () => {
    expect(flow({})).toMatchObject({ stage: "new", primary: "confirm", actions: ["confirm", "cancel"] });
  });

  it("a confirmed order ships without a rider", () => {
    expect(flow({ orderStatus: "confirmed" })).toMatchObject({
      stage: "to_ship",
      primary: "ship",
      actions: ["ship", "cancel"],
    });
  });

  it("a prepaid pending order skips confirmation and can't be cancelled here", () => {
    expect(flow({ paymentStatus: "paid" })).toMatchObject({
      stage: "to_ship",
      actions: ["ship"],
      prepaid: true,
    });
  });

  it("a partly wallet-paid order can't be cancelled here", () => {
    expect(flow({ walletPaid: true }).actions).toEqual(["confirm"]);
  });

  it("an assigned rider shipment is still to ship", () => {
    expect(flow({ orderStatus: "shipped", shipment: { status: "assigned", ownedBySeller: true } })).toMatchObject({
      stage: "to_ship",
      primary: "ship",
    });
  });

  it("out for delivery is delivered, failed or returned", () => {
    expect(flow({ orderStatus: "out_for_delivery", shipment: { status: "out_for_delivery", ownedBySeller: true } }).actions).toEqual([
      "deliver",
      "fail",
      "return",
    ]);
  });

  it("a failed attempt is retried or returned", () => {
    expect(flow({ orderStatus: "out_for_delivery", shipment: { status: "failed", ownedBySeller: true } })).toMatchObject({
      stage: "failed",
      actions: ["ship", "return"],
    });
  });

  it("final stages have no actions", () => {
    for (const orderStatus of ["delivered", "cancelled", "returned", "refunded"]) {
      expect(flow({ orderStatus }).actions).toEqual([]);
    }
  });

  it("is read-only when another seller, Tallaby or a digital order is involved", () => {
    expect(flow({ allLinesOwned: false }).readOnly).toBe("multi_seller");
    expect(flow({ sellerFulfilled: false }).readOnly).toBe("tallaby");
    expect(flow({ shipment: { status: "assigned", ownedBySeller: false } }).readOnly).toBe("tallaby");
    expect(flow({ isDigitalOnly: true }).readOnly).toBe("digital");
    expect(flow({ allLinesOwned: false }).actions).toEqual([]);
  });

  it("waits on online payment", () => {
    expect(flow({ orderStatus: "payment_processing" })).toMatchObject({ stage: "awaiting_payment", actions: [] });
  });
});

describe("carrier-managed shipments", () => {
  it("a Bosta delivery offers no manual moves, at any stage", () => {
    const bosta = (status: string) => ({ status, ownedBySeller: true, carrierManaged: true });
    expect(flow({ orderStatus: "shipping_soon", shipment: bosta("assigned") })).toMatchObject({
      stage: "to_ship",
      primary: null,
      actions: [],
      carrierManaged: true,
    });
    expect(flow({ orderStatus: "out_for_delivery", shipment: bosta("out_for_delivery") }).actions).toEqual([]);
  });

  it("a seller shipment keeps its moves", () => {
    expect(flow({ orderStatus: "shipped", shipment: { status: "assigned", ownedBySeller: true } })).toMatchObject({
      actions: ["ship", "cancel"],
      carrierManaged: false,
    });
  });
});

describe("isSellerHandledLine", () => {
  it("every line is the seller's while Tallaby services are off", () => {
    expect(isSellerHandledLine("platform_fulfilled", false)).toBe(true);
    expect(isSellerHandledLine("seller_fulfilled", false)).toBe(true);
  });

  it("follows the product flag once Tallaby services are on", () => {
    expect(isSellerHandledLine("platform_fulfilled", true)).toBe(false);
    expect(isSellerHandledLine("seller_fulfilled", true)).toBe(true);
    expect(isSellerHandledLine(null, true)).toBe(true);
  });
});

describe("progressIndex", () => {
  it("places stages on the track", () => {
    expect(progressIndex("new")).toBe(0);
    expect(progressIndex("to_ship")).toBe(1);
    expect(progressIndex("failed")).toBe(2);
    expect(progressIndex("delivered")).toBe(3);
    expect(progressIndex("cancelled")).toBe(-1);
  });
});
