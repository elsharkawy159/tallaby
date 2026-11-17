/**
 * The store welcome page (`/stores/<id>/welcome`, docs/plans/seller-welcome.md).
 * Pure: which steps are shown and done, which one opens first, the progress,
 * and the links in and out of the page. Done-states come from the same setup
 * flags as the dashboard home and the setup reminder emails
 * (`StoreSetupFlags`), never from anything stored for this page.
 */

import type { StoreCurrency } from "@workspace/lib";
import { daysUntilOffline, type OrderLock } from "@workspace/lib/billing/order-grace";
import type { StoreSetupFlags } from "@workspace/lib/sellers";
import { TOP_UP_TO_GO_ONLINE_HREF } from "@/lib/billing/top-up-to-go-online.lib";
import { currencyCountry } from "../shipping/shipping.dto";

/** The page's steps, in order: one flat list (owner, 2026-11-17). */
export type WelcomeStepKey = "theme" | "product" | "shipping";

export type WelcomeStep = { key: WelcomeStepKey; done: boolean };

/**
 * The steps the page shows: a theme (only inside the store-builder rollout),
 * the first product, the delivery price. Done from the home's flags. Brand
 * and payments are not steps here: they live in Store settings, and cash on
 * delivery is on by default.
 */
export function welcomeSteps(input: {
  flags: StoreSetupFlags;
  /** The seller can use Website › Templates (store-builder rollout); else no theme step. */
  themesAvailable: boolean;
}): WelcomeStep[] {
  const steps: WelcomeStep[] = [];
  if (input.themesAvailable) steps.push({ key: "theme", done: input.flags.template });
  steps.push({ key: "product", done: input.flags.product }, { key: "shipping", done: input.flags.shipping });
  return steps;
}

/** The first step still open, or null when every step is done. */
export function nextWelcomeStep(steps: readonly WelcomeStep[]): WelcomeStepKey | null {
  return steps.find((step) => !step.done)?.key ?? null;
}

/** "x of N": the page's one counter, over exactly the steps it shows. */
export function welcomeProgress(steps: readonly WelcomeStep[]): { done: number; total: number } {
  return { done: steps.filter((step) => step.done).length, total: steps.length };
}

/** What an old or current `#hash` means now: a step to open, or a place below the list to scroll to. */
const HASH_STEP: Record<string, WelcomeStepKey> = {
  theme: "theme",
  // The industry is a link inside the theme step; "setup" was the first section.
  industry: "theme",
  setup: "theme",
  product: "product",
  shipping: "shipping",
  delivery: "shipping",
};
const HASH_ANCHOR: Record<string, "live" | "topUp"> = { share: "live", live: "live", topUp: "topUp" };

export type WelcomeArrival = { open: WelcomeStepKey | ""; scrollTo: WelcomeStepKey | "live" | "topUp" | null };

/**
 * Where a visit lands: the step open on arrival (the one a `#hash` names when
 * the page shows it, else the first unfinished one, else none) and the element
 * to scroll to (`welcome-<scrollTo>`), or null without a known hash. Old links
 * (`#brand`, `#payments`…) fall back to the first unfinished step.
 */
