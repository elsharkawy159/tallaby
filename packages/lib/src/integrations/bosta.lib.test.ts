import { describe, expect, it } from "vitest";
import {
  bostaKeyHint,
  bostaTrackingUrl,
  DEFAULT_BOSTA_SETTINGS,
  readBostaSettings,
  validateBostaKeyInput,
  validateBostaSettingsInput,
} from "./bosta.lib";
import { readPublicDetails } from "./validate";

describe("readBostaSettings", () => {
  it("defaults to manual shipping, small parcels, closed packages", () => {
    expect(readBostaSettings(null)).toEqual(DEFAULT_BOSTA_SETTINGS);
    expect(readBostaSettings({})).toMatchObject({ autoShip: "manual", size: "SMALL", allowToOpenPackage: false, canCancel: false });
  });

  it("keeps valid values and drops invalid ones", () => {
    expect(
      readBostaSettings({
        pickupLocationId: "loc1",
        pickupLocationName: "Warehouse",
        autoShip: "on_confirm",
        size: "LARGE",
        allowToOpenPackage: true,
        note: "Fragile",
        keyHint: "abcd",
        canCancel: true,
      }),
    ).toEqual({
      pickupLocationId: "loc1",
      pickupLocationName: "Warehouse",
      autoShip: "on_confirm",
      size: "LARGE",
      allowToOpenPackage: true,
      note: "Fragile",
      keyHint: "abcd",
      canCancel: true,
    });
    expect(readBostaSettings({ autoShip: "on_create", size: "HUGE", allowToOpenPackage: "yes", keyHint: "toolong" })).toMatchObject({
      autoShip: "manual",
      size: "SMALL",
      allowToOpenPackage: false,
      keyHint: null,
    });
  });
});

describe("validateBostaKeyInput", () => {
  it("trims a pasted key and treats an empty one as keep-the-saved-key", () => {
    expect(validateBostaKeyInput("  0123456789abcdef0123  ")).toEqual({ success: true, apiKey: "0123456789abcdef0123" });
    expect(validateBostaKeyInput("")).toEqual({ success: true, apiKey: "" });
    expect(validateBostaKeyInput(undefined)).toEqual({ success: true, apiKey: "" });
  });

  it("rejects short keys, spaces inside and non-strings", () => {
    expect(validateBostaKeyInput("short")).toEqual({ success: false, error: "invalid_key" });
    expect(validateBostaKeyInput("0123456789 abcdef0123")).toEqual({ success: false, error: "invalid_key" });
    expect(validateBostaKeyInput(42)).toEqual({ success: false, error: "invalid_key" });
  });

  it("shows only the last 4 characters", () => {
    expect(bostaKeyHint("0123456789abcdef0123")).toBe("0123");
  });
});

describe("validateBostaSettingsInput", () => {
  it("accepts a partial update", () => {
    expect(validateBostaSettingsInput({ autoShip: "on_confirm" })).toEqual({ success: true, data: { autoShip: "on_confirm" } });
  });

  it("rejects unknown keys (the key hint is set by the server only) and bad values", () => {
    expect(validateBostaSettingsInput({ keyHint: "1234" })).toEqual({ success: false, error: "invalid_settings" });
    expect(validateBostaSettingsInput({ autoShip: "on_create" })).toEqual({ success: false, error: "invalid_settings" });
    expect(validateBostaSettingsInput({ note: "x".repeat(201) })).toEqual({ success: false, error: "invalid_settings" });
    expect(validateBostaSettingsInput(null)).toEqual({ success: false, error: "invalid_settings" });
  });
});

describe("public details", () => {
  it("expose the key hint, pickup location and auto-ship mode only", () => {
    expect(
      readPublicDetails("bosta", { keyHint: "abcd", pickupLocationName: "Home", autoShip: "manual", pickupLocationId: "x", note: "n" }),
    ).toEqual({ keyHint: "abcd", pickupLocationName: "Home", autoShip: "manual" });
  });
});

it("links to Bosta's tracking page", () => {
  expect(bostaTrackingUrl("123 45")).toBe("https://bosta.co/tracking-shipments?shipment-number=123%2045");
});
