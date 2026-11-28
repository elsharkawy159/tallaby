/**
 * The home "get your store ready" setup (PLAN.md §6.6, P3-04; ROADMAP.md F-86),
 * computed from data, never stored. Six steps in this order (owner,
 * 2026-11-27): products and categories, theme, store identity, domain
 * (optional), SEO (optional), wallet. Only the required ones count toward
 * "setup done"; the optional ones show an "optional" label and never block
 * anything. No step is locked: every step can be opened at any time, done
 * ones too. Store steps belong to the store selected in the sidebar; the
 * wallet is the seller's.
 *
 * Until the required steps are done and the seller has no real order yet, the
 * home shows only the setup cards, no metrics (`showSetupOnlyHome`).
 *
 * The guided prompts (setup-prompts.lib.ts) still walk the older, finer step
 * list (`buildSetupTasks`: product, template, brand, shipping), keyed as
 * before, so their saved progress keeps its meaning.
 */

import {
  STORE_SETUP_OPTIONAL_STEPS,
  STORE_SETUP_STEP_DONE,
  STORE_SETUP_STEP_KEYS,
  setupMarkScope,
  storeSetupStepDoneFromData,
  storeSetupStepHref,
  type StoreSetupFlags,
  type StoreSetupStepKey,
} from "@workspace/lib/sellers";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * The setup flags of the selected store. Shared with the setup reminder emails
 * (F-94): the type and the step predicates live in @workspace/lib/sellers
 * (store-setup.lib.ts), the SQL in store-setup.server.ts.
 */
export type SetupFlags = StoreSetupFlags;

// ---------------------------------------------------------------------------
// Home steps (the setup-only home and the checklist card).
// ---------------------------------------------------------------------------

export type HomeStepKey = StoreSetupStepKey;

export type HomeStep = {
  key: HomeStepKey;
  href: string;
  done: boolean;
  optional: boolean;
  /** Done only because the seller marked it: the card offers to undo it. */
  markedByHand: boolean;
  /** The card offers "Mark as done" (not done, and it has a place to keep the mark). */
  canMark: boolean;
};

/** Steps that need a store; the product and the wallet show without one. */
const HOME_STORE_STEPS = new Set<HomeStepKey>(["theme", "identity", "domain", "seo"]);

export function buildHomeSteps(flags: SetupFlags, storeId: string | null): HomeStep[] {
  return STORE_SETUP_STEP_KEYS.filter((key) => storeId || !HOME_STORE_STEPS.has(key))
    // A seller whose wallet is above 0 doesn't see the wallet step (owner, 2026-11-28); it counts as done.
    .filter((key) => !(key === "wallet" && flags.walletFunded))
    .map((key) => {
      const done = STORE_SETUP_STEP_DONE[key](flags);
      return {
        key,
        // The product link keeps its no-store fallback (storeProductsHref).
        href: key === "product" ? storeProductsHref(storeId, "/add") : storeSetupStepHref(key, storeId ?? ""),
        done,
        optional: STORE_SETUP_OPTIONAL_STEPS.has(key),
        markedByHand: done && !storeSetupStepDoneFromData(key, flags),
        canMark: !done && setupMarkScope(key, storeId) !== null,
      };
    });
}

/** The step the "next step" badge and the header point to: the first open required step, in order. */
export function nextHomeStep(steps: readonly HomeStep[]): HomeStep | undefined {
  return steps.find((step) => !step.optional && !step.done);
}

/**
 * Steps in order: a step that isn't done waits for the first earlier step
 * that isn't done, returned here so the page can say what to do first. Null
 * when the step can be started, and always for a done step. The home no
 * longer locks its steps (owner, 2026-11-27); the store welcome page still
 * uses this for its own steps.
 */
export function stepBlocker<K extends string>(steps: readonly { key: K; done: boolean }[], key: K): K | null {
  const index = steps.findIndex((step) => step.key === key);
  if (index < 0 || steps[index]!.done) return null;
  return steps.slice(0, index).find((step) => !step.done)?.key ?? null;
}

/** Every required step is done: the store is ready for its first order, and the guide can go away. */
export function isSetupDone(flags: SetupFlags, storeId: string | null): boolean {
  return buildHomeSteps(flags, storeId).every((step) => step.optional || step.done);
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