export function welcomeArrival(hash: string, steps: readonly WelcomeStep[]): WelcomeArrival {
  const id = hash.replace(/^#/, "");
  const named = Object.hasOwn(HASH_STEP, id) ? HASH_STEP[id] : undefined;
  if (named && steps.some((step) => step.key === named)) return { open: named, scrollTo: named };
  const anchor = Object.hasOwn(HASH_ANCHOR, id) ? HASH_ANCHOR[id] : undefined;
  return { open: nextWelcomeStep(steps) ?? "", scrollTo: anchor ?? null };
}

/**
 * A `#hash` whose job moved to another page: `#payments` (Admin's "choose your
 * payment methods" message) opens the store's Settings › Payments. Null for
 * every other hash.
 */
export function welcomeHashRedirect(hash: string, storeId: string): string | null {
  return hash.replace(/^#/, "") === "payments" ? `/stores/${encodeURIComponent(storeId)}/settings/payments` : null;
}

/**
 * Using a theme asks first, except for a store that was never published and
 * has no template chosen yet: nothing of the seller's is replaced there
 * (owner, 2026-11-17). Everywhere else applying a theme replaces the draft.
 */
export function welcomeThemeNeedsConfirm(input: { templateChosen: boolean; siteStatus: string }): boolean {
  return input.templateChosen || input.siteStatus !== "draft";
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
 * most 2 decimals, 0..max), or null when it isn't one.
 */
export function parseWelcomeAmount(text: string, max: number): number | null {
  const trimmed = normalizeWelcomeDigits(text).trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
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

/** The add form itself, where the inline AI uploader's unfinished product (a stored draft) is completed. */
export function welcomeFinishProductHref(storeId: string): string {
  return `/stores/${encodeURIComponent(storeId)}/products/add?method=manual&from=welcome`;
}

/**
 * The pre-written message a seller sends customers to open the store (owner,
 * 2026-11-15). `format` is the page's translator for `storeWelcome.live.message`
 * (ICU, so the name and link go in as values and are never parsed as markup).
 */
export function welcomeShareMessage(
  format: (key: "message", values: { storeName: string; url: string }) => string,
  input: { storeName: string; url: string },
): string {
  return format("message", { storeName: input.storeName.trim(), url: input.url });
}

/**
 * The top-up line's state (copy only; no money logic, rule 7). `fee` shows
 * the Free per-order fee line: never on active Pro, never before the USD
 * switch. `status` is the days line, from the order lock (`currentOrderLock`):
 * a top-up in review, the store already offline, the days until it goes
 * offline, orders hidden until a top-up (from the start, owner
 * 2026-11-16), or activated. Before the USD switch nothing applies (`none`).
 */
export type WelcomeWalletStatus =
  | { kind: "none" }
  | { kind: "activated" }
  | { kind: "review" }
  | { kind: "offlineNow" }
  | { kind: "offlineIn"; days: number }
  | { kind: "locked" };

export type WelcomeWallet = { fee: boolean; status: WelcomeWalletStatus };

export function welcomeWallet(input: { lock: OrderLock; usdLive: boolean; isPro: boolean; at?: Date }): WelcomeWallet {
  const { lock, usdLive, isPro, at = new Date() } = input;
  if (!usdLive) return { fee: false, status: { kind: "none" } };
  const fee = !isPro;
  if (lock.activated) return { fee, status: { kind: "activated" } };
  if (lock.pendingReview) return { fee, status: { kind: "review" } };
  if (lock.storeOffline) return { fee, status: { kind: "offlineNow" } };
  if (lock.grace) {
    const days = daysUntilOffline(lock.grace, at);
    if (days > 0) return { fee, status: { kind: "offlineIn", days } };
  }
  // Not activated: orders are hidden until a top-up.
  return { fee, status: { kind: "locked" } };
}

/**
 * The top-up line under the steps: what it says and where its button goes.
 * Null when there is nothing to ask (activated, or before the USD switch). A
 * top-up in review has no button. An offline store's button carries the
 * "bring your store back online" notice (docs/seller-top-up-rules.md §4).
 */
export type WelcomeTopUpLine =
  | { kind: "review"; href: null }
  | { kind: "offlineNow" | "locked"; href: string }
  | { kind: "offlineIn"; days: number; href: string };

export const WELCOME_TOP_UP_HREF = "/wallet?topup=1";

export function welcomeTopUpLine(status: WelcomeWalletStatus): WelcomeTopUpLine | null {
  switch (status.kind) {
    case "none":
    case "activated":
      return null;
    case "review":
      return { kind: "review", href: null };
    case "offlineNow":
      return { kind: "offlineNow", href: TOP_UP_TO_GO_ONLINE_HREF };
    case "offlineIn":
      return { kind: "offlineIn", days: status.days, href: WELCOME_TOP_UP_HREF };
    case "locked":
      return { kind: "locked", href: WELCOME_TOP_UP_HREF };
  }
}

/**
 * What shows under the steps about the store being live: the "store is live"
 * card once it is published (never while billing holds it offline: the top-up
 * line says so instead); one line to the Website page when the theme and the
 * product are done but the store is still offline (the seller switched it
 * off); else nothing.
 */
export function welcomeLiveState(input: { flags: StoreSetupFlags; themesAvailable: boolean; wallet: WelcomeWalletStatus }): "live" | "offline" | "none" {
  if (input.wallet.kind === "offlineNow") return "none";
  if (input.flags.publish) return "live";
  return input.flags.product && (input.flags.template || !input.themesAvailable) ? "offline" : "none";
}
