import { describe, expect, it } from "vitest";
import type { SetupFlags } from "./setup-checklist.lib";
import { headerSetupAction, parseSetupNextStep, pickSetupNextStep } from "./setup-next-step.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false, domain: false, seo: false, wallet: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true, domain: true, seo: true, wallet: true };
const VIEW = `/api/stores/${STORE}/view`;

describe("pickSetupNextStep", () => {
  it("starts with the product", () => {
    expect(pickSetupNextStep(none, STORE)).toEqual({ done: false, key: "product", href: `/stores/${STORE}/products/add` });
  });

  it("follows the home order: theme, identity, then wallet (owner, 2026-11-27)", () => {
    expect(pickSetupNextStep({ ...none, product: true }, STORE)).toMatchObject({ key: "theme", href: `/stores/${STORE}/website/templates` });
    expect(pickSetupNextStep({ ...none, product: true, template: true }, STORE)).toMatchObject({
      key: "identity",
      href: `/stores/${STORE}/website/design`,
    });
    expect(pickSetupNextStep({ ...none, product: true, template: true, brand: true }, STORE)).toMatchObject({ key: "wallet", href: "/wallet" });
  });

  it("never points to the optional domain or SEO steps", () => {
    expect(pickSetupNextStep({ ...all, domain: false, seo: false }, STORE)).toEqual({ done: true });
  });

  it("goes back to an earlier open step", () => {
    expect(pickSetupNextStep({ ...all, product: false }, STORE)).toMatchObject({ key: "product" });
  });

  it("is done when every required step is done", () => {
    expect(pickSetupNextStep(all, STORE)).toEqual({ done: true });
  });

  it("asks for a product, then the wallet, when the seller has no store", () => {
    expect(pickSetupNextStep(none, null)).toMatchObject({ key: "product" });
    expect(pickSetupNextStep({ ...none, product: true }, null)).toMatchObject({ key: "wallet" });
    expect(pickSetupNextStep({ ...none, product: true, wallet: true }, null)).toEqual({ done: true });
  });
});

describe("headerSetupAction", () => {
  it("shows the next step while setup is open", () => {
    expect(headerSetupAction({ done: false, key: "wallet", href: "/x" }, VIEW)).toEqual({ kind: "step", key: "wallet", href: "/x" });
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
    expect(parseSetupNextStep({ done: false, key: "identity", href: `/stores/${STORE}/website/design` })).toEqual({
      done: false,
      key: "identity",
      href: `/stores/${STORE}/website/design`,
    });
    expect(parseSetupNextStep({ done: false, key: "wallet", href: "/wallet" })).toEqual({ done: false, key: "wallet", href: "/wallet" });
  });

  it("rejects unknown or retired keys, off-site links and junk", () => {
    expect(parseSetupNextStep({ done: false, key: "publish", href: "/x" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "shipping", href: "/x" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "design", href: "/x" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "//evil.example" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "/\\evil.example" })).toBeNull();
    expect(parseSetupNextStep({ done: false, key: "product", href: "https://evil.example" })).toBeNull();
    expect(parseSetupNextStep({ prompt: null })).toBeNull();
    expect(parseSetupNextStep(null)).toBeNull();
    expect(parseSetupNextStep("done")).toBeNull();
  });
});
