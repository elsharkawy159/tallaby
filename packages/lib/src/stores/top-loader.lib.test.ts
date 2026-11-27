import { describe, expect, it } from "vitest";
import { TOP_LOADER_DEFAULTS, normalizeTopLoaderInput, parseStoreTopLoader, topLoaderCss } from "./top-loader.lib";

describe("parseStoreTopLoader", () => {
  it("is on with the brand colour when nothing is saved", () => {
    for (const settings of [null, undefined, {}, { other: 1 }, { topLoader: null }, { topLoader: [] }, { topLoader: "off" }]) {
      expect(parseStoreTopLoader(settings)).toEqual({ enabled: true, color: null });
    }
    expect(TOP_LOADER_DEFAULTS).toEqual({ enabled: true, color: null });
  });

  it("turns off only on an explicit false", () => {
    expect(parseStoreTopLoader({ topLoader: { enabled: false } }).enabled).toBe(false);
    expect(parseStoreTopLoader({ topLoader: { enabled: "false" } }).enabled).toBe(true);
    expect(parseStoreTopLoader({ topLoader: { enabled: 0 } }).enabled).toBe(true);
    expect(parseStoreTopLoader({ topLoader: {} }).enabled).toBe(true);
  });

  it("keeps only a #rrggbb colour, in lowercase", () => {
    expect(parseStoreTopLoader({ topLoader: { color: "#FF8800" } }).color).toBe("#ff8800");
    expect(parseStoreTopLoader({ topLoader: { color: " #a1b2c3 " } }).color).toBe("#a1b2c3");
    for (const color of ["#fff", "red", "ff8800", "#ff88001", "#gg0000", "url(x)", "#ff8800;}</style>", 12, null]) {
      expect(parseStoreTopLoader({ topLoader: { color } }).color).toBeNull();
    }
  });
});

describe("normalizeTopLoaderInput", () => {
  it("cleans a save the same way", () => {
    expect(normalizeTopLoaderInput({ enabled: false, color: "#ABCDEF", extra: "x" })).toEqual({ enabled: false, color: "#abcdef" });
    expect(normalizeTopLoaderInput("nope")).toEqual({ enabled: true, color: null });
    expect(normalizeTopLoaderInput({ enabled: true, color: "javascript:alert(1)" })).toEqual({ enabled: true, color: null });
  });
});

describe("topLoaderCss", () => {
  it("adds nothing for the default, a colour for a custom one, and hides the bar when off", () => {
    expect(topLoaderCss({ enabled: true, color: null })).toBeNull();
    expect(topLoaderCss({ enabled: true, color: "#ff8800" })).toBe("body { --sf-loader: #ff8800; }");
    expect(topLoaderCss({ enabled: false, color: "#ff8800" })).toBe("#nprogress { display: none !important; }");
    // A value that skipped the parser is still never written into the CSS.
    expect(topLoaderCss({ enabled: true, color: "red;}</style>" })).toBeNull();
  });
});
