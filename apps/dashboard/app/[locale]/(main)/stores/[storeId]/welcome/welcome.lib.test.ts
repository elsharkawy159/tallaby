import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { ORDERS_UNLOCKED, type OrderLock } from "@workspace/lib/billing/order-grace";
import type { StoreSetupFlags } from "@workspace/lib/sellers";
import { whatsappShare } from "@/app/[locale]/(builder)/ai-builder/_components/workspace.lib";
import ar from "../../../../../../messages/ar.json";
import en from "../../../../../../messages/en.json";
import { addProductReturnHref } from "../products/add/add-method.lib";
import { TOP_UP_TO_GO_ONLINE_HREF } from "@/lib/billing/top-up-to-go-online.lib";
import {
  nextWelcomeStep,
  normalizeWelcomeDigits,
  parseWelcomeAmount,
  storeWelcomeHref,
  welcomeArrival,
  welcomeFinishProductHref,
  welcomeHashRedirect,
  welcomeLandingHref,
  welcomeLiveState,
  welcomeProductHref,
  welcomeProgress,
  welcomeShareMessage,
  welcomeShippingDefault,
  welcomeStepBlocker,
  welcomeSteps,
  welcomeThemeNeedsConfirm,
  welcomeTopUpLine,
  welcomeWallet,
} from "./welcome.lib";

const STORE = "11111111-1111-4111-8111-111111111111";
const none: StoreSetupFlags = { template: false, brand: false, product: false, publish: false, shipping: false, payments: false, domain: false, seo: false, wallet: false };

describe("welcomeSteps", () => {
  it("lists product, theme and delivery price in that order (owner, 2026-11-25), done from the home's flags", () => {
    const steps = welcomeSteps({ flags: { ...none, product: true }, themesAvailable: true });
    expect(steps).toEqual([
      { key: "product", done: true },
      { key: "theme", done: false },
      { key: "shipping", done: false },
    ]);
    expect(nextWelcomeStep(steps)).toBe("theme");
  });

  it("has no theme step outside the store-builder rollout", () => {
    const steps = welcomeSteps({ flags: none, themesAvailable: false });
    expect(steps.map((step) => step.key)).toEqual(["product", "shipping"]);
    expect(nextWelcomeStep(steps)).toBe("product");
  });

  it("never counts brand or payments", () => {
    const steps = welcomeSteps({ flags: { ...none, template: true, product: true, shipping: true }, themesAvailable: true });
    expect(nextWelcomeStep(steps)).toBeNull();
    expect(welcomeProgress(steps)).toEqual({ done: 3, total: 3 });
  });
});

describe("welcomeStepBlocker (owner, 2026-11-25)", () => {
  const blockers = (flags: StoreSetupFlags, themesAvailable = true) => {
    const steps = welcomeSteps({ flags, themesAvailable });
    return Object.fromEntries(steps.map((step) => [step.key, welcomeStepBlocker(steps, step.key)]));
  };

  it("opens only the first open step: the theme waits for a product, shipping for the theme", () => {
    expect(blockers(none)).toEqual({ product: null, theme: "product", shipping: "product" });
    expect(blockers({ ...none, product: true })).toEqual({ product: null, theme: null, shipping: "theme" });
    expect(blockers({ ...none, product: true, template: true })).toEqual({ product: null, theme: null, shipping: null });
  });

  it("makes shipping wait only for the product outside the store-builder rollout", () => {
    expect(blockers(none, false)).toEqual({ product: null, shipping: "product" });
    expect(blockers({ ...none, product: true }, false)).toEqual({ product: null, shipping: null });
  });

  it("never locks a done step (a seller who chose a theme before adding a product keeps it open)", () => {
    expect(blockers({ ...none, template: true, shipping: true })).toEqual({ product: null, theme: null, shipping: null });
  });
});

describe("welcomeProgress", () => {
  it("is one counter over exactly the steps shown", () => {
    expect(welcomeProgress(welcomeSteps({ flags: none, themesAvailable: true }))).toEqual({ done: 0, total: 3 });
    expect(welcomeProgress(welcomeSteps({ flags: { ...none, product: true }, themesAvailable: true }))).toEqual({ done: 1, total: 3 });
    expect(welcomeProgress(welcomeSteps({ flags: { ...none, product: true, template: true }, themesAvailable: false }))).toEqual({ done: 1, total: 2 });
    expect(welcomeProgress(welcomeSteps({ flags: { ...none, product: true, shipping: true, brand: true, payments: true }, themesAvailable: false }))).toEqual({ done: 2, total: 2 });
  });
});

