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

import { storeProductsHref } from "@/lib/products/product-routes.lib";

export type SetupFlags = {
  /**
   * The seller chose a template for the selected store: an install not
   * undone, or the site was ever published (same rule as
   * storeTemplateChosen in @workspace/lib). The new-store Classic
   * placeholder drafts write no install, so they do not count.
   */
  template: boolean;
  /**
   * The selected store has a logo, or its design system (colours, fonts,
   * buttons) was saved after its latest template install.
   */
  brand: boolean;
  /** The seller has an active product. */
  product: boolean;
  /** The selected store's website is live (`site_status = 'published'`). Not a step since 2026-11-07. */
  publish: boolean;
  /** The selected store saved its shipping settings or has a delivery zone. */
  shipping: boolean;
  /**
   * The selected store saved its payment methods (`settings.payments`, written
   * only by a seller's save) or has a connected card gateway (Paymob, Kashier).
   */
  payments: boolean;
};

// ---------------------------------------------------------------------------
// Home setup steps (the setup-only home and the checklist card).
// ---------------------------------------------------------------------------

export type HomeStepKey = "product" | "design" | "payments" | "shipping";

export type HomeStep = { key: HomeStepKey; href: string; done: boolean };

const HOME_STORE_STEPS = new Set<HomeStepKey>(["design", "payments", "shipping"]);

const HOME_STEPS: { key: HomeStepKey; done: (f: SetupFlags) => boolean; href: (storeId: string, f: SetupFlags) => string }[] = [
  { key: "product", done: (f) => f.product, href: (id) => storeProductsHref(id || null, "/add") },
  {
    key: "design",
    done: (f) => f.template && f.brand,
    // No template yet: the gallery first; then the brand (logo, colours, fonts).
    href: (id, f) => (f.template ? `/stores/${id}/website/design` : `/stores/${id}/website/templates`),
  },
  { key: "payments", done: (f) => f.payments, href: (id) => `/stores/${id}/settings/payments` },
  { key: "shipping", done: (f) => f.shipping, href: (id) => `/stores/${id}/shipping` },
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
