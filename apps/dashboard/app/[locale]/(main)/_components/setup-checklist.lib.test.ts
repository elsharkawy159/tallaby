import { describe, expect, it } from "vitest";
import {
  buildHomeSteps,
  buildSetupTasks,
  isSetupDone,
  nextHomeStep,
  showSetupOnlyHome,
  stepBlocker,
  type SetupFlags,
} from "./setup-checklist.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false, domain: false, seo: false, wallet: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true, domain: true, seo: true, wallet: true };
/** Every required step done, the optional ones not. */
const required: SetupFlags = { ...none, template: true, brand: true, product: true, wallet: true };

describe("buildHomeSteps", () => {
  it("orders the steps product, theme, identity, domain, seo, wallet (owner 2026-11-27)", () => {
    expect(buildHomeSteps(none, STORE).map((s) => s.key)).toEqual(["product", "theme", "identity", "domain", "seo", "wallet"]);
  });

  it("marks only domain and SEO optional", () => {
    expect(buildHomeSteps(none, STORE).filter((s) => s.optional).map((s) => s.key)).toEqual(["domain", "seo"]);
  });

  it("links store steps to the selected store and the wallet to the seller's wallet", () => {
    const hrefs = Object.fromEntries(buildHomeSteps(none, STORE).map((s) => [s.key, s.href]));
    expect(hrefs).toEqual({
      product: `/stores/${STORE}/products/add`,
      theme: `/stores/${STORE}/website/templates`,
      identity: `/stores/${STORE}/website/design`,
      domain: `/stores/${STORE}/website/domain`,
      seo: `/stores/${STORE}/website/seo`,
      wallet: "/wallet",
    });
  });

  it("marks each step done from its own flag", () => {
    const done = (f: SetupFlags) => Object.fromEntries(buildHomeSteps(f, STORE).map((s) => [s.key, s.done]));
    expect(done({ ...none, template: true })).toMatchObject({ theme: true, identity: false });
    expect(done({ ...none, brand: true })).toMatchObject({ theme: false, identity: true });
    expect(done({ ...none, domain: true, seo: true, wallet: true })).toMatchObject({ domain: true, seo: true, wallet: true });
  });

  it("keeps only the product and the wallet when the seller has no store", () => {
    expect(buildHomeSteps(none, null).map((s) => s.key)).toEqual(["product", "wallet"]);
  });
});

describe("nextHomeStep (the next-step badge)", () => {
  it("is the first open required step, in order", () => {
    expect(nextHomeStep(buildHomeSteps(none, STORE))?.key).toBe("product");
    expect(nextHomeStep(buildHomeSteps({ ...none, product: true }, STORE))?.key).toBe("theme");
    expect(nextHomeStep(buildHomeSteps({ ...none, product: true, template: true }, STORE))?.key).toBe("identity");
  });

  it("skips the optional steps and lands on the wallet", () => {
    expect(nextHomeStep(buildHomeSteps({ ...none, product: true, template: true, brand: true }, STORE))?.key).toBe("wallet");
  });

  it("goes back to an earlier open step a seller skipped", () => {
    expect(nextHomeStep(buildHomeSteps({ ...required, product: false }, STORE))?.key).toBe("product");
  });

  it("is undefined once every required step is done, even with domain and SEO open", () => {
    expect(nextHomeStep(buildHomeSteps(required, STORE))).toBeUndefined();
  });
});

describe("stepBlocker (kept for the store welcome page)", () => {
  const steps = [
    { key: "a", done: false },
    { key: "b", done: false },
    { key: "c", done: true },
  ] as const;

  it("waits for the first open step before it; never locks a done step", () => {
    expect(stepBlocker(steps, "a")).toBeNull();
    expect(stepBlocker(steps, "b")).toBe("a");
    expect(stepBlocker(steps, "c")).toBeNull();
  });

  it("is null for a key that isn't in the list", () => {
    expect(stepBlocker(steps, "z" as "a")).toBeNull();
  });
});

