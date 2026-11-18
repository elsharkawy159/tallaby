import { describe, expect, it } from "vitest";
import { bpsPercent, destinationLines, egpAmount, filterHref, refundReasonLabel, saleStatusLabel } from "./tallaby-pay.lib";

describe("Admin › Tallaby Pay display helpers", () => {
  it("formats EGP with two decimals and a leading minus", () => {
    expect(egpAmount("1250.5")).toBe("EGP 1,250.50");
    expect(egpAmount("-30")).toBe("-EGP 30.00");
    expect(egpAmount(null)).toBe("EGP 0.00");
    expect(egpAmount("abc")).toBe("EGP —");
  });

  it("shows basis points as a percent", () => {
    expect(bpsPercent(300)).toBe("3%");
    expect(bpsPercent(275)).toBe("2.75%");
    expect(bpsPercent(250)).toBe("2.5%");
    expect(bpsPercent(0)).toBe("0%");
  });

  it("lists every field of each destination, IBAN labelled as such", () => {
    expect(destinationLines({ method: "bank", holderName: "Mona Ali", bankName: "CIB", accountNumber: "EG380019000500000000263180002" })).toContainEqual({
      label: "IBAN",
      value: "EG380019000500000000263180002",
      mono: true,
    });
    expect(destinationLines({ method: "mobile_wallet", holderName: "Mona Ali", provider: "vodafone_cash", phone: "01012345678" })[0]).toEqual({
      label: "Method",
      value: "Vodafone Cash",
    });
    expect(destinationLines({ method: "instapay", holderName: "Mona Ali", address: "mona@instapay" }).map((l) => l.label)).toEqual([
      "Method",
      "Holder",
      "Address",
    ]);
  });

  it("labels a sale by where its money is", () => {
    expect(saleStatusLabel({ status: "refunded", refundState: null, orderStatus: "cancelled" }).label).toBe("Refunded");
    expect(saleStatusLabel({ status: "pending", refundState: "requested", orderStatus: "cancelled" })).toEqual({
      label: "Refund requested",
      tone: "warning",
    });
    expect(saleStatusLabel({ status: "pending", refundState: null, orderStatus: "shipped" }).label).toBe("Pending delivery");
    expect(saleStatusLabel({ status: "available", refundState: null, orderStatus: "delivered" }).tone).toBe("success");
  });

  it("explains the refund reasons the system writes", () => {
    expect(refundReasonLabel("paid_after_cancel")).toBe("Paid after the order was cancelled");
    expect(refundReasonLabel("seller_cancelled")).toBe("Seller cancelled the order");
    expect(refundReasonLabel(null)).toBe("Seller asked for a refund");
  });

  it("builds filter links without empty values or page 1", () => {
    expect(filterHref("/tallaby-pay/sales", { q: "nour", status: null, page: 1 })).toBe("/tallaby-pay/sales?q=nour");
    expect(filterHref("/tallaby-pay/sales", { page: 3, from: "" })).toBe("/tallaby-pay/sales?page=3");
    expect(filterHref("/tallaby-pay/wallets", {})).toBe("/tallaby-pay/wallets");
  });
});
