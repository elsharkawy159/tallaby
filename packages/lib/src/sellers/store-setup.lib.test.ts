import { describe, expect, it } from "vitest";
import {
  STORE_SETUP_STEP_KEYS,
  isStoreSetupDone,
  missingStoreSetupSteps,
  storeSetupStepHref,
  type StoreSetupFlags,
} from "./store-setup.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: StoreSetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: StoreSetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };

describe("store setup steps (the dashboard home's four steps)", () => {
  it("are product, design, payments, shipping in that order", () => {
    expect(STORE_SETUP_STEP_KEYS).toEqual(["product", "design", "payments", "shipping"]);
  });

  it("are done only when every step is done; publishing is not a step", () => {
    expect(isStoreSetupDone(all)).toBe(true);
    expect(isStoreSetupDone({ ...all, publish: false })).toBe(true);
    expect(isStoreSetupDone({ ...all, payments: false })).toBe(false);
    expect(isStoreSetupDone(none)).toBe(false);
  });

  it("need both a template and a brand for the design step", () => {
    expect(missingStoreSetupSteps({ ...all, brand: false })).toEqual(["design"]);
    expect(missingStoreSetupSteps({ ...all, template: false })).toEqual(["design"]);
    expect(missingStoreSetupSteps(none)).toEqual(["product", "design", "payments", "shipping"]);
  });

  it("link each step to the same dashboard pages as the home cards", () => {
    expect(storeSetupStepHref("product", STORE, none)).toBe(`/stores/${STORE}/products/add`);
    expect(storeSetupStepHref("design", STORE, none)).toBe(`/stores/${STORE}/website/templates`);
    expect(storeSetupStepHref("design", STORE, { ...none, template: true })).toBe(`/stores/${STORE}/website/design`);
    expect(storeSetupStepHref("payments", STORE, none)).toBe(`/stores/${STORE}/settings/payments`);
    expect(storeSetupStepHref("shipping", STORE, none)).toBe(`/stores/${STORE}/shipping`);
  });
});
