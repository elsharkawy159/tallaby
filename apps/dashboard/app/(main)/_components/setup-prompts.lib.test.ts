import { describe, expect, it } from "vitest";
import type { SetupFlags } from "./setup-checklist.lib";
import {
  applySetupPromptEvent,
  decideSetupPrompt,
  isPromptBlockedRoute,
  nextPromptStep,
  parseSetupPromptEvent,
  parseSetupPromptState,
  recordCompletedSteps,
  type SetupPromptState,
} from "./setup-prompts.lib";

const STORE = "33333333-3333-4333-8333-333333333333";
const none: SetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false };
const all: SetupFlags = { template: true, brand: true, product: true, publish: true, shipping: true, payments: true };
const fresh = parseSetupPromptState(null);
const withToast = (over: Partial<SetupPromptState> = {}): SetupPromptState => ({ ...fresh, toastStep: "template", ...over });

describe("parseSetupPromptState", () => {
  it("starts empty and drops anything unknown", () => {
    expect(parseSetupPromptState(undefined)).toEqual({ toastStep: null, dismissed: [], completed: [], guideDismissed: false });
    expect(parseSetupPromptState({ toastStep: "nope", dismissed: ["brand", "nope"], completed: "x", guideDismissed: 1 })).toEqual({
      toastStep: null,
      dismissed: ["brand"],
      completed: [],
      guideDismissed: false,
    });
  });
});

describe("parseSetupPromptEvent", () => {
  it("accepts only known events for known steps", () => {
    expect(parseSetupPromptEvent({ type: "dismissed", step: "brand" })).toEqual({ type: "dismissed", step: "brand" });
    expect(parseSetupPromptEvent({ type: "dismissed", step: "nope" })).toBeNull();
    expect(parseSetupPromptEvent({ type: "other", step: "brand" })).toBeNull();
    expect(parseSetupPromptEvent(null)).toBeNull();
  });
});

describe("applySetupPromptEvent", () => {
  it("keeps the first toast step and adds a dismissal once", () => {
    expect(applySetupPromptEvent(withToast(), { type: "toast_shown", step: "brand" }).toastStep).toBe("template");
    const once = applySetupPromptEvent(fresh, { type: "dismissed", step: "brand" });
    expect(applySetupPromptEvent(once, { type: "dismissed", step: "brand" }).dismissed).toEqual(["brand"]);
  });
});

describe("recordCompletedSteps", () => {
  it("returns the same state when nothing is new, so nothing is saved", () => {
    const state = withToast({ completed: ["template"] });
    expect(recordCompletedSteps(state, { ...none, template: true }, STORE)).toBe(state);
  });

  it("adds new steps and keeps old ones after they stop being done", () => {
    const state = recordCompletedSteps(withToast({ completed: ["publish"] }), { ...none, brand: true }, STORE);
    expect(state.completed).toEqual(["publish", "brand"]);
  });
});

describe("nextPromptStep", () => {
  it("follows the owner's order: template, brand, product, shipping", () => {
    const keys = ["template", "brand", "product", "shipping"] as const;
    const order = keys.map((_, i) => {
      const flags = { ...none };
      for (const key of keys.slice(0, i)) flags[key] = true;
      return nextPromptStep(flags, STORE, fresh)?.key;
    });
    expect(order).toEqual(keys);
  });

  it("skips a completed step that is not done any more", () => {
    expect(nextPromptStep({ ...all, publish: false, shipping: false }, STORE, withToast({ completed: ["publish"] }))?.key).toBe("shipping");
  });

  it("is null when everything is done", () => {
    expect(nextPromptStep(all, STORE, fresh)).toBeNull();
  });
});

describe("decideSetupPrompt", () => {
  it("shows the toast first, pointing to the current step", () => {
    expect(decideSetupPrompt({ ...none, template: true }, STORE, fresh)).toEqual({
      prompt: { kind: "toast", key: "brand", href: `/stores/${STORE}/website/design` },
      finished: false,
    });
  });

  it("shows nothing more for the step the toast already named", () => {
    expect(decideSetupPrompt(none, STORE, withToast())).toEqual({ prompt: null, finished: false });
  });

  it("shows a banner for the next step once a step is completed", () => {
    expect(decideSetupPrompt({ ...none, template: true }, STORE, withToast()).prompt).toEqual({
      kind: "banner",
      key: "brand",
      href: `/stores/${STORE}/website/design`,
    });
  });

  it("keeps a dismissed banner away but keeps watching for the next step", () => {
    const state = withToast({ dismissed: ["brand"] });
    expect(decideSetupPrompt({ ...none, template: true }, STORE, state)).toEqual({ prompt: null, finished: false });
    expect(decideSetupPrompt({ ...none, template: true, brand: true }, STORE, state).prompt?.key).toBe("product");
  });

  it("finishes when the guide is dismissed or every step is done", () => {
    expect(decideSetupPrompt(none, STORE, { ...fresh, guideDismissed: true })).toEqual({ prompt: null, finished: true });
    expect(decideSetupPrompt(all, STORE, fresh)).toEqual({ prompt: null, finished: true });
  });

  it("never brings back a step completed earlier, such as after unpublishing", () => {
    const state = withToast({ completed: ["template", "brand", "product", "publish", "shipping"] });
    expect(decideSetupPrompt({ ...all, publish: false }, STORE, state)).toEqual({ prompt: null, finished: true });
  });
});

describe("isPromptBlockedRoute", () => {
  const product = { key: "product" as const, href: "/products/add" };
  const design = { key: "brand" as const, href: `/stores/${STORE}/website/design` };
  const publish = { key: "publish" as const, href: `/stores/${STORE}/website` };

  it("blocks the builder for every step", () => {
    expect(isPromptBlockedRoute(`/stores/${STORE}/editor`, product)).toBe(true);
    expect(isPromptBlockedRoute(`/stores/${STORE}/editor/home`, publish)).toBe(true);
  });

  it("blocks the product forms only while the step is the first product", () => {
    expect(isPromptBlockedRoute("/products/add", product)).toBe(true);
    expect(isPromptBlockedRoute("/products/add/bulk", product)).toBe(true);
    expect(isPromptBlockedRoute("/products/abc/edit", product)).toBe(true);
    expect(isPromptBlockedRoute("/products", product)).toBe(false);
    expect(isPromptBlockedRoute("/products/add", publish)).toBe(false);
  });

  it("blocks a step's own page and its sub-pages", () => {
    expect(isPromptBlockedRoute(design.href, design)).toBe(true);
    expect(isPromptBlockedRoute(`${design.href}/fonts`, design)).toBe(true);
    expect(isPromptBlockedRoute(`/stores/${STORE}/website/designs`, design)).toBe(false);
  });

  it("lets other website pages show the publish prompt", () => {
    expect(isPromptBlockedRoute(publish.href, publish)).toBe(true);
    expect(isPromptBlockedRoute(`${publish.href}/media`, publish)).toBe(false);
  });

  it("allows the dashboard home", () => {
    expect(isPromptBlockedRoute("/", design)).toBe(false);
  });
});
