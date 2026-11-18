import { describe, expect, it } from "vitest";
import type { SetupFlags } from "./setup-checklist.lib";
import { headerSetupAction, parseSetupNextStep, pickSetupNextStep } from "./setup-next-step.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };
const VIEW = `/api/stores/${STORE}/view`;

describe("pickSetupNextStep", () => {
  it("starts with the product", () => {
    expect(pickSetupNextStep(none, STORE)).toEqual({ done: false, key: "product", href: `/stores/${STORE}/products/add` });
  });

  it("follows the home order: design, then payments, then shipping", () => {
    expect(pickSetupNextStep({ ...none, product: true }, STORE)).toMatchObject({ key: "design", href: `/stores/${STORE}/website/templates` });
    expect(pickSetupNextStep({ ...none, product: true, template: true }, STORE)).toMatchObject({
      key: "design",
      href: `/stores/${STORE}/website/design`,
    });
    expect(pickSetupNextStep({ ...none, product: true, template: true, brand: true }, STORE)).toMatchObject({ key: "payments" });
    expect(pickSetupNextStep({ ...all, shipping: false }, STORE)).toMatchObject({ key: "shipping", href: `/stores/${STORE}/shipping` });
  });

  it("skips a done step even if an earlier one is open", () => {
    expect(pickSetupNextStep({ ...all, product: false }, STORE)).toMatchObject({ key: "product" });
  });

  it("is done when every step is done", () => {
    expect(pickSetupNextStep(all, STORE)).toEqual({ done: true });
  });

  it("only asks for a product when the seller has no store", () => {
    expect(pickSetupNextStep(none, null)).toMatchObject({ key: "product" });
    expect(pickSetupNextStep({ ...none, product: true }, null)).toEqual({ done: true });
  });
});

describe("headerSetupAction", () => {
  it("shows the next step while setup is open", () => {
    expect(headerSetupAction({ done: false, key: "payments", href: "/x" }, VIEW)).toEqual({ kind: "step", key: "payments", href: "/x" });
  });

  it("shows Visit store once setup is done", () => {
    expect(headerSetupAction({ done: true }, VIEW)).toEqual({ kind: "visit", href: VIEW });
  });

  it("shows nothing when done without a store link, or with no data", () => {
    expect(headerSetupAction({ done: true }, null)).toBeNull();
    expect(headerSetupAction(null, VIEW)).toBeNull();
  });
});

describe("parseSetupNextStep", () => {
  it("accepts the two shapes the route sends", () => {
    expect(parseSetupNextStep({ done: true })).toEqual({ done: true });
    expect(parseSetupNextStep({ done: false, key: "shipping", href: `/stores/${STORE}/shipping` })).toEqual({
      done: false,
      key: "shipping",
      href: `/stores/${STORE}/shipping`,
    });
  });

  it("rejects unknown keys, off-site links and junk", () => {
    expect(parseSetupNextStep({ done: false, key: "publish", href: "/x" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "//evil.example" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "/\\evil.example" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "https://evil.example" })).toBeNull();
    expect(parseSetupNextStep({ prompt: null })).toBeNull();
    expect(parseSetupNextStep(null)).toBeNull();
    expect(parseSetupNextStep("done")).toBeNull();
  });
});
