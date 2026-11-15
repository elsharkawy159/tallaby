import { describe, expect, it } from "vitest";
import { appCanRemove, appEntry, appPrimaryAction, appState, type AppCenterStoreState } from "./app-center.lib";

const EMPTY: AppCenterStoreState = { integrations: [], installs: [], requests: [], googleSheetsEnabled: true, usdLive: true };

const entry = (id: string) => appEntry(id)!;
const stateOf = (id: string, store: Partial<AppCenterStoreState> = {}) => appState(entry(id).app, { ...EMPTY, ...store });
const actionOf = (id: string, store: Partial<AppCenterStoreState> = {}) => appPrimaryAction(entry(id).manifest, stateOf(id, store));

describe("App Center state (F-93)", () => {
  it("treats built-in apps as installed", () => {
    expect(stateOf("ai_assistants")).toMatchObject({ installed: true, badge: "installed" });
    expect(stateOf("product_feeds")).toMatchObject({ installed: true, badge: "installed" });
    expect(actionOf("ai_assistants")).toBe("settings");
  });

  it("shows a connected integration as installed, and an error first", () => {
    expect(stateOf("bosta", { integrations: [{ provider: "bosta", status: "connected" }] })).toMatchObject({ installed: true, connected: true, badge: "connected" });
    expect(stateOf("bosta", { integrations: [{ provider: "bosta", status: "error" }] }).badge).toBe("error");
    expect(stateOf("bosta").badge).toBe("available");
    expect(actionOf("bosta")).toBe("settings");
  });

  it("never mixes up another app's row", () => {
    expect(stateOf("kashier", { integrations: [{ provider: "paymob", status: "connected" }] }).connected).toBe(false);
  });

  it("installs toggle apps through the engine, then opens their settings", () => {
    expect(actionOf("size_chart")).toBe("install");
    const installed = { installs: [{ appKey: "size_chart", cancelAtPeriodEnd: false }] };
    expect(actionOf("size_chart", installed)).toBe("settings");
    expect(appCanRemove(entry("size_chart").manifest, stateOf("size_chart", installed))).toBe(true);
    // Order notifications has nothing to set: once bought, the main button removes it.
    expect(actionOf("customer_notifications", { installs: [{ appKey: "customer_notifications", cancelAtPeriodEnd: false }] })).toBe("remove");
    // Removed but paid until the period ends: it can be kept again.
    expect(actionOf("customer_notifications", { installs: [{ appKey: "customer_notifications", cancelAtPeriodEnd: true }] })).toBe("install");
  });

  it("locks a paid app before the USD switch, unless it is already bought", () => {
    expect(stateOf("customer_notifications", { usdLive: false })).toMatchObject({ paidLocked: true, badge: "paid_locked" });
    expect(actionOf("customer_notifications", { usdLive: false })).toBe("none");
    expect(stateOf("customer_notifications", { usdLive: false, installs: [{ appKey: "customer_notifications", cancelAtPeriodEnd: false }] }).paidLocked).toBe(false);
  });

  it("offers a request for requestable apps, once", () => {
    expect(actionOf("sms")).toBe("request");
    expect(actionOf("sms", { requests: [{ appKey: "sms", status: "requested" }] })).toBe("requested");
    expect(stateOf("sms", { requests: [{ appKey: "sms", status: "enabled" }] }).badge).toBe("enabled");
  });

  it("shows coming-soon apps with no action", () => {
    expect(stateOf("mylerz").badge).toBe("coming_soon");
    expect(actionOf("mylerz")).toBe("none");
    expect(actionOf("tiktok_pixel")).toBe("none");
  });

  it("hides Google Sheets when its OAuth env is missing", () => {
    expect(stateOf("google_sheets", { googleSheetsEnabled: false })).toMatchObject({ available: false, badge: "coming_soon" });
  });
});
