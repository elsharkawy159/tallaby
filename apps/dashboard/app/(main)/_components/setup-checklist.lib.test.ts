import { describe, expect, it } from "vitest";
import {
  buildHomeSteps,
  buildSetupTasks,
  isSetupDone,
  showSetupOnlyHome,
  type SetupFlags,
} from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };

describe("buildHomeSteps", () => {
  it("orders the steps product, design, payments, shipping (owner 2026-11-10)", () => {
    expect(buildHomeSteps(none, STORE).map((s) => s.key)).toEqual(["product", "design", "payments", "shipping"]);
  });

  it("links store steps to the selected store", () => {
    const hrefs = Object.fromEntries(buildHomeSteps(none, STORE).map((s) => [s.key, s.href]));
    expect(hrefs.product).toBe("/products/add");
    expect(hrefs.design).toBe(`/stores/${STORE}/website/templates`);
    expect(hrefs.payments).toBe(`/stores/${STORE}/settings/payments`);
    expect(hrefs.shipping).toBe(`/stores/${STORE}/shipping`);
  });

  it("sends design to the design page once a template is chosen", () => {
    const design = buildHomeSteps({ ...none, template: true }, STORE).find((s) => s.key === "design");
    expect(design?.href).toBe(`/stores/${STORE}/website/design`);
    expect(design?.done).toBe(false);
  });

  it("marks design done only with both template and brand", () => {
    const done = (f: SetupFlags) => buildHomeSteps(f, STORE).find((s) => s.key === "design")?.done;
    expect(done({ ...none, brand: true })).toBe(false);
    expect(done({ ...none, template: true, brand: true })).toBe(true);
  });

  it("drops store steps when the seller has no store", () => {
    expect(buildHomeSteps(none, null).map((s) => s.key)).toEqual(["product"]);
  });
});

describe("isSetupDone", () => {
  it("needs all four steps, shipping and payments too", () => {
    expect(isSetupDone(all, STORE)).toBe(true);
    for (const key of ["template", "brand", "product", "shipping", "payments"] as const) {
      expect(isSetupDone({ ...all, [key]: false }, STORE)).toBe(false);
    }
    // Publishing is no longer a step: choosing a template publishes (owner, 2026-11-07).
    expect(isSetupDone({ ...all, publish: false }, STORE)).toBe(true);
  });

  it("only needs a product when the seller has no store", () => {
    expect(isSetupDone({ ...none, product: true }, null)).toBe(true);
  });
});

describe("showSetupOnlyHome", () => {
  it("shows only the setup cards to a new seller with setup open", () => {
    expect(showSetupOnlyHome({ flags: none, storeId: STORE, hasRealOrders: false })).toBe(true);
    expect(showSetupOnlyHome({ flags: { ...all, payments: false }, storeId: STORE, hasRealOrders: false })).toBe(true);
  });

  it("shows the metrics once setup is done", () => {
    expect(showSetupOnlyHome({ flags: all, storeId: STORE, hasRealOrders: false })).toBe(false);
  });

  it("always shows the metrics to a seller with real orders, even with a step missing", () => {
    expect(showSetupOnlyHome({ flags: none, storeId: STORE, hasRealOrders: true })).toBe(false);
  });
});

describe("buildSetupTasks (prompt steps, unchanged)", () => {
  it("keeps the prompt order template, brand, product, shipping", () => {
    expect(buildSetupTasks(none, STORE).map((t) => t.key)).toEqual(["template", "brand", "product", "shipping"]);
    expect(buildSetupTasks(none, null).map((t) => t.key)).toEqual(["product"]);
    expect(buildSetupTasks(none, STORE).filter((t) => t.optional).map((t) => t.key)).toEqual(["shipping"]);
  });
});
