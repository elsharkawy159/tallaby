import { describe, expect, it } from "vitest";
import { appIconVersion, appInitials, appShortName, parseStoreApp } from "./store-app.lib";

describe("parseStoreApp", () => {
  it("shows the download button by default", () => {
    expect(parseStoreApp(null)).toEqual({ showDownloadButton: true });
    expect(parseStoreApp({ app: "x" })).toEqual({ showDownloadButton: true });
    expect(parseStoreApp({ app: { showDownloadButton: "no" } })).toEqual({ showDownloadButton: true });
  });

  it("reads a seller's choice", () => {
    expect(parseStoreApp({ app: { showDownloadButton: false } })).toEqual({ showDownloadButton: false });
  });
});

describe("app name helpers", () => {
  it("keeps short names and cuts long ones on a word", () => {
    expect(appShortName("Sara")).toBe("Sara");
    expect(appShortName("Sara Home Store Cairo")).toBe("Sara Home");
    expect(appShortName("Supercalifragilistic")).toBe("Supercalifra");
    expect(appShortName("   ")).toBe("Store");
  });

  it("makes initials in Arabic and English", () => {
    expect(appInitials("sara home")).toBe("SH");
    expect(appInitials("متجر سارة")).toBe("مس");
    expect(appInitials("x")).toBe("X");
    expect(appInitials("")).toBe("?");
  });

  it("versions icons by image and name", () => {
    const a = appIconVersion("logos/a.png", "Sara");
    expect(a).toMatch(/^[0-9a-z]+$/);
    expect(appIconVersion("logos/a.png", "Sara")).toBe(a);
    expect(appIconVersion("logos/b.png", "Sara")).not.toBe(a);
    expect(appIconVersion(null, "Sara2")).not.toBe(appIconVersion(null, "Sara"));
  });
});
