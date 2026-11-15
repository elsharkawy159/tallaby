import { describe, expect, it } from "vitest";
import type { StoreSetupFlags } from "@workspace/lib/sellers";
import ar from "../../../../../../messages/ar.json";
import en from "../../../../../../messages/en.json";
import { addProductReturnHref } from "../products/add/add-method.lib";
import {
  initialWelcomeSection,
  nextWelcomeStep,
  storeWelcomeHref,
  welcomeLandingHref,
  welcomeProductHref,
  welcomeProgress,
  welcomeSetupSteps,
  withDefaultLocale,
} from "./welcome.lib";

const STORE = "11111111-1111-4111-8111-111111111111";
const none: StoreSetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };

describe("welcomeSetupSteps", () => {
  it("lists industry, theme, brand and product, done from the home's flags", () => {
    const steps = welcomeSetupSteps({ flags: { ...none, template: true }, hasIndustry: true, themesAvailable: true });
    expect(steps).toEqual([
      { key: "industry", done: true },
      { key: "theme", done: true },
      { key: "brand", done: false },
      { key: "product", done: false },
    ]);
    expect(nextWelcomeStep(steps)).toBe("brand");
  });

  it("has no theme step outside the store-builder rollout", () => {
    const steps = welcomeSetupSteps({ flags: none, hasIndustry: false, themesAvailable: false });
    expect(steps.map((step) => step.key)).toEqual(["industry", "brand", "product"]);
    expect(nextWelcomeStep(steps)).toBe("industry");
  });

  it("has no next step when every step is done", () => {
    const steps = welcomeSetupSteps({ flags: { ...none, template: true, brand: true, product: true }, hasIndustry: true, themesAvailable: true });
    expect(nextWelcomeStep(steps)).toBeNull();
  });
});

describe("welcomeProgress", () => {
  it("counts the home's four steps (design needs template and brand)", () => {
    expect(welcomeProgress(none)).toEqual({ done: 0, total: 4 });
    expect(welcomeProgress({ ...none, template: true })).toEqual({ done: 0, total: 4 });
    expect(welcomeProgress({ ...none, template: true, brand: true, product: true, shipping: true })).toEqual({ done: 3, total: 4 });
  });
});

describe("initialWelcomeSection", () => {
  const open = welcomeSetupSteps({ flags: none, hasIndustry: true, themesAvailable: true });
  const finished = welcomeSetupSteps({ flags: { ...none, template: true, brand: true, product: true }, hasIndustry: true, themesAvailable: true });

  it("opens the first unfinished section", () => {
    expect(initialWelcomeSection("", open)).toBe("setup");
    expect(initialWelcomeSection("", finished)).toBe("");
  });

  it("opens the section a step's hash names, even when done", () => {
    expect(initialWelcomeSection("#product", finished)).toBe("setup");
    expect(initialWelcomeSection("#setup", finished)).toBe("setup");
    expect(initialWelcomeSection("#nope", finished)).toBe("");
  });
});

describe("welcomeLandingHref", () => {
  it("sends a new seller from the home to the store's welcome page with the signup method", () => {
    expect(welcomeLandingHref({ welcome: "1", signup: "google", setupOnly: true, storeId: STORE })).toBe(`/stores/${STORE}/welcome?welcome=1&signup=google`);
    expect(welcomeLandingHref({ welcome: "1", signup: undefined, setupOnly: true, storeId: STORE })).toBe(`/stores/${STORE}/welcome?welcome=1`);
  });

  it("keeps everyone else on the home", () => {
    expect(welcomeLandingHref({ welcome: undefined, signup: undefined, setupOnly: true, storeId: STORE })).toBeNull();
    expect(welcomeLandingHref({ welcome: undefined, signup: "google", setupOnly: true, storeId: STORE })).toBeNull();
    expect(welcomeLandingHref({ welcome: "1", signup: "google", setupOnly: false, storeId: STORE })).toBeNull();
    expect(welcomeLandingHref({ welcome: "1", signup: "google", setupOnly: true, storeId: null })).toBeNull();
  });

  it("drops a signup value that isn't a plain word", () => {
    expect(welcomeLandingHref({ welcome: "1", signup: "x&next=//evil.com", setupOnly: true, storeId: STORE })).toBe(`/stores/${STORE}/welcome?welcome=1`);
  });
});

describe("storeWelcomeHref", () => {
  it("keeps only welcome=1 and a plain signup value", () => {
    expect(storeWelcomeHref(STORE)).toBe(`/stores/${STORE}/welcome`);
    expect(storeWelcomeHref(STORE, { welcome: "1", signup: "email" })).toBe(`/stores/${STORE}/welcome?welcome=1&signup=email`);
    expect(storeWelcomeHref(STORE, { welcome: "2", signup: "<b>" })).toBe(`/stores/${STORE}/welcome`);
  });
});

describe("the first-product round trip", () => {
  it("links to the AI add page, or the choice when AI is off, marked from=welcome", () => {
    expect(welcomeProductHref(STORE, true)).toBe(`/stores/${STORE}/products/add?method=ai&from=welcome`);
    expect(welcomeProductHref(STORE, false)).toBe(`/stores/${STORE}/products/add?method=choose&from=welcome`);
  });

  it("returns to the welcome page only for from=welcome", () => {
    expect(addProductReturnHref("welcome", STORE)).toBe(`/stores/${STORE}/welcome#product`);
    expect(addProductReturnHref(null, STORE)).toBeNull();
    expect(addProductReturnHref("https://evil.com", STORE)).toBeNull();
    expect(addProductReturnHref("/stores/x/welcome", STORE)).toBeNull();
    expect(addProductReturnHref("Welcome", STORE)).toBeNull();
    expect(addProductReturnHref("welcome", "")).toBeNull();
  });
});

describe("withDefaultLocale", () => {
  it("adds the chosen language and removes none", () => {
    expect(withDefaultLocale(["ar"], "en")).toEqual(["ar", "en"]);
    expect(withDefaultLocale(["ar", "en"], "ar")).toEqual(["ar", "en"]);
    expect(withDefaultLocale(["fr"], "ar")).toEqual(["ar"]);
  });
});

describe("storeWelcome messages", () => {
  it("has a title and description for every step in both languages", () => {
    for (const messages of [ar, en]) {
      for (const key of ["industry", "theme", "brand", "product"] as const) {
        expect(messages.storeWelcome.steps[key].title).toBeTruthy();
        expect(messages.storeWelcome.steps[key].description).toBeTruthy();
      }
    }
  });
});
