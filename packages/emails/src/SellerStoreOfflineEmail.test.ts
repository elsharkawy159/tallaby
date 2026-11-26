import { render } from "@react-email/components";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SellerStoreOfflineEmail, sellerStoreOfflineSubject, type SellerStoreOfflineEmailProps } from "./SellerStoreOfflineEmail.js";

const base: SellerStoreOfflineEmailProps = {
  storeName: "متجر النور",
  storeCount: 1,
  walletUrl: "https://dashboard.tallaby.com/wallet",
  orderFee: "$0.03",
  minTopUp: "$5",
  feeOnDelivery: true,
};

const html = (props: Partial<SellerStoreOfflineEmailProps> = {}) => render(createElement(SellerStoreOfflineEmail, { ...base, ...props }));

describe("seller store-offline email", () => {
  it("renders the Arabic email with the store, the wallet link and how the wallet works", async () => {
    const out = await html();
    expect(out).toMatch(/<html[^>]*dir="rtl"/);
    expect(sellerStoreOfflineSubject()).toBe("متجرك متوقف الآن. اشحن محفظتك لتشغيله");
    expect(out).toContain("متجر النور");
    expect(out).toContain(`href="${base.walletUrl}"`);
    expect(out).toContain("اشحن محفظتك");
    expect(out).toContain("$0.03");
    expect(out).toContain("$5");
    expect(out).toContain("عند توصيل كل طلب");
    expect(out).not.toContain("Shopify");
  });

  it("follows the fee switch and says all stores when there are several", async () => {
    const out = await html({ feeOnDelivery: false, storeCount: 3, locale: "en" });
    expect(out).toContain("for each new order");
    expect(out).not.toContain("when each order is delivered");
    expect(out).toContain("all your stores are now offline");
  });
});
