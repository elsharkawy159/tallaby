import { describe, expect, it } from "vitest";
import {
  buildSetupTasks,
  isGuideDone,
  isSetupDone,
  publishLockReason,
  publishReady,
  type SetupFlags,
} from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true };

describe("buildSetupTasks", () => {
  it("orders the steps template, brand, product, publish, then shipping (owner 2026-11-01)", () => {
    expect(buildSetupTasks(none, STORE).map((t) => t.key)).toEqual(["template", "brand", "product", "publish", "shipping"]);
  });

  it("links store steps to the selected store", () => {
    const tasks = Object.fromEntries(buildSetupTasks(none, STORE).map((t) => [t.key, t.href]));
    expect(tasks.template).toBe(`/stores/${STORE}/website/templates`);
    expect(tasks.brand).toBe(`/stores/${STORE}/website/design`);
    expect(tasks.product).toBe("/products/add");
    expect(tasks.publish).toBe(`/stores/${STORE}/website`);
    expect(tasks.shipping).toBe(`/stores/${STORE}/shipping`);
  });

  it("drops store steps when the seller has no store", () => {
    expect(buildSetupTasks(none, null).map((t) => t.key)).toEqual(["product"]);
  });

  it("marks done steps and only shipping as optional", () => {
    const tasks = buildSetupTasks({ ...none, template: true }, STORE);
    expect(tasks.find((t) => t.key === "template")?.done).toBe(true);
    expect(tasks.find((t) => t.key === "product")?.done).toBe(false);
    expect(tasks.filter((t) => t.optional).map((t) => t.key)).toEqual(["shipping"]);
  });
});

describe("isSetupDone", () => {
  it("needs every required step", () => {
    expect(isSetupDone(all, STORE)).toBe(true);
    expect(isSetupDone({ ...all, template: false }, STORE)).toBe(false);
    expect(isSetupDone({ ...all, brand: false }, STORE)).toBe(false);
    expect(isSetupDone({ ...all, publish: false }, STORE)).toBe(false);
  });

  it("does not wait for shipping", () => {
    expect(isSetupDone({ ...all, shipping: false }, STORE)).toBe(true);
  });

  it("only needs a product when the seller has no store", () => {
    expect(isSetupDone({ ...none, product: true }, null)).toBe(true);
  });
});

describe("isGuideDone", () => {
  it("keeps the guide until shipping is set up too", () => {
    expect(isGuideDone({ ...all, shipping: false }, STORE)).toBe(false);
    expect(isGuideDone(all, STORE)).toBe(true);
  });
});

describe("publishReady", () => {
  it("needs an active product and a chosen template, not brand or shipping", () => {
    expect(publishReady({ ...none, product: true, template: true })).toBe(true);
    expect(publishReady({ ...all, product: false })).toBe(false);
  });

  it("stays locked on the placeholder Classic drafts until a template is chosen (owner 2026-10-27)", () => {
    expect(publishReady({ ...none, product: true })).toBe(false);
  });
});

describe("publishLockReason", () => {
  it("names the first missing step in the new order", () => {
    expect(publishLockReason(none)).toBe("lockedTemplate");
    expect(publishLockReason({ ...none, template: true })).toBe("locked");
    expect(publishLockReason({ ...none, product: true, template: true })).toBeNull();
  });
});
