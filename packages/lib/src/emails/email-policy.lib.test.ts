import { describe, expect, it } from "vitest";
import { EMAIL_RULES, emailDecision, orderNotificationChargeable, type AutomaticEmailType } from "./email-policy.lib";

const live = { storeId: "store", usdLive: true, subscribed: true };
const types = Object.keys(EMAIL_RULES) as AutomaticEmailType[];
const ofRule = (rule: string) => types.filter((type) => EMAIL_RULES[type] === rule);

describe("email policy", () => {
  it("keeps the agreed list in each state", () => {
    expect(ofRule("order_app").sort()).toEqual(
      ["order_cancelled", "order_confirmation", "order_delivered", "order_shipped", "refund_issued"].sort(),
    );
    expect(ofRule("keep")).toEqual(["seller_store_created"]);
    expect(ofRule("manual").sort()).toEqual(["store_campaign", "store_campaign_test"]);
  });

  it("sends and charges an order email for a subscribed store after the switch", () => {
    for (const type of ofRule("order_app") as AutomaticEmailType[]) {
      expect(emailDecision({ ...live, type })).toEqual({ action: "send", charge: true });
    }
  });

  it("skips an order email for a store that isn't subscribed, the default", () => {
    expect(emailDecision({ ...live, type: "order_shipped", subscribed: false })).toEqual({
      action: "skip",
      reason: "not_subscribed",
    });
  });

  it("skips an order email with no store once paused", () => {
    expect(emailDecision({ ...live, type: "refund_issued", storeId: null })).toEqual({ action: "skip", reason: "paused" });
  });

  it("pauses everything else after the switch, even for a subscribed store", () => {
    for (const type of ofRule("paused") as AutomaticEmailType[]) {
      expect(emailDecision({ ...live, type })).toEqual({ action: "skip", reason: "paused" });
    }
  });

  it("always sends the store-ready email and a seller's own campaign, uncharged", () => {
    for (const type of ["seller_store_created", "store_campaign", "store_campaign_test"] as const) {
      expect(emailDecision({ type, storeId: null, usdLive: true, subscribed: false })).toEqual({ action: "send", charge: false });
    }
  });

  it("sends everything as today before the switch, uncharged", () => {
    for (const type of types) {
      expect(emailDecision({ type, storeId: null, usdLive: false, subscribed: false })).toEqual({ action: "send", charge: false });
      expect(emailDecision({ type, storeId: "store", usdLive: false, subscribed: true })).toEqual({ action: "send", charge: false });
    }
  });

  it("doesn't send a type missing from the list", () => {
    expect(emailDecision({ ...live, type: "new_type" as AutomaticEmailType })).toEqual({ action: "skip", reason: "paused" });
  });
});

describe("order notification charge", () => {
  it("skips a card order still waiting for its payment", () => {
    expect(orderNotificationChargeable("payment_processing")).toBe(false);
    expect(orderNotificationChargeable(null)).toBe(false);
  });

  it("charges every other order", () => {
    expect(orderNotificationChargeable("pending")).toBe(true);
    expect(orderNotificationChargeable("confirmed")).toBe(true);
    expect(orderNotificationChargeable("cancelled")).toBe(true);
  });
});
