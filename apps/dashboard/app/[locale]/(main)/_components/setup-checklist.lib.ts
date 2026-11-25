/**
 * The home "get your store ready" setup (PLAN.md §6.6, P3-04; ROADMAP.md F-86),
 * computed from data, never stored. Four steps, all required (owner,
 * 2026-11-10), in this order (owner, 2026-11-25): add a product, choose the
 * store design (template and brand together), set up shipping, set up
 * payments. A step opens only once the steps before it are done
 * (`stepBlocker`); a done step always keeps its link. Store steps belong to
 * the store selected in the sidebar.
 *
 * Until those are done and the seller has no real order yet, the home shows
 * only the setup cards, no metrics (`showSetupOnlyHome`).
 *
 * The guided prompts (setup-prompts.lib.ts) still walk the older, finer step
 * list (`buildSetupTasks`: product, template, brand, shipping), keyed as
 * before, so their saved progress keeps its meaning.
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

export type HomeStepKey = "product" | "design" | "shipping" | "payments";

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
  { key: "shipping", done: STORE_SETUP_STEP_DONE.shipping, href: (id) => `/stores/${id}/shipping` },
  { key: "payments", done: STORE_SETUP_STEP_DONE.payments, href: (id) => `/stores/${id}/settings/payments` },
];

export function buildHomeSteps(flags: SetupFlags, storeId: string | null): HomeStep[] {
  return HOME_STEPS.filter((step) => storeId || !HOME_STORE_STEPS.has(step.key)).map((step) => ({
    key: step.key,
    href: step.href(storeId ?? "", flags),
    done: step.done(flags),
  }));
}

/**
 * Steps go in order (owner, 2026-11-25): a step that isn't done waits for the
 * first earlier step that isn't done, returned here so the page can say what
 * to do first. Null when the step can be started, and always for a done step,
 * so a seller who did steps out of order is never stuck. Shared with the
 * store welcome page.
 */
export function stepBlocker<K extends string>(steps: readonly { key: K; done: boolean }[], key: K): K | null {
  const index = steps.findIndex((step) => step.key === key);
  if (index < 0 || steps[index]!.done) return null;
  return steps.slice(0, index).find((step) => !step.done)?.key ?? null;
}

/**
 * `stepBlocker` for the home steps: the steps after the design wait only for a
 * chosen template (the user's flow is product > theme > shipping, owner
 * 2026-11-25), not for the brand that also counts toward the design step.
 */
export function homeStepBlocker(steps: readonly HomeStep[], key: HomeStepKey, flags: SetupFlags): HomeStepKey | null {
  return stepBlocker(
    steps.map((step) => (step.key === "design" && step.key !== key ? { ...step, done: step.done || flags.template } : step)),
    key,
  );
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
// Prompt steps (setup-prompts.lib.ts). Same keys; the product leads (owner, 2026-11-25).
// ---------------------------------------------------------------------------

export type SetupKey = "template" | "brand" | "product" | "publish" | "shipping";

export type SetupTask = { key: SetupKey; href: string; done: boolean; optional: boolean };

const STORE_STEPS = new Set<SetupKey>(["template", "brand", "shipping"]);

/** Steps that can wait: shown last. */
const OPTIONAL_STEPS = new Set<SetupKey>(["shipping"]);

const STEPS: { key: SetupKey; href: (storeId: string) => string }[] = [
  { key: "product", href: (id) => storeProductsHref(id || null, "/add") },
  { key: "template", href: (id) => `/stores/${id}/website/templates` },
  { key: "brand", href: (id) => `/stores/${id}/website/design` },
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
