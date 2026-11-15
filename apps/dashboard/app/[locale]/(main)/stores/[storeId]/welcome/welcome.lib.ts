/**
 * The store welcome page (`/stores/<id>/welcome`, docs/plans/seller-welcome.md).
 * Pure: which setup steps are done, which one opens first, the progress, and
 * the links in and out of the page. Done-states come from the same setup
 * flags as the dashboard home and the setup reminder emails
 * (`STORE_SETUP_STEP_DONE`), never from anything stored for this page.
 */

import { STORE_SETUP_STEP_DONE, STORE_SETUP_STEP_KEYS, type StoreSetupFlags } from "@workspace/lib/sellers";

/** The steps of the main setup section, in order. */
export type WelcomeSetupStepKey = "industry" | "theme" | "brand" | "product";

export type WelcomeSetupStep = { key: WelcomeSetupStepKey; done: boolean };

/** The page's sections (accordion items). P2/P3 add shipping, share and top-up. */
export type WelcomeSectionKey = "setup";

export function welcomeSetupSteps(input: {
  flags: StoreSetupFlags;
  /** The store has an industry (a category) saved. */
  hasIndustry: boolean;
  /** The seller can use Website › Templates (store-builder rollout); else no theme step. */
  themesAvailable: boolean;
}): WelcomeSetupStep[] {
  const steps: WelcomeSetupStep[] = [{ key: "industry", done: input.hasIndustry }];
  if (input.themesAvailable) steps.push({ key: "theme", done: input.flags.template });
  steps.push({ key: "brand", done: input.flags.brand }, { key: "product", done: input.flags.product });
  return steps;
}

/** The first step still open, or null when every step is done. */
export function nextWelcomeStep(steps: readonly WelcomeSetupStep[]): WelcomeSetupStepKey | null {
  return steps.find((step) => !step.done)?.key ?? null;
}

/** "x of 4": the dashboard home's four setup steps (product, design, payments, shipping). */
export function welcomeProgress(flags: StoreSetupFlags): { done: number; total: number } {
  return {
    done: STORE_SETUP_STEP_KEYS.filter((key) => STORE_SETUP_STEP_DONE[key](flags)).length,
    total: STORE_SETUP_STEP_KEYS.length,
  };
}

/** The section open when the page loads: the one a `#hash` names, else the first unfinished one, else none. */
export function initialWelcomeSection(hash: string, steps: readonly WelcomeSetupStep[]): WelcomeSectionKey | "" {
  const id = hash.replace(/^#/, "");
  if (id === "setup" || steps.some((step) => step.key === id)) return "setup";
  return nextWelcomeStep(steps) ? "setup" : "";
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/** A `signup=` value worth passing on (the pixel loader checks it again: parseSignupMethod). */
const SIGNUP_PARAM = /^[a-z_]{1,20}$/;

/**
 * Right after signup (`/?welcome=1&signup=…`), a seller whose home shows only
 * the setup steps lands on the selected store's welcome page once (owner,
 * 2026-11-15). `signup` goes along so the Meta CompleteRegistration fires
 * there, and only there. Anything else stays on the home (null).
 */
export function welcomeLandingHref(input: {
  welcome: string | string[] | undefined;
  signup: string | string[] | undefined;
  setupOnly: boolean;
  storeId: string | null;
}): string | null {
  if (first(input.welcome) !== "1" || !input.setupOnly || !input.storeId) return null;
  const params = new URLSearchParams({ welcome: "1" });
  const signup = first(input.signup);
  if (signup && SIGNUP_PARAM.test(signup)) params.set("signup", signup);
  return `/stores/${encodeURIComponent(input.storeId)}/welcome?${params.toString()}`;
}

/** The store's welcome page, keeping `welcome` and `signup` from the old `/welcome` link. */
export function storeWelcomeHref(storeId: string, query: { welcome?: string | string[]; signup?: string | string[] } = {}): string {
  const params = new URLSearchParams();
  if (first(query.welcome) === "1") params.set("welcome", "1");
  const signup = first(query.signup);
  if (signup && SIGNUP_PARAM.test(signup)) params.set("signup", signup);
  const qs = params.toString();
  return `/stores/${encodeURIComponent(storeId)}/welcome${qs ? `?${qs}` : ""}`;
}

/** The first-product step: today's AI add page (choice of method when AI is off), coming back here after publishing. */
export function welcomeProductHref(storeId: string, aiEnabled: boolean): string {
  return `/stores/${encodeURIComponent(storeId)}/products/add?method=${aiEnabled ? "ai" : "choose"}&from=welcome`;
}

/** The store's languages after choosing a default one: the chosen language is added, none is removed. */
export function withDefaultLocale(current: readonly string[], chosen: "ar" | "en"): ("ar" | "en")[] {
  const kept = current.filter((locale): locale is "ar" | "en" => locale === "ar" || locale === "en");
  return [...new Set([...kept, chosen])];
}
