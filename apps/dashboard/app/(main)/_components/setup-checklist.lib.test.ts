import { describe, expect, it } from "vitest";
import { buildSetupTasks, isSetupDone, publishLockReason, publishReady, type SetupFlags } from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { product: false, template: false, shipping: false, publish: false };
const all: SetupFlags = { product: true, template: true, shipping: true, publish: true };

describe("buildSetupTasks", () => {
  it("lists the first-order steps in order (PLAN.md §6.6)", () => {
    expect(buildSetupTasks(none, STORE).map((t) => t.key)).toEqual(["product", "template", "shipping", "publish"]);
  });

  it("links store steps to the selected store", () => {
    const tasks = Object.fromEntries(buildSetupTasks(none, STORE).map((t) => [t.key, t.href]));
    expect(tasks.product).toBe("/products/add");
    expect(tasks.template).toBe(`/stores/${STORE}/website/templates`);
    expect(tasks.shipping).toBe(`/stores/${STORE}/shipping`);
    expect(tasks.publish).toBe(`/stores/${STORE}/website`);
  });

  it("drops store steps when the seller has no store", () => {
    expect(buildSetupTasks(none, null).map((t) => t.key)).toEqual(["product"]);
  });

  it("marks done steps", () => {
    const tasks = buildSetupTasks({ ...none, template: true }, STORE);
    expect(tasks.find((t) => t.key === "template")?.done).toBe(true);
    expect(tasks.find((t) => t.key === "product")?.done).toBe(false);
  });
});

describe("isSetupDone", () => {
  it("is true only when every step is done", () => {
    expect(isSetupDone(all, STORE)).toBe(true);
    expect(isSetupDone({ ...all, template: false }, STORE)).toBe(false);
    expect(isSetupDone({ ...all, shipping: false }, STORE)).toBe(false);
    expect(isSetupDone({ ...all, publish: false }, STORE)).toBe(false);
  });

  it("only needs a product when the seller has no store", () => {
    expect(isSetupDone({ ...none, product: true }, null)).toBe(true);
  });
});

describe("publishReady", () => {
  it("needs an active product and a chosen template", () => {
    expect(publishReady({ ...none, product: true, template: true })).toBe(true);
    expect(publishReady({ ...all, product: false })).toBe(false);
  });

  it("stays locked on the placeholder Classic drafts until a template is chosen (owner 2026-10-27)", () => {
    expect(publishReady({ ...none, product: true })).toBe(false);
  });
});

describe("publishLockReason", () => {
  it("names the first missing step", () => {
    expect(publishLockReason(none)).toBe("locked");
    expect(publishLockReason({ ...none, product: true })).toBe("lockedTemplate");
    expect(publishLockReason({ ...none, product: true, template: true })).toBeNull();
  });
});

describe("step order", () => {
  it("puts choosing a template before publishing", () => {
    const keys = buildSetupTasks(none, STORE).map((t) => t.key);
    expect(keys.indexOf("template")).toBeLessThan(keys.indexOf("publish"));
  });
});
