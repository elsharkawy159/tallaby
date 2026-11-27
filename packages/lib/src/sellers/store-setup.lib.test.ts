import { describe, expect, it } from "vitest";
import {
  STORE_SETUP_OPTIONAL_STEPS,
  STORE_SETUP_REQUIRED_STEP_KEYS,
  STORE_SETUP_STEP_KEYS,
  isStoreSetupDone,
  missingStoreSetupSteps,
  storeSetupStepHref,
  type StoreSetupFlags,
} from "./store-setup.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: StoreSetupFlags = {
  template: false,
  brand: false,
  product: false,
  publish: false,
  shipping: false,
  payments: false,
  domain: false,
  seo: false,
  wallet: false,
};
const all: StoreSetupFlags = {
  template: true,
  brand: true,
  product: true,
  publish: true,
  shipping: true,
  payments: true,
  domain: true,
  seo: true,
  wallet: true,
};

describe("store setup steps (the dashboard home's six steps, owner 2026-11-27)", () => {
  it("are product, theme, identity, domain, seo, wallet in that order", () => {
    expect(STORE_SETUP_STEP_KEYS).toEqual(["product", "theme", "identity", "domain", "seo", "wallet"]);
  });

  it("make domain and SEO optional; the rest are required", () => {
    expect([...STORE_SETUP_OPTIONAL_STEPS].sort()).toEqual(["domain", "seo"]);
    expect(STORE_SETUP_REQUIRED_STEP_KEYS).toEqual(["product", "theme", "identity", "wallet"]);
    expect(STORE_SETUP_REQUIRED_STEP_KEYS).toEqual(STORE_SETUP_STEP_KEYS.filter((key) => !STORE_SETUP_OPTIONAL_STEPS.has(key)));
  });

  it("are done once every required step is done; optional steps, shipping, payments and publishing don't count", () => {
    expect(isStoreSetupDone(all)).toBe(true);
    expect(isStoreSetupDone({ ...all, domain: false, seo: false, shipping: false, payments: false, publish: false })).toBe(true);
    for (const key of ["product", "template", "brand", "wallet"] as const) {
      expect(isStoreSetupDone({ ...all, [key]: false })).toBe(false);
    }
    expect(isStoreSetupDone(none)).toBe(false);
  });

  it("list only the missing required steps", () => {
    expect(missingStoreSetupSteps({ ...all, brand: false })).toEqual(["identity"]);
    expect(missingStoreSetupSteps({ ...all, template: false })).toEqual(["theme"]);
    expect(missingStoreSetupSteps(none)).toEqual(["product", "theme", "identity", "wallet"]);
  });

  it("link each step to the same dashboard pages as the home cards", () => {
    expect(storeSetupStepHref("product", STORE)).toBe(`/stores/${STORE}/products/add`);
    expect(storeSetupStepHref("theme", STORE)).toBe(`/stores/${STORE}/website/templates`);
    expect(storeSetupStepHref("identity", STORE)).toBe(`/stores/${STORE}/website/design`);
    expect(storeSetupStepHref("domain", STORE)).toBe(`/stores/${STORE}/website/domain`);
    expect(storeSetupStepHref("seo", STORE)).toBe(`/stores/${STORE}/website/seo`);
    expect(storeSetupStepHref("wallet", STORE)).toBe("/wallet");
  });
});