describe("welcomeArrival", () => {
  const open = welcomeSteps({ flags: none, themesAvailable: true });
  const productDone = welcomeSteps({ flags: { ...none, product: true }, themesAvailable: true });
  const themeDone = welcomeSteps({ flags: { ...none, product: true, template: true }, themesAvailable: true });
  const finished = welcomeSteps({ flags: { ...none, template: true, product: true, shipping: true }, themesAvailable: true });
  const noThemes = welcomeSteps({ flags: none, themesAvailable: false });

  it("opens the first unfinished step, or none when all are done", () => {
    expect(welcomeArrival("", open)).toEqual({ open: "product", scrollTo: null });
    expect(welcomeArrival("", productDone)).toEqual({ open: "theme", scrollTo: null });
    expect(welcomeArrival("", themeDone)).toEqual({ open: "shipping", scrollTo: null });
    expect(welcomeArrival("", finished)).toEqual({ open: "", scrollTo: null });
  });

  it("opens the step a hash names, even when done", () => {
    expect(welcomeArrival("#theme", finished)).toEqual({ open: "theme", scrollTo: "theme" });
    expect(welcomeArrival("#product", finished)).toEqual({ open: "product", scrollTo: "product" });
    expect(welcomeArrival("#shipping", themeDone)).toEqual({ open: "shipping", scrollTo: "shipping" });
  });

  it("opens the first open step instead of a step that is still locked", () => {
    expect(welcomeArrival("#shipping", open)).toEqual({ open: "product", scrollTo: "product" });
    expect(welcomeArrival("#theme", open)).toEqual({ open: "product", scrollTo: "product" });
    expect(welcomeArrival("#shipping", productDone)).toEqual({ open: "theme", scrollTo: "theme" });
  });

  it("maps the old section and step names", () => {
    expect(welcomeArrival("#industry", themeDone)).toEqual({ open: "theme", scrollTo: "theme" });
    expect(welcomeArrival("#setup", themeDone)).toEqual({ open: "theme", scrollTo: "theme" });
    expect(welcomeArrival("#delivery", themeDone)).toEqual({ open: "shipping", scrollTo: "shipping" });
  });

  it("falls back to the first unfinished step for a step the page no longer has", () => {
    expect(welcomeArrival("#brand", themeDone)).toEqual({ open: "shipping", scrollTo: null });
    expect(welcomeArrival("#payments", productDone)).toEqual({ open: "theme", scrollTo: null });
    expect(welcomeArrival("#nope", finished)).toEqual({ open: "", scrollTo: null });
    expect(welcomeArrival("#constructor", open)).toEqual({ open: "product", scrollTo: null });
    // No theme step outside the rollout: its hashes open the first unfinished step.
    expect(welcomeArrival("#theme", noThemes)).toEqual({ open: "product", scrollTo: null });
    expect(welcomeArrival("#industry", noThemes)).toEqual({ open: "product", scrollTo: null });
  });

  it("scrolls share to the live card and topUp to the top-up line", () => {
    expect(welcomeArrival("#share", finished)).toEqual({ open: "", scrollTo: "live" });
    expect(welcomeArrival("#topUp", productDone)).toEqual({ open: "theme", scrollTo: "topUp" });
  });
});

describe("welcomeHashRedirect", () => {
  it("sends #payments to the store's Settings › Payments, and nothing else", () => {
    expect(welcomeHashRedirect("#payments", STORE)).toBe(`/stores/${STORE}/settings/payments`);
    for (const hash of ["", "#brand", "#share", "#product", "#payments2"]) expect(welcomeHashRedirect(hash, STORE)).toBeNull();
  });
});

