import { describe, expect, it } from "vitest";
import { appStartKind, appStartSteps } from "./app-start.lib";

const free = { model: "free" } as const;
const on = { available: true, requestable: false };

describe("appStartKind", () => {
  it("names each kind of app", () => {
    expect(appStartKind({ installMode: "builtin", settingsRoute: "feature_page", pricing: free }, on)).toBe("feature");
    expect(appStartKind({ installMode: "builtin", settingsRoute: "price_rounding", pricing: free }, on)).toBe("builtin");
    expect(appStartKind({ installMode: "toggle", settingsRoute: null, pricing: free }, on)).toBe("install");
    expect(appStartKind({ installMode: "toggle", settingsRoute: null, pricing: { model: "monthly", usdCents: 100 } }, on)).toBe("installPaid");
    expect(appStartKind({ installMode: "connect", settingsRoute: "identifier", pricing: free }, on)).toBe("connect");
    expect(appStartKind({ installMode: "request", settingsRoute: null, pricing: free }, { available: false, requestable: true })).toBe("request");
    expect(appStartKind({ installMode: "toggle", settingsRoute: "whatsapp", pricing: free }, { available: false, requestable: false })).toBe("soon");
  });
});

describe("appStartSteps", () => {
  it("drops the settings step only for a built-in app with nothing to set", () => {
    expect(appStartSteps("builtin", false)).toEqual(["included", "thisStore"]);
    expect(appStartSteps("builtin", true)).toEqual(["included", "settings", "thisStore"]);
    expect(appStartSteps("install", false)).toEqual(["press", "settings", "remove"]);
  });
});
