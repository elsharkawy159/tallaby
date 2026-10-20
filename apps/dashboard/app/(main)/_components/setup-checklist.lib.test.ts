import { describe, expect, it } from "vitest";
import { buildSetupTasks, isSetupDone, publishReady, type SetupFlags } from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = {
  profile: false,
  contact: false,
  product: false,
  legal: false,
  publish: false,
  payout: false,
  coupon: false,
  campaign: false,
};

describe("buildSetupTasks", () => {
  it("lists the store setup steps in order (PLAN.md §6.6)", () => {
    expect(buildSetupTasks(none, STORE).map((t) => t.key)).toEqual([
      "profile",
      "product",
      "contact",
      "legal",
      "publish",
      "payout",
      "coupon",
      "campaign",
    ]);
  });

  it("links store steps to the selected store's settings", () => {
    const tasks = Object.fromEntries(buildSetupTasks(none, STORE).map((t) => [t.key, t.href]));
    expect(tasks.profile).toBe(`/stores/${STORE}/settings`);
    expect(tasks.contact).toBe(`/stores/${STORE}/settings`);
    expect(tasks.product).toBe("/products/add");
    expect(tasks.legal).toBe("/settings#legal");
    expect(tasks.publish).toBe(`/stores/${STORE}/website`);
    expect(tasks.payout).toBe("/settings#payout");
  });

  it("drops store steps when the seller has no store", () => {
    expect(buildSetupTasks(none, null).map((t) => t.key)).toEqual(["product", "legal", "payout", "coupon", "campaign"]);
  });

  it("marks done steps", () => {
    const tasks = buildSetupTasks({ ...none, product: true }, STORE);
    expect(tasks.find((t) => t.key === "product")?.done).toBe(true);
    expect(tasks.find((t) => t.key === "profile")?.done).toBe(false);
  });
});

describe("isSetupDone", () => {
  it("is true only when every step is done", () => {
    const all = { profile: true, contact: true, product: true, legal: true, publish: true, payout: true, coupon: true, campaign: true };
    expect(isSetupDone(all, STORE)).toBe(true);
    expect(isSetupDone({ ...all, contact: false }, STORE)).toBe(false);
    expect(isSetupDone({ ...all, publish: false }, STORE)).toBe(false);
  });
});

describe("publishReady", () => {
  it("needs the store profile, a product and the legal details", () => {
    const ready = { ...none, profile: true, product: true, legal: true };
    expect(publishReady(ready)).toBe(true);
    expect(publishReady({ ...ready, profile: false })).toBe(false);
    expect(publishReady({ ...ready, product: false })).toBe(false);
    expect(publishReady({ ...ready, legal: false })).toBe(false);
  });
});