describe("welcomeThemeNeedsConfirm", () => {
  it("skips the dialog only for a never-published store with no template yet", () => {
    expect(welcomeThemeNeedsConfirm({ templateChosen: false, siteStatus: "draft" })).toBe(false);
    expect(welcomeThemeNeedsConfirm({ templateChosen: true, siteStatus: "draft" })).toBe(true);
    expect(welcomeThemeNeedsConfirm({ templateChosen: false, siteStatus: "published" })).toBe(true);
    expect(welcomeThemeNeedsConfirm({ templateChosen: false, siteStatus: "unpublished" })).toBe(true);
    expect(welcomeThemeNeedsConfirm({ templateChosen: true, siteStatus: "published" })).toBe(true);
  });
});

describe("welcomeShippingDefault", () => {
  it("offers Whole Egypt at 60 to an EGP store", () => {
    expect(welcomeShippingDefault("EGP")).toEqual({ kind: "egypt_flat", price: 60 });
  });

  it("offers the store's country with no price to a one-country currency", () => {
    expect(welcomeShippingDefault("SAR")).toEqual({ kind: "country", country: "SA", price: null });
    expect(welcomeShippingDefault("AED")).toEqual({ kind: "country", country: "AE", price: null });
  });

  it("offers no zone when the currency has no one country", () => {
    expect(welcomeShippingDefault("USD")).toEqual({ kind: "none" });
    expect(welcomeShippingDefault("EUR")).toEqual({ kind: "none" });
  });
});

