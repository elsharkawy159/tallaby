import { describe, expect, it } from "vitest";
import {
  customerHref,
  orderHref,
  ordersHref,
  productHref,
  sellerHref,
  sellerWalletHref,
  storeHref,
} from "./entity-href.lib";

const id = "8b0c2a52-6a4e-4a3f-9f43-0f5b0d1a2c3d";

describe("entity hrefs", () => {
  it("builds detail routes", () => {
    expect(customerHref(id)).toBe(`/customers/${id}`);
    expect(orderHref(id)).toBe(`/orders/${id}`);
    expect(productHref(id)).toBe(`/products/${id}`);
    expect(sellerWalletHref(id)).toBe(`/wallets/sellers/${id}`);
  });

  it("adds a tab only when it is not the overview", () => {
    expect(sellerHref(id)).toBe(`/sellers/${id}`);
    expect(sellerHref(id, "overview")).toBe(`/sellers/${id}`);
    expect(sellerHref(id, "wallet")).toBe(`/sellers/${id}?tab=wallet`);
    expect(storeHref(id, "website")).toBe(`/stores/${id}#website`);
  });

  it("filters the orders list", () => {
    expect(ordersHref()).toBe("/orders");
    expect(ordersHref({ seller: id })).toBe(`/orders?seller=${id}`);
    expect(ordersHref({ store: id, customer: id })).toBe(`/orders?store=${id}&customer=${id}`);
  });
});
