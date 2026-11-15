/**
 * The store welcome page (`/stores/<id>/welcome`, docs/plans/seller-welcome.md).
 * Pure: which setup steps are done, which one opens first, the progress, and
 * the links in and out of the page. Done-states come from the same setup
 * flags as the dashboard home and the setup reminder emails
 * (`STORE_SETUP_STEP_DONE`), never from anything stored for this page.
 */

import type { StoreCurrency } from "@workspace/lib";
import { daysUntilOffline, graceDaysLeft, type OrderLock } from "@workspace/lib/billing/order-grace";
import { STORE_SETUP_STEP_DONE, STORE_SETUP_STEP_KEYS, type StoreSetupFlags } from "@workspace/lib/sellers";
import { currencyCountry } from "../shipping/shipping.dto";

/** The steps of the main setup section, in order. */
export type WelcomeSetupStepKey = "industry" | "theme" | "brand" | "product";

export type WelcomeSetupStep = { key: WelcomeSetupStepKey; done: boolean };

/** The steps of the "Shipping and payments" section, in order. */
export type WelcomeDeliveryStepKey = "shipping" | "payments";

export type WelcomeDeliveryStep = { key: WelcomeDeliveryStepKey; done: boolean };

/** The page's sections (accordion items), in order. */
export type WelcomeSectionKey = "setup" | "delivery" | "share" | "topUp";

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

/** Shipping, then payments, done from the home's flags (a saved setting or zone; saved payment methods or a gateway). */
export function welcomeDeliverySteps(flags: StoreSetupFlags): WelcomeDeliveryStep[] {
  return [
    { key: "shipping", done: flags.shipping },
    { key: "payments", done: flags.payments },
  ];
}

/**
 * The section open when the page loads: the one a `#hash` names (the section
 * or one of its steps), else the first unfinished one, else none.
 */
export function initialWelcomeSection(
  hash: string,
  steps: readonly WelcomeSetupStep[],
  delivery: readonly WelcomeDeliveryStep[] = [],
): WelcomeSectionKey | "" {
  const id = hash.replace(/^#/, "");
  if (id === "setup" || steps.some((step) => step.key === id)) return "setup";
  if (id === "delivery" || delivery.some((step) => step.key === id)) return "delivery";
  if (id === "share" || id === "topUp") return id;
  if (nextWelcomeStep(steps)) return "setup";
  return delivery.some((step) => !step.done) ? "delivery" : "";
}

/** The suggested delivery price for all Egypt (owner, 2026-11-15); the seller can change it. */
export const WELCOME_EGYPT_FLAT_PRICE = 60;

/**
 * The first delivery zone the welcome page offers a store with none
 * (docs/plans/seller-welcome.md, decision 5): an EGP store gets "Whole Egypt"
 * at 60 (the `egypt_flat` template); a store in a one-country currency gets
 * one zone for that country with no price, which the seller must type; a
 * currency with no one country (USD, EUR) gets none, so the seller adds
 * their own places.
 */
export type WelcomeShippingDefault =
  | { kind: "egypt_flat"; price: number }
  | { kind: "country"; country: string; price: null }
  | { kind: "none" };

export function welcomeShippingDefault(currency: StoreCurrency): WelcomeShippingDefault {
  if (currency === "EGP") return { kind: "egypt_flat", price: WELCOME_EGYPT_FLAT_PRICE };
  const country = currencyCountry(currency);
  return country ? { kind: "country", country, price: null } : { kind: "none" };
}

/**
 * Arabic-Indic (٠-٩) and Eastern Arabic-Persian (۰-۹) digits as Latin ones,
 * and the Arabic decimal separator (٫) as a dot (owner, 2026-11-15), so an
 * amount typed on an Arabic keyboard reads the same as a Latin one.
 */
export function normalizeWelcomeDigits(text: string): string {
  return text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf)).replace(/\u066B/g, ".");
}

/**
 * A typed delivery amount as the shipping schemas take it (store currency, at
 * most 2 decimals, 0..max), or null when it isn't one. `positive` refuses 0
 * (a free-delivery threshold of 0 means "every order", which this page doesn't offer).
 */
export function parseWelcomeAmount(text: string, max: number, positive = false): number | null {
  const trimmed = normalizeWelcomeDigits(text).trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > max || (positive && n === 0)) return null;
  // Whole minor units only (rule 7): the server refuses anything finer.
  return Math.abs(n * 100 - Math.round(n * 100)) < 1e-6 ? n : null;
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

/**
 * The pre-written message a seller sends customers to open the store (owner,
 * 2026-11-15). `format` is the page's translator for `storeWelcome.share.message`
 * (ICU, so the name and link go in as values and are never parsed as markup).
 */
export function welcomeShareMessage(
  format: (key: "message", values: { storeName: string; url: string }) => string,
  input: { storeName: string; url: string },
): string {
  return format("message", { storeName: input.storeName.trim(), url: input.url });
}

/**
 * The top-up section's state (copy only; no money logic, rule 7). `fee` shows
 * the Free per-order fee line: never on active Pro, never before the USD
 * switch. `status` is the days line, from the order lock (`currentOrderLock`):
 * a top-up in review, the store already offline, the days until it goes
 * offline (7-day sellers), the days left in the grace window, orders hidden,
 * or activated. Before the USD switch nothing applies (`none`).
 */
export type WelcomeWalletStatus =
  | { kind: "none" }
  | { kind: "activated" }
  | { kind: "review" }
  | { kind: "offlineNow" }
  | { kind: "offlineIn"; days: number }
  | { kind: "graceLeft"; days: number }
  | { kind: "locked" }
  | { kind: "topUp" };

export type WelcomeWallet = { fee: boolean; status: WelcomeWalletStatus };

export function welcomeWallet(input: { lock: OrderLock; usdLive: boolean; isPro: boolean; at?: Date }): WelcomeWallet {
  const { lock, usdLive, isPro, at = new Date() } = input;
  if (!usdLive) return { fee: false, status: { kind: "none" } };
  const fee = !isPro;
  if (lock.activated) return { fee, status: { kind: "activated" } };
  if (lock.pendingReview) return { fee, status: { kind: "review" } };
  if (lock.storeOffline) return { fee, status: { kind: "offlineNow" } };
  if (lock.grace?.offlineAt) {
    const days = daysUntilOffline(lock.grace, at);
    if (days > 0) return { fee, status: { kind: "offlineIn", days } };
  }
  if (lock.grace) {
    const days = graceDaysLeft(lock.grace, at);
    if (days > 0) return { fee, status: { kind: "graceLeft", days } };
  }
  return { fee, status: { kind: lock.ordersLocked ? "locked" : "topUp" } };
}

/** "You're ready": the home's four setup steps (the progress bar) are all done. */
export function welcomeReady(flags: StoreSetupFlags): boolean {
  const { done, total } = welcomeProgress(flags);
  return done === total;
}