describe("parseWelcomeAmount", () => {
  it("reads amounts in the store currency with up to 2 decimals", () => {
    expect(parseWelcomeAmount("60", 10_000)).toBe(60);
    expect(parseWelcomeAmount(" 12,5 ", 10_000)).toBe(12.5);
    expect(parseWelcomeAmount("0", 10_000)).toBe(0);
    expect(parseWelcomeAmount("9.99", 10_000)).toBe(9.99);
  });

  it("refuses empty, negative, too large and too precise", () => {
    expect(parseWelcomeAmount("", 10_000)).toBeNull();
    expect(parseWelcomeAmount("-1", 10_000)).toBeNull();
    expect(parseWelcomeAmount("10001", 10_000)).toBeNull();
    expect(parseWelcomeAmount("1.005", 10_000)).toBeNull();
    expect(parseWelcomeAmount("abc", 10_000)).toBeNull();
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
    expect(welcomeFinishProductHref(STORE)).toBe(`/stores/${STORE}/products/add?method=manual&from=welcome`);
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

describe("storeWelcome messages", () => {
  it("has a title, a description and a done summary for every step in both languages", () => {
    for (const messages of [ar, en]) {
      for (const key of ["theme", "product", "shipping"] as const) {
        expect(messages.storeWelcome.steps[key].title).toBeTruthy();
        expect(messages.storeWelcome.steps[key].description).toBeTruthy();
      }
      expect(messages.storeWelcome.steps.theme.doneNote).toBeTruthy();
      expect(messages.storeWelcome.steps.product.doneNote).toBeTruthy();
      expect(messages.storeWelcome.steps.shipping.zonesSummary).toBeTruthy();
      expect(messages.storeWelcome.live.title).toBeTruthy();
      expect(messages.storeWelcome.offline.link).toBeTruthy();
    }
  });

  it("has the same keys in both languages", () => {
    const keys = (value: unknown, prefix = ""): string[] =>
      value && typeof value === "object" ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`)) : [prefix];
    expect(keys(ar.storeWelcome)).toEqual(keys(en.storeWelcome));
  });
});

describe("Arabic digits in amounts", () => {
  it("reads Arabic-Indic and Eastern Arabic-Persian digits and the Arabic decimal separator", () => {
    expect(normalizeWelcomeDigits("٦٠")).toBe("60");
    expect(normalizeWelcomeDigits("۱۲٫۵")).toBe("12.5");
    expect(parseWelcomeAmount("٦٠", 10_000)).toBe(60);
    expect(parseWelcomeAmount("۱۲٫۵", 10_000)).toBe(12.5);
    expect(parseWelcomeAmount("٩٫٩٩", 10_000)).toBe(9.99);
    expect(parseWelcomeAmount("٤٥,٥", 10_000)).toBe(45.5);
  });

  it("applies the same limits as Latin digits", () => {
    expect(parseWelcomeAmount("١٢٣", 100)).toBeNull();
    expect(parseWelcomeAmount("١٫٠٠٥", 10_000)).toBeNull();
  });
});

describe("the share message", () => {
  const url = "https://ward-shop.tallaby.com";
  const tAr = createTranslator({ locale: "ar", messages: ar, namespace: "storeWelcome.live" });
  const tEn = createTranslator({ locale: "en", messages: en, namespace: "storeWelcome.live" });

  it("names the store and its link in both languages", () => {
    const arMessage = welcomeShareMessage(tAr, { storeName: " متجر ورد ", url });
    expect(arMessage).toContain("متجرنا الجديد متجر ورد");
    expect(arMessage.endsWith(url)).toBe(true);
    const enMessage = welcomeShareMessage(tEn, { storeName: "Salt & Pepper", url });
    expect(enMessage).toContain("Salt & Pepper");
    expect(enMessage.endsWith(url)).toBe(true);
  });

  it("keeps a name with braces as text, never as a placeholder", () => {
    expect(welcomeShareMessage(tEn, { storeName: "Shop {url}", url })).toContain("Shop {url}");
  });

  it("encodes Arabic, & and spaces for wa.me so the whole text stays in one parameter", () => {
    const message = welcomeShareMessage(tAr, { storeName: "ورد & شوكولاتة", url });
    const href = whatsappShare(message);
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    const query = href.slice("https://wa.me/?".length);
    expect(query).not.toMatch(/[ &]|[؀-ۿ]/);
    expect(query).toContain("%26");
    expect(new URLSearchParams(query).get("text")).toBe(message);
  });
});

describe("welcomeWallet", () => {
  const at = new Date("2026-11-20T12:00:00Z");
  const DAY = 86_400_000;
  // A seller who isn't activated: orders locked from the start (owner, 2026-11-16).
  const open = (overrides: Partial<OrderLock> = {}, grace: Partial<NonNullable<OrderLock["grace"]>> = {}): OrderLock => ({
    activated: false,
    ordersLocked: true,
    firstOrderId: null,
    pendingReview: false,
    storeOffline: false,
    grace: {
      endsAt: new Date(at.getTime() + 3 * DAY).toISOString(),
      firstOrderReceived: false,
      endedBy: null,
      offlineAt: new Date(at.getTime() + 3 * DAY).toISOString(),
      ...grace,
    },
    ...overrides,
  });

  it("shows nothing before the USD switch", () => {
    expect(welcomeWallet({ lock: ORDERS_UNLOCKED, usdLive: false, isPro: false, at })).toEqual({ fee: false, status: { kind: "none" } });
    expect(welcomeWallet({ lock: open(), usdLive: false, isPro: false, at }).fee).toBe(false);
  });

  it("shows the fee on Free and hides it on active Pro", () => {
    expect(welcomeWallet({ lock: open(), usdLive: true, isPro: false, at }).fee).toBe(true);
    expect(welcomeWallet({ lock: ORDERS_UNLOCKED, usdLive: true, isPro: true, at })).toEqual({ fee: false, status: { kind: "activated" } });
  });

  it("counts down for every seller who isn't activated, 14-day ones included (owner, 2026-11-17)", () => {
    expect(welcomeWallet({ lock: open(), usdLive: true, isPro: false, at }).status).toEqual({ kind: "offlineIn", days: 3 });
    const in14 = new Date(at.getTime() + 14 * DAY).toISOString();
    expect(welcomeWallet({ lock: open({}, { offlineAt: in14 }), usdLive: true, isPro: false, at }).status).toEqual({ kind: "offlineIn", days: 14 });
  });

  it("counts the days until the store goes offline, even after the second order", () => {
    const offlineAt = new Date(at.getTime() + 2 * DAY - 1).toISOString();
    expect(welcomeWallet({ lock: open({}, { offlineAt }), usdLive: true, isPro: false, at }).status).toEqual({ kind: "offlineIn", days: 2 });
    expect(
      welcomeWallet({ lock: open({ ordersLocked: true }, { offlineAt, endedBy: "second_order" }), usdLive: true, isPro: false, at }).status,
    ).toEqual({ kind: "offlineIn", days: 2 });
  });

  it("says offline, in review, locked or activated from the lock", () => {
    const past = new Date(at.getTime() - DAY).toISOString();
    expect(
      welcomeWallet({ lock: open({ storeOffline: true, ordersLocked: true }, { endedBy: "days", offlineAt: past }), usdLive: true, isPro: false, at }).status,
    ).toEqual({ kind: "offlineNow" });
    expect(welcomeWallet({ lock: open({ pendingReview: true }), usdLive: true, isPro: false, at }).status).toEqual({ kind: "review" });
    expect(welcomeWallet({ lock: open({ ordersLocked: true }, { endedBy: "days", offlineAt: past }), usdLive: true, isPro: false, at }).status).toEqual({ kind: "locked" });
    expect(welcomeWallet({ lock: ORDERS_UNLOCKED, usdLive: true, isPro: false, at }).status).toEqual({ kind: "activated" });
  });

  it("has every status line in both languages, with the Arabic plural forms", () => {
    for (const messages of [ar, en]) {
      for (const kind of ["review", "offlineNow", "offlineIn", "locked"] as const) {
        expect(messages.storeWelcome.topUp.status[kind]).toBeTruthy();
      }
    }
    const t = createTranslator({ locale: "ar", messages: ar, namespace: "storeWelcome.topUp.status" });
    expect(t("offlineIn", { days: 1 })).toContain("يوم واحد");
    expect(t("offlineIn", { days: 2 })).toContain("يومين");
    expect(t("offlineIn", { days: 5 })).toContain("5 أيام");
    expect(t("offlineIn", { days: 11 })).toContain("11 يومًا");
    expect(t("offlineIn", { days: 100 })).toContain("100 يوم");
  });
});

describe("welcomeTopUpLine", () => {
  it("shows nothing to an activated seller or before the USD switch", () => {
    expect(welcomeTopUpLine({ kind: "activated" })).toBeNull();
    expect(welcomeTopUpLine({ kind: "none" })).toBeNull();
  });

  it("links the button to the wallet top-up, with the go-online notice for an offline store", () => {
    expect(welcomeTopUpLine({ kind: "offlineIn", days: 3 })).toEqual({ kind: "offlineIn", days: 3, href: "/wallet?topup=1" });
    expect(welcomeTopUpLine({ kind: "locked" })).toEqual({ kind: "locked", href: "/wallet?topup=1" });
    expect(welcomeTopUpLine({ kind: "offlineNow" })).toEqual({ kind: "offlineNow", href: TOP_UP_TO_GO_ONLINE_HREF });
  });

  it("has no button while a top-up is in review", () => {
    expect(welcomeTopUpLine({ kind: "review" })).toEqual({ kind: "review", href: null });
  });
});

describe("welcomeLiveState", () => {
  const activated = { kind: "activated" } as const;

  it("shows the live card once the store is published", () => {
    expect(welcomeLiveState({ flags: { ...none, template: true, product: true, publish: true }, themesAvailable: true, wallet: activated })).toBe("live");
    expect(welcomeLiveState({ flags: { ...none, publish: true }, themesAvailable: true, wallet: { kind: "offlineIn", days: 2 } })).toBe("live");
    expect(welcomeLiveState({ flags: { ...none, publish: true }, themesAvailable: true, wallet: { kind: "review" } })).toBe("live");
  });

  it("never says live while billing holds the store offline", () => {
    expect(welcomeLiveState({ flags: { ...none, template: true, product: true, publish: true }, themesAvailable: true, wallet: { kind: "offlineNow" } })).toBe("none");
    expect(welcomeLiveState({ flags: { ...none, template: true, product: true }, themesAvailable: true, wallet: { kind: "offlineNow" } })).toBe("none");
  });

  it("points to the Website page when theme and product are done but the store is offline", () => {
    expect(welcomeLiveState({ flags: { ...none, template: true, product: true }, themesAvailable: true, wallet: activated })).toBe("offline");
    expect(welcomeLiveState({ flags: { ...none, product: true }, themesAvailable: false, wallet: activated })).toBe("offline");
  });

  it("shows nothing while a step that makes the store live is still open", () => {
    expect(welcomeLiveState({ flags: none, themesAvailable: true, wallet: activated })).toBe("none");
    expect(welcomeLiveState({ flags: { ...none, product: true }, themesAvailable: true, wallet: activated })).toBe("none");
    expect(welcomeLiveState({ flags: { ...none, template: true }, themesAvailable: true, wallet: activated })).toBe("none");
  });
});