describe("isSetupDone", () => {
  it("needs product, theme, identity and wallet", () => {
    expect(isSetupDone(all, STORE)).toBe(true);
    expect(isSetupDone(required, STORE)).toBe(true);
    for (const key of ["template", "brand", "product", "wallet"] as const) {
      expect(isSetupDone({ ...all, [key]: false }, STORE)).toBe(false);
    }
  });

  it("never needs domain, SEO, shipping, payments or publishing", () => {
    expect(isSetupDone({ ...required, domain: false, seo: false, shipping: false, payments: false, publish: false }, STORE)).toBe(true);
  });

  it("needs the product and the wallet when the seller has no store", () => {
    expect(isSetupDone({ ...none, product: true }, null)).toBe(false);
    expect(isSetupDone({ ...none, product: true, wallet: true }, null)).toBe(true);
  });
});

describe("showSetupOnlyHome", () => {
  it("shows only the setup cards to a new seller with setup open", () => {
    expect(showSetupOnlyHome({ flags: none, storeId: STORE, hasRealOrders: false })).toBe(true);
    expect(showSetupOnlyHome({ flags: { ...all, wallet: false }, storeId: STORE, hasRealOrders: false })).toBe(true);
  });

  it("shows the metrics once the required steps are done", () => {
    expect(showSetupOnlyHome({ flags: required, storeId: STORE, hasRealOrders: false })).toBe(false);
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
    const { STORE_SETUP_STEP_KEYS, STORE_SETUP_REQUIRED_STEP_KEYS, isStoreSetupDone } = await import("@workspace/lib/sellers");
    expect(buildHomeSteps(none, STORE).map((s) => s.key)).toEqual([...STORE_SETUP_STEP_KEYS]);
    expect(buildHomeSteps(none, STORE).filter((s) => !s.optional).map((s) => s.key)).toEqual([...STORE_SETUP_REQUIRED_STEP_KEYS]);
    const keys = [...Object.keys(none), "walletFunded"] as (keyof SetupFlags)[];
    for (let mask = 0; mask < 1 << keys.length; mask++) {
      const flags = Object.fromEntries(keys.map((k, i) => [k, Boolean(mask & (1 << i))])) as unknown as SetupFlags;
      expect(isSetupDone(flags, STORE)).toBe(isStoreSetupDone(flags));
      expect(isSetupDone({ ...flags, marked: ["theme", "wallet"] }, STORE)).toBe(isStoreSetupDone({ ...flags, marked: ["theme", "wallet"] }));
    }
  });
});

describe("a wallet above 0 (owner 2026-11-28)", () => {
  it("hides the wallet step and counts it as done", () => {
    const flags: SetupFlags = { ...required, wallet: false, walletFunded: true };
    expect(buildHomeSteps(flags, STORE).map((s) => s.key)).not.toContain("wallet");
    expect(buildHomeSteps({ ...none, walletFunded: true }, null).map((s) => s.key)).toEqual(["product"]);
    expect(isSetupDone(flags, STORE)).toBe(true);
  });

  it("keeps the wallet step for an empty or negative wallet", () => {
    expect(buildHomeSteps({ ...none, walletFunded: false }, STORE).map((s) => s.key)).toContain("wallet");
  });
});

describe("Mark as done (owner 2026-11-28)", () => {
  it("counts a marked step as done and offers to undo only a hand mark", () => {
    const steps = buildHomeSteps({ ...none, template: true, marked: ["product", "theme", "seo"] }, STORE);
    const by = Object.fromEntries(steps.map((s) => [s.key, s]));
    expect(by.product).toMatchObject({ done: true, markedByHand: true, canMark: false });
    // Done by its data: the mark changes nothing and there's nothing to undo.
    expect(by.theme).toMatchObject({ done: true, markedByHand: false, canMark: false });
    expect(by.identity).toMatchObject({ done: false, markedByHand: false, canMark: true });
    expect(nextHomeStep(steps)?.key).toBe("identity");
  });

  it("finishes setup once every required step is marked", () => {
    expect(isSetupDone({ ...none, marked: ["product", "theme", "identity", "wallet"] }, STORE)).toBe(true);
  });

  it("can't mark a store step when the seller has no store", () => {
    const by = Object.fromEntries(buildHomeSteps(none, null).map((s) => [s.key, s.canMark]));
    expect(by).toEqual({ product: false, wallet: true });
  });
});
