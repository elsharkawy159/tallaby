import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { ORDERS_UNLOCKED, type OrderLock } from "@workspace/lib/billing/order-grace";
import type { StoreSetupFlags } from "@workspace/lib/sellers";
import { whatsappShare } from "@/app/[locale]/(builder)/ai-builder/_components/workspace.lib";
import ar from "../../../../../../messages/ar.json";
import en from "../../../../../../messages/en.json";
import { addProductReturnHref } from "../products/add/add-method.lib";
import {
  initialWelcomeSection,
  nextWelcomeStep,
  normalizeWelcomeDigits,
  parseWelcomeAmount,
  storeWelcomeHref,
  welcomeLandingHref,
  welcomeDeliverySteps,
  welcomeFinishProductHref,
  welcomeProductHref,
  welcomeProgress,
  welcomeReady,
  welcomeSetupSteps,
  welcomeShareMessage,
  welcomeShippingDefault,
  welcomeWallet,
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

  it("opens shipping and payments once the main setup is done, or when its hash is named", () => {
    const deliveryOpen = welcomeDeliverySteps(none);
    const deliveryDone = welcomeDeliverySteps({ ...none, shipping: true, payments: true });
    expect(initialWelcomeSection("", open, deliveryOpen)).toBe("setup");
    expect(initialWelcomeSection("", finished, deliveryOpen)).toBe("delivery");
    expect(initialWelcomeSection("", finished, deliveryDone)).toBe("");
    expect(initialWelcomeSection("#payments", open, deliveryDone)).toBe("delivery");
    expect(initialWelcomeSection("#shipping", finished, deliveryDone)).toBe("delivery");
    expect(initialWelcomeSection("#delivery", open, deliveryOpen)).toBe("delivery");
  });
});

describe("welcomeDeliverySteps", () => {
  it("is done from the home's shipping and payments flags", () => {
    expect(welcomeDeliverySteps({ ...none, payments: true })).toEqual([
      { key: "shipping", done: false },
      { key: "payments", done: true },
    ]);
  });

  it("reaches 4 of 4 with the main setup", () => {
    expect(welcomeProgress({ ...none, template: true, brand: true, product: true, shipping: true, payments: true })).toEqual({ done: 4, total: 4 });
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

  it("refuses empty, negative, too large, too precise and (when positive) zero", () => {
    expect(parseWelcomeAmount("", 10_000)).toBeNull();
    expect(parseWelcomeAmount("-1", 10_000)).toBeNull();
    expect(parseWelcomeAmount("10001", 10_000)).toBeNull();
    expect(parseWelcomeAmount("1.005", 10_000)).toBeNull();
    expect(parseWelcomeAmount("abc", 10_000)).toBeNull();
    expect(parseWelcomeAmount("0", 1_000_000, true)).toBeNull();
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
      for (const key of ["shipping", "payments"] as const) {
        expect(messages.storeWelcome.steps[key].title).toBeTruthy();
        expect(messages.storeWelcome.steps[key].description).toBeTruthy();
      }
      expect(messages.storeWelcome.delivery.title).toBeTruthy();
    }
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
    expect(parseWelcomeAmount("٠", 1_000_000, true)).toBeNull();
  });
});

describe("the share message", () => {
  const url = "https://ward-shop.tallaby.com";
  const tAr = createTranslator({ locale: "ar", messages: ar, namespace: "storeWelcome.share" });
  const tEn = createTranslator({ locale: "en", messages: en, namespace: "storeWelcome.share" });

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
      for (const kind of ["activated", "review", "offlineNow", "offlineIn", "locked"] as const) {
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

describe("welcomeReady", () => {
  it("is ready only when the four progress steps are done", () => {
    expect(welcomeReady(none)).toBe(false);
    expect(welcomeReady({ ...none, template: true, brand: true, product: true, shipping: true })).toBe(false);
    expect(welcomeReady({ ...none, template: true, brand: true, product: true, shipping: true, payments: true })).toBe(true);
  });
});

describe("share and top-up deep links", () => {
  it("open their sections", () => {
    const finished = welcomeSetupSteps({ flags: { ...none, template: true, brand: true, product: true }, hasIndustry: true, themesAvailable: true });
    expect(initialWelcomeSection("#share", finished)).toBe("share");
    expect(initialWelcomeSection("#topUp", finished)).toBe("topUp");
  });
});
