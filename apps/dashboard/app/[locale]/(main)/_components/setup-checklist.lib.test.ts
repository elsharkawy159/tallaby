import { describe, expect, it } from "vitest";
import {
  buildHomeSteps,
  buildSetupTasks,
  isSetupDone,
  showSetupOnlyHome,
  homeStepBlocker,
  stepBlocker,
  type SetupFlags,
} from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };

describe("buildHomeSteps", () => {
  it("orders the steps product, design, shipping, payments (owner 2026-11-25)", () => {
    expect(buildHomeSteps(none, STORE).map((s) => s.key)).toEqual(["product", "design", "shipping", "payments"]);
  });

  it("links store steps to the selected store", () => {
    const hrefs = Object.fromEntries(buildHomeSteps(none, STORE).map((s) => [s.key, s.href]));
    expect(hrefs.product).toBe(`/stores/${STORE}/products/add`);
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

describe("homeStepBlocker (shipping waits for a template, not the brand)", () => {
  it("unlocks shipping once a template is chosen", () => {
    const productOnly: SetupFlags = { ...none, product: true };
    const withTemplate: SetupFlags = { ...productOnly, template: true };
    expect(homeStepBlocker(buildHomeSteps(withTemplate, STORE), "shipping", withTemplate)).toBeNull();
    expect(homeStepBlocker(buildHomeSteps(withTemplate, STORE), "design", withTemplate)).toBeNull();
    expect(homeStepBlocker(buildHomeSteps(productOnly, STORE), "shipping", productOnly)).toBe("design");
    expect(homeStepBlocker(buildHomeSteps(none, STORE), "shipping", none)).toBe("product");
  });
});

describe("stepBlocker (steps in order, owner 2026-11-25)", () => {
  const blockers = (f: SetupFlags) => {
    const steps = buildHomeSteps(f, STORE);
    return Object.fromEntries(steps.map((s) => [s.key, stepBlocker(steps, s.key)]));
  };

  it("lets only the first open step start; the rest wait for the first open step before them", () => {
    expect(blockers(none)).toEqual({ product: null, design: "product", shipping: "product", payments: "product" });
    expect(blockers({ ...none, product: true })).toEqual({ product: null, design: null, shipping: "design", payments: "design" });
    expect(blockers({ ...none, product: true, template: true, brand: true })).toEqual({ product: null, design: null, shipping: null, payments: "shipping" });
  });

  it("never locks a done step, so a seller who did steps out of order keeps every edit link", () => {
    expect(blockers({ ...none, shipping: true, payments: true })).toEqual({ product: null, design: "product", shipping: null, payments: null });
  });

  it("is null for a key that isn't in the list", () => {
    expect(stepBlocker(buildHomeSteps(none, null), "design")).toBeNull();
  });
});

describe("isSetupDone", () => {
  it("needs all four steps, shipping and payments too", () => {
    expect(isSetupDone(all, STORE)).toBe(true);
    for (const key of ["template", "brand", "product", "shipping", "payments"] as const) {
      expect(isSetupDone({ ...all, [key]: false }, STORE)).toBe(false);
    }
    // Publishing is no longer a step: a new store goes live with a chosen template and a published product (owner, 2026-11-17).
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

describe("buildSetupTasks (prompt steps, same keys)", () => {
  it("leads with the product: product, template, brand, shipping (owner 2026-11-25)", () => {
    expect(buildSetupTasks(none, STORE).map((t) => t.key)).toEqual(["product", "template", "brand", "shipping"]);
    expect(buildSetupTasks(none, null).map((t) => t.key)).toEqual(["product"]);
    expect(buildSetupTasks(none, STORE).filter((t) => t.optional).map((t) => t.key)).toEqual(["shipping"]);
  });
});

describe("shared setup rule (F-94 reminder emails)", () => {
  it("is the same rule as @workspace/lib's isStoreSetupDone for every flag combination", async () => {
    const { STORE_SETUP_STEP_KEYS, isStoreSetupDone } = await import("@workspace/lib/sellers");
    // Same steps; the home orders them for the seller flow (owner, 2026-11-25), the emails keep theirs.
    expect(buildHomeSteps(none, STORE).map((s) => s.key).sort()).toEqual([...STORE_SETUP_STEP_KEYS].sort());
    const keys = Object.keys(none) as (keyof SetupFlags)[];
    for (let mask = 0; mask < 1 << keys.length; mask++) {
      const flags = Object.fromEntries(keys.map((k, i) => [k, Boolean(mask & (1 << i))])) as SetupFlags;
      expect(isSetupDone(flags, STORE)).toBe(isStoreSetupDone(flags));
    }
  });
});
