/**
 * The home "get your store ready" setup (PLAN.md §6.6, P3-04; ROADMAP.md F-86),
 * computed from data, never stored. Four steps, all required (owner,
 * 2026-11-10): add a product, choose the store design (template and brand
 * together), set up payments, set up shipping. Store steps belong to the store
 * selected in the sidebar.
 *
 * Until those are done and the seller has no real order yet, the home shows
 * only the setup cards, no metrics (`showSetupOnlyHome`).
 *
 * The guided prompts (setup-prompts.lib.ts) still walk the older, finer step
 * list (`buildSetupTasks`: template, brand, product, shipping), so their saved
 * progress keeps its meaning.
 */

import { STORE_SETUP_STEP_DONE, type StoreSetupFlags } from "@workspace/lib/sellers";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * The setup flags of the selected store. Shared with the setup reminder emails
 * (F-94): the type and the step predicates live in @workspace/lib/sellers
 * (store-setup.lib.ts), the SQL in store-setup.server.ts.
 */
export type SetupFlags = StoreSetupFlags;

// ---------------------------------------------------------------------------
// Home setup steps (the setup-only home and the checklist card).
// ---------------------------------------------------------------------------

export type HomeStepKey = "product" | "design" | "payments" | "shipping";

export type HomeStep = { key: HomeStepKey; href: string; done: boolean };

const HOME_STORE_STEPS = new Set<HomeStepKey>(["design", "payments", "shipping"]);

const HOME_STEPS: { key: HomeStepKey; done: (f: SetupFlags) => boolean; href: (storeId: string, f: SetupFlags) => string }[] = [
  { key: "product", done: STORE_SETUP_STEP_DONE.product, href: (id) => storeProductsHref(id || null, "/add") },
  {
    key: "design",
    done: STORE_SETUP_STEP_DONE.design,
    // No template yet: the gallery first; then the brand (logo, colours, fonts).
    href: (id, f) => (f.template ? `/stores/${id}/website/design` : `/stores/${id}/website/templates`),
  },
  { key: "payments", done: STORE_SETUP_STEP_DONE.payments, href: (id) => `/stores/${id}/settings/payments` },
  { key: "shipping", done: STORE_SETUP_STEP_DONE.shipping, href: (id) => `/stores/${id}/shipping` },
];

export function buildHomeSteps(flags: SetupFlags, storeId: string | null): HomeStep[] {
  return HOME_STEPS.filter((step) => storeId || !HOME_STORE_STEPS.has(step.key)).map((step) => ({
    key: step.key,
    href: step.href(storeId ?? "", flags),
    done: step.done(flags),
  }));
}

/** Every step is done: the store is ready for its first order, and the guide can go away. */
export function isSetupDone(flags: SetupFlags, storeId: string | null): boolean {
  return buildHomeSteps(flags, storeId).every((step) => step.done);
}

/**
 * The home shows only the setup cards: setup isn't done and the seller has no
 * real order yet (test orders don't count). A seller with orders always keeps
 * the metrics, even with a step missing.
 */
export function showSetupOnlyHome(input: { flags: SetupFlags; storeId: string | null; hasRealOrders: boolean }): boolean {
  return !input.hasRealOrders && !isSetupDone(input.flags, input.storeId);
}

// ---------------------------------------------------------------------------
// Prompt steps (setup-prompts.lib.ts). Unchanged order and keys.
// ---------------------------------------------------------------------------

export type SetupKey = "template" | "brand" | "product" | "publish" | "shipping";

export type SetupTask = { key: SetupKey; href: string; done: boolean; optional: boolean };

const STORE_STEPS = new Set<SetupKey>(["template", "brand", "shipping"]);

/** Steps that can wait: shown last. */
const OPTIONAL_STEPS = new Set<SetupKey>(["shipping"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "template", href: (id) => `/stores/${id}/website/templates` },
  { key: "brand", href: (id) => `/stores/${id}/website/design` },
  { key: "product", href: (id) => storeProductsHref(id || null, "/add") },
  { key: "shipping", href: (id) => `/stores/${id}/shipping` },
];

export function buildSetupTasks(flags: SetupFlags, storeId: string | null): SetupTask[] {
  return STEPS.filter((step) => storeId || !STORE_STEPS.has(step.key)).map((step) => ({
    key: step.key,
    href: step.href(storeId ?? ""),
    done: flags[step.key],
    optional: OPTIONAL_STEPS.has(step.key),
  }));
}
